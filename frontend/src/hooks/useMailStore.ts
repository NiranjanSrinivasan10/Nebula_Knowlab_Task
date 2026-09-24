import { create } from 'zustand';

interface Email {
  id: string;
  thread_id: string;
  subject: string;
  from_email: string;
  to_email: string[];
  date: string;
  body?: string;
  snippet?: string;
  labels: string[];
  is_read: boolean;
}

interface EmailFilter {
  date_from?: string;
  date_to?: string;
  sender?: string;
  keyword?: string;
  unread_only?: boolean;
  max_results?: number;
}

interface MailStore {
  // State
  currentView: 'inbox' | 'sent' | 'compose' | 'email_detail';
  inboxEmails: Email[];
  sentEmails: Email[];
  selectedEmail: Email | null;
  filters: EmailFilter;
  isLoading: boolean;
  error: string | null;
  composeData: { to: string; subject: string; body: string };
  darkMode: boolean;
  
  // Actions
  setCurrentView: (view: 'inbox' | 'sent' | 'compose' | 'email_detail') => void;
  setInboxEmails: (emails: Email[]) => void;
  setSentEmails: (emails: Email[]) => void;
  setSelectedEmail: (email: Email | null) => void;
  setFilters: (filters: Partial<EmailFilter>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setComposeData: (data: { to: string; subject: string; body: string }) => void;
  clearComposeData: () => void;
  toggleDarkMode: () => void;
}

const initialFilters: EmailFilter = {
  max_results: 10,
  unread_only: false,
};

export const useMailStore = create<MailStore>((set) => ({
  // Initial state
  currentView: 'inbox',
  inboxEmails: [],
  sentEmails: [],
  selectedEmail: null,
  filters: initialFilters,
  isLoading: false,
  error: null,
  composeData: { to: '', subject: '', body: '' },
  darkMode: false,
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  
  setInboxEmails: (emails) => set({ inboxEmails: emails }),
  
  setSentEmails: (emails) => set({ sentEmails: emails }),
  
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  
  clearFilters: () => set({ filters: initialFilters }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setComposeData: (data) => set({ composeData: data }),
  
  clearComposeData: () => set({ composeData: { to: '', subject: '', body: '' } }),
  
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
}));
