import React, { useState, useEffect } from 'react';
import { WorkoutPlanDay, WorkoutSession, WorkoutSetLog, WorkoutPlanExercise } from '../types';
import { FitnessStorageService } from '../services/storageService';
import { calculateDoubleProgression } from '../utils/progressionLogic';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import { X, ArrowRight, SkipForward, Clock, Check, Plus, Minus, ArrowUpDown, ChevronUp, ChevronDown, Pencil } from 'lucide-react';

interface FigmaWorkoutExecutionProps {
  planDay: WorkoutPlanDay;
  onFinishWorkout: (session: WorkoutSession) => void;
  onClose: () => void;
}

/**
 * Utility: given the current index, returns the range of exercises that belong to the same
 * technique group (biset or superset). Normal exercises are returned as a single‑item range.
 */
function getTechniqueGroup(exercises: WorkoutPlanExercise[], startIdx: number) {
  if (!exercises.length || startIdx >= exercises.length) {
    return { start: startIdx, end: startIdx, exercises: [] };
  }
  const startExercise = exercises[startIdx];
  const technique = startExercise.technique;
  if (!technique || technique === 'normal') {
    return { start: startIdx, end: startIdx, exercises: [startExercise] };
  }
  // Group continues while next exercises share the same technique
  let endIdx = startIdx;
  for (let i = startIdx + 1; i < exercises.length; i++) {
    const ex = exercises[i];
    if (ex.technique === technique) {
      endIdx = i;
    } else {
      break;
    }
  }
  const slice = exercises.slice(startIdx, endIdx + 1);
  return { start: startIdx, end: endIdx, exercises: slice };
}

