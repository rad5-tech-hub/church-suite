import React, { useState } from "react";
import Sidebar from "./sidebar/sidebar";
import Header from "./header/header";

interface DashboardManagerProps {
  children: React.ReactNode;
}

const DashboardManager: React.FC<DashboardManagerProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Dynamic Body */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

// Test Code (Only runs when in test environment)
if (process.env.NODE_ENV === 'test') {
  const { render, screen, fireEvent } = require('@testing-library/react');
  const { MemoryRouter } = require('react-router-dom');
  require('@testing-library/jest-dom');

  // Explicitly define describe, test, expect, and jest to avoid ReferenceError
  const { describe, test, expect } = require('jest');

  describe('DashboardManager Component', () => {
    test('renders sidebar, header, and main content', () => {
      render(
        <MemoryRouter>
          <DashboardManager>
            <div>Test Content</div>
          </DashboardManager>
        </MemoryRouter>
      );

      expect(screen.getByText('ChurchSuite')).toBeInTheDocument(); // Assuming Sidebar renders 'ChurchSuite'
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument(); // Assuming Header has a menu button
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('toggles sidebar visibility', () => {
      render(
        <MemoryRouter>
          <DashboardManager>
            <div>Test Content</div>
          </DashboardManager>
        </MemoryRouter>
      );

      const sidebar = screen.getByText('ChurchSuite').closest('div');
      expect(sidebar).toHaveClass('-translate-x-full');

      const menuButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(menuButton);
      expect(sidebar).toHaveClass('translate-x-0');

      fireEvent.click(menuButton);
      expect(sidebar).toHaveClass('-translate-x-full');
    });

    test('passes children to main content', () => {
      const testContent = <div>Test Content</div>;
      render(
        <MemoryRouter>
          <DashboardManager>{testContent}</DashboardManager>
        </MemoryRouter>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
}

export default DashboardManager;