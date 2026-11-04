import React from 'react';
import { WorkoutPlanDay } from '../types';
import { FitnessStorageService } from '../services/storageService';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import { ArrowLeft, Clock, Dumbbell, Play, Flame } from 'lucide-react';

interface FigmaStartWorkoutPreviewProps {
  planDay: WorkoutPlanDay;
  onStart: () => void;
  onBack: () => void;
}

export const FigmaStartWorkoutPreview: React.FC<FigmaStartWorkoutPreviewProps> = ({
  planDay,
  onStart,
  onBack,
}) => {
  const sessions = FitnessStorageService.getSessions();

  // Helper para obter os valores da última sessão do exercício
  const getLastPerformance = (exerciseId: string) => {
    for (const session of sessions) {
      const logs = session.exercises_logs[exerciseId];
      if (logs && logs.length > 0) {
        const first = logs[0];
        const maxWeight = Math.max(...logs.map((s) => s.weight_kg || 0));
        return {
          setsCount: logs.length,
          reps: first.reps_performed || 10,
          weightKg: maxWeight || 0,
        };
      }
    }
    return null;
  };

  const titleClean = planDay.day_name.includes('-')
    ? planDay.day_name.split('-')[0].trim()
    : planDay.day_name;

  const subtitleClean = planDay.day_name.includes('-')
    ? planDay.day_name.split('-')[1]?.trim()
    : '';

  return (
    <div className="flex flex-col gap-5 pb-28 text-white">
      {/* Botão Voltar no Topo */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          Prévia do Treino
        </span>
      </div>

      {/* Hero Card Moderno do Treino */}
      <div className="rounded-3xl bg-gradient-to-br from-[#181214] via-[#121215] to-[#0e0e11] border border-white/10 p-6 flex flex-col items-center text-center gap-4 shadow-xl relative overflow-hidden">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ff3322]/15 text-[#ff3322] border border-[#ff3322]/25 mb-2">
            Sessão Pronta
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">{titleClean}</h1>
          {subtitleClean && (
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{subtitleClean}</p>
          )}

          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400 mt-2 bg-zinc-900/60 px-3 py-1.5 rounded-full border border-white/5">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5 text-[#ff3322]" />
              {planDay.exercises.length} exercícios
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              ~{planDay.exercises.length * 8} min
            </span>
          </div>
        </div>

        {/* Botão de Início em Destaque */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-[#ff3322] hover:bg-red-600 text-white font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-950/50 transition-all active:scale-[0.98] group cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>Iniciar Treino Agora</span>
        </button>
      </div>

      {/* Lista dos Exercícios Previstos */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-zinc-400 px-1">Ordem dos Exercícios</span>
        {planDay.exercises.map((item, index) => {
          const perf = getLastPerformance(item.exercise_id);
          const setsCount = item.target_sets || 3;
          const targetReps = item.max_reps || 10;
          const restSec = item.rest_seconds || 60;
          const displayWeight = perf && perf.weightKg > 0 ? `${perf.weightKg} kg` : '—';

          return (
            <div
              key={item.id}
              className="w-full rounded-2xl bg-[#111114] border border-white/5 p-3 flex items-center justify-between gap-3 shadow-sm hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="w-11 h-11 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center">
                  <ExerciseVectorIllustration
                    exerciseId={item.exercise_id}
                    exerciseName={item.exercise.name}
                    targetMuscle={item.exercise.target_muscle}
                    category={item.exercise.category}
                    className="w-full h-full object-cover"
                    showBiomechanics={false}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[190px]">
                    {item.exercise.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] text-zinc-400 capitalize">
                      {item.exercise.target_muscle}
                    </p>
                    {item.technique && item.technique !== 'normal' && (
                      <span className="text-[8px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {item.technique === 'biset' && 'Bi-set'}
                        {item.technique === 'superset' && 'Super-set'}
                        {item.technique === 'dropset' && 'Drop-set'}
                        {item.technique === 'upset' && 'Up-set'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-2 sm:gap-3 text-right flex-shrink-0 text-xs">
                <span className="font-bold text-white">
                  {setsCount} × {targetReps}
                </span>
                <span className="font-medium text-zinc-400">
                  {restSec}s
                </span>
                <span className="font-semibold text-zinc-300 min-w-[40px]">
                  {displayWeight}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
