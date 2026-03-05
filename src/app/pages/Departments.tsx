import { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Layers, Plus, Edit, Trash2, Users, Box, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Department } from '../types';
import { fetchDepartments, createDepartment, editDepartment, deleteDepartmentApi, fetchUnits } from '../api';

export function Departments() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();

  // Data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [type, setType] = useState<'department' | 'outreach'>('department');
  const [description, setDescription] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Build valid branch IDs (includes all known branches regardless of church type)
  const validBranchIds = useMemo(() => {
    const ids = new Set<string>();
    ids.add(church.id); // church ID itself (some APIs use it)
    branches.forEach(b => ids.add(b.id));
    return ids;
  }, [church, branches]);

  // Load departments & unit counts from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [depts, units] = await Promise.all([fetchDepartments(), fetchUnits()]);
      // Accept all departments: those with no branchId (single-church) or matching a known branch
      const validDepts = (depts as unknown as Department[]).filter(d =>
        !d.branchId || validBranchIds.has(d.branchId)
      );
      setDepartments(validDepts);
      // Count units per department
      const counts: Record<string, number> = {};
      (units as any[]).forEach(u => {
        counts[u.departmentId] = (counts[u.departmentId] || 0) + 1;
      });
      setUnitCounts(counts);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  }, [validBranchIds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName('');
    setType('department');
    setDescription('');
    setSelectedBranch('');
    setEditingDept(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setType((dept.type?.toLowerCase() === 'outreach' ? 'outreach' : 'department') as 'department' | 'outreach');
    setDescription(dept.description || '');
    if (church.type === 'multi') {
      setSelectedBranch(dept.branchId || '');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    // Always resolve a branchId — API requires it
    const branchId = church.type === 'multi'
      ? selectedBranch
      : currentAdmin?.branchId || branches[0]?.id;
    if (!name.trim()) return;
    if (!branchId) {
      showToast('No branch found. Please create a branch first.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingDept) {
        await editDepartment(editingDept.id, { name: name.trim(), description: description.trim() || undefined, type: type.charAt(0).toUpperCase() + type.slice(1), branchId });
        showToast(`${type === 'department' ? 'Department' : 'Outreach'} updated successfully.`);
      } else {
        await createDepartment({ name: name.trim(), description: description.trim() || undefined, type: type.charAt(0).toUpperCase() + type.slice(1), branchId });
        showToast(`${type === 'department' ? 'Department' : 'Outreach'} created successfully.`);
      }
      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || 'Something went wrong. Please try again.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const dept = departments.find(d => d.id === deleteId);
      const delBranchId = dept?.branchId || currentAdmin?.branchId || branches[0]?.id || church.id;
      await deleteDepartmentApi(deleteId, delBranchId);
      setDeleteId(null);
      showToast('Department deleted successfully.');
      await loadData();
    } catch (err: any) {
      const msg = err?.body?.message || err?.message || 'Failed to delete. Please try again.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        title="Departments & Outreaches"
        description="Organize your church into departments and outreach programs. Departments handle internal operations (e.g., prayer team, sanctuary keepers), while outreaches cover external missions (e.g., prison outreach, community programs). Both work the same way in the system."
        action={{
          label: 'Create Department/Outreach',
          onClick: openCreateDialog,
          icon: <Plus className="w-4 h-4 mr-2" />
        }}
      />

      <div className="p-4 md:p-6">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading departments…</span>
          </div>
        ) : departments.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<Layers className="w-8 h-8" />}
                title="No departments or outreaches yet"
                description="Create your first department or outreach to start organizing your church. Departments manage internal operations, outreaches handle external missions — both work the same way."
                action={{
                  label: 'Create First Department/Outreach',
                  onClick: openCreateDialog
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept) => {
              const branch = church.type === 'multi' ? branches.find(b => b.id === dept.branchId) : null;
              const unitsCount = unitCounts[dept.id] || 0;

              return (
                <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg">{dept.name}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2">
                        <Badge variant={dept.type?.toLowerCase() === 'department' ? 'default' : 'secondary'}>
                            {dept.type}
                          </Badge>
                          {church.type === 'multi' && branch && (
                            <Badge variant="outline" className="text-xs">
                              {branch.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dept.description && (
                      <p className="text-sm text-gray-600">{dept.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Box className="w-4 h-4" />
                        <span>{unitsCount} units</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>0 members</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(dept)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={() => setDeleteId(dept.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDept ? 'Edit Department/Outreach' : 'Create Department/Outreach'}
            </DialogTitle>
            <DialogDescription>
              {editingDept
                ? 'Update the details for this department or outreach.'
                : 'Add a new department or outreach program to organize your church ministries.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                placeholder="e.g., Youth Ministry"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <RadioGroup value={type} onValueChange={(value: any) => setType(value)}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="department" id="dept-type" />
                    <Label htmlFor="dept-type" className="cursor-pointer">Department</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="outreach" id="outreach-type" />
                    <Label htmlFor="outreach-type" className="cursor-pointer">Outreach</Label>
                  </div>
                </div>
              </RadioGroup>
              <p className="text-xs text-gray-500">
                {type === 'department'
                  ? 'Departments handle internal church operations — e.g., prayer team, sanctuary keepers, choir.'
                  : 'Outreaches handle external missions — e.g., prison outreach, community feeding, street evangelism.'}
                {' '}Both function the same way in the system.
              </p>
            </div>

            {church.type === 'multi' && (
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of this department..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!name.trim() || (church.type === 'multi' && !selectedBranch) || saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingDept
                  ? 'Save Changes'
                  : `Create ${type === 'department' ? 'Department' : 'Outreach'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this department/outreach and all its units. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
