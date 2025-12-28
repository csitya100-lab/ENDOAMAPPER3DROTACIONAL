import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Zap, Check, RotateCcw, Download, AlertCircle, CheckCircle2, Loader2, Mic, MicOff, Eye, Printer, X, ChevronRight, RotateCw, Shield, ClipboardList } from 'lucide-react';

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

// Função para converter números por extenso em dígitos
const converterNumerosParaDigitos = (texto: string): string => {
  const numerosPalavra: { [key: string]: string } = {
    'zero': '0', 'um': '1', 'uma': '1', 'dois': '2', 'duas': '2', 'três': '3', 'tres': '3',
    'quatro': '4', 'cinco': '5', 'seis': '6', 'sete': '7',
    'oito': '8', 'nove': '9', 'dez': '10', 'onze': '11',
    'doze': '12', 'treze': '13', 'quatorze': '14', 'quinze': '15',
    'dezesseis': '16', 'dezessete': '17', 'dezoito': '18',
    'dezenove': '19', 'vinte': '20', 'trinta': '30', 'quarenta': '40',
    'cinquenta': '50', 'sessenta': '60', 'setenta': '70',
    'oitenta': '80', 'noventa': '90', 'cem': '100', 'cento': '100', 'mil': '1000'
  };

  let resultado = texto;

  // Substituir "ponto" ou "vírgula" por "."
  resultado = resultado.replace(/\bponto\b/gi, '.');
  resultado = resultado.replace(/\bvírgula\b/gi, '.');
  resultado = resultado.replace(/\bvirgula\b/gi, '.');

  // Substituir "por" ou "vezes" por "x"
  resultado = resultado.replace(/\bpor\b/gi, 'x');
  resultado = resultado.replace(/\bvezes\b/gi, 'x');

  // Converter números por extenso em dígitos
  // Padrão: uma ou mais palavras de números separadas por espaço
  resultado = resultado.replace(
    /\b(?:zero|um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|mil)(?:\s+(?:zero|um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|quatorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem|cento|mil))*\b/gi,
    (match) => {
      const palavras = match.toLowerCase().split(/\s+/);
      let valor = 0;
      
      for (const palavra of palavras) {
        if (numerosPalavra[palavra]) {
          valor += parseInt(numerosPalavra[palavra], 10);
        }
      }
      
      return valor.toString();
    }
  );

  // Normalizar espaços ao redor de "x" (para medidas como "3 x 4 cm")
  resultado = resultado.replace(/\s*x\s*/gi, ' x ');

  // Substituir "centímetros" e variações por "cm"
  resultado = resultado.replace(/\bcentímetros\b/gi, 'cm');
  resultado = resultado.replace(/\bcentímetro\b/gi, 'cm');
  resultado = resultado.replace(/\bcentimetros\b/gi, 'cm');
  resultado = resultado.replace(/\bcentimetro\b/gi, 'cm');

  // Substituir "milímetros" e variações por "mm"
  resultado = resultado.replace(/\bmilímetros\b/gi, 'mm');
  resultado = resultado.replace(/\bmilímetro\b/gi, 'mm');
  resultado = resultado.replace(/\bmilimetros\b/gi, 'mm');
  resultado = resultado.replace(/\bmilimetro\b/gi, 'mm');

  return resultado;
};

// Funções de detecção de achados clínicos
interface AchadosDetectados {
  temEndometrioma: boolean;
  temMioma: boolean;
  temProfundidade: boolean;
  profundidade?: string;
  localizacao?: string;
  tamanho?: string;
  transcricao: string;
}

