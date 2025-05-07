import React, { useEffect } from "react";

const Loading: React.FC = () => {
  useEffect(() => {
    const progress = document.getElementById("progress");
    const spinner = document.getElementById("spinner");

    if (progress) {
      progress.addEventListener("animationend", () => {
        if (spinner) {
          spinner.classList.remove("animate-spin");
        }
        // Optional: Add a completion action (e.g., redirect or show message)
        setTimeout(() => {
          window.location.href = "/dashboard"; // Redirect to the dashboard after loading
        }, 1000);
      });
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-6">
        {/* Circular Loader */}
        <div className="flex justify-center mb-4 animate-spin">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
        </div>

        {/* Text */}
        <h3 className="loading text-center text-xl sm:text-xl md:text-2xl lg:text-2xl text-[#1A3C34]">
          Setting up Church! Please wait...
        </h3>

        {/* Progress Bar */}
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-2 bg-gray-200 rounded-full overflow-hidden mt-5">
          <div
            id="progress"
            className="h-full bg-[#111827] rounded-full"
            style={{
              animation: "fillProgress 5s linear forwards",
            }}
          ></div>
        </div>

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