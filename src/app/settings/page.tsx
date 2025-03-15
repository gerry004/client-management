"use client";

import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { FiMail, FiCheck } from "react-icons/fi";

interface User {
  name: string;
  email: string;
}

export default function SettingsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    checkGmailConnection();

    // Check for connection status after redirect back from Google
    const urlParams = new URLSearchParams(window.location.search);
    const gmailSuccess = urlParams.get("gmail_success");
    const gmailError = urlParams.get("gmail_error");

    if (gmailSuccess === "true") {
      setIsConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (gmailError) {
      setError(decodeURIComponent(gmailError));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkGmailConnection = async () => {
    try {
      const response = await fetch("/api/gmail/status");
      const data = await response.json();
      setIsConnected(data.connected);
    } catch (err) {
      console.error("Failed to check Gmail connection status:", err);
    }
  };

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch("/api/gmail/auth-url");
      const data = await response.json();

      if (data.url) {
        // Redirect to Google's OAuth page
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to initiate Gmail connection:", err);
      setIsConnecting(false);
      setError("Failed to connect to Gmail. Please try again.");
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      await fetch("/api/gmail/disconnect", { method: "POST" });
      setIsConnected(false);
    } catch (err) {
      console.error("Failed to disconnect Gmail:", err);
      setError("Failed to disconnect Gmail. Please try again.");
    }
  };

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Settings</h1>

        <div className="bg-[#191919] rounded-lg p-6">
          <div className="space-y-6">
            <div className="border-b border-[#2f2f2f] pb-4">
              <h3 className="text-lg font-medium text-white mb-4">
                Email Integration
              </h3>

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
                    className={`text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${
                      isConnecting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isConnecting ? "Connecting..." : "Connect"}
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-2 text-sm text-red-400">{error}</div>
              )}
            </div>

            <div className="text-gray-400 text-sm">
              <p>
                Connecting your Gmail account allows the system to send email
                campaigns directly from your address. Your credentials are
                securely stored and you can disconnect at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
