import { useRef, useState } from 'react';
import { Uterus3D, Uterus3DRef } from '@/components/Uterus3D';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Circle, RotateCcw, Plus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Severity = 'superficial' | 'moderate' | 'deep';

export default function Home() {
  const [severity, setSeverity] = useState<Severity>('superficial');
  const [lesionCount, setLesionCount] = useState(0);
  const uterusRef = useRef<Uterus3DRef>(null);

  const handleAddTestLesion = () => {
    uterusRef.current?.addTestLesion();
  };

  const handleClearLesions = () => {
    uterusRef.current?.clearLesions();
  };

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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="w-4 h-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click on the 3D Perspective view to add lesions manually.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 relative bg-background">
        <Uterus3D 
          ref={uterusRef}
          severity={severity}
          onLesionCountChange={setLesionCount}
        />
        
        {/* Overlay Info (Optional) */}
        <div className="absolute bottom-4 right-4 pointer-events-none opacity-50 text-[10px] text-muted-foreground font-mono">
          RENDERER: WEBGL 2.0 • ANTIALIAS: 4X
        </div>
      </main>
    </div>
  );
}
