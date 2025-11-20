import React from "react";
import AdminDashboardManager from "../shared/dashboardManager";
import  {LuCircleCheck, LuCircleX, LuChurch } from "react-icons/lu";

const ActivationCenter: React.FC = () => {
  return (
    <AdminDashboardManager>
      <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Activation Center
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Review and approve pending activations
          </p>
        </div>

        {/* Activation Requests */}
        <div className="space-y-6">
          {/* Grace Assembly */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                  <LuChurch className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grace Assembly</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Registered on <span className="font-medium">2025-10-28</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Contact: <span className="font-medium">+234 801 234 5678</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SMS Activation */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Activation</span>
                    <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                      pending
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Sender Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">GraceAsm</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleCheck className="text-lg" /> Approve SMS
                    </button>
                    <button className="flex items-center gap-2 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleX className="text-lg" /> Reject
                    </button>
                  </div>
                </div>

                {/* Wallet Activation */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Activation</span>
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                      approved
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Banking Details</p>
                      <p className="font-medium text-green-600 dark:text-green-400">Verified & Ready</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Living Word Church */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                  <LuChurch className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Living Word Church</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Registered on <span className="font-medium">2025-11-01</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Contact: <span className="font-medium">+234 802 345 6789</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SMS */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Activation</span>
                    <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                      pending
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sender Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">LivingWord</p>
                  <div className="mt-4 flex gap-3">
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleCheck className="text-lg" /> Approve SMS
                    </button>
                    <button className="flex items-center gap-2 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleX className="text-lg" /> Reject
                    </button>
                  </div>
                </div>

                {/* Wallet */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Activation</span>
                    <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                      pending
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Banking Details</p>
                  <p className="font-medium text-gray-900 dark:text-white">Awaiting Verification</p>
                  <div className="mt-4 flex gap-3">
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleCheck className="text-lg" /> Approve Wallet
                    </button>
                    <button className="flex items-center gap-2 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleX className="text-lg" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blessed Hope Ministry */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                  <LuChurch className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Blessed Hope Ministry</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Registered on <span className="font-medium">2025-11-02</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Contact: <span className="font-medium">+234 803 456 7890</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SMS */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SMS Activation</span>
                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                      approved
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sender Name</p>
                  <p className="font-medium text-green-600 dark:text-green-400">BlessedHope</p>
                </div>

                {/* Wallet */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wallet Activation</span>
                    <span className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                      pending
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Banking Details</p>
                  <p className="font-medium text-gray-900 dark:text-white">Verified & Ready</p>
                  <div className="mt-4 flex gap-3">
                    <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleCheck className="text-lg" /> Approve Wallet
                    </button>
                    <button className="flex items-center gap-2 border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-5 py-2.5 rounded-xl font-medium transition">
                      <LuCircleX className="text-lg" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardManager>
  );
};

export default ActivationCenter;