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
googleProvider.setCustomParameters({ prompt: "select_account" });

// Initialize Firestore with the specific databaseId if defined
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

/**
 * Strips all undefined fields recursively from objects/arrays so Firestore never throws
 * "Unsupported field value: undefined" errors.
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  const cleaned: any = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date) && typeof (value as any).toMillis !== "function") {
        cleaned[key] = cleanForFirestore(value);
      } else if (Array.isArray(value)) {
        cleaned[key] = value.filter(item => item !== undefined).map(item => (item && typeof item === "object" ? cleanForFirestore(item) : item));
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

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
