'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import LeadModal from '@/components/LeadModal';
import EmailEditorModal from '@/components/EmailEditorModal';
import ImportCSVModal from '@/components/ImportCSVModal';
import { FiMail, FiEdit2, FiTrash2, FiClock, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';

interface Lead {
  id: number;
  name: string;
  website?: string;
  mapsLink?: string;
  email?: string;
  phone?: string;
  searchTerm?: string;
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
    leadsPage,
    leadsPerPage,
    totalLeads,
    setLeadsPage,
    leadsSortField,
    leadsSortOrder,
    setLeadsSortField,
    setLeadsSortOrder
  } = useAppContext();
  
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
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

  const handleAddLead = async (data: any) => {
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
      website: data.website,
      mapsLink: data.mapsLink,
      email: data.email,
      phone: data.phone,
      searchTerm: data.searchTerm,
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
    { key: 'website', label: 'Website' },
    { key: 'mapsLink', label: 'Maps Link' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'searchTerm', label: 'Search Term' },
    { key: 'segment', label: 'Segment' },
  ];

  const handleExportCSV = () => {
    // Convert leads to CSV format
    const headers = ['Name', 'Website', 'Maps Link', 'Email', 'Phone', 'Search Term', 'Segment'];
    
    const csvRows = [
      headers.join(','), // Header row
      ...leads.map(lead => [
        // Escape values that might contain commas
        `"${lead.name.replace(/"/g, '""')}"`,
        `"${lead.website ? lead.website.replace(/"/g, '""') : ''}"`,
        `"${lead.mapsLink ? lead.mapsLink.replace(/"/g, '""') : ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.searchTerm ? lead.searchTerm.replace(/"/g, '""') : ''}"`,
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

  const totalPages = Math.ceil(totalLeads / leadsPerPage);
  
  const goToNextPage = () => {
    if (leadsPage < totalPages) {
      setLeadsPage(leadsPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (leadsPage > 1) {
      setLeadsPage(leadsPage - 1);
    }
  };
  
  const goToPage = (pageNumber: number) => {
    setLeadsPage(pageNumber);
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const maxPageButtons = 5;
    
    let startPage = Math.max(1, leadsPage - Math.floor(maxPageButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    const startItem = (leadsPage - 1) * leadsPerPage + 1;
    const endItem = Math.min(leadsPage * leadsPerPage, totalLeads);
    
    return (
      <div className="flex justify-between items-center mt-4 text-white">
        <div>
          Showing {startItem}-{endItem} of {totalLeads} leads
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={goToPreviousPage} 
            disabled={leadsPage === 1}
            className={`p-2 rounded ${leadsPage === 1 ? 'text-gray-500' : 'hover:bg-gray-700'}`}
          >
            <FiChevronLeft />
          </button>
          
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => goToPage(number)}
              className={`px-3 py-1 rounded ${
                leadsPage === number 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-gray-700'
              }`}
            >
              {number}
            </button>
          ))}
          
          <button 
            onClick={goToNextPage} 
            disabled={leadsPage === totalPages}
            className={`p-2 rounded ${leadsPage === totalPages ? 'text-gray-500' : 'hover:bg-gray-700'}`}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    );
  };

  // Load sort state from localStorage on component mount and refresh leads with it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSortField = localStorage.getItem('leadsSortField');
      const savedSortOrder = localStorage.getItem('leadsSortOrder') as 'asc' | 'desc' | null;
      
      let shouldRefresh = false;
      
      if (savedSortField && savedSortField !== leadsSortField) {
        setLeadsSortField(savedSortField);
        shouldRefresh = true;
      }
      
      if (savedSortOrder && savedSortOrder !== leadsSortOrder) {
        setLeadsSortOrder(savedSortOrder);
        shouldRefresh = true;
      }
      
      // If we changed the sort settings, refresh the leads
      if (shouldRefresh) {
        refreshLeads();
      }
    }
  }, [leadsSortField, leadsSortOrder, refreshLeads]);

  const handleSort = (field: string) => {
    const newOrder = field === leadsSortField && leadsSortOrder === 'asc' ? 'desc' : 'asc';
    setLeadsSortField(field);
    setLeadsSortOrder(newOrder);
    
    // Save sort preferences to localStorage
    localStorage.setItem('leadsSortField', field);
    localStorage.setItem('leadsSortOrder', newOrder);
  };
  
  const renderSortIndicator = (field: string) => {
    if (field !== leadsSortField) return null;
    
    return leadsSortOrder === 'asc' 
      ? <FiChevronUp className="inline ml-1" /> 
      : <FiChevronDown className="inline ml-1" />;
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
              onClick={() => router.push('/segments')}
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('name')}
                >
                  Name {renderSortIndicator('name')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('website')}
                >
                  Website {renderSortIndicator('website')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('mapsLink')}
                >
                  Maps Link {renderSortIndicator('mapsLink')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('email')}
                >
                  Email {renderSortIndicator('email')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('phone')}
                >
                  Phone {renderSortIndicator('phone')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('searchTerm')}
                >
                  Search Term {renderSortIndicator('searchTerm')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('segmentId')}
                >
                  Segment {renderSortIndicator('segmentId')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-6 py-4 text-sm text-white">{lead.name}</td>
                  <td className="px-6 py-4 text-sm text-white">
                    {lead.website ? (
                      <a 
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {lead.website}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {lead.mapsLink ? (
                      <a 
                        href={lead.mapsLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {lead.mapsLink}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{lead.email || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white">{lead.phone || '-'}</td>
                  <td className="px-6 py-4 text-sm text-white">{lead.searchTerm || '-'}</td>
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
        
        {renderPagination()}

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