import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CatLogo from "../components/CatLogo";
import { C, HIT, R, S, T } from "../constants/theme";
import {
  getMachineDetail,
  startInspection,
  Machine,
  InspectionTemplate,
} from "../services/api";

type Icon = React.ComponentProps<typeof Ionicons>["name"];

interface SectionItem {
  label: string;
  icon: Icon;
  status?: "complete" | "incomplete" | "none";
  detail?: string;
  route?: string;
}

function StatusDot({ status }: { status?: string }) {
  if (status === "incomplete") {
    return <View style={[s.dot, { backgroundColor: C.critical }]} />;
  }
  if (status === "complete") {
    return <View style={[s.dot, { backgroundColor: C.pass }]} />;
  }
  return null;
}

export default function InspectionCreateScreen() {
  const router = useRouter();
  const { assetId } = useLocalSearchParams<{ assetId?: string }>();

  const [machine, setMachine] = useState<Machine | null>(null);
  const [template, setTemplate] = useState<InspectionTemplate | null>(null);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!assetId) return;
    setLoading(true);
    getMachineDetail(assetId)
      .then(async (detail) => {
        setMachine(detail.machine);
        setTemplate(detail.template);
        const session = await startInspection(assetId);
        setInspectionId(session.id);
      })
      .catch((err) => {
        Alert.alert("Error", `Could not start inspection: ${(err as Error).message}`);
      })
      .finally(() => setLoading(false));
  }, [assetId]);

  const sections: SectionItem[] = [
    {
      label: "Assignment Notes",
      icon: "chatbubble-outline",
      status: "none",
    },
    {
      label: "Customer & Asset Info",
      icon: "business-outline",
      status: machine ? "complete" : "incomplete",
      route: "/customer-asset",
    },
    {
      label: "General Info & Comments",
      icon: "document-text-outline",
      status: "none",
      route: "/general-info",
    },
    {
      label: "1. Walk Around",
      icon: "walk-outline",
      status: "none",
      detail: template ? `0 of ${template.checkpoints.length}` : "0 of 5",
      route: "/walkaround",
    },
  ];

  const handleSectionPress = (section: SectionItem) => {
    if (!section.route) return;
    if (section.label.includes("Walk Around")) {
      if (!inspectionId) {
        Alert.alert("Please wait", "Inspection is being created...");
        return;
      }
      router.push(`/walkaround?inspectionId=${inspectionId}` as any);
    } else if (section.label.includes("Customer & Asset")) {
      router.push("/customer-asset" as any);
    } else if (section.label.includes("General Info")) {
      router.push("/general-info" as any);
    }
  };

  const handleSubmit = async () => {
    if (!inspectionId) {
      Alert.alert("Not ready", "Inspection has not been created yet.");
      return;
    }
    setSubmitting(true);
    router.push(`/inspection/complete?inspectionId=${inspectionId}` as any);
    setSubmitting(false);
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

          <Text style={s.headerTitle}>Daily Inspection</Text>

          <TouchableOpacity style={s.headerBtn} activeOpacity={0.5}>
            <Ionicons name="trash-outline" size={20} color={C.critical} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Machine badge ──────────────────────────── */}
      <View style={s.machineBadge}>
        <View style={s.machineBadgeHighlight} />
        <View style={s.machineBadgeInner}>
          <CatLogo size={22} letterColor={C.charcoal} triangleColor={C.yellow} />
          <View style={s.machineTextGroup}>
            {loading ? (
              <ActivityIndicator size="small" color={C.yellow} />
            ) : (
              <>
                <Text style={s.machineFamily}>
                  {machine ? machine.name : assetId ?? "UNKNOWN ASSET"}
                </Text>
                <Text style={s.machineMake}>
                  {machine ? machine.machine_type : "CATERPILLAR"}
                </Text>
              </>
            )}
          </View>
          {inspectionId && (
            <View style={s.inspIdBadge}>
              <Ionicons name="checkmark-circle" size={14} color={C.pass} />
              <Text style={s.inspIdText}>Created</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Sync info ──────────────────────────────── */}
      <View style={s.syncRow}>
        <Ionicons
          name={inspectionId ? "cloud-done-outline" : "cloud-outline"}
          size={14}
          color={C.textTertiary}
        />
        <Text style={s.syncText}>
          {inspectionId
            ? `Inspection ID: ${inspectionId.slice(0, 8)}…`
            : "Preparing inspection…"}
        </Text>
      </View>

      {/* ── Sections list ──────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, i) => (
          <TouchableOpacity
            key={i}
            style={s.sectionCard}
            activeOpacity={section.route ? 0.7 : 1}
            onPress={() => handleSectionPress(section)}
          >
            <View style={s.sectionHighlight} />
            <View style={s.sectionInner}>
              <View style={s.sectionLeft}>
                <View style={s.sectionIconWrap}>
                  <Ionicons name={section.icon} size={20} color={C.charcoal} />
                </View>
                <View style={s.sectionTextGroup}>
                  <View style={s.sectionLabelRow}>
                    <StatusDot status={section.status} />
                    <Text style={s.sectionLabel}>{section.label}</Text>
                  </View>
                  {section.detail && (
                    <Text style={s.sectionDetail}>{section.detail}</Text>
                  )}
                </View>
              </View>
              {section.route && (
                <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Bottom actions ─────────────────────────── */}
      <SafeAreaView>
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Text style={s.secondaryBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.submitBtn, (!inspectionId || submitting) && s.submitBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={!inspectionId || submitting}
          >
            <Text style={s.submitBtnText}>
              {submitting ? "Submitting…" : "Submit"}
            </Text>
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

  // Machine badge
  machineBadge: {
    marginHorizontal: S[16],
    marginTop: S[12],
    backgroundColor: C.glass,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  machineBadgeHighlight: {
    height: 1,
    backgroundColor: C.edgeLight,
  },
  machineBadgeInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: S[16],
    paddingVertical: S[16],
    gap: S[12],
  },
  machineTextGroup: {
    flex: 1,
    gap: S[2],
  },
  machineFamily: {
    ...T.base,
    ...T.w7,
    color: C.textPrimary,
  },
  machineMake: {
    ...T.sm,
    ...T.w5,
    color: C.textSecondary,
  },
  inspIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[4],
  },
  inspIdText: {
    ...T.xs,
    ...T.w6,
    color: C.pass,
  },

  // Sync
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[6],
    paddingHorizontal: S[16],
    paddingTop: S[8],
    paddingBottom: S[4],
  },
  syncText: {
    ...T.xs,
    color: C.textTertiary,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: S[16],
    paddingTop: S[8],
    paddingBottom: S[24],
    gap: S[8],
  },

  // Section card
  sectionCard: {
    backgroundColor: C.glass,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  sectionHighlight: {
    height: 1,
    backgroundColor: C.edgeLight,
  },
  sectionInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S[16],
    paddingVertical: S[16],
    gap: S[12],
  },
  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[12],
    flex: 1,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: R.pill,
    backgroundColor: C.glassMuted,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTextGroup: {
    flex: 1,
    gap: S[4],
  },
  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[8],
  },
  sectionLabel: {
    ...T.base,
    ...T.w6,
    color: C.textPrimary,
  },
  sectionDetail: {
    ...T.sm,
    color: C.textTertiary,
  },

  // Status dot
  dot: {
    width: 8,
    height: 8,
    borderRadius: R.pill,
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
    overflow: "hidden",
  },
  secondaryBtnText: {
    ...T.base,
    ...T.w6,
    color: C.textPrimary,
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: C.yellow,
    borderRadius: R.lg,
    height: HIT.lg,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    ...T.base,
    ...T.w7,
    color: C.textOnYellow,
    letterSpacing: 0.5,
  },
});
