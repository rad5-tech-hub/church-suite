import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { store } from "../../reduxstore/redux";
import { setAuthData } from "../../reduxstore/authstore"; // Import your auth action

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

// Function to refresh the token
const refreshToken = async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/church/refresh-token`
    );
    return response.data.accessToken;
  } catch (error) {
    throw error;
  }
};

// Create an Axios instance
const Api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedRequestsQueue: any[] = [];

// Request interceptor to handle token expiration and refresh
Api.interceptors.request.use(
  async (config) => {
    const state = store.getState();
    const token = state.auth?.authData?.token;

    if (token) {
      if (isTokenExpired(token)) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await refreshToken();
            const state = store.getState();
            const currentAuthData = state.auth?.authData;

            if (currentAuthData) {
              const updatedAuthData = {
                ...currentAuthData,
                token: newToken,
              };
              store.dispatch(setAuthData(updatedAuthData)); // Update token in Redux store
            }
            
            // Update the Authorization header with the new token
            config.headers.Authorization = `Bearer ${newToken}`;
            
            // Process queued requests with the new token
            failedRequestsQueue.forEach((cb) => cb(newToken));
            failedRequestsQueue = [];
            
            return config;
          } catch (refreshError) {
            // If refresh fails, redirect to login
            toast.error("Your session has expired. Please re-login.", {
              position: "top-center",
              autoClose: 5000,
              onClose: () => {
                window.location.href = "/";
              },
            });
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        } else {
          // If token is already being refreshed, queue the request
          return new Promise((resolve) => {
            failedRequestsQueue.push((newToken: string) => {
              config.headers.Authorization = `Bearer ${newToken}`;
              resolve(config);
            });
          });
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default Api;