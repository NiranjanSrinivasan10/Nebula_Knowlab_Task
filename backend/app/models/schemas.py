from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class Email(BaseModel):
    id: str
    thread_id: str
    subject: str
    from_email: str
    to_email: List[str]
    date: datetime
    body: Optional[str] = None
    snippet: Optional[str] = None
    labels: List[str] = []
    is_read: bool = False


class EmailFilter(BaseModel):
    query: Optional[str] = None
    max_results: int = 10
    label_ids: Optional[List[str]] = None


class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str


class ReplyEmailRequest(BaseModel):
    thread_id: str
    body: str
