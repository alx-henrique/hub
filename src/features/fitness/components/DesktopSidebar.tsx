import React from 'react';
import {
  Home,
  CalendarDays,
  Activity,
  TrendingUp,
  Sparkles,
  Cloud,
  Dumbbell,
  Play,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { NavTab } from './BottomNav';
import { CloudSyncService } from '../services/cloudSyncService';
import { WorkoutPlanDay } from '../types';

interface DesktopSidebarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  userName: string;
  weeklyWorkoutsCount: number;
  suggestedWorkout?: WorkoutPlanDay | null;
  onStartSuggestedWorkout?: (day: WorkoutPlanDay) => void;
  onOpenCloudModal: () => void;
  onResetData?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onChangeTab,
  userName,
  weeklyWorkoutsCount,
  suggestedWorkout,
  onStartSuggestedWorkout,
  onOpenCloudModal,
  onResetData,
}) => {
  const cloudConfig = CloudSyncService.getConfig();
  const isGoogleConnected = Boolean(cloudConfig.google_access_token);

  const navItems = [
    { id: 'home' as NavTab, label: 'Início', icon: Home, desc: 'Visão geral & resumo' },
    { id: 'plans' as NavTab, label: 'Ficha de Treino', icon: CalendarDays, desc: 'Divisões e exercícios' },
    { id: 'activity' as NavTab, label: 'Minha Atividade', icon: Activity, desc: 'Calendário e histórico' },
    { id: 'evolution' as NavTab, label: 'Minha Evolução', icon: TrendingUp, desc: 'Cargas e medidas' },
    { id: 'coach' as NavTab, label: 'AI Coach', icon: Sparkles, desc: 'Inteligência artificial' },
  ];

  return (
    <aside className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 w-64 lg:w-72 bg-[#0e0e11] border-r border-white/5 z-40 select-none">
      {/* 1. BRAND HEADER */}
      <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff1a00] to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-950/50">
            <Dumbbell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-black text-white tracking-tight leading-none">
                Personal HUB
              </h1>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#ff3322]/20 text-[#ff3322] border border-[#ff3322]/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Academia Inteligente</p>
          </div>
        </div>
      </div>

      {/* 2. USER PROFILE BADGE */}
      <div className="px-5 py-4 border-b border-white/5 bg-zinc-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200 font-bold text-sm shadow-inner flex-shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {weeklyWorkoutsCount} {weeklyWorkoutsCount === 1 ? 'treino nesta semana' : 'treinos nesta semana'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO PRINCIPAL */}
      <nav className="flex-1 px-3.5 py-4 flex flex-col gap-1.5 overflow-y-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-3 pb-1">
          Menu Principal
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-left transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#ff3322]/20 via-[#ff3322]/10 to-transparent text-white border-l-4 border-[#ff3322] font-bold shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#ff3322] text-white shadow-md shadow-red-950/60'
                    : 'bg-zinc-800/80 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700'
                }`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs block leading-tight">{item.label}</span>
                <span className="text-[10px] text-zinc-500 block truncate group-hover:text-zinc-400">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}

        {/* ATALHO RÁPIDO: TREINO SUGERIDO */}
        {suggestedWorkout && onStartSuggestedWorkout && (
          <div className="mt-4 pt-4 border-t border-white/5 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block pb-2">
              Pronto para treinar?
            </span>
            <button
              onClick={() => onStartSuggestedWorkout(suggestedWorkout)}
              className="w-full p-3 rounded-2xl bg-gradient-to-br from-[#1a1214] to-[#121215] border border-[#ff3322]/30 hover:border-[#ff3322]/60 text-left transition-all group shadow-lg cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#ff3322]/20 text-[#ff3322]">
                  Sugerido
                </span>
                <Play className="w-3.5 h-3.5 text-[#ff3322] fill-[#ff3322] group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs font-bold text-white truncate">
                {suggestedWorkout.day_name}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                {suggestedWorkout.exercises.length} exercícios na sequência
              </p>
            </button>
          </div>
        )}
      </nav>

      {/* 4. FOOTER: NUVEM / BACKUP & RESET */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-2.5 bg-[#0a0a0d]">
        <button
          onClick={onOpenCloudModal}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 transition-all text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-200 leading-none">Google Drive</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">
                {isGoogleConnected ? 'Sincronizado' : 'Conectar backup'}
              </p>
            </div>
          </div>
          {isGoogleConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <span className="text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10">
              Offline
            </span>
          )}
        </button>

        {onResetData && (
          <button
            onClick={onResetData}
            title="Resetar dados do app"
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-zinc-500 hover:text-red-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Resetar Dados</span>
          </button>
        )}
      </div>
    </aside>
  );
};
