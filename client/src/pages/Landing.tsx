import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { MapPin, Grid3x3, FileText, ArrowRight, Stethoscope, Target, Layers } from 'lucide-react';

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="py-6 px-8 flex items-center justify-between border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">EndoMapper</h1>
            <p className="text-xs text-slate-400">Mapeamento de Endometriose</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
            Sistema de Mapeamento de Lesões
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Ferramenta profissional para visualização e documentação de lesões de endometriose, 
            auxiliando no planejamento cirúrgico e comunicação médica.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div 
            onClick={() => setLocation('/3d')}
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-pink-500/50 transition-all cursor-pointer group"
            data-testid="card-3d"
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              Modelo 3D
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Visualize o modelo anatômico rotacional do útero e estruturas adjacentes em 3D.
            </p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li className="flex items-center gap-2"><Target className="w-3 h-3" /> Rotação 360°</li>
              <li className="flex items-center gap-2"><Layers className="w-3 h-3" /> Marcadores de lesões</li>
              <li className="flex items-center gap-2"><Stethoscope className="w-3 h-3" /> Classificação por severidade</li>
            </ul>
          </div>

          <div 
            onClick={() => setLocation('/vistas-2d')}
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-pink-500/50 transition-all cursor-pointer group"
            data-testid="card-2d"
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Grid3x3 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              Editor 2D
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Edite as vistas 2D (sagital, coronal, posterior) com ferramentas de anotação.
            </p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li className="flex items-center gap-2"><Target className="w-3 h-3" /> Caneta, linha, círculo</li>
              <li className="flex items-center gap-2"><Layers className="w-3 h-3" /> Cores e espessuras</li>
              <li className="flex items-center gap-2"><Stethoscope className="w-3 h-3" /> Preenchimento hachura</li>
            </ul>
          </div>

          <div 
            onClick={() => setLocation('/preview-report')}
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-pink-500/50 transition-all cursor-pointer group"
            data-testid="card-report"
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
              Relatório
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Gere relatórios PDF profissionais com as imagens anotadas e observações.
            </p>
            <ul className="text-xs text-slate-500 space-y-1">
              <li className="flex items-center gap-2"><Target className="w-3 h-3" /> Exportação PDF</li>
              <li className="flex items-center gap-2"><Layers className="w-3 h-3" /> Observações médicas</li>
              <li className="flex items-center gap-2"><Stethoscope className="w-3 h-3" /> Formato A4</li>
            </ul>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700">
          <h3 className="text-xl font-semibold mb-6 text-center">Como Usar</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
              <h4 className="font-medium mb-2">Visualize em 3D</h4>
              <p className="text-sm text-slate-400">
                Use o modelo 3D para ter uma visão geral das estruturas e posicionar lesões no espaço tridimensional.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
              <h4 className="font-medium mb-2">Anote em 2D</h4>
              <p className="text-sm text-slate-400">
                No editor 2D, desenhe anotações precisas nas vistas planares usando as ferramentas disponíveis.
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
              <h4 className="font-medium mb-2">Exporte o Relatório</h4>
              <p className="text-sm text-slate-400">
                Selecione as vistas desejadas e gere um PDF profissional para referência cirúrgica.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button
            onClick={() => setLocation('/vistas-2d')}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-pink-500/30"
            data-testid="button-start"
          >
            Começar Agora
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 text-sm border-t border-slate-800/50">
        EndoMapper © {new Date().getFullYear()} — Sistema de Mapeamento de Endometriose
      </footer>
    </div>
  );
}
