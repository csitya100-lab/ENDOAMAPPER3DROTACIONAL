import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, Check, RotateCcw, Download, AlertCircle, CheckCircle2, Loader2, Mic, MicOff, Eye, Printer, X } from 'lucide-react';

interface LaudoData {
  cabecalho: {
    nome_medico: string;
    data: string;
    tipo_exame: string;
  };
  equipamento: {
    nome: string;
    vias: string;
    tecnicas: string;
  };
  estruturas: {
    uretra: { descricao: string };
    bexiga: { descricao: string };
    vagina: { descricao: string };
  };
  utero: {
    posicao: string;
    forma: string;
    contornos: string;
    paredes: string;
    miometrio: string;
    biometria: string;
    eco_endometrial: string;
    linha_media: string;
    juncao_endometrio_miometrio: string;
    padrao: string;
    espessura_endometrial: string;
    miomas: any[];
  };
  ovario_direito: {
    localizacao: string;
    forma: string;
    limites: string;
    parenchima: string;
    biometria: string;
    lesoes: any[];
  };
  ovario_esquerdo: {
    localizacao: string;
    forma: string;
    limites: string;
    parenchima: string;
    biometria: string;
    lesoes: any[];
  };
  compartimentos: {
    anterior: {
      parede_vesical: string;
      espaco_vesico_uterino: string;
      sinal_deslizamento_anterior: string;
      achados_endometriose: string;
    };
    medial: {
      superficie_uterina: string;
      ligamentos_redondos: string;
      tubas_uterinas: string;
      ovarios: string;
      achados_endometriose: string;
    };
    posterior: {
      septo_retovaginal: string;
      frnice_vaginal: string;
      retossigmoide: string;
      ligamentos_utero_sacros: string;
      regiao_retro_cervical: string;
      sinal_deslizamento_posterior: string;
      achados_endometriose: string;
    };
  };
  rins_ureteres: {
    rins: string;
    ureteres_terminais: string;
  };
  parede_abdominal: {
    regiao_umbilical: string;
    parede_abdominal: string;
  };
  conclusao: string;
}

const LAUDO_INICIAL: LaudoData = {
  cabecalho: {
    nome_medico: 'Dra.',
    data: '27/12/2025',
    tipo_exame: 'ULTRASSONOGRAFIA PARA PESQUISA DE ENDOMETRIOSE COM PREPARO INTESTINAL',
  },
  equipamento: {
    nome: 'GE Voluson E10',
    vias: 'Abdominal e Transvaginal',
    tecnicas: 'V.C.I. e 3D HDLIVESTUDIO',
  },
  estruturas: {
    uretra: { descricao: 'Retilínea, sem coleções ou cistos peri-uretrais' },
    bexiga: { descricao: 'Parcialmente cheia, paredes lisas, sem cálculos ou nódulos' },
    vagina: { descricao: 'Com características ecográficas normais' },
  },
  utero: {
    posicao: 'Anteverso flexão, móvel',
    forma: 'Típica',
    contornos: 'Regulares',
    paredes: 'Simétricas',
    miometrio: 'Textura homogênea',
    biometria: '3.8 x 4.5 x 8.0 cm, volume 74.7 cm³',
    eco_endometrial: 'Homogêneo',
    linha_media: 'Linear',
    juncao_endometrio_miometrio: 'Regular',
    padrao: 'Basal',
    espessura_endometrial: '3.7 mm',
    miomas: [],
  },
  ovario_direito: {
    localizacao: 'Região paratuterina, móvel',
    forma: 'Típica',
    limites: 'Definidos',
    parenchima: 'Ecogenicidade habitual',
    biometria: '3.1 x 1.7 x 1.9 cm, volume 3.4 cm³',
    lesoes: [],
  },
  ovario_esquerdo: {
    localizacao: 'Região paratuterina, móvel',
    forma: 'Típica',
    limites: 'Definidos',
    parenchima: 'Ecogenicidade habitual',
    biometria: '2.7 x 1.5 x 1.4 cm, volume 3.2 cm³',
    lesoes: [],
  },
  compartimentos: {
    anterior: {
      parede_vesical: 'Sem nodularidades',
      espaco_vesico_uterino: 'Livre',
      sinal_deslizamento_anterior: 'Positivo',
      achados_endometriose: 'Não',
    },
    medial: {
      superficie_uterina: 'Normal',
      ligamentos_redondos: 'Sem sinais de endometriose',
      tubas_uterinas: 'Normais',
      ovarios: 'Sem sinais de endometriose',
      achados_endometriose: 'Não',
    },
    posterior: {
      septo_retovaginal: 'Sem sinais de endometriose profunda',
      frnice_vaginal: 'Normal',
      retossigmoide: 'Normal',
      ligamentos_utero_sacros: 'Sem achados',
      regiao_retro_cervical: 'Normal',
      sinal_deslizamento_posterior: 'Positivo',
      achados_endometriose: 'Não',
    },
  },
  rins_ureteres: {
    rins: 'Aspecto ecográfico normal, sem sinais de hidronefrose',
    ureteres_terminais: 'Identificados, sem retrações ou alterações luminais',
  },
  parede_abdominal: {
    regiao_umbilical: 'Sem alterações',
    parede_abdominal: 'Sem alterações',
  },
  conclusao: 'Avaliação ecográfica sem sinais de endometriose profunda.',
};

