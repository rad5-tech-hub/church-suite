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
}

interface SmsData {
  totalThisMonth: number;
  totalLastMonth: number;
  percentageChange: number;
}

// Chart data interfaces
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

      // Fetch church data
      try {
        const churchRes = await Api.get("/admin/all-church");
        setCounts(churchRes.data.counts);
        setRecentChurches(churchRes.data.data?.slice(0, 10) || []);
      } catch (err) {
        errorList.push("Failed to load church data");
        console.error("Church API error:", err);
      }

      // Fetch revenue data
      try {
        const revenueRes = await Api.get("/admin/revenue");
        setRevenue(revenueRes.data.data);
        
        // Set growth chart data if available
        if (revenueRes.data.chartData) {
          setGrowthData(revenueRes.data.chartData);
        } else {
          // Fallback sample data
          setGrowthData([
            { month: "Jun", churches: 120, revenue: 450000 },
            { month: "Jul", churches: 180, revenue: 620000 },
            { month: "Aug", churches: 240, revenue: 780000 },
            { month: "Sep", churches: 310, revenue: 920000 },
            { month: "Oct", churches: 380, revenue: 1100000 },
            { month: "Nov", churches: 420, revenue: 1250000 },
          ]);
        }
      } catch (err) {
        errorList.push("Failed to load revenue data");
        console.error("Revenue API error:", err);
      }

      // Fetch SMS data
      try {
        const smsRes = await Api.get("/admin/sms-count");
        setSmsData(smsRes.data.data);
        
        // Set SMS chart data if available
        if (smsRes.data.chartData) {
          setSmsChartData(smsRes.data.chartData);
        } else {
          // Fallback sample data
          setSmsChartData([
            { month: "Jun", messages: 120000 },
            { month: "Jul", messages: 200000 },
            { month: "Aug", messages: 240000 },
            { month: "Sep", messages: 320000 },
            { month: "Oct", messages: 360000 },
            { month: "Nov", messages: 280000 },
          ]);
        }
      } catch (err) {
        errorList.push("Failed to load SMS data");
        console.error("SMS API error:", err);
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
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading churches...</p>
          </div>
        </div>
      </AdminDashboardManager>
    );
  }

  return (
    <AdminDashboardManager>
      <div className="p-6 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Error Banner */}
        {errors.length > 0 && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-300 text-sm font-medium">
              Some data failed to load: {errors.join(", ")}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
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
            icon={<LuClock className="text-2xl text-orange-600 dark:text-orange-400" />}
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            label="Pending SMS Activations"
            value={counts?.smsInactive ?? 0}
          />
          <StatCard
            icon={<BsGraphUpArrow className="text-2xl text-indigo-600 dark:text-indigo-400" />}
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            label="Total SMS Sent"
            value={formatNumber(smsData?.totalThisMonth ?? 0)}
            change={smsData?.percentageChange}
          />
          <StatCard
            icon={<BsCurrencyDollar className="text-2xl text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            label="Monthly Revenue"
            value={formatCurrency(revenue?.totalThisMonth ?? 0)}
            change={revenue?.percentageChange}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Church Growth & Revenue Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Church Growth & Revenue
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Monthly trend analysis
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value: number, name: string) =>
                    name === "revenue" ? formatCurrency(value) : value
                  }
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="churches"
                  stroke="#A78BFA"
                  strokeWidth={3}
                  dot={{ fill: "#A78BFA", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#60A5FA"
                  strokeWidth={3}
                  dot={{ fill: "#60A5FA", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* SMS Usage Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              SMS Usage Trend
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Messages sent per month
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={smsChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#F9FAFB",
                  }}
                  formatter={(value: number) => formatNumber(value)}
                />
                <Bar
                  dataKey="messages"
                  fill="url(#purpleGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
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

// Reusable Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  change?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, iconBg, label, value, change }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className={`p-3 ${iconBg} rounded-xl w-fit`}>{icon}</div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">{label}</p>
    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
    {change !== undefined && (
      <p
        className={`text-sm mt-2 ${
          change >= 0
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
      </p>
    )}
  </div>
);

export default AdminDashboard;