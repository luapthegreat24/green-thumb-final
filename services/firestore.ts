import { db } from "@/firebase.config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// User type
export interface User {
  uid: string;
  email: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Plant type
export interface Plant {
  id: string;
  userId: string;
  name: string;
  species: string;
  waterFrequency: number; // days
  lastWatered: Timestamp;
  dateAdded: Timestamp;
  notes?: string;
  imageUrl?: string;
}

// Seed type
export interface Seed {
  id: string;
  userId: string;
  name: string;
  species: string;
  quantity: number;
  type: "vegetable" | "flower" | "herb" | "fruit" | "other"; // seed type
  plantingTemperature?: { min: number; max: number }; // Celsius
  germinationDays?: number; // days to germinate
  daysToMaturity?: number; // days from planting to harvest
  dateAdded: Timestamp;
  expiryDate?: Timestamp; // seed expiry date
  location?: string; // where seeds are stored
  notes?: string;
  imageUrl?: string;
}

// User functions
export async function getUserData(uid: string): Promise<User | null> {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.data() as User | null;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
}

export async function updateUserData(uid: string, data: Partial<User>) {
  try {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

// Plant functions
export async function addPlant(
  userId: string,
  plantData: Omit<Plant, "id" | "userId" | "dateAdded">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "plants"), {
      ...plantData,
      userId,
      dateAdded: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding plant:", error);
    throw error;
  }
}

export async function getUserPlants(userId: string): Promise<Plant[]> {
  try {
    const q = query(collection(db, "plants"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Plant[];
  } catch (error) {
    console.error("Error fetching plants:", error);
    throw error;
  }
}

export async function updatePlant(plantId: string, plantData: Partial<Plant>) {
  try {
    const docRef = doc(db, "plants", plantId);
    await updateDoc(docRef, plantData);
  } catch (error) {
    console.error("Error updating plant:", error);
    throw error;
  }
}

export async function deletePlant(plantId: string) {
  try {
    await deleteDoc(doc(db, "plants", plantId));
  } catch (error) {
    console.error("Error deleting plant:", error);
    throw error;
  }
}

// Water log functions
export interface WaterLog {
  id: string;
  plantId: string;
  userId: string;
  wateredAt: Timestamp;
  notes?: string;
}

export async function logWater(
  plantId: string,
  userId: string,
  notes?: string,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "waterLogs"), {
      plantId,
      userId,
      wateredAt: Timestamp.now(),
      notes,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error logging water:", error);
    throw error;
  }
}

export async function getWaterLogs(plantId: string): Promise<WaterLog[]> {
  try {
    const q = query(
      collection(db, "waterLogs"),
      where("plantId", "==", plantId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WaterLog[];
  } catch (error) {
    console.error("Error fetching water logs:", error);
    throw error;
  }
}

// Seed functions
export async function addSeed(
  userId: string,
  seedData: Omit<Seed, "id" | "userId" | "dateAdded">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "seeds"), {
      ...seedData,
      userId,
      dateAdded: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding seed:", error);
    throw error;
  }
}

export async function getUserSeeds(userId: string): Promise<Seed[]> {
  try {
    const q = query(collection(db, "seeds"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Seed[];
  } catch (error) {
    console.error("Error fetching seeds:", error);
    throw error;
  }
}

export async function updateSeed(seedId: string, seedData: Partial<Seed>) {
  try {
    const docRef = doc(db, "seeds", seedId);
    await updateDoc(docRef, seedData);
  } catch (error) {
    console.error("Error updating seed:", error);
    throw error;
  }
}

export async function deleteSeed(seedId: string) {
  try {
    await deleteDoc(doc(db, "seeds", seedId));
  } catch (error) {
    console.error("Error deleting seed:", error);
    throw error;
  }
}

export async function getSeedsByType(
  userId: string,
  type: Seed["type"],
): Promise<Seed[]> {
  try {
    const q = query(
      collection(db, "seeds"),
      where("userId", "==", userId),
      where("type", "==", type),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Seed[];
  } catch (error) {
    console.error("Error fetching seeds by type:", error);
    throw error;
  }
}
