import React, { useState, useEffect, useRef } from 'react';
import {
  Exercise,
  WorkoutSetLog,
  MuscleGroup,
  MUSCLE_LABELS,
  WorkoutPlanExercise,
} from '../types';
import { FitnessStorageService } from '../services/storageService';
import { calculateDoubleProgression } from '../utils/progressionLogic';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import {
  X,
  ChevronDown,
  Clock,
  Check,
  Plus,
  Minus,
  Trash2,
  Trophy,
  Sparkles,
  Timer,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  Info,
  Flame,
  Dumbbell,
  Repeat,
  RotateCcw,
  CheckCircle2,
  Zap,
} from 'lucide-react';

interface ExerciseExecutionModalProps {
  exercise: Exercise;
  isOpen: boolean;
  onClose: () => void;
  // Optional plan context if launched during a full workout
  planExercise?: WorkoutPlanExercise;
  onSaveSets?: (exerciseId: string, sets: WorkoutSetLog[]) => void;
  // Optional navigation for multi-exercise workout sessions
  onNextExercise?: () => void;
  onPrevExercise?: () => void;
  hasPrevExercise?: boolean;
  hasNextExercise?: boolean;
  currentIndex?: number;
  totalExercises?: number;
}

// Web Audio API chime
function playSoundEffect(type: 'complete' | 'click' | 'timer') {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();

    if (type === 'complete') {
      // Triad chord in D Major / A Major (rewarding ping)
      [587.33, 739.99, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } else {
      // Timer finish chime
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
      });
    }
  } catch {
    // Audio context may be restricted
  }
}

