import { useRouter } from 'next/navigation';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // Redirect to settings page
  router.push('/settings');
  onClose();
  
  return null;
} 