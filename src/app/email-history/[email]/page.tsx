'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { useParams } from 'next/navigation';

interface User {
  name: string;
  email: string;
}

interface EmailThread {
  id: string;
  subject: string;
  snippet: string;
  lastMessageDate: string;
  messages: EmailMessage[];
}

interface EmailMessage {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

export default function EmailHistoryPage() {
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [emailThreads, setEmailThreads] = useState<EmailThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const leadEmail = decodeURIComponent(params.email as string);

  useEffect(() => {
    fetchUser();
    fetchEmailHistory();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      if (!response.ok) throw new Error('Failed to fetch user');
      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchEmailHistory = async () => {
    try {
      const response = await fetch(`/api/email/history/${encodeURIComponent(leadEmail)}`);
      if (!response.ok) throw new Error('Failed to fetch email history');
      const data = await response.json();
      setEmailThreads(data);
    } catch (err) {
      console.error('Error fetching email history:', err);
      setError('Failed to load email history');
    } finally {
      setLoading(false);
    }
  };

  const sortedEmailThreads = useMemo(() => {
    return emailThreads.sort((a, b) => {
      return new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime();
    });
  }, [emailThreads]);

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Email History</h1>
          <p className="text-gray-400">Showing email history for {leadEmail}</p>
        </div>

        {loading && (
          <div className="text-white">Loading email history...</div>
        )}

        {error && (
          <div className="text-red-400">{error}</div>
        )}

        <div className="space-y-4">
          {sortedEmailThreads.map((thread) => (
            <div key={thread.id} className="bg-[#2d2d2d] rounded-lg p-4">
              <div className="mb-2">
                <h3 className="text-lg font-medium text-white">{thread.subject}</h3>
                <p className="text-sm text-gray-400">
                  Last message: {new Date(thread.lastMessageDate).toLocaleDateString()}
                </p>
              </div>
              <p className="text-gray-300">{thread.snippet}</p>
              <div className="mt-4 space-y-4">
                {thread.messages.map((message) => (
                  <div key={message.id} className="border-t border-gray-600 pt-4">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>From: {message.from}</span>
                      <span>{new Date(message.date).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-white">{message.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 