import React from "react";
import { IoNotificationsOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { TbMenuDeep } from "react-icons/tb";
interface HeaderProps {
  toggleSidebar: () => void; // Function to toggle the sidebar
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="w-full h-16 bg-[#111827] text-white flex items-center justify-between px-6 shadow-md">
      {/* Left Section: Logo or Menu */}
      <div className="flex items-center gap-4">
        <button className="text-xl lg:hidden" onClick={toggleSidebar}>
          <TbMenuDeep className="text-xl" />
        </button>
        <h1 className="text-xl font-bold"></h1>
      </div>

      {/* Right Section: Notifications and Profile */}
      <div className="flex items-center gap-6">
        <button className="relative">
          <IoNotificationsOutline className="text-2xl" />
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="p-2 border border-gray-400 rounded-full">
            <BsPerson className="text-xl" />
          </div>
          <span className="hidden lg:block text-sm font-medium">John Doe</span>
        </div>
      </div>
    </header>
  );
};

// Test Code (Only runs when in test environment)
if (process.env.NODE_ENV === 'test') {
  const { render, screen, fireEvent } = require('@testing-library/react');
  require('@testing-library/jest-dom');

  // Explicitly define describe, test, expect, and jest to avoid ReferenceError
  const { describe, test, expect, jest } = require('jest');

  describe('Header Component', () => {
    test('renders header elements', () => {
      const mockToggleSidebar = jest.fn();
      render(<Header toggleSidebar={mockToggleSidebar} />);

      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: /person/i })).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('calls toggleSidebar on menu button click', () => {
      const mockToggleSidebar = jest.fn();
      render(<Header toggleSidebar={mockToggleSidebar} />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(menuButton);
      expect(mockToggleSidebar).toHaveBeenCalledTimes(1);
    });

    test('hides John Doe text on small screens', () => {
      render(<Header toggleSidebar={jest.fn()} />);
      expect(screen.getByText('John Doe')).not.toBeVisible();
    });
  });
}

export default Header;