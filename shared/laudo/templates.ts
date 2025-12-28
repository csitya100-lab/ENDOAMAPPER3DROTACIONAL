import type { LaudoData, ModeloLaudo } from './types';

export const LAUDO_PADRAO: LaudoData = {
  cabecalho: {
    nome_medico: 'Dr(a). _______________',
    data: new Date().toLocaleDateString('pt-BR'),
    tipo_exame: 'Ultrassonografia Transvaginal para Mapeamento de Endometriose',
  },
  equipamento: {
    nome: 'Aparelho de ultrassonografia de alta resolução',
    vias: 'Transvaginal',
    tecnicas: 'Técnica padrão com preparo intestinal',
  },
  estruturas: {
    uretra: { descricao: 'Íntegra, sem espessamentos ou lesões' },
    bexiga: { descricao: 'Paredes finas e regulares, conteúdo anecóico' },
    vagina: { descricao: 'Paredes regulares, sem nodulações' },
  },
  utero: {
    posicao: 'Anteversoflexão (AVF)',
    forma: 'Piriforme',
    contornos: 'Regulares',
    paredes: 'Simétricas',
    miometrio: 'Homogêneo, sem nódulos',
    biometria: 'Normal para a idade',
    eco_endometrial: 'Trilaminar',
    linha_media: 'Central',
    juncao_endometrio_miometrio: 'Regular',
    padrao: 'Normal',
    espessura_endometrial: 'Compatível com fase do ciclo',
    miomas: [],
  },
  ovario_direito: {
    localizacao: 'Posição habitual em fossa ilíaca direita',
    forma: 'Oval',
    limites: 'Precisos',
    parenchima: 'Homogêneo com folículos',
    biometria: 'Dentro da normalidade',
    lesoes: [],
  },
  ovario_esquerdo: {
    localizacao: 'Posição habitual em fossa ilíaca esquerda',
    forma: 'Oval',
    limites: 'Precisos',
    parenchima: 'Homogêneo com folículos',
    biometria: 'Dentro da normalidade',
    lesoes: [],
  },
  compartimentos: {
    anterior: {
      parede_vesical: 'Sem implantes ou espessamentos',
      espaco_vesico_uterino: 'Livre',
      sinal_deslizamento_anterior: 'Positivo',
      achados_endometriose: 'Não',
    },
    medial: {
      superficie_uterina: 'Lisa, sem implantes',
      ligamentos_redondos: 'Sem achados',
      tubas_uterinas: 'Não visualizadas (normal)',
      ovarios: 'Em posição habitual',
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

export const LAUDO_NORMAL: LaudoData = {
  ...LAUDO_PADRAO,
  cabecalho: {
    ...LAUDO_PADRAO.cabecalho,
    tipo_exame: 'Ultrassonografia Transvaginal de Rotina',
  },
  conclusao: 'Exame ultrassonográfico transvaginal dentro dos limites da normalidade. Ausência de achados patológicos.',
};

export const LAUDO_OBSTETRICO_1T: LaudoData = {
  ...LAUDO_PADRAO,
  cabecalho: {
    ...LAUDO_PADRAO.cabecalho,
    tipo_exame: 'Ultrassonografia Obstétrica 1º Trimestre',
  },
  equipamento: {
    ...LAUDO_PADRAO.equipamento,
    vias: 'Transvaginal e/ou Transabdominal',
    tecnicas: 'Técnica padrão obstétrica',
  },
  conclusao: 'Gestação tópica, única, com embrião vivo. Idade gestacional compatível com ___ semanas.',
};

export const LAUDO_OBSTETRICO_2T: LaudoData = {
  ...LAUDO_PADRAO,
  cabecalho: {
    ...LAUDO_PADRAO.cabecalho,
    tipo_exame: 'Ultrassonografia Morfológica 2º Trimestre',
  },
  equipamento: {
    ...LAUDO_PADRAO.equipamento,
    vias: 'Transabdominal',
    tecnicas: 'Avaliação morfológica fetal detalhada',
  },
  conclusao: 'Gestação única, tópica, com feto vivo. Biometria compatível com ___ semanas. Morfologia fetal sem alterações evidentes ao método.',
};

export const MODELOS_SISTEMA: ModeloLaudo[] = [
  {
    id: 'sistema-1',
    nome: 'Mapeamento de Endometriose',
    tipo: 'sistema',
    descricao: 'Template completo para avaliação de endometriose profunda com todos os compartimentos.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: LAUDO_PADRAO,
    uso_count: 0,
  },
  {
    id: 'sistema-2',
    nome: 'US Transvaginal Normal',
    tipo: 'sistema',
    descricao: 'Template simplificado para exames ginecológicos de rotina sem achados patológicos.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: LAUDO_NORMAL,
    uso_count: 0,
  },
  {
    id: 'sistema-3',
    nome: 'Obstetrícia 1º Trimestre',
    tipo: 'sistema',
    descricao: 'Template para avaliação obstétrica inicial com datação e vitalidade.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: LAUDO_OBSTETRICO_1T,
    uso_count: 0,
  },
  {
    id: 'sistema-4',
    nome: 'Morfológico 2º Trimestre',
    tipo: 'sistema',
    descricao: 'Template completo para avaliação morfológica fetal detalhada.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: LAUDO_OBSTETRICO_2T,
    uso_count: 0,
  },
];
