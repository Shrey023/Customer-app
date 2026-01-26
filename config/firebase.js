import { initializeApp, getApps } from "firebase/app";
import Constants from "expo-constants";

let firebaseApp;

/**
 * IMPORTANT:
 * - Never throw
 * - Never initialize at import time
 * - Never rely on process.env
 */
function resolveFirebaseConfig() {
  const extra = Constants?.expoConfig?.extra;

  if (!extra || !extra.FIREBASE_CONFIG) {
    console.warn("⚠️ FIREBASE_CONFIG missing in expo.extra");
    return null;
  }

  return extra.FIREBASE_CONFIG;
}

export function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const config = resolveFirebaseConfig();

  // ⛔ HARD GUARD: do nothing until runtime is ready
  if (!config) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApps()[0];
    }
  } catch (e) {
    console.error("🔥 Firebase init failed:", e);
    return null;
  }

  return firebaseApp;
}
