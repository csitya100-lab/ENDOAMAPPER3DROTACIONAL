import { Lesion } from './lesionStore';

const COLORS: Record<string, number> = {
  superficial: 0xef4444,
  deep: 0x3b82f6
};

export async function export3DModelAsHtml(lesions: Lesion[], modelUrl: string = '/model.glb'): Promise<void> {
  const modelResponse = await fetch(modelUrl);
  
  if (!modelResponse.ok) {
    throw new Error(`Erro ao carregar modelo 3D: ${modelResponse.status} ${modelResponse.statusText}`);
  }
  const modelBlob = await modelResponse.blob();
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>EndoMapper - Visualizador 3D</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
      min-height: 100vh;
      overflow: hidden;
      touch-action: none;
    }
    #container { width: 100vw; height: 100vh; position: relative; }
    #canvas { width: 100%; height: 100%; display: block; }
    #header {
      position: absolute; top: 0; left: 0; right: 0; padding: 12px 16px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      display: flex; align-items: center; justify-content: space-between; z-index: 10;
    }
    #logo { display: flex; align-items: center; gap: 10px; }
    #logo-icon {
      width: 36px; height: 36px; border-radius: 8px;
      background: linear-gradient(135deg, #ec4899, #e11d48);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 12px;
    }
    #logo-text { color: white; font-size: 18px; font-weight: 700; }
    #logo-text span { color: #f43f5e; }
    #info { color: rgba(255,255,255,0.8); font-size: 12px; text-align: right; }
    #info strong { color: white; }
    #controls-hint {
      position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.8);
      padding: 10px 20px; border-radius: 8px; font-size: 11px; z-index: 10;
      backdrop-filter: blur(8px); white-space: nowrap;
    }
    #legend {
      position: absolute; bottom: 16px; right: 16px;
      background: rgba(0,0,0,0.6); padding: 12px; border-radius: 10px; z-index: 10;
      backdrop-filter: blur(8px);
    }
    #legend h4 { color: white; font-size: 10px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
    .legend-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.8); font-size: 11px; margin-bottom: 4px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .dot-superficial { background: #ef4444; }
    .dot-deep { background: #3b82f6; }
    #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 16px; z-index: 20; text-align: center; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.3); border-top-color: #f43f5e; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 600px) {
      #controls-hint { display: none; }
      #header { padding: 8px 12px; }
      #logo-icon { width: 30px; height: 30px; font-size: 10px; }
      #logo-text { font-size: 14px; }
      #info { font-size: 10px; }
    }
  </style>
  <script async src="https://unpkg.com/es-module-shims@1.6.3/dist/es-module-shims.js"><\/script>
  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
  <\/script>
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
    <div id="controls-hint">Arraste para rotacionar • Pinça para zoom</div>
    <div id="legend">
      <h4>Legenda</h4>
      <div class="legend-item"><div class="legend-dot dot-superficial"></div> Superficial</div>
      <div class="legend-item"><div class="legend-dot dot-deep"></div> Profunda</div>
    </div>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    const LESIONS = ${lesionsJson};
    const MODEL_DATA = "${modelBase64}";

    document.getElementById('lesion-count').textContent = LESIONS.length;

    const canvas = document.getElementById('canvas');
    const loading = document.getElementById('loading');

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 2 : 3);

    const renderer = new THREE.WebGLRenderer({ 
      canvas, antialias: !isMobile, alpha: true,
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 2, 4);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    scene.add(new THREE.AmbientLight(0xFFF5E1, 0.8));
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    dirLight.position.set(8, 8, 5);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xB0E0E6, 0.3);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    const loader = new GLTFLoader();
    
    try {
      const base64Parts = MODEL_DATA.split(',');
      const byteString = atob(base64Parts[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      loader.parse(ab, '', (gltf) => {
        const model = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim;
        model.scale.setScalar(scale);

        model.traverse((child) => {
          if (child.isMesh) {
            let originalColor = new THREE.Color(0xffffff);
            let mat = child.material;
            if (Array.isArray(mat)) mat = mat[0];
            if (mat && mat.color) originalColor = mat.color.clone();
            
            const r = originalColor.r, g = originalColor.g, b = originalColor.b;
            let newColor = new THREE.Color(0xDD8A96);
            
            if (r > 0.8 && g > 0.8 && b < 0.4) newColor = new THREE.Color(0xFFD700);
            else if (r < 0.4 && g > 0.7 && b > 0.8) newColor = new THREE.Color(0x87CEEB);
            else if (r > 0.7 && g > 0.4 && b > 0.3 && r - g > 0.2) newColor = new THREE.Color(0xD4956F);
            
            child.material = new THREE.MeshStandardMaterial({
              color: newColor, roughness: 0.5, metalness: 0.1,
              transparent: true, opacity: 0.85, side: THREE.DoubleSide
            });
          }
        });

        scene.add(model);

        LESIONS.forEach((lesion) => {
          let geometry;
          switch (lesion.markerType) {
            case 'square':
              geometry = new THREE.BoxGeometry(lesion.size * 1.5, lesion.size * 1.5, lesion.size * 1.5);
              break;
            case 'triangle':
              geometry = new THREE.ConeGeometry(lesion.size, lesion.size * 2, 3);
              break;
            default:
              geometry = new THREE.SphereGeometry(lesion.size, 16, 16);
          }
          const material = new THREE.MeshStandardMaterial({
            color: lesion.color, roughness: 0.3, metalness: 0.5,
            emissive: lesion.color, emissiveIntensity: 0.3
          });
          const marker = new THREE.Mesh(geometry, material);
          marker.position.set(lesion.position.x, lesion.position.y, lesion.position.z);
          scene.add(marker);
        });

        loading.style.display = 'none';
      }, (error) => {
        console.error('Erro ao carregar modelo:', error);
        loading.innerHTML = '<div style="color:#f43f5e">Erro ao carregar o modelo 3D</div>';
      });
    } catch (e) {
      console.error('Erro ao processar modelo:', e);
      loading.innerHTML = '<div style="color:#f43f5e">Erro ao processar o modelo 3D</div>';
    }

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
  <\/script>
</body>
</html>`;
}
