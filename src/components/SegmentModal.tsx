import { useState, useEffect } from 'react';
import Modal from './Modal';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

interface Segment {
  id: number;
  name: string;
}

interface SegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  onUpdate: (id: number, name: string) => void;
  onDelete: (id: number) => void;
  segments: Segment[];
}

export default function SegmentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onUpdate, 
  onDelete, 
  segments 
}: SegmentModalProps) {
  const [name, setName] = useState('');
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  useEffect(() => {
    if (editingSegment) {
      setName(editingSegment.name);
    } else {
      setName('');
    }
  }, [editingSegment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSegment) {
      onUpdate(editingSegment.id, name);
      setEditingSegment(null);
    } else {
      onSubmit(name);
    }
    setName('');
  };

  const handleCancelEdit = () => {
    setEditingSegment(null);
    setName('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Segments">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            {editingSegment ? 'Edit Segment Name' : 'Add New Segment'}
          </label>
          <div className="flex mt-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-md bg-[#2d2d2d] border-gray-600 text-white"
              required
            />
            <button
              type="submit"
              className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingSegment ? 'Update' : 'Add'}
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

        <div className="mt-6">
          <h3 className="text-lg font-medium text-white mb-3">Existing Segments</h3>
          {segments.length === 0 ? (
            <p className="text-gray-400">No segments found. Add your first segment above.</p>
          ) : (
            <div className="bg-[#252525] rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-600">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {segments.map((segment) => (
                    <tr key={segment.id}>
                      <td className="px-4 py-2 text-sm text-white">{segment.name}</td>
                      <td className="px-4 py-2 text-sm text-white text-right">
                        <button
                          type="button"
                          onClick={() => setEditingSegment(segment)}
                          className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-700 mr-2"
                          title="Edit Segment"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(segment.id)}
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
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </form>
    </Modal>
  );
} 