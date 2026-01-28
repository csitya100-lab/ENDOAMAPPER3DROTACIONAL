import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { useLesionStore, Lesion, Severity, MarkerType } from '@/lib/lesionStore';
import { useReportStore, Report } from '@/lib/reportStore';
import { useAnatomyStore, AnatomyElement } from '@/lib/anatomyStore';
import { Camera } from 'lucide-react';

const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const MODEL_CACHE_KEY = 'endomapper_model_v1';
const MODEL_LOAD_TIMEOUT = 15000;
const MODEL_DB_NAME = 'EndoMapperDB';
const MODEL_STORE_NAME = 'models';

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

const getCachedModel = async (): Promise<ArrayBuffer | null> => {
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

const cacheModel = async (data: ArrayBuffer): Promise<void> => {
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
    console.warn('Failed to cache model');
  }
};

interface Uterus3DProps {
  severity?: Severity;
  markerSize?: number;
  markerColor?: string;
  markerType?: MarkerType;
  onLesionCountChange?: (count: number) => void;
  onLesionsUpdate?: (lesions: Lesion[]) => void;
  readOnly?: boolean;
  interactionMode?: 'add' | 'edit';
  selectedLesionId?: string | null;
  onSelectLesion?: (id: string | null) => void;
}

export interface Uterus3DRef {
  addTestLesion: () => void;
  clearLesions: () => void;
  captureScreenshot: () => string | null;
}

const COLORS = {
  superficial: 0xef4444,
  moderate: 0xf97316,
  deep: 0x3b82f6
};

