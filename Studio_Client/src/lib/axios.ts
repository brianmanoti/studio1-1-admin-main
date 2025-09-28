import axios from "axios";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://backend-studio.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add Bearer token interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token"); // or sessionStorage, or Redux store
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
