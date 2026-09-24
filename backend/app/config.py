from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str = "http://localhost:5173/auth/callback"
    gcp_project_id: str
    pubsub_topic: str
    session_secret: str
    use_polling: bool = False  # Toggle for polling mode (for local dev without public URL)

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False
    )


settings = Settings()
