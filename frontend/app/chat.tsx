import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CatLogo from "../components/CatLogo";
import { C, HIT, R, S, T } from "../constants/theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  { icon: "construct-outline" as const, text: "Diagnose hydraulic leak on D6T" },
  { icon: "clipboard-outline" as const, text: "Summarize today's inspections" },
  { icon: "warning-outline" as const, text: "What are common 320 GC issues?" },
  { icon: "analytics-outline" as const, text: "Show fleet health overview" },
];

const AI_RESPONSES: Record<string, string> = {
  hydraulic:
    "Based on common D6T hydraulic issues, here's my diagnosis:\n\n**Likely causes:**\n• Worn O-rings on the main control valve\n• Damaged hydraulic hose at the boom cylinder connection\n• Seal failure on the hydraulic pump\n\n**Recommended actions:**\n1. Check hydraulic fluid level and condition\n2. Inspect all hose connections for weeping\n3. Examine the main control valve seals\n4. Run the system at low idle and monitor pressure gauges\n\n**Severity:** Moderate — address within 24 hours to prevent further damage.",

  inspect:
    "Here's your inspection summary for today:\n\n**Completed:** 3 inspections\n• **Unit 27542923** — Daily inspection, passed\n• **Unit 27538402** — Daily inspection, 1 moderate finding\n• **Unit 27542848** — Daily inspection, passed\n\n**Pending:** 2 inspections still in progress\n\n**Key findings:**\n• Hydraulic hose wear detected on Unit 27538402\n• All other units within normal parameters\n\nWould you like me to generate a detailed report for any of these?",

  "320":
    "Common issues with the **CAT 320 GC** excavator:\n\n**Engine:**\n• DPF regeneration problems after 3,000 hours\n• Fuel injector failures (typically units 2 & 5)\n• Turbo actuator calibration drift\n\n**Hydraulic:**\n• Main pump seal leaks around 5,000 hours\n• Pilot control valve sticking in cold weather\n• Swing motor drain case pressure increases\n\n**Undercarriage:**\n• Track adjuster grease leaks\n• Idler bearing wear (accelerated in sandy conditions)\n• Track shoe bolt torque loss\n\n**Electrical:**\n• Monitor display flickering (software update available)\n• Wiring harness chafing near swing frame\n\nWant me to create a preventive checklist for any of these?",

  fleet:
    "**Fleet Health Overview:**\n\n🟢 **Healthy:** 12 units (67%)\nAll systems normal, inspections up to date\n\n🟡 **Monitor:** 4 units (22%)\n• Unit 445 — Elevated hydraulic temp\n• Unit 312 — Track tension low\n• Unit 118 — Air filter hours exceeded\n• Unit 290 — Coolant level marginal\n\n🔴 **Action Required:** 2 units (11%)\n• Unit 227 — Hydraulic leak, boom cylinder\n• Unit 503 — Engine fault code active (SPN 3364)\n\n**Trend:** Fleet condition improved 8% over last 30 days. Recommend scheduling PM for Units 445 and 312 this week.",

  default:
    "I can help with that. As your CAT AI assistant, I can:\n\n• **Diagnose** equipment issues based on symptoms\n• **Summarize** inspection data and reports\n• **Look up** maintenance procedures and specs\n• **Analyze** fleet health trends\n• **Recommend** preventive maintenance actions\n\nCould you provide more details about what you need help with?",
};

function getAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  if (lower.includes("hydraulic") || lower.includes("leak") || lower.includes("diagnos"))
    return AI_RESPONSES.hydraulic;
  if (lower.includes("summar") || lower.includes("today") || lower.includes("inspect"))
    return AI_RESPONSES.inspect;
  if (lower.includes("320") || lower.includes("common") || lower.includes("issue"))
    return AI_RESPONSES["320"];
  if (lower.includes("fleet") || lower.includes("health") || lower.includes("overview"))
    return AI_RESPONSES.fleet;
  return AI_RESPONSES.default;
}

