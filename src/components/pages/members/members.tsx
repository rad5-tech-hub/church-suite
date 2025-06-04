import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsPerson, BsCalendar, BsGeoAlt, BsChevronDown } from "react-icons/bs";
import { IoCallOutline } from "react-icons/io5";
import DashboardManager from "../../shared/dashboardManager";
import Api from "../../shared/api/api";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "../../reduxstore/redux";

interface FormData {
  name: string;
  address: string;
  whatappNo: string;
  phoneNo: string;
  sex: string;
  maritalStatus: string;
  memberFor: number;
  ageRange: string;
  birthMonth: string;
  birthDay: string;
  state: string;
  LGA: string;
  nationality: string;
}

const MemberForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    address: "",
    whatappNo: "",
    phoneNo: "",
    sex: "",
    maritalStatus: "",
    memberFor: 0,
    ageRange: "",
    birthMonth: "",
    birthDay: "",
    state: "",
    LGA: "",
    nationality: "",
  });

  const [currentStep, setCurrentStep] = useState(1);
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

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!formData.name || !formData.address || !formData.phoneNo) {
        throw new Error("Please fill in all required fields");
      }

      const payload = {
        ...formData,
        churchId: authData?.churchId,
      };

      await Api.post("/members/create", payload);
      toast.success("Member created successfully!", { autoClose: 3000 });
      
      setFormData({
        name: "",
        address: "",
        whatappNo: "",
        phoneNo: "",
        sex: "",
        maritalStatus: "",
        memberFor: 0,
        ageRange: "",
        birthMonth: "",
        birthDay: "",
        state: "",
        LGA: "",
        nationality: "",
      });

    } catch (error: any) {
      console.error("Error creating member:", error);
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Failed to create member. Please try again.";
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    { name: "January", value: "01" },
    { name: "February", value: "02" },
    { name: "March", value: "03" },
    { name: "April", value: "04" },
    { name: "May", value: "05" },
    { name: "June", value: "06" },
    { name: "July", value: "07" },
    { name: "August", value: "08" },
    { name: "September", value: "09" },
    { name: "October", value: "10" },
    { name: "November", value: "11" },
    { name: "December", value: "12" },
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

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

        {/* Progress Steps */}
        <div className="flex items-center justify-center my-8">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 1 ? 'bg-[#111827] text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`w-24 h-1 ${currentStep === 2 ? 'bg-[#111827]' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep === 2 ? 'bg-[#111827] text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
        </div>

        {/* Member Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6 rounded-lg lg:p-6 md:p-2 shadow-sm"
        >
          {currentStep === 1 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Full Name
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                  <BsPerson className="mr-3 text-xl text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>

              {/* Address Input */}
              <div>
                <label
                  htmlFor="address"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Address
                </label>
                <div className="flex border border-gray-300 rounded-md px-4 py-3">
                  <BsGeoAlt className="mr-3 text-xl text-gray-400 mt-1" />
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none resize-y"
                    placeholder="Enter address"                  
                    required
                  />
                </div>
              </div>

              {/* WhatsApp Number Input */}
              <div>
                <label
                  htmlFor="whatappNo"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  WhatsApp Number
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                  <IoCallOutline className="mr-3 text-xl text-gray-400" />
                  <input
                    type="tel"
                    id="whatappNo"
                    name="whatappNo"
                    value={formData.whatappNo}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter WhatsApp number"
                  />
                </div>
              </div>

              {/* Phone Number Input */}
              <div>
                <label
                  htmlFor="phoneNo"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Phone Number
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                  <IoCallOutline className="mr-3 text-xl text-gray-400" />
                  <input
                    type="tel"
                    id="phoneNo"
                    name="phoneNo"
                    value={formData.phoneNo}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>

              {/* gender Select */}
              <div className="relative w-full">
                <label
                  htmlFor="sex"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Gender
                </label>
                <div className="relative flex items-center border border-gray-300 rounded-md pl-4">
                  <BsPerson className="text-xl text-gray-400" />
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-transparent"
                    required
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>                
                </div>
              </div>

              {/* Marital Status Select */}
              <div className="relative w-full">
                <label
                  htmlFor="maritalStatus"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Marital Status
                </label>
                <div className="relative flex items-center border border-gray-300 rounded-md pl-4 ">
                  <BsPerson className=" text-xl text-gray-400" />
                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-transparent"
                    required
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>Select marital status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>               
                </div>
              </div>

              {/* Member For Input */}
              <div>
                <label
                  htmlFor="memberFor"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Years Of Membership
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                  <BsPerson className="mr-3 text-xl text-gray-400" />
                  <input
                    type="number"
                    id="memberFor"
                    name="memberFor"
                    value={formData.memberFor}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter number of years"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Age Range Select */}
              <div className="relative w-full">
                <label
                  htmlFor="ageRange"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Age Range
                </label>
                <div className="relative flex items-center border border-gray-300 rounded-md pl-4">
                  <BsPerson className="text-xl text-gray-400" />
                  <select
                    id="ageRange"
                    name="ageRange"
                    value={formData.ageRange}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-transparent"
                    required
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>Select age range</option>
                    <option value="12-17">12-17</option>
                    <option value="18-26">18-26</option>
                    <option value="27-35">27-35</option>
                    <option value="36-45">36-45</option>
                    <option value="46+">46+</option>
                  </select>                  
                </div>
              </div>

              {/* Birth Month Select */}
              <div className="relative w-full">
                <label
                  htmlFor="birthMonth"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Birth Month
                </label>
                <div className="relative flex items-center border border-gray-300 rounded-md pl-4">
                  <BsCalendar className="text-xl text-gray-400" />
                  <select
                    id="birthMonth"
                    name="birthMonth"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-transparent"
                    required
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>Select birth month</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.name}
                      </option>
                    ))}
                  </select>                
                </div>
              </div>

              {/* Birth Day Select */}
              <div className="relative w-full">
                <label
                  htmlFor="birthDay"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Birth Day
                </label>
                <div className="relative flex items-center border border-gray-300 rounded-md pl-4">
                  <BsCalendar className="text-xl text-gray-400" />
                  <select
                    id="birthDay"
                    name="birthDay"
                    value={formData.birthDay}
                    onChange={handleChange}
                    className="w-full h-12 px-4 py-3 text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-transparent"
                    required
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="" disabled>Select day</option>
                    {days.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>            
                </div>
              </div>

              {/* State Input */}
              <div>
                <label
                  htmlFor="state"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  State
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                  <BsGeoAlt className="mr-3 text-xl text-gray-400" />
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter state"
                    required
                  />
                </div>
              </div>

              {/* LGA Input */}
              <div>
                <label
                  htmlFor="LGA"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  LGA
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                  <BsGeoAlt className="mr-3 text-xl text-gray-400" />
                  <input
                    type="text"
                    id="LGA"
                    name="LGA"
                    value={formData.LGA}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter local government area"
                    required
                  />
                </div>
              </div>

              {/* Nationality Input */}
              <div>
                <label
                  htmlFor="nationality"
                  className="block mb-2 text-base font-medium text-gray-700 text-left"
                >
                  Nationality
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 ">
                  <BsGeoAlt className="mr-3 text-xl text-gray-400" />
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter nationality"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="pt-6 flex justify-between">
            {currentStep === 2 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="h-12 px-6 bg-gray-300 text-gray-800 rounded-full text-base font-semibold hover:bg-gray-400 transition duration-200"
              >
                Previous
              </button>
            )}
            
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className={`h-12 px-6 bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50`}
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
            )}
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

export default MemberForm;