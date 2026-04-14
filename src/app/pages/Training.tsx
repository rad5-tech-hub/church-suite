import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { BibleLoader } from '../components/BibleLoader';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
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
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  UserPlus,
  Clock,
  Users,
} from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { resolvePrimaryBranchId } from '../utils/scope';
import type { ApiTraining, ApiTrainingEnrollment } from '../apiTypes';
import {
  fetchTrainings,
  createTraining,
  editTraining,
  deleteTraining,
  enrollTraining,
  updateTrainingProgress,
  fetchTrainingEnrollments,
  fetchAdmins,
  fetchMembers,
  saveMembers,
  fetchMemberTrainingClasses,
  saveMemberTrainingClasses,
} from '../api';

const isLocalTraining = (t: ApiTraining) => t.id.startsWith('mtc-');

export function Training() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const { showToast } = useToast();

  const isMultiBranch =
    church.type === 'multi' &&
    currentAdmin?.level === 'church' &&
    branches.length > 0;
  const defaultBranchId = resolvePrimaryBranchId(branches, currentAdmin);

  // Data
  const [trainings, setTrainings] = useState<ApiTraining[]>([]);
  const [enrollCountMap, setEnrollCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Branch filter for multi-branch churches
  const [filterBranchId, setFilterBranchId] = useState(defaultBranchId || '');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTraining, setEditingTraining] = useState<ApiTraining | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationInWeeks, setDurationInWeeks] = useState('');
  const [audienceType, setAudienceType] = useState<'anyone' | 'members'>('anyone');
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Enroll dialog
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [enrollTrainingId, setEnrollTrainingId] = useState('');
  const [enrolleeId, setEnrolleeId] = useState('');
  const [enrolleeType, setEnrolleeType] = useState<'admin' | 'member'>('member');
  const [enrollees, setEnrollees] = useState<{ id: string; name: string }[]>([]);
  const [enrolleesLoading, setEnrolleesLoading] = useState(false);

  // Members dialog
  const [membersDialogTraining, setMembersDialogTraining] = useState<ApiTraining | null>(null);
  const [enrollments, setEnrollments] = useState<ApiTrainingEnrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  // For local trainings
  const [localMembers, setLocalMembers] = useState<{ id: string; name: string; status: string }[]>([]);
  const [allMembers, setAllMembers] = useState<{ id: string; name: string }[]>([]);
  const [assignMemberId, setAssignMemberId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<ApiTraining | null>(null);

  // ──────── LOAD DATA ────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const branchParam = isMultiBranch ? filterBranchId : defaultBranchId;
      const [apiData, localClasses, allMembersData] = await Promise.all([
        fetchTrainings(branchParam).catch(() => [] as ApiTraining[]),
        fetchMemberTrainingClasses(),
        fetchMembers(isMultiBranch ? filterBranchId : defaultBranchId).catch(() => []),
      ]);

      // Compute enrolled count: API trainings via _count, local trainings via member trainingClassId
      const countMap: Record<string, number> = {};
      for (const t of apiData) {
        if (t._count?.enrollments != null) {
          countMap[t.id] = t._count.enrollments;
        }
      }
      for (const m of allMembersData as any[]) {
        if (m.trainingClassId) {
          countMap[m.trainingClassId] = (countMap[m.trainingClassId] || 0) + 1;
        }
      }
      setEnrollCountMap(countMap);

      // Convert localStorage training classes to ApiTraining shape
      const localAsApi: ApiTraining[] = localClasses
        .filter((cls: any) => cls.churchId === church.id)
        .map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          description: cls.description || '',
          durationInWeeks: cls.durationWeeks || 0,
          audienceType: 'anyone',
          tenantId: '',
          churchId: cls.churchId,
          branchId: '',
          departmentId: null,
          isDeleted: false,
          createdAt: cls.createdAt,
          updatedAt: cls.createdAt,
        }));

      // Merge, avoiding duplicates by id
      const apiIds = new Set(apiData.map((t) => t.id));
      const merged = [...apiData, ...localAsApi.filter((t) => !apiIds.has(t.id))];
      setTrainings(merged);
    } catch (err) {
      console.error('Failed to load trainings:', err);
    } finally {
      setLoading(false);
    }
  }, [isMultiBranch, filterBranchId, defaultBranchId, church.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ──────── FORM HELPERS ────────
  const resetForm = () => {
    setName('');
    setDescription('');
    setDurationInWeeks('');
    setAudienceType('anyone');
    setSelectedBranchId('');
    setEditingTraining(null);
  };

  const openCreateDialog = () => {
    resetForm();
    if (isMultiBranch) {
      setSelectedBranchId(filterBranchId || branches[0]?.id || '');
    }
    setDialogOpen(true);
  };

  const openEditDialog = (training: ApiTraining) => {
    setEditingTraining(training);
    setName(training.name);
    setDescription(training.description || '');
    setDurationInWeeks(String(training.durationInWeeks || ''));
    setAudienceType(training.audienceType as 'anyone' | 'members');
    setSelectedBranchId(training.branchId || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Training name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingTraining) {
        if (isLocalTraining(editingTraining)) {
          // Update in localStorage
          const all = await fetchMemberTrainingClasses();
          const updated = (all as any[]).map((cls: any) =>
            cls.id === editingTraining.id
              ? {
                  ...cls,
                  name: name.trim(),
                  description: description.trim() || undefined,
                  durationWeeks: durationInWeeks ? Number(durationInWeeks) : undefined,
                }
              : cls,
          );
          await saveMemberTrainingClasses(updated);
        } else {
          await editTraining(editingTraining.id, {
            name: name.trim(),
            description: description.trim(),
            durationInWeeks: Number(durationInWeeks),
            audienceType,
          });
        }
        showToast('Training updated successfully.');
      } else {
        const branchId = isMultiBranch ? selectedBranchId : defaultBranchId;
        await createTraining(
          {
            name: name.trim(),
            description: description.trim(),
            durationInWeeks: Number(durationInWeeks),
            audienceType,
          },
          branchId,
        );
        showToast('Training created successfully.');
      }
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────── MEMBERS DIALOG ────────
  const loadLocalMembersForTraining = async (training: ApiTraining) => {
    const members = await fetchMembers(isMultiBranch ? filterBranchId : defaultBranchId);
    const all = (members as any[]).map((m: any) => ({
      id: m.id,
      name: m.fullName || m.name || 'Unnamed',
      trainingClassId: m.trainingClassId,
      trainingStatus: m.trainingStatus,
    }));
    const assigned = all
      .filter((m) => m.trainingClassId === training.id)
      .map((m) => ({ id: m.id, name: m.name, status: m.trainingStatus || 'in-progress' }));
    const unassigned = all
      .filter((m) => !m.trainingClassId)
      .map((m) => ({ id: m.id, name: m.name }));
    setLocalMembers(assigned);
    setAllMembers(unassigned);
    setAssignMemberId('');
    // refresh count map
    const newCountMap: Record<string, number> = {};
    for (const m of all) {
      if (m.trainingClassId) {
        newCountMap[m.trainingClassId] = (newCountMap[m.trainingClassId] || 0) + 1;
      }
    }
    setEnrollCountMap(newCountMap);
  };

  const openMembersDialog = async (training: ApiTraining) => {
    setMembersDialogTraining(training);
    setEnrollmentsLoading(true);
    setEnrollments([]);
    setLocalMembers([]);
    setAllMembers([]);
    setAssignMemberId('');

    try {
      if (isLocalTraining(training)) {
        await loadLocalMembersForTraining(training);
      } else {
        const data = await fetchTrainingEnrollments(training.id);
        setEnrollments(data);
      }
    } catch {
      // silent
    }
    setEnrollmentsLoading(false);
  };

  const handleAssignMember = async () => {
    if (!assignMemberId || !membersDialogTraining) return;
    setAssigning(true);
    try {
      const members = await fetchMembers(isMultiBranch ? filterBranchId : defaultBranchId);
      const member = (members as any[]).find((m: any) => m.id === assignMemberId);
      if (member) {
        await saveMembers([{ ...member, trainingClassId: membersDialogTraining.id, trainingStatus: 'started' }]);
      }
      showToast('Member assigned to training.');
      await loadLocalMembersForTraining(membersDialogTraining);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateMemberStatus = async (memberId: string, status: string) => {
    if (!membersDialogTraining) return;
    try {
      const members = await fetchMembers(isMultiBranch ? filterBranchId : defaultBranchId);
      const member = (members as any[]).find((m: any) => m.id === memberId);
      if (member) {
        await saveMembers([{ ...member, trainingStatus: status }]);
      }
      setLocalMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, status } : m));
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // ──────── ENROLL ────────
  const openEnrollDialog = async (trainingId: string) => {
    setEnrollTrainingId(trainingId);
    setEnrolleeId('');
    setEnrolleeType('member');
    setEnrollDialogOpen(true);
    await loadEnrollees('member');
  };

  const loadEnrollees = async (type: 'admin' | 'member') => {
    setEnrolleesLoading(true);
    try {
      if (type === 'admin') {
        const admins = await fetchAdmins(isMultiBranch ? filterBranchId : defaultBranchId);
        setEnrollees(
          admins.map((a: any) => ({ id: a.id, name: a.name || a.email })),
        );
      } else {
        const members = await fetchMembers(isMultiBranch ? filterBranchId : defaultBranchId);
        setEnrollees(
          members.map((m: any) => ({ id: m.id, name: m.name || m.fullName || 'Unnamed' })),
        );
      }
    } catch (err) {
      console.error('Failed to load enrollees:', err);
      setEnrollees([]);
    } finally {
      setEnrolleesLoading(false);
    }
  };

  const handleEnrolleeTypeChange = (type: 'admin' | 'member') => {
    setEnrolleeType(type);
    setEnrolleeId('');
    loadEnrollees(type);
  };

  const handleEnroll = async () => {
    if (!enrolleeId) {
      showToast('Please select a person to enroll.', 'error');
      return;
    }
    setSaving(true);
    try {
      await enrollTraining(enrollTrainingId, {
        enrolleeId,
        enrolleeType,
      });
      showToast('Successfully enrolled in training.');
      setEnrollDialogOpen(false);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ──────── FILTER ────────
  const filteredTrainings = trainings.filter((t) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        t.name.toLowerCase().includes(term) ||
        (t.description || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  // ──────── RENDER ────────
  if (loading) {
    return (
      <Layout>
        <BibleLoader />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Training"
        description="Create and manage training programs for your church members and admins."
        action={{
          label: 'Create Training',
          onClick: openCreateDialog,
          icon: <Plus className="w-4 h-4" />,
        }}
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search trainings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {isMultiBranch && (
            <Select
              value={filterBranchId}
              onValueChange={(v) => setFilterBranchId(v)}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Filter by branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Training cards */}
        {filteredTrainings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No trainings found</p>
            <p className="text-sm mt-1">
              {searchTerm
                ? 'Try adjusting your search.'
                : 'Create your first training to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTrainings.map((training) => (
              <Card key={training.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <GraduationCap className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">
                        {training.name}
                      </h3>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(training)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(training)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {training.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {training.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {training.durationInWeeks > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {training.durationInWeeks} week{training.durationInWeeks !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {enrollCountMap[training.id] ?? 0} enrolled
                    </Badge>
                    {training.branch && (
                      <Badge variant="secondary" className="text-xs">
                        {training.branch.name}
                      </Badge>
                    )}
                    {isLocalTraining(training) && (
                      <Badge variant="secondary" className="text-xs">
                        Local
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openMembersDialog(training)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Members
                    </Button>
                    {!isLocalTraining(training) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEnrollDialog(training.id)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Enroll
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ──────── CREATE / EDIT DIALOG ──────── */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTraining ? 'Edit Training' : 'Create Training'}
            </DialogTitle>
            <DialogDescription>
              {editingTraining
                ? 'Update this training program.'
                : 'Define a new training program.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Foundation Class"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the training"
                rows={3}
              />
            </div>

            <div>
              <Label>Duration (weeks)</Label>
              <Input
                type="number"
                min={1}
                value={durationInWeeks}
                onChange={(e) => setDurationInWeeks(e.target.value)}
                placeholder="e.g. 4"
              />
            </div>

            {!isLocalTraining(editingTraining ?? { id: '' } as ApiTraining) && (
              <div>
                <Label>Audience Type *</Label>
                <Select
                  value={audienceType}
                  onValueChange={(v) => setAudienceType(v as 'anyone' | 'members')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anyone">Anyone</SelectItem>
                    <SelectItem value="members">Members Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Branch selector only for create + multi-branch */}
            {!editingTraining && isMultiBranch && (
              <div>
                <Label>Branch *</Label>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingTraining ? 'Update Training' : 'Create Training'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────── MEMBERS DIALOG ──────── */}
      <Dialog open={!!membersDialogTraining} onOpenChange={(open) => { if (!open) setMembersDialogTraining(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {membersDialogTraining?.name} — Members
            </DialogTitle>
            <DialogDescription>
              People enrolled in this training program.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2">
            {enrollmentsLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : membersDialogTraining && isLocalTraining(membersDialogTraining) ? (
              <div className="space-y-4">
                {/* Summary row */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {membersDialogTraining.durationInWeeks > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {membersDialogTraining.durationInWeeks} week{membersDialogTraining.durationInWeeks !== 1 ? 's' : ''}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {localMembers.length} enrolled
                  </span>
                </div>

                {/* Overall completion */}
                {localMembers.length > 0 && (() => {
                  const pct = Math.round((localMembers.filter(m => m.status === 'completed').length / localMembers.length) * 100);
                  // started=0%, in-progress=1-99%, completed=100%
                  return (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Completion</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Assign member */}
                <div className="flex gap-2">
                  <Select value={assignMemberId} onValueChange={setAssignMemberId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Add member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allMembers.length === 0 ? (
                        <SelectItem value="__none" disabled>No unassigned members</SelectItem>
                      ) : (
                        allMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={handleAssignMember}
                    disabled={!assignMemberId || assigning}
                  >
                    {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Members list with individual progress */}
                {localMembers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No members assigned yet.</p>
                ) : (
                  <ul className="space-y-0 max-h-60 overflow-y-auto">
                    {localMembers.map((m) => (
                      <li key={m.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                        <span className="text-sm font-medium text-gray-800">{m.name}</span>
                        <Select value={m.status} onValueChange={(val) => handleUpdateMemberStatus(m.id, val)}>
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="started">Started</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : enrollments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No members enrolled yet. Use the Enroll button to add people.</p>
            ) : (
              <ul className="space-y-3 max-h-72 overflow-y-auto">
                {enrollments.map((e) => {
                  const displayName =
                    e.enrollee?.fullName ||
                    e.enrollee?.name ||
                    e.enrollee?.email ||
                    e.enrolleeId;
                  return (
                    <li key={e.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-800 truncate">{displayName}</span>
                        <Badge variant="outline" className="text-xs capitalize flex-shrink-0">{e.enrolleeType}</Badge>
                      </div>
                      <Select
                        value={
                          (e.progressPercentage ?? 0) === 0
                            ? 'started'
                            : (e.progressPercentage ?? 0) === 100
                            ? 'completed'
                            : 'in-progress'
                        }
                        onValueChange={async (val) => {
                          const pct = val === 'started' ? 0 : val === 'completed' ? 100 : 50;
                          try {
                            const updated = await updateTrainingProgress(e.trainingId, e.id, pct);
                            setEnrollments((prev) =>
                              prev.map((en) => en.id === e.id
                                ? { ...en, progressPercentage: updated.progressPercentage, completedAt: updated.completedAt }
                                : en,
                              ),
                            );
                          } catch (err: any) {
                            showToast(`Error: ${err.message}`, 'error');
                          }
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs flex-shrink-0 ml-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="started">Started</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────── ENROLL DIALOG ──────── */}
      <Dialog open={enrollDialogOpen} onOpenChange={(open) => { if (!open) setEnrollDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll in Training</DialogTitle>
            <DialogDescription>
              Select a person to enroll in this training program.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label>Enrollee Type *</Label>
              <Select
                value={enrolleeType}
                onValueChange={(v) => handleEnrolleeTypeChange(v as 'admin' | 'member')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Person *</Label>
              {enrolleesLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                <Select value={enrolleeId} onValueChange={setEnrolleeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button onClick={handleEnroll} disabled={saving} className="w-full">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enroll
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────── DELETE CONFIRM ──────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  if (isLocalTraining(deleteTarget)) {
                    const all = await fetchMemberTrainingClasses();
                    const updated = (all as any[]).filter((c: any) => c.id !== deleteTarget.id);
                    await saveMemberTrainingClasses(updated);
                  } else {
                    await deleteTraining(deleteTarget.id).catch(() => {});
                  }
                  showToast(`"${deleteTarget.name}" deleted.`);
                  setDeleteTarget(null);
                  await loadData();
                } catch (err: any) {
                  showToast(`Error: ${err.message}`, 'error');
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
