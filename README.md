# Agora Oracle

A modern full-stack web application with FastAPI backend, SQLModel + PostgreSQL database, and React + TypeScript frontend.

## Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLModel + PostgreSQL
- **Package Manager**: uv
- **Server**: Uvicorn

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios

## Project Structure

```
.
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI entry point
│   │   ├── api/            # API routes
│   │   ├── models/         # SQLModel database models
│   │   ├── db/             # Database configuration
│   │   └── schemas/        # Request/response schemas
│   ├── pyproject.toml      # Python dependencies (uv)
│   └── .env.example        # Backend env vars template
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (API client)
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── vite.config.ts      # Vite configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── package.json        # Node dependencies
├── docker-compose.yml      # PostgreSQL setup
└── .env.example            # Docker env vars template
```

## Setup

### Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+
- **Docker** & **Docker Compose** (for PostgreSQL)

### 1. Environment Setup

Copy the example env files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Update `.env` with your PostgreSQL credentials (or use defaults for development):
```env
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=appdb
```

Update `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5433/appdb
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ENVIRONMENT=development
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

Verify it's running:
```bash
docker-compose ps
```

### 3. Backend Setup

```bash
cd backend

# Install Python dependencies
uv sync

# Run the development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

API docs: `http://localhost:8000/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install Node dependencies (if not already done)
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development

### Making API Requests from Frontend

The frontend is configured with a Vite proxy that forwards `/api` requests to the backend at `http://localhost:8000`.

Example using the `useUsers` hook:

```typescript
import { useUsers, useCreateUser } from './hooks/useUsers'

function MyComponent() {
  const { data: users, isLoading } = useUsers()
  const createUser = useCreateUser()

  const handleCreate = () => {
    createUser.mutate({
      email: 'user@example.com',
      full_name: 'John Doe'
    })
  }

  return (
    // ...
  )
}
```

### Adding New API Endpoints

1. **Create a model** in `backend/app/models/`:
```python
from sqlmodel import SQLModel, Field
from typing import Optional

class Item(SQLModel, table=True):
    __tablename__ = "items"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
```

2. **Create a router** in `backend/app/api/`:
```python
from fastapi import APIRouter
from sqlmodel import Session, select

router = APIRouter(prefix="/items", tags=["items"])

@router.get("/")
async def list_items(session: Session = Depends(get_session)):
    result = await session.execute(select(Item))
    return result.scalars().all()
```

3. **Include the router** in `backend/app/main.py`:
```python
from app.api import items
app.include_router(items.router, prefix="/api")
```

4. **Create hooks** in `frontend/src/hooks/` for frontend usage

### Hot Reload

Both backend and frontend support hot reloading:
- **Backend**: Uvicorn automatically reloads on file changes
- **Frontend**: Vite provides instant module replacement (HMR)

## Testing

### Backend

```bash
cd backend
uv run pytest
```

### Frontend

```bash
cd frontend
npm run test
```

## Building for Production

### Backend

```bash
cd backend
uv sync --prod
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/` and can be served by a web server.

## Stopping Services

```bash
# Stop PostgreSQL
docker-compose down

# Stop backend and frontend
# Press Ctrl+C in their respective terminals
```

## Database Migrations

SQLModel automatically creates tables on startup from the models. For more complex migrations, consider using Alembic:

```bash
cd backend
uv run pip install alembic
uv run alembic init alembic
```

## Useful Commands

### Backend

```bash
# Run server with reload
uv run uvicorn app.main:app --reload

# Access API docs
open http://localhost:8000/docs

# Run tests with coverage
uv run pytest --cov
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U user -d appdb

# View logs
docker-compose logs postgres

# Rebuild containers
docker-compose down && docker-compose up -d
```

## Troubleshooting

### Database Connection Issues

If you get connection errors, verify:
1. PostgreSQL is running: `docker-compose ps`
2. Database URL is correct in `backend/.env`
3. Credentials match in both `.env` and `backend/.env`

### CORS Issues

If frontend can't access backend, check:
1. Backend is running on `http://localhost:8000`
2. `CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173`
3. Vite proxy is configured in `frontend/vite.config.ts`

### Port Already in Use

If ports are already taken, modify:
- Backend: Change port in `uvicorn` command (default 8000)
- Frontend: Change port in `npm run dev` (default 5173)
- Database: Change port mapping in `docker-compose.yml` (default 5432)

## Next Steps

1. Add more models and API endpoints
2. Implement authentication/authorization
3. Add form validation
4. Set up testing
5. Configure deployment (Docker, cloud providers, etc.)

## License

MIT
