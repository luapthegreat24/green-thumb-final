/**
 * ProfileScreen — Herbarium
 *
 * Design language: "Pressed Specimen" — exact match to DashboardScreen.
 *
 * Key departures from generic profile screens:
 *   • Full-bleed avatar hero with botanical paper-texture overlay
 *   • Overlapping identity card that bleeds up into the hero
 *   • Specimen number (§ 001) — like a herbarium catalogue tag
 *   • All type lowercase monospace — no conventional title case
 *   • Settings as a single card with ruled row-list — not separate cards
 *   • Danger action lives at the very bottom, isolated, quiet — not screaming
 *   • Animated number counter on join date
 *   • Every interactive element has spring press feedback
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SP, TY } from "@/constants/herbarium-theme";
import { useFadeIn, useFadeUp } from "@/hooks/use-screen-animations";
import { useAuth } from "@/providers/auth-provider";

// ─── Design tokens — identical to DashboardScreen ────────────────────────────

const D = {
  paper: "#F7F4EF",
  paperMid: "#EDE8DF",
  paperRule: "#D8D0C4",
  white: "#FFFFFF",

  forest: "#2A5C3F",
  sage: "#5C8B6E",
  mist: "#C5D9CC",
  leafBg: "#EBF2ED",

  terracotta: "#C4623A",
  terracottaSoft: "#F0E0D8",
  amber: "#B87A2A",
  amberSoft: "#F2E8D5",

  ink: "#1C2318",
  inkMid: "#4A5544",
  inkFaint: "#8A9585",

  rule: "#C8C0B4",

  r: { sm: 6, md: 12, lg: 20, pill: 999 },
} as const;

const HERO_H = 320; // height of the full-bleed avatar block
const OVERLAP = 60; // how far the identity card overlaps the hero

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=512&q=80";

// ─── Animation hook for press scale ──────────────────────────────────────────

function usePressScale(to = 0.965) {
  const scale = useRef(new Animated.Value(1)).current;
  const cfg = { useNativeDriver: true, speed: 60, bounciness: 4 } as const;
  return {
    scale,
    onPressIn: () => Animated.spring(scale, { toValue: to, ...cfg }).start(),
    onPressOut: () => Animated.spring(scale, { toValue: 1, ...cfg }).start(),
  };
}

// ─── Atoms — identical naming to Dashboard ────────────────────────────────────

function Rule({ style }: { style?: object }) {
  return <View style={[{ height: 1, backgroundColor: D.rule }, style]} />;
}

function Mono({ children, style }: { children: string; style?: object }) {
  return <Text style={[S.mono, style]}>{children}</Text>;
}

// ─── Labelled text input ──────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure = false,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={S.fieldWrap}>
      <Mono>{label}</Mono>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={D.inkFaint}
        secureTextEntry={secure}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        style={[S.input, focused && S.inputFocused]}
      />
    </View>
  );
}

// ─── Row inside the settings list ─────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  sub,
  onPress,
  rightEl,
  danger = false,
  last = false,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);
  const inner = (
    <Animated.View
      style={[
        S.settingsRow,
        last && { borderBottomWidth: 0 },
        { transform: [{ scale }] },
      ]}
    >
      <View
        style={[
          S.settingsIconBox,
          danger && { backgroundColor: D.terracottaSoft },
        ]}
      >
        <Ionicons
          name={icon as any}
          size={14}
          color={danger ? D.terracotta : D.sage}
        />
      </View>
      <View style={S.settingsText}>
        <Text style={[S.settingsLabel, danger && { color: D.terracotta }]}>
          {label}
        </Text>
        {sub && <Mono>{sub}</Mono>}
      </View>
      {rightEl ??
        (onPress && !danger ? (
          <Ionicons name="chevron-forward" size={14} color={D.inkFaint} />
        ) : null)}
    </Animated.View>
  );

  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      {inner}
    </Pressable>
  );
}

// ─── Primary / secondary pill buttons ────────────────────────────────────────

function PrimaryBtn({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          S.primaryBtn,
          disabled && { opacity: 0.5 },
          { transform: [{ scale }] },
        ]}
      >
        <Mono style={{ color: D.white, fontSize: 12 }}>{label}</Mono>
      </Animated.View>
    </Pressable>
  );
}

function GhostBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ flex: 1 }}
    >
      <Animated.View style={[S.ghostBtn, { transform: [{ scale }] }]}>
        <Mono style={{ color: D.inkMid, fontSize: 12 }}>{label}</Mono>
      </Animated.View>
    </Pressable>
  );
}

// ─── Inline status banner ─────────────────────────────────────────────────────

function Banner({ text }: { text: string }) {
  const anim = useFadeUp(0);
  const isGood =
    text.toLowerCase().includes("updated") ||
    text.toLowerCase().includes("saved");
  return (
    <Animated.View
      style={[S.banner, isGood ? S.bannerGood : S.bannerBad, anim]}
    >
      <View
        style={[
          S.bannerPip,
          { backgroundColor: isGood ? D.sage : D.terracotta },
        ]}
      />
      <Mono style={{ color: isGood ? D.forest : D.terracotta, flex: 1 }}>
        {text}
      </Mono>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, profile, loading, updateUserProfile, logout } = useAuth();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [localLoading, setLocalLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // Hero animation
  const heroAnim = useFadeIn(0);
  const cardAnim = useFadeUp(160);
  const settAnim = useFadeUp(280);
  const dangerAnim = useFadeUp(380);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? user?.displayName ?? "");
    setPhotoUri(
      profile?.photoDataUri ?? profile?.photoURL ?? user?.photoURL ?? null,
    );
  }, [profile, user, lastUpdateTime]);

  const resetDraft = () => {
    setDisplayName(profile?.displayName ?? user?.displayName ?? "");
    setPhotoUri(
      profile?.photoDataUri ?? profile?.photoURL ?? user?.photoURL ?? null,
    );
    setShowPasswordFields(false);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setMessage(null);
    setEditingName(false);
  };

  const hasNameChange = displayName.trim() !== (user?.displayName ?? "");
  const hasPhotoChange =
    photoUri !==
    (profile?.photoDataUri ?? profile?.photoURL ?? user?.photoURL ?? null);
  const hasPwChange = !!(currentPw || newPw || confirmPw);
  const hasChanges =
    hasNameChange || hasPhotoChange || (showPasswordFields && hasPwChange);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setMessage("Photo library permission required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      setPhotoUri(a.uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setMessage("Camera permission required.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      setPhotoUri(a.uri);
    }
  };

  const pickPhotoOrCamera = () => {
    Alert.alert("Change Photo", "Choose a source", [
      { text: "Camera", onPress: takePhoto },
      { text: "Library", onPress: pickPhoto },
      { text: "Cancel", onPress: () => {}, style: "cancel" },
    ]);
  };

  const onSave = async () => {
    if (!user) return;
    if (showPasswordFields) {
      if (!currentPw || !newPw || !confirmPw) {
        setMessage("Fill in all password fields.");
        return;
      }
      if (newPw.length < 8) {
        setMessage("Password must be at least 8 characters.");
        return;
      }
      if (newPw !== confirmPw) {
        setMessage("Passwords do not match.");
        return;
      }
    }
    setLocalLoading(true);
    setMessage(null);
    try {
      await updateUserProfile({
        displayName: hasNameChange ? displayName : undefined,
        photoUri: hasPhotoChange ? photoUri : undefined,
        currentPassword: showPasswordFields ? currentPw : undefined,
        newPassword: showPasswordFields ? newPw : undefined,
      });
      // Wait for Firestore listener to update profile data
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLastUpdateTime(Date.now());
      resetDraft();
      setMessage("Profile updated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Unable to update profile.");
    } finally {
      setLocalLoading(false);
    }
  };

  const onLogout = async () => {
    setLocalLoading(true);
    try {
      await logout();
      router.replace("/welcome");
    } finally {
      setLocalLoading(false);
    }
  };

  // Specimen number — deterministic from email initial
  const specNo = String(
    ((((user?.email?.charCodeAt(0) ?? 65) - 64) * 7) % 900) + 100,
  ).padStart(3, "0");

  const joinYear = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).getFullYear()
    : new Date().getFullYear();

  const name = (
    displayName ||
    profile?.displayName ||
    user?.displayName ||
    "unnamed"
  ).toLowerCase();
  const email = (profile?.email || user?.email || "no email").toLowerCase();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={S.screen}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + SP.xxxl + 64 }}
      >
        {/* ══════════════════════════════════════════════════
            1. FULL-BLEED HERO
            Avatar fills the entire width. A dark-to-transparent
            gradient overlay anchors the specimen number top-left
            and the photo-change button top-right.
        ══════════════════════════════════════════════════ */}
        <Animated.View style={[S.hero, heroAnim]}>
          <Image
            source={{ uri: photoUri ?? DEFAULT_AVATAR }}
            style={S.heroBg}
            contentFit="cover"
          />

          {/* Dark paper scrim — top strip for readability */}
          <View style={S.heroScrim} />

          {/* Safe-area top padding */}
          <View style={{ height: insets.top }} />

          {/* Top row: specimen tag + camera button */}
          <View style={S.heroTopRow}>
            <View style={S.specimenTag}>
              <Text style={S.specimenNo}>GREEN THUMB</Text>
            </View>

            {/* Camera / pick photo — only visible in edit mode */}
            {editingName && (
              <Pressable onPress={pickPhotoOrCamera} style={S.cameraBtn}>
                <Ionicons name="camera-outline" size={15} color={D.white} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* ══════════════════════════════════════════════════
            2. IDENTITY CARD — overlaps hero by OVERLAP px
            Floats up over the photo with a shadow-less lift
            achieved purely through negative marginTop.
        ══════════════════════════════════════════════════ */}
        <Animated.View style={[S.identityCard, cardAnim]}>
          {/* Name row + edit toggle */}
          <View style={S.identityTop}>
            <View style={{ flex: 1 }}>
              {editingName ? (
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoFocus
                  placeholder="your name"
                  placeholderTextColor={D.inkFaint}
                  style={S.nameInput}
                  autoCapitalize="words"
                  onSubmitEditing={() => setEditingName(false)}
                  returnKeyType="done"
                />
              ) : (
                <Text style={S.identityName} numberOfLines={1}>
                  {name}
                </Text>
              )}
              <Text style={S.identityEmail}>{email}</Text>
            </View>

            {/* Edit name chip */}
            <Pressable
              onPress={() => setEditingName((v) => !v)}
              style={({ pressed }) => [
                S.editNameChip,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons
                name={editingName ? "checkmark" : "pencil-outline"}
                size={11}
                color={editingName ? D.white : D.sage}
              />
            </Pressable>
          </View>

          <Rule />

          {/* Member since strip — same structure as dashboard stat trio */}
          <View style={S.metaStrip}>
            <View style={S.metaCell}>
              <Text style={S.metaValue}>{joinYear}</Text>
              <Mono>member since</Mono>
            </View>
            <View style={S.metaDivider} />
            <View style={S.metaCell}>
              <Text style={S.metaValue}>✓</Text>
              <Mono>active</Mono>
            </View>
          </View>

          {/* Save banner — only when edit button is clicked */}
          {editingName && !showPasswordFields && (
            <View style={S.inlineActions}>
              <GhostBtn label="discard" onPress={resetDraft} />
              <PrimaryBtn
                label={localLoading ? "saving…" : "save changes"}
                onPress={onSave}
                disabled={localLoading || !hasChanges}
              />
            </View>
          )}

          {message && !showPasswordFields && <Banner text={message} />}
        </Animated.View>

        {/* ══════════════════════════════════════════════════
            3. SETTINGS CARD
            Single card, ruled rows — clean list structure.
            Password section expands inline (no modal, no nav).
        ══════════════════════════════════════════════════ */}
        <Animated.View style={[S.card, S.settingsCard, settAnim]}>
          {/* Section label — same style as dashboard SectionHead */}
          <View style={S.cardHeader}>
            <Text style={S.sectionTitle}>settings</Text>
          </View>

          <Rule />

          {/* Notifications row (placeholder — expand as needed) */}
          <SettingsRow
            icon="notifications-outline"
            label="notifications"
            onPress={() => {}}
          />

          <Rule style={{ marginVertical: 0 }} />

          {/* Change password row */}
          <SettingsRow
            icon="lock-closed-outline"
            label="change password"
            last={!showPasswordFields}
            onPress={() => setShowPasswordFields((v) => !v)}
            rightEl={
              <Ionicons
                name={showPasswordFields ? "chevron-up" : "chevron-forward"}
                size={14}
                color={D.inkFaint}
              />
            }
          />

          {/* Inline password expansion */}
          {showPasswordFields && (
            <>
              <View style={S.passwordPanel}>
                <Field
                  label="current password"
                  value={currentPw}
                  onChange={setCurrentPw}
                  placeholder="••••••••"
                  secure
                  autoFocus
                />
                <Field
                  label="new password"
                  value={newPw}
                  onChange={setNewPw}
                  placeholder="min. 8 characters"
                  secure
                />
                <Field
                  label="confirm password"
                  value={confirmPw}
                  onChange={setConfirmPw}
                  placeholder="re-enter new password"
                  secure
                />

                {message && <Banner text={message} />}

                <View style={S.inlineActions}>
                  <GhostBtn
                    label="cancel"
                    onPress={() => {
                      resetDraft();
                    }}
                  />
                  <PrimaryBtn
                    label={localLoading ? "saving…" : "update password"}
                    onPress={onSave}
                    disabled={localLoading || !hasPwChange}
                  />
                </View>
              </View>
            </>
          )}
        </Animated.View>

        {/* ══════════════════════════════════════════════════
            4. DANGER ZONE — isolated, quiet, at the bottom
            Matches dashboard's "all caught up" empty card tone.
            No red backgrounds screaming at the user.
        ══════════════════════════════════════════════════ */}
        <Animated.View style={[S.card, S.dangerCard, dangerAnim]}>
          <SettingsRow
            icon="log-out-outline"
            label={localLoading ? "logging out…" : "log out"}
            onPress={onLogout}
            danger
            last
          />
        </Animated.View>

        {/* Botanical footer — specimen detail like a pressed-plant label */}
        <Animated.View style={[S.footer, useFadeUp(480)]}>
          <View style={S.footerRule} />
          <Mono style={{ textAlign: "center" }}>
            {`green thumb · ${joinYear}`}
          </Mono>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: D.paper },

  // ── Mono atom — exact copy from Dashboard
  mono: {
    fontFamily: "System",
    fontSize: 11,
    letterSpacing: 0.8,
    color: D.inkFaint,
    textTransform: "uppercase" as const,
  },

  // ── Card shell — identical to Dashboard
  card: {
    backgroundColor: D.white,
    borderRadius: D.r.lg,
    borderWidth: 1,
    borderColor: D.rule,
    padding: SP.lg,
    gap: SP.md,
    marginHorizontal: SP.lg,
  },

  // ── HERO ────────────────────────────────────────────────────────

  hero: {
    height: HERO_H,
    position: "relative",
    overflow: "hidden",
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28,35,24,0.45)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SP.lg,
    paddingTop: SP.md,
  },
  specimenTag: {
    gap: 2,
  },
  specimenNo: {
    fontFamily: "System",
    fontSize: 18,
    color: D.white,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  cameraBtn: {
    width: 36,
    height: 36,
    borderRadius: D.r.pill,
    backgroundColor: "rgba(247,244,239,0.18)",
    borderWidth: 1,
    borderColor: "rgba(247,244,239,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── IDENTITY CARD ────────────────────────────────────────────────

  identityCard: {
    backgroundColor: D.white,
    borderRadius: D.r.lg,
    borderWidth: 1,
    borderColor: D.rule,
    padding: SP.lg,
    gap: SP.md,
    marginHorizontal: SP.lg,
    marginTop: -OVERLAP, // key: overlaps the hero
  },
  identityTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SP.md,
  },
  identityName: {
    fontFamily: "System",
    fontSize: 28,
    color: D.forest,
    fontWeight: "400" as const,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  nameInput: {
    fontFamily: "System",
    fontSize: 28,
    color: D.forest,
    fontWeight: "400" as const,
    letterSpacing: -0.4,
    lineHeight: 32,
    padding: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: D.sage,
  },
  identityEmail: {
    ...TY.body,
    fontSize: 14,
    color: D.inkFaint,
    marginTop: 3,
  },
  editNameChip: {
    width: 30,
    height: 30,
    borderRadius: D.r.pill,
    backgroundColor: D.leafBg,
    borderWidth: 1,
    borderColor: D.mist,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  // meta strip — matches dashboard stat trio exactly
  metaStrip: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaCell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  metaValue: {
    fontFamily: "System",
    fontSize: 24,
    color: D.ink,
    lineHeight: 28,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: D.rule,
    marginHorizontal: SP.md,
  },

  // ── SETTINGS ─────────────────────────────────────────────────────

  settingsCard: {
    gap: 0,
    marginTop: SP.lg,
    padding: 0,
    overflow: "hidden",
  },
  cardHeader: {
    padding: SP.lg,
    paddingBottom: SP.md,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: "System",
    fontSize: 14,
    color: D.ink,
    fontWeight: "400" as const,
    letterSpacing: 0.2,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SP.md,
    paddingVertical: 14,
    paddingHorizontal: SP.lg,
    borderBottomWidth: 1,
    borderBottomColor: D.paperRule,
  },
  settingsIconBox: {
    width: 34,
    height: 34,
    borderRadius: D.r.sm,
    backgroundColor: D.leafBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingsText: { flex: 1, gap: 2 },
  settingsLabel: {
    fontFamily: "System",
    fontSize: 14,
    color: D.ink,
    fontWeight: "400" as const,
    letterSpacing: 0.1,
  },

  passwordPanel: {
    gap: SP.lg,
    padding: SP.lg,
    paddingTop: SP.sm,
    backgroundColor: D.paper,
    borderTopWidth: 1,
    borderTopColor: D.paperRule,
  },

  // ── FIELD ────────────────────────────────────────────────────────

  fieldWrap: { gap: SP.sm },
  input: {
    borderWidth: 1,
    borderColor: D.rule,
    borderRadius: D.r.md,
    backgroundColor: D.white,
    paddingHorizontal: SP.md,
    paddingVertical: 11,
    color: D.ink,
    fontSize: 14,
    fontFamily: "System",
    minHeight: 44,
  },
  inputFocused: {
    borderColor: D.sage,
    backgroundColor: D.leafBg,
  },

  // ── BUTTONS ──────────────────────────────────────────────────────

  inlineActions: {
    flexDirection: "row",
    gap: SP.md,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: D.r.md,
    backgroundColor: D.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: D.r.md,
    backgroundColor: D.paper,
    borderWidth: 1,
    borderColor: D.rule,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── BANNER ───────────────────────────────────────────────────────

  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: D.r.md,
    borderWidth: 1,
    paddingHorizontal: SP.md,
    paddingVertical: SP.md,
  },
  bannerPip: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 1,
    flexShrink: 0,
  },
  bannerGood: { backgroundColor: D.leafBg, borderColor: D.mist },
  bannerBad: {
    backgroundColor: D.terracottaSoft,
    borderColor: "rgba(196,98,58,0.25)",
  },

  // ── DANGER CARD ──────────────────────────────────────────────────

  dangerCard: {
    gap: 0,
    padding: 0,
    marginTop: SP.lg,
    overflow: "hidden",
  },

  // ── FOOTER ───────────────────────────────────────────────────────

  footer: {
    paddingHorizontal: SP.xl,
    paddingTop: SP.xl,
    paddingBottom: SP.lg,
    gap: SP.md,
    alignItems: "center",
  },
  footerRule: {
    width: 48,
    height: 1,
    backgroundColor: D.rule,
    marginBottom: SP.sm,
  },
});
