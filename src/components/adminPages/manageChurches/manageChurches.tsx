// src/pages/ManageChurches.tsx
import React, { useState } from "react";
import AdminDashboardManager from "../shared/dashboardManager";
import { Menu, Dialog, Tab, Transition } from "@headlessui/react";
import { HiOutlineXMark} from "react-icons/hi2";
import { MoreVert } from "@mui/icons-material";

interface Church {
  id: number;
  name: string;
  hq: boolean;
  location: string;
  status: "active" | "pending" | "disabled";
  balance: string;
  plan: "Premium" | "Standard" | "Basic";
  branches: number;
  members: number;
  smsActivated: boolean;
  walletActivated: boolean;
  subscriptionActive: boolean;
}

const churches: Church[] = [
  { id: 1, name: "Grace Assembly", hq: true, location: "Lagos, Nigeria", status: "active", balance: "₦250,000", plan: "Premium", branches: 5, members: 1200, smsActivated: true, walletActivated: true, subscriptionActive: true },
  { id: 2, name: "Victory Chapel", hq: false, location: "Abuja, Nigeria", status: "active", balance: "₦180,000", plan: "Standard", branches: 3, members: 850, smsActivated: true, walletActivated: true, subscriptionActive: true },
  { id: 3, name: "Faith Centre", hq: true, location: "Port Harcourt, Nigeria", status: "active", balance: "₦320,000", plan: "Premium", branches: 8, members: 2100, smsActivated: true, walletActivated: true, subscriptionActive: true },
  { id: 4, name: "Pentecost International", hq: false, location: "Ibadan, Nigeria", status: "active", balance: "₦95,000", plan: "Basic", branches: 2, members: 450, smsActivated: false, walletActivated: true, subscriptionActive: true },
  { id: 5, name: "Living Word Church", hq: false, location: "Enugu, Nigeria", status: "pending", balance: "₦0", plan: "Standard", branches: 1, members: 200, smsActivated: false, walletActivated: false, subscriptionActive: false },
  { id: 6, name: "Blessed Hope Ministry", hq: false, location: "Kano, Nigeria", status: "disabled", balance: "₦45,000", plan: "Basic", branches: 1, members: 180, smsActivated: false, walletActivated: false, subscriptionActive: false },
];

