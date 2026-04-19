import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Your Firebase config from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyCQJh1zOPMDCdD_2s0Ea0qwzSAdByQyVmE",
  authDomain: "mob-comp-de142.firebaseapp.com",
  projectId: "mob-comp-de142",
  storageBucket: "mob-comp-de142.firebasestorage.app",
  messagingSenderId: "1033707100782",
  appId: "1:1033707100782:android:aa7ba37cbec23d1f83647f",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with persistent storage
export const auth = (() => {
  try {
    if (Platform.OS === "web") {
      return initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    }

    return getAuth(app);
  } catch {
    return getAuth(app);
  }
})();

// Initialize Firestore
export const db = getFirestore(app);

// Optional: Connect to emulators in development
// Uncomment these lines if you're using Firebase emulators
// if (__DEV__) {
//   connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
//   connectFirestoreEmulator(db, "127.0.0.1", 8080);
// }
