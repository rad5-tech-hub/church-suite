import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsPerson, BsCalendar, BsGeoAlt, BsCardText } from "react-icons/bs";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import DashboardManager from "../../shared/dashboardManager";

// Interface for form data
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
  // State for form data
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

  const navigate = useNavigate();

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
      <div className="min-h-screen bg-gray-100 lg:p-6 md:p-3 my-6">
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
              onClick={() => navigate("/manage/view-members")}
              className="px-5 py-2 font-semibold text-gray-100 bg-[#111827] rounded-sm border-none cursor-pointer hover:bg-[#232b3e]"
            >
              View Members
            </button>
          </div>
        </div>

        {/* Member Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-lg lg:p-6 md:p-2"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Member ID Input */}
            <div>
              <label
                htmlFor="memberId"
                className="block mb-2 text-base font-medium text-gray-700 text-left"
              >
                Member ID
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                <BsCardText className="mr-3 text-xl text-gray-400" />
                <input
                  type="text"
                  id="memberId"
                  name="memberId"
                  value={formData.memberId}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter member ID"
                  required
                />
              </div>
            </div>

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
                  required
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
                  required
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
                  required
                />
              </div>
            </div>

            {/* Category Select */}            
            <div className="lg:col-span-2 mb-6">
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
              Create Member
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Member;
