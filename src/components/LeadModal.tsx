import { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';

interface Segment {
  id: number;
  name: string;
}

interface LeadFormData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  segmentId?: number;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => void;
  initialData?: LeadFormData;
  segments: Segment[];
}

export default function LeadModal({ isOpen, onClose, onSubmit, initialData, segments }: LeadModalProps) {
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    segmentId: undefined,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        company: initialData.company || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        segmentId: initialData.segmentId,
      });
    } else {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        segmentId: undefined,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const sortedSegments = useMemo(() => {
    return segments.sort((a, b) => a.name.localeCompare(b.name));
  }, [segments]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Lead" : "Add Lead"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md bg-[#2d2d2d] border-gray-600 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Company</label>
          <input
            type="text"
            value={formData.company || ''}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="mt-1 block w-full rounded-md bg-[#2d2d2d] border-gray-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md bg-[#2d2d2d] border-gray-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Phone</label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="mt-1 block w-full rounded-md bg-[#2d2d2d] border-gray-600 text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Segment</label>
          <select
            value={formData.segmentId || ''}
            onChange={(e) => setFormData({ ...formData, segmentId: Number(e.target.value) || undefined })}
            className="mt-1 block w-full rounded-md bg-[#2d2d2d] border-gray-600 text-white"
          >
            <option value="">Select a segment</option>
            {sortedSegments.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {initialData ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
} 