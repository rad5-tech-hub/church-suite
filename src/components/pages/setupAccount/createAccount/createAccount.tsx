import React, { useState } from "react";
import { IoCallOutline, IoMailOutline, IoPersonOutline } from "react-icons/io5";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { SlLock } from "react-icons/sl";
import { clearChurchData } from "../../../reduxstore/datamanager";
import { store } from "../../../reduxstore/redux";
import { RootState } from '../../../reduxstore/redux';
import { useSelector } from 'react-redux';
import { useNavigate } from "react-router-dom";
import { usePageToast } from "../../../hooks/usePageToast";
import { showPageToast } from "../../../util/pageToast";

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
  usePageToast("create-account"); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({
    passwordMismatch: false,
    emailInvalid: false
  });
  const [showCongratsDialog, setShowCongratsDialog] = useState(true);
  const churchData = useSelector((state: RootState) => state?.church);
  const navigate = useNavigate();

  const validateForm = (password: string, confirmPassword: string, email: string): boolean => {
    const errors = {
      passwordMismatch: password !== confirmPassword,
      emailInvalid: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    };

    setFormErrors(errors);
    
    if (errors.passwordMismatch) {
      showPageToast('Passwords do not match', "error");
    }
    
    if (errors.emailInvalid) {     
      showPageToast('Please enter a valid email address', "error");
    }
    
    return !errors.passwordMismatch && !errors.emailInvalid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
  
    try {
      const form = e.currentTarget as HTMLFormElement;
      const { password, confirmPassword, email, fullName, phone } = getFormValues(form);
  
      if (!validateForm(password, confirmPassword, email)) {
        return;
      }
  
      const formData = prepareFormData({
        churchData,
        adminData: { fullName, email, password, confirmPassword },
        phone
      });
  
      const response = await submitChurchData(formData);
      handleSuccess(response, email, form);
    } catch (error) {
      handleSubmissionError(error);
    } finally {
      setLoading(false);
    }
  };

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
    
    formData.append("churchName", churchData.churchName || "");
    formData.append("address", churchData.churchLocation || "");
    formData.append("phone", churchData.churchPhone || phone);
    
    if (churchData.logoPreview) {
      const logoFile = base64ToFile(churchData.logoPreview, 'logo');
      formData.append("logo", logoFile);
    }
  
    if (churchData.backgroundPreview) {
      const backgroundFile = base64ToFile(churchData.backgroundPreview, 'background');
      formData.append("backgroundImage", backgroundFile);
    }

    if (churchData.churchEmail) {
      formData.append("email", churchData.churchEmail);
    }
    
    formData.append("isHeadQuarter", churchData.isHeadquarter ? "true" : "false");    
    formData.append("name", adminData.fullName);
    formData.append("adminEmail", adminData.email);
    formData.append("adminPassword", adminData.password);   
    formData.append("confirmPassword", adminData.confirmPassword || adminData.password); 
    return formData;
  };
    
