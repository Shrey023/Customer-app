// customer-app/api/client.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://mechtrix.onrender.com/api", // <-- Added /api here
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
