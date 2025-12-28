import { create } from 'zustand';
import { Position3D } from '@shared/3d/projections';

export type Severity = 'superficial' | 'moderate' | 'deep';

export interface Lesion {
  id: string;
  position: Position3D;
  severity: Severity;
  location?: string;
  observacoes?: string;
}

interface LesionStore {
  lesions: Lesion[];
  selectedLesionId: string | null;
  
  addLesion: (lesion: Omit<Lesion, 'id'>) => string;
  updateLesion: (id: string, updates: Partial<Lesion>) => void;
  removeLesion: (id: string) => void;
  clearLesions: () => void;
  selectLesion: (id: string | null) => void;
  setLesions: (lesions: Lesion[]) => void;
}

export const useLesionStore = create<LesionStore>((set, get) => ({
  lesions: [],
  selectedLesionId: null,

  addLesion: (lesionData) => {
    const id = `lesion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newLesion: Lesion = { ...lesionData, id };
    
    set((state) => ({
      lesions: [...state.lesions, newLesion],
      selectedLesionId: id
    }));
    
    return id;
  },

  updateLesion: (id, updates) => {
    set((state) => ({
      lesions: state.lesions.map((lesion) =>
        lesion.id === id ? { ...lesion, ...updates } : lesion
      )
    }));
  },

  removeLesion: (id) => {
    set((state) => ({
      lesions: state.lesions.filter((lesion) => lesion.id !== id),
      selectedLesionId: state.selectedLesionId === id ? null : state.selectedLesionId
    }));
  },

  clearLesions: () => {
    set({ lesions: [], selectedLesionId: null });
  },

  selectLesion: (id) => {
    set({ selectedLesionId: id });
  },

  setLesions: (lesions) => {
    set({ lesions });
  }
}));
