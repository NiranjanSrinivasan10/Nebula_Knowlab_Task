import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

const anthropicClient = anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY || '',
});

interface AssistantAction {
  tool_name: string;
  parameters?: any;
  requires_confirmation: boolean;
}

export const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'open_compose',
      description: 'Open the email composition window to start writing a new email',
      parameters: {
        type: 'object' as const,
        properties: {},
        required: [] as const,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'fill_compose',
      description: 'Fill in the compose form with recipient, subject, and body',
      parameters: {
        type: 'object' as const,
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body content' },
        },
        required: ['to', 'subject', 'body'] as const,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_email',
      description: 'Send the composed email. IMPORTANT: This requires human confirmation before actually sending.',
      parameters: {
        type: 'object' as const,
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject line' },
          body: { type: 'string', description: 'Email body content' },
        },
        required: ['to', 'subject', 'body'] as const,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_emails',
      description: 'Search for emails with filters',
      parameters: {
        type: 'object' as const,
        properties: {
          date_from: { type: 'string', description: 'Filter emails after this date (format: YYYY/MM/DD)' },
          date_to: { type: 'string', description: 'Filter emails before this date (format: YYYY/MM/DD)' },
          sender: { type: 'string', description: 'Filter by sender email address' },
          keyword: { type: 'string', description: 'Search keyword in email content' },
          unread_only: { type: 'boolean', description: 'Show only unread emails' },
        },
        required: [] as const,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'open_email',
      description: 'Open a specific email by its ID to view its contents',
      parameters: {
        type: 'object' as const,
        properties: {
          id: { type: 'string', description: 'The email ID to open' },
        },
        required: ['id'] as const,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'apply_filter',
      description: 'Apply a filter to the current email list view',
      parameters: {
        type: 'object' as const,
        properties: {
          date_from: { type: 'string', description: 'Filter emails after this date (format: YYYY/MM/DD)' },
          date_to: { type: 'string', description: 'Filter emails before this date (format: YYYY/MM/DD)' },
          sender: { type: 'string', description: 'Filter by sender email address' },
          keyword: { type: 'string', description: 'Search keyword in email content' },
          unread_only: { type: 'boolean', description: 'Show only unread emails' },
        },
        required: [] as const,
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'start_reply',
      description: 'Start a reply to an email thread',
      parameters: {
        type: 'object' as const,
        properties: {
          thread_id: { type: 'string', description: 'The thread ID to reply to' },
        },
        required: ['thread_id'] as const,
      },
    },
  },
];

export async function processAssistantRequest(
  userMessage: string,
  currentView: string,
  openEmailId: string | null
): Promise<AssistantAction[]> {
  const systemPrompt = `You are an AI assistant for a mail web application. Your role is to help users manage their email by understanding their natural language requests and converting them into structured actions.

Current UI Context:
- Current view: ${currentView}
- Open email ID: ${openEmailId || 'None'}

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
  {
    "tool_name": "tool_name",
    "parameters": {...},
    "requires_confirmation": false
  }
]`;

  try {
    const result = await generateText({
      model: anthropicClient('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      prompt: userMessage,
      tools,
      maxTokens: 1024,
      temperature: 0.7,
    });

    // Extract tool calls from the response
    const actions: AssistantAction[] = [];
    
    if (result.toolCalls) {
      for (const toolCall of result.toolCalls) {
        actions.push({
          tool_name: toolCall.toolName,
          parameters: toolCall.args,
          requires_confirmation: toolCall.toolName === 'send_email',
        });
      }
    }

    return actions;
  } catch (error) {
    console.error('Assistant error:', error);
    return [{
      tool_name: 'error',
      parameters: { message: error instanceof Error ? error.message : 'An error occurred' },
      requires_confirmation: false,
    }];
  }
}
