import React from 'react';
import { WorkoutPlanDay } from '../types';
import { FitnessStorageService } from '../services/storageService';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import { ArrowLeft, Clock, Dumbbell, Play, Flame, Check, Sparkles } from 'lucide-react';

interface FigmaStartWorkoutPreviewProps {
  planDay: WorkoutPlanDay;
  onStart: () => void;
  onBack: () => void;
  onRecordRestDay?: (day: WorkoutPlanDay) => void;
}

export const FigmaStartWorkoutPreview: React.FC<FigmaStartWorkoutPreviewProps> = ({
  planDay,
  onStart,
  onBack,
  onRecordRestDay,
}) => {
  const sessions = FitnessStorageService.getSessions();
  const isRest =
    !planDay.exercises ||
    planDay.exercises.length === 0 ||
    planDay.day_name.toLowerCase().includes('descanso');

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

  // TELA DE PRÉVIA ESPECIALIZADA PARA DIA DE DESCANSO
  if (isRest) {
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
            Dia de Recuperação
          </span>
        </div>

        {/* Hero Card de Descanso */}
        <div className="rounded-3xl card-glass p-6 sm:p-8 flex flex-col items-center text-center gap-4.5 shadow-2xl relative overflow-hidden border-white/[0.08]">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_24px_rgba(59,130,246,0.3)]">
            <Sparkles className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
              Recuperação Ativa
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
              {titleClean}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-1">
              {subtitleClean || 'Dia programado para descanso e hipertrofia'}
            </p>
          </div>

          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            O músculo cresce fora da academia, durante o repouso. Hidrate-se, bata sua meta de proteína e descanse para a próxima sessão.
          </p>

          <div className="w-full grid grid-cols-3 gap-2 py-1 text-center text-xs">
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
              <span className="text-base block">💤</span>
              <span className="font-bold text-white text-[11px] block mt-1">Sono 8h</span>
              <span className="text-[9px] text-zinc-500">Reparo GH</span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
              <span className="text-base block">💧</span>
              <span className="font-bold text-white text-[11px] block mt-1">35ml/kg</span>
              <span className="text-[9px] text-zinc-500">Hidratação</span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
              <span className="text-base block">🥩</span>
              <span className="font-bold text-white text-[11px] block mt-1">2g/kg</span>
              <span className="text-[9px] text-zinc-500">Proteína</span>
            </div>
          </div>

          {/* Botão para Marcar Descanso Direto */}
          <button
            onClick={() => (onRecordRestDay ? onRecordRestDay(planDay) : onStart())}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Marcar Descanso Concluído</span>
          </button>
        </div>
      </div>
    );
  }

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
      <div className="rounded-3xl card-glow-red p-6 sm:p-7 flex flex-col items-center text-center gap-4.5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-[#ff3322]/20 text-[#ff3322] border border-[#ff3322]/30 mb-2 shadow-[0_0_10px_rgba(255,51,34,0.2)]">
            Sessão Pronta
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">{titleClean}</h1>
          {subtitleClean && (
            <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-1">{subtitleClean}</p>
          )}

          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-300 mt-3 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 shadow-inner">
            <span className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-[#ff3322]" />
              {planDay.exercises.length} exercícios
            </span>
            <span className="text-zinc-600">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              ~{planDay.exercises.length * 8} min
            </span>
          </div>
        </div>

        {/* Botão de Início em Destaque */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl btn-brand-primary font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>Iniciar Treino Agora</span>
        </button>
      </div>

      {/* Lista dos Exercícios Previstos (Grid no Desktop) */}
      <div className="flex flex-col gap-2.5">
        <span className="text-xs font-bold text-zinc-400 px-1">Ordem dos Exercícios</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {planDay.exercises.map((item, index) => {
          const perf = getLastPerformance(item.exercise_id);
          const setsCount = item.target_sets || 3;
          const targetReps = item.max_reps || 10;
          const restSec = item.rest_seconds || 60;
          const displayWeight = perf && perf.weightKg > 0 ? `${perf.weightKg} kg` : '—';

          return (
            <div
              key={item.id}
              className="w-full rounded-2xl card-glass-interactive p-3.5 flex items-center justify-between gap-3 shadow-md"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-zinc-800/90 border border-white/5 text-zinc-300 text-xs font-black flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden flex-shrink-0 border border-white/10 flex items-center justify-center">
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
                    <p className="text-[10px] text-zinc-400 capitalize font-medium">
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
                <span className="font-black text-white">
                  {setsCount} × {targetReps}
                </span>
                <span className="font-semibold text-zinc-400">
                  {restSec}s
                </span>
                <span className="font-bold text-zinc-200 min-w-[40px]">
                  {displayWeight}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};
