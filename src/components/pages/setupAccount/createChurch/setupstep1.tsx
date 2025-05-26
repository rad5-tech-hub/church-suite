import React, { useState } from 'react';
import { IoCallOutline, IoMailOutline, IoLocationOutline } from 'react-icons/io5';
import { PiChurchLight } from 'react-icons/pi';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../reduxstore/redux';
import { setChurchData } from '../../../reduxstore/datamanager';

const SetupChurch: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const churchData = useSelector((state: RootState) => state.church);

  const [formData, setFormData] = useState({
    churchName: churchData.churchName || '',
    churchEmail: churchData.churchEmail || '',
    churchPhone: churchData.churchPhone || '',
    churchLocation: churchData.churchLocation || '',
    isHeadquarter: churchData.isHeadquarter || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.churchName || !formData.churchPhone || !formData.churchLocation || !formData.isHeadquarter) {
      setError('Please fill all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    // Save form data to Redux
    dispatch(setChurchData(formData));

    // Simulate a delay of 2 seconds before navigating
    setTimeout(() => {
      setLoading(false);
      navigate('/setup-logo');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col lg:flex-row w-full max-w-full p-4 md:p-6 min-h-screen">
        {/* Left Section */}
        <div className="image-section flex-1 bg-[#111827] bg-no-repeat bg-center bg-cover text-white rounded-lg p-8 md:p-10 flex flex-col justify-center">
          <div className="lg:w-10/12 py-8">
            <p className="mb-2 text-sm text-gray-200">Step 1 of 3</p>
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Set Up Your Church</h1>
            <p className="text-lg lg:text-xl lg:w-11/12 text-gray-300">
              Kindly provide the details of your church to proceed.
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="form-section flex-1 bg-white w-full rounded-b-lg md:rounded-r-lg md:rounded-b-none px-6 lg:px-12 py-10 flex flex-col justify-center">
          <form className="flex flex-col" onSubmit={handleSubmit}>
            {/* Name of Church */}
            <div className="mb-6">
              <label htmlFor="churchName" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Name of Church
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <PiChurchLight className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="churchName"
                  name="churchName"
                  value={formData.churchName}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the name of your church"
                  required
                />
              </div>
            </div>

            {/* Email of Church */}
            <div className="mb-6">
              <label htmlFor="churchEmail" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Email of Church (optional)
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoMailOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="email"
                  id="churchEmail"
                  name="churchEmail"
                  value={formData.churchEmail}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the email of your church"                
                />
              </div>
            </div>

            {/* Phone Number of Church */}
            <div className="mb-6">
              <label htmlFor="churchPhone" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Phone Number of Church
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoCallOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="tel"
                  id="churchPhone"
                  name="churchPhone"
                  value={formData.churchPhone}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the phone number of your church"
                  required
                />
              </div>
            </div>

            {/* Church Location */}
            <div className="mb-6">
              <label htmlFor="churchLocation" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Church Location
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoLocationOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="churchLocation"
                  name="churchLocation"
                  value={formData.churchLocation}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the location of your church"
                  required
                />
              </div>
            </div>

            {/* Is Headquarter */}
            <div className="mb-6">
              <label htmlFor="isHeadquarter" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Is this the Headquarter?
              </label>
              <div className="relative">
                <select
                  id="isHeadquarter"
                  name="isHeadquarter"
                  value={formData.isHeadquarter}
                  onChange={handleChange}
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-white"
                  required
                >
                  <option value="">Select an option</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="relative text-red-500 mb-4 p-5 bg-red-100 rounded">
                <p>{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="absolute top-2 right-2 p-3 text-red-600 hover:text-red-800 font-bold"
                  aria-label="Close error message"
                  type="button"
                >
                  x
                </button>
              </div>
            )}

            {/* Form Actions */}
            <div className="w-full gap-3 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full bg-[#111827] text-white rounded-full text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {loading ? 'Continuing...' : 'Continue'}
              </button>
            </div>

            {/* Login Link */}
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
  );
};

export default SetupChurch;