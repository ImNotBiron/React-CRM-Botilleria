import axios from "axios";
import { Capacitor } from "@capacitor/core";

const hostname = window.location.hostname;

// Detecta si es ambiente local (PC)
const isLocalhost =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.") ||
  hostname.startsWith("172.");

// URLs
const devURL = "http://localhost:3000/api"; // solo PC
const prodURL = "https://botilleriaelparaiso.cl/api"; // VPS

let API_URL = prodURL;

// Si estamos en navegador y no es prod → dev
if (isLocalhost && !Capacitor.isNativePlatform()) {
  API_URL = devURL;
}

// Si estamos en Android nativo → usar VPS SIEMPRE
if (Capacitor.isNativePlatform()) {
  API_URL = prodURL;
}

console.log("🌐 API seleccionada:", API_URL);

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

export default axiosClient;
