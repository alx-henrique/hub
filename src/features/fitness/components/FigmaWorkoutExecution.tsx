import React, { useState, useEffect } from 'react';
import { WorkoutPlanDay, WorkoutSession, WorkoutSetLog, WorkoutPlanExercise, Exercise } from '../types';
import { FitnessStorageService } from '../services/storageService';
import { calculateDoubleProgression } from '../utils/progressionLogic';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import {
  X,
  ArrowRight,
  SkipForward,
  Clock,
  Check,
  Plus,
  Minus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trophy,
  Flame,
  Sparkles,
  RefreshCw,
  FileText,
  Volume2,
} from 'lucide-react';
import { playRestCompleteSound, playPRCelebrationSound, triggerHaptic } from '../utils/audioFeedback';
import { checkIsNewPR, SessionPersonalRecord } from '../utils/prLogic';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';

interface FigmaWorkoutExecutionProps {
  planDay: WorkoutPlanDay;
  onFinishWorkout: (session: WorkoutSession, personalRecords?: SessionPersonalRecord[]) => void;
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
  const technique = startExercise?.technique;
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

  // Recordes Pessoais (PR) e Toast
  const [sessionPRs, setSessionPRs] = useState<SessionPersonalRecord[]>([]);
  const [activePRToast, setActivePRToast] = useState<{
    exerciseName: string;
    weight: number;
    diff: number;
  } | null>(null);

  // Calculadora de Aquecimento rápida
  const [showWarmupCalc, setShowWarmupCalc] = useState(false);

  // Substituição de exercício (Aparelho Ocupado)
  const [substitutingExerciseIdx, setSubstitutingExerciseIdx] = useState<number | null>(null);
  const [substituteFilterText, setSubstituteFilterText] = useState('');

