import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, Check, RotateCcw, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Operation {
  acao: string;
  caminho: string;
  valor: string;
}

interface LaudoData {
  paciente: { nome: string; idade: number; cpf: string };
  exame: { data: string; tipo: string; ecografista: string; equipamento: string };
  utero: { tamanho: string; forma: string; ecotextura: string; adenomiose: string };
  ovario_direito: { tamanho: string; lesoes: any[] };
  ovario_esquerdo: { tamanho: string; lesoes: any[] };
  compartimentos: {
    ligamento_redondo_d: { achados: string };
    ligamento_redondo_e: { achados: string };
    bolsa_ovariana_d: { achados: string };
    bolsa_ovariana_e: { achados: string };
  };
  conclusao: string;
}

const LAUDO_INICIAL: LaudoData = {
  paciente: { nome: 'Paciente A', idade: 0, cpf: '' },
  exame: { data: new Date().toLocaleDateString('pt-BR'), tipo: 'Ultrassom - Endometriose', ecografista: '', equipamento: '' },
  utero: { tamanho: '', forma: '', ecotextura: '', adenomiose: '' },
  ovario_direito: { tamanho: '', lesoes: [] },
  ovario_esquerdo: { tamanho: '', lesoes: [] },
  compartimentos: {
    ligamento_redondo_d: { achados: '' },
    ligamento_redondo_e: { achados: '' },
    bolsa_ovariana_d: { achados: '' },
    bolsa_ovariana_e: { achados: '' },
  },
  conclusao: '',
};

export default function DitadoIA() {
  const [textoDitado, setTextoDitado] = useState('');
  const [laudo, setLaudo] = useState<LaudoData>(LAUDO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalisarDitado = async () => {
    if (!textoDitado.trim()) {
      setError('Por favor, insira o texto do ditado');
      return;
    }

    setLoading(true);
    setError(null);
    setSucesso(false);

    try {
      const response = await fetch('/api/analisarDitadoEAplicar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ditado: textoDitado,
          laudoAtual: laudo,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar o ditado');
      }

      const data = await response.json();
      setLaudo(data.laudoAtualizado);
      setSucesso(true);

      setTimeout(() => setSucesso(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleLimpar = () => {
    setTextoDitado('');
    setLaudo(LAUDO_INICIAL);
    setError(null);
    setSucesso(false);
  };

  const formatarLaudo = () => {
    return `
RELATÓRIO DE ULTRASSOM - ENDOMETRIOSE

PACIENTE:
Nome: ${laudo.paciente.nome}
Idade: ${laudo.paciente.idade || '-'}
CPF: ${laudo.paciente.cpf || '-'}

EXAME:
Data: ${laudo.exame.data}
Tipo: ${laudo.exame.tipo}
Ecografista: ${laudo.exame.ecografista || '-'}
Equipamento: ${laudo.exame.equipamento || '-'}

ACHADOS:

ÚTERO:
• Tamanho: ${laudo.utero.tamanho || 'Não informado'}
• Forma: ${laudo.utero.forma || 'Não informado'}
• Ecotextura: ${laudo.utero.ecotextura || 'Não informado'}
• Adenomiose: ${laudo.utero.adenomiose || 'Não detectada'}

OVÁRIO DIREITO:
• Tamanho: ${laudo.ovario_direito.tamanho || 'Não informado'}
• Lesões: ${laudo.ovario_direito.lesoes.length > 0 ? laudo.ovario_direito.lesoes.join(', ') : 'Nenhuma lesão detectada'}

OVÁRIO ESQUERDO:
• Tamanho: ${laudo.ovario_esquerdo.tamanho || 'Não informado'}
• Lesões: ${laudo.ovario_esquerdo.lesoes.length > 0 ? laudo.ovario_esquerdo.lesoes.join(', ') : 'Nenhuma lesão detectada'}

COMPARTIMENTOS:
• Ligamento Redondo D: ${laudo.compartimentos.ligamento_redondo_d.achados || 'Sem achados'}
• Ligamento Redondo E: ${laudo.compartimentos.ligamento_redondo_e.achados || 'Sem achados'}
• Bolsa Ovariana D: ${laudo.compartimentos.bolsa_ovariana_d.achados || 'Sem achados'}
• Bolsa Ovariana E: ${laudo.compartimentos.bolsa_ovariana_e.achados || 'Sem achados'}

CONCLUSÃO:
${laudo.conclusao || 'A análise está em progresso...'}
    `.trim();
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
            <p className="text-sm font-semibold text-slate-900">{laudo.paciente.nome}</p>
            <p className="text-xs text-slate-600">Exame de Endometriose</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{laudo.exame.data}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-6">
          {/* Left: Input */}
          <div>
            {/* Ditado Input */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Transcrição do Ditado
              </label>
              <textarea
                value={textoDitado}
                onChange={(e) => setTextoDitado(e.target.value)}
                placeholder="Cole aqui o texto do ditado reconhecido…"
                className="w-full h-32 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400"
              />

              <Button
                onClick={handleAnalisarDitado}
                disabled={loading || !textoDitado.trim()}
                className="w-full h-10 gap-2 mt-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Analisar Ditado com IA
                  </>
                )}
              </Button>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {sucesso && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">Laudo atualizado com sucesso!</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                onClick={handleLimpar}
                variant="outline"
                className="flex-1 h-10 gap-2 bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar e Novo
              </Button>
              <Button
                className="flex-1 h-10 gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                Salvar Laudo
              </Button>
            </div>
          </div>

          {/* Right: Laudo Preview */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 h-full overflow-y-auto">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Laudo Atualizado
              </h2>
              <pre className="text-xs text-slate-700 font-mono whitespace-pre-wrap break-words leading-relaxed">
                {formatarLaudo()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