export const ExerciseExecutionModal: React.FC<ExerciseExecutionModalProps> = ({
  exercise,
  isOpen,
  onClose,
  planExercise,
  onSaveSets,
  onNextExercise,
  onPrevExercise,
  hasPrevExercise = false,
  hasNextExercise = false,
  currentIndex = 1,
  totalExercises = 1,
}) => {
  if (!isOpen) return null;

  // Retrieve last recorded performance from storage
  const lastHistory = FitnessStorageService.getLastPerformanceForExercise(exercise.id);

  // Default starting weight based on exercise & history
  const defaultWeight =
    lastHistory?.[0]?.weight_kg ||
    (exercise.id.includes('deadlift')
      ? 80
      : exercise.id.includes('squat')
      ? 70
      : exercise.id.includes('bench')
      ? 60
      : exercise.category === 'dumbbell'
      ? 14
      : exercise.category === 'machine'
      ? 45
      : 20);

  const targetMinReps = planExercise?.min_reps || 8;
  const targetMaxReps = planExercise?.max_reps || 12;
  const initialSetsCount = planExercise?.target_sets || 4;

  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Show instructions accordion
  const [showInstructions, setShowInstructions] = useState(false);

  // Timer: Exercise elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer: Rest timer
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number | null>(null);
  const [restTotalSeconds, setRestTotalSeconds] = useState(planExercise?.rest_seconds || 90);

  useEffect(() => {
    if (restSecondsRemaining === null || restSecondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (soundEnabled) playSoundEffect('timer');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [restSecondsRemaining, soundEnabled]);

  // Sets state
  const [sets, setSets] = useState<WorkoutSetLog[]>(() => {
    const initial: WorkoutSetLog[] = [];
    for (let i = 1; i <= initialSetsCount; i++) {
      const hist = lastHistory?.[i - 1];
      initial.push({
        id: `set-${exercise.id}-${i}-${Date.now()}`,
        set_number: i,
        weight_kg: hist ? hist.weight_kg : defaultWeight,
        reps_performed: hist ? hist.reps_performed : targetMinReps,
        rpe: hist?.rpe || 8,
        completed: false,
      });
    }
    return initial;
  });

  // Active selected set index for large steppers
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const activeSet = sets[activeSetIndex] || sets[0];

  // Progressive overload calculation
  const isUpperBody = !['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(
    exercise.target_muscle || 'chest'
  );
  const progression = calculateDoubleProgression({
    targetMinReps,
    targetMaxReps,
    lastSessionSets: lastHistory || [],
    isUpperBody,
  });

  // Adjust active set field
  const updateActiveSet = (field: keyof WorkoutSetLog, value: any) => {
    setSets((prev) =>
      prev.map((s, idx) => (idx === activeSetIndex ? { ...s, [field]: value } : s))
    );
  };

  // Steppers for Weight
  const adjustWeight = (delta: number) => {
    if (soundEnabled) playSoundEffect('click');
    const newWeight = Math.max(0, Math.round(((activeSet.weight_kg || 0) + delta) * 10) / 10);
    updateActiveSet('weight_kg', newWeight);
  };

  // Steppers for Reps
  const adjustReps = (delta: number) => {
    if (soundEnabled) playSoundEffect('click');
    const newReps = Math.max(1, (activeSet.reps_performed || 0) + delta);
    updateActiveSet('reps_performed', newReps);
  };

  // Mark set complete
  const toggleSetComplete = (index: number) => {
    const targetSet = sets[index];
    if (!targetSet) return;
    const willBeCompleted = !targetSet.completed;

    if (willBeCompleted && soundEnabled) {
      playSoundEffect('complete');
    }

    setSets((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, completed: willBeCompleted } : s))
    );

    if (willBeCompleted) {
      // Start rest timer
      setRestSecondsRemaining(restTotalSeconds);
      // Auto advance to next pending set if available
      const nextPendingIndex = sets.findIndex((s, idx) => idx > index && !s.completed);
      if (nextPendingIndex !== -1) {
        setActiveSetIndex(nextPendingIndex);
      }
    }
  };

  // Add new set
  const handleAddSet = () => {
    if (soundEnabled) playSoundEffect('click');
    const last = sets[sets.length - 1];
    const newSet: WorkoutSetLog = {
      id: `set-${exercise.id}-${sets.length + 1}-${Date.now()}`,
      set_number: sets.length + 1,
      weight_kg: last ? last.weight_kg : defaultWeight,
      reps_performed: last ? last.reps_performed : targetMinReps,
      rpe: 8,
      completed: false,
    };
    const updated = [...sets, newSet];
    setSets(updated);
    setActiveSetIndex(updated.length - 1);
  };

  // Remove set
  const handleRemoveSet = (index: number) => {
    if (sets.length <= 1) return;
    if (soundEnabled) playSoundEffect('click');
    const updated = sets
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, set_number: idx + 1 }));
    setSets(updated);
    setActiveSetIndex((prev) => Math.min(prev, updated.length - 1));
  };

  // Save and close
  const handleSaveAndClose = () => {
    if (onSaveSets) {
      onSaveSets(exercise.id, sets);
    }
    // Also save performance record to local history
    const completedSets = sets.filter((s) => s.completed);
    if (completedSets.length > 0) {
      FitnessStorageService.recordExercisePerformance(exercise.id, completedSets);
    }
    onClose();
  };

  // Format timer
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const completedSetsCount = sets.filter((s) => s.completed).length;
  const isAllCompleted = sets.length > 0 && sets.every((s) => s.completed);

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b]/98 backdrop-blur-2xl flex flex-col overflow-hidden animate-fade-in font-sans text-zinc-100 select-none">
      {/* ========================================================================= */}
      {/* 1. TOP BAR / HEADER (Chevron collapse, timer, sound, close)              */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Minimizar / Salvar"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                Execução do Exercício
              </span>
              {totalExercises > 1 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  {currentIndex} de {totalExercises}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-200 font-semibold">{formatTimer(elapsedSeconds)}</span>
              <span>·</span>
              <span>
                {completedSetsCount}/{sets.length} séries concluídas
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-zinc-800 border-zinc-700 text-white'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title={soundEnabled ? 'Som ativado' : 'Som desativado'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar e Salvar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. CRONÔMETRO DE DESCANSO FLUTUANTE (SE ATIVO)                           */}
      {/* ========================================================================= */}
      {restSecondsRemaining !== null && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block tracking-wider">
                Descanso entre Séries
              </span>
              <span className="text-base font-bold font-mono text-white leading-none">
                {formatTimer(restSecondsRemaining)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRestSecondsRemaining((prev) => (prev || 0) + 30)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-all cursor-pointer active:scale-95"
            >
              +30s
            </button>
            <button
              type="button"
              onClick={() => setRestSecondsRemaining(null)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-400 hover:text-white transition-all cursor-pointer active:scale-95"
            >
              Pular
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CONTEÚDO CENTRAL ROLÁVEL                                               */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-3xl w-full mx-auto space-y-5 pb-32">
        {/* ======================================================================= */}
        {/* CARD HERO DO EXERCÍCIO COM ILUSTRAÇÃO VETORIAL BIOMECÂNICA             */}
        {/* ======================================================================= */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden relative">
          {/* Ilustração Vetorial de Alta Precisão */}
          <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden mb-4 border border-zinc-800 bg-zinc-950 shadow-inner relative group">
            <ExerciseVectorIllustration
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              targetMuscle={exercise.target_muscle}
              category={exercise.category}
              imageUrl={exercise.thumbnail_url}
              className="w-full h-full object-contain"
              showBiomechanics={true}
            />

            {/* Badges sobrepostas na imagem vetorial */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md text-[10px] font-semibold text-white border border-zinc-700/60 shadow-sm">
                {MUSCLE_LABELS[exercise.target_muscle as MuscleGroup] || exercise.target_muscle}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md text-[10px] font-medium text-zinc-300 border border-zinc-800 shadow-sm capitalize">
                {exercise.category === 'barbell'
                  ? 'Barra Olímpica'
                  : exercise.category === 'dumbbell'
                  ? 'Halteres'
                  : exercise.category === 'machine'
                  ? 'Máquina'
                  : exercise.category === 'cable'
                  ? 'Polia & Cabo'
                  : 'Peso Corporal'}
              </span>
            </div>

            {/* Target Reps Badge */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-950/85 backdrop-blur-md text-[11px] font-mono font-medium text-zinc-300 border border-zinc-800">
              Meta: {targetMinReps}-{targetMaxReps} reps
            </div>
          </div>

          {/* Nome e Navegação rápida de exercícios se houver */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug">
                {exercise.name}
              </h2>
              {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                  <span className="text-slate-500 font-semibold">Sinergistas:</span>
                  <span>
                    {exercise.secondary_muscles
                      .map((sm) => MUSCLE_LABELS[sm as MuscleGroup] || sm)
                      .join(' · ')}
                  </span>
                </div>
              )}
            </div>

            {/* Seletor Anterior / Próximo Exercício */}
            {(hasPrevExercise || hasNextExercise) && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={!hasPrevExercise}
                  onClick={onPrevExercise}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                  title="Exercício anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  disabled={!hasNextExercise}
                  onClick={onNextExercise}
                  className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none text-slate-300"
                  title="Próximo exercício"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Botão de instruções passo a passo (gaveta retrátil) */}
          <div className="mt-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-400" />
                Guia de Biomecânica & Instruções de Execução
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {showInstructions ? 'Fechar ▲' : 'Ver Dicas ▼'}
              </span>
            </button>

            {showInstructions && (
              <div className="mt-2.5 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1.5 animate-fade-in">
                {exercise.instructions && exercise.instructions.length > 0 ? (
                  exercise.instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-mono font-medium text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-400">
                    Mantenha a postura alinhada, execute a fase excêntrica de forma controlada (2-3 segundos) e concentre a força no grupo muscular alvo.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Banner de Dupla Progressão */}
          {progression.shouldIncreaseWeight && (
            <div className="mt-3 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-white text-zinc-950 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-300 block">
                  Meta de Sobrecarga Progressiva
                </span>
                <span className="text-xs text-zinc-300 leading-snug">
                  {progression.reason}
                </span>
              </div>
              {progression.suggestedWeightKg && (
                <div className="text-right">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-zinc-800 text-white border border-zinc-700 whitespace-nowrap">
                    {progression.suggestedWeightKg} kg
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* 4. CARDS DE CARGA (KG) E REPETIÇÕES (REPS) - MINIMALISTA                */}
        {/* ======================================================================= */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-zinc-400" />
              Ajuste da Série: <span className="text-white">Série {activeSet?.set_number || 1}</span>
            </span>
            {lastHistory?.[activeSetIndex] && (
              <span className="text-xs font-mono text-zinc-400">
                Último treino: {lastHistory[activeSetIndex].weight_kg}kg × {lastHistory[activeSetIndex].reps_performed}
              </span>
            )}
          </div>

          {/* Grid de 2 Cards: CARGA (KG) e REPETIÇÕES (REPS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD 1: CARGA (PESO EM KG) */}
            <div className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-zinc-400" />
                  Carga (kg)
                </span>
                <span className="text-[10px] font-mono text-zinc-500 font-medium uppercase">
                  Incremento: 2.5 kg
                </span>
              </div>

              {/* Display de Valor Central com Steppers Laterais */}
              <div className="flex items-center justify-between py-2">
                <button
                  type="button"
                  onClick={() => adjustWeight(-2.5)}
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
                    onChange={(e) => updateActiveSet('weight_kg', parseFloat(e.target.value) || 0)}
                    className="w-32 sm:w-36 text-center text-4xl sm:text-5xl font-bold font-mono text-white bg-transparent outline-none focus:text-white transition-colors"
                  />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 block">
                    QUILOGRAMAS
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustWeight(2.5)}
                  className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-zinc-700/60"
                  title="Aumentar 2.5 kg"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Chips Rápidos de Incremento */}
              <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-zinc-800/80 mt-2">
                {[-5, -1, 1, 5].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => adjustWeight(delta)}
                    className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-medium text-zinc-300 transition-all cursor-pointer active:scale-95"
                  >
                    {delta > 0 ? `+${delta}` : delta}kg
                  </button>
                ))}
              </div>
            </div>

            {/* CARD 2: REPETIÇÕES (REPS) */}
            <div className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-zinc-400" />
                  Repetições
                </span>
                <span className="text-[10px] font-mono text-zinc-500 font-medium uppercase">
                  Meta: {targetMinReps}-{targetMaxReps}
                </span>
              </div>

              {/* Display de Valor Central com Steppers Laterais */}
              <div className="flex items-center justify-between py-2">
                <button
                  type="button"
                  onClick={() => adjustReps(-1)}
                  className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-zinc-700/60"
                  title="Diminuir 1 repetição"
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
                    onChange={(e) => updateActiveSet('reps_performed', parseInt(e.target.value, 10) || 0)}
                    className="w-32 sm:w-36 text-center text-4xl sm:text-5xl font-bold font-mono text-white bg-transparent outline-none focus:text-white transition-colors"
                  />
                  <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 block">
                    REPETIÇÕES
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustReps(1)}
                  className="w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 border border-zinc-700/60"
                  title="Aumentar 1 repetição"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Atalhos de Metas Rápidas de Reps */}
              <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-zinc-800/80 mt-2">
                {[6, 8, 10, 12, 15].map((target) => (
                  <button
                    key={target}
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playSoundEffect('click');
                      updateActiveSet('reps_performed', target);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer active:scale-95 ${
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

          {/* SELETOR DE ESFORÇO PERCEBIDO (RPE / RIR - 1 a 10) */}
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

            {/* Escala Completa de RPE 1 a 10 */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
                const isCurrent = (activeSet?.rpe || 8) === val;

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      if (soundEnabled) playSoundEffect('click');
                      updateActiveSet('rpe', val);
                    }}
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
        </div>

        {/* ======================================================================= */}
        {/* 5. LISTA & HISTÓRICO DE SÉRIES (SÉRIE 1, 2, 3...)                        */}
        {/* ======================================================================= */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Registro das Séries
            </h3>
            <button
              type="button"
              onClick={handleAddSet}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Série
            </button>
          </div>

          {/* Tabela de Séries */}
          <div className="space-y-2">
            {sets.map((set, idx) => {
              const isActive = idx === activeSetIndex;
              const prevPerf = lastHistory?.[idx];

              return (
                <div
                  key={set.id}
                  onClick={() => setActiveSetIndex(idx)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-zinc-800/90 border-zinc-600 shadow-sm'
                      : set.completed
                      ? 'bg-zinc-900/40 border-zinc-800/60'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  {/* Número da Série e Tag */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                        set.completed
                          ? 'bg-white text-zinc-950'
                          : isActive
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {set.completed ? <Check className="w-4 h-4 stroke-[3]" /> : set.set_number}
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Série {set.set_number}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {prevPerf ? `Anterior: ${prevPerf.weight_kg}kg × ${prevPerf.reps_performed}` : 'Primeira vez'}
                      </span>
                    </div>
                  </div>

                  {/* Carga, Repetições e RPE Gravados */}
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-sm font-bold font-mono text-white block">
                        {set.weight_kg} kg × {set.reps_performed} reps
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextRpe = ((set.rpe || 8) % 10) + 1;
                            setSets((prev) =>
                              prev.map((s, sIdx) => (sIdx === idx ? { ...s, rpe: nextRpe } : s))
                            );
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium border border-zinc-700 bg-zinc-800 text-zinc-300 cursor-pointer hover:border-zinc-500 transition-all"
                          title="Clique para alternar RPE (1-10)"
                        >
                          RPE {set.rpe || 8}
                        </span>
                      </div>
                    </div>

                    {/* Botão de Checkmark da Série */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSetComplete(idx);
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                        set.completed
                          ? 'bg-white text-zinc-950 shadow-sm'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/60'
                      }`}
                      title={set.completed ? 'Marcar como pendente' : 'Concluir série'}
                    >
                      <Check className={`w-5 h-5 stroke-[2.5] ${set.completed ? 'text-zinc-950' : ''}`} />
                    </button>

                    {/* Excluir Série se houver mais de uma */}
                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSet(idx);
                        }}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remover série"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. DOCK / BOTÃO PRINCIPAL DE CONCLUIR SÉRIE (FIXO NA PARTE INFERIOR)       */}
      {/* ========================================================================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Botão de Concluir Série Ativa ou Próximo Exercício */}
          {!activeSet?.completed ? (
            <button
              type="button"
              onClick={() => toggleSetComplete(activeSetIndex)}
              className="flex-1 py-3.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              Concluir Série {activeSet?.set_number || 1} ({activeSet?.weight_kg || 0}kg × {activeSet?.reps_performed || 0})
            </button>
          ) : isAllCompleted ? (
            hasNextExercise ? (
              <button
                type="button"
                onClick={onNextExercise}
                className="flex-1 py-3.5 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                Próximo Exercício <ChevronRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="flex-1 py-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-bold text-sm tracking-wide shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 stroke-[3]" />
                Exercício Concluído (Salvar & Fechar)
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                // Find next incomplete set
                const nextIncomplete = sets.findIndex((s) => !s.completed);
                if (nextIncomplete !== -1) setActiveSetIndex(nextIncomplete);
                else handleAddSet();
              }}
              className="flex-1 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-white font-bold text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Ir Para Próxima Série Pendente
            </button>
          )}

          {/* Botão Secundário: Adicionar Nova Série */}
          <button
            type="button"
            onClick={handleAddSet}
            className="p-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-800"
            title="Adicionar Série"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
