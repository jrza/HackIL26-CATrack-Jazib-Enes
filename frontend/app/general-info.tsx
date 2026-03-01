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

type Rating = "normal" | "monitor" | "action" | "na" | null;

const RATINGS: { key: Rating; label: string; bg: string; text: string }[] = [
  { key: "normal",  label: "Normal",  bg: "#2E8B42", text: "#fff" },
  { key: "monitor", label: "Monitor", bg: C.yellow,  text: "#fff" },
  { key: "action",  label: "Action",  bg: "#CF3333", text: "#fff" },
  { key: "na",      label: "N/A",     bg: "#A0A0A0", text: "#fff" },
];

export default function GeneralInfoScreen() {
  const router = useRouter();
  const [rating, setRating] = useState<Rating>(null);
  const [comment, setComment] = useState("");

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <SafeAreaView style={{ backgroundColor: C.canvas }} />

      {/* ── Header ─────────────────────────────── */}
      <View style={s.headerOuter}>
        <View style={s.headerGlass}>
          <TouchableOpacity
            style={s.headerBtn}
            activeOpacity={0.5}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>General Info & Comments</Text>
          <View style={s.headerBtn} />
        </View>
      </View>

      {/* ── Body ───────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Rating ─────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Rating</Text>
            <View style={s.ratingGrid}>
              {RATINGS.map((r) => {
                const active = rating === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      s.ratingBtn,
                      { backgroundColor: r.bg },
                      active && s.ratingBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setRating(r.key)}
                  >
                    <Text style={[s.ratingText, { color: r.text }]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Comments ───────────────────────── */}
          <View style={s.section}>
            <Text style={s.fieldLabel}>Comments</Text>
            <TextInput
              style={s.commentInput}
              placeholder="Add comments"
              placeholderTextColor={C.textTertiary}
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* ── spacer ─────────────────────────── */}
          <View style={{ height: S[48] }} />

          {/* ── Media actions ──────────────────── */}
          <View style={s.mediaSection}>
            {/* Take Photo */}
            <View style={s.mediaRow}>
              <TouchableOpacity style={s.mediaBtn} activeOpacity={0.7}>
                <Ionicons name="image" size={20} color={C.textSecondary} />
                <Text style={s.mediaBtnText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mediaIconBtn} activeOpacity={0.7}>
                <Text style={s.hdText}>HD</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mediaIconBtn} activeOpacity={0.7}>
                <Ionicons name="camera" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Take Video */}
            <View style={s.mediaRow}>
              <TouchableOpacity style={s.mediaBtn} activeOpacity={0.7}>
                <Ionicons name="videocam" size={20} color={C.textSecondary} />
                <Text style={s.mediaBtnText}>Take Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mediaIconBtn} activeOpacity={0.7}>
                <Ionicons name="film-outline" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Upload Attachment */}
            <TouchableOpacity style={s.uploadBtn} activeOpacity={0.7}>
              <Ionicons name="attach" size={20} color={C.textSecondary} />
              <Text style={s.mediaBtnText}>Upload Attachment</Text>
            </TouchableOpacity>
          </View>

          {/* ── Uploaded ───────────────────────── */}
          <View style={s.section}>
            <Text style={s.uploadedTitle}>Uploaded</Text>
            <Text style={s.uploadedEmpty}>
              No images or documents uploaded
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom bar ─────────────────────────── */}
      <SafeAreaView>
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={s.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Text style={s.secondaryBtnText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.nextBtn} activeOpacity={0.85}>
            <Text style={s.nextBtnText}>Next</Text>
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: S[20],
    paddingTop: S[24],
    paddingBottom: S[24],
    gap: S[24],
  },

  // Section
  section: {
    gap: S[12],
  },
  sectionTitle: {
    ...T.xl,
    ...T.w7,
    color: C.textPrimary,
  },

  // Rating grid
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: S[8],
  },
  ratingBtn: {
    width: "48%",
    height: HIT.std,
    borderRadius: R.md,
    justifyContent: "center",
    paddingHorizontal: S[16],
  },
  ratingBtnActive: {
    borderWidth: 3,
    borderColor: C.textPrimary,
  },
  ratingText: {
    ...T.base,
    ...T.w7,
  },

  // Comments
  fieldLabel: {
    ...T.base,
    ...T.w6,
    color: C.textPrimary,
  },
  commentInput: {
    ...T.base,
    ...T.w4,
    color: C.textPrimary,
    minHeight: 80,
    paddingTop: 0,
  },

  // Media
  mediaSection: {
    gap: S[8],
  },
  mediaRow: {
    flexDirection: "row",
    gap: S[8],
  },
  mediaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: S[8],
    backgroundColor: C.glassMuted,
    borderRadius: R.lg,
    height: HIT.std,
  },
  mediaBtnText: {
    ...T.base,
    ...T.w5,
    color: C.textPrimary,
  },
  mediaIconBtn: {
    width: HIT.std,
    height: HIT.std,
    backgroundColor: C.glassMuted,
    borderRadius: R.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  hdText: {
    ...T.sm,
    ...T.w7,
    color: C.textSecondary,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: S[8],
    backgroundColor: C.glassMuted,
    borderRadius: R.lg,
    height: HIT.std,
  },

  // Uploaded
  uploadedTitle: {
    ...T.lg,
    ...T.w7,
    color: C.textPrimary,
  },
  uploadedEmpty: {
    ...T.base,
    ...T.w4,
    color: C.textSecondary,
    paddingLeft: S[16],
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
  nextBtn: {
    flex: 1.5,
    backgroundColor: C.yellow,
    borderRadius: R.lg,
    height: HIT.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  nextBtnText: {
    ...T.base,
    ...T.w7,
    color: C.textOnYellow,
    letterSpacing: 0.5,
  },
});
