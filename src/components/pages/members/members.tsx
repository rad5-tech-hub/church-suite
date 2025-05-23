import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsPerson, BsCalendar, BsGeoAlt} from "react-icons/bs";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import DashboardManager from "../../shared/dashboardManager";
import Api from "../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";

interface MemberFormData {
  memberId: string;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  category: "first-timer" | "second-timer" | "member" | "";
}

const Member: React.FC = () => {
  const [formData, setFormData] = useState<MemberFormData>({
    memberId: "",
    firstname: "",
    lastname: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    address: "",
    category: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const authData = useSelector((state: RootState) => state.auth?.authData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.firstname || !formData.lastname || !formData.category) {
        throw new Error("Please fill in all required fields");
      }

      // Prepare the payload
      const payload = {
        ...formData,
        churchId: authData?.churchId, // Add churchId from Redux store
      };

      // Make API call
      await Api.post("/members/create", payload);

      // Handle success
      toast.success("Member created successfully!", { autoClose: 3000 });
      
      // Reset form
      setFormData({
        memberId: "",
        firstname: "",
        lastname: "",
        dateOfBirth: "",
        email: "",
        phone: "",
        address: "",
        category: "",
      });

      // Optionally navigate to view members
      // navigate("/manage/view-members");

    } catch (error: any) {
      console.error("Error creating member:", error);
      
      // Handle API errors
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Failed to create member. Please try again.";
      
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardManager>
      <div className="min-h-screen lg:p-6 md:p-3 my-6">
        {/* Header Section */}
        <div className="flex flex-col justify-between lg:flex-row lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Members</h1>
            <p className="mt-4 text-gray-600">
              Create and manage member records for your church.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate("/members/view-members")}
              className="px-5 py-2 font-semibold text-gray-100 bg-[#111827] rounded-sm border-none cursor-pointer hover:bg-[#232b3e]"
            >
              View Members
            </button>
          </div>
        </div>

        {/* Member Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-lg lg:p-6 md:p-2 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Firstname Input */}
            <div>
              <label
                htmlFor="firstname"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                First Name
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                <BsPerson className="mr-3 text-xl text-gray-400" />
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter first name"
                  required
                />
              </div>
            </div>

            {/* Lastname Input */}
            <div>
              <label
                htmlFor="lastname"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Last Name
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                <BsPerson className="mr-3 text-xl text-gray-400" />
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            {/* Date of Birth Input */}
            <div>
              <label
                htmlFor="dateOfBirth"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Date of Birth
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                <BsCalendar className="mr-3 text-xl text-gray-400" />
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Email
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                <IoMailOutline className="mr-3 text-xl text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label
                htmlFor="phone"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Phone Number
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                <IoCallOutline className="mr-3 text-xl text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Category Select */}            
            <div>
              <label
                htmlFor="category"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-transparent"
                  required
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                  }}
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="first-timer">First-Timer</option>
                  <option value="second-timer">Second-Timer</option>
                  <option value="member">Member</option>
                </select>
              </div>
            </div>

            {/* Address Textarea */}
            <div className="lg:col-span-2">
              <label
                htmlFor="address"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Address
              </label>
              <div className="flex border border-gray-300 rounded-md px-4 py-3">
                <BsGeoAlt className="mr-3 text-xl text-gray-400 mt-1" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none resize-y"
                  placeholder="Enter address"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
               disabled={isLoading}
               className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating Member...
                </>
              ) : (
                "Create Member"
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Member;