// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "car-sale-36a14.firebaseapp.com",
  projectId: "car-sale-36a14",
  storageBucket: "car-sale-36a14.firebasestorage.app",
  messagingSenderId: "851251822898",
  appId: "1:851251822898:web:6a80cc3074bbc94c13172b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);