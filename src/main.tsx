import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './components/reduxstore/redux';
import App from './App';
import './index.css';

// ✅ MUI Date Pickers setup
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import './registerSW'; // Import the service worker registration module

import { PostHogProvider } from 'posthog-js/react';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <PostHogProvider
            apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
            options={{
              api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
              capture_exceptions: true,
              debug: import.meta.env.MODE === "production", // disable verbose logs in dev
            }}
          >
            <App />
          </PostHogProvider>
        </LocalizationProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);