// customer-app/config/firebase.js
import { initializeApp } from "firebase/app";
import Constants from "expo-constants";

const { FIREBASE_CONFIG } = Constants.expoConfig.extra;

export const firebaseConfig = FIREBASE_CONFIG;

export const app = initializeApp(firebaseConfig);