const submitChurchData = async (formData: FormData) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/church/create-church`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Failed to create church account");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting church data:", error);
    throw error; // Re-throw to allow handling in the calling function
  }
};

  const handleSuccess = (responseData: any, email: string, form: HTMLFormElement) => {
    try {
      // Validate email before storing
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Invalid email format");
      }

      // Store email in sessionStorage
      sessionStorage.setItem('email', email);
      
      // Verify the value was stored correctly
      const storedEmail = sessionStorage.getItem('email');
      if (storedEmail !== email) {
        throw new Error("Failed to store email in sessionStorage");
      }

      // Show success message and navigate after it auto-closes
      showSuccessMessage(responseData.email || email);    

      // Reset form and clear Redux store
      form.reset();
      store.dispatch(clearChurchData());


      // Navigate after the toast auto-closes
      setTimeout(() => {
        navigate('/verify-email');
      }, 1500); // Match the autoClose duration

    } catch (error) {
      console.error("Error in handleSuccess:", error);
      // Fallback: Show error to user or implement alternative storage
      // showErrorMessage("Failed to complete setup. Please try again.");
    }
  };
    
  const handleSubmissionError = (error: unknown) => {
    console.error("Account creation error:", error);
    
    if (error instanceof Error) {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj?.error?.message) {
          // Properly format the error message for display
          const errorDetails = errorObj.error.details?.map((detail: any) => 
            `${detail.field}: ${detail.value} has already been used`
          ).join('\n') || '';

          showPageToast(
            <div>
              <div>{errorObj.error.message}</div>
              {errorDetails && (
                <pre style={{ 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  marginTop: '8px'
                }}>
                  {errorDetails}
                </pre>
              )}
            </div>, 'error'
          );
        } else if (error.message.includes('<!DOCTYPE html>')) {          
          showPageToast("Server error occurred. Please try again later.", 'error');
          
        } else {
          showPageToast(error.message, 'error');
        }
      } catch {
        const errorMessage = error.message.includes('<!DOCTYPE html>')
          ? "Server error occurred. Please try again later."
          : error.message;

        showPageToast(errorMessage,'error');
      }
    } else {
      showPageToast("An unexpected error occurred. Please try again.", 'error');
    }
  };

  const showSuccessMessage = (email: string) => {
    showPageToast(
      <div>
        <div>Account created successfully!</div>
        <div>We sent a verification link to: {email}</div>
        <div className="mt-2">
        </div>
      </div>,
      'success'
    );
  };

  return (
    <div className="bg-[#F6F4FE] min-h-screen ">
      {/* SVG Pattern at the top */}
      <div 
        className="fixed top-0 left-0 w-full h-[200px] z-0"
        style={{
          background: `
            radial-gradient(at top left, #2A1B45 100%, transparent 10%),
            radial-gradient(at top right, #2A1B45 70%, transparent 0%),
            radial-gradient(at bottom left, #1E0D2E 90%, transparent 0%),
            radial-gradient(at bottom right, #D778C4 100%, transparent 1%),
            #120B1B
          `,
        }}
      >
        <div className="w-full relative overflow-hidden" style={{ height: '350px', flexShrink: 0 }}> 
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="1440" 
            height="350" 
            viewBox="0 60 1440 350" 
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M0 0H1440V306L0 370V0Z" 
              fill="#120B1B"
            />
          </svg>    
        </div>
      </div>
      {/* Congratulatory Dialog */}
      {showCongratsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-lg max-w-md mx-4 shadow-xl text-center">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Congratulations!</h3>
            <p className="mb-4 text-gray-600">
              You've successfully submitted your church information! 🎉
            </p>
            <p className="mb-6 text-gray-600">
              To fully complete the setup and manage your church, please create an administrative account using a valid email address.
            </p>
            <button
              type="button"
              className="w-full bg-gray-900 text-white rounded-full py-2 text-base font-semibold hover:bg-gray-800 focus-visible:outline-offset-2 focus-visible:outline-gray-900 transition duration-200 ease-in-out"
              onClick={() => setShowCongratsDialog(false)}
              aria-label="Proceed to create admin account"
            >
              Create Admin Account
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!showCongratsDialog && (       
        <div className="max-w-2xl mx-auto px-4 py-30 relative z-10">
          <div className="bg-[#F6F4FE] rounded-lg shadow-md p-8">
            <div className="text-center mb-5">
              <p className="mb-2 text-gray-600 text-end">Step 3 of 3</p>
              <h1 className="text-2xl font-bold mb-2">Create Admin Account</h1>
              <p className="text-gray-600 lg:w-11/12 ">
                Kindly create Admin account to set up your church
              </p>
            </div>
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

              {/* Submit Button */}
              <div className="w-full gap-3 pt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full  bg-gradient-to-b from-[#120B1B] to-[#1E0D2E] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
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
      )}
    </div>
  );
};

export default CreateAccount;