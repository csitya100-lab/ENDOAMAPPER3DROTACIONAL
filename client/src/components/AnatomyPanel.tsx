import { Eye, EyeOff, Heart, CircleDot, Workflow, Shield } from 'lucide-react';
import { useAnatomyStore, ANATOMY_ELEMENTS, type AnatomyElement } from '@/lib/anatomyStore';
import { Button } from '@/components/ui/button';

const CATEGORIES: { label: string; ids: AnatomyElement[]; Icon: typeof Heart }[] = [
  { label: 'Órgãos Reprodutivos', ids: ['uterus', 'cervix', 'ovaries', 'fallopianTubes'], Icon: Heart },
  { label: 'Ligamentos', ids: ['uterosacrals', 'roundLigaments'], Icon: Workflow },
  { label: 'Estruturas Adjacentes', ids: ['ureters', 'bladder', 'rectum', 'intestine'], Icon: Shield },
];

export function AnatomyPanel() {
  const { visibility, toggleVisibility, showAll, hideAll } = useAnatomyStore();

  const elementsById = Object.fromEntries(ANATOMY_ELEMENTS.map((el) => [el.id, el]));

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={showAll} className="h-7 px-3 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10 flex items-center gap-1.5">
          <Eye className="w-3 h-3" />
          Mostrar
        </Button>
        <Button variant="outline" size="sm" onClick={hideAll} className="h-7 px-3 text-xs text-slate-500 border-slate-200 hover:bg-slate-50 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-700 flex items-center gap-1.5">
          <EyeOff className="w-3 h-3" />
          Ocultar
        </Button>
      </div>

      {CATEGORIES.map((category) => (
        <div key={category.label}>
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider px-2.5 pt-3 pb-1">
            {category.label}
          </div>
          <div className="space-y-1">
            {category.ids.map((id) => {
              const element = elementsById[id];
              if (!element) return null;
              const isVisible = visibility[id];
              return (
                <button
                  key={id}
                  onClick={() => toggleVisibility(id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors ${
                    isVisible
                      ? 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700'
                      : 'bg-slate-50/50 border-transparent hover:bg-slate-100 opacity-60 dark:bg-slate-800/30 dark:hover:bg-slate-700/50'
                  }`}
                  data-testid={`toggle-${id}`}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: element.color }}
                  />
                  <category.Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isVisible ? 'text-slate-400 dark:text-slate-500' : 'text-slate-300 dark:text-slate-600'}`} />
                  <span className={`text-xs flex-1 text-left font-medium ${
                    isVisible ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {element.label}
                  </span>
                  {isVisible ? (
                    <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
