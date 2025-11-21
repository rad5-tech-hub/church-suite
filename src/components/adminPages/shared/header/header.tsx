import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { IoNotificationsOutline } from "react-icons/io5";
import { TbMenuDeep } from "react-icons/tb";
import { FiLogOut } from "react-icons/fi";
import { LuChevronDown } from "react-icons/lu";
import { RootState } from "../../../reduxstore/redux";
import { clearAuth } from "../../../reduxstore/authstore";
import { useDispatch, useSelector } from "react-redux";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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

  return (
    <>
      <header className="w-full h-16 bg-white text-gray-800 border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30">
        {/* Left: Mobile Menu + Title */}
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

        {/* Right: Notifications + Profile */}
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

            {/* Dropdown Menu */}
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

      {/* ===== CONFIRMATION DIALOG ===== */}
      <Transition appear show={isLogoutDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsLogoutDialogOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-10" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
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
                      type="button"
                      className="inline-flex justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      onClick={() => setIsLogoutDialogOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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
    </>
  );
};

export default Header;