import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../reduxstore/redux";
import NotFoundPage from "./notFound";
import ChangeColorButton from "./churchSettings/setting";
import EmailVerification from "./setupAccount/verify-email/otp";

// Lazy-loaded components
const Login = React.lazy(() => import("./login/login"));
const SetupChurch = React.lazy(() => import("./setupAccount/createChurch/setupstep1"));
const ViewChurch = React.lazy(() => import("./churchSettings/viewChurch"));
const SetupStep2 = React.lazy(() => import("./setupAccount/churchLogo/setupstep2"));
const Dashboard = React.lazy(() => import("./dashboard/dashboard"));
const ViewBranches = React.lazy(() => import("./manage/branch/viewBranches"));
const ViewDepartment = React.lazy(() => import("./manage/department/viewDepartment"));
const ViewMember = React.lazy(() => import("./members/allMembers/viewMembers"));
const ViewNewcomersForm = React.lazy(() => import("./members/viewNewcomersForms/viewforms"));
const ViewSingleMember = React.lazy(() => import("./members/singleMember/viewSingleMember"));
const ViewFollowUp = React.lazy(() => import("./members/new-comers/viewFollowUp"));
const ViewUnit = React.lazy(() => import("./manage/unit/viewUnit"));
const ViewAdmin = React.lazy(() => import("./manage/admin/viewAdmin"));
const CreateAccount = React.lazy(() => import("./setupAccount/createAccount/createAccount"));
const ResetPassword = React.lazy(() => import("./reset-password/resetPassword"));
const SettingProfile = React.lazy(() => import("./profile/userProfile"));
const ViewMessageHistory = React.lazy(()=>import('./messages/viewMessage/viewMessage'));
const FollowUpQrcodepage = React.lazy(() => import("./members/new-comers/qrcodePageFollowUp"));
const MemberQrcodepage = React.lazy(() => import("./members/allMembers/qrcodeMemberPage"));
const ViewServices = React.lazy(() => import("./attendance/programs/viewServices"));
const Qrcode = React.lazy(() => import("./qrcode/qrcode"));

// Private Route Component
interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const token = useSelector((state: RootState) => state?.auth?.authData?.token);
  
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
          <Route path="/followups" element={<FollowUpQrcodepage />} />
          <Route path="/members" element={<MemberQrcodepage />} />
          <Route path="/church-settings" element={<ChangeColorButton />} />

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
          <Route path="/manage/view-departments" element={
            <PrivateRoute>
              <ViewDepartment/>
            </PrivateRoute>
          } />        
           <Route path="/manage/view-units" element={
            <PrivateRoute>
              <ViewUnit/>
            </PrivateRoute>
          } />
          <Route path="/messages" element={
            <PrivateRoute>
              <ViewMessageHistory/>
            </PrivateRoute>
          } />
          <Route path="/members/view-workers" element={
            <PrivateRoute>
              <ViewMember />
            </PrivateRoute>
          } />
          <Route path="/members/view/:memberId" element={
            <PrivateRoute>
              <ViewSingleMember />
            </PrivateRoute>
          } />
          <Route path="/members/view-followup" element={
            <PrivateRoute>
              <ViewFollowUp/>
            </PrivateRoute>
          } />           
          <Route path="/members/view-forms" element={
            <PrivateRoute>
              <ViewNewcomersForm/>
            </PrivateRoute>
          } /> 
          <Route path="/programs" element={
            <PrivateRoute>
              <ViewServices/>
            </PrivateRoute>
          } />
           <Route path="/qrcodes" element={
            <PrivateRoute>
              <Qrcode/>
            </PrivateRoute>
          } />
           <Route path="/verify-email" element={
            <EmailVerification/>
          } />
           <Route path="/church/settings" element={
            <PrivateRoute>
              <ViewChurch/>
            </PrivateRoute>
          } />

          {/* Redirect to Dashboard if no match */}

          {/* Fallback Route */}
          <Route path="*" element={<NotFoundPage/>} />
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

