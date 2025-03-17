'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiArrowLeft } from 'react-icons/fi';
import Sidebar from '@/components/Sidebar';
import { useAppContext } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';

export default function SegmentsPage() {
  const { 
    user, 
    segments, 
    addSegment, 
    updateSegment, 
    deleteSegment 
  } = useAppContext();
  
  const [name, setName] = useState('');
  const [editingSegment, setEditingSegment] = useState<{ id: number; name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (editingSegment) {
      setName(editingSegment.name);
    } else {
      setName('');
    }
  }, [editingSegment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSegment) {
      await updateSegment(editingSegment.id, name);
      setEditingSegment(null);
    } else {
      await addSegment(name);
    }
    
    setName('');
  };

  const handleCancelEdit = () => {
    setEditingSegment(null);
    setName('');
  };

  const handleDeleteSegment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this segment? This may affect leads assigned to this segment.')) return;
    
    await deleteSegment(id);
  };

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.push('/leads')}
            className="mr-4 text-white hover:text-blue-400"
            title="Back to Leads"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Manage Segments</h1>
        </div>

        <div className="bg-[#2d2d2d] rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {editingSegment ? 'Edit Segment Name' : 'Add New Segment'}
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md bg-[#3d3d3d] border-gray-600 text-white"
                  placeholder="Enter segment name"
                  required
                />
                <button
                  type="submit"
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                >
                  {editingSegment ? 'Update' : 'Add'} 
                  {!editingSegment && <FiPlus className="ml-1" />}
                </button>
                {editingSegment && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="bg-[#2d2d2d] rounded-lg overflow-hidden">
          <div className="p-4 bg-[#252525]">
            <h3 className="text-lg font-medium text-white">Existing Segments</h3>
          </div>
          
          {segments.length === 0 ? (
            <div className="p-6 text-gray-400">
              No segments found. Add your first segment above.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-[#252525]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {segments.map((segment) => (
                  <tr key={segment.id}>
                    <td className="px-6 py-4 text-sm text-white">{segment.name}</td>
                    <td className="px-6 py-4 text-sm text-white text-right">
                      <button
                        onClick={() => setEditingSegment(segment)}
                        className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-700 mr-2"
                        title="Edit Segment"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSegment(segment.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700"
                        title="Delete Segment"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
} 