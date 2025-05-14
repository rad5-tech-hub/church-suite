import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";

// Interface for form data
interface DepartmentFormData {
  name: string;
  description: string;
}

const Department: React.FC = () => {
  // State for form data
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: "",
  });

  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);
    // TODO: Implement actual form submission logic (e.g., API call)
  };

  return (
    <DashboardManager>
      <div className="min-h-screen bg-gray-100 lg:p-6 md:p-3">
        {/* Header Section */}
        <div className="flex flex-col justify-between lg:flex-row lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Departments</h1>
            <p className="mt-4 text-gray-600">
              Create and manage departments for your church.
            </p>
          </div>
          <div>
            <button
                onClick={() => navigate("/manage/view-departments")}
                className="px-5 py-2 font-semibold text-gray-100 bg-[#111827] rounded-sm border-none cursor-pointer hover:bg-[#232b3e]"
            >
                View Departments
            </button>
          </div>
        </div>

        {/* Department Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-lg shadow-md lg:p-6 md:p-2"
        >
          <div className="grid grid-cols-1 gap-6">
            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Department Name
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 shadow-sm">              
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter department name"
                  required
                />
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label
                htmlFor="description"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Description
              </label>
              <div className="flex border border-gray-300 rounded-md px-4 py-3 shadow-sm">                
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none resize-y"
                  placeholder="Enter department description"
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="flex items-center justify-center w-full h-12 text-base font-semibold text-white bg-[#111827] rounded-md hover:bg-gray-800 transition duration-200"
            >
              Create Department
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Department;