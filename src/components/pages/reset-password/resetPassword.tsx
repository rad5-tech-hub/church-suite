import React, { useState } from "react";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import { Link } from "react-router-dom";
import Api from "../../shared/api/api";

interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [formData, setFormData] = useState<ResetPasswordData>({
    password: "",
    confirmPassword: ""
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNotification(null);
  
    try {
      // 1. Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }
  
      // 2. Extract token from URL
      const queryParams = new URLSearchParams(window.location.search);
      const token = queryParams.get("token");
      if (!token) {
        throw new Error("Invalid reset link");
      }
  
      // 3. Call your API endpoint
      // (Assuming Api.post returns a Response-like object)
      const response = await Api.patch(`church/reset-password?token=${token}`, {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
  
      // 4. Check response and handle errors
      const data = response.data;
      if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error?.message || "Password reset failed");
      }
  
      // 5. Success: Show notification and clear form
      setNotification({
        type: "success",
        message: "Your password has been reset successfully!",
      });
      setFormData({
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      // 6. Error: Show error notification
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Password reset failed. Please try again.";
      setNotification({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Success Notification */}
      {notification?.type === 'success' && (
        <div className="fixed inset-0 bg-black opacity-[0.96] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg w-100 mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Password Reset Successful!</h3>
            <p className="mb-4 text-gray-600">{notification.message}</p>
            <p className="text-sm text-gray-600 mb-6">
              You can now login with your new password.
            </p>
            <Link
              to="/"
              className="w-full bg-[#111827] text-white rounded-full py-2 text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center"
            >
              Go to Login
            </Link>
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
        <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-9/12 py-8">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Reset Password</h1>
            <p className="text-lg lg:text-xl text-gray-300">
              Create a new password for your account
            </p>
          </div>
        </div>

        {/* Right Section - Reset Form */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            {/* New Password Input */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-base text-gray-700 font-medium mb-2 text-left"
              >
                New Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow relative">
                <SlLock className="text-gray-400 mr-3 text-xl" />
                <input
                  type={showPassword.password ? "text" : "password"}
                  id="password"
                  className="w-full text-base text-gray-800 focus:outline-none pr-10"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute right-4 cursor-pointer text-gray-400 text-xl"
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {showPassword.password ? <PiEye /> : <PiEyeClosed />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-base text-gray-700 font-medium mb-2 text-left"
              >
                Confirm Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow relative">
                <SlLock className="text-gray-400 mr-3 text-xl" />
                <input
                  type={showPassword.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  className="w-full text-base text-gray-800 focus:outline-none pr-10"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  className="absolute right-4 cursor-pointer text-gray-400 text-xl"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showPassword.confirmPassword ? <PiEye /> : <PiEyeClosed />}
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
                  <>
                    <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="mt-5 text-center">
              <span>Remember your password? </span>
              <Link to="/" className="underline">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;