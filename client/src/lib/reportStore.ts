import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Severity } from "./lesionStore";

export interface ReportLesion {
  id: string;
  name: string;
  location: string;
  severity: Severity;
  position: { x: number; y: number; z: number };
}

export interface Image3D {
  id: string;
  data: string;
  label: string;
  observation: string;
  capturedAt: string;
}

export interface Report {
  id: string;
  patientName: string;
  patientId: string;
  examDate: string;
  examType: string;
  images2D: {
    sagittal: string;
    coronal: string;
    posterior: string;
  };
  imageNotes: {
    sagittal: string;
    coronal: string;
    posterior: string;
  };
  images3D: Image3D[];
  lesions: ReportLesion[];
  createdAt: string;
}

export interface PdfImage {
  data: string;
  label: string;
  viewType: string;
  observation: string;
}

interface ReportState {
  draftImages2D: {
    sagittal: string;
    coronal: string;
    posterior: string;
  };
  draftImageNotes: {
    sagittal: string;
    coronal: string;
    posterior: string;
  };
  draftImages3D: Image3D[];
  reports: Record<string, Report>;
  hydrated: boolean;

  pdfImages: PdfImage[];
  patientName: string;
  examDate: string;
  patientId: string;

  setPatientName: (name: string) => void;
  setExamDate: (date: string) => void;
  setPatientId: (id: string) => void;

  selectedViews: {
    sagittal: boolean;
    coronal: boolean;
    posterior: boolean;
  };

  setDraftImages2D: (images: {
    sagittal: string;
    coronal: string;
    posterior: string;
  }) => void;
  setDraftImage: (view: keyof Report["images2D"], imageData: string) => void;
  setDraftImageNote: (view: keyof Report["images2D"], note: string) => void;
  clearDraftImages2D: () => void;
  
  addDraftImage3D: (imageData: string) => void;
  removeDraftImage3D: (id: string) => void;
  updateDraftImage3DObservation: (id: string, observation: string) => void;
  clearDraftImages3D: () => void;
  
  createReport: (report: Omit<Report, "id" | "createdAt">) => string;
  getReport: (id: string) => Report | undefined;
  deleteReport: (id: string) => void;

  addPdfImage: (image: PdfImage) => void;
  removePdfImage: (index: number) => void;
  clearPdfImages: () => void;
  updatePdfImageObservation: (index: number, observation: string) => void;
  reorderPdfImages: (fromIndex: number, toIndex: number) => void;

  toggleViewSelection: (view: keyof Report["images2D"]) => void;
  setSelectedViews: (views: {
    sagittal: boolean;
    coronal: boolean;
    posterior: boolean;
  }) => void;
}

let isHydrated = false;

