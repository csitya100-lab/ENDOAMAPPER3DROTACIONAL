// Página de visualização 3D para compartilhamento com médicos
// Rota: /3d/:caseId
// Foco: simplicidade, compatibilidade iOS Safari, UX para médicos

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'wouter';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { loadCaseFromDb, isSupabaseConfigured, CaseData } from '@/lib/caseDb';
import { Lesion, Severity } from '@/lib/lesionStore';
import { Download, RotateCcw, ZoomIn } from 'lucide-react';

const SEVERITY_COLORS: Record<Severity, number> = {
  superficial: 0xef4444,
  deep: 0x3b82f6
};

export default function Model3DViewer() {
  const { caseId } = useParams<{ caseId: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [lesions, setLesions] = useState<Lesion[]>([]);
  const lesionMarkersRef = useRef<THREE.Object3D[]>([]);

  // Carregar dados do caso do Supabase
  useEffect(() => {
    if (!caseId || caseId === 'demo') {
      // Modo demo se não houver caseId ou se for 'demo'
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      console.warn('Supabase não configurado. Entrando em modo demonstração.');
      setLoading(false);
      return;
    }

    loadCaseFromDb(caseId)
      .then((data) => {
        if (data) {
          setCaseData(data);
          setLesions(data.lesions || []);
        } else {
          console.warn('Caso não encontrado no banco. Entrando em modo demonstração.');
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar caso do banco:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [caseId]);

  // Inicializar Three.js
  useEffect(() => {
    if (!containerRef.current || loading) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Renderer com antialiasing para melhor qualidade
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('Erro ao criar WebGLRenderer com antialias, tentando fallback...', e);
      try {
        renderer = new THREE.WebGLRenderer({ 
          antialias: false,
          alpha: true
        });
      } catch (e2) {
        console.error('Falha total ao criar WebGLRenderer:', e2);
        setError('Seu navegador ou dispositivo não suporta WebGL, que é necessário para visualizar o modelo 3D.');
        setLoading(false);
        return;
      }
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls - otimizados para touch
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    };
    controlsRef.current = controls;

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Carregar modelo GLB
    const loader = new GLTFLoader();
    loader.load(
      '/model.glb',
      (gltf) => {
        const model = gltf.scene;
        
        // Centralizar e escalar modelo
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        
        scene.add(model);

        // Adicionar marcadores de lesões
        addLesionMarkers(scene, lesions);
      },
      undefined,
      (err) => {
        console.error('Erro ao carregar modelo:', err);
      }
    );

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Responsividade
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [loading, lesions]);

  // Função para adicionar marcadores de lesões
  const addLesionMarkers = (scene: THREE.Scene, lesions: Lesion[]) => {
    // Remover marcadores anteriores
    lesionMarkersRef.current.forEach((marker) => {
      scene.remove(marker);
      if (marker instanceof THREE.Mesh) {
        marker.geometry.dispose();
        if (marker.material instanceof THREE.Material) {
          marker.material.dispose();
        }
      }
    });
    lesionMarkersRef.current = [];
    
    // Adicionar novos marcadores
    lesions.forEach((lesion) => {
      const color = SEVERITY_COLORS[lesion.severity] || 0xef4444;
      const geometry = new THREE.SphereGeometry(0.08, 16, 16);
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.1
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.position.set(lesion.position.x, lesion.position.y, lesion.position.z);
      scene.add(marker);
      lesionMarkersRef.current.push(marker);
    });
  };

  // Download do arquivo GLB
  const handleDownloadGLB = () => {
    const link = document.createElement('a');
    link.href = '/model.glb';
    link.download = `modelo-3d-${caseId || 'demo'}.glb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset da visualização
  const handleResetView = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0, 5);
      controlsRef.current.reset();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando modelo 3D...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" data-testid="model-3d-viewer">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold text-gray-800" data-testid="viewer-title">
            Modelo 3D {caseData?.patient_name ? `– ${caseData.patient_name}` : caseId ? `– Caso ${caseId}` : '– Demo'}
          </h1>
          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <RotateCcw className="w-4 h-4" />
            Arraste para girar
            <span className="mx-2">•</span>
            <ZoomIn className="w-4 h-4" />
            Use rolagem ou pinça para zoom
          </p>
        </div>
      </header>

      {/* 3D Viewer */}
      <main className="flex-1 relative">
        <div 
          ref={containerRef} 
          className="absolute inset-0"
          data-testid="3d-container"
        />
        
        {/* Botão reset no canto */}
        <button
          onClick={handleResetView}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-colors"
          title="Resetar visualização"
          data-testid="button-reset-view"
        >
          <RotateCcw className="w-5 h-5 text-gray-600" />
        </button>

        {/* Legenda de cores */}
        {lesions.length > 0 && (
          <div className="absolute bottom-20 left-4 bg-white/90 p-3 rounded-lg shadow-md text-sm" data-testid="legend">
            <p className="font-medium text-gray-700 mb-2">Lesões ({lesions.length})</p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="text-gray-600">Superficial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">Profunda</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer com download */}
      <footer className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex justify-center">
          <button
            onClick={handleDownloadGLB}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            data-testid="button-download-glb"
          >
            <Download className="w-4 h-4" />
            Opcional: baixar modelo 3D (.glb) para uso em outro software
          </button>
        </div>
      </footer>
    </div>
  );
}
