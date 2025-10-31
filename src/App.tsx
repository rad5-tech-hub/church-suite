import AppRoutes from './components/pages/routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <AppRoutes />
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
    </>
  );
}

export default App;
