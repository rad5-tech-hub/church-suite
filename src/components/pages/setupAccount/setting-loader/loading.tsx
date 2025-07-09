import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from "react-router-dom";
import { persistor } from '../../../reduxstore/redux'; // Adjust the path to your Redux store file
import { setAuthData } from '../../../reduxstore/authstore';

const Loading: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isPaused, setIsPaused] = useState(false); // State to handle paused spinner
  const token = searchParams.get("token");
  const [isVerifying, setIsVerifying] = useState(false); // State to track verification status

  // Verify token and set up animation end listener
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("No token provided");
        setIsLoading(false);
        return;
      }
  
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}church/verify-admin?token=${token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
  
        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(errorResponse?.message || "Verification failed");
        }
  
        const responseData = await response.json();
        const decodedToken = jwtDecode(responseData.accessToken) as any;
  
        const authPayload = {
          backgroundImg: decodedToken.backgroundImg || "",
          branchId: decodedToken.branchId || "",
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
          token: responseData.accessToken || "",
        };
  
        console.log("Dispatching:", authPayload);
        dispatch(setAuthData(authPayload));
  
        // Wait for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force persistence
        persistor.flush().then(() => {
          console.log("State persisted");
          navigate("/dashboard");
        });
  
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Verification failed";
        setError(errorMessage);
        setNotification({ message: errorMessage, type: "error" });
        setIsLoading(false);
        console.error("Error:", err);
      }
    };
  
    verifyToken();
  }, [token]);


  const handleResendVerification = async () => {
    setIsVerifying(true); // Disable the button and show "Verifying..."
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}church/resend-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      if (!response.ok) {
        const errorResponse = await response.json(); // Parse the error response
        const errorMessage = errorResponse.error?.message || "Failed to resend verification email"; // Extract the error message
        throw new Error(errorMessage); // Throw the error with the actual message
      }
  
      const responseData = await response.json();
      setNotification({
        message: `We sent a verification link to: ${responseData.email || email}`,
        type: "success",
      });
      setShowEmailModal(false); // Close the modal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setNotification({ message: errorMessage, type: "error" }); // Set error notification
      console.error("Resend verification error:", err);
    } finally {
      setIsVerifying(false); // Re-enable the button
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-6">
        {/* Circular Loader - Only spins when loading */}
        {isLoading && !isPaused && (
          <div
            id="spinner"
            className="flex justify-center mb-4 animate-spin [animation-duration:1s]"
            data-testid="spinner"
          >
            <div className="rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
          </div>
        )}

        {/* Paused Spinner */}
        {isPaused && (
          <div
            id="spinner"
            className="flex justify-center mb-4"
            data-testid="spinner"
          >
            <div className="rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
          </div>
        )}

       {/* Text */}
        {error ? (
          <h3 className="loading text-center text-xl sm:text-xl md:text-2xl lg:text-2xl ">
            {error}
          </h3>
        ) : (
          <h3 className="loading text-center text-xl sm:text-xl md:text-2xl lg:text-2xl">
            {isPaused ? "Still waiting..." : "Setting up Church! Please wait..."}
          </h3>
        )}

        {/* Progress Bar - Only show if no error and still loading */}
        {!error && isLoading && !isPaused && (
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-2 bg-gray-200 rounded-full overflow-hidden mt-5">
            <div
              id="progress"
              className="h-full bg-[#111827] rounded-full"
              style={{
                animation: "fillProgress 5s linear forwards",
              }}
            ></div>
          </div>
        )}

        {/* Error action button */}
        {error && !isPaused && (
          <button
            onClick={() => setShowEmailModal(true)} // Show the email modal
            className="mt-4 px-4 py-2 bg-[#111827] text-white rounded hover:bg-[#1A3C34] transition-colors"
          >
            Try Again
          </button>
        )}

        {/* Email Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md mx-4 shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Resend Verification Email</h3>
              <p className="mb-4 text-gray-600">Enter your email address to resend the verification link.</p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full mb-4 px-4 py-2 border border-gray-300 rounded"
              />
              <button
                onClick={handleResendVerification}
                disabled={isVerifying} // Disable the button while verifying
                className={`w-full bg-[#111827] text-white rounded-full py-2 text-base font-semibold transition duration-200 ${
                  isVerifying ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-800"
                }`}
              >
                {isVerifying ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {notification?.type === "success" && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-lg max-w-md mx-4 shadow-xl">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Account Created Successfully!</h3>
              <p className="mb-4 text-gray-600">{notification.message}</p>
              <p className="text-sm text-gray-600 mb-6">
                Please check your email and click the verification link to be verified.
              </p>
              <button
                className="w-full bg-[#111827] text-white rounded-full py-2 text-base font-semibold hover:bg-gray-800 transition duration-200"
                onClick={() => {
                  setNotification(null);                 
                  setIsPaused(true); // Pause the spinner and show "Still waiting..."
                  setError('');
                }}
              >
              <a 
                href={`mailto:${email}`}
                className="block w-full h-full"
              >
                OK
              </a>
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

        {/* Inline Keyframes */}
        <style>
          {`
            @keyframes fillProgress {
              from {
                width: 0%;
              }
              to {
                width: 100%;
              }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default Loading;