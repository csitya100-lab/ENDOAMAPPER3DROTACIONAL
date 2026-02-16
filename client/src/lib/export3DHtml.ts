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

        const knownNames = ['uterus','cervix','leftovary','rightovary','bladder','rectum','intestine'];
        model.traverse((child) => {
          if (child.isMesh) {
            const n = (child.name || '').toLowerCase();
            if (n.includes('sacro') || n.includes('ligament') || n.includes('uterosacral') || n.includes('round')) {
              child.visible = false;
              return;
            }

            child.geometry.computeBoundingBox();
            const box = child.geometry.boundingBox;
            if (box && !knownNames.includes(n)) {
              const sx = box.max.x - box.min.x, sy = box.max.y - box.min.y, sz = box.max.z - box.min.z;
              const cx = (box.min.x + box.max.x) / 2;
              const vol = sx * sy * sz;
              const isVeryLateral = Math.abs(cx) > 1.5;
              const isUteroOvarianVol = vol > 2.0 && vol < 4.0;
              const isCentered = Math.abs(cx) < 0.5;
              const isCardinalVol = vol > 2.5 && vol < 3.0;
              const isSmall = vol < 0.5;
              if ((isVeryLateral && isUteroOvarianVol) || (isCardinalVol && isCentered) || isSmall) {
                child.visible = false;
                return;
              }
            }

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

        const anatomyGroup = new THREE.Group();
        scene.add(anatomyGroup);

        const ligMat = new THREE.MeshStandardMaterial({ color: 0xC49080, roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide });
        const rUSL = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3,-0.5,-0.1), new THREE.Vector3(0.6,-0.8,-0.7), new THREE.Vector3(0.9,-1.2,-1.3), new THREE.Vector3(1.0,-1.5,-1.8)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rUSL, 20, 0.08, 8, false), ligMat));
        const lUSL = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3,-0.5,-0.1), new THREE.Vector3(-0.6,-0.8,-0.7), new THREE.Vector3(-0.9,-1.2,-1.3), new THREE.Vector3(-1.0,-1.5,-1.8)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lUSL, 20, 0.08, 8, false), ligMat));

        const ureterMat = new THREE.MeshStandardMaterial({ color: 0xFFE4B5, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide });
        const rUr = new THREE.CatmullRomCurve3([new THREE.Vector3(1.8,1.5,-0.6), new THREE.Vector3(1.5,0.5,-0.5), new THREE.Vector3(1.0,-0.3,-0.2), new THREE.Vector3(0.6,-0.8,0.1), new THREE.Vector3(0.4,-1.1,0.3)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rUr, 24, 0.04, 8, false), ureterMat));
        const lUr = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.8,1.5,-0.6), new THREE.Vector3(-1.5,0.5,-0.5), new THREE.Vector3(-1.0,-0.3,-0.2), new THREE.Vector3(-0.6,-0.8,0.1), new THREE.Vector3(-0.4,-1.1,0.3)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lUr, 24, 0.04, 8, false), ureterMat));

        const roundMat = new THREE.MeshStandardMaterial({ color: 0xD4956F, roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide });
        const rRL = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3,1.45,0.15), new THREE.Vector3(0.7,1.35,0.45), new THREE.Vector3(1.2,1.0,0.8), new THREE.Vector3(1.8,0.5,1.15), new THREE.Vector3(2.4,0.1,1.5)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rRL, 24, 0.045, 8, false), roundMat));
        const lRL = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3,1.45,0.15), new THREE.Vector3(-0.7,1.35,0.45), new THREE.Vector3(-1.2,1.0,0.8), new THREE.Vector3(-1.8,0.5,1.15), new THREE.Vector3(-2.4,0.1,1.5)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lRL, 24, 0.045, 8, false), roundMat));

        const tubeMat = new THREE.MeshStandardMaterial({ color: 0xE8A090, roughness: 0.5, metalness: 0.02, side: THREE.DoubleSide });
        const fimMat = new THREE.MeshStandardMaterial({ color: 0xF0B0A0, roughness: 0.45, metalness: 0.01, side: THREE.DoubleSide });
        const rFT = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3,1.55,0.0), new THREE.Vector3(0.7,1.58,-0.02), new THREE.Vector3(1.2,1.55,-0.06), new THREE.Vector3(1.7,1.48,-0.16), new THREE.Vector3(2.1,1.38,-0.30), new THREE.Vector3(2.45,1.28,-0.46), new THREE.Vector3(2.65,1.18,-0.60)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rFT, 32, 0.06, 8, false), tubeMat));
        const lFT = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3,1.55,0.0), new THREE.Vector3(-0.7,1.58,-0.02), new THREE.Vector3(-1.2,1.55,-0.06), new THREE.Vector3(-1.7,1.48,-0.16), new THREE.Vector3(-2.1,1.38,-0.30), new THREE.Vector3(-2.45,1.28,-0.46), new THREE.Vector3(-2.65,1.18,-0.60)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lFT, 32, 0.06, 8, false), tubeMat));

        const fimCount = 6;
        [[2.65,1.18,-0.60,1], [-2.65,1.18,-0.60,-1]].forEach(([bx,by,bz,dir]) => {
          const g = new THREE.Group();
          for (let i = 0; i < fimCount; i++) {
            const a = (i / fimCount) * Math.PI * 0.8 - Math.PI * 0.4;
            const c = new THREE.CatmullRomCurve3([
              new THREE.Vector3(bx, by, bz),
              new THREE.Vector3(bx + dir*(0.15+Math.random()*0.1), by+Math.sin(a)*0.2, bz-0.1+Math.cos(a)*0.15),
              new THREE.Vector3(bx + dir*(0.25+Math.random()*0.1), by+Math.sin(a)*0.35, bz-0.15+Math.cos(a)*0.25),
            ]);
            g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, 0.015, 6, false), fimMat));
          }
          anatomyGroup.add(g);
        });

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

