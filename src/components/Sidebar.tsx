'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiUsers, FiHome, FiLogOut, FiSettings } from 'react-icons/fi';
import Modal from './Modal';

interface User {
  name: string;
  email: string;
}

interface SidebarProps {
  user: User | null;
}

export default function Sidebar({ user }: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <div className="w-64 bg-[#191919] p-4 flex flex-col h-full">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Client Management</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <Link 
            href="/dashboard" 
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              pathname === '/dashboard' 
                ? 'bg-[#2f2f2f] text-white'
                : 'text-gray-300 hover:bg-[#2f2f2f] hover:text-white'
            }`}
          >
            <FiHome className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          <Link 
            href="/leads" 
            className={`flex items-center space-x-2 p-2 rounded-lg ${
              pathname === '/leads'
                ? 'bg-[#2f2f2f] text-white'
                : 'text-gray-300 hover:bg-[#2f2f2f] hover:text-white'
            }`}
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

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings"
      >
        <div className="text-gray-300">
          <p>Settings coming soon...</p>
        </div>
      </Modal>
    </>
  );
} 