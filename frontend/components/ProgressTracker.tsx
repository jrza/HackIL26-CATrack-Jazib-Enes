import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SEVERITY_COLORS, SeverityLevel } from '../constants/severity';
import { Finding } from '../services/api';

interface ProgressTrackerProps {
  checkpoints: string[];
  completedCheckpoints: string[];
  findings: Finding[];
}

function getSeverityForCheckpoint(checkpoint: string, findings: Finding[]): SeverityLevel | null {
  const match = findings.filter(
    (f) => f.component.toLowerCase() === checkpoint.toLowerCase(),
  );
  if (match.length === 0) return null;
  const order: SeverityLevel[] = ['CRITICAL', 'MODERATE', 'MONITOR', 'PASS'];
  for (const level of order) {
    if (match.some((f) => f.severity === level)) return level;
  }
  return null;
}

export default function ProgressTracker({
  checkpoints,
  completedCheckpoints,
  findings,
}: ProgressTrackerProps) {
  const total = checkpoints.length;
  const completed = completedCheckpoints.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <Text style={styles.sub}>
        {completed} / {total} checkpoints completed
      </Text>

      <View style={styles.list}>
        {checkpoints.map((cp) => {
          const done = completedCheckpoints.includes(cp);
          const severity = getSeverityForCheckpoint(cp, findings);
          const dotColor = severity ? SEVERITY_COLORS[severity] : done ? '#22c55e' : '#cbd5e1';

          return (
            <View key={cp} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: dotColor }]} />
              <Text style={[styles.label, done && styles.labelDone]}>{cp}</Text>
              {done && <Text style={styles.check}>✓</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1e293b',
  },
  pct: {
    fontWeight: '700',
    fontSize: 15,
    color: '#facc15',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#facc15',
    borderRadius: 4,
  },
  sub: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
  },
  labelDone: {
    color: '#1e293b',
    fontWeight: '600',
  },
  check: {
    color: '#22c55e',
    fontWeight: '700',
  },
});
