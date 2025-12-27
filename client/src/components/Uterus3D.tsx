import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type Severity = 'superficial' | 'moderate' | 'deep';

interface Uterus3DProps {
  severity: Severity;
  onLesionCountChange: (count: number) => void;
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

export const Uterus3D = forwardRef<Uterus3DRef, Uterus3DProps>(({ severity, onLesionCountChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewMainRef = useRef<HTMLDivElement>(null);
  const viewSagittalRef = useRef<HTMLDivElement>(null);
  const viewCoronalRef = useRef<HTMLDivElement>(null);
  const viewPosteriorRef = useRef<HTMLDivElement>(null);
  
  // Refs to hold Three.js objects so we can access them in methods/effects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const lesionGroupRef = useRef<THREE.Group | null>(null);
  const currentSeverityRef = useRef(severity);
  const viewsRef = useRef<any[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // Update ref when prop changes
  useEffect(() => {
    currentSeverityRef.current = severity;
  }, [severity]);

  useImperativeHandle(ref, () => ({
    addTestLesion: () => {
      if (!lesionGroupRef.current) return;
      
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 1.5; // Approx radius
      
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.sin(phi) * Math.sin(theta)) + 0.5; // +0.5 is uterus y offset
      const z = r * Math.cos(phi);
      
      createLesionMesh(new THREE.Vector3(x, y, z), currentSeverityRef.current);
    },
    clearLesions: () => {
      if (!lesionGroupRef.current) return;
      while(lesionGroupRef.current.children.length > 0){ 
        lesionGroupRef.current.remove(lesionGroupRef.current.children[0]); 
      }
      updateStatus();
    }
  }));

  const createLesionMesh = (position: THREE.Vector3, sev: Severity) => {
    if (!lesionGroupRef.current) return;
    
    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: COLORS[sev],
      roughness: 0.2,
      metalness: 0.5,
      emissive: COLORS[sev],
      emissiveIntensity: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    // Add some random scale variation
    const scale = 0.8 + Math.random() * 0.4;
    mesh.scale.set(scale, scale, scale);
    
    lesionGroupRef.current.add(mesh);
    updateStatus();
  };

  const updateStatus = () => {
    if (lesionGroupRef.current) {
      onLesionCountChange(lesionGroupRef.current.children.length);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || !viewMainRef.current || !viewSagittalRef.current || !viewCoronalRef.current || !viewPosteriorRef.current) return;

    let animationFrameId: number;
    let isMounted = true;

    // --- INITIALIZATION ---
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.setScissorTest(true); // Critical for multiple views
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // LIGHTS
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

    // ANATOMY GROUP
    const anatomyGroup = new THREE.Group();
    
    // Materials
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

    // 1. Uterus Body
    const bodyGeo = new THREE.IcosahedronGeometry(1.5, 2);
    const uterusBody = new THREE.Mesh(bodyGeo, organMaterial);
    uterusBody.position.set(0, 0.5, 0);
    uterusBody.scale.set(1, 1.1, 0.9); 
    uterusBody.castShadow = true;
    uterusBody.receiveShadow = true;
    anatomyGroup.add(uterusBody);

    // 2. Cervix
    const cervixGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.5, 32);
    const cervix = new THREE.Mesh(cervixGeo, cervixMaterial);
    cervix.position.set(0, -1.2, 0);
    cervix.castShadow = true;
    cervix.receiveShadow = true;
    anatomyGroup.add(cervix);

    // 3. Vagina
    const vaginaGeo = new THREE.CylinderGeometry(0.9, 0.8, 1.2, 32, 1, true);
    const vagina = new THREE.Mesh(vaginaGeo, cervixMaterial);
    vagina.position.set(0, -2.5, 0);
    vagina.material = cervixMaterial.clone();
    vagina.material.side = THREE.DoubleSide;
    vagina.receiveShadow = true;
    anatomyGroup.add(vagina);

    // 4. Tubes
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

    // 5. Ovaries
    const ovaryGeo = new THREE.SphereGeometry(0.6, 32, 32);
    const rightOvary = new THREE.Mesh(ovaryGeo, ovaryMaterial);
    rightOvary.position.set(3.0, 0.2, 0);
    rightOvary.castShadow = true;
    anatomyGroup.add(rightOvary);

    const leftOvary = new THREE.Mesh(ovaryGeo, ovaryMaterial);
    leftOvary.position.set(-3.0, 0.2, 0);
    leftOvary.castShadow = true;
    anatomyGroup.add(leftOvary);

    scene.add(anatomyGroup);

    // LESION GROUP
    const lesionGroup = new THREE.Group();
    scene.add(lesionGroup);
    lesionGroupRef.current = lesionGroup;

    // --- VIEW SETUP ---
    const views: any[] = [];
    viewsRef.current = views;

    // Helper to setup views
    function setupView(element: HTMLDivElement, cameraType: 'perspective' | 'orthographic', camPos: number[], upVec: number[], fov = 45) {
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
        controls.enableRotate = false; // 2D Views usually don't rotate freely
        controls.enableZoom = true;
        controls.enablePan = true;
      }

      camera.up.set(upVec[0], upVec[1], upVec[2]);
      camera.lookAt(0, 0, 0);
      controls.update();

      return { element, camera, controls };
    }

    views.push(setupView(viewMainRef.current, 'perspective', [5, 2, 6], [0, 1, 0]));
    views.push(setupView(viewSagittalRef.current, 'orthographic', [10, 0, 0], [0, 1, 0]));
    views.push(setupView(viewCoronalRef.current, 'orthographic', [0, 0, 10], [0, 1, 0]));
    views.push(setupView(viewPosteriorRef.current, 'orthographic', [0, 0, -10], [0, 1, 0]));

    // Enable rotation for Posterior view (Back view needs rotation? or just fixed back?)
    // The snippet says "POSTERIOR (BACK)" and likely wants it fixed.
    // However, let's keep it consistent with the snippet which likely disabled rotation for orthographic views.
    
    // Allow rotation on Main View
    views[0].controls.enableRotate = true;

    // --- RAYCASTER SETUP (Only for Main View) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    function onPointerDown(event: PointerEvent) {
        // Only handle clicks on the Main View
        if (event.target !== viewMainRef.current) return;
        
        // Prevent adding lesion if we are dragging (orbiting)
        // Simple check: minimal movement between down and up
        // For now, let's just use click.
        
        const rect = viewMainRef.current!.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, views[0].camera);

        const intersects = raycaster.intersectObjects(anatomyGroup.children, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            createLesionMesh(hit.point, currentSeverityRef.current);
        }
    }

