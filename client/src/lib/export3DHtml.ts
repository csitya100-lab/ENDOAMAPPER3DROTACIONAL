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
      background: #0a0a0a;
      height: 100vh;
      overflow: hidden;
      touch-action: none;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      width: 100vw;
      height: 100vh;
    }
    .quad {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .quad canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .quad-label {
      position: absolute;
      top: 10px;
      left: 10px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(8px);
      z-index: 10;
      pointer-events: none;
    }
    .quad-hint {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: rgba(255,255,255,0.5);
      padding: 4px 12px;
      border-radius: 6px;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      white-space: nowrap;
      z-index: 10;
      pointer-events: none;
    }
    #loading {
      position: fixed;
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
    @media (max-width: 768px) {
      .grid {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 1fr 1fr 1fr;
      }
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
  <div id="loading">
    <div class="spinner"></div>
    <div>Carregando modelo 3D...</div>
  </div>
  <div class="grid">
    <div class="quad" id="q0">
      <div class="quad-label" style="color:#f472b6">3D PERSPECTIVA</div>
      <div class="quad-hint">Esquerdo: adicionar les\u00e3o \u00b7 Direito: rotacionar</div>
      <canvas id="c0"></canvas>
    </div>
    <div class="quad" id="q1">
      <div class="quad-label" style="color:#60a5fa">SAGITAL (LATERAL)</div>
      <div class="quad-hint">Direito: adicionar les\u00e3o</div>
      <canvas id="c1"></canvas>
    </div>
    <div class="quad" id="q2">
      <div class="quad-label" style="color:#4ade80">CORONAL (FRONTAL)</div>
      <div class="quad-hint">Direito: adicionar les\u00e3o</div>
      <canvas id="c2"></canvas>
    </div>
    <div class="quad" id="q3">
      <div class="quad-label" style="color:#facc15">POSTERIOR (TR\u00c1S)</div>
      <div class="quad-hint">Direito: adicionar les\u00e3o</div>
      <canvas id="c3"></canvas>
    </div>
  </div>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    const LESIONS = ${lesionsJson};
    const MODEL_DATA = "${modelBase64}";

    const loading = document.getElementById('loading');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 2 : 3);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    scene.add(new THREE.AmbientLight(0xFFF5E1, 0.8));
    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
    dirLight.position.set(8, 8, 5);
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xB0E0E6, 0.3);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    const viewports = [
      { id: 'c0', type: 'perspective', pos: [5,2,6] },
      { id: 'c1', type: 'ortho', pos: [10,0,0] },
      { id: 'c2', type: 'ortho', pos: [0,0,10] },
      { id: 'c3', type: 'ortho', pos: [0,0,-10] },
    ];

    const views = viewports.map((v) => {
      const canvas = document.getElementById(v.id);
      const container = canvas.parentElement;
      const w = container.clientWidth;
      const h = container.clientHeight;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        powerPreference: isMobile ? 'low-power' : 'high-performance'
      });
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(w, h);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      let camera, controls;

      if (v.type === 'perspective') {
        camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
        camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
        controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 2;
        controls.maxDistance = 10;
        controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
      } else {
        const frustum = 8;
        const aspect = w / h;
        camera = new THREE.OrthographicCamera(
          -frustum * aspect / 2, frustum * aspect / 2,
          frustum / 2, -frustum / 2, 0.1, 100
        );
        camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
        camera.up.set(0, 1, 0);
        camera.lookAt(0, 0, 0);
        controls = new OrbitControls(camera, canvas);
        controls.enableRotate = false;
        controls.enableZoom = true;
        controls.enablePan = false;
      }

      return { renderer, camera, controls, container, type: v.type };
    });

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
      views.forEach((v) => {
        v.controls.update();
        v.renderer.render(scene, v.camera);
      });
    }
    animate();

    function onResize() {
      views.forEach((v) => {
        const w = v.container.clientWidth;
        const h = v.container.clientHeight;
        v.renderer.setSize(w, h);
        if (v.type === 'perspective') {
          v.camera.aspect = w / h;
          v.camera.updateProjectionMatrix();
        } else {
          const frustum = 8;
          const aspect = w / h;
          v.camera.left = -frustum * aspect / 2;
          v.camera.right = frustum * aspect / 2;
          v.camera.top = frustum / 2;
          v.camera.bottom = -frustum / 2;
          v.camera.updateProjectionMatrix();
        }
      });
    }
    window.addEventListener('resize', onResize);
  <\/script>
</body>
</html>`;
}
