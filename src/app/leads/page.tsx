'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiUsers, FiHome, FiLogOut, FiTrash2, FiSettings } from 'react-icons/fi';
import Modal from '@/components/Modal';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      {/* Sidebar */}
      <div className="w-64 bg-[#191919] p-4 flex flex-col h-full">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">CRM System</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <Link 
            href="/dashboard" 
            className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:bg-[#2f2f2f] hover:text-white"
          >
            <FiHome className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/leads" 
            className="flex items-center space-x-2 p-2 rounded-lg bg-[#2f2f2f] text-white"
          >
            <FiUsers className="w-5 h-5" />
            <span>Leads</span>
          </Link>
        </nav>

        {/* User Info */}
        {user && (
          <div className="border-t border-[#2f2f2f] pt-4 mb-4">
            <div className="text-gray-300 px-2">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-gray-400">{user.email}</div>
            </div>
          </div>
        )}

        {/* Bottom Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:bg-[#2f2f2f] hover:text-white w-full"
          >
            <FiSettings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 w-full"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

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
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{lead.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{lead.company || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{lead.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">{lead.phone || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
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

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
      >
        <div className="text-gray-300">
          {/* Settings content will go here */}
          <p>Settings coming soon...</p>
        </div>
      </Modal>
    </div>
  );
}
