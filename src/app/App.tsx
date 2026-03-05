import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ChurchProvider } from './context/ChurchContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

// Churchset - Church Management SaaS Platform
export default function App() {
  return (
    <AuthProvider>
      <ChurchProvider>
        <ThemeProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ThemeProvider>
      </ChurchProvider>
    </AuthProvider>
  );
}