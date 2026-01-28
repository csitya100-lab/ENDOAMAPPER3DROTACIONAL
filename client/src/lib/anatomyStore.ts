import { create } from 'zustand';

export type AnatomyElement = 
  | 'uterus'
  | 'uterosacrals'
  | 'roundLigaments'
  | 'ureters'
  | 'bladder';

export interface AnatomyElementInfo {
  id: AnatomyElement;
  label: string;
  color: string;
  visible: boolean;
}

interface AnatomyStore {
  visibility: Record<AnatomyElement, boolean>;
  toggleVisibility: (element: AnatomyElement) => void;
  setVisibility: (element: AnatomyElement, visible: boolean) => void;
  showAll: () => void;
  hideAll: () => void;
}

export const ANATOMY_ELEMENTS: AnatomyElementInfo[] = [
  { id: 'uterus', label: 'Útero', color: '#DD8A96', visible: true },
  { id: 'uterosacrals', label: 'Ligamentos Útero-sacros', color: '#C49080', visible: true },
  { id: 'roundLigaments', label: 'Ligamentos Redondos', color: '#D4956F', visible: true },
  { id: 'ureters', label: 'Ureteres', color: '#FFE4B5', visible: true },
  { id: 'bladder', label: 'Bexiga', color: '#D4A574', visible: true },
];

const initialVisibility: Record<AnatomyElement, boolean> = {
  uterus: true,
  uterosacrals: true,
  roundLigaments: true,
  ureters: true,
  bladder: true,
};

export const useAnatomyStore = create<AnatomyStore>((set) => ({
  visibility: initialVisibility,

  toggleVisibility: (element) =>
    set((state) => ({
      visibility: {
        ...state.visibility,
        [element]: !state.visibility[element],
      },
    })),

  setVisibility: (element, visible) =>
    set((state) => ({
      visibility: {
        ...state.visibility,
        [element]: visible,
      },
    })),

  showAll: () =>
    set({
      visibility: {
        uterus: true,
        uterosacrals: true,
        roundLigaments: true,
        ureters: true,
        bladder: true,
      },
    }),

  hideAll: () =>
    set({
      visibility: {
        uterus: false,
        uterosacrals: false,
        roundLigaments: false,
        ureters: false,
        bladder: false,
      },
    }),
}));
