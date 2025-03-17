'use client';

import Sidebar from '@/components/Sidebar';
import { useAppContext } from '@/contexts/AppContext';

export default function DashboardPage() {
  const { user } = useAppContext();

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        {/* Add dashboard content here */}
      </div>
    </div>
  );
}