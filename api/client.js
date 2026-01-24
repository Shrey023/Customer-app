// customer-app/api/client.js
import axios from "axios";
import Constants from "expo-constants";

let apiInstance = null;

function getAPI() {
  if (apiInstance) return apiInstance;

  const apiUrl = Constants?.expoConfig?.extra?.API_URL;

  // 🔐 DO NOT THROW — standalone app crash ho jaata hai
  if (!apiUrl) {
    console.warn(
      "[API] API_URL missing in Expo config. API calls will fail gracefully."
    );

    // dummy instance so app doesn't crash
    apiInstance = axios.create({
      baseURL: "http://localhost",
    });

    return apiInstance;
  }

  apiInstance = axios.create({
    baseURL: apiUrl,
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
