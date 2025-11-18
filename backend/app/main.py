from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.db import init_db, close_db
from app.api import users, waitlist

# Create FastAPI app
app = FastAPI(
    title="API",
    description="FastAPI backend with SQLModel and PostgreSQL",
    version="0.1.0",
)

# Add CORS middleware
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api")
app.include_router(waitlist.router, prefix="/api")


@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    await init_db()


@app.on_event("shutdown")
async def shutdown():
    """Close database connections on shutdown"""
    await close_db()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Hello from FastAPI"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}
