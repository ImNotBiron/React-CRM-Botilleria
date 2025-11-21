import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "../store/authStore";

const hostname = window.location.hostname;

// Detecta si es estrictamente el PC local (no red WiFi)
const isLocalPC =
  hostname === "localhost" ||
  hostname === "127.0.0.1";

// URLs
const devURL = "http://localhost:3000/api"; // Tu PC local
const prodURL = "https://botilleriaelparaiso.cl/api"; // Tu VPS

let API_URL = prodURL; // Por defecto, siempre apuntamos a Producción (Seguridad)

// LÓGICA DE SELECCIÓN:
// 1. Si estamos en el PC programando (localhost) -> Usamos Local
if (isLocalPC && !Capacitor.isNativePlatform()) {
  API_URL = devURL;
  console.log("💻 Modo Desarrollo Local: Conectado a", API_URL);
} 
// 2. En cualquier otro caso (Tablet, Celular, App Nativa, Red WiFi) -> Usamos VPS
else {
  API_URL = prodURL;
  console.log("📱 Modo Producción/Dispositivo: Conectado a", API_URL);
}

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: false, 
});

// =================================================================
// 🛡️ INTERCEPTORES OBLIGATORIOS (Para que no salga error 401)
// =================================================================

// 1. Inyectar Token en cada petición
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Manejar Token Vencido (Cerrar sesión si el VPS dice 401)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⛔ Sesión expirada. Cerrando sesión...");
      useAuthStore.getState().logout();
      // Opcional: Recargar para volver al login limpio
      // window.location.href = "/login"; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;