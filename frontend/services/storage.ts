import AsyncStorage from '@react-native-async-storage/async-storage';
import { FindingCreate, InspectionSession } from './api';

export const OFFLINE_QUEUE_KEY = '@cat_inspect/offline_queue';
export const INSPECTION_STORAGE_KEY = '@cat_inspect/current_inspection';

export async function saveOfflineFinding(finding: FindingCreate): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push(finding);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function getOfflineQueue(): Promise<FindingCreate[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FindingCreate[];
  } catch {
    return [];
  }
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export async function removeFromOfflineQueue(index: number): Promise<void> {
  const queue = await getOfflineQueue();
  queue.splice(index, 1);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export async function saveCurrentInspection(inspection: InspectionSession): Promise<void> {
  await AsyncStorage.setItem(INSPECTION_STORAGE_KEY, JSON.stringify(inspection));
}

export async function getCurrentInspection(): Promise<InspectionSession | null> {
  const raw = await AsyncStorage.getItem(INSPECTION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as InspectionSession;
  } catch {
    return null;
  }
}

export async function clearCurrentInspection(): Promise<void> {
  await AsyncStorage.removeItem(INSPECTION_STORAGE_KEY);
}
