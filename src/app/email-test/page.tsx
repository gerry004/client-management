'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmailTestPage() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('Test Email');
  const [content, setContent] = useState('<p>This is a test email with tracking.</p>');
  const [trackingId, setTrackingId] = useState('');
  const [trackingStatus, setTrackingStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendTestEmail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, subject, content }),
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Email sent successfully!');
        // You would need to extract the tracking ID from the response
        // This is just a placeholder
        setTrackingId(data.trackingId || '');
      } else {
        alert(`Failed to send email: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('An error occurred while sending the email');
    } finally {
      setLoading(false);
    }
  };

  const checkTrackingStatus = async () => {
    if (!trackingId) {
      alert('No tracking ID available');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/email/tracking-status/${trackingId}`);
      const data = await response.json();
      setTrackingStatus(data);
    } catch (error) {
      console.error('Error checking tracking status:', error);
      alert('An error occurred while checking tracking status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Email Tracking Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Send Test Email</h2>
        <div className="mb-4">
          <label className="block mb-1">Recipient Email:</label>
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-1">Content (HTML):</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded h-32"
            required
          />
        </div>
        
        <button
          onClick={sendTestEmail}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
      </div>
      
      {trackingId && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Check Tracking Status</h2>
          <p className="mb-2">Tracking ID: {trackingId}</p>
          
          <button
            onClick={checkTrackingStatus}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>
          
          {trackingStatus && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <h3 className="font-semibold">Tracking Results:</h3>
              <p>Recipient: {trackingStatus.recipientEmail}</p>
              <p>Subject: {trackingStatus.subject}</p>
              <p>Opened: {trackingStatus.opened ? 'Yes' : 'No'}</p>
              <p>Open Count: {trackingStatus.openCount}</p>
              <p>First Opened: {trackingStatus.openedAt || 'N/A'}</p>
              <p>Sent At: {trackingStatus.sentAt}</p>
            </div>
          )}
        </div>
      )}
      
      <div>
        <h2 className="text-xl font-semibold mb-2">Email Stats</h2>
        <button
          onClick={() => router.push('/email-stats')}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          View Email Statistics
        </button>
      </div>
    </div>
  );
} 