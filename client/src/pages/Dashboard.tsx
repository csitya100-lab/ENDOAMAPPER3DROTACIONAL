import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, MapPin, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ExamRecord {
  id: string;
  patient: string;
  date: string;
  type: string;
  status: 'Em andamento' | 'Concluído' | 'Pendente' | 'Cancelado';
  severity: 'low' | 'medium' | 'high';
}

const EXAM_RECORDS: ExamRecord[] = [
  {
    id: '001',
    patient: 'Maria Silva',
    date: '2024-12-27',
    type: 'Mapeamento completo',
    status: 'Em andamento',
    severity: 'medium',
  },
  {
    id: '002',
    patient: 'Ana Costa',
    date: '2024-12-26',
    type: 'Acompanhamento',
    status: 'Concluído',
    severity: 'low',
  },
  {
    id: '003',
    patient: 'Paula Oliveira',
    date: '2024-12-25',
    type: 'Mapeamento completo',
    status: 'Pendente',
    severity: 'high',
  },
  {
    id: '004',
    patient: 'Jennifer Santos',
    date: '2024-12-24',
    type: 'Acompanhamento',
    status: 'Concluído',
    severity: 'low',
  },
  {
    id: '005',
    patient: 'Camila Ribeiro',
    date: '2024-12-23',
    type: 'Mapeamento completo',
    status: 'Concluído',
    severity: 'high',
  },
  {
    id: '006',
    patient: 'Juliana Mendes',
    date: '2024-12-22',
    type: 'Acompanhamento',
    status: 'Em andamento',
    severity: 'medium',
  },
];

const FLOW_STEPS = [
  { number: 1, title: 'Mapear 3D/2D', description: 'Posicione as lesões nas vistas 3D e 2D' },
  { number: 2, title: 'Salvar Vistas', description: 'Confirme e salve o mapeamento completo' },
  { number: 3, title: 'Gerar Relatório', description: 'Crie e exporte o relatório clínico' },
];

export default function Dashboard() {
  const [exams] = useState<ExamRecord[]>(EXAM_RECORDS);

  const stats = {
    inProgress: exams.filter(e => e.status === 'Em andamento').length,
    completed: exams.filter(e => e.status === 'Concluído').length,
    pending: exams.filter(e => e.status === 'Pendente').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return 'bg-blue-500/10 text-blue-600 border-blue-300';
      case 'Concluído':
        return 'bg-green-500/10 text-green-600 border-green-300';
      case 'Pendente':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-300';
      case 'Cancelado':
        return 'bg-red-500/10 text-red-600 border-red-300';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return <Clock className="w-4 h-4" />;
      case 'Concluído':
        return <CheckCircle className="w-4 h-4" />;
      case 'Pendente':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex-none bg-white border-b border-slate-200 shadow-sm px-8 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">EndoAcolhe</h1>
            <p className="text-xs text-slate-600">Pelvis Mapper 3D/2D</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">Dr. Cláudio Sityá</p>
            <p className="text-xs text-slate-600">Especialista em Endometriose</p>
          </div>
          <Button
            onClick={() => window.location.href = '/'}
            className="h-10 gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Novo Exame
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="flex gap-8 max-w-7xl mx-auto">
          {/* Left Column - Main Content */}
          <div className="flex-1">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Exames em Andamento */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600">Exames em Andamento</h3>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-4xl font-bold text-slate-900 mb-1">{stats.inProgress}</p>
                <p className="text-xs text-slate-500">Aguardando conclusão</p>
              </div>

              {/* Exames Concluídos */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600">Exames Concluídos</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-4xl font-bold text-slate-900 mb-1">{stats.completed}</p>
                <p className="text-xs text-slate-500">Com relatório gerado</p>
              </div>

              {/* Relatórios Pendentes */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-slate-600">Relatórios Pendentes</h3>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-4xl font-bold text-slate-900 mb-1">{stats.pending}</p>
                <p className="text-xs text-slate-500">Aguardando revisão</p>
              </div>
            </div>

            {/* Exames Recentes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Exames Recentes
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Paciente</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Tipo de Exame</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {exams.map(exam => (
                      <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{exam.patient}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">{new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-600">{exam.type}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${getStatusColor(exam.status)}`}>
                            {getStatusIcon(exam.status)}
                            {exam.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => window.location.href = '/'}
                              className="h-8 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                              variant="outline"
                            >
                              <MapPin className="w-3.5 h-3.5 mr-1" />
                              Abrir Mapeamento
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => window.location.href = '/report'}
                              className="h-8 text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200"
                              variant="outline"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1" />
                              Abrir Relatório
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-80 flex flex-col gap-6">
            {/* Quick Shortcuts */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Atalhos Rápidos</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full h-10 justify-start gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700"
                >
                  <Plus className="w-4 h-4" />
                  Novo Mapeamento
                </Button>
                <Button
                  onClick={() => window.location.href = '/report'}
                  className="w-full h-10 justify-start gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300"
                  variant="outline"
                >
                  <FileText className="w-4 h-4" />
                  Acessar Relatórios
                </Button>
              </div>
            </div>

            {/* Workflow Guide */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Fluxo de Trabalho</h3>
              <div className="space-y-4">
                {FLOW_STEPS.map((step, idx) => (
                  <div key={step.number} className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{step.description}</p>
                    </div>
                    {idx < FLOW_STEPS.length - 1 && (
                      <div className="absolute left-1/2 w-0.5 h-8 bg-blue-300 -ml-4 mt-8" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>Dica:</strong> Siga o fluxo acima para cada paciente. Comece pelo mapeamento 3D/2D, salve as vistas e gere o relatório clínico completo para documentação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
