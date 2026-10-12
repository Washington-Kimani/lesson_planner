from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.db import models
from app.db.core import Base, engine
from app.routers import admin, auth, teachers

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine) #replace with alembic migrations
    yield

app = FastAPI(title="Lesson Planner", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(teachers.router)