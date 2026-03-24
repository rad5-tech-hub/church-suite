import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DollarSign,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Tag,
  Target,
  Loader2,
  Trash2,
  Users,
  Building2,
  Layers,
  Box,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Edit,
  Eye,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CURRENCIES } from '../constants/currencies';
import {
  CollectionType,
  LedgerEntry,
  StandaloneCollection,
  StandaloneCollectionEntry,
  Collection,
  Department,
  Unit,
  Program,
} from '../types';
import {
  fetchCollectionTypes,
  fetchLedgerEntries,
  fetchStandaloneCollections,
  fetchCollections,
  fetchDepartments,
  fetchUnits,
  fetchPrograms,
  updateAccount,
  createCollection,
  hideLedgerEntryLocally,
  hideCollectionTypeLocally,
  hideFundraiserLocally,
} from '../api';

type FinanceTab = 'ledger' | 'collections' | 'fundraisers';

function RequiredStar() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

function getCurrencySymbol(code?: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol || '₦';
}

// MAIN COMPONENT
export function Finance() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const { brandColors } = useTheme();
  const isMultiBranch = church.type === 'multi' && branches.length > 0;
  const isSuperAdmin = currentAdmin?.isSuperAdmin ?? false;
  const adminLevel = currentAdmin?.level || 'church';
  const currSymbol = getCurrencySymbol(church.currency);
  const accessibleBranchIds = useMemo(() => currentAdmin?.branchIds?.length
    ? currentAdmin.branchIds
    : currentAdmin?.branchId
      ? [currentAdmin.branchId]
      : [], [currentAdmin?.branchIds, currentAdmin?.branchId]);
  const accessibleDepartmentIds = useMemo(() => currentAdmin?.departmentIds?.length
    ? currentAdmin.departmentIds
    : currentAdmin?.departmentId
      ? [currentAdmin.departmentId]
      : [], [currentAdmin?.departmentIds, currentAdmin?.departmentId]);
  const accessibleUnitIds = useMemo(() => currentAdmin?.unitIds?.length
    ? currentAdmin.unitIds
    : currentAdmin?.unitId
      ? [currentAdmin.unitId]
      : [], [currentAdmin?.unitIds, currentAdmin?.unitId]);

  // Data
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [standaloneColls, setStandaloneColls] = useState<StandaloneCollection[]>([]);
  const [programColls, setProgramColls] = useState<Collection[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  // Filters  sync tab with URL query param so sidebar links work
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as FinanceTab | null;
  const [activeTabState, setActiveTabState] = useState<FinanceTab>(
    tabFromUrl && ['ledger', 'collections', 'fundraisers'].includes(tabFromUrl) ? tabFromUrl : 'ledger'
  );
  const activeTab = activeTabState;
  const setActiveTab = (tab: FinanceTab) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };
  // Sync from URL changes (e.g., sidebar nav clicks)
  useEffect(() => {
    const t = searchParams.get('tab') as FinanceTab | null;
    if (t && ['ledger', 'collections', 'fundraisers'].includes(t) && t !== activeTabState) {
      setActiveTabState(t);
    }
  }, [searchParams]);

  const [scopeFilter, setScopeFilter] = useState<'all' | 'branch' | 'department' | 'unit'>('all');
  const [scopeFilterId, setScopeFilterId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  // â”€â”€â”€ Ledger Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerType, setLedgerType] = useState<'income' | 'expense'>('income');
  const [ledgerAmount, setLedgerAmount] = useState('');
  const [ledgerDesc, setLedgerDesc] = useState('');
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().split('T')[0]);
  const [ledgerBranchId, setLedgerBranchId] = useState('');
  const [ledgerDeptId, setLedgerDeptId] = useState('');
  const [ledgerUnitId, setLedgerUnitId] = useState('');
  const [ledgerCollectionTypeId, setLedgerCollectionTypeId] = useState('none');
  const [ledgerProgramId, setLedgerProgramId] = useState('');
  const [ledgerErrors, setLedgerErrors] = useState<Record<string, string>>({});
  const ledgerFormRef = useRef<HTMLDivElement>(null);

  // â”€â”€â”€ Collection Type Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [ctOpen, setCtOpen] = useState(false);
  const [ctName, setCtName] = useState('');
  const [ctScope, setCtScope] = useState<'church' | 'branch' | 'department' | 'unit'>('church');
  const [ctScopeId, setCtScopeId] = useState('');
  const [ctErrors, setCtErrors] = useState<Record<string, string>>({});
  const ctFormRef = useRef<HTMLDivElement>(null);

  // â”€â”€â”€ Fundraiser Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [fundOpen, setFundOpen] = useState(false);
  const [fundName, setFundName] = useState('');
  const [fundDesc, setFundDesc] = useState('');
  const [fundTarget, setFundTarget] = useState('');
  const [fundDueDate, setFundDueDate] = useState('');
  const [fundScope, setFundScope] = useState<'church' | 'branch' | 'department' | 'unit'>('church');
  const [fundScopeId, setFundScopeId] = useState('');
  const [fundErrors, setFundErrors] = useState<Record<string, string>>({});
  const fundFormRef = useRef<HTMLDivElement>(null);

  // â”€â”€â”€ Donation Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateFundId, setDonateFundId] = useState('');
  const [donateName, setDonateName] = useState('');
  const [donateAmount, setDonateAmount] = useState('');
  const [donateDate, setDonateDate] = useState(new Date().toISOString().split('T')[0]);
  const [donateErrors, setDonateErrors] = useState<Record<string, string>>({});
  const donateFormRef = useRef<HTMLDivElement>(null);

  // â”€â”€â”€ View Fundraiser Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [viewFundId, setViewFundId] = useState<string | null>(null);

  // â”€â”€â”€ Delete dialogs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'ledger' | 'ct' | 'fund'; id: string; name: string } | null>(null);
  const hasLoadedLedgerBaseRef = useRef(false);
  const skipNextLedgerRefreshRef = useRef(false);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LOAD DATA â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const dedupeLedgerEntries = useCallback((entries: LedgerEntry[]) => Array.from(
    new Map(
      entries.map((entry) => [
        entry.id || `${entry.branchId || 'church'}:${entry.departmentId || 'all'}:${entry.createdAt.toISOString()}:${entry.description}:${entry.amount}:${entry.type}`,
        entry,
      ])
    ).values()
  ), []);

  const loadLedgerEntriesForFilters = useCallback(async (
    resolvedDepartments: Department[] = departments,
    resolvedUnits: Unit[] = units,
  ) => {
    const ledgerQueries: Array<{ branchId?: string; departmentId?: string }> = [];
    const seenLedgerQueries = new Set<string>();
    const addLedgerQuery = (branchId?: string, departmentId?: string) => {
      const key = `${branchId || 'church'}:${departmentId || 'all'}`;
      if (seenLedgerQueries.has(key)) return;
      seenLedgerQueries.add(key);
      ledgerQueries.push({ branchId, departmentId });
    };

    if (scopeFilter === 'branch') {
      const branchIds = scopeFilterId
        ? [scopeFilterId]
        : Array.from(new Set([
            ...(isSuperAdmin || adminLevel === 'church'
              ? [
                  ...branches.map((branch) => branch.id),
                  ...resolvedDepartments.map((department) => department.branchId).filter((branchId): branchId is string => !!branchId),
                ]
              : adminLevel === 'branch'
                ? accessibleBranchIds
                : [
                    ...accessibleBranchIds,
                    ...resolvedDepartments
                      .filter((department) => accessibleDepartmentIds.includes(department.id))
                      .map((department) => department.branchId)
                      .filter((branchId): branchId is string => !!branchId),
                  ]),
          ]));

      branchIds.forEach((branchId) => addLedgerQuery(branchId));
      return dedupeLedgerEntries((await Promise.all(
        ledgerQueries.map((query) => fetchLedgerEntries(query.branchId, query.departmentId))
      )).flat() as LedgerEntry[]);
    }

    if (scopeFilter === 'department') {
      const visibleDepartments = resolvedDepartments.filter((department) => {
        if (scopeFilterId) return department.id === scopeFilterId;
        if (isSuperAdmin || adminLevel === 'church') return true;
        if (adminLevel === 'branch') return !!department.branchId && accessibleBranchIds.includes(department.branchId);
        if (adminLevel === 'department') return accessibleDepartmentIds.includes(department.id);
        if (adminLevel === 'unit') {
          return accessibleDepartmentIds.includes(department.id)
            || resolvedUnits.some((unit) => accessibleUnitIds.includes(unit.id) && unit.departmentId === department.id);
        }
        return false;
      });

      visibleDepartments.forEach((department) => {
        addLedgerQuery(department.branchId || accessibleBranchIds[0] || branches[0]?.id, department.id);
      });

      return dedupeLedgerEntries((await Promise.all(
        ledgerQueries.map((query) => fetchLedgerEntries(query.branchId, query.departmentId))
      )).flat() as LedgerEntry[]);
    }

    if (scopeFilter === 'unit') {
      const visibleUnits = resolvedUnits.filter((unit) => {
        if (scopeFilterId) return unit.id === scopeFilterId;
        if (isSuperAdmin || adminLevel === 'church') return true;
        if (adminLevel === 'branch') {
          const department = resolvedDepartments.find((item) => item.id === unit.departmentId);
          return !!department?.branchId && accessibleBranchIds.includes(department.branchId);
        }
        if (adminLevel === 'department') return accessibleDepartmentIds.includes(unit.departmentId);
        if (adminLevel === 'unit') return accessibleUnitIds.includes(unit.id);
        return false;
      });

      visibleUnits.forEach((unit) => {
        const department = resolvedDepartments.find((item) => item.id === unit.departmentId);
        addLedgerQuery(department?.branchId || accessibleBranchIds[0] || branches[0]?.id, unit.departmentId);
      });

      const entries = dedupeLedgerEntries((await Promise.all(
        ledgerQueries.map((query) => fetchLedgerEntries(query.branchId, query.departmentId))
      )).flat() as LedgerEntry[]);

      return entries.filter((entry) => {
        const entryScopeType = entry.scope || (entry.unitId ? 'unit' : entry.departmentId ? 'department' : entry.branchId ? 'branch' : 'church');
        if (entryScopeType !== 'unit') return false;
        if (!scopeFilterId) return true;
        const entryScopeId = entry.scopeId || entry.unitId;
        return entryScopeId === scopeFilterId || entry.unitId === scopeFilterId;
      });
    }

    if (isSuperAdmin || adminLevel === 'church') {
      const branchIds = Array.from(new Set([
        ...branches.map((branch) => branch.id),
        ...resolvedDepartments.map((department) => department.branchId).filter((branchId): branchId is string => !!branchId),
      ]));
      branchIds.forEach((branchId) => addLedgerQuery(branchId));
      resolvedDepartments.forEach((department) => {
        if (department.branchId) addLedgerQuery(department.branchId, department.id);
      });
    } else if (adminLevel === 'branch') {
      accessibleBranchIds.forEach((branchId) => addLedgerQuery(branchId));
      resolvedDepartments
        .filter((department) => department.branchId && accessibleBranchIds.includes(department.branchId))
        .forEach((department) => addLedgerQuery(department.branchId || undefined, department.id));
    } else {
      if (accessibleDepartmentIds.length > 0) {
        accessibleDepartmentIds.forEach((departmentId) => {
          const department = resolvedDepartments.find((item) => item.id === departmentId);
          addLedgerQuery(department?.branchId || accessibleBranchIds[0], departmentId);
        });
      } else if (adminLevel === 'unit' && accessibleUnitIds.length > 0) {
        accessibleUnitIds.forEach((unitId) => {
          const unit = resolvedUnits.find((item) => item.id === unitId);
          const departmentId = unit?.departmentId || currentAdmin?.departmentId;
          const department = resolvedDepartments.find((item) => item.id === departmentId);
          addLedgerQuery(department?.branchId || accessibleBranchIds[0], departmentId);
        });
      } else {
        accessibleBranchIds.forEach((branchId) => addLedgerQuery(branchId));
      }
    }

    const allLedgerEntries = await fetchLedgerEntries();
    if (allLedgerEntries.length > 0) {
      return dedupeLedgerEntries(allLedgerEntries as LedgerEntry[]);
    }

    return dedupeLedgerEntries((await Promise.all(
      ledgerQueries.map((query) => fetchLedgerEntries(query.branchId, query.departmentId))
    )).flat() as LedgerEntry[]);
  }, [
    adminLevel,
    accessibleBranchIds,
    accessibleDepartmentIds,
    accessibleUnitIds,
    branches,
    currentAdmin?.departmentId,
    departments,
    dedupeLedgerEntries,
    isSuperAdmin,
    scopeFilter,
    scopeFilterId,
    units,
  ]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cts, scs, pcs, deps, uns, progs] = await Promise.all([
        fetchCollectionTypes(),
        fetchStandaloneCollections(),
        fetchCollections(),
        fetchDepartments(),
        fetchUnits(),
        fetchPrograms(branches[0]?.id),
      ]);

      const resolvedDepartments = deps as unknown as Department[];
      const resolvedUnits = uns as unknown as Unit[];
      const nextLedgerEntries = await loadLedgerEntriesForFilters(resolvedDepartments, resolvedUnits);

      setCollectionTypes(cts as CollectionType[]);
      setLedgerEntries(nextLedgerEntries as LedgerEntry[]);
      setStandaloneColls(scs as StandaloneCollection[]);
      setProgramColls(pcs as Collection[]);
      setDepartments(resolvedDepartments);
      setUnits(resolvedUnits);
      setPrograms(progs as Program[]);
      hasLoadedLedgerBaseRef.current = true;
      skipNextLedgerRefreshRef.current = true;
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [branches, loadLedgerEntriesForFilters]);

  useEffect(() => { void loadData(); }, [adminLevel, branches, currentAdmin, isSuperAdmin]);

  useEffect(() => {
    if (!hasLoadedLedgerBaseRef.current) return;
    if (skipNextLedgerRefreshRef.current) {
      skipNextLedgerRefreshRef.current = false;
      return;
    }

    let cancelled = false;
    const refreshLedger = async () => {
      setLedgerLoading(true);
      try {
        const nextLedgerEntries = await loadLedgerEntriesForFilters();
        if (!cancelled) {
          setLedgerEntries(nextLedgerEntries as LedgerEntry[]);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to refresh ledger data:', err);
        }
      } finally {
        if (!cancelled) {
          setLedgerLoading(false);
        }
      }
    };

    void refreshLedger();

    return () => {
      cancelled = true;
    };
  }, [loadLedgerEntriesForFilters, scopeFilter, scopeFilterId]);

  const { showToast } = useToast();

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SCOPE HELPERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const getDeptName = (id?: string) => departments.find(d => d.id === id)?.name || '';
  const getUnitName = (id?: string) => units.find(u => u.id === id)?.name || '';
  const getBranchName = (id?: string) => {
    if (!id) return '';
    return branches.find(b => b.id === id)?.name || (id === church.id ? church.name : id);
  };
  const getProgramName = (id?: string) => programs.find(p => p.id === id)?.name || '';
  const getLedgerCollectionName = (entry: LedgerEntry) => {
    const match = entry.description.match(/\s*\[Collection:\s(.+?)\]\s*$/i);
    return match?.[1]?.trim() || '';
  };
  const getLedgerDisplayDescription = (entry: LedgerEntry) => entry.description
    .replace(/\s*\[Collection:\s.+?\]\s*$/i, '')
    .trim();
  const getAssignedScopeIds = (item: { scope: string; scopeId?: string; branchIds?: string[]; departmentIds?: string[] }) => {
    if (item.scope === 'branch') {
      return Array.from(new Set([...(item.branchIds || []), item.scopeId].filter(Boolean))) as string[];
    }
    if (item.scope === 'department') {
      return Array.from(new Set([...(item.departmentIds || []), item.scopeId].filter(Boolean))) as string[];
    }
    if (item.scope === 'unit') {
      return item.scopeId ? [item.scopeId] : [];
    }
    return [];
  };
  const canAccessCollectionScope = (item: { scope: string; scopeId?: string; branchIds?: string[]; departmentIds?: string[] }) => {
    if (item.scope === 'church') return true;
    if (item.scope === 'branch') {
      const assignedBranchIds = getAssignedScopeIds(item);
      return isSuperAdmin || adminLevel === 'church' || assignedBranchIds.some((id) => accessibleBranchIds.includes(id));
    }
    if (item.scope === 'department') {
      const assignedDepartmentIds = getAssignedScopeIds(item);
      return isSuperAdmin || adminLevel === 'church' || adminLevel === 'branch' || assignedDepartmentIds.some((id) => accessibleDepartmentIds.includes(id));
    }
    if (item.scope === 'unit') {
      const assignedUnitIds = getAssignedScopeIds(item);
      return isSuperAdmin || adminLevel === 'church' || adminLevel === 'branch' || adminLevel === 'department' || assignedUnitIds.some((id) => accessibleUnitIds.includes(id));
    }
    return true;
  };
  const availableLedgerCollectionTypes = useMemo(() => collectionTypes
    .filter((ct) => canAccessCollectionScope(ct))
    .sort((a, b) => a.name.localeCompare(b.name)),
  [accessibleBranchIds, accessibleDepartmentIds, accessibleUnitIds, adminLevel, collectionTypes, isSuperAdmin]);

  const getScopeName = (scope: string, scopeId?: string) => {
    switch (scope) {
      case 'church': return 'Church-wide';
      case 'branch': return getBranchName(scopeId) || 'Branch';
      case 'department': return getDeptName(scopeId) || 'Department';
      case 'unit': return getUnitName(scopeId) || 'Unit';
      default: return '';
    }
  };
  const getAssignedScopeLabel = (item: { scope: string; scopeId?: string; branchIds?: string[]; departmentIds?: string[] }) => {
    const assignedIds = getAssignedScopeIds(item);
    if (assignedIds.length <= 1) {
      return getScopeName(item.scope, assignedIds[0] || item.scopeId);
    }
    if (item.scope === 'branch') return `${assignedIds.length} branches`;
    if (item.scope === 'department') return `${assignedIds.length} departments`;
    if (item.scope === 'unit') return `${assignedIds.length} units`;
    return getScopeName(item.scope, item.scopeId);
  };

  const getLedgerScopeType = (entry: LedgerEntry) => entry.scope || (entry.unitId ? 'unit' : entry.departmentId ? 'department' : entry.branchId ? 'branch' : 'church');
  const getLedgerScopeTypeLabel = (entry: LedgerEntry) => {
    const scopeType = getLedgerScopeType(entry);
    return scopeType === 'church' ? 'Church' : `${scopeType.charAt(0).toUpperCase()}${scopeType.slice(1)}`;
  };
  const getLedgerScopeValue = (entry: LedgerEntry) => {
    const scopeType = getLedgerScopeType(entry);
    const scopeId = entry.scopeId || (
      scopeType === 'unit' ? entry.unitId :
      scopeType === 'department' ? entry.departmentId :
      scopeType === 'branch' ? entry.branchId :
      undefined
    );
    return getScopeName(scopeType, scopeId);
  };
  const branchFilterIds = Array.from(new Set([
    ...branches.map((branch) => branch.id),
    ...accessibleBranchIds,
    ...departments.map((department) => department.branchId).filter((branchId): branchId is string => !!branchId),
    ...ledgerEntries
      .filter((entry) => getLedgerScopeType(entry) === 'branch')
      .map((entry) => entry.scopeId || entry.branchId)
      .filter((branchId): branchId is string => !!branchId),
  ]));
  const canFilterByBranch = branchFilterIds.length > 0;

  // Determine what scopes the current admin can access
  const canAccessScope = (branchId?: string, deptId?: string, unitId?: string): boolean => {
    if (isSuperAdmin || adminLevel === 'church') return true;
    if (adminLevel === 'branch') {
      return !!branchId && accessibleBranchIds.includes(branchId);
    }
    if (adminLevel === 'department') {
      return !!deptId && accessibleDepartmentIds.includes(deptId);
    }
    if (adminLevel === 'unit') {
      if (unitId && accessibleUnitIds.includes(unitId)) return true;
      return !!deptId && accessibleDepartmentIds.includes(deptId);
    }
    return false;
  };

  // Which scopes can the admin create in?
  const getCreatableScopes = (): ('church' | 'branch' | 'department' | 'unit')[] => {
    if (isSuperAdmin) return ['church', 'branch', 'department', 'unit'];
    if (adminLevel === 'branch') return ['branch', 'department', 'unit'];
    if (adminLevel === 'department') return ['department', 'unit'];
    if (adminLevel === 'unit') return ['unit'];
    return ['church', 'branch', 'department', 'unit'];
  };
  const getDefaultCreatableScope = (): 'church' | 'branch' | 'department' | 'unit' => getCreatableScopes()[0] || 'church';

  // Auto-set scope ID for non-super-admins
  const getDefaultScopeId = (scope: string) => {
    if (scope === 'church') return '';
    if (scope === 'branch' && adminLevel === 'branch') return accessibleBranchIds[0] || '';
    if (scope === 'department' && (adminLevel === 'department' || adminLevel === 'branch' || adminLevel === 'unit')) {
      return accessibleDepartmentIds[0]
        || currentAdmin?.departmentId
        || units.find((unit) => accessibleUnitIds.includes(unit.id))?.departmentId
        || '';
    }
    if (scope === 'unit') return accessibleUnitIds[0] || '';
    return '';
  };

  // Filtered departments based on admin scope
  const getFilteredDepts = (branchId?: string) => {
    let deps = departments;
    if (branchId) deps = deps.filter(d => d.branchId === branchId);
    if (adminLevel === 'department' || adminLevel === 'unit') {
      const allowedDepartmentIds = new Set([
        ...accessibleDepartmentIds,
        currentAdmin?.departmentId || '',
        ...units
          .filter((unit) => accessibleUnitIds.includes(unit.id))
          .map((unit) => unit.departmentId),
      ].filter(Boolean));
      deps = deps.filter(d => allowedDepartmentIds.has(d.id));
    }
    return deps;
  };

  const getFilteredUnits = (deptId?: string) => {
    let uns = units;
    if (deptId) uns = uns.filter(u => u.departmentId === deptId);
    if (adminLevel === 'unit') uns = uns.filter(u => accessibleUnitIds.includes(u.id));
    return uns;
  };

  const resolveCollectionScopeContext = (scope: 'church' | 'branch' | 'department' | 'unit', scopeId: string) => {
    const normalizedScope: 'church' | 'branch' | 'department' = scope === 'unit' ? 'department' : scope;
    const selectedUnit = scope === 'unit' ? units.find(u => u.id === scopeId) : undefined;
    const departmentId = scope === 'department'
      ? scopeId
      : scope === 'unit'
        ? selectedUnit?.departmentId || currentAdmin?.departmentId || ''
        : '';
    const selectedDepartment = departmentId ? departments.find(d => d.id === departmentId) : undefined;
    const fallbackBranchId = accessibleBranchIds[0] || branches[0]?.id || departments.find(d => d.branchId)?.branchId || '';
    const branchId = scope === 'branch'
      ? scopeId
      : scope === 'department' || scope === 'unit'
        ? selectedDepartment?.branchId || fallbackBranchId
        : fallbackBranchId;

    return {
      scopeType: normalizedScope,
      branchId: normalizedScope === 'church' ? undefined : branchId || undefined,
      departmentId: departmentId || undefined,
      branchIds: normalizedScope === 'branch' && branchId
          ? [branchId]
          : normalizedScope === 'department' && branchId
            ? [branchId]
          : undefined,
      departmentIds: normalizedScope === 'department' && departmentId ? [departmentId] : undefined,
    };
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FILTER LEDGER ENTRIES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const filteredLedger = ledgerEntries.filter(e => {
    const entryScopeType = getLedgerScopeType(e);
    const entryScopeId = e.scopeId || (
      entryScopeType === 'unit' ? e.unitId :
      entryScopeType === 'department' ? e.departmentId :
      entryScopeType === 'branch' ? e.branchId :
      undefined
    );

    // Role-based access
    if (!canAccessScope(e.branchId, e.departmentId, e.unitId)) return false;
    // Scope filter
    if (scopeFilter === 'branch') {
      if (entryScopeType !== 'branch') return false;
      if (scopeFilterId && entryScopeId !== scopeFilterId) return false;
    }
    if (scopeFilter === 'department') {
      if (entryScopeType !== 'department') return false;
      if (scopeFilterId && entryScopeId !== scopeFilterId) return false;
    }
    if (scopeFilter === 'unit') {
      if (entryScopeType !== 'unit') return false;
      if (scopeFilterId && entryScopeId !== scopeFilterId) return false;
    }
    // Program filter
    if (programFilter && programFilter !== 'all') {
      if (programFilter === 'no-program' && e.programId) return false;
      if (programFilter !== 'no-program' && e.programId !== programFilter) return false;
    }
    // Search
    if (searchTerm) {
      const normalizedSearchTerm = searchTerm.toLowerCase();
      const matchesDescription = getLedgerDisplayDescription(e).toLowerCase().includes(normalizedSearchTerm);
      const matchesCollection = getLedgerCollectionName(e).toLowerCase().includes(normalizedSearchTerm);
      if (!matchesDescription && !matchesCollection) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const ledgerIncome = filteredLedger.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const ledgerExpense = filteredLedger.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const ledgerBalance = ledgerIncome - ledgerExpense;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FILTER COLLECTION TYPES â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const filteredCTs = collectionTypes.filter(ct => {
    if (searchTerm && !ct.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return canAccessCollectionScope(ct);
  });

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FILTER FUNDRAISERS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const filteredFundraisers = standaloneColls.filter(sc => {
    if (searchTerm && !sc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return canAccessCollectionScope(sc);
  });

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SCROLL TO ERROR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const scrollToError = (ref: React.RefObject<HTMLDivElement | null>, fieldId: string) => {
    setTimeout(() => {
      const el = ref.current?.querySelector(`[data-field="${fieldId}"]`) as HTMLElement;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SAVE LEDGER ENTRY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleSaveLedger = async () => {
    const errors: Record<string, string> = {};
    const rawAmount = ledgerAmount.replace(/,/g, '');
    if (!rawAmount || parseFloat(rawAmount) <= 0) errors.amount = 'Enter a valid amount greater than 0.';
    if (!ledgerDesc.trim()) errors.desc = 'A description is required so the entry can be identified in the ledger.';
    if (!ledgerDate) errors.date = 'Select the date of this transaction.';

    if (Object.keys(errors).length) {
      setLedgerErrors(errors);
      const firstKey = Object.keys(errors)[0];
      scrollToError(ledgerFormRef, firstKey);
      return;
    }

    setSaving(true);
    try {
      const selectedCollectionName = ledgerCollectionTypeId && ledgerCollectionTypeId !== 'none'
        ? availableLedgerCollectionTypes.find((collectionType) => collectionType.id === ledgerCollectionTypeId)?.name || ''
        : '';
      const normalizedDescription = ledgerDesc.trim();
      const descriptionWithCollection = selectedCollectionName
        ? `${normalizedDescription} [Collection: ${selectedCollectionName}]`
        : normalizedDescription;
      const cleanBranchId = ledgerBranchId && ledgerBranchId !== 'none'
        ? ledgerBranchId
        : adminLevel === 'branch' || adminLevel === 'department' || adminLevel === 'unit'
          ? accessibleBranchIds[0]
          : undefined;
      const cleanDeptId = ledgerDeptId && ledgerDeptId !== 'none'
        ? ledgerDeptId
        : adminLevel === 'department'
          ? accessibleDepartmentIds[0]
          : adminLevel === 'unit'
            ? accessibleDepartmentIds[0] || units.find((unit) => accessibleUnitIds.includes(unit.id))?.departmentId
            : undefined;
      await updateAccount(
        {
          amount: parseFloat(ledgerAmount.replace(/,/g, '')),
          description: descriptionWithCollection,
          type: ledgerType === 'income' ? 'credit' : 'debit',
        },
        cleanBranchId,
        cleanDeptId
      );
      await loadData();
      setLedgerOpen(false);
      resetLedgerForm();
      showToast(`${ledgerType === 'income' ? 'Income' : 'Expense'} entry recorded successfully.`);
    } catch (err) {
      console.error('Failed to save ledger entry:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetLedgerForm = () => {
    setLedgerType('income');
    setLedgerAmount('');
    setLedgerDesc('');
    setLedgerDate(new Date().toISOString().split('T')[0]);
    setLedgerBranchId('');
    setLedgerDeptId('');
    setLedgerUnitId('');
    setLedgerCollectionTypeId('none');
    setLedgerProgramId('');
    setLedgerErrors({});
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SAVE COLLECTION TYPE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleSaveCT = async () => {
    const errors: Record<string, string> = {};
    if (!ctName.trim()) errors.name = 'Enter a name for this collection type (e.g. "Tithe", "Offering").';
    if (ctScope !== 'church' && !ctScopeId) errors.scopeId = 'Select which area this collection type applies to.';

    if (Object.keys(errors).length) {
      setCtErrors(errors);
      const firstKey = Object.keys(errors)[0];
      scrollToError(ctFormRef, firstKey);
      return;
    }

    const collectionContext = resolveCollectionScopeContext(ctScope, ctScopeId);
    if (collectionContext.scopeType === 'department' && ctScope !== 'church' && !collectionContext.departmentId) {
      showToast('The selected scope could not be matched to a department.', 'error');
      return;
    }

    const normalizedName = ctName.trim().toLowerCase();
    const duplicateExists = collectionTypes.some((collectionType) => {
      if (collectionType.name.trim().toLowerCase() !== normalizedName) return false;
      if (collectionType.scope !== collectionContext.scopeType) return false;

      if (collectionContext.scopeType === 'church') {
        return true;
      }

      const assignedScopeIds = getAssignedScopeIds(collectionType);
      const targetScopeIds = collectionContext.scopeType === 'branch'
        ? collectionContext.branchIds || []
        : collectionContext.departmentIds || [];

      return targetScopeIds.some((id) => assignedScopeIds.includes(id));
    });

    if (duplicateExists) {
      setCtErrors({ name: 'A collection type with this name already exists at this scope.' });
      scrollToError(ctFormRef, 'name');
      return;
    }

    setSaving(true);
    try {
      await createCollection({
        name: ctName.trim(),
        scopeType: collectionContext.scopeType,
        branchId: collectionContext.branchId,
        departmentId: collectionContext.departmentId,
      }, collectionContext.branchId, collectionContext.departmentId);
      await loadData();
      setCtOpen(false);
      resetCtForm();
      showToast(`Collection type "${ctName.trim()}" created successfully.`);
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || 'Failed to create collection type';
      console.error('Failed to save collection type:', err);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetCtForm = () => {
    const defaultScope = getDefaultCreatableScope();
    setCtName('');
    setCtScope(defaultScope);
    setCtScopeId(getDefaultScopeId(defaultScope));
    setCtErrors({});
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SAVE FUNDRAISER â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleSaveFund = async () => {
    const errors: Record<string, string> = {};
    if (!fundName.trim()) errors.name = 'Enter a name for this fundraiser (e.g. "New Church Bus").';
    if (!fundTarget || parseFloat(fundTarget.replace(/,/g, '')) <= 0) errors.target = 'Enter the target amount for this fundraiser.';
    if (!fundDueDate) errors.dueDate = 'Select a due date for this fundraiser.';
    if (fundScope !== 'church' && !fundScopeId) errors.scopeId = 'Select which area this fundraiser applies to.';

    if (Object.keys(errors).length) {
      setFundErrors(errors);
      const firstKey = Object.keys(errors)[0];
      scrollToError(fundFormRef, firstKey);
      return;
    }

    const collectionContext = resolveCollectionScopeContext(fundScope, fundScopeId);
    if (collectionContext.scopeType === 'department' && fundScope !== 'church' && !collectionContext.departmentId) {
      showToast('The selected scope could not be matched to a department.', 'error');
      return;
    }

    setSaving(true);
    try {
      const endTimeIso = fundDueDate ? new Date(fundDueDate).toISOString() : undefined;
      await createCollection(
        {
          name: fundName.trim(),
          description: fundDesc.trim() || undefined,
          scopeType: collectionContext.scopeType,
          type: 'donation',
          branchId: collectionContext.branchId,
          departmentId: collectionContext.departmentId,
          endTime: endTimeIso,
        },
        collectionContext.branchId,
        collectionContext.departmentId
      );
      await loadData();
      setFundOpen(false);
      resetFundForm();
      showToast(`Fundraiser "${fundName.trim()}" created successfully.`);
    } catch (err: any) {
      const msg = err?.details?.[0]?.message || err?.message || 'Failed to create fundraiser';
      console.error('Failed to save fundraiser:', err);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetFundForm = () => {
    const defaultScope = getDefaultCreatableScope();
    setFundName('');
    setFundDesc('');
    setFundTarget('');
    setFundDueDate('');
    setFundScope(defaultScope);
    setFundScopeId(getDefaultScopeId(defaultScope));
    setFundErrors({});
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SAVE DONATION â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleSaveDonation = async () => {
    const errors: Record<string, string> = {};
    if (!donateName.trim()) errors.name = 'Enter the donor\'s name.';
    if (!donateAmount || parseFloat(donateAmount.replace(/,/g, '')) <= 0) errors.amount = 'Enter a valid donation amount.';
    if (!donateDate) errors.date = 'Select the date of the donation.';

    if (Object.keys(errors).length) {
      setDonateErrors(errors);
      const firstKey = Object.keys(errors)[0];
      scrollToError(donateFormRef, firstKey);
      return;
    }

    setSaving(true);
    try {
      const fund = standaloneColls.find(s => s.id === donateFundId);
      const collectionContext = resolveCollectionScopeContext(
        (fund?.scope as 'church' | 'branch' | 'department' | 'unit') || 'church',
        fund?.scopeId || ''
      );
      await updateAccount(
        {
          amount: parseFloat(donateAmount.replace(/,/g, '')),
          description: `Donation from ${donateName.trim()} for "${fund?.name || 'Fundraiser'}"`,
          type: 'credit',
        },
        collectionContext.branchId,
        collectionContext.departmentId
      );
      await loadData();
      setDonateOpen(false);
      resetDonateForm();
      showToast(`Donation of ${currSymbol}${parseFloat(donateAmount.replace(/,/g, '')).toLocaleString()} from ${donateName.trim()} recorded.`);
    } catch (err) {
      console.error('Failed to save donation:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetDonateForm = () => {
    setDonateName('');
    setDonateAmount('');
    setDonateDate(new Date().toISOString().split('T')[0]);
    setDonateErrors({});
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DELETE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === 'ledger') {
        await hideLedgerEntryLocally(deleteTarget.id);
        setLedgerEntries(prev => prev.filter(e => e.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'ct') {
        await hideCollectionTypeLocally(deleteTarget.id);
        setCollectionTypes(prev => prev.filter(c => c.id !== deleteTarget.id));
      } else if (deleteTarget.type === 'fund') {
        await hideFundraiserLocally(deleteTarget.id);
        setStandaloneColls(prev => prev.filter(s => s.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
      showToast(`"${deleteTarget.name}" deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete:', err);
      showToast('Failed to delete. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SCOPE SELECTOR COMPONENT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const ScopeSelector = ({
    scope,
    setScope,
    scopeId,
    setScopeId,
    errors,
    fieldPrefix,
  }: {
    scope: 'church' | 'branch' | 'department' | 'unit';
    setScope: (v: 'church' | 'branch' | 'department' | 'unit') => void;
    scopeId: string;
    setScopeId: (v: string) => void;
    errors: Record<string, string>;
    fieldPrefix: string;
  }) => {
    const creatableScopes = getCreatableScopes();
    return (
      <div className="space-y-4">
        <div data-field={`${fieldPrefix}-scope`}>
          <Label>Scope<RequiredStar /></Label>
          <p className="text-xs text-gray-500 mb-2">
            {isSuperAdmin
              ? 'Choose whether this applies church-wide or to a specific branch, department, or unit.'
              : `You can create this for your assigned ${adminLevel} or any area within it.`
            }
          </p>
          <Select value={scope} onValueChange={(v) => { setScope(v as any); setScopeId(getDefaultScopeId(v)); }}>
            <SelectTrigger><SelectValue placeholder="Select scope..." /></SelectTrigger>
            <SelectContent>
              {creatableScopes.includes('church') && <SelectItem value="church">Church-wide (all branches)</SelectItem>}
              {creatableScopes.includes('branch') && isMultiBranch && <SelectItem value="branch">Specific Branch</SelectItem>}
              {creatableScopes.includes('department') && <SelectItem value="department">Specific Department</SelectItem>}
              {creatableScopes.includes('unit') && <SelectItem value="unit">Specific Unit</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {scope === 'branch' && isMultiBranch && (
          <div data-field="scopeId">
            <Label>Branch<RequiredStar /></Label>
            <Select value={scopeId} onValueChange={setScopeId}>
              <SelectTrigger><SelectValue placeholder="Select branch..." /></SelectTrigger>
              <SelectContent>
                {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.scopeId && <p className="text-xs text-red-500 mt-1">{errors.scopeId}</p>}
          </div>
        )}

        {scope === 'department' && (
          <div data-field="scopeId">
            <Label>Department<RequiredStar /></Label>
            <Select value={scopeId} onValueChange={setScopeId}>
              <SelectTrigger><SelectValue placeholder="Select department..." /></SelectTrigger>
              <SelectContent>
                {getFilteredDepts(adminLevel === 'branch' ? currentAdmin?.branchId : undefined).map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.scopeId && <p className="text-xs text-red-500 mt-1">{errors.scopeId}</p>}
          </div>
        )}

        {scope === 'unit' && (
          <div data-field="scopeId">
            <Label>Unit<RequiredStar /></Label>
            <Select value={scopeId} onValueChange={setScopeId}>
              <SelectTrigger><SelectValue placeholder="Select unit..." /></SelectTrigger>
              <SelectContent>
                {getFilteredUnits(adminLevel === 'department' ? currentAdmin?.departmentId : undefined).map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.scopeId && <p className="text-xs text-red-500 mt-1">{errors.scopeId}</p>}
          </div>
        )}
      </div>
    );
  };

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  return (
    <Layout>
      <PageHeader
        title="Finance"
        description="Manage your church's income, expenses, collection types, and fundraising campaigns."
      />

      <div className="p-4 md:p-6 space-y-6">
        {loading ? (
          <BibleLoader message="Loading financial records..." />
        ) : (
          <>
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• SCOPE FILTER BAR â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Eye className="w-4 h-4" />
                    View:
                  </div>
                  <Select
                    value={scopeFilter}
                    onValueChange={(v) => {
                      setScopeFilter(v as any);
                      setScopeFilterId('');
                    }}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Finances</SelectItem>
                      {isMultiBranch && canFilterByBranch && <SelectItem value="branch">By Branch</SelectItem>}
                      <SelectItem value="department">By Department</SelectItem>
                      {isMultiBranch && <SelectItem value="unit">By Unit</SelectItem>}
                    </SelectContent>
                  </Select>

                  {scopeFilter === 'branch' && canFilterByBranch && (
                    <Select value={scopeFilterId} onValueChange={setScopeFilterId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select branch..." />
                      </SelectTrigger>
                      <SelectContent>
                        {branchFilterIds.map((branchId) => (
                          <SelectItem key={branchId} value={branchId}>{getBranchName(branchId) || branchId}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {scopeFilter === 'department' && (
                    <Select value={scopeFilterId} onValueChange={setScopeFilterId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select department..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredDepts().map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {scopeFilter === 'unit' && (
                    <Select value={scopeFilterId} onValueChange={setScopeFilterId}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select unit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredUnits().map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {activeTab === 'ledger' && programs.length > 0 && (
                    <Select value={programFilter} onValueChange={setProgramFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Programs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        <SelectItem value="no-program">Manual Entries Only</SelectItem>
                        {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="relative flex-1 min-w-[200px] ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {scopeFilter === 'all'
                    ? 'Showing all financial records across the entire church. Use the filters above to narrow down by branch, department, or unit.'
                    : scopeFilter === 'branch'
                    ? 'Filtered by branch  you\'re viewing income and expenses for a specific branch location.'
                    : scopeFilter === 'department'
                    ? 'Filtered by department  you\'re seeing finances tied to a specific department or outreach.'
                    : 'Filtered by unit  you\'re looking at finances for a specific unit within a department.'
                  }
                </p>
                {ledgerLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Refreshing filtered ledger records...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TABS â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as FinanceTab)}>
              <TabsList className="mb-4">
                <TabsTrigger value="ledger" className="gap-2">
                  <BookOpen className="w-4 h-4" /> Finance Ledger
                </TabsTrigger>
                <TabsTrigger value="collections" className="gap-2">
                  <Tag className="w-4 h-4" /> Collections
                </TabsTrigger>
                <TabsTrigger value="fundraisers" className="gap-2">
                  <Target className="w-4 h-4" /> Fundraisers
                </TabsTrigger>
              </TabsList>

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LEDGER TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              <TabsContent value="ledger" className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Income</p>
                        <p className="text-xl font-bold text-green-600">{currSymbol}{ledgerIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-50">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Expenses</p>
                        <p className="text-xl font-bold text-red-600">{currSymbol}{ledgerExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ledgerBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                        <DollarSign className={`w-5 h-5 ${ledgerBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p className={`text-xl font-bold ${ledgerBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {ledgerBalance < 0 ? '-' : ''}{currSymbol}{Math.abs(ledgerBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Add Button */}
                <div className="flex justify-end">
                  <Button onClick={() => { resetLedgerForm(); setLedgerOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Record Entry
                  </Button>
                </div>

                {filteredLedger.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                        <BookOpen className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No ledger entries yet</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        The finance ledger tracks all income and expenses. Click "Record Entry" to add your first income or expense record. Collections from managed programs also appear here automatically.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    {/* Mobile card list */}
                    <CardContent className="p-3 md:hidden space-y-2">
                      {(() => {
                        let runningBalance = 0;
                        return filteredLedger.slice().reverse().map((entry) => {
                          runningBalance += entry.type === 'income' ? entry.amount : -entry.amount;
                          const scopeTypeLabel = getLedgerScopeTypeLabel(entry);
                          const scopeValue = getLedgerScopeValue(entry);
                          return (
                            <div key={entry.id} className="border rounded-lg p-3 bg-white space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-gray-900 truncate">{getLedgerDisplayDescription(entry)}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{new Date(entry.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className={`text-sm font-bold ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {entry.type === 'income' ? '+' : '-'}{currSymbol}{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge variant={entry.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                                    {entry.type === 'income' ? 'Income' : 'Expense'}
                                  </Badge>
                                  {getLedgerCollectionName(entry) && (
                                    <Badge variant="secondary" className="text-xs">
                                      {getLedgerCollectionName(entry)}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">{scopeTypeLabel}</Badge>
                                  {scopeValue && scopeValue !== 'Church-wide' && scopeValue !== scopeTypeLabel && (
                                    <span className="text-xs text-gray-500">{scopeValue}</span>
                                  )}
                                  {entry.programId && <span className="text-xs text-gray-400">{getProgramName(entry.programId)}</span>}
                                </div>
                                <span className={`text-xs font-semibold ${runningBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                  Bal: {runningBalance < 0 ? '-' : ''}{currSymbol}{Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          );
                        }).reverse();
                      })()}
                    </CardContent>
                    {/* Desktop table */}
                    <CardContent className="p-0 hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Collection</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead className="text-right">Income</TableHead>
                            <TableHead className="text-right">Expense</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            let runningBalance = 0;
                            return filteredLedger.slice().reverse().map((entry) => {
                              runningBalance += entry.type === 'income' ? entry.amount : -entry.amount;
                              return (
                                <TableRow key={entry.id}>
                                  <TableCell className="text-sm whitespace-nowrap">
                                    {new Date(entry.date).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="font-medium text-sm max-w-xs truncate">
                                    {getLedgerDisplayDescription(entry)}
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-600">
                                    {getLedgerCollectionName(entry)
                                      ? <Badge variant="secondary" className="text-xs">{getLedgerCollectionName(entry)}</Badge>
                                      : ''}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-xs w-fit">
                                        {getLedgerScopeTypeLabel(entry)}
                                      </Badge>
                                      {(() => {
                                        const scopeValue = getLedgerScopeValue(entry);
                                        const scopeTypeLabel = getLedgerScopeTypeLabel(entry);
                                        return scopeValue && scopeValue !== 'Church-wide' && scopeValue !== scopeTypeLabel
                                          ? <span className="text-xs text-gray-500">{scopeValue}</span>
                                          : null;
                                      })()}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-500">
                                    {entry.programId ? getProgramName(entry.programId) || '' : ''}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">
                                    {entry.type === 'income' ? `${currSymbol}${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-red-600">
                                    {entry.type === 'expense' ? `${currSymbol}${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                  </TableCell>
                                  <TableCell className={`text-right font-semibold ${runningBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {runningBalance < 0 ? '-' : ''}{currSymbol}{Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                  </TableCell>
                                </TableRow>
                              );
                            }).reverse();
                          })()}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• COLLECTIONS TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              <TabsContent value="collections" className="space-y-6">
                {/* Collection Types Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Collection Types</h3>
                      <p className="text-sm text-gray-500">
                        Define the types of collections your church accepts (e.g. Tithe, Offering). These show up as options when creating programs.
                      </p>
                    </div>
                    <Button onClick={() => { resetCtForm(); setCtOpen(true); }} size="sm">
                      <Plus className="w-4 h-4 mr-1" /> Add Type
                    </Button>
                  </div>

                  {filteredCTs.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 mb-3">
                          <Tag className="w-7 h-7 text-purple-400" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-2">No collection types defined</h3>
                        <p className="text-gray-500 text-sm max-w-md mx-auto">
                          Create collection types like "Tithe", "Offering", or "Special Appeal" so they can be assigned to programs during creation.
                          {isSuperAdmin
                            ? ' As a Super Admin, you can create church-wide types that apply to all branches.'
                            : ` You can create types for your assigned ${adminLevel}.`}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {/* Church-wide types */}
                      {filteredCTs.filter(ct => ct.scope === 'church').length > 0 && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Building2 className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-semibold text-gray-700">Church-wide Collection Types</span>
                              <Badge variant="outline" className="text-xs ml-1">All Branches</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {filteredCTs.filter(ct => ct.scope === 'church').map(ct => (
                                <div key={ct.id} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
                                  {ct.name}
                                  {isSuperAdmin && (
                                    <button
                                      className="ml-1 text-blue-400 hover:text-red-500"
                                      onClick={() => setDeleteTarget({ type: 'ct', id: ct.id, name: ct.name })}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Scoped types */}
                      {filteredCTs.filter(ct => ct.scope !== 'church').length > 0 && (
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Layers className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-semibold text-gray-700">Scoped Collection Types</span>
                            </div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Level</TableHead>
                                  <TableHead>Assigned To</TableHead>
                                  <TableHead className="w-10"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredCTs.filter(ct => ct.scope !== 'church').map(ct => (
                                  <TableRow key={ct.id}>
                                    <TableCell className="font-medium">{ct.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="capitalize">{ct.scope}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">{getAssignedScopeLabel(ct)}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 p-1"
                                        onClick={() => setDeleteTarget({ type: 'ct', id: ct.id, name: ct.name })}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Program Collections */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Program Collections</h3>
                    <p className="text-sm text-gray-500">
                      Collections recorded through program management. These are automatically added when you manage a program and enter collection amounts.
                    </p>
                  </div>

                  {programColls.length === 0 ? (
                    <Card>
                      <CardContent className="py-10 text-center">
                        <p className="text-gray-500 text-sm">
                          No program collections have been recorded yet. Go to <strong>Programs & Events</strong> to manage a program and enter collection amounts.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Collection Name</TableHead>
                              <TableHead>Program</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {programColls
                              .filter(c => {
                                if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !getProgramName(c.programId).toLowerCase().includes(searchTerm.toLowerCase())) return false;
                                return true;
                              })
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map(c => (
                                <TableRow key={c.id}>
                                  <TableCell className="text-sm">{new Date(c.date).toLocaleDateString()}</TableCell>
                                  <TableCell className="font-medium">{c.name}</TableCell>
                                  <TableCell><Badge variant="outline">{getProgramName(c.programId) || '-'}</Badge></TableCell>
                                  <TableCell className="text-right font-semibold text-green-600">{currSymbol}{c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FUNDRAISERS TAB â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
              <TabsContent value="fundraisers" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Fundraisers</h3>
                    <p className="text-sm text-gray-500">
                      Standalone fundraising campaigns with target amounts and donor tracking (e.g. "Buy a New Church Bus").
                    </p>
                  </div>
                  <Button onClick={() => { resetFundForm(); setFundOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> New Fundraiser
                  </Button>
                </div>

                {filteredFundraisers.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4">
                        <Target className="w-8 h-8 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No fundraisers created yet</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Create a fundraiser for special projects like building renovations, equipment purchases, or mission trips. Set a target amount, due date, and track individual donations.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFundraisers.map(fund => {
                      const raised = fund.entries.reduce((s, e) => s + e.amount, 0);
                      const pct = fund.targetAmount > 0 ? Math.min((raised / fund.targetAmount) * 100, 100) : 0;
                      const isOverdue = new Date(fund.dueDate) < new Date() && pct < 100;
                      const isComplete = pct >= 100;
                      return (
                        <Card key={fund.id} className={`${isComplete ? 'border-green-200 bg-green-50/30' : isOverdue ? 'border-orange-200 bg-orange-50/30' : ''}`}>
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">{fund.name}</h4>
                                {fund.description && (
                                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{fund.description}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
                                {isOverdue && <AlertCircle className="w-4 h-4 text-orange-500" />}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-xs capitalize">{getAssignedScopeLabel(fund)}</Badge>
                              <Badge variant="outline" className={`text-xs ${isOverdue ? 'text-orange-600 border-orange-300' : ''}`}>
                                <CalendarDays className="w-3 h-3 mr-1" />
                                Due: {new Date(fund.dueDate).toLocaleDateString()}
                              </Badge>
                            </div>

                            <div className="mb-3">
                              <div className="flex justify-between text-sm mb-1.5">
                                <span className="text-gray-600">
                                  {currSymbol}{raised.toLocaleString(undefined, { minimumFractionDigits: 2 })} raised
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {currSymbol}{fund.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} goal
                                </span>
                              </div>
                              <Progress value={pct} className="h-2.5" />
                              <p className="text-xs text-gray-500 mt-1">{pct.toFixed(1)}%  {fund.entries.length} donation{fund.entries.length !== 1 ? 's' : ''}</p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => setViewFundId(fund.id)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                              {!isComplete && (
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => {
                                    setDonateFundId(fund.id);
                                    resetDonateForm();
                                    setDonateOpen(true);
                                  }}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Donation
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 px-2"
                                onClick={() => setDeleteTarget({ type: 'fund', id: fund.id, name: fund.name })}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• LEDGER ENTRY DIALOG â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Dialog open={ledgerOpen} onOpenChange={v => { if (!v) setLedgerOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Ledger Entry</DialogTitle>
            <DialogDescription>
              Add an income or expense entry to the finance ledger. Each entry must have a description.
            </DialogDescription>
          </DialogHeader>
          <div ref={ledgerFormRef} className="space-y-4 pt-2">
            {/* Type Switcher */}
            <div data-field="type">
              <Label>Entry Type<RequiredStar /></Label>
              <div className="flex gap-2 mt-1.5">
                <button
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    ledgerType === 'income' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                  onClick={() => setLedgerType('income')}
                >
                  <TrendingUp className="w-4 h-4" /> Income
                </button>
                <button
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                    ledgerType === 'expense' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                  onClick={() => setLedgerType('expense')}
                >
                  <TrendingDown className="w-4 h-4" /> Expense
                </button>
              </div>
            </div>

            <div data-field="amount">
              <Label>Amount ({currSymbol})<RequiredStar /></Label>
              <Input
                type="text"
                inputMode="decimal"
                value={ledgerAmount}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = raw.split('.');
                  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  const formatted = parts.length > 1 ? `${intPart}.${parts[1].slice(0, 2)}` : intPart;
                  setLedgerAmount(formatted);
                  setLedgerErrors(p => ({ ...p, amount: '' }));
                }}
                placeholder="0.00"
              />
              {ledgerErrors.amount && <p className="text-xs text-red-500 mt-1">{ledgerErrors.amount}</p>}
            </div>

            <div data-field="desc">
              <Label>Description<RequiredStar /></Label>
              <Textarea
                value={ledgerDesc}
                onChange={e => { setLedgerDesc(e.target.value); setLedgerErrors(p => ({ ...p, desc: '' })); }}
                placeholder="e.g. Purchase of sound equipment, Sunday offering proceeds..."
                rows={2}
              />
              {ledgerErrors.desc && <p className="text-xs text-red-500 mt-1">{ledgerErrors.desc}</p>}
            </div>

            <div data-field="date">
              <Label>Date<RequiredStar /></Label>
              <Input
                type="date"
                value={ledgerDate}
                onChange={e => { setLedgerDate(e.target.value); setLedgerErrors(p => ({ ...p, date: '' })); }}
              />
              {ledgerErrors.date && <p className="text-xs text-red-500 mt-1">{ledgerErrors.date}</p>}
            </div>

            {availableLedgerCollectionTypes.length > 0 && (
              <div>
                <Label>Link to Collection <span className="text-gray-400 font-normal">(optional)</span></Label>
                <p className="text-xs text-gray-500 mb-1.5">Tie this ledger record to a collection type for cleaner reporting and easier search.</p>
                <Select value={ledgerCollectionTypeId} onValueChange={setLedgerCollectionTypeId}>
                  <SelectTrigger><SelectValue placeholder="No collection" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No collection</SelectItem>
                    {availableLedgerCollectionTypes.map(ct => <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Optional Scope */}
            <Separator />
            <p className="text-xs text-gray-500">If this income or expense belongs to a particular branch, department, or unit, you can tag it below. This helps you see exactly where the money is coming from or going to. If it's a general church entry, just leave these blank.</p>

            {isMultiBranch && (
              <div>
                <Label>Branch</Label>
                <Select value={ledgerBranchId} onValueChange={v => { setLedgerBranchId(v); setLedgerDeptId(''); setLedgerUnitId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Church level (no branch)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Church level</SelectItem>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Department</Label>
              <Select value={ledgerDeptId} onValueChange={v => { setLedgerDeptId(v); setLedgerUnitId(''); }}>
                <SelectTrigger><SelectValue placeholder="No department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No department</SelectItem>
                  {getFilteredDepts(ledgerBranchId && ledgerBranchId !== 'none' ? ledgerBranchId : undefined).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {ledgerDeptId && ledgerDeptId !== 'none' && (
              <div>
                <Label>Unit</Label>
                <Select value={ledgerUnitId} onValueChange={setLedgerUnitId}>
                  <SelectTrigger><SelectValue placeholder="No unit" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No unit</SelectItem>
                    {getFilteredUnits(ledgerDeptId).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Optional Program Tag */}
            {programs.length > 0 && (
              <div>
                <Label>Tag a Program <span className="text-gray-400 font-normal">(optional)</span></Label>
                <p className="text-xs text-gray-500 mb-1.5">Link this entry to a specific program so you can track finances per program later.</p>
                <Select value={ledgerProgramId} onValueChange={setLedgerProgramId}>
                  <SelectTrigger><SelectValue placeholder="No program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No program</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setLedgerOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSaveLedger}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record {ledgerType === 'income' ? 'Income' : 'Expense'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• COLLECTION TYPE DIALOG â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Dialog open={ctOpen} onOpenChange={v => { if (!v) setCtOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Collection Type</DialogTitle>
            <DialogDescription>
              Define a type of collection (e.g. "Tithe", "Offering") that can be assigned to programs.
              {isSuperAdmin && ' Church-wide types apply to all branches.'}
            </DialogDescription>
          </DialogHeader>
          <div ref={ctFormRef} className="space-y-4 pt-2">
            <div data-field="name">
              <Label>Collection Type Name<RequiredStar /></Label>
              <Input
                value={ctName}
                onChange={e => { setCtName(e.target.value); setCtErrors(p => ({ ...p, name: '' })); }}
                placeholder='e.g. "Tithe", "Offering", "Building Fund"'
              />
              {ctErrors.name && <p className="text-xs text-red-500 mt-1">{ctErrors.name}</p>}
            </div>

            <ScopeSelector
              scope={ctScope}
              setScope={setCtScope}
              scopeId={ctScopeId}
              setScopeId={setCtScopeId}
              errors={ctErrors}
              fieldPrefix="ct"
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setCtOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSaveCT}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Collection Type
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FUNDRAISER DIALOG â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Dialog open={fundOpen} onOpenChange={v => { if (!v) setFundOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Fundraiser</DialogTitle>
            <DialogDescription>
              Set up a fundraising campaign with a target amount and due date. Track individual donations from members and contributors.
            </DialogDescription>
          </DialogHeader>
          <div ref={fundFormRef} className="space-y-4 pt-2">
            <div data-field="name">
              <Label>Fundraiser Name<RequiredStar /></Label>
              <Input
                value={fundName}
                onChange={e => { setFundName(e.target.value); setFundErrors(p => ({ ...p, name: '' })); }}
                placeholder='e.g. "New Church Bus", "Building Renovation"'
              />
              {fundErrors.name && <p className="text-xs text-red-500 mt-1">{fundErrors.name}</p>}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={fundDesc}
                onChange={e => setFundDesc(e.target.value)}
                placeholder="Optional description of the fundraiser's purpose..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div data-field="target">
                <Label>Target Amount ({currSymbol})<RequiredStar /></Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={fundTarget}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = raw.split('.');
                    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    const formatted = parts.length > 1 ? `${intPart}.${parts[1].slice(0, 2)}` : intPart;
                    setFundTarget(formatted);
                    setFundErrors(p => ({ ...p, target: '' }));
                  }}
                  placeholder="0.00"
                />
                {fundErrors.target && <p className="text-xs text-red-500 mt-1">{fundErrors.target}</p>}
              </div>
              <div data-field="dueDate">
                <Label>Due Date<RequiredStar /></Label>
                <Input
                  type="date"
                  value={fundDueDate}
                  onChange={e => { setFundDueDate(e.target.value); setFundErrors(p => ({ ...p, dueDate: '' })); }}
                />
                {fundErrors.dueDate && <p className="text-xs text-red-500 mt-1">{fundErrors.dueDate}</p>}
              </div>
            </div>

            <ScopeSelector
              scope={fundScope}
              setScope={setFundScope}
              scopeId={fundScopeId}
              setScopeId={setFundScopeId}
              errors={fundErrors}
              fieldPrefix="fund"
            />

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setFundOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSaveFund}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Fundraiser
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DONATION DIALOG â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Dialog open={donateOpen} onOpenChange={v => { if (!v) setDonateOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Donation</DialogTitle>
            <DialogDescription>
              Add a donation entry for "{standaloneColls.find(s => s.id === donateFundId)?.name}".
            </DialogDescription>
          </DialogHeader>
          <div ref={donateFormRef} className="space-y-4 pt-2">
            <div data-field="name">
              <Label>Donor Name<RequiredStar /></Label>
              <Input
                value={donateName}
                onChange={e => { setDonateName(e.target.value); setDonateErrors(p => ({ ...p, name: '' })); }}
                placeholder="Full name of the donor"
              />
              {donateErrors.name && <p className="text-xs text-red-500 mt-1">{donateErrors.name}</p>}
            </div>

            <div data-field="amount">
              <Label>Amount ({currSymbol})<RequiredStar /></Label>
              <Input
                type="text"
                inputMode="decimal"
                value={donateAmount}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '');
                  const parts = raw.split('.');
                  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  const formatted = parts.length > 1 ? `${intPart}.${parts[1].slice(0, 2)}` : intPart;
                  setDonateAmount(formatted);
                  setDonateErrors(p => ({ ...p, amount: '' }));
                }}
                placeholder="0.00"
              />
              {donateErrors.amount && <p className="text-xs text-red-500 mt-1">{donateErrors.amount}</p>}
            </div>

            <div data-field="date">
              <Label>Date<RequiredStar /></Label>
              <Input
                type="date"
                value={donateDate}
                onChange={e => { setDonateDate(e.target.value); setDonateErrors(p => ({ ...p, date: '' })); }}
              />
              {donateErrors.date && <p className="text-xs text-red-500 mt-1">{donateErrors.date}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setDonateOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSaveDonation}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record Donation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• VIEW FUNDRAISER DIALOG â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <Dialog open={!!viewFundId} onOpenChange={() => setViewFundId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {(() => {
            const fund = standaloneColls.find(s => s.id === viewFundId);
            if (!fund) return null;
            const raised = fund.entries.reduce((s, e) => s + e.amount, 0);
            const pct = fund.targetAmount > 0 ? Math.min((raised / fund.targetAmount) * 100, 100) : 0;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{fund.name}</DialogTitle>
                  <DialogDescription>
                    {fund.description || 'Fundraising campaign details and donation history.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize">{getAssignedScopeLabel(fund)}</Badge>
                    <Badge variant="outline">
                      <CalendarDays className="w-3 h-3 mr-1" />
                      Due: {new Date(fund.dueDate).toLocaleDateString()}
                    </Badge>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">
                        {currSymbol}{raised.toLocaleString(undefined, { minimumFractionDigits: 2 })} raised
                      </span>
                      <span className="font-semibold text-gray-900">
                        of {currSymbol}{fund.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Progress value={pct} className="h-3" />
                    <p className="text-xs text-gray-500 mt-1.5">{pct.toFixed(1)}% of goal reached</p>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Donations ({fund.entries.length})</h4>
                      {pct < 100 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setDonateFundId(fund.id);
                            resetDonateForm();
                            setDonateOpen(true);
                            setViewFundId(null);
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add
                        </Button>
                      )}
                    </div>

                    {fund.entries.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No donations recorded yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fund.entries
                          .slice()
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry, idx) => (
                            <div key={entry.id || idx} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-lg">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{entry.donorName}</p>
                                <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                              </div>
                              <p className="text-sm font-semibold text-green-600">
                                {currSymbol}{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• DELETE CONFIRM â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'ledger' ? 'Ledger Entry' : deleteTarget?.type === 'ct' ? 'Collection Type' : 'Fundraiser'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}








