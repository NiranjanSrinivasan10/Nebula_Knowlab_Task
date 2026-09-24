import React, { useEffect, useState } from 'react';
import { useMailStore } from '../hooks/useMailStore';
import { mailApi } from '../services/api';

const EmailDetail: React.FC = () => {
  const { selectedEmail, setCurrentView, setLoading, setError } = useMailStore();
  const [email, setEmail] = useState(selectedEmail);
  const [isReplying, setIsReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setErrorMsg] = useState('');

  useEffect(() => {
    if (selectedEmail && (!email || !email.body)) {
      loadEmailDetail(selectedEmail.id);
    }
  }, [selectedEmail]);

  const loadEmailDetail = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await mailApi.getEmail(id);
      setEmail(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load email');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyBody) {
      setErrorMsg('Please enter a reply');
      return;
    }

    setIsSending(true);
    setErrorMsg('');
    try {
      if (!email) throw new Error('No email selected');
      await mailApi.replyEmail(email.thread_id, replyBody);
      setIsReplying(false);
      setReplyBody('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  if (!email) {
    return <div className="p-4 text-gray-600">No email selected</div>;
  }

  return (
    <div className="p-6">
      <button
        onClick={() => setCurrentView('inbox')}
        className="mb-4 text-sm text-blue-600 hover:text-blue-700 focus:outline-none"
      >
        ← Back to Inbox
      </button>

      <div className="border-b border-gray-200 pb-4 mb-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">{email.subject}</h1>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">From:</span> {email.from_email}
          </div>
          <div>{new Date(email.date).toLocaleString()}</div>
        </div>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-medium">To:</span> {email.to_email.join(', ')}
        </div>
      </div>

      <div className="prose prose-sm max-w-none mb-6">
        <div className="whitespace-pre-wrap text-gray-800">{email.body || email.snippet}</div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {!isReplying ? (
        <button
          onClick={() => setIsReplying(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Reply
        </button>
      ) : (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Reply</h3>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-3"
            placeholder="Write your reply..."
          />
          <div className="flex gap-3">
            <button
              onClick={handleReply}
              disabled={isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? 'Sending...' : 'Send Reply'}
            </button>
            <button
              onClick={() => {
                setIsReplying(false);
                setReplyBody('');
                setErrorMsg('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDetail;
