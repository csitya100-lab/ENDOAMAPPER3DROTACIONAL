import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReportStore, Report } from "@/lib/reportStore";
import { Severity } from "@/lib/lesionStore";

const SEVERITY_COLORS: Record<
  Severity,
  { hex: string; label: string; bg: string; text: string; border: string }
> = {
  superficial: {
    hex: "#ec4899",
    label: "Superficial",
    bg: "bg-pink-100",
    text: "text-pink-700",
    border: "border-pink-300",
  },
  moderate: {
    hex: "#f97316",
    label: "Moderada",
    bg: "bg-orange-100",
    text: "text-orange-700",
    border: "border-orange-300",
  },
  deep: {
    hex: "#eab308",
    label: "Profunda",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
  },
};

export default function PublicReport() {
  const { id } = useParams<{ id: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const { getReport, hydrated } = useReportStore();

  useEffect(() => {
    if (!hydrated) return;

    if (!id) {
      setLoading(false);
      return;
    }

    const storedReport = getReport(id);
    if (storedReport) {
      setReport(storedReport);
    }
    setLoading(false);
  }, [id, getReport, hydrated]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !report) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    } catch (e) {
      console.warn("WebGL not available");
      return;
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 10;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    let animationId: number;

    const loader = new GLTFLoader();
    loader.load(
      "/model.glb",
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              color: 0xffb6c1,
              roughness: 0.5,
              metalness: 0.1,
              transparent: true,
              opacity: 0.85,
            });
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        model.scale.setScalar(scale);

        scene.add(model);

        report.lesions.forEach((lesion) => {
          const color = SEVERITY_COLORS[lesion.severity].hex;
          const geometry = new THREE.SphereGeometry(0.12, 32, 32);
          const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
          });
          const sphere = new THREE.Mesh(geometry, material);
          sphere.position.set(
            lesion.position.x * scale,
            lesion.position.y * scale,
            lesion.position.z * scale,
          );
          scene.add(sphere);
        });
      },
      undefined,
      (error) => {
        console.error("Error loading model:", error);
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color: 0xffb6c1 });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        report.lesions.forEach((lesion) => {
          const color = SEVERITY_COLORS[lesion.severity].hex;
          const markerGeometry = new THREE.SphereGeometry(0.12, 32, 32);
          const markerMaterial = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
          });
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.set(
            lesion.position.x * 0.5,
            lesion.position.y * 0.5,
            lesion.position.z * 0.5,
          );
          scene.add(marker);
        });
      },
    );

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
    };
  }, [report]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-800">Carregando relatório...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-4">
        <div className="text-slate-800 text-xl font-medium">
          Relatório não encontrado
        </div>
        <p className="text-slate-700 text-sm">
          O relatório com ID "{id}" não existe ou foi removido.
        </p>
        <a
          href="/"
          className="text-pink-600 hover:text-pink-700 text-sm underline"
        >
          Voltar para o início
        </a>
      </div>
    );
  }

  const examPhotos: string[] = [];

  const nextPhoto = () => {
    if (examPhotos.length > 0) {
      setPhotoIndex((prev) => (prev + 1) % examPhotos.length);
    }
  };

  const prevPhoto = () => {
    if (examPhotos.length > 0) {
      setPhotoIndex(
        (prev) => (prev - 1 + examPhotos.length) % examPhotos.length,
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-xs text-slate-800 uppercase tracking-wide">
                Paciente
              </p>
              <p
                className="text-lg font-semibold text-slate-900"
                data-testid="text-patient-name"
              >
                {report.patientName}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-800 uppercase tracking-wide">
                Data do Exame
              </p>
              <p
                className="text-lg font-semibold text-slate-900"
                data-testid="text-exam-date"
              >
                {report.examDate}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-800 uppercase tracking-wide">
                ID
              </p>
              <p
                className="text-lg font-semibold text-slate-900"
                data-testid="text-patient-id"
              >
                {report.patientId}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-700">Relatório</p>
            <p
              className="text-sm font-mono text-slate-800"
              data-testid="text-report-id"
            >
              {report.id}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">
                  Modelo 3D
                </h2>
                <p className="text-xs text-slate-800">
                  Arraste para rotacionar, scroll para zoom
                </p>
              </div>
              <div
                ref={containerRef}
                className="aspect-square lg:aspect-[4/3] w-full bg-slate-50"
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                  data-testid="canvas-3d-model"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">
                  Vistas 2D
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {(["sagittal-avf", "sagittal-rvf", "coronal", "posterior"] as const).map(
                    (view) => {
                      const viewLabels: Record<string, string> = {
                        "sagittal-avf": "Sagital AVF",
                        "sagittal-rvf": "Sagital RVF",
                        coronal: "Coronal",
                        posterior: "Posterior",
                      };
                      return (
                        <div
                          key={view}
                          className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group"
                        >
                          {report.images2D[view] ? (
                            <img
                              src={report.images2D[view]}
                              alt={viewLabels[view]}
                              className="w-full h-full object-cover"
                              data-testid={`img-2d-${view}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xs text-slate-400">
                                {viewLabels[view]}
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 px-2">
                            <span className="text-[10px] text-white">
                              {viewLabels[view]}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-700">
                  Fotos do Exame
                </h2>
              </div>
              <div className="p-4">
                {examPhotos.length > 0 ? (
                  <div className="relative">
                    <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                      <img
                        src={examPhotos[photoIndex]}
                        alt={`Foto ${photoIndex + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setExpandedPhoto(examPhotos[photoIndex])}
                        data-testid={`img-exam-photo-${photoIndex}`}
                      />
                    </div>
                    {examPhotos.length > 1 && (
                      <>
                        <button
                          onClick={prevPhoto}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                          data-testid="button-prev-photo"
                        >
                          <ChevronLeft className="w-5 h-5 text-slate-700" />
                        </button>
                        <button
                          onClick={nextPhoto}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                          data-testid="button-next-photo"
                        >
                          <ChevronRight className="w-5 h-5 text-slate-700" />
                        </button>
                      </>
                    )}
                    <div className="flex justify-center gap-1.5 mt-3">
                      {examPhotos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPhotoIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${idx === photoIndex ? "bg-pink-500" : "bg-slate-300"}`}
                          data-testid={`button-photo-dot-${idx}`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-slate-700">
                      Nenhuma foto disponível
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">
              Resumo das Lesões
            </h2>
          </div>
          <div className="p-4">
            {report.lesions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.lesions.map((lesion) => {
                  const severity = SEVERITY_COLORS[lesion.severity];
                  return (
                    <div
                      key={lesion.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${severity.bg} ${severity.border}`}
                      data-testid={`card-lesion-${lesion.id}`}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: severity.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${severity.text}`}>
                          {lesion.name}
                        </p>
                        <p className="text-xs text-slate-800 truncate">
                          {lesion.location}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium ${severity.text} px-2 py-0.5 rounded-full ${severity.bg}`}
                      >
                        {severity.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-800 text-center py-4">
                Nenhuma lesão registrada
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <div className="flex items-center gap-4 text-xs text-slate-800">
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS.superficial.hex }}
              />
              <span>Superficial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS.moderate.hex }}
              />
              <span>Moderada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: SEVERITY_COLORS.deep.hex }}
              />
              <span>Profunda</span>
            </div>
          </div>
        </div>
      </main>

      {expandedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
          data-testid="modal-expanded-photo"
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setExpandedPhoto(null)}
            data-testid="button-close-expanded"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={expandedPhoto}
            alt="Foto expandida"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
