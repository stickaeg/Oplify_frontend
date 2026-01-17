import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (res) => {
    // Skip 401 for blob downloads (they're stateless)
    if (res.config.responseType === "blob" || res.status === 200) {
      return res;
    }
    return res;
  },
  (err) => {
    // Don't auto-redirect on download errors
    if (err.config?.responseType === "blob" || err.code === "ERR_NETWORK") {
      return Promise.reject(err);
    }
    if (err.response?.status === 401) {
      // window.location.href = "/";
    }
    return Promise.reject(err);
  },
);

export default axiosClient;
