'use client';

import { CreateCampaignForm } from '@/components/CreateCampaignModal';
import { EditCampaignForm } from '@/components/EditCampaignModal';
import { EmailSequence } from '@prisma/client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface User {
  name: string;
  email: string;
}

interface Segment {
  id: number;
  name: string;
}

interface Lead {
  id: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  segment?: Segment;
  segmentId?: number;
}

interface Campaign {
  id: number;
  name: string;
  segmentId: number | null;
  segment?: Segment;
  sequences: EmailSequence[];
  createdAt: Date | string;
}

interface AppContextType {
  user: User | null;
  segments: Segment[];
  leads: Lead[];
  campaigns: Campaign[];
  isLoading: boolean;
  refreshSegments: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  refreshCampaigns: () => Promise<void>;
  addLead: (data: Omit<Lead, 'id'>) => Promise<boolean>;
  updateLead: (id: number, data: Partial<Lead>) => Promise<boolean>;
  deleteLead: (id: number) => Promise<boolean>;
  addSegment: (name: string) => Promise<boolean>;
  updateSegment: (id: number, name: string) => Promise<boolean>;
  deleteSegment: (id: number) => Promise<boolean>;
  addCampaign: (data: CreateCampaignForm) => Promise<boolean>;
  updateCampaign: (id: number, data: EditCampaignForm | Partial<Campaign>) => Promise<boolean>;
  deleteCampaign: (id: number) => Promise<boolean>;
  leadsPage: number;
  leadsPerPage: number;
  totalLeads: number;
  setLeadsPage: (page: number) => void;
  setLeadsPerPage: (perPage: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsPerPage, setLeadsPerPage] = useState(15);
  const [totalLeads, setTotalLeads] = useState(0);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await Promise.all([fetchUser(), fetchSegments(), fetchLeads(), fetchCampaigns()]);
      setIsLoading(false);
    };

    initialize();
  }, []);

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

  const fetchSegments = async () => {
    try {
      const response = await fetch('/api/segments');
      if (!response.ok) throw new Error('Failed to fetch segments');
      const data = await response.json();
      setSegments(data);
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  const fetchLeads = async (page = leadsPage, perPage = leadsPerPage) => {
    try {
      if (totalLeads === 0) {
        const countResponse = await fetch('/api/leads/count');
        if (countResponse.ok) {
          const { count } = await countResponse.json();
          setTotalLeads(count);
        }
      }
      
      const response = await fetch(`/api/leads?page=${page}&perPage=${perPage}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data.leads);
      
      if (pathname === '/leads') {
        const params = new URLSearchParams(searchParams);
        params.set('page', page.toString());
        params.set('perPage', perPage.toString());
        router.replace(`${pathname}?${params.toString()}`);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    }
  };

  const refreshSegments = useCallback(async () => {
    await fetchSegments();
  }, []);

  const refreshLeads = useCallback(async () => {
    await fetchLeads(leadsPage, leadsPerPage);
    
    const countResponse = await fetch('/api/leads/count');
    if (countResponse.ok) {
      const { count } = await countResponse.json();
      setTotalLeads(count);
    }
  }, [leadsPage, leadsPerPage]);

  const refreshCampaigns = useCallback(async () => {
    await fetchCampaigns();
  }, []);

  // CRUD operations for leads
  const addLead = async (data: Omit<Lead, 'id'>): Promise<boolean> => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add lead');
      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Error adding lead:', err);
      return false;
    }
  };

  const updateLead = async (id: number, data: Partial<Lead>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update lead');
      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Error updating lead:', err);
      return false;
    }
  };

  const deleteLead = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete lead');
      await fetchLeads();
      return true;
    } catch (err) {
      console.error('Error deleting lead:', err);
      return false;
    }
  };

  // CRUD operations for segments
  const addSegment = async (name: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to add segment');
      await fetchSegments();
      return true;
    } catch (err) {
      console.error('Error adding segment:', err);
      return false;
    }
  };

  const updateSegment = async (id: number, name: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/segments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to update segment');
      await fetchSegments();
      return true;
    } catch (err) {
      console.error('Error updating segment:', err);
      return false;
    }
  };

  const deleteSegment = async (id: number): Promise<boolean> => {
    try {
      // First, update any campaigns using this segment to have null segmentId
      const campaignsWithSegment = campaigns.filter(campaign => campaign.segmentId === id);
      
      if (campaignsWithSegment.length > 0) {
        // Update each campaign to have null segmentId
        await Promise.all(
          campaignsWithSegment.map(campaign => 
            fetch(`/api/campaigns/${campaign.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...campaign, segmentId: null }),
            })
          )
        );
      }
      
      // Now delete the segment
      const response = await fetch(`/api/segments/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete segment');
      
      // Refresh both segments and campaigns
      await Promise.all([fetchSegments(), fetchCampaigns()]);
      return true;
    } catch (err) {
      console.error('Error deleting segment:', err);
      return false;
    }
  };

  // Add campaign CRUD operations to AppContext
  const addCampaign = async (data: CreateCampaignForm): Promise<boolean> => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add campaign');
      await fetchCampaigns();
      return true;
    } catch (err) {
      console.error('Error adding campaign:', err);
      return false;
    }
  };

  const updateCampaign = async (id: number, data: EditCampaignForm | Partial<Campaign>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update campaign');
      await fetchCampaigns();
      return true;
    } catch (err) {
      console.error('Error updating campaign:', err);
      return false;
    }
  };

  const deleteCampaign = async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete campaign');
      await fetchCampaigns();
      return true;
    } catch (err) {
      console.error('Error deleting campaign:', err);
      return false;
    }
  };

  // Initialize with URL params if available
  useEffect(() => {
    if (pathname === '/leads') {
      const page = parseInt(searchParams.get('page') || '1', 10);
      const perPage = parseInt(searchParams.get('perPage') || '15', 10);
      
      if (page !== leadsPage) {
        setLeadsPage(page);
      }
      
      if (perPage !== leadsPerPage) {
        setLeadsPerPage(perPage);
      }
      
      fetchLeads(page, perPage);
    }
  }, [pathname, searchParams]);

  // Update fetchLeads when pagination changes
  useEffect(() => {
    if (pathname === '/leads') {
      fetchLeads(leadsPage, leadsPerPage);
    }
  }, [leadsPage, leadsPerPage]);

  const value = {
    user,
    segments,
    leads,
    campaigns,
    isLoading,
    refreshSegments,
    refreshLeads,
    refreshCampaigns,
    addLead,
    updateLead,
    deleteLead,
    addSegment,
    updateSegment,
    deleteSegment,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    leadsPage,
    leadsPerPage,
    totalLeads,
    setLeadsPage,
    setLeadsPerPage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
} 