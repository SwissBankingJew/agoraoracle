# Agora Oracle - VPS Deployment Guide

## Overview
This guide covers deploying the Agora Oracle landing page to a VPS with:
- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React (built static files)
- **Web Server**: Nginx
- **Process Manager**: systemd (backend), Nginx (frontend)
- **SSL**: Let's Encrypt (Certbot)

---

## Prerequisites

### VPS Requirements
- Ubuntu 20.04+ or Debian 11+
- Minimum 2GB RAM
- 20GB storage
- Root or sudo access
- Domain name pointed to VPS IP

### Required Software
```bash
sudo apt update
sudo apt install -y \
  python3.11 \
  python3.11-venv \
  python3-pip \
  postgresql \
  postgresql-contrib \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  curl
```

### Install Node.js (for frontend build)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## Part 1: Database Setup

### 1.1 Create PostgreSQL Database & User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE agoraoracle;
CREATE USER agoraoracle_user WITH PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE agoraoracle TO agoraoracle_user;

# Grant schema permissions
\c agoraoracle
GRANT ALL ON SCHEMA public TO agoraoracle_user;

\q
```

### 1.2 Configure PostgreSQL for Security

Edit `/etc/postgresql/14/main/pg_hba.conf`:
```
# Add this line (replace with your app user):
local   agoraoracle     agoraoracle_user                md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

### 1.3 Test Database Connection
```bash
psql -U agoraoracle_user -d agoraoracle -h localhost
```

---

## Part 2: Backend Deployment

### 2.1 Clone Repository

```bash
# Create application directory
sudo mkdir -p /var/www/agoraoracle
sudo chown $USER:$USER /var/www/agoraoracle

# Clone repository
cd /var/www/agoraoracle
git clone https://github.com/YOUR_USERNAME/agoraoracle.git .
```

### 2.2 Set Up Backend Environment

```bash
cd /var/www/agoraoracle/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install uv (if using)
pip install uv

# Install dependencies
uv pip install -r requirements.txt
# OR if using pip directly:
pip install -r requirements.txt
```

### 2.3 Create Production Environment File

Create `/var/www/agoraoracle/backend/.env`:
```bash
# Database
DATABASE_URL=postgresql+asyncpg://agoraoracle_user:STRONG_PASSWORD_HERE@localhost:5432/agoraoracle

# CORS - Add your production domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Environment
ENVIRONMENT=production
```

**Security Note**: Set proper permissions:
```bash
chmod 600 /var/www/agoraoracle/backend/.env
```

### 2.4 Initialize Database Tables

```bash
cd /var/www/agoraoracle/backend
source venv/bin/activate

# Run a test to create tables
python -c "
import asyncio
from app.db import init_db
asyncio.run(init_db())
print('Database initialized successfully')
"
```

### 2.5 Create systemd Service

Create `/etc/systemd/system/agoraoracle-api.service`:
```ini
[Unit]
Description=Agora Oracle FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/agoraoracle/backend
Environment="PATH=/var/www/agoraoracle/backend/venv/bin"
EnvironmentFile=/var/www/agoraoracle/backend/.env
ExecStart=/var/www/agoraoracle/backend/venv/bin/uvicorn app.main:app \
  --host 127.0.0.1 \
  --port 8000 \
  --workers 4 \
  --log-level info
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2.6 Set Permissions & Start Service

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/agoraoracle

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable agoraoracle-api
sudo systemctl start agoraoracle-api

# Check status
sudo systemctl status agoraoracle-api

# View logs
sudo journalctl -u agoraoracle-api -f
```

---

## Part 3: Frontend Deployment

### 3.1 Build Frontend

```bash
cd /var/www/agoraoracle/frontend

# Install dependencies
npm ci --production=false

# Create production .env file
cat > .env.production << EOF
VITE_API_URL=https://api.yourdomain.com
EOF

# Build for production
npm run build

# Build output will be in: dist/
```

