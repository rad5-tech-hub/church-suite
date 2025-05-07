import React, { useState } from "react";
import { IoMailOutline} from "react-icons/io5";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { Link } from "react-router-dom";
import { SlLock } from "react-icons/sl";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);  
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full  p-4 md:p-6 h-screen">
        {/* Left Section (Image) */}
        <div className="image-section bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-9/12 py-8">            
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Log in</h1>
            <p className="text-lg lg:text-xl text-gray-300">Welcome, Kindly login to your account to continue with your church</p>
          </div>
        </div>

        {/* Right Section (Form) */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10  justify-center flex flex-col">
          {/* Logo */}
          {/* <div className="flex justify-end mb-8">
            <img src="/assets/logo.svg" alt="Much-Learn Logo" className="h-8 md:h-10" />
          </div> */}

          {/* Form */}
          <form className="flex flex-col">
            {/* Email */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-base text-gray-700 font-medium mb-2 text-left">
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


            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-base text-gray-700 font-medium mb-2 text-left">
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
                <div
                  className="absolute right-4 cursor-pointer text-gray-400 text-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <PiEye /> : <PiEyeClosed />}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="w-full gap-3 pt-5">
              <button
                type="submit"
                className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center"
              >
                Continue
              </button>
            </div>
            <div className="mt-5 text-center"><span>Don't have account?</span> <Link  to="/setup-church" className="underline">Sign Up</Link></div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;