import AppRoutes from './components/pages/routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './components/shared/theme/ThemeContext';
function App() {
  return (
    <ThemeProvider>
        <ToastContainer
        position="top-right"   // 👈 you can change position
        autoClose={3000}       // 👈 default auto close in ms
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"        // 👈 you can switch to "light" or "dark"
      />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
