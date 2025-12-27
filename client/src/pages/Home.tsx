import { useRef, useState } from 'react';
import { Uterus3D, Uterus3DRef } from '@/components/Uterus3D';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Circle, RotateCcw, Plus, Info, ChevronRight, FileText, LayoutDashboard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Severity = 'superficial' | 'moderate' | 'deep';

interface Lesion {
  id: string;
  position: { x: number; y: number; z: number };
  severity: Severity;
}

export default function Home() {
  const [severity, setSeverity] = useState<Severity>('superficial');
  const [lesionCount, setLesionCount] = useState(0);
  const [lesions, setLesions] = useState<Lesion[]>([]);
  const uterusRef = useRef<Uterus3DRef>(null);

  const handleAddTestLesion = () => {
    uterusRef.current?.addTestLesion();
  };

  const handleClearLesions = () => {
    uterusRef.current?.clearLesions();
  };

  const getLesionCount = (sev: Severity) => lesions.filter(l => l.severity === sev).length;
  const lastLesion = lesions[lesions.length - 1];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header / Toolbar */}
      <header className="flex-none h-16 border-b border-border bg-card/50 backdrop-blur-md px-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
               <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
             </div>
             <h1 className="text-lg font-bold tracking-tight text-foreground font-sans">
               Uterus<span className="text-primary">3D</span>
             </h1>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block" />

          {/* Severity Controls */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
            <button
              onClick={() => setSeverity('superficial')}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all
                ${severity === 'superficial' 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
              `}
            >
              <div className={`w-2 h-2 rounded-full ${severity === 'superficial' ? 'bg-red-500' : 'bg-red-900'}`} />
              Superficial
            </button>
            <button
              onClick={() => setSeverity('moderate')}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all
                ${severity === 'moderate' 
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
              `}
            >
              <div className={`w-2 h-2 rounded-full ${severity === 'moderate' ? 'bg-orange-500' : 'bg-orange-900'}`} />
              Moderate
            </button>
            <button
              onClick={() => setSeverity('deep')}
              className={`
                px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all
                ${severity === 'deep' 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
              `}
            >
              <div className={`w-2 h-2 rounded-full ${severity === 'deep' ? 'bg-blue-500' : 'bg-blue-900'}`} />
              Deep
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono hidden sm:flex bg-black/20 border-border/50">
            LESIONS: {lesionCount}
          </Badge>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleAddTestLesion}
            className="text-xs h-8 border border-border/50"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Test Lesion
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearLesions}
            className="text-xs h-8 bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/50"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/report'}
            className="text-xs h-8 border border-border/50"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Report
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.location.href = '/dashboard'}
            className="text-xs h-8 border border-border/50"
          >
            <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click on any view to add lesions. All views sync in real-time!</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewport */}
        <main className="flex-1 relative">
          <Uterus3D 
            ref={uterusRef}
            severity={severity}
            onLesionCountChange={setLesionCount}
            onLesionsUpdate={setLesions}
          />
        </main>

        {/* Lesion Details Panel */}
        <aside className="w-64 border-l border-border bg-card/50 backdrop-blur-md overflow-y-auto">
          <div className="p-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground tracking-wide mb-3">
              LESION SUMMARY
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded bg-red-500/5 border border-red-500/20">
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                  Superficial
                </span>
                <span className="text-xs font-mono font-bold text-red-400">{getLesionCount('superficial')}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-orange-500/5 border border-orange-500/20">
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Circle className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                  Moderate
                </span>
                <span className="text-xs font-mono font-bold text-orange-400">{getLesionCount('moderate')}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-blue-500/5 border border-blue-500/20">
                <span className="text-xs text-muted-foreground flex items-center gap-2">
                  <Circle className="w-2.5 h-2.5 fill-blue-500 text-blue-500" />
                  Deep
                </span>
                <span className="text-xs font-mono font-bold text-blue-400">{getLesionCount('deep')}</span>
              </div>
              <div className="pt-2 border-t border-border/50 mt-2">
                <span className="text-xs text-muted-foreground">Total Lesions</span>
                <span className="text-lg font-bold text-foreground block">{lesionCount}</span>
              </div>
            </div>
          </div>

          {lastLesion && (
            <div className="p-4 border-b border-border/50 bg-primary/5">
              <h3 className="text-xs font-semibold text-foreground tracking-wide mb-2">
                LAST LESION
              </h3>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground capitalize">{lastLesion.severity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">X:</span>
                  <span className="text-foreground">{lastLesion.position.x.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Y:</span>
                  <span className="text-foreground">{lastLesion.position.y.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Z:</span>
                  <span className="text-foreground">{lastLesion.position.z.toFixed(3)}</span>
                </div>
              </div>
            </div>
          )}

          {lesions.length > 0 && (
            <div className="p-4">
              <h3 className="text-xs font-semibold text-foreground tracking-wide mb-3">
                ALL LESIONS ({lesions.length})
              </h3>
              <div className="space-y-2">
                {lesions.map((lesion, idx) => (
                  <div key={lesion.id} className="p-2 rounded border border-border/50 bg-black/20 hover:bg-black/40 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                      <Circle 
                        className="w-2.5 h-2.5 fill-current" 
                        color={lesion.severity === 'superficial' ? '#ef4444' : lesion.severity === 'moderate' ? '#f97316' : '#3b82f6'}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div className="flex justify-between">
                        <span>X:</span>
                        <span className="font-mono text-foreground">{lesion.position.x.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Y:</span>
                        <span className="font-mono text-foreground">{lesion.position.y.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Z:</span>
                        <span className="font-mono text-foreground">{lesion.position.z.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lesions.length === 0 && (
            <div className="p-4 text-center">
              <div className="text-muted-foreground text-xs space-y-2">
                <p>No lesions yet.</p>
                <p>Click on any view or use the</p>
                <p className="flex items-center justify-center gap-1">
                  Test Lesion <ChevronRight className="w-3 h-3" /> button
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
