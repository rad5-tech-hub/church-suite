// import React from 'react';
// import { render, screen, fireEvent, waitFor} from '@testing-library/react';
// import { Provider } from 'react-redux';
// import { configureStore } from '@reduxjs/toolkit';
// import { setupServer } from 'msw/node';
// import { rest } from 'msw';
// import { MemoryRouter, useNavigate } from 'react-router-dom';
// import ViewAdmins from './viewAdmin';
// import { ThemeProvider, createTheme } from '@mui/material/styles';

// // Mock the react-router-dom useNavigate hook
// jest.mock('react-router-dom', () => ({
//   ...jest.requireActual('react-router-dom'),
//   useNavigate: jest.fn(),
// }));

// // Mock the API module
// jest.mock('../../../shared/api/api', () => ({
//   get: jest.fn(),
//   patch: jest.fn(),
//   delete: jest.fn(),
// }));

// // Mock the toast notification
// jest.mock('react-toastify', () => ({
//   toast: {
//     success: jest.fn(),
//     error: jest.fn(),
//   },
// }));

// // Mock the DashboardManager component
// jest.mock('../../../shared/dashboardManager', () => ({
//   __esModule: true,
//   default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
// }));

// // Create a mock store
// const mockStore = configureStore({
//   reducer: {
//     auth: () => ({
//       authData: {
//         isSuperAdmin: true,
//       },
//     }),
//   },
// });

// // Mock data
// const mockAdmins = [
//   {
//     id: 1,
//     name: 'Admin One',
//     email: 'admin1@example.com',
//     phone: '1234567890',
//     isSuperAdmin: true,
//     isSuspended: false,
//   },
//   {
//     id: 2,
//     name: 'Admin Two',
//     email: 'admin2@example.com',
//     phone: '0987654321',
//     isSuperAdmin: false,
//     branchId: 1,
//     isSuspended: true,
//   },
// ];

// const mockBranches = [
//   { id: 1, name: 'Main Branch', address: '123 Main St' },
//   { id: 2, name: 'Second Branch', address: '456 Second Ave' },
// ];

// // Set up mock server
// const server = setupServer(
//   rest.get('/church/view-admins', (_req: any, res: RestResponse, ctx: { json: (arg0: { admins: ({ id: number; name: string; email: string; phone: string; isSuperAdmin: boolean; isSuspended: boolean; branchId?: undefined; } | { id: number; name: string; email: string; phone: string; isSuperAdmin: boolean; branchId: number; isSuspended: boolean; })[]; }) => any; }) => {
//     return res(ctx.json({ admins: mockAdmins }));
//   }),
//   rest.get('/church/get-branches', (_req: any, res: (arg0: any) => any, ctx: { json: (arg0: { branches: { id: number; name: string; address: string; }[]; }) => any; }) => {
//     return res(ctx.json({ branches: mockBranches }));
//   }),
//   rest.patch('/church/edit-admin', (_req: any, res: (arg0: any) => any, ctx: { json: (arg0: {}) => any; }) => {
//     return res(ctx.json({}));
//   }),
//   rest.patch('/church/suspend-admin/2', (_req: any, res: (arg0: any) => any, ctx: { json: (arg0: {}) => any; }) => {
//     return res(ctx.json({}));
//   }),
//   rest.patch('/church/activate-admin/2', (_req: any, res: (arg0: any) => any, ctx: { json: (arg0: {}) => any; }) => {
//     return res(ctx.json({}));
//   }),
//   rest.delete('/church/delete-admin/2', (_req: any, res: (arg0: any) => any, ctx: { json: (arg0: {}) => any; }) => {
//     return res(ctx.json({}));
//   })
// );

// // Create a theme for ThemeProvider
// const theme = createTheme();

// describe('ViewAdmins Component', () => {
//   const navigateMock = jest.fn();

//   beforeAll(() => server.listen());
//   beforeEach(() => {
//     (useNavigate as jest.Mock).mockReturnValue(navigateMock);
//   });
//   afterEach(() => {
//     server.resetHandlers();
//     jest.clearAllMocks();
//   });
//   afterAll(() => server.close());

//   const renderComponent = () => {
//     return render(
//       <Provider store={mockStore}>
//         <ThemeProvider theme={theme}>
//           <MemoryRouter>
//             <ViewAdmins />
//           </MemoryRouter>
//         </ThemeProvider>
//       </Provider>
//     );
//   };

//   it('renders the component with loading state', async () => {
//     renderComponent();
//     expect(screen.getByRole('progressbar')).toBeInTheDocument();
//     await waitFor(() => {
//       expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
//     });
//   });

//   it('displays all admins after loading', async () => {
//     renderComponent();
    
//     await waitFor(() => {
//       expect(screen.getByText('All Admins')).toBeInTheDocument();
//       expect(screen.getByText('2 Admins Created')).toBeInTheDocument();
//       expect(screen.getByText('Admin One')).toBeInTheDocument();
//       expect(screen.getByText('Admin Two')).toBeInTheDocument();
//       expect(screen.getByText('admin1@example.com')).toBeInTheDocument();
//       expect(screen.getByText('admin2@example.com')).toBeInTheDocument();
//     });
//   });

