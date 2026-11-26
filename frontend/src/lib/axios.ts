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
  // Let the browser set the multipart/form-data boundary automatically
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Handle 401 responses (redirect to login only on protected portal routes)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = window.location.pathname;
    const isProtectedPortal = path.startsWith("/admin") || path.startsWith("/tenant");

    if (error.response?.status === 401 && isProtectedPortal) {
      localStorage.removeItem("arirent_token");
      localStorage.removeItem("arirent_current_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
