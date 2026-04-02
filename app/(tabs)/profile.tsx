import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../../providers/auth-provider";
import { P, SP, TY } from "@/constants/herbarium-theme";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=256&q=60";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, loading, updateUserProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? user?.displayName ?? "");
    setEmail(profile?.email ?? user?.email ?? "");
    setPhotoUri(profile?.photoURL ?? user?.photoURL ?? null);
  }, [profile, user]);

  const hasChanges = useMemo(() => {
    return (
      displayName.trim() !== (user?.displayName ?? "") ||
      email.trim() !== (user?.email ?? "") ||
      photoUri !== (user?.photoURL ?? null)
    );
  }, [displayName, email, photoUri, user]);

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
      quality: 0.9,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSave = async () => {
    if (!user) return;

    setLocalLoading(true);
    setMessage(null);

    try {
      await updateUserProfile({
        displayName,
        email,
        photoUri,
      });
      setMessage("Profile updated.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to update profile.");
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
        <Text style={styles.subtitle}>Edit your account details, update your photo, and sign out when needed.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <Image source={{ uri: photoUri ?? DEFAULT_AVATAR }} style={styles.avatar} contentFit="cover" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.profileName}>{profile?.displayName || user?.displayName || "Unnamed user"}</Text>
            <Text style={styles.profileEmail}>{profile?.email || user?.email || "No email"}</Text>
          </View>
        </View>

        <Pressable onPress={pickPhoto} style={styles.photoButton}>
          <Ionicons name="camera-outline" size={16} color={P.g0} />
          <Text style={styles.photoButtonText}>Change profile picture</Text>
        </Pressable>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your display name" placeholderTextColor={P.i3} style={styles.input} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={P.i3} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        </View>

        {message && <Text style={styles.message}>{message}</Text>}

        <Pressable onPress={onSave} disabled={!hasChanges || localLoading || loading} style={({ pressed }) => [styles.primaryButton, (!hasChanges || localLoading || loading) && styles.disabledButton, pressed && styles.pressedButton]}>
          {localLoading || loading ? <ActivityIndicator color={P.p0} /> : <Text style={styles.primaryButtonText}>Save changes</Text>}
        </Pressable>

        <Pressable onPress={onLogout} disabled={localLoading || loading} style={styles.logoutButton}>
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
