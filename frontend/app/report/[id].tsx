import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReportView from '../../components/ReportView';
import { getReport, Report } from '../../services/api';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getReport(id);
      setReport(data);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleShare = async () => {
    if (!report) return;
    const lines = [
      `CAT Inspect Report — Asset: ${report.asset_id}`,
      `Generated: ${new Date(report.generated_at).toLocaleString()}`,
      '',
      `Critical: ${report.critical_count}  Moderate: ${report.moderate_count}  Monitor: ${report.monitor_count}  Pass: ${report.pass_count}`,
      '',
      report.summary ?? '',
    ];
    try {
      await Share.share({ message: lines.join('\n') });
    } catch {
      // user cancelled share
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#facc15" />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Report not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Inspection Report</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
      </View>
      <ReportView report={report} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  backText: {
    color: '#facc15',
    fontSize: 15,
    fontWeight: '600',
  },
  topTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  shareButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  shareText: {
    color: '#facc15',
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: '#64748b',
    fontSize: 15,
  },
  backLink: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '600',
  },
});