export const Uterus3D = forwardRef<Uterus3DRef, Uterus3DProps>(({ 
  severity = 'superficial', 
  markerSize = 0.18, 
  markerColor, 
  markerType = 'circle', 
  onLesionCountChange, 
  onLesionsUpdate, 
  readOnly = false,
  interactionMode = 'add',
  selectedLesionId = null,
  onSelectLesion
}, ref) => {
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error' | 'fallback'>('loading');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const readOnlyRef = useRef(readOnly);
  
  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewMainRef = useRef<HTMLDivElement>(null);
  const viewSagittalRef = useRef<HTMLDivElement>(null);
  const viewCoronalRef = useRef<HTMLDivElement>(null);
  const viewPosteriorRef = useRef<HTMLDivElement>(null);
  
  const { lesions, addLesion, updateLesion, removeLesion, clearLesions } = useLesionStore();
  const { setDraftImage } = useReportStore();
  
  const currentSeverityRef = useRef(severity);
  const currentMarkerSizeRef = useRef(markerSize);
  const currentMarkerColorRef = useRef(markerColor);
  const currentMarkerTypeRef = useRef(markerType);
  const viewsRef = useRef<any[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const markerGroupsRef = useRef<{ [key: number]: THREE.Group }>({});
  const sceneRef = useRef<THREE.Scene | null>(null);
  const anatomyGroupRef = useRef<THREE.Group | null>(null);
  const updateMarkersRef = useRef<(() => void) | null>(null);
  const anatomyMeshesRef = useRef<Record<AnatomyElement, THREE.Object3D[]>>({
    uterus: [],
    uterosacrals: [],
    roundLigaments: [],
    ureters: [],
    bladder: [],
  });
  
  const anatomyVisibility = useAnatomyStore((state) => state.visibility);
  
  const dragStateRef = useRef<{
    isDragging: boolean;
    lesionId: string | null;
    viewIdx: number;
  }>({ isDragging: false, lesionId: null, viewIdx: 0 });

  // Map lesion IDs to their marker objects for efficient add/remove/update
  const markersByLesionRef = useRef<{ [lesionId: string]: THREE.Object3D[] }>({});
  
  // Track previous lesions for smart diffing
  const prevLesionsRef = useRef<Lesion[]>([]);
  
  // Cached geometries and materials for reuse
  const geometryCacheRef = useRef<{ [key: string]: THREE.BufferGeometry }>({});
  const materialCacheRef = useRef<{ [key: string]: THREE.Material }>({});

  useEffect(() => {
    currentSeverityRef.current = severity;
  }, [severity]);

  useEffect(() => {
    currentMarkerSizeRef.current = markerSize;
  }, [markerSize]);

  useEffect(() => {
    currentMarkerColorRef.current = markerColor;
  }, [markerColor]);

  useEffect(() => {
    currentMarkerTypeRef.current = markerType;
  }, [markerType]);

  useEffect(() => {
    onLesionCountChange?.(lesions.length);
    onLesionsUpdate?.([...lesions]);
    if (updateMarkersRef.current) {
      updateMarkersRef.current();
    }
  }, [lesions, onLesionCountChange, onLesionsUpdate]);

  // Update visibility of anatomy elements based on store
  useEffect(() => {
    Object.entries(anatomyVisibility).forEach(([element, visible]) => {
      const meshes = anatomyMeshesRef.current[element as AnatomyElement];
      if (meshes) {
        meshes.forEach((mesh) => {
          mesh.visible = visible;
        });
      }
    });
  }, [anatomyVisibility]);

  useImperativeHandle(ref, () => ({
    addTestLesion: () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.5;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.sin(phi) * Math.sin(theta));
      const z = r * Math.cos(phi);
      
      addLesion({
        position: { x, y, z },
        severity: currentSeverityRef.current
      });
    },
    clearLesions: () => {
      clearLesions();
    },
    captureScreenshot: () => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const mainView = viewsRef.current[0];
      
      if (!renderer || !scene || !mainView || !mainView.camera) {
        console.warn('Screenshot: renderer, scene ou camera não inicializado');
        return null;
      }
      
      try {
        const targetSize = 512;
        const renderTarget = new THREE.WebGLRenderTarget(targetSize, targetSize, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        });
        
        const originalScissorTest = renderer.getScissorTest();
        const originalViewport = new THREE.Vector4();
        const originalScissor = new THREE.Vector4();
        renderer.getViewport(originalViewport);
        renderer.getScissor(originalScissor);
        
        const captureCamera = mainView.camera.clone() as THREE.PerspectiveCamera;
        captureCamera.aspect = 1;
        captureCamera.updateProjectionMatrix();
        
        renderer.setScissorTest(false);
        renderer.setRenderTarget(renderTarget);
        renderer.setViewport(0, 0, targetSize, targetSize);
        renderer.render(scene, captureCamera);
        
        const pixels = new Uint8Array(targetSize * targetSize * 4);
        renderer.readRenderTargetPixels(renderTarget, 0, 0, targetSize, targetSize, pixels);
        
        renderer.setRenderTarget(null);
        renderer.setScissorTest(originalScissorTest);
        renderer.setViewport(originalViewport);
        renderer.setScissor(originalScissor);
        renderTarget.dispose();
        
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.createImageData(targetSize, targetSize);
          // Apply gamma correction (sRGB) to match live renderer output
          const gammaCorrect = (value: number) => Math.round(Math.pow(value / 255, 1 / 2.2) * 255);
          for (let y = 0; y < targetSize; y++) {
            for (let x = 0; x < targetSize; x++) {
              const srcIdx = ((targetSize - 1 - y) * targetSize + x) * 4;
              const dstIdx = (y * targetSize + x) * 4;
              imageData.data[dstIdx] = gammaCorrect(pixels[srcIdx]);
              imageData.data[dstIdx + 1] = gammaCorrect(pixels[srcIdx + 1]);
              imageData.data[dstIdx + 2] = gammaCorrect(pixels[srcIdx + 2]);
              imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
            }
          }
          ctx.putImageData(imageData, 0, 0);
          return canvas.toDataURL('image/png');
        }
        return null;
      } catch (e) {
        console.error('Erro ao capturar screenshot:', e);
        return null;
      }
    }
  }));

  const createLesionInStorage = (position: { x: number; y: number; z: number }, sev: Severity) => {
    addLesion({
      position,
      severity: sev,
      size: currentMarkerSizeRef.current,
      color: currentMarkerColorRef.current,
      markerType: currentMarkerTypeRef.current
    });
  };

  const captureViewScreenshot = useCallback((viewIndex: number, targetView: keyof Report["images2D"]) => {
    console.log(`captureViewScreenshot chamado: viewIndex=${viewIndex}, targetView=${targetView}`);
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const view = viewsRef.current[viewIndex];
    
    if (!renderer || !scene || !view || !view.camera) {
      console.warn('Captura: renderer, scene ou camera não inicializado');
      return;
    }
    
    try {
      const targetSize = 512;
      const renderTarget = new THREE.WebGLRenderTarget(targetSize, targetSize, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
      });
      
      const originalScissorTest = renderer.getScissorTest();
      const originalViewport = new THREE.Vector4();
      const originalScissor = new THREE.Vector4();
      renderer.getViewport(originalViewport);
      renderer.getScissor(originalScissor);
      
      const captureCamera = view.camera.clone() as THREE.Camera;
      
      if ((captureCamera as THREE.OrthographicCamera).isOrthographicCamera) {
        const ortho = captureCamera as THREE.OrthographicCamera;
        const height = ortho.top - ortho.bottom;
        const width = ortho.right - ortho.left;
        const size = Math.max(height, width);
        ortho.left = -size / 2;
        ortho.right = size / 2;
        ortho.top = size / 2;
        ortho.bottom = -size / 2;
        ortho.updateProjectionMatrix();
      } else if ((captureCamera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const persp = captureCamera as THREE.PerspectiveCamera;
        persp.aspect = 1;
        persp.updateProjectionMatrix();
      }
      
      renderer.setScissorTest(false);
      renderer.setRenderTarget(renderTarget);
      renderer.setViewport(0, 0, targetSize, targetSize);
      renderer.render(scene, captureCamera);
      
      const pixels = new Uint8Array(targetSize * targetSize * 4);
      renderer.readRenderTargetPixels(renderTarget, 0, 0, targetSize, targetSize, pixels);
      
      renderer.setRenderTarget(null);
      renderer.setScissorTest(originalScissorTest);
      renderer.setViewport(originalViewport);
      renderer.setScissor(originalScissor);
      renderTarget.dispose();
      
      const canvas = document.createElement('canvas');
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.createImageData(targetSize, targetSize);
        // Apply gamma correction (sRGB) to match live renderer output
        const gammaCorrect = (value: number) => Math.round(Math.pow(value / 255, 1 / 2.2) * 255);
        for (let y = 0; y < targetSize; y++) {
          for (let x = 0; x < targetSize; x++) {
            const srcIdx = ((targetSize - 1 - y) * targetSize + x) * 4;
            const dstIdx = (y * targetSize + x) * 4;
            imageData.data[dstIdx] = gammaCorrect(pixels[srcIdx]);
            imageData.data[dstIdx + 1] = gammaCorrect(pixels[srcIdx + 1]);
            imageData.data[dstIdx + 2] = gammaCorrect(pixels[srcIdx + 2]);
            imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
          }
        }
        ctx.putImageData(imageData, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/png');
        console.log(`Imagem capturada para ${targetView}, tamanho: ${imageDataUrl.length} bytes`);
        setDraftImage(targetView, imageDataUrl);
      }
    } catch (e) {
      console.error('Erro ao capturar vista:', e);
    }
  }, [setDraftImage]);

  // Get or create cached geometry
  const getCachedGeometry = (type: string, size: number): THREE.BufferGeometry => {
    const key = `${type}_${size.toFixed(2)}`;
    if (!geometryCacheRef.current[key]) {
      switch (type) {
        case 'square':
          geometryCacheRef.current[key] = new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 1.5);
          break;
        case 'triangle':
          geometryCacheRef.current[key] = new THREE.ConeGeometry(size, size * 2, 3);
          break;
        case 'circle':
        default:
          geometryCacheRef.current[key] = new THREE.SphereGeometry(size, 12, 12);
          break;
      }
    }
    return geometryCacheRef.current[key];
  };

  // Get or create cached material
  const getCachedMaterial = (color: number): THREE.MeshStandardMaterial => {
    const key = `mat_${color}`;
    if (!materialCacheRef.current[key]) {
      materialCacheRef.current[key] = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.2,
        metalness: 0.6,
        emissive: color,
        emissiveIntensity: 0.4
      });
    }
    return materialCacheRef.current[key] as THREE.MeshStandardMaterial;
  };

  // Add markers for a single lesion (in all 4 views)
  const addMarkersForLesion = (lesion: Lesion) => {
    if (!sceneRef.current || markersByLesionRef.current[lesion.id]) return;
    
    const markers: THREE.Object3D[] = [];
    const markerSize = lesion.size ?? 0.18;
    const markerColor = lesion.color ? parseInt(lesion.color.replace('#', ''), 16) : COLORS[lesion.severity];
    const markerType = lesion.markerType ?? 'circle';
    
    const geometry = getCachedGeometry(markerType, markerSize);
    const material = getCachedMaterial(markerColor);
    
    viewsRef.current.forEach((view, viewIdx) => {
      if (!markerGroupsRef.current[viewIdx]) {
        markerGroupsRef.current[viewIdx] = new THREE.Group();
        sceneRef.current?.add(markerGroupsRef.current[viewIdx]);
      }
      
      const markerGroup = markerGroupsRef.current[viewIdx];
      
      // Create marker mesh (clone geometry for independent transforms)
      const marker = new THREE.Mesh(geometry.clone(), material);
      marker.position.set(lesion.position.x, lesion.position.y, lesion.position.z);
      marker.userData.lesionId = lesion.id;
      markerGroup.add(marker);
      markers.push(marker);
      
      // Add ring for orthographic views
      if (viewIdx > 0) {
        const ringRadius = markerSize * 1.4;
        const ringGeometry = new THREE.BufferGeometry();
        const ringPositions = [];
        const ringSegments = 32;
        for (let i = 0; i <= ringSegments; i++) {
          const angle = (i / ringSegments) * Math.PI * 2;
          ringPositions.push(
            lesion.position.x + Math.cos(angle) * ringRadius,
            lesion.position.y + Math.sin(angle) * ringRadius,
            lesion.position.z
          );
        }
        ringGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ringPositions), 3));
        const ringMaterial = new THREE.LineBasicMaterial({
          color: markerColor,
          linewidth: 2,
          transparent: true,
          opacity: 0.7
        });
        const ring = new THREE.Line(ringGeometry, ringMaterial);
        ring.userData.lesionId = lesion.id;
        markerGroup.add(ring);
        markers.push(ring);
      }
    });
    
    markersByLesionRef.current[lesion.id] = markers;
  };

  // Remove markers for a single lesion
  const removeMarkersForLesion = (lesionId: string) => {
    const markers = markersByLesionRef.current[lesionId];
    if (!markers) return;
    
    markers.forEach(marker => {
      if (marker.parent) {
        marker.parent.remove(marker);
      }
    });
    
    delete markersByLesionRef.current[lesionId];
  };

  // Update position of existing markers for a lesion
  const updateMarkerPositions = (lesionId: string, position: { x: number; y: number; z: number }, lesionSize?: number) => {
    const markers = markersByLesionRef.current[lesionId];
    if (!markers) return;
    
    const size = lesionSize ?? 0.18;
    const ringRadius = size * 1.4;
    
    markers.forEach(marker => {
      if (marker instanceof THREE.Mesh) {
        marker.position.set(position.x, position.y, position.z);
      } else if (marker instanceof THREE.Line) {
        // Rebuild ring geometry at new position using actual size
        const geometry = marker.geometry as THREE.BufferGeometry;
        const positions = geometry.getAttribute('position');
        if (positions) {
          const ringSegments = 32;
          for (let i = 0; i <= ringSegments; i++) {
            const angle = (i / ringSegments) * Math.PI * 2;
            positions.setXYZ(i, 
              position.x + Math.cos(angle) * ringRadius,
              position.y + Math.sin(angle) * ringRadius,
              position.z
            );
          }
          positions.needsUpdate = true;
        }
      }
    });
  };

  // Check if lesion appearance changed (size, color, type)
  const lesionAppearanceChanged = (prev: Lesion, curr: Lesion): boolean => {
    return prev.size !== curr.size || 
           prev.color !== curr.color || 
           prev.markerType !== curr.markerType ||
           prev.severity !== curr.severity;
  };

  // Smart update: only add/remove/move what changed
  const updateAllMarkers = () => {
    if (!sceneRef.current) return;
    
    const currentLesions = useLesionStore.getState().lesions;
    const prevLesions = prevLesionsRef.current;
    
    const currentIds = new Set(currentLesions.map(l => l.id));
    const prevIds = new Set(prevLesions.map(l => l.id));
    
    // Find removed lesions
    prevLesions.forEach(lesion => {
      if (!currentIds.has(lesion.id)) {
        removeMarkersForLesion(lesion.id);
      }
    });
    
    // Find added or updated lesions
    currentLesions.forEach(lesion => {
      if (!prevIds.has(lesion.id)) {
        // New lesion - add markers
        addMarkersForLesion(lesion);
      } else {
        // Existing lesion - check what changed
        const prev = prevLesions.find(p => p.id === lesion.id);
        if (prev) {
          // Check if appearance changed (size, color, type, severity)
          if (lesionAppearanceChanged(prev, lesion)) {
            // Appearance changed - rebuild markers completely
            removeMarkersForLesion(lesion.id);
            addMarkersForLesion(lesion);
          } else if (
            prev.position.x !== lesion.position.x ||
            prev.position.y !== lesion.position.y ||
            prev.position.z !== lesion.position.z
          ) {
            // Only position changed - update positions efficiently
            updateMarkerPositions(lesion.id, lesion.position, lesion.size);
          }
        }
      }
    });
    
    // Update prev reference with deep copy
    prevLesionsRef.current = currentLesions.map(l => ({ 
      ...l, 
      position: { ...l.position } 
    }));
  };

  // Legacy function for compatibility - creates all markers from scratch
  const createMarkerForView = (lesion: Lesion, viewIdx: number, view: any) => {
    addMarkersForLesion(lesion);
  };

  useEffect(() => {
    if (!canvasRef.current || !viewMainRef.current || !viewSagittalRef.current || !viewCoronalRef.current || !viewPosteriorRef.current) return;

    let animationFrameId: number;
    let isMounted = true;
    let renderer: THREE.WebGLRenderer;
    let loadTimeout: NodeJS.Timeout | null = null;

    const canvas = canvasRef.current;
    const isIOSDevice = isIOS();
    const isMobileDevice = isMobile();
    
    try {
      const contextAttributes: WebGLContextAttributes = {
        antialias: !isIOSDevice,
        alpha: true,
        powerPreference: isIOSDevice ? 'low-power' : 'high-performance',
        preserveDrawingBuffer: true,
        failIfMajorPerformanceCaveat: false
      };
      
      renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        ...contextAttributes
      });
    } catch (e) {
      console.warn('WebGL not available:', e);
      setLoadingState('error');
      setErrorMessage('WebGL não disponível neste dispositivo');
      return;
    }
    
    const pixelRatio = isIOSDevice ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;
    renderer.setPixelRatio(pixelRatio);
    
    if (!isIOSDevice && !isMobileDevice) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
    } else {
      renderer.shadowMap.enabled = false;
    }
    
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setScissorTest(true);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;
    
    const ambientLight = new THREE.AmbientLight(0xFFF5E1, isIOSDevice ? 0.9 : 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
    dirLight.position.set(8, 8, 5);
    
    if (!isIOSDevice && !isMobileDevice) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.left = -15;
      dirLight.shadow.camera.right = 15;
      dirLight.shadow.camera.top = 15;
      dirLight.shadow.camera.bottom = -15;
      dirLight.shadow.camera.far = 100;
      dirLight.shadow.bias = 0.0001;
      dirLight.shadow.radius = 4;
    }
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xD3D3D3, 0.4);
    fillLight.position.set(-8, 3, 5);
    scene.add(fillLight);

    const anatomyGroup = new THREE.Group();
    anatomyGroupRef.current = anatomyGroup;
    scene.add(anatomyGroup);

    // Helper to reset anatomy meshes ref
    const resetAnatomyMeshes = () => {
      anatomyMeshesRef.current = {
        uterus: [],
        uterosacrals: [],
        roundLigaments: [],
        ureters: [],
        bladder: [],
      };
    };
    
    // Helper to apply visibility from store
    const applyVisibilityFromStore = () => {
      const currentVisibility = useAnatomyStore.getState().visibility;
      Object.entries(currentVisibility).forEach(([element, visible]) => {
        const meshes = anatomyMeshesRef.current[element as AnatomyElement];
        if (meshes) {
          meshes.forEach((mesh) => {
            mesh.visible = visible;
          });
        }
      });
    };
    
    const createFallbackModel = () => {
      resetAnatomyMeshes();
      const geometry = new THREE.SphereGeometry(1.8, 32, 24);
      const material = new THREE.MeshStandardMaterial({
        color: 0xDD8A96,
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.userData.anatomyType = 'uterus';
      anatomyMeshesRef.current.uterus.push(sphere);
      anatomyGroup.add(sphere);
      setLoadingState('fallback');
      
      // Apply initial visibility
      applyVisibilityFromStore();
      
      // Render existing lesions after fallback model loads
      updateAllMarkers();
    };

    loadTimeout = setTimeout(() => {
      if (isMounted && loadingState === 'loading') {
        console.warn('Model load timeout - using fallback');
        createFallbackModel();
      }
    }, MODEL_LOAD_TIMEOUT);

    const processModel = (gltf: any) => {
        if (!isMounted) return;
        if (loadTimeout) clearTimeout(loadTimeout);
        
        // Reset anatomy meshes before populating
        resetAnatomyMeshes();
        
        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim;
        model.scale.set(scale, scale, scale);

        model.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh && child !== model) {
                const mesh = child as THREE.Mesh;
                
                // Hide existing uterosacral ligaments from original GLB
                if (mesh.name.toLowerCase().includes('sacro') || 
                    mesh.name.toLowerCase().includes('ligament') || 
                    mesh.name.toLowerCase().includes('uterosacral')) {
                  mesh.visible = false;
                  return;
                }

                let originalColor = new THREE.Color(0xffffff);
                let originalMat = mesh.material;
                if (Array.isArray(originalMat)) {
                    originalMat = originalMat[0];
                }
                if (originalMat instanceof THREE.MeshStandardMaterial || originalMat instanceof THREE.MeshPhongMaterial) {
                    originalColor = (originalMat as any).color.clone();
                }
                
                const r = originalColor.r;
                const g = originalColor.g;
                const b = originalColor.b;
                
                let newColor = new THREE.Color(0xDD8A96);
                let roughness = 0.45;
                let metalness = 0.05;
                let clearcoat = isIOSDevice ? 0 : 0.1;
                let envMapIntensity = 0.5;
                
                if (r > 0.8 && g > 0.8 && b < 0.4) {
                    newColor = new THREE.Color(0xFFD700);
                }
                else if (r < 0.4 && g > 0.7 && b > 0.8) {
                    newColor = new THREE.Color(0x87CEEB);
                }
                else if (r > 0.7 && g > 0.4 && b > 0.3 && r - g > 0.2) {
                    newColor = new THREE.Color(0xD4956F);
                }
                else if (r > 0.6 && g > 0.4 && b > 0.3 && r - g < 0.3) {
                    newColor = new THREE.Color(0xC49080);
                    roughness = 0.50;
                    clearcoat = isIOSDevice ? 0 : 0.08;
                }
                else if (r > 0.8 && g < 0.7 && b < 0.7 && r - g < 0.3) {
                    newColor = new THREE.Color(0xE8B4B8);
                    roughness = 0.55;
                    metalness = 0.02;
                    clearcoat = isIOSDevice ? 0 : 0.05;
                    envMapIntensity = 0.3;
                }
                
                let newMaterial: THREE.Material;
                if (isIOSDevice || isMobileDevice) {
                    newMaterial = new THREE.MeshStandardMaterial({
                        color: newColor,
                        roughness: roughness,
                        metalness: metalness,
                        side: THREE.DoubleSide
                    });
                } else {
                    newMaterial = new THREE.MeshPhysicalMaterial({
                        color: newColor,
                        roughness: roughness,
                        metalness: metalness,
                        clearcoat: clearcoat,
                        envMapIntensity: envMapIntensity,
                        side: THREE.DoubleSide
                    });
                }
                
                mesh.material = newMaterial;
                if (!isIOSDevice && !isMobileDevice) {
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                }
            }
        });
        
        anatomyGroup.add(model);
        
        // Add uterosacral ligaments - positioned at uterus body/cervix junction
        const ligamentMaterial = new THREE.MeshStandardMaterial({
          color: 0xC49080,
          roughness: 0.55,
          metalness: 0.02,
          side: THREE.DoubleSide
        });
        
        // Right uterosacral ligament - from body/cervix junction going posteriorly (negative Z) and laterally
        const rightLigamentCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.3, -0.5, -0.1),
          new THREE.Vector3(0.6, -0.8, -0.7),
          new THREE.Vector3(0.9, -1.2, -1.3),
          new THREE.Vector3(1.0, -1.5, -1.8),
        ]);
        const rightLigamentGeo = new THREE.TubeGeometry(rightLigamentCurve, 20, 0.08, 8, false);
        const rightLigament = new THREE.Mesh(rightLigamentGeo, ligamentMaterial);
        rightLigament.castShadow = true;
        rightLigament.receiveShadow = true;
        rightLigament.userData.anatomyType = 'uterosacrals';
        anatomyGroup.add(rightLigament);
        anatomyMeshesRef.current.uterosacrals.push(rightLigament);
        
        // Left uterosacral ligament - mirror of right (posterior direction)
        const leftLigamentCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.3, -0.5, -0.1),
          new THREE.Vector3(-0.6, -0.8, -0.7),
          new THREE.Vector3(-0.9, -1.2, -1.3),
          new THREE.Vector3(-1.0, -1.5, -1.8),
        ]);
        const leftLigamentGeo = new THREE.TubeGeometry(leftLigamentCurve, 20, 0.08, 8, false);
        const leftLigament = new THREE.Mesh(leftLigamentGeo, ligamentMaterial);
        leftLigament.castShadow = true;
        leftLigament.receiveShadow = true;
        leftLigament.userData.anatomyType = 'uterosacrals';
        anatomyGroup.add(leftLigament);
        anatomyMeshesRef.current.uterosacrals.push(leftLigament);
        
        // Add ureters - thin tubes running laterally near the uterus
        const ureterMaterial = new THREE.MeshStandardMaterial({
          color: 0xFFE4B5,
          roughness: 0.6,
          metalness: 0.0,
          side: THREE.DoubleSide
        });
        
        // Right ureter - runs from upper lateral position down past cervix (posterior to ovaries)
        const rightUreterCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(1.8, 1.5, -0.6),
          new THREE.Vector3(1.5, 0.5, -0.8),
          new THREE.Vector3(1.2, -0.5, -1.0),
          new THREE.Vector3(0.9, -1.5, -1.2),
          new THREE.Vector3(0.6, -2.5, -1.4),
        ]);
        const rightUreterGeo = new THREE.TubeGeometry(rightUreterCurve, 24, 0.04, 8, false);
        const rightUreter = new THREE.Mesh(rightUreterGeo, ureterMaterial);
        rightUreter.castShadow = true;
        rightUreter.receiveShadow = true;
        rightUreter.userData.anatomyType = 'ureters';
        anatomyGroup.add(rightUreter);
        anatomyMeshesRef.current.ureters.push(rightUreter);
        
        // Left ureter - mirror of right (posterior to ovaries)
        const leftUreterCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-1.8, 1.5, -0.6),
          new THREE.Vector3(-1.5, 0.5, -0.8),
          new THREE.Vector3(-1.2, -0.5, -1.0),
          new THREE.Vector3(-0.9, -1.5, -1.2),
          new THREE.Vector3(-0.6, -2.5, -1.4),
        ]);
        const leftUreterGeo = new THREE.TubeGeometry(leftUreterCurve, 24, 0.04, 8, false);
        const leftUreter = new THREE.Mesh(leftUreterGeo, ureterMaterial);
        leftUreter.castShadow = true;
        leftUreter.receiveShadow = true;
        leftUreter.userData.anatomyType = 'ureters';
        anatomyGroup.add(leftUreter);
        anatomyMeshesRef.current.ureters.push(leftUreter);
        
        // Round ligaments - from cornual region (where tubes attach), going anteriorly
        // Position: just anterior to fallopian tube insertion at upper lateral uterus
        const roundLigamentMaterial = new THREE.MeshStandardMaterial({
          color: 0xD4956F,
          roughness: 0.55,
          metalness: 0.02,
          side: THREE.DoubleSide
        });
        
        // Right round ligament - from right cornual region, anterior to tube, going down/forward
        const rightRoundCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.9, 1.4, 0.5),   // Start at cornual region, anterior to tube
          new THREE.Vector3(1.2, 1.0, 0.9),   // Curve forward and lateral
          new THREE.Vector3(1.5, 0.4, 1.3),   // Continue toward inguinal
          new THREE.Vector3(2.0, -0.2, 1.6),  // End toward inguinal canal
        ]);
        const rightRoundGeo = new THREE.TubeGeometry(rightRoundCurve, 20, 0.05, 8, false);
        const rightRound = new THREE.Mesh(rightRoundGeo, roundLigamentMaterial);
        rightRound.castShadow = true;
        rightRound.receiveShadow = true;
        rightRound.userData.anatomyType = 'roundLigaments';
        anatomyGroup.add(rightRound);
        anatomyMeshesRef.current.roundLigaments.push(rightRound);
        
        // Left round ligament - mirror of right
        const leftRoundCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.9, 1.4, 0.5),   // Start at left cornual region
          new THREE.Vector3(-1.2, 1.0, 0.9),   // Curve forward and lateral
          new THREE.Vector3(-1.5, 0.4, 1.3),   // Continue toward inguinal
          new THREE.Vector3(-2.0, -0.2, 1.6),  // End toward inguinal canal
        ]);
        const leftRoundGeo = new THREE.TubeGeometry(leftRoundCurve, 20, 0.05, 8, false);
        const leftRound = new THREE.Mesh(leftRoundGeo, roundLigamentMaterial);
        leftRound.castShadow = true;
        leftRound.receiveShadow = true;
        leftRound.userData.anatomyType = 'roundLigaments';
        anatomyGroup.add(leftRound);
        anatomyMeshesRef.current.roundLigaments.push(leftRound);
        
        // Identify bladder by position (most anterior mesh - highest Z value)
        // Then tag remaining meshes as uterus
        const allMeshes: THREE.Mesh[] = [];
        model.traverse((child: any) => {
          if ((child as THREE.Mesh).isMesh) {
            allMeshes.push(child as THREE.Mesh);
          }
        });
        
        // Find the mesh with highest average Z position (most anterior = bladder)
        let bladderMesh: THREE.Mesh | null = null;
        let maxZ = -Infinity;
        
        allMeshes.forEach((mesh) => {
          mesh.geometry.computeBoundingBox();
          const box = mesh.geometry.boundingBox;
          if (box) {
            const centerZ = (box.min.z + box.max.z) / 2;
            if (centerZ > maxZ) {
              maxZ = centerZ;
              bladderMesh = mesh;
            }
          }
        });
        
        // Tag meshes
        allMeshes.forEach((mesh) => {
          if (mesh === bladderMesh) {
            mesh.userData.anatomyType = 'bladder';
            anatomyMeshesRef.current.bladder.push(mesh);
          } else {
            mesh.userData.anatomyType = 'uterus';
            anatomyMeshesRef.current.uterus.push(mesh);
          }
        });
        
        // Log anatomy mesh counts for debugging
        console.log('Anatomy meshes found:', {
          uterus: anatomyMeshesRef.current.uterus.length,
          uterosacrals: anatomyMeshesRef.current.uterosacrals.length,
          roundLigaments: anatomyMeshesRef.current.roundLigaments.length,
          ureters: anatomyMeshesRef.current.ureters.length,
          bladder: anatomyMeshesRef.current.bladder.length,
        });
        
        // Apply initial visibility state from store
        applyVisibilityFromStore();
        
        setLoadingState('loaded');
        setLoadingProgress(100);
        
        // Render existing lesions after model loads
        updateAllMarkers();
    };

    const loader = new GLTFLoader();
    
    const loadModelWithCache = async () => {
      try {
        const cachedData = await getCachedModel();
        
        if (cachedData) {
          setLoadingProgress(50);
          loader.parse(cachedData, '', processModel, (error) => {
            console.warn('Cached model parse failed, fetching fresh:', error);
            loadFreshModel();
          });
        } else {
          loadFreshModel();
        }
      } catch {
        loadFreshModel();
      }
    };

    const loadFreshModel = () => {
      fetch('/model.glb')
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          
          if (!response.body) {
            return response.arrayBuffer();
          }
          
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];
          let loaded = 0;
          
          const read = (): Promise<ArrayBuffer> => {
            return reader.read().then(({ done, value }) => {
              if (done) {
                const allChunks = new Uint8Array(loaded);
                let position = 0;
                for (const chunk of chunks) {
                  allChunks.set(chunk, position);
                  position += chunk.length;
                }
                return allChunks.buffer;
              }
              
              chunks.push(value);
              loaded += value.length;
              
              if (total > 0) {
                setLoadingProgress(Math.round((loaded / total) * 90));
              }
              
              return read();
            });
          };
          
          return read();
        })
        .then(async (buffer) => {
          if (!isMounted) return;
          
          cacheModel(buffer).catch(() => {});
          
          loader.parse(buffer, '', processModel, (error) => {
            if (!isMounted) return;
            if (loadTimeout) clearTimeout(loadTimeout);
            console.error('Error parsing model:', error);
            createFallbackModel();
            setErrorMessage('Não foi possível processar o modelo 3D');
          });
        })
        .catch((error) => {
          if (!isMounted) return;
          if (loadTimeout) clearTimeout(loadTimeout);
          console.error('Error fetching model:', error);
          createFallbackModel();
          setErrorMessage('Não foi possível carregar o modelo 3D');
        });
    };

    loadModelWithCache();

    // Initialize marker groups
    for (let i = 0; i < 4; i++) {
      markerGroupsRef.current[i] = new THREE.Group();
      scene.add(markerGroupsRef.current[i]);
    }

    // Assign updateAllMarkers function to ref for external access
    updateMarkersRef.current = updateAllMarkers;

    const views: any[] = [];
    viewsRef.current = views;

    function setupView(element: HTMLDivElement, cameraType: 'perspective' | 'orthographic', camPos: number[], upVec: number[], viewIdx: number, fov = 45) {
      let camera, controls;
      
      if (cameraType === 'perspective') {
        camera = new THREE.PerspectiveCamera(fov, element.clientWidth / element.clientHeight, 0.1, 100);
        camera.position.set(camPos[0], camPos[1], camPos[2]);
        controls = new OrbitControls(camera, element);
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE
        };
      } else {
        const frustumSize = 8;
        const aspect = element.clientWidth / element.clientHeight;
        camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, 
            frustumSize * aspect / 2, 
            frustumSize / 2, 
            frustumSize / -2, 
            0.1, 100
        );
        camera.position.set(camPos[0], camPos[1], camPos[2]);
        camera.zoom = 1;
        controls = new OrbitControls(camera, element);
        controls.enableRotate = false;
        controls.enableZoom = true;
        controls.enablePan = false;
      }

      camera.up.set(upVec[0], upVec[1], upVec[2]);
      camera.lookAt(0, 0, 0);
      controls.update();

      return { element, camera, controls, viewIdx, viewType: cameraType };
    }

    views.push(setupView(viewMainRef.current, 'perspective', [5, 2, 6], [0, 1, 0], 0));
    views.push(setupView(viewSagittalRef.current, 'orthographic', [10, 0, 0], [0, 1, 0], 1));
    views.push(setupView(viewCoronalRef.current, 'orthographic', [0, 0, 10], [0, 1, 0], 2));
    views.push(setupView(viewPosteriorRef.current, 'orthographic', [0, 0, -10], [0, 1, 0], 3));

    views[0].controls.enableRotate = true;

    // === UNIFIED RAYCASTING FOR ALL VIEWS ===
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function convertScreenToWorldCoords(event: PointerEvent, viewIdx: number): THREE.Vector3 | null {
      const view = views[viewIdx];
      const rect = view.element.getBoundingClientRect();
      
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, view.camera);

      // Use actual model intersection for ALL views to ensure correct depth
      // This solves the issue of posterior clicks mapping to anterior surfaces
      // because the ray originates from the specific camera position (e.g., behind the model)
      const intersects = raycaster.intersectObjects(anatomyGroup.children, true);
      
      if (intersects.length > 0) {
        // Return the first hit point (closest to camera)
        // For posterior view, this will be the back surface
        // For anterior view, this will be the front surface
        return intersects[0].point;
      }
      
      return null;
    }

    // Raycaster for detecting lesion markers
    const markerRaycaster = new THREE.Raycaster();
    const markerMouse = new THREE.Vector2();

    // Detect which lesion marker was clicked
    const detectLesionMarker = (event: PointerEvent, viewIdx: number): string | null => {
      const view = views[viewIdx];
      const rect = view.element.getBoundingClientRect();
      
      markerMouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      markerMouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      markerRaycaster.setFromCamera(markerMouse, view.camera);

      const markerGroup = markerGroupsRef.current[viewIdx];
      if (!markerGroup) return null;

      const intersects = markerRaycaster.intersectObjects(markerGroup.children, true);
      
      if (intersects.length > 0) {
        // Find the first hit that has a lesionId
        const hit = intersects.find(i => i.object.userData.lesionId);
        if (hit) {
          return hit.object.userData.lesionId;
        }
      }
      return null;
    };

    // Pointer down: Check if clicking on existing lesion or creating new one
    const handleViewClick = (viewIdx: number) => (event: PointerEvent) => {
      // Skip in read-only mode
      if (readOnlyRef.current) return;
      
      const isOrthographic = viewIdx > 0;

      // RULES:
      // Left click (0) -> Lesion interaction (select/add/move)
      // Right click (2) -> Camera orbit (Perspective) OR Insertion (Orthographic)
      
      if (event.button === 2) {
        if (isOrthographic) {
          // Right click in 2D views: Insertion
          const worldPos = convertScreenToWorldCoords(event, viewIdx);
          if (worldPos) {
            createLesionInStorage(
              { x: worldPos.x, y: worldPos.y, z: worldPos.z },
              currentSeverityRef.current
            );
            onSelectLesion?.(null);
          }
          event.preventDefault();
          return;
        } else {
          // Right click in 3D Perspective: Orbit (handled by OrbitControls)
          views[viewIdx].controls.enabled = true;
          return;
        }
      }
      
      if (event.button !== 0) return;
      
      const lesionId = detectLesionMarker(event, viewIdx);
      
      if (lesionId) {
        // Clicked on a marker with LEFT BUTTON: Select and start dragging
        onSelectLesion?.(lesionId);
        dragStateRef.current = { 
          isDragging: true, // isDraggingLesion
          lesionId, 
          viewIdx 
        };
        // Disable camera movement during lesion drag
        views[viewIdx].controls.enabled = false;
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
        event.preventDefault();
      } else {
        // Clicked empty space with LEFT BUTTON
        if (!isOrthographic) {
          // In 3D Perspective: Create new lesion
          const worldPos = convertScreenToWorldCoords(event, viewIdx);
          if (worldPos) {
            createLesionInStorage(
              { x: worldPos.x, y: worldPos.y, z: worldPos.z },
              currentSeverityRef.current
            );
            onSelectLesion?.(null);
          }
        } else {
          // In 2D views: Clear selection if clicking empty space with LEFT BUTTON
          onSelectLesion?.(null);
        }
      }
    };

    // Throttle for drag updates (16ms = ~60fps)
    let lastMoveTime = 0;
    const MOVE_THROTTLE_MS = 16;

    // Pointer move: Update dragged lesion position with throttle
    const handleViewMove = (viewIdx: number) => (event: PointerEvent) => {
      if (readOnlyRef.current) return;
      
      // ONLY move if we are explicitly dragging a lesion in the current view
      if (!dragStateRef.current.isDragging || dragStateRef.current.viewIdx !== viewIdx) return;

      // Throttle updates to 60fps max
      const now = performance.now();
      if (now - lastMoveTime < MOVE_THROTTLE_MS) return;
      lastMoveTime = now;

      const worldPos = convertScreenToWorldCoords(event, viewIdx);
      if (worldPos && dragStateRef.current.lesionId) {
        useLesionStore.getState().updateLesion(dragStateRef.current.lesionId, { 
          position: { x: worldPos.x, y: worldPos.y, z: worldPos.z } 
        });
        updateAllMarkers();
      }
    };

    // Pointer up: Stop dragging
    const handleViewUp = (viewIdx: number) => (event: PointerEvent) => {
      if (readOnlyRef.current) return;
      
      // Re-enable camera controls always on pointer up
      views[viewIdx].controls.enabled = true;
      
      if (!dragStateRef.current.isDragging) return;

      dragStateRef.current = { isDragging: false, lesionId: null, viewIdx: 0 };
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
      event.preventDefault();
    };

    // Double-click: Delete lesion
    const handleViewDoubleClick = (viewIdx: number) => (event: PointerEvent) => {
      if (readOnlyRef.current) return;
      const lesionId = detectLesionMarker(event, viewIdx);
      
      if (lesionId) {
        useLesionStore.getState().removeLesion(lesionId);
        updateAllMarkers();
        event.preventDefault();
      }
    };

    // Store handlers for cleanup
    const handlers: { idx: number; down: any; move: any; up: any; leave: any; dblclick: any }[] = [];
    
    // Add event listeners for all views after they're set up
    for (let i = 0; i < views.length; i++) {
      const view = views[i];
      const downHandler = handleViewClick(i);
      const moveHandler = handleViewMove(i);
      const upHandler = handleViewUp(i);
      const dblclickHandler = handleViewDoubleClick(i);
      
      view.element.addEventListener('pointerdown', downHandler);
      view.element.addEventListener('pointermove', moveHandler);
      view.element.addEventListener('pointerup', upHandler);
      view.element.addEventListener('pointerleave', upHandler);
      view.element.addEventListener('dblclick', dblclickHandler);
      
      handlers.push({ idx: i, down: downHandler, move: moveHandler, up: upHandler, leave: upHandler, dblclick: dblclickHandler });
    }

    // === ANIMATION LOOP ===
    function animate() {
      if (!isMounted) return;
      
      animationFrameId = requestAnimationFrame(animate);

      views.forEach(view => {
        const rect = view.element.getBoundingClientRect();
        
        if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
            rect.right < 0 || rect.left > renderer.domElement.clientWidth) {
            return;
        }

        const canvasRect = renderer.domElement.getBoundingClientRect();
        
        const left = rect.left - canvasRect.left;
        const bottom = canvasRect.bottom - rect.bottom;
        const width = rect.width;
        const height = rect.height;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        view.camera.aspect = width / height;
        if (view.camera.isOrthographicCamera) {
            const frustumSize = 8;
            const aspect = width / height;
            view.camera.left = -frustumSize * aspect / 2;
            view.camera.right = frustumSize * aspect / 2;
            view.camera.top = frustumSize / 2;
            view.camera.bottom = -frustumSize / 2;
        }
        view.camera.updateProjectionMatrix();

        renderer.render(scene, view.camera);
      });
    }
    
    animate();

    const handleResize = () => {
       if (!canvas || !canvas.parentElement) return;
       const parent = canvas.parentElement;
       if(parent) {
           const width = parent.clientWidth;
           const height = parent.clientHeight;
           renderer.setSize(width, height, false);
       }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      isMounted = false;
      if (loadTimeout) clearTimeout(loadTimeout);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      
      handlers.forEach(({ idx, down, move, up, leave, dblclick }) => {
        const view = views[idx];
        if (view && view.element) {
          view.element.removeEventListener('pointerdown', down);
          view.element.removeEventListener('pointermove', move);
          view.element.removeEventListener('pointerup', up);
          view.element.removeEventListener('pointerleave', leave);
          view.element.removeEventListener('dblclick', dblclick);
        }
      });
      
      renderer.dispose();
    };

  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />
      
      {loadingState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-50" data-testid="loading-overlay">
          <div className="relative w-16 h-16 mb-4">
            <svg className="animate-spin w-full h-full" viewBox="0 0 50 50">
              <circle 
                cx="25" cy="25" r="20" 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${loadingProgress * 1.26}, 126`}
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs text-white/80 font-mono">
              {loadingProgress}%
            </span>
          </div>
          <p className="text-white/70 text-sm" data-testid="loading-text">Carregando modelo 3D...</p>
        </div>
      )}
      
      {loadingState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-50" data-testid="error-overlay">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-white/70 text-sm text-center px-4" data-testid="error-text">
            {errorMessage || 'Erro ao carregar o modelo 3D'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
            data-testid="retry-button"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      {loadingState === 'fallback' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-mono z-50" data-testid="fallback-notice">
          Modo simplificado (modelo não carregou)
        </div>
      )}
      
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] p-[2px] pointer-events-auto z-20">
        <div ref={viewMainRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden group">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-pink-400 select-none z-10 backdrop-blur-sm">
             3D PERSPECTIVE
           </div>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>

        <div ref={viewSagittalRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden group">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-blue-400 select-none z-10 backdrop-blur-sm">
             SAGITTAL (SIDE)
           </div>
           <button
             onClick={(e) => { e.stopPropagation(); captureViewScreenshot(1, 'sagittal'); }}
             className="absolute top-2 right-2 w-7 h-7 bg-blue-500/80 hover:bg-blue-500 rounded flex items-center justify-center z-10 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto"
             title="Capturar Sagittal"
             data-testid="button-capture-sagittal"
           >
             <Camera className="w-4 h-4 text-white" />
           </button>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>

        <div ref={viewCoronalRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden group">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-green-400 select-none z-10 backdrop-blur-sm">
             CORONAL (FRONT)
           </div>
           <button
             onClick={(e) => { e.stopPropagation(); captureViewScreenshot(2, 'coronal'); }}
             className="absolute top-2 right-2 w-7 h-7 bg-green-500/80 hover:bg-green-500 rounded flex items-center justify-center z-10 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto"
             title="Capturar Coronal"
             data-testid="button-capture-coronal"
           >
             <Camera className="w-4 h-4 text-white" />
           </button>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>

        <div ref={viewPosteriorRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden group">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-yellow-400 select-none z-10 backdrop-blur-sm">
             POSTERIOR (BACK)
           </div>
           <button
             onClick={(e) => { e.stopPropagation(); captureViewScreenshot(3, 'posterior'); }}
             className="absolute top-2 right-2 w-7 h-7 bg-yellow-500/80 hover:bg-yellow-500 rounded flex items-center justify-center z-10 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto"
             title="Capturar Posterior"
             data-testid="button-capture-posterior"
           >
             <Camera className="w-4 h-4 text-white" />
           </button>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>
      </div>
    </div>
  );
});

Uterus3D.displayName = "Uterus3D";
