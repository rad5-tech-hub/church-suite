import React, { useState } from "react";
import { IoMailOutline } from "react-icons/io5";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import { Link } from "react-router-dom";
import { store } from "../../reduxstore/redux";
import { clearChurchData } from "../../reduxstore/datamanager";

// Interfaces
interface LoginFormProps {}

interface LoginData {
  email: string;
  password: string;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface ApiError {
  error: {
    message: string;
    code: number;
  };
  stack?: string;
}

// Main Component
const Login: React.FC<LoginFormProps> = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form data on component mount
  React.useEffect(() => {
    const handleRouteCleanup = () => {
      if (location.pathname === '/') {
        // Clear church setup data when on home page
        localStorage.removeItem('churchSetupData');
        store.dispatch(clearChurchData());
      }
    };
  
    handleRouteCleanup();
  
    // Optional: Add cleanup function if needed
    return () => {
      // Any cleanup logic if component unmounts
    };
  }, [location.pathname, clearChurchData]); // Include all dependencies

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const response = await fetch(
        "https://church.bookbank.com.ng/church/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle API error response
        const apiError = data as ApiError;
        throw new Error(apiError.error?.message || "Login failed");
      }

      setFormData({
        email: "",
        password: "",
      });
      // Show success modal instead of navigating
      setNotification({
        type: 'success',
        message: 'You have successfully logged in!'
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Success Modal Overlay */}
      {notification?.type === 'success' && (
        <div className="fixed inset-0 bg-black opacity-[0.96] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Login Successful!</h3>
            <p className="mb-4 text-gray-600">{notification.message}</p>
            <p className="text-sm text-gray-600 mb-6">
              Please check your email and click the verification link to Continue.
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
        <div className="fixed flex top-3 right-3 justify-between items-center bg-red-100 text-red-700 p-4 rounded-md shadow-lg z-50 w-100">
          <p>{notification.message}</p>
          <button 
            className="text-red-700"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 h-screen">
        {/* Left Section - Welcome Message */}
        <LeftSection />

        {/* Right Section - Login Form */}
        <RightSection
          handleSubmit={handleSubmit}
          showPassword={showPassword}
          togglePasswordVisibility={togglePasswordVisibility}
          handleChange={handleChange}
          formData={formData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

// Left Section Component
const LeftSection: React.FC = () => (
  <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
    <div className="lg:w-9/12 py-8">
      <h1 className="text-3xl lg:text-5xl font-bold mb-2">Log in</h1>
      <p className="text-lg lg:text-xl text-gray-300">
        Welcome, Kindly login to your account to continue with your church
      </p>
    </div>
  </div>
);

// Right Section Component
interface RightSectionProps {
  handleSubmit: (e: React.FormEvent) => void;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formData: LoginData;
  isLoading: boolean;
}

const RightSection: React.FC<RightSectionProps> = ({
  handleSubmit,
  showPassword,
  togglePasswordVisibility,
  handleChange,
  formData,
  isLoading,
}) => (
  <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
    <form className="flex flex-col" onSubmit={handleSubmit}>
      {/* Email Input */}
      <div className="mb-6">
        <label
          htmlFor="email"
          className="block text-base text-gray-700 font-medium mb-2 text-left"
        >
          Email
        </label>
        <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
          <IoMailOutline className="text-gray-400 mr-3 text-xl" />
          <input
            type="email"
            id="email"
            className="w-full text-base text-gray-800 focus:outline-none"
            placeholder="Enter your email"
            required
            value={formData.email}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="mb-6">
        <label
          htmlFor="password"
          className="block text-base text-gray-700 font-medium mb-2 text-left"
        >
          Password
        </label>
        <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow relative">
          <SlLock className="text-gray-400 mr-3 text-xl" />
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            className="w-full text-base text-gray-800 focus:outline-none pr-10"
            placeholder="Enter your password"
            required
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="button"
            aria-label="Toggle password visibility"
            className="absolute right-4 cursor-pointer text-gray-400 text-xl"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <PiEye /> : <PiEyeClosed />}
          </button>
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
           <> <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span> Loging in...</>
          ) : (
            "Log in"
          )}
        </button>
      </div>

      {/* Sign Up Link */}
      <div className="mt-5 text-center">
        <span>Don't have account? </span>
        <Link to="/setup-church" className="underline">
          Sign Up
        </Link>
      </div>
    </form>
  </div>
);

export default Login;