export default function DitadoIA() {
  const [textoDitado, setTextoDitado] = useState('');
  const [laudo, setLaudo] = useState<LaudoData>(LAUDO_INICIAL);
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);
  const [modalVisualizacao, setModalVisualizacao] = useState(false);
  const recognitionRef = useRef<any>(null);

  const handleImprimir = () => {
    window.print();
  };

  const formatarLesao = (lesao: any): string => {
    if (typeof lesao === 'string') return lesao;
    return `${lesao.tipo || ''} ${lesao.tamanho || ''} ${lesao.localizacao || ''}`.trim();
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let textoInterino = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcricao = event.results[i][0].transcript;
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
      };

      recognitionRef.current.onend = () => {
        setGravando(false);
      };
    }
  }, []);

  const iniciarGravacao = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setGravando(true);
      setError(null);
    } else {
      setError('Reconhecimento de voz não disponível neste navegador');
    }
  };

  const pararGravacao = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setGravando(false);
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
[CABEÇALHO]
Data: ${laudo.cabecalho.data}
Tipo: ${laudo.cabecalho.tipo_exame}
Equipamento: ${laudo.equipamento.nome}
Vias: ${laudo.equipamento.vias}
Técnicas: ${laudo.equipamento.tecnicas}

[ESTRUTURAS]
  URETRA: ${laudo.estruturas.uretra.descricao}
  BEXIGA: ${laudo.estruturas.bexiga.descricao}
  VAGINA: ${laudo.estruturas.vagina.descricao}

[ÚTERO]
  • Posição: ${laudo.utero.posicao}
  • Forma: ${laudo.utero.forma}
  • Contornos: ${laudo.utero.contornos}
  • Paredes: ${laudo.utero.paredes}
  • Miométrio: ${laudo.utero.miometrio}
  • Biometria: ${laudo.utero.biometria}
  • Eco Endometrial: ${laudo.utero.eco_endometrial}
  • Linha Média: ${laudo.utero.linha_media}
  • Junção Endométrio-Miométrio: ${laudo.utero.juncao_endometrio_miometrio}
  • Padrão: ${laudo.utero.padrao}
  • Espessura Endometrial: ${laudo.utero.espessura_endometrial}
  • Miomas: ${laudo.utero.miomas && laudo.utero.miomas.length > 0 ? laudo.utero.miomas.map((m: any) => `${m.tipo || 'mioma'} ${m.tamanho || ''} ${m.localizacao || ''}`).join(', ') : 'Nenhum detectado'}

