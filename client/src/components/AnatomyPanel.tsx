import { Eye, EyeOff } from 'lucide-react';
import { useAnatomyStore, ANATOMY_ELEMENTS } from '@/lib/anatomyStore';
import { Button } from '@/components/ui/button';

export function AnatomyPanel() {
  const { visibility, toggleVisibility, showAll, hideAll } = useAnatomyStore();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={showAll}
          className="h-6 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          Mostrar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={hideAll}
          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Ocultar
        </Button>
      </div>
      
      <div className="space-y-1">
        {ANATOMY_ELEMENTS.map((element) => (
          <button
            key={element.id}
            onClick={() => toggleVisibility(element.id)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors ${
              visibility[element.id]
                ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
            }`}
            data-testid={`toggle-${element.id}`}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: element.color }}
            />
            <span className={`text-xs flex-1 text-left font-medium ${
              visibility[element.id] ? 'text-slate-700' : 'text-slate-400'
            }`}>
              {element.label}
            </span>
            {visibility[element.id] ? (
              <Eye className="w-4 h-4 text-slate-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-slate-300" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
