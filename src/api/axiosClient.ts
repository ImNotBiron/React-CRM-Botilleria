import axios from "axios";
import { useAuthStore } from "../store/authStore";

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Desarrollo en PC
const devURL = "http://localhost:3000/api";

// Producción real (VPS)
const prodURL = "https://botilleriaelparaiso.cl/api";

// Android, iOS, tablets, web — TODO usa este dominio en producción
export const API_URL = isLocalhost ? devURL : prodURL;

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