const ManageChurches: React.FC = () => {
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [churchToDisable, setChurchToDisable] = useState<Church | null>(null);
  const [confirmName, setConfirmName] = useState("");

  return (
    <AdminDashboardManager>
      <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Churches</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View and manage all registered churches</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select className="px-5 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>All Status</option>
          </select>
          <select className="px-5 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>All Plans</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {["Church Name", "Location", "Status", "Wallet Balance", "Plan", "Branches", "Members", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {churches.map((church) => (
                  <tr key={church.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900 dark:text-white">{church.name}</span>
                        {church.hq && (
                          <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                            HQ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{church.location}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-4 py-1.5 text-xs font-semibold rounded-full ${
                          church.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : church.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {church.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{church.balance}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-4 py-1.5 text-xs font-medium rounded-full ${
                          church.plan === "Premium"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : church.plan === "Standard"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {church.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">{church.branches}</td>
                    <td className="px-6 py-4 text-center text-gray-700 dark:text-gray-300">{church.members.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                          <MoreVert className="text-lg text-gray-500 dark:text-gray-400" />
                        </Menu.Button>
                        <Transition
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none z-20">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setSelectedChurch(church)}
                                  className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                                    active ? "bg-gray-50 dark:bg-gray-700" : ""
                                  } text-gray-700 dark:text-gray-300`}
                                >
                                  View Details
                                </button>
                              )}
                            </Menu.Item>
                            {church.status !== "disabled" && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => {
                                      setChurchToDisable(church);
                                      setConfirmName("");
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                                      active ? "bg-red-50 dark:bg-red-900/20" : ""
                                    } text-red-600 dark:text-red-400`}
                                  >
                                    Disable Church
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                            {church.status === "disabled" && (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => {
                                      setChurchToDisable(church);
                                      setConfirmName("");
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                                      active ? "bg-red-50 dark:bg-red-900/20" : ""
                                    } text-green-600 dark:text-green-400`}
                                  >
                                    Enable Church
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================== CHURCH DETAILS MODAL ================== */}
        <Dialog open={!!selectedChurch} onClose={() => setSelectedChurch(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-4xl bg-white  max-h-[90vh] overflow-y-auto dark:bg-gray-800 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                    Church Details
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    View detailed information about {selectedChurch?.name}
                  </p>
                </div>
                <button onClick={() => setSelectedChurch(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <HiOutlineXMark className="text-2xl" />
                </button>
              </div>

              <Tab.Group>
                <div className="flex justify-center mt-2">
                    <Tab.List className="flex bg-gray-100 dark:bg-gray-700/50 rounded-full p-1 overflow-hidden">
                        {["Info", "Wallet & Transactions", "Status"].map((tab) => (
                            <Tab key={tab}>
                            {({ selected }) => (
                                <button
                                className={`flex-1 px-6 py-3 text-sm font-medium transition-all rounded-full ${
                                    selected
                                    ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                                >
                                {tab}
                                </button>
                            )}
                            </Tab>
                        ))}
                    </Tab.List>
                </div>

                <Tab.Panels className="p-8">
                  {/* === INFO TAB === */}
                  <Tab.Panel className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Church Name</p>
                        <p className="text-xl font-semibold text-gray-900 dark:text-white">{selectedChurch?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                        <p className="text-xl font-medium text-gray-900 dark:text-white">{selectedChurch?.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Branches</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChurch?.branches}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Members</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChurch?.members.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Subscription Plan</p>
                        <span className="inline-flex px-4 py-2 text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                          {selectedChurch?.plan}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                        <span className="inline-flex px-4 py-2 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          Active
                        </span>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* === WALLET & TRANSACTIONS TAB === */}
                  <Tab.Panel className="space-y-8">
                    <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl">
                      <p className="text-5xl font-bold text-gray-900 dark:text-white">{selectedChurch?.balance}</p>
                      <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Current Wallet Balance</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Transactions</h3>
                      <div className="space-y-4">
                        {[
                          { date: "2025-11-15", desc: "SMS Purchase - 50,000 units", amount: "-₦45,000", status: "completed" },
                          { date: "2025-11-10", desc: "Wallet Top-up", amount: "+₦100,000", status: "completed" },
                          { date: "2025-11-05", desc: "Subscription Renewal", amount: "-₦150,000", status: "completed" },
                        ].map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{t.desc}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t.date}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${t.amount.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                                {t.amount}
                              </p>
                              <span className="text-xs text-gray-500">Completed</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* === STATUS TAB === */}
                  <Tab.Panel className="space-y-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Activation Status</h3>
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">SMS Services</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Sender ID: {selectedChurch?.name.split(" ")[0]}Asm</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium ${
                          selectedChurch?.smsActivated
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {selectedChurch?.smsActivated ? <>Activated</> : "Not Activated"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">Wallet Services</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Bank verified</p>
                        </div>
                        <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium ${
                          selectedChurch?.walletActivated
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                        }`}>
                          {selectedChurch?.walletActivated ? <>Activated</> : "Not Activated"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">Subscription</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedChurch?.plan} Plan Active</p>
                        </div>
                        <span className="inline-flex px-6 py-3 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* ================== DISABLE CONFIRMATION ================== */}
        <Dialog open={!!churchToDisable} onClose={() => setChurchToDisable(null)} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                Disable {churchToDisable?.name}?
              </Dialog.Title>
              <p className="mt-3 text-gray-600 dark:text-gray-400">
                This action cannot be undone. Type the church name to confirm:
              </p>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={churchToDisable?.name}
                className="mt-4 w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setChurchToDisable(null)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  disabled={confirmName !== churchToDisable?.name}
                  onClick={() => {
                    alert(`Church "${churchToDisable?.name}" has been disabled.`);
                    setChurchToDisable(null);
                  }}
                  className="px-6 py-3 bg-red-600 disabled:bg-gray-400 text-white rounded-xl hover:bg-red-700 disabled:cursor-not-allowed transition"
                >
                  Disable Church
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </div>
    </AdminDashboardManager>
  );
};

export default ManageChurches;