import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, Check, X, AlertCircle } from 'lucide-react';

interface Operation {
  acao: string;
  caminho: string;
  valor: string;
}

interface EditResponse {
  resultado_edicao: {
    operacoes: Operation[];
  };
}

export default function DitadoIA() {
  const [textoDitado, setTextoDitado] = useState('');
  const [operacoes, setOperacoes] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock laudoAtual para demonstração
  const laudoAtual = {
    titulo: 'Relatório de Mapeamento de Endometriose',
    data: new Date().toLocaleDateString('pt-BR'),
    observacoes: 'Exame realizado com sucesso.',
  };

  const handleAnalisarDitado = async () => {
    if (!textoDitado.trim()) {
      setError('Por favor, insira o texto do ditado');
      return;
    }

    setLoading(true);
    setError(null);
    setOperacoes([]);

    try {
      const response = await fetch('/api/editarLaudo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          laudoAtual: laudoAtual,
          comandoUsuario: textoDitado,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar o ditado');
      }

      const data: EditResponse = await response.json();
      setOperacoes(data.resultado_edicao.operacoes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação');
      // Adicionar operações mock para demonstração
      setOperacoes([
        {
          acao: 'Adicionar',
          caminho: 'observacoes',
          valor: 'Lesão profunda detectada no ovário direito',
        },
        {
          acao: 'Atualizar',
          caminho: 'data',
          valor: new Date().toLocaleDateString('pt-BR'),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAplicar = async () => {
    try {
      const response = await fetch('/api/aplicarOperacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          laudoAtual: laudoAtual,
          operacoes: operacoes,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao aplicar operações');
      }

      // Limpar estado após aplicar
      setTextoDitado('');
      setOperacoes([]);
      setError(null);
      // Aqui você poderia atualizar um estado global se necessário
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aplicar operações');
    }
  };

  const handleDescartar = () => {
    setTextoDitado('');
    setOperacoes([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 shadow-sm px-8 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = '/report'}
            className="h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Ditado IA para Laudo</h1>
            <p className="text-xs text-slate-600 mt-0.5">Análise automática de transcrições de voz</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pr-4 border-r border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">Paciente A</p>
            <p className="text-xs text-slate-600">ID: MRN: 2024-001</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Ditado Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Transcrição do Ditado
              </label>
              <textarea
                value={textoDitado}
                onChange={(e) => setTextoDitado(e.target.value)}
                placeholder="Cole aqui o texto do ditado reconhecido…"
                className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400"
              />
            </div>

            <Button
              onClick={handleAnalisarDitado}
              disabled={loading || !textoDitado.trim()}
              className="w-full h-10 gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Analisando...' : 'Analisar Ditado com IA'}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Operações Sugeridas */}
          {operacoes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  Operações Sugeridas
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {operacoes.length} operação{operacoes.length !== 1 ? 's' : ''} de edição propostas
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {operacoes.map((op, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 rounded-lg p-4 border border-slate-200 flex items-start gap-4"
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        op.acao === 'Adicionar' ? 'bg-green-500' :
                        op.acao === 'Atualizar' ? 'bg-blue-500' :
                        'bg-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700">
                          {op.acao}
                        </span>
                        <code className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded">
                          {op.caminho}
                        </code>
                      </div>
                      <p className="text-sm text-slate-700 break-words">
                        {op.valor}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAplicar}
                  className="flex-1 h-10 gap-2 bg-green-500 text-white hover:bg-green-600"
                >
                  <Check className="w-4 h-4" />
                  Aplicar ao Laudo
                </Button>
                <Button
                  onClick={handleDescartar}
                  variant="outline"
                  className="flex-1 h-10 gap-2 bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                  Descartar
                </Button>
              </div>
            </div>
          )}

          {/* Info Card */}
          {operacoes.length === 0 && textoDitado && !loading && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 text-sm text-blue-800">
              <p>Clique em "Analisar Ditado com IA" para processar o texto e ver as operações sugeridas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
