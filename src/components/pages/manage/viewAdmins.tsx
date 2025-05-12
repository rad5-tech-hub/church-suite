import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";

const ViewAdmins: React.FC = () => {
  const navigate = useNavigate();

  // Example data for admins
  const admins = [
    { id: 1, name: "John Doe", email: "john@example.com", phone: "123-456-7890", isSuperAdmin: true },
    { id: 2, name: "Jane Smith", email: "jane@example.com", phone: "987-654-3210", isSuperAdmin: false },
    { id: 3, name: "Michael Brown", email: "michael@example.com", phone: "456-789-1230", isSuperAdmin: false },
  ];

  return (
    <DashboardManager>
      <div className="py-6 px-3 bg-gray-100 min-h-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">All Admins</h1>
            <p className="mt-2 text-gray-600">View and manage all admin accounts.</p>
          </div>
          <button
            onClick={() => navigate("/manage-church/admin")}
            className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-md font-semibold text-white"
          >
            Create Admin
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg max-w-full">
          <table className="w-full text-left border-collapse ">
            <thead className="bg-[#111827] text-white">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Super Admin</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-gray-100">
                  <td className="px-4 py-3">{admin.name}</td>
                  <td className="px-4 py-3">{admin.email}</td>
                  <td className="px-4 py-3">{admin.phone}</td>
                  <td className="px-4 py-3">{admin.isSuperAdmin ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardManager>
  );
};

export default ViewAdmins;
