import React from "react";
import DashboardManager from "../../shared/dashboardManager";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const memberData = [
  { month: "Jan", members: 400 },
  { month: "Feb", members: 300 },
  { month: "Mar", members: 500 },
  { month: "Apr", members: 600 },
  { month: "May", members: 700 },
];

const donationData = [
  { name: "Tithes", value: 400 },
  { name: "Offerings", value: 300 },
  { name: "Projects", value: 300 },
];

const COLORS = ["#211930", "#F6F4FE", "#777280", "#393939"];

const eventData = [
  { name: "Jan", attendees: 200 },
  { name: "Feb", attendees: 250 },
  { name: "Mar", attendees: 180 },
  { name: "Apr", attendees: 300 },
];

const Dashboard: React.FC = () => {
  return (
    <DashboardManager>
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[rgba(255, 255, 255, 0.06)] shadow-md rounded-lg p-6 border border-[#404040]">
            <h2 className="text-xl font-semibold text-[#F6F4FE]">Members</h2>
            <p className="text-gray-400 mt-2">
              Total church members: <span className="font-bold">1,250</span>
            </p>
          </div>
          <div className="bg-[rgba(255, 255, 255, 0.06)] shadow-md rounded-lg p-6 border border-[#404040]">
            <h2 className="text-xl font-semibold text-[#F6F4FE]">Events</h2>
            <p className="text-gray-400 mt-2">
              Upcoming events: <span className="font-bold">12</span>
            </p>
          </div>
          <div className="bg-[rgba(255, 255, 255, 0.06)] shadow-md rounded-lg p-6 border border-[#404040]">
            <h2 className="text-xl font-semibold text-[#F6F4FE]">Donations</h2>
            <p className="text-gray-400 mt-2">
              Total donations: <span className="font-bold">$45,300</span>
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Members Growth Line Chart */}
          <div className="bg-[rgba(255, 255, 255, 0.06)] shadow-md rounded-lg p-6 border border-[#404040]">
            <h3 className="text-lg font-semibold text-[#F6F4FE] mb-4">
              Members Growth
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={memberData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis dataKey="month" stroke="#F6F4FE" />
                <YAxis stroke="#F6F4FE" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="members"
                  stroke="#211930"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Donations Pie Chart */}
          <div className="bg-[rgba(255, 255, 255, 0.06)] shadow-md rounded-lg p-6 border border-[#404040]">
            <h3 className="text-lg font-semibold text-[#F6F4FE] mb-4">
              Donations Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {donationData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events Bar Chart */}
        <div className="bg-[rgba(255, 255, 255, 0.06)] shadow-md rounded-lg p-6 border border-[#404040]">
          <h3 className="text-lg font-semibold text-[#F6F4FE] mb-4">
            Events Attendance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={eventData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="name" stroke="#F6F4FE" />
              <YAxis stroke="#F6F4FE" />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendees" fill="#F6F4FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardManager>
  );
};

export default Dashboard;
