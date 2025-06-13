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
  type: 'login-success' | 'login-error' | 'reset-success' | 'reset-error';
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
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  // Reset form data on component mount
  React.useEffect(() => {
    const handleRouteCleanup = () => {
      if (location.pathname === '/') {
        localStorage.removeItem('churchSetupData');
        store.dispatch(clearChurchData());
      }
    };
  
    handleRouteCleanup();
  
    return () => {
      // Cleanup logic
    };
  }, [location.pathname, clearChurchData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);
    setIsLoading(true);

    try {
      const response = await fetch(
       `${import.meta.env.VITE_API_BASE_URL}/church/login`,
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
        const apiError = data as ApiError;
        throw new Error(apiError.error?.message || "Login failed");
      }

      setFormData({
        email: "",
        password: "",
      });
      setNotification({
        type: 'login-success',
        message: 'You have successfully logged in!'
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setNotification({
        type: 'login-error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}church/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: forgotPasswordEmail }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const apiError = data as ApiError;
        throw new Error(apiError.error?.message || "Failed to send reset link");
      }

      setNotification({
        type: 'reset-success',
        message: 'Password reset link has been sent to your email!'
      });
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send reset link. Please try again.";
      setNotification({
        type: 'reset-error',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Login Success Modal */}
      {notification?.type === 'login-success' && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h3>
              <p className="text-gray-600">{notification.message} Check your <b>Email</b> to continue with the verification Link.</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="w-full bg-[#111827] text-white rounded-lg py-3 text-base font-semibold hover:bg-gray-800 transition duration-200"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      {/* Reset Success Notification */}
      {notification?.type === 'reset-success' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg border-l-4 border-green-500 max-w-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-800">Check your email to continue</h3>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Error Notification */}
      {notification?.type === 'login-error' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-50 p-4 rounded-md shadow-lg border-l-4 border-red-500 max-w-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg p-1.5 hover:bg-red-100"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Error Notification */}
      {notification?.type === 'reset-error' && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500 max-w-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-800">Something went wrong</h3>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Reset Password</h3>
              <button 
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-4 text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label htmlFor="forgotEmail" className="block text-gray-700 mb-2 font-medium">
                  Email Address
                </label>
                <div className="flex items-center border border-gray-300 rounded-md px-4 py-3">
                  <IoMailOutline className="text-gray-400 mr-3 text-xl" />
                  <input
                    type="email"
                    id="forgotEmail"
                    className="w-full text-base text-gray-800 focus:outline-none"
                    placeholder="Enter your email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#111827] text-white rounded-md hover:bg-gray-800 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
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
          onForgotPasswordClick={() => setShowForgotPasswordModal(true)}
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
  onForgotPasswordClick: () => void;
}

const RightSection: React.FC<RightSectionProps> = ({
  handleSubmit,
  showPassword,
  togglePasswordVisibility,
  handleChange,
  formData,
  isLoading,
  onForgotPasswordClick,
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
      <div className="mb-4">
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

      {/* Forgot Password Link */}
      <div className="mb-6 text-right">
        <button
          type="button"
          onClick={onForgotPasswordClick}
          className="text-sm text-[#111827] hover:underline font-medium"
        >
          Forgot Password?
        </button>
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
        <Link to="/setup-church" className="underline font-medium">
          Sign Up
        </Link>
      </div>
    </form>
  </div>
);

export default Login;