from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from typing import List, Optional, Dict, Any
from app.models.schemas import Email, EmailFilter
from datetime import datetime
import base64
import email


class GmailService:
    def __init__(self, credentials: Credentials):
        self.service = build('gmail', 'v1', credentials=credentials)

    def list_inbox(self, filters: EmailFilter) -> List[Email]:
        """List emails from inbox with optional filters."""
        query_params = {
            'userId': 'me',
            'maxResults': filters.max_results,
        }
        
        if filters.label_ids:
            query_params['labelIds'] = filters.label_ids
        else:
            query_params['labelIds'] = ['INBOX']
        
        if filters.query:
            query_params['q'] = filters.query
        
        results = self.service.users().messages().list(**query_params).execute()
        messages = results.get('messages', [])
        
        emails = []
        for msg in messages:
            email_data = self.get_email(msg['id'])
            if email_data:
                emails.append(email_data)
        
        return emails

    def list_sent(self) -> List[Email]:
        """List sent emails."""
        results = self.service.users().messages().list(
            userId='me',
            labelIds=['SENT'],
            maxResults=10
        ).execute()
        messages = results.get('messages', [])
        
        emails = []
        for msg in messages:
            email_data = self.get_email(msg['id'])
            if email_data:
                emails.append(email_data)
        
        return emails

    def get_email(self, email_id: str) -> Optional[Email]:
        """Get a specific email by ID."""
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=email_id,
                format='full'
            ).execute()
            
            headers = {h['name']: h['value'] for h in message['payload'].get('headers', [])}
            
            # Extract body
            body = self._extract_body(message['payload'])
            
            # Extract labels
            labels = message.get('labelIds', [])
            is_read = 'UNREAD' not in labels
            
            return Email(
                id=message['id'],
                thread_id=message['threadId'],
                subject=headers.get('Subject', ''),
                from_email=headers.get('From', ''),
                to_email=self._parse_email_list(headers.get('To', '')),
                date=self._parse_date(headers.get('Date', '')),
                body=body,
                snippet=message.get('snippet', ''),
                labels=labels,
                is_read=is_read
            )
        except Exception as e:
            print(f"Error fetching email {email_id}: {e}")
            return None

    def send_email(self, to: str, subject: str, body: str) -> str:
        """Send an email."""
        message = email.message.EmailMessage()
        message.set_content(body)
        message['To'] = to
        message['Subject'] = subject
        
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        send_message = {
            'raw': encoded_message
        }
        
        result = self.service.users().messages().send(
            userId='me',
            body=send_message
        ).execute()
        
        return result['id']

    def reply_email(self, thread_id: str, body: str) -> str:
        """Reply to an email thread."""
        # Get the thread to find the last message
        thread = self.service.users().threads().get(
            userId='me',
            id=thread_id
        ).execute()
        
        last_message = thread['messages'][-1]
        headers = {h['name']: h['value'] for h in last_message['payload'].get('headers', [])}
        
        # Create reply
        message = email.message.EmailMessage()
        message.set_content(body)
        message['To'] = headers.get('From', '')
        message['Subject'] = headers.get('Subject', '')
        if 'References' in headers:
            message['References'] = headers['References']
        if 'Message-ID' in headers:
            message['In-Reply-To'] = headers['Message-ID']
        
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        
        send_message = {
            'raw': encoded_message,
            'threadId': thread_id
        }
        
        result = self.service.users().messages().send(
            userId='me',
            body=send_message
        ).execute()
        
        return result['id']

    def _extract_body(self, payload: Dict[str, Any]) -> str:
        """Extract email body from payload."""
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data', '')
                    if data:
                        return base64.urlsafe_b64decode(data).decode('utf-8')
                elif 'parts' in part:
                    body = self._extract_body(part)
                    if body:
                        return body
        elif 'body' in payload:
            data = payload['body'].get('data', '')
            if data:
                return base64.urlsafe_b64decode(data).decode('utf-8')
        return ''

    def _parse_email_list(self, email_string: str) -> List[str]:
        """Parse comma-separated email list."""
        if not email_string:
            return []
        return [e.strip() for e in email_string.split(',')]

    def _parse_date(self, date_string: str) -> datetime:
        """Parse email date string to datetime."""
        from email.utils import parsedate_to_datetime
        try:
            return parsedate_to_datetime(date_string)
        except:
            return datetime.now()
