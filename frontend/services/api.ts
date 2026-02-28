import { SeverityLevel } from '../constants/severity';

export interface Machine {
  asset_id: string;
  model: string;
  serial_number: string;
  location: string;
  last_inspection_date: string | null;
  total_hours: number | null;
}

export interface InspectionSession {
  id: string;
  asset_id: string;
  operator_id: string | null;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at: string | null;
  checkpoints_total: number;
  checkpoints_completed: number;
}

export interface Finding {
  id: string;
  inspection_id: string;
  component: string;
  issue: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
  recommended_action: string;
  image_uri: string | null;
  audio_uri: string | null;
  created_at: string;
}

export interface FindingCreate {
  inspection_id: string;
  component: string;
  voice_transcript: string;
  image_uri: string | null;
  audio_uri: string | null;
}

export interface Report {
  id: string;
  inspection_id: string;
  asset_id: string;
  generated_at: string;
  pass_count: number;
  monitor_count: number;
  moderate_count: number;
  critical_count: number;
  findings: Finding[];
  summary: string;
}

export const BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ||
  'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new Error(`Network error: ${(err as Error).message}`);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.detail) message = body.detail;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getMachine(assetId: string): Promise<Machine> {
  return request<Machine>(`/machine/${encodeURIComponent(assetId)}`);
}

export async function startInspection(
  assetId: string,
  operatorId?: string,
): Promise<InspectionSession> {
  return request<InspectionSession>('/inspection', {
    method: 'POST',
    body: JSON.stringify({ asset_id: assetId, operator_id: operatorId ?? null }),
  });
}

export async function getInspection(inspectionId: string): Promise<InspectionSession> {
  return request<InspectionSession>(`/inspection/${encodeURIComponent(inspectionId)}`);
}

export async function getActiveInspection(
  assetId: string,
): Promise<InspectionSession | null> {
  try {
    return await request<InspectionSession>(
      `/inspection/active/${encodeURIComponent(assetId)}`,
    );
  } catch (err) {
    if ((err as Error).message.includes('404')) return null;
    throw err;
  }
}

export async function completeInspection(inspectionId: string): Promise<InspectionSession> {
  return request<InspectionSession>(
    `/inspection/${encodeURIComponent(inspectionId)}/complete`,
    { method: 'POST' },
  );
}

export async function submitFinding(finding: FindingCreate): Promise<Finding> {
  return request<Finding>('/findings', {
    method: 'POST',
    body: JSON.stringify(finding),
  });
}

export async function getFindings(inspectionId: string): Promise<Finding[]> {
  return request<Finding[]>(`/findings/${encodeURIComponent(inspectionId)}`);
}

export async function generateReport(inspectionId: string): Promise<Report> {
  return request<Report>(`/report/${encodeURIComponent(inspectionId)}`, {
    method: 'POST',
  });
}

export async function getReport(reportId: string): Promise<Report> {
  return request<Report>(`/report/${encodeURIComponent(reportId)}`);
}
