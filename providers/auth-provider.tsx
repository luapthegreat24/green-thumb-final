import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { firebaseAuth } from "@/lib/firebase";
import {
  convertImageToBase64,
  isLocalMediaUri,
} from "@/services/firebase/media-upload";
import {
  createUserProfileDoc,
  subscribeUserProfile,
  updateUserProfileDoc,
  type UserProfile,
} from "@/services/firebase/user-service";

type UpdateProfileInput = {
  displayName?: string;
  photoUri?: string | null;
  currentPassword?: string;
  newPassword?: string;
};

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (input: UpdateProfileInput) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapAuthError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
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
      return "Please sign in again before changing your password.";
    case "storage/unauthorized":
      return "Not allowed to upload image. Check Firebase Storage rules.";
    case "storage/retry-limit-exceeded":
      return "Image upload timed out. Please try again.";
    case "storage/unknown":
      return "Image upload failed. Please choose the image again and retry.";
    default:
      return "Something went wrong. Please try again.";
  }
}

async function convertAvatarToBase64(photoUri: string): Promise<string> {
  return convertImageToBase64(photoUri);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (nextUser) => {
        profileUnsubscribe?.();
        profileUnsubscribe = undefined;

        if (!nextUser) {
          setUser(null);
          setProfile(null);
          setInitializing(false);
          return;
        }

        setUser(nextUser);

        profileUnsubscribe = subscribeUserProfile(
          nextUser.uid,
          async (nextProfile) => {
            if (!nextProfile) {
              const createInput: Parameters<typeof createUserProfileDoc>[0] = {
                uid: nextUser.uid,
                email: nextUser.email ?? "",
                displayName: nextUser.displayName ?? "",
              };
              if (nextUser.photoURL) {
                createInput.photoURL = nextUser.photoURL;
              }
              await createUserProfileDoc(createInput);
              return;
            }

            setProfile(nextProfile);
            setInitializing(false);
          },
        );
      },
    );

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

  const signup = async (
    displayName: string,
    email: string,
    password: string,
  ) => {
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

      const createInput: Parameters<typeof createUserProfileDoc>[0] = {
        uid: credential.user.uid,
        email: email.trim(),
        displayName: displayName.trim(),
      };
      if (credential.user.photoURL) {
        createInput.photoURL = credential.user.photoURL;
      }
      await createUserProfileDoc(createInput);

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

  const updateUserProfile = async ({
    displayName,
    photoUri,
    currentPassword,
    newPassword,
  }: UpdateProfileInput) => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error("No user is signed in.");
    }

    setLoading(true);
    setError(null);

    try {
      let photoDataUri: string | undefined;
      if (photoUri && isLocalMediaUri(photoUri)) {
        photoDataUri = await convertAvatarToBase64(photoUri);
      }

      const normalizedName = displayName
        ? displayName.trim()
        : (currentUser.displayName ?? "");

      if (normalizedName !== (currentUser.displayName ?? "")) {
        const updateInput: Parameters<typeof updateProfile>[1] = {
          displayName: normalizedName,
        };
        await updateProfile(currentUser, updateInput);
      }

      const wantsPasswordChange =
        Boolean(currentPassword?.trim()) || Boolean(newPassword?.trim());
      if (wantsPasswordChange) {
        const normalizedCurrentPassword = currentPassword?.trim() ?? "";
        const normalizedNewPassword = newPassword?.trim() ?? "";

        if (!normalizedCurrentPassword || !normalizedNewPassword) {
          throw new Error("Enter your current password and a new password.");
        }
        if (normalizedNewPassword.length < 8) {
          throw new Error("New password must be at least 8 characters.");
        }

        const email = currentUser.email;
        if (!email) {
          throw new Error("No email is linked to this account.");
        }

        const credential = EmailAuthProvider.credential(
          email,
          normalizedCurrentPassword,
        );
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, normalizedNewPassword);
      }

      const updateInput: Parameters<typeof updateUserProfileDoc>[1] = {
        displayName: normalizedName,
        email: currentUser.email ?? profile?.email ?? "",
      };
      if (photoDataUri) {
        updateInput.photoDataUri = photoDataUri;
      }
      await updateUserProfileDoc(currentUser.uid, updateInput);

      await currentUser.reload();
      setUser(firebaseAuth.currentUser);

      // Force re-fetch of profile data to ensure UI updates immediately
      // The Firestore listener will update, but we add a small delay to ensure server state is consistent
      await new Promise((resolve) => setTimeout(resolve, 500));
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
