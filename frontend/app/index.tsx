import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import CatLogo from "../components/CatLogo";
import MetaLogo from "../components/MetaLogo";
import HandsFreeOverlay from "../components/HandsFreeOverlay";
import { C, HIT, R, S, T } from "../constants/theme";

type Icon = React.ComponentProps<typeof Ionicons>["name"];

const TABS_LEFT: { id: string; label: string; icon: Icon; active: Icon }[] = [
  { id: "fleet", label: "Fleet", icon: "car-outline", active: "car" },
  {
    id: "inspections",
    label: "Inspections",
    icon: "clipboard-outline",
    active: "clipboard",
  },
];

const TABS_RIGHT: { id: string; label: string; icon: Icon; active: Icon }[] = [
  {
    id: "reports",
    label: "Reports",
    icon: "document-text-outline",
    active: "document-text",
  },
  { id: "favorites", label: "Favorites", icon: "star-outline", active: "star" },
];

const MENU_ITEMS: { label: string; icon: Icon; danger?: boolean }[] = [
  { label: "Settings", icon: "settings-outline" },
  { label: "Statistics", icon: "bar-chart-outline" },
  { label: "Support", icon: "help-circle-outline" },
  { label: "Legal Notices", icon: "document-text-outline" },
  { label: "Sign out", icon: "log-out-outline", danger: true },
];

interface Inspection {
  id: string;
  title: string;
  type: string;
  location?: string;
  lastUpdate: string;
  number: string;
}

const INSPECTIONS: Inspection[] = [
  {
    id: "1",
    title: "Daily Inspection",
    type: "Daily",
    lastUpdate: "2/28/2026, 12:01:31 PM",
    number: "27542923",
  },
  {
    id: "2",
    title: "Daily Inspection",
    type: "Daily",
    lastUpdate: "2/28/2026, 12:01:27 PM",
    number: "27538402",
  },
  {
    id: "3",
    title: "Daily Inspection",
    type: "Daily",
    location: "205 N Goodwin Ave, Urbana, IL",
    lastUpdate: "2/28/2026, 12:01:18 PM",
    number: "27542848",
  },
  {
    id: "4",
    title: "Daily Inspection",
    type: "Daily",
    location: "201 N Goodwin Ave, Urbana, IL",
    lastUpdate: "2/28/2026, 11:10:36 AM",
    number: "27542000",
  },
  {
    id: "5",
    title: "Daily Inspection",
    type: "Daily",
    lastUpdate: "2/28/2026, 10:51:40 AM",
    number: "27540025",
  },
];

const INSP_TABS = ["In Progress", "Assigned", "Submitted"] as const;

