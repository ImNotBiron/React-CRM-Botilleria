import axios from "axios";

const hostname = window.location.hostname;

// Cuando estás desarrollando en el notebook
const isLocalhost =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "";

// Backend local (desarrollo en notebook)
const devURL = "http://localhost:3000/api";

// Backend para tablet conectada al hotspot
const hotspotURL = "http://192.168.0.41:3000/api";

export const API_URL = isLocalhost ? devURL : hotspotURL;

console.log("🌐 Backend seleccionado:", API_URL);

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

export default axiosClient;