### 3.2 Copy Build to Nginx Directory

```bash
# Create directory for static files
sudo mkdir -p /var/www/agoraoracle/public

# Copy built files
sudo cp -r dist/* /var/www/agoraoracle/public/

# Set permissions
sudo chown -R www-data:www-data /var/www/agoraoracle/public
```

---

## Part 4: Nginx Configuration

### 4.1 Main Site Configuration

Create `/etc/nginx/sites-available/agoraoracle`:

```nginx
# Frontend (main site)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/agoraoracle/public;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}

# Alternative: Separate API subdomain (recommended for production)
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.2 Enable Site & Test Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/agoraoracle /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Part 5: SSL/TLS Setup (Let's Encrypt)

### 5.1 Obtain SSL Certificate

```bash
# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# If using API subdomain
sudo certbot --nginx -d api.yourdomain.com

# Follow prompts:
# - Enter email for renewal notifications
# - Agree to ToS
# - Choose to redirect HTTP to HTTPS (option 2)
```

### 5.2 Auto-Renewal

Certbot automatically sets up renewal. Test it:
```bash
sudo certbot renew --dry-run
```

### 5.3 Verify HTTPS

Visit `https://yourdomain.com` and check:
- Green padlock in browser
- Certificate is valid
- HTTP redirects to HTTPS

---

## Part 6: Firewall Configuration

### 6.1 Configure UFW

```bash
# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 6.2 Rate Limiting (Optional)

Add to Nginx config to prevent API abuse:
```nginx
# Add to http block in /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Then in your location /api block:
location /api {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of proxy config
}
```

---

## Part 7: Monitoring & Logging

### 7.1 Log Locations

```bash
# Backend logs
sudo journalctl -u agoraoracle-api -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 7.2 Set Up Log Rotation

Create `/etc/logrotate.d/agoraoracle`:
```
/var/log/nginx/agoraoracle*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null
    endscript
}
```

### 7.3 Basic Monitoring Script

Create `/usr/local/bin/check-agoraoracle.sh`:
```bash
#!/bin/bash

# Check if backend is running
if ! systemctl is-active --quiet agoraoracle-api; then
    echo "Backend is down! Restarting..."
    systemctl restart agoraoracle-api
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is down! Restarting..."
    systemctl restart nginx
fi

# Check API health endpoint
if ! curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "API health check failed!"
fi
```

Make executable and add to cron:
```bash
sudo chmod +x /usr/local/bin/check-agoraoracle.sh

# Add to crontab (run every 5 minutes)
sudo crontab -e
# Add line:
*/5 * * * * /usr/local/bin/check-agoraoracle.sh >> /var/log/agoraoracle-monitor.log 2>&1
```

---

## Part 8: Backup Strategy

### 8.1 Database Backup Script

Create `/usr/local/bin/backup-agoraoracle-db.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/var/backups/agoraoracle"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="agoraoracle"
DB_USER="agoraoracle_user"

mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD="STRONG_PASSWORD_HERE" pg_dump \
  -U $DB_USER \
  -h localhost \
  -F c \
  -f "$BACKUP_DIR/agoraoracle_$DATE.backup" \
  $DB_NAME

# Keep only last 7 days of backups
find $BACKUP_DIR -name "agoraoracle_*.backup" -mtime +7 -delete

echo "Backup completed: agoraoracle_$DATE.backup"
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/backup-agoraoracle-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add line:
0 2 * * * /usr/local/bin/backup-agoraoracle-db.sh >> /var/log/agoraoracle-backup.log 2>&1
```

### 8.2 Restore from Backup

```bash
PGPASSWORD="STRONG_PASSWORD_HERE" pg_restore \
  -U agoraoracle_user \
  -h localhost \
  -d agoraoracle \
  -c \
  /var/backups/agoraoracle/agoraoracle_YYYYMMDD_HHMMSS.backup
```

---

## Part 9: Deployment Updates (CI/CD)

