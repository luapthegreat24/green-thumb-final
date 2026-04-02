import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCq-qzj5KGuoSOHZs6-tZfKdBCIcznZ7Os",
  authDomain: "mob-comp-de142.firebaseapp.com",
  projectId: "mob-comp-de142",
  storageBucket: "mob-comp-de142.firebasestorage.app",
  messagingSenderId: "1033707100782",
  appId: "1:1033707100782:web:8b7d0cf270423d9283647f",
  measurementId: "G-4K31GN7WHV",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const firebaseAuth: Auth = (() => {
  return getAuth(firebaseApp);
})();

export const firebaseStorage = getStorage(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
