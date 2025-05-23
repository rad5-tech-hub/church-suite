import React, { useState } from "react";
import { IoAdd, IoPencilOutline, IoTrashOutline, IoClose } from "react-icons/io5";
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
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const authData = useSelector((state: RootState) => state.auth?.authData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ name: value });
  };

  const handleAddDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required.", {      
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await Api.post("/church/create-dept", { name: formData.name });
      const newDepartment = response.data;
      setDepartments((prev) => [...prev, newDepartment]);
      setFormData({ name: "" });
      toast.success(
        `Department "${newDepartment.name}" created successfully!`,
        {
          autoClose: 3000, // Optional: Automatically close the toast after 3 seconds
        }
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to create department. Please try again.", {       
        autoClose: 3000,
      });
    }
  };

  const handleEditClick = (dept: Department) => {
    setEditingDepartment(dept);
    setEditName(dept.name);
  };

  const handleEditSubmit = async () => {
    if (!editName.trim() || !editingDepartment) {
      toast.error("Department name is required.", { autoClose: 3000 });
      return;
    }

    try {
      const response = await Api.put(`/church/update-dept/${editingDepartment.id}`, { 
        name: editName 
      });
      const updatedDepartment = response.data;
      
      setDepartments(departments.map(dept => 
        dept.id === updatedDepartment.id ? updatedDepartment : dept
      ));
      
      setEditingDepartment(null);
      toast.success("Department updated successfully!", { autoClose: 3000 });
    } catch (error) {
      console.error(error);
      toast.error("Failed to update department. Please try again.", { autoClose: 3000 });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      await Api.delete(`/church/delete-dept/${deletingId}`);
      setDepartments(departments.filter(dept => dept.id !== deletingId));
      setShowDeleteConfirm(false);
      toast.success("Department deleted successfully!", { autoClose: 3000 });
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete department. Please try again.", { autoClose: 3000 });
    } finally {
      setDeletingId(null);
    }
  };

  const defaultDepartments = [
    { id: "1", name: "Worship Team" },
    { id: "2", name: "Youth Ministry" },
    { id: "3", name: "Sunday School" },
    { id: "4", name: "Outreach Program" },
    { id: "5", name: "Prayer Group" },
  ];

  return (
    <DashboardManager>
      <div className="min-h-screen bg-gray-100 lg:p-6 md:p-3 my-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl  font-bold text-gray-800">Manage Departments</h1>
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
            />
            <button
              type="button"
              onClick={handleAddDepartment}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#111827] text-white rounded-md p-2 hover:bg-gray-800 transition duration-200"
              aria-label="Add department"
            >
              <IoAdd className="w-5 h-5" />
            </button>
          </div>

          <div className="flex justify-between items-center mt-10 mb-4">
            <h2 className="text-base font-semibold text-gray-800">All Departments</h2>
            <span className="text-sm text-gray-500">
              {defaultDepartments.length} departments
            </span>
          </div>
          
          <ul className="space-y-3">
            {defaultDepartments.map((dept) => (
              <li
                key={dept.id}
                className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded-md border border-gray-200 hover:bg-gray-50 transition duration-150"
              >
                <span className="font-medium text-base text-gray-800">{dept.name}</span>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => handleEditClick(dept)}
                    className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md bg-blue-100 transition duration-150"
                    aria-label="Edit department"
                  >
                    <IoPencilOutline className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(dept.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md bg-red-100 transition duration-150"
                    aria-label="Delete department"
                  >
                    <IoTrashOutline className="w-5 h-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Edit Department Modal */}
        {editingDepartment && (
          <div className="fixed inset-0 bg-black opacity-[0.76] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Edit Department</h3>
                <button 
                  onClick={() => setEditingDepartment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <IoClose className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-base text-gray-800 focus:outline-none border border-gray-300 rounded-md px-4 py-2 shadow-sm"
                />
              </div>
              
              <div className="flex justify-end space-x-3">             
                <button
                  onClick={handleEditSubmit}
                  className="px-4 py-2 bg-[#111827] text-white rounded-md hover:bg-gray-800 transition duration-150"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black opacity-[0.76] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Department</h3>
                <p className="text-gray-600">Are you sure you want to delete this department? This action cannot be undone.</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150"
                >
                  Delete
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