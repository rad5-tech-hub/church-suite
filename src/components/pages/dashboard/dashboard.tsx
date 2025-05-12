import React from "react";
import DashboardManager from "../../shared/dashboardManager";

const Dashboard: React.FC = () => {
  return (
    <DashboardManager>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="mt-4 text-gray-600">
          Welcome to the dashboard! Here you can manage your church activities, view reports, and more.
        </p>

        {/* Example Content */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800">Members</h2>
            <p className="text-gray-600">Manage church members and their details.</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800">Events</h2>
            <p className="text-gray-600">Plan and manage church events.</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold text-gray-800">Donations</h2>
            <p className="text-gray-600">Track and manage donations.</p>
          </div>
        </div>
      </div>
    </DashboardManager>
  );
};

// Test Code (Only runs when in test environment)
if (process.env.NODE_ENV === 'test') {
  const { render, screen } = require('@testing-library/react');
  const { MemoryRouter } = require('react-router-dom');
  require('@testing-library/jest-dom');

  // Explicitly define describe, test, expect, and jest to avoid ReferenceError
  const { describe, test, expect, jest } = require('jest');

  describe('Dashboard Component', () => {
    test('renders dashboard content', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to the dashboard! Here you can manage your church activities, view reports, and more.')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Manage church members and their details.')).toBeInTheDocument();
      expect(screen.getByText('Events')).toBeInTheDocument();
      expect(screen.getByText('Plan and manage church events.')).toBeInTheDocument();
      expect(screen.getByText('Donations')).toBeInTheDocument();
      expect(screen.getByText('Track and manage donations.')).toBeInTheDocument();
    });

    test('renders within DashboardManager', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByText('ChurchSuite')).toBeInTheDocument(); // Assuming Sidebar renders 'ChurchSuite'
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument(); // Assuming Header has a menu button
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
}

export default Dashboard;