export const FigmaWorkoutExecution: React.FC<FigmaWorkoutExecutionProps> = ({
  planDay,
  onFinishWorkout,
  onClose,
}) => {
  // Lista de exercícios da sessão (pode ser reordenada durante o treino sem mudar a ficha definitiva)
  const [sessionExercises, setSessionExercises] = useState<WorkoutPlanExercise[]>(planDay.exercises);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  // Set of exercise IDs that were skipped — they go to the end of the queue
  const [skippedExerciseIds, setSkippedExerciseIds] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());
  const [restSecondsRemaining, setRestSecondsRemaining] = useState(0);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  // Which set is in "edit mode" (after being marked complete) — key: `${exerciseId}-${setIdx}`
  const [editingSetKey, setEditingSetKey] = useState<string | null>(null);

  // Wake Lock API: impede que a tela do celular apague durante o treino
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Ignora caso não permitido pelo navegador
      }
    };
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  // Load historical sessions for progression suggestions & placeholders
  const sessions = FitnessStorageService.getSessions();

  // Helper para buscar a última carga/reps realizada para cada exercício (para usar como placeholder)
  const getLastSetPerformance = (exerciseId: string, setIndex: number) => {
    for (const session of sessions) {
      const logs = session.exercises_logs[exerciseId];
      if (logs && logs.length > 0) {
        const setLog = logs[setIndex] || logs[logs.length - 1];
        if (setLog && (setLog.weight_kg || setLog.reps_performed)) {
          return {
            weight: setLog.weight_kg || 0,
            reps: setLog.reps_performed || 0,
          };
        }
      }
    }
    return null;
  };

  // Determine the current technique group
  const groupInfo = getTechniqueGroup(sessionExercises, currentExerciseIndex);
  const { exercises: groupExercises } = groupInfo;

  // Primary exercise (used for illustration & overall metrics like rest)
  const primaryPlanEx = groupExercises[0] || sessionExercises[0];
  const primaryEx = primaryPlanEx?.exercise;

  // Initialise logs for every exercise in the day (unchanged from previous logic)
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, WorkoutSetLog[]>>(() => {
    const initial: Record<string, WorkoutSetLog[]> = {};
    planDay.exercises.forEach((item) => {
      let lastWeight = 20;
      let lastReps = item.max_reps || 10;
      for (const s of sessions) {
        if (s.exercises_logs[item.exercise_id]?.length) {
          const sets = s.exercises_logs[item.exercise_id];
          lastWeight = sets[0].weight_kg || 20;
          lastReps = sets[0].reps_performed || 10;
          break;
        }
      }
      const setsCount = item.target_sets || 3;
      initial[item.exercise_id] = Array.from({ length: setsCount }, (_, i) => ({
        id: `set-${item.exercise_id}-${i}`,
        set_number: i + 1,
        weight_kg: lastWeight,
        reps_performed: lastReps,
        rpe: 8,
        completed: false,
      }));
    });
    return initial;
  });

  // Rest timer effect
  useEffect(() => {
    if (restSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [restSecondsRemaining]);

  // Helper to update a field of a specific set for a given exercise id
  const updateSetField = (
    exerciseId: string,
    index: number,
    field: keyof WorkoutSetLog,
    value: any,
  ) => {
    setExerciseLogs((prev) => {
      const sets = [...(prev[exerciseId] || [])];
      sets[index] = { ...sets[index], [field]: value };
      return { ...prev, [exerciseId]: sets };
    });
  };

  // Compute progression suggestion based on the primary exercise (first in the group)
  const progression = calculateDoubleProgression({
    targetMinReps: primaryPlanEx?.min_reps || 8,
    targetMaxReps: primaryPlanEx?.max_reps || 12,
    lastSessionSets:
      (sessions.find((s) => s.exercises_logs[primaryPlanEx?.exercise_id]?.length) ||
        { exercises_logs: {} }).exercises_logs[primaryPlanEx?.exercise_id] || [],
    isUpperBody: !['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(
      primaryEx?.target_muscle || 'chest',
    ),
  });

  // Reordenar exercícios durante a execução
  const moveExercise = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= sessionExercises.length) return;
    const updated = [...sessionExercises];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setSessionExercises(updated);
    if (currentExerciseIndex === fromIdx) {
      setCurrentExerciseIndex(toIdx);
    }
  };

  // ------- Navigation handlers -------------------------------------------------
  const advanceIndex = (steps: number) => {
    const nextIdx = currentExerciseIndex + steps;
    if (nextIdx < sessionExercises.length) {
      setCurrentExerciseIndex(nextIdx);
      setRestSecondsRemaining(
        sessionExercises[nextIdx].rest_seconds || 60,
      );
    } else {
      // Check if there are still pending skipped exercises (not completed) at the end
      // After all exercises processed, finish the workout
      const session: WorkoutSession = {
        id: `sess-${Date.now()}`,
        plan_day_id: planDay.id,
        plan_day_title: planDay.day_name,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_minutes: Math.max(
          1,
          Math.round((Date.now() - startTime) / 60000),
        ),
        exercises_logs: exerciseLogs,
      };
      onFinishWorkout(session);
    }
  };

  const handleNextExercise = () => {
    // Mark all sets of every exercise in the current group as completed
    const updatedLogs = { ...exerciseLogs };
    groupExercises.forEach((ex) => {
      const sets = updatedLogs[ex.exercise_id] || [];
      updatedLogs[ex.exercise_id] = sets.map((s) => ({ ...s, completed: true }));
    });
    setExerciseLogs(updatedLogs);
    // Advance by the size of the group
    advanceIndex(groupExercises.length || 1);
  };

  const handleSkipExercise = () => {
    // Move the skipped exercise(s) to the END of the session list so they come back later
    const updatedExercises = [...sessionExercises];
    const skippedGroup = groupExercises;
    const skippedIds = new Set(skippedExerciseIds);
    
    // Remove skipped group from current position and push to end
    const removedItems = updatedExercises.splice(currentExerciseIndex, skippedGroup.length);
    
    // Only add to end if not already skipped twice (avoid infinite loop)
    removedItems.forEach((item) => {
      if (!skippedIds.has(item.exercise_id)) {
        updatedExercises.push(item);
        skippedIds.add(item.exercise_id);
      }
      // If already skipped once, just drop it (don't loop forever)
    });

    setSkippedExerciseIds(skippedIds);
    setSessionExercises(updatedExercises);

    // Stay at the same index (now pointing to the next exercise)
    // But if we're now past the end, finish
    if (currentExerciseIndex >= updatedExercises.length) {
      const session: WorkoutSession = {
        id: `sess-${Date.now()}`,
        plan_day_id: planDay.id,
        plan_day_title: planDay.day_name,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_minutes: Math.max(1, Math.round((Date.now() - startTime) / 60000)),
        exercises_logs: exerciseLogs,
      };
      onFinishWorkout(session);
    } else {
      setRestSecondsRemaining(0);
    }
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d] overflow-y-auto flex flex-col text-white pb-16" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 4rem)' }}>
      <div className="max-w-md md:max-w-4xl lg:max-w-5xl w-full mx-auto px-4 md:px-8 pt-3 md:pt-6 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">
              Exercício {currentExerciseIndex + 1} de {sessionExercises.length}
            </span>
            <div className="w-20 md:w-32 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-[#ff1a00] transition-all"
                style={{
                  width: `${((currentExerciseIndex + 1) / sessionExercises.length) *
                    100}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReorderModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors border border-white/5"
              title="Aparelho ocupado? Troque a ordem dos exercícios"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Ordem</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CORPO RESPONSIVO: 1 coluna no mobile, 2 colunas lado a lado no desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* COLUNA ESQUERDA: Ilustração, Nomes, Métricas e Progressão */}
          <div className="md:col-span-5 flex flex-col gap-4 md:sticky md:top-6">
            {/* Exercise illustration */}
        <div className="w-full h-56 rounded-[28px] overflow-hidden bg-white/5 border border-white/10 relative flex items-center justify-center">
          <ExerciseVectorIllustration
            exerciseId={primaryPlanEx.exercise_id}
            exerciseName={primaryEx.name}
            targetMuscle={primaryEx.target_muscle}
            category={primaryEx.category}
            className="w-full h-full object-cover"
            showBiomechanics={false}
          />
          {restSecondsRemaining > 0 && (
            <div className="absolute inset-x-3 bottom-3 py-2 px-4 rounded-2xl bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Clock className="w-4 h-4 animate-spin" />
                <span>Descanso: {restSecondsRemaining}s</span>
              </div>
              <button
                onClick={() => setRestSecondsRemaining(0)}
                className="text-[10px] text-zinc-400 underline"
              >
                Pular
              </button>
            </div>
          )}
        </div>

        {/* Technique badge (shown only once for the group) */}
        {primaryPlanEx.technique && primaryPlanEx.technique !== 'normal' && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
            <span>⚡ Método:</span>
            <span>
              {primaryPlanEx.technique === 'biset' && 'Bi-set (Conjugado)'}
              {primaryPlanEx.technique === 'superset' && 'Super-set (Circuito)'}
              {primaryPlanEx.technique === 'dropset' && 'Drop-set (Redução de Carga)'}
              {primaryPlanEx.technique === 'upset' && 'Up-set (Pirâmide Crescente)'}
            </span>
          </div>
        )}

        {/* Exercise names – stacked vertically when grouped */}
        <div className="text-center flex flex-col items-center gap-1.5">
          {groupExercises.map((ex) => (
            <h2 key={ex.exercise_id} className="text-xl font-black text-white tracking-tight leading-tight">
              {ex.exercise.name}
            </h2>
          ))}
        </div>

        {/* Metrics (using primary exercise) */}
        <div className="grid grid-cols-3 text-center py-1">
          <div>
            <p className="text-xl font-black text-white leading-tight">
              {primaryPlanEx.target_sets} x {primaryPlanEx.min_reps ? `${primaryPlanEx.min_reps}-${primaryPlanEx.max_reps}` : primaryPlanEx.max_reps}
            </p>
            <p className="text-xs text-zinc-400 font-medium">repetições</p>
          </div>
          <div>
            <p className="text-xl font-black text-white leading-tight">
              {primaryPlanEx.rest_seconds || 60}s
            </p>
            <p className="text-xs text-zinc-400 font-medium">descanso</p>
          </div>
          <div>
            <p className="text-xl font-black text-white leading-tight">
              {(() => {
                const logs = exerciseLogs[primaryPlanEx.exercise_id] || [];
                return logs[0]?.weight_kg || 0;
              })()} kg
            </p>
            <p className="text-xs text-zinc-400 font-medium">última carga</p>
          </div>
        </div>

            {/* Progression suggestion banner */}
            <div className="text-center my-1 p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5">
              <p className="text-xs font-semibold text-zinc-300">Sugestão para progressão contínua:</p>
              <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                {progression.suggestedWeight} kg
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                {progression.rationale}
              </p>
            </div>
          </div>

          {/* COLUNA DIREITA: Séries, RPE e Ações */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Sets inputs – stacked per exercise when grouped */}
            <div className="flex flex-col gap-3">
          {groupExercises.map((ex) => {
            const sets = exerciseLogs[ex.exercise_id] || [];
            return (
              <div key={ex.exercise_id} className="border border-white/10 rounded-2xl bg-zinc-900/40 p-3.5 mb-2 flex flex-col gap-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-white/5">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff1a00]" />
                    {ex.exercise.name}
                  </p>
                  <span className="text-[11px] text-zinc-400 font-semibold">
                    {sets.filter((s) => s.completed).length}/{sets.length} séries
                  </span>
                </div>

                {sets.map((set, idx) => {
                  const lastPerf = getLastSetPerformance(ex.exercise_id, idx);
                  return (
                  <div
                    key={set.id}
                    className={`rounded-2xl border p-3 flex flex-col gap-2 transition-all ${
                      editingSetKey === `${ex.exercise_id}-${idx}`
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : set.completed
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-[#171719] border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-zinc-300">
                          Série {idx + 1}
                        </span>
                        {lastPerf && (
                          <span className="text-[10px] text-zinc-400 font-medium bg-zinc-800/80 px-2 py-0.5 rounded-md border border-white/5">
                            Última vez: <strong className="text-zinc-200">{lastPerf.weight}kg × {lastPerf.reps}</strong>
                          </span>
                        )}
                        {set.completed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            Feito
                          </span>
                        )}
                        {editingSetKey === `${ex.exercise_id}-${idx}` && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 animate-pulse">
                            Editando...
                          </span>
                        )}
                      </div>

                      {/* Botão Check série rápida */}
                      <div className="flex items-center gap-1.5">
                        {set.completed && (
                          <button
                            type="button"
                            onClick={() => {
                              const key = `${ex.exercise_id}-${idx}`;
                              setEditingSetKey(editingSetKey === key ? null : key);
                            }}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              editingSetKey === `${ex.exercise_id}-${idx}`
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                                : 'bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 border border-white/5'
                            }`}
                            title="Corrigir peso ou reps desta série"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            updateSetField(ex.exercise_id, idx, 'completed', !set.completed);
                            // Sair do modo edição ao desmarcar
                            if (set.completed) setEditingSetKey(null);
                          }}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            set.completed
                              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                          }`}
                          title={set.completed ? 'Marcar como não concluído' : 'Concluir série'}
                        >
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-0.5">
                      {/* Input Peso com Ajuste Rápido (- / +) */}
                      <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5 flex-1 sm:flex-none justify-between sm:justify-start">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(set.weight_kg) || 0;
                            updateSetField(ex.exercise_id, idx, 'weight_kg', Math.max(0, cur - 1));
                          }}
                          className="w-7 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          value={set.weight_kg === 0 ? '' : set.weight_kg}
                          onChange={(e) =>
                            updateSetField(ex.exercise_id, idx, 'weight_kg', parseFloat(e.target.value) || 0)
                          }
                          className="w-14 h-8 rounded-lg bg-white text-black font-extrabold text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500 shadow-inner"
                          inputMode="decimal"
                          placeholder={lastPerf ? String(lastPerf.weight) : '0'}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(set.weight_kg) || 0;
                            updateSetField(ex.exercise_id, idx, 'weight_kg', cur + 1);
                          }}
                          className="w-7 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-zinc-500 pr-1 font-bold">kg</span>
                      </div>

                      {/* Input Rep com Ajuste Rápido (- / +) */}
                      <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5 flex-1 sm:flex-none justify-between sm:justify-start">
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(set.reps_performed) || 0;
                            updateSetField(ex.exercise_id, idx, 'reps_performed', Math.max(0, cur - 1));
                          }}
                          className="w-7 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          value={set.reps_performed === 0 ? '' : set.reps_performed}
                          onChange={(e) =>
                            updateSetField(ex.exercise_id, idx, 'reps_performed', parseInt(e.target.value) || 0)
                          }
                          className="w-12 h-8 rounded-lg bg-white text-black font-extrabold text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500 shadow-inner"
                          inputMode="numeric"
                          placeholder={lastPerf ? String(lastPerf.reps) : '0'}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const cur = Number(set.reps_performed) || 0;
                            updateSetField(ex.exercise_id, idx, 'reps_performed', cur + 1);
                          }}
                          className="w-7 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] text-zinc-500 pr-1 font-bold">rep</span>
                      </div>
                    </div>
                  </div>
                );
              })}
                {/* RPE selector per exercise */}
                <div className="rounded-2xl bg-zinc-900/60 p-3 border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Esforço RPE da série:</span>
                  <div className="flex gap-1.5">
                    {[7, 8, 9, 10].map((rpeVal) => (
                      <button
                        key={rpeVal}
                        onClick={() => {
                          sets.forEach((_, i) =>
                            updateSetField(ex.exercise_id, i, 'rpe', rpeVal),
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          sets[0]?.rpe === rpeVal
                            ? 'bg-[#ff1a00] text-white shadow-md'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        RPE {rpeVal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pt-1 pb-6">
          <button
            onClick={handleNextExercise}
            className="w-full py-4 rounded-2xl bg-[#ff1a00] text-white font-extrabold text-base tracking-wide shadow-lg shadow-red-950/40 hover:bg-red-600 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>{currentExerciseIndex < planDay.exercises.length - 1 ? 'Finalizar e ir para próximo' : 'Concluir Treino Completo!'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkipExercise}
            className="w-full py-3.5 rounded-2xl bg-transparent border border-white/20 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <SkipForward className="w-4 h-4 text-zinc-400" />
            <span>Pular exercício</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  {/* MODAL DE REORDENAÇÃO DE EXERCÍCIOS DURANTE O TREINO */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <h3 className="text-base font-black text-white">Reorganizar Exercícios</h3>
                <p className="text-[11px] text-zinc-400">
                  Aparelho ocupado? Altere a ordem de hoje sem alterar a ficha definitiva
                </p>
              </div>
              <button
                onClick={() => setIsReorderModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {sessionExercises.map((item, idx) => {
                const isCurrent = idx === currentExerciseIndex;
                const isCompleted = (exerciseLogs[item.exercise_id] || []).every((s) => s.completed);

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition-all ${
                      isCurrent
                        ? 'bg-red-950/30 border-red-500/40'
                        : isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/20 opacity-75'
                        : 'bg-zinc-900 border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white truncate max-w-[170px]">
                            {item.exercise.name}
                          </p>
                          {isCurrent && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#ff1a00] text-white">
                              Atual
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 capitalize">
                          {item.exercise.target_muscle} • {item.target_sets} séries
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveExercise(idx, idx - 1)}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors"
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === sessionExercises.length - 1}
                        onClick={() => moveExercise(idx, idx + 1)}
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 flex items-center justify-center transition-colors"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentExerciseIndex(idx);
                          setIsReorderModalOpen(false);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-white hover:text-black text-xs font-bold text-zinc-300 transition-all ml-1"
                      >
                        Ir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsReorderModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-[#ff1a00] hover:bg-red-600 text-white font-extrabold text-sm transition-all"
            >
              Confirmar e Voltar ao Treino
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
