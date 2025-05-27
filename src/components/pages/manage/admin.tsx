import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardManager from "../../shared/dashboardManager";
import { IoMailOutline, IoCallOutline } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import { RiLockPasswordLine } from "react-icons/ri";

const Admin: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    isSuperAdmin: false,
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);
    // Add your form submission logic here
  };

  return (
    <DashboardManager>
      <div className="lg:p-6 md:p-3 bg-gray-100 min-h-screen">
        {/* Page Title */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">Manage Admins</h1>
            <p className="mt-4 text-gray-600">
              Create and manage admin accounts for your church.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate("/manage-church/view-admin")}
              className="hover:bg-[#232b3e] bg-[#111827] border-none cursor-pointer px-5 py-2 rounded-sm font-semibold text-gray-100"
            >
              View Admins
            </button>
          </div>
        </div>

        {/* Admin Form */}
        <form onSubmit={handleSubmit} className="mt-6 lg:p-6 md:p-2 rounded-lg shadow-md space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Name
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <BsPerson className="text-gray-400 mr-3 text-xl" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter admin name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Email
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoMailOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter admin email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <RiLockPasswordLine className="text-gray-400 mr-3 text-xl" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter admin password"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-base text-gray-700 font-medium mb-2 text-left">
                Phone
              </label>
              <div className="flex items-center border border-gray-300 rounded-md px-4 py-3 input-shadow">
                <IoCallOutline className="text-gray-400 mr-3 text-xl" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full text-base text-gray-800 focus:outline-none"
                  placeholder="Enter admin phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* isSuperAdmin */}
          <div className="mb-6">
            <label htmlFor="isSuperAdmin" className="block text-base text-gray-700 font-medium mb-4 text-left">
              Is Super Admin
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isSuperAdmin"
                name="isSuperAdmin"
                checked={formData.isSuperAdmin}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isSuperAdmin" className="ml-2 block text-sm text-gray-700">
                Yes
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="h-12 w-full bg-[#111827] text-white rounded-md text-base font-semibold hover:bg-gray-800 transition duration-200 flex items-center justify-center"
            >
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </DashboardManager>
  );
};

// Test Code (Only runs when in test environment)
if (process.env.NODE_ENV === 'test') {
  const { render, screen, fireEvent } = require('@testing-library/react');
  const { MemoryRouter } = require('react-router-dom');
  require('@testing-library/jest-dom');

  // Explicitly define describe, test, expect, and jest to avoid ReferenceError
  const { describe, test, expect, jest } = require('jest');

  describe('Admin Component', () => {
    test('renders admin form and title', () => {
      render(
        <MemoryRouter>
          <Admin />
        </MemoryRouter>
      );

      expect(screen.getByText('Manage Admins')).toBeInTheDocument();
      expect(screen.getByText('Create and manage admin accounts for your church.')).toBeInTheDocument();
      expect(screen.getByText('View All')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
      expect(screen.getByLabelText('Is Super Admin')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create admin/i })).toBeInTheDocument();
    });

    test('updates form fields on input change', () => {
      render(
        <MemoryRouter>
          <Admin />
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      expect(nameInput.value).toBe('John Doe');

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      expect(emailInput.value).toBe('john@example.com');

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      expect(passwordInput.value).toBe('password123');

      const phoneInput = screen.getByLabelText('Phone') as HTMLInputElement;
      fireEvent.change(phoneInput, { target: { value: '123-456-7890' } });
      expect(phoneInput.value).toBe('123-456-7890');
    });

    test('toggles isSuperAdmin checkbox', () => {
      render(
        <MemoryRouter>
          <Admin />
        </MemoryRouter>
      );

      const checkbox = screen.getByLabelText('Is Super Admin') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    test('submits form and logs data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(
        <MemoryRouter>
          <Admin />
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });

      const submitButton = screen.getByRole('button', { name: /create admin/i });
      fireEvent.click(submitButton);

      expect(consoleSpy).toHaveBeenCalledWith('Form Data Submitted:', expect.objectContaining({
        name: 'John Doe',
        email: '',
        password: '',
        phone: '',
        isSuperAdmin: false,
      }));
      consoleSpy.mockRestore();
    });

    test('navigates to view-admin on View All button click', () => {
      const mockNavigate = jest.fn();
      jest.spyOn(require('react-router-dom'), 'useNavigate').mockReturnValue(mockNavigate);

      render(
        <MemoryRouter>
          <Admin />
        </MemoryRouter>
      );

      const viewAllButton = screen.getByText('View Admins');
      fireEvent.click(viewAllButton);
      expect(mockNavigate).toHaveBeenCalledWith('/manage-church/view-admin');
    });
  });
}

export default Admin;