import React from "react";
import DashboardManager from "../../shared/dashboardManager";

// Component Code
const Dashboard: React.FC = () => {
  return (
    <DashboardManager>
      <div className="p-6">            
        {/* Feature Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#4d4d4e8e] shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800">Members</h2>
            <p className="text-gray-600">Manage church members and their details.</p>
          </div>
          <div className="bg-[#4d4d4e8e] shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800">Events</h2>
            <p className="text-gray-600">Plan and manage church events.</p>
          </div>
          <div className="bg-[#4d4d4e8e] shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800">Donations</h2>
            <p className="text-gray-600">Track and manage donations.</p>
          </div>
        </div>
      </div>
    </DashboardManager>
  );
};

export default Dashboard;