import React, { useState} from "react";
import { IoCallOutline, IoMailOutline, IoPersonOutline } from "react-icons/io5";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import { clearChurchData } from "../../../reduxstore/datamanager";
import { store } from "../../../reduxstore/redux";
import { RootState } from '../../../reduxstore/redux';
import { useSelector } from 'react-redux';


interface ChurchData {
  churchName?: string;
  churchLocation?: string;
  churchPhone?: string;
  churchEmail?: string;
  isHeadquarter?: boolean;
  logoPreview?: string | null;
  backgroundPreview?: string | null;
}

const CreateAccount: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    passwordMismatch: false,
    emailInvalid: false
  });
  const churchData = useSelector((state: RootState) => state.church);

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
  
    try {
      // 1. Get form values
      const form = e.currentTarget as HTMLFormElement;
      const { password, confirmPassword, email, fullName, phone } = getFormValues(form);
  
      // 2. Validate form inputs
      if (!validateForm(password, confirmPassword, email)) {
        return;
      }
  
      // 3. Prepare form data
      const formData = prepareFormData({
        churchData,
        adminData: { fullName, email, password, confirmPassword },
        phone
      });
  
  
      // 5. Submit data to API
      const response = await submitChurchData(formData);
  
      // 6. Handle successful response
      handleSuccess(response, email, form);
  
    } catch (error) {
      // 7. Handle errors
      handleSubmissionError(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions
  const getFormValues = (form: HTMLFormElement) => {
    const getValue = (id: string) => 
      (form.querySelector(`#${id}`) as HTMLInputElement)?.value || '';
  
    return {
      password: getValue('password'),
      confirmPassword: getValue('confirm-password'),
      email: getValue('email'),
      fullName: getValue('full-name'),
      phone: getValue('phone')
    };
  };
  
  const base64ToFile = (base64String: string, fileName: string): File => {
    // Extract the content type and base64 data from the string
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
    
    const contentType = matches[1];
    const base64Data = matches[2];
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: contentType });
    const fileExtension = contentType.split('/')[1] || 'png';
    return new File([blob], `${fileName}.${fileExtension}`, { type: contentType });
  };

  const prepareFormData = ({ churchData, adminData, phone }: {
    churchData: ChurchData;
    adminData: { fullName: string; email: string; password: string; confirmPassword: string };
    phone: string;
  }) => {
    const formData = new FormData();
    
    // Church data
    formData.append("churchName", churchData.churchName || "");
    formData.append("address", churchData.churchLocation || "");
    formData.append("phone", churchData.churchPhone || phone);
    
  // Convert base64 logo to File object if it exists
  if (churchData.logoPreview) {
    const logoFile = base64ToFile(churchData.logoPreview, 'logo');
    formData.append("logo", logoFile);
  }
  
  // Convert base64 background image to File object if it exists
  if (churchData.backgroundPreview) {
    const backgroundFile = base64ToFile(churchData.backgroundPreview, 'background');
    formData.append("backgroundImage", backgroundFile);
  }

    
    if (churchData.churchEmail) {
      formData.append("email", churchData.churchEmail);
    }
    
    formData.append("isHeadQuarter", churchData.isHeadquarter ? "true" : "false");    
    // Admin data
    formData.append("name", adminData.fullName);
    formData.append("adminEmail", adminData.email);
    formData.append("adminPassword", adminData.password);   
    formData.append("confirmPassword", adminData.confirmPassword || adminData.password); 
    return formData;
  };
    
  const submitChurchData = async (formData: FormData) => {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/church/create-church`, {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to create account");
    }
  
    return response.json();
  };
  
  const handleSuccess = (responseData: any, email: string, form: HTMLFormElement) => {
    showSuccessMessage(responseData.email || email);
    form.reset();
     store.dispatch(clearChurchData());
    };
  
  const handleSubmissionError = (error: unknown) => {
    console.error("Account creation error:", error);
    
    let errorMessage = "An unexpected error occurred. Please try again.";
    
    if (error instanceof Error) {
      try {
        // Try to parse the error message as JSON
        const errorObj = JSON.parse(error.message);
        if (errorObj?.error?.message) {
          errorMessage = errorObj.error.message;
        } else if (error.message.includes('<!DOCTYPE html>')) {
          errorMessage = "Server error occurred. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      } catch {
        // If not JSON, use the raw message
        errorMessage = error.message.includes('<!DOCTYPE html>')
          ? "Server error occurred. Please try again later."
          : error.message;
      }
    }
  
    setNotification({
      message: errorMessage,
      type: 'error'
    });
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
              Kindly create Admin account to set up your church
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
                  type="number"
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

