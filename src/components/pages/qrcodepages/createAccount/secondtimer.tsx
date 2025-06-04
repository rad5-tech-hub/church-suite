import React, { useState } from "react";
import { IoPersonOutline, IoCallOutline, IoLocationOutline, IoSearchOutline } from "react-icons/io5";
import { FaTransgender } from "react-icons/fa";
import { BsCalendarDate } from "react-icons/bs";
import { Link } from "react-router-dom";

// Interfaces
interface SecondTimerFormProps {}

interface FormData {
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
const SecondTimerForm: React.FC<SecondTimerFormProps> = () => {
  const [hasRegisteredBefore, setHasRegisteredBefore] = useState<boolean | null>(null);
  const [formData, setFormData] = useState<FormData>({
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
        message: hasRegisteredBefore 
          ? 'Welcome back! Your details have been verified.' 
          : 'Thank you for registering with us!'
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Submission failed. Please try again.";
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle registration confirmation
  const handleRegistrationConfirmation = (hasRegistered: boolean) => {
    setHasRegisteredBefore(hasRegistered);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Registration Confirmation Dialog */}
      {hasRegisteredBefore === null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Welcome Back!</h3>
            <p className="mb-6 text-gray-600">
              Have you registered with us before?
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => handleRegistrationConfirmation(true)}
                className="w-full bg-[#111827] text-white rounded-full py-2 text-base font-semibold hover:bg-gray-800 transition duration-200"
              >
                Yes, I've registered before
              </button>
              <button
                onClick={() => handleRegistrationConfirmation(false)}
                className="w-full border border-[#111827] text-[#111827] rounded-full py-2 text-base font-semibold hover:bg-gray-100 transition duration-200"
              >
                No, I have not registered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {notification?.type === 'success' && (
        <div className="fixed inset-0 bg-black opacity-[0.96] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              {hasRegisteredBefore ? 'Verification Successful!' : 'Registration Complete!'}
            </h3>
            <p className="mb-4 text-gray-600">{notification.message}</p>
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

      {/* Main Form Content */}
      {hasRegisteredBefore !== null && (
        <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
          {/* Left Section - Background Image */}
          <LeftSection />

          {/* Right Section - Form */}
          {hasRegisteredBefore ? (
            <SearchForm
              handleSubmit={handleSubmit}
              handleChange={handleChange}
              formData={formData}
              isLoading={isLoading}
            />
          ) : (
            <FullRegistrationForm
              handleSubmit={handleSubmit}
              handleChange={handleChange}
              formData={formData}
              isLoading={isLoading}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Left Section Component with Background Image
const LeftSection: React.FC = () => (
  <div className="image-section flex-1 relative rounded-lg overflow-hidden min-h-[260px] lg:min-h-full">
    <div 
      className="absolute inset-0 bg-no-repeat bg-center lg:bg-fit bg-contain"
      style={{
        backgroundImage: "url('https://i.pinimg.com/736x/9c/10/a5/9c10a5de35e8026656533f06bd0dbb72.jpg')"
      }}
    ></div>
    <div className="absolute inset-0 bg-black opacity-20"></div>
  </div>
);

// Search Form Component (for those who have registered before)
interface FormProps {
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  formData: FormData;
  isLoading: boolean;
}

const SearchForm: React.FC<FormProps> = ({
  handleSubmit,
  handleChange,
  formData,
  isLoading,
}) => {
  return (
    <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
      <div className="pb-5">
        <h6 className="text-2xl lg:text-3xl font-bold mb-2">Welcome Back</h6>
        <p className="text-sm">
          Please verify your details
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
            <IoSearchOutline className="text-gray-400 mr-3 text-xl" />
            <input
              type="tel"
              id="phoneNo"
              className="w-full text-base text-gray-800 focus:outline-none"
              placeholder="Search with your phone number"
              required
              value={formData.phoneNo}
              onChange={handleChange}
            />
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
              <> <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Searching...
              </>
            ) : (
              'Search Records'
            )}
          </button>
        </div>

        {/* Help Link */}
        <div className="mt-5 text-center">
          <span>Need help? </span>
          <Link to="/contact" className="underline">
            Contact us
          </Link>
        </div>
      </form>
    </div>
  );
};

// Full Registration Form Component (for those who haven't registered before)
const FullRegistrationForm: React.FC<FormProps> = ({
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
        <h6 className="text-2xl lg:text-3xl font-bold mb-2">Second Timer Registration</h6>
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
              <> <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Submitting...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>

        {/* Help Link */}
        <div className="mt-5 text-center">
          <span>Need help? </span>
          <Link to="/contact" className="underline">
            Contact us
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SecondTimerForm;