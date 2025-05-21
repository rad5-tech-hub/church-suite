import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loading from "./setupAccount/setting-loader/loading";

// Lazy-loaded components
const SetupChurch = React.lazy(() => import("./setupAccount/createChurch/setupstep1"));
const Branch = React.lazy(() => import("./manage/branch/branch"));
const SetupStep2 = React.lazy(() => import("./setupAccount/churchLogo/setupstep2"));
const Dashboard = React.lazy(() => import("./dashboard/dashboard"));
const ViewBranches = React.lazy(() => import("./manage/branch/viewBranches"));
const Deparment = React.lazy(() => import("./manage/department/department"));
const ViewDeparment = React.lazy(() => import("./manage/department/viewDepartment"));
const Member = React.lazy(() => import("./members/members"));
const Admin = React.lazy(() => import("./manage/admin/admin"));
const ViewAdmin = React.lazy(() => import("./manage/admin/viewAdmin"));
const CreateAccount = React.lazy(() => import("./setupAccount/createAccount/createAccount"));
const Login = React.lazy(() => import("./login/login"));

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Setup Steps */}
          <Route path="/setup-church" element={<SetupChurch />} />
          <Route path="/setup-logo" element={<SetupStep2 />} />
          <Route path="/admin-account" element={<CreateAccount />} />
          <Route path="/setting-up" element={<Loading />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/manage/admin" element={<Admin />} />
          <Route path="/manage/view-admins" element={<ViewAdmin/>} />
          <Route path="/manage/view-branches" element={<ViewBranches/>} />
          <Route path="/manage/branch" element={<Branch />} />
          <Route path="/manage/department" element={<Deparment/>} />
          <Route path="/manage/view-departments" element={<ViewDeparment/>} />
          <Route path="/members/member" element={<Member/>} />

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