export interface Images2DExport {
  [key: string]: string;
}

export async function exportCompleteReport(
  lesions: Lesion[],
  images2D: Images2DExport,
  modelUrl: string = '/model.glb'
): Promise<void> {
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
    markerType: l.markerType ?? 'circle',
    location: l.location || ''
  })));

  const imagesJson = JSON.stringify(images2D);

  const htmlContent = generateCompleteReportHtml(modelBase64, lesionsJson, imagesJson);
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `endomapper-relatorio-${Date.now()}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateCompleteReportHtml(modelBase64: string, lesionsJson: string, imagesJson: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EndoMapper - Relatório Completo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      color: #1e293b;
    }
    header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 16px 24px;
      display: flex; align-items: center; justify-content: space-between;
      color: white;
    }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon {
      width: 36px; height: 36px; border-radius: 8px;
      background: linear-gradient(135deg, #ec4899, #e11d48);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 12px;
    }
    .logo-text { font-size: 18px; font-weight: 700; }
    .logo-text span { color: #f43f5e; }
    .header-info { text-align: right; font-size: 12px; opacity: 0.8; }
    .header-info strong { color: white; opacity: 1; }
    
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      height: calc(100vh - 68px);
    }
    
    .panel-3d {
      position: relative;
      background: #0a0a0a;
      overflow: hidden;
    }
    #canvas { width: 100%; height: 100%; display: block; }
    #loading {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: white; font-size: 14px; z-index: 20; text-align: center;
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.2);
      border-top-color: #f43f5e; border-radius: 50%; animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .panel-3d-label {
      position: absolute; top: 12px; left: 12px;
      background: rgba(0,0,0,0.6); color: #f472b6;
      padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
      backdrop-filter: blur(8px); z-index: 10; letter-spacing: 0.5px;
    }
    .panel-3d-hint {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.5); color: rgba(255,255,255,0.6);
      padding: 6px 14px; border-radius: 6px; font-size: 10px; z-index: 10;
      backdrop-filter: blur(8px); white-space: nowrap;
    }
    
    .panel-right {
      display: flex; flex-direction: column;
      overflow-y: auto;
    }
    
    .section {
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
    }
    .section-title {
      font-size: 12px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;
    }
    
    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .image-card {
      border-radius: 10px; overflow: hidden;
      border: 1px solid #e2e8f0;
      background: white;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }
    .image-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .image-card img {
      width: 100%; aspect-ratio: 1; object-fit: cover; display: block;
    }
    .image-card .label {
      padding: 8px 10px; font-size: 11px; font-weight: 600; color: #475569;
      text-align: center; background: #f8fafc;
    }
    
    .no-images {
      color: #94a3b8; font-size: 13px; text-align: center; padding: 24px;
    }
    
    .lesion-list { display: flex; flex-direction: column; gap: 8px; }
    .lesion-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; border-radius: 8px; font-size: 13px;
    }
    .lesion-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .lesion-name { font-weight: 600; }
    .lesion-location { font-size: 11px; color: #64748b; }
    .lesion-badge {
      margin-left: auto; font-size: 10px; font-weight: 600;
      padding: 2px 8px; border-radius: 12px;
    }
    .sev-superficial { background: #fce7f3; color: #be185d; }
    .sev-superficial .lesion-dot { background: #ec4899; }
    .sev-superficial .lesion-badge { background: #fce7f3; color: #be185d; }
    .sev-deep { background: #fef9c3; color: #a16207; }
    .sev-deep .lesion-dot { background: #eab308; }
    .sev-deep .lesion-badge { background: #fef9c3; color: #a16207; }
    
    .legend {
      display: flex; gap: 16px; justify-content: center;
      padding: 12px; font-size: 11px; color: #64748b;
    }
    .legend-item { display: flex; align-items: center; gap: 6px; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    
    .modal-overlay {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85);
      z-index: 100; justify-content: center; align-items: center; padding: 24px;
    }
    .modal-overlay.active { display: flex; }
    .modal-overlay img {
      max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: 8px;
    }
    .modal-close {
      position: absolute; top: 16px; right: 16px; width: 40px; height: 40px;
      background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
      color: white; font-size: 20px; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
    }
    .modal-close:hover { background: rgba(255,255,255,0.3); }
    
    @media (max-width: 768px) {
      .main-grid { grid-template-columns: 1fr; height: auto; }
      .panel-3d { height: 50vh; }
      .panel-right { height: auto; }
    }
    
    @media print {
      .panel-3d { height: 400px; }
      .panel-3d-hint { display: none; }
      .main-grid { grid-template-columns: 1fr; height: auto; }
      .panel-right { break-inside: avoid; }
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
  <header>
    <div class="logo">
      <div class="logo-icon">3D</div>
      <div class="logo-text">Endo<span>Mapper</span></div>
    </div>
    <div class="header-info">
      <div>Relatório Completo</div>
      <div><strong id="lesion-count">0</strong> lesões mapeadas</div>
    </div>
  </header>
  
  <div class="main-grid">
    <div class="panel-3d">
      <div id="loading">
        <div class="spinner"></div>
        <div>Carregando modelo 3D...</div>
      </div>
      <canvas id="canvas"></canvas>
      <div class="panel-3d-label">MODELO 3D INTERATIVO</div>
      <div class="panel-3d-hint">Arraste para rotacionar · Scroll para zoom</div>
    </div>
    
    <div class="panel-right">
      <div class="section" id="images-section">
        <div class="section-title">Vistas 2D</div>
        <div class="images-grid" id="images-grid"></div>
      </div>
      
      <div class="section">
        <div class="section-title">Lesões</div>
        <div class="lesion-list" id="lesion-list"></div>
      </div>
      
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:#ec4899"></div> Superficial</div>
        <div class="legend-item"><div class="legend-dot" style="background:#eab308"></div> Profunda</div>
      </div>
    </div>
  </div>
  
  <div class="modal-overlay" id="modal">
    <button class="modal-close" id="modal-close">&times;</button>
    <img id="modal-img" src="" alt="Imagem expandida" />
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    const LESIONS = ${lesionsJson};
    const IMAGES_2D = ${imagesJson};
    const MODEL_DATA = "${modelBase64}";

    document.getElementById('lesion-count').textContent = LESIONS.length;

    const VIEW_LABELS = {
      'sagittal-avf': 'Sagital AVF',
      'sagittal-rvf': 'Sagital RVF',
      'sagittal': 'Sagital',
      'coronal': 'Coronal',
      'posterior': 'Posterior'
    };

    const imagesGrid = document.getElementById('images-grid');
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const modalClose = document.getElementById('modal-close');
    
    let hasImages = false;
    Object.entries(IMAGES_2D).forEach(([key, dataUrl]) => {
      if (!dataUrl) return;
      hasImages = true;
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = '<img src="' + dataUrl + '" alt="' + (VIEW_LABELS[key] || key) + '" />'
        + '<div class="label">' + (VIEW_LABELS[key] || key) + '</div>';
      card.addEventListener('click', () => {
        modalImg.src = dataUrl;
        modal.classList.add('active');
      });
      imagesGrid.appendChild(card);
    });
    
    if (!hasImages) {
      imagesGrid.innerHTML = '<div class="no-images">Nenhuma vista 2D capturada</div>';
    }
    
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    modalClose.addEventListener('click', () => { modal.classList.remove('active'); });

    const SEV_LABELS = { superficial: 'Superficial', deep: 'Profunda' };
    const lesionList = document.getElementById('lesion-list');
    
    if (LESIONS.length === 0) {
      lesionList.innerHTML = '<div class="no-images">Nenhuma lesão registrada</div>';
    } else {
      LESIONS.forEach((l, i) => {
        const sevClass = l.severity === 'deep' ? 'sev-deep' : 'sev-superficial';
        const item = document.createElement('div');
        item.className = 'lesion-item ' + sevClass;
        item.innerHTML = '<div class="lesion-dot"></div>'
          + '<div><div class="lesion-name">Lesão ' + (i + 1) + '</div>'
          + '<div class="lesion-location">' + (l.location || 'Posição não identificada') + '</div></div>'
          + '<div class="lesion-badge">' + (SEV_LABELS[l.severity] || l.severity) + '</div>';
        lesionList.appendChild(item);
      });
    }

    const canvas = document.getElementById('canvas');
    const loading = document.getElementById('loading');
    const container = canvas.parentElement;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 2 : 3);

    const renderer = new THREE.WebGLRenderer({ 
      canvas, antialias: !isMobile, alpha: true,
      powerPreference: isMobile ? 'low-power' : 'high-performance'
    });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
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

        const knownNames = ['uterus','cervix','leftovary','rightovary','bladder','rectum','intestine'];
        model.traverse((child) => {
          if (child.isMesh) {
            const n = (child.name || '').toLowerCase();
            if (n.includes('sacro') || n.includes('ligament') || n.includes('uterosacral') || n.includes('round')) {
              child.visible = false;
              return;
            }

            child.geometry.computeBoundingBox();
            const box = child.geometry.boundingBox;
            if (box && !knownNames.includes(n)) {
              const sx = box.max.x - box.min.x, sy = box.max.y - box.min.y, sz = box.max.z - box.min.z;
              const cx = (box.min.x + box.max.x) / 2;
              const vol = sx * sy * sz;
              const isVeryLateral = Math.abs(cx) > 1.5;
              const isUteroOvarianVol = vol > 2.0 && vol < 4.0;
              const isCentered = Math.abs(cx) < 0.5;
              const isCardinalVol = vol > 2.5 && vol < 3.0;
              const isSmall = vol < 0.5;
              if ((isVeryLateral && isUteroOvarianVol) || (isCardinalVol && isCentered) || isSmall) {
                child.visible = false;
                return;
              }
            }

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

        const anatomyGroup = new THREE.Group();
        scene.add(anatomyGroup);

        const ligMat = new THREE.MeshStandardMaterial({ color: 0xC49080, roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide });
        const rUSL = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3,-0.5,-0.1), new THREE.Vector3(0.6,-0.8,-0.7), new THREE.Vector3(0.9,-1.2,-1.3), new THREE.Vector3(1.0,-1.5,-1.8)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rUSL, 20, 0.08, 8, false), ligMat));
        const lUSL = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3,-0.5,-0.1), new THREE.Vector3(-0.6,-0.8,-0.7), new THREE.Vector3(-0.9,-1.2,-1.3), new THREE.Vector3(-1.0,-1.5,-1.8)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lUSL, 20, 0.08, 8, false), ligMat));

        const ureterMat = new THREE.MeshStandardMaterial({ color: 0xFFE4B5, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide });
        const rUr = new THREE.CatmullRomCurve3([new THREE.Vector3(1.8,1.5,-0.6), new THREE.Vector3(1.5,0.5,-0.5), new THREE.Vector3(1.0,-0.3,-0.2), new THREE.Vector3(0.6,-0.8,0.1), new THREE.Vector3(0.4,-1.1,0.3)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rUr, 24, 0.04, 8, false), ureterMat));
        const lUr = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.8,1.5,-0.6), new THREE.Vector3(-1.5,0.5,-0.5), new THREE.Vector3(-1.0,-0.3,-0.2), new THREE.Vector3(-0.6,-0.8,0.1), new THREE.Vector3(-0.4,-1.1,0.3)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lUr, 24, 0.04, 8, false), ureterMat));

        const roundMat = new THREE.MeshStandardMaterial({ color: 0xD4956F, roughness: 0.55, metalness: 0.02, side: THREE.DoubleSide });
        const rRL = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3,1.45,0.15), new THREE.Vector3(0.7,1.35,0.45), new THREE.Vector3(1.2,1.0,0.8), new THREE.Vector3(1.8,0.5,1.15), new THREE.Vector3(2.4,0.1,1.5)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rRL, 24, 0.045, 8, false), roundMat));
        const lRL = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3,1.45,0.15), new THREE.Vector3(-0.7,1.35,0.45), new THREE.Vector3(-1.2,1.0,0.8), new THREE.Vector3(-1.8,0.5,1.15), new THREE.Vector3(-2.4,0.1,1.5)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lRL, 24, 0.045, 8, false), roundMat));

        const tubeMat = new THREE.MeshStandardMaterial({ color: 0xE8A090, roughness: 0.5, metalness: 0.02, side: THREE.DoubleSide });
        const fimMat = new THREE.MeshStandardMaterial({ color: 0xF0B0A0, roughness: 0.45, metalness: 0.01, side: THREE.DoubleSide });
        const rFT = new THREE.CatmullRomCurve3([new THREE.Vector3(0.3,1.55,0.0), new THREE.Vector3(0.7,1.58,-0.02), new THREE.Vector3(1.2,1.55,-0.06), new THREE.Vector3(1.7,1.48,-0.16), new THREE.Vector3(2.1,1.38,-0.30), new THREE.Vector3(2.45,1.28,-0.46), new THREE.Vector3(2.65,1.18,-0.60)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(rFT, 32, 0.06, 8, false), tubeMat));
        const lFT = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3,1.55,0.0), new THREE.Vector3(-0.7,1.58,-0.02), new THREE.Vector3(-1.2,1.55,-0.06), new THREE.Vector3(-1.7,1.48,-0.16), new THREE.Vector3(-2.1,1.38,-0.30), new THREE.Vector3(-2.45,1.28,-0.46), new THREE.Vector3(-2.65,1.18,-0.60)]);
        anatomyGroup.add(new THREE.Mesh(new THREE.TubeGeometry(lFT, 32, 0.06, 8, false), tubeMat));

        const fimCount = 6;
        [[2.65,1.18,-0.60,1], [-2.65,1.18,-0.60,-1]].forEach(([bx,by,bz,dir]) => {
          const g = new THREE.Group();
          for (let i = 0; i < fimCount; i++) {
            const a = (i / fimCount) * Math.PI * 0.8 - Math.PI * 0.4;
            const c = new THREE.CatmullRomCurve3([
              new THREE.Vector3(bx, by, bz),
              new THREE.Vector3(bx + dir*(0.15+Math.random()*0.1), by+Math.sin(a)*0.2, bz-0.1+Math.cos(a)*0.15),
              new THREE.Vector3(bx + dir*(0.25+Math.random()*0.1), by+Math.sin(a)*0.35, bz-0.15+Math.cos(a)*0.25),
            ]);
            g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, 0.015, 6, false), fimMat));
          }
          anatomyGroup.add(g);
        });

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
        loading.innerHTML = '<div style="color:#f43f5e">Erro ao carregar o modelo 3D</div>';
      });
    } catch (e) {
      loading.innerHTML = '<div style="color:#f43f5e">Erro ao processar o modelo 3D</div>';
    }

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  <\/script>
</body>
</html>`;
}
