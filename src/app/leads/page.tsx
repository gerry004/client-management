'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import LeadModal from '@/components/LeadModal';
import SegmentModal from '@/components/SegmentModal';
import EmailEditorModal from '@/components/EmailEditorModal';
import { FiMail, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface User {
  name: string;
  email: string;
}

interface Lead {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  segment?: Segment;
  segmentId?: number;
}

interface Segment {
  id: number;
  name: string;
}

export default function LeadsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchUser();
    fetchLeads();
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

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments');
      if (!response.ok) throw new Error('Failed to fetch segments');
      const data = await response.json();
      setSegments(data);
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  const handleAddLead = async (data: Omit<Lead, 'id'>) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add lead');
      fetchLeads();
    } catch (err) {
      console.error('Error adding lead:', err);
    }
  };

  const handleUpdateLead = async (data: Omit<Lead, 'id'>) => {
    if (!editingLead) return;
    try {
      const updateData = {
        name: data.name,
        company: data.company,
        email: data.email,
        phone: data.phone,
        segmentId: data.segmentId,
      };

      const response = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead');
      }
      
      fetchLeads();
      setEditingLead(null);
      setIsLeadModalOpen(false);
    } catch (err) {
      console.error('Error updating lead:', err);
      alert('Failed to update lead. Please try again.');
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete lead');
      fetchLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const handleAddSegment = async (name: string) => {
    try {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to add segment');
      fetchSegments();
    } catch (err) {
      console.error('Error adding segment:', err);
    }
  };

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <div className="space-x-4">
            <button
              onClick={() => setIsSegmentModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Segment
            </button>
            <button
              onClick={() => setIsLeadModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add Lead
            </button>
          </div>
        </div>

        <div className="bg-[#2d2d2d] rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-[#252525]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Segment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 text-sm text-white">{lead.name}</td>
                  <td className="px-6 py-4 text-sm text-white">{lead.company || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white">{lead.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white">{lead.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white">{lead.segment?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white space-x-3">
                    <button
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsEmailModalOpen(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-700"
                      title="Send Email"
                    >
                      <FiMail size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingLead(lead);
                        setIsLeadModalOpen(true);
                      }}
                      className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-700"
                      title="Edit Lead"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteLead(lead.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700"
                      title="Delete Lead"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => {
            setIsLeadModalOpen(false);
            setEditingLead(null);
          }}
          onSubmit={editingLead ? handleUpdateLead : handleAddLead}
          initialData={editingLead || undefined}
          segments={segments}
        />

        <SegmentModal
          isOpen={isSegmentModalOpen}
          onClose={() => setIsSegmentModalOpen(false)}
          onSubmit={handleAddSegment}
        />

        <EmailEditorModal
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            setSelectedLead(null);
          }}
          recipientEmail={selectedLead?.email || ''}
          recipientName={selectedLead?.name || ''}
        />
      </div>
    </div>
  );
}