// src/pages/ManageChurches.tsx
import React, { useState, useEffect } from "react";
import AdminDashboardManager from "../shared/dashboardManager";
import { Menu, Dialog, Tab, Transition } from "@headlessui/react";
import { HiOutlineXMark } from "react-icons/hi2";
import { MoreVert } from "@mui/icons-material";
import Api from "../shared/api/api";

interface Church {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  smsActive: boolean;
  isHeadQuarter: boolean;
  subscriptionEndDate: string | null;
  subscriptionId: string | null;
  createdAt: string;
  branchCount: string;
  totalMemberCount: string;
  workerCount: string;
  subscription: any | null;
}

interface ApiResponse {
  message: string;
  counts: {
    total: number;
    active: number;
    inactive: number;
    smsInactive: number;
    subscriptionExpired: number;
  };
  data: Church[];
}

const ManageChurches: React.FC = () => {
  const [churches, setChurches] = useState<Church[]>([]);
  const [counts, setCounts] = useState<ApiResponse["counts"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [churchToDisable, setChurchToDisable] = useState<Church | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionType, setActionType] = useState<"sms-enable"|"sms-disable"|"church-enable"|"church-disable"|null>(null);

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const response = await Api.get("/admin/all-church");
      if (!response.data) throw new Error("Failed to fetch churches");
      const data: ApiResponse = await response.data;
      setChurches(data.data);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredChurches = churches.filter((church) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return church.isActive;
    if (statusFilter === "inactive") return !church.isActive;
    return true;
  });

  const handleToggleStatus = async (church: Church, type: string) => {
    try {
      let payload: any = {};

      if (type === "sms-enable") payload.sms = true;
      if (type === "sms-disable") payload.sms = false;
      if (type === "church-enable") payload.active = true;
      if (type === "church-disable") payload.active = false;

      await Api.patch(`/admin/activate-church/${church.id}`, payload);

      await fetchChurches();
      setChurchToDisable(null);
      setActionType(null);
      setConfirmName("");

    } catch (e) {
      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <AdminDashboardManager>
        <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading churches...</p>
          </div>
        </div>
      </AdminDashboardManager>
    );
  }

  if (error) {
    return (
      <AdminDashboardManager>
        <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <button onClick={fetchChurches} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">
              Retry
            </button>
          </div>
        </div>
      </AdminDashboardManager>
    );
  }

  return (
    <AdminDashboardManager>
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Churches</h1>
            <p className="text-gray-600 mt-1">View and manage all registered churches</p>
          </div>
        </div>

        {/* Stats Cards */}
        {counts && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{counts.total}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{counts.active}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-red-600">{counts.inactive}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">SMS Inactive</p>
              <p className="text-2xl font-bold text-yellow-600">{counts.smsInactive}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Subscription Expired</p>
              <p className="text-2xl font-bold text-orange-600">{counts.subscriptionExpired}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Church Name", "Address", "Status", "SMS", "Branches", "Created", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredChurches.map((church) => (
                  <tr key={church.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{church.name}</span>
                        {church.isHeadQuarter && (
                          <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            HQ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{church.address}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-4 py-1.5 text-xs font-semibold rounded-full ${
                          church.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {church.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-4 py-1.5 text-xs font-semibold rounded-full ${
                          church.smsActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {church.smsActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700">{church.branchCount}</td>                
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(church.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-2 rounded-lg hover:bg-gray-100 transition">
                          <MoreVert className="text-lg text-gray-500" />
                        </Menu.Button>
                        <Transition
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-xl shadow-lg border border-gray-200 focus:outline-none z-20">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setSelectedChurch(church)}
                                  className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                                    active ? "bg-gray-50" : ""
                                  } text-gray-700`}
                                >
                                  View Details
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => {
                                    if (church.smsActive) {
                                      setActionType("sms-disable");
                                      setChurchToDisable(church);
                                    } else {
                                      handleToggleStatus(church, "sms-enable");
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                                    active ? "bg-red-50" : ""
                                  } ${church.smsActive ? "text-red-600" : "text-green-600"}`}
                                >
                                  {church.smsActive ? "Disable SMS" : "Enable SMS"}
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => {
                                    if (church.isActive) {
                                      setActionType("church-disable");
                                      setChurchToDisable(church);
                                    } else {
                                      handleToggleStatus(church, "church-enable");
                                    }
                                  }}
                                  className={`w-full text-left px-4 py-3 text-sm font-medium transition ${
                                    active ? "bg-red-50" : ""
                                  } ${church.isActive ? "text-red-600" : "text-green-600"}`}
                                >
                                  {church.isActive ? "Disable Church" : "Enable Church"}
                                </button>
                              )}
                            </Menu.Item>
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
            <Dialog.Panel className="w-full max-w-4xl bg-white max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <Dialog.Title className="text-2xl font-bold text-gray-900">
                    Church Details
                  </Dialog.Title>
                  <p className="text-sm text-gray-600 mt-1">
                    View detailed information about {selectedChurch?.name}
                  </p>
                </div>
                <button onClick={() => setSelectedChurch(null)} className="text-gray-500 hover:text-gray-700">
                  <HiOutlineXMark className="text-2xl" />
                </button>
              </div>

              <Tab.Group>
                <div className="flex justify-center mt-2">
                  <Tab.List className="flex bg-gray-100 rounded-full p-1 overflow-hidden">
                    {["Info", "Status"].map((tab) => (
                      <Tab key={tab}>
                        {({ selected }) => (
                          <button
                            className={`flex-1 px-6 py-3 text-sm font-medium transition-all rounded-full ${
                              selected
                                ? "bg-white text-purple-600 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
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
                        <p className="text-sm text-gray-500">Church Name</p>
                        <p className="text-xl font-semibold text-gray-900">{selectedChurch?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="text-xl font-medium text-gray-900">{selectedChurch?.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Branches</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedChurch?.branchCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Members</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {parseInt(selectedChurch?.totalMemberCount || "0").toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Workers</p>
                        <p className="text-2xl font-bold text-gray-900">{selectedChurch?.workerCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created</p>
                        <p className="text-xl font-medium text-gray-900">
                          {selectedChurch?.createdAt && new Date(selectedChurch.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Church Type</p>
                        <span className={`inline-flex px-4 py-2 text-sm font-medium rounded-full ${
                          selectedChurch?.isHeadQuarter
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {selectedChurch?.isHeadQuarter ? "Headquarters" : "Branch"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`inline-flex px-4 py-2 text-sm font-medium rounded-full ${
                          selectedChurch?.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {selectedChurch?.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* === STATUS TAB === */}
                  <Tab.Panel className="space-y-8">
                    <h3 className="text-xl font-semibold text-gray-900">Activation Status</h3>
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-gray-900">SMS Services</p>
                          <p className="text-sm text-gray-500">
                            {selectedChurch?.smsActive ? "SMS messaging enabled" : "SMS messaging not configured"}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium ${
                          selectedChurch?.smsActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {selectedChurch?.smsActive ? "Activated" : "Not Activated"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-gray-900">Church Status</p>
                          <p className="text-sm text-gray-500">
                            {selectedChurch?.isActive ? "Church is currently active" : "Church is currently disabled"}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium ${
                          selectedChurch?.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-600"
                        }`}>
                          {selectedChurch?.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-medium text-gray-900">Subscription</p>
                          <p className="text-sm text-gray-500">
                            {selectedChurch?.subscription ? `Expires: ${selectedChurch.subscriptionEndDate}` : "No active subscription"}
                          </p>
                        </div>
                        <span className={`inline-flex px-6 py-3 rounded-full text-sm font-medium ${
                          selectedChurch?.subscription
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {selectedChurch?.subscription ? "Active" : "No Subscription"}
                        </span>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </Dialog.Panel>
          </div>
        </Dialog>

        {/* ================== DISABLE/ENABLE CONFIRMATION ================== */}
        <Dialog open={!!churchToDisable} onClose={() => {
          setChurchToDisable(null);
          setConfirmName("");
          setActionType(null);
        }} className="relative z-50">
          <div className="fixed inset-0 bg-black/40" />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                {actionType === "sms-disable" && `Disable ${churchToDisable?.name} SMS?`}
                {actionType === "church-disable" && `Disable ${churchToDisable?.name}?`}
              </Dialog.Title>

              <p className="mt-3 text-gray-600">
                Type the church name to confirm this action:
              </p>

              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={churchToDisable?.name}
                className="mt-4 w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-red-500 outline-none"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setChurchToDisable(null);
                    setConfirmName("");
                    setActionType(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  disabled={confirmName.trim() !== churchToDisable?.name?.trim()}
                  onClick={() => handleToggleStatus(churchToDisable!, actionType!)}
                  className={`px-6 py-3 rounded-xl transition text-white 
                    ${
                      confirmName.trim() === churchToDisable?.name?.trim()
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-red-300 cursor-not-allowed"
                    }
                  `}
                >
                  Confirm {actionType?.includes("disable") ? "Disable" : "Enable"}
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