import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL,
  timeout: 30000, // 30 seconds
  withCredentials: true, // 🔐 needed if using HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================
   REQUEST INTERCEPTOR
============================ */
api.interceptors.request.use(
  (config) => {
    // ⚠️ Only if you store token in local/session storage
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      
      console.log(`DEBUG: API Request to ${config.url}`);
      console.log('DEBUG: Interceptor Token:', token ? 'FOUND' : 'MISSING');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('DEBUG: Set Authorization header');
        // alert("DEBUG: Interceptor attached token"); 
      } else {
        console.warn('DEBUG: No token available for this request');
        // alert("DEBUG: Interceptor has NO TOKEN");
      }
    } else {
        console.log("DEBUG: API Request from Server Side (No Window)");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ============================
   RESPONSE INTERCEPTOR
============================ */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global auth error handling
    if (error.response?.status === 401) {
      console.warn("DEBUG: 401 Unauthorized detected. Keeping token for debugging.");
      // Optional: auto logout
      // if (typeof window !== "undefined") {
      //   localStorage.removeItem("access_token");
      //   sessionStorage.removeItem("access_token");
      //   window.location.href = "/auth/login";
      // }
    }
    return Promise.reject(error);
  }
);

export default api;
