import { Eye, EyeOff } from 'lucide-react';
import { useAnatomyStore, ANATOMY_ELEMENTS } from '@/lib/anatomyStore';
import { Button } from '@/components/ui/button';

export function AnatomyPanel() {
  const { visibility, toggleVisibility, showAll, hideAll } = useAnatomyStore();

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm rounded-lg border border-white/10 p-3 w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white/90">Estruturas Anatômicas</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={showAll}
            className="h-6 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/20"
          >
            Mostrar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={hideAll}
            className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20"
          >
            Ocultar
          </Button>
        </div>
      </div>
      
      <div className="space-y-1">
        {ANATOMY_ELEMENTS.map((element) => (
          <button
            key={element.id}
            onClick={() => toggleVisibility(element.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
              visibility[element.id]
                ? 'bg-white/5 hover:bg-white/10'
                : 'bg-slate-800/50 hover:bg-slate-800'
            }`}
            data-testid={`toggle-${element.id}`}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: element.color }}
            />
            <span className={`text-xs flex-1 text-left ${
              visibility[element.id] ? 'text-white/80' : 'text-white/40'
            }`}>
              {element.label}
            </span>
            {visibility[element.id] ? (
              <Eye className="w-4 h-4 text-white/60" />
            ) : (
              <EyeOff className="w-4 h-4 text-white/30" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
