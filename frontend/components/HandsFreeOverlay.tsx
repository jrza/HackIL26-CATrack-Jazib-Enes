import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";
import { BlurView } from "expo-blur";

const BADGE_SIZE = 100;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function HandsFreeOverlay({ visible, onClose }: Props) {
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const metaScale = useRef(new Animated.Value(0.2)).current;
  const metaOpacity = useRef(new Animated.Value(0)).current;
  const metaRotate = useRef(new Animated.Value(-20)).current;

  const scanLineY = useRef(new Animated.Value(0)).current;
  const scanOpacity = useRef(new Animated.Value(0)).current;

  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const pulse2Scale = useRef(new Animated.Value(1)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.4)).current;

  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;

  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(15)).current;

  const dotOpacities = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  const closeOpacity = useRef(new Animated.Value(0)).current;

  const particleAnims = Array.from({ length: 10 }, () => ({
    x: useRef(new Animated.Value(0)).current,
    y: useRef(new Animated.Value(0)).current,
    opacity: useRef(new Animated.Value(0)).current,
    scale: useRef(new Animated.Value(0)).current,
  }));

  const breatheScale = useRef(new Animated.Value(1)).current;

  const reset = useCallback(() => {
    bgOpacity.setValue(0);
    metaScale.setValue(0.2);
    metaOpacity.setValue(0);
    metaRotate.setValue(-20);
    scanLineY.setValue(0);
    scanOpacity.setValue(0);
    pulseScale.setValue(1);
    pulseOpacity.setValue(0.6);
    pulse2Scale.setValue(1);
    pulse2Opacity.setValue(0.4);
    glowOpacity.setValue(0);
    glowScale.setValue(0.5);
    titleOpacity.setValue(0);
    titleTranslateY.setValue(20);
    subtitleOpacity.setValue(0);
    subtitleTranslateY.setValue(15);
    dotOpacities.forEach((d) => d.setValue(0));
    closeOpacity.setValue(0);
    breatheScale.setValue(1);
    particleAnims.forEach((p) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
      p.scale.setValue(0);
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    reset();

    Animated.timing(bgOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Meta logo entrance: scale up + rotate unwind + fade in
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(metaScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(metaOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(metaRotate, {
          toValue: 0,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow expands behind logo
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(glowScale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    }, 250);

    // Scan line sweeps across the logo
    setTimeout(() => {
      Animated.timing(scanOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();

      Animated.timing(scanLineY, {
        toValue: 1,
        duration: 700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(scanOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 800);

    // Pulse ring burst
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(pulseScale, {
          toValue: 3,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]).start();

      // Second pulse ring (staggered)
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(pulse2Scale, {
            toValue: 2.5,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse2Opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 150);

      // Glow flash
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1400);

    // Particles burst outward
    setTimeout(() => {
      particleAnims.forEach((p, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const dist = 70 + Math.random() * 50;
        Animated.parallel([
          Animated.timing(p.x, {
            toValue: Math.cos(angle) * dist,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: Math.sin(angle) * dist,
            duration: 650,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.opacity, {
              toValue: 1,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: 570,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(p.scale, {
              toValue: 1,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(p.scale, {
              toValue: 0,
              duration: 570,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      });
    }, 1400);

    // Title slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1900);

    // Subtitle
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, 2200);

    // Dot loading loop
    setTimeout(() => {
      const animateDots = () => {
        dotOpacities.forEach((d) => d.setValue(0));
        Animated.stagger(300, [
          ...dotOpacities.map((d) =>
            Animated.sequence([
              Animated.timing(d, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(d, {
                toValue: 0.3,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
          ),
        ]).start(() => animateDots());
      };
      animateDots();
    }, 2400);

    // Close button
    setTimeout(() => {
      Animated.timing(closeOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 2600);

    // Continuous gentle breathe on Meta logo
    setTimeout(() => {
      const breatheLoop = () => {
        Animated.sequence([
          Animated.timing(breatheScale, {
            toValue: 1.05,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(breatheScale, {
            toValue: 0.97,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start(() => breatheLoop());
      };
      breatheLoop();
    }, 2000);
  }, [visible]);

  const rotateInterp = metaRotate.interpolate({
    inputRange: [-20, 0],
    outputRange: ["-20deg", "0deg"],
  });

  const scanTranslateY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 50],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.darkOverlay} />

        {/* Center anchor — all effects are relative to this */}
        <View style={styles.centerAnchor}>
          {/* Glow behind Meta logo */}
          <Animated.View
            style={[
              styles.glowCircle,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          {/* Pulse rings */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                opacity: pulse2Opacity,
                transform: [{ scale: pulse2Scale }],
              },
            ]}
          />

          {/* Particles */}
          {particleAnims.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  opacity: p.opacity,
                  transform: [
                    { translateX: p.x },
                    { translateY: p.y },
                    { scale: p.scale },
                  ],
                },
              ]}
            />
          ))}

          {/* Meta logo — hero element */}
          <Animated.View
            style={[
              styles.metaWrap,
              {
                opacity: metaOpacity,
                transform: [
                  { scale: Animated.multiply(metaScale, breatheScale) },
                  { rotate: rotateInterp },
                ],
              },
            ]}
          >
            <View style={styles.metaBadge}>
              <Svg width={52} height={52 * (191 / 290)} viewBox="0 0 290 191">
                <Defs>
                  <LinearGradient
                    id="mg1"
                    x1="61"
                    y1="117"
                    x2="259"
                    y2="127"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0" stopColor="#0064e1" />
                    <Stop offset="0.4" stopColor="#0064e1" />
                    <Stop offset="0.83" stopColor="#0073ee" />
                    <Stop offset="1" stopColor="#0082fb" />
                  </LinearGradient>
                  <LinearGradient
                    id="mg2"
                    x1="45"
                    y1="139"
                    x2="45"
                    y2="66"
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0" stopColor="#0082fb" />
                    <Stop offset="1" stopColor="#0064e0" />
                  </LinearGradient>
                </Defs>
                <Path
                  fill="#0081fb"
                  d="m31.06,125.96c0,10.98 2.41,19.41 5.56,24.51 4.13,6.68 10.29,9.51 16.57,9.51 8.1,0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07,0 41.14,12.21 56.5,35.11 16.81,25.08 24.97,56.67 24.97,89.27 0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75l0-31.02c17.63,0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16.05c-18.2,32.27-22.81,39.62-31.91,51.75-15.95,21.24-29.57,29.29-47.5,29.29-21.27,0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z"
                />
                <Path
                  fill="url(#mg1)"
                  d="m24.49,37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65,0 27.22,4.04 41.39,15.61 15.5,12.65 32.02,33.48 52.63,67.81l7.39,12.32c17.84,29.72 27.99,45.01 33.93,52.22 7.64,9.26 12.99,12.02 19.94,12.02 17.63,0 22.03-16.2 22.03-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27,0-22.69,8.61-31.41,21.78z"
                />
                <Path
                  fill="url(#mg2)"
                  d="m82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78-12.33,18.61-19.88,46.33-19.88,72.95 0,10.98 2.41,19.41 5.56,24.51l-26.48,17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z"
                />
              </Svg>

              {/* Scan line over logo */}
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    opacity: scanOpacity,
                    transform: [{ translateY: scanTranslateY }],
                  },
                ]}
              />
            </View>
          </Animated.View>
        </View>

        {/* Title */}
        <Animated.View
          style={[
            styles.textWrap,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>Hands-free Mode</Text>
        </Animated.View>

        {/* Subtitle with animated dots */}
        <Animated.View
          style={[
            styles.subWrap,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          <Text style={styles.subtitle}>Connecting to Meta AI Glasses</Text>
          <View style={styles.dotsRow}>
            {dotOpacities.map((op, i) => (
              <Animated.View key={i} style={[styles.dot, { opacity: op }]} />
            ))}
          </View>
        </Animated.View>

        {/* Status pill */}
        <Animated.View
          style={[
            styles.statusPill,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Searching for devices...</Text>
        </Animated.View>

        {/* Close button */}
        <Animated.View style={[styles.closeWrap, { opacity: closeOpacity }]}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <Text style={styles.closeTip}>Tap to dismiss</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,10,15,0.75)",
  },

  centerAnchor: {
    alignItems: "center",
    justifyContent: "center",
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },

  glowCircle: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(0,129,251,0.15)",
  },

  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0081fb",
  },

  pulseRing: {
    position: "absolute",
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 2,
    borderColor: "rgba(0,129,251,0.5)",
  },

  metaWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  metaBadge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: "#00d4ff",
    borderRadius: 1,
    shadowColor: "#00d4ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },

  textWrap: {
    marginTop: 28,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  subWrap: {
    marginTop: 10,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  dotsRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0081fb",
  },

  statusPill: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00d4ff",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.7)",
  },

  closeWrap: {
    position: "absolute",
    bottom: 60,
    alignItems: "center",
    gap: 8,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeTip: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255,255,255,0.35)",
  },
});
