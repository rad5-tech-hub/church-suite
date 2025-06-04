import React, { useState } from "react";
import DashboardManager from "../../../shared/dashboardManager";
import Api from "../../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { useNavigate } from "react-router-dom";

interface DepartmentFormData {
  name: string;
  type: 'department' | 'outreach';
  description: string;
}

const Department: React.FC = () => {
  const [formData, setFormData] = useState<DepartmentFormData>({ 
    name: "",
    type: 'department',
    description: ""
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const authData = useSelector((state: RootState) => state.auth?.authData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDepartment = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required.", { autoClose: 3000 });
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Description is required.", { autoClose: 3000 });
      return;
    }
  
    try {
      setLoading(true);
      const response = await Api.post(
        `/church/create-dept${authData?.branchId ? `/${authData.branchId}` : ''}`, 
        formData
      );
      if (response.data?.department) {
        setFormData({ 
          name: "",
          type: 'department',
          description: ""
        });
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
      setLoading(false);
    }
  };

  return (
    <DashboardManager>
      <div className="min-h-screen bg-gray-100 lg:p-6 md:p-3 my-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center my-4">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Department</h1>
            <p className="mt-4 text-gray-600 text-sm">
              Create and manage departments for {authData?.church_name}.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate("/manage/view-departments")}
              className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-sm font-semibold text-gray-100"
            >
              View Departments
            </button>
          </div>
        </div>

        {/* Department Input */}
        <div className="rounded-lg lg:shadow-md lg:p-6 md:p-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 space-y-4">     
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Department Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full text-base text-gray-800 focus:outline-none border border-gray-300 rounded-md px-4 py-3 shadow-sm"
                placeholder="Enter department name"
                disabled={loading}
              />
            </div>

            {/* Type Field */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full text-base text-gray-800 focus:outline-none border border-gray-300 rounded-md px-4 py-3 shadow-sm"
                disabled={loading}
              >
                <option value="Department">Department</option>
                <option value="Outreach">Outreach</option>
              </select>
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full text-base text-gray-800 focus:outline-none border border-gray-300 rounded-md px-4 py-3 shadow-sm"
              placeholder="Enter department description"
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-5">
            <button
              type="button"
              onClick={handleAddDepartment}
              disabled={loading}
              className="flex items-center justify-center bg-[#111827] text-white rounded-md px-6 py-3 hover:bg-gray-800 transition duration-200 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>                  
                  Create Department
                </>
              )}
            </button>
          </div>         
        </div>
      </div>
    </DashboardManager>
  );
};

export default Department;