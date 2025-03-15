import { useState, useEffect } from 'react';
import { FiMail, FiCheck, FiX } from 'react-icons/fi';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if Gmail is already connected when modal opens
    if (isOpen) {
      checkGmailConnection();
    }
  }, [isOpen]);

  // Check for connection status after redirect back from Google
  useEffect(() => {
    const gmailSuccess = searchParams.get('gmail_success');
    const gmailError = searchParams.get('gmail_error');
    
    if (gmailSuccess === 'true') {
      setIsConnected(true);
      // Clean up URL
      const newUrl = pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (gmailError) {
      setError(decodeURIComponent(gmailError));
      // Clean up URL
      const newUrl = pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, pathname]);

  const checkGmailConnection = async () => {
    try {
      const response = await fetch('/api/gmail/status');
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error('Failed to check Gmail connection status:', err);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gmail/auth-url');
      const data = await response.json();
      
      if (data.url) {
        // Redirect to Google's OAuth page
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to initiate Gmail connection:', err);
      setIsConnecting(false);
      setError('Failed to connect to Gmail. Please try again.');
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await fetch('/api/gmail/disconnect', { method: 'POST' });
      setIsConnected(false);
    } catch (err) {
      console.error('Failed to disconnect Gmail:', err);
      setError('Failed to disconnect Gmail. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-x-0 bottom-0 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="bg-[#191919] rounded-t-lg p-6 w-full max-w-md mx-auto shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="border-b border-[#2f2f2f] pb-4">
            <h3 className="text-lg font-medium text-white mb-4">Email Integration</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Gmail Connection</span>
              </div>
              
              {isConnected ? (
                <div className="flex items-center">
                  <span className="text-green-400 flex items-center mr-3">
                    <FiCheck className="w-4 h-4 mr-1" />
                    Connected
                  </span>
                  <button
                    onClick={handleDisconnectGmail}
                    className="text-sm px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGmail}
                  disabled={isConnecting}
                  className={`text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
            
            {error && (
              <div className="mt-2 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>
          
          <div className="text-gray-400 text-sm">
            <p>
              Connecting your Gmail account allows the system to send email campaigns
              directly from your address. Your credentials are securely stored and
              you can disconnect at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 