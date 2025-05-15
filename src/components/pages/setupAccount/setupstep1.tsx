import React, { useState } from "react";
import { IoCallOutline, IoMailOutline, IoLocationOutline } from "react-icons/io5";
import { PiChurchLight } from "react-icons/pi";
import { Link, useNavigate } from "react-router-dom";

const SetupChurch: React.FC = () => {
  const [churchName, setChurchName] = useState("");
  const [churchEmail, setChurchEmail] = useState("");
  const [churchPhone, setChurchPhone] = useState("");
  const [churchLocation, setChurchLocation] = useState("");
  const [isHeadquarter, setIsHeadquarter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation can be expanded as needed
    if (!churchName || !churchEmail || !churchPhone || !churchLocation || !isHeadquarter) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name: churchName,
      address: churchLocation,
      phone: churchPhone,
      email: churchEmail,
      isHeadQuarter: isHeadquarter,
    };

    try {
      const response = await fetch("https://church.bookbank.com.ng/church/create-church", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create church");
      }

      // On success, navigate to the next setup step
      navigate("/setup-logo");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
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
            {/* Name of Church */}
            <div className="mb-6">
              <label htmlFor="church-name" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Name of Church
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <PiChurchLight className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="church-name"
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the name of your church"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email of Church */}
            <div className="mb-6">
              <label htmlFor="church-email" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Email of Church
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoMailOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="email"
                  id="church-email"
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the email of your church"
                  value={churchEmail}
                  onChange={(e) => setChurchEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Phone Number of Church */}
            <div className="mb-6">
              <label htmlFor="church-phone" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Phone Number of Church
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoCallOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="tel"
                  id="church-phone"
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the phone number of your church"
                  value={churchPhone}
                  onChange={(e) => setChurchPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Church Location */}
            <div className="mb-6">
              <label htmlFor="church-location" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Church Location
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoLocationOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="church-location"
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter the location of your church"
                  value={churchLocation}
                  onChange={(e) => setChurchLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Is Headquarter */}
            <div className="mb-6">
              <label htmlFor="is-headquarter" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Is this the Headquarter?
              </label>
              <div className="relative">
                <select
                  id="is-headquarter"
                  value={isHeadquarter}
                  onChange={(e) => setIsHeadquarter(e.target.value)}
                  className="w-full h-12 px-4 py-3 border border-gray-300 rounded-md text-base text-gray-800 focus:outline-none input-shadow appearance-none bg-white"
                  required
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1.25rem",
                  }}
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="relative text-red-500 mb-4 p-5 bg-red-100 rounded">
                <p>{error}</p>
                <button
                  onClick={() => setError(null)} // Clear the error state on cancel
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
                {loading ? "Submitting..." : "Continue"}
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
