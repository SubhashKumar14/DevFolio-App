import { create } from 'zustand';
import { DEFAULT_DESIGN, DESIGN_IDS } from '@/lib/designPresets';

function savedDesign() {
  if (typeof window === 'undefined') return DEFAULT_DESIGN;
  try {
    const saved = window.localStorage.getItem('devfolioDesign');
    return DESIGN_IDS.includes(saved) ? saved : DEFAULT_DESIGN;
  } catch {
    return DEFAULT_DESIGN;
  }
}

function applyDesign(design) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.design = design;
  }
}

const initialDesign = savedDesign();
applyDesign(initialDesign);

export const useDesignStore = create((set) => ({
  design: initialDesign,
  setDesign: (requested) => {
    const design = DESIGN_IDS.includes(requested) ? requested : DEFAULT_DESIGN;
    applyDesign(design);
    try {
      window.localStorage.setItem('devfolioDesign', design);
    } catch {
      // The selection remains available for this session.
    }
    set({ design });
  },
}));
