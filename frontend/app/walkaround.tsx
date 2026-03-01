import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { C, HIT, R, S, T } from "../constants/theme";

type Rating = "normal" | "monitor" | "action" | "na" | null;
type Icon = React.ComponentProps<typeof Ionicons>["name"];

interface CheckItem {
  id: string;
  label: string;
}

const CHECKLIST: CheckItem[] = [
  {
    id: "1.1",
    label:
      "Check fluid levels, including engine oil, transmission fluid, coolant system, and any other compartments on the asset.",
  },
  {
    id: "1.2",
    label:
      "Look for signs of leaks around engine, hydraulic components, and coolant system.",
  },
  {
    id: "1.3",
    label:
      "Confirm head lights, backup lights, turn signals and other visual and audible alarms are working properly.",
  },
  {
    id: "1.4",
    label:
      "Look for cracked or broken glass, missing or broken mirrors, flat or damaged tires, damaged steps, hand grips and safety rails (where applicable).",
  },
  {
    id: "1.5",
    label:
      "Look for active alarms or fault code notifications in the cab and on the electronics display.",
  },
];

const OPTIONS: { key: Rating; label: string; icon: Icon; color: string }[] = [
  { key: "normal",  label: "Normal",  icon: "checkmark-circle", color: C.pass    },
  { key: "monitor", label: "Monitor", icon: "warning",          color: C.monitor },
  { key: "action",  label: "Action",  icon: "alert",            color: C.critical },
  { key: "na",      label: "N/A",     icon: "checkmark",        color: C.textTertiary },
];

export default function WalkAroundScreen() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, Rating>>({});

  const setRating = (id: string, value: Rating) => {
    setRatings((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <SafeAreaView style={{ backgroundColor: C.canvas }} />

      {/* ── Header ─────────────────────────────────── */}
      <View style={s.headerOuter}>
        <View style={s.headerGlass}>
          <TouchableOpacity
            style={s.headerBtn}
            activeOpacity={0.5}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>

          <Text style={s.headerTitle}>Walk Around</Text>

          <View style={s.headerBtn} />
        </View>
      </View>

      {/* ── Checklist ──────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CHECKLIST.map((item) => {
          const selected = ratings[item.id] ?? null;
          return (
            <View key={item.id} style={s.card}>
              <View style={s.cardHighlight} />
              <View style={s.cardBody}>
                <Text style={s.cardLabel}>
                  {item.id} {item.label}
                </Text>

                <View style={s.optionsList}>
                  {OPTIONS.map((opt) => {
                    const active = selected === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[s.optionRow, active && s.optionRowActive]}
                        activeOpacity={0.6}
                        onPress={() => setRating(item.id, opt.key)}
                      >
                        <Ionicons
                          name={active ? opt.icon : (`${opt.icon}-outline` as Icon)}
                          size={22}
                          color={active ? opt.color : C.textTertiary}
                        />
                        <Text
                          style={[
                            s.optionLabel,
                            active && { color: C.textPrimary, ...T.w6 },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Bottom bar ─────────────────────────────── */}
      <SafeAreaView>
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Text style={s.secondaryBtnText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.doneBtn} activeOpacity={0.85}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.canvas,
  },

  // Header
  headerOuter: {
    paddingHorizontal: S[16],
    paddingTop: S[8],
    paddingBottom: S[4],
  },
  headerGlass: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.glassStrong,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.edgeLight,
    height: 52,
    paddingHorizontal: S[4],
    overflow: "hidden",
  },
  headerBtn: {
    width: HIT.min,
    height: HIT.min,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...T.lg,
    ...T.w6,
    color: C.textPrimary,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: S[16],
    paddingTop: S[12],
    paddingBottom: S[24],
    gap: S[16],
  },

  // Card
  card: {
    backgroundColor: C.glass,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  cardHighlight: {
    height: 1,
    backgroundColor: C.edgeLight,
  },
  cardBody: {
    padding: S[16],
    gap: S[16],
  },
  cardLabel: {
    ...T.base,
    ...T.w6,
    color: C.textPrimary,
    lineHeight: 24,
  },

  // Options
  optionsList: {
    gap: S[4],
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[12],
    paddingVertical: S[12],
    paddingHorizontal: S[12],
    borderRadius: R.md,
    minHeight: HIT.min,
  },
  optionRowActive: {
    backgroundColor: C.glassMuted,
  },
  optionLabel: {
    ...T.base,
    ...T.w5,
    color: C.textSecondary,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    gap: S[12],
    paddingHorizontal: S[16],
    paddingTop: S[12],
    paddingBottom: S[12],
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: C.glass,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    height: HIT.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnText: {
    ...T.base,
    ...T.w6,
    color: C.textPrimary,
  },
  doneBtn: {
    flex: 1.5,
    backgroundColor: C.yellow,
    borderRadius: R.lg,
    height: HIT.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  doneBtnText: {
    ...T.base,
    ...T.w7,
    color: C.textOnYellow,
    letterSpacing: 0.5,
  },
});
