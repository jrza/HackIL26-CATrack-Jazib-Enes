import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { C, HIT, R, S, T } from "../constants/theme";

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  defaultValue?: string;
  trailing?: "add" | "history" | "contact" | "location";
}

const ASSET_FIELDS: FieldDef[] = [
  { key: "serial", label: "Serial Number", placeholder: "Enter serial number", required: true },
  { key: "make", label: "Make", placeholder: "Enter make", defaultValue: "CATERPILLAR", required: true, trailing: "add" },
  { key: "family", label: "Product Family", placeholder: "Enter product family", defaultValue: "FAMILY-ALL", required: true, trailing: "add" },
  { key: "model", label: "Model", placeholder: "Enter model", required: true },
  { key: "smu", label: "Service Meter Unit", placeholder: "Enter service meter unit", required: true, trailing: "add" },
  { key: "smv", label: "Service Meter Value", placeholder: "Enter Service Meter Value", required: true },
  { key: "assetId", label: "Asset ID", placeholder: "Enter Asset ID", trailing: "history" },
  { key: "location", label: "Location", placeholder: "Enter location", defaultValue: "205 N Goodwin Ave, Urbana, IL", trailing: "location" },
];

const CUSTOMER_FIELDS: FieldDef[] = [
  { key: "ucid", label: "Customer UCID/Name", placeholder: "Select Customer", trailing: "contact" },
  { key: "phone", label: "Customer Phone", placeholder: "Enter customer phone" },
  { key: "email", label: "Email", placeholder: "Enter email" },
  { key: "workOrder", label: "Work Order", placeholder: "Enter work order" },
];

const EMAIL_FIELDS: FieldDef[] = [
  { key: "additionalEmail", label: "Additional Email", placeholder: "Enter email", trailing: "contact" },
];

function TrailingIcon({ type }: { type: string }) {
  const size = 22;
  const color = C.yellowDark;
  switch (type) {
    case "add":
      return (
        <View style={st.trailingCircle}>
          <Ionicons name="add" size={16} color={C.textOnYellow} />
        </View>
      );
    case "history":
      return <Ionicons name="time-outline" size={size} color={color} />;
    case "contact":
      return (
        <View style={st.trailingCircle}>
          <Ionicons name="person-outline" size={14} color={C.textOnYellow} />
        </View>
      );
    case "location":
      return <Ionicons name="navigate" size={size} color={color} />;
    default:
      return null;
  }
}

