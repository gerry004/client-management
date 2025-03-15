import Modal from './Modal';
import { useState } from 'react';

interface EmailEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail?: string;
  recipientName?: string;
}

export default function EmailEditorModal({
  isOpen,
  onClose,
  recipientEmail,
  recipientName,
}: EmailEditorModalProps) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!recipientEmail) {
      alert('Recipient email is required');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Include your auth token if it's stored in a cookie
          // The browser will automatically include it
        },
        credentials: 'include', // Important: include credentials in the request
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && data.error === 'Gmail not connected') {
          if (confirm('Gmail is not connected. Would you like to connect it now?')) {
            window.location.href = '/settings';
          }
          return;
        }
        throw new Error(data.error || 'Failed to send email');
      }

      onClose();
      alert('Email sent successfully!');
    } catch (err) {
      console.error('Error sending email:', err);
      alert(err instanceof Error ? err.message : 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Email">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            To
          </label>
          <input
            type="text"
            value={`${recipientName} <${recipientEmail}>`}
            disabled
            className="w-full px-3 py-2 bg-[#2d2d2d] text-white rounded border border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-[#2d2d2d] text-white rounded border border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Message
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 bg-[#2d2d2d] text-white rounded border border-gray-600"
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </Modal>
  );
} 