[OVÁRIO DIREITO]
  • Localização: ${laudo.ovario_direito.localizacao}
  • Forma: ${laudo.ovario_direito.forma}
  • Limites: ${laudo.ovario_direito.limites}
  • Parênquima: ${laudo.ovario_direito.parenchima}
  • Biometria: ${laudo.ovario_direito.biometria}
  • Lesões: ${laudo.ovario_direito.lesoes && laudo.ovario_direito.lesoes.length > 0 ? laudo.ovario_direito.lesoes.map((l: any) => typeof l === 'string' ? l : `${l.tipo || ''} ${l.tamanho || ''} ${l.localizacao || ''}`).join(', ') : 'Nenhuma detectada'}

[OVÁRIO ESQUERDO]
  • Localização: ${laudo.ovario_esquerdo.localizacao}
  • Forma: ${laudo.ovario_esquerdo.forma}
  • Limites: ${laudo.ovario_esquerdo.limites}
  • Parênquima: ${laudo.ovario_esquerdo.parenchima}
  • Biometria: ${laudo.ovario_esquerdo.biometria}
  • Lesões: ${laudo.ovario_esquerdo.lesoes && laudo.ovario_esquerdo.lesoes.length > 0 ? laudo.ovario_esquerdo.lesoes.map((l: any) => typeof l === 'string' ? l : `${l.tipo || ''} ${l.tamanho || ''} ${l.localizacao || ''}`).join(', ') : 'Nenhuma detectada'}

[COMPARTIMENTOS]

ANTERIOR:
  • Parede Vesical: ${laudo.compartimentos.anterior.parede_vesical}
  • Espaço Vésico-Uterino: ${laudo.compartimentos.anterior.espaco_vesico_uterino}
  • Sinal de Deslizamento Anterior: ${laudo.compartimentos.anterior.sinal_deslizamento_anterior}
  • Endometriose: ${laudo.compartimentos.anterior.achados_endometriose}

MEDIAL:
  • Superfície Uterina: ${laudo.compartimentos.medial.superficie_uterina}
  • Ligamentos Redondos: ${laudo.compartimentos.medial.ligamentos_redondos}
  • Tubas Uterinas: ${laudo.compartimentos.medial.tubas_uterinas}
  • Ovários: ${laudo.compartimentos.medial.ovarios}
  • Endometriose: ${laudo.compartimentos.medial.achados_endometriose}

POSTERIOR:
  • Septo Retovaginal: ${laudo.compartimentos.posterior.septo_retovaginal}
  • Fírnix Vaginal: ${laudo.compartimentos.posterior.frnice_vaginal}
  • Retossigmoide: ${laudo.compartimentos.posterior.retossigmoide}
  • Ligamentos Útero-Sacros: ${laudo.compartimentos.posterior.ligamentos_utero_sacros}
  • Região Retro-Cervical: ${laudo.compartimentos.posterior.regiao_retro_cervical}
  • Sinal de Deslizamento Posterior: ${laudo.compartimentos.posterior.sinal_deslizamento_posterior}
  • Endometriose: ${laudo.compartimentos.posterior.achados_endometriose}

[RINS E URETERES]
  • Rins: ${laudo.rins_ureteres.rins}
  • Ureteres Terminais: ${laudo.rins_ureteres.ureteres_terminais}

[PAREDE ABDOMINAL]
  • Região Umbilical: ${laudo.parede_abdominal.regiao_umbilical}
  • Parede Abdominal: ${laudo.parede_abdominal.parede_abdominal}

