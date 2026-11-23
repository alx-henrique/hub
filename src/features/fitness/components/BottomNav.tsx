import React from 'react';
import { Home, CalendarDays, Activity, TrendingUp, Sparkles } from 'lucide-react';

export type NavTab = 'home' | 'plans' | 'activity' | 'evolution' | 'coach';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  hasActiveWorkout?: boolean;
  onOpenActiveWorkout?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  hasActiveWorkout = false,
  onOpenActiveWorkout,
}) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Início', icon: Home },
    { id: 'plans' as NavTab, label: 'Ficha', icon: CalendarDays },
    { id: 'activity' as NavTab, label: 'Atividade', icon: Activity },
    { id: 'evolution' as NavTab, label: 'Evolução', icon: TrendingUp },
    { id: 'coach' as NavTab, label: 'AI Coach', icon: Sparkles },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto md:hidden">
      {/* Mini banner se houver treino em andamento */}
      {hasActiveWorkout && onOpenActiveWorkout && (
        <div className="px-4 pb-2">
          <button
            onClick={onOpenActiveWorkout}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-900/50 text-sm font-semibold animate-pulse"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              <span>Treino em andamento...</span>
            </div>
            <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Retomar
            </span>
          </button>
        </div>
      )}

      {/* Barra de Navegação Flutuante Dark Premium */}
      <nav
        className="bg-[#0e0e12]/92 backdrop-blur-2xl border-t border-white/[0.08] px-3 py-2 shadow-[0_-12px_36px_rgba(0,0,0,0.85)] flex items-center justify-around"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative group cursor-pointer ${
                isActive
                  ? 'text-[#ff3322]'
                  : 'text-zinc-500 hover:text-zinc-300 active:scale-95'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'bg-[#ff3322]/15 text-[#ff3322] shadow-[0_0_12px_rgba(255,51,34,0.3)]'
                    : 'group-hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'stroke-[2.2px] scale-105' : 'stroke-[1.7px]'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-200 ${
                  isActive ? 'font-bold text-white' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
              {/* Indicador sutil de ponto luminoso ativo */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#ff3322] shadow-[0_0_6px_#ff3322] mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
