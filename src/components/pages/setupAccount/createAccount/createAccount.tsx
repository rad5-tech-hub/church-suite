import React, { useState } from "react";
import { IoCallOutline, IoMailOutline, IoPersonOutline } from "react-icons/io5";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import { useSelector } from "react-redux";
import { RootState } from "../../../reduxstore/redux";
import { clearChurchData } from "../../../reduxstore/datamanager";
import { useDispatch} from 'react-redux';

const CreateAccount: React.FC = () => {
  // State management
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    passwordMismatch: false,
    emailInvalid: false
  });

  // Redux state
  const churchData = useSelector((state: RootState) => state.church);

  // Form validation
  const validateForm = (password: string, confirmPassword: string, email: string): boolean => {
    const errors = {
      passwordMismatch: password !== confirmPassword,
      emailInvalid: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    };

    setFormErrors(errors);
    return !errors.passwordMismatch && !errors.emailInvalid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    // Get form values
    const password = (document.getElementById("password") as HTMLInputElement).value;
    const confirmPassword = (document.getElementById("confirm-password") as HTMLInputElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value;

    // Validate form
    if (!validateForm(password, confirmPassword, email)) {
      setLoading(false);
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("churchName", churchData.churchName || "");
    formData.append("address", churchData.churchLocation || "");  
    formData.append("phone", churchData.churchPhone || "");
    formData.append("email", churchData.churchEmail || "");
    formData.append("isHeadQuarter", churchData.isHeadquarter || "");    
    formData.append("name", (document.getElementById("full-name") as HTMLInputElement).value);
    formData.append("adminEmail", email);
    formData.append("adminPassword", password);
    
     // Use the actual files for logo and background image
    if (churchData.logoFile) {
      formData.append("logo", churchData.logoFile || null); // Append the File object
    }
    if (churchData.backgroundFile) {
      formData.append("backgroundImage", churchData.backgroundFile || null); // Append the File object
    }


    try {
      const response = await fetch(`https://church.bookbank.com.ng/church/create-church`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Failed to create account");
      }

      const responseData = await response.json();
      showSuccessMessage(responseData.email || email);

      // clear the store data
      dispatch(clearChurchData());
      // 2. Clear uncontrolled inputs (if any)
      (document.getElementById("full-name") as HTMLInputElement).value = "";
      (document.getElementById("email") as HTMLInputElement).value = "";
      (document.getElementById("phone") as HTMLInputElement).value = "";
      (document.getElementById("password") as HTMLInputElement).value = "";
      (document.getElementById("confirm-password") as HTMLInputElement).value = "";
    } catch (error) {
      console.error("Account creation error:", error);
      setNotification({
        message: error instanceof Error ? error.message : "An error occurred. Please try again.",
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const showSuccessMessage = (email: string) => {
    setNotification({
      message: `We sent a verification link to: ${email}`,
      type: 'success'
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Success Modal Overlay */}
      {notification?.type === 'success' && (
        <div className="fixed inset-0 bg-black opacity-[0.96] flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg max-w-md mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Account Created Successfully!</h3>
            <p className="mb-4 text-gray-600">{notification.message}</p>
            <p className="text-sm text-gray-600 mb-6">
              Please check your email and click the verification link to be verified.
            </p>
            <button
              className="w-full bg-[#111827] text-white rounded-full py-2 text-base font-semibold hover:bg-gray-800 transition duration-200"
              onClick={() => setNotification(null)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        {/* Left Section (Image) */}
        <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-10/12 py-8">
            <p className="mb-2 text-sm text-gray-200">Step 3 of 3</p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Create Account</h1>
            <p className="text-lg lg:text-xl text-gray-300">
              Kindly create an account to set up your church
            </p>
          </div>
        </div>

        {/* Right Section (Form) */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 flex flex-col justify-center">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-6">
              <label htmlFor="full-name" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Full Name
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoPersonOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="full-name"
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

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
                  className={`w-full text-base text-gray-800 focus:outline-none ${formErrors.emailInvalid ? 'border-red-500' : ''}`}
                  placeholder="Enter your email"
                  required
                />
              </div>
              {formErrors.emailInvalid && (
                <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Phone Number
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoCallOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="tel"
                  id="phone"
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-4">
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
                  minLength={8}
                />
                <div
                  className="absolute right-4 cursor-pointer text-gray-400 text-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <PiEye /> : <PiEyeClosed />}
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-2">
              <label htmlFor="confirm-password" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Confirm Password
              </label>
              <div className={`flex items-center border rounded-md px-4 py-3 input-shadow relative ${
                formErrors.passwordMismatch ? 'border-red-500' : 'border-gray-300'
              }`}>
                <SlLock className="text-gray-400 mr-3 text-xl" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  className="w-full text-base text-gray-800 focus:outline-none pr-10"
                  placeholder="Confirm your password"
                  required
                />
                <div
                  className="absolute right-4 cursor-pointer text-gray-400 text-xl"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <PiEye /> : <PiEyeClosed />}
                </div>
              </div>
              {formErrors.passwordMismatch && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>

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

            {/* Submit Button */}
            <div className="w-full gap-3 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="inline-block h-5 w-5 border-2 mr-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Creating...
                  </span>
                ) : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;