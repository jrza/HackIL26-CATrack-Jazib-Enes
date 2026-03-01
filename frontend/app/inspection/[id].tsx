import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FindingCard from '../../components/FindingCard';
import ProgressTracker from '../../components/ProgressTracker';
import { Finding, getFindings, getInspection, InspectionSession } from '../../services/api';

const DEFAULT_CHECKPOINTS = [
  'Engine',
  'Hydraulics',
  'Undercarriage',
  'Cab',
  'Bucket',
  'Boom Arm',
  'Fuel System',
  'Cooling System',
  'Electrical',
  'Final Drive',
];

export default function InspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [inspection, setInspection] = useState<InspectionSession | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!id) return;
      if (!silent) setLoading(true);
      try {
        const [session, data] = await Promise.all([getInspection(id), getFindings(id)]);
        setInspection(session);
        setFindings(data);
      } catch (err) {
        Alert.alert('Error', (err as Error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const handleComplete = async () => {
    Alert.alert('Complete Inspection', 'Mark this inspection as complete?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        style: 'default',
        onPress: async () => {
          setCompleting(true);
          router.push(`/inspection/complete?inspectionId=${id}`);
          setCompleting(false);
        },
      },
    ]);
  };

  const completedCheckpoints = [
    ...new Set(findings.map((f) => f.component)),
  ];

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
      <FlatList
        data={findings}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#facc15" />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.assetLabel}>Asset</Text>
                <Text style={styles.assetId}>{inspection?.asset_id ?? '—'}</Text>
              </View>
                <View
                style={[
                  styles.statusBadge,
                  inspection?.status === 'COMPLETED' && styles.statusDone,
                ]}
              >
                <Text style={styles.statusText}>
                  {inspection?.status ?? 'ACTIVE'}
                </Text>
              </View>
            </View>

            <ProgressTracker
              checkpoints={DEFAULT_CHECKPOINTS}
              completedCheckpoints={completedCheckpoints}
              findings={findings}
            />

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push(`/inspection/checkpoint?inspectionId=${id}`)}
                disabled={inspection?.status === 'COMPLETED'}
              >
                <Text style={styles.addButtonText}>+ Add Finding</Text>
              </TouchableOpacity>

              {inspection?.status !== 'COMPLETED' && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleComplete}
                  disabled={completing}
                >
                  <Text style={styles.completeButtonText}>
                    {completing ? 'Completing…' : 'Complete ✓'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {findings.length > 0 && (
              <Text style={styles.findingsTitle}>Findings ({findings.length})</Text>
            )}
          </View>
        }
        renderItem={({ item }) => <FindingCard finding={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No findings yet. Add your first checkpoint finding.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assetLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  assetId: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  statusBadge: {
    backgroundColor: '#facc15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDone: {
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#1e293b',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#facc15',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1e293b',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#fff',
  },
  findingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 30,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 260,
  },
});
