import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../reduxstore/redux";
import Loading from "./setupAccount/setting-loader/loading";

// Lazy-loaded components
const SetupChurch = React.lazy(() => import("./setupAccount/createChurch/setupstep1"));
const Branch = React.lazy(() => import("./manage/branch/branch"));
const SetupStep2 = React.lazy(() => import("./setupAccount/churchLogo/setupstep2"));
const Dashboard = React.lazy(() => import("./dashboard/dashboard"));
const ViewBranches = React.lazy(() => import("./manage/branch/viewBranches"));
const Department = React.lazy(() => import("./manage/department/department"));
const ViewDepartment = React.lazy(() => import("./manage/department/viewDepartment"));
const Member = React.lazy(() => import("./members/allMembers/members"));
const ViewMember = React.lazy(() => import("./members/allMembers/viewMembers"));
const ViewSingleMember = React.lazy(() => import("./members/singleMember/viewSingleMember"));
const EditMember = React.lazy(() => import("./members/singleMember/editmember"));
const FollowUpRegisterar = React.lazy(() => import("./members/followUp/followUp"));
const ViewFollowUp = React.lazy(() => import("./members/followUp/viewFollowUp"));
const ViewSingleFollowUp = React.lazy(() => import("./members/followUp/singlefollowup"));
const Admin = React.lazy(() => import("./manage/admin/admin"));
const ViewAdmin = React.lazy(() => import("./manage/admin/viewAdmin"));
const CreateAccount = React.lazy(() => import("./setupAccount/createAccount/createAccount"));
const Login = React.lazy(() => import("./login/login"));
const ResetPassword = React.lazy(() => import("./reset-password/resetPassword"));
const SettingProfile = React.lazy(() => import("./settingProfile/settingProfile"));
const QrcodepagesFollowUp = React.lazy(() => import("./members/followUp/qrcodePageFollowUp"));

// Private Route Component
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = useSelector((state: RootState) => state.auth?.authData?.token);
  
  return token ? (
    <>{children}</>
  ) : (
    <Navigate to="/" replace />
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/setup-church" element={<SetupChurch />} />
          <Route path="/setup-logo" element={<SetupStep2 />} />
          <Route path="/admin-account" element={<CreateAccount />} />
          <Route path="/setting-up" element={<Loading />} />
          <Route path="/followups" element={<QrcodepagesFollowUp />} />

          {/* Private Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <SettingProfile/>
            </PrivateRoute>
          } />
          <Route path="/manage/admin" element={
            <PrivateRoute>
              <Admin />
            </PrivateRoute>
          } />
          <Route path="/manage/view-admins" element={
            <PrivateRoute>
              <ViewAdmin />
            </PrivateRoute>
          } />
          <Route path="/manage/view-branches" element={
            <PrivateRoute>
              <ViewBranches />
            </PrivateRoute>
          } />
          <Route path="/manage/branch" element={
            <PrivateRoute>
              <Branch />
            </PrivateRoute>
          } />
          <Route path="/manage/department" element={
            <PrivateRoute>
              <Department />
            </PrivateRoute>
          } />
          <Route path="/manage/view-departments" element={
            <PrivateRoute>
              <ViewDepartment/>
            </PrivateRoute>
          } />
          <Route path="/members/member" element={
            <PrivateRoute>
              <Member />
            </PrivateRoute>
          } />
          <Route path="/members/view-members" element={
            <PrivateRoute>
              <ViewMember />
            </PrivateRoute>
          } />
          <Route path="/members/view/:memberId" element={
            <PrivateRoute>
              <ViewSingleMember />
            </PrivateRoute>
          } />
           <Route path="/members/edit/:memberId" element={
            <PrivateRoute>
              <EditMember/>
            </PrivateRoute>
          } />
           <Route path="/register/followup" element={
            <PrivateRoute>
              <FollowUpRegisterar/>
            </PrivateRoute>
          } />
            <Route path="/view/followup" element={
            <PrivateRoute>
              <ViewFollowUp/>
            </PrivateRoute>
          } />
            <Route path="/view/single-fellower/:followUpId" element={
            <PrivateRoute>
              <ViewSingleFollowUp/>
            </PrivateRoute>
          } />

          {/* Redirect to Dashboard if no match */}

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