/**
 * seeds.tsx — Seed Inventory Screen
 * Apple-minimalist design: seed collection management with iOS grouping,
 * status tracking, and quick actions using inset lists.
 */

import React, { useRef, useEffect, ComponentProps } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/contexts/auth";
import { useUserSeeds } from "@/hooks/use-firestore";
import { addSeed } from "@/services/firestore";

const { width: SW } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  pageBg:       "#F2F2F7",
  cardBg:       "#FFFFFF",
  label:        "#1C1C1E",
  labelSec:     "#636366",
  labelTert:    "#8E8E93",
  sysGreen:     "#34C759",
  sysBlue:      "#007AFF",
  sysOrange:    "#FF9500",
  sysRed:       "#FF3B30",
  accent:       "#2D6A4F",
  accentMid:    "#40916C",
  accentPale:   "#ECFBEE",
  sysGray:      "#8E8E93",
  sysGray5:     "#E5E5EA",
  sysGray6:     "#F2F2F7",
  sep:          "rgba(60,60,67,0.18)",
  shadow:       "#000000",
};

type IcName = ComponentProps<typeof Ionicons>["name"];
type SeedType = "vegetable" | "flower" | "herb" | "fruit" | "other";

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATIONS
// ─────────────────────────────────────────────────────────────────────────────
const useFadeUp = (delay = 0) => {
  const opacity  = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY,  { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const SectionHeader = ({ title, action, delay = 0 }: { title: string; action?: string; delay?: number }) => {
  const anim = useFadeUp(delay);
  return (
    <Animated.View style={[s.sectionHeader, anim]}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? <Text style={s.sectionAction}>{action}</Text> : null}
    </Animated.View>
  );
};

const InsetList = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <View style={[s.insetList, style]}>{children}</View>
);

const InsetDivider = ({ indent = 0 }: { indent?: number }) => (
  <View style={[s.insetDivider, indent > 0 ? { marginLeft: indent } : {}]} />
);

const getSeedTypeIcon = (type: SeedType): IcName => {
  switch (type) {
    case "vegetable": return "leaf-outline";
    case "flower": return "flower-outline";
    case "herb": return "flower-outline";
    case "fruit": return "nutrition-outline";
    case "other": return "leaf-outline";
    default: return "leaf-outline";
  }
};

const getSeedTypeColor = (type: SeedType): string => {
  switch (type) {
    case "vegetable": return T.sysGreen;
    case "flower": return "#D946EF";
    case "herb": return T.accentMid;
    case "fruit": return T.sysOrange;
    case "other": return T.sysGray;
    default: return T.sysGray;
  }
};

const getSeedTypeColorBg = (type: SeedType): string => {
  switch (type) {
    case "vegetable": return "#E8F9ED";
    case "flower": return "#F3E8FF";
    case "herb": return T.accentPale;
    case "fruit": return "#FFF3E0";
    case "other": return T.sysGray6;
    default: return T.sysGray6;
  }
};

interface SeedRowProps {
  name: string;
  species: string;
  quantity: number;
  type: SeedType;
  germinationDays?: number;
  daysToMaturity?: number;
  location?: string;
  delay?: number;
  last?: boolean;
}

