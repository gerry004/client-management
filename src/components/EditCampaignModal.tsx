import { useState } from 'react';
import { FiTrash2, FiX } from 'react-icons/fi';
import { CreateCampaignForm } from './CreateCampaignModal';

interface Segment {
  id: number;
  name: string;
}

interface EmailSequence {
  id: number;
  subject: string;
  content: string;
  delayDays: number;
  orderIndex: number;
}

interface Campaign {
  id: number;
  name: string;
  segmentId: number | null;
  segment?: Segment;
  sequences: EmailSequence[];
  createdAt: Date | string;
}

export interface EditCampaignForm extends CreateCampaignForm {
  id: number;
}

interface EditCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: Segment[];
  campaign: Campaign;
  onSubmit: (data: EditCampaignForm) => Promise<void>;
}

export default function EditCampaignModal({ 
  isOpen, 
  onClose, 
  segments, 
  campaign,
  onSubmit 
}: EditCampaignModalProps) {
  const [formData, setFormData] = useState<EditCampaignForm>(() => ({
    id: campaign.id,
    name: campaign.name,
    segmentId: campaign.segmentId,
    sequences: campaign.sequences.map(seq => ({
      subject: seq.subject,
      content: seq.content,
      delayDays: seq.delayDays,
      orderIndex: seq.orderIndex
    }))
  }));

  if (!isOpen) return null;

  const addSequence = () => {
    setFormData(prev => ({
      ...prev,
      sequences: [
        ...prev.sequences,
        {
          subject: '',
          content: '',
          delayDays: 0,
          orderIndex: prev.sequences.length
        }
      ]
    }));
  };

  const removeSequence = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sequences: prev.sequences.filter((_, i) => i !== index)
    }));
  };

  const updateSequence = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sequences: prev.sequences.map((seq, i) => 
        i === index ? { ...seq, [field]: value } : seq
      )
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#2f2f2f] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={async (e) => {
          e.preventDefault();
          await onSubmit(formData);
          onClose();
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Segment
              </label>
              <select
                value={formData.segmentId || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  segmentId: e.target.value ? Number(e.target.value) : null 
                }))}
                className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
              >
                <option value="">No segment</option>
                {segments.map(segment => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Email Sequence</h3>
                <button
                  type="button"
                  onClick={addSequence}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Add Email
                </button>
              </div>

              {formData.sequences.map((sequence, index) => (
                <div key={index} className="bg-[#393939] rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-white">Email {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSequence(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={sequence.subject}
                        onChange={(e) => updateSequence(index, 'subject', e.target.value)}
                        className="w-full bg-[#2d2d2d] text-white rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Content
                      </label>
                      <textarea
                        value={sequence.content}
                        onChange={(e) => updateSequence(index, 'content', e.target.value)}
                        rows={4}
                        className="w-full bg-[#2d2d2d] text-white rounded-lg px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Delay (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={sequence.delayDays}
                        onChange={(e) => updateSequence(index, 'delayDays', parseInt(e.target.value) || 0)}
                        className="w-full bg-[#2d2d2d] text-white rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Update Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 