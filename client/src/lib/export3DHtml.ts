import { Lesion } from './lesionStore';

const COLORS: Record<string, number> = {
  superficial: 0xef4444,
  moderate: 0xf97316,
  deep: 0x3b82f6
};

export async function export3DModelAsHtml(lesions: Lesion[], modelUrl: string = '/model.glb'): Promise<void> {
  const response = await fetch(modelUrl);
  if (!response.ok) {
    throw new Error(`Erro ao carregar modelo 3D: ${response.status} ${response.statusText}`);
  }
  const modelBlob = await response.blob();
  const modelBase64 = await blobToBase64(modelBlob);

  const lesionsJson = JSON.stringify(lesions.map(l => ({
    position: l.position,
    severity: l.severity,
    size: l.size ?? 0.18,
    color: l.color ? parseInt(l.color.replace('#', ''), 16) : COLORS[l.severity],
    markerType: l.markerType ?? 'circle'
  })));

  const htmlContent = generateStandaloneHtml(modelBase64, lesionsJson);
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `endomapper-3d-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function generateStandaloneHtml(modelBase64: string, lesionsJson: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EndoMapper - Visualizador 3D</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100vh;
      overflow: hidden;
    }
    #container {
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    #canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    #header {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px 24px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }
    #logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    #logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, #ec4899, #e11d48);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    #logo-text {
      color: white;
      font-size: 20px;
      font-weight: 700;
    }
    #logo-text span { color: #f43f5e; }
    #info {
      color: rgba(255,255,255,0.8);
      font-size: 14px;
      text-align: right;
    }
    #info strong { color: white; }
    #controls-hint {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.6);
      color: rgba(255,255,255,0.8);
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 13px;
      z-index: 10;
      backdrop-filter: blur(8px);
    }
    #legend {
      position: absolute;
      bottom: 24px;
      right: 24px;
      background: rgba(0,0,0,0.6);
      padding: 16px;
      border-radius: 12px;
      z-index: 10;
      backdrop-filter: blur(8px);
    }
    #legend h4 {
      color: white;
      font-size: 12px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: rgba(255,255,255,0.8);
      font-size: 13px;
      margin-bottom: 6px;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot-superficial { background: #ef4444; }
    .dot-moderate { background: #f97316; }
    .dot-deep { background: #3b82f6; }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 18px;
      z-index: 20;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: #f43f5e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="container">
    <div id="loading">
      <div class="spinner"></div>
      <div>Carregando modelo 3D...</div>
    </div>
    <canvas id="canvas"></canvas>
    <div id="header">
      <div id="logo">
        <div id="logo-icon">3D</div>
        <div id="logo-text">Endo<span>Mapper</span></div>
      </div>
      <div id="info">
        <div>Mapeamento de Endometriose</div>
        <div><strong id="lesion-count">0</strong> lesões mapeadas</div>
      </div>
    </div>
    <div id="controls-hint">
      🖱️ Arraste para rotacionar • Scroll para zoom • Shift+Arraste para mover
    </div>
    <div id="legend">
      <h4>Legenda</h4>
      <div class="legend-item"><div class="legend-dot dot-superficial"></div> Superficial</div>
      <div class="legend-item"><div class="legend-dot dot-moderate"></div> Moderada</div>
      <div class="legend-item"><div class="legend-dot dot-deep"></div> Profunda</div>
    </div>
  </div>

  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/"
    }
  }
  </script>
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    const LESIONS = ${lesionsJson};
    const MODEL_DATA = "${modelBase64}";

    document.getElementById('lesion-count').textContent = LESIONS.length;

    const canvas = document.getElementById('canvas');
    const container = document.getElementById('container');
    const loading = document.getElementById('loading');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 2, 4);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.minDistance = 2;
    controls.maxDistance = 15;

    const ambientLight = new THREE.AmbientLight(0xFFF5E1, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
    dirLight.position.set(8, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xB0E0E6, 0.4);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    const fillLight = new THREE.PointLight(0xFFE4E1, 0.5, 12);
    fillLight.position.set(3, 0, 3);
    scene.add(fillLight);

    const loader = new GLTFLoader();
    
    const byteString = atob(MODEL_DATA.split(',')[1]);
    const mimeString = MODEL_DATA.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const modelBlob = new Blob([ab], { type: mimeString });
    const modelUrl = URL.createObjectURL(modelBlob);

    loader.load(modelUrl, (gltf) => {
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

      model.traverse((child) => {
        if (child.isMesh) {
          const mesh = child;
          let originalColor = new THREE.Color(0xffffff);
          let originalMat = mesh.material;
          if (Array.isArray(originalMat)) originalMat = originalMat[0];
          if (originalMat.color) originalColor = originalMat.color.clone();
          
          const r = originalColor.r, g = originalColor.g, b = originalColor.b;
          let newColor = new THREE.Color(0xDD8A96);
          
          if (r > 0.8 && g > 0.8 && b < 0.4) newColor = new THREE.Color(0xFFD700);
          else if (r < 0.4 && g > 0.7 && b > 0.8) newColor = new THREE.Color(0x87CEEB);
          else if (r > 0.7 && g > 0.4 && b > 0.3 && r - g > 0.2) newColor = new THREE.Color(0xD4956F);
          
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: newColor,
            roughness: 0.45,
            metalness: 0.05,
            clearcoat: 0.1,
            envMapIntensity: 0.5,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
          });
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });

      scene.add(model);

      LESIONS.forEach(lesion => {
        let geometry;
        switch (lesion.markerType) {
          case 'square':
            geometry = new THREE.BoxGeometry(lesion.size * 1.5, lesion.size * 1.5, lesion.size * 1.5);
            break;
          case 'triangle':
            geometry = new THREE.ConeGeometry(lesion.size, lesion.size * 2, 3);
            break;
          case 'circle':
          default:
            geometry = new THREE.SphereGeometry(lesion.size, 12, 12);
            break;
        }
        const material = new THREE.MeshStandardMaterial({
          color: lesion.color,
          roughness: 0.2,
          metalness: 0.6,
          emissive: lesion.color,
          emissiveIntensity: 0.4
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(lesion.position.x, lesion.position.y, lesion.position.z);
        scene.add(marker);
      });

      loading.style.display = 'none';
      URL.revokeObjectURL(modelUrl);
    }, undefined, (error) => {
      console.error('Erro ao carregar modelo:', error);
      loading.innerHTML = '<div style="color:#f43f5e">Erro ao carregar o modelo 3D</div>';
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>`;
}
