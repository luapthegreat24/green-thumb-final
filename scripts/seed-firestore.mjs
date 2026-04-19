import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  setDoc,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQJh1zOPMDCdD_2s0Ea0qwzSAdByQyVmE",
  authDomain: "mob-comp-de142.firebaseapp.com",
  projectId: "mob-comp-de142",
  storageBucket: "mob-comp-de142.firebasestorage.app",
  messagingSenderId: "1033707100782",
  appId: "1:1033707100782:android:aa7ba37cbec23d1f83647f",
};

async function authenticate(auth) {
  const email = process.env.FIREBASE_SEED_EMAIL;
  const password = process.env.FIREBASE_SEED_PASSWORD;

  if (email && password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  try {
    const anon = await signInAnonymously(auth);
    return anon.user;
  } catch (error) {
    if (error?.code !== "auth/configuration-not-found") {
      throw error;
    }

    // Fallback: create a temporary email/password account for seeding.
    const tempEmail = `seed.${Date.now()}@mob-comp-de142.local`;
    const tempPassword = `SeedPass!${Date.now()}`;
    const created = await createUserWithEmailAndPassword(
      auth,
      tempEmail,
      tempPassword,
    );
    return created.user;
  }
}

async function seed() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const user = await authenticate(auth);
  const now = Timestamp.now();

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email ?? "anonymous@local",
      name: user.displayName ?? "Seeded User",
      createdAt: now,
      updatedAt: now,
      seededByScript: true,
    },
    { merge: true },
  );

  const seedRef = await addDoc(collection(db, "seeds"), {
    userId: user.uid,
    name: "Tomato",
    species: "Solanum lycopersicum",
    quantity: 50,
    type: "vegetable",
    plantingTemperature: { min: 15, max: 30 },
    germinationDays: 6,
    daysToMaturity: 70,
    location: "Pantry drawer",
    notes: "Seeded by automation script",
    dateAdded: now,
  });

  const plantRef = await addDoc(collection(db, "plants"), {
    userId: user.uid,
    name: "Starter Basil",
    species: "Ocimum basilicum",
    waterFrequency: 3,
    lastWatered: now,
    dateAdded: now,
    notes: "Starter plant created by seed script",
  });

  const waterLogRef = await addDoc(collection(db, "waterLogs"), {
    userId: user.uid,
    plantId: plantRef.id,
    wateredAt: now,
    notes: "Initial watering log from seeder",
  });

  console.log("Seeding complete:");
  console.log(`user uid: ${user.uid}`);
  console.log(`seed doc: ${seedRef.id}`);
  console.log(`plant doc: ${plantRef.id}`);
  console.log(`water log doc: ${waterLogRef.id}`);
}

seed().catch((error) => {
  console.error("Seeding failed:");
  console.error(error?.code ?? error?.message ?? error);
  process.exit(1);
});
