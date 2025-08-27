// API configuration for the AI Impact Tracker frontend
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  endpoints: {
    metrics: "/api/metrics",
    auth: {
      login: "/api/auth/login",
      register: "/api/auth/register",
      me: "/api/auth/me",
    },
  },
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

export const getMetricsUrl = () => getApiUrl(API_CONFIG.endpoints.metrics);
export const getAuthUrl = (action: keyof typeof API_CONFIG.endpoints.auth) => 
  getApiUrl(API_CONFIG.endpoints.auth[action]);
