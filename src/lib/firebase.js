import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // TODO: Replace with your actual Firebase configuration
  apiKey: "AIzaSyBURr5_gvcwurdxC4AwKLcclh8RwKpMGwI",
  authDomain: "paperlesh-4a836.firebaseapp.com",
  projectId: "paperlesh-4a836",
  storageBucket: "paperlesh-4a836.firebasestorage.app",
  messagingSenderId: "311624894098",
  appId: "1:311624894098:web:87635c8a5dd14e69c0c84b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
