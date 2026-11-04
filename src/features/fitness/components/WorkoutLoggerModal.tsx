import React, { useState, useEffect, useRef } from 'react';
import {
  WorkoutPlanDay,
  WorkoutSession,
  WorkoutSetLog,
  MuscleGroup,
  MUSCLE_LABELS,
} from '../types';
import { FitnessStorageService } from '../services/storageService';
import { calculateDoubleProgression, calculateVolumeLoad } from '../utils/progressionLogic';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import {
  X,
  Clock,
  Play,
  Check,
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  Flame,
  ChevronRight,
  ChevronLeft,
  Timer,
  AlertCircle,
  HelpCircle,
  Trophy,
  Volume2,
  VolumeX,
  Dumbbell,
  Repeat,
  Zap,
} from 'lucide-react';

interface WorkoutLoggerModalProps {
  planDay: WorkoutPlanDay;
  isOpen: boolean;
  onClose: () => void;
  onSessionCompleted: (session: WorkoutSession) => void;
}

// Síntese de áudio nativa via Web Audio API para feedback tátil de alta fidelidade
function playChime(type: 'set' | 'timer') {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();

    if (type === 'set') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      // Timer finish chime (tríade limpa)
      [659.25, 880, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
    }
  } catch {
    // Silencia se áudio for bloqueado pelo navegador
  }
}

