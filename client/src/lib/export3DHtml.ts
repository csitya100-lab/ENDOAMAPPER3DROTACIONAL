import { Lesion } from './lesionStore';

const COLORS: Record<string, number> = {
  superficial: 0xef4444,
  deep: 0x3b82f6
};

const THREE_JS_CDN = 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.min.js';
const ORBIT_CONTROLS_CDN = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/js/controls/OrbitControls.js';
const GLTF_LOADER_CDN = 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/js/loaders/GLTFLoader.js';

async function fetchScript(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao baixar script: ${url}`);
  }
  return response.text();
}

export async function export3DModelAsHtml(lesions: Lesion[], modelUrl: string = '/model.glb'): Promise<void> {
  const [modelResponse, threeJs, orbitControls, gltfLoader] = await Promise.all([
    fetch(modelUrl),
    fetchScript(THREE_JS_CDN),
    fetchScript(ORBIT_CONTROLS_CDN),
    fetchScript(GLTF_LOADER_CDN)
  ]);
  
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

  const inlineScripts = `${threeJs}\n${orbitControls}\n${gltfLoader}`;
  const htmlContent = generateStandaloneHtml(modelBase64, lesionsJson, inlineScripts);
  
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

function generateStandaloneHtml(modelBase64: string, lesionsJson: string, inlineScripts: string): string {
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
      padding: 12px 16px;
      background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
    }
    #logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    #logo-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #ec4899, #e11d48);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 12px;
    }
    #logo-text {
      color: white;
      font-size: 18px;
      font-weight: 700;
    }
    #logo-text span { color: #f43f5e; }
    #info {
      color: rgba(255,255,255,0.8);
      font-size: 12px;
      text-align: right;
    }
    #info strong { color: white; }
    #controls-hint {
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.6);
      color: rgba(255,255,255,0.8);
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 11px;
      z-index: 10;
      backdrop-filter: blur(8px);
      white-space: nowrap;
    }
    #legend {
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: rgba(0,0,0,0.6);
      padding: 12px;
      border-radius: 10px;
      z-index: 10;
      backdrop-filter: blur(8px);
    }
    #legend h4 {
      color: white;
      font-size: 10px;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255,255,255,0.8);
      font-size: 11px;
      margin-bottom: 4px;
    }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    .dot-superficial { background: #ef4444; }
    .dot-deep { background: #3b82f6; }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 16px;
      z-index: 20;
      text-align: center;
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
    @media (max-width: 600px) {
      #controls-hint { display: none; }
      #header { padding: 8px 12px; }
      #logo-icon { width: 30px; height: 30px; font-size: 10px; }
      #logo-text { font-size: 14px; }
      #info { font-size: 10px; }
    }
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
      Arraste para rotacionar • Pinça para zoom
    </div>
    <div id="legend">
      <h4>Legenda</h4>
      <div class="legend-item"><div class="legend-dot dot-superficial"></div> Superficial</div>
      <div class="legend-item"><div class="legend-dot dot-deep"></div> Profunda</div>
    </div>
  </div>

  <script>${inlineScripts}<\/script>
  <script>
    (function() {
      var LESIONS = ${lesionsJson};
      var MODEL_DATA = "${modelBase64}";

      document.getElementById('lesion-count').textContent = LESIONS.length;

      var canvas = document.getElementById('canvas');
      var loading = document.getElementById('loading');

      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      var pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 2 : 3);

      var renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: !isMobile,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);

      var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(4, 2, 4);

      var controls = new THREE.OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = false;
      controls.minDistance = 2;
      controls.maxDistance = 15;
      controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

      var ambientLight = new THREE.AmbientLight(0xFFF5E1, 0.8);
      scene.add(ambientLight);

      var dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
      dirLight.position.set(8, 8, 5);
      scene.add(dirLight);

      var backLight = new THREE.DirectionalLight(0xB0E0E6, 0.3);
      backLight.position.set(-5, 3, -5);
      scene.add(backLight);

      var loader = new THREE.GLTFLoader();
      
      try {
        var base64Parts = MODEL_DATA.split(',');
        var byteString = atob(base64Parts[1]);
        var mimeString = base64Parts[0].split(':')[1].split(';')[0];
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        var modelBlob = new Blob([ab], { type: mimeString });
        var modelUrl = URL.createObjectURL(modelBlob);

        loader.load(modelUrl, function(gltf) {
          var model = gltf.scene;
          
          var box = new THREE.Box3().setFromObject(model);
          var center = box.getCenter(new THREE.Vector3());
          var size = box.getSize(new THREE.Vector3());
          
          model.position.x += (model.position.x - center.x);
          model.position.y += (model.position.y - center.y);
          model.position.z += (model.position.z - center.z);
          
          var maxDim = Math.max(size.x, size.y, size.z);
          var scale = 4 / maxDim;
          model.scale.set(scale, scale, scale);

          model.traverse(function(child) {
            if (child.isMesh) {
              var mesh = child;
              var originalColor = new THREE.Color(0xffffff);
              var originalMat = mesh.material;
              if (Array.isArray(originalMat)) originalMat = originalMat[0];
              if (originalMat && originalMat.color) originalColor = originalMat.color.clone();
              
              var r = originalColor.r, g = originalColor.g, b = originalColor.b;
              var newColor = new THREE.Color(0xDD8A96);
              
              if (r > 0.8 && g > 0.8 && b < 0.4) newColor = new THREE.Color(0xFFD700);
              else if (r < 0.4 && g > 0.7 && b > 0.8) newColor = new THREE.Color(0x87CEEB);
              else if (r > 0.7 && g > 0.4 && b > 0.3 && r - g > 0.2) newColor = new THREE.Color(0xD4956F);
              
              mesh.material = new THREE.MeshStandardMaterial({
                color: newColor,
                roughness: 0.5,
                metalness: 0.1,
                transparent: true,
                opacity: 0.85,
                side: THREE.DoubleSide
              });
            }
          });

          scene.add(model);

          LESIONS.forEach(function(lesion) {
            var geometry;
            switch (lesion.markerType) {
              case 'square':
                geometry = new THREE.BoxGeometry(lesion.size * 1.5, lesion.size * 1.5, lesion.size * 1.5);
                break;
              case 'triangle':
                geometry = new THREE.ConeGeometry(lesion.size, lesion.size * 2, 3);
                break;
              case 'circle':
              default:
                geometry = new THREE.SphereGeometry(lesion.size, 16, 16);
                break;
            }
            var material = new THREE.MeshStandardMaterial({
              color: lesion.color,
              roughness: 0.3,
              metalness: 0.5,
              emissive: lesion.color,
              emissiveIntensity: 0.3
            });
            var marker = new THREE.Mesh(geometry, material);
            marker.position.set(lesion.position.x, lesion.position.y, lesion.position.z);
            scene.add(marker);
          });

          loading.style.display = 'none';
          URL.revokeObjectURL(modelUrl);
        }, undefined, function(error) {
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

      window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    })();
  <\/script>
</body>
</html>`;
}
