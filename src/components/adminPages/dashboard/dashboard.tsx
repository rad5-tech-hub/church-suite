import React, { useEffect, useState } from "react";
import AdminDashboardManager from "../shared/dashboardManager";
import { BsGraphUpArrow, BsCurrencyDollar, BsGraphDownArrow } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";
import { LuChurch, LuClock } from "react-icons/lu";
import Api from "../shared/api/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardCounts {
  total: number;
  active: number;
  inactive: number;
  smsInactive: number;
  subscriptionExpired: number;
}

interface ChurchData {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

interface RevenueData {
  totalThisMonth: number;
  totalLastMonth: number;
  percentageChange: number;
  walletThisMonth?: number;
  walletLastMonth?: number;
  walletPercentageChange?: number;
}

interface SmsData {
  totalThisMonth: number;
  totalLastMonth: number;
  percentageChange: number;
}

interface GrowthChartData {
  month: string;
  churches: number;
  revenue: number;
}

interface SmsChartData {
  month: string;
  messages: number;
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [revenue, setRevenue] = useState<RevenueData | null>(null);
  const [smsData, setSmsData] = useState<SmsData | null>(null);
  const [recentChurches, setRecentChurches] = useState<ChurchData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthChartData[]>([]);
  const [smsChartData, setSmsChartData] = useState<SmsChartData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const errorList: string[] = [];

      try {
        const churchRes = await Api.get("/admin/all-church");
        setCounts(churchRes.data.counts || null);
        setRecentChurches(churchRes.data.data?.slice(0, 10) || []);
      } catch (err) {
        errorList.push("Failed to load church data");
        console.error("Church API error:", err);
      }

      try {
        const revenueRes = await Api.get("/admin/revenue");
        const rev = revenueRes.data.data || null;
        setRevenue(rev);

        const chartData = revenueRes.data.chartData;
        setGrowthData(Array.isArray(chartData) && chartData.length > 0 ? chartData : []);
      } catch (err) {
        errorList.push("Failed to load revenue data");
        console.error("Revenue API error:", err);
        setGrowthData([]);
      }

      try {
        const smsRes = await Api.get("/admin/sms-count");
        const sms = smsRes.data.data || null;
        setSmsData(sms);

        const chartData = smsRes.data.chartData;
        setSmsChartData(Array.isArray(chartData) && chartData.length > 0 ? chartData : []);
      } catch (err) {
        errorList.push("Failed to load SMS data");
        console.error("SMS API error:", err);
        setSmsChartData([]);
      }

      setErrors(errorList);
      setLoading(false);
    };

    fetchAllData();
  }, []);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;
  const formatNumber = (num: number) => num.toLocaleString();

  if (loading) {
    return (
      <AdminDashboardManager>
        <div className="p-6 flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminDashboardManager>
    );
  }

  const hasNoData = !counts || (counts.total === 0 && (!revenue || revenue.totalThisMonth === 0));

  return (
    <AdminDashboardManager>
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

        {/* Global Empty State - When Nothing Has Started */}
        {hasNoData && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-10 text-center">
            <div className="max-w-2xl mx-auto">
              <LuChurch className="text-7xl text-purple-600 dark:text-purple-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to ChurchSet Admin Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                Your platform is ready and waiting for churches to join. Once registrations begin,
                revenue flows in, and SMS messages are sent — all analytics will appear here automatically.
              </p>
              <div className="mt-8">
                <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-4 rounded-full transition transform hover:scale-105 shadow-lg">
                  <FiDownload className="inline mr-2" />
                  Start Onboarding Churches
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errors.length > 0 && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-300 text-sm font-medium">
              Warning: Some data failed to load: {errors.join(", ")}
            </p>
          </div>
        )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <StatCard
            icon={<LuChurch className="text-2xl text-blue-600 dark:text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            label="Total Registered Churches"
            value={counts?.total ?? 0}
          />
          <StatCard
            icon={<BsGraphUpArrow className="text-2xl text-green-600 dark:text-green-400" />}
            iconBg="bg-green-100 dark:bg-green-900/30"
            label="Active Churches"
            value={counts?.active ?? 0}
          />
          <StatCard
            icon={<BsGraphDownArrow className="text-2xl text-orange-600 dark:text-orange-400" />}
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            label="Inactive Churches"
            value={counts?.inactive ?? 0}
          />
          <StatCard
            icon={<LuClock className="text-2xl text-yellow-600 dark:text-yellow-400" />}
            iconBg="bg-yellow-100 dark:bg-yellow-900/30"
            label="Pending SMS Activation"
            value={counts?.smsInactive ?? 0}
          />
          <StatCard
            icon={<BsCurrencyDollar className="text-2xl text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            label="Revenue This Month"
            value={formatCurrency(revenue?.totalThisMonth ?? 0)}
            change={revenue?.percentageChange}
          />
          <StatCard
            icon={<BsGraphUpArrow className="text-2xl text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            label="SMS Sent This Month"
            value={formatNumber(smsData?.totalThisMonth ?? 0)}
            change={smsData?.percentageChange}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Church Growth & Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Church Growth & Revenue Trend
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Monthly churches registered and revenue earned
            </p>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#f9fafb" }}
                    formatter={(value: number, name: string) => name === "revenue" ? formatCurrency(value) : value}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="churches" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} name="Churches" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} name="Revenue (₦)" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <BsGraphUpArrow className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No growth data yet</p>
                  <p className="text-xs text-gray-400 mt-1">Data will appear after first church registrations</p>
                </div>
              </div>
            )}
          </div>

          {/* SMS Usage Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              SMS Usage Trend
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Total messages sent per month
            </p>
            {smsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={smsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#f9fafb" }}
                    formatter={(value: number) => formatNumber(value)}
                  />
                  <Bar dataKey="messages" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <LuClock className="text-3xl text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No SMS activity</p>
                  <p className="text-xs text-gray-400 mt-1">Messages will appear when churches start sending</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activities
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Latest actions across all churches
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Church
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentChurches.length > 0 ? (
                  recentChurches.map((church) => (
                    <tr
                      key={church.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">
                        {church.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        New church registered
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(church.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                            church.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {church.isActive ? "completed" : "pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      No recent activities
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminDashboardManager>
  );
};

// Reusable Stat Card
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  change?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, change }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition hover:shadow-md">
    <div className={`p-3 ${iconBg} rounded-xl w-fit mb-4`}>{icon}</div>
    <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
    {change !== undefined && change !== 0 && (
      <p className={`text-sm mt-2 font-medium ${change > 0 ? "text-green-600" : "text-red-600"}`}>
        {change > 0 ? "↑" : "↓"} {Math.abs(change)}% vs last month
      </p>
    )}
  </div>
);

export default AdminDashboard;