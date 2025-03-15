"use client";

import { useState, useEffect } from "react";
import { Segment } from "@prisma/client";
import Sidebar from "@/components/Sidebar";

interface User {
  name: string;
  email: string;
}

export default function BulkEmailsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
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
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      const response = await fetch("/api/segments");
      const data = await response.json();
      setSegments(data);
    } catch (error) {
      console.error("Error fetching segments:", error);
    }
  };

  const handleSendEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegment || !subject || !content) {
      alert("Please fill in all fields");
      return;
    }

    try {
      setSending(true);
      const response = await fetch("/api/bulk-email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          segmentId: selectedSegment,
          subject,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send emails");
      }

      const result = await response.json();
      alert(`Successfully queued ${result.count} emails for sending!`);

      // Reset form
      setSelectedSegment("");
      setSubject("");
      setContent("");
    } catch (error) {
      console.error("Error sending bulk emails:", error);
      alert("Failed to send emails. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex flex-col ml-auto mr-auto p-6 w-1/2">
        <h1 className="text-2xl font-bold mb-6">Bulk Emails</h1>

        <form onSubmit={handleSendEmails} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Segment
            </label>
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              className="w-full p-2 border rounded-lg bg-[#2f2f2f] border-gray-600"
              required
            >
              <option value="">Select a segment...</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 border rounded-lg bg-[#2f2f2f] border-gray-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full p-2 border rounded-lg bg-[#2f2f2f] border-gray-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Bulk Emails"}
          </button>
        </form>
      </div>
    </div>
  );
}
