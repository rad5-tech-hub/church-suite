import React from "react";
import AdminDashboardManager from "../shared/dashboardManager";
import { FiSearch, FiEye } from "react-icons/fi";

const SupportCenter: React.FC = () => {
  return (
    <AdminDashboardManager>
      <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Support Center
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage church support tickets and inquiries
          </p>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Open Tickets */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-red-500 flex flex-col gap-5">
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Open Tickets</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Awaiting response</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-blue-500 flex flex-col gap-5">
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">In Progress</p>
            </div>            
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">2</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Being handled</p>
            </div>
          </div>

          {/* Resolved */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border-l-4 border-green-500 flex flex-col gap-5">
            <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Resolved</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">1</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">This week</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All Support Tickets</h2>
          <div className="flex gap-3 w-full sm:w-auto">
            <select className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>All Status</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Resolved</option>
            </select>
            <select className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option>All Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <button className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <FiSearch className="text-lg text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage and respond to church support requests
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {["Church", "Subject", "Category", "Priority", "Status", "Date", "Actions"].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { church: "Grace Assembly", subject: "SMS not sending to members", category: "Technical", priority: "High", status: "open", date: "2025-11-03 14:30" },
                  { church: "Victory Chapel", subject: "Need help with branch setup", category: "Setup", priority: "Medium", status: "in-progress", date: "2025-11-03 10:15" },
                  { church: "Faith Centre", subject: "Billing inquiry - subscription upgrade", category: "Billing", priority: "Low", status: "resolved", date: "2025-11-02 16:45" },
                  { church: "Pentecost International", subject: "Unable to export member reports", category: "Technical", priority: "Medium", status: "open", date: "2025-11-02 09:20" },
                  { church: "Living Word Church", subject: "Request for training session", category: "Training", priority: "Low", status: "open", date: "2025-11-01 11:00" },
                  { church: "Blessed Hope Ministry", subject: "Wallet funding not reflecting", category: "Financial", priority: "High", status: "in-progress", date: "2025-11-01 08:30" },
                ].map((ticket, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">{ticket.church}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{ticket.subject}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {ticket.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        ticket.priority === "High" ? "text-red-600 dark:text-red-400" :
                        ticket.priority === "Medium" ? "text-orange-600 dark:text-orange-400" :
                        "text-green-600 dark:text-green-400"
                      }`}>
                        ▲ {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        ticket.status === "open" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                        ticket.status === "in-progress" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}>
                        {ticket.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{ticket.date}</td>
                    <td className="px-6 py-4">
                      <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium text-sm flex items-center gap-1">
                        <FiEye className="text-lg" />
                        View
                      </button>
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

export default SupportCenter;