    // Attach listener to Main View container
    if (viewMainRef.current) {
        viewMainRef.current.addEventListener('pointerdown', onPointerDown);
    }


    // --- ANIMATION LOOP ---
    function animate() {
      if (!isMounted) return;
      
      animationFrameId = requestAnimationFrame(animate);

      // Render each view
      views.forEach(view => {
        const rect = view.element.getBoundingClientRect();
        
        // Check if view is offscreen (optional optimization)
        if (rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
            rect.right < 0 || rect.left > renderer.domElement.clientWidth) {
            return;
        }

        // Set viewport relative to the canvas
        // The canvas is full screen fixed, but the 'views' are grid cells.
        // We need to map the element's position to the canvas coordinate system.
        // Since canvas is absolute 0,0 and matches window/container, we can use rect directly
        // IF the canvas matches the window size.
        // However, we are in a container.
        
        // Get canvas bounding rect to calculate relative position
        const canvasRect = renderer.domElement.getBoundingClientRect();
        
        const left = rect.left - canvasRect.left;
        const bottom = canvasRect.bottom - rect.bottom; // glViewport measures from bottom-left
        const width = rect.width;
        const height = rect.height;

        renderer.setViewport(left, bottom, width, height);
        renderer.setScissor(left, bottom, width, height);

        view.camera.aspect = width / height;
        if (view.camera.isOrthographicCamera) {
            // Update frustum for ortho
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

    // --- RESIZE HANDLER ---
    const handleResize = () => {
       if (!canvas || !canvas.parentElement) return;
       const parent = canvas.parentElement;
       if(parent) {
           const width = parent.clientWidth;
           const height = parent.clientHeight;
           renderer.setSize(width, height, false); // false = don't set style, we assume 100% css
       }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Init size

    // Cleanup
    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (viewMainRef.current) viewMainRef.current.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      // Dispose materials/geometries if needed
    };

  }, []); // Run once on mount

  return (
    <div className="relative w-full h-full bg-slate-950">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />
      
      {/* Grid Layout for Views */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-[2px] p-[2px] pointer-events-none">
        {/* Main Perspective View */}
        <div ref={viewMainRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden group">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-pink-400 select-none z-10 backdrop-blur-sm">
             3D PERSPECTIVE
           </div>
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest bg-black/40 px-2 py-1 rounded">CLICK TO ADD LESION</span>
           </div>
        </div>

        {/* Sagittal View */}
        <div ref={viewSagittalRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-blue-400 select-none z-10 backdrop-blur-sm">
             SAGITTAL (SIDE)
           </div>
        </div>

        {/* Coronal View */}
        <div ref={viewCoronalRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-green-400 select-none z-10 backdrop-blur-sm">
             CORONAL (FRONT)
           </div>
        </div>

        {/* Posterior View */}
        <div ref={viewPosteriorRef} className="relative border border-white/10 pointer-events-auto bg-transparent overflow-hidden">
           <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-xs font-mono text-yellow-400 select-none z-10 backdrop-blur-sm">
             POSTERIOR (BACK)
           </div>
        </div>
      </div>
    </div>
  );
});

Uterus3D.displayName = "Uterus3D";
