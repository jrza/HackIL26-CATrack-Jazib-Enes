import { useCallback, useEffect, useState } from 'react';
import { BASE_URL, FindingCreate } from '../services/api';
import {
  clearOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  saveOfflineFinding,
} from '../services/storage';

interface UseSyncReturn {
  isSyncing: boolean;
  queueSize: number;
  lastSyncTime: Date | null;
  error: string | null;
  syncNow: () => Promise<void>;
  checkQueueSize: () => Promise<void>;
  enqueueOfflineFinding: (finding: FindingCreate) => Promise<void>;
}

export function useSync(): UseSyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkQueueSize = useCallback(async (): Promise<void> => {
    const queue = await getOfflineQueue();
    setQueueSize(queue.length);
  }, []);

  useEffect(() => {
    checkQueueSize();
  }, [checkQueueSize]);

  const enqueueOfflineFinding = useCallback(
    async (finding: FindingCreate): Promise<void> => {
      await saveOfflineFinding(finding);
      setQueueSize((prev) => prev + 1);
    },
    [],
  );

  const syncNow = useCallback(async (): Promise<void> => {
    setIsSyncing(true);
    setError(null);
    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) {
        setLastSyncTime(new Date());
        return;
      }

      const failed: FindingCreate[] = [];
      for (let i = 0; i < queue.length; i++) {
        try {
          const response = await fetch(`${BASE_URL}/findings/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queue[i]),
          });
          if (!response.ok) {
            failed.push(queue[i]);
          }
        } catch {
          failed.push(queue[i]);
        }
      }

      await clearOfflineQueue();
      for (const item of failed) {
        await saveOfflineFinding(item);
      }

      setQueueSize(failed.length);
      setLastSyncTime(new Date());

      if (failed.length > 0) {
        setError(`${failed.length} finding(s) failed to sync and remain in queue`);
      }
    } catch (err) {
      setError(`Sync failed: ${(err as Error).message}`);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isSyncing,
    queueSize,
    lastSyncTime,
    error,
    syncNow,
    checkQueueSize,
    enqueueOfflineFinding,
  };
}
