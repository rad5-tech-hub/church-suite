import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";
import { store } from "../../reduxstore/redux";
import { setAuthData, clearAuth } from "../../reduxstore/authstore";
import { showPageToast } from "../../util/pageToast";

// Track if we've shown a session expired toast
let hasShownSessionExpiredToast = false;

// Function to check if the token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const decodedToken: { exp: number } = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Function to refresh the token using HTTP-only cookie
const refreshToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/church/refresh-token`,
      {},
      {
        withCredentials: true,  
        maxContentLength: 10 * 1024 * 1024, // ✅ 10 MB response limit
        maxBodyLength: 10 * 1024 * 1024,    // ✅ 10 MB request upload limit     
      }
    );
    return response.data.accessToken;
  } catch (error) {
    // Clear auth if refresh fails
    store.dispatch(clearAuth());
    throw error;
  }
};

// Create an Axios instance
const Api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-tenant-id": store.getState().auth?.authData?.tenantId || "",
  },
  withCredentials: true,
});

// Token refresh management
let isRefreshing = false;
let failedRequestsQueue: ((token: string) => void)[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedRequestsQueue.forEach((prom) => {
    if (error) {
      prom(error as any);
    } else {
      prom(token as string);
    }
  });
  failedRequestsQueue = [];
};

// Request interceptor
Api.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token = state.auth?.authData?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      if (isTokenExpired(token)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await refreshToken();
            const currentAuthData = state.auth?.authData;

            if (currentAuthData) {
              const updatedAuthData = {
                ...currentAuthData,
                token: newToken,
              };
              store.dispatch(setAuthData(updatedAuthData));
            }

            config.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            return config;
          } catch (refreshError) {
            processQueue(refreshError as Error);
            
            // Only show one session expired toast using showPageToast
            if (!hasShownSessionExpiredToast) {
              hasShownSessionExpiredToast = true;
              showPageToast("Your session has expired. Please log in again.", "error");
            }
            
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push((newToken: string) => {
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(config);
            } else {
              reject(new Error("Token refresh failed"));
            }
          });
        });
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Don't show duplicate toasts for 401 errors
      if (error.response.status === 401 && !hasShownSessionExpiredToast) {
        hasShownSessionExpiredToast = true;
        showPageToast("Unauthorized access. Please log in again.", "error", {
          onClose: () => {
            store.dispatch(clearAuth());
            window.location.href = "/";
          },
        });
      }
    } else if (error.request) {
      // Handle network errors
      showPageToast("Network error. Please check your connection.", "error");
    }
    return Promise.reject(error);
  }
);

export default Api;