const SeedRow = ({
  name,
  species,
  quantity,
  type,
  germinationDays,
  daysToMaturity,
  location,
  delay = 0,
  last = false,
}: SeedRowProps) => {
  const icon = getSeedTypeIcon(type);
  const color = getSeedTypeColor(type);
  const bg = getSeedTypeColorBg(type);

  return (
    <>
      <TouchableOpacity style={s.seedRow} activeOpacity={0.75}>
        <View style={[s.seedIcon, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <View style={s.seedBody}>
          <View style={s.seedTopLine}>
            <View style={{ flex: 1 }}>
              <Text style={s.seedName} numberOfLines={1}>{name}</Text>
              <Text style={s.seedSpecies} numberOfLines={1}>{species}</Text>
            </View>
            <View style={s.seedQuantity}>
              <Text style={s.quantityNum}>{quantity}</Text>
              <Text style={s.quantityLabel}>seeds</Text>
            </View>
          </View>
          <View style={s.seedDetails}>
            {germinationDays && (
              <Text style={s.seedDetail}>
                <Ionicons name="timer-outline" size={10} color={T.sysGray} />
                {" "}
                {germinationDays}d germ
              </Text>
            )}
            {location && (
              <Text style={s.seedDetail}>
                <Ionicons name="location-outline" size={10} color={T.sysGray} />
                {" "}
                {location}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      {!last && <InsetDivider indent={62} />}
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SEEDS SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function SeedsScreen() {
  const { user } = useAuth();
  const { seeds, loading, refetch } = useUserSeeds(user?.uid);

  const handleAddSeed = async () => {
    if (!user) return;

    try {
      await addSeed(user.uid, {
        name: "Tomato",
        species: "Solanum lycopersicum",
        quantity: 50,
        type: "vegetable",
        plantingTemperature: { min: 15, max: 30 },
        germinationDays: 5,
        daysToMaturity: 70,
        location: "Kitchen drawer",
        notes: "Cherry tomato variety, good for containers",
      });
      Alert.alert("Success", "Seed added to your collection!");
      await refetch();
    } catch (error) {
      Alert.alert("Error", "Failed to add seed");
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={T.pageBg} />
      <SafeAreaView style={s.safe}>
        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={T.accentMid} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.content}
            bounces
          >
            {/* ════════════════════════════════════════════════
                HERO — Collection intro
                ════════════════════════════════════════════════ */}
            <Animated.View style={[s.heroCard, useFadeUp(50)]}>
              <Text style={s.heroTitle}>My Seeds</Text>
              <Text style={s.heroSub}>
                {seeds.length === 0
                  ? "Start your seed collection"
                  : `${seeds.length} varieties collected`}
              </Text>
            </Animated.View>

            {seeds.length === 0 ? (
              // Empty state
              <Animated.View style={[s.emptyCard, useFadeUp(100)]}>
                <Ionicons name="leaf-outline" size={48} color={T.sysGray} style={{ marginBottom: 12 }} />
                <Text style={s.emptyTitle}>No seeds yet</Text>
                <Text style={s.emptySub}>
                  Start building your seed collection
                </Text>
              </Animated.View>
            ) : (
              // Seeds list
              <>
                <SectionHeader title="My Collection" action={`${seeds.length}`} delay={100} />
                <Animated.View style={[{ marginHorizontal: 16 }, useFadeUp(120)]}>
                  <InsetList>
                    {seeds.map((seed, idx) => (
                      <View key={seed.id}>
                        <SeedRow
                          name={seed.name}
                          species={seed.species}
                          quantity={seed.quantity}
                          type={seed.type || "vegetable"}
                          germinationDays={seed.germinationDays}
                          daysToMaturity={seed.daysToMaturity}
                          location={seed.location}
                          delay={100 + idx * 50}
                          last={idx === seeds.length - 1}
                        />
                      </View>
                    ))}
                  </InsetList>
                </Animated.View>

                {/* Stats section */}
                <SectionHeader title="Storage Stats" delay={200} />
                <Animated.View style={[{ marginHorizontal: 16 }, useFadeUp(220)]}>
                  <InsetList>
                    <View style={s.statRow}>
                      <Text style={s.statLabel}>Vegetables</Text>
                      <Text style={s.statValue}>
                        {seeds.filter(s => s.type === "vegetable").length}
                      </Text>
                    </View>
                    <InsetDivider />
                    <View style={s.statRow}>
                      <Text style={s.statLabel}>Flowers</Text>
                      <Text style={s.statValue}>
                        {seeds.filter(s => s.type === "flower").length}
                      </Text>
                    </View>
                    <InsetDivider />
                    <View style={s.statRow}>
                      <Text style={s.statLabel}>Herbs & Others</Text>
                      <Text style={s.statValue}>
                        {seeds.filter(s => s.type !== "vegetable" && s.type !== "flower").length}
                      </Text>
                    </View>
                  </InsetList>
                </Animated.View>
              </>
            )}

            {/* Add button */}
            <Animated.View style={[{ marginHorizontal: 16, marginTop: 24 }, useFadeUp(280)]}>
              <TouchableOpacity
                style={s.addButton}
                onPress={handleAddSeed}
                activeOpacity={0.75}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={s.addButtonText}>Add Sample Seed</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer spacer */}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.pageBg },
  safe: { flex: 1 },
  content: { paddingTop: 20 },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero card
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 28,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: T.cardBg,
    borderRadius: 16,
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: T.label,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 14,
    color: T.labelSec,
    fontWeight: "400",
  },

  // Empty state
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 40,
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: T.label,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: T.labelSec,
    textAlign: "center",
  },

  // Sections
  sectionHeader: {
    marginHorizontal: 16,
    marginVertical: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: T.label,
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "500",
    color: T.accentMid,
  },

  // Inset list
  insetList: {
    backgroundColor: T.cardBg,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: T.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 20,
  },
  insetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: T.sep,
  },

  // Seed row
  seedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    backgroundColor: T.cardBg,
  },
  seedIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  seedBody: { flex: 1, gap: 6 },
  seedTopLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  seedName: {
    fontSize: 15,
    fontWeight: "600",
    color: T.label,
    letterSpacing: -0.2,
  },
  seedSpecies: {
    fontSize: 12,
    color: T.labelSec,
    fontWeight: "400",
    marginTop: 2,
  },
  seedQuantity: {
    alignItems: "flex-end",
  },
  quantityNum: {
    fontSize: 16,
    fontWeight: "700",
    color: T.label,
  },
  quantityLabel: {
    fontSize: 10,
    color: T.sysGray,
    fontWeight: "500",
  },
  seedDetails: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  seedDetail: {
    fontSize: 11,
    color: T.labelTert,
    fontWeight: "400",
  },

  // Stats
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: T.cardBg,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: T.label,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: T.accentMid,
  },

  // Add button
  addButton: {
    backgroundColor: T.accentMid,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    shadowColor: T.accentMid,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 32,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  seedCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  seedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  seedInfo: {
    flex: 1,
  },
  seedName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  seedSpecies: {
    fontSize: 12,
    fontStyle: "italic",
  },
  quantity: {
    fontSize: 16,
    fontWeight: "600",
  },
  seedDetails: {
    marginTop: 12,
  },
  detail: {
    fontSize: 13,
    marginBottom: 6,
  },
  notes: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  addButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