function FormField({
  field,
  value,
  onChangeText,
}: {
  field: FieldDef;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const isEmpty = !value.trim();
  const isRequired = field.required;

  return (
    <View style={st.fieldWrap}>
      <View style={st.fieldRow}>
        <View style={{ flex: 1 }}>
          <Text style={[st.fieldLabel, isRequired && isEmpty && st.fieldLabelRequired]}>
            {field.label}
            {isRequired ? " *" : ""}
          </Text>
          <TextInput
            style={[st.fieldInput, isRequired && isEmpty && st.fieldInputRequired]}
            placeholder={field.placeholder}
            placeholderTextColor={C.textTertiary}
            value={value}
            onChangeText={onChangeText}
          />
        </View>
        {field.trailing && (
          <View style={st.trailingWrap}>
            <TrailingIcon type={field.trailing} />
          </View>
        )}
      </View>
      <View
        style={[st.fieldDivider, isRequired && isEmpty && st.fieldDividerRequired]}
      />
    </View>
  );
}

export default function CustomerAssetScreen() {
  const router = useRouter();

  const defaults: Record<string, string> = {};
  [...ASSET_FIELDS, ...CUSTOMER_FIELDS, ...EMAIL_FIELDS].forEach((f) => {
    defaults[f.key] = f.defaultValue ?? "";
  });
  const [values, setValues] = useState<Record<string, string>>(defaults);

  const set = (key: string) => (v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <SafeAreaView style={{ backgroundColor: C.canvas }} />

      {/* ── Header ─────────────────────────────── */}
      <View style={st.headerOuter}>
        <View style={st.headerGlass}>
          <TouchableOpacity
            style={st.headerBtn}
            activeOpacity={0.5}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>

          <Text style={st.headerTitle}>Customer & Asset Info</Text>

          <View style={st.headerBtn} />
        </View>
      </View>

      {/* ── Body ───────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={st.scroll}
          contentContainerStyle={st.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Scan buttons ───────────────────── */}
          <View style={st.section}>
            <Text style={st.sectionTitle}>Scan</Text>
            <View style={st.scanRow}>
              <TouchableOpacity style={st.scanBtn} activeOpacity={0.7}>
                <Ionicons name="qr-code-outline" size={20} color={C.textPrimary} />
                <Text style={st.scanBtnText}>Asset QR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.scanBtn} activeOpacity={0.7}>
                <Ionicons name="barcode-outline" size={20} color={C.textPrimary} />
                <Text style={st.scanBtnText}>CAT PIN</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Asset Info ─────────────────────── */}
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <Text style={st.sectionTitle}>Asset Info</Text>
              <Ionicons name="time-outline" size={20} color={C.textPrimary} />
            </View>
            {ASSET_FIELDS.map((f) => (
              <FormField
                key={f.key}
                field={f}
                value={values[f.key]}
                onChangeText={set(f.key)}
              />
            ))}
          </View>

          {/* ── Customer Info ──────────────────── */}
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <Text style={st.sectionTitle}>Customer Info</Text>
              <Ionicons name="time-outline" size={20} color={C.textPrimary} />
            </View>
            {CUSTOMER_FIELDS.map((f) => (
              <FormField
                key={f.key}
                field={f}
                value={values[f.key]}
                onChangeText={set(f.key)}
              />
            ))}
          </View>

          {/* ── Additional Emails ──────────────── */}
          <View style={st.section}>
            <View style={st.sectionHeader}>
              <Text style={st.sectionTitle}>Additional Emails</Text>
              <View style={st.trailingCircle}>
                <Ionicons name="add" size={16} color={C.textOnYellow} />
              </View>
            </View>
            {EMAIL_FIELDS.map((f) => (
              <FormField
                key={f.key}
                field={f}
                value={values[f.key]}
                onChangeText={set(f.key)}
              />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom CTA ─────────────────────────── */}
      <SafeAreaView>
        <View style={st.bottomBar}>
          <TouchableOpacity style={st.ctaBtn} activeOpacity={0.85}>
            <Text style={st.ctaBtnText}>General Info Comments</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const st = StyleSheet.create({
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: S[20],
    paddingTop: S[24],
    paddingBottom: S[32],
    gap: S[32],
  },

  // Sections
  section: {
    gap: S[16],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[8],
  },
  sectionTitle: {
    ...T.xl,
    ...T.w7,
    color: C.textPrimary,
  },

  // Scan buttons
  scanRow: {
    flexDirection: "row",
    gap: S[12],
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[8],
    backgroundColor: C.glass,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.borderStrong,
    paddingHorizontal: S[20],
    paddingVertical: S[12],
  },
  scanBtnText: {
    ...T.base,
    ...T.w6,
    color: C.textPrimary,
  },

  // Fields
  fieldWrap: {
    gap: S[2],
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  fieldLabel: {
    ...T.sm,
    ...T.w5,
    color: C.textPrimary,
    marginBottom: S[4],
  },
  fieldLabelRequired: {
    color: C.critical,
  },
  fieldInput: {
    ...T.base,
    ...T.w4,
    color: C.textPrimary,
    paddingVertical: S[8],
    paddingRight: S[48],
  },
  fieldInputRequired: {},
  fieldDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  fieldDividerRequired: {
    height: 2,
    backgroundColor: C.critical,
  },
  trailingWrap: {
    position: "absolute",
    right: 0,
    bottom: S[8],
  },
  trailingCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.yellow,
    justifyContent: "center",
    alignItems: "center",
  },

  // Bottom
  bottomBar: {
    paddingHorizontal: S[16],
    paddingTop: S[12],
    paddingBottom: S[12],
  },
  ctaBtn: {
    backgroundColor: C.yellow,
    borderRadius: R.xl,
    height: HIT.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  ctaBtnText: {
    ...T.base,
    ...T.w7,
    color: C.textOnYellow,
    letterSpacing: 0.3,
  },
});
