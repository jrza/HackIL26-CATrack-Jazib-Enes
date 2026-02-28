import { useCallback, useEffect, useState } from 'react';
import {
  completeInspection as apiCompleteInspection,
  Finding,
  getFindings,
  getInspection,
  InspectionSession,
  startInspection as apiStartInspection,
} from '../services/api';
import {
  clearCurrentInspection,
  getCurrentInspection,
  saveCurrentInspection,
} from '../services/storage';

interface UseInspectionReturn {
  inspection: InspectionSession | null;
  findings: Finding[];
  loading: boolean;
  error: string | null;
  startInspection: (assetId: string, operatorId?: string) => Promise<InspectionSession>;
  loadInspection: (inspectionId: string) => Promise<void>;
  loadFindings: (inspectionId: string) => Promise<void>;
  completeInspection: () => Promise<void>;
  addFinding: (finding: Finding) => void;
}

export function useInspection(): UseInspectionReturn {
  const [inspection, setInspection] = useState<InspectionSession | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentInspection().then((stored) => {
      if (stored) setInspection(stored);
    });
  }, []);

  useEffect(() => {
    if (inspection) {
      saveCurrentInspection(inspection);
    }
  }, [inspection]);

  const startInspection = useCallback(
    async (assetId: string, operatorId?: string): Promise<InspectionSession> => {
      setLoading(true);
      setError(null);
      try {
        const session = await apiStartInspection(assetId, operatorId);
        setInspection(session);
        setFindings([]);
        return session;
      } catch (err) {
        const message = (err as Error).message;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadInspection = useCallback(async (inspectionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const session = await getInspection(inspectionId);
      setInspection(session);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFindings = useCallback(async (inspectionId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFindings(inspectionId);
      setFindings(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const completeInspection = useCallback(async (): Promise<void> => {
    if (!inspection) throw new Error('No active inspection');
    setLoading(true);
    setError(null);
    try {
      const updated = await apiCompleteInspection(inspection.id);
      setInspection(updated);
      await clearCurrentInspection();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [inspection]);

  const addFinding = useCallback((finding: Finding): void => {
    setFindings((prev) => [...prev, finding]);
  }, []);

  return {
    inspection,
    findings,
    loading,
    error,
    startInspection,
    loadInspection,
    loadFindings,
    completeInspection,
    addFinding,
  };
}
