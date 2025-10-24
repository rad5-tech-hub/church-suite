import React, { useState, useEffect, useCallback } from "react";
import { SlCloudUpload } from "react-icons/sl";
import { IoArrowForward, IoCheckmarkCircle } from "react-icons/io5"; // Added IoCheckmarkCircle
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { setChurchData } from "../../../reduxstore/datamanager";
import { RootState } from "../../../reduxstore/redux";
import { ArrowBack } from "@mui/icons-material";

// File Upload Component
interface FileUploadProps {
  type: "logo" | "background";
  preview: string | null;
  onFileUpload: (type: "logo" | "background", base64String: string) => void;
  error?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ type, preview, onFileUpload, error }) => {
  const label = type === "logo" ? "Logo" : "Banner Image";
  const id = `${type}-upload`;

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64String = await fileToBase64(file);
      onFileUpload(type, base64String);
    } catch (error) {
      console.error("Error converting file to base64:", error);
    }
  };

  return (
    <div className="mb-6 relative"> {/* Added relative positioning for the container */}
      <label htmlFor={id} className="block text-base text-gray-700 font-medium mb-2">
        Upload {label }
      </label>
      <div
        className={`file-upload input-shadow flex flex-col items-center justify-center border border-gray-300 rounded-md py-6 cursor-pointer relative ${
          error
            ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
            : preview
            ? "border-light-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
            : "border-gray-300"
        }`}
      >
        <input
          type="file"
          id={id}
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
        />
        {preview ? (
          <>
            <img
              src={preview}
              alt={`${label} Preview`}
              className={`${
                type === "logo" ? "h-20 w-20 object-cover rounded-full" : "h-60 w-full object-contain rounded-md"
              }`}
            />
            {/* Green Checkmark in Top-Left Corner */}
            <IoCheckmarkCircle
              className="absolute top-2 right-2 text-green-500 w-6 h-6"
              aria-label="Upload successful"
            />
          </>
        ) : (
          <div className="w-12 h-12 bg-gradient-to-r from-gray-100 to-gray-100 rounded-full flex items-center justify-center">
            <div className="w-9 h-9 bg-[#B7CBD0] rounded-full flex items-center justify-center">
              <div className="w-7 h-7 rounded-full flex bg-[#B7CBD0] items-center justify-center">
                <SlCloudUpload className="w-5 h-5 text-[#111827] text-center" />
              </div>
            </div>
          </div>
        )}
        <span className="text-gray-500 text-base mt-3">
          <span className="font-semibold text-[#175668]">Click to upload</span> {label}
        </span>
        <span className="text-sm text-gray-500">SVG, PNG, JPG or GIF (max. 800x400px)</span>
      </div>
      {error && (
        <p className="text-red-500 text-sm mt-1">
          Please upload a {label.toLowerCase()}.
        </p>
      )}
    </div>
  );
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Main Component
const SetupStep2: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const churchData = useSelector((state: RootState) => state.church);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState<boolean>(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(churchData.logoPreview || null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(churchData.backgroundPreview || null);

  useEffect(() => {
    setLogoPreview(churchData.logoPreview || null);
    setBackgroundPreview(churchData.backgroundPreview || null);
  }, [churchData.logoPreview, churchData.backgroundPreview]);

  const handleFileUpload = useCallback(
    (type: "logo" | "background", base64String: string) => {
      dispatch(
        setChurchData({
          [`${type}Preview`]: base64String,
        })
      );

      if (type === "logo") {
        setLogoPreview(base64String);
        setLogoError(false);
      } else {
        setBackgroundPreview(base64String);
      }
    },
    [dispatch]
  );

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!logoPreview) {
      setLogoError(true);
      setLoading(false);
      return;
    } else {
      setLogoError(false);
      setTimeout(() => {
        setLoading(false);
        navigate("/admin-account");
      }, 2000);
    }
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

      <div className="max-w-2xl mx-auto px-4 py-30 relative z-10">
        <div className="text-center mb-5">
          <p className="text-3xl font-bold text-gray-200">ChurchSet</p>
        </div>
        {/* Right Section - Form */}
        <div className="bg-[#F6F4FE] rounded-lg shadow-md p-8">
          <div className="text-center mb-5">
            <div className="flex justify-between">
              <Link to={'/setup-church'}>
                <ArrowBack className="cursor-pointer mb-2 text-gray-600" />
              </Link>
              <p className="mb-2 text-gray-600 text-end">Step 2 of 3</p>
            </div>
            <h1 className="text-2xl font-bold mb-2">Image Uploads</h1>
            <p className="text-gray-600 lg:w-11/12 ">
              Upload Church logo and banner to optimize setup.
            </p>
          </div>
          <form className="flex flex-col" onSubmit={handleContinue}>
            <FileUpload type="logo" preview={logoPreview} onFileUpload={handleFileUpload} error={logoError} />
            <FileUpload type="background" preview={backgroundPreview} onFileUpload={handleFileUpload} />

            {/* Form Actions */}
            <div className="flex flex-col-reverse lg:flex-row lg:justify-between gap-3 pt-5">
              <Link to="/admin-account" className="flex items-center">
                <button
                  type="button"
                  className="flex items-center justify-center mb-5 h-12 gap-3 px-7 w-full lg:w-auto text-gray-600 rounded-full text-base font-semibold border border-gray-300 hover:bg-gray-100"
                >
                  Skip
                  <IoArrowForward className="w-5 h-5 text-gray-600 mr-2" />
                </button>
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="h-12 px-10 mb-5 lg:w-auto w-full  bg-gradient-to-b from-[#120B1B] to-[#1E0D2E] text-white rounded-full text-base font-semibold hover:bg-[#111827] disabled:opacity-50"
              >
                {logoError ? "Continue" : loading ? "Continuing..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupStep2;