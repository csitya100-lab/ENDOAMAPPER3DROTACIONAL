import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

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
      const y = (r * Math.sin(phi) * Math.sin(theta)) + 0.5;
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
    renderer.setScissorTest(true);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xaaaaff, 0.4);
    backLight.position.set(-5, 2, -10);
    scene.add(backLight);

    const anatomyGroup = new THREE.Group();
    anatomyGroupRef.current = anatomyGroup;
    
    const organMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xe8a0a0, 
      roughness: 0.3, 
      metalness: 0.1, 
      clearcoat: 0.3 
    });
    const cervixMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xd48888, 
      roughness: 0.4, 
      metalness: 0.0 
    });
    const ovaryMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xd4c5a0, 
      roughness: 0.5, 
      metalness: 0.0 
    });

    const bodyGeo = new THREE.IcosahedronGeometry(1.5, 2);
    const uterusBody = new THREE.Mesh(bodyGeo, organMaterial);
    uterusBody.position.set(0, 0.5, 0);
    uterusBody.scale.set(1, 1.1, 0.9); 
    uterusBody.castShadow = true;
    uterusBody.receiveShadow = true;
    anatomyGroup.add(uterusBody);

    const cervixGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 32);
    const cervix = new THREE.Mesh(cervixGeo, cervixMaterial);
    cervix.position.set(0, -1.2, 0);
    cervix.castShadow = true;
    cervix.receiveShadow = true;
    anatomyGroup.add(cervix);

    const vaginaGeo = new THREE.CylinderGeometry(0.9, 0.8, 1.2, 32, 1, true);
    const vagina = new THREE.Mesh(vaginaGeo, cervixMaterial);
    vagina.position.set(0, -2.5, 0);
    vagina.material = cervixMaterial.clone();
    vagina.material.side = THREE.DoubleSide;
    vagina.receiveShadow = true;
    anatomyGroup.add(vagina);

    function createTube(isRight: boolean) {
        const xMult = isRight ? 1 : -1;
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(1.2 * xMult, 1.5, 0),
            new THREE.Vector3(2.0 * xMult, 1.8, 0.2),
            new THREE.Vector3(2.8 * xMult, 1.2, 0.5),
            new THREE.Vector3(3.0 * xMult, 0.5, 0),
        ]);
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.15, 8, false), organMaterial);
        tube.castShadow = true;
        tube.receiveShadow = true;
        return tube;
    }
    anatomyGroup.add(createTube(true));
    anatomyGroup.add(createTube(false));

    const ovaryGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const rightOvary = new THREE.Mesh(ovaryGeo, ovaryMaterial);
    rightOvary.position.set(3.0, 0.2, 0);
    rightOvary.castShadow = true;
    anatomyGroup.add(rightOvary);

    const leftOvary = new THREE.Mesh(ovaryGeo, ovaryMaterial);
    leftOvary.position.set(-3.0, 0.2, 0);
    leftOvary.castShadow = true;
    anatomyGroup.add(leftOvary);

    // === ADDITIONAL PELVIC STRUCTURES ===

    // 6. BLADDER
    const bladderMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xf0e8d8, 
      roughness: 0.4, 
      metalness: 0.0 
    });
    const bladderGeo = new THREE.SphereGeometry(0.6, 24, 24);
    const bladder = new THREE.Mesh(bladderGeo, bladderMaterial);
    bladder.position.set(0, 2.0, -0.5);
    bladder.scale.set(1, 1.2, 0.9);
    bladder.castShadow = true;
    bladder.receiveShadow = true;
    anatomyGroup.add(bladder);

    // 7. RECTUM
    const rectumMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xb8a090, 
      roughness: 0.4, 
      metalness: 0.0 
    });
    const rectumCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.5, 1.5),
      new THREE.Vector3(0.1, -1.2, 1.8),
      new THREE.Vector3(0, -2.0, 1.5),
      new THREE.Vector3(-0.1, -3.0, 1.0),
    ]);
    const rectum = new THREE.Mesh(new THREE.TubeGeometry(rectumCurve, 20, 0.2, 8, false), rectumMaterial);
    rectum.castShadow = true;
    rectum.receiveShadow = true;
    anatomyGroup.add(rectum);

    // 8. SIGMOID
    const sigmoidMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xc4a088, 
      roughness: 0.4, 
      metalness: 0.0 
    });
    const sigmoidCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -3.0, 1.0),
      new THREE.Vector3(0.3, -2.5, 0.8),
      new THREE.Vector3(0.2, -1.8, 0.5),
      new THREE.Vector3(0, -0.8, 0.2),
    ]);
    const sigmoid = new THREE.Mesh(new THREE.TubeGeometry(sigmoidCurve, 20, 0.18, 8, false), sigmoidMaterial);
    sigmoid.castShadow = true;
    sigmoid.receiveShadow = true;
    anatomyGroup.add(sigmoid);

    // 9. ROUND LIGAMENTS (2x)
    const ligamentMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xd48888, 
      roughness: 0.3, 
      metalness: 0.0 
    });
    function createRoundLigament(isRight: boolean) {
      const xMult = isRight ? 1 : -1;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.8 * xMult, 0.8, -0.2),
        new THREE.Vector3(1.5 * xMult, 1.2, 0.1),
        new THREE.Vector3(2.2 * xMult, 1.0, 0.3),
      ]);
      const lig = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.08, 6, false), ligamentMaterial);
      lig.castShadow = true;
      return lig;
    }
    anatomyGroup.add(createRoundLigament(true));
    anatomyGroup.add(createRoundLigament(false));

    // 10. UTEROSACRAL LIGAMENTS (2x)
    const uterosacrMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xc87878, 
      roughness: 0.3, 
      metalness: 0.0 
    });
    function createUterosacrLigament(isRight: boolean) {
      const xMult = isRight ? 1 : -1;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.3 * xMult, -1.2, 0.1),
        new THREE.Vector3(0.8 * xMult, -1.8, 0.5),
        new THREE.Vector3(0.5 * xMult, -2.5, 1.2),
      ]);
      const lig = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.1, 6, false), uterosacrMaterial);
      lig.castShadow = true;
      return lig;
    }
    anatomyGroup.add(createUterosacrLigament(true));
    anatomyGroup.add(createUterosacrLigament(false));

    // 11. BROAD LIGAMENTS (2x) - Lateral planes
    const broadLigMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xe0c0c0, 
      roughness: 0.5, 
      metalness: 0.0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    function createBroadLigament(isRight: boolean) {
      const xPos = isRight ? 2.0 : -2.0;
      const geometry = new THREE.PlaneGeometry(2.5, 2.0);
      const lig = new THREE.Mesh(geometry, broadLigMaterial.clone());
      lig.position.set(xPos, 0.2, 0.3);
      lig.rotation.z = isRight ? Math.PI / 8 : -Math.PI / 8;
      lig.castShadow = true;
      lig.receiveShadow = true;
      return lig;
    }
    anatomyGroup.add(createBroadLigament(true));
    anatomyGroup.add(createBroadLigament(false));

    // 12. PELVIC BONES (simplified) - Anterior pubis
    const boneMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0xd4a574, 
      roughness: 0.6, 
      metalness: 0.1 
    });
    const pubisGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
    const pubis = new THREE.Mesh(pubisGeo, boneMaterial);
    pubis.position.set(0, -2.2, -1.5);
    pubis.castShadow = true;
    pubis.receiveShadow = true;
    anatomyGroup.add(pubis);

    // Iliac bones (sides)
    const iliacGeo = new THREE.BoxGeometry(0.6, 1.0, 0.5);
    const iliacMaterial = boneMaterial.clone();
    const rightIliac = new THREE.Mesh(iliacGeo, iliacMaterial);
    rightIliac.position.set(3.5, 1.5, 0.5);
    rightIliac.castShadow = true;
    rightIliac.receiveShadow = true;
    anatomyGroup.add(rightIliac);

    const leftIliac = new THREE.Mesh(iliacGeo, iliacMaterial.clone());
    leftIliac.position.set(-3.5, 1.5, 0.5);
    leftIliac.castShadow = true;
    leftIliac.receiveShadow = true;
    anatomyGroup.add(leftIliac);

    scene.add(anatomyGroup);

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

      if (view.viewType === 'orthographic') {
        // For orthographic views, use the raycaster direction with a point on the camera plane
        const direction = raycaster.ray.direction;
        
        // Create a plane at Z=0 for Sagittal, Y=0 for Coronal, Z=0 for Posterior
        let plane: THREE.Plane;
        if (viewIdx === 1) { // Sagittal (X=10, looking at YZ plane)
          plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        } else if (viewIdx === 2) { // Coronal (Z=10, looking at XY plane)
          plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        } else { // Posterior (Z=-10, looking at XY plane)
          plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
        }

        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);
        return intersection;
      } else {
        // For perspective view, cast a ray and hit the anatomy
        const intersects = raycaster.intersectObjects(anatomyGroup.children, true);
        if (intersects.length > 0) {
          return intersects[0].point;
        }
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
