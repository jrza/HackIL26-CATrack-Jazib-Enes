import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../constants/severity';
import { Finding } from '../services/api';

interface FindingCardProps {
  finding: Finding;
}

export default function FindingCard({ finding }: FindingCardProps) {
  const severityColor = SEVERITY_COLORS[finding.severity];
  const severityLabel = SEVERITY_LABELS[finding.severity];
  const timestamp = new Date(finding.timestamp).toLocaleString();
  const confidencePct = Math.round(finding.confidence * 100);

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      <View style={styles.header}>
        <Text style={styles.component}>{finding.component}</Text>
        <View style={[styles.badge, { backgroundColor: severityColor }]}>
          <Text style={styles.badgeText}>{severityLabel}</Text>
        </View>
      </View>

      <Text style={styles.issue}>{finding.issue}</Text>
      <Text style={styles.description}>{finding.description}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>Confidence: {confidencePct}%</Text>
        <Text style={styles.meta}>{timestamp}</Text>
      </View>

      <View style={styles.actionBox}>
        <Text style={styles.actionLabel}>Recommended Action</Text>
        <Text style={styles.actionText}>{finding.recommended_action}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginVertical: 6,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  component: {
    fontWeight: '700',
    fontSize: 15,
    color: '#1e293b',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  issue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 10,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionText: {
    fontSize: 13,
    color: '#334155',
  },
});
