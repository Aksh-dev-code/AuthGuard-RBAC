import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});


/*
 * Automatically attach JWT token
 */
api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


/*
 * Handle expired/invalid token
 */
api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (error.response?.status === 401) {

      localStorage.removeItem("accessToken");
      localStorage.removeItem("authUser");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);


export default api;