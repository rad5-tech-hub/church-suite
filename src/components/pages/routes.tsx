import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loading from "./createAccount/loading";

// Lazy-loaded components
const SetupChurch = React.lazy(() => import("./setupAccount/setupstep1"));
const SetupStep2 = React.lazy(() => import("./setupAccount/setupstep2"));
const Dashboard = React.lazy(() => import("./dashboard/dashboard"));
const Login = React.lazy(() => import("./login/login"));

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Setup Steps */}
          <Route path="/setup-church" element={<SetupChurch />} />
          <Route path="/setup-logo" element={<SetupStep2 />} />
          <Route path="/setting-up" element={<Loading />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Dashboard */}
          <Route path="/" element={<Login />} />

          {/* Fallback Route */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Suspense>
    </Router>
  );
};

// Loading Spinner Component
function LoadingSpinner() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#111827]"></div>
          </div>
          <p className="text-lg text-[#111827]">Loading...</p>
        </div>
      </div>
    );
  }
export default AppRoutes;