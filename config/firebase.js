// customer-app/config/firebase.js
import { initializeApp, getApps } from "firebase/app";
import Constants from "expo-constants";

let firebaseApp = null;

function getFirebaseConfig() {
  return Constants?.expoConfig?.extra?.FIREBASE_CONFIG;
}

export function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const firebaseConfig = getFirebaseConfig();

  if (!firebaseConfig) {
    console.warn("⚠️ Firebase config missing at runtime");
    return null; // do NOT crash the app
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }

  return firebaseApp;
}
