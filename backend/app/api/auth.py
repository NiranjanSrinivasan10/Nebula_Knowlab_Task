from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from app.config import settings
from app.services.pubsub_service import PubSubService
from app.services.polling_service import polling_service
import json
import os

router = APIRouter(prefix="/auth", tags=["auth"])

# Token storage: Using in-memory session storage for simplicity
# Trade-off explanation:
# - Session storage (current): Ephemeral, lost on server restart, simpler for development
# - Encrypted file storage: Persistent across restarts, requires encryption key management,
#   more complex but better for production. For a hiring task, session storage is sufficient
# and demonstrates the OAuth flow without added complexity.
user_tokens = {}


@router.get("/login")
async def login():
    """Redirect to Google OAuth2 consent screen."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_redirect_uri]
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.modify"
        ]
    )
    
    flow.redirect_uri = settings.google_redirect_uri
    
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    
    return RedirectResponse(authorization_url)


@router.get("/callback")
async def callback(request: Request, code: str, state: str):
    """Exchange authorization code for tokens and store them."""
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.google_redirect_uri]
            }
        },
        scopes=[
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.modify"
        ]
    )
    
    flow.redirect_uri = settings.google_redirect_uri
    
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        # Store credentials in session (in-memory for this demo)
        # In production, you would use a proper session store (Redis, database, etc.)
        session_id = request.cookies.get("session_id")
        if not session_id:
            import uuid
            session_id = str(uuid.uuid4())
        
        user_tokens[session_id] = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes,
            "expiry": credentials.expiry.isoformat() if credentials.expiry else None
        }
        
        # Start Gmail watch or polling based on configuration
        if settings.use_polling:
            # Start polling service (for local dev without public URL)
            import asyncio
            asyncio.create_task(polling_service.start_polling(credentials, interval=15))
        else:
            # Start Pub/Sub watch (for production with public URL)
            try:
                pubsub_service = PubSubService(credentials)
                watch_result = pubsub_service.watch_mailbox()
                print(f"Started Gmail watch with historyId: {watch_result.get('historyId')}")
            except Exception as e:
                print(f"Failed to start Gmail watch, falling back to polling: {e}")
                import asyncio
                asyncio.create_task(polling_service.start_polling(credentials, interval=15))
        
        response = RedirectResponse(url="http://localhost:5173")
        response.set_cookie(key="session_id", value=session_id, httponly=True, secure=False)
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error exchanging token: {str(e)}")


@router.get("/logout")
async def logout(request: Request, response: Response):
    """Clear the session and logout."""
    session_id = request.cookies.get("session_id")
    if session_id and session_id in user_tokens:
        del user_tokens[session_id]
    
    response = RedirectResponse(url="http://localhost:5173")
    response.delete_cookie(key="session_id")
    return response


def get_credentials(session_id: str) -> Credentials:
    """Retrieve credentials from session storage."""
    if session_id not in user_tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token_data = user_tokens[session_id]
    credentials = Credentials(
        token=token_data["token"],
        refresh_token=token_data["refresh_token"],
        token_uri=token_data["token_uri"],
        client_id=token_data["client_id"],
        client_secret=token_data["client_secret"],
        scopes=token_data["scopes"]
    )
    
    return credentials
