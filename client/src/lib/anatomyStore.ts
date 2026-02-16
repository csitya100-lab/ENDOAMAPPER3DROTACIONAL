import { create } from 'zustand';

export type AnatomyElement = 
  | 'uterus'
  | 'cervix'
  | 'ovaries'
  | 'uterosacrals'
  | 'roundLigaments'
  | 'ureters'
  | 'bladder'
  | 'rectum'
  | 'intestine'
  | 'vagina'
  | 'fallopianTubes';

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
  { id: 'cervix', label: 'Colo do Útero', color: '#C47A86', visible: true },
  { id: 'vagina', label: 'Vagina', color: '#E8B4B8', visible: true },
  { id: 'ovaries', label: 'Ovários', color: '#E8B0A0', visible: true },
  { id: 'fallopianTubes', label: 'Tubas Uterinas', color: '#E8A090', visible: true },
  { id: 'uterosacrals', label: 'Lig. Útero-sacros', color: '#C49080', visible: true },
  { id: 'roundLigaments', label: 'Lig. Redondos', color: '#D4956F', visible: true },
  { id: 'ureters', label: 'Ureteres', color: '#FFE4B5', visible: true },
  { id: 'bladder', label: 'Bexiga', color: '#D4A574', visible: true },
  { id: 'rectum', label: 'Reto', color: '#C4907A', visible: true },
  { id: 'intestine', label: 'Intestino', color: '#D4A090', visible: true },
];

const initialVisibility: Record<AnatomyElement, boolean> = {
  uterus: true,
  cervix: true,
  vagina: true,
  ovaries: true,
  fallopianTubes: true,
  uterosacrals: true,
  roundLigaments: true,
  ureters: true,
  bladder: true,
  rectum: true,
  intestine: true,
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

  showAll: () => set({ visibility: { ...initialVisibility } }),

  hideAll: () =>
    set({
      visibility: Object.fromEntries(
        Object.keys(initialVisibility).map((k) => [k, false])
      ) as Record<AnatomyElement, boolean>,
    }),
}));

const anatomyLabels: Record<string, string> = Object.fromEntries(
  ANATOMY_ELEMENTS.map((el) => [el.id, el.label])
);

export function getAnatomyLabel(type: string | undefined): string {
  if (!type) return '';
  return anatomyLabels[type] || type;
}