const detectarAchados = (texto: string): AchadosDetectados => {
  const achados: AchadosDetectados = {
    temEndometrioma: false,
    temMioma: false,
    temProfundidade: false,
    transcricao: texto,
  };

  // Detectar endometrioma
  if (/endometrioma/i.test(texto)) {
    achados.temEndometrioma = true;
  }

  // Detectar mioma ou fibroma
  if (/mioma|fibroma/i.test(texto)) {
    achados.temMioma = true;
  }

  // Detectar profundidade
  if (/profund/i.test(texto)) {
    achados.temProfundidade = true;
    if (/superficial/i.test(texto)) {
      achados.profundidade = 'Superficial';
    } else if (/intermediária|intermediaria/i.test(texto)) {
      achados.profundidade = 'Intermediária';
    } else if (/profund/i.test(texto)) {
      achados.profundidade = 'Profunda';
    }
  }

  // Detectar localização (ovário direito/esquerdo)
  if (/ovário\s*direito|ovário\s*d|OD/i.test(texto)) {
    achados.localizacao = 'Ovário Direito';
  } else if (/ovário\s*esquerdo|ovário\s*e|OE/i.test(texto)) {
    achados.localizacao = 'Ovário Esquerdo';
  } else if (/ligamento|tuba|útero/i.test(texto)) {
    const match = texto.match(/ligamento|tuba|útero/i);
    achados.localizacao = match ? match[0] : undefined;
  }

  // Detectar tamanho (padrão: número + unidade)
  const sizeMatch = texto.match(/(\d+[\.,]?\d*)\s*(cm|mm|x)/i);
  if (sizeMatch) {
    achados.tamanho = sizeMatch[0].trim();
  }

  return achados;
};

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

type EstadoMicrofone = 'inativo' | 'gravando' | 'processando' | 'concluido';
type SuporteBrowser = 'suportado' | 'parcial' | 'nao-suportado';

