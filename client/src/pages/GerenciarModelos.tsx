import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Copy, Trash2, Edit3, Check, X, Download, Upload, Clipboard } from 'lucide-react';
import { 
  type ModeloLaudo, 
  LAUDO_PADRAO, 
  MODELOS_SISTEMA 
} from '@shared/laudo';
import AppLayout from '@/components/AppLayout';

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
    <AppLayout 
      title="Gerenciar Modelos" 
      subtitle="Templates de laudos médicos"
    >
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
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
        </div>
      </div>

      {modalEditar && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModalEditar(null)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Editar Modelo: {modalEditar.nome}</h3>
              <button 
                type="button"
                onClick={() => setModalEditar(null)} 
                className="p-2 text-slate-600 hover:bg-slate-200 hover:text-slate-900 rounded-full transition-colors"
                data-testid="button-fechar-modal-editar"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-white">
              <textarea
                value={jsonEditando}
                onChange={(e) => setJsonEditando(e.target.value)}
                className="w-full h-96 p-4 border-2 border-slate-300 rounded-lg font-mono text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                data-testid="textarea-editar-json"
                spellCheck={false}
              />
              {erroJson && (
                <p className="text-sm text-red-600 mt-3 font-semibold" data-testid="text-erro-json">{erroJson}</p>
              )}
            </div>
            <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
              <button 
                type="button"
                onClick={() => setModalEditar(null)} 
                className="flex-1 px-4 py-2 border-2 border-slate-400 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 hover:border-slate-500 transition-colors"
                data-testid="button-cancelar-edicao"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={salvarEdicao} 
                className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                data-testid="button-salvar-edicao"
              >
                <Check className="w-4 h-4" />
                Salvar Alterações
              </button>
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
    </AppLayout>
  );
}
