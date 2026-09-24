import { useMailStore } from '../hooks/useMailStore';

interface AssistantAction {
  tool_name: string;
  parameters?: any;
  requires_confirmation: boolean;
}

export const handleAssistantAction = (action: AssistantAction) => {
  const store = useMailStore.getState();
  
  switch (action.tool_name) {
    case 'open_compose':
      store.setCurrentView('compose');
      return { type: 'info', message: 'Opened compose window' };
    
    case 'fill_compose':
      store.setComposeData({
        to: action.parameters?.to || '',
        subject: action.parameters?.subject || '',
        body: action.parameters?.body || ''
      });
      store.setCurrentView('compose');
      return { 
        type: 'info', 
        message: `Filled compose form: To: ${action.parameters?.to}, Subject: ${action.parameters?.subject}` 
      };
    
    case 'send_email':
      // This requires confirmation, so we return the action for the UI to handle
      return { 
        type: 'confirmation_required', 
        action: action,
        message: `Ready to send email to ${action.parameters?.to} with subject "${action.parameters?.subject}"` 
      };
    
    case 'search_emails':
      // Update filters with search parameters
      store.setFilters({
        date_from: action.parameters?.date_from,
        date_to: action.parameters?.date_to,
        sender: action.parameters?.sender,
        keyword: action.parameters?.keyword,
        unread_only: action.parameters?.unread_only,
      });
      store.setCurrentView('inbox');
      return { 
        type: 'info', 
        message: 'Applied search filters to inbox',
        filters: action.parameters
      };
    
    case 'open_email':
      // Would need to fetch the email and set it as selected
      return { 
        type: 'info', 
        message: `Opening email ${action.parameters?.id}`,
        emailId: action.parameters?.id
      };
    
    case 'apply_filter':
      // Update filters
      store.setFilters({
        date_from: action.parameters?.date_from,
        date_to: action.parameters?.date_to,
        sender: action.parameters?.sender,
        keyword: action.parameters?.keyword,
        unread_only: action.parameters?.unread_only,
      });
      return { 
        type: 'info', 
        message: 'Applied filter to current view',
        filters: action.parameters
      };
    
    case 'start_reply':
      // Would open reply for the thread
      return { 
        type: 'info', 
        message: `Starting reply to thread ${action.parameters?.thread_id}`,
        threadId: action.parameters?.thread_id
      };
    
    case 'error':
      return { 
        type: 'error', 
        message: action.parameters?.message || 'An error occurred' 
      };
    
    default:
      return { 
        type: 'info', 
        message: `Unknown action: ${action.tool_name}` 
      };
  }
};

export const executeConfirmedAction = async (action: AssistantAction) => {
  const { mailApi } = await import('../services/api');
  
  switch (action.tool_name) {
    case 'send_email':
      try {
        await mailApi.sendEmail(
          action.parameters?.to,
          action.parameters?.subject,
          action.parameters?.body
        );
        return { type: 'success', message: 'Email sent successfully' };
      } catch (error) {
        return { type: 'error', message: 'Failed to send email' };
      }
    
    default:
      return { type: 'info', message: 'Action executed' };
  }
};
