'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import LeadModal from '@/components/LeadModal';
import SegmentModal from '@/components/SegmentModal';
import EmailEditorModal from '@/components/EmailEditorModal';
import ImportCSVModal from '@/components/ImportCSVModal';
import { FiMail, FiEdit2, FiTrash2, FiClock } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';

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
  const { 
    user, 
    segments, 
    leads, 
    refreshLeads,
    addLead,
    updateLead,
    deleteLead,
    addSegment,
    updateSegment,
    deleteSegment
  } = useAppContext();
  
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const router = useRouter();

  const memoizedUnreadCounts = useMemo(() => {
    return leads
      .map(lead => lead.email)
      .filter((email): email is string => Boolean(email));
  }, [leads]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      if (memoizedUnreadCounts.length === 0) return;

      const response = await fetch('/api/email/unread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: memoizedUnreadCounts }),
      });

      if (!response.ok) throw new Error('Failed to fetch unread counts');
      const data = await response.json();
      setUnreadCounts(data);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  }, [memoizedUnreadCounts]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  const handleAddLead = async (data: Omit<Lead, 'id'>) => {
    const success = await addLead(data);
    if (success) {
      setIsLeadModalOpen(false);
    } else {
      alert('Failed to add lead. Please try again.');
    }
  };

  const handleUpdateLead = async (data: Omit<Lead, 'id'>) => {
    if (!editingLead) return;
    
    const updateData = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      segmentId: data.segmentId,
    };
    
    const success = await updateLead(editingLead.id, updateData);
    if (success) {
      setEditingLead(null);
      setIsLeadModalOpen(false);
    } else {
      alert('Failed to update lead. Please try again.');
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    await deleteLead(id);
  };

  const handleAddSegment = async (name: string) => {
    await addSegment(name);
  };

  const handleUpdateSegment = async (id: number, name: string) => {
    await updateSegment(id, name);
  };

  const handleDeleteSegment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this segment? This may affect leads assigned to this segment.')) return;
    
    await deleteSegment(id);
  };

  const handleViewEmailHistory = (lead: Lead) => {
    if (!lead.email) {
      alert('This lead has no email address');
      return;
    }
    router.push(`/email-history/${encodeURIComponent(lead.email)}`);
  };

  const handleImportLeads = async (mappedData: any[]) => {
    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: mappedData }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to import leads');
      }
      
      await refreshLeads();
      return true;
    } catch (error) {
      console.error('Error importing leads:', error);
      return false;
    }
  };
  
  const leadFields = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'segmentId', label: 'Segment ID' },
  ];

  const handleExportCSV = () => {
    // Convert leads to CSV format
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Segment'];
    
    const csvRows = [
      headers.join(','), // Header row
      ...leads.map(lead => [
        // Escape values that might contain commas
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.company ? lead.company.replace(/"/g, '""') : ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.segment?.name || ''}"`,
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set up download attributes
    link.setAttribute('href', url);
    link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    // Append to document, trigger download and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <div className="space-x-4">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Import CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Export CSV
            </button>
            <button
              onClick={() => setIsSegmentModalOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Manage Segments
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
                  <td className="px-6 py-4 text-sm text-white space-x-3 flex items-center">
                    <div className="flex space-x-3">
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
                      <button
                        onClick={() => handleViewEmailHistory(lead)}
                        className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-gray-700"
                        title="View Email History"
                      >
                        <FiClock size={18} />
                      </button>
                    </div>
                    {lead.email && unreadCounts[lead.email] > 0 && (
                      <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                        {unreadCounts[lead.email]}
                      </span>
                    )}
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
          onUpdate={handleUpdateSegment}
          onDelete={handleDeleteSegment}
          segments={segments}
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
        
        <ImportCSVModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportLeads}
          fields={leadFields}
        />
      </div>
    </div>
  );
}