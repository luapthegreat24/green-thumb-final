import { auth } from "@/firebase.config";
import { signOut } from "firebase/auth";
import { Alert } from "react-native";

export function useSignOut() {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  return { signOut: handleSignOut };
}
