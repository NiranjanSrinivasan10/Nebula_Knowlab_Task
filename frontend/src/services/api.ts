const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

// Generic fetch wrapper with credentials
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

export const mailApi = {
  // Auth
  login: () => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  logout: async () => {
    await fetchWithAuth(`${API_BASE_URL}/auth/logout`, { method: 'GET' });
    window.location.href = '/';
  },

  // Inbox
  getInbox: async (filters: EmailFilter = {}): Promise<{ emails: Email[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.sender) params.append('sender', filters.sender);
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.unread_only !== undefined) params.append('unread_only', String(filters.unread_only));
    if (filters.max_results) params.append('max_results', String(filters.max_results));

    const response = await fetchWithAuth(`${API_BASE_URL}/api/mail/inbox?${params}`);
    if (!response.ok) throw new Error('Failed to fetch inbox');
    return response.json();
  },

  // Sent
  getSent: async (): Promise<{ emails: Email[]; count: number }> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/mail/sent`);
    if (!response.ok) throw new Error('Failed to fetch sent emails');
    return response.json();
  },

  // Email detail
  getEmail: async (id: string): Promise<Email> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/mail/email/${id}`);
    if (!response.ok) throw new Error('Failed to fetch email');
    return response.json();
  },

  // Send email
  sendEmail: async (to: string, subject: string, body: string): Promise<{ message_id: string; status: string }> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/mail/send`, {
      method: 'POST',
      body: JSON.stringify({ to, subject, body }),
    });
    if (!response.ok) throw new Error('Failed to send email');
    return response.json();
  },

  // Reply
  replyEmail: async (thread_id: string, body: string): Promise<{ message_id: string; status: string }> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/mail/reply`, {
      method: 'POST',
      body: JSON.stringify({ thread_id, body }),
    });
    if (!response.ok) throw new Error('Failed to reply');
    return response.json();
  },
};
