// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC_ZHlfCGlpbcjGd_iKwyf97QpeJtFNDKs",
  authDomain: "fyp-urduvideoai.firebaseapp.com",
  projectId: "fyp-urduvideoai",
  storageBucket: "fyp-urduvideoai.firebasestorage.app",
  messagingSenderId: "694395601911",
  appId: "1:694395601911:web:8aceef8ba0c51a9579e4f2",
  measurementId: "G-84KZ55L6XY"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
