import React, { useEffect, useRef, useState } from 'react';
import { useMailStore } from '../hooks/useMailStore';
import { handleAssistantAction, executeConfirmedAction } from '../lib/actionHandlers';
import { processAssistantRequest } from '../services/assistant';

interface Message {
  type: 'user' | 'assistant' | 'system';
  content: string;
  actions?: any[];
  timestamp: Date;
}

const AssistantPanel: React.FC = () => {
  const { currentView, selectedEmail, darkMode } = useMailStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addSystemMessage = (content: string) => {
    setMessages(prev => [...prev, {
      type: 'system',
      content,
      timestamp: new Date()
    }]);
  };

  const handleAssistantActions = (actions: any[]) => {
    let assistantMessage = '';
    
    actions.forEach(action => {
      const result = handleAssistantAction(action);
      
      if (result.type === 'confirmation_required') {
        setPendingAction(result.action);
        assistantMessage += result.message + '\n';
      } else if (result.type === 'error') {
        assistantMessage += `❌ ${result.message}\n`;
      } else {
        assistantMessage += `✓ ${result.message}\n`;
      }
    });

    if (assistantMessage) {
      setMessages(prev => [...prev, {
        type: 'assistant',
        content: assistantMessage.trim(),
        actions,
        timestamp: new Date()
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      // Process with Vercel AI SDK
      const actions = await processAssistantRequest(
        userMessage,
        currentView,
        selectedEmail?.id || null
      );

      handleAssistantActions(actions);
    } catch (error) {
      addSystemMessage(`Error: ${error instanceof Error ? error.message : 'Failed to process request'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    const result = await executeConfirmedAction(pendingAction);
    
    setMessages(prev => [...prev, {
      type: 'system',
      content: result.message,
      timestamp: new Date()
    }]);

    setPendingAction(null);
  };

  const handleCancelAction = () => {
    setPendingAction(null);
  };

  const renderActionPreview = (action: any) => {
    switch (action.tool_name) {
      case 'search_emails':
        return (
          <div className={`rounded-md p-3 mt-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
            <div className="font-medium mb-1">🔍 Search Results</div>
            {action.parameters && (
              <div className="space-y-1">
                {action.parameters.sender && <div>From: {action.parameters.sender}</div>}
                {action.parameters.keyword && <div>Keyword: {action.parameters.keyword}</div>}
                {action.parameters.unread_only && <div>Unread only</div>}
              </div>
            )}
          </div>
        );
      
      case 'open_email':
        return (
          <div className={`rounded-md p-3 mt-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
            <div className="font-medium mb-1">📧 Opening Email</div>
            <div>ID: {action.parameters?.id}</div>
          </div>
        );
      
      case 'fill_compose':
        return (
          <div className={`rounded-md p-3 mt-2 text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
            <div className="font-medium mb-1">✏️ Compose Form</div>
            <div className="space-y-1">
              <div>To: {action.parameters?.to}</div>
              <div>Subject: {action.parameters?.subject}</div>
              <div className="truncate">Body: {action.parameters?.body}</div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`w-80 border-l ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex flex-col h-full`}>
      {/* Header */}
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h2 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>AI Assistant</h2>
        <div className="flex items-center gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full bg-green-500`} />
          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Vercel AI SDK
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`text-sm ${
              msg.type === 'user' ? 'text-right' : 
              msg.type === 'system' ? 'text-center text-gray-500 italic' : 
              'text-left'
            }`}
          >
            <div
              className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${
                msg.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : msg.type === 'system'
                  ? darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
                  : darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              
              {/* Render action previews */}
              {msg.actions && msg.actions.map((action, actionIdx) => (
                <div key={actionIdx}>
                  {renderActionPreview(action)}
                </div>
              ))}
            </div>
            <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {/* Pending confirmation */}
        {pendingAction && (
          <div className={`border rounded-lg p-3 ${darkMode ? 'bg-yellow-900/30 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
              Confirm Action
            </div>
            <div className={`text-sm mb-3 ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
              {pendingAction.tool_name === 'send_email' 
                ? `Send email to ${pendingAction.parameters?.to}?`
                : 'Execute this action?'
              }
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmAction}
                className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={handleCancelAction}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask the assistant..."
            disabled={isLoading}
            className={`flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantPanel;
