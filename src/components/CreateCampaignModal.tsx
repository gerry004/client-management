import { useState } from 'react';
import Modal from './Modal';

interface Segment {
  id: number;
  name: string;
}

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: Segment[];
  onCreateCampaign: (campaignData: any) => Promise<void>;
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  segments,
  onCreateCampaign,
}: CreateCampaignModalProps) {
  const [name, setName] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [sequences, setSequences] = useState([
    { subject: '', content: '', delayDays: 0 },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateCampaign({
      name,
      segmentId: parseInt(segmentId),
      sequences,
    });
    onClose();
  };

  const addSequence = () => {
    setSequences([...sequences, { subject: '', content: '', delayDays: 0 }]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Campaign">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Campaign Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#2f2f2f] text-white rounded-lg px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Segment
          </label>
          <select
            value={segmentId}
            onChange={(e) => setSegmentId(e.target.value)}
            className="w-full bg-[#2f2f2f] text-white rounded-lg px-3 py-2"
            required
          >
            <option value="">Select a segment</option>
            {segments.map((segment) => (
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
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              + Add Email
            </button>
          </div>

          {sequences.map((sequence, index) => (
            <div key={index} className="space-y-3 p-3 bg-[#2f2f2f] rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={sequence.subject}
                  onChange={(e) => {
                    const newSequences = [...sequences];
                    newSequences[index].subject = e.target.value;
                    setSequences(newSequences);
                  }}
                  className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={sequence.content}
                  onChange={(e) => {
                    const newSequences = [...sequences];
                    newSequences[index].content = e.target.value;
                    setSequences(newSequences);
                  }}
                  className="w-full bg-[#393939] text-white rounded-lg px-3 py-2 h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Delay (days)
                </label>
                <input
                  type="number"
                  value={sequence.delayDays}
                  onChange={(e) => {
                    const newSequences = [...sequences];
                    newSequences[index].delayDays = parseInt(e.target.value);
                    setSequences(newSequences);
                  }}
                  className="w-full bg-[#393939] text-white rounded-lg px-3 py-2"
                  min="0"
                  required
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Create Campaign
          </button>
        </div>
      </form>
    </Modal>
  );
} 