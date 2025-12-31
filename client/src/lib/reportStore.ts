import { create } from 'zustand';

interface ReportState {
  images2D: {
    sagittal: string;
    coronal: string;
    posterior: string;
  };
  setImages2D: (images: { sagittal: string; coronal: string; posterior: string }) => void;
  clearImages2D: () => void;
}

export const useReportStore = create<ReportState>((set) => ({
  images2D: {
    sagittal: '',
    coronal: '',
    posterior: '',
  },
  setImages2D: (images) => set({ images2D: images }),
  clearImages2D: () => set({
    images2D: {
      sagittal: '',
      coronal: '',
      posterior: '',
    }
  }),
}));