export default function FleetScreen() {
  const router = useRouter();
  const [tab, setTab] = useState("fleet");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [inspFilter, setInspFilter] = useState<string>("In Progress");
  const [inspSearch, setInspSearch] = useState("");
  const [handsFreeOpen, setHandsFreeOpen] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const filteredInspections = useMemo(() => {
    if (!inspSearch.trim()) return INSPECTIONS;
    const q = inspSearch.toLowerCase();
    return INSPECTIONS.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.number.includes(q) ||
        i.location?.toLowerCase().includes(q),
    );
  }, [inspSearch]);

  const openMenu = () => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -320,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setMenuOpen(false));
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <SafeAreaView style={{ backgroundColor: C.canvas }} />

      {/* ── Floating header ────────────────────────── */}
      <View style={s.headerOuter}>
        <View style={s.headerGlass}>
          {searching ? (
            <>
              <TouchableOpacity
                style={s.headerBtn}
                activeOpacity={0.5}
                onPress={() => {
                  setSearching(false);
                }}
              >
                <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
              </TouchableOpacity>

              <View style={s.searchInline}>
                <TextInput
                  ref={searchRef}
                  style={s.searchInput}
                  placeholder="Search machines..."
                  placeholderTextColor={C.textTertiary}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={s.headerBtn}
                activeOpacity={0.5}
                onPress={() => {
                  setSearching(false);
                }}
              >
                <Ionicons name="close" size={20} color={C.textTertiary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={s.headerSide}>
                <TouchableOpacity
                  style={s.headerBtn}
                  activeOpacity={0.5}
                  onPress={openMenu}
                >
                  <Ionicons name="menu" size={22} color={C.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={s.logoGroup}>
                <CatLogo
                  size={34}
                  letterColor={C.charcoal}
                  triangleColor={C.yellow}
                />
              </View>

              <View style={[s.headerSide, { justifyContent: "flex-end" }]}>
                <TouchableOpacity
                  style={s.headerBtn}
                  activeOpacity={0.5}
                  onPress={() => setSearching(true)}
                >
                  <Ionicons name="search" size={20} color={C.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.headerBtn}
                  activeOpacity={0.5}
                  onPress={() => router.push("/scan")}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={20}
                    color={C.textPrimary}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* ── Body ───────────────────────────────────── */}
      {tab === "inspections" ? (
        <View style={s.body}>
          {/* Filter tabs */}
          <View style={s.inspFilterBar}>
            {INSP_TABS.map((f, i) => {
              const on = inspFilter === f;
              return (
                <React.Fragment key={f}>
                  {i === INSP_TABS.length - 1 && (
                    <View style={s.inspFilterDiv} />
                  )}
                  <TouchableOpacity
                    style={[s.inspFilterTab, on && s.inspFilterTabOn]}
                    onPress={() => setInspFilter(f)}
                    activeOpacity={0.6}
                  >
                    <Text style={[s.inspFilterText, on && s.inspFilterTextOn]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>

          {/* Search */}
          <View style={s.inspSearchWrap}>
            <Ionicons name="search" size={16} color={C.textTertiary} />
            <TextInput
              style={s.inspSearchInput}
              placeholder="Filter Inspections"
              placeholderTextColor={C.textTertiary}
              value={inspSearch}
              onChangeText={setInspSearch}
            />
          </View>

          {/* List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={s.inspList}
            showsVerticalScrollIndicator={false}
          >
            {filteredInspections.map((insp) => (
              <TouchableOpacity
                key={insp.id}
                style={s.inspCard}
                activeOpacity={0.7}
                onPress={() => router.push("/inspection-create")}
              >
                <View style={s.inspCardBody}>
                  <Text style={s.inspTitle}>{insp.title}</Text>
                  <Text style={s.inspType}>{insp.type}</Text>
                  {insp.location && (
                    <Text style={s.inspLocation}>{insp.location}</Text>
                  )}
                  <Text style={s.inspMeta}>Last Update: {insp.lastUpdate}</Text>
                  <Text style={s.inspMeta}>
                    Inspection Number: {insp.number}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={C.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={s.body}>
          <View style={s.empty}>
            <Ionicons
              name="construct-outline"
              size={32}
              color={C.textTertiary}
            />
            <Text style={s.emptyTitle}>No Assets Available</Text>
            <Text style={s.emptySub}>
              Scan a machine QR code or create{"\n"}an inspection to get
              started.
            </Text>
          </View>

          <View style={s.actions}>
            <TouchableOpacity style={s.glassCard} activeOpacity={0.75} onPress={() => setHandsFreeOpen(true)}>
              <View style={s.glassHighlight} />
              <View style={s.glassInner}>
                <View style={s.glassIconCircle}>
                  <Ionicons
                    name="glasses-outline"
                    size={24}
                    color={C.charcoal}
                  />
                </View>
                <View style={s.glassText}>
                  <Text style={s.glassTitle}>Hands-free Mode</Text>
                  <Text style={s.glassSub}>
                    Connect supported Meta AI glasses
                  </Text>
                </View>
                <View style={s.metaChip}>
                  <MetaLogo size={20} />
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.cta}
              activeOpacity={0.85}
              onPress={() => router.push("/inspection-create")}
            >
              <View style={s.ctaHighlight} />
              <Text style={s.ctaText}>Create Inspection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Tab bar ────────────────────────────────── */}
      <View style={s.tabOuter}>
        <View style={s.tabRow}>
          {TABS_LEFT.map((t) => {
            const on = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.tab, on && s.tabActive]}
                onPress={() => setTab(t.id)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={on ? t.active : t.icon}
                  size={21}
                  color={on ? C.charcoal : C.textTertiary}
                />
                <Text style={[s.tabLabel, on && s.tabLabelOn]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* ── Center AI button ── */}
          <View style={s.aiFabSlot}>
            <TouchableOpacity style={s.aiFab} activeOpacity={0.8} onPress={() => router.push("/chat")}>
              <View style={s.aiFabRing}>
                <Ionicons name="sparkles" size={24} color={C.yellow} />
              </View>
            </TouchableOpacity>
            <Text style={s.aiFabLabel}>Cat AI</Text>
          </View>

          {TABS_RIGHT.map((t) => {
            const on = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.tab, on && s.tabActive]}
                onPress={() => setTab(t.id)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={on ? t.active : t.icon}
                  size={21}
                  color={on ? C.charcoal : C.textTertiary}
                />
                <Text style={[s.tabLabel, on && s.tabLabelOn]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Drawer menu ────────────────────────────── */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        {/* Blur overlay */}
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
            <BlurView
              intensity={40}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </TouchableWithoutFeedback>

        {/* Slide-in panel */}
        <Animated.View
          style={[s.drawer, { transform: [{ translateX: slideAnim }] }]}
        >
          <SafeAreaView style={{ flex: 1 }}>
            {/* Drawer header */}
            <View style={s.drawerHeader}>
              <CatLogo
                size={32}
                letterColor={C.charcoal}
                triangleColor={C.yellow}
              />
              <TouchableOpacity
                style={s.drawerHeaderClose}
                onPress={closeMenu}
                activeOpacity={0.6}
              >
                <Ionicons name="close" size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.drawerDivider} />

            {/* Menu items */}
            <View style={s.drawerItems}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={s.drawerItem}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.danger ? C.critical : C.textSecondary}
                  />
                  <Text
                    style={[
                      s.drawerItemLabel,
                      item.danger && s.drawerItemDanger,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SafeAreaView>
        </Animated.View>
      </Modal>

      <HandsFreeOverlay
        visible={handsFreeOpen}
        onClose={() => setHandsFreeOpen(false)}
      />
    </View>
  );
}

const DRAWER_W = 280;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.canvas,
  },

  // ── Header
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
  headerSide: {
    flexDirection: "row",
    alignItems: "center",
    width: 96,
  },
  logoGroup: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Inline search (expands inside header)
  searchInline: {
    flex: 1,
    height: HIT.min,
    justifyContent: "center",
  },
  searchInput: {
    ...T.base,
    color: C.textPrimary,
    height: "100%",
  },

  // ── Body
  body: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: S[8],
  },

  // ── Empty state
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: S[12],
  },
  emptyTitle: { ...T.base, ...T.w6, color: C.textPrimary },
  emptySub: { ...T.sm, color: C.textSecondary, textAlign: "center" },

  // ── Actions
  actions: { paddingHorizontal: S[16], gap: S[12] },

  glassCard: {
    backgroundColor: C.glass,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    minHeight: HIT.lg,
  },
  glassHighlight: { height: 1, backgroundColor: C.edgeLight },
  glassInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: S[16],
    paddingVertical: S[16],
    gap: S[12],
  },
  glassIconCircle: {
    width: 48,
    height: 48,
    borderRadius: R.pill,
    backgroundColor: C.glassMuted,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  glassText: { flex: 1, gap: S[2] },
  glassTitle: { ...T.base, ...T.w6, color: C.textPrimary },
  glassSub: { ...T.sm, color: C.textSecondary },
  metaChip: {
    width: 40,
    height: 40,
    borderRadius: R.pill,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },

  cta: {
    backgroundColor: C.yellow,
    borderRadius: R.lg,
    height: HIT.lg,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  ctaHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  ctaText: { ...T.base, ...T.w7, color: C.textOnYellow, letterSpacing: 0.5 },

  // ── Inspections view
  inspFilterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: S[16],
    paddingTop: S[12],
    gap: S[4],
  },
  inspFilterDiv: {
    width: 1,
    height: 20,
    backgroundColor: C.borderStrong,
    marginHorizontal: S[4],
  },
  inspFilterTab: {
    paddingHorizontal: S[16],
    paddingVertical: S[8],
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.border,
  },
  inspFilterTabOn: {
    backgroundColor: C.glassStrong,
    borderColor: C.borderStrong,
  },
  inspFilterText: {
    ...T.sm,
    ...T.w5,
    color: C.textSecondary,
  },
  inspFilterTextOn: {
    color: C.textPrimary,
    ...T.w6,
  },
  inspSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[8],
    marginHorizontal: S[16],
    marginTop: S[12],
    backgroundColor: C.glassMuted,
    borderRadius: R.lg,
    paddingHorizontal: S[12],
    height: HIT.min,
  },
  inspSearchInput: {
    flex: 1,
    ...T.base,
    ...T.w4,
    color: C.textPrimary,
  },
  inspList: {
    paddingHorizontal: S[16],
    paddingTop: S[8],
    paddingBottom: S[16],
  },
  inspCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: S[16],
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  inspCardBody: {
    flex: 1,
    gap: S[2],
  },
  inspTitle: {
    ...T.base,
    ...T.w7,
    color: C.textPrimary,
  },
  inspType: {
    ...T.sm,
    ...T.w4,
    color: C.textSecondary,
  },
  inspLocation: {
    ...T.sm,
    ...T.w5,
    color: C.textPrimary,
    marginTop: S[2],
  },
  inspMeta: {
    ...T.sm,
    ...T.w4,
    color: C.textSecondary,
  },

  // ── Tab bar
  tabOuter: {
    paddingHorizontal: S[16],
    paddingBottom: S[8],
  },
  tabRow: {
    flexDirection: "row" as const,
    alignItems: "flex-end" as const,
    backgroundColor: C.glassStrong,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.edgeLight,
    paddingVertical: S[4],
    paddingHorizontal: S[4],
  },
  tab: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: S[8],
    borderRadius: R.lg,
    gap: 3,
  },
  tabActive: { backgroundColor: C.glassMuted },
  tabLabel: { fontSize: 11, ...T.w5, color: C.textTertiary },
  tabLabelOn: { color: C.charcoal, ...T.w7 },

  // ── AI center button
  aiFabSlot: {
    width: 72,
    alignItems: "center" as const,
    marginTop: -28,
  },
  aiFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.black,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 3,
    borderColor: C.canvas,
    shadowColor: C.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  aiFabRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.yellow,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  aiFabLabel: {
    marginTop: 3,
    fontSize: 10,
    ...T.w7,
    color: C.charcoal,
    letterSpacing: 0.3,
  },

  // ── Drawer
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_W,
    backgroundColor: C.canvas,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S[20],
    paddingTop: S[20],
    paddingBottom: S[16],
  },
  drawerHeaderClose: {
    width: 36,
    height: 36,
    borderRadius: R.pill,
    backgroundColor: C.glassMuted,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: S[20],
  },
  drawerItems: {
    paddingTop: S[12],
    paddingHorizontal: S[12],
    gap: S[4],
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[16],
    paddingVertical: S[12],
    paddingHorizontal: S[12],
    minHeight: HIT.std,
    borderRadius: R.md,
  },
  drawerItemLabel: {
    ...T.base,
    ...T.w5,
    color: C.textPrimary,
  },
  drawerItemDanger: {
    color: C.critical,
    ...T.w5,
  },
});
