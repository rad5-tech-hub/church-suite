import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
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
  Building2,
  Plus,
  Layers,
  Edit,
  Trash2,
  Eye,
  Users,
  Calendar,
  Star,
  MoreVertical,
  MapPin,
  AlertTriangle,
  Lock,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router';
import { useChurch } from '../context/ChurchContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Branch, Department, Member } from '../types';
import { fetchDepartments, fetchMembers, createBranch, editBranch, deleteBranchApi } from '../api';

type DialogMode = 'create' | 'edit' | 'view' | null;

export function Branches() {
  const { church, branches, addBranch, updateBranch, deleteBranch, isHeadQuarter, loadChurchFromServer } = useChurch();

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);

  const [saving, setSaving] = useState(false);

  // Form fields
  const [branchName, setBranchName] = useState('');

  // API data
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);



  // Load API data — fetch fresh branches first so IDs are real GUIDs from the server
  useEffect(() => {
    const load = async () => {
      try {
        // Refresh branches in context from the real API before loading anything else
        await loadChurchFromServer();
        const [deps, mems] = await Promise.all([fetchDepartments(), fetchMembers()]);
        setAllDepartments(deps as Department[]);
        setAllMembers(mems as Member[]);
      } catch (err) {
        console.error('Failed to load branch data:', err);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [church.id]);

  const { showToast } = useToast();

  // --- Handlers ---

  const openCreateDialog = () => {
    setBranchName('');
    setSelectedBranch(null);
    setDialogMode('create');
  };

  const openEditDialog = (branch: Branch) => {
    setBranchName(branch.name);
    setSelectedBranch(branch);
    setDialogMode('edit');
  };

  const openViewDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setDialogMode('view');
  };

  const openDeleteConfirm = (branch: Branch) => {
    setDeleteTarget(branch);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setSelectedBranch(null);
    setBranchName('');
  };

  const handleCreate = async () => {
    if (!branchName.trim()) return;
    setSaving(true);
    try {
      await createBranch({ name: branchName.trim() });
      // Refresh from server so branch IDs are real GUIDs
      await loadChurchFromServer();
      closeDialog();
      showToast(`"${branchName.trim()}" branch created successfully!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!branchName.trim() || !selectedBranch) return;
    setSaving(true);
    try {
      await editBranch(selectedBranch.id, { name: branchName.trim() });
      updateBranch(selectedBranch.id, { name: branchName.trim() });
      closeDialog();
      showToast(`"${branchName.trim()}" branch updated successfully!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    try {
      await deleteBranchApi(deleteTarget.id);
      deleteBranch(deleteTarget.id);
      setDeleteTarget(null);
      showToast(`"${name}" branch deleted successfully!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  // --- Helpers ---

  const getDepartmentsForBranch = (branchId: string) =>
    allDepartments.filter((d) => d.branchId === branchId);

  const getMembersForBranch = (branchId: string) =>
    allMembers.filter((m) => m.branchId === branchId);

  // If the church did not enable multi-branch, show a locked state
  if (!isHeadQuarter) {
    return (
      <Layout>
        <PageHeader
          title="Church Branches"
          description="Manage all your church locations."
        />
        <div className="p-4 md:p-6">
          <Card className="max-w-lg mx-auto mt-8">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Multi-Branch Not Enabled</h3>
                <p className="text-sm text-gray-500">
                  Your current plan does not include multi-branch support.
                  To create and manage multiple church locations, please upgrade to a plan that includes multi-branch.
                </p>
              </div>
              <Button asChild className="mt-2">
                <Link to="/subscription">View Subscription Plans</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Church Branches"
        description="Manage all your church locations. Each branch can have its own departments, units, and programs."
        action={{
          label: 'Add Branch',
          onClick: openCreateDialog,
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
      />

      <div className="p-4 md:p-6">
        {/* Summary Bar */}
        {branches.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
                  <p className="text-xs text-gray-500">Total Branches</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {branches.filter((b) => b.isHeadquarters).length}
                  </p>
                  <p className="text-xs text-gray-500">Headquarters</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Layers className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {branches.reduce(
                      (sum, b) => sum + getDepartmentsForBranch(b.id).length,
                      0
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Departments</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {branches.reduce(
                      (sum, b) => sum + getMembersForBranch(b.id).length,
                      0
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Branch Cards */}
        {branches.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={<Building2 className="w-8 h-8" />}
                title="No branches yet"
                description="Add your first branch to start organizing your multi-location church."
                action={{
                  label: 'Add First Branch',
                  onClick: openCreateDialog,
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => {
              const departments = getDepartmentsForBranch(branch.id);
              const members = getMembersForBranch(branch.id);

              return (
                <Card
                  key={branch.id}
                  className="hover:shadow-lg transition-shadow group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate">
                            {branch.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {branch.isHeadquarters && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Star className="w-3 h-3 mr-1" />
                                Headquarters
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Layers className="w-4 h-4 text-purple-500" />
                        <span>
                          <span className="font-semibold text-gray-900">{departments.length}</span>{' '}
                          dept{departments.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                        <Users className="w-4 h-4 text-green-500" />
                        <span>
                          <span className="font-semibold text-gray-900">{members.length}</span>{' '}
                          member{members.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Created {new Date(branch.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openViewDialog(branch)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(branch)}
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteConfirm(branch)}
                        disabled={branch.isHeadquarters}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                    {branch.isHeadquarters && (
                      <p className="text-xs text-gray-400 text-center">
                        Headquarters branch cannot be deleted
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== CREATE / EDIT DIALOG ==================== */}
      <Dialog
        open={dialogMode === 'create' || dialogMode === 'edit'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Add New Branch' : 'Edit Branch'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'create'
                ? 'Create a new church branch location. You can assign departments and members to it afterward.'
                : 'Update the details of this branch location.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch Name *</Label>
              <Input
                id="branch-name"
                placeholder="e.g., North Campus"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    dialogMode === 'create' ? handleCreate() : handleUpdate();
                  }
                }}
              />
              <p className="text-xs text-gray-500">
                Choose a name that clearly identifies this location to your team
              </p>
            </div>

            {/* Show HQ status info on edit */}
            {dialogMode === 'edit' && selectedBranch && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  Status:{' '}
                  {selectedBranch.isHeadquarters ? (
                    <Badge variant="outline" className="ml-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                      Headquarters
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-1">Branch</Badge>
                  )}
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!branchName.trim() || saving}
                onClick={dialogMode === 'create' ? handleCreate : handleUpdate}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {dialogMode === 'create' ? 'Adding...' : 'Saving...'}
                  </>
                ) : (
                  dialogMode === 'create' ? 'Add Branch' : 'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== VIEW DETAIL DIALOG ==================== */}
      <Dialog
        open={dialogMode === 'view'}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">{selectedBranch?.name}</DialogTitle>
                <DialogDescription>
                  Branch details and overview
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedBranch && (() => {
            const departments = getDepartmentsForBranch(selectedBranch.id);
            const members = getMembersForBranch(selectedBranch.id);

            return (
              <div className="space-y-5">
                {/* Status & Date */}
                <div className="flex flex-wrap gap-3">
                  {selectedBranch.isHeadquarters ? (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Star className="w-3 h-3 mr-1" />
                      Headquarters
                    </Badge>
                  ) : (
                    <Badge variant="outline">Branch</Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    Created{' '}
                    {new Date(selectedBranch.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Layers className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                    <p className="text-xs text-gray-600">Departments</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                    <p className="text-xs text-gray-600">Members</p>
                  </div>
                </div>

                {/* Departments List */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Departments ({departments.length})
                  </h4>
                  {departments.length === 0 ? (
                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
                      No departments assigned to this branch yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {departments.map((dept) => (
                        <div
                          key={dept.id}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {dept.name}
                            </span>
                          </div>
                          <Badge
                            variant={dept.type === 'department' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {dept.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Members Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Members ({members.length})
                  </h4>
                  {members.length === 0 ? (
                    <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center">
                      No members assigned to this branch yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {members.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                            {member.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {member.fullName}
                            </p>
                            {member.email && (
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {members.length > 5 && (
                        <p className="text-xs text-gray-500 text-center pt-1">
                          +{members.length - 5} more member{members.length - 5 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      closeDialog();
                      openEditDialog(selectedBranch);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Branch
                  </Button>
                  {!selectedBranch.isHeadquarters && (
                    <Button
                      variant="outline"
                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        closeDialog();
                        openDeleteConfirm(selectedBranch);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Branch
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ==================== DELETE CONFIRMATION ==================== */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Branch
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900">"{deleteTarget?.name}"</span>?
              </span>
              {deleteTarget && getDepartmentsForBranch(deleteTarget.id).length > 0 && (
                <span className="block bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
                  <strong>Warning:</strong> This branch has{' '}
                  {getDepartmentsForBranch(deleteTarget.id).length} department(s) assigned to it.
                  You may want to reassign them before deleting.
                </span>
              )}
              <span className="block text-sm">
                This action cannot be undone. All branch-specific data will be permanently removed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Layout>
  );
}