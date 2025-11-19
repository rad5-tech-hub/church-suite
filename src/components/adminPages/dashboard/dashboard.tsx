import React from "react";
import AdminDashboardManager from "../shared/dashboardManager";
import { BsGraphUpArrow, BsChatSquareText, BsCurrencyDollar } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";
import { LuChurch, LuClock } from "react-icons/lu";

const AdminDashboard: React.FC = () => {
  return (
    <AdminDashboardManager>
      <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Monitor and manage all ChurchSet activities
            </p>
          </div>
          <button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-full font-medium hover:shadow-lg transition-all hover:scale-105">
            <FiDownload className="text-lg" />
            Export Report
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {/* Total Registered Churches */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <LuChurch className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Total Registered Churches</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">47</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">↑ +12% from last month</p>
          </div>

          {/* Active Churches */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                    <BsGraphUpArrow className="text-2xl text-green-600 dark:text-green-400" />
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Active Churches</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">42</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">↑ +8% from last month</p>
          </div>

          {/* Pending Activations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                    <LuClock className="text-2xl text-orange-600 dark:text-orange-400" />
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Pending Activations</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">5</p>
          </div>

          {/* Total Wallet Funding */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <BsCurrencyDollar className="text-2xl text-purple-600 dark:text-purple-400" />
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Total Wallet Funding</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₦8.8M</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">↑ +23% from last month</p>
          </div>

          {/* Total SMS Sent */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                    <BsChatSquareText className="text-2xl text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Total SMS Sent</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">125,430</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">↑ +15% from last month</p>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <BsCurrencyDollar className="text-2xl text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Monthly Revenue</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₦2.34M</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-2">↑ +18% from last month</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Church Growth & Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Church Growth & Revenue</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly trend analysis</p>
            <div className="mt-6 h-64 flex items-end justify-between gap-4">
              {[20, 35, 42, 48, 52, 58].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all"
                    style={{ height: `${height * 3}px` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-600 rounded-full" /> Churches</span>
              <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-full" /> Revenue</span>
            </div>
          </div>

          {/* SMS Usage Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SMS Usage Trend</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Messages sent per month</p>
            <div className="mt-6 h-64 flex items-end justify-between gap-3">
              {[180000, 220000, 250000, 320000, 350000, 310000].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-400 to-indigo-600 rounded-t-lg transition-all"
                    style={{ height: `${(val / 400000) * 220}px` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activities</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latest actions across all churches</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Church</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { church: "Grace Assembly", action: "New church registered", time: "2 hours ago", status: "pending" },
                  { church: "Victory Chapel", action: "Wallet funded - ₦50,000", time: "5 hours ago", status: "completed" },
                  { church: "Faith Centre", action: "SMS activated", time: "1 day ago", status: "completed" },
                  { church: "Pentecost International", action: "Subscription renewed", time: "1 day ago", status: "completed" },
                  { church: "Living Word Church", action: "New church registered", time: "2 days ago", status: "pending" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{row.church}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{row.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{row.time}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        row.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminDashboardManager>
  );
};

export default AdminDashboard;