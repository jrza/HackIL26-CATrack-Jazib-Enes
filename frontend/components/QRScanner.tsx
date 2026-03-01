import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface QRScannerProps {
  onScan: (assetId: string) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned || !data) return;
      setScanned(true);

      let assetId = data.trim();
      try {
        const url = new URL(data);
        const paramId = url.searchParams.get('asset_id') ?? url.searchParams.get('id');
        if (paramId) assetId = paramId;
        else {
          const parts = url.pathname.split('/').filter(Boolean);
          if (parts.length > 0) assetId = parts[parts.length - 1];
        }
      } catch {
        // not a URL — use raw value
      }

      if (!assetId) {
        onError?.('Could not extract asset ID from QR code');
        setScanned(false);
        return;
      }

      onScan(assetId);
    },
    [scanned, onScan, onError],
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Camera access is required to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.viewfinder} />
        <Text style={styles.hint}>Align the QR code within the box</Text>
        {scanned && (
          <TouchableOpacity style={styles.rescanButton} onPress={() => setScanned(false)}>
            <Text style={styles.rescanText}>Tap to scan again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
  },
  grantBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#facc15',
    borderRadius: 8,
  },
  grantBtnText: {
    color: '#1e293b',
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  viewfinder: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#facc15',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  hint: {
    marginTop: 20,
    color: '#f8fafc',
    fontSize: 14,
  },
  rescanButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#facc15',
    borderRadius: 8,
  },
  rescanText: {
    color: '#1e293b',
    fontWeight: '600',
  },
});
