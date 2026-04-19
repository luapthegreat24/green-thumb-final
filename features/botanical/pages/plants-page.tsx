import { useAuth } from "@/contexts/auth";
import { botanical } from "@/features/botanical/design";
import {
  BotanicalButton,
  BotanicalCard,
  BotanicalChoiceRow,
  BotanicalHeading,
  BotanicalInput,
  BotanicalScreen,
} from "@/features/botanical/ui";
import { addPlant } from "@/services/firestore";
import { Timestamp } from "firebase/firestore";
import React, { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";

const SUNLIGHT_OPTIONS = ["Low light", "Bright indirect", "Direct sun", "Partial shade"];
const STATUS_OPTIONS = ["Healthy", "Needs Water", "Needs Fertilizer"];

export function PlantsPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [notes, setNotes] = useState("");
  const [sunlight, setSunlight] = useState(SUNLIGHT_OPTIONS[1]);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => Boolean(name.trim() || species.trim()), [name, species]);

  const savePlant = async () => {
    if (!user) {
      Alert.alert("Authentication Required", "Please sign in to save plants.");
      return;
    }

    if (!canSave) {
      Alert.alert("Missing Information", "Please add a plant name or species.");
      return;
    }

    setSaving(true);
    try {
      const plantName = name.trim() || species.trim();
      await addPlant(user.uid, {
        name: plantName,
        species: species.trim() || "Unknown species",
        waterFrequency: status === "Needs Water" ? 2 : status === "Needs Fertilizer" ? 7 : 4,
        lastWatered: Timestamp.now(),
        notes: [
          `Status: ${status}`,
          `Sunlight: ${sunlight}`,
          notes.trim() ? `Notes: ${notes.trim()}` : "",
        ]
          .filter(Boolean)
          .join(" | "),
      });

      Alert.alert("Saved", `${plantName} has been added to your garden.`);
      setName("");
      setSpecies("");
      setNotes("");
      setSunlight(SUNLIGHT_OPTIONS[1]);
      setStatus(STATUS_OPTIONS[0]);
    } catch (error: any) {
      Alert.alert("Save Error", error?.message ?? "Unable to save this plant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BotanicalScreen>
      <BotanicalHeading
        kicker="Herbarium Entry"
        title="My Garden"
        subtitle="Capture a specimen with the same pressed-paper visual language used across auth and home pages."
      />

      <BotanicalCard>
        <BotanicalInput label="Plant Name" placeholder="Kitchen Pothos" value={name} onChangeText={setName} />
        <BotanicalInput label="Scientific Name" placeholder="Epipremnum aureum" value={species} onChangeText={setSpecies} />
        <BotanicalInput
          label="Notes"
          placeholder="Leaf condition, room, reminders..."
          value={notes}
          onChangeText={setNotes}
          multiline
          style={{ height: 96, textAlignVertical: "top", paddingTop: 10 }}
        />
      </BotanicalCard>

      <BotanicalCard>
        <Text style={{ color: botanical.color.inkGhost, fontWeight: "700", letterSpacing: 1.2 }}>SUNLIGHT</Text>
        <BotanicalChoiceRow options={SUNLIGHT_OPTIONS} value={sunlight} onChange={setSunlight} />
      </BotanicalCard>

      <BotanicalCard>
        <Text style={{ color: botanical.color.inkGhost, fontWeight: "700", letterSpacing: 1.2 }}>CURRENT STATUS</Text>
        <BotanicalChoiceRow options={STATUS_OPTIONS} value={status} onChange={setStatus} />
      </BotanicalCard>

      <View style={{ gap: 10 }}>
        <BotanicalButton
          label={saving ? "Saving..." : "Add to Garden"}
          onPress={savePlant}
          disabled={!canSave || saving}
        />
        <BotanicalButton
          label="Clear Entry"
          tone="secondary"
          onPress={() => {
            setName("");
            setSpecies("");
            setNotes("");
            setSunlight(SUNLIGHT_OPTIONS[1]);
            setStatus(STATUS_OPTIONS[0]);
          }}
        />
      </View>
    </BotanicalScreen>
  );
}
