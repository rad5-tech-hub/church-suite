import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Church, Branch } from '../types';
import { fetchChurchConfig, fetchBranches } from '../api';
import { useAuth } from './AuthContext';

// Default church used before onboarding
const defaultMockChurch: Church = {
  id: 'church-default',
  name: 'My Church',
  type: 'single',
  createdAt: new Date(),
};

interface ChurchContextType {
  church: Church;
  branches: Branch[];
  setChurchType: (type: 'single' | 'multi') => void;
  setChurchName: (name: string) => void;
  updateChurch: (updates: Partial<Omit<Church, 'id' | 'createdAt'>>) => void;
  addBranch: (branch: Branch) => void;
  updateBranch: (id: string, updates: Partial<Omit<Branch, 'id' | 'churchId' | 'createdAt'>>) => void;
  deleteBranch: (id: string) => boolean;
  isOnboarded: boolean;
  completeOnboarding: (data: {
    churchName: string;
    churchType: 'single' | 'multi';
    headquartersBranchName?: string;
    adminName: string;
    adminEmail: string;
  }) => string; // returns the generated churchId
  /** Load church config from the server (called after login, uses token context) */
  loadChurchFromServer: () => Promise<boolean>;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

const STORAGE_KEY = 'churchset_church_data';

interface StoredChurchData {
  church: {
    id: string;
    name: string;
    type: 'single' | 'multi';
    currency?: string;
    reportingMode?: string;
    logoUrl?: string;
    logoOpacity?: number;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    createdAt: string;
  };
  branches: {
    id: string;
    churchId: string;
    name: string;
    isHeadquarters: boolean;
    createdAt: string;
  }[];
  isOnboarded: boolean;
}

export function ChurchProvider({ children }: { children: ReactNode }) {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [church, setChurch] = useState<Church>(defaultMockChurch);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isOnboarded, setIsOnboarded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredChurchData = JSON.parse(stored);
        setChurch({
          ...data.church,
          createdAt: new Date(data.church.createdAt),
        });
        setBranches(
          data.branches.map((b) => ({
            ...b,
            createdAt: new Date(b.createdAt),
          }))
        );
        setIsOnboarded(data.isOnboarded);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to sessionStorage whenever state changes
  const persist = useCallback((c: Church, b: Branch[], onboarded: boolean) => {
    const data: StoredChurchData = {
      church: {
        id: c.id,
        name: c.name,
        type: c.type,
        currency: c.currency,
        reportingMode: c.reportingMode,
        logoUrl: c.logoUrl,
        logoOpacity: c.logoOpacity,
        address: c.address,
        city: c.city,
        state: c.state,
        country: c.country,
        phone: c.phone,
        email: c.email,
        website: c.website,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
      },
      branches: b.map((br) => ({
        id: br.id,
        churchId: br.churchId,
        name: br.name,
        isHeadquarters: br.isHeadquarters,
        createdAt: br.createdAt instanceof Date ? br.createdAt.toISOString() : br.createdAt,
      })),
      isOnboarded: onboarded,
    };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, []);

  // Load church config from server — called after login to hydrate context
  const loadChurchFromServer = useCallback(async (): Promise<boolean> => {
    try {
      const config = await fetchChurchConfig();

      if (config && config.id) {
        const loadedChurch: Church = {
          id: config.id,
          name: config.name ?? config.churchName ?? '',
          type: config.type ?? 'single',
          currency: config.currency,
          reportingMode: config.reportingMode,
          logoUrl: config.logoUrl ?? config.logo,
          logoOpacity: config.logoOpacity,
          address: config.address,
          city: config.city,
          state: config.state,
          country: config.country,
          phone: config.phone ?? config.churchPhone,
          email: config.email ?? config.churchEmail,
          website: config.website,
          createdAt: config.createdAt ? new Date(config.createdAt) : new Date(),
        };

        // Branches come embedded in the church response (config.branch)
        // Fall back to a separate fetchBranches call if not present
        let rawBranches: any[] = [];
        if (Array.isArray(config.branch) && config.branch.length > 0) {
          rawBranches = config.branch;
        } else {
          try {
            const serverBranches = await fetchBranches();
            rawBranches = serverBranches || [];
          } catch { /* fetchBranches may 500 for new accounts */ }
        }

        const loadedBranches: Branch[] = rawBranches.map((b: any) => ({
          id: b.id ?? b._id,
          churchId: b.churchId ?? config.id,
          name: b.name,
          isHeadquarters: b.isHq ?? b.isHeadQuarter ?? b.isHeadquarters ?? false,
          createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
        }));

        setChurch(loadedChurch);
        setBranches(loadedBranches);
        setIsOnboarded(true);

        // Update sessionStorage
        const data: StoredChurchData = {
          church: {
            id: loadedChurch.id,
            name: loadedChurch.name,
            type: loadedChurch.type,
            currency: loadedChurch.currency,
            reportingMode: loadedChurch.reportingMode,
            logoUrl: loadedChurch.logoUrl,
            logoOpacity: loadedChurch.logoOpacity,
            address: loadedChurch.address,
            city: loadedChurch.city,
            state: loadedChurch.state,
            country: loadedChurch.country,
            phone: loadedChurch.phone,
            email: loadedChurch.email,
            website: loadedChurch.website,
            createdAt: loadedChurch.createdAt instanceof Date ? loadedChurch.createdAt.toISOString() : (loadedChurch.createdAt as any),
          },
          branches: loadedBranches.map((br: Branch) => ({
            id: br.id,
            churchId: br.churchId,
            name: br.name,
            isHeadquarters: br.isHeadquarters,
            createdAt: br.createdAt instanceof Date ? br.createdAt.toISOString() : (br.createdAt as any),
          })),
          isOnboarded: true,
        };
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to load church from server:', err);
      return false;
    }
  }, []);

  // Auto-load church data from server once auth is ready and we have a token
  // This ensures branches (and church config) are always populated, even after
  // a page refresh where the token was restored via refresh-token cookie.
  useEffect(() => {
    if (!authLoading && accessToken && church.id === 'church-default') {
      loadChurchFromServer().catch(() => {});
    }
  }, [authLoading, accessToken, church.id, loadChurchFromServer]);

  const setChurchType = (type: 'single' | 'multi') => {
    const updated = { ...church, type };
    setChurch(updated);
    persist(updated, branches, isOnboarded);
  };

  const setChurchName = (name: string) => {
    const updated = { ...church, name };
    setChurch(updated);
    persist(updated, branches, isOnboarded);
  };

  const updateChurch = (updates: Partial<Omit<Church, 'id' | 'createdAt'>>) => {
    const updated = { ...church, ...updates };
    setChurch(updated);
    persist(updated, branches, isOnboarded);
  };

  const addBranch = (branch: Branch) => {
    const updated = [...branches, branch];
    setBranches(updated);
    persist(church, updated, isOnboarded);
  };

  const updateBranch = (id: string, updates: Partial<Omit<Branch, 'id' | 'churchId' | 'createdAt'>>) => {
    const updated = branches.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBranches(updated);
    persist(church, updated, isOnboarded);
  };

  const deleteBranch = (id: string) => {
    const updated = branches.filter((b) => b.id !== id);
    setBranches(updated);
    persist(church, updated, isOnboarded);
    return true;
  };

  const completeOnboarding = (data: {
    churchName: string;
    churchType: 'single' | 'multi';
    headquartersBranchName?: string;
    adminName: string;
    adminEmail: string;
  }): string => {
    const now = new Date();
    // Generate a unique church ID so each onboarded church is isolated
    const churchId = `church-${Date.now()}`;
    const updatedChurch: Church = {
      id: churchId,
      name: data.churchName,
      type: data.churchType,
      createdAt: now,
    };

    let updatedBranches: Branch[] = [];

    if (data.churchType === 'multi' && data.headquartersBranchName) {
      updatedBranches = [
        {
          id: `branch-hq-${Date.now()}`,
          churchId: updatedChurch.id,
          name: data.headquartersBranchName,
          isHeadquarters: true,
          createdAt: now,
        },
      ];
    }

    setChurch(updatedChurch);
    setBranches(updatedBranches);
    setIsOnboarded(true);
    persist(updatedChurch, updatedBranches, true);
    return churchId;
  };

  return (
    <ChurchContext.Provider
      value={{
        church,
        branches,
        setChurchType,
        setChurchName,
        updateChurch,
        addBranch,
        updateBranch,
        deleteBranch,
        isOnboarded,
        completeOnboarding,
        loadChurchFromServer,
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  const context = useContext(ChurchContext);
  if (!context) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
}