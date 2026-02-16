import AppSidebar from './AppSidebar';
import { useAuth } from '@/hooks/use-auth';
import { LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
}

export default function AppLayout({ 
  children, 
  title, 
  subtitle, 
  headerActions 
}: AppLayoutProps) {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <AppSidebar />
      
      <div className="flex-1 ml-16 flex flex-col h-screen overflow-hidden">
        {(title || headerActions || isAuthenticated) && (
          <header className="flex-none bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between z-10 dark:bg-slate-900 dark:border-slate-700">
            <div>
              {title && <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>}
              {subtitle && <p className="text-xs text-slate-600 mt-0.5 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {headerActions}
              {isAuthenticated && user && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                  {user.profileImageUrl && (
                    <img
                      src={user.profileImageUrl}
                      alt={user.firstName || ''}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300"
                      data-testid="img-layout-avatar"
                    />
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300" data-testid="text-layout-user-name">
                    {user.firstName}
                  </span>
                  <a
                    href="/api/logout"
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800"
                    title="Sair"
                    data-testid="button-layout-logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </header>
        )}
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
