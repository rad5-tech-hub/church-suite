import React, { useState } from "react";
import { IoPersonOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { FaTransgender } from "react-icons/fa";
import { BsCalendarDate } from "react-icons/bs";
import { Link } from "react-router-dom";

// Interfaces
interface FirstTimerFormProps {}

interface FirstTimerData {
  fullName: string;
  phoneNo: string;
  gender: string;
  address: string;
  birthDay: string;
  birthMonth: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

// interface ApiError {
//   error: {
//     message: string;
//     code: number;
//   };
//   stack?: string;
// }

// Main Component
const FirstTimerForm: React.FC<FirstTimerFormProps> = () => {
  const [formData, setFormData] = useState<FirstTimerData>({
    fullName: "",
    phoneNo: "",
    gender: "",
    address: "",
    birthDay: "",
    birthMonth: ""
  });
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFormData({
        fullName: "",
        phoneNo: "",
        gender: "",
        address: "",
        birthDay: "",
        birthMonth: ""
      });
      
      setNotification({
        type: 'success',
        message: 'Thank you for registering as a first-timer!'
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Success Modal Overlay */}
      {notification?.type === 'success' && (
        <div className="fixed inset-0 bg-black opacity-[0.96] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Registration Successful!</h3>
            <p className="mb-4 text-gray-600">{notification.message}</p>
            <p className="text-sm text-gray-600 mb-6">
              We're excited to have you with us. Our team will reach out to you shortly.
            </p>
            <button
              onClick={() => setNotification(null)}
              className="w-full bg-[#111827] text-white rounded-full py-2 text-base font-semibold hover:bg-gray-800 transition duration-200"              
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {notification?.type === 'error' && (
        <div className="fixed top-3 right-3 flex justify-between items-center bg-red-100 text-red-700 p-4 rounded-md shadow-lg z-50 max-w-md">
          <p>{notification.message}</p>
          <button 
            className="text-red-700 ml-4"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        {/* Left Section - Welcome Message */}
        <LeftSection />

        {/* Right Section - Form */}
        <RightSection
          handleSubmit={handleSubmit}
          handleChange={handleChange}
          formData={formData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

// Left Section Component with Background Image
// Left Section Component with Full Background Image
const LeftSection: React.FC = () => (
    <div 
      className="image-section flex-1 relative rounded-lg overflow-hidden"
    >
      {/* Background Image - covers entire space */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-center lg:bg-cover bg-contain"
        style={{
          backgroundImage: "url('https://i.pinimg.com/736x/9c/10/a5/9c10a5de35e8026656533f06bd0dbb72.jpg')"
        }}
      ></div>
      
      {/* Dark overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      {/* Content container with padding */}
      <div className="relative z-10 min-h-[200px] flex flex-col justify-center">
        {/* <div className="lg:w-9/12 py-8">
        <h1 className="text-3xl lg:text-5xl font-bold mb-2">First Timer</h1>
        <p className="text-lg lg:text-xl text-gray-100">
            Welcome to our church! We're excited to get to know you better.
        </p>
        </div> */}
      </div>
    </div>
);

// Right Section Component
interface RightSectionProps {
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  formData: FirstTimerData;
  isLoading: boolean;
}

const RightSection: React.FC<RightSectionProps> = ({
  handleSubmit,
  handleChange,
  formData,
  isLoading,
}) => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const days = Array.from({length: 31}, (_, i) => (i + 1).toString());

  return (
    <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
        <div className="pb-5">
          <h6 className="text-2xl lg:text-3xl font-bold mb-2">First Timer Registration</h6>
          <p className="text-sm">
            Welcome to our church! We're excited to get to know you better.
          </p>
        </div>
      <form className="flex flex-col" onSubmit={handleSubmit}>
        {/* Full Name Input */}
        <div className="mb-6">
          <label htmlFor="fullName" className="block text-base text-gray-700 font-medium mb-2 text-left">
            Full Name
          </label>
          <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
            <IoPersonOutline className="text-gray-400 mr-3 text-xl" />
            <input
              type="text"
              id="fullName"
              className="w-full text-base text-gray-800 focus:outline-none"
              placeholder="Enter your full name"
              required
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Phone Number Input */}
        <div className="mb-6">
          <label htmlFor="phoneNo" className="block text-base text-gray-700 font-medium mb-2 text-left">
            Phone Number
          </label>
          <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
            <IoCallOutline className="text-gray-400 mr-3 text-xl" />
            <input
              type="tel"
              id="phoneNo"
              className="w-full text-base text-gray-800 focus:outline-none"
              placeholder="Enter your phone number"
              required
              value={formData.phoneNo}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Gender Input */}
        <div className="mb-6">
          <label htmlFor="gender" className="block text-base text-gray-700 font-medium mb-2 text-left">
            Gender
          </label>
          <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
            <FaTransgender className="text-gray-400 mr-3 text-xl" />
            <select
              id="gender"
              className="w-full text-base text-gray-800 focus:outline-none bg-transparent"
              required
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="" disabled>Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Address Input */}
        <div className="mb-6">
          <label htmlFor="address" className="block text-base text-gray-700 font-medium mb-2 text-left">
            Address
          </label>
          <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
            <IoLocationOutline className="text-gray-400 mr-3 text-xl" />
            <input
              type="text"
              id="address"
              className="w-full text-base text-gray-800 focus:outline-none"
              placeholder="Enter your address"
              required
              value={formData.address}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Date of Birth */}
        <div className="mb-6 grid lg:grid-cols-2 grid-cols-1 gap-4">
          <div>
            <label htmlFor="birthMonth" className="block text-base text-gray-700 font-medium mb-2 text-left">
              Month of Birth
            </label>
            <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
              <BsCalendarDate className="text-gray-400 mr-3 text-xl" />
              <select
                id="birthMonth"
                className="w-full text-base text-gray-800 focus:outline-none bg-transparent"
                required
                value={formData.birthMonth}
                onChange={handleChange}
              >
                <option value="" disabled>Select Month</option>
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="birthDay" className="block text-base text-gray-700 font-medium mb-2 text-left">
              Day of Birth
            </label>
            <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
              <BsCalendarDate className="text-gray-400 mr-3 text-xl" />
              <select
                id="birthDay"
                className="w-full text-base text-gray-800 focus:outline-none bg-transparent"
                required
                value={formData.birthDay}
                onChange={handleChange}
              >
                <option value="" disabled>Select Day</option>
                {days.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="w-full gap-3 pt-5">
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
          >
            {isLoading ? (
              <> <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span> Submitting...</>
            ) : (
              "Submit"
            )}
          </button>
        </div>

        {/* Login Link */}
        <div className="mt-5 text-center">
          <span>Already a member? </span>
          <Link to="/login" className="underline">
            Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default FirstTimerForm;