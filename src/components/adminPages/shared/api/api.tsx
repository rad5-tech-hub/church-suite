// src/api/api.ts
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";
import { store } from "../../../reduxstore/redux";
import { clearAuth } from "../../../reduxstore/authstore";
import { showPageToast } from "../../../util/pageToast";

// Prevent duplicate toasts across app lifetime
let hasShownSessionExpiredToast = false;
let hasShownNetworkErrorToast = false;

/**
 * Check if JWT token is expired
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
 * Axios Instance
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
 * Request Interceptor
 * Adds Bearer token + checks for expired token before sending
 */
Api.interceptors.request.use(
  async (config) => {
    const token = store.getState().auth?.authData?.token;

    if (token) {
      if (isTokenExpired(token)) {
        // Token expired → force logout immediately
        store.dispatch(clearAuth());
        window.location.href = "/admin-login";

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
 * Response Interceptor - FIXED
 * Ignores 401 from /admin/change-pass so user isn't logged out on wrong old password
 */
Api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detect if this request was to change password
    const isChangePasswordRequest = error.config?.url?.includes("/admin/change-pass");

    if (error.response) {
      // Only trigger full logout on 401 if it's NOT the change-password endpoint
      if (error.response.status === 401 && !isChangePasswordRequest) {
        if (!hasShownSessionExpiredToast) {
          hasShownSessionExpiredToast = true;
          store.dispatch(clearAuth());
          showPageToast("Session expired or unauthorized. Please log in again.", "error");
          window.location.href = "/admin-login";
        }
      }
      // For change-password 401 (wrong old password), we do NOT logout → just reject
    } else if (error.request) {
      // Network error (no response)
      if (!hasShownNetworkErrorToast) {
        hasShownNetworkErrorToast = true;
        showPageToast("Network error. Please check your internet connection.", "error");
      }
    }

    // Always reject the error so component can handle it
    return Promise.reject(error);
  }
);

// Optional: Reset toast flags when user logs in again (call this in your login success)
export const resetApiToastFlags = () => {
  hasShownSessionExpiredToast = false;
  hasShownNetworkErrorToast = false;
};

export default Api;