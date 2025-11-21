import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";
import { store } from "../../../reduxstore/redux";
import { clearAuth } from "../../../reduxstore/authstore";
import { showPageToast } from "../../../util/pageToast";

// ✅ Prevent duplicate session/network toasts
let hasShownSessionExpiredToast = false;
let hasShownNetworkErrorToast = false;

/**
 * ✅ Check if a JWT token is expired
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const { exp }: { exp: number } = jwtDecode(token);
    return exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

/**
 * ✅ Axios instance
 */
const Api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-tenant-id": store.getState().auth?.authData?.tenantId || "",
  },
  withCredentials: true,
});

/**
 * ✅ Request Interceptor
 * - If token is expired → logout immediately
 */
Api.interceptors.request.use(
  async (config) => {
    const token = store.getState().auth?.authData?.token;

    if (token) {
      if (isTokenExpired(token)) {
        // 🔥 Clear session & logout
        store.dispatch(clearAuth());
        window.location.href = "/";

        // Optional toast (only once)
        if (!hasShownSessionExpiredToast) {
          hasShownSessionExpiredToast = true;
          showPageToast("Session expired. Please log in again.", "error");
        }

        throw new axios.Cancel("Token expired - user logged out");
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ✅ Response Interceptor
 * - Still catches 401 from backend and logs out (if token manually invalidated)
 */
Api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401 && !hasShownSessionExpiredToast) {
        hasShownSessionExpiredToast = true;

        // 🔥 Force logout
        store.dispatch(clearAuth());
        showPageToast("Unauthorized access. Please log in again.", "error");
        window.location.href = "/";
      }
    } else if (error.request) {
      if (!hasShownNetworkErrorToast) {
        hasShownNetworkErrorToast = true;
        showPageToast("Network error. Please check your connection.", "error");
      }
    }

    return Promise.reject(error);
  }
);

export default Api;