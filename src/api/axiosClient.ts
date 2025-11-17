import axios from "axios";

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Dev (PC local)
const devURL = "http://localhost:3000/api";

// Producción (usa el dominio automáticamente)
const prodURL = "/api";

export const API_URL = isLocalhost ? devURL : prodURL;

console.log("🌐 Backend seleccionado:", API_URL);

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

export default axiosClient;

