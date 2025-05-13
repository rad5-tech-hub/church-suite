import React, { useState } from "react";
import { IoMailOutline } from "react-icons/io5";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import { Link } from "react-router-dom";

// Interfaces
interface LoginFormProps {}

// Main Component
const Login: React.FC<LoginFormProps> = () => {
  const [showPassword, setShowPassword] = useState(false);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual submit logic
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 h-screen">
        {/* Left Section - Welcome Message */}
        <LeftSection />

        {/* Right Section - Login Form */}
        <RightSection
          handleSubmit={handleSubmit}
          showPassword={showPassword}
          togglePasswordVisibility={togglePasswordVisibility}
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
}

const RightSection: React.FC<RightSectionProps> = ({
  handleSubmit,
  showPassword,
  togglePasswordVisibility,
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
          className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center"
        >
          Continue
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