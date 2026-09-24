import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleAssistantAction, executeConfirmedAction } from '../actionHandlers';
import { useMailStore } from '../../hooks/useMailStore';

// Mock the store
vi.mock('../../hooks/useMailStore');

describe('actionHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleAssistantAction', () => {
    it('should handle open_compose action', () => {
      const mockSetCurrentView = vi.fn();
      (useMailStore.getState as any).mockReturnValue({
        setCurrentView: mockSetCurrentView,
      });

      const result = handleAssistantAction({
        tool_name: 'open_compose',
        parameters: {},
        requires_confirmation: false,
      });

      expect(mockSetCurrentView).toHaveBeenCalledWith('compose');
      expect(result.type).toBe('info');
      expect(result.message).toBe('Opened compose window');
    });

    it('should handle fill_compose action', () => {
      const mockSetCurrentView = vi.fn();
      const mockSetComposeData = vi.fn();
      (useMailStore.getState as any).mockReturnValue({
        setCurrentView: mockSetCurrentView,
        setComposeData: mockSetComposeData,
      });

      const result = handleAssistantAction({
        tool_name: 'fill_compose',
        parameters: {
          to: 'test@example.com',
          subject: 'Test Subject',
          body: 'Test Body',
        },
        requires_confirmation: false,
      });

      expect(mockSetComposeData).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body',
      });
      expect(mockSetCurrentView).toHaveBeenCalledWith('compose');
      expect(result.type).toBe('info');
      expect(result.message).toContain('test@example.com');
    });

    it('should handle send_email action with confirmation required', () => {
      const action = {
        tool_name: 'send_email',
        parameters: {
          to: 'recipient@example.com',
          subject: 'Hello',
          body: 'Test message',
        },
        requires_confirmation: true,
      };

      const result = handleAssistantAction(action);

      expect(result.type).toBe('confirmation_required');
      expect(result.action).toBe(action);
      expect(result.message).toContain('recipient@example.com');
    });

    it('should handle search_emails action', () => {
      const mockSetCurrentView = vi.fn();
      const mockSetFilters = vi.fn();
      (useMailStore.getState as any).mockReturnValue({
        setCurrentView: mockSetCurrentView,
        setFilters: mockSetFilters,
      });

      const result = handleAssistantAction({
        tool_name: 'search_emails',
        parameters: {
          sender: 'test@example.com',
          keyword: 'urgent',
          unread_only: true,
        },
        requires_confirmation: false,
      });

      expect(mockSetFilters).toHaveBeenCalledWith({
        sender: 'test@example.com',
        keyword: 'urgent',
        unread_only: true,
      });
      expect(mockSetCurrentView).toHaveBeenCalledWith('inbox');
      expect(result.type).toBe('info');
      expect(result.filters).toBeDefined();
    });

    it('should handle open_email action', () => {
      const result = handleAssistantAction({
        tool_name: 'open_email',
        parameters: { id: 'email123' },
        requires_confirmation: false,
      });

      expect(result.type).toBe('info');
      expect(result.message).toContain('email123');
      expect(result.emailId).toBe('email123');
    });

    it('should handle apply_filter action', () => {
      const mockSetFilters = vi.fn();
      (useMailStore.getState as any).mockReturnValue({
        setFilters: mockSetFilters,
      });

      const result = handleAssistantAction({
        tool_name: 'apply_filter',
        parameters: {
          date_from: '2024/01/01',
          date_to: '2024/12/31',
        },
        requires_confirmation: false,
      });

      expect(mockSetFilters).toHaveBeenCalledWith({
        date_from: '2024/01/01',
        date_to: '2024/12/31',
      });
      expect(result.type).toBe('info');
    });

    it('should handle start_reply action', () => {
      const result = handleAssistantAction({
        tool_name: 'start_reply',
        parameters: { thread_id: 'thread123' },
        requires_confirmation: false,
      });

      expect(result.type).toBe('info');
      expect(result.message).toContain('thread123');
      expect(result.threadId).toBe('thread123');
    });

    it('should handle error action', () => {
      const result = handleAssistantAction({
        tool_name: 'error',
        parameters: { message: 'Something went wrong' },
        requires_confirmation: false,
      });

      expect(result.type).toBe('error');
      expect(result.message).toBe('Something went wrong');
    });

    it('should handle unknown action', () => {
      const result = handleAssistantAction({
        tool_name: 'unknown_action',
        parameters: {},
        requires_confirmation: false,
      });

      expect(result.type).toBe('info');
      expect(result.message).toContain('unknown_action');
    });
  });

  describe('executeConfirmedAction', () => {
    it('should execute send_email action successfully', async () => {
      const mockSendEmail = vi.fn().mockResolvedValue({ message_id: '123', status: 'sent' });
      vi.doMock('../services/api', () => ({
        mailApi: { sendEmail: mockSendEmail },
      }));

      const action = {
        tool_name: 'send_email',
        parameters: {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Body',
        },
        requires_confirmation: true,
      };

      const result = await executeConfirmedAction(action);

      expect(result.type).toBe('success');
      expect(result.message).toBe('Email sent successfully');
    });

    it('should handle send_email failure', async () => {
      const mockSendEmail = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.doMock('../services/api', () => ({
        mailApi: { sendEmail: mockSendEmail },
      }));

      const action = {
        tool_name: 'send_email',
        parameters: {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Body',
        },
        requires_confirmation: true,
      };

      const result = await executeConfirmedAction(action);

      expect(result.type).toBe('error');
      expect(result.message).toBe('Failed to send email');
    });

    it('should handle unknown confirmed action', async () => {
      const action = {
        tool_name: 'unknown_action',
        parameters: {},
        requires_confirmation: true,
      };

      const result = await executeConfirmedAction(action);

      expect(result.type).toBe('info');
      expect(result.message).toBe('Action executed');
    });
  });
});
