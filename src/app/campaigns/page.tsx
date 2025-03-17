'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Sidebar from '@/components/Sidebar';
import { useAppContext } from '@/contexts/AppContext';
import CreateCampaignModal from '@/components/CreateCampaignModal';
import EditCampaignModal from '@/components/EditCampaignModal';
import { CreateCampaignForm } from '@/components/CreateCampaignModal';
import { EditCampaignForm } from '@/components/EditCampaignModal';

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
  segmentId: number | null;
  segment?: Segment;
  sequences: EmailSequence[];
  createdAt: Date | string;
}

export default function CampaignsPage() {
  const { 
    user, 
    segments, 
    campaigns, 
    refreshCampaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    isLoading: contextIsLoading
  } = useAppContext();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    refreshCampaigns();
  }, [refreshCampaigns]);

  const handleCreateCampaign = async (formData: CreateCampaignForm) => {
    try {
      setIsLoading(true);
      const success = await addCampaign(formData);
      if (success) {
        setIsCreateModalOpen(false);
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      // You might want to add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCampaign = async (formData: EditCampaignForm) => {
    try {
      setIsLoading(true);
      const success = await updateCampaign(formData.id, formData);
      if (success) {
        setEditingCampaign(null);
      } else {
        throw new Error('Failed to update campaign');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      // Add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteCampaign(campaignId);
    } catch (error) {
      console.error('Error deleting campaign:', error);
      // Add error handling UI here
    } finally {
      setIsLoading(false);
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
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Campaign</span>
          </button>
        </div>

        <div className="space-y-6">
          {contextIsLoading || isLoading ? (
            <p className="text-gray-400">Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <div className="bg-[#252525] rounded-lg p-6 text-center">
              <p className="text-gray-400">No campaigns found. Create your first campaign to get started.</p>
            </div>
          ) : (
            campaigns.map(campaign => (
              <div key={campaign.id} className="bg-[#252525] rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{campaign.name}</h2>
                    <p className="text-gray-400 text-sm">
                      Segment: {campaign.segment?.name || 'No segment'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Created: {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingCampaign(campaign)}
                      className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-700"
                      title="Edit Campaign"
                    >
                      <FiEdit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700"
                      title="Delete Campaign"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium text-white mb-3">Email Sequence</h3>
                  <div className="space-y-3">
                    {campaign.sequences.map((sequence, index) => (
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