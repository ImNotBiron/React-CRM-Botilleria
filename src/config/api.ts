const hostname = window.location.hostname;

const isLocalhost =
  hostname === "localhost" ||
  hostname === "127.0.0.1";

export const API_URL = isLocalhost
  ? "http://localhost:3000/api"
  : "http://192.168.0.41:3000/api";
