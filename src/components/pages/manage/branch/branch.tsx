import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoMailOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import Api from "../../../shared/api/api";
import DashboardManager from "../../../shared/dashboardManager";

interface FormData {
  name: string;
  location: string;
  email: string;
  phone: string;
}

const Branch: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    location: "",
    email: "",
    phone: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await Api.post("/church/create-branch", {
        name: formData.name,
        address: formData.location || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      });

      navigate("/manage/view-branches");
    } catch (error: any) {
      console.error("Error creating branch:", error.response?.data || error.message);      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardManager>
      <div className="lg:p-6 md:p-3 my-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Branches</h1>
            <p className="mt-4 text-gray-600">
              Create and manage Branches for your church.
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

        <form onSubmit={handleSubmit} className="mt-6 lg:p-6 md:p-2 rounded-lg lg:shadow-md space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div>
              <label htmlFor="location" className="block text-base text-gray-700 font-medium mb-2 text-left">
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
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-base text-gray-700 font-medium mb-2 text-left">
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
                />
              </div>
            </div>

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
                />
              </div>
            </div>
          </div>

          <div className="pt-7">
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ?
                <>
                  <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating Branch...
                </> : "Create Branch"}
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default Branch;