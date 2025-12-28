import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, MapPin, Eye, Clock, CheckCircle, AlertCircle, ArrowRight, ChevronRight } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

interface ExamRecord {
  id: string;
  patient: string;
  date: string;
  type: string;
  status: 'Em andamento' | 'Concluído' | 'Pendente' | 'Cancelado';
}

const EXAM_RECORDS: ExamRecord[] = [
  { id: '001', patient: 'Maria Silva', date: '2024-12-27', type: 'Mapeamento', status: 'Em andamento' },
  { id: '002', patient: 'Ana Costa', date: '2024-12-26', type: 'Acompanhamento', status: 'Concluído' },
  { id: '003', patient: 'Paula Oliveira', date: '2024-12-25', type: 'Mapeamento', status: 'Pendente' },
  { id: '004', patient: 'Jennifer Santos', date: '2024-12-24', type: 'Acompanhamento', status: 'Concluído' },
  { id: '005', patient: 'Camila Ribeiro', date: '2024-12-23', type: 'Mapeamento', status: 'Concluído' },
];

const FLOW_STEPS = [
  { number: 1, title: 'Mapear', icon: <MapPin className="w-4 h-4" />, path: '/' },
  { number: 2, title: 'Relatório', icon: <FileText className="w-4 h-4" />, path: '/report' },
  { number: 3, title: 'Finalizar', icon: <CheckCircle className="w-4 h-4" />, path: '/report' },
];

export default function Dashboard() {
  const [exams] = useState<ExamRecord[]>(EXAM_RECORDS);

  const stats = {
    inProgress: exams.filter(e => e.status === 'Em andamento').length,
    completed: exams.filter(e => e.status === 'Concluído').length,
    pending: exams.filter(e => e.status === 'Pendente').length,
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Em andamento': return 'bg-blue-100 text-blue-700';
      case 'Concluído': return 'bg-green-100 text-green-700';
      case 'Pendente': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <AppLayout 
      title="Dashboard" 
      subtitle="Visão geral dos exames"
      headerActions={
        <Button
          onClick={() => window.location.href = '/'}
          className="h-9 gap-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white hover:from-pink-600 hover:to-rose-700 shadow-sm"
          data-testid="button-novo-exame"
        >
          <Plus className="w-4 h-4" />
          Novo Exame
        </Button>
      }
    >
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl p-5 text-white shadow-lg">
          <h2 className="text-sm font-medium opacity-90 mb-3">Fluxo de Trabalho</h2>
          <div className="flex items-center justify-between">
            {FLOW_STEPS.map((step, idx) => (
              <div key={step.number} className="flex items-center">
                <button
                  onClick={() => window.location.href = step.path}
                  className="flex items-center gap-3 bg-white/20 hover:bg-white/30 rounded-lg px-4 py-3 transition-all"
                  data-testid={`flow-step-${step.number}`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <span className="font-medium">{step.title}</span>
                  </div>
                </button>
                {idx < FLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-5 h-5 mx-4 opacity-60" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
              <p className="text-xs text-slate-500">Em andamento</p>
            </div>
          </div>
          
          <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
              <p className="text-xs text-slate-500">Concluídos</p>
            </div>
          </div>
          
          <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-xs text-slate-500">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Exames Recentes</h2>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-700">
              Ver todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {exams.map(exam => (
              <div 
                key={exam.id} 
                className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                data-testid={`exam-row-${exam.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
                    {exam.patient.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{exam.patient}</p>
                    <p className="text-xs text-slate-500">{exam.type} • {new Date(exam.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusStyle(exam.status)}`}>
                    {exam.status}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.location.href = '/'}
                    className="h-8 text-xs text-slate-600 hover:text-pink-600"
                    data-testid={`button-abrir-${exam.id}`}
                  >
                    Abrir <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
