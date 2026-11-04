import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { WorkoutSession, MuscleGroup, MUSCLE_LABELS } from '../types';
import { FitnessStorageService } from '../services/storageService';
import { calculateVolumeLoad, estimate1RM } from '../utils/progressionLogic';
import { TrendingUp, Dumbbell, Layers, Zap, Award } from 'lucide-react';

interface VolumeProgressionChartProps {
  sessions: WorkoutSession[];
}

export const VolumeProgressionChart: React.FC<VolumeProgressionChartProps> = ({ sessions }) => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('ex-deadlift-conventional');
  const [chartMode, setChartMode] = useState<'exercise_progression' | 'muscle_distribution'>('exercise_progression');

  const allExercises = FitnessStorageService.getAllExercises();

  // Lista de exercícios presentes no histórico ou exercícios principais
  const exercisesWithHistory = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach((s) => {
      Object.keys(s.exercises_logs || {}).forEach((id) => ids.add(id));
    });
    // Se não tiver ainda nos logs, inclui alguns clássicos como terra, supino e agachamento
    ids.add('ex-deadlift-conventional');
    ids.add('ex-bench-press');
    ids.add('ex-barbell-squat');

    return allExercises.filter((e) => ids.has(e.id));
  }, [sessions, allExercises]);

  // Dados da evolução do exercício
  const exerciseData = useMemo(() => {
    const list: Array<{
      date: string;
      label: string;
      volumeLoad: number;
      maxWeight: number;
      est1RM: number;
      bestSet: string;
    }> = [];

    const sorted = [...sessions].sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );

    sorted.forEach((session) => {
      const sets = session.exercises_logs?.[selectedExerciseId];
      if (sets && sets.length > 0) {
        const validSets = sets.filter((s) => s.completed);
        if (validSets.length > 0) {
          const volume = calculateVolumeLoad(validSets);
          const maxWeight = Math.max(...validSets.map((s) => s.weight_kg));

          let best1RM = 0;
          let bestSetText = '';
          validSets.forEach((s) => {
            const e1rm = estimate1RM(s.weight_kg, s.reps_performed);
            if (e1rm > best1RM) {
              best1RM = e1rm;
              bestSetText = `${s.weight_kg}kg × ${s.reps_performed} reps`;
            }
          });

          const d = new Date(session.started_at);
          list.push({
            date: session.started_at.split('T')[0],
            label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            volumeLoad: volume,
            maxWeight,
            est1RM: best1RM,
            bestSet: bestSetText,
          });
        }
      }
    });

    return list;
  }, [sessions, selectedExerciseId]);

  // Dados por grupo muscular
  const muscleDistributionData = useMemo(() => {
    const map: Partial<Record<MuscleGroup, number>> = {};

    sessions.forEach((s) => {
      Object.entries(s.exercises_logs || {}).forEach(([exId, sets]) => {
        const ex = allExercises.find((e) => e.id === exId);
        if (!ex) return;
        const volume = calculateVolumeLoad(sets.filter((st) => st.completed));
        map[ex.target_muscle] = (map[ex.target_muscle] || 0) + volume;
      });
    });

    return Object.entries(map).map(([muscleKey, vol]) => ({
      muscle: MUSCLE_LABELS[muscleKey as MuscleGroup] || muscleKey,
      volume: vol,
      color: '#e4e4e7',
    }));
  }, [sessions, allExercises]);

  const progressionDelta = useMemo(() => {
    if (exerciseData.length < 2) return null;
    const first = exerciseData[0].volumeLoad;
    const last = exerciseData[exerciseData.length - 1].volumeLoad;
    if (first === 0) return null;
    return Math.round(((last - first) / first) * 100);
  }, [exerciseData]);

  const latestStats = exerciseData[exerciseData.length - 1];

  return (
    <div className="relative bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
      {/* Header editorial minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Progressão de Carga
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
            {chartMode === 'exercise_progression' ? 'Curva de Carga & 1RM' : 'Volume por Grupamento'}
          </h3>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setChartMode('exercise_progression')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartMode === 'exercise_progression'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            Por Exercício
          </button>
          <button
            type="button"
            onClick={() => setChartMode('muscle_distribution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              chartMode === 'muscle_distribution'
                ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Por Músculo
          </button>
        </div>
      </div>

      {chartMode === 'exercise_progression' ? (
        <>
          {/* Seletor do exercício e badge de delta */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-2">
              <label htmlFor="chart-exercise-select" className="text-xs text-zinc-400 font-medium">
                Movimento:
              </label>
              <select
                id="chart-exercise-select"
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="bg-zinc-900 border border-zinc-700/80 text-white text-xs font-medium rounded-xl px-3 py-1.5 focus:outline-none focus:border-zinc-500"
              >
                {exercisesWithHistory.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({MUSCLE_LABELS[ex.target_muscle as MuscleGroup]})
                  </option>
                ))}
              </select>
            </div>

            {progressionDelta !== null && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-400 font-medium">Ganho no ciclo:</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-white border border-zinc-700">
                  +{progressionDelta}%
                </span>
              </div>
            )}
          </div>

          {/* Gráfico Recharts Minimalista */}
          {exerciseData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={exerciseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="minimalVolumeArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      borderRadius: '1rem',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#ffffff', fontWeight: 700, marginBottom: '4px' }}
                    formatter={(val: any, name: any) => {
                      if (name === 'volumeLoad') return [`${val.toLocaleString()} kg`, 'Volume Total'];
                      if (name === 'est1RM') return [`${val} kg`, '1RM Estimado'];
                      return [val, name];
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="volumeLoad"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#minimalVolumeArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
              Nenhum registro para este movimento ainda. Faça seu primeiro treino!
            </div>
          )}

          {/* Widgets inferiores de métricas */}
          {latestStats && (
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-zinc-800 text-center">
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-medium">Último Volume</span>
                <span className="text-white font-mono font-bold text-sm">
                  {latestStats.volumeLoad.toLocaleString()} kg
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-medium">1RM Estimado</span>
                <span className="text-white font-mono font-bold text-base">
                  {latestStats.est1RM} kg
                </span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-medium">Melhor Série</span>
                <span className="text-zinc-300 font-mono font-medium text-xs truncate block">
                  {latestStats.bestSet}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Gráfico de Barras Minimalista Monocromático */
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={muscleDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.6} />
              <XAxis dataKey="muscle" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  borderColor: '#3f3f46',
                  borderRadius: '1rem',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val.toLocaleString()} kg`, 'Volume Total']}
              />
              <Bar dataKey="volume" radius={[8, 8, 0, 0]} fill="#e4e4e7" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
