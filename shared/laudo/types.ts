export interface LaudoData {
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
    miomas: LesaoData[];
  };
  ovario_direito: OvarioData;
  ovario_esquerdo: OvarioData;
  compartimentos: {
    anterior: CompartimentoAnterior;
    medial: CompartimentoMedial;
    posterior: CompartimentoPosterior;
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

export interface OvarioData {
  localizacao: string;
  forma: string;
  limites: string;
  parenchima: string;
  biometria: string;
  lesoes: LesaoData[];
}

export interface LesaoData {
  tipo?: string;
  tamanho?: string;
  localizacao?: string;
  descricao?: string;
}

export interface CompartimentoAnterior {
  parede_vesical: string;
  espaco_vesico_uterino: string;
  sinal_deslizamento_anterior: string;
  achados_endometriose: string;
}

export interface CompartimentoMedial {
  superficie_uterina: string;
  ligamentos_redondos: string;
  tubas_uterinas: string;
  ovarios: string;
  achados_endometriose: string;
}

export interface CompartimentoPosterior {
  septo_retovaginal: string;
  frnice_vaginal: string;
  retossigmoide: string;
  ligamentos_utero_sacros: string;
  regiao_retro_cervical: string;
  sinal_deslizamento_posterior: string;
  achados_endometriose: string;
}

export interface ModeloLaudo {
  id: string;
  nome: string;
  tipo: 'sistema' | 'pessoal';
  descricao: string;
  data_criacao: string;
  data_edicao: string;
  json_laudo: LaudoData;
  uso_count: number;
}

export interface AchadosDetectados {
  temEndometrioma: boolean;
  temMioma: boolean;
  temProfundidade: boolean;
  profundidade?: string;
  localizacao?: string;
  tamanho?: string;
  transcricao: string;
}
