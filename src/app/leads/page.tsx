'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiUsers, FiHome, FiLogOut } from 'react-icons/fi';

interface Lead {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
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
      <div className="w-64 bg-[#191919] p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">CRM System</h1>
        </div>
        <nav className="space-y-2">
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
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:bg-[#2f2f2f] hover:text-white w-full"
          >
            <FiLogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