function TypingIndicator() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingWrap}>
      <View style={styles.avatarWrap}>
        <CatLogo size={20} letterColor="#FFFFFF" triangleColor={C.yellow} />
      </View>
      <View style={styles.typingBubble}>
        {dots.map((dot, i) => (
          <Animated.View key={i} style={[styles.typingDot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser && styles.messageRowUser,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatarWrap}>
          <CatLogo size={20} letterColor="#FFFFFF" triangleColor={C.yellow} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const hasMessages = messages.length > 0;

  const sendMessage = useCallback(
    (text?: string) => {
      const content = (text ?? input).trim();
      if (!content) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setTyping(true);
      Keyboard.dismiss();

      const delay = 800 + Math.random() * 1200;
      setTimeout(() => {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: getAIResponse(content),
          timestamp: new Date(),
        };
        setTyping(false);
        setMessages((prev) => [...prev, aiMsg]);
      }, delay);
    },
    [input],
  );

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, typing]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => <MessageBubble message={item} />,
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <SafeAreaView style={{ backgroundColor: C.canvas }} />

      {/* Header */}
      <View style={styles.headerOuter}>
        <View style={styles.headerGlass}>
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.5}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerLogo}>
              <CatLogo
                size={22}
                letterColor="#FFFFFF"
                triangleColor={C.yellow}
              />
            </View>
            <Text style={styles.headerTitle}>Cat AI</Text>
            <View style={styles.onlineDot} />
          </View>

          <TouchableOpacity style={styles.headerBtn} activeOpacity={0.5}>
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={C.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Empty state / Welcome */}
        {!hasMessages ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeTop}>
              <View style={styles.welcomeLogoWrap}>
                <View style={styles.welcomeLogoCircle}>
                  <CatLogo
                    size={40}
                    letterColor="#FFFFFF"
                    triangleColor={C.yellow}
                  />
                </View>
                <View style={styles.sparkleWrap}>
                  <Ionicons name="sparkles" size={11} color={C.charcoal} />
                </View>
              </View>
              <Text style={styles.welcomeTitle}>Cat AI Assistant</Text>
              <Text style={styles.welcomeSub}>
                Your intelligent copilot for equipment{"\n"}
                inspection, diagnostics & fleet management
              </Text>
            </View>

            <View style={styles.suggestionsWrap}>
              <Text style={styles.suggestionsLabel}>Try asking</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionCard}
                    activeOpacity={0.7}
                    onPress={() => sendMessage(s.text)}
                  >
                    <Ionicons
                      name={s.icon}
                      size={16}
                      color={C.yellow}
                      style={styles.suggestionIcon}
                    />
                    <Text style={styles.suggestionText}>{s.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={typing ? <TypingIndicator /> : null}
            onContentSizeChange={scrollToEnd}
          />
        )}

        {/* Input bar */}
        <View style={styles.inputOuter}>
          <View style={styles.inputBar}>
            <TextInput
              ref={inputRef}
              style={styles.inputField}
              placeholder="Ask Cat AI anything..."
              placeholderTextColor={C.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              onSubmitEditing={() => sendMessage()}
              blurOnSubmit
              textAlign={input.length === 0 ? "center" : "left"}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                input.trim() ? styles.sendBtnActive : null,
              ]}
              activeOpacity={0.7}
              onPress={() => sendMessage()}
              disabled={!input.trim()}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={input.trim() ? "#FFFFFF" : C.textTertiary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.disclaimer}>
            Cat AI can make mistakes. Verify important information.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <SafeAreaView style={{ backgroundColor: C.canvas }} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  headerBtn: {
    width: HIT.min,
    height: HIT.min,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: S[8],
  },
  headerLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.charcoal,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...T.base,
    ...T.w7,
    color: C.textPrimary,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.pass,
  },

  // Welcome state
  welcomeContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: S[8],
  },
  welcomeTop: {
    alignItems: "center",
    paddingHorizontal: S[32],
  },
  welcomeLogoWrap: {
    marginBottom: S[20],
  },
  welcomeLogoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.charcoal,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.yellow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  sparkleWrap: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.yellow,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: C.canvas,
  },
  welcomeTitle: {
    ...T.xl,
    ...T.w7,
    color: C.textPrimary,
    marginBottom: S[8],
  },
  welcomeSub: {
    ...T.sm,
    ...T.w4,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  // Suggestions
  suggestionsWrap: {
    paddingHorizontal: S[16],
  },
  suggestionsLabel: {
    ...T.sm,
    ...T.w6,
    color: C.textTertiary,
    marginBottom: S[12],
    paddingLeft: S[4],
  },
  suggestionsGrid: {
    gap: S[8],
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.glass,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S[12],
    paddingVertical: S[12],
    gap: S[8],
  },
  suggestionIcon: {
    width: 20,
  },
  suggestionText: {
    fontSize: 13,
    ...T.w5,
    color: C.textPrimary,
    flex: 1,
  },

  // Messages list
  messagesList: {
    paddingHorizontal: S[16],
    paddingTop: S[16],
    paddingBottom: S[8],
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: S[16],
    gap: S[8],
  },
  messageRowUser: {
    flexDirection: "row-reverse",
  },
  avatarWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.charcoal,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: S[2],
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: R.lg,
    paddingHorizontal: S[16],
    paddingVertical: S[12],
    borderWidth: 1,
  },
  bubbleAI: {
    backgroundColor: C.glass,
    borderColor: C.border,
    borderTopLeftRadius: S[4],
  },
  bubbleUser: {
    backgroundColor: C.charcoal,
    borderColor: "rgba(255,255,255,0.08)",
    borderTopRightRadius: S[4],
  },
  bubbleText: {
    ...T.sm,
    ...T.w4,
    color: C.textPrimary,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: C.textOnDark,
  },

  // Typing indicator
  typingWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: S[16],
    gap: S[8],
  },
  typingBubble: {
    flexDirection: "row",
    backgroundColor: C.glass,
    borderRadius: R.lg,
    borderTopLeftRadius: S[4],
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S[16],
    paddingVertical: S[16],
    gap: S[6],
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.textTertiary,
  },

  // Input bar
  inputOuter: {
    paddingHorizontal: S[16],
    paddingBottom: S[8],
    gap: S[6],
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: C.glassStrong,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.edgeLight,
    paddingLeft: S[16],
    paddingRight: S[6],
    paddingVertical: S[6],
    minHeight: 52,
    gap: S[8],
  },
  inputField: {
    flex: 1,
    ...T.sm,
    ...T.w4,
    color: C.textPrimary,
    maxHeight: 120,
    paddingTop: S[8],
    paddingBottom: S[8],
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.glassMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnActive: {
    backgroundColor: C.charcoal,
  },
  disclaimer: {
    ...T.xs,
    ...T.w4,
    color: C.textTertiary,
    textAlign: "center",
  },
});
