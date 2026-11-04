import React, { useMemo, useState } from 'react';
import { WorkoutSession } from '../types';
import { calculateVolumeLoad } from '../utils/progressionLogic';
import { Calendar, Flame, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';

interface ConsistencyHeatmapProps {
  sessions: WorkoutSession[];
  onSelectDate?: (dateStr: string) => void;
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({
  sessions,
  onSelectDate,
}) => {
  const [selectedDay, setSelectedDay] = useState<{ date: string; session?: WorkoutSession; volume: number } | null>(null);

  // Mapeia sessões por data (YYYY-MM-DD)
  const sessionMap = useMemo(() => {
    const map = new Map<string, { session: WorkoutSession; volume: number }>();
    sessions.forEach((s) => {
      const dateKey = s.started_at.split('T')[0];
      let volume = 0;
      Object.values(s.exercises_logs || {}).forEach((sets) => {
        volume += calculateVolumeLoad(sets);
      });
      map.set(dateKey, { session: s, volume });
    });
    return map;
  }, [sessions]);

  // Gera as últimas 14 semanas (98 dias)
  const calendarData = useMemo(() => {
    const today = new Date();
    const days: Array<{
      dateStr: string;
      date: Date;
      hasWorkout: boolean;
      volume: number;
      session?: WorkoutSession;
      dayOfWeek: number;
    }> = [];

    const startDate = new Date();
    startDate.setDate(today.getDate() - 97);

    for (let i = 0; i < 98; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const match = sessionMap.get(dateStr);

      days.push({
        dateStr,
        date: current,
        hasWorkout: !!match,
        volume: match?.volume || 0,
        session: match?.session,
        dayOfWeek: current.getDay(),
      });
    }

    return days;
  }, [sessionMap]);

  // Estatísticas de consistência (referência IMG_5877)
  const stats = useMemo(() => {
    const totalWorkouts = sessions.length;
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const thisMonthWorkouts = sessions.filter((s) => {
      const d = new Date(s.started_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    let currentStreak = 0;
    const checkDate = new Date();
    const todayStr = checkDate.toISOString().split('T')[0];
    let offset = sessionMap.has(todayStr) ? 0 : 1;

    while (offset < 60) {
      const target = new Date();
      target.setDate(target.getDate() - offset);
      const key = target.toISOString().split('T')[0];
      if (sessionMap.has(key)) {
        currentStreak++;
        offset++;
      } else {
        break;
      }
    }

    const adherenceRate = Math.min(100, Math.round((sessions.length / 24) * 100));

    return {
      totalWorkouts,
      thisMonthWorkouts,
      currentStreak: Math.max(currentStreak, sessionMap.has(todayStr) ? 1 : 0),
      adherenceRate,
    };
  }, [sessions, sessionMap]);

  // Cores de consistência minimalistas (monocromático em tons de cinza e branco)
  const getIntensityClass = (volume: number, hasWorkout: boolean) => {
    if (!hasWorkout) return 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700';
    if (volume < 3500) return 'bg-zinc-800 border-zinc-700 text-white';
    if (volume < 7000) return 'bg-zinc-600 border-zinc-500 text-white';
    return 'bg-white border-white text-zinc-950 font-bold';
  };

  const weeks = useMemo(() => {
    const cols: Array<typeof calendarData> = [];
    for (let i = 0; i < calendarData.length; i += 7) {
      cols.push(calendarData.slice(i, i + 7));
    }
    return cols;
  }, [calendarData]);

  return (
    <div className="relative bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
      {/* Header minimalista editorial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Consistência & Frequência
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
            Histórico de Treinos (12 Semanas)
          </h3>
        </div>

        {/* Métricas minimalistas */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <Flame className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 font-medium">Sequência:</span>
            <span className="font-semibold text-white">{stats.currentStreak} dias</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <Trophy className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 font-medium">Mês:</span>
            <span className="font-semibold text-white">{stats.thisMonthWorkouts} sessões</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-400 font-medium">Aderência:</span>
            <span className="font-semibold text-white">{stats.adherenceRate}%</span>
          </div>
        </div>
      </div>

      {/* Grid de dias do Heatmap */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="min-w-[420px] flex gap-1.5">
          <div className="flex flex-col justify-between py-1 text-[9px] font-medium text-zinc-500 pr-1 select-none">
            <span>Seg</span>
            <span>Qua</span>
            <span>Sex</span>
            <span>Dom</span>
          </div>

          <div className="flex gap-1.5 flex-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5 flex-1">
                {week.map((day) => {
                  const isCurrentSelected = selectedDay?.date === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDay({
                          date: day.dateStr,
                          session: day.session,
                          volume: day.volume,
                        });
                        onSelectDate?.(day.dateStr);
                      }}
                      title={`${day.dateStr}${day.hasWorkout ? ` - ${day.session?.plan_day_title} (${day.volume}kg)` : ' - Sem treino'}`}
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md border transition-all cursor-pointer ${getIntensityClass(
                        day.volume,
                        day.hasWorkout
                      )} ${isCurrentSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda de intensidades minimalista (grayscale) */}
      <div className="flex items-center justify-between mt-3 text-[10px] text-zinc-400 pt-3 border-t border-zinc-800/80">
        <span>Descanso</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-md bg-zinc-950 border border-zinc-800" title="Sem treino" />
          <span className="w-3 h-3 rounded-md bg-zinc-800 border border-zinc-700" title="Volume Leve" />
          <span className="w-3 h-3 rounded-md bg-zinc-600 border border-zinc-500" title="Volume Médio" />
          <span className="w-3 h-3 rounded-md bg-white border border-white" title="Volume Máximo" />
        </div>
        <span>Volume Máximo</span>
      </div>

      {/* Card de detalhes do dia clicado */}
      {selectedDay && (
        <div className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between animate-fade-in shadow-sm">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'short',
              })}
            </span>
            {selectedDay.session ? (
              <h4 className="text-sm font-semibold text-white mt-0.5">
                {selectedDay.session.plan_day_title}
              </h4>
            ) : (
              <p className="text-xs text-zinc-400 mt-0.5">Descanso ativo / Recuperação</p>
            )}
          </div>

          {selectedDay.session && (
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-white">
                {selectedDay.volume.toLocaleString('pt-BR')} kg
              </span>
              <span className="text-[10px] text-zinc-400 block font-medium">Carga Total</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
