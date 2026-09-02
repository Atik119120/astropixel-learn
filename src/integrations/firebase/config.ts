import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase Configuration from environment variables or production defaults
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC-Mo7xg75-cIcWMwh_PK4cooyxn30rHHg",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "alphazero-41772.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "alphazero-41772",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "alphazero-41772.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "289892140635",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:289892140635:web:15aac8f6961c05aac6617e"
};

// Initialize Firebase App singleton safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
