from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import Optional
from datetime import datetime
from app.services.gmail_service import GmailService
from app.models.schemas import Email, EmailFilter, SendEmailRequest, ReplyEmailRequest
from app.api.auth import get_credentials

router = APIRouter(prefix="/api/mail", tags=["mail"])


def build_gmail_query(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sender: Optional[str] = None,
    keyword: Optional[str] = None,
    unread_only: bool = False
) -> str:
    """Build Gmail search query from filter parameters."""
    query_parts = []
    
    if date_from:
        query_parts.append(f"after:{date_from}")
    
    if date_to:
        query_parts.append(f"before:{date_to}")
    
    if sender:
        query_parts.append(f"from:{sender}")
    
    if keyword:
        query_parts.append(keyword)
    
    if unread_only:
        query_parts.append("is:unread")
    
    return " ".join(query_parts)


@router.get("/inbox")
async def list_inbox(
    request: Request,
    date_from: Optional[str] = Query(None, description="Format: YYYY/MM/DD"),
    date_to: Optional[str] = Query(None, description="Format: YYYY/MM/DD"),
    sender: Optional[str] = Query(None, description="Filter by sender email"),
    keyword: Optional[str] = Query(None, description="Search keyword"),
    unread_only: bool = Query(False, description="Show only unread emails"),
    max_results: int = Query(10, ge=1, le=50, description="Maximum number of results")
):
    """List inbox emails with optional filters."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    credentials = get_credentials(session_id)
    gmail_service = GmailService(credentials)
    
    query = build_gmail_query(date_from, date_to, sender, keyword, unread_only)
    
    filters = EmailFilter(
        query=query if query else None,
        max_results=max_results,
        label_ids=None
    )
    
    emails = gmail_service.list_inbox(filters)
    return {"emails": emails, "count": len(emails)}


@router.get("/sent")
async def list_sent(request: Request):
    """List sent emails."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    credentials = get_credentials(session_id)
    gmail_service = GmailService(credentials)
    
    emails = gmail_service.list_sent()
    return {"emails": emails, "count": len(emails)}


@router.get("/email/{email_id}")
async def get_email(request: Request, email_id: str):
    """Get a specific email by ID."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    credentials = get_credentials(session_id)
    gmail_service = GmailService(credentials)
    
    email = gmail_service.get_email(email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    return email


@router.post("/send")
async def send_email(request: Request, email_data: SendEmailRequest):
    """Send a new email."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    credentials = get_credentials(session_id)
    gmail_service = GmailService(credentials)
    
    message_id = gmail_service.send_email(
        to=email_data.to,
        subject=email_data.subject,
        body=email_data.body
    )
    
    return {"message_id": message_id, "status": "sent"}


@router.post("/reply")
async def reply_email(request: Request, reply_data: ReplyEmailRequest):
    """Reply to an email thread."""
    session_id = request.cookies.get("session_id")
    if not session_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    credentials = get_credentials(session_id)
    gmail_service = GmailService(credentials)
    
    message_id = gmail_service.reply_email(
        thread_id=reply_data.thread_id,
        body=reply_data.body
    )
    
    return {"message_id": message_id, "status": "replied"}
