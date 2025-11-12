import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAsx47QMVyH3npgBmTCPBSvL6AyUT_qLfQ",
  authDomain: "kok-cafe.firebaseapp.com",
  projectId: "kok-cafe",
  storageBucket: "kok-cafe.firebasestorage.app",
  messagingSenderId: "827653851230",
  appId: "1:827653851230:web:0fd8f0e7135b6eaac00ccf",
  measurementId: "G-M1DGT4D4JJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;