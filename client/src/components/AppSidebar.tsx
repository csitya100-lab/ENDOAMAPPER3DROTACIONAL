import { useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  MapPin, 
  FileText, 
  Mic, 
  FolderOpen,
  Settings,
  HelpCircle,
  Grid3x3
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Visão geral dos exames'
  },
  {
    path: '/',
    label: '3D',
    icon: <MapPin className="w-5 h-5" />,
    description: 'Modelo 3D rotacional'
  },
  {
    path: '/vistas-2d',
    label: '2D',
    icon: <Grid3x3 className="w-5 h-5" />,
    description: 'Editor de vistas planares'
  },
  {
    path: '/report',
    label: 'Relatório',
    icon: <FileText className="w-5 h-5" />,
    description: 'Gerar laudo clínico'
  },
  {
    path: '/ditado-ia',
    label: 'Ditado IA',
    icon: <Mic className="w-5 h-5" />,
    description: 'Transcrição por voz'
  },
  {
    path: '/modelos',
    label: 'Modelos',
    icon: <FolderOpen className="w-5 h-5" />,
    description: 'Gerenciar templates'
  },
];

export default function AppSidebar() {
  const [location, setLocation] = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-slate-900 flex flex-col items-center py-4 z-50">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mb-6">
        <MapPin className="w-5 h-5 text-white" />
      </div>

      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          return (
            <Tooltip key={item.path} delayDuration={100}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setLocation(item.path)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`
                    w-full h-11 flex items-center justify-center rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  {item.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-1 w-full px-2 pt-4 border-t border-slate-800">
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button 
              className="w-full h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              data-testid="nav-help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
            <p className="font-medium">Ajuda</p>
            <p className="text-xs text-slate-400">Guia de uso</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <button 
              className="w-full h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              data-testid="nav-settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700">
            <p className="font-medium">Configurações</p>
            <p className="text-xs text-slate-400">Preferências do sistema</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
