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

export const LAUDO_MAPEAMENTO_ENDOMETRIOSE_2: LaudoData = {
  cabecalho: {
    nome_medico: 'Dr(a). _______________',
    data: new Date().toLocaleDateString('pt-BR'),
    tipo_exame: 'Ultrassonografia para Mapeamento de Endometriose com Preparo Intestinal',
  },
  equipamento: {
    nome: 'Aparelho de ultrassonografia de alta resolução',
    vias: 'Transvaginal e Transabdominal (se necessário para rins/diafragma)',
    tecnicas: 'Exame realizado após preparo intestinal, com manobras dinâmicas (sinal do deslizamento) para pesquisa de endometriose profunda e aderências',
  },
  estruturas: {
    uretra: { descricao: 'Íntegra, sem espessamentos ou lesões' },
    bexiga: { descricao: 'Paredes finas e regulares, sem nódulos ou alterações em parede posterior/domo vesical' },
    vagina: { descricao: 'Paredes regulares, sem nodulações ou implantes' },
  },
  utero: {
    posicao: '[Anteversoflexão/Retroversoflexão/Retroversão fixa]',
    forma: '[Regular/Globosa/Assimétrica]',
    contornos: '[Regulares/Irregulares]',
    paredes: '[Simétricas/Assimétricas]',
    miometrio: '[Homogêneo/Heterogêneo com cistos miometriais, ilhas hiperecogênicas, estrias lineares subendometriais ou espessamento assimétrico]',
    biometria: '[X x X x X] cm',
    eco_endometrial: '[Proliferativo/Secretor]',
    linha_media: 'Central',
    juncao_endometrio_miometrio: '[Regular/Irregular]',
    padrao: '[Normal/Achados sugestivos de adenomiose]',
    espessura_endometrial: '[X] mm',
    miomas: [],
  },
  ovario_direito: {
    localizacao: 'Fossa ilíaca direita [móvel/reduzido/fixo]',
    forma: 'Oval',
    limites: 'Precisos',
    parenchima: '[Homogêneo com folículos/Com cisto unilocular de conteúdo vidro fosco]',
    biometria: '[X x X x X] cm, Volume [X] cm³',
    lesoes: [
      {
        tipo: 'Endometrioma (se presente)',
        tamanho: '[X] cm',
        descricao: 'Cisto unilocular com conteúdo em vidro fosco, sem fluxo ao Doppler',
      },
    ],
  },
  ovario_esquerdo: {
    localizacao: 'Fossa ilíaca esquerda [móvel/reduzido/fixo]',
    forma: 'Oval',
    limites: 'Precisos',
    parenchima: '[Homogêneo com folículos/Com cisto unilocular de conteúdo vidro fosco]',
    biometria: '[X x X x X] cm, Volume [X] cm³',
    lesoes: [
      {
        tipo: 'Kissing Ovaries (se presente)',
        descricao: 'Ovários retrouterinos aderidos na linha média',
      },
    ],
  },
  compartimentos: {
    anterior: {
      parede_vesical: '[Paredes normais/Nódulo hipoecogênico invadindo muscular (detrusor), distando X cm dos meatos ureterais]',
      espaco_vesico_uterino: '[Livre/Obliteração parcial ou total]',
      sinal_deslizamento_anterior: '[Positivo/Negativo]',
      achados_endometriose: '[Não/Sim - detalhar]',
    },
    medial: {
      superficie_uterina: '[Lisa, sem implantes/Com implantes]',
      ligamentos_redondos: '[Normais/Espessados com nódulos]',
      tubas_uterinas: '[Não visualizadas/Visualizadas normalmente]',
      ovarios: '[Posição habitual/Retrouterinos aderidos]',
      achados_endometriose: '[Não/Sim - detalhar paramétrios, espessamentos/nódulos laterais]',
    },
    posterior: {
      septo_retovaginal: '[Sem sinais/Com espessamento ou nódulo hipoecogênico irregular medindo X cm]',
      frnice_vaginal: '[Normal/Com retração/Fibrótica]',
      retossigmoide: '[Normal/Com lesão hipoecogênica irregular ("comet tail" ou "mushroom cap"), medindo X cm]',
      ligamentos_utero_sacros: '[Direito: Normal/Espessado/Nódulo X cm] [Esquerdo: Normal/Espessado/Nódulo X cm]',
      regiao_retro_cervical: '[Normal/Com espessamento ou nódulo]',
      sinal_deslizamento_posterior: '[Positivo/Negativo - indica obliteração do fundo de saco de Douglas]',
      achados_endometriose: '[Não/Sim - Infiltração em serosa/muscular própria/submucosa, compromete X% da alça]',
    },
  },
  rins_ureteres: {
    rins: '[Sem hidronefrose/Hidronefrose à direita/esquerda]',
    ureteres_terminais: '[Calibre preservado/Dilatação ureteral/Nódulo periureteral]',
  },
  parede_abdominal: {
    regiao_umbilical: '[Sem alterações/Nódulo em cicatriz de cesárea medindo X cm]',
    parede_abdominal: '[Sem alterações/Diafragma ou parede com achados de endometriose]',
  },
  conclusao: '1. Mapeamento [POSITIVO/NEGATIVO] para endometriose profunda, acometendo os compartimentos [anterior/medial/posterior].\n2. Sinais [compatíveis/não compatíveis] com adenomiose [difusa/focal].\n3. Classificação de Risco (APU): [APU-1/APU-2/APU-3] - [Negativo/Indeterminado/Positivo para Endometriose].',
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
  {
    id: 'sistema-5',
    nome: 'Mapeamento de endometriose 2',
    tipo: 'sistema',
    descricao: 'Template estruturado com análise MUSA, IOTA/O-RADS e sistemática IDEA para mapeamento detalhado de endometriose profunda por compartimentos.',
    data_criacao: new Date().toISOString(),
    data_edicao: new Date().toISOString(),
    json_laudo: LAUDO_MAPEAMENTO_ENDOMETRIOSE_2,
    uso_count: 0,
  },
];
