import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { RiLockPasswordLine } from "react-icons/ri";

const Admin: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    isSuperAdmin: false,
  });

  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);
    // Add your form submission logic here
  };

  return (
    <DashboardManager>
      <div className="lg:p-6 md:p-3 bg-gray-100 min-h-screen">
        {/* Page Title */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Admins</h1>
            <p className="mt-4 text-gray-600">
                Create and manage admin accounts for your church.
            </p>
            </div>
            <div>
            <button
                onClick={() => navigate("/manage-church/view-admin")}
                className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-sm font-semibold text-gray-100"
            >
                View All
            </button>
            </div>
        </div>

        {/* Admin Form */}
        <form onSubmit={handleSubmit} className="mt-6  lg:p-6 md:p-2 rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Name
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
                  placeholder="Enter admin name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Email
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
                  placeholder="Enter admin email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <RiLockPasswordLine className="text-gray-400 mr-3 text-xl" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter admin password"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Phone
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
                  placeholder="Enter admin phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* isSuperAdmin */}
          <div className="mb-6">
            <label htmlFor="isSuperAdmin" className="block text-base text-gray-700 font-medium mb-4 text-left">
              Is Super Admin
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSuperAdmin"
                name="isSuperAdmin"
                checked={formData.isSuperAdmin}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isSuperAdmin" className="ml-2 block text-sm text-gray-700">
                Yes
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="h-12 w-full bg-[#111827] text-white rounded-md text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center"
            >
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Admin;