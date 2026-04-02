import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { firebaseAuth, firebaseStorage } from "@/lib/firebase";
import {
  createUserProfileDoc,
  subscribeUserProfile,
  updateUserProfileDoc,
  type UserProfile,
} from "@/services/firebase/user-service";

type UpdateProfileInput = {
  displayName: string;
  email: string;
  photoUri?: string | null;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (input: UpdateProfileInput) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error
    ? String((error as { code?: unknown }).code)
    : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "That email is already registered.";
    case "auth/weak-password":
      return "Password must be at least 8 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/requires-recent-login":
      return "Please sign in again before changing your email.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function uploadAvatarPhoto(uid: string, photoUri: string) {
  const response = await fetch(photoUri);
  const blob = await response.blob();
  const photoRef = ref(firebaseStorage, `profiles/${uid}/avatar.jpg`);
  await uploadBytes(photoRef, blob, { contentType: blob.type || "image/jpeg" });
  return await getDownloadURL(photoRef);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      profileUnsubscribe?.();
      profileUnsubscribe = undefined;

      if (!nextUser) {
        setUser(null);
        setProfile(null);
        setInitializing(false);
        return;
      }

      setUser(nextUser);

      profileUnsubscribe = subscribeUserProfile(nextUser.uid, async (nextProfile) => {
        if (!nextProfile) {
          await createUserProfileDoc({
            uid: nextUser.uid,
            email: nextUser.email ?? "",
            displayName: nextUser.displayName ?? "",
            photoURL: nextUser.photoURL ?? undefined,
          });
          return;
        }

        setProfile(nextProfile);
        setInitializing(false);
      });
    });

    return () => {
      authUnsubscribe();
      profileUnsubscribe?.();
    };
  }, []);

  const clearError = () => setError(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (caught) {
      setError(mapAuthError(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (displayName: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password,
      );

      await updateProfile(credential.user, {
        displayName: displayName.trim(),
      });

      await createUserProfileDoc({
        uid: credential.user.uid,
        email: email.trim(),
        displayName: displayName.trim(),
        photoURL: credential.user.photoURL ?? undefined,
      });

      await credential.user.reload();
      setUser(firebaseAuth.currentUser);
    } catch (caught) {
      setError(mapAuthError(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(firebaseAuth);
      setUser(null);
      setProfile(null);
    } catch (caught) {
      setError(mapAuthError(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async ({ displayName, email, photoUri }: UpdateProfileInput) => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error("No user is signed in.");
    }

    setLoading(true);
    setError(null);

    try {
      let photoURL = currentUser.photoURL;
      if (photoUri) {
        photoURL = await uploadAvatarPhoto(currentUser.uid, photoUri);
      }

      const normalizedName = displayName.trim();
      const normalizedEmail = email.trim();

      if (normalizedName !== (currentUser.displayName ?? "") || photoURL !== currentUser.photoURL) {
        await updateProfile(currentUser, {
          displayName: normalizedName,
          photoURL: photoURL ?? undefined,
        });
      }

      if (normalizedEmail !== (currentUser.email ?? "")) {
        await updateEmail(currentUser, normalizedEmail);
      }

      await updateUserProfileDoc(currentUser.uid, {
        displayName: normalizedName,
        email: normalizedEmail,
        photoURL: photoURL ?? undefined,
      });

      await currentUser.reload();
      setUser(firebaseAuth.currentUser);
    } catch (caught) {
      setError(mapAuthError(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      initializing,
      error,
      login,
      signup,
      logout,
      updateUserProfile,
      clearError,
    }),
    [user, profile, loading, initializing, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
