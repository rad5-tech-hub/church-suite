import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";
import { IoMailOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";

// Component Code
const Branch: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    email: "",
    phone: "",
  });

  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);
    // TODO: Implement actual form submission logic (e.g., API call)
  };

  return (
    <DashboardManager>
      <div className="lg:p-6 md:p-3 my-6">
        {/* Page Title and Navigation */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Branches</h1>
            <p className="mt-4 text-gray-600">
              Create and manage Branches  for your church.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate("/manage/view-branches")}
              className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-sm font-semibold text-gray-100"
            >
              View Branches
            </button>
          </div>
        </div>

        {/* Admin Form */}
        <form onSubmit={handleSubmit} className="mt-6 lg:p-6 md:p-2 rounded-lg lg:shadow-md space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Name of Branch
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <BsPerson className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter Branch name"
                  required
                />
              </div>
            </div>

            {/* location Input */}
            <div>
              <label htmlFor="text" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Branch Location
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoLocationOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter Branch location"
                  required
                />
              </div>
            </div>

            {/* location Input */}
            <div>
              <label htmlFor="text" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Branch Email
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoMailOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter Branch Email"
                  required
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-base text-gray-700 font-medium mb-2 text-left">
               Branch Phone No
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoCallOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter Branch phone number"
                  required
                />
              </div>
            </div>
          </div>


          {/* Submit Button */}
          <div className="pt-7">
            <button
              type="submit"
              className="h-12 w-full bg-[#111827] text-white rounded-md text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center"
            >
              Create Branch
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Branch;