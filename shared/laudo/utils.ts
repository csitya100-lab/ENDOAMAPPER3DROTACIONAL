import type { LaudoData, AchadosDetectados, LesaoData } from './types';

export const converterNumerosParaDigitos = (texto: string): string => {
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

  resultado = resultado.replace(/\bponto\b/gi, '.');
  resultado = resultado.replace(/\bvírgula\b/gi, '.');
  resultado = resultado.replace(/\bvirgula\b/gi, '.');
  resultado = resultado.replace(/\bpor\b/gi, 'x');
  resultado = resultado.replace(/\bvezes\b/gi, 'x');

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

  resultado = resultado.replace(/\s*x\s*/gi, ' x ');
  resultado = resultado.replace(/\bcentímetros\b/gi, 'cm');
  resultado = resultado.replace(/\bcentímetro\b/gi, 'cm');
  resultado = resultado.replace(/\bcentimetros\b/gi, 'cm');
  resultado = resultado.replace(/\bcentimetro\b/gi, 'cm');
  resultado = resultado.replace(/\bmilímetros\b/gi, 'mm');
  resultado = resultado.replace(/\bmilímetro\b/gi, 'mm');
  resultado = resultado.replace(/\bmilimetros\b/gi, 'mm');
  resultado = resultado.replace(/\bmilimetro\b/gi, 'mm');

  return resultado;
};

export const detectarAchados = (texto: string): AchadosDetectados => {
  const achados: AchadosDetectados = {
    temEndometrioma: false,
    temMioma: false,
    temProfundidade: false,
    transcricao: texto,
  };

  if (/endometrioma/i.test(texto)) {
    achados.temEndometrioma = true;
  }

  if (/mioma|fibroma/i.test(texto)) {
    achados.temMioma = true;
  }

  const profundidadeMatch = texto.match(/(\d+(?:[.,]\d+)?)\s*(?:mm|milímetros?|milimetros?)\s*(?:de\s+)?profundidade/i);
  if (profundidadeMatch) {
    achados.temProfundidade = true;
    achados.profundidade = profundidadeMatch[1] + ' mm';
  }

  const tamanhoMatch = texto.match(/(\d+(?:[.,]\d+)?)\s*(?:x|por)\s*(\d+(?:[.,]\d+)?)\s*(?:x|por)?\s*(\d+(?:[.,]\d+)?)?\s*(?:mm|cm)/i);
  if (tamanhoMatch) {
    achados.tamanho = tamanhoMatch[0];
  }

  return achados;
};

export const formatarLesao = (lesao: LesaoData | string): string => {
  if (typeof lesao === 'string') return lesao;
  return `${lesao.tipo || ''} ${lesao.tamanho || ''} ${lesao.localizacao || ''}`.trim();
};

export const formatarLaudo = (laudo: LaudoData): string => {
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

export const validarLaudo = (laudo: any): laudo is LaudoData => {
  return (
    laudo &&
    typeof laudo === 'object' &&
    laudo.estruturas &&
    laudo.compartimentos &&
    laudo.utero &&
    laudo.cabecalho &&
    laudo.equipamento
  );
};

export const carregarLaudoDoStorage = (laudoPadrao: LaudoData): LaudoData => {
  const laudoSalvo = localStorage.getItem('laudo_atual');
  if (laudoSalvo) {
    try {
      const parsed = JSON.parse(laudoSalvo);
      if (validarLaudo(parsed)) {
        return parsed;
      }
      localStorage.removeItem('laudo_atual');
    } catch {
      localStorage.removeItem('laudo_atual');
    }
  }
  return laudoPadrao;
};

export const salvarLaudoNoStorage = (laudo: LaudoData): void => {
  localStorage.setItem('laudo_atual', JSON.stringify(laudo));
};
