// customer-app/api/client.js
import axios from "axios";
import Constants from "expo-constants";

let apiInstance = null;

function getAPI() {
  if (apiInstance) return apiInstance;

  const apiUrl = Constants?.expoConfig?.extra?.API_URL;

  if (!apiUrl) {
    throw new Error("API_URL missing in Expo config");
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
  get: (...args) => getAPI().get(...args),
  post: (...args) => getAPI().post(...args),
  put: (...args) => getAPI().put(...args),
  delete: (...args) => getAPI().delete(...args),
};
