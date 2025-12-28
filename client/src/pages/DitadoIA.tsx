import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Check, RotateCcw, Download, AlertCircle, CheckCircle2, Loader2, Mic, MicOff, Eye, Printer, X, ChevronRight, RotateCw, Shield, ClipboardList, ChevronLeft } from 'lucide-react';
import { 
  type LaudoData, 
  type AchadosDetectados,
  LAUDO_PADRAO,
  converterNumerosParaDigitos,
  detectarAchados,
  formatarLesao,
  formatarLaudo,
  validarLaudo,
  carregarLaudoDoStorage
} from '@shared/laudo';
import AppLayout from '@/components/AppLayout';

const LAUDO_INICIAL = LAUDO_PADRAO;

type EstadoMicrofone = 'inativo' | 'gravando' | 'processando' | 'concluido';
type SuporteBrowser = 'suportado' | 'parcial' | 'nao-suportado';

const detectarNavegadorESuporte = (): { navegador: string; suporte: SuporteBrowser; mensagem: string } => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('chrome') && !ua.includes('edge')) {
    return { navegador: 'Chrome', suporte: 'suportado', mensagem: 'Chrome: Suporte completo' };
  }
  if (ua.includes('edg')) {
    return { navegador: 'Edge', suporte: 'suportado', mensagem: 'Edge: Suporte completo' };
  }
  if (ua.includes('safari') && !ua.includes('chrome')) {
    return { navegador: 'Safari', suporte: 'parcial', mensagem: 'Safari: Suporte parcial (sem transcrição ao vivo)' };
  }
  if (ua.includes('firefox')) {
    return { navegador: 'Firefox', suporte: 'nao-suportado', mensagem: 'Firefox: Sem suporte nativo - use digitação manual' };
  }
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return { navegador: 'Mobile', suporte: 'suportado', mensagem: 'Mobile: Usando microfone do sistema operacional' };
  }
  
  return { navegador: 'Desconhecido', suporte: 'nao-suportado', mensagem: 'Navegador não identificado' };
};

