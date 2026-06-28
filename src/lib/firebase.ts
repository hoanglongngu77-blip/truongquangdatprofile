import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC8zqAB45bnxbp89kNGCv6sZCIEYe3ru-c",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yogic-operator-pms1d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yogic-operator-pms1d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yogic-operator-pms1d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "223001013852",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:223001013852:web:ac0c7713e7559881640099"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-4901c6f2-9246-4652-a0ea-a182722f8d6a");
