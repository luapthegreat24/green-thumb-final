import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { P, SP, TY } from "@/constants/herbarium-theme";
import { useAuth } from "../../providers/auth-provider";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=60";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, loading, updateUserProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? user?.displayName ?? "");
    setPhotoUri(profile?.photoURL ?? user?.photoURL ?? null);
  }, [profile, user]);

  const wantsPasswordChange = useMemo(
    () => Boolean(currentPassword.trim()) || Boolean(newPassword.trim()) || Boolean(confirmPassword.trim()),
    [currentPassword, newPassword, confirmPassword],
  );

  const hasChanges = useMemo(() => {
    return (
      displayName.trim() !== (user?.displayName ?? "") ||
      photoUri !== (user?.photoURL ?? null) ||
      (showPasswordFields && wantsPasswordChange)
    );
  }, [displayName, photoUri, user, wantsPasswordChange, showPasswordFields]);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage("Photo library permission is required to update your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      base64: Platform.OS === "web",
      quality: 0.9,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        setPhotoUri(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setPhotoUri(asset.uri);
      }
    }
  };

  const onSave = async () => {
    if (!user) return;

    if (showPasswordFields && wantsPasswordChange) {
      if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
        setMessage("Fill in current password, new password, and confirm password.");
        return;
      }
      if (newPassword.trim().length < 8) {
        setMessage("New password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage("New password and confirm password do not match.");
        return;
      }
    }

    setLocalLoading(true);
    setMessage(null);

    try {
      await updateUserProfile({
        displayName,
        photoUri,
        currentPassword:
          showPasswordFields && wantsPasswordChange
            ? currentPassword
            : undefined,
        newPassword:
          showPasswordFields && wantsPasswordChange ? newPassword : undefined,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordFields(false);
      setMessage("Profile updated.");
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Unable to update profile.",
      );
    } finally {
      setLocalLoading(false);
    }
  };

  const onLogout = async () => {
    setLocalLoading(true);
    try {
      await logout();
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: P.p1 }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + SP.md,
          paddingBottom: insets.bottom + SP.xxxl + 64,
        },
      ]}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>User Profile</Text>
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.subtitle}>
          Edit your account details, update your photo, and sign out when
          needed.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <Image
            source={{ uri: photoUri ?? DEFAULT_AVATAR }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.profileName}>
              {profile?.displayName || user?.displayName || "Unnamed user"}
            </Text>
            <Text style={styles.profileEmail}>
              {profile?.email || user?.email || "No email"}
            </Text>
          </View>
        </View>

        <Pressable onPress={pickPhoto} style={styles.photoButton}>
          <Ionicons name="camera-outline" size={16} color={P.g0} />
          <Text style={styles.photoButtonText}>Change profile picture</Text>
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your display name"
            placeholderTextColor={P.i3}
            style={styles.input}
          />
        </View>

        {!showPasswordFields ? (
          <Pressable
            onPress={() => setShowPasswordFields(true)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Change password</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                placeholderTextColor={P.i3}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={P.i3}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                placeholderTextColor={P.i3}
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={() => {
                setShowPasswordFields(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cancel password change</Text>
            </Pressable>
          </>
        )}

        {message && <Text style={styles.message}>{message}</Text>}

        <Pressable
          onPress={onSave}
          disabled={!hasChanges || localLoading || loading}
          style={({ pressed }) => [
            styles.primaryButton,
            (!hasChanges || localLoading || loading) && styles.disabledButton,
            pressed && styles.pressedButton,
          ]}
        >
          {localLoading || loading ? (
            <ActivityIndicator color={P.p0} />
          ) : (
            <Text style={styles.primaryButtonText}>Save changes</Text>
          )}
        </Pressable>

        <Pressable
          onPress={onLogout}
          disabled={localLoading || loading}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutButtonText}>Log out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SP.lg,
    gap: SP.lg,
  },
  hero: {
    paddingBottom: SP.md,
    gap: SP.sm,
  },
  eyebrow: {
    ...TY.monoLabel,
    color: P.g1,
    fontSize: 10,
  },
  title: {
    ...TY.display,
    fontSize: 34,
  },
  subtitle: {
    ...TY.body,
    color: P.i2,
    lineHeight: 22,
  },
  card: {
    backgroundColor: P.p0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: P.sketch,
    padding: SP.lg,
    gap: SP.md,
  },
  avatarRow: {
    flexDirection: "row",
    gap: SP.md,
    alignItems: "center",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: P.p2,
  },
  profileName: {
    ...TY.display,
    fontSize: 20,
  },
  profileEmail: {
    ...TY.body,
    color: P.i3,
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: P.p2,
    borderRadius: 14,
    paddingVertical: 12,
  },
  photoButtonText: {
    ...TY.body,
    fontWeight: "700",
    color: P.g0,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: P.sketch,
    borderRadius: 14,
    backgroundColor: P.p2,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    ...TY.body,
    color: P.i1,
    fontWeight: "700",
  },
  field: {
    gap: 8,
  },
  label: {
    ...TY.monoLabel,
    fontSize: 9,
  },
  input: {
    borderWidth: 1.5,
    borderColor: P.sketch,
    borderRadius: 14,
    backgroundColor: P.p1,
    paddingHorizontal: SP.md,
    paddingVertical: 13,
    color: P.i0,
    fontSize: 15,
  },
  message: {
    ...TY.body,
    color: P.g1,
  },
  primaryButton: {
    backgroundColor: P.g0,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: P.p0,
    fontWeight: "800",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  pressedButton: {
    opacity: 0.9,
  },
  logoutButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutButtonText: {
    ...TY.body,
    color: P.rust,
    fontWeight: "800",
  },
});
