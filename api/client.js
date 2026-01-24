// customer-app/api/client.js
import axios from "axios";
import Constants from "expo-constants";

let apiInstance = null;

function getAPI() {
  if (apiInstance) return apiInstance;

  const apiUrl =
    Constants?.expoConfig?.extra?.API_URL ||
    Constants?.manifest?.extra?.API_URL;

  // ❗ Never throw — standalone build crash ho jaata hai
  if (!apiUrl) {
    console.warn(
      "[API] API_URL not found in Expo config. Using fallback baseURL."
    );
  }

  apiInstance = axios.create({
    baseURL: apiUrl || "https://mechtrix.onrender.com/api",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return apiInstance;
}

export default {
  get: (url, config) => getAPI().get(url, config),
  post: (url, data, config) => getAPI().post(url, data, config),
  put: (url, data, config) => getAPI().put(url, data, config),
  delete: (url, config) => getAPI().delete(url, config),
};