export const WorkoutLoggerModal: React.FC<WorkoutLoggerModalProps> = ({
  planDay,
  isOpen,
  onClose,
  onSessionCompleted,
}) => {
  if (!isOpen) return null;

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Inicializa as séries buscando automaticamente o peso do último treino realizado
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, WorkoutSetLog[]>>(() => {
    const initial: Record<string, WorkoutSetLog[]> = {};
    planDay.exercises.forEach((planEx) => {
      const lastHistory = FitnessStorageService.getLastPerformanceForExercise(planEx.exercise_id);
      const defaultWeight = lastHistory?.[0]?.weight_kg || (planEx.exercise_id.includes('deadlift') ? 80 : 20);

      const sets: WorkoutSetLog[] = [];
      for (let i = 1; i <= planEx.target_sets; i++) {
        sets.push({
          id: `set-${planEx.exercise_id}-${i}`,
          set_number: i,
          weight_kg: defaultWeight,
          reps_performed: planEx.min_reps,
          rpe: 8,
          completed: false,
        });
      }
      initial[planEx.exercise_id] = sets;
    });
    return initial;
  });

  // Cronômetro de duração do treino
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cronômetro de descanso entre séries
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (restSecondsRemaining === null || restSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (soundEnabled) playChime('timer');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restSecondsRemaining, soundEnabled]);

  const currentPlanEx = planDay.exercises[activeExerciseIndex] || planDay.exercises[0];
  const currentEx = currentPlanEx?.exercise;
  const currentSets = exerciseLogs[currentPlanEx?.exercise_id] || [];

  // Busca o histórico do último treino do exercício atual
  const lastHistory = FitnessStorageService.getLastPerformanceForExercise(currentPlanEx?.exercise_id);

  // Cálculo da Dupla Progressão
  const isUpperBody = !['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(
    currentEx?.target_muscle || 'chest'
  );
  const progression = calculateDoubleProgression({
    targetMinReps: currentPlanEx?.min_reps || 8,
    targetMaxReps: currentPlanEx?.max_reps || 12,
    lastSessionSets: lastHistory || [],
    isUpperBody,
  });

  const [activeSetIndex, setActiveSetIndex] = useState(0);

  // Reseta a série selecionada para a primeira incompleta ao trocar de exercício
  useEffect(() => {
    const nextIncomplete = currentSets.findIndex((s) => !s.completed);
    setActiveSetIndex(nextIncomplete !== -1 ? nextIncomplete : 0);
  }, [activeExerciseIndex]);

  const activeSet = currentSets[activeSetIndex] || currentSets[0];

  // Ajuste rápido de carga
  const adjustActiveWeight = (delta: number) => {
    if (!activeSet) return;
    const newWeight = Math.max(0, Math.round(((activeSet.weight_kg || 0) + delta) * 10) / 10);
    updateSet(activeSet.id, 'weight_kg', newWeight);
  };

  // Ajuste rápido de repetições
  const adjustActiveReps = (delta: number) => {
    if (!activeSet) return;
    const newReps = Math.max(1, (activeSet.reps_performed || 0) + delta);
    updateSet(activeSet.id, 'reps_performed', newReps);
  };

  // Atualizar campo da série
  const updateSet = (setId: string, field: keyof WorkoutSetLog, value: any) => {
    setExerciseLogs((prev) => {
      const sets = prev[currentPlanEx.exercise_id] || [];
      const updated = sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s));
      return { ...prev, [currentPlanEx.exercise_id]: updated };
    });
  };

  // Concluir série com feedback sonoro e disparo automático do cronômetro de descanso
  const toggleSetComplete = (setId: string) => {
    setExerciseLogs((prev) => {
      const sets = prev[currentPlanEx.exercise_id] || [];
      const targetIndex = sets.findIndex((s) => s.id === setId);
      const target = sets[targetIndex];
      const wasCompleted = target?.completed;

      const updated = sets.map((s) => (s.id === setId ? { ...s, completed: !wasCompleted } : s));

      if (!wasCompleted) {
        if (soundEnabled) playChime('set');
        setRestSecondsRemaining(currentPlanEx.rest_seconds || 90);
        // Avança automaticamente para a próxima série pendente
        const nextPending = updated.findIndex((s, idx) => idx > targetIndex && !s.completed);
        if (nextPending !== -1) {
          setActiveSetIndex(nextPending);
        }
      }

      return { ...prev, [currentPlanEx.exercise_id]: updated };
    });
  };

  const addSet = () => {
    setExerciseLogs((prev) => {
      const sets = prev[currentPlanEx.exercise_id] || [];
      const lastSet = sets[sets.length - 1];
      const newSet: WorkoutSetLog = {
        id: `set-${currentPlanEx.exercise_id}-${Date.now()}`,
        set_number: sets.length + 1,
        weight_kg: lastSet ? lastSet.weight_kg : 20,
        reps_performed: lastSet ? lastSet.reps_performed : currentPlanEx.min_reps,
        rpe: 8,
        completed: false,
      };
      const updated = [...sets, newSet];
      setActiveSetIndex(updated.length - 1);
      return { ...prev, [currentPlanEx.exercise_id]: updated };
    });
  };

  const removeSet = (setId: string) => {
    setExerciseLogs((prev) => {
      const sets = prev[currentPlanEx.exercise_id] || [];
      if (sets.length <= 1) return prev;
      const filtered = sets
        .filter((s) => s.id !== setId)
        .map((s, idx) => ({ ...s, set_number: idx + 1 }));
      setActiveSetIndex((prev) => Math.min(prev, filtered.length - 1));
      return { ...prev, [currentPlanEx.exercise_id]: filtered };
    });
  };

  // Finalizar sessão completa
  const handleFinishWorkout = () => {
    const totalCompletedSets = Object.values(exerciseLogs)
      .flat()
      .filter((s) => s.completed);

    if (totalCompletedSets.length === 0) {
      if (!window.confirm('Você não marcou nenhuma série como concluída. Deseja finalizar mesmo assim?')) {
        return;
      }
    }

    const session: WorkoutSession = {
      id: `session-${Date.now()}`,
      plan_day_id: planDay.id,
      plan_day_title: planDay.day_name,
      started_at: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      notes: `Treino de ${planDay.day_name} executado com sucesso no Personal Hub.`,
      exercises_logs: exerciseLogs,
    };

    onSessionCompleted(session);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalCompletedSetsCount = Object.values(exerciseLogs)
    .flat()
    .filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b]/98 backdrop-blur-2xl flex flex-col overflow-hidden animate-fade-in font-sans text-zinc-100 select-none">
      {/* TOP BAR: EXECUÇÃO DO TREINO - MINIMALISTA */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Minimizar treino"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
                {planDay.day_name}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-mono font-medium text-zinc-200">{formatTimer(elapsedSeconds)}</span>
              <span>·</span>
              <span>{totalCompletedSetsCount} séries concluídas</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title={soundEnabled ? 'Áudio ativado' : 'Áudio silenciado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleFinishWorkout}
            className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-sm"
          >
            Concluir Treino
          </button>
        </div>
      </header>

      {/* CRONÔMETRO DE DESCANSO FLUTUANTE (SE ATIVO) */}
      {restSecondsRemaining !== null && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Timer className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">Descanso entre Séries:</span>
            <span className="text-base font-bold font-mono text-white">
              {formatTimer(restSecondsRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRestSecondsRemaining((prev) => (prev || 0) + 30)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => setRestSecondsRemaining(null)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
            >
              Pular
            </button>
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL ROLÁVEL */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl w-full mx-auto space-y-5">
        {/* CARROSSEL / SELETOR DE EXERCÍCIOS DA SESSÃO */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {planDay.exercises.map((pe, idx) => {
            const isCurrent = idx === activeExerciseIndex;
            const sets = exerciseLogs[pe.exercise_id] || [];
            const isCompleted = sets.length > 0 && sets.every((s) => s.completed);

            return (
              <button
                key={pe.id}
                type="button"
                onClick={() => setActiveExerciseIndex(idx)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all shrink-0 cursor-pointer text-left ${
                  isCurrent
                    ? 'bg-zinc-800 border-zinc-500 text-white'
                    : isCompleted
                    ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
                    : 'bg-zinc-900/40 border-zinc-800/50 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                  <ExerciseVectorIllustration
                    exerciseId={pe.exercise.id}
                    exerciseName={pe.exercise.name}
                    targetMuscle={pe.exercise.target_muscle}
                    category={pe.exercise.category}
                    imageUrl={pe.exercise.thumbnail_url}
                    showBiomechanics={false}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${
                    isCompleted
                      ? 'bg-zinc-700 text-white'
                      : isCurrent
                      ? 'bg-white text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block max-w-[130px] truncate">
                    {pe.exercise.name}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {sets.filter((s) => s.completed).length}/{pe.target_sets} séries
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* CARD PRINCIPAL DO EXERCÍCIO ATIVO */}
        {/* CARD PRINCIPAL DO EXERCÍCIO ATIVO COM DESIGN INSPIRADO EM IMG_5893 */}
        {currentPlanEx && (
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
            {/* ILUSTRAÇÃO VETORIAL DO EXERCÍCIO (VETOR BIOMECÂNICO) */}
            <div className="w-full h-44 sm:h-56 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner relative">
              <ExerciseVectorIllustration
                exerciseId={currentEx.id}
                exerciseName={currentEx.name}
                targetMuscle={currentEx.target_muscle}
                category={currentEx.category}
                imageUrl={currentEx.thumbnail_url}
                className="w-full h-full object-contain"
                showBiomechanics={true}
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 backdrop-blur-md text-[10px] font-semibold text-white border border-zinc-700/80 shadow-sm">
                  {MUSCLE_LABELS[currentEx.target_muscle as MuscleGroup]}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-zinc-900/90 backdrop-blur-md text-[10px] font-medium text-zinc-300 border border-zinc-700/60 shadow-sm capitalize">
                  {currentEx.category === 'barbell'
                    ? 'Barra Olímpica'
                    : currentEx.category === 'dumbbell'
                    ? 'Halteres'
                    : currentEx.category === 'machine'
                    ? 'Máquina'
                    : currentEx.category === 'cable'
                    ? 'Cabo & Polia'
                    : 'Peso Corporal'}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-900/90 backdrop-blur-md text-[11px] font-mono font-medium text-zinc-300 border border-zinc-700/60">
                Meta: {currentPlanEx.min_reps}-{currentPlanEx.max_reps} reps
              </div>
            </div>

            {/* Cabeçalho do Exercício e Navegação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  {currentEx.name}
                </h3>
                {currentEx.secondary_muscles && currentEx.secondary_muscles.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <span className="text-zinc-500 font-medium">Sinergistas:</span>
                    <span>
                      {currentEx.secondary_muscles
                        .map((sm) => MUSCLE_LABELS[sm as MuscleGroup] || sm)
                        .join(' · ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Navegação entre Exercícios da Ficha */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  disabled={activeExerciseIndex === 0}
                  onClick={() => setActiveExerciseIndex((prev) => Math.max(0, prev - 1))}
                  className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Exercício anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono font-semibold text-zinc-400 px-1">
                  {activeExerciseIndex + 1} / {planDay.exercises.length}
                </span>
                <button
                  type="button"
                  disabled={activeExerciseIndex === planDay.exercises.length - 1}
                  onClick={() =>
                    setActiveExerciseIndex((prev) =>
                      Math.min(planDay.exercises.length - 1, prev + 1)
                    )
                  }
                  className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Próximo exercício"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* BANNER DE SOBRECARGA PROGRESSIVA - MINIMALISTA */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-300 mt-0.5">
                  {progression.shouldIncreaseWeight ? (
                    <Trophy className="w-4 h-4 text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white">
                      {progression.shouldIncreaseWeight
                        ? 'Meta: Aumentar Carga'
                        : 'Meta: Dupla Progressão'}
                    </span>
                    {progression.suggestedWeightKg && (
                      <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-white border border-zinc-700">
                        Meta: {progression.suggestedWeightKg} kg
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {progression.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* DUAL STEPPER CARDS FOR WEIGHT & REPS - MINIMALISTA                  */}
            {/* =================================================================== */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-zinc-400" />
                  Ajuste Rápido: <span className="text-white">Série {activeSet?.set_number || 1}</span>
                </span>
                {lastHistory?.[activeSetIndex] && (
                  <span className="text-xs font-mono text-zinc-400">
                    Anterior: {lastHistory[activeSetIndex].weight_kg}kg × {lastHistory[activeSetIndex].reps_performed}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* CARD 1: CARGA (KG) COM STEPPERS */}
                <div className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-zinc-400" /> Carga (kg)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 font-medium uppercase">
                      ± 2.5 kg
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <button
                      type="button"
                      onClick={() => adjustActiveWeight(-2.5)}
                      className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-zinc-700/60"
                      title="Diminuir 2.5 kg"
                    >
                      <Minus className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <div className="text-center px-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="600"
                        value={activeSet?.weight_kg ?? 0}
                        onChange={(e) =>
                          activeSet && updateSet(activeSet.id, 'weight_kg', parseFloat(e.target.value) || 0)
                        }
                        className="w-28 sm:w-32 text-center text-3xl sm:text-4xl font-bold font-mono text-white bg-transparent outline-none focus:text-white transition-colors"
                      />
                      <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-500 block">
                        QUILOGRAMAS
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustActiveWeight(2.5)}
                      className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-zinc-700/60"
                      title="Aumentar 2.5 kg"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 pt-2.5 border-t border-zinc-800/80 mt-1.5">
                    {[-5, -1, 1, 5].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => adjustActiveWeight(delta)}
                        className="px-2.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono font-medium text-zinc-300 transition-all cursor-pointer"
                      >
                        {delta > 0 ? `+${delta}` : delta}kg
                      </button>
                    ))}
                  </div>
                </div>

                {/* CARD 2: REPETIÇÕES (REPS) COM STEPPERS */}
                <div className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-4 sm:p-5 shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Repeat className="w-4 h-4 text-zinc-400" /> Repetições
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 font-medium uppercase">
                      Meta: {currentPlanEx.min_reps}-{currentPlanEx.max_reps}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <button
                      type="button"
                      onClick={() => adjustActiveReps(-1)}
                      className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-zinc-700/60"
                      title="Diminuir 1 rep"
                    >
                      <Minus className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    <div className="text-center px-2">
                      <input
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        value={activeSet?.reps_performed ?? 0}
                        onChange={(e) =>
                          activeSet && updateSet(activeSet.id, 'reps_performed', parseInt(e.target.value, 10) || 0)
                        }
                        className="w-28 sm:w-32 text-center text-3xl sm:text-4xl font-bold font-mono text-white bg-transparent outline-none focus:text-white transition-colors"
                      />
                      <span className="text-[9px] font-medium uppercase tracking-widest text-zinc-500 block">
                        REPETIÇÕES
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => adjustActiveReps(1)}
                      className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-zinc-700/60"
                      title="Aumentar 1 rep"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 pt-2.5 border-t border-zinc-800/80 mt-1.5">
                    {[6, 8, 10, 12, 15].map((target) => (
                      <button
                        key={target}
                        type="button"
                        onClick={() => activeSet && updateSet(activeSet.id, 'reps_performed', target)}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-medium transition-all cursor-pointer ${
                          activeSet?.reps_performed === target
                            ? 'bg-white text-zinc-950 font-bold shadow-sm'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {target}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SELETOR RÁPIDO DE ESFORÇO PERCEBIDO (RPE / RIR - 1 a 10) */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Flame className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Intensidade RPE (Série {activeSet?.set_number || 1}):
                </span>
                <span className="text-xs font-mono font-bold text-white bg-zinc-800 px-2 py-0.5 rounded-lg border border-zinc-700">
                  {activeSet?.rpe ? `${activeSet.rpe}/10` : '8/10'}
                </span>
              </div>

              {/* Botões rápidos de RPE de 1 a 10 */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                  const isCurrent = (activeSet?.rpe || 8) === val;

                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => activeSet && updateSet(activeSet.id, 'rpe', val)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-mono text-xs font-semibold shrink-0 border transition-all cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'bg-white text-zinc-950 border-white font-bold shadow-sm scale-105'
                          : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                      title={`RPE ${val}: ${
                        val === 10
                          ? 'Esforço Máximo / Falha'
                          : val === 9
                          ? '1 repetição em reserva'
                          : val === 8
                          ? '2 repetições em reserva'
                          : val === 7
                          ? '3 repetições em reserva'
                          : `${10 - val} repetições em reserva`
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TABELA DE REGISTRO DAS SÉRIES */}
            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3">
                <div className="col-span-2 sm:col-span-1 text-center">Série</div>
                <div className="col-span-2 sm:col-span-2 text-center">Anterior</div>
                <div className="col-span-3 sm:col-span-3 text-center">Carga (kg)</div>
                <div className="col-span-2 sm:col-span-2 text-center">Reps</div>
                <div className="col-span-2 sm:col-span-2 text-center">RPE (1-10)</div>
                <div className="col-span-1 sm:col-span-2 text-center">Status</div>
              </div>

              {currentSets.map((set, sIdx) => {
                const prevSet = lastHistory?.[sIdx];
                const isSelected = sIdx === activeSetIndex;

                return (
                  <div
                    key={set.id}
                    onClick={() => setActiveSetIndex(sIdx)}
                    className={`grid grid-cols-12 gap-2 items-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800/90 border-zinc-600 shadow-sm'
                        : set.completed
                        ? 'bg-zinc-900/40 border-zinc-800/60'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                      <span
                        className={`w-7 h-7 rounded-xl font-mono font-bold text-xs flex items-center justify-center ${
                          set.completed
                            ? 'bg-white text-zinc-950'
                            : isSelected
                            ? 'bg-zinc-700 text-white'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {set.completed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : set.set_number}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-2 text-center">
                      <span className="text-xs font-mono text-zinc-400 block truncate">
                        {prevSet ? `${prevSet.weight_kg}kg × ${prevSet.reps_performed}` : '—'}
                      </span>
                    </div>

                    <div className="col-span-3 sm:col-span-3 flex items-center justify-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={set.weight_kg}
                        onChange={(e) =>
                          updateSet(set.id, 'weight_kg', parseFloat(e.target.value) || 0)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[85px] bg-zinc-900 border border-zinc-700/80 rounded-xl py-2 text-center text-sm font-bold font-mono text-white focus:outline-none focus:border-zinc-400"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-2 flex items-center justify-center">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={set.reps_performed}
                        onChange={(e) =>
                          updateSet(set.id, 'reps_performed', parseInt(e.target.value) || 0)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-[75px] bg-zinc-900 border border-zinc-700/80 rounded-xl py-2 text-center text-sm font-bold font-mono text-white focus:outline-none focus:border-zinc-400"
                      />
                    </div>

                    {/* CAMPO DE ENTRADA RPE (1 A 10) */}
                    <div className="col-span-2 sm:col-span-2 flex items-center justify-center">
                      <div className="relative flex items-center justify-center w-full max-w-[70px]">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="0.5"
                          value={set.rpe ?? 8}
                          onChange={(e) => {
                            const val = Math.min(10, Math.max(1, parseFloat(e.target.value) || 1));
                            updateSet(set.id, 'rpe', val);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl py-2 text-center text-sm font-bold font-mono text-white focus:outline-none focus:border-zinc-400"
                          title="Taxa de Esforço Percebido (RPE 1-10)"
                        />
                      </div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSetComplete(set.id);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          set.completed
                            ? 'bg-white text-zinc-950 shadow-sm'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 border border-zinc-700/60'
                        }`}
                        title="Marcar série como concluída"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ações Inferiores: Adicionar Série */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={addSet}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Série
              </button>

              {currentSets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSet(currentSets[currentSets.length - 1].id)}
                  className="text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors"
                >
                  Remover última série
                </button>
              )}
            </div>

            {/* BOTÃO PRINCIPAL DE CONCLUIR SÉRIE ATIVA */}
            {activeSet && (
              <div className="pt-2">
                {!activeSet.completed ? (
                  <button
                    type="button"
                    onClick={() => toggleSetComplete(activeSet.id)}
                    className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    Concluir Série {activeSet.set_number} ({activeSet.weight_kg}kg × {activeSet.reps_performed} reps)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const nextIncomplete = currentSets.findIndex((s) => !s.completed);
                      if (nextIncomplete !== -1) {
                         setActiveSetIndex(nextIncomplete);
                      } else if (activeExerciseIndex < planDay.exercises.length - 1) {
                        setActiveExerciseIndex((prev) => prev + 1);
                      } else {
                        handleFinishWorkout();
                      }
                    }}
                    className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {currentSets.some((s) => !s.completed)
                      ? 'Avançar Para Próxima Série Pendente'
                      : activeExerciseIndex < planDay.exercises.length - 1
                      ? 'Avançar Para o Próximo Exercício →'
                      : 'Finalizar Este Treino ✓'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