const loadReportsFromStorage = (): Record<string, Report> => {
  try {
    const stored = localStorage.getItem("medicalReports");
    if (stored) {
      isHydrated = true;
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Failed to load reports from localStorage:", e);
  }
  isHydrated = true;
  return {};
};

const saveReportsToStorage = (reports: Record<string, Report>) => {
  try {
    localStorage.setItem("medicalReports", JSON.stringify(reports));
  } catch (e) {
    console.warn("Failed to save reports to localStorage:", e);
  }
};

const initialReports = loadReportsFromStorage();

export const useReportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      draftImages2D: {
        sagittal: "",
        coronal: "",
        posterior: "",
      },
      draftImageNotes: {
        sagittal: "",
        coronal: "",
        posterior: "",
      },
      draftImages3D: [],
      reports: initialReports,
      hydrated: isHydrated,
      pdfImages: [],
      patientName: "",
      examDate: "",
      patientId: "",

      setPatientName: (name: string) => set({ patientName: name }),
      setExamDate: (date: string) => set({ examDate: date }),
      setPatientId: (id: string) => set({ patientId: id }),

      selectedViews: {
        sagittal: false,
        coronal: false,
        posterior: false,
      },

      setDraftImages2D: (images) => set({ draftImages2D: images }),

      setDraftImage: (view, imageData) =>
        set((state) => ({
          draftImages2D: { ...state.draftImages2D, [view]: imageData },
        })),

      setDraftImageNote: (view, note) =>
        set((state) => ({
          draftImageNotes: { ...state.draftImageNotes, [view]: note },
        })),

      clearDraftImages2D: () =>
        set({
          draftImages2D: {
            sagittal: "",
            coronal: "",
            posterior: "",
          },
          draftImageNotes: {
            sagittal: "",
            coronal: "",
            posterior: "",
          },
        }),

      addDraftImage3D: (imageData: string) =>
        set((state) => ({
          draftImages3D: [
            ...state.draftImages3D,
            {
              id: `img3d-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              data: imageData,
              label: `Captura 3D ${state.draftImages3D.length + 1}`,
              observation: "",
              capturedAt: new Date().toISOString(),
            },
          ],
        })),

      removeDraftImage3D: (id: string) =>
        set((state) => ({
          draftImages3D: state.draftImages3D.filter((img) => img.id !== id),
        })),

      updateDraftImage3DObservation: (id: string, observation: string) =>
        set((state) => ({
          draftImages3D: state.draftImages3D.map((img) =>
            img.id === id ? { ...img, observation } : img,
          ),
        })),

      clearDraftImages3D: () => set({ draftImages3D: [] }),

      createReport: (reportData) => {
        const id = `RPT-${Date.now().toString(36).toUpperCase()}`;
        const newReport: Report = {
          ...reportData,
          images3D: reportData.images3D || [],
          id,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          const updatedReports = { ...state.reports, [id]: newReport };
          saveReportsToStorage(updatedReports);
          return { reports: updatedReports };
        });

        return id;
      },

      getReport: (id) => {
        return get().reports[id];
      },

      deleteReport: (id) => {
        set((state) => {
          const { [id]: removed, ...rest } = state.reports;
          saveReportsToStorage(rest);
          return { reports: rest };
        });
      },

      addPdfImage: (image) =>
        set((state) => ({
          pdfImages: [...state.pdfImages, image],
        })),

      removePdfImage: (index) =>
        set((state) => ({
          pdfImages: state.pdfImages.filter((_, i) => i !== index),
        })),

      clearPdfImages: () => set({ pdfImages: [] }),

      updatePdfImageObservation: (index, observation) =>
        set((state) => ({
          pdfImages: state.pdfImages.map((img, i) =>
            i === index ? { ...img, observation } : img,
          ),
        })),

      reorderPdfImages: (fromIndex, toIndex) =>
        set((state) => {
          const items = [...state.pdfImages];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          return { pdfImages: items };
        }),

      toggleViewSelection: (view) =>
        set((state) => ({
          selectedViews: {
            ...state.selectedViews,
            [view]: !state.selectedViews[view],
          },
        })),

      setSelectedViews: (views) => set({ selectedViews: views }),
    }),
    {
      name: 'endomapper-report',
      storage: {
        getItem: (name) => {
          if (typeof window === 'undefined') return null;
          try {
            const str = sessionStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          if (typeof window === 'undefined') return;
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch {
            // ignore storage errors
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return;
          try {
            sessionStorage.removeItem(name);
          } catch {
            // ignore storage errors
          }
        },
      },
      partialize: (state) => ({
        pdfImages: state.pdfImages,
        draftImages2D: state.draftImages2D,
        draftImageNotes: state.draftImageNotes,
        draftImages3D: state.draftImages3D,
        selectedViews: state.selectedViews,
        patientName: state.patientName,
        examDate: state.examDate,
        patientId: state.patientId,
      }) as ReportState,
    }
  )
);

export const images2D = {
  get sagittal() {
    return useReportStore.getState().draftImages2D.sagittal;
  },
  get coronal() {
    return useReportStore.getState().draftImages2D.coronal;
  },
  get posterior() {
    return useReportStore.getState().draftImages2D.posterior;
  },
};
