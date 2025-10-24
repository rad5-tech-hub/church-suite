import React, { useState } from "react";
import { PiEye, PiEyeClosed } from "react-icons/pi";
import { Link, useNavigate } from "react-router-dom";
import { store } from "../../reduxstore/redux";
import { clearChurchData } from "../../reduxstore/datamanager";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useDispatch } from "react-redux";
import { persistor } from '../../reduxstore/redux';
import { setAuthData } from '../../reduxstore/authstore';
import { jwtDecode } from "jwt-decode";

// Interfaces
interface LoginFormProps {}

interface LoginData {
  email: string;
  password: string;
}

interface ApiError {
  error: {
    message: string;
    code: number;
  };
  stack?: string;
}

interface AuthPayload {
  backgroundImg: string;
  branchId: string;
  branches: string[];
  churchId: string;
  church_name: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
  id: string;
  isHeadQuarter: boolean;
  isSuperAdmin: boolean;
  logo: string;
  name: string;
  tenantId: string;
  token: string;
  department: string;
}


// const CODE_LENGTH = 6;
const PERSIST_DELAY = 100;

// Main Component
const Login: React.FC<LoginFormProps> = () => {
  const navigate = useNavigate();
    const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
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
      const decodedToken = jwtDecode(data.accessToken) as any;

      const authPayload: AuthPayload = {
        backgroundImg: decodedToken.backgroundImg || "",
        role: decodedToken.role || "",
        branchId: Array.isArray(decodedToken.branchIds)
          ? decodedToken.branchIds[0] || "" 
          : decodedToken.branchIds || "", 
        branches: Array.isArray(decodedToken.branchIds) 
          ? decodedToken.branchIds
          : [decodedToken.branchIds || ""], // ✅ ensure array
        churchId: decodedToken.churchId || "",
        church_name: decodedToken.church_name || "",
        email: decodedToken.email || "",
        exp: decodedToken.exp || 0,
        iat: decodedToken.iat || 0,
        id: decodedToken.id || "",
        isHeadQuarter: decodedToken.isHeadQuarter || false,
        isSuperAdmin: decodedToken.isSuperAdmin || false,
        logo: decodedToken.logo || "",
        name: decodedToken.name || "",
        tenantId: decodedToken.tenantId || "",
        token: data.accessToken || "",
        department: decodedToken?.department || ''
      };

      dispatch(setAuthData(authPayload));
      await new Promise(resolve => setTimeout(resolve, PERSIST_DELAY));
      
      // Show success toast
      toast.success('Login successful! Redirecting to Dashboard...', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

      // Navigate to verify-email after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

      // Clear form
      setFormData({
        email: "",
        password: "",
      });
          
      persistor.flush().then(() => navigate("/dashboard"));
            
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";    
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setTimeout(() => {
        if (
          errorMessage.toLowerCase().includes("verify your email") ||
          errorMessage.toLowerCase().includes("please verify your email")
        ) {          
          // Store email in session storage for verification
          sessionStorage.setItem('email', formData.email);
          navigate("/verify-email");
        }
      }, 1200);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/church/forgot-password`,
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

      toast.success('Password reset link has been sent to your email!', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send reset link. Please try again.";
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="bg-[#F6F4FE] min-h-screen ">
      {/* SVG Pattern at the top */} 
      <div className="w-full h-[300px]"      
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
        <div className="w-full relative overflow-hidden" style={{ height: '450px', flexShrink: 0 }}> 
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="1440" 
            height="450" 
            viewBox="0 0 1440 450" 
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M0 0H1440V306L0 450V0Z" 
              fill="#120B1B"
            />
          </svg>   
        </div>
      </div>

      {/* Login Form Container */}      
      <div className="max-w-md mx-auto px-4 -mt-55 relative z-10">
        <div className="text-center mb-5">
          <p className="text-3xl font-bold text-gray-200">ChurchSet</p>
        </div>
        <div className="bg-[#F6F4FE] rounded-lg shadow-md p-8">
          {/* Forgot Password Modal */}
          {showForgotPasswordModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
              <div className="text-center mb-5">
                <p className="text-3xl font-bold text-gray-200">ChurchSet</p>
              </div>
              <div className="bg-gray p-6 rounded-lg bg-gray-200 w-full max-w-md mx-4 shadow-xl">
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
                    <input
                      type="email"
                      id="forgotEmail"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter your email"
                      required
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    />
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
                      className="px-4 py-2 bg-[#120B1B] text-white rounded-md hover:bg-opacity-90 disabled:opacity-50"
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">Log in</h1>
              <p className="text-gray-600 mt-2">
                Welcome, Kindly login to your account to continue <br className="sm:hidden"/> with your church
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                id="email"
                placeholder="email@gmail.com"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#120B1B]"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#120B1B] pr-10"
                  placeholder="........"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <PiEye size={18} /> : <PiEyeClosed size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-sm text-[#120B1B] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full  bg-gradient-to-b from-[#120B1B] to-[#1E0D2E] text-white py-2 rounded-md hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Log in"}
            </button>

            <div className="text-center text-sm">
              <span>Don't have an Account? </span>
              <Link to="/setup-church" className="text-[#120B1B] font-medium hover:underline">
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer/>
    </div>
  );
};

export default Login;