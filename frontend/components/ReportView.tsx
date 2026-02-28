import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SEVERITY_COLORS, SeverityLevel } from '../constants/severity';
import { Finding, Report } from '../services/api';
import FindingCard from './FindingCard';

interface ReportViewProps {
  report: Report;
}

const SEVERITY_ORDER: SeverityLevel[] = ['CRITICAL', 'MODERATE', 'MONITOR', 'PASS'];

export default function ReportView({ report }: ReportViewProps) {
  const generated = new Date(report.generated_at).toLocaleString();

  const findingsBySeverity = SEVERITY_ORDER.reduce<Record<SeverityLevel, Finding[]>>(
    (acc, level) => {
      acc[level] = report.findings.filter((f) => f.severity === level);
      return acc;
    },
    { CRITICAL: [], MODERATE: [], MONITOR: [], PASS: [] },
  );

  const stats: { label: string; count: number; color: string }[] = [
    { label: 'Critical', count: report.critical_count, color: SEVERITY_COLORS.CRITICAL },
    { label: 'Moderate', count: report.moderate_count, color: SEVERITY_COLORS.MODERATE },
    { label: 'Monitor', count: report.monitor_count, color: SEVERITY_COLORS.MONITOR },
    { label: 'Pass', count: report.pass_count, color: SEVERITY_COLORS.PASS },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.assetId}>Asset: {report.asset_id}</Text>
        <Text style={styles.generated}>Generated: {generated}</Text>
      </View>

      {!!report.summary && (
        <View style={styles.summaryBox}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.summaryText}>{report.summary}</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        {stats.map(({ label, count, color }) => (
          <View key={label} style={[styles.statCard, { borderTopColor: color }]}>
            <Text style={[styles.statCount, { color }]}>{count}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {SEVERITY_ORDER.map((level) => {
        const items = findingsBySeverity[level];
        if (items.length === 0) return null;
        return (
          <View key={level} style={styles.group}>
            <View style={[styles.groupHeader, { backgroundColor: SEVERITY_COLORS[level] }]}>
              <Text style={styles.groupTitle}>
                {level} ({items.length})
              </Text>
            </View>
            {items.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerBox: {
    marginBottom: 12,
  },
  assetId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
  },
  generated: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
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
  statCount: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  group: {
    marginBottom: 12,
  },
  groupHeader: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  groupTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
