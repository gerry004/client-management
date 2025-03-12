'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Sidebar from '@/components/Sidebar';

interface Segment {
  id: number;
  name: string;
}

interface EmailSequence {
  id: number;
  subject: string;
  content: string;
  delayDays: number;
  orderIndex: number;
}

interface Campaign {
  id: number;
  name: string;
  segmentId: number;
  segment: Segment;
  sequences: EmailSequence[];
}

interface User {
  name: string;
  email: string;
}

export default function CampaignsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUser();
    fetchCampaigns();
    fetchSegments();
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

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments');
      const data = await response.json();
      setSegments(data);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Email Campaigns</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>New Campaign</span>
          </button>
        </div>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center text-gray-400">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="text-center text-gray-400">No campaigns found</div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-[#2f2f2f] rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-white">{campaign.name}</h2>
                    <p className="text-gray-400">Segment: {campaign.segment.name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {/* Handle edit */}}
                      className="p-2 hover:bg-[#3f3f3f] rounded-lg text-gray-300 hover:text-white"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {/* Handle delete */}}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-white">Email Sequence</h3>
                  {campaign.sequences.map((sequence) => (
                    <div
                      key={sequence.id}
                      className="bg-[#393939] rounded-lg p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-white">{sequence.subject}</h4>
                        <span className="text-sm text-gray-400">
                          Delay: {sequence.delayDays} days
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {sequence.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Campaign Modal will be added here */}
      </div>
    </div>
  );
} 