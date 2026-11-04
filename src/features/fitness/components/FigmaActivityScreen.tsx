import React, { useMemo, useState } from 'react';
import { WorkoutSession } from '../types';
import { calculateVolumeLoad } from '../utils/progressionLogic';
import {
  Dumbbell,
  Flame,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface FigmaActivityScreenProps {
  sessions: WorkoutSession[];
}

export const FigmaActivityScreen: React.FC<FigmaActivityScreenProps> = ({ sessions }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedSessionDate, setSelectedSessionDate] = useState<string | null>(null);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession[]>();
    sessions.forEach((s) => {
      const dateKey = new Date(s.started_at).toISOString().split('T')[0];
      const list = map.get(dateKey) || [];
      list.push(s);
      map.set(dateKey, list);
    });
    return map;
  }, [sessions]);

  const now = new Date();

  const weeklyWorkoutsCount = useMemo(() => {
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return sessions.filter((s) => {
      const sDate = new Date(s.started_at);
      return sDate >= monday && sDate <= sunday;
    }).length;
  }, [sessions]);

  const weeksWithAtLeast3 = useMemo(() => {
    const weekCountMap = new Map<string, number>();
    sessions.forEach((s) => {
      const d = new Date(s.started_at);
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
      const key = `${d.getFullYear()}-W${weekNum}`;
      weekCountMap.set(key, (weekCountMap.get(key) || 0) + 1);
    });

    let count = 0;
    weekCountMap.forEach((val) => {
      if (val >= 3) count++;
    });
    return count;
  }, [sessions]);

  const currentMonthWorkoutsCount = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return sessions.filter((s) => {
      const d = new Date(s.started_at);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [sessions, currentDate]);

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const currentYear = currentDate.getFullYear();

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const weeks: Array<
      Array<{
        dayNumber: number | null;
        dateStr: string | null;
        trained: boolean;
        session?: WorkoutSession;
        isToday: boolean;
        volumeKg: number;
      }>
    > = [];

    let currentWeek: Array<{
      dayNumber: number | null;
      dateStr: string | null;
      trained: boolean;
      session?: WorkoutSession;
      isToday: boolean;
      volumeKg: number;
    }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({
        dayNumber: null,
        dateStr: null,
        trained: false,
        isToday: false,
        volumeKg: 0,
      });
    }

    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];
      const matchingSessions = sessionsByDate.get(dateStr) || [];
      const trained = matchingSessions.length > 0;
      const isToday = d.toDateString() === new Date().toDateString();

      let volumeKg = 0;
      matchingSessions.forEach((s) => {
        const sets = Object.values(s.exercises_logs || {}).flat();
        volumeKg += calculateVolumeLoad(sets);
      });

      currentWeek.push({
        dayNumber: day,
        dateStr,
        trained,
        session: matchingSessions[0],
        isToday,
        volumeKg,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          dayNumber: null,
          dateStr: null,
          trained: false,
          isToday: false,
          volumeKg: 0,
        });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentDate, sessionsByDate]);

  const annualData = useMemo(() => {
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const goalPerMonth = 16;

    return months.map((m, idx) => {
      const count = sessions.filter((s) => {
        const d = new Date(s.started_at);
        return d.getFullYear() === currentYear && d.getMonth() === idx;
      }).length;

      const pct = Math.min(100, Math.round((count / goalPerMonth) * 100));

      return {
        month: m,
        count,
        pct: count > 0 ? Math.max(10, pct) : 0,
      };
    });
  }, [sessions, currentYear]);

  const activeDetailSession = useMemo(() => {
    if (!selectedSessionDate) return null;
    return (sessionsByDate.get(selectedSessionDate) || [])[0] || null;
  }, [selectedSessionDate, sessionsByDate]);

  return (
    <div className="flex flex-col gap-5 pb-28 text-white">
      {/* 1. TÍTULO */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Minha Atividade
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Frequência, consistência e histórico real de treinos
        </p>
      </div>

      {/* 2. OS 3 CARDS SUPERIORES MINIMALISTAS */}
      <div className="grid grid-cols-3 divide-x divide-zinc-800/80 rounded-2xl bg-[#111114] border border-white/5 p-4 text-center shadow-md">
        <div className="flex flex-col items-center px-1">
          <span className="text-2xl font-black text-white tracking-tight">
            {weeklyWorkoutsCount.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 font-medium">Na semana</span>
        </div>

        <div className="flex flex-col items-center px-1">
          <span className="text-2xl font-black text-amber-400 tracking-tight">
            {weeksWithAtLeast3.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 font-medium">Semanas 3x+</span>
        </div>

        <div className="flex flex-col items-center px-1">
          <span className="text-2xl font-black text-white tracking-tight">
            {currentMonthWorkoutsCount.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1 font-medium">No mês</span>
        </div>
      </div>

      {/* 3. CALENDÁRIO MENSAL */}
      <div className="flex flex-col gap-3 rounded-3xl bg-[#111114] border border-white/5 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() - 1);
              setCurrentDate(d);
            }}
            className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h3 className="text-center text-sm font-semibold text-zinc-300">
            <span className="font-bold text-white">{capitalizedMonthName} {currentYear}</span>
          </h3>

          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() + 1);
              setCurrentDate(d);
            }}
            className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cabeçalho dos Dias (S T Q Q S S D) */}
        <div className="grid grid-cols-8 gap-1.5 text-center text-xs font-semibold text-zinc-500 pt-1">
          <span className="text-[10px] text-zinc-600 font-normal">Sem</span>
          <span>S</span>
          <span>T</span>
          <span>Q</span>
          <span>Q</span>
          <span>S</span>
          <span>S</span>
          <span>D</span>
        </div>

        {/* Grade Dinâmica das Semanas */}
        <div className="flex flex-col gap-1.5">
          {calendarGrid.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-8 gap-1.5 items-center text-center">
              <span className="text-[11px] font-mono text-zinc-600">{weekIndex + 1}</span>

              {week.map((day, dayIndex) => {
                if (!day.dayNumber) {
                  return (
                    <div
                      key={dayIndex}
                      className="w-full aspect-square rounded-xl bg-transparent"
                    />
                  );
                }

                const isSelected = selectedSessionDate === day.dateStr;

                return (
                  <button
                    key={dayIndex}
                    onClick={() => {
                      if (day.trained && day.dateStr) {
                        setSelectedSessionDate(isSelected ? null : day.dateStr);
                      }
                    }}
                    title={
                      day.trained
                        ? `${day.dateStr}: ${day.session?.plan_day_title} (${day.volumeKg}kg)`
                        : `Dia ${day.dayNumber}`
                    }
                    className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all text-xs font-semibold ${
                      day.trained
                        ? 'bg-gradient-to-tr from-[#ff3322] to-red-500 text-white shadow-md shadow-red-950/40 cursor-pointer active:scale-95'
                        : 'bg-zinc-900/50 border border-white/5 text-zinc-500'
                    } ${day.isToday && !day.trained ? 'border-amber-400/60 text-amber-300' : ''} ${
                      isSelected ? 'ring-2 ring-white scale-105 z-10' : ''
                    }`}
                  >
                    <span>{day.dayNumber}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Card de Detalhes da Sessão Selecionada */}
        {activeDetailSession && (
          <div className="mt-2 p-3.5 rounded-2xl bg-zinc-900/90 border border-[#ff3322]/30 flex flex-col gap-1.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#ff3322]">
                Treino Realizado
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {new Date(activeDetailSession.started_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              {activeDetailSession.plan_day_title}
            </h4>
            <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
              <span>⏱️ {activeDetailSession.duration_minutes || 45} min</span>
              <span>•</span>
              <span>
                🏋️ {calculateVolumeLoad(
                  Object.values(activeDetailSession.exercises_logs || {}).flat()
                ).toLocaleString('pt-BR')} kg
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 4. HISTÓRICO ANUAL */}
      <div className="flex flex-col gap-3 rounded-3xl bg-[#111114] border border-white/5 p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-200">
            Nesse Ano ({currentYear})
          </h3>
          <span className="text-[11px] text-zinc-400">
            {sessions.filter((s) => new Date(s.started_at).getFullYear() === currentYear).length} treinos no total
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {annualData.map((item) => (
            <div key={item.month} className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-400 w-7 capitalize">
                {item.month}
              </span>

              <div className="flex-1 h-3 rounded-full bg-zinc-800/50 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-[#ff3322] to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>

              <span className="text-[10px] font-bold text-zinc-500 w-5 text-right font-mono">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