// Função para detectar navegador e suporte
const detectarNavegadorESuporte = (): { navegador: string; suporte: SuporteBrowser; mensagem: string } => {
  const ua = navigator.userAgent.toLowerCase();
  
  // Detecção de navegador
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
        return JSON.parse(laudoSalvo);
      } catch {
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

  const formatarLesao = (lesao: any): string => {
    if (typeof lesao === 'string') return lesao;
    return `${lesao.tipo || ''} ${lesao.tamanho || ''} ${lesao.localizacao || ''}`.trim();
  };

  useEffect(() => {
    // Detectar navegador e suporte
    const info = detectarNavegadorESuporte();
    setInfoNavegador(info);

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setSuporteMicrofone('nao-suportado');
      setError(`${info.mensagem} - Digitação manual ativada`);
      return;
    }

    // Mostrar modal de privacidade primeira vez
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
    // Verificar se suporte é nenhum
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

    // Iniciar contador de tempo
    timerRef.current = setInterval(() => {
      setContadorTempo((prev) => {
        if (prev >= 300) {
          pararGravacao();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    // Iniciar animação de ondas sonoras
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

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (ondaRef.current) clearInterval(ondaRef.current);
    };
  }, []);

  const formatarLaudo = () => {
    const formatarObjeto = (obj: any, nivel: number = 0): string => {
      if (!obj || typeof obj !== 'object') return String(obj || '');
      
      const indent = '  '.repeat(nivel);
      const linhas: string[] = [];
      
      for (const [chave, valor] of Object.entries(obj)) {
        const chaveFormatada = chave.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        if (Array.isArray(valor)) {
          if (valor.length > 0) {
            const itens = valor.map((item: any) => 
              typeof item === 'string' ? item : Object.values(item).filter(Boolean).join(' ')
            ).join(', ');
            linhas.push(`${indent}• ${chaveFormatada}: ${itens}`);
          } else {
            linhas.push(`${indent}• ${chaveFormatada}: Nenhum`);
          }
        } else if (typeof valor === 'object' && valor !== null) {
          linhas.push(`${indent}[${chaveFormatada.toUpperCase()}]`);
          linhas.push(formatarObjeto(valor, nivel + 1));
        } else {
          linhas.push(`${indent}• ${chaveFormatada}: ${valor || '-'}`);
        }
      }
      
      return linhas.filter(l => l.trim()).join('\n');
    };

    return formatarObjeto(laudo);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Indicador de Microfone Ativo */}
      {microfoneAtivo && (
        <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-2 text-sm font-semibold z-30 animate-pulse-micro">
          <Mic className="w-4 h-4" />
          Microfone ativo - gravando...
        </div>
      )}

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

        <div className="flex items-center gap-4">
          <Button
            onClick={() => window.location.href = '/modelos'}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
            data-testid="button-carregar-modelo"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Carregar Modelo
          </Button>
          <div className="text-right pr-4 border-r border-slate-200">
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
                {/* Estados do Botão de Microfone */}
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
                    {/* Animação de Onda Sonora */}
                    <div className="flex items-end gap-1 h-10 justify-center">
                      {alturaOndas.map((altura, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-600 rounded-full transition-all"
                          style={{ height: `${altura}%` }}
                        />
                      ))}
                    </div>
                    {/* Contador de Tempo */}
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

            {/* Card de Validação Clínica */}
            {achados && (achados.temEndometrioma || achados.temMioma || achados.temProfundidade || achados.tamanho) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 mb-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  Validação Clínica da Transcrição
                </h3>

                {/* Transcrição Detectada */}
                <div className="mb-4 pb-4 border-b border-blue-200">
                  <p className="text-xs text-slate-600 font-medium mb-2">Transcrição Detectada:</p>
                  <p className="text-sm text-slate-700 bg-white rounded px-3 py-2 border border-blue-100">
                    {achados.transcricao}
                  </p>
                </div>

                {/* Achados Reconhecidos */}
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

                {/* Pergunta de Validação */}
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

                {/* Botões de Ação */}
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

          {/* Sugestões da IA Card */}
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
                        className="w-4 h-4 mt-1 accent-amber-600"
                        data-testid={`checkbox-sugestao-${idx}`}
                      />
                    </div>
                    {sugestao.valor_sugerido && (
                      <div className="bg-amber-50 rounded p-2 text-xs text-amber-800 mb-2 font-mono">
                        {sugestao.valor_sugerido}
                      </div>
                    )}
                    <p className="text-xs text-slate-600 italic">
                      ⚠️ Sugestão não aplicada automaticamente - você decide
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    const aprovadas = Object.entries(sugestoesAprovadas)
                      .filter(([_, aprovado]) => aprovado)
                      .map(([idx]) => sugestoesIA[parseInt(idx)]);
                    if (aprovadas.length > 0) {
                      setSucesso(true);
                      setTimeout(() => setSucesso(false), 2000);
                    }
                  }}
                  className="flex-1 h-9 bg-amber-600 text-white hover:bg-amber-700 text-sm"
                  data-testid="button-aplicar-sugestoes"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Aplicar Selecionadas
                </Button>
                <Button
                  onClick={() => setSugestoesIA([])}
                  variant="outline"
                  className="flex-1 h-9 border-amber-300 text-amber-700 hover:bg-amber-50 text-sm"
                  data-testid="button-descartar-sugestoes"
                >
                  <X className="w-3 h-3 mr-1" />
                  Descartar
                </Button>
              </div>
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

      {/* Modal de Privacidade */}
      {modalPrivacidade && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <Shield className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">⚠️ PERMISSÃO DE MICROFONE</h3>
                  <p className="text-xs text-slate-500 mt-1">Este app solicita acesso ao seu microfone</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 bg-slate-50 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Seus dados de voz <strong>NÃO são armazenados</strong></p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Apenas <strong>texto</strong> é enviado para análise</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Cumpre <strong>LGPD</strong> e regulações médicas</p>
                </div>
              </div>

              {infoNavegador && infoNavegador.suporte === 'nao-suportado' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Aviso:</strong> {infoNavegador.mensagem}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setModalPrivacidade(false);
                  }}
                  variant="outline"
                  className="flex-1 h-10 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Recusar
                </Button>
                <Button
                  onClick={() => {
                    localStorage.setItem('privacidade_microfone_aceita', 'true');
                    setModalPrivacidade(false);
                  }}
                  className="flex-1 h-10 bg-green-600 text-white hover:bg-green-700"
                >
                  Permitir
                </Button>
              </div>
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
