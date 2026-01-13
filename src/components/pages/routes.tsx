import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../reduxstore/redux";
import NotFoundPage from "./notFound";
import EmailVerification from "./setupAccount/verify-email/otp";

// Lazy-loaded components
const Login = React.lazy(() => import("./login/login"));
const SetupChurch = React.lazy(() => import("./setupAccount/createChurch/setupstep1"));
const ViewChurch = React.lazy(() => import("./churchSettings/viewChurch"));
const SetupStep2 = React.lazy(() => import("./setupAccount/churchLogo/setupstep2"));
const Dashboard = React.lazy(() => import("./dashboard/dashboard"));
const AdminDashboard = React.lazy(() => import("../adminPages/dashboard/dashboard"));
const AdminSupports = React.lazy(() => import("../adminPages/supports/supports"));
const AdminActivation = React.lazy(() => import("../adminPages/activations/activation"));
const AdminManagingChurches = React.lazy(() => import("../adminPages/manageChurches/manageChurches"));
const ViewBranches = React.lazy(() => import("./manage/branch/viewBranches"));
const ViewDepartment = React.lazy(() => import("./manage/department/viewDepartment"));
const ViewWorker = React.lazy(() => import("./members/allMembers/viewMembers"));
const ViewMember = React.lazy(() => import("./members/non-workerMembers/viewMembers"));
const ViewNewcomersForm = React.lazy(() => import("./members/viewNewcomersForms/viewforms"));
const ViewSingleMember = React.lazy(() => import("./members/singleMember/viewSingleMember"));
const ViewFollowUp = React.lazy(() => import("./members/new-comers/viewFollowUp"));
const ViewUnit = React.lazy(() => import("./manage/unit/viewUnit"));
const ViewAdmin = React.lazy(() => import("./manage/admin/viewAdmin"));
const ViewRole = React.lazy(() => import("./manage/role/viewRole"));
const ViewARole = React.lazy(() => import("./manage/role/viewArole"));
const CreateAccount = React.lazy(() => import("./setupAccount/createAccount/createAccount"));
const ResetPassword = React.lazy(() => import("./reset-password/resetPassword"));
const SettingProfile = React.lazy(() => import("./profile/userProfile"));
const FinanceCollections = React.lazy(() => import("./finance/collection/viewCollections"));
const ViewReports = React.lazy(() => import("./reports/viewReports"));
const ViewAReports = React.lazy(() => import("./reports/viewAReport"));
const FinanceWallets = React.lazy(() => import("./messages/wallet/viewWallet"));
const FinanceAccounts = React.lazy(() => import("./finance/finAccount/viewFinAccount"));
const ViewMessageHistory = React.lazy(()=>import('./messages/viewMessage/viewMessage'));
const FollowUpQrcodepage = React.lazy(() => import("./members/new-comers/qrcodePageFollowUp"));
const MemberQrcodepage = React.lazy(() => import("./members/allMembers/qrcodeMemberPage"));
const ViewServices = React.lazy(() => import("./attendance/programs/viewServices"));
const Qrcode = React.lazy(() => import("./qrcode/qrcode"));

// Private Route Component
interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[]; 
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredPermissions  }) => {
 const authData = useSelector((state: RootState) => state.auth.authData);
 

  // If not logged in, redirect to login
  if (!authData?.token) {
    return <Navigate to="/" replace />;
  }

  if (authData.role === "support") {
    return <Navigate to="/admin-login" replace />;
  }

  // If permissions are required, check if user has at least one
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = authData.permission?.some((p: string) =>
      requiredPermissions.includes(p)
    );
    if (!hasPermission) {
      // Optional: redirect to dashboard or show "Not Authorized" page
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/admin-login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/setup-church" element={<SetupChurch />} />
          <Route path="/setup-logo" element={<SetupStep2 />} />
          <Route path="/admin-account" element={<CreateAccount />} />  
          <Route path="/followups" element={<FollowUpQrcodepage />} />
          <Route path="/members" element={<MemberQrcodepage />} />        
          <Route path="/admin-dashboard" element={<PrivateRoute><AdminDashboard /> </PrivateRoute> } />
          <Route path="/admin-supports" element={<PrivateRoute> <AdminSupports /></PrivateRoute> } />
          <Route path="/admin-activations" element={<PrivateRoute> <AdminActivation /> </PrivateRoute> } />
          <Route path="/admin-manage/churches" element={<PrivateRoute> <AdminManagingChurches /> </PrivateRoute> } />

          {/* Private Routes */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/profile" element={
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
          <Route path="/manage/view-roles" element={
            <PrivateRoute>
              <ViewRole/>
            </PrivateRoute>
          } />
          <Route path="/manage/view-role/:roleId" element={
            <PrivateRoute>
              <ViewARole/>
            </PrivateRoute>
          } />       
          <Route path="/messages/sms" element={
            <PrivateRoute>
              <ViewMessageHistory/>
            </PrivateRoute>
          } />
          <Route path="/messages/wallets" element={
            <PrivateRoute>
              <FinanceWallets/>
            </PrivateRoute>
          } />
          <Route path="/members/view-workers" element={
            <PrivateRoute>
              <ViewWorker />
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
          <Route path="/finance/collections" element={
            <PrivateRoute>
              <FinanceCollections/>
            </PrivateRoute>
          } />
          <Route path="/finance/accounts" element={
            <PrivateRoute>
              <FinanceAccounts/>
            </PrivateRoute>
          } />
          <Route path="/programs" element={
            <PrivateRoute>
              <ViewServices/>
            </PrivateRoute>
          } />
          <Route path="/reports" element={
            <PrivateRoute>
              <ViewReports/>
            </PrivateRoute>
          } />
          <Route path="/reports/:reportId" element={
            <PrivateRoute>
              <ViewAReports/>
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
           <Route path="/settings" element={
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

