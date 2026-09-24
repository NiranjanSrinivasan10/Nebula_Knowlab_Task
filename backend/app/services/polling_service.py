import asyncio
from typing import Optional
from google.oauth2.credentials import Credentials
from app.services.gmail_service import GmailService
from app.api.webhooks import get_connection_manager
from app.config import settings


class PollingService:
    """Polling service for Gmail updates (fallback for local dev without public URL)."""
    
    def __init__(self):
        self.polling_task: Optional[asyncio.Task] = None
        self.is_running = False
        self.last_history_id: Optional[str] = None
    
    async def start_polling(self, credentials: Credentials, interval: int = 15):
        """
        Start polling for new emails.
        
        Args:
            credentials: Google OAuth credentials
            interval: Polling interval in seconds (default: 15)
        """
        if self.is_running:
            print("Polling is already running")
            return
        
        self.is_running = True
        self.polling_task = asyncio.create_task(
            self._poll_loop(credentials, interval)
        )
        print(f"Started polling Gmail every {interval} seconds")
    
    async def stop_polling(self):
        """Stop the polling service."""
        if self.polling_task:
            self.polling_task.cancel()
            try:
                await self.polling_task
            except asyncio.CancelledError:
                pass
        self.is_running = False
        print("Stopped polling Gmail")
    
    async def _poll_loop(self, credentials: Credentials, interval: int):
        """Internal polling loop."""
        gmail_service = GmailService(credentials)
        manager = get_connection_manager()
        
        while self.is_running:
            try:
                # Get current inbox emails
                from app.models.schemas import EmailFilter
                emails = gmail_service.list_inbox(EmailFilter(max_results=5))
                
                if emails:
                    # Broadcast new emails to connected clients
                    notification = {
                        "type": "poll_update",
                        "emails": [
                            {
                                "id": email.id,
                                "subject": email.subject,
                                "from_email": email.from_email,
                                "date": email.date.isoformat(),
                                "snippet": email.snippet,
                                "is_read": email.is_read
                            }
                            for email in emails
                        ],
                        "count": len(emails)
                    }
                    
                    await manager.broadcast(notification)
                
                await asyncio.sleep(interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in polling loop: {e}")
                await asyncio.sleep(interval)


# Global polling service instance
polling_service = PollingService()
