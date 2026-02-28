import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRScanner from '../components/QRScanner';
import { getActiveInspection, startInspection } from '../services/api';

export default function IndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleScan = async (assetId: string) => {
    if (loading) return;
    setLoading(true);
    try {
      let inspection = await getActiveInspection(assetId);
      if (!inspection) {
        inspection = await startInspection(assetId);
      }
      router.push(`/inspection/${inspection.id}`);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <Text style={styles.catLogo}>🐱</Text>
          <Text style={styles.title}>CAT Inspect</Text>
          <Text style={styles.subtitle}>AI Co-Pilot</Text>
          <Text style={styles.description}>
            Scan the QR code on your machine to begin or resume a guided inspection.
          </Text>
        </View>

        <View style={styles.scannerContainer}>
          {loading ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#facc15" />
              <Text style={styles.loadingText}>Starting inspection…</Text>
            </View>
          ) : (
            <QRScanner
              onScan={handleScan}
              onError={(e) => Alert.alert('Scan Error', e)}
            />
          )}
        </View>

        <Text style={styles.footer}>
          Point camera at the asset QR code label
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  catLogo: {
    fontSize: 44,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#facc15',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  scannerContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    minHeight: 300,
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  footer: {
    textAlign: 'center',
    color: '#475569',
    fontSize: 13,
    marginTop: 14,
  },
});