export default function DitadoIA() {
  const [textoDitado, setTextoDitado] = useState('');
  const [laudo, setLaudo] = useState<LaudoData>(() => {
    const laudoSalvo = localStorage.getItem('laudo_atual');
    if (laudoSalvo) {
      try {
        const parsed = JSON.parse(laudoSalvo);
        if (parsed.estruturas && parsed.compartimentos && parsed.utero) {
          return parsed;
        }
        localStorage.removeItem('laudo_atual');
        return LAUDO_INICIAL;
      } catch {
        localStorage.removeItem('laudo_atual');
        return LAUDO_INICIAL;
      }
    }
    return LAUDO_INICIAL;
  });
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);
  const [modalVisualizacao, setModalVisualizacao] = useState(false);
  const [achados, setAchados] = useState<AchadosDetectados | null>(null);
  const [validationResponse, setValidationResponse] = useState<string | null>(null);
  const [estadoMicrofone, setEstadoMicrofone] = useState<EstadoMicrofone>('inativo');
  const [contadorTempo, setContadorTempo] = useState(0);
  const [alturaOndas, setAlturaOndas] = useState<number[]>([50, 50, 50, 50, 50]);
  const [suporteMicrofone, setSuporteMicrofone] = useState<SuporteBrowser>('suportado');
  const [modalPrivacidade, setModalPrivacidade] = useState(false);
  const [microfoneAtivo, setMicrofoneAtivo] = useState(false);
  const [infoNavegador, setInfoNavegador] = useState<{ navegador: string; suporte: SuporteBrowser; mensagem: string } | null>(null);
  const [sugestoesIA, setSugestoesIA] = useState<any[]>([]);
  const [sugestoesAprovadas, setSugestoesAprovadas] = useState<{ [key: number]: boolean }>({});
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ondaRef = useRef<NodeJS.Timeout | null>(null);

  const handleImprimir = () => {
    window.print();
  };

  useEffect(() => {
    const info = detectarNavegadorESuporte();
    setInfoNavegador(info);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setSuporteMicrofone('nao-suportado');
      setError(`${info.mensagem} - Digitação manual ativada`);
      return;
    }

    const privacidadeAceita = localStorage.getItem('privacidade_microfone_aceita');
    if (!privacidadeAceita) {
      setModalPrivacidade(true);
    }

    setSuporteMicrofone(info.suporte);

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'pt-BR';

    recognitionRef.current.onstart = () => {
      setMicrofoneAtivo(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      let textoInterino = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        let transcricao = event.results[i][0].transcript;
        transcricao = converterNumerosParaDigitos(transcricao);
        if (event.results[i].isFinal) {
          setTextoDitado((prev) => prev + (prev ? ' ' : '') + transcricao);
        } else {
          textoInterino += transcricao;
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      setError(`Erro de reconhecimento: ${event.error}`);
      setGravando(false);
      setMicrofoneAtivo(false);
    };

    recognitionRef.current.onend = () => {
      setGravando(false);
      setMicrofoneAtivo(false);
    };
  }, []);

  const iniciarGravacao = () => {
    if (suporteMicrofone === 'nao-suportado' || !recognitionRef.current) {
      setError(`Seu navegador não suporta gravação de voz. Digite manualmente ou use Chrome, Edge ou Safari.`);
      return;
    }

    recognitionRef.current.start();
    setGravando(true);
    setEstadoMicrofone('gravando');
    setContadorTempo(0);
    setError(null);
    setMicrofoneAtivo(true);

    timerRef.current = setInterval(() => {
      setContadorTempo((prev) => {
        if (prev >= 300) {
          pararGravacao();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    ondaRef.current = setInterval(() => {
      setAlturaOndas(Array(5).fill(0).map(() => Math.random() * 80 + 20));
    }, 100);
  };

  const pararGravacao = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setGravando(false);
      setEstadoMicrofone('concluido');
      setMicrofoneAtivo(false);

      if (timerRef.current) clearInterval(timerRef.current);
      if (ondaRef.current) clearInterval(ondaRef.current);

      setTimeout(() => {
        setEstadoMicrofone('inativo');
      }, 2000);
    }
  };

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
      setSugestoesIA(data.sugestoes_ia || []);
      setSugestoesAprovadas({});
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
    setAchados(null);
    setValidationResponse(null);
    setEstadoMicrofone('inativo');
    setContadorTempo(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ondaRef.current) clearInterval(ondaRef.current);
    };
  }, []);

  const headerActions = (
    <>
      <Button
        onClick={() => window.location.href = '/modelos'}
        variant="outline"
        size="sm"
        className="border-slate-300 text-slate-700 hover:bg-slate-50"
        data-testid="button-gerenciar-modelos"
      >
        <ClipboardList className="w-4 h-4 mr-2" />
        Gerenciar Modelos
      </Button>
    </>
  );

  return (
    <AppLayout 
      title="Ditado IA para Laudo" 
      subtitle="Análise automática de transcrições de voz"
      headerActions={headerActions}
    >
      <div className="flex-1 overflow-auto">
        {microfoneAtivo && (
          <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold z-30 animate-pulse-micro">
            <Mic className="w-4 h-4" />
            Microfone ativo - gravando...
          </div>
        )}

        <div className="p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Transcrição do Ditado
              </label>
              <div className="flex gap-2 mb-2">
                <textarea
                  value={textoDitado}
                  onChange={(e) => {
                    setTextoDitado(e.target.value);
                    if (e.target.value.trim()) {
                      setAchados(detectarAchados(e.target.value));
                    } else {
                      setAchados(null);
                    }
                  }}
                  placeholder="Cole aqui o texto do ditado reconhecido…"
                  className="flex-1 h-32 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400"
                />
                <div className="flex flex-col gap-2 items-center">
                  {estadoMicrofone === 'inativo' && (
                    <Button
                      onClick={iniciarGravacao}
                      className="h-14 w-14 rounded-lg flex items-center justify-center transition-all bg-pink-500 hover:bg-pink-600 text-white shadow-md hover:shadow-lg"
                      title="Iniciar gravação de voz"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  )}
                  {estadoMicrofone === 'gravando' && (
                    <>
                      <Button
                        onClick={pararGravacao}
                        className="h-14 w-14 rounded-lg flex items-center justify-center transition-all bg-red-600 text-white shadow-lg animate-pulse-micro"
                        title="Parar gravação"
                      >
                        <Mic className="w-5 h-5" />
                      </Button>
                      <div className="flex items-end gap-1 h-10 justify-center">
                        {alturaOndas.map((altura, i) => (
                          <div
                            key={i}
                            className="w-1 bg-red-600 rounded-full transition-all"
                            style={{ height: `${altura}%` }}
                          />
                        ))}
                      </div>
                      <div className="text-xs font-semibold text-red-600 font-mono">
                        {String(Math.floor(contadorTempo / 60)).padStart(2, '0')}:
                        {String(contadorTempo % 60).padStart(2, '0')}
                      </div>
                    </>
                  )}
                  {estadoMicrofone === 'processando' && (
                    <Button
                      disabled
                      className="h-14 w-14 rounded-lg flex items-center justify-center transition-all bg-blue-500 text-white shadow-md"
                      title="Processando..."
                    >
                      <RotateCw className="w-5 h-5 animate-spin-smooth" />
                    </Button>
                  )}
                  {estadoMicrofone === 'concluido' && (
                    <Button
                      onClick={iniciarGravacao}
                      className="h-14 w-14 rounded-lg flex items-center justify-center transition-all bg-green-500 hover:bg-green-600 text-white shadow-lg"
                      title="Regravar"
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>

              {achados && (achados.temEndometrioma || achados.temMioma || achados.temProfundidade || achados.tamanho) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600" />
                    Validação Clínica da Transcrição
                  </h3>

                  <div className="mb-4 pb-4 border-b border-blue-200">
                    <p className="text-xs text-slate-600 font-medium mb-2">Transcrição Detectada:</p>
                    <p className="text-sm text-slate-700 bg-white rounded px-3 py-2 border border-blue-100">
                      {achados.transcricao}
                    </p>
                  </div>

                  <div className="mb-4 pb-4 border-b border-blue-200">
                    <p className="text-xs text-slate-600 font-medium mb-3">Achados Reconhecidos:</p>
                    <div className="space-y-2">
                      {achados.temEndometrioma && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked readOnly className="w-4 h-4 rounded accent-blue-600" />
                          <span className="text-sm text-slate-700">Tipo de Lesão: <strong>Endometrioma</strong></span>
                        </label>
                      )}
                      {achados.temMioma && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked readOnly className="w-4 h-4 rounded accent-blue-600" />
                          <span className="text-sm text-slate-700">Tipo de Lesão: <strong>Mioma</strong></span>
                        </label>
                      )}
                      {achados.localizacao && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked readOnly className="w-4 h-4 rounded accent-blue-600" />
                          <span className="text-sm text-slate-700">Localização: <strong>{achados.localizacao}</strong></span>
                        </label>
                      )}
                      {achados.tamanho && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked readOnly className="w-4 h-4 rounded accent-blue-600" />
                          <span className="text-sm text-slate-700">Tamanho: <strong>{achados.tamanho}</strong></span>
                        </label>
                      )}
                      {achados.temProfundidade && achados.profundidade && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked readOnly className="w-4 h-4 rounded accent-blue-600" />
                          <span className="text-sm text-slate-700">Profundidade: <strong>{achados.profundidade}</strong></span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 pb-4 border-b border-blue-200">
                    <p className="text-xs text-slate-600 font-medium mb-3">Falta algum detalhe?</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="validation" 
                          value="correct"
                          checked={validationResponse === 'correct'}
                          onChange={(e) => setValidationResponse(e.target.value)}
                          className="w-4 h-4 accent-green-600"
                        />
                        <span className="text-sm text-slate-700">Não, está correto</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="validation" 
                          value="edit"
                          checked={validationResponse === 'edit'}
                          onChange={(e) => setValidationResponse(e.target.value)}
                          className="w-4 h-4 accent-amber-600"
                        />
                        <span className="text-sm text-slate-700">Sim, preciso editar</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="validation" 
                          value="rerecord"
                          checked={validationResponse === 'rerecord'}
                          onChange={(e) => setValidationResponse(e.target.value)}
                          className="w-4 h-4 accent-red-600"
                        />
                        <span className="text-sm text-slate-700">Sim, quero regravar</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) textarea.focus();
                      }}
                      variant="outline"
                      className="flex-1 h-9 gap-1 text-sm bg-white border-blue-300 text-slate-700 hover:bg-slate-100"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Editar Texto
                    </Button>
                    <Button
                      onClick={handleAnalisarDitado}
                      disabled={loading || !textoDitado.trim()}
                      className="flex-1 h-9 gap-1 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                    >
                      Analisar com IA
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

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

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                Laudo Atualizado
              </h2>
              <div className="bg-slate-50 rounded-lg p-6 text-sm text-slate-800 font-mono whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
                {formatarLaudo(laudo)}
              </div>
            </div>

            {sugestoesIA.length > 0 && (
              <div className="bg-amber-50 rounded-lg shadow-sm border border-amber-200 p-6 mb-6">
                <h2 className="text-lg font-semibold text-amber-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  💡 Sugestões da IA (Consulta Opcional)
                </h2>
                <div className="space-y-4">
                  {sugestoesIA.map((sugestao, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-amber-200">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 text-sm">{sugestao.titulo}</h3>
                          <p className="text-xs text-amber-800 mt-1">{sugestao.descricao}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={sugestoesAprovadas[idx] || false}
                          onChange={(e) => setSugestoesAprovadas({ ...sugestoesAprovadas, [idx]: e.target.checked })}
                          className="w-5 h-5 accent-amber-600 mt-1"
                        />
                      </div>
                      {sugestao.sugestao && (
                        <div className="bg-amber-50 rounded p-3 text-xs text-amber-900 border border-amber-100">
                          <strong>Sugestão:</strong> {sugestao.sugestao}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={handleLimpar}
                variant="outline"
                className="flex-1 h-12 gap-2 border-slate-300"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar Tudo
              </Button>
              <Button
                onClick={() => setModalVisualizacao(true)}
                className="flex-1 h-12 gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Eye className="w-4 h-4" />
                Visualizar Laudo
              </Button>
              <Button
                onClick={handleImprimir}
                className="flex-1 h-12 gap-2 bg-green-600 hover:bg-green-700"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>

        {modalPrivacidade && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
                <h3 className="text-lg font-semibold text-slate-900">Privacidade e Microfone</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Este recurso usa reconhecimento de voz do navegador. Seus áudios são processados localmente e não são armazenados em servidores externos.
              </p>
              <p className="text-xs text-slate-500 mb-6">
                O navegador pode solicitar permissão para acessar o microfone. Você pode revogar essa permissão a qualquer momento nas configurações do navegador.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setModalPrivacidade(false)}
                  className="flex-1"
                >
                  Recusar
                </Button>
                <Button
                  onClick={() => {
                    localStorage.setItem('privacidade_microfone_aceita', 'true');
                    setModalPrivacidade(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Aceitar e Continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        {modalVisualizacao && (
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-white print:p-0"
            onClick={() => setModalVisualizacao(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto print:max-w-none print:max-h-none print:shadow-none print:rounded-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 print:hidden">
                <h3 className="text-lg font-semibold text-slate-900">Visualização do Laudo</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleImprimir}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setModalVisualizacao(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div 
                className="p-8 print:p-0"
                style={{ 
                  fontFamily: 'Times New Roman, serif',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}
              >
                <div style={{ marginBottom: '24px', textAlign: 'center', borderBottom: '2px solid #1e40af', paddingBottom: '16px' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>LAUDO DE ULTRASSONOGRAFIA TRANSVAGINAL</h1>
                  <p style={{ fontSize: '14px', color: '#374151' }}>Mapeamento de Endometriose</p>
                </div>

                <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid #d1d5db', paddingBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>MÉDICO</p>
                    <p style={{ fontSize: '12px', fontWeight: '600' }}>{laudo.cabecalho.nome_medico || '___________________________'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>DATA DO EXAME</p>
                    <p style={{ fontSize: '12px', fontWeight: '600' }}>{laudo.cabecalho.data}</p>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>TIPO DE EXAME</p>
                    <p style={{ fontSize: '12px', fontWeight: '600' }}>{laudo.cabecalho.tipo_exame}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>ÚTERO</h2>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Posição:</strong> {laudo.utero.posicao}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Biometria:</strong> {laudo.utero.biometria}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Contornos:</strong> {laudo.utero.contornos}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Miométrio:</strong> {laudo.utero.miometrio}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Eco Endometrial:</strong> {laudo.utero.eco_endometrial}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Espessura Endometrial:</strong> {laudo.utero.espessura_endometrial}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Junção Endométrio-Miométrio:</strong> {laudo.utero.juncao_endometrio_miometrio}</p>
                  {laudo.utero.miomas && laudo.utero.miomas.length > 0 && (
                    <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Miomas:</strong> {laudo.utero.miomas.map(formatarLesao).join(', ')}</p>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>OVÁRIO DIREITO</h2>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Forma: {laudo.ovario_direito.forma} | Limites: {laudo.ovario_direito.limites}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Parênquima: {laudo.ovario_direito.parenchima}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Biometria: {laudo.ovario_direito.biometria}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Lesões: {laudo.ovario_direito.lesoes && laudo.ovario_direito.lesoes.length > 0 ? laudo.ovario_direito.lesoes.map(formatarLesao).join(', ') : 'Nenhuma detectada'}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>OVÁRIO ESQUERDO</h2>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Forma: {laudo.ovario_esquerdo.forma} | Limites: {laudo.ovario_esquerdo.limites}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Parênquima: {laudo.ovario_esquerdo.parenchima}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Biometria: {laudo.ovario_esquerdo.biometria}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Lesões: {laudo.ovario_esquerdo.lesoes && laudo.ovario_esquerdo.lesoes.length > 0 ? laudo.ovario_esquerdo.lesoes.map(formatarLesao).join(', ') : 'Nenhuma detectada'}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>COMPARTIMENTOS PÉLVICOS</h2>
                  <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>ANTERIOR:</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Parede vesical: {laudo.compartimentos.anterior.parede_vesical}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Espaço vésico-uterino: {laudo.compartimentos.anterior.espaco_vesico_uterino}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Sinal de deslizamento anterior: {laudo.compartimentos.anterior.sinal_deslizamento_anterior}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '8px' }}>Endometriose: {laudo.compartimentos.anterior.achados_endometriose === 'Sim' ? 'Detectada' : 'Não detectada'}</p>
                  <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>MEDIAL:</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Superfície uterina: {laudo.compartimentos.medial.superficie_uterina}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Ligamentos redondos: {laudo.compartimentos.medial.ligamentos_redondos}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Tubas uterinas: {laudo.compartimentos.medial.tubas_uterinas}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Ovários: {laudo.compartimentos.medial.ovarios}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '8px' }}>Endometriose: {laudo.compartimentos.medial.achados_endometriose === 'Sim' ? 'Detectada' : 'Não detectada'}</p>
                  <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>POSTERIOR:</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Septo retovaginal: {laudo.compartimentos.posterior.septo_retovaginal}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Fórnix vaginal: {laudo.compartimentos.posterior.frnice_vaginal}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Retossigmoide: {laudo.compartimentos.posterior.retossigmoide}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Ligamentos útero-sacros: {laudo.compartimentos.posterior.ligamentos_utero_sacros}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Região retro-cervical: {laudo.compartimentos.posterior.regiao_retro_cervical}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Sinal de deslizamento posterior: {laudo.compartimentos.posterior.sinal_deslizamento_posterior}</p>
                  <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Endometriose: {laudo.compartimentos.posterior.achados_endometriose === 'Sim' ? 'Detectada' : 'Não detectada'}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>RINS E URETERES</h2>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Rins:</strong> {laudo.rins_ureteres.rins}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Ureteres terminais:</strong> {laudo.rins_ureteres.ureteres_terminais}</p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>PAREDE ABDOMINAL</h2>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Região umbilical:</strong> {laudo.parede_abdominal.regiao_umbilical}</p>
                  <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Parede abdominal:</strong> {laudo.parede_abdominal.parede_abdominal}</p>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>CONCLUSÃO</h2>
                  <p style={{ fontSize: '11px' }}>{laudo.conclusao}</p>
                </div>

                <div style={{ borderTop: '2px solid #d1d5db', paddingTop: '24px', marginTop: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid #9ca3af', width: '192px', marginBottom: '4px' }}></div>
                      <p style={{ fontSize: '11px' }}>Assinatura do Médico</p>
                      <p style={{ fontSize: '10px', color: '#6b7280' }}>CRM: ________________</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '1px solid #9ca3af', width: '128px', marginBottom: '4px' }}></div>
                      <p style={{ fontSize: '11px' }}>Data</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ border: '1px solid #d1d5db', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>Carimbo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
