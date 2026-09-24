from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from app.config import settings
import json


class PubSubService:
    def __init__(self, credentials: Credentials):
        self.credentials = credentials
        self.gmail_service = build('gmail', 'v1', credentials=credentials)
    
    def watch_mailbox(self, topic: str = None) -> dict:
        """
        Subscribe to Gmail push notifications via Pub/Sub.
        
        Args:
            topic: Pub/Sub topic in format "projects/{project}/topics/{topic}"
                   If None, uses the topic from settings
        
        Returns:
            Response from Gmail watch API with historyId
        """
        if topic is None:
            topic = f"projects/{settings.gcp_project_id}/topics/{settings.pubsub_topic}"
        
        try:
            watch_request = {
                'topicName': topic,
                'labelIds': ['INBOX']  # Only watch inbox
            }
            
            response = self.gmail_service.users().watch(
                userId='me',
                body=watch_request
            ).execute()
            
            return {
                'historyId': response.get('historyId'),
                'expiration': response.get('expiration')
            }
            
        except Exception as e:
            print(f"Error watching mailbox: {e}")
            raise
    
    def stop_watching(self) -> dict:
        """Stop Gmail push notifications."""
        try:
            response = self.gmail_service.users().stop(userId='me').execute()
            return {'success': True}
        except Exception as e:
            print(f"Error stopping watch: {e}")
            raise
    
    def get_history(self, start_history_id: str) -> dict:
        """
        Get history of changes since a specific historyId.
        
        Args:
            start_history_id: The history ID to start from
        
        Returns:
            History records with message changes
        """
        try:
            response = self.gmail_service.users().history().list(
                userId='me',
                startHistoryId=start_history_id
            ).execute()
            
            return response
            
        except Exception as e:
            print(f"Error getting history: {e}")
            raise
