import React, { useEffect, useState } from "react";
import AdminDashboardManager from "../shared/dashboardManager";
import { LuCircleCheck, LuChurch, LuCircleAlert } from "react-icons/lu";
import { toast, ToastContainer } from "react-toastify";
import Api from "../shared/api/api";

interface Church {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  smsActive: boolean;
  isHeadQuarter: boolean;
  createdAt: string;
  branchCount: string;
  totalMemberCount: string;
  workerCount: string;
}

const ActivationCenter: React.FC = () => {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const res = await Api.get<{ data: Church[] }>("/admin/all-church");
      setChurches(res.data.data);
    } catch (err) {
      toast.error("Failed to load churches");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activateChurch = async (churchId: string) => {
    setProcessingId(churchId);
    try {
      await Api.patch(`/admin/activate-church/${churchId}`, { active: true });
      toast.success("Church activated successfully");
      setChurches(prev =>
        prev.map(c => c.id === churchId ? { ...c, isActive: true } : c)
      );
    } catch (err) {
      toast.error("Failed to activate church");
    } finally {
      setProcessingId(null);
    }
  };

  const activateSms = async (churchId: string) => {
    setProcessingId(churchId);
    try {
      await Api.patch(`/admin/activate-church/${churchId}`, { sms: true });
      toast.success("SMS activated successfully");
      setChurches(prev =>
        prev.map(c => c.id === churchId ? { ...c, smsActive: true } : c)
      );
    } catch (err) {
      toast.error("Failed to activate SMS");
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchChurches();
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <AdminDashboardManager>
        <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activation center...</p>
          </div>
        </div>
      </AdminDashboardManager>);
  }

  return (
    <AdminDashboardManager>
      <ToastContainer/>
      <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Activation Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Activate churches and enable SMS services
          </p>
        </div>

        <div className="space-y-6">
          {churches.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No churches found</p>
          ) : (
            churches.map((church) => (
              <div
                key={church.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                        <LuChurch className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {church.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Registered: {formatDate(church.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {church.address || "No address provided"}
                        </p>
                      </div>
                    </div>

                    {/* Church Status Badge */}
                    <div>
                      {church.isActive ? (
                        <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Activation Controls */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Church Activation */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Church Status
                        </span>
                        {church.isActive ? (
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Activated
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            Not Activated
                          </span>
                        )}
                      </div>

                      {!church.isActive && (
                        <button
                          onClick={() => activateChurch(church.id)}
                          disabled={processingId === church.id}
                          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-xl font-medium transition"
                        >
                          {processingId === church.id ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <LuCircleCheck className="w-5 h-5" />
                          )}
                          Activate Church
                        </button>
                      )}
                    </div>

                    {/* SMS Activation */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          SMS Service
                        </span>
                        {church.smsActive ? (
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Activated
                          </span>
                        ) : church.isActive ? (
                          <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                            Ready to Activate
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                            <LuCircleAlert className="w-4 h-4" />
                            Church must be active first
                          </span>
                        )}
                      </div>

                      {church.isActive && !church.smsActive && (
                        <button
                          onClick={() => activateSms(church.id)}
                          disabled={processingId === church.id}
                          className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-medium transition"
                        >
                          {processingId === church.id ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                          ) : (
                            <LuCircleCheck className="w-5 h-5" />
                          )}
                          Activate SMS
                        </button>
                      )}

                      {church.smsActive && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          SMS service is fully active
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminDashboardManager>
  );
};

export default ActivationCenter;