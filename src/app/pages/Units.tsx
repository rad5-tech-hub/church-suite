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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Box, Plus, Edit, Trash2, Users, Layers, Building2, Loader2 } from 'lucide-react';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { Unit, Department } from '../types';
import { useToast } from '../context/ToastContext';
import { fetchDepartments, fetchUnits, createUnits, editUnit, deleteUnit, softDeleteUnit } from '../api';

export function Units() {
  const { church, branches } = useChurch();
  const { currentAdmin } = useAuth();
  const { showToast } = useToast();
  const defaultBranchId = currentAdmin?.branchId || currentAdmin?.branchIds?.[0] || branches[0]?.id || '';

  // Fallback admin for when auth context hasn't loaded
  const effectiveAdmin = currentAdmin || { level: 'church' as const, departmentId: undefined, unitId: undefined };

  // Data state
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Role-based access
  const adminLevel = effectiveAdmin.level;
  const canCreateUnit = adminLevel !== 'unit';
  const isDepartmentAdmin = adminLevel === 'department';

  // Load data from backend
  const loadData = useCallback(async () => {
    if (!defaultBranchId) return;
    setLoading(true);
    try {
      const branchId = defaultBranchId;
      const [deptsResult, unitsResult] = await Promise.allSettled([fetchDepartments(branchId), fetchUnits(branchId)]);
      setDepartments((deptsResult.status === 'fulfilled' ? deptsResult.value : []) as unknown as Department[]);
      setUnits((unitsResult.status === 'fulfilled' ? unitsResult.value : []) as unknown as Unit[]);
    } catch (err) {
      console.error('Failed to load units data:', err);
    } finally {
      setLoading(false);
    }
  }, [defaultBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);



  // For department admins, lock to their department
  const adminDepartment = isDepartmentAdmin
    ? departments.find(d => d.id === effectiveAdmin.departmentId)
    : null;

  // Filter departments based on selected branch
  const filteredDepartments = useMemo(() => {
    if (isDepartmentAdmin && adminDepartment) {
      return [adminDepartment];
    }
    if (church.type === 'single') {
      const singleBranchId = branches[0]?.id;
      return singleBranchId ? departments.filter(d => d.branchId === singleBranchId) : departments;
    }
    if (selectedBranch) {
      return departments.filter(d => d.branchId === selectedBranch);
    }
    return departments;
  }, [church, selectedBranch, isDepartmentAdmin, adminDepartment, departments]);

  // Helper: get department for a unit
  const getDepartment = (departmentId: string) =>
    departments.find(d => d.id === departmentId);

  // Helper: get branch for a department
  const getBranch = (departmentId: string) => {
    const dept = getDepartment(departmentId);
    if (!dept) return null;
    if (church.type === 'single') return null;
    return branches.find(b => b.id === dept.branchId);
  };

  // Visible units based on admin scope
  const visibleUnits = useMemo(() => {
    if (adminLevel === 'unit') {
      return units.filter(u => u.id === effectiveAdmin.unitId);
    }
    if (isDepartmentAdmin && effectiveAdmin.departmentId) {
      return units.filter(u => u.departmentId === effectiveAdmin.departmentId);
    }
    return units;
  }, [units, adminLevel, isDepartmentAdmin, effectiveAdmin.departmentId, effectiveAdmin.unitId]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedBranch('');
    setSelectedDepartment('');
  };

  const openCreateDialog = () => {
    resetForm();
    if (isDepartmentAdmin && adminDepartment) {
      setSelectedDepartment(adminDepartment.id);
      if (church.type === 'multi') {
        setSelectedBranch(adminDepartment.branchId ?? '');
      }
    }
    setEditingUnit(null);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setName(unit.name);
    setDescription(unit.description || '');
    setSelectedDepartment(unit.departmentId);
    const dept = getDepartment(unit.departmentId);
    if (dept && church.type === 'multi') {
      setSelectedBranch(dept.branchId ?? '');
    }
    setIsCreateDialogOpen(true);
  };

  const handleSave = async () => {
    const departmentId = isDepartmentAdmin && adminDepartment
      ? adminDepartment.id
      : selectedDepartment;

    if (!name.trim() || !departmentId) return;

    setSaving(true);
    try {
      if (editingUnit) {
        await editUnit(editingUnit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        showToast('Unit updated successfully.');
      } else {
        const dept = departments.find(d => d.id === departmentId);
        const branchId = dept?.branchId || defaultBranchId;
        if (!branchId) {
          showToast('No branch found for this unit. Please refresh and try again.', 'error');
          return;
        }
        await createUnits({
          branchId,
          departmentId,
          units: [{ name: name.trim(), description: description.trim() || undefined }],
        });
        showToast('Unit created successfully.');
      }
      setIsCreateDialogOpen(false);
      resetForm();
      setEditingUnit(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to save unit:', err);
      const message = err?.body?.message || err?.message || 'Failed to save unit. Please try again.';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      const unit = units.find((item) => item.id === deleteId);
      const department = unit ? getDepartment(unit.departmentId) : null;
      const branchId = department?.branchId || defaultBranchId;
      if (!branchId) {
        showToast('No branch found for this unit. Please refresh and try again.', 'error');
        return;
      }
      await deleteUnit(deleteId, branchId);
      setDeleteId(null);
      showToast('Unit deleted successfully.');
      await loadData();
    } catch (err: any) {
      console.error('Failed to delete unit:', err);
      const message = err?.body?.message || err?.message || 'Failed to delete unit. Please try again.';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    if (!name.trim()) return false;
    if (isDepartmentAdmin && adminDepartment) return true;
    if (!selectedDepartment) return false;
    if (church.type === 'multi' && !selectedBranch) return false;
    return true;
  };

  return (
    <Layout>
      <PageHeader
        title="Units"
        description="Manage units within your departments and outreaches. Units are smaller groups that handle specific tasks  for example, the Worship Team department might have Singers, Instrumentalists, and Sound units."
        action={
          canCreateUnit
            ? {
                label: 'Create Unit',
                onClick: openCreateDialog,
                icon: <Plus className="w-4 h-4 mr-2" />,
              }
            : undefined
        }
      />

      <div className="p-4 md:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-500">Loading units</span>
          </div>
        ) : visibleUnits.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<Box className="w-8 h-8" />}
                title="No units yet"
                description={
                  canCreateUnit
                    ? 'Create your first unit to start organizing smaller groups within your departments and outreaches.'
                    : 'No units have been assigned to you yet. Contact your department admin for more information.'
                }
                action={
                  canCreateUnit
                    ? {
                        label: 'Create First Unit',
                        onClick: openCreateDialog,
                      }
                    : undefined
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleUnits.map((unit) => {
              const department = getDepartment(unit.departmentId);
              const branch = getBranch(unit.departmentId);

              return (
                <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Box className="w-5 h-5 text-purple-600" />
                          <CardTitle className="text-lg">{unit.name}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {department && (
                            <Badge variant={department.type === 'department' ? 'default' : 'secondary'}>
                              <Layers className="w-3 h-3 mr-1" />
                              {department.name}
                            </Badge>
                          )}
                          {church.type === 'multi' && branch && (
                            <Badge variant="outline" className="text-xs">
                              <Building2 className="w-3 h-3 mr-1" />
                              {branch.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {unit.description && (
                      <p className="text-sm text-gray-600">{unit.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>0 members</span>
                      </div>
                    </div>

                    {canCreateUnit && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditDialog(unit)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700"
                          onClick={() => setDeleteId(unit.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingUnit(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Create Unit'}</DialogTitle>
            <DialogDescription>
              {editingUnit
                ? 'Update the details for this unit.'
                : 'Add a new unit to organize a smaller group within a department or outreach.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Unit Name *</Label>
              <Input
                placeholder="e.g., Youth Choir, Sound Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {church.type === 'multi' && !isDepartmentAdmin && (
              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={(value) => {
                    setSelectedBranch(value);
                    setSelectedDepartment('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isDepartmentAdmin && adminDepartment ? (
              <div className="space-y-2">
                <Label>Department/Outreach</Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-md">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{adminDepartment.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {adminDepartment.type}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  As a department admin, units are created under your assigned department.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Department/Outreach *</Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                  disabled={church.type === 'multi' && !selectedBranch}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        church.type === 'multi' && !selectedBranch
                          ? 'Select a branch first'
                          : 'Select department or outreach'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <span className="flex items-center gap-2">
                          {dept.name}
                          <Badge variant="outline" className="text-xs ml-1">
                            {dept.type}
                          </Badge>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {church.type === 'multi' && !selectedBranch && (
                  <p className="text-xs text-gray-500">
                    Choose a branch first to see its departments and outreaches.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of what this unit does..."
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
                  setIsCreateDialogOpen(false);
                  setEditingUnit(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!isFormValid() || saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingUnit ? 'Save Changes' : 'Create Unit'}
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
              This will permanently delete this unit and remove all its members. This action cannot be undone.
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
