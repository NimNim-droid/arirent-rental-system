import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 25000,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

// Attach Bearer token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("arirent_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (redirect to login only when not already on the login page)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== "/login" &&
      window.location.pathname !== "/register"
    ) {
      localStorage.removeItem("arirent_token");
      localStorage.removeItem("arirent_current_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
