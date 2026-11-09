import React, { useRef, useState } from 'react';
import { WorkoutPlanDay, WorkoutPlan, WorkoutSession } from '../types';
import { ArrowRight, Flame, Clock, Dumbbell, Calendar, Check, X, RotateCcw, Cloud, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { CloudSyncModal } from './CloudSyncModal';

interface FigmaHomeScreenProps {
  userName?: string;
  activePlan: WorkoutPlan | null;
  onSelectDay: (day: WorkoutPlanDay) => void;
  onOpenPlans: () => void;
  onOpenActivity: () => void;
  onOpenEvolution: () => void;
  sessions: WorkoutSession[];
  weeklyWorkoutsCount: number;
  monthlyWorkoutsCount: number;
  onResetData?: () => void;
}

export const FigmaHomeScreen: React.FC<FigmaHomeScreenProps> = ({
  userName = 'Alex',
  activePlan,
  onSelectDay,
  onOpenPlans,
  onOpenActivity,
  onOpenEvolution,
  sessions,
  weeklyWorkoutsCount,
  monthlyWorkoutsCount,
  onResetData,
}) => {
  const now = new Date();
  const currentDayOfWeek = now.getDay();
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const daysLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dayNumber = String(dayDate.getDate()).padStart(2, '0');
    const dayString = dayDate.toISOString().split('T')[0];
    const isToday = dayDate.toDateString() === now.toDateString();
    const isPast = dayDate < now && !isToday;

    const hasTrained = sessions.some((s) => {
      const sDate = new Date(s.started_at).toISOString().split('T')[0];
      return sDate === dayString;
    });

    let status: 'today' | 'done' | 'missed' | 'future' = 'future';
    if (isToday) {
      status = hasTrained ? 'done' : 'today';
    } else if (hasTrained) {
      status = 'done';
    } else if (isPast) {
      status = 'missed';
    }

    return {
      label: daysLabels[i],
      day: dayNumber,
      status,
      isToday,
      hasTrained,
    };
  });

  const planDays = activePlan?.days || [];

  // Busca a última sessão concluída
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  );
  const lastCompletedSession = sortedSessions.find((s) => s.completed_at);

  // Verifica se já houve treino no dia de hoje
  const trainedToday = sessions.some((s) => {
    const sDate = new Date(s.started_at).toDateString();
    return sDate === now.toDateString();
  });

  // Determina inteligentemente o próximo treino da fila baseado no histórico real
  const suggestedDayIndex = (() => {
    if (!planDays.length) return 0;
    if (!lastCompletedSession) return 0;

    const lastDayIndex = planDays.findIndex(
      (d) =>
        d.id === lastCompletedSession.plan_day_id ||
        d.day_name.toLowerCase().trim() === lastCompletedSession.plan_day_title?.toLowerCase().trim()
    );

    if (lastDayIndex >= 0) {
      // Rotaciona para o próximo treino da ficha
      return (lastDayIndex + 1) % planDays.length;
    }
    return 0;
  })();

  const suggestedWorkout = planDays[suggestedDayIndex] || null;
  // Outros treinos da ficha mantendo rotação lógica
  const otherWorkouts = planDays.filter((_, idx) => idx !== suggestedDayIndex);

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgressPct = Math.round((dayOfMonth / daysInMonth) * 100);
  const trainedDaysInMonth = sessions.filter((s) => {
    const d = new Date(s.started_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-28 text-white">
      {/* 1. HEADER: Avatar + Boas-vindas + Ações Rápidas */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#141417] border border-white/10 flex items-center justify-center shadow-md">
            <span className="text-zinc-200 font-bold text-base">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">
              Olá, <span className="font-semibold text-zinc-200">{userName}</span>
            </p>
            <h1 className="text-lg font-black text-white tracking-tight leading-tight">
              Personal HUB
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Nuvem */}
          <button
            onClick={() => setIsCloudModalOpen(true)}
            title="Backup e Sincronização em Nuvem"
            className="h-9 px-3 rounded-xl bg-[#141417] border border-white/10 flex items-center gap-1.5 text-zinc-300 hover:text-white hover:border-emerald-500/30 transition-all active:scale-95 text-xs font-semibold"
          >
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Nuvem</span>
          </button>

          {onResetData && (
            <button
              onClick={onResetData}
              title="Resetar dados"
              className="w-9 h-9 rounded-xl bg-[#141417] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. CALENDÁRIO SEMANAL ELEGANTE (Menos gritante, moderno) */}
      <div className="p-3 rounded-2xl bg-[#111114] border border-white/5 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold text-zinc-300">Semana Atual</span>
          <span className="text-[11px] text-zinc-500 font-medium">
            {daysOfWeek.filter((d) => d.hasTrained).length} de 7 dias
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {daysOfWeek.map((d, index) => {
            // Hoje pendente
            if (d.status === 'today') {
              return (
                <div
                  key={index}
                  className="rounded-xl flex flex-col items-center py-2 px-1 bg-gradient-to-b from-[#ff3322] to-[#d61e0f] text-white shadow-md shadow-red-950/40 scale-[1.03] transition-transform"
                >
                  <span className="text-[10px] font-bold uppercase leading-none opacity-90">{d.label}</span>
                  <span className="text-sm font-black mt-1 leading-none">{d.day}</span>
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                </div>
              );
            }

            // Dia concluído (Verde discreto e elegante)
            if (d.status === 'done') {
              return (
                <div
                  key={index}
                  className="rounded-xl flex flex-col items-center py-2 px-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                >
                  <span className="text-[10px] font-semibold uppercase leading-none opacity-80">{d.label}</span>
                  <span className="text-sm font-black mt-1 leading-none">{d.day}</span>
                  <Check className="w-3.5 h-3.5 mt-1 stroke-[3px] text-emerald-400" />
                </div>
              );
            }

            // Passado sem treino
            if (d.status === 'missed') {
              return (
                <div
                  key={index}
                  className="rounded-xl flex flex-col items-center py-2 px-1 bg-zinc-900/60 border border-white/5 text-zinc-500"
                >
                  <span className="text-[10px] font-medium uppercase leading-none">{d.label}</span>
                  <span className="text-sm font-bold mt-1 leading-none text-zinc-400">{d.day}</span>
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-700" />
                </div>
              );
            }

            // Dias futuros
            return (
              <div
                key={index}
                className="rounded-xl flex flex-col items-center py-2 px-1 bg-zinc-900/30 border border-transparent text-zinc-600"
              >
                <span className="text-[10px] font-medium uppercase leading-none">{d.label}</span>
                <span className="text-sm font-semibold mt-1 leading-none text-zinc-500">{d.day}</span>
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-transparent" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BARRA DE ATIVIDADE DO MÊS */}
      <div className="p-3.5 rounded-2xl bg-[#111114] border border-white/5 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300">Progresso do Mês</span>
          <span className="text-[11px] font-mono font-bold text-zinc-400">
            {trainedDaysInMonth} {trainedDaysInMonth === 1 ? 'treino' : 'treinos'} ({monthProgressPct}% do mês)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden flex">
          {trainedDaysInMonth > 0 ? (
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (trainedDaysInMonth / 16) * 100)}%` }}
            />
          ) : (
            <div className="h-full w-full bg-zinc-800/40" />
          )}
        </div>
      </div>

      {/* 4. SEÇÃO "SUA FICHA" / PRÓXIMO TREINO */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Sua Ficha</h2>
            <p className="text-[11px] text-zinc-400">Pronto para começar?</p>
          </div>
          {activePlan && (
            <button
              onClick={onOpenPlans}
              className="text-xs font-semibold text-[#ff3322] hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <span>Ver ficha</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Se NÃO TEM PLANO CADASTRADO: Card Hero Minimalista Elegante */}
        {!activePlan && (
          <div className="rounded-3xl bg-gradient-to-br from-[#161214] via-[#121215] to-[#0e0e11] border border-white/10 p-6 flex flex-col gap-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-[#ff3322]/15 border border-[#ff3322]/30 flex items-center justify-center text-[#ff3322]">
              <Dumbbell className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Crie sua primeira ficha
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Monte sua rotina personalizada com divisão de treinos, técnicas avançadas (bi-sets, super-sets) e progressão de carga.
              </p>
            </div>
            <button
              onClick={onOpenPlans}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#ff3322] hover:bg-red-600 text-white font-extrabold text-sm flex items-center justify-between shadow-lg shadow-red-950/40 transition-all active:scale-[0.99] group cursor-pointer"
            >
              <span>Criar treino agora</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Se TEM PLANO CADASTRADO: Carrossel Modernizado */}
        {activePlan && (
          <div
            ref={carouselRef}
            className="flex gap-3.5 overflow-x-auto pb-2 pt-0.5 -mx-4 px-4 snap-x snap-mandatory scroll-smooth touch-pan-x select-none no-scrollbar"
          >
            {/* CARD 1: TREINO SUGERIDO BASEADO NO HISTÓRICO REAL */}
            {suggestedWorkout && (
              <div className="min-w-[270px] max-w-[290px] snap-start rounded-3xl bg-gradient-to-b from-[#1c1214] to-[#121215] border border-[#ff3322]/30 p-5 text-white shadow-xl flex flex-col justify-between h-[250px] flex-shrink-0 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      trainedToday
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-[#ff3322]/20 text-[#ff3322] border-[#ff3322]/30'
                    }`}
                  >
                    {trainedToday ? '✓ Feito Hoje • Próximo:' : '⚡ Sugerido para Hoje'}
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {suggestedWorkout.exercises.length} exercícios
                  </span>
                </div>

                <div className="my-auto">
                  <h3 className="text-2xl font-black tracking-tight text-white line-clamp-1">
                    {suggestedWorkout.day_name.includes('-')
                      ? suggestedWorkout.day_name.split('-')[0].trim()
                      : suggestedWorkout.day_name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                    {lastCompletedSession && !trainedToday
                      ? `Próximo após ${lastCompletedSession.plan_day_title.split('-')[0].trim()}`
                      : suggestedWorkout.day_name.includes('-')
                      ? suggestedWorkout.day_name.split('-')[1]?.trim()
                      : 'Foco em progressão contínua'}
                  </p>
                </div>

                <button
                  onClick={() => onSelectDay(suggestedWorkout)}
                  className="w-full py-3 px-4 rounded-xl bg-[#ff3322] hover:bg-red-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-between shadow-lg shadow-red-950/40 transition-all active:scale-[0.99] group cursor-pointer"
                >
                  <span>{trainedToday ? 'Adiantar Próximo' : 'Iniciar Treino'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {/* DEMAIS DIAS DA FICHA */}
            {otherWorkouts.map((day) => {
              const isRest = day.day_name.toLowerCase().includes('descanso');

              return (
                <div
                  key={day.id}
                  className="min-w-[250px] max-w-[270px] snap-start rounded-3xl bg-[#111114] border border-white/5 p-5 text-white shadow-lg flex flex-col justify-between h-[250px] flex-shrink-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Na Sequência
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">
                      {isRest ? 'Recuperação' : `${day.exercises.length} ex`}
                    </span>
                  </div>

                  <div className="my-auto">
                    <h3 className="text-xl font-bold tracking-tight text-zinc-200 line-clamp-1">
                      {day.day_name.includes('-') ? day.day_name.split('-')[0].trim() : day.day_name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {isRest
                        ? 'Descanso ativo & sono'
                        : day.day_name.includes('-')
                        ? day.day_name.split('-')[1]?.trim()
                        : 'Sequência da ficha'}
                    </p>
                  </div>

                  <button
                    onClick={() => (isRest ? onOpenActivity() : onSelectDay(day))}
                    className="w-full py-3 px-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>{isRest ? 'Ver atividade' : 'Ver treino'}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. RESUMO DE ATIVIDADE (Cards compactos e refinados) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-base font-bold text-white tracking-tight">Consistência</h2>
          <button
            onClick={onOpenActivity}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Detalhes
          </button>
        </div>

        <div className="rounded-2xl bg-[#111114] border border-white/5 p-4 grid grid-cols-3 divide-x divide-zinc-800/80 text-center shadow-md">
          {/* Semana */}
          <div className="flex flex-col items-center px-1">
            <span className="text-xl font-black text-white tracking-tight">
              {weeklyWorkoutsCount.toString().padStart(2, '0')}
            </span>
            <span className="text-[11px] text-zinc-400 mt-0.5 font-medium">Na semana</span>
          </div>

          {/* Semanas >=3x */}
          <div className="flex flex-col items-center px-1">
            <span className="text-xl font-black text-amber-400 tracking-tight">
              {(() => {
                const weekMap = new Map<string, number>();
                sessions.forEach((s) => {
                  const d = new Date(s.started_at);
                  const oneJan = new Date(d.getFullYear(), 0, 1);
                  const weekNum = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
                  const key = `${d.getFullYear()}-W${weekNum}`;
                  weekMap.set(key, (weekMap.get(key) || 0) + 1);
                });
                let count = 0;
                weekMap.forEach((v) => { if (v >= 3) count++; });
                return String(count).padStart(2, '0');
              })()}
            </span>
            <span className="text-[11px] text-zinc-400 mt-0.5 font-medium">Semanas 3x+</span>
          </div>

          {/* Mês */}
          <div className="flex flex-col items-center px-1">
            <span className="text-xl font-black text-white tracking-tight">
              {monthlyWorkoutsCount.toString().padStart(2, '0')}
            </span>
            <span className="text-[11px] text-zinc-400 mt-0.5 font-medium">No mês</span>
          </div>
        </div>
      </div>

      {/* 6. CARD EVOLUÇÃO (Visual Dark Minimalista com acento âmbar sutil) */}
      <button
        onClick={onOpenEvolution}
        className="w-full text-left rounded-2xl bg-[#111114] border border-white/5 p-4 hover:border-amber-500/30 transition-all flex items-center justify-between active:scale-[0.99] group shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Evolução e Medidas
            </h3>
            <p className="text-xs text-zinc-400">
              Acompanhe peso, medidas corporais e sobrecarga
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
      </button>

      {/* MODAL DE SINCRONIZAÇÃO EM NUVEM & GOOGLE DRIVE */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />
    </div>
  );
};
