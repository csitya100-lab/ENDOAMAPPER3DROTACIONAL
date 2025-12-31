import { create } from 'zustand';
import { Lesion, Severity } from './lesionStore';

export interface ReportLesion {
  id: string;
  name: string;
  location: string;
  severity: Severity;
  position: { x: number; y: number; z: number };
}

export interface Report {
  id: string;
  patientName: string;
  patientId: string;
  examDate: string;
  examType: string;
  images2D: {
    'sagittal-avf': string;
    'sagittal-rvf': string;
    coronal: string;
    posterior: string;
  };
  imageNotes: {
    'sagittal-avf': string;
    'sagittal-rvf': string;
    coronal: string;
    posterior: string;
  };
  lesions: ReportLesion[];
  createdAt: string;
}

export interface PdfImage {
  data: string;
  label: string;
  width: number;
  height: number;
}

interface ReportState {
  draftImages2D: {
    'sagittal-avf': string;
    'sagittal-rvf': string;
    coronal: string;
    posterior: string;
  };
  draftImageNotes: {
    'sagittal-avf': string;
    'sagittal-rvf': string;
    coronal: string;
    posterior: string;
  };
  reports: Record<string, Report>;
  hydrated: boolean;
  
  pdfImages: PdfImage[];
  
  setDraftImages2D: (images: { 'sagittal-avf': string; 'sagittal-rvf': string; coronal: string; posterior: string }) => void;
  setDraftImageNote: (view: keyof Report['images2D'], note: string) => void;
  clearDraftImages2D: () => void;
  createReport: (report: Omit<Report, 'id' | 'createdAt'>) => string;
  getReport: (id: string) => Report | undefined;
  deleteReport: (id: string) => void;
  
  addPdfImage: (image: PdfImage) => void;
  removePdfImage: (index: number) => void;
  clearPdfImages: () => void;
}

let isHydrated = false;

const loadReportsFromStorage = (): Record<string, Report> => {
  try {
    const stored = localStorage.getItem('medicalReports');
    if (stored) {
      isHydrated = true;
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load reports from localStorage:', e);
  }
  isHydrated = true;
  return {};
};

const saveReportsToStorage = (reports: Record<string, Report>) => {
  try {
    localStorage.setItem('medicalReports', JSON.stringify(reports));
  } catch (e) {
    console.warn('Failed to save reports to localStorage:', e);
  }
};

const initialReports = loadReportsFromStorage();

export const useReportStore = create<ReportState>((set, get) => ({
  draftImages2D: {
    'sagittal-avf': '',
    'sagittal-rvf': '',
    coronal: '',
    posterior: '',
  },
  draftImageNotes: {
    'sagittal-avf': '',
    'sagittal-rvf': '',
    coronal: '',
    posterior: '',
  },
  reports: initialReports,
  hydrated: isHydrated,
  pdfImages: [],

  setDraftImages2D: (images) => set({ draftImages2D: images }),
  
  setDraftImageNote: (view, note) => set((state) => ({
    draftImageNotes: { ...state.draftImageNotes, [view]: note }
  })),

  clearDraftImages2D: () => set({
    draftImages2D: {
      'sagittal-avf': '',
      'sagittal-rvf': '',
      coronal: '',
      posterior: '',
    },
    draftImageNotes: {
      'sagittal-avf': '',
      'sagittal-rvf': '',
      coronal: '',
      posterior: '',
    }
  }),

  createReport: (reportData) => {
    const id = `RPT-${Date.now().toString(36).toUpperCase()}`;
    const newReport: Report = {
      ...reportData,
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
  
  addPdfImage: (image) => set((state) => ({
    pdfImages: [...state.pdfImages, image]
  })),
  
  removePdfImage: (index) => set((state) => ({
    pdfImages: state.pdfImages.filter((_, i) => i !== index)
  })),
  
  clearPdfImages: () => set({ pdfImages: [] }),
}));

export const images2D = {
  get 'sagittal-avf'() { return useReportStore.getState().draftImages2D['sagittal-avf']; },
  get 'sagittal-rvf'() { return useReportStore.getState().draftImages2D['sagittal-rvf']; },
  get coronal() { return useReportStore.getState().draftImages2D.coronal; },
  get posterior() { return useReportStore.getState().draftImages2D.posterior; },
};
