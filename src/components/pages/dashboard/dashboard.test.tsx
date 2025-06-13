import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './dashboard'; // Adjust import path as needed
import '@testing-library/jest-dom';

// Mock the DashboardManager component
jest.mock('../../shared/dashboardManager', () => {
  return function MockDashboardManager({ children }: { children: React.ReactNode }) {
    return <div data-testid="dashboard-manager">{children}</div>;
  };
});

describe('Dashboard Component', () => {
  it('renders within DashboardManager', () => {
    render(<Dashboard />);
    
    // Verify DashboardManager is present
    expect(screen.getByTestId('dashboard-manager')).toBeInTheDocument();
  });

  it('displays the correct header content', () => {
    render(<Dashboard />);
    
    expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome to the dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Here you can manage your church activities/i)).toBeInTheDocument();
  });

  it('renders all feature cards correctly', () => {
    render(<Dashboard />);
    
    const cards = screen.getAllByRole('heading', { level: 2 });
    expect(cards).toHaveLength(3);
    
    // Verify each card's content
    expect(screen.getByRole('heading', { name: /Members/i })).toBeInTheDocument();
    expect(screen.getByText(/Manage church members and their details/i)).toBeInTheDocument();
    
    expect(screen.getByRole('heading', { name: /Events/i })).toBeInTheDocument();
    expect(screen.getByText(/Plan and manage church events/i)).toBeInTheDocument();
    
    expect(screen.getByRole('heading', { name: /Donations/i })).toBeInTheDocument();
    expect(screen.getByText(/Track and manage donations/i)).toBeInTheDocument();
  });

  it('has correct styling classes', () => {
    render(<Dashboard />);
    
    // Test container styling
    expect(screen.getByTestId('dashboard-manager')).toBeInTheDocument();
    const container = screen.getByRole('heading', { name: /Dashboard/i }).parentElement;
    expect(container).toHaveClass('p-6');
    
    // Test grid layout
    const grid = screen.getByText(/Manage church members/i).parentElement?.parentElement;
    expect(grid).toHaveClass('grid-cols-1');
    expect(grid).toHaveClass('md:grid-cols-2');
    expect(grid).toHaveClass('lg:grid-cols-3');
    expect(grid).toHaveClass('gap-6');
    
    // Test card styling
    const firstCard = screen.getByText(/Manage church members/i).parentElement;
    expect(firstCard).toHaveClass('bg-white');
    expect(firstCard).toHaveClass('shadow-md');
    expect(firstCard).toHaveClass('rounded-lg');
    expect(firstCard).toHaveClass('p-4');
  });
});