### 9.1 Manual Deployment Script

Create `/var/www/agoraoracle/deploy.sh`:
```bash
#!/bin/bash

set -e  # Exit on error

echo "🚀 Deploying Agora Oracle..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backend deployment
echo "🔧 Updating backend..."
cd /var/www/agoraoracle/backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart agoraoracle-api

# Frontend deployment
echo "🎨 Building frontend..."
cd /var/www/agoraoracle/frontend
npm ci --production=false
npm run build
sudo rm -rf /var/www/agoraoracle/public/*
sudo cp -r dist/* /var/www/agoraoracle/public/
sudo chown -R www-data:www-data /var/www/agoraoracle/public

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🔍 Checking services..."
sudo systemctl status agoraoracle-api --no-pager
sudo systemctl status nginx --no-pager
```

Make executable:
```bash
chmod +x /var/www/agoraoracle/deploy.sh
```

### 9.2 GitHub Actions Workflow (Optional)

Create `.github/workflows/deploy.yml` in your repository:
```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Deploy to VPS
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.VPS_HOST }}
        username: ${{ secrets.VPS_USERNAME }}
        key: ${{ secrets.VPS_SSH_KEY }}
        script: |
          cd /var/www/agoraoracle
          ./deploy.sh
```

Add secrets in GitHub repository settings:
- `VPS_HOST`: Your VPS IP or domain
- `VPS_USERNAME`: SSH username
- `VPS_SSH_KEY`: Private SSH key for authentication

---

## Part 10: Security Checklist

- [ ] PostgreSQL password is strong and unique
- [ ] `.env` file has proper permissions (600)
- [ ] Firewall is enabled (UFW)
- [ ] SSH key authentication is set up (disable password auth)
- [ ] SSL certificate is installed and auto-renewing
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled on API endpoints
- [ ] Database backups are automated
- [ ] Monitoring is in place
- [ ] Log rotation is configured
- [ ] Security headers are set in Nginx
- [ ] All default passwords are changed
- [ ] Non-root user is used for application
- [ ] Regular `apt update && apt upgrade` scheduled

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u agoraoracle-api -n 50

# Check if port 8000 is already in use
sudo netstat -tulpn | grep 8000

# Check database connection
psql -U agoraoracle_user -d agoraoracle -h localhost
```

### Frontend shows API errors
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test API endpoint directly
curl http://localhost:8000/health

# Check CORS configuration in backend .env
```

### SSL certificate issues
```bash
# Renew certificates manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

### Database connection errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf settings
sudo cat /etc/postgresql/14/main/pg_hba.conf | grep agoraoracle

# Test connection
psql -U agoraoracle_user -d agoraoracle -h localhost
```

---

## Performance Optimization

### Enable HTTP/2 in Nginx

Add to server block:
```nginx
listen 443 ssl http2;
listen [::]:443 ssl http2;
```

### Database Connection Pooling

Already handled by SQLAlchemy in the backend. Monitor with:
```bash
# Check active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='agoraoracle';"
```

### Nginx Caching (Optional)

Add to Nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m use_temp_path=off;

location /api/waitlist/stats {
    proxy_cache api_cache;
    proxy_cache_valid 200 30s;
    proxy_pass http://127.0.0.1:8000;
}
```

---

## Contact & Support

For issues with this deployment:
1. Check logs first (see Troubleshooting section)
2. Verify all services are running: `sudo systemctl status agoraoracle-api nginx postgresql`
3. Test API health: `curl http://localhost:8000/health`
4. Check firewall: `sudo ufw status`

---

**Deployment Checklist:**
- [ ] Prerequisites installed
- [ ] PostgreSQL database created
- [ ] Backend deployed with systemd service
- [ ] Frontend built and copied to public directory
- [ ] Nginx configured and running
- [ ] SSL certificates obtained
- [ ] Firewall configured
- [ ] Monitoring set up
- [ ] Backups automated
- [ ] Deployment tested end-to-end
