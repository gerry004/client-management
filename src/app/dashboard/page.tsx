'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

interface User {
  name: string;
  email: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
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
  }, []);

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