// customer-app/api/client.js
import axios from "axios";
import Constants from "expo-constants";

const { API_URL } = Constants.expoConfig.extra;

const API = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
