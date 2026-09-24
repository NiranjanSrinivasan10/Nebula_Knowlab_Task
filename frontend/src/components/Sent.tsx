import React, { useEffect } from 'react';
import { useMailStore } from '../hooks/useMailStore';
import { mailApi } from '../services/api';

const Sent: React.FC = () => {
  const { sentEmails, isLoading, error, setSentEmails, setLoading, setError, setSelectedEmail, setCurrentView } = useMailStore();

  useEffect(() => {
    loadSent();
  }, []);

  const loadSent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mailApi.getSent();
      setSentEmails(data.emails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sent emails');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = (email: any) => {
    setSelectedEmail(email);
    setCurrentView('email_detail');
  };

  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading sent emails...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  if (sentEmails.length === 0) {
    return <div className="p-4 text-gray-600">No sent emails</div>;
  }

  return (
    <div className="divide-y divide-gray-200">
      {sentEmails.map((email) => (
        <div
          key={email.id}
          onClick={() => handleEmailClick(email)}
          className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">
                To: {email.to_email.join(', ')}
              </p>
              <p className="text-sm mt-1 text-gray-900 font-medium">
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

export default Sent;
