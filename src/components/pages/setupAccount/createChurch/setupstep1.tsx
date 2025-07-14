import React, { useState } from 'react';
import { IoCallOutline, IoMailOutline, IoLocationOutline } from 'react-icons/io5';
import { PiChurchLight } from 'react-icons/pi';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../reduxstore/redux';
import { setChurchData } from '../../../reduxstore/datamanager';

interface ChurchFormData {
  churchName: string;
  churchEmail: string;
  churchPhone: string;
  churchLocation: string;
  isHeadquarter: boolean | string;
}

const SetupChurch: React.FC = () => {
  // Hooks and state management
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const churchData = useSelector((state: RootState) => state.church);

  const [formData, setFormData] = useState<ChurchFormData>({
    churchName: churchData.churchName || '',
    churchEmail: churchData.churchEmail || '',
    churchPhone: churchData.churchPhone || '',
    churchLocation: churchData.churchLocation || '',
    isHeadquarter: churchData.isHeadquarter || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.churchName.trim()) {
      setError('Church name is required');
      return false;
    }
    if (!formData.churchPhone.trim()) {
      setError('Church phone number is required');
      return false;
    }
    if (!formData.churchLocation.trim()) {
      setError('Church location is required');
      return false;
    }
    if (formData.isHeadquarter === '') {
      setError('Please specify if this is the headquarters');
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    // Prepare data for Redux
    const submissionData = {
      ...formData,
      isHeadquarter: formData.isHeadquarter === 'true'
    };

    dispatch(setChurchData(submissionData));

    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
      navigate('/setup-logo');
    }, 2000);
  };

  // Form field components
  const renderInputField = (
    id: string,
    label: string,
    type: string,
    placeholder: string,
    required: boolean,
    icon: React.ReactNode
  ) => (
    <div className="mb-6">
      <label htmlFor={id} className="block text-base text-gray-700 font-medium mb-2 text-left">
        {label}
      </label>
      <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
        {icon}
        <input
          type={type}
          id={id}
          name={id}
          value={formData[id as keyof ChurchFormData] as string}
          onChange={handleChange}
          className="w-full text-base text-gray-800 focus:outline-none"
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );

  const renderSelectField = (
    id: string,
    label: string,
    options: { value: string; label: string }[],
    required: boolean
  ) => (
    <div className="mb-6">
      <label htmlFor={id} className="block text-base text-gray-700 font-medium mb-2 text-left">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={id}
          value={formData[id as keyof ChurchFormData] as string}
          onChange={handleChange}
          className="w-full h-12 px-4 py-3  border border-gray-300 rounded-md  text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-transparent"
          required={required}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "1.25rem",
          }}
        >
          <option value="" disabled>Select an option</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        {/* Left Section - Welcome Message */}
        <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-10/12 py-8">
            <p className="mb-2 text-sm text-gray-200">Step 1 of 3</p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Set Up Your Church</h1>
            <p className="text-lg lg:text-xl lg:w-11/12 text-gray-300">
              Kindly provide the details of your church to proceed.
            </p>
          </div>
        </div>

        {/* Right Section - Form */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 flex flex-col justify-center">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            {renderInputField(
              'churchName',
              'Name of Church',
              'text',
              'Enter the name of your church',
              true,
              <PiChurchLight className="text-gray-400 mr-3 text-xl" />
            )}

            {renderInputField(
              'churchEmail',
              'Email of Church (optional)',
              'email',
              'Enter the email of your church',
              false,
              <IoMailOutline className="text-gray-400 mr-3 text-xl" />
            )}

            {renderInputField(
              'churchPhone',
              'Phone Number of Church',
              'number',
              'Enter the phone number of your church',
              true,
              <IoCallOutline className="text-gray-400 mr-3 text-xl" />
            )}

            {renderInputField(
              'churchLocation',
              'Church Location',
              'text',
              'Enter the location of your church',
              true,
              <IoLocationOutline className="text-gray-400 mr-3 text-xl" />
            )}

            {renderSelectField(
              'isHeadquarter',
              'Does your church have branches?',
              [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' }
              ],
              true
            )}

            {error && (
              <div className="relative text-red-500 mb-4 p-5 bg-red-100 rounded">
                <p>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="absolute top-2 right-2 p-3 text-red-600 hover:text-red-800 font-bold"
                  aria-label="Close error message"
                  type="button"
                >
                  ×
                </button>
              </div>
            )}

            <div className="w-full gap-3 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Continuing...' : 'Continue'}
              </button>
            </div>

            <div className="mt-5 text-center">
              <span>Already have an account? </span>
              <Link to="/" className="underline">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default SetupChurch;