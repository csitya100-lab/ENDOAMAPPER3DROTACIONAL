import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type Severity = 'superficial' | 'moderate' | 'deep';

interface Lesion {
  id: string;
  position: { x: number; y: number; z: number };
  severity: Severity;
}

interface Uterus3DProps {
  severity: Severity;
  onLesionCountChange: (count: number) => void;
  onLesionsUpdate: (lesions: Lesion[]) => void;
}

export interface Uterus3DRef {
  addTestLesion: () => void;
  clearLesions: () => void;
}

const COLORS = {
  superficial: 0xef4444, // Red
  moderate: 0xf97316,   // Orange
  deep: 0x3b82f6        // Blue
};

export const Uterus3D = forwardRef<Uterus3DRef, Uterus3DProps>(({ severity, onLesionCountChange, onLesionsUpdate }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewMainRef = useRef<HTMLDivElement>(null);
  const viewSagittalRef = useRef<HTMLDivElement>(null);
  const viewCoronalRef = useRef<HTMLDivElement>(null);
  const viewPosteriorRef = useRef<HTMLDivElement>(null);
  
  // Global lesion storage with 3D positions
  const lesionsRef = useRef<Lesion[]>([]);
  const currentSeverityRef = useRef(severity);
  const viewsRef = useRef<any[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const markerGroupsRef = useRef<{ [key: number]: THREE.Group }>({});
  const sceneRef = useRef<THREE.Scene | null>(null);
  const anatomyGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    currentSeverityRef.current = severity;
  }, [severity]);

  useImperativeHandle(ref, () => ({
    addTestLesion: () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.5;
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.sin(phi) * Math.sin(theta));
      const z = r * Math.cos(phi);
      
      createLesionInStorage({ x, y, z }, currentSeverityRef.current);
    },
    clearLesions: () => {
      lesionsRef.current = [];
      updateAllMarkers();
      updateStatus();
    }
  }));

  const createLesionInStorage = (position: { x: number; y: number; z: number }, sev: Severity) => {
    const lesion: Lesion = {
      id: `lesion-${Date.now()}-${Math.random()}`,
      position,
      severity: sev
    };
    lesionsRef.current.push(lesion);
    updateAllMarkers();
    updateStatus();
  };

  const updateStatus = () => {
    onLesionCountChange(lesionsRef.current.length);
    onLesionsUpdate([...lesionsRef.current]);
  };

  const updateAllMarkers = () => {
    if (!sceneRef.current) return;
    
    // Clear all marker groups
    Object.values(markerGroupsRef.current).forEach(group => {
      while(group.children.length > 0) {
        group.remove(group.children[0]);
      }
    });

    // Recreate all markers for each view
    lesionsRef.current.forEach(lesion => {
      viewsRef.current.forEach((view, viewIdx) => {
        createMarkerForView(lesion, viewIdx, view);
      });
    });
  };

  const createMarkerForView = (lesion: Lesion, viewIdx: number, view: any) => {
    if (!markerGroupsRef.current[viewIdx]) {
      markerGroupsRef.current[viewIdx] = new THREE.Group();
      sceneRef.current?.add(markerGroupsRef.current[viewIdx]);
    }

    const markerGroup = markerGroupsRef.current[viewIdx];
    
    // Create a small sphere marker
    const markerGeometry = new THREE.SphereGeometry(0.18, 12, 12);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: COLORS[lesion.severity],
      roughness: 0.2,
      metalness: 0.6,
      emissive: COLORS[lesion.severity],
      emissiveIntensity: 0.4
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(lesion.position.x, lesion.position.y, lesion.position.z);
    markerGroup.add(marker);

    // Add a glow ring for orthogonal views
    if (viewIdx > 0) {
      const ringGeometry = new THREE.BufferGeometry();
      const ringPositions = [];
      const ringSegments = 32;
      for (let i = 0; i <= ringSegments; i++) {
        const angle = (i / ringSegments) * Math.PI * 2;
        ringPositions.push(
          lesion.position.x + Math.cos(angle) * 0.25,
          lesion.position.y + Math.sin(angle) * 0.25,
          lesion.position.z
        );
      }
      ringGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ringPositions), 3));
      const ringMaterial = new THREE.LineBasicMaterial({
        color: COLORS[lesion.severity],
        linewidth: 2,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Line(ringGeometry, ringMaterial);
      markerGroup.add(ring);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !viewMainRef.current || !viewSagittalRef.current || !viewCoronalRef.current || !viewPosteriorRef.current) return;

    let animationFrameId: number;
    let isMounted = true;

    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setScissorTest(true);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;
    
    // Ambient Light: Warm white (~3500K), intensity 0.7
    const ambientLight = new THREE.AmbientLight(0xFFF5E1, 0.7);
    scene.add(ambientLight);

    // Main Directional Light: Lateral position for clinical realism
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
    dirLight.position.set(8, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.bias = 0.0001;
    dirLight.shadow.radius = 4;
    scene.add(dirLight);

    // Fill Light: Soft light from opposite side
    const fillLight = new THREE.DirectionalLight(0xD3D3D3, 0.4);
    fillLight.position.set(-8, 3, 5);
    scene.add(fillLight);

    const anatomyGroup = new THREE.Group();
    anatomyGroupRef.current = anatomyGroup;
    scene.add(anatomyGroup);

    // Load GLB Model
    const loader = new GLTFLoader();
    loader.load('/model.glb', (gltf) => {
        const model = gltf.scene;
        
        // Auto-center and scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Center the model
        model.position.x += (model.position.x - center.x);
        model.position.y += (model.position.y - center.y);
        model.position.z += (model.position.z - center.z);
        
        // Scale to fit approx size 4 units
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim;
        model.scale.set(scale, scale, scale);

        // Identify organ by original color and apply appropriate material
        model.traverse((child: any) => {
            if ((child as THREE.Mesh).isMesh && child !== model) {
                const mesh = child as THREE.Mesh;
                
                // Get original color to identify organ
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
                
                // Identify organ type and set color + material properties
                let newColor = new THREE.Color(0xDD8A96); // Default: Uterus
                let roughness = 0.45;
                let metalness = 0.05;
                let clearcoat = 0.1;
                let envMapIntensity = 0.5;
                
                // Yellow = Ovaries (most vibrant)
                if (r > 0.8 && g > 0.8 && b < 0.4) {
                    newColor = new THREE.Color(0xFFD700);
                }
                // Blue = Bladder
                else if (r < 0.4 && g > 0.7 && b > 0.8) {
                    newColor = new THREE.Color(0x87CEEB);
                }
                // Brown/Red = Rectum (darker, more saturated)
                else if (r > 0.7 && g > 0.4 && b > 0.3 && r - g > 0.2) {
                    newColor = new THREE.Color(0xD4956F);
                }
                // Tan/Beige = Cervix (intermediate)
                else if (r > 0.6 && g > 0.4 && b > 0.3 && r - g < 0.3) {
                    newColor = new THREE.Color(0xC49080);
                    roughness = 0.50;
                    clearcoat = 0.08;
                }
                // Light pink/white = Ligaments, Vagina (less saturated)
                else if (r > 0.8 && g < 0.7 && b < 0.7 && r - g < 0.3) {
                    newColor = new THREE.Color(0xE8B4B8); // Lighter pink
                    roughness = 0.55;
                    metalness = 0.02;
                    clearcoat = 0.05;
                    envMapIntensity = 0.3;
                }
                
                // Apply MeshPhysicalMaterial with optimized properties
                const newMaterial = new THREE.MeshPhysicalMaterial({
                    color: newColor,
                    roughness: roughness,
                    metalness: metalness,
                    clearcoat: clearcoat,
                    envMapIntensity: envMapIntensity,
                    side: THREE.DoubleSide
                });
                
                mesh.material = newMaterial;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
            }
        });
        
        anatomyGroup.add(model);
    }, undefined, (error) => {
        console.error('An error happened loading the model:', error);
    });

    // Initialize marker groups
    for (let i = 0; i < 4; i++) {
      markerGroupsRef.current[i] = new THREE.Group();
      scene.add(markerGroupsRef.current[i]);
    }

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
        controls.enablePan = true;
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

    // Multiple pointerdown handlers for each view
    const handleViewClick = (viewIdx: number) => (event: PointerEvent) => {
      const worldPos = convertScreenToWorldCoords(event, viewIdx);
      if (worldPos) {
        createLesionInStorage(
          { x: worldPos.x, y: worldPos.y, z: worldPos.z },
          currentSeverityRef.current
        );
      }
    };

    viewMainRef.current?.addEventListener('pointerdown', handleViewClick(0));
    viewSagittalRef.current?.addEventListener('pointerdown', handleViewClick(1));
    viewCoronalRef.current?.addEventListener('pointerdown', handleViewClick(2));
    viewPosteriorRef.current?.addEventListener('pointerdown', handleViewClick(3));

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
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      viewMainRef.current?.removeEventListener('pointerdown', handleViewClick(0));
      viewSagittalRef.current?.removeEventListener('pointerdown', handleViewClick(1));
      viewCoronalRef.current?.removeEventListener('pointerdown', handleViewClick(2));
      viewPosteriorRef.current?.removeEventListener('pointerdown', handleViewClick(3));
      renderer.dispose();
    };

  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />
      
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] p-[2px] pointer-events-none">
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
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>

        <div ref={viewCoronalRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden group">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-green-400 select-none z-10 backdrop-blur-sm">
             CORONAL (FRONT)
           </div>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>

        <div ref={viewPosteriorRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden group">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-yellow-400 select-none z-10 backdrop-blur-sm">
             POSTERIOR (BACK)
           </div>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>
      </div>
    </div>
  );
});

Uterus3D.displayName = "Uterus3D";
