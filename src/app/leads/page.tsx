'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2 } from 'react-icons/fi';
import Modal from '@/components/Modal';
import Sidebar from '@/components/Sidebar';

interface Lead {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

interface SortConfig {
  field: keyof Lead;
  order: 'asc' | 'desc';
}

interface User {
  name: string;
  email: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'createdAt', order: 'desc' });
  const [newLead, setNewLead] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
  });
  const [user, setUser] = useState<User | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: keyof Lead;
    value: string;
  } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchLeads();
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

    fetchUser();
  }, [sortConfig]);

  const fetchLeads = async () => {
    try {
      const response = await fetch(
        `/api/leads?sortField=${sortConfig.field}&sortOrder=${sortConfig.order}`
      );
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof Lead) => {
    setSortConfig(current => ({
      field,
      order: current.field === field && current.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete lead');
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lead');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
      
      if (!response.ok) throw new Error('Failed to create lead');
      
      setIsModalOpen(false);
      setNewLead({ name: '', company: '', email: '', phone: '' });
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLead(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCellEdit = async (id: number, field: keyof Lead, value: string) => {
    if (field === 'createdAt') return; // Prevent editing createdAt
    
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      
      if (!response.ok) throw new Error('Failed to update lead');
      
      const updatedLead = await response.json();
      setLeads(current =>
        current.map(lead =>
          lead.id === id ? { ...lead, [field]: value } : lead
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setEditingCell(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Add Lead
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center text-gray-400">Loading...</div>
          ) : (
            <div className="bg-[#191919] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#2f2f2f]">
                  <tr>
                    {['Name', 'Company', 'Email', 'Phone', 'Created At', 'Actions'].map((header) => (
                      <th
                        key={header}
                        onClick={() => header !== 'Actions' && handleSort(header === 'Created At' ? 'createdAt' : header.toLowerCase() as keyof Lead)}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider ${
                          header !== 'Actions' ? 'cursor-pointer hover:text-white' : ''
                        }`}
                      >
                        {header}
                        {sortConfig.field === (header === 'Created At' ? 'createdAt' : header.toLowerCase()) && (
                          <span className="ml-1">
                            {sortConfig.order === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2f2f2f]">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#2f2f2f]">
                      {['name', 'company', 'email', 'phone', 'createdAt'].map((field) => (
                        <td
                          key={field}
                          className="px-6 py-4 whitespace-nowrap text-gray-300"
                          onClick={() => {
                            if (field !== 'createdAt') {
                              setEditingCell({
                                id: lead.id,
                                field: field as keyof Lead,
                                value: String(lead[field as keyof Lead] || '')
                              });
                            }
                          }}
                        >
                          {editingCell?.id === lead.id && editingCell?.field === field ? (
                            <input
                              type={field === 'email' ? 'email' : 'text'}
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({
                                ...editingCell,
                                value: e.target.value
                              })}
                              onBlur={() => handleCellEdit(lead.id, field as keyof Lead, editingCell.value)}
                              className="w-full bg-[#2f2f2f] text-white px-2 py-1 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                              autoFocus
                            />
                          ) : (
                            <div className="cursor-pointer">
                              {field === 'createdAt'
                                ? new Date(lead[field]).toLocaleDateString()
                                : lead[field as keyof Lead] || '-'}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="text-red-400 hover:text-red-500"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Lead"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={newLead.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#2f2f2f] rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={newLead.company}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#2f2f2f] rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={newLead.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#2f2f2f] rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={newLead.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#2f2f2f] rounded-md border border-gray-700 focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
