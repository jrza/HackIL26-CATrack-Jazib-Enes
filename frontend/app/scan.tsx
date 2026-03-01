import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { C, HIT, R, S, T } from "../constants/theme";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleScan = useCallback(
    (result: { data?: string }) => {
      if (scanned || !result?.data) return;
      setScanned(true);
      setTimeout(() => setScanned(false), 2000);
    },
    [scanned],
  );

  const hasPermission = permission?.granted ?? false;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={s.cameraWrap}>
        {hasPermission ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleScan}
          />
        ) : (
          <View style={s.permissionBox}>
            <Ionicons name="camera-outline" size={36} color={C.textTertiary} />
            <Text style={s.permissionText}>
              {!permission
                ? "Requesting camera access..."
                : "Camera access is required.\nPlease enable it in Settings."}
            </Text>
            {permission && !permission.granted && (
              <TouchableOpacity
                style={s.permissionBtn}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <Text style={s.permissionBtnText}>Grant access</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={s.overlay}>
          <SafeAreaView>
            <View style={s.header}>
              <TouchableOpacity
                style={s.headerBtn}
                activeOpacity={0.6}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={s.headerTitle}>Scan Asset</Text>
              <View style={s.headerBtn} />
            </View>
          </SafeAreaView>

          <View style={s.finderArea}>
            <View style={s.finder}>
              <View style={[s.corner, s.cornerTL]} />
              <View style={[s.corner, s.cornerTR]} />
              <View style={[s.corner, s.cornerBL]} />
              <View style={[s.corner, s.cornerBR]} />
            </View>
            <Text style={s.finderHint}>
              Align the QR code within the frame
            </Text>
          </View>

          <SafeAreaView>
            <View style={s.bottomArea}>
              {scanned ? (
                <TouchableOpacity
                  style={s.rescanBtn}
                  activeOpacity={0.85}
                  onPress={() => setScanned(false)}
                >
                  <Text style={s.rescanText}>Tap to Scan Again</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.bottomHintWrap}>
                  <View style={s.bottomHintGlass}>
                    <View style={s.bottomHintHighlight} />
                    <Text style={s.bottomHintText}>
                      Point your camera at the QR code label on the machine
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </View>
  );
}

const CORNER = 28;
const CORNER_W = 4;
const FINDER_SIZE = 240;

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraWrap: {
    flex: 1,
  },
  permissionBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: S[16],
    backgroundColor: "#000",
    paddingHorizontal: S[32],
  },
  permissionText: {
    ...T.base,
    ...T.w5,
    color: C.textTertiary,
    textAlign: "center",
  },
  permissionBtn: {
    marginTop: S[8],
    paddingVertical: S[12],
    paddingHorizontal: S[24],
    backgroundColor: C.yellow,
    borderRadius: R.md,
  },
  permissionBtnText: {
    ...T.base,
    ...T.w6,
    color: C.textOnYellow,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S[16],
    height: 56,
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
    color: "#fff",
  },
  finderArea: {
    alignItems: "center",
    gap: S[20],
  },
  finder: {
    width: FINDER_SIZE,
    height: FINDER_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: C.yellow,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderTopLeftRadius: R.sm,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderTopRightRadius: R.sm,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_W,
    borderLeftWidth: CORNER_W,
    borderBottomLeftRadius: R.sm,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_W,
    borderRightWidth: CORNER_W,
    borderBottomRightRadius: R.sm,
  },
  finderHint: {
    ...T.sm,
    ...T.w5,
    color: "rgba(255,255,255,0.7)",
  },
  bottomArea: {
    paddingHorizontal: S[16],
    paddingBottom: S[24],
  },
  bottomHintWrap: {
    alignItems: "center",
  },
  bottomHintGlass: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: S[20],
    paddingVertical: S[16],
    overflow: "hidden",
  },
  bottomHintHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  bottomHintText: {
    ...T.sm,
    ...T.w5,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
  },
  rescanBtn: {
    backgroundColor: C.yellow,
    borderRadius: R.lg,
    height: HIT.lg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    overflow: "hidden",
  },
  rescanText: {
    ...T.base,
    ...T.w7,
    color: C.textOnYellow,
    letterSpacing: 0.5,
  },
});