//   it('shows error message when data fetching fails', async () => {
//     server.use(
//       rest.get('/church/view-admins', (_req: any, res: (arg0: any) => any, ctx: { status: (arg0: number) => any; }) => {
//         return res(ctx.status(500));
//       })
//     );

//     renderComponent();
    
//     await waitFor(() => {
//       expect(screen.getByText('Failed to load admins. Please try again later.')).toBeInTheDocument();
//     });
//   });

//   it('displays empty state when no admins are available', async () => {
//     server.use(
//       rest.get('/church/view-admins', (_req: any, res: (arg0: any) => any, ctx: { json: (arg0: { admins: never[]; }) => any; }) => {
//         return res(ctx.json({ admins: [] }));
//       })
//     );

//     renderComponent();
    
//     await waitFor(() => {
//       expect(screen.getByText('No admins found')).toBeInTheDocument();
//       expect(screen.getByText('Create New Admin')).toBeInTheDocument();
//     });
//   });

//   it('opens edit modal when edit button is clicked', async () => {
//     renderComponent();
    
//     await waitFor(() => {
//       const moreButtons = screen.getAllByRole('button', { name: /more/i });
//       fireEvent.click(moreButtons[1]); // Click on the second admin's more button
//     });

//     fireEvent.click(screen.getByText('Edit'));
    
//     await waitFor(() => {
//       expect(screen.getByText('Edit Admin')).toBeInTheDocument();
//       expect(screen.getByText('Admin Two')).toBeInTheDocument();
//       expect(screen.getByText('admin2@example.com')).toBeInTheDocument();
//     });
//   });

//   it('opens suspend confirmation modal when suspend button is clicked', async () => {
//     renderComponent();
    
//     await waitFor(() => {
//       const moreButtons = screen.getAllByRole('button', { name: /more/i });
//       fireEvent.click(moreButtons[1]); // Click on the second admin's more button
//     });

//     fireEvent.click(screen.getByText('Suspend'));
    
//     await waitFor(() => {
//       expect(screen.getByText('Suspend Admin')).toBeInTheDocument();
//       expect(screen.getByText('Are you sure you want to suspend "Admin Two"?')).toBeInTheDocument();
//     });
//   });

//   it('opens delete confirmation modal when delete button is clicked', async () => {
//     renderComponent();
    
//     await waitFor(() => {
//       const moreButtons = screen.getAllByRole('button', { name: /more/i });
//       fireEvent.click(moreButtons[1]); // Click on the second admin's more button
//     });

//     fireEvent.click(screen.getByText('Delete'));
    
//     await waitFor(() => {
//       expect(screen.getByText('Delete Admin')).toBeInTheDocument();
//       expect(screen.getByText('Are you sure you want to delete "Admin Two"?')).toBeInTheDocument();
//     });
//   });

//   it('navigates to create admin page when create button is clicked', async () => {
//     renderComponent();
    
//     await waitFor(() => {
//       const createButton = screen.getByText('Create Admin');
//       fireEvent.click(createButton);
//     });

//     expect(navigateMock).toHaveBeenCalledWith('/manage/admin');
//   });

//   it('handles pagination correctly', async () => {
//     // Add more admins to test pagination
//     const manyAdmins = Array.from({ length: 15 }, (_, i) => ({
//       id: i + 1,
//       name: `Admin ${i + 1}`,
//       email: `admin${i + 1}@example.com`,
//       phone: `123456789${i}`,
//       isSuperAdmin: i === 0,
//     }));

//     server.use(
//       rest.get('/church/view-admins', (_req: any, res: (arg0: any) => any, ctx: { json: (arg0: { admins: { id: number; name: string; email: string; phone: string; isSuperAdmin: boolean; }[]; }) => any; }) => {
//         return res(ctx.json({ admins: manyAdmins }));
//       })
//     );

//     renderComponent();
    
//     await waitFor(() => {
//       // Check initial page shows 5 items (default rowsPerPage)
//       expect(screen.getAllByRole('row').length).toBe(6); // header + 5 rows
      
//       // Change rows per page to 10
//       fireEvent.change(screen.getByLabelText('Rows per page:'), {
//         target: { value: '10' },
//       });
      
//       expect(screen.getAllByRole('row').length).toBe(11); // header + 10 rows
      
//       // Go to next page
//       fireEvent.click(screen.getByLabelText('Go to next page'));
//       expect(screen.getAllByRole('row').length).toBe(6); // header + 5 rows (15 total - 10 on first page)
//     });
//   });

//   it('disables actions for super admins', async () => {
//     renderComponent();
    
//     await waitFor(() => {
//       const moreButtons = screen.getAllByRole('button', { name: /more/i });
//       fireEvent.click(moreButtons[0]); // Click on the first admin's more button (super admin)
//     });

//     expect(screen.getByText('Edit')).not.toHaveAttribute('disabled');
//     expect(screen.getByText('Suspend')).toHaveAttribute('disabled');
//     expect(screen.getByText('Delete')).toHaveAttribute('disabled');
//   });
// });