import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
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
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Award,
  Edit,
  Trash2,
  Eye,
  X,
  Loader2,
  CheckCircle,
  GraduationCap,
  BookOpen,
  UserPlus,
  Layers,
  ChevronRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Member,
  WorkforceMember,
  TrainingProgram,
  WorkforceRoadmap,
  RoadmapStatus,
  Department,
  Unit,
  Program,
  ProgramInstance,
} from '../types';
import {
  fetchMembers,
  fetchWorkforce,
  saveWorkforce,
  fetchTrainingPrograms,
  saveTrainingPrograms,
  fetchDepartments,
  fetchUnits,
  fetchPrograms,
  fetchProgramInstances,
} from '../api';

type ActiveTab = 'workforce' | 'training';

// ─────────── ATTENDANCE RECORD SUB-COMPONENT ───────────
function AttendanceRecord({
  worker,
  programs: allPrograms,
  programInstances,
}: {
  worker: WorkforceMember;
  programs: Program[];
  programInstances: ProgramInstance[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  // Programs this worker's department is expected to attend
  const relevantPrograms = allPrograms.filter(p =>
    p.departmentIds?.includes(worker.departmentId)
  );

  if (relevantPrograms.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Program Attendance
        </h4>
        <p className="text-sm text-gray-400 italic">
          No programs are currently assigned to this member's department, so there are no attendance records to show yet.
        </p>
      </div>
    );
  }

  // Build attendance data per program
  const programAttendance = relevantPrograms.map(prog => {
    const managedInstances = programInstances
      .filter(inst => inst.programId === prog.id && inst.managed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const attended = managedInstances.filter(inst =>
      inst.workforceAttendance?.includes(worker.id)
    ).length;

    const total = managedInstances.length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { prog, managedInstances, attended, total, rate };
  }).filter(pa => pa.total > 0); // Only show programs that have at least one managed instance

  const totalAttended = programAttendance.reduce((sum, pa) => sum + pa.attended, 0);
  const totalSessions = programAttendance.reduce((sum, pa) => sum + pa.total, 0);
  const overallRate = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

  if (programAttendance.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Program Attendance
        </h4>
        <p className="text-sm text-gray-400 italic">
          Programs have been assigned to this department but none have been managed yet. Once a program is managed and attendance is taken, records will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-2 group"
      >
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Program Attendance
        </h4>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs ${
              overallRate >= 75
                ? 'bg-green-50 text-green-700 border-green-200'
                : overallRate >= 50
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                  : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {totalAttended}/{totalSessions} ({overallRate}%)
          </Badge>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Overall attendance bar */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Overall Attendance</span>
              <span>{overallRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  overallRate >= 75
                    ? 'bg-green-500'
                    : overallRate >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${overallRate}%` }}
              />
            </div>
          </div>

          {/* Per-program breakdown */}
          {programAttendance.map(({ prog, managedInstances, attended, total, rate }) => (
            <div key={prog.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() =>
                  setExpandedProgram(expandedProgram === prog.id ? null : prog.id)
                }
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarDays className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {prog.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      rate >= 75
                        ? 'bg-green-100 text-green-700'
                        : rate >= 50
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {attended}/{total}
                  </span>
                  {expandedProgram === prog.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedProgram === prog.id && (
                <div className="border-t border-gray-100 bg-gray-50/50 max-h-48 overflow-y-auto">
                  {managedInstances.map(inst => {
                    const wasPresent = inst.workforceAttendance?.includes(worker.id);
                    const dateLabel = new Date(inst.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <div
                        key={inst.id}
                        className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-xs text-gray-600">{dateLabel}</span>
                        {wasPresent ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Present
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                            <X className="w-3.5 h-3.5" />
                            Absent
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Workforce() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const isMultiBranch = church.type === 'multi' && currentAdmin?.level === 'church' && branches.length > 0;

  // Data
  const [members, setMembers] = useState<Member[]>([]);
  const [workforce, setWorkforce] = useState<WorkforceMember[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programInstances, setProgramInstances] = useState<ProgramInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<ActiveTab>('workforce');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // ──────── ADD TO WORKFORCE DIALOG ────────
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [addBranchId, setAddBranchId] = useState('');
  const [addDeptId, setAddDeptId] = useState('');
  const [addUnitId, setAddUnitId] = useState('');
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);

  // ──────── EDIT WORKFORCE DIALOG ────────
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkforceMember | null>(null);
  const [editBranchId, setEditBranchId] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editUnitId, setEditUnitId] = useState('');

  // ──────── VIEW / PROGRESS DIALOG ────────
  const [viewTarget, setViewTarget] = useState<WorkforceMember | null>(null);

  // ──────── DELETE CONFIRM ────────
  const [deleteTarget, setDeleteTarget] = useState<WorkforceMember | null>(null);

  // ──────── TRAINING PROGRAM DIALOG ────────
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [editProgram, setEditProgram] = useState<TrainingProgram | null>(null);
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [deleteProgram, setDeleteProgram] = useState<TrainingProgram | null>(null);

  // ──────── ASSIGN PROGRAM DIALOG ────────
  const [assignTarget, setAssignTarget] = useState<WorkforceMember | null>(null);
  const [assignProgramId, setAssignProgramId] = useState('');

  // Load
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersData, workforceData, trainingData, deptsData, unitsData, progsData, instsData] = await Promise.all([
        fetchMembers(),
        fetchWorkforce(),
        fetchTrainingPrograms(),
        fetchDepartments(),
        fetchUnits(),
        fetchPrograms(branches[0]?.id),
        fetchProgramInstances(),
      ]);
      setMembers(membersData as Member[]);
      setWorkforce(workforceData as WorkforceMember[]);
      setTrainingPrograms(trainingData as TrainingProgram[]);
      setDepartments(deptsData as Department[]);
      setUnits(unitsData as Unit[]);
      setPrograms(progsData as Program[]);
      setProgramInstances(instsData as ProgramInstance[]);
    } catch (err) {
      console.error('Failed to load workforce data:', err);
    } finally {
      setLoading(false);
    }
  }, [church.id, branches]);

  useEffect(() => { loadData(); }, [loadData]);

  const { showToast } = useToast();

  // ──────── HELPERS ────────
  const getMemberName = (memberId: string) =>
    members.find(m => m.id === memberId)?.fullName || 'Unknown Member';
  const getMember = (memberId: string) =>
    members.find(m => m.id === memberId);
  const getDeptName = (deptId: string) =>
    departments.find(d => d.id === deptId)?.name || '';
  const getUnitName = (unitId?: string) =>
    unitId ? units.find(u => u.id === unitId)?.name || '' : '';
  const getBranchName = (branchId?: string) =>
    branchId ? branches.find(b => b.id === branchId)?.name || '' : '';
  const getProgramName = (programId: string) =>
    trainingPrograms.find(p => p.id === programId)?.name || 'Unknown Program';

  const unitsForDept = (deptId: string) => units.filter(u => u.departmentId === deptId);

  // All members can be added to workforce (a member can serve in multiple departments)
  const filteredAvailable = members.filter(m =>
    !memberSearch || m.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const getProgressPercentage = (w: WorkforceMember) => {
    const markers = w.roadmapMarkers ?? [];
    const total = markers.length;
    if (total === 0) return 0;
    const completed = markers.filter(m => m.status === 'completed').length;
    return (completed / total) * 100;
  };

  const getStatusIcon = (status: RoadmapStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: RoadmapStatus) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  const getStatusBadgeClass = (status: RoadmapStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getNextStatus = (status: RoadmapStatus): RoadmapStatus | null => {
    switch (status) {
      case 'not-started': return 'in-progress';
      case 'in-progress': return 'completed';
      default: return null;
    }
  };

  const getNextStatusLabel = (status: RoadmapStatus): string => {
    switch (status) {
      case 'not-started': return 'Start';
      case 'in-progress': return 'Complete';
      default: return '';
    }
  };

  // ──────── WORKFORCE CRUD ────────
  const handleAddToWorkforce = async () => {
    if (!selectedMemberId || !addDeptId) return;
    setSaving(true);
    try {
      const allWf = await fetchWorkforce();
      // Allow multiple departments — only block exact same dept+unit combo
      const duplicate = (allWf as WorkforceMember[]).some(w =>
        w.memberId === selectedMemberId && w.departmentId === addDeptId && (w.unitId || '') === (addUnitId || '')
      );
      if (duplicate) {
        showToast(`This member is already assigned to this department${addUnitId ? '/unit' : ''}.`);
        setSaving(false);
        return;
      }
      const newEntry: WorkforceMember = {
        id: `wf-${Date.now()}`,
        churchId: church.id,
        memberId: selectedMemberId,
        branchId: isMultiBranch ? addBranchId || undefined : currentAdmin?.branchId,
        departmentId: addDeptId,
        unitId: addUnitId || undefined,
        roadmapMarkers: [],
        createdAt: new Date(),
      };
      const updated = [...(allWf as WorkforceMember[]), newEntry];
      await saveWorkforce(updated);
      setWorkforce(updated.filter(w => w.churchId === church.id));
      setAddDialogOpen(false);
      resetAddForm();
      showToast(`"${getMemberName(selectedMemberId)}" added to the workforce.`);
    } catch (err: any) {
      console.error('Failed to add workforce member:', err);
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditWorkforce = async () => {
    if (!editTarget || !editDeptId) return;
    setSaving(true);
    try {
      const allWf = await fetchWorkforce();
      const updated = (allWf as WorkforceMember[]).map(w =>
        w.id === editTarget.id
          ? {
              ...w,
              branchId: isMultiBranch ? editBranchId || undefined : w.branchId,
              departmentId: editDeptId,
              unitId: editUnitId || undefined,
            }
          : w
      );
      await saveWorkforce(updated);
      setWorkforce(updated.filter(w => w.churchId === church.id));
      setEditDialogOpen(false);
      setEditTarget(null);
      showToast(`Workforce entry updated.`);
    } catch (err: any) {
      console.error('Failed to update workforce:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkforce = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const name = getMemberName(deleteTarget.memberId);
    try {
      const allWf = await fetchWorkforce();
      const updated = (allWf as WorkforceMember[]).filter(w => w.id !== deleteTarget.id);
      await saveWorkforce(updated);
      setWorkforce(updated.filter(w => w.churchId === church.id));
      setDeleteTarget(null);
      showToast(`"${name}" removed from workforce.`);
    } catch (err: any) {
      console.error('Failed to delete workforce:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetAddForm = () => {
    setSelectedMemberId('');
    setMemberSearch('');
    setAddBranchId('');
    setAddDeptId('');
    setAddUnitId('');
    setMemberDropdownOpen(false);
  };

  // ──────── TRAINING PROGRAM CRUD ────────
  const handleSaveProgram = async () => {
    if (!pName.trim()) return;
    setSaving(true);
    try {
      const allProgs = await fetchTrainingPrograms();
      let updated: TrainingProgram[];
      if (editProgram) {
        updated = (allProgs as TrainingProgram[]).map(p =>
          p.id === editProgram.id ? { ...p, name: pName.trim(), description: pDesc.trim() || undefined } : p
        );
      } else {
        const newProg: TrainingProgram = {
          id: `tp-${Date.now()}`,
          churchId: church.id,
          name: pName.trim(),
          description: pDesc.trim() || undefined,
          createdAt: new Date(),
        };
        updated = [...(allProgs as TrainingProgram[]), newProg];
      }
      await saveTrainingPrograms(updated);
      setTrainingPrograms(updated.filter(p => p.churchId === church.id));
      setProgramDialogOpen(false);
      setEditProgram(null);
      setPName('');
      setPDesc('');
      showToast(editProgram ? 'Training program updated.' : 'Training program created.');
    } catch (err: any) {
      console.error('Failed to save training program:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgram = async () => {
    if (!deleteProgram) return;
    setSaving(true);
    try {
      // Remove from all workforce roadmaps
      const allWf = await fetchWorkforce();
      const updatedWf = (allWf as WorkforceMember[]).map(w => ({
        ...w,
        roadmapMarkers: w.roadmapMarkers.filter(m => m.programId !== deleteProgram.id),
      }));
      await saveWorkforce(updatedWf);
      setWorkforce(updatedWf.filter(w => w.churchId === church.id));

      const allProgs = await fetchTrainingPrograms();
      const updated = (allProgs as TrainingProgram[]).filter(p => p.id !== deleteProgram.id);
      await saveTrainingPrograms(updated);
      setTrainingPrograms(updated.filter(p => p.churchId === church.id));
      setDeleteProgram(null);
      showToast(`"${deleteProgram.name}" training program deleted.`);
    } catch (err: any) {
      console.error('Failed to delete program:', err);
    } finally {
      setSaving(false);
    }
  };

  // ──────── ASSIGN / UPDATE ROADMAP ────────
  const handleAssignProgram = async () => {
    if (!assignTarget || !assignProgramId) return;
    // Check if already assigned
    if (assignTarget.roadmapMarkers.some(m => m.programId === assignProgramId)) {
      showToast('This program is already assigned to this worker.');
      return;
    }
    setSaving(true);
    try {
      const newMarker: WorkforceRoadmap = {
        id: `rm-${Date.now()}`,
        programId: assignProgramId,
        status: 'not-started',
      };
      const allWf = await fetchWorkforce();
      const updated = (allWf as WorkforceMember[]).map(w =>
        w.id === assignTarget.id
          ? { ...w, roadmapMarkers: [...w.roadmapMarkers, newMarker] }
          : w
      );
      await saveWorkforce(updated);
      const churchWf = updated.filter(w => w.churchId === church.id);
      setWorkforce(churchWf);
      // Refresh viewTarget if open
      if (viewTarget?.id === assignTarget.id) {
        setViewTarget(churchWf.find(w => w.id === assignTarget.id) || null);
      }
      setAssignTarget(null);
      setAssignProgramId('');
      showToast('Training program assigned.');
    } catch (err: any) {
      console.error('Failed to assign program:', err);
    } finally {
      setSaving(false);
    }
  };

  const updateMarkerStatus = async (workerId: string, markerId: string, newStatus: RoadmapStatus) => {
    setSaving(true);
    try {
      const allWf = await fetchWorkforce();
      const updated = (allWf as WorkforceMember[]).map(w => {
        if (w.id !== workerId) return w;
        return {
          ...w,
          roadmapMarkers: w.roadmapMarkers.map(m => {
            if (m.id !== markerId) return m;
            return {
              ...m,
              status: newStatus,
              startDate: newStatus === 'in-progress' && !m.startDate ? new Date() : m.startDate,
              completionDate: newStatus === 'completed' ? new Date() : undefined,
            };
          }),
        };
      });
      await saveWorkforce(updated);
      const churchWf = updated.filter(w => w.churchId === church.id);
      setWorkforce(churchWf);
      if (viewTarget?.id === workerId) {
        setViewTarget(churchWf.find(w => w.id === workerId) || null);
      }
      showToast('Progress updated.');
    } catch (err: any) {
      console.error('Failed to update progress:', err);
    } finally {
      setSaving(false);
    }
  };

  const removeMarker = async (workerId: string, markerId: string) => {
    setSaving(true);
    try {
      const allWf = await fetchWorkforce();
      const updated = (allWf as WorkforceMember[]).map(w => {
        if (w.id !== workerId) return w;
        return { ...w, roadmapMarkers: w.roadmapMarkers.filter(m => m.id !== markerId) };
      });
      await saveWorkforce(updated);
      const churchWf = updated.filter(w => w.churchId === church.id);
      setWorkforce(churchWf);
      if (viewTarget?.id === workerId) {
        setViewTarget(churchWf.find(w => w.id === workerId) || null);
      }
      showToast('Program removed from roadmap.');
    } catch (err: any) {
      console.error('Failed to remove marker:', err);
    } finally {
      setSaving(false);
    }
  };

  // Filtered workforce
  const filteredWorkforce = workforce.filter(w => {
    if (!searchTerm) return true;
    const name = getMemberName(w.memberId).toLowerCase();
    const dept = getDeptName(w.departmentId).toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || dept.includes(searchTerm.toLowerCase());
  });

  // Program search (for training tab)
  const filteredPrograms = trainingPrograms.filter(p => {
    if (!searchTerm) return true;
    return p.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Count how many workforce members are assigned a program
  const getProgramAssignCount = (programId: string) =>
    workforce.filter(w => w.roadmapMarkers.some(m => m.programId === programId)).length;

  return (
    <Layout>
      <PageHeader
        title="Workforce Management"
        description="Track church workers, create training programs, and monitor their development progress."
        action={{
          label: activeTab === 'workforce' ? 'Add to Workforce' : 'Create Training Program',
          onClick: () => {
            if (activeTab === 'workforce') {
              resetAddForm();
              setAddDialogOpen(true);
            } else {
              setEditProgram(null);
              setPName('');
              setPDesc('');
              setProgramDialogOpen(true);
            }
          },
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'workforce'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setActiveTab('workforce'); setSearchTerm(''); }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Workforce ({workforce.length})
            </div>
          </button>
          <button
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'training'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => { setActiveTab('training'); setSearchTerm(''); }}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Training Programs ({trainingPrograms.length})
            </div>
          </button>
        </div>

        {loading ? (
          <BibleLoader message="Loading workforce data..." />
        ) : activeTab === 'workforce' ? (
          /* ═══════════════════ WORKFORCE TAB ═══════════════════ */
          workforce.length === 0 ? (
            <Card>
              <CardContent className="py-16 px-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No workforce members yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Your workforce tracker is empty because no members have been added yet. Start by adding church members who are actively serving, then assign training programs to track their growth.
                </p>
                <Button onClick={() => { resetAddForm(); setAddDialogOpen(true); }}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Workforce Member
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search */}
              <Card>
                <CardContent className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by member name or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <p className="text-sm text-gray-500">{filteredWorkforce.length} worker{filteredWorkforce.length !== 1 ? 's' : ''}</p>

              {filteredWorkforce.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <p className="text-gray-500">No workforce members match your search.</p>
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredWorkforce.map(worker => {
                    const member = getMember(worker.memberId);
                    const progress = getProgressPercentage(worker);
                    return (
                      <Card key={worker.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base">{member?.fullName || 'Unknown'}</CardTitle>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <Badge variant="outline" className="text-xs">{getDeptName(worker.departmentId)}</Badge>
                                {worker.unitId && (
                                  <Badge variant="secondary" className="text-xs">{getUnitName(worker.unitId)}</Badge>
                                )}
                                {isMultiBranch && worker.branchId && (
                                  <span className="text-xs text-gray-400">{getBranchName(worker.branchId)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => setViewTarget(worker)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditTarget(worker);
                                setEditBranchId(worker.branchId || '');
                                setEditDeptId(worker.departmentId);
                                setEditUnitId(worker.unitId || '');
                                setEditDialogOpen(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(worker)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Progress */}
                          {worker.roadmapMarkers.length > 0 ? (
                            <>
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-medium text-gray-600">Training Progress</span>
                                  <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                              <div className="space-y-1.5">
                                {worker.roadmapMarkers.slice(0, 3).map(marker => {
                                  const nextStatus = getNextStatus(marker.status);
                                  return (
                                    <div key={marker.id} className="flex items-center gap-2">
                                      {getStatusIcon(marker.status)}
                                      <span className="text-xs text-gray-700 flex-1 truncate">{getProgramName(marker.programId)}</span>
                                      {nextStatus ? (
                                        <button
                                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                                            marker.status === 'not-started'
                                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                                          }`}
                                          onClick={(e) => { e.stopPropagation(); updateMarkerStatus(worker.id, marker.id, nextStatus); }}
                                          disabled={saving}
                                        >
                                          {getNextStatusLabel(marker.status)} &rarr;
                                        </button>
                                      ) : (
                                        <Badge variant="outline" className="text-[10px] bg-green-100 text-green-800">
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                  );
                                })}
                                {worker.roadmapMarkers.length > 3 && (
                                  <p className="text-xs text-gray-400">+{worker.roadmapMarkers.length - 3} more</p>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No training programs assigned yet</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => { setAssignTarget(worker); setAssignProgramId(''); }}
                          >
                            <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                            Assign Training Program
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )
        ) : (
          /* ═══════════════════ TRAINING TAB ═══════════════════ */
          trainingPrograms.length === 0 ? (
            <Card>
              <CardContent className="py-16 px-4 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-50 mb-4">
                  <GraduationCap className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No training programs yet</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Training programs haven't been created yet. Create programs like "School of Ministry", "Leadership Training", or "New Workers Orientation" to track your workforce's development.
                </p>
                <Button onClick={() => { setEditProgram(null); setPName(''); setPDesc(''); setProgramDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Training Program
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Search */}
              <Card>
                <CardContent className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search training programs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {filteredPrograms.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <p className="text-gray-500">No programs match your search.</p>
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPrograms.map(program => {
                    const assignCount = getProgramAssignCount(program.id);
                    return (
                      <Card key={program.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-purple-600" />
                              <CardTitle className="text-base">{program.name}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {program.description && (
                            <p className="text-sm text-gray-500">{program.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Award className="w-3.5 h-3.5" />
                            <span>{assignCount} worker{assignCount !== 1 ? 's' : ''} enrolled</span>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-gray-100">
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                              setEditProgram(program);
                              setPName(program.name);
                              setPDesc(program.description || '');
                              setProgramDialogOpen(true);
                            }}>
                              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs text-red-600 hover:bg-red-50" onClick={() => setDeleteProgram(program)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* ═══════════════════ ADD TO WORKFORCE DIALOG ═══════════════════ */}
      <Dialog open={addDialogOpen} onOpenChange={(o) => { if (!o) { setAddDialogOpen(false); resetAddForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add to Workforce</DialogTitle>
            <DialogDescription>
              Select a church member, assign them to a department, and optionally a unit. A member can serve in multiple departments — each assignment is tracked separately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Searchable member picker */}
            <div className="space-y-2">
              <Label>Select Member *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  placeholder={selectedMemberId ? getMemberName(selectedMemberId) : 'Type to search members...'}
                  value={memberSearch}
                  onChange={(e) => { setMemberSearch(e.target.value); setMemberDropdownOpen(true); if (selectedMemberId) setSelectedMemberId(''); }}
                  onFocus={() => setMemberDropdownOpen(true)}
                  className={`pl-10 ${selectedMemberId ? 'border-green-300 bg-green-50' : ''}`}
                />
                {selectedMemberId && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => { setSelectedMemberId(''); setMemberSearch(''); }}
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                {memberDropdownOpen && !selectedMemberId && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredAvailable.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        {members.length === 0
                          ? 'No members found. Add members first from the Members page.'
                          : 'No members match your search.'}
                      </div>
                    ) : (
                      filteredAvailable.map(m => (
                        <button
                          key={m.id}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm border-b border-gray-50 last:border-0"
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            setMemberSearch('');
                            setMemberDropdownOpen(false);
                          }}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                            {m.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{m.fullName}</p>
                            <p className="text-xs text-gray-500">{m.phone}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Branch (multi) */}
            {isMultiBranch && (
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={addBranchId} onValueChange={setAddBranchId}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Department */}
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={addDeptId} onValueChange={(v) => { setAddDeptId(v); setAddUnitId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Unit (optional) */}
            {addDeptId && (
              <div className="space-y-2">
                <Label>Unit <span className="text-gray-400 font-normal">(optional)</span></Label>
                {unitsForDept(addDeptId).length > 0 ? (
                  <Select value={addUnitId} onValueChange={setAddUnitId}>
                    <SelectTrigger><SelectValue placeholder="Select unit (optional)" /></SelectTrigger>
                    <SelectContent>
                      {unitsForDept(addDeptId).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">No units have been created under this department yet. You can add units in the Settings page.</p>
                )}
              </div>
            )}

            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setAddDialogOpen(false); resetAddForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!selectedMemberId || !addDeptId || saving} onClick={handleAddToWorkforce}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add to Workforce
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ EDIT WORKFORCE DIALOG ═══════════════════ */}
      <Dialog open={editDialogOpen} onOpenChange={(o) => { if (!o) { setEditDialogOpen(false); setEditTarget(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Workforce Assignment</DialogTitle>
            <DialogDescription>
              Update the department or unit assignment for {editTarget ? getMemberName(editTarget.memberId) : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {isMultiBranch && (
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={editBranchId} onValueChange={setEditBranchId}>
                  <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={editDeptId} onValueChange={(v) => { setEditDeptId(v); setEditUnitId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editDeptId && (
              <div className="space-y-2">
                <Label>Unit <span className="text-gray-400 font-normal">(optional)</span></Label>
                {unitsForDept(editDeptId).length > 0 ? (
                  <Select value={editUnitId} onValueChange={setEditUnitId}>
                    <SelectTrigger><SelectValue placeholder="Select unit (optional)" /></SelectTrigger>
                    <SelectContent>
                      {unitsForDept(editDeptId).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">No units exist under this department.</p>
                )}
              </div>
            )}
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setEditDialogOpen(false); setEditTarget(null); }}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!editDeptId || saving} onClick={handleEditWorkforce}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ VIEW / PROGRESS DIALOG ═══════════════════ */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => { if (!o) setViewTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewTarget ? getMemberName(viewTarget.memberId) : ''}</DialogTitle>
            <DialogDescription>Workforce profile and training progress</DialogDescription>
          </DialogHeader>
          {viewTarget && (() => {
            const member = getMember(viewTarget.memberId);
            const progress = getProgressPercentage(viewTarget);
            return (
              <div className="space-y-5 mt-2">
                {/* Assignment info */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Department:</span>
                    <span>{getDeptName(viewTarget.departmentId)}</span>
                  </div>
                  {viewTarget.unitId && (
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700">Unit:</span>
                      <span>{getUnitName(viewTarget.unitId)}</span>
                    </div>
                  )}
                  {isMultiBranch && viewTarget.branchId && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Branch:</span>
                      <span>{getBranchName(viewTarget.branchId)}</span>
                    </div>
                  )}
                  {member && (
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-200 mt-2">
                      <span className="text-xs text-gray-500">{member.phone} {member.email ? `| ${member.email}` : ''}</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                {viewTarget.roadmapMarkers.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                      <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Training roadmap */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Training Roadmap</h4>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => { setAssignTarget(viewTarget); setAssignProgramId(''); }}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Assign Program
                    </Button>
                  </div>
                  {viewTarget.roadmapMarkers.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No training programs assigned yet. Click "Assign Program" to get started.</p>
                  ) : (
                    <div className="space-y-3">
                      {viewTarget.roadmapMarkers.map(marker => {
                        const nextStatus = getNextStatus(marker.status);
                        const steps: RoadmapStatus[] = ['not-started', 'in-progress', 'completed'];
                        const currentStepIndex = steps.indexOf(marker.status);
                        return (
                          <div key={marker.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(marker.status)}
                                <span className="text-sm font-medium text-gray-900">{getProgramName(marker.programId)}</span>
                              </div>
                              <button onClick={() => removeMarker(viewTarget.id, marker.id)} className="text-gray-400 hover:text-red-500" title="Remove program">
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Visual 3-step progress indicator */}
                            <div className="flex items-center gap-1">
                              {steps.map((step, i) => (
                                <div key={step} className="flex items-center flex-1">
                                  <button
                                    className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors ${
                                      i <= currentStepIndex
                                        ? step === 'completed' || (i < currentStepIndex)
                                          ? 'bg-green-500 border-green-500 text-white'
                                          : step === 'in-progress'
                                            ? 'bg-blue-500 border-blue-500 text-white'
                                            : 'bg-gray-400 border-gray-400 text-white'
                                        : 'bg-white border-gray-300 text-gray-400'
                                    }`}
                                    onClick={() => updateMarkerStatus(viewTarget.id, marker.id, step)}
                                    disabled={saving}
                                    title={`Set to ${getStatusLabel(step)}`}
                                  >
                                    {i < currentStepIndex ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                      <span className="text-[10px] font-bold">{i + 1}</span>
                                    )}
                                  </button>
                                  {i < steps.length - 1 && (
                                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-green-400' : 'bg-gray-200'}`} />
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-3 text-[10px] text-gray-400">
                                <span>Not Started</span>
                                <span>In Progress</span>
                                <span>Completed</span>
                              </div>
                            </div>

                            {/* Quick advance button */}
                            {nextStatus && (
                              <Button
                                variant="outline"
                                size="sm"
                                className={`w-full text-xs ${
                                  marker.status === 'not-started'
                                    ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                                    : 'border-green-200 text-green-700 hover:bg-green-50'
                                }`}
                                onClick={() => updateMarkerStatus(viewTarget.id, marker.id, nextStatus)}
                                disabled={saving}
                              >
                                {marker.status === 'not-started' ? (
                                  <><Clock className="w-3.5 h-3.5 mr-1.5" /> Mark as In Progress</>
                                ) : (
                                  <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Mark as Completed</>
                                )}
                              </Button>
                            )}

                            {marker.startDate && (
                              <p className="text-xs text-gray-400">
                                Started: {new Date(marker.startDate).toLocaleDateString()}
                                {marker.completionDate && ` | Completed: ${new Date(marker.completionDate).toLocaleDateString()}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ──────── PROGRAM ATTENDANCE RECORD ──────── */}
                <AttendanceRecord
                  worker={viewTarget}
                  programs={programs}
                  programInstances={programInstances}
                />

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setEditTarget(viewTarget);
                    setEditBranchId(viewTarget.branchId || '');
                    setEditDeptId(viewTarget.departmentId);
                    setEditUnitId(viewTarget.unitId || '');
                    setViewTarget(null);
                    setEditDialogOpen(true);
                  }}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Assignment
                  </Button>
                  <Button variant="outline" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => {
                    setViewTarget(null);
                    setDeleteTarget(viewTarget);
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ ASSIGN PROGRAM DIALOG ═══════════════════ */}
      <Dialog open={!!assignTarget} onOpenChange={(o) => { if (!o) { setAssignTarget(null); setAssignProgramId(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Training Program</DialogTitle>
            <DialogDescription>
              Choose a training program to assign to {assignTarget ? getMemberName(assignTarget.memberId) : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {trainingPrograms.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                No training programs have been created yet. Switch to the "Training Programs" tab to create one first.
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Training Program *</Label>
                <Select value={assignProgramId} onValueChange={setAssignProgramId}>
                  <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>
                    {trainingPrograms.map(p => {
                      const alreadyAssigned = assignTarget?.roadmapMarkers.some(m => m.programId === p.id);
                      return (
                        <SelectItem key={p.id} value={p.id} disabled={alreadyAssigned}>
                          {p.name} {alreadyAssigned ? '(already assigned)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setAssignTarget(null); setAssignProgramId(''); }}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!assignProgramId || saving} onClick={handleAssignProgram}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ TRAINING PROGRAM DIALOG ═══════════════════ */}
      <Dialog open={programDialogOpen} onOpenChange={(o) => { if (!o) { setProgramDialogOpen(false); setEditProgram(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editProgram ? 'Edit Training Program' : 'Create Training Program'}</DialogTitle>
            <DialogDescription>
              {editProgram
                ? 'Update this training program\'s details.'
                : 'Define a new training program that workforce members can be enrolled in.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Program Name *</Label>
              <Input value={pName} onChange={e => setPName(e.target.value)} placeholder="e.g., School of Ministry" />
            </div>
            <div className="space-y-2">
              <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Brief description of the program" />
            </div>
            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setProgramDialogOpen(false); setEditProgram(null); }}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={!pName.trim() || saving} onClick={handleSaveProgram}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editProgram ? 'Save Changes' : 'Create Program'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ DELETE WORKFORCE CONFIRM ═══════════════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Workforce</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget ? getMemberName(deleteTarget.memberId) : ''}</strong> from the workforce? Their training progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkforce} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════ DELETE PROGRAM CONFIRM ═══════════════════ */}
      <AlertDialog open={!!deleteProgram} onOpenChange={() => setDeleteProgram(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteProgram?.name}"</strong>? It will also be removed from all workforce members' roadmaps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProgram} className="bg-red-600 hover:bg-red-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Program
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}