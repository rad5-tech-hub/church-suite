import React, { useState, useEffect, useCallback } from "react";
import { SlCloudUpload } from "react-icons/sl";
import { IoArrowForward } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { setChurchData } from "../../../reduxstore/datamanager";
import { RootState } from "../../../reduxstore/redux";

// File Upload Component
interface FileUploadProps {
  type: 'logo' | 'background';
  preview: string | null;
  onFileUpload: (type: 'logo' | 'background', base64String: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ type, preview, onFileUpload }) => {
  const label = type === 'logo' ? 'Logo' : 'Background Image';
  const id = `${type}-upload`;

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const base64String = await fileToBase64(file);
      onFileUpload(type, base64String);
    } catch (error) {
      console.error('Error converting file to base64:', error);
    }
  };

  return (
    <div className="mb-6">
      <label htmlFor={id} className="block text-base text-gray-700 font-medium mb-2">
        Upload {label}
      </label>
      <div
        className={`file-upload input-shadow flex flex-col items-center justify-center border border-gray-300 rounded-md py-6 cursor-pointer relative ${
          preview ? "border-light-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : ""
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
          <img
            src={preview}
            alt={`${label} Preview`}
            className={`${
              type === "logo" ? "h-20 w-20 object-cover rounded-full" : "h-60 w-full object-contain rounded-md"
            }`}
          />
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
    </div>
  );
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Main Component
const SetupStep2: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const churchData = useSelector((state: RootState) => state.church);
  const [loading, setLoading] = useState(false);

  const [logoPreview, setLogoPreview] = useState<string | null>(churchData.logoPreview || null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(churchData.backgroundPreview || null);

  useEffect(() => {
    setLogoPreview(churchData.logoPreview || null);
    setBackgroundPreview(churchData.backgroundPreview || null);
  }, [churchData.logoPreview, churchData.backgroundPreview]);

  const handleFileUpload = useCallback((type: 'logo' | 'background', base64String: string) => {
    dispatch(setChurchData({
      [`${type}Preview`]: base64String
    }));

    if (type === 'logo') {
      setLogoPreview(base64String);
    } else {
      setBackgroundPreview(base64String);
    }
  }, [dispatch]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if logo is uploaded
    if (!logoPreview) {
      alert('Please upload a logo before continuing');
      return;
    }
  
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      navigate("/admin-account");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        {/* Left Section - Welcome Message */}
        <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-9/12 py-8">
            <p className="mb-2 text-sm text-gray-200">Step 2 of 3</p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Image Uploads</h1>
            <p className="text-lg lg:text-xl text-gray-300">
              Upload your logo and background image to complete the setup.
            </p>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 justify-center flex flex-col">
          <form className="flex flex-col" onSubmit={handleContinue}>
            <FileUpload 
              type="logo" 
              preview={logoPreview} 
              onFileUpload={handleFileUpload} 
            />
            <FileUpload 
              type="background" 
              preview={backgroundPreview} 
              onFileUpload={handleFileUpload} 
            />

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
                className="h-12 px-10 mb-5 lg:w-auto w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-[#111827] disabled:opacity-50"
              >
                {loading ? "Continuing..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetupStep2;