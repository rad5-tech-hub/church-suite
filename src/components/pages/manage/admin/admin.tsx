import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
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
  confirmPassword: string;
  isSuperAdmin: boolean;
  branchId?: string;
}

interface Branch {
  id: string;
  name: string;
  location: string;
  address: string;
}

const Admin: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    isSuperAdmin: false,
    branchId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const navigate = useNavigate();

  // Fetch branches on mount
  useEffect(() => {
    const fetchBranches = async () => {
      setIsFetchingBranches(true);
      setBranchesError("");
      try {
        const response = await Api.get("/church/get-branches");
        setBranches(response.data.branches || []);
      } catch (error: any) {
        console.error("Error fetching branches:", error);
        setBranchesError("Failed to load branches. Please try again.");
      } finally {
        setIsFetchingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await Api.post("church/create-admin", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        isSuperAdmin: formData.isSuperAdmin || undefined,
        branchId: formData.branchId || undefined,
      });
      // Success - redirect to view admins
      navigate("/manage/view-admins");
    } catch (error: any) {
      console.error("Error creating admin:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardManager>
      <div className="lg:p-6 md:p-3 my-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Admins</h1>
            <p className="mt-4 text-gray-600">Create and manage Admins for your church.</p>
          </div>
          <button
            onClick={() => navigate("/manage/view-admins")}
            className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-sm font-semibold text-gray-100"
          >
            View Admins
          </button>
        </div>

        {/* Admin Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 lg:p-6 md:p-2 rounded-lg lg:shadow-md space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name */}
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

            {/* Email */}
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

            {/* Phone */}
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Admin Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <SlLock className="text-gray-400 mr-3 text-xl" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter Admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-3 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <PiEye /> : <PiEyeClosed />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Confirm Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <SlLock className="text-gray-400 mr-3 text-xl" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Confirm Admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="ml-3 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <PiEye /> : <PiEyeClosed />}
                </button>
              </div>
            </div>

            {/* Branch Selection */}
            <div>
              <label htmlFor="branchId" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Assign to Branch
              </label>
              <div className="relative">
                {isFetchingBranches ? (
                  <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                    <div className="inline-block h-5 w-5 border-2 mr-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading branches...</span>
                  </div>
                ) : (
                  <select
                    id="branchId"
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md text-base text-gray-800 focus:outline-none appearance-none bg-transparent"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>
                      Select a branch (optional)
                    </option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name} - {branch.address}
                      </option>
                    ))}
                  </select>
                )}
                {branchesError && (
                  <p className="mt-1 text-sm text-red-600">{branchesError}</p>
                )}
              </div>
            </div>

            {/* Super Admin Checkbox */}
            <div className="col-span-full">
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
          </div>

          {/* Submit Button */}
          <div className="pt-7">
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating Admin...
                </>
              ) : (
                "Create Admin"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Admin;
