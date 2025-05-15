// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import { useNavigate } from 'react-router-dom';
// import SetupChurch from './SetupChurch';
// import '@testing-library/jest-dom';

// // Mock react-router-dom
// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom'),
//   useNavigate: jest.fn(),
//   Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
//     <a href={to}>{children}</a>
//   ),
// }));

// // Mock react-icons
// jest.mock('react-icons/io5', () => ({
//   IoCallOutline: () => <div data-testid="call-icon" />,
//   IoMailOutline: () => <div data-testid="mail-icon" />,
//   IoLocationOutline: () => <div data-testid="location-icon" />,
// }));

// jest.mock('react-icons/pi', () => ({
//   PiChurchLight: () => <div data-testid="church-icon" />,
// }));

// // Mock fetch
// beforeEach(() => {
//   global.fetch = jest.fn(() =>
//     Promise.resolve({
//       ok: true,
//       json: () => Promise.resolve({}),
//     })
//   ) as jest.Mock;
// });

// afterEach(() => {
//   jest.clearAllMocks();
// });

// describe('SetupChurch Component', () => {
//   const mockNavigate = jest.fn();

//   beforeEach(() => {
//     (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
//   });

//   it('renders all form fields correctly', () => {
//     render(<SetupChurch />);
    
//     expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
//     expect(screen.getByText('Set Up Your Church')).toBeInTheDocument();
//     expect(screen.getByText('Kindly provide the details of your church to proceed.')).toBeInTheDocument();
    
//     expect(screen.getByLabelText('Name of Church')).toBeInTheDocument();
//     expect(screen.getByLabelText('Email of Church')).toBeInTheDocument();
//     expect(screen.getByLabelText('Phone Number of Church')).toBeInTheDocument();
//     expect(screen.getByLabelText('Church Location')).toBeInTheDocument();
//     expect(screen.getByLabelText('Is this the Headquarter?')).toBeInTheDocument();
    
//     expect(screen.getByTestId('church-icon')).toBeInTheDocument();
//     expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
//     expect(screen.getByTestId('call-icon')).toBeInTheDocument();
//     expect(screen.getByTestId('location-icon')).toBeInTheDocument();
    
//     expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
//     expect(screen.getByText('Already have an account?')).toBeInTheDocument();
//   });

//   it('shows validation error when form is submitted empty', async () => {
//     render(<SetupChurch />);
    
//     fireEvent.submit(screen.getByRole('form'));
    
//     await waitFor(() => {
//       expect(screen.getByText('Please fill all required fields.')).toBeInTheDocument();
//     });
//   });

//   it('submits form successfully with valid data', async () => {
//     render(<SetupChurch />);
    
//     // Fill out form
//     fireEvent.change(screen.getByLabelText('Name of Church'), { 
//       target: { value: 'Grace Community Church' } 
//     });
//     fireEvent.change(screen.getByLabelText('Email of Church'), { 
//       target: { value: 'info@gracechurch.com' } 
//     });
//     fireEvent.change(screen.getByLabelText('Phone Number of Church'), { 
//       target: { value: '+1234567890' } 
//     });
//     fireEvent.change(screen.getByLabelText('Church Location'), { 
//       target: { value: '123 Main St, Anytown' } 
//     });
//     fireEvent.change(screen.getByLabelText('Is this the Headquarter?'), { 
//       target: { value: 'yes' } 
//     });
    
//     fireEvent.submit(screen.getByRole('form'));
    
//     await waitFor(() => {
//       expect(global.fetch).toHaveBeenCalledWith(
//         'https://church.bookbank.com.ng/church/create-church',
//         expect.objectContaining({
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             name: 'Grace Community Church',
//             address: '123 Main St, Anytown',
//             phone: '+1234567890',
//             email: 'info@gracechurch.com',
//             isHeadQuarter: 'yes',
//           }),
//         })
//       );
//       expect(mockNavigate).toHaveBeenCalledWith('/setup-logo');
//     });
//   });

//   it('shows loading state during submission', async () => {
//     render(<SetupChurch />);
    
//     // Fill out form
//     fireEvent.change(screen.getByLabelText('Name of Church'), { 
//       target: { value: 'Grace Community Church' } 
//     });
//     fireEvent.change(screen.getByLabelText('Email of Church'), { 
//       target: { value: 'info@gracechurch.com' } 
//     });
//     fireEvent.change(screen.getByLabelText('Phone Number of Church'), { 
//       target: { value: '+1234567890' } 
//     });
//     fireEvent.change(screen.getByLabelText('Church Location'), { 
//       target: { value: '123 Main St, Anytown' } 
//     });
//     fireEvent.change(screen.getByLabelText('Is this the Headquarter?'), { 
//       target: { value: 'yes' } 
//     });
    
//     fireEvent.submit(screen.getByRole('form'));
    
//     expect(screen.getByRole('button', { name: /Submitting.../i })).toBeDisabled();
    
//     await waitFor(() => {
//       expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
//     });
//   });

//   it('handles API errors gracefully', async () => {
//     global.fetch = jest.fn(() =>
//       Promise.reject(new Error('Network error'))
//     ) as jest.Mock;

//     render(<SetupChurch />);
    
//     // Fill out form
//     fireEvent.change(screen.getByLabelText('Name of Church'), { 
//       target: { value: 'Grace Community Church' } 
//     });
//     fireEvent.change(screen.getByLabelText('Email of Church'), { 
//       target: { value: 'info@gracechurch.com' } 
//     });
//     fireEvent.change(screen.getByLabelText('Phone Number of Church'), { 
//       target: { value: '+1234567890' } 
//     });
//     fireEvent.change(screen.getByLabelText('Church Location'), { 
//       target: { value: '123 Main St, Anytown' } 
//     });
//     fireEvent.change(screen.getByLabelText('Is this the Headquarter?'), { 
//       target: { value: 'yes' } 
//     });
    
//     fireEvent.submit(screen.getByRole('form'));
    
//     await waitFor(() => {
//       expect(screen.getByText('An error occurred')).toBeInTheDocument();
//     });
//   });

//   it('allows clearing error messages', async () => {
//     global.fetch = jest.fn(() =>
//       Promise.reject(new Error('Network error'))
//     ) as jest.Mock;

//     render(<SetupChurch />);
    
//     // Fill out form
//     fireEvent.change(screen.getByLabelText('Name of Church'), { 
//       target: { value: 'Grace Community Church' } 
//     });
//     fireEvent.change(screen.getByLabelText('Email of Church'), { 
//       target: { value: 'info@gracechurch.com' } 
//     });
//     fireEvent.change(screen.getByLabelText('Phone Number of Church'), { 
//       target: { value: '+1234567890' } 
//     });
//     fireEvent.change(screen.getByLabelText('Church Location'), { 
//       target: { value: '123 Main St, Anytown' } 
//     });
//     fireEvent.change(screen.getByLabelText('Is this the Headquarter?'), { 
//       target: { value: 'yes' } 
//     });
    
//     fireEvent.submit(screen.getByRole('form'));
    
//     await waitFor(() => {
//       expect(screen.getByText('An error occurred')).toBeInTheDocument();
//     });
    
//     fireEvent.click(screen.getByRole('button', { name: /Close error message/i }));
    
//     expect(screen.queryByText('An error occurred')).not.toBeInTheDocument();
//   });
// });