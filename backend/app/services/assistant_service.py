from ai import anthropic
from typing import List, Dict, Any, Optional
from app.config import settings
import json


class AssistantService:
    def __init__(self):
        # Using Vercel AI SDK with Anthropic provider
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        
    def get_tools_definition(self) -> List[Dict[str, Any]]:
        """Define the tools available to the assistant."""
        return [
            {
                "name": "open_compose",
                "description": "Open the email composition window to start writing a new email",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            },
            {
                "name": "fill_compose",
                "description": "Fill in the compose form with recipient, subject, and body",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "to": {
                            "type": "string",
                            "description": "Recipient email address"
                        },
                        "subject": {
                            "type": "string",
                            "description": "Email subject line"
                        },
                        "body": {
                            "type": "string",
                            "description": "Email body content"
                        }
                    },
                    "required": ["to", "subject", "body"]
                }
            },
            {
                "name": "send_email",
                "description": "Send the composed email. IMPORTANT: This requires human confirmation before actually sending.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "to": {
                            "type": "string",
                            "description": "Recipient email address"
                        },
                        "subject": {
                            "type": "string",
                            "description": "Email subject line"
                        },
                        "body": {
                            "type": "string",
                            "description": "Email body content"
                        }
                    },
                    "required": ["to", "subject", "body"]
                }
            },
            {
                "name": "search_emails",
                "description": "Search for emails with filters",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "date_from": {
                            "type": "string",
                            "description": "Filter emails after this date (format: YYYY/MM/DD)"
                        },
                        "date_to": {
                            "type": "string",
                            "description": "Filter emails before this date (format: YYYY/MM/DD)"
                        },
                        "sender": {
                            "type": "string",
                            "description": "Filter by sender email address"
                        },
                        "keyword": {
                            "type": "string",
                            "description": "Search keyword in email content"
                        },
                        "unread_only": {
                            "type": "boolean",
                            "description": "Show only unread emails"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "open_email",
                "description": "Open a specific email by its ID to view its contents",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "id": {
                            "type": "string",
                            "description": "The email ID to open"
                        }
                    },
                    "required": ["id"]
                }
            },
            {
                "name": "apply_filter",
                "description": "Apply a filter to the current email list view",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "date_from": {
                            "type": "string",
                            "description": "Filter emails after this date (format: YYYY/MM/DD)"
                        },
                        "date_to": {
                            "type": "string",
                            "description": "Filter emails before this date (format: YYYY/MM/DD)"
                        },
                        "sender": {
                            "type": "string",
                            "description": "Filter by sender email address"
                        },
                        "keyword": {
                            "type": "string",
                            "description": "Search keyword in email content"
                        },
                        "unread_only": {
                            "type": "boolean",
                            "description": "Show only unread emails"
                        }
                    },
                    "required": []
                }
            },
            {
                "name": "start_reply",
                "description": "Start a reply to an email thread",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "thread_id": {
                            "type": "string",
                            "description": "The thread ID to reply to"
                        }
                    },
                    "required": ["thread_id"]
                }
            }
        ]
    
    def process_request(
        self,
        user_message: str,
        current_view: str,
        open_email_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Process user request and return structured actions.
        
        Args:
            user_message: The user's natural language request
            current_view: Current UI view (e.g., 'inbox', 'sent', 'compose', 'email_detail')
            open_email_id: ID of currently open email (if any)
        
        Returns:
            List of structured actions as JSON
        """
        system_prompt = f"""You are an AI assistant for a mail web application. Your role is to help users manage their email by understanding their natural language requests and converting them into structured actions.

Current UI Context:
- Current view: {current_view}
- Open email ID: {open_email_id if open_email_id else 'None'}

Available tools:
- open_compose: Open the email composition window
- fill_compose: Fill in the compose form with recipient, subject, and body
- send_email: Send the composed email (REQUIRES human confirmation)
- search_emails: Search for emails with filters
- open_email: Open a specific email by ID
- apply_filter: Apply a filter to the current email list
- start_reply: Start a reply to an email thread

IMPORTANT RULES:
1. For send_email: Always mark it with "requires_confirmation": true in the action. The frontend must show a confirmation dialog before executing.
2. Return ONLY a JSON array of actions, no conversational text.
3. Each action should include: tool_name, parameters (if any), and requires_confirmation (boolean).
4. Consider the current UI context when deciding which actions to take.
5. If the user asks to send an email, first use fill_compose if needed, then send_email with confirmation required.
6. If the user asks to search or filter, use search_emails or apply_filter accordingly.
7. If the user asks to view an email, use open_email.
8. If the user asks to reply, use start_reply.

Response format (JSON array):
[
  {{
    "tool_name": "tool_name",
    "parameters": {{...}},
    "requires_confirmation": false
  }}
]"""

        tools = self.get_tools_definition()
        
        try:
            message = self.client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_message
                    }
                ],
                tools=tools
            )
            
            # Extract tool use blocks
            actions = []
            for block in message.content:
                if block.type == "tool_use":
                    action = {
                        "tool_name": block.name,
                        "parameters": block.input,
                        "requires_confirmation": block.name == "send_email"
                    }
                    actions.append(action)
            
            return actions
            
        except Exception as e:
            # Fallback: return error action
            return [{
                "tool_name": "error",
                "parameters": {"message": str(e)},
                "requires_confirmation": False
            }]
