import React, { useState, useEffect } from "react";
import { IoAdd, IoPencilOutline, IoTrashOutline, IoClose, IoCheckmark } from "react-icons/io5";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";

interface DepartmentFormData {
  name: string;
}

interface Department {
  id: string;
  name: string;
}

const Department: React.FC = () => {
  const [formData, setFormData] = useState<DepartmentFormData>({ name: "" });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ add: boolean; edit: boolean; delete: boolean; fetch: boolean }>({
    add: false,
    edit: false,
    delete: false,
    fetch: false
  });
  const [error, setError] = useState<string | null>(null);
  const authData = useSelector((state: RootState) => state.auth?.authData);

  // Fetch departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(prev => ({...prev, fetch: true}));
      setError(null);
      try {
        const response = await Api.get(
          `/church/get-departments`
        );
        setDepartments(response.data.departments || []);
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        setError("Failed to load departments. Please try again later.");
        toast.error("Failed to load departments", { autoClose: 3000 });
      } finally {
        setLoading(prev => ({...prev, fetch: false}));
      }
    };

    fetchDepartments();
  }, [authData?.branchId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ name: value });
  };

  const handleAddDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required.", { autoClose: 3000 });
      return;
    }
  
    try {
      setLoading(prev => ({...prev, add: true}));
      const response = await Api.post(
        `/church/create-dept${authData?.branchId ? `/${authData.branchId}` : ''}`, 
        { name: formData.name }
      );
      if (response.data?.department) {
        setDepartments(prev => [...prev, response.data.department]);
        setFormData({ name: "" });
        toast.success(response.data.message || `Department "${response.data.department.name}" created successfully!`, {
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error("Department creation error:", error);
      toast.error("Failed to create department. Please try again.", {       
        autoClose: 3000,
      });
    } finally {
      setLoading(prev => ({...prev, add: false}));
    }
  };

  const handleEditClick = (dept: Department) => {
    setEditingId(dept.id);
    setEditName(dept.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleEditSubmit = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Department name is required.", { autoClose: 3000 });
      return;
    }

    try {
      setLoading(prev => ({...prev, edit: true}));
      const response = await Api.put(`/church/update-dept/${id}`, { 
        name: editName 
      });
      const updatedDepartment = response.data;
      
      setDepartments(departments.map(dept => 
        dept.id === updatedDepartment.id ? updatedDepartment : dept
      ));
      
      setEditingId(null);
      toast.success("Department updated successfully!", { autoClose: 3000 });
    } catch (error) {
      console.error("Department update error:", error);
      toast.error("Failed to update department. Please try again.", { autoClose: 3000 });
    } finally {
      setLoading(prev => ({...prev, edit: false}));
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      setLoading(prev => ({...prev, delete: true}));
      await Api.delete(`/church/delete-dept/${deletingId}`);
      setDepartments(departments.filter(dept => dept.id !== deletingId));
      setShowDeleteConfirm(false);
      toast.success("Department deleted successfully!", { autoClose: 3000 });
    } catch (error) {
      console.error("Department deletion error:", error);
      toast.error("Failed to delete department. Please try again.", { autoClose: 3000 });
    } finally {
      setLoading(prev => ({...prev, delete: false}));
      setDeletingId(null);
    }
  };

  return (
    <DashboardManager>
      <div className="min-h-screen bg-gray-100 lg:p-6 md:p-3 my-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Departments</h1>
          <p className="mt-4 text-gray-600 text-sm">
            Create and manage departments for {authData?.church_name}.
          </p>
        </div>

        {/* Department Input */}
        <div className="rounded-lg lg:shadow-md lg:p-6 md:p-2">
          <div className="relative">
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full text-base text-gray-800 focus:outline-none border border-gray-300 rounded-md px-4 py-3 pr-12 shadow-sm"
              placeholder="Add Department"
              disabled={loading.add}
            />
            <button
              type="button"
              onClick={handleAddDepartment}
              disabled={loading.add}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#111827] text-white rounded-md p-2 hover:bg-gray-800 transition duration-200 disabled:opacity-50"
              aria-label="Add department"
            >
              <IoAdd className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center mt-10 mb-4">
            <h2 className="text-base font-semibold text-gray-800">All Departments</h2>
            <span className="text-sm text-gray-500">
              {departments.length} department{departments.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Loading state */}
          {loading && !departments.length && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#111827]"></div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && departments.length === 0 && (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No departments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new department.
              </p>
            </div>
          )}

          {/* Departments list */}
          {!loading.edit && !error && departments.length > 0 && (
            <ul className="space-y-3">
              {departments.map((dept) => (
                <li
                  key={dept.id}
                  className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-50 transition duration-150"
                >
                  {editingId === dept.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-base text-gray-800 focus:outline-none border border-gray-300 rounded-md px-2 py-1 shadow-sm"
                      disabled={loading.edit}
                    />
                  ) : (
                    <span className="font-medium text-base text-gray-800">{dept.name}</span>
                  )}
                  
                  <div className="flex space-x-3">
                    {editingId === dept.id ? (
                      <>
                        <button 
                          onClick={() => handleEditSubmit(dept.id)}
                          disabled={loading.edit}
                          className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-md bg-green-100 transition duration-150 disabled:opacity-50"
                          aria-label="Save changes"
                        >
                          <IoCheckmark className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={handleCancelEdit}
                          disabled={loading.edit}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md bg-gray-100 transition duration-150 disabled:opacity-50"
                          aria-label="Cancel edit"
                        >
                          <IoClose className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEditClick(dept)}
                          disabled={loading.edit}
                          className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md bg-blue-100 transition duration-150 disabled:opacity-50"
                          aria-label="Edit department"
                        >
                          <IoPencilOutline className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(dept.id)}
                          disabled={loading.edit}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md bg-red-100 transition duration-150 disabled:opacity-50"
                          aria-label="Delete department"
                        >
                          <IoTrashOutline className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Department</h3>
                <p className="text-gray-600">Are you sure you want to delete this department? This action cannot be undone.</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={loading.delete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading.delete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardManager>
  );
};

export default Department;