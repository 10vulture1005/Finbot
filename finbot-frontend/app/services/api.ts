import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { APIResponse } from '../types/api';

const baseURL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create a centralized Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for the token
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token'))
      : null;
      
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling and retries
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError | any) => {
    const originalRequest = error.config;

    // Retry logic for 5xx errors or network errors (no response)
    if (
      originalRequest && 
      !originalRequest._retry && 
      (!error.response || error.response.status >= 500)
    ) {
      originalRequest._retry = (originalRequest._retry || 0) + 1;
      const maxRetries = 3;

      if (originalRequest._retry <= maxRetries) {
        const backoff = Math.pow(2, originalRequest._retry) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, backoff));
        return axiosInstance(originalRequest);
      }
    }

    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access - potential redirect...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        sessionStorage.removeItem('access_token');
        window.location.href = '/auth/login';
      }
    }

    // Normalize Error Structure
    // Ensure that even if the backend returns a non-standard error (like FastAPI default 422),
    // we bubble up a consistent message.
    let errorMessage = error.message || "An unexpected error occurred";
    
    if (error.response?.data) {
        const data = error.response.data as any;
        if (data.error) errorMessage = data.error;
        else if (data.detail) errorMessage = JSON.stringify(data.detail);
        else if (data.message) errorMessage = data.message;
    }

    console.error('API Error:', errorMessage);
    
    // Return a standardized rejection
    // We reject with the error object but attach the normalized message
    error.message = errorMessage;
    return Promise.reject(error);
  }
);

// Generic API methods to enforce strict typing
const api = {
    get: async <T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> => {
        try {
            const response = await axiosInstance.get<APIResponse<T>>(url, config);
            return response.data;
        } catch (error: any) {
            // If the error response is actually a valid APIResponse (e.g. success=False), return it?
            // Usually axios throws on 4xx/5xx.
            // We can construct a fallback APIResponse
            return {
                success: false,
                error: error.message || "Request failed",
                data: undefined
            };
        }
    },
    post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> => {
        try {
            const response = await axiosInstance.post<APIResponse<T>>(url, data, config);
            return response.data;
        } catch (error: any) {
             return {
                success: false,
                error: error.message || "Request failed"
            };
        }
    },
    put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> => {
        try {
            const response = await axiosInstance.put<APIResponse<T>>(url, data, config);
            return response.data;
        } catch (error: any) {
             return {
                success: false,
                error: error.message || "Request failed"
            };
        }
    },
    delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> => {
        try {
            const response = await axiosInstance.delete<APIResponse<T>>(url, config);
            return response.data;
        } catch (error: any) {
             return {
                success: false,
                error: error.message || "Request failed"
            };
        }
    },
    // Expose the raw instance if needed
    axios: axiosInstance
};

export default api;
