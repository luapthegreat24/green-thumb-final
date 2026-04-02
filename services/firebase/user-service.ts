import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase";

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
};

type UserProfileDoc = {
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toIso(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value) {
    const asTimestamp = value as { toDate: () => Date };
    return asTimestamp.toDate().toISOString();
  }
  return new Date().toISOString();
}

function mapProfile(uid: string, data: UserProfileDoc): UserProfile {
  return {
    id: uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function createUserProfileDoc(input: {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}) {
  await setDoc(doc(firebaseDb, "users", input.uid), {
    email: input.email,
    displayName: input.displayName,
    photoURL: input.photoURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfileDoc(
  uid: string,
  updates: Partial<Pick<UserProfile, "displayName" | "email" | "photoURL">>,
) {
  await updateDoc(doc(firebaseDb, "users", uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(doc(firebaseDb, "users", uid), (snapshot) => {
    if (!snapshot.exists()) {
      onChange(null);
      return;
    }

    const data = snapshot.data() as UserProfileDoc;
    onChange(mapProfile(snapshot.id, data));
  });
}
