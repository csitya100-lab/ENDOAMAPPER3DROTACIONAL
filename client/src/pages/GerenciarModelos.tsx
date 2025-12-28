import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText, Plus, Copy, Trash2, Edit3, Check, X, Download, Upload, Clipboard } from 'lucide-react';

interface ModeloLaudo {
  id: string;
  nome: string;
  tipo: 'sistema' | 'pessoal';
  descricao: string;
  data_criacao: string;
  data_edicao: string;
  json_laudo: any;
  uso_count: number;
}

const LAUDO_PADRAO = {
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

const MODELOS_SISTEMA: ModeloLaudo[] = [
  {
    id: 'sistema-1',
    nome: 'Modelo Padrão (Endometriose)',
    tipo: 'sistema',
    descricao: 'Estrutura base original do sistema para mapeamento de endometriose.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: LAUDO_PADRAO,
    uso_count: 0,
  },
  {
    id: 'sistema-2',
    nome: 'Laudo Normal (Sem Achados)',
    tipo: 'sistema',
    descricao: 'Template limpo para exames sem achados patológicos.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: { ...LAUDO_PADRAO, conclusao: 'Exame ultrassonográfico dentro dos limites da normalidade.' },
    uso_count: 0,
  },
  {
    id: 'sistema-3',
    nome: 'Obstetrícia 1º Trimestre',
    tipo: 'sistema',
    descricao: 'Template para avaliação obstétrica do primeiro trimestre.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: { ...LAUDO_PADRAO, cabecalho: { ...LAUDO_PADRAO.cabecalho, tipo_exame: 'Ultrassonografia Obstétrica 1º Trimestre' } },
    uso_count: 0,
  },
  {
    id: 'sistema-4',
    nome: 'Obstetrícia 2º Trimestre',
    tipo: 'sistema',
    descricao: 'Template para avaliação morfológica do segundo trimestre.',
    data_criacao: '2025-01-01T00:00:00Z',
    data_edicao: '2025-01-01T00:00:00Z',
    json_laudo: { ...LAUDO_PADRAO, cabecalho: { ...LAUDO_PADRAO.cabecalho, tipo_exame: 'Ultrassonografia Morfológica 2º Trimestre' } },
    uso_count: 0,
  },
];

export default function GerenciarModelos() {
  const [modelos, setModelos] = useState<ModeloLaudo[]>([]);
  const [nomeNovoModelo, setNomeNovoModelo] = useState('');
  const [jsonImport, setJsonImport] = useState('');
  const [modalEditar, setModalEditar] = useState<ModeloLaudo | null>(null);
  const [jsonEditando, setJsonEditando] = useState('');
  const [erroJson, setErroJson] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [modalConfirmDelete, setModalConfirmDelete] = useState<ModeloLaudo | null>(null);

  useEffect(() => {
    const salvos = localStorage.getItem('modelos_laudo');
    if (salvos) {
      const parsed = JSON.parse(salvos);
      setModelos([...MODELOS_SISTEMA, ...parsed.filter((m: ModeloLaudo) => m.tipo === 'pessoal')]);
    } else {
      setModelos(MODELOS_SISTEMA);
    }
  }, []);

  const salvarModelos = (novosModelos: ModeloLaudo[]) => {
    const pessoais = novosModelos.filter(m => m.tipo === 'pessoal');
    localStorage.setItem('modelos_laudo', JSON.stringify(pessoais));
    const sistemaAtualizados = novosModelos.filter(m => m.tipo === 'sistema');
    setModelos([...sistemaAtualizados, ...pessoais]);
  };

  const usarModelo = (modelo: ModeloLaudo) => {
    localStorage.setItem('laudo_atual', JSON.stringify(modelo.json_laudo));
    const atualizado = modelos.map(m => m.id === modelo.id ? { ...m, uso_count: m.uso_count + 1 } : m);
    salvarModelos(atualizado);
    setSucesso('Modelo carregado! Redirecionando...');
    setTimeout(() => {
      window.location.href = '/ditado-ia';
    }, 1000);
  };

  const duplicarModelo = (modelo: ModeloLaudo) => {
    const novoModelo: ModeloLaudo = {
      id: `pessoal-${Date.now()}`,
      nome: `Cópia de ${modelo.nome}`,
      tipo: 'pessoal',
      descricao: modelo.descricao,
      data_criacao: new Date().toISOString(),
      data_edicao: new Date().toISOString(),
      json_laudo: JSON.parse(JSON.stringify(modelo.json_laudo)),
      uso_count: 0,
    };
    salvarModelos([...modelos, novoModelo]);
    setSucesso('Modelo duplicado com sucesso!');
    setTimeout(() => setSucesso(null), 2000);
  };

  const deletarModelo = (modelo: ModeloLaudo) => {
    salvarModelos(modelos.filter(m => m.id !== modelo.id));
    setModalConfirmDelete(null);
    setSucesso('Modelo deletado!');
    setTimeout(() => setSucesso(null), 2000);
  };

  const abrirEditor = (modelo: ModeloLaudo) => {
    setModalEditar(modelo);
    setJsonEditando(JSON.stringify(modelo.json_laudo, null, 2));
    setErroJson(null);
  };

  const salvarEdicao = () => {
    if (!modalEditar) return;
    try {
      const parsed = JSON.parse(jsonEditando);
      const atualizado = modelos.map(m => 
        m.id === modalEditar.id 
          ? { ...m, json_laudo: parsed, data_edicao: new Date().toISOString() } 
          : m
      );
      salvarModelos(atualizado);
      setModalEditar(null);
      setSucesso('Modelo atualizado!');
      setTimeout(() => setSucesso(null), 2000);
    } catch (e) {
      setErroJson('JSON inválido. Verifique a sintaxe.');
    }
  };

  const salvarLaudoAtualComoModelo = () => {
    if (!nomeNovoModelo.trim()) {
      setErroJson('Digite um nome para o modelo');
      return;
    }
    const laudoAtual = localStorage.getItem('laudo_atual');
    const jsonLaudo = laudoAtual ? JSON.parse(laudoAtual) : LAUDO_PADRAO;
    
    const novoModelo: ModeloLaudo = {
      id: `pessoal-${Date.now()}`,
      nome: nomeNovoModelo.trim(),
      tipo: 'pessoal',
      descricao: 'Modelo criado a partir do laudo atual.',
      data_criacao: new Date().toISOString(),
      data_edicao: new Date().toISOString(),
      json_laudo: jsonLaudo,
      uso_count: 0,
    };
    salvarModelos([...modelos, novoModelo]);
    setNomeNovoModelo('');
    setErroJson(null);
    setSucesso('Modelo salvo com sucesso!');
    setTimeout(() => setSucesso(null), 2000);
  };

  const importarJson = () => {
    if (!jsonImport.trim()) {
      setErroJson('Cole um JSON válido');
      return;
    }
    try {
      const parsed = JSON.parse(jsonImport);
      const novoModelo: ModeloLaudo = {
        id: `pessoal-${Date.now()}`,
        nome: `Importado ${new Date().toLocaleDateString('pt-BR')}`,
        tipo: 'pessoal',
        descricao: 'Modelo importado via JSON.',
        data_criacao: new Date().toISOString(),
        data_edicao: new Date().toISOString(),
        json_laudo: parsed,
        uso_count: 0,
      };
      salvarModelos([...modelos, novoModelo]);
      setJsonImport('');
      setErroJson(null);
      setSucesso('JSON importado com sucesso!');
      setTimeout(() => setSucesso(null), 2000);
    } catch (e) {
      setErroJson('JSON inválido. Verifique a sintaxe.');
    }
  };

  const formatarData = (iso: string) => {
    return new Date(iso).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/'}
            className="text-slate-600 hover:text-slate-900"
            data-testid="button-voltar-inicio"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar ao início
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-8">
          <Clipboard className="w-7 h-7 text-slate-700" />
          <h1 className="text-2xl font-bold text-slate-900">Gerenciar Modelos</h1>
        </div>

        {sucesso && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">{sucesso}</p>
          </div>
        )}

        {erroJson && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <X className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{erroJson}</p>
            <Button variant="ghost" size="sm" onClick={() => setErroJson(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Meus Modelos</h2>
            {modelos.map((modelo) => (
              <div 
                key={modelo.id} 
                className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                data-testid={`card-modelo-${modelo.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <h3 className="font-semibold text-slate-900">{modelo.nome}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      modelo.tipo === 'sistema' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {modelo.tipo === 'sistema' ? 'Sistema' : 'Pessoal'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Usado {modelo.uso_count}x</span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{modelo.descricao}</p>
                <p className="text-xs text-slate-400 mb-4">Criado: {formatarData(modelo.data_criacao)}</p>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="sm" 
                    onClick={() => usarModelo(modelo)}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    data-testid={`button-usar-${modelo.id}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Usar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => abrirEditor(modelo)}
                    className="border-slate-300 text-slate-700"
                    data-testid={`button-editar-${modelo.id}`}
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => duplicarModelo(modelo)}
                    className="border-slate-300 text-slate-700"
                    data-testid={`button-duplicar-${modelo.id}`}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Duplicar
                  </Button>
                  {modelo.tipo === 'pessoal' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setModalConfirmDelete(modelo)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      data-testid={`button-deletar-${modelo.id}`}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Del
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Salvar Laudo Atual como Modelo
              </h2>
              <input
                type="text"
                value={nomeNovoModelo}
                onChange={(e) => setNomeNovoModelo(e.target.value)}
                placeholder="Nome do novo modelo (ex: Template Novo)"
                className="w-full p-3 border border-slate-200 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                data-testid="input-nome-novo-modelo"
              />
              <p className="text-xs text-slate-500 mb-4">
                ⚠️ O texto editado no laudo atual será salvo como padrão para este novo modelo.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNomeNovoModelo('')}
                  className="flex-1 border-slate-300"
                  data-testid="button-cancelar-salvar-modelo"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  onClick={salvarLaudoAtualComoModelo}
                  className="flex-1 bg-pink-600 text-white hover:bg-pink-700"
                  data-testid="button-salvar-modelo"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Salvar Modelo
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Importar JSON (Avançado)
              </h2>
              <textarea
                value={jsonImport}
                onChange={(e) => setJsonImport(e.target.value)}
                placeholder="Cole a estrutura JSON aqui..."
                className="w-full h-32 p-3 border border-slate-200 rounded-lg mb-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                data-testid="textarea-importar-json"
              />
              <Button 
                onClick={importarJson}
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-importar-json"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar Estrutura
              </Button>
            </div>
          </div>
        </div>
      </main>

      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Editar Modelo: {modalEditar.nome}</h3>
              <Button variant="ghost" size="icon" onClick={() => setModalEditar(null)} data-testid="button-fechar-modal-editar">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <textarea
                value={jsonEditando}
                onChange={(e) => setJsonEditando(e.target.value)}
                className="w-full h-96 p-4 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                data-testid="textarea-editar-json"
              />
              {erroJson && (
                <p className="text-sm text-red-600 mt-2">{erroJson}</p>
              )}
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-200">
              <Button variant="outline" onClick={() => setModalEditar(null)} className="flex-1" data-testid="button-cancelar-edicao">
                Cancelar
              </Button>
              <Button onClick={salvarEdicao} className="flex-1 bg-green-600 text-white hover:bg-green-700" data-testid="button-salvar-edicao">
                <Check className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}

      {modalConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirmar exclusão</h3>
            <p className="text-sm text-slate-600 mb-6">
              Deseja deletar o modelo <strong>"{modalConfirmDelete.nome}"</strong>? Esta ação é irreversível.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalConfirmDelete(null)} className="flex-1" data-testid="button-cancelar-exclusao">
                Cancelar
              </Button>
              <Button 
                onClick={() => deletarModelo(modalConfirmDelete)} 
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                data-testid="button-confirmar-exclusao"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
