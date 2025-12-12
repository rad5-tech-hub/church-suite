import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoNotificationsOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { TbMenuDeep } from "react-icons/tb";
import { FiLogOut } from "react-icons/fi";
import { LuChevronDown, LuLock } from "react-icons/lu";
import { RootState } from "../../../reduxstore/redux";
import { clearAuth } from "../../../reduxstore/authstore";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Api from "../api/api";

// Custom Popup Function – Works 100% without ToastContainer
const showPopup = (message: string, isError = false) => {
  // Remove any existing popup
  const existing = document.getElementById("custom-popup");
  if (existing) existing.remove();

  // Create new popup
  const popup = document.createElement("div");
  popup.id = "custom-popup";
  popup.textContent = message;
  popup.style.cssText = `
    position: fixed;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: ${isError ? "#ef4444" : "#10b981"};
    color: white;
    padding: 16px 32px;
    border-radius: 16px;
    font-weight: 600;
    font-size: 15px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
    z-index: 99999;
    animation: popupSlide 0.5s ease, popupFade 0.5s ease 3s forwards;
    min-width: 240px;
    text-align: center;
    backdrop-filter: blur(10px);
  `;

  // Inject animation
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes popupSlide {
      from { opacity: 0; transform: translate(-50%, -30px); }
      to { opacity: 1; transform: translateX(-50%); }
    }
    @keyframes popupFade {
      to { opacity: 0; transform: translate(-50%, -40px); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(popup);

  // Auto remove after 3.5 seconds
  setTimeout(() => {
    if (popup && popup.parentElement) popup.remove();
  }, 3500);
};

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const authData = useSelector((state: RootState) => state.auth?.authData);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/admin-dashboard")) return "Dashboard";
    if (path.startsWith("/admin-manage/churches")) return "Manage Churches";
    if (path.startsWith("/billing")) return "Billing & Plans";
    if (path.startsWith("/admin-activations")) return "Activation Center";
    if (path.startsWith("/admin-supports")) return "Support Center";
    if (path.startsWith("/logs")) return "Activity Logs";
    if (path.startsWith("/settings")) return "Settings";
    return "churchset";
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate("/admin-login");
    setIsLogoutDialogOpen(false);
    setIsDropdownOpen(false);
  };

  const openLogoutDialog = () => {
    setIsLogoutDialogOpen(true);
    setIsDropdownOpen(false);
  };

  const openChangePassword = () => {
    setIsChangePassOpen(true);
    setIsDropdownOpen(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showPopup("New password and confirm password do not match", true);
      return;
    }

    if (newPassword.length < 6) {
      showPopup("New password must be at least 6 characters long", true);
      return;
    }

    setLoading(true);
    try {
      await Api.patch("/admin/change-pass", {
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      });

      showPopup("Password changed successfully!");
      setIsChangePassOpen(false);

      // Reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOld(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        "Failed to change password. Please try again.";

      showPopup(msg, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="w-full h-16 bg-white text-gray-800 border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            className="text-2xl text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition lg:hidden"
            onClick={toggleSidebar}
          >
            <TbMenuDeep />
          </button>
          <h2 className="text-xl font-semibold text-gray-900 hidden sm:block">
            {getPageTitle()}
          </h2>
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
            <IoNotificationsOutline className="text-2xl text-gray-600" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition-all duration-200"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {authData?.name?.charAt(0).toUpperCase() || "CS"}
              </div>
              <div className="hidden lg:flex items-center gap-1">
                <span className="font-medium text-gray-800">{authData?.name}</span>
                <LuChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20">
                  <div className="px-4 py-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-b border-gray-200">
                    <p className="font-semibold text-gray-900">{authData?.name}</p>
                    <p className="text-sm text-gray-600">{authData?.email}</p>
                  </div>

                  <button
                    onClick={openChangePassword}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LuLock className="text-lg" />
                    <span>Change Password</span>
                  </button>

                  <button
                    onClick={openLogoutDialog}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut className="text-lg" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* LOGOUT DIALOG */}
      <Transition appear show={isLogoutDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsLogoutDialogOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-10" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Confirm Logout
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to log out? You will need to sign in again to access your account.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsLogoutDialogOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                      onClick={handleLogout}
                    >
                      Yes, Log Out
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* CHANGE PASSWORD MODAL */}
      <Transition appear show={isChangePassOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                  <Dialog.Title className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
                    <LuLock className="text-purple-600 text-3xl" />
                    Change Password
                  </Dialog.Title>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showOld ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOld(!showOld)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showOld ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showNew ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none ${
                            confirmPassword && newPassword !== confirmPassword ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showConfirm ? <IoEyeOffOutline className="w-5 h-5" /> : <IoEyeOutline className="w-5 h-5" />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      onClick={() => setIsChangePassOpen(false)}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={
                        loading ||
                        !oldPassword ||
                        !newPassword ||
                        !confirmPassword ||
                        newPassword !== confirmPassword
                      }
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium transition flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Changing...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Header;