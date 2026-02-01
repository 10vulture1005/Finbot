import axios from "axios";

const api = axios.create({
baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
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

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
      // Optional: auto logout
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        sessionStorage.removeItem("access_token");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
