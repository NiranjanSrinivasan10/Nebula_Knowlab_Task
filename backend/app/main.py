from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.auth import router as auth_router
from app.api.mail import router as mail_router
from app.api.webhooks import router as webhooks_router

app = FastAPI(title="Mail Web App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(mail_router)
app.include_router(webhooks_router)


@app.get("/")
async def root():
    return {"message": "Mail Web App API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
