'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
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
  createdAt: Date | string;
}

interface User {
  name: string;
  email: string;
}

interface CreateCampaignForm {
  name: string;
  segmentId: number;
  sequences: {
    subject: string;
    content: string;
    delayDays: number;
    orderIndex: number;
  }[];
}

interface EditCampaignForm extends CreateCampaignForm {
  id: number;
}

function CreateCampaignModal({ 
  isOpen, 
  onClose, 
  segments, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  segments: Segment[];
  onSubmit: (data: CreateCampaignForm) => Promise<void>;
}) {
  const [formData, setFormData] = useState<CreateCampaignForm>({
    name: '',
    segmentId: segments[0]?.id || 0,
    sequences: [{ subject: '', content: '', delayDays: 0, orderIndex: 0 }]
  });

  if (!isOpen) return null;

  const addSequence = () => {
    setFormData(prev => ({
      ...prev,
      sequences: [
        ...prev.sequences,
        {
          subject: '',
          content: '',
          delayDays: 0,
          orderIndex: prev.sequences.length
        }
      ]
    }));
  };

  const removeSequence = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sequences: prev.sequences.filter((_, i) => i !== index)
    }));
  };

  const updateSequence = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sequences: prev.sequences.map((seq, i) => 
        i === index ? { ...seq, [field]: value } : seq
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#2f2f2f] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(formData);
          onClose();
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Segment
              </label>
              <select
                value={formData.segmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, segmentId: Number(e.target.value) }))}
                className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
                required
              >
                {segments.map(segment => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Email Sequence</h3>
                <button
                  type="button"
                  onClick={addSequence}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Add Email
                </button>
              </div>

              {formData.sequences.map((sequence, index) => (
                <div key={index} className="bg-[#393939] rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-white">Email {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSequence(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={sequence.subject}
                        onChange={(e) => updateSequence(index, 'subject', e.target.value)}
                        className="w-full bg-[#4a4a4a] text-white rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Content
                      </label>
                      <textarea
                        value={sequence.content}
                        onChange={(e) => updateSequence(index, 'content', e.target.value)}
                        className="w-full bg-[#4a4a4a] text-white rounded-lg px-3 py-2 h-32"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Delay (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={sequence.delayDays}
                        onChange={(e) => updateSequence(index, 'delayDays', parseInt(e.target.value))}
                        className="w-full bg-[#4a4a4a] text-white rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCampaignModal({ 
  isOpen, 
  onClose, 
  segments, 
  campaign,
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  segments: Segment[];
  campaign: Campaign;
  onSubmit: (data: EditCampaignForm) => Promise<void>;
}) {
  const [formData, setFormData] = useState<EditCampaignForm>(() => ({
    id: campaign.id,
    name: campaign.name,
    segmentId: campaign.segmentId,
    sequences: campaign.sequences.map(seq => ({
      subject: seq.subject,
      content: seq.content,
      delayDays: seq.delayDays,
      orderIndex: seq.orderIndex
    }))
  }));

  if (!isOpen) return null;

  const addSequence = () => {
    setFormData(prev => ({
      ...prev,
      sequences: [
        ...prev.sequences,
        {
          subject: '',
          content: '',
          delayDays: 0,
          orderIndex: prev.sequences.length
        }
      ]
    }));
  };

  const removeSequence = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sequences: prev.sequences.filter((_, i) => i !== index)
    }));
  };

  const updateSequence = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sequences: prev.sequences.map((seq, i) => 
        i === index ? { ...seq, [field]: value } : seq
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#2f2f2f] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(formData);
          onClose();
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Segment
              </label>
              <select
                value={formData.segmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, segmentId: Number(e.target.value) }))}
                className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
                required
              >
                {segments.map(segment => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Email Sequence</h3>
                <button
                  type="button"
                  onClick={addSequence}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Add Email
                </button>
              </div>

              {formData.sequences.map((sequence, index) => (
                <div key={index} className="bg-[#393939] rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-white">Email {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSequence(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={sequence.subject}
                        onChange={(e) => updateSequence(index, 'subject', e.target.value)}
                        className="w-full bg-[#4a4a4a] text-white rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Content
                      </label>
                      <textarea
                        value={sequence.content}
                        onChange={(e) => updateSequence(index, 'content', e.target.value)}
                        className="w-full bg-[#4a4a4a] text-white rounded-lg px-3 py-2 h-32"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Delay (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={sequence.delayDays}
                        onChange={(e) => updateSequence(index, 'delayDays', parseInt(e.target.value))}
                        className="w-full bg-[#4a4a4a] text-white rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Update Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

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

  const handleCreateCampaign = async (formData: CreateCampaignForm) => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      await fetchCampaigns();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating campaign:', error);
      // You might want to add error handling UI here
    }
  };

  const handleEditCampaign = async (formData: EditCampaignForm) => {
    try {
      const response = await fetch(`/api/campaigns/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }

      await fetchCampaigns();
      setEditingCampaign(null);
    } catch (error) {
      console.error('Error updating campaign:', error);
      // Add error handling UI here
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete campaign');
      }

      await fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      // Add error handling UI here
    }
  };

  const sortedCampaigns = useMemo(() => {
    return campaigns.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [campaigns]);

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
            sortedCampaigns.map((campaign) => (
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
                      onClick={() => setEditingCampaign(campaign)}
                      className="p-2 hover:bg-[#3f3f3f] rounded-lg text-gray-300 hover:text-white"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
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

        {isCreateModalOpen && (
          <CreateCampaignModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            segments={segments}
            onSubmit={handleCreateCampaign}
          />
        )}

        {editingCampaign && (
          <EditCampaignModal
            isOpen={true}
            onClose={() => setEditingCampaign(null)}
            segments={segments}
            campaign={editingCampaign}
            onSubmit={handleEditCampaign}
          />
        )}
      </div>
    </div>
  );
} 