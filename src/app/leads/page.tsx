'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiTrash2 } from 'react-icons/fi';
import Modal from '@/components/Modal';
import Sidebar from '@/components/Sidebar';
import TagDropdown from '@/components/TagDropdown';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Lead {
  id: number;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  tagId: number | null;
  tag: Tag | null;
}

interface SortConfig {
  field: keyof Lead;
  order: 'asc' | 'desc';
}

interface User {
  name: string;
  email: string;
}

function EditableCell({ 
  value, 
  onChange, 
  onBlur 
}: { 
  value: string; 
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative -m-2">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-1.5 bg-[#3f3f3f] border border-blue-500 rounded outline-none text-white shadow-sm"
      />
    </div>
  );
}

function TagCell({ 
  lead, 
  isEditing, 
  onEdit, 
  tags, 
  handleCellEdit, 
  handleCreateTag,
  handleDeleteTag,
  setEditingCell 
}: {
  lead: Lead;
  isEditing: boolean;
  onEdit: () => void;
  tags: Tag[];
  handleCellEdit: (id: number, field: keyof Lead, value: string | number) => void;
  handleCreateTag: (name: string) => Promise<Tag | null>;
  handleDeleteTag: (tagId: number) => Promise<void>;
  setEditingCell: (cell: { id: number; field: keyof Lead; value: string; } | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setEditingCell(null);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing, setEditingCell]);

  return (
    <div ref={containerRef} className="relative w-48">
      {isEditing ? (
        <TagDropdown
          tags={tags}
          selectedTag={lead.tag}
          onSelect={(tag) => {
            handleCellEdit(lead.id, 'tagId', tag.id);
          }}
          onCreateTag={async (name) => {
            const newTag = await handleCreateTag(name);
            if (newTag) {
              handleCellEdit(lead.id, 'tagId', newTag.id);
            }
          }}
          onDeleteTag={handleDeleteTag}
        />
      ) : (
        <div className="cursor-pointer" onClick={onEdit}>
          {lead.tag ? (
            <span
              className="px-2 py-1 rounded text-sm"
              style={{ backgroundColor: lead.tag.color + '20', color: lead.tag.color }}
            >
              {lead.tag.name}
            </span>
          ) : '-'}
        </div>
      )}
    </div>
  );
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
    tagId: null as number | null,
  });
  const [user, setUser] = useState<User | null>(null);
  const [editingCell, setEditingCell] = useState<{
    id: number;
    field: keyof Lead;
    value: string;
  } | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedModalTag, setSelectedModalTag] = useState<Tag | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetchLeads();
    fetchTags();
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
        setTagSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      setTags(data);
    } catch (err) {
      console.error('Error fetching tags:', err);
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
      setNewLead({ name: '', company: '', email: '', phone: '', tagId: null });
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLead(prev => ({ ...prev, [name]: value }));
  };

  const handleCellEdit = async (id: number, field: keyof Lead, value: string | number) => {
    if (field === 'createdAt') return;
    
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: field === 'tagId' ? Number(value) || null : value }),
      });
      
      if (!response.ok) throw new Error('Failed to update lead');
      
      await fetchLeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    } finally {
      setEditingCell(null);
    }
  };

  const handleCreateTag = async (name: string) => {
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color: '#3B82F6' }),
      });
      
      if (!response.ok) throw new Error('Failed to create tag');
      
      const newTag = await response.json();
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
      return null;
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete tag');
      
      setTags(prev => prev.filter(tag => tag.id !== tagId));
      setLeads(prev => prev.map(lead => 
        lead.tagId === tagId ? { ...lead, tagId: null, tag: null } : lead
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tag');
    }
  };

  const renderCell = (lead: Lead, field: keyof Lead) => {
    const isEditing = editingCell?.id === lead.id && editingCell?.field === field;

    if (field === 'tagId') {
      return (
        <TagCell
          lead={lead}
          isEditing={isEditing}
          onEdit={() => {
            setEditingCell({
              id: lead.id,
              field: 'tagId',
              value: String(lead.tagId || '')
            });
          }}
          tags={tags}
          handleCellEdit={handleCellEdit}
          handleCreateTag={handleCreateTag}
          handleDeleteTag={handleDeleteTag}
          setEditingCell={setEditingCell}
        />
      );
    }

    if (field === 'createdAt') {
      return new Date(lead[field]).toLocaleDateString();
    }

    return isEditing ? (
      <EditableCell
        value={editingCell.value}
        onChange={(value) => {
          setEditingCell(prev => prev ? { ...prev, value } : null);
        }}
        onBlur={() => {
          if (editingCell) {
            handleCellEdit(lead.id, field, editingCell.value);
          }
        }}
      />
    ) : (
      <div
        className="cursor-pointer"
        onClick={() => {
          setEditingCell({
            id: lead.id,
            field,
            value: String(lead[field] || '')
          });
        }}
      >
        {lead[field]?.toString() || '-'}
      </div>
    );
  };

  const headers = ['Name', 'Company', 'Email', 'Phone', 'Tag', 'Created At', 'Actions'];

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Leads</h1>
            <div className="space-x-3">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Add Lead
              </button>
            </div>
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
                    {headers.map((header) => (
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
                      {['name', 'company', 'email', 'phone', 'tagId', 'createdAt'].map((field) => (
                        <td
                          key={field}
                          className="px-6 py-4 whitespace-nowrap text-gray-300"
                        >
                          {renderCell(lead, field as keyof Lead)}
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
        onClose={() => {
          setIsModalOpen(false);
          setSelectedModalTag(null);
          setTagSearch('');
          setNewLead({
            name: '',
            company: '',
            email: '',
            phone: '',
            tagId: null,
          });
        }}
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
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tag
            </label>
            <TagDropdown
              tags={tags}
              selectedTag={selectedModalTag}
              onSelect={(tag: Tag) => {
                setNewLead(prev => ({ ...prev, tagId: tag.id }));
                setSelectedModalTag(tag);
              }}
              onCreateTag={async (name: string) => {
                const newTag = await handleCreateTag(name);
                if (newTag) {
                  setNewLead(prev => ({ ...prev, tagId: newTag.id }));
                  setSelectedModalTag(newTag);
                }
              }}
              onDeleteTag={handleDeleteTag}
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