[CONCLUSÃO]
${laudo.conclusao}
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
            <p className="text-sm font-semibold text-slate-900">Exame</p>
            <p className="text-xs text-slate-600">Endometriose</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{laudo.cabecalho.data}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto">
          {/* Ditado Input */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Transcrição do Ditado
            </label>
            <div className="flex gap-2 mb-2">
              <textarea
                value={textoDitado}
                onChange={(e) => setTextoDitado(e.target.value)}
                placeholder="Cole aqui o texto do ditado reconhecido…"
                className="flex-1 h-32 p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-slate-900 placeholder-slate-400"
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={gravando ? pararGravacao : iniciarGravacao}
                  className={`h-14 w-14 rounded-lg flex items-center justify-center transition-all ${
                    gravando
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                  title={gravando ? 'Parar gravação' : 'Iniciar gravação de voz'}
                >
                  {gravando ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              </div>
            </div>

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

          {/* Laudo Atualizado Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Laudo Atualizado
            </h2>
            <div className="bg-slate-50 rounded-lg p-6 text-sm text-slate-800 font-mono whitespace-pre-wrap break-words leading-relaxed max-h-96 overflow-y-auto">
              {formatarLaudo()}
            </div>
          </div>

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

          {/* Botões de Impressão */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setModalVisualizacao(true)}
              variant="outline"
              className="flex-1 h-10 gap-2 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200"
              data-testid="button-visualizar-impressao"
            >
              <Eye className="w-4 h-4" />
              Visualizar Impressão
            </Button>
            <Button
              onClick={handleImprimir}
              className="flex-1 h-10 gap-2 bg-green-600 text-white hover:bg-green-700"
              data-testid="button-imprimir-laudo"
            >
              <Printer className="w-4 h-4" />
              Imprimir Laudo
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Visualização Prévia */}
      {modalVisualizacao && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Visualização Prévia - Laudo A4</h3>
              <Button
                onClick={() => setModalVisualizacao(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-100">
              <div
                className="bg-white shadow-lg mx-auto print-area"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '20mm',
                  fontFamily: 'Arial, Segoe UI, sans-serif',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  color: '#333',
                }}
              >
                {/* Cabeçalho */}
                <div className="text-center border-b-2 border-blue-800 pb-4 mb-6">
                  <h1 className="text-xl font-bold text-blue-800 mb-1">ENDOACOLHE - MAPEAMENTO 3D/2D</h1>
                  <p className="text-sm font-semibold text-slate-700">{laudo.cabecalho.tipo_exame}</p>
                </div>

                {/* Dados do Paciente e Exame */}
                <div className="border border-slate-300 rounded p-4 mb-6 bg-slate-50">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><strong>Paciente:</strong> Paciente A</p>
                    <p><strong>Data:</strong> {laudo.cabecalho.data}</p>
                    <p><strong>CPF:</strong> _______________</p>
                    <p><strong>Idade:</strong> ______</p>
                    <p><strong>Médico:</strong> {laudo.cabecalho.nome_medico}</p>
                    <p><strong>CRM:</strong> ____________</p>
                    <p><strong>Equipamento:</strong> {laudo.equipamento.nome}</p>
                    <p><strong>Técnicas:</strong> {laudo.equipamento.tecnicas}</p>
                  </div>
                </div>

                {/* Estruturas */}
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">ESTRUTURAS</h2>
                  <p className="text-xs mb-1"><strong>URETRA:</strong> {laudo.estruturas.uretra.descricao}</p>
                  <p className="text-xs mb-1"><strong>BEXIGA:</strong> {laudo.estruturas.bexiga.descricao}</p>
                  <p className="text-xs mb-1"><strong>VAGINA:</strong> {laudo.estruturas.vagina.descricao}</p>
                </div>

                {/* Útero */}
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">ÚTERO</h2>
                  <div className="text-xs space-y-1">
                    <p><strong>Posição:</strong> {laudo.utero.posicao}</p>
                    <p><strong>Forma:</strong> {laudo.utero.forma} | <strong>Contornos:</strong> {laudo.utero.contornos}</p>
                    <p><strong>Paredes:</strong> {laudo.utero.paredes} | <strong>Miométrio:</strong> {laudo.utero.miometrio}</p>
                    <p><strong>Biometria:</strong> {laudo.utero.biometria}</p>
                    <p><strong>Eco endometrial:</strong> {laudo.utero.eco_endometrial}, linha média {laudo.utero.linha_media}</p>
                    <p><strong>Junção endométrio-miométrio:</strong> {laudo.utero.juncao_endometrio_miometrio}</p>
                    <p><strong>Padrão:</strong> {laudo.utero.padrao}</p>
                    <p><strong>Espessura endometrial:</strong> {laudo.utero.espessura_endometrial}</p>
                    <p><strong>Miomas:</strong> {laudo.utero.miomas && laudo.utero.miomas.length > 0 ? laudo.utero.miomas.map(formatarLesao).join(', ') : 'Nenhum detectado'}</p>
                  </div>
                </div>

                {/* Ovários */}
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">OVÁRIOS</h2>
                  <div className="text-xs space-y-2">
                    <div>
                      <p className="font-semibold">OVÁRIO DIREITO:</p>
                      <p className="ml-3">Localização: {laudo.ovario_direito.localizacao}</p>
                      <p className="ml-3">Forma: {laudo.ovario_direito.forma} | Limites: {laudo.ovario_direito.limites}</p>
                      <p className="ml-3">Parênquima: {laudo.ovario_direito.parenchima}</p>
                      <p className="ml-3">Biometria: {laudo.ovario_direito.biometria}</p>
                      <p className="ml-3">Lesões: {laudo.ovario_direito.lesoes && laudo.ovario_direito.lesoes.length > 0 ? laudo.ovario_direito.lesoes.map(formatarLesao).join(', ') : 'Nenhuma detectada'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">OVÁRIO ESQUERDO:</p>
                      <p className="ml-3">Localização: {laudo.ovario_esquerdo.localizacao}</p>
                      <p className="ml-3">Forma: {laudo.ovario_esquerdo.forma} | Limites: {laudo.ovario_esquerdo.limites}</p>
                      <p className="ml-3">Parênquima: {laudo.ovario_esquerdo.parenchima}</p>
                      <p className="ml-3">Biometria: {laudo.ovario_esquerdo.biometria}</p>
                      <p className="ml-3">Lesões: {laudo.ovario_esquerdo.lesoes && laudo.ovario_esquerdo.lesoes.length > 0 ? laudo.ovario_esquerdo.lesoes.map(formatarLesao).join(', ') : 'Nenhuma detectada'}</p>
                    </div>
                  </div>
                </div>

                {/* Compartimentos */}
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">COMPARTIMENTOS PÉLVICOS</h2>
                  <div className="text-xs space-y-2">
                    <div>
                      <p className="font-semibold">ANTERIOR:</p>
                      <p className="ml-3">Parede vesical: {laudo.compartimentos.anterior.parede_vesical}</p>
                      <p className="ml-3">Espaço vésico-uterino: {laudo.compartimentos.anterior.espaco_vesico_uterino}</p>
                      <p className="ml-3">Sinal de deslizamento anterior: {laudo.compartimentos.anterior.sinal_deslizamento_anterior}</p>
                      <p className="ml-3">Endometriose: {laudo.compartimentos.anterior.achados_endometriose === 'Sim' ? 'Detectada' : 'Não detectada'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">MEDIAL:</p>
                      <p className="ml-3">Superfície uterina: {laudo.compartimentos.medial.superficie_uterina}</p>
                      <p className="ml-3">Ligamentos redondos: {laudo.compartimentos.medial.ligamentos_redondos}</p>
                      <p className="ml-3">Tubas uterinas: {laudo.compartimentos.medial.tubas_uterinas}</p>
                      <p className="ml-3">Ovários: {laudo.compartimentos.medial.ovarios}</p>
                      <p className="ml-3">Endometriose: {laudo.compartimentos.medial.achados_endometriose === 'Sim' ? 'Detectada' : 'Não detectada'}</p>
                    </div>
                    <div>
                      <p className="font-semibold">POSTERIOR:</p>
                      <p className="ml-3">Septo retovaginal: {laudo.compartimentos.posterior.septo_retovaginal}</p>
                      <p className="ml-3">Fórnix vaginal: {laudo.compartimentos.posterior.frnice_vaginal}</p>
                      <p className="ml-3">Retossigmoide: {laudo.compartimentos.posterior.retossigmoide}</p>
                      <p className="ml-3">Ligamentos útero-sacros: {laudo.compartimentos.posterior.ligamentos_utero_sacros}</p>
                      <p className="ml-3">Região retro-cervical: {laudo.compartimentos.posterior.regiao_retro_cervical}</p>
                      <p className="ml-3">Sinal de deslizamento posterior: {laudo.compartimentos.posterior.sinal_deslizamento_posterior}</p>
                      <p className="ml-3">Endometriose: {laudo.compartimentos.posterior.achados_endometriose === 'Sim' ? 'Detectada' : 'Não detectada'}</p>
                    </div>
                  </div>
                </div>

                {/* Rins e Ureteres */}
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">RINS E URETERES</h2>
                  <p className="text-xs mb-1"><strong>Rins:</strong> {laudo.rins_ureteres.rins}</p>
                  <p className="text-xs mb-1"><strong>Ureteres terminais:</strong> {laudo.rins_ureteres.ureteres_terminais}</p>
                </div>

                {/* Parede Abdominal */}
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">PAREDE ABDOMINAL</h2>
                  <p className="text-xs mb-1"><strong>Região umbilical:</strong> {laudo.parede_abdominal.regiao_umbilical}</p>
                  <p className="text-xs mb-1"><strong>Parede abdominal:</strong> {laudo.parede_abdominal.parede_abdominal}</p>
                </div>

                {/* Conclusão */}
                <div className="mb-8">
                  <h2 className="text-sm font-bold text-blue-800 uppercase border-b-2 border-blue-800 pb-1 mb-2">CONCLUSÃO</h2>
                  <p className="text-xs">{laudo.conclusao}</p>
                </div>

                {/* Rodapé */}
                <div className="border-t-2 border-slate-300 pt-6 mt-8">
                  <div className="flex justify-between items-end">
                    <div className="text-center">
                      <div className="border-b border-slate-400 w-48 mb-1"></div>
                      <p className="text-xs">Assinatura do Médico</p>
                      <p className="text-xs text-slate-500">CRM: ________________</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-slate-400 w-32 mb-1"></div>
                      <p className="text-xs">Data</p>
                    </div>
                    <div className="text-center">
                      <div className="border border-slate-300 w-20 h-20 flex items-center justify-center">
                        <p className="text-[10px] text-slate-400">Carimbo</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-slate-200 bg-slate-50">
              <Button
                onClick={() => setModalVisualizacao(false)}
                variant="outline"
                className="flex-1 h-11 gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                data-testid="button-voltar-sem-imprimir"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar sem Imprimir
              </Button>
              <Button
                onClick={() => {
                  setModalVisualizacao(false);
                  setTimeout(handleImprimir, 100);
                }}
                className="flex-1 h-11 gap-2 bg-green-600 text-white hover:bg-green-700"
                data-testid="button-imprimir-e-fechar"
              >
                <Printer className="w-4 h-4" />
                Imprimir e Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Área de impressão oculta */}
      <div className="hidden print:block print-content">
        <div
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontFamily: 'Arial, Segoe UI, sans-serif',
            fontSize: '11px',
            lineHeight: '1.5',
            color: '#333',
          }}
        >
          {/* Cabeçalho */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #1e40af', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>ENDOACOLHE - MAPEAMENTO 3D/2D</h1>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>{laudo.cabecalho.tipo_exame}</p>
          </div>

          {/* Dados do Paciente */}
          <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '16px', marginBottom: '24px', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
              <p><strong>Paciente:</strong> Paciente A</p>
              <p><strong>Data:</strong> {laudo.cabecalho.data}</p>
              <p><strong>CPF:</strong> _______________</p>
              <p><strong>Idade:</strong> ______</p>
              <p><strong>Médico:</strong> {laudo.cabecalho.nome_medico}</p>
              <p><strong>CRM:</strong> ____________</p>
              <p><strong>Equipamento:</strong> {laudo.equipamento.nome}</p>
              <p><strong>Técnicas:</strong> {laudo.equipamento.tecnicas}</p>
            </div>
          </div>

          {/* Estruturas */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>ESTRUTURAS</h2>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>URETRA:</strong> {laudo.estruturas.uretra.descricao}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>BEXIGA:</strong> {laudo.estruturas.bexiga.descricao}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>VAGINA:</strong> {laudo.estruturas.vagina.descricao}</p>
          </div>

          {/* Útero */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>ÚTERO</h2>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Posição:</strong> {laudo.utero.posicao}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Forma:</strong> {laudo.utero.forma} | <strong>Contornos:</strong> {laudo.utero.contornos}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Paredes:</strong> {laudo.utero.paredes} | <strong>Miométrio:</strong> {laudo.utero.miometrio}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Biometria:</strong> {laudo.utero.biometria}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Eco endometrial:</strong> {laudo.utero.eco_endometrial}, linha média {laudo.utero.linha_media}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Junção endométrio-miométrio:</strong> {laudo.utero.juncao_endometrio_miometrio}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Padrão:</strong> {laudo.utero.padrao}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Espessura endometrial:</strong> {laudo.utero.espessura_endometrial}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Miomas:</strong> {laudo.utero.miomas && laudo.utero.miomas.length > 0 ? laudo.utero.miomas.map(formatarLesao).join(', ') : 'Nenhum detectado'}</p>
          </div>

          {/* Ovários */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>OVÁRIOS</h2>
            <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>OVÁRIO DIREITO:</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Localização: {laudo.ovario_direito.localizacao}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Forma: {laudo.ovario_direito.forma} | Limites: {laudo.ovario_direito.limites}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Parênquima: {laudo.ovario_direito.parenchima}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Biometria: {laudo.ovario_direito.biometria}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '8px' }}>Lesões: {laudo.ovario_direito.lesoes && laudo.ovario_direito.lesoes.length > 0 ? laudo.ovario_direito.lesoes.map(formatarLesao).join(', ') : 'Nenhuma detectada'}</p>
            <p style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>OVÁRIO ESQUERDO:</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Localização: {laudo.ovario_esquerdo.localizacao}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Forma: {laudo.ovario_esquerdo.forma} | Limites: {laudo.ovario_esquerdo.limites}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Parênquima: {laudo.ovario_esquerdo.parenchima}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Biometria: {laudo.ovario_esquerdo.biometria}</p>
            <p style={{ fontSize: '11px', marginLeft: '12px', marginBottom: '2px' }}>Lesões: {laudo.ovario_esquerdo.lesoes && laudo.ovario_esquerdo.lesoes.length > 0 ? laudo.ovario_esquerdo.lesoes.map(formatarLesao).join(', ') : 'Nenhuma detectada'}</p>
          </div>

          {/* Compartimentos */}
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

          {/* Rins e Ureteres */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>RINS E URETERES</h2>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Rins:</strong> {laudo.rins_ureteres.rins}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Ureteres terminais:</strong> {laudo.rins_ureteres.ureteres_terminais}</p>
          </div>

          {/* Parede Abdominal */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>PAREDE ABDOMINAL</h2>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Região umbilical:</strong> {laudo.parede_abdominal.regiao_umbilical}</p>
            <p style={{ fontSize: '11px', marginBottom: '4px' }}><strong>Parede abdominal:</strong> {laudo.parede_abdominal.parede_abdominal}</p>
          </div>

          {/* Conclusão */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', borderBottom: '2px solid #1e40af', paddingBottom: '4px', marginBottom: '8px' }}>CONCLUSÃO</h2>
            <p style={{ fontSize: '11px' }}>{laudo.conclusao}</p>
          </div>

          {/* Rodapé */}
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
  );
}
