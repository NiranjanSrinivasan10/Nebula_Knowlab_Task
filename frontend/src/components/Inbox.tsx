import React, { useEffect } from 'react';
import { useMailStore } from '../hooks/useMailStore';
import { mailApi } from '../services/api';

const Inbox: React.FC = () => {
  const { inboxEmails, filters, isLoading, error, setInboxEmails, setLoading, setError, setSelectedEmail, setCurrentView } = useMailStore();

  useEffect(() => {
    loadInbox();
  }, [filters]);

  const loadInbox = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mailApi.getInbox(filters);
      setInboxEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    setCurrentView('email_detail');
  };

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading inbox...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (inboxEmails.length === 0) {
    return <div className="p-4 text-gray-600">No emails in inbox</div>;
  }

  return (
    <div className="divide-y divide-gray-200">
      {inboxEmails.map((email) => (
        <div
          key={email.id}
          onClick={() => handleEmailClick(email)}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${email.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                  {email.from_email}
                </p>
                {!email.is_read && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
              </div>
              <p className={`text-sm mt-1 ${email.is_read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                {email.subject}
              </p>
              <p className="text-xs text-gray-400 mt-1 truncate">{email.snippet}</p>
            </div>
            <div className="text-xs text-gray-400 ml-4">
              {new Date(email.date).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Inbox;
