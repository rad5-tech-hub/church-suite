import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMailOutline, IoCallOutline } from "react-icons/io5"
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import { BsPerson } from "react-icons/bs";
import Api from "../../../shared/api/api";
import DashboardManager from "../../../shared/dashboardManager";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  isSuperAdmin: boolean;
}

const Admin: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    isSuperAdmin: false, // Default to false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await Api.post("/church/create-admin", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        isSuperAdmin: formData.isSuperAdmin || undefined, // Optional field
      });

      console.log("Admin created successfully");
      navigate("/manage/view-admins");
    } catch (error: any) {
      console.error("Error creating admin:", error.response?.data || error.message);
      alert("Failed to create admin. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardManager>
      <div className="lg:p-6 md:p-3 my-6">
        {/* Page Title and Navigation */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Admins</h1>
            <p className="mt-4 text-gray-600">
              Create and manage Admins for your church.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate("/manage/view-admins")}
              className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-sm font-semibold text-gray-100"
            >
              View Admins
            </button>
          </div>
        </div>

        {/* Admin Form */}
        <form onSubmit={handleSubmit} className="mt-6 lg:p-6 md:p-2 rounded-lg lg:shadow-md space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Admin Name
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
                  placeholder="Enter Admin name"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Admin Email
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
                  placeholder="Enter Admin email"
                  required
                />
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Admin Phone No
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
                  placeholder="Enter Admin phone number"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                {/* Lock Icon */}
                <SlLock className="text-gray-400 mr-3 text-xl" />

                {/* Password Input */}
                <input
                    type={showPassword ? "text" : "password"} // Toggle between text and password
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter Admin password"
                    required
                />

                {/* Eye Icon for Toggle */}
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} // Toggle password visibility
                    className="ml-3 focus:outline-none"
                >
                {showPassword ? <PiEye /> : <PiEyeClosed />}
                </button>
                </div>

            {/* Super Admin Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSuperAdmin"
                name="isSuperAdmin"
                checked={formData.isSuperAdmin}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="isSuperAdmin" className="text-base text-gray-700 font-medium">
                Is Super Admin
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-7">
            <button
              type="submit"
              disabled={isLoading}
               className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Admin;