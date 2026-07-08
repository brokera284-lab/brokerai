import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

// Read Firebase Config directly from the injected config file
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase Application
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with the specific databaseId if defined
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

export {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
export type { User };
