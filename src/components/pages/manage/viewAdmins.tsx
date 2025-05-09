import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";

const ViewAdmins: React.FC = () => {
  const navigate = useNavigate(); // Initialize useNavigate

  // Example data for admins
  const admins = [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "123-456-7890", isSuperAdmin: true },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "987-654-3210", isSuperAdmin: false },
    { id: 3, name: "Michael Brown", email: "michael@example.com", phone: "456-789-1230", isSuperAdmin: false },
  ];

  return (
    <DashboardManager>
      <div className="p-6 bg-gray-100 min-h-screen">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">All Admins</h1>
            <p className="mt-4 text-gray-600">View and manage all admin accounts.</p>
          </div>
          <div className="flex gap-4">
            {/* Create Admin Button */}
            <button
              onClick={() => navigate("/manage-church/admin")}
              className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-sm font-semibold text-gray-100"
            >
              Create Admin
            </button>
          </div>
        </div>

        {/* Admins Table */}
        <div className="mt-6 rounded-lg shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-700">
                  <th className="px-6 py-3 border-b">Name</th>
                  <th className="px-6 py-3 border-b">Email</th>
                  <th className="px-6 py-3 border-b">Phone</th>
                  <th className="px-6 py-3 border-b">Super Admin</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-100">
                    <td className="px-6 py-4 border-b">{admin.name}</td>
                    <td className="px-6 py-4 border-b">{admin.email}</td>
                    <td className="px-6 py-4 border-b">{admin.phone}</td>
                    <td className="px-6 py-4 border-b">
                      {admin.isSuperAdmin ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardManager>
  );
};

export default ViewAdmins;