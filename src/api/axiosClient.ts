import axios from "axios";
import { useAuthStore } from "../store/authStore"; // <--- IMPORTAR STORE

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const devURL = "http://localhost:3000/api";
const prodURL = "/api";

export const API_URL = isLocalhost ? devURL : prodURL;

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Importante para CORS como hablamos
});

// ⭐ INTERCEPTOR MÁGICO ⭐
// Antes de que salga cualquier petición, inyecta el token
axiosClient.interceptors.request.use((config) => {
  // Leemos el token directamente del estado persistente de Zustand
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosClient;