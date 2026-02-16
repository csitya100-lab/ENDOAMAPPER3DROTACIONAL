import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL_CACHE_KEY = 'endomapper_model_v1';
const MODEL_DB_NAME = 'EndoMapperDB';
const MODEL_STORE_NAME = 'models';
export const MODEL_LOAD_TIMEOUT = 15000;

const openModelDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(MODEL_DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(MODEL_STORE_NAME)) {
        db.createObjectStore(MODEL_STORE_NAME);
      }
    };
  });
};

export const getCachedModel = async (): Promise<ArrayBuffer | null> => {
  try {
    const db = await openModelDB();
    return new Promise((resolve) => {
      const tx = db.transaction(MODEL_STORE_NAME, 'readonly');
      const store = tx.objectStore(MODEL_STORE_NAME);
      const request = store.get(MODEL_CACHE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const cacheModel = async (data: ArrayBuffer): Promise<void> => {
  try {
    const db = await openModelDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(MODEL_STORE_NAME, 'readwrite');
      const store = tx.objectStore(MODEL_STORE_NAME);
      const request = store.put(data, MODEL_CACHE_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // silently fail cache
  }
};

export const loadModelWithProgress = async (
  onProgress: (progress: number) => void,
  onComplete: (buffer: ArrayBuffer) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    const cachedData = await getCachedModel();

    if (cachedData) {
      onProgress(50);
      onComplete(cachedData);
      return;
    }

    const response = await fetch('/model.glb');
    if (!response.ok) throw new Error('Network response was not ok');
    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      const buffer = await response.arrayBuffer();
      cacheModel(buffer).catch(() => {});
      onComplete(buffer);
      return;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (total > 0) {
        onProgress(Math.round((loaded / total) * 90));
      }
    }

    const allChunks = new Uint8Array(loaded);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    const buffer = allChunks.buffer;
    cacheModel(buffer).catch(() => {});
    onComplete(buffer);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
