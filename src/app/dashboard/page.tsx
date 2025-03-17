'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAppContext } from '@/contexts/AppContext';
import StatsCard from '@/components/dashboard/StatsCard';

interface DashboardStats {
  totalLeads: number;
  totalEmails: number;
  openedEmails: number;
  openRate: number;
}

export default function DashboardPage() {
  const { user } = useAppContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/dashboard/stats');
        const result = await response.json();
        
        if (result.success) {
          setStats(result.data);
        } else {
          setError(result.error || 'Failed to fetch statistics');
        }
      } catch (err) {
        setError('An error occurred while fetching dashboard statistics');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="flex h-screen bg-[#1f1f1f]">
      <Sidebar user={user} />
      <div className="flex-1 p-8 overflow-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard 
            title="Total Leads" 
            value={stats?.totalLeads || 0} 
            description="Total number of leads in your database"
            isLoading={isLoading}
          />
          
          <StatsCard 
            title="Emails Sent" 
            value={stats?.totalEmails || 0} 
            description="Total number of emails sent"
            isLoading={isLoading}
          />
          
          <StatsCard 
            title="Email Open Rate" 
            value={`${stats?.openRate || 0}%`} 
            description={`${stats?.openedEmails || 0} opened out of ${stats?.totalEmails || 0} sent`}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}