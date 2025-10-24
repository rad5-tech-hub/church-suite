import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";
import { store } from "../../reduxstore/redux";
import { clearAuth } from "../../reduxstore/authstore";
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

// Create an Axios instance
const Api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-tenant-id": store.getState().auth?.authData?.tenantId || "",
  },
  withCredentials: true,
});

let failedRequestsQueue: ((token: string) => void)[] = [];

// Request interceptor
Api.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token = state.auth?.authData?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      if (isTokenExpired(token)) {
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
let hasShownNetworkErrorToast = false;

Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // ✅ Prevent duplicate 401 session expired toasts
      if (error.response.status === 401 && !hasShownSessionExpiredToast) {
        hasShownSessionExpiredToast = true;
        showPageToast("Unauthorized access. Please log in again.", "error", {
          onClose: () => {
            store.dispatch(clearAuth());
            window.location.href = "/";
          },
        });
      }
    } 
    else if (error.request) {
      // ✅ Show network error toast only once (no reset)
      if (!hasShownNetworkErrorToast) {
        hasShownNetworkErrorToast = true;
        showPageToast("Network error. Please check your connection.", "error");
      }
    }

    return Promise.reject(error);
  }
);


export default Api;
