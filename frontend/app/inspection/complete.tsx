import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SEVERITY_COLORS, SeverityLevel } from '../../constants/severity';
import {
  completeInspection,
  Finding,
  generateReport,
  getFindings,
} from '../../services/api';

const SEVERITY_ORDER: SeverityLevel[] = ['CRITICAL', 'MODERATE', 'MONITOR', 'PASS'];

export default function CompleteScreen() {
  const { inspectionId } = useLocalSearchParams<{ inspectionId: string }>();
  const router = useRouter();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!inspectionId) return;
    setLoading(true);
    try {
      const data = await getFindings(inspectionId);
      setFindings(data);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerate = async () => {
    if (!inspectionId) return;
    setGenerating(true);
    try {
      await completeInspection(inspectionId);
      const report = await generateReport(inspectionId);
      router.replace(`/report/${report.id}`);
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const counts = SEVERITY_ORDER.reduce<Record<SeverityLevel, number>>(
    (acc, level) => {
      acc[level] = findings.filter((f) => f.severity === level).length;
      return acc;
    },
    { CRITICAL: 0, MODERATE: 0, MONITOR: 0, PASS: 0 },
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#facc15" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Review & Submit</Text>
        <Text style={styles.subtitle}>
          {findings.length} finding{findings.length !== 1 ? 's' : ''} recorded
        </Text>

        <View style={styles.countsRow}>
          {SEVERITY_ORDER.map((level) => (
            <View
              key={level}
              style={[styles.countCard, { borderTopColor: SEVERITY_COLORS[level] }]}
            >
              <Text style={[styles.countNum, { color: SEVERITY_COLORS[level] }]}>
                {counts[level]}
              </Text>
              <Text style={styles.countLabel}>{level}</Text>
            </View>
          ))}
        </View>

        {findings.length > 0 && (
          <View style={styles.listBox}>
            <Text style={styles.sectionTitle}>All Findings</Text>
            {findings.map((f) => (
              <View key={f.id} style={styles.findingRow}>
                <View
                  style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[f.severity] }]}
                />
                <View style={styles.findingInfo}>
                  <Text style={styles.findingComponent}>{f.component}</Text>
                  <Text style={styles.findingIssue} numberOfLines={1}>
                    {f.issue}
                  </Text>
                </View>
                <Text style={[styles.findingSeverity, { color: SEVERITY_COLORS[f.severity] }]}>
                  {f.severity}
                </Text>
              </View>
            ))}
          </View>
        )}

        {generating ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#facc15" />
            <Text style={styles.loadingText}>Generating report…</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
            <Text style={styles.generateText}>Generate Report →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  countCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderTopWidth: 4,
    padding: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  countNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  countLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  listBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  findingInfo: {
    flex: 1,
  },
  findingComponent: {
    fontWeight: '600',
    fontSize: 13,
    color: '#1e293b',
  },
  findingIssue: {
    fontSize: 12,
    color: '#64748b',
  },
  findingSeverity: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
  },
  generateButton: {
    backgroundColor: '#facc15',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  generateText: {
    fontWeight: '800',
    fontSize: 16,
    color: '#1e293b',
  },
});
