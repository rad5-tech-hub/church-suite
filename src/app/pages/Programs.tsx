import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox';
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
  Calendar as CalendarIcon,
  Plus,
  Search,
  X,
  Loader2,
  CheckCircle,
  LayoutGrid,
  Clock,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Program,
  ProgramInstance,
  ProgramFrequency,
  ProgramStatus,
  Department,
  WorkforceMember,
  Collection,
  CollectionType,
  Member,
} from '../types';
import {
  fetchPrograms,
  savePrograms,
  createEvent,
  softDeleteEvent,
  fetchProgramInstances,
  saveProgramInstances,
  fetchDepartments,
  fetchWorkforce,
  fetchCollections,
  saveCollections,
  fetchMembers,
  fetchCollectionTypes,
} from '../api';

type ViewMode = 'calendar' | 'grid';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PIE_COLORS = ['#3B82F6', '#EC4899', '#F59E0B'];

function RequiredStar() {
  return <span className="text-red-500 ml-0.5">*</span>;
}

export function Programs() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const isMultiBranch = church.type === 'multi' && branches.length > 0;
  const resolvedBranchId = isMultiBranch ? undefined : branches[0]?.id;

  // Data
  const [programs, setPrograms] = useState<Program[]>([]);
  const [instances, setInstances] = useState<ProgramInstance[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [financeCollectionTypes, setFinanceCollectionTypes] = useState<CollectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Views
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState('');
  const [cType, setCType] = useState<ProgramFrequency | ''>('');
  const [cWeeklyDays, setCWeeklyDays] = useState<number[]>([]);
  const [cMonthlyDate, setCMonthlyDate] = useState('');
  const [cCustomDates, setCCustomDates] = useState<string[]>([]);
  const [cCustomPickerMonth, setCCustomPickerMonth] = useState(new Date().getMonth());
  const [cCustomPickerYear, setCCustomPickerYear] = useState(new Date().getFullYear());
  const [cStartTime, setCStartTime] = useState('');
  const [cEndTime, setCEndTime] = useState('');
  const [cBranchId, setCBranchId] = useState('');
  const [cDeptIds, setCDeptIds] = useState<string[]>([]);
  const [cCollTypes, setCCollTypes] = useState<string[]>([]);
  const [cOneTimeDate, setCOneTimeDate] = useState('');
  const [cCustomDateTimes, setCCustomDateTimes] = useState<Record<string, { startTime: string; endTime: string }>>({});

  // Validation
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  // Edit
  const [editTarget, setEditTarget] = useState<Program | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  // Manage dialog
  const [manageInstance, setManageInstance] = useState<{ program: Program; instance: ProgramInstance } | null>(null);
  const [mAttendCats, setMAttendCats] = useState<('men' | 'women' | 'children')[]>([]);
  const [mMen, setMMen] = useState('');
  const [mWomen, setMWomen] = useState('');
  const [mChildren, setMChildren] = useState('');
  const [mWorkforceChecked, setMWorkforceChecked] = useState<string[]>([]);
  const [mCollAmounts, setMCollAmounts] = useState<Record<string, string>>({});

  // Load
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [progs, insts, deps, wf, colls, mems, cts] = await Promise.all([
        fetchPrograms(resolvedBranchId),
        fetchProgramInstances(),
        fetchDepartments(),
        fetchWorkforce(),
        fetchCollections(),
        fetchMembers(),
        fetchCollectionTypes(),
      ]);
      setPrograms(progs as Program[]);
      setInstances(insts as ProgramInstance[]);
      setDepartments(deps as Department[]);
      setWorkforce(wf as WorkforceMember[]);
      setCollections(colls as Collection[]);
      setMembers(mems as Member[]);
      setFinanceCollectionTypes(cts as CollectionType[]);
    } catch (err) {
      console.error('Failed to load programs data:', err);
    } finally {
      setLoading(false);
    }
  }, [church.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const { showToast } = useToast();

  // ──────── HELPERS ────────
  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || '';
  const getBranchName = (id?: string) => {
    if (!id) return '';
    if (id === 'churchwide') return 'Church-wide';
    return branches.find(b => b.id === id)?.name || '';
  };
  const getMemberName = (memberId: string) => members.find(m => m.id === memberId)?.fullName || 'Unknown Member';

  const deptsForBranch = (branchId: string) => departments.filter(d => d.branchId === branchId);

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  /** Get start/end time for a program on a specific date (uses per-date times for custom) */
  const getTimesForDate = (prog: Program, date: string): { start: string; end: string } => {
    if (prog.type === 'custom' && prog.customDateTimes) {
      const cdt = prog.customDateTimes.find(dt => dt.date === date);
      if (cdt) return { start: cdt.startTime, end: cdt.endTime };
    }
    return { start: prog.startTime, end: prog.endTime };
  };

  // ──────── PROGRAM STATUS ────────
  const getOccurrenceDates = useCallback((prog: Program, rangeStart: Date, rangeEnd: Date): string[] => {
    const dates: string[] = [];
    if (prog.type === 'one-time') {
      if (prog.customDates && prog.customDates.length > 0) {
        const d = prog.customDates[0];
        const dt = new Date(d + 'T00:00:00');
        if (dt >= rangeStart && dt <= rangeEnd) dates.push(d);
      }
    } else if (prog.type === 'weekly' && prog.weeklyDays) {
      const cur = new Date(rangeStart);
      while (cur <= rangeEnd) {
        if (prog.weeklyDays.includes(cur.getDay())) {
          dates.push(cur.toISOString().split('T')[0]);
        }
        cur.setDate(cur.getDate() + 1);
      }
    } else if (prog.type === 'monthly' && prog.monthlyDate) {
      const cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (cur <= rangeEnd) {
        const dt = new Date(cur.getFullYear(), cur.getMonth(), prog.monthlyDate);
        if (dt.getMonth() === cur.getMonth() && dt >= rangeStart && dt <= rangeEnd) {
          dates.push(dt.toISOString().split('T')[0]);
        }
        cur.setMonth(cur.getMonth() + 1);
      }
    } else if (prog.type === 'custom' && prog.customDates) {
      prog.customDates.forEach(d => {
        const dt = new Date(d + 'T00:00:00');
        if (dt >= rangeStart && dt <= rangeEnd) dates.push(d);
      });
    }
    return dates;
  }, []);

  const getProgramStatus = useCallback((prog: Program, date: string): ProgramStatus => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    // Use per-date times for custom programs
    let sTime = prog.startTime || '00:00';
    let eTime = prog.endTime || '23:59';
    if (prog.type === 'custom' && prog.customDateTimes) {
      const cdt = prog.customDateTimes.find(dt => dt.date === date);
      if (cdt) { sTime = cdt.startTime; eTime = cdt.endTime; }
    }
    const [sh, sm] = sTime.split(':').map(Number);
    const [eh, em] = eTime.split(':').map(Number);
    const start = new Date(date + 'T00:00:00');
    start.setHours(sh, sm, 0);
    const end = new Date(date + 'T00:00:00');
    end.setHours(eh, em, 0);

    const inst = instances.find(i => i.programId === prog.id && i.date === date);

    if (date > today) return 'upcoming';
    if (date === today && now < start) return 'upcoming';
    if (date === today && now >= start && now <= end) return 'ongoing';
    // Past
    if (inst?.managed) return 'past';
    return 'unmanaged';
  }, [instances]);

  const statusColor = (s: ProgramStatus) => {
    switch (s) {
      case 'ongoing': return 'bg-green-500';
      case 'unmanaged': return 'bg-yellow-500';
      case 'past': return 'bg-gray-400';
      case 'upcoming': return 'bg-purple-500';
    }
  };

  const statusBadgeClass = (s: ProgramStatus) => {
    switch (s) {
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-200';
      case 'unmanaged': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'past': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'upcoming': return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  const statusLabel = (s: ProgramStatus) => {
    switch (s) {
      case 'ongoing': return 'Ongoing';
      case 'unmanaged': return 'Needs Attention';
      case 'past': return 'Past';
      case 'upcoming': return 'Upcoming';
    }
  };

  // ──────── LIST DATA ────────
  // Generate occurrences for the next 90 days and past 30 days
  const listOccurrences = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date(now);
    rangeStart.setDate(rangeStart.getDate() - 30);
    const rangeEnd = new Date(now);
    rangeEnd.setDate(rangeEnd.getDate() + 90);

    const occs: { program: Program; date: string; status: ProgramStatus }[] = [];
    programs.forEach(prog => {
      const dates = getOccurrenceDates(prog, rangeStart, rangeEnd);
      dates.forEach(d => {
        occs.push({ program: prog, date: d, status: getProgramStatus(prog, d) });
      });
    });
    occs.sort((a, b) => a.date.localeCompare(b.date));
    return occs;
  }, [programs, getOccurrenceDates, getProgramStatus]);

  const filteredOccurrences = listOccurrences.filter(o => {
    if (!searchTerm) return true;
    return o.program.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ──────── GRID DATA ────────
  // Group unique programs with their next occurrence and status
  const gridPrograms = useMemo(() => {
    const filtered = programs.filter(p => {
      if (!searchTerm) return true;
      return p.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return filtered.map(prog => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      // Find the closest next occurrence (or today's)
      const futureOccs = listOccurrences
        .filter(o => o.program.id === prog.id && o.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date));
      const pastOccs = listOccurrences
        .filter(o => o.program.id === prog.id && o.date < todayStr)
        .sort((a, b) => b.date.localeCompare(a.date));

      const nextOcc = futureOccs[0] || null;
      const lastOcc = pastOccs[0] || null;
      const status: ProgramStatus = nextOcc ? nextOcc.status : (lastOcc ? lastOcc.status : 'past');

      // Count total managed instances
      const managedCount = instances.filter(i => i.programId === prog.id && i.managed).length;
      const totalOccs = listOccurrences.filter(o => o.program.id === prog.id).length;

      // Frequency label
      let freqLabel = '';
      switch (prog.type) {
        case 'weekly': freqLabel = `Weekly — ${(prog.weeklyDays || []).map(d => DAY_NAMES[d]).join(', ')}`; break;
        case 'monthly': freqLabel = `Monthly — ${prog.monthlyDate}${prog.monthlyDate === 1 ? 'st' : prog.monthlyDate === 2 ? 'nd' : prog.monthlyDate === 3 ? 'rd' : 'th'}`; break;
        case 'one-time': freqLabel = 'One-time event'; break;
        case 'custom': freqLabel = `Custom — ${(prog.customDates || []).length} date${(prog.customDates || []).length !== 1 ? 's' : ''}`; break;
      }

      return { prog, nextOcc, lastOcc, status, managedCount, totalOccs, freqLabel };
    });
  }, [programs, listOccurrences, instances, searchTerm]);

  // ──────── CALENDAR DATA ────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Pad start
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(calYear, calMonth, -i);
      days.push({ date: d.toISOString().split('T')[0], dayNum: d.getDate(), isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(calYear, calMonth, d);
      days.push({ date: dt.toISOString().split('T')[0], dayNum: d, isCurrentMonth: true });
    }
    // Pad end
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calYear, calMonth + 1, i);
      days.push({ date: d.toISOString().split('T')[0], dayNum: d.getDate(), isCurrentMonth: false });
    }
    return days;
  }, [calMonth, calYear]);

  const calendarOccurrences = useMemo(() => {
    const rangeStart = new Date(calYear, calMonth, 1);
    rangeStart.setDate(rangeStart.getDate() - 7);
    const rangeEnd = new Date(calYear, calMonth + 1, 7);

    const map: Record<string, { program: Program; status: ProgramStatus }[]> = {};
    programs.forEach(prog => {
      const dates = getOccurrenceDates(prog, rangeStart, rangeEnd);
      dates.forEach(d => {
        if (!map[d]) map[d] = [];
        map[d].push({ program: prog, status: getProgramStatus(prog, d) });
      });
    });
    return map;
  }, [programs, calMonth, calYear, getOccurrenceDates, getProgramStatus]);

  const today = new Date().toISOString().split('T')[0];

  // ──────── FORM VALIDATION ────────
  const scrollToError = (errors: Record<string, string>) => {
    const firstKey = Object.keys(errors)[0];
    if (firstKey && fieldRefs.current[firstKey]) {
      fieldRefs.current[firstKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldRefs.current[firstKey]?.focus?.();
    }
  };

  const validateCreateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!cName.trim()) errors.cName = 'Program title is required';
    if (!cType) errors.cType = 'Please select a program type';
    if (cType === 'one-time' && !cOneTimeDate) errors.cOneTimeDate = 'Please select a date for this event';
    if (cType === 'weekly' && cWeeklyDays.length === 0) errors.cWeeklyDays = 'Please select at least one day';
    if (cType === 'monthly' && !cMonthlyDate) errors.cMonthlyDate = 'Please select a day of the month';
    if (cType === 'custom' && cCustomDates.length === 0) errors.cCustomDates = 'Please select at least one date';
    if (cType !== 'custom') {
      if (!cStartTime) errors.cStartTime = 'Start time is required';
      if (!cEndTime) errors.cEndTime = 'End time is required';
      if (cStartTime && cEndTime && cStartTime >= cEndTime) errors.cEndTime = 'End time must be after start time';
    }
    if (cType === 'custom' && cCustomDates.length > 0) {
      for (const d of cCustomDates) {
        const dt = cCustomDateTimes[d];
        if (!dt?.startTime) { errors.cCustomDateTimes = 'Please set a start time for each selected date'; break; }
        if (!dt?.endTime) { errors.cCustomDateTimes = 'Please set an end time for each selected date'; break; }
        if (dt.startTime >= dt.endTime) { errors.cCustomDateTimes = `End time must be after start time for ${new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`; break; }
      }
    }
    if (isMultiBranch && !cBranchId) errors.cBranchId = 'Please select a branch';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setTimeout(() => scrollToError(errors), 100);
      return false;
    }
    return true;
  };

  // ──────── CREATE / EDIT ────────
  const resetCreateForm = () => {
    setCName('');
    setCType('');
    setCWeeklyDays([]);
    setCMonthlyDate('');
    setCCustomDates([]);
    setCStartTime('');
    setCEndTime('');
    setCBranchId('');
    setCDeptIds([]);
    setCCollTypes([]);
    setCOneTimeDate('');
    setCCustomDateTimes({});
    setFormErrors({});
    setEditTarget(null);
  };

  const openEdit = (prog: Program) => {
    setEditTarget(prog);
    setCName(prog.name);
    setCType(prog.type);
    setCWeeklyDays(prog.weeklyDays || []);
    setCMonthlyDate(prog.monthlyDate?.toString() || '');
    setCCustomDates(prog.customDates || []);
    setCStartTime(prog.startTime);
    setCEndTime(prog.endTime);
    setCBranchId(prog.branchId || '');
    setCDeptIds(prog.departmentIds || []);
    setCCollTypes(prog.collectionTypes || []);
    setCOneTimeDate(prog.type === 'one-time' && prog.customDates?.length ? prog.customDates[0] : '');
    // Populate per-date times
    const dtMap: Record<string, { startTime: string; endTime: string }> = {};
    if (prog.customDateTimes) {
      prog.customDateTimes.forEach(cdt => { dtMap[cdt.date] = { startTime: cdt.startTime, endTime: cdt.endTime }; });
    } else if (prog.type === 'custom' && prog.customDates) {
      prog.customDates.forEach(d => { dtMap[d] = { startTime: prog.startTime, endTime: prog.endTime }; });
    }
    setCCustomDateTimes(dtMap);
    setFormErrors({});
    setCreateOpen(true);
  };

  const handleSaveProgram = async () => {
    if (!validateCreateForm()) return;
    setSaving(true);
    try {
      // Determine branchId — use selected branch or first branch for single-branch
      const eventBranchId = isMultiBranch
        ? (cBranchId === 'churchwide' ? undefined : cBranchId)
        : branches[0]?.id;

      // Map form recurrence type to API recurrenceType
      const recurrenceMap: Record<string, string> = {
        'one-time': 'none',
        'weekly': 'weekly',
        'monthly': 'monthly',
        'custom': 'custom',
      };

      // Determine the event date
      let eventDate = '';
      if (cType === 'one-time') eventDate = cOneTimeDate;
      else if (cType === 'custom' && cCustomDates.length > 0) eventDate = cCustomDates[0];
      else eventDate = new Date().toISOString().split('T')[0];

      // Build byWeekday for weekly programs
      const byWeekday = cType === 'weekly'
        ? cWeeklyDays.map(day => ({ weekday: day, startTime: cStartTime, endTime: cEndTime }))
        : undefined;

      if (editTarget) {
        // For edit: update local state (no edit-event endpoint used here yet)
        const allProgs = await fetchPrograms(resolvedBranchId);
        const progData: Program = {
          id: editTarget.id,
          churchId: church.id,
          branchId: eventBranchId,
          name: cName.trim(),
          type: cType as ProgramFrequency,
          weeklyDays: cType === 'weekly' ? cWeeklyDays : undefined,
          monthlyDate: cType === 'monthly' ? parseInt(cMonthlyDate) : undefined,
          customDates: cType === 'custom' ? cCustomDates : cType === 'one-time' ? [cOneTimeDate] : undefined,
          customDateTimes: cType === 'custom' ? cCustomDates.map(d => ({
            date: d,
            startTime: cCustomDateTimes[d]?.startTime || cStartTime,
            endTime: cCustomDateTimes[d]?.endTime || cEndTime,
          })) : undefined,
          startTime: cType === 'custom' ? (cCustomDates.length > 0 ? (cCustomDateTimes[cCustomDates[0]]?.startTime || '00:00') : cStartTime) : cStartTime,
          endTime: cType === 'custom' ? (cCustomDates.length > 0 ? (cCustomDateTimes[cCustomDates[0]]?.endTime || '23:59') : cEndTime) : cEndTime,
          departmentIds: cDeptIds,
          collectionTypes: cCollTypes,
          createdBy: currentAdmin?.id || '',
          createdAt: editTarget.createdAt || new Date(),
        };
        const updated = (allProgs as Program[]).map(p => p.id === editTarget.id ? progData : p);
        await savePrograms(updated);
        setPrograms(updated);
        showToast('Program updated.');
      } else {
        // Create via real API
        await createEvent({
          title: cName.trim(),
          date: eventDate ? new Date(eventDate + 'T00:00:00').toISOString() : new Date().toISOString(),
          recurrenceType: (recurrenceMap[cType] || 'none') as any,
          branchId: eventBranchId,
          departmentIds: cDeptIds.length > 0 ? cDeptIds : undefined,
          byWeekday,
        });
        // Reload from server
        const freshProgs = await fetchPrograms(eventBranchId || resolvedBranchId);
        setPrograms(freshProgs as Program[]);
        showToast('Program created successfully.');
      }

      setCreateOpen(false);
      resetCreateForm();
    } catch (err: any) {
      console.error('Failed to save program:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────── DELETE ────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.id.startsWith('prog-')) {
        // Locally-created program — just remove from local state
        const allProgs = await fetchPrograms(resolvedBranchId);
        const updated = (allProgs as Program[]).filter(p => p.id !== deleteTarget.id);
        await savePrograms(updated);
        setPrograms(updated);
      } else {
        // Server-created event — use soft delete API
        await softDeleteEvent(deleteTarget.id);
        const freshProgs = await fetchPrograms(resolvedBranchId);
        setPrograms(freshProgs as Program[]);
      }
      // Remove related instances
      const allInsts = await fetchProgramInstances();
      const updatedInsts = (allInsts as ProgramInstance[]).filter(i => i.programId !== deleteTarget.id);
      await saveProgramInstances(updatedInsts);
      setInstances(updatedInsts as ProgramInstance[]);
      setDeleteTarget(null);
      showToast(`"${deleteTarget.name}" deleted.`);
    } catch (err: any) {
      console.error('Failed to delete program:', err);
    } finally {
      setSaving(false);
    }
  };

  // ──────── MANAGE (click on occurrence) ────────
  const openManage = (prog: Program, date: string) => {
    const existing = instances.find(i => i.programId === prog.id && i.date === date);
    const inst: ProgramInstance = existing || {
      id: `inst-${Date.now()}`,
      programId: prog.id,
      churchId: church.id,
      date,
      attendance: {},
      workforceAttendance: [],
      collections: [],
      managed: false,
    };

    setManageInstance({ program: prog, instance: inst });

    // Pre-fill
    const cats: ('men' | 'women' | 'children')[] = [];
    if (inst.attendance.men !== undefined) cats.push('men');
    if (inst.attendance.women !== undefined) cats.push('women');
    if (inst.attendance.children !== undefined) cats.push('children');
    setMAttendCats(cats);
    setMMen(inst.attendance.men?.toString() || '');
    setMWomen(inst.attendance.women?.toString() || '');
    setMChildren(inst.attendance.children?.toString() || '');
    setMWorkforceChecked(inst.workforceAttendance || []);

    const amts: Record<string, string> = {};
    (prog.collectionTypes || []).forEach(ct => {
      const existing = inst.collections.find(c => c.name === ct);
      amts[ct] = existing?.amount?.toString() || '';
    });
    setMCollAmounts(amts);
  };

  const getExpectedWorkforce = (prog: Program): WorkforceMember[] => {
    return workforce.filter(w => prog.departmentIds.includes(w.departmentId));
  };

  const handleSaveManage = async () => {
    if (!manageInstance) return;
    setSaving(true);
    try {
      const { program, instance } = manageInstance;
      const updatedInstance: ProgramInstance = {
        ...instance,
        attendance: {
          men: mAttendCats.includes('men') && mMen ? parseInt(mMen) : undefined,
          women: mAttendCats.includes('women') && mWomen ? parseInt(mWomen) : undefined,
          children: mAttendCats.includes('children') && mChildren ? parseInt(mChildren) : undefined,
        },
        workforceAttendance: mWorkforceChecked,
        collections: (program.collectionTypes || []).map(ct => ({
          name: ct,
          amount: parseFloat(mCollAmounts[ct] || '0') || 0,
        })),
        managed: true,
        managedAt: new Date(),
      };

      const allInsts = await fetchProgramInstances();
      const existing = (allInsts as ProgramInstance[]).find(i => i.id === updatedInstance.id);
      let updatedAll: ProgramInstance[];
      if (existing) {
        updatedAll = (allInsts as ProgramInstance[]).map(i => i.id === updatedInstance.id ? updatedInstance : i);
      } else {
        updatedAll = [...(allInsts as ProgramInstance[]), updatedInstance];
      }
      await saveProgramInstances(updatedAll);
      setInstances(updatedAll.filter(i => i.churchId === church.id));

      // Save to collections section
      const allColls = await fetchCollections();
      const newColls: Collection[] = (program.collectionTypes || [])
        .filter(ct => parseFloat(mCollAmounts[ct] || '0') > 0)
        .map(ct => ({
          id: `coll-${Date.now()}-${ct.replace(/\s/g, '')}`,
          churchId: church.id,
          branchId: program.branchId,
          programId: program.id,
          programInstanceId: updatedInstance.id,
          name: ct,
          amount: parseFloat(mCollAmounts[ct] || '0') || 0,
          date: new Date(updatedInstance.date),
          createdBy: currentAdmin?.id || '',
          createdAt: new Date(),
        }));

      // Remove old collections for this instance, add new ones
      const filteredColls = (allColls as Collection[]).filter(c => c.programInstanceId !== updatedInstance.id);
      const updatedColls = [...filteredColls, ...newColls];
      await saveCollections(updatedColls);
      setCollections(updatedColls as Collection[]);

      setManageInstance(null);
      showToast('Program managed successfully.');
    } catch (err: any) {
      console.error('Failed to manage program:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Custom date picker helpers
  const customPickerDays = useMemo(() => {
    const firstDay = new Date(cCustomPickerYear, cCustomPickerMonth, 1);
    const lastDay = new Date(cCustomPickerYear, cCustomPickerMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(cCustomPickerYear, cCustomPickerMonth, -i);
      days.push({ date: d.toISOString().split('T')[0], dayNum: d.getDate(), isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(cCustomPickerYear, cCustomPickerMonth, d);
      days.push({ date: dt.toISOString().split('T')[0], dayNum: d, isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(cCustomPickerYear, cCustomPickerMonth + 1, i);
      days.push({ date: d.toISOString().split('T')[0], dayNum: d.getDate(), isCurrentMonth: false });
    }
    return days;
  }, [cCustomPickerMonth, cCustomPickerYear]);

  const toggleCustomDate = (date: string) => {
    setCCustomDates(prev => {
      if (prev.includes(date)) {
        // Remove from date times too
        setCCustomDateTimes(dt => { const n = { ...dt }; delete n[date]; return n; });
        return prev.filter(d => d !== date);
      } else {
        // Add with default empty times
        setCCustomDateTimes(dt => ({ ...dt, [date]: { startTime: '', endTime: '' } }));
        return [...prev, date];
      }
    });
  };

  // Attendance chart data
  const attendanceChartData = useMemo(() => {
    if (!manageInstance) return [];
    const data: { name: string; value: number; color: string }[] = [];
    if (mAttendCats.includes('men') && mMen) data.push({ name: 'Men', value: parseInt(mMen) || 0, color: PIE_COLORS[0] });
    if (mAttendCats.includes('women') && mWomen) data.push({ name: 'Women', value: parseInt(mWomen) || 0, color: PIE_COLORS[1] });
    if (mAttendCats.includes('children') && mChildren) data.push({ name: 'Children', value: parseInt(mChildren) || 0, color: PIE_COLORS[2] });
    return data;
  }, [mAttendCats, mMen, mWomen, mChildren, manageInstance]);

  const totalAttendance = attendanceChartData.reduce((s, d) => s + d.value, 0);

  // Dept toggle for create form
  const toggleDept = (deptId: string) => {
    setCDeptIds(prev => prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]);
  };

  const availableDepts = isMultiBranch && cBranchId
    ? (cBranchId === 'churchwide' ? departments : deptsForBranch(cBranchId))
    : departments;

  const FieldError = ({ field }: { field: string }) => {
    if (!formErrors[field]) return null;
    return (
      <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
        <AlertCircle className="w-3 h-3" />
        {formErrors[field]}
      </p>
    );
  };

  return (
    <Layout>
      <PageHeader
        title="Programs & Events"
        description="Schedule and manage church programs, services, and special events. Create programs, track attendance, and manage collections."
        action={{
          label: 'Create Program',
          onClick: () => { resetCreateForm(); setCreateOpen(true); },
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
      />

      <div className="p-4 md:p-6 space-y-4">

        {loading ? (
          <BibleLoader message="Loading programs..." />
        ) : programs.length === 0 ? (
          <Card>
            <CardContent className="py-16 px-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-4">
                <CalendarIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs created yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Your programs calendar is empty because nothing has been scheduled yet. Create your first program to start tracking church services, Bible studies, prayer meetings, and special events.
              </p>
              <Button onClick={() => { resetCreateForm(); setCreateOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Program
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* View toggle + Search + Legend */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Card className="flex-1">
                <CardContent className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search programs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4 mr-1" /> Grid
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarIcon className="w-4 h-4 mr-1" /> Calendar
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-gray-600">Ongoing</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-gray-600">Needs Attention</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-400" /><span className="text-gray-600">Past (Managed)</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-purple-500" /><span className="text-gray-600">Upcoming</span></div>
            </div>

            {viewMode === 'grid' ? (
              /* ═══════════════ GRID VIEW ═══════════════ */
              gridPrograms.length === 0 ? (
                <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No programs match your search.</p></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {gridPrograms.map(({ prog, nextOcc, lastOcc, status, managedCount, totalOccs, freqLabel }) => {
                    const displayOcc = nextOcc || lastOcc;
                    const displayDate = displayOcc
                      ? new Date(displayOcc.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : null;
                    const displayTimes = displayOcc ? getTimesForDate(prog, displayOcc.date) : null;

                    return (
                      <Card
                        key={prog.id}
                        className="hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
                        onClick={() => displayOcc && openManage(prog, displayOcc.date)}
                      >
                        {/* Status accent bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusColor(status)}`} />

                        <CardContent className="p-4 pt-5">
                          {/* Header: title + actions */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{prog.name}</h4>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); openEdit(prog); }}>
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setDeleteTarget(prog); }}>
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {/* Status badge */}
                          <Badge variant="outline" className={`text-[10px] mb-3 ${statusBadgeClass(status)}`}>
                            {statusLabel(status)}
                          </Badge>

                          {/* Info rows */}
                          <div className="space-y-2 text-xs text-gray-500">
                            {/* Frequency */}
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{freqLabel}</span>
                            </div>

                            {/* Next/last date + time */}
                            {displayDate && displayTimes && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="truncate">
                                  {nextOcc ? 'Next' : 'Last'}: {displayDate} &middot; {formatTime(displayTimes.start)}
                                </span>
                              </div>
                            )}

                            {/* Branch */}
                            {isMultiBranch && prog.branchId && (
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${prog.branchId === 'churchwide' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                <span className={`truncate ${prog.branchId === 'churchwide' ? 'text-blue-600 font-medium' : ''}`}>
                                  {getBranchName(prog.branchId)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Footer: departments + managed count */}
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {prog.departmentIds.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {prog.departmentIds.slice(0, 2).map(id => (
                                  <Badge key={id} variant="secondary" className="text-[9px] px-1.5 py-0">{getDeptName(id)}</Badge>
                                ))}
                                {prog.departmentIds.length > 2 && (
                                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{prog.departmentIds.length - 2}</Badge>
                                )}
                              </div>
                            ) : null}
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span>{managedCount}/{totalOccs} managed</span>
                              {(prog.collectionTypes || []).length > 0 && (
                                <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />{(prog.collectionTypes || []).length} collections</span>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              /* ═══════════════ CALENDAR VIEW ═══════════════ */
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                      else setCalMonth(m => m - 1);
                    }}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <CardTitle className="text-base">{MONTH_NAMES[calMonth]} {calYear}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                      else setCalMonth(m => m + 1);
                    }}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
                    {/* Day headers */}
                    {DAY_NAMES.map(d => (
                      <div key={d} className="bg-gray-50 text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                    ))}
                    {/* Days */}
                    {calendarDays.map((day, idx) => {
                      const occs = calendarOccurrences[day.date] || [];
                      const isToday = day.date === today;
                      return (
                        <div
                          key={idx}
                          className={`bg-white min-h-[80px] p-1 ${!day.isCurrentMonth ? 'opacity-40' : ''} ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                        >
                          <div className={`text-xs font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day.dayNum}</div>
                          <div className="space-y-0.5">
                            {occs.slice(0, 3).map((o, i) => (
                              <button
                                key={i}
                                className={`w-full text-left text-[9px] px-1 py-0.5 rounded truncate text-white ${statusColor(o.status)} hover:opacity-80 transition-opacity`}
                                onClick={() => openManage(o.program, day.date)}
                              >
                                {o.program.name}
                              </button>
                            ))}
                            {occs.length > 3 && (
                              <p className="text-[9px] text-gray-400 px-1">+{occs.length - 3} more</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ═══════════════ CREATE / EDIT PROGRAM DIALOG ═══════════════ */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); resetCreateForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Program' : 'Create Program'}</DialogTitle>
            <DialogDescription>
              {editTarget ? 'Update the details of this program.' : 'Set up a new church program or event. Fill in all required fields.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Program Title */}
            <div className="space-y-2" ref={el => { fieldRefs.current.cName = el; }}>
              <Label>Program Title<RequiredStar /></Label>
              <Input
                value={cName}
                onChange={e => { setCName(e.target.value); if (formErrors.cName) setFormErrors(prev => { const n = {...prev}; delete n.cName; return n; }); }}
                placeholder="e.g., Sunday Service, Bible Study"
                className={formErrors.cName ? 'border-red-400' : ''}
              />
              <FieldError field="cName" />
            </div>

            {/* Program Type */}
            <div className="space-y-2" ref={el => { fieldRefs.current.cType = el; }}>
              <Label>Program Type<RequiredStar /></Label>
              <Select value={cType} onValueChange={(v) => { setCType(v as ProgramFrequency); if (formErrors.cType) setFormErrors(prev => { const n = {...prev}; delete n.cType; return n; }); }}>
                <SelectTrigger className={formErrors.cType ? 'border-red-400' : ''}>
                  <SelectValue placeholder="Select program type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time Event</SelectItem>
                  <SelectItem value="weekly">Weekly (recurring)</SelectItem>
                  <SelectItem value="monthly">Monthly (recurring)</SelectItem>
                  <SelectItem value="custom">Custom (select dates)</SelectItem>
                </SelectContent>
              </Select>
              <FieldError field="cType" />
            </div>

            {/* Type-specific fields */}
            {cType === 'one-time' && (
              <div className="space-y-2" ref={el => { fieldRefs.current.cOneTimeDate = el; }}>
                <Label>Event Date<RequiredStar /></Label>
                <Input
                  type="date"
                  value={cOneTimeDate}
                  onChange={e => { setCOneTimeDate(e.target.value); if (formErrors.cOneTimeDate) setFormErrors(prev => { const n = {...prev}; delete n.cOneTimeDate; return n; }); }}
                  className={formErrors.cOneTimeDate ? 'border-red-400' : ''}
                />
                <FieldError field="cOneTimeDate" />
              </div>
            )}

            {cType === 'weekly' && (
              <div className="space-y-2" ref={el => { fieldRefs.current.cWeeklyDays = el; }}>
                <Label>Select Days<RequiredStar /></Label>
                <div className="flex flex-wrap gap-2">
                  {FULL_DAY_NAMES.map((name, idx) => (
                    <button
                      key={idx}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        cWeeklyDays.includes(idx)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                      onClick={() => {
                        setCWeeklyDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
                        if (formErrors.cWeeklyDays) setFormErrors(prev => { const n = {...prev}; delete n.cWeeklyDays; return n; });
                      }}
                    >
                      {name.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <FieldError field="cWeeklyDays" />
              </div>
            )}

            {cType === 'monthly' && (
              <div className="space-y-2" ref={el => { fieldRefs.current.cMonthlyDate = el; }}>
                <Label>Day of Month<RequiredStar /></Label>
                <Select value={cMonthlyDate} onValueChange={(v) => { setCMonthlyDate(v); if (formErrors.cMonthlyDate) setFormErrors(prev => { const n = {...prev}; delete n.cMonthlyDate; return n; }); }}>
                  <SelectTrigger className={formErrors.cMonthlyDate ? 'border-red-400' : ''}>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <SelectItem key={d} value={d.toString()}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError field="cMonthlyDate" />
              </div>
            )}

            {cType === 'custom' && (
              <div className="space-y-2" ref={el => { fieldRefs.current.cCustomDates = el; }}>
                <Label>Select Dates<RequiredStar /></Label>
                <div className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (cCustomPickerMonth === 0) { setCCustomPickerMonth(11); setCCustomPickerYear(y => y - 1); }
                      else setCCustomPickerMonth(m => m - 1);
                    }}><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm font-medium">{MONTH_NAMES[cCustomPickerMonth]} {cCustomPickerYear}</span>
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (cCustomPickerMonth === 11) { setCCustomPickerMonth(0); setCCustomPickerYear(y => y + 1); }
                      else setCCustomPickerMonth(m => m + 1);
                    }}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {DAY_NAMES.map(d => (
                      <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
                    ))}
                    {customPickerDays.map((day, idx) => (
                      <button
                        key={idx}
                        className={`text-xs py-1.5 rounded transition-colors ${
                          !day.isCurrentMonth ? 'text-gray-300' :
                          cCustomDates.includes(day.date) ? 'bg-blue-600 text-white' :
                          'text-gray-700 hover:bg-blue-50'
                        }`}
                        onClick={() => { if (day.isCurrentMonth) toggleCustomDate(day.date); if (formErrors.cCustomDates) setFormErrors(prev => { const n = {...prev}; delete n.cCustomDates; return n; }); }}
                      >
                        {day.dayNum}
                      </button>
                    ))}
                  </div>
                  {cCustomDates.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-600">Selected dates — set start & end time for each:</p>
                      {cCustomDates.sort().map(d => (
                        <div key={d} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                          <span className="text-xs font-medium text-blue-700 min-w-[70px]">
                            {new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <Input
                            type="time"
                            value={cCustomDateTimes[d]?.startTime || ''}
                            onChange={e => {
                              setCCustomDateTimes(prev => ({ ...prev, [d]: { ...prev[d], startTime: e.target.value } }));
                              if (formErrors.cCustomDateTimes) setFormErrors(prev => { const n = {...prev}; delete n.cCustomDateTimes; return n; });
                            }}
                            className="h-8 text-xs w-28"
                            placeholder="Start"
                          />
                          <span className="text-xs text-gray-400">to</span>
                          <Input
                            type="time"
                            value={cCustomDateTimes[d]?.endTime || ''}
                            onChange={e => {
                              setCCustomDateTimes(prev => ({ ...prev, [d]: { ...prev[d], endTime: e.target.value } }));
                              if (formErrors.cCustomDateTimes) setFormErrors(prev => { const n = {...prev}; delete n.cCustomDateTimes; return n; });
                            }}
                            className="h-8 text-xs w-28"
                            placeholder="End"
                          />
                          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => toggleCustomDate(d)}><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                      <FieldError field="cCustomDateTimes" />
                    </div>
                  )}
                </div>
                <FieldError field="cCustomDates" />
              </div>
            )}

            {/* Time (not shown for custom — custom has per-date times above) */}
            {cType && cType !== 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2" ref={el => { fieldRefs.current.cStartTime = el; }}>
                  <Label>Start Time<RequiredStar /></Label>
                  <Input
                    type="time"
                    value={cStartTime}
                    onChange={e => { setCStartTime(e.target.value); if (formErrors.cStartTime) setFormErrors(prev => { const n = {...prev}; delete n.cStartTime; return n; }); }}
                    className={formErrors.cStartTime ? 'border-red-400' : ''}
                  />
                  <FieldError field="cStartTime" />
                </div>
                <div className="space-y-2" ref={el => { fieldRefs.current.cEndTime = el; }}>
                  <Label>End Time<RequiredStar /></Label>
                  <Input
                    type="time"
                    value={cEndTime}
                    onChange={e => { setCEndTime(e.target.value); if (formErrors.cEndTime) setFormErrors(prev => { const n = {...prev}; delete n.cEndTime; return n; }); }}
                    className={formErrors.cEndTime ? 'border-red-400' : ''}
                  />
                  <FieldError field="cEndTime" />
                </div>
              </div>
            )}

            {/* Branch (multi only) */}
            {isMultiBranch && (
              <div className="space-y-2" ref={el => { fieldRefs.current.cBranchId = el; }}>
                <Label>Branch<RequiredStar /></Label>
                <p className="text-xs text-gray-500">Choose a specific branch, or select "Church-wide" to make this program visible across all branches.</p>
                <Select value={cBranchId} onValueChange={(v) => { setCBranchId(v); setCDeptIds([]); if (formErrors.cBranchId) setFormErrors(prev => { const n = {...prev}; delete n.cBranchId; return n; }); }}>
                  <SelectTrigger className={formErrors.cBranchId ? 'border-red-400' : ''}>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="churchwide">Church-wide (all branches)</SelectItem>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FieldError field="cBranchId" />
              </div>
            )}

            {/* Departments (optional) */}
            <div className="space-y-2" ref={el => { fieldRefs.current.cDeptIds = el; }}>
              <Label>Departments Expected to Attend <span className="text-gray-400 font-normal">(optional)</span></Label>
              <p className="text-xs text-gray-500">Select departments whose workforce members are expected. Leave empty if not applicable.</p>
              {availableDepts.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">
                  {isMultiBranch && !cBranchId ? 'Select a branch (or Church-wide) first to see departments.' : 'No departments found. Create departments first.'}
                </p>
              ) : (
                <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {availableDepts.map(dept => (
                    <label key={dept.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={cDeptIds.includes(dept.id)}
                        onCheckedChange={() => { toggleDept(dept.id); if (formErrors.cDeptIds) setFormErrors(prev => { const n = {...prev}; delete n.cDeptIds; return n; }); }}
                      />
                      <span className="text-sm text-gray-700">{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
              <FieldError field="cDeptIds" />
            </div>

            {/* Collections (optional) — picks from Finance collection types only */}
            <div className="space-y-2">
              <Label>Collections <span className="text-gray-400 font-normal">(optional)</span></Label>
              <p className="text-xs text-gray-500">
                Select from the collection types you've created in <strong>Finance &rarr; Collections</strong>. This keeps all your collection tracking consistent and avoids duplicates.
              </p>
              {financeCollectionTypes.length > 0 ? (
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {financeCollectionTypes.map(fct => (
                    <label key={fct.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={cCollTypes.includes(fct.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCCollTypes(prev => [...prev, fct.name]);
                          } else {
                            setCCollTypes(prev => prev.filter(c => c !== fct.name));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{fct.name}</span>
                      {fct.scope && <span className="text-[10px] text-gray-400 capitalize">({fct.scope})</span>}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 italic">No collection types created yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Go to <strong>Finance &rarr; Collections</strong> to create collection types like Tithe, Offering, etc.</p>
                </div>
              )}
              {cCollTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {cCollTypes.map(ct => (
                    <Badge key={ct} variant="secondary" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                      {ct}
                      <button className="ml-1.5" onClick={() => setCCollTypes(prev => prev.filter(c => c !== ct))}><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setCreateOpen(false); resetCreateForm(); }}>Cancel</Button>
              <Button className="flex-1" disabled={saving} onClick={handleSaveProgram}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editTarget ? 'Save Changes' : 'Create Program'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MANAGE PROGRAM DIALOG ═══════════════ */}
      <Dialog open={!!manageInstance} onOpenChange={(o) => { if (!o) setManageInstance(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {manageInstance && (() => {
            const { program, instance } = manageInstance;
            const dateObj = new Date(instance.date + 'T00:00:00');
            const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
            const expectedWf = getExpectedWorkforce(program);
            const wfProgress = expectedWf.length > 0 ? (mWorkforceChecked.length / expectedWf.length) * 100 : 0;

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColor(getProgramStatus(program, instance.date))}`} />
                    {program.name}
                  </DialogTitle>
                  <DialogDescription>
                    {dateStr} &middot; {formatTime(getTimesForDate(program, instance.date).start)} - {formatTime(getTimesForDate(program, instance.date).end)}
                    {instance.managed && <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 text-[10px]">Managed</Badge>}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-2">
                  {/* ─── Section 1: Attendance ─── */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Member Attendance
                    </h4>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-3">
                        {(['men', 'women', 'children'] as const).map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={mAttendCats.includes(cat)}
                              onCheckedChange={() => {
                                setMAttendCats(prev =>
                                  prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                );
                              }}
                            />
                            <span className="text-sm capitalize text-gray-700">{cat}</span>
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {mAttendCats.includes('men') && (
                          <div className="space-y-1">
                            <Label className="text-xs text-blue-600">Men</Label>
                            <Input type="number" min="0" value={mMen} onChange={e => setMMen(e.target.value)} placeholder="0" />
                          </div>
                        )}
                        {mAttendCats.includes('women') && (
                          <div className="space-y-1">
                            <Label className="text-xs text-pink-600">Women</Label>
                            <Input type="number" min="0" value={mWomen} onChange={e => setMWomen(e.target.value)} placeholder="0" />
                          </div>
                        )}
                        {mAttendCats.includes('children') && (
                          <div className="space-y-1">
                            <Label className="text-xs text-yellow-600">Children</Label>
                            <Input type="number" min="0" value={mChildren} onChange={e => setMChildren(e.target.value)} placeholder="0" />
                          </div>
                        )}
                      </div>
                      {/* Attendance Chart */}
                      {totalAttendance > 0 && (
                        <div className="flex items-center gap-6 bg-gray-50 rounded-lg p-4">
                          <div className="w-32 h-32">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={attendanceChartData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={2}>
                                  {attendanceChartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                  ))}
                                </Pie>
                                <ReTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2">
                            <p className="text-2xl font-bold text-gray-900">{totalAttendance}</p>
                            <p className="text-xs text-gray-500">Total Attendance</p>
                            <div className="space-y-1">
                              {attendanceChartData.map(d => (
                                <div key={d.name} className="flex items-center gap-2 text-xs">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                  <span className="text-gray-600">{d.name}: {d.value}</span>
                                  <span className="text-gray-400">({Math.round((d.value / totalAttendance) * 100)}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* ─── Section 2: Workforce Attendance ─── */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Workforce Attendance
                    </h4>
                    {expectedWf.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No workforce members are assigned to the departments linked to this program.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{mWorkforceChecked.length} of {expectedWf.length} checked in</span>
                          <span className="text-xs font-medium text-gray-700">{Math.round(wfProgress)}%</span>
                        </div>
                        <Progress value={wfProgress} className="h-2" />
                        <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                          {expectedWf.map(wf => {
                            const checked = mWorkforceChecked.includes(wf.id);
                            return (
                              <label key={wf.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => {
                                    setMWorkforceChecked(prev =>
                                      checked ? prev.filter(id => id !== wf.id) : [...prev, wf.id]
                                    );
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">{getMemberName(wf.memberId)}</p>
                                  <p className="text-[10px] text-gray-400">{getDeptName(wf.departmentId)}</p>
                                </div>
                                {checked && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── Section 3: Collections ─── */}
                  {program.collectionTypes.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" /> Collections
                        </h4>
                        <div className="space-y-3">
                          {program.collectionTypes.map(ct => (
                            <div key={ct} className="flex items-center gap-3">
                              <Label className="text-sm text-gray-700 w-32 flex-shrink-0">{ct}</Label>
                              <div className="relative flex-1">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={mCollAmounts[ct] || ''}
                                  onChange={e => setMCollAmounts(prev => ({ ...prev, [ct]: e.target.value }))}
                                  placeholder="0.00"
                                  className="pl-9"
                                />
                              </div>
                            </div>
                          ))}
                          {Object.values(mCollAmounts).some(v => parseFloat(v) > 0) && (
                            <div className="bg-green-50 rounded-lg p-3 flex items-center justify-between">
                              <span className="text-sm font-medium text-green-800">Total Collections</span>
                              <span className="text-lg font-bold text-green-900">
                                ${Object.values(mCollAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setManageInstance(null)}>Cancel</Button>
                    <Button className="flex-1" disabled={saving} onClick={handleSaveManage}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {instance.managed ? 'Update Record' : 'Save & Mark as Managed'}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══════════════ DELETE CONFIRM ═══════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This will also remove all associated records and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
