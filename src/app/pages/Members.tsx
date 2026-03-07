import { useState, useEffect, useCallback, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Progress } from '../components/ui/progress';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '../components/ui/tabs';
import {
  Users, Plus, Search, Edit, Trash2, Eye, Phone, Mail, MessageCircle, X,
  Loader2, CheckCircle, UserPlus, Filter, ChevronDown, Briefcase, GraduationCap, Clock,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Member, WorkforceMember, Department, Unit, MemberTrainingClass, NewcomerTrainingStatus } from '../types';
import { fetchMembers, createMember, editMember, suspendMember, saveWorkforce, fetchWorkforce, fetchDepartments, fetchUnits, fetchMemberTrainingClasses, saveMemberTrainingClasses, fetchBranches as fetchBranchesApi, createBranch } from '../api';
import { COUNTRIES, MONTHS, AGE_RANGES } from '../data/countries';

type DialogMode = 'create' | 'edit' | 'view' | null;

const MARITAL_OPTIONS = [
  { value: 'single', label: 'Single' }, { value: 'married', label: 'Married' },
  { value: 'widowed', label: 'Widowed' }, { value: 'divorced', label: 'Divorced' },
];
const GENDER_OPTIONS = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }];

export function Members() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [trainingClasses, setTrainingClasses] = useState<MemberTrainingClass[]>([]);
  const [localBranches, setLocalBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [contactAction, setContactAction] = useState<{ type: 'phone' | 'email'; value: string; name: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [fFullName, setFFullName] = useState('');
  const [fGender, setFGender] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fWhatsapp, setFWhatsapp] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fYearJoined, setFYearJoined] = useState('');
  const [fMaritalStatus, setFMaritalStatus] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [fAgeRange, setFAgeRange] = useState('');
  const [fBirthdayMonth, setFBirthdayMonth] = useState('');
  const [fBirthdayDay, setFBirthdayDay] = useState('');
  const [fBirthdayYear, setFBirthdayYear] = useState('');
  const [fBranchId, setFBranchId] = useState('');
  const [fCountry, setFCountry] = useState('');
  const [fState, setFState] = useState('');

  // Move to workforce dialog
  const [moveTargets, setMoveTargets] = useState<Member[]>([]);
  const [moveDeptId, setMoveDeptId] = useState('');
  const [moveUnitId, setMoveUnitId] = useState('');
  const [moveBranchId, setMoveBranchId] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Training management
  const [createClassOpen, setCreateClassOpen] = useState(false);
  const [tcName, setTcName] = useState('');
  const [tcDescription, setTcDescription] = useState('');
  const [tcDuration, setTcDuration] = useState('');
  const [assignTrainingTargets, setAssignTrainingTargets] = useState<Member[]>([]);
  const [assignClassId, setAssignClassId] = useState('');

  const showMultiBranch = church.type === 'multi' && currentAdmin?.level === 'church' && branches.length > 0;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [memData, wfData, deptData, unitData, trainingData] = await Promise.all([
        fetchMembers(), fetchWorkforce(), fetchDepartments(), fetchUnits(), fetchMemberTrainingClasses(),
      ]);
      setMembers(memData as Member[]);
      setWorkforce(wfData as WorkforceMember[]);
      setDepartments(deptData as Department[]);
      setUnits(unitData as Unit[]);
      setTrainingClasses(trainingData as MemberTrainingClass[]);
    } catch (err) { console.error('Failed to load members:', err); }
    finally { setLoading(false); }

    // Branches are loaded separately so a 500 on /get-branches doesn't block member data
    try {
      let branchData = await fetchBranchesApi();
      let resolvedBranches: any[] = Array.isArray(branchData) ? branchData : [];
      if (resolvedBranches.length === 0) {
        // No branches yet — auto-create a default HQ branch so member creation works
        await createBranch({ name: church.name || 'Main Branch' });
        const refetched = await fetchBranchesApi();
        resolvedBranches = Array.isArray(refetched) ? refetched : [];
      }
      if (resolvedBranches.length > 0) {
        setLocalBranches(resolvedBranches.map((b: any) => ({ id: b.id, name: b.name })));
      }
    } catch (branchErr) {
      console.error('Failed to load/create branches:', branchErr);
    }
  }, [church.id, church.name]);

  useEffect(() => { loadData(); }, [loadData]);

  const { showToast } = useToast();

  const resetForm = () => {
    setFFullName(''); setFGender(''); setFPhone(''); setFWhatsapp('');
    setFEmail(''); setFYearJoined(''); setFMaritalStatus(''); setFAddress('');
    setFAgeRange(''); setFBirthdayMonth(''); setFBirthdayDay(''); setFBirthdayYear('');
    setFBranchId(''); setFCountry(''); setFState('');
  };
  const populateForm = (m: Member) => {
    setFFullName(m.fullName); setFGender(m.gender); setFPhone(m.phone);
    setFWhatsapp(m.whatsapp || ''); setFEmail(m.email || '');
    setFYearJoined(String(m.yearJoined)); setFMaritalStatus(m.maritalStatus);
    setFAddress(m.address); setFAgeRange(m.ageRange || '');
    setFBirthdayMonth(String(m.birthdayMonth)); setFBirthdayDay(String(m.birthdayDay));
    setFBirthdayYear(m.birthdayYear ? String(m.birthdayYear) : '');
    setFBranchId(m.branchId || ''); setFCountry(m.country); setFState(m.state);
  };

  const selectedCountryStates = COUNTRIES.find(c => c.name === fCountry)?.states || [];
  const isFormValid = fFullName.trim() && fGender && fPhone.trim() && fYearJoined && fMaritalStatus && fAddress.trim() && fBirthdayMonth && fBirthdayDay && fCountry && fState;
  const currentYear = new Date().getFullYear();

  const isInWorkforce = (memberId: string) => workforce.some(w => w.memberId === memberId);
  const wfCount = useMemo(() => {
    const wfMemberIds = new Set(workforce.map(w => w.memberId));
    return members.filter(m => wfMemberIds.has(m.id)).length;
  }, [members, workforce]);
  const wfRatio = members.length > 0 ? Math.round((wfCount / members.length) * 100) : 0;
  const padTwo = (v: string) => v.padStart(2, '0');

  const handleCreate = async () => {
    if (!isFormValid) return;
    setSaving(true);
    try {
      const resolvedBranchId = showMultiBranch
        ? fBranchId
        : (currentAdmin?.branchId || localBranches[0]?.id || branches[0]?.id || '');
      if (!resolvedBranchId) {
        showToast('Unable to determine branch. Please refresh and try again.', 'error');
        setSaving(false); return;
      }
      await createMember({
        name: fFullName.trim(),
        address: fAddress.trim(),
        phoneNo: fPhone.trim(),
        whatappNo: fWhatsapp.trim() || undefined,
        sex: fGender,
        birthMonth: fBirthdayMonth ? padTwo(fBirthdayMonth) : undefined,
        birthDay: fBirthdayDay ? padTwo(fBirthdayDay) : undefined,
        nationality: fCountry,
        state: fState,
        maritalStatus: fMaritalStatus,
        memberSince: fYearJoined,
        branchId: resolvedBranchId,
        departmentIds: [],
      }, church.id, resolvedBranchId);
      await loadData();
      setDialogMode(null);
      resetForm();
      showToast(`"${fFullName.trim()}" has been added as a church member.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async () => {
    if (!isFormValid || !selectedMember) return;
    setSaving(true);
    try {
      const branchId = selectedMember.branchId || currentAdmin?.branchId || localBranches[0]?.id || branches[0]?.id || '';
      await editMember(selectedMember.id, branchId, {
        sex: fGender as 'male' | 'female',
        birthMonth: fBirthdayMonth ? padTwo(fBirthdayMonth) : undefined,
        birthDay: fBirthdayDay ? padTwo(fBirthdayDay) : undefined,
        nationality: fCountry,
        state: fState,
        maritalStatus: fMaritalStatus,
        memberSince: fYearJoined,
      });
      await loadData();
      setDialogMode(null);
      setSelectedMember(null);
      resetForm();
      showToast(`"${fFullName.trim()}" updated.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const branchId = deleteTarget.branchId || currentAdmin?.branchId || localBranches[0]?.id || branches[0]?.id || '';
      await suspendMember(deleteTarget.id, branchId);
      setDeleteTarget(null);
      showToast(`"${deleteTarget.fullName}" removed.`);
      await loadData();
    } catch (err: any) { console.error(err); }
    finally { setSaving(false); }
  };

  // ──────── MOVE TO WORKFORCE ────────
  const handleMoveToWorkforce = async () => {
    if (!moveDeptId || moveTargets.length === 0) return;
    setSaving(true);
    try {
      const allWf = await fetchWorkforce();
      const existingIds = new Set((allWf as WorkforceMember[]).map(w => w.memberId));
      const newEntries: WorkforceMember[] = moveTargets
        .filter(m => !existingIds.has(m.id))
        .map(m => ({
          id: `wf-${Date.now()}-${m.id}`, churchId: church.id, memberId: m.id,
          branchId: moveBranchId || m.branchId, departmentId: moveDeptId, unitId: (moveUnitId && moveUnitId !== 'none') ? moveUnitId : undefined,
          roadmapMarkers: [], createdAt: new Date(),
        }));
      if (newEntries.length === 0) {
        showToast('All selected members are already in the workforce.');
        setMoveTargets([]); setSaving(false); return;
      }
      const updated = [...(allWf as WorkforceMember[]), ...newEntries];
      await saveWorkforce(updated);
      setWorkforce(updated.filter(w => w.churchId === church.id));
      setMoveTargets([]); setMoveDeptId(''); setMoveUnitId(''); setMoveBranchId(''); setSelectedIds([]);
      showToast(`${newEntries.length} member(s) added to the workforce.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const filtered = members.filter(m => {
    const matchSearch = !searchTerm || m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm) || (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGender = filterGender === 'all' || m.gender === filterGender;
    const matchBranch = filterBranch === 'all' || m.branchId === filterBranch;
    return matchSearch && matchGender && matchBranch;
  });

  const TRAINING_STATUSES: { value: NewcomerTrainingStatus; label: string; color: string }[] = [
    { value: 'not-enrolled', label: 'Not Enrolled', color: 'bg-gray-100 text-gray-600' },
    { value: 'started', label: 'Started', color: 'bg-blue-100 text-blue-700' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
    { value: 'finished', label: 'Finished', color: 'bg-green-100 text-green-700' },
    { value: 'dropped-off', label: 'Dropped Off', color: 'bg-red-100 text-red-700' },
  ];

  const handleCreateClass = async () => {
    if (!tcName.trim()) return;
    setSaving(true);
    try {
      const all = await fetchMemberTrainingClasses();
      const cls: MemberTrainingClass = { id: `mtc-${Date.now()}`, churchId: church.id, name: tcName.trim(), description: tcDescription.trim() || undefined, durationWeeks: tcDuration ? parseInt(tcDuration) : undefined, createdAt: new Date() };
      const updated = [...(all as MemberTrainingClass[]), cls];
      await saveMemberTrainingClasses(updated);
      setTrainingClasses(updated.filter(t => t.churchId === church.id));
      setCreateClassOpen(false); setTcName(''); setTcDescription(''); setTcDuration('');
      showToast(`Training class "${cls.name}" created.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteClass = async (cls: MemberTrainingClass) => {
    const all = await fetchMemberTrainingClasses();
    const updated = (all as MemberTrainingClass[]).filter(c => c.id !== cls.id);
    await saveMemberTrainingClasses(updated);
    setTrainingClasses(updated.filter(t => t.churchId === church.id));
    // Unassign members from this class
    const allMem = await fetchMembers();
    const updMem = (allMem as Member[]).map(m => m.trainingClassId === cls.id ? { ...m, trainingClassId: undefined, trainingStatus: 'not-enrolled' as NewcomerTrainingStatus } : m);
    await saveMembers(updMem);
    setMembers(updMem.filter(m => m.churchId === church.id));
    showToast(`"${cls.name}" deleted.`);
  };

  const handleAssignTraining = async () => {
    if (!assignClassId || assignTrainingTargets.length === 0) return;
    setSaving(true);
    try {
      const ids = assignTrainingTargets.map(m => m.id);
      const all = await fetchMembers();
      const updated = (all as Member[]).map(m => ids.includes(m.id) ? { ...m, trainingClassId: assignClassId, trainingStatus: (m.trainingStatus === 'not-enrolled' || !m.trainingStatus) ? 'started' as NewcomerTrainingStatus : m.trainingStatus } : m);
      await saveMembers(updated);
      setMembers(updated.filter(m => m.churchId === church.id));
      setAssignTrainingTargets([]); setAssignClassId(''); setSelectedIds([]);
      showToast(`${ids.length} member(s) assigned to training.`);
    } catch (err: any) { console.error(err); showToast(`Error: ${err.message}`, 'error'); }
    finally { setSaving(false); }
  };

  const handleUpdateTrainingStatus = async (memberId: string, status: NewcomerTrainingStatus) => {
    const all = await fetchMembers();
    const updated = (all as Member[]).map(m => m.id === memberId ? { ...m, trainingStatus: status } : m);
    await saveMembers(updated);
    setMembers(updated.filter(m => m.churchId === church.id));
  };

  const getBranchName = (id?: string) => id ? branches.find(b => b.id === id)?.name || '' : '';
  const getMonthName = (m: number) => MONTHS.find(mo => mo.value === m)?.label || '';
  const formatBirthday = (m: Member) => `${getMonthName(m.birthdayMonth)} ${m.birthdayDay}${m.birthdayYear ? `, ${m.birthdayYear}` : ''}`;
  const daysInMonth = (month: string) => { if (!month) return 31; const m = parseInt(month); if ([4, 6, 9, 11].includes(m)) return 30; if (m === 2) return 29; return 31; };

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleAll = () => { if (selectedIds.length === filtered.length) setSelectedIds([]); else setSelectedIds(filtered.map(m => m.id)); };

  const moveDepts = moveBranchId ? departments.filter(d => d.branchId === moveBranchId) : departments;
  const moveUnits_ = moveDeptId ? units.filter(u => u.departmentId === moveDeptId) : [];

  return (
    <Layout>
      <PageHeader
        title="Church Members"
        description="Manage your church membership directory. Add members, track their information, and move them to the workforce when they're ready to serve."
        action={{ label: 'Add Member', onClick: () => { resetForm(); setSelectedMember(null); setDialogMode('create'); }, icon: <Plus className="w-4 h-4 mr-2" /> }}
      />

      <div className="p-4 md:p-6 space-y-4">

        {loading ? (
          <Card><CardContent className="p-0"><BibleLoader message="Loading members..." /></CardContent></Card>
        ) : (
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
          {members.length === 0 ? (
          <Card><CardContent className="py-16 px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4"><Users className="w-8 h-8 text-blue-400" /></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No members yet</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">Your member directory is empty. Start building your church community by adding your first member.</p>
            <Button onClick={() => { resetForm(); setDialogMode('create'); }}><UserPlus className="w-4 h-4 mr-2" />Add Your First Member</Button>
          </CardContent></Card>
        ) : (
          <>
            {/* Member-to-Workforce Ratio Bar */}
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Members in Workforce</span>
                </div>
                <span className="text-sm text-gray-500">{wfCount} of {members.length} members ({wfRatio}%)</span>
              </div>
              <Progress value={wfRatio} className="h-2" />
              <p className="text-xs text-gray-400 mt-1">
                Members serving in a department or outreach.{' '}
                Use the <Briefcase className="w-3 h-3 inline" /> icon to see who's in the workforce, or use the "Move to Workforce" button to assign members.
              </p>
            </CardContent></Card>

            {/* Search/Filter */}
            <Card><CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search by name, phone, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />Filters<ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>
              {showFilters && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
                  <Select value={filterGender} onValueChange={setFilterGender}>
                    <SelectTrigger className="w-36"><SelectValue placeholder="Gender" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">All Genders</SelectItem><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
                  </Select>
                  {showMultiBranch && (
                    <Select value={filterBranch} onValueChange={setFilterBranch}>
                      <SelectTrigger className="w-44"><SelectValue placeholder="Branch" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">All Branches</SelectItem>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {(filterGender !== 'all' || filterBranch !== 'all') && (
                    <Button variant="ghost" size="sm" onClick={() => { setFilterGender('all'); setFilterBranch('all'); }}>Clear</Button>
                  )}
                </div>
              )}
            </CardContent></Card>

            {/* Bulk actions + count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{filtered.length} member{filtered.length !== 1 ? 's' : ''} {searchTerm || filterGender !== 'all' || filterBranch !== 'all' ? 'found' : 'total'}</p>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
                  <Button size="sm" variant="outline" onClick={() => { setMoveTargets(members.filter(m => selectedIds.includes(m.id))); }}>
                    <Briefcase className="w-3.5 h-3.5 mr-1" />Bulk Move to Workforce
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Clear</Button>
                </div>
              )}
            </div>

            {filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No members match your search or filter.</p></CardContent></Card>
            ) : (
              <>
                {/* Desktop Table */}
                <Card className="hidden md:block"><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="w-10"><Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} /></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      {showMultiBranch && <TableHead>Branch</TableHead>}
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {filtered.map(member => (
                        <TableRow key={member.id}>
                          <TableCell><Checkbox checked={selectedIds.includes(member.id)} onCheckedChange={() => toggleSelect(member.id)} /></TableCell>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-1.5">
                              {member.fullName}
                              {isInWorkforce(member.id) && (
                                <span title="In workforce" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100"><Briefcase className="w-3 h-3 text-blue-600" /></span>
                              )}
                            </span>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="capitalize text-xs">{member.gender}</Badge></TableCell>
                          <TableCell>
                            <button onClick={() => setContactAction({ type: 'phone', value: member.phone, name: member.fullName })} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                              <Phone className="w-3.5 h-3.5" />{member.phone}
                            </button>
                          </TableCell>
                          <TableCell>
                            {member.email ? (
                              <button onClick={() => setContactAction({ type: 'email', value: member.email!, name: member.fullName })} className="flex items-center gap-1.5 text-blue-600 hover:underline">
                                <Mail className="w-3.5 h-3.5" />{member.email}
                              </button>
                            ) : <span className="text-gray-400">-</span>}
                          </TableCell>
                          {showMultiBranch && <TableCell>{getBranchName(member.branchId) || '-'}</TableCell>}
                          <TableCell>{member.yearJoined}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" title="Move to Workforce" onClick={() => setMoveTargets([member])}><Briefcase className="w-4 h-4 text-blue-500" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(member); populateForm(member); setDialogMode('view'); }}><Eye className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(member); populateForm(member); setDialogMode('edit'); }}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(member)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent></Card>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map(member => (
                    <Card key={member.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-2">
                            <Checkbox checked={selectedIds.includes(member.id)} onCheckedChange={() => toggleSelect(member.id)} className="mt-1" />
                            <div>
                              <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
                                {member.fullName}
                                {isInWorkforce(member.id) && <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100"><Briefcase className="w-3 h-3 text-blue-600" /></span>}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="capitalize text-xs">{member.gender}</Badge>
                                <span className="text-xs text-gray-500">Joined {member.yearJoined}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setMoveTargets([member])}><Briefcase className="w-4 h-4 text-blue-500" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(member); populateForm(member); setDialogMode('view'); }}><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(member); populateForm(member); setDialogMode('edit'); }}><Edit className="w-4 h-4" /></Button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <button onClick={() => setContactAction({ type: 'phone', value: member.phone, name: member.fullName })} className="flex items-center gap-2 text-sm text-blue-600"><Phone className="w-3.5 h-3.5" />{member.phone}</button>
                          {member.email && <button onClick={() => setContactAction({ type: 'email', value: member.email!, name: member.fullName })} className="flex items-center gap-2 text-sm text-blue-600"><Mail className="w-3.5 h-3.5" />{member.email}</button>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </>
          )}
          </TabsContent>

          {/* ═══ TRAINING TAB ═══ */}
          <TabsContent value="training" className="space-y-6">
            <Card><CardContent className="p-4">
              <p className="text-sm text-gray-600">
                <strong>Member training classes</strong> help your congregation grow spiritually. Create classes like "Leadership Training" or "Bible Study Course", assign members, and track their progress.
              </p>
            </CardContent></Card>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Training Classes</h3>
              <Button size="sm" onClick={() => setCreateClassOpen(true)}><Plus className="w-4 h-4 mr-1" />Create Class</Button>
            </div>

            {trainingClasses.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700 mb-1">No training classes yet</h4>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-4">Create a member training class to start tracking progression — for example, "Leadership Class", "Marriage Seminar", or "Bible Study".</p>
                <Button size="sm" onClick={() => setCreateClassOpen(true)}><Plus className="w-4 h-4 mr-1" />Create Your First Class</Button>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainingClasses.map(cls => {
                  const assigned = members.filter(m => m.trainingClassId === cls.id);
                  const finished = assigned.filter(m => m.trainingStatus === 'finished').length;
                  const progress = assigned.length > 0 ? Math.round((finished / assigned.length) * 100) : 0;
                  return (
                    <Card key={cls.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-base">{cls.name}</CardTitle>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDeleteClass(cls)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                        </div>
                        {cls.description && <p className="text-xs text-gray-500">{cls.description}</p>}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          {cls.durationWeeks && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.durationWeeks} week{cls.durationWeeks !== 1 ? 's' : ''}</span>}
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{assigned.length} enrolled</span>
                        </div>
                        <div className="mb-2">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1"><span>Completion</span><span>{progress}%</span></div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                        {assigned.length > 0 && (
                          <div className="space-y-1.5 mt-3 max-h-32 overflow-y-auto">
                            {assigned.map(m => (
                              <div key={m.id} className="flex items-center justify-between text-xs">
                                <span className="text-gray-700">{m.fullName}</span>
                                <Select value={m.trainingStatus || 'not-enrolled'} onValueChange={(v) => handleUpdateTrainingStatus(m.id, v as NewcomerTrainingStatus)}>
                                  <SelectTrigger className="h-6 w-28 text-[10px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {TRAINING_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
        )}
      </div>

      {/* ══════ CREATE TRAINING CLASS DIALOG ══════ */}
      <Dialog open={createClassOpen} onOpenChange={(o) => { if (!o) setCreateClassOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Training Class</DialogTitle>
            <DialogDescription>Set up a training class for your members. You'll be able to assign members and track their progress.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Class Name *</Label><Input value={tcName} onChange={e => setTcName(e.target.value)} placeholder="e.g., Leadership Training" /></div>
            <div><Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label><Input value={tcDescription} onChange={e => setTcDescription(e.target.value)} placeholder="What does this class cover?" /></div>
            <div><Label>Duration in Weeks <span className="text-gray-400 font-normal">(optional)</span></Label><Input type="number" min="1" value={tcDuration} onChange={e => setTcDuration(e.target.value)} placeholder="e.g., 8" /></div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCreateClassOpen(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!tcName.trim() || saving} onClick={handleCreateClass}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create Class
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ ASSIGN TRAINING DIALOG ══════ */}
      <Dialog open={assignTrainingTargets.length > 0} onOpenChange={() => { setAssignTrainingTargets([]); setAssignClassId(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Training Class</DialogTitle>
            <DialogDescription>
              {assignTrainingTargets.length === 1
                ? `Choose a training class for ${assignTrainingTargets[0]?.fullName}.`
                : `Assign ${assignTrainingTargets.length} members to a training class.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {trainingClasses.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">No training classes created yet.</p>
                <Button size="sm" onClick={() => { setAssignTrainingTargets([]); setCreateClassOpen(true); }}><Plus className="w-4 h-4 mr-1" />Create a Class First</Button>
              </div>
            ) : (
              <>
                <Select value={assignClassId} onValueChange={setAssignClassId}>
                  <SelectTrigger><SelectValue placeholder="Select a training class" /></SelectTrigger>
                  <SelectContent>{trainingClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.durationWeeks ? ` (${c.durationWeeks}wk)` : ''}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setAssignTrainingTargets([]); setAssignClassId(''); }}>Cancel</Button>
                  <Button className="flex-1" disabled={!assignClassId || saving} onClick={handleAssignTraining}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Assign
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ CREATE / EDIT DIALOG ══════ */}
      <Dialog open={dialogMode === 'create' || dialogMode === 'edit'} onOpenChange={() => { setDialogMode(null); setSelectedMember(null); resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Add New Member' : 'Edit Member'}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? 'Fill in the details below to add a new church member. Fields marked with * are required.' : "Update this member's information."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={fFullName} onChange={e => setFFullName(e.target.value)} placeholder="e.g., John Doe" /></div>
              <div className="space-y-2"><Label>Gender *</Label>
                <Select value={fGender} onValueChange={setFGender}><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent>{GENDER_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone Number *</Label><Input type="tel" value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="+234 800 000 0000" /></div>
              <div className="space-y-2"><Label>WhatsApp <span className="text-gray-400 font-normal">(optional)</span></Label><Input type="tel" value={fWhatsapp} onChange={e => setFWhatsapp(e.target.value)} placeholder="Same as phone if blank" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email <span className="text-gray-400 font-normal">(optional)</span></Label><Input type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} placeholder="john@example.com" /></div>
              <div className="space-y-2"><Label>Year Joined Church *</Label>
                <Select value={fYearJoined} onValueChange={setFYearJoined}><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger><SelectContent>{Array.from({ length: 60 }, (_, i) => currentYear - i).map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Marital Status *</Label>
                <Select value={fMaritalStatus} onValueChange={setFMaritalStatus}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{MARITAL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>Age Range <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Select value={fAgeRange} onValueChange={setFAgeRange}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{AGE_RANGES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Birthday * <span className="text-gray-400 font-normal">(year optional)</span></Label>
              <div className="grid grid-cols-3 gap-3">
                <Select value={fBirthdayMonth} onValueChange={(v) => { setFBirthdayMonth(v); if (fBirthdayDay && parseInt(fBirthdayDay) > daysInMonth(v)) setFBirthdayDay(''); }}><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent></Select>
                <Select value={fBirthdayDay} onValueChange={setFBirthdayDay}><SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger><SelectContent>{Array.from({ length: daysInMonth(fBirthdayMonth) }, (_, i) => i + 1).map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent></Select>
                <Input type="number" min={1900} max={currentYear} placeholder="Year (optional)" value={fBirthdayYear} onChange={e => setFBirthdayYear(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2"><Label>Address *</Label><Input value={fAddress} onChange={e => setFAddress(e.target.value)} placeholder="House number, street, area" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Country *</Label>
                <Select value={fCountry} onValueChange={(v) => { setFCountry(v); setFState(''); }}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2"><Label>State / Region *</Label>
                {selectedCountryStates.length > 0 ? (
                  <Select value={fState} onValueChange={setFState}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{selectedCountryStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                ) : <Input value={fState} onChange={e => setFState(e.target.value)} placeholder="Enter state" />}
              </div>
            </div>
            {showMultiBranch && (
              <div className="space-y-2"><Label>Branch <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Select value={fBranchId} onValueChange={setFBranchId}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger><SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>
              </div>
            )}
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setDialogMode(null); setSelectedMember(null); resetForm(); }}>Cancel</Button>
              <Button className="flex-1" disabled={!isFormValid || saving} onClick={dialogMode === 'create' ? handleCreate : handleUpdate}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{dialogMode === 'create' ? 'Add Member' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════ VIEW DIALOG ══════ */}
      <Dialog open={dialogMode === 'view'} onOpenChange={() => { setDialogMode(null); setSelectedMember(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMember?.fullName}</DialogTitle>
            <DialogDescription>Member details and contact info</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoBlock label="Gender" value={selectedMember.gender} capitalize />
                <InfoBlock label="Marital Status" value={selectedMember.maritalStatus} capitalize />
                <InfoBlock label="Year Joined" value={String(selectedMember.yearJoined)} />
                <InfoBlock label="Age Range" value={selectedMember.ageRange || '-'} />
                <InfoBlock label="Birthday" value={formatBirthday(selectedMember)} />
                <InfoBlock label="Country" value={selectedMember.country} />
                <InfoBlock label="State" value={selectedMember.state} />
                <InfoBlock label="Branch" value={getBranchName(selectedMember.branchId) || '-'} />
              </div>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Contact</h4>
                <button onClick={() => setContactAction({ type: 'phone', value: selectedMember.phone, name: selectedMember.fullName })} className="flex items-center gap-3 w-full p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors text-left">
                  <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm text-gray-800">{selectedMember.phone}</span>
                </button>
                {selectedMember.email && (
                  <button onClick={() => setContactAction({ type: 'email', value: selectedMember.email!, name: selectedMember.fullName })} className="flex items-center gap-3 w-full p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors text-left">
                    <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm text-gray-800">{selectedMember.email}</span>
                  </button>
                )}
                {selectedMember.whatsapp && (
                  <a href={`https://wa.me/${selectedMember.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-3 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors">
                    <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-sm text-gray-800">{selectedMember.whatsapp}</span>
                  </a>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {[selectedMember.address, selectedMember.state, selectedMember.country].filter(Boolean).join(', ')}
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setDialogMode(null); setMoveTargets([selectedMember]); }} disabled={isInWorkforce(selectedMember.id)}>
                  <Briefcase className="w-4 h-4 mr-1.5" />Move to Workforce
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setDialogMode('edit')}>
                  <Edit className="w-4 h-4 mr-1.5" />Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-600 border-red-200" onClick={() => { setDialogMode(null); setDeleteTarget(selectedMember); }}>
                  <Trash2 className="w-4 h-4 mr-1.5" />Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════ DELETE CONFIRM ══════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Member</AlertDialogTitle><AlertDialogDescription>Are you sure you want to remove <strong>{deleteTarget?.fullName}</strong>? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════ MOVE TO WORKFORCE DIALOG ══════ */}
      <Dialog open={moveTargets.length > 0} onOpenChange={() => { setMoveTargets([]); setMoveDeptId(''); setMoveUnitId(''); setMoveBranchId(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move to Workforce</DialogTitle>
            <DialogDescription>
              {moveTargets.length === 1
                ? `Assign ${moveTargets[0]?.fullName} to a department, outreach, or unit in the workforce. This avoids having to re-enter their details separately.`
                : `Assign ${moveTargets.length} members to a department or outreach in the workforce. Members already in the workforce will be skipped.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {showMultiBranch && (
              <div><Label>Branch</Label>
                <Select value={moveBranchId} onValueChange={(v) => { setMoveBranchId(v); setMoveDeptId(''); setMoveUnitId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>{branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Department / Outreach <span className="text-red-500">*</span></Label>
              <p className="text-xs text-gray-500 mb-1">Choose where this member will serve.</p>
              <Select value={moveDeptId} onValueChange={(v) => { setMoveDeptId(v); setMoveUnitId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select department or outreach" /></SelectTrigger>
                <SelectContent>
                  {moveDepts.length === 0 ? <SelectItem value="none" disabled>No departments found — create one first</SelectItem> : moveDepts.map(d => <SelectItem key={d.id} value={d.id}>{d.name} ({d.type})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {moveUnits_.length > 0 && (
              <div>
                <Label>Unit <span className="text-gray-400 font-normal">(optional)</span></Label>
                <p className="text-xs text-gray-500 mb-1">Optionally assign to a specific unit within the department.</p>
                <Select value={moveUnitId} onValueChange={setMoveUnitId}>
                  <SelectTrigger><SelectValue placeholder="No specific unit" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">No specific unit</SelectItem>{moveUnits_.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setMoveTargets([]); setMoveDeptId(''); setMoveUnitId(''); setMoveBranchId(''); }}>Cancel</Button>
              <Button className="flex-1" disabled={!moveDeptId || saving} onClick={handleMoveToWorkforce}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<Briefcase className="w-4 h-4 mr-2" />Move to Workforce
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═════ CONTACT ACTION DIALOG ══════ */}
      <Dialog open={!!contactAction} onOpenChange={() => setContactAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Contact {contactAction?.name}</DialogTitle><DialogDescription>{contactAction?.type === 'phone' ? `How would you like to reach ${contactAction?.name}?` : `Send an email to ${contactAction?.name}?`}</DialogDescription></DialogHeader>
          <div className="space-y-3 mt-2">
            {contactAction?.type === 'phone' ? (
              <>
                <a href={`tel:${contactAction.value}`} className="flex items-center gap-3 w-full p-4 rounded-lg border hover:bg-blue-50 transition-colors"><Phone className="w-5 h-5 text-blue-600" /><div><p className="font-medium text-sm">Call</p><p className="text-xs text-gray-500">Open phone dialer</p></div></a>
                <a href={`sms:${contactAction.value}`} className="flex items-center gap-3 w-full p-4 rounded-lg border hover:bg-green-50 transition-colors"><MessageCircle className="w-5 h-5 text-green-600" /><div><p className="font-medium text-sm">Send SMS</p><p className="text-xs text-gray-500">Open messaging app</p></div></a>
                <a href={`https://wa.me/${contactAction.value.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full p-4 rounded-lg border hover:bg-green-50 transition-colors"><MessageCircle className="w-5 h-5 text-green-700" /><div><p className="font-medium text-sm">WhatsApp</p><p className="text-xs text-gray-500">Open WhatsApp</p></div></a>
              </>
            ) : (
              <a href={`mailto:${contactAction?.value}`} className="flex items-center gap-3 w-full p-4 rounded-lg border hover:bg-blue-50 transition-colors"><Mail className="w-5 h-5 text-blue-600" /><div><p className="font-medium text-sm">Send Email</p><p className="text-xs text-gray-500">Open email client</p></div></a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function InfoBlock({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return <div><p className="text-xs text-gray-500 mb-0.5">{label}</p><p className={`text-sm font-medium text-gray-900 ${capitalize ? 'capitalize' : ''}`}>{value}</p></div>;
}