export type SeverityLevel = 'PASS' | 'MONITOR' | 'MODERATE' | 'CRITICAL';

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  PASS: '#22c55e',
  MONITOR: '#eab308',
  MODERATE: '#f97316',
  CRITICAL: '#ef4444',
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  PASS: 'Pass',
  MONITOR: 'Monitor',
  MODERATE: 'Moderate',
  CRITICAL: 'Critical',
};

export const SEVERITY_REQUIRES_ESCALATION: Record<SeverityLevel, boolean> = {
  PASS: false,
  MONITOR: false,
  MODERATE: true,
  CRITICAL: true,
};
