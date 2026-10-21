from fastapi import FastAPI

from app.routers import academics, admin, auth, classes, lessons, profile, teachers

app = FastAPI(title="Lesson Planner")
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(academics.router)
app.include_router(teachers.router)
app.include_router(classes.router)
app.include_router(lessons.router)
app.include_router(profile.router)