  // Auto-dismiss do PR Toast
  useEffect(() => {
    if (!activePRToast) return;
    const timer = setTimeout(() => {
      setActivePRToast(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [activePRToast]);

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

  // Notas rápidas por exercício (puxa notas anteriores para o mesmo exercício se houver)
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>(() => {
    const initialNotes: Record<string, string> = {};
    for (const session of sessions) {
      if (!session.exercises_logs) continue;
      for (const exId of Object.keys(session.exercises_logs)) {
        if (!initialNotes[exId]) {
          const pastSets = session.exercises_logs[exId];
          const setWithNote = pastSets.find((s) => s.notes && s.notes.trim().length > 0);
          if (setWithNote && setWithNote.notes) {
            initialNotes[exId] = setWithNote.notes;
          }
        }
      }
    }
    return initialNotes;
  });
  const [openNotesExerciseId, setOpenNotesExerciseId] = useState<string | null>(null);

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

  // Initialise logs for every exercise in the day
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

  // Rest timer effect com som e vibração automática ao zerar
  useEffect(() => {
    if (restSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          playRestCompleteSound();
          triggerHaptic('success');
          return 0;
        }
        return prev - 1;
      });
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

  // Substituição de exercício caso aparelho esteja ocupado
  const handleSubstituteExercise = (newEx: Exercise) => {
    if (substitutingExerciseIdx === null) return;
    const targetItem = sessionExercises[substitutingExerciseIdx];
    if (!targetItem) return;

    const updatedItem: WorkoutPlanExercise = {
      ...targetItem,
      exercise_id: newEx.id,
      exercise: newEx,
    };

    const updatedList = [...sessionExercises];
    updatedList[substitutingExerciseIdx] = updatedItem;
    setSessionExercises(updatedList);

    // Cria logs do novo exercício
    setExerciseLogs((prev) => {
      if (prev[newEx.id]) return prev;
      return {
        ...prev,
        [newEx.id]: Array.from({ length: targetItem.target_sets || 3 }, (_, i) => ({
          id: `set-${newEx.id}-${i}`,
          set_number: i + 1,
          weight_kg: 20,
          reps_performed: targetItem.max_reps || 10,
          rpe: 8,
          completed: false,
        })),
      };
    });

    setSubstitutingExerciseIdx(null);
    setSubstituteFilterText('');
  };

  // Finalizar treino com registros de PR
  const finishSession = () => {
    // Anexa as notas do usuário aos logs
    const finalLogs: Record<string, WorkoutSetLog[]> = {};
    for (const [exId, sets] of Object.entries(exerciseLogs)) {
      finalLogs[exId] = sets.map((s) => ({
        ...s,
        notes: exerciseNotes[exId] || s.notes,
      }));
    }

    const session: WorkoutSession = {
      id: `sess-${Date.now()}`,
      plan_day_id: planDay.id,
      plan_day_title: planDay.day_name,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: Math.max(1, Math.round((Date.now() - startTime) / 60000)),
      exercises_logs: finalLogs,
    };
    onFinishWorkout(session, sessionPRs);
  };

  // ------- Navigation handlers -------------------------------------------------
  const advanceIndex = (steps: number) => {
    const nextIdx = currentExerciseIndex + steps;
    if (nextIdx < sessionExercises.length) {
      setCurrentExerciseIndex(nextIdx);
      setRestSecondsRemaining(sessionExercises[nextIdx].rest_seconds || 60);
    } else {
      finishSession();
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
    advanceIndex(groupExercises.length || 1);
  };

  const handleSkipExercise = () => {
    const updatedExercises = [...sessionExercises];
    const skippedGroup = groupExercises;
    const skippedIds = new Set(skippedExerciseIds);

    const removedItems = updatedExercises.splice(currentExerciseIndex, skippedGroup.length);

    removedItems.forEach((item) => {
      if (!skippedIds.has(item.exercise_id)) {
        updatedExercises.push(item);
        skippedIds.add(item.exercise_id);
      }
    });

    setSkippedExerciseIds(skippedIds);
    setSessionExercises(updatedExercises);

    if (currentExerciseIndex >= updatedExercises.length) {
      finishSession();
    } else {
      setRestSecondsRemaining(0);
    }
  };

  // Alternar conclusão da série com detecção de Recorde Pessoal (PR)
  const handleToggleSetComplete = (ex: WorkoutPlanExercise, idx: number, set: WorkoutSetLog) => {
    const isNowCompleted = !set.completed;
    updateSetField(ex.exercise_id, idx, 'completed', isNowCompleted);

    if (set.completed) {
      setEditingSetKey(null);
    }

    if (isNowCompleted) {
      triggerHaptic('light');

      // Inicia timer de descanso configurado para o exercício
      const restSecs = ex.rest_seconds || 60;
      setRestSecondsRemaining(restSecs);

      // Verificação em tempo real de Recorde Pessoal (PR)
      const currentWeight = Number(set.weight_kg) || 0;
      if (currentWeight > 0) {
        const prCheck = checkIsNewPR(ex.exercise_id, currentWeight, sessions);
        if (prCheck.isPR) {
          playPRCelebrationSound();
          triggerHaptic('record');
          setActivePRToast({
            exerciseName: ex.exercise.name,
            weight: currentWeight,
            diff: prCheck.difference,
          });

          setSessionPRs((prev) => {
            const exists = prev.some((p) => p.exerciseId === ex.exercise_id);
            if (exists) {
              return prev.map((p) =>
                p.exerciseId === ex.exercise_id
                  ? {
                      ...p,
                      newWeight: Math.max(p.newWeight, currentWeight),
                      differenceKg: Math.max(p.differenceKg, prCheck.difference),
                    }
                  : p
              );
            }
            return [
              ...prev,
              {
                exerciseId: ex.exercise_id,
                exerciseName: ex.exercise.name,
                newWeight: currentWeight,
                previousWeight: prCheck.previousPR,
                differenceKg: prCheck.difference,
              },
            ];
          });
        }
      }
    }
  };

  // Cálculo de Carga para o Aquecimento Sugerido
  const targetWorkingWeight = progression.suggestedWeight || getLastSetPerformance(primaryPlanEx?.exercise_id, 0)?.weight || 20;
  const warmupSet1Weight = Math.max(5, Math.round((targetWorkingWeight * 0.5) / 2) * 2);
  const warmupSet2Weight = Math.max(10, Math.round((targetWorkingWeight * 0.7) / 2) * 2);

  // ---------------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-50 bg-[#0d0d0d] overflow-y-auto flex flex-col text-white pb-16"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 4rem)',
      }}
    >
      {/* TOAST DE NOVO RECORDE PESSOAL (PR) */}
      {activePRToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-black px-5 py-3 rounded-2xl shadow-2xl shadow-amber-950/80 flex items-center gap-3.5 border-2 border-white/40 animate-bounce">
          <div className="w-9 h-9 rounded-xl bg-black text-amber-400 flex items-center justify-center font-bold text-lg">
            🏆
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-black/80">
              Novo Recorde Pessoal!
            </p>
            <p className="text-xs sm:text-sm font-black text-black">
              {activePRToast.exerciseName}: {activePRToast.weight} kg{' '}
              <span className="text-emerald-950 font-black">
                (+{activePRToast.diff}kg)
              </span>
            </p>
          </div>
        </div>
      )}

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
                  width: `${((currentExerciseIndex + 1) / sessionExercises.length) * 100}%`,
                }}
              />
            </div>
            {sessionPRs.length > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <span>🏆</span>
                <span>{sessionPRs.length} PR</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsReorderModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors border border-white/5"
              title="Aparelho ocupado? Troque a ordem ou substitua"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Ordem / Trocar</span>
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

              {/* TIMER DE DESCANSO INTERATIVO */}
              {restSecondsRemaining > 0 && (
                <div className="absolute inset-x-3 bottom-3 py-2 px-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 flex items-center justify-between text-xs shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Clock className="w-4 h-4 animate-spin text-emerald-400" />
                    <span className="font-mono text-sm tracking-tight">
                      {restSecondsRemaining}s
                    </span>
                  </div>

                  {/* AJUSTES RÁPIDOS DE TEMPO */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setRestSecondsRemaining((prev) => Math.max(0, prev - 15))}
                      className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold"
                      title="Subtrair 15 segundos"
                    >
                      -15s
                    </button>
                    <button
                      type="button"
                      onClick={() => setRestSecondsRemaining((prev) => prev + 30)}
                      className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold"
                      title="Adicionar 30 segundos"
                    >
                      +30s
                    </button>
                    <button
                      onClick={() => setRestSecondsRemaining(0)}
                      className="ml-1 px-2 py-0.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-[10px] font-bold border border-red-500/20"
                    >
                      Pular
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Technique badge */}
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
                <h2
                  key={ex.exercise_id}
                  className="text-xl font-black text-white tracking-tight leading-tight"
                >
                  {ex.exercise.name}
                </h2>
              ))}
            </div>

            {/* Metrics (using primary exercise) */}
            <div className="grid grid-cols-3 text-center py-1 bg-zinc-900/40 rounded-2xl border border-white/5">
              <div>
                <p className="text-xl font-black text-white leading-tight">
                  {primaryPlanEx.target_sets} x{' '}
                  {primaryPlanEx.min_reps
                    ? `${primaryPlanEx.min_reps}-${primaryPlanEx.max_reps}`
                    : primaryPlanEx.max_reps}
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
                  })()}{' '}
                  kg
                </p>
                <p className="text-xs text-zinc-400 font-medium">última carga</p>
              </div>
            </div>

            {/* Progression suggestion banner */}
            <div className="text-center p-3.5 rounded-2xl bg-zinc-900/50 border border-white/5 relative overflow-hidden">
              <p className="text-xs font-semibold text-zinc-300">
                Sugestão para progressão contínua:
              </p>
              <p className="text-3xl font-black text-white tracking-tight mt-0.5">
                {progression.suggestedWeight} kg
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                {progression.rationale}
              </p>

              {/* TOGGLE CALCULADORA DE AQUECIMENTO */}
              <button
                type="button"
                onClick={() => setShowWarmupCalc(!showWarmupCalc)}
                className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-bold border border-white/5 transition-colors cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{showWarmupCalc ? 'Ocultar Aquecimento' : 'Ver Séries de Aquecimento'}</span>
              </button>

              {/* CARD DE AQUECIMENTO DINÂMICO */}
              {showWarmupCalc && (
                <div className="mt-3 p-3 rounded-xl bg-black/40 border border-amber-500/20 text-left text-xs flex flex-col gap-1.5 animate-in fade-in duration-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    🔥 Aquecimento neuromuscular antes das séries:
                  </span>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>1ª Série (50% carga):</span>
                    <strong className="text-white">{warmupSet1Weight} kg × 12 reps</strong>
                  </div>
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>2ª Série (70% carga):</span>
                    <strong className="text-white">{warmupSet2Weight} kg × 6 reps</strong>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    *Não conte essas séries no treino. Elas preparam tendões e articulações.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: Séries, RPE, Anotações e Ações */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Sets inputs – stacked per exercise when grouped */}
            <div className="flex flex-col gap-3">
              {groupExercises.map((ex) => {
                const sets = exerciseLogs[ex.exercise_id] || [];
                const isNotesOpen = openNotesExerciseId === ex.exercise_id;
                const noteVal = exerciseNotes[ex.exercise_id] || '';

                return (
                  <div
                    key={ex.exercise_id}
                    className="border border-white/10 rounded-2xl bg-zinc-900/40 p-3.5 mb-2 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#ff1a00]" />
                        <p className="text-sm font-bold text-white truncate max-w-[200px]">
                          {ex.exercise.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botão de Anotação rápida */}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenNotesExerciseId(isNotesOpen ? null : ex.exercise_id)
                          }
                          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-[11px] font-medium ${
                            noteVal
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
                          }`}
                          title="Anotar regulagem ou observação deste exercício"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {noteVal ? 'Nota' : '+ Nota'}
                          </span>
                        </button>

                        <span className="text-[11px] text-zinc-400 font-semibold">
                          {sets.filter((s) => s.completed).length}/{sets.length} séries
                        </span>
                      </div>
                    </div>

                    {/* CAMPO DE ANOTAÇÃO RÁPIDA COLAPSÁVEL */}
                    {isNotesOpen && (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1.5 animate-in fade-in duration-150">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Observação / Regulagem (ex: "Banco no 3º furo, pegada neutra"):
                        </label>
                        <input
                          type="text"
                          value={noteVal}
                          onChange={(e) =>
                            setExerciseNotes((prev) => ({
                              ...prev,
                              [ex.exercise_id]: e.target.value,
                            }))
                          }
                          placeholder="Digite aqui sua anotação..."
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

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
                                  Última:{' '}
                                  <strong className="text-zinc-200">
                                    {lastPerf.weight}kg × {lastPerf.reps}
                                  </strong>
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
                                onClick={() => handleToggleSetComplete(ex, idx, set)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                  set.completed
                                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-white/5'
                                }`}
                                title={
                                  set.completed
                                    ? 'Marcar como não concluído'
                                    : 'Concluir série'
                                }
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
                                  updateSetField(
                                    ex.exercise_id,
                                    idx,
                                    'weight_kg',
                                    Math.max(0, cur - 1)
                                  );
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
                                  updateSetField(
                                    ex.exercise_id,
                                    idx,
                                    'weight_kg',
                                    parseFloat(e.target.value) || 0
                                  )
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
                              <span className="text-[10px] text-zinc-500 pr-1 font-bold">
                                kg
                              </span>
                            </div>

                            {/* Input Rep com Ajuste Rápido (- / +) */}
                            <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5 flex-1 sm:flex-none justify-between sm:justify-start">
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = Number(set.reps_performed) || 0;
                                  updateSetField(
                                    ex.exercise_id,
                                    idx,
                                    'reps_performed',
                                    Math.max(0, cur - 1)
                                  );
                                }}
                                className="w-7 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold active:scale-95"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                value={set.reps_performed === 0 ? '' : set.reps_performed}
                                onChange={(e) =>
                                  updateSetField(
                                    ex.exercise_id,
                                    idx,
                                    'reps_performed',
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-12 h-8 rounded-lg bg-white text-black font-extrabold text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500 shadow-inner"
                                inputMode="numeric"
                                placeholder={lastPerf ? String(lastPerf.reps) : '0'}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = Number(set.reps_performed) || 0;
                                  updateSetField(
                                    ex.exercise_id,
                                    idx,
                                    'reps_performed',
                                    cur + 1
                                  );
                                }}
                                className="w-7 h-8 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center font-bold active:scale-95"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[10px] text-zinc-500 pr-1 font-bold">
                                rep
                              </span>
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
                                updateSetField(ex.exercise_id, i, 'rpe', rpeVal)
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
                className="w-full py-4 rounded-2xl bg-[#ff1a00] text-white font-extrabold text-base tracking-wide shadow-lg shadow-red-950/40 hover:bg-red-600 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {currentExerciseIndex < planDay.exercises.length - 1
                    ? 'Finalizar e ir para próximo'
                    : 'Concluir Treino Completo!'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleSkipExercise}
                className="w-full py-3.5 rounded-2xl bg-transparent border border-white/20 text-zinc-300 font-bold text-sm hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <SkipForward className="w-4 h-4 text-zinc-400" />
                <span>Pular exercício</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE REORDENAÇÃO & SUBSTITUIÇÃO DE EXERCÍCIOS */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <h3 className="text-base font-black text-white">Reorganizar / Trocar</h3>
                <p className="text-[11px] text-zinc-400">
                  Aparelho ocupado? Mude a ordem ou substitua por outro do mesmo músculo
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
                const isCompleted = (exerciseLogs[item.exercise_id] || []).every(
                  (s) => s.completed
                );

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
                          <p className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[170px]">
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
                      {/* Botão de Substituir Exercício */}
                      <button
                        type="button"
                        onClick={() => setSubstitutingExerciseIdx(idx)}
                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 transition-colors"
                        title="Trocar por outro exercício do mesmo músculo"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

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

      {/* MODAL DE SUBSTITUIÇÃO ESPECÍFICA DE EXERCÍCIO */}
      {substitutingExerciseIdx !== null && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <h3 className="text-base font-black text-white">Substituir Exercício</h3>
                <p className="text-[11px] text-zinc-400">
                  Exercícios equivalentes para:{' '}
                  <strong className="text-white capitalize">
                    {sessionExercises[substitutingExerciseIdx]?.exercise.target_muscle}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setSubstitutingExerciseIdx(null);
                  setSubstituteFilterText('');
                }}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Buscar aparelho ou exercício..."
              value={substituteFilterText}
              onChange={(e) => setSubstituteFilterText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />

            <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto">
              {(() => {
                const targetMuscle =
                  sessionExercises[substitutingExerciseIdx]?.exercise.target_muscle;
                const currentId =
                  sessionExercises[substitutingExerciseIdx]?.exercise.id;

                const candidates = EXERCISE_DATABASE.filter(
                  (ex) =>
                    ex.target_muscle === targetMuscle &&
                    ex.id !== currentId &&
                    (substituteFilterText
                      ? ex.name.toLowerCase().includes(substituteFilterText.toLowerCase())
                      : true)
                );

                if (candidates.length === 0) {
                  return (
                    <p className="text-xs text-zinc-500 text-center py-6">
                      Nenhum outro exercício encontrado com esse filtro.
                    </p>
                  );
                }

                return candidates.map((cand) => (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => handleSubstituteExercise(cand)}
                    className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/5 hover:border-amber-500/30 text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                        {cand.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                        Equipamento: {cand.category}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Selecionar →
                    </span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
