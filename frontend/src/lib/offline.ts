export type OfflineQueueMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface OfflineQueueRequest {
  id: string;
  endpoint: string;
  method: OfflineQueueMethod;
  body: any;
  options?: RequestInit;
  createdAt: number;
  lastAttemptAt?: number;
  retryCount: number;
}

const CACHE_PREFIX = 'henotace_agro_cache:';
const QUEUE_KEY = 'henotace_agro_offline_queue';
const SYNC_STATUS_EVENT = 'henotace-offline-sync';

const serialize = (value: any) => JSON.stringify(value);
const deserialize = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getCacheKey = (endpoint: string) => `${CACHE_PREFIX}${encodeURIComponent(endpoint)}`;

export const getCachedData = <T>(endpoint: string): T | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(getCacheKey(endpoint));
  const entry = deserialize<{ value: T; expiresAt: number | null }>(raw);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    localStorage.removeItem(getCacheKey(endpoint));
    return null;
  }
  return entry.value;
};

export const setCachedData = <T>(endpoint: string, value: T, ttl: number = 1000 * 60 * 60 * 24): void => {
  if (typeof window === 'undefined') return;
  const entry = {
    value,
    expiresAt: ttl > 0 ? Date.now() + ttl : null,
  };
  localStorage.setItem(getCacheKey(endpoint), serialize(entry));
};

export const removeCachedData = (endpoint: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getCacheKey(endpoint));
};

export const getQueuedRequests = (): OfflineQueueRequest[] => {
  if (typeof window === 'undefined') return [];
  return deserialize<OfflineQueueRequest[]>(localStorage.getItem(QUEUE_KEY)) || [];
};

const saveQueuedRequests = (queue: OfflineQueueRequest[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, serialize(queue));
};

export const queueRequest = (request: OfflineQueueRequest): void => {
  const current = getQueuedRequests();
  saveQueuedRequests([...current.filter((item) => item.id !== request.id), request]);
  dispatchOfflineSyncStatus('queued');
};

export const removeQueuedRequest = (id: string): void => {
  const queue = getQueuedRequests().filter((item) => item.id !== id);
  saveQueuedRequests(queue);
};

export const clearQueuedRequests = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
};

export const getIsOnline = (): boolean => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

export const dispatchOfflineSyncStatus = (status: 'online' | 'offline' | 'syncing' | 'queued' | 'idle'): void => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT, { detail: { status, timestamp: Date.now() } }));
};

export const subscribeOfflineSyncStatus = (
  listener: (event: CustomEvent<{ status: string; timestamp: number }>) => void
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    listener(event as CustomEvent<{ status: string; timestamp: number }>);
  };
  window.addEventListener(SYNC_STATUS_EVENT, handler as EventListener);

  return () => {
    window.removeEventListener(SYNC_STATUS_EVENT, handler as EventListener);
  };
};

export const initOfflineStatusListeners = (): void => {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => dispatchOfflineSyncStatus('online'));
  window.addEventListener('offline', () => dispatchOfflineSyncStatus('offline'));
  dispatchOfflineSyncStatus(navigator.onLine ? 'online' : 'offline');
};
