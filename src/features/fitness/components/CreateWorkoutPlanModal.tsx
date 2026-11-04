import React, { useState } from 'react';
import {
  WorkoutPlan,
  WorkoutPlanDay,
  WorkoutPlanExercise,
  ExerciseTechnique,
  MuscleGroup,
  MUSCLE_LABELS,
  Exercise,
} from '../types';
import { FitnessStorageService } from '../services/storageService';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import { ExerciseDatabaseModal } from './ExerciseDatabaseModal';
import {
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Dumbbell,
  Clock,
  Sparkles,
  ArrowRight,
  Sliders,
  Zap,
} from 'lucide-react';

interface CreateWorkoutPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (newPlan: WorkoutPlan) => void;
  planToEdit?: WorkoutPlan | null;
}

export const CreateWorkoutPlanModal: React.FC<CreateWorkoutPlanModalProps> = ({
  isOpen,
  onClose,
  onSavePlan,
  planToEdit,
}) => {
  const isEditing = Boolean(planToEdit);
  const [title, setTitle] = useState(planToEdit?.title || '');
  const [durationWeeks, setDurationWeeks] = useState<number>(planToEdit?.duration_weeks || 8);
  const [frequencyDaysPerWeek, setFrequencyDaysPerWeek] = useState<number>(() => {
    if (planToEdit?.days) {
      const activeWorkoutDays = planToEdit.days.filter(
        (d) => !d.day_name.toLowerCase().includes('descanso')
      ).length;
      return activeWorkoutDays || 4;
    }
    return 4;
  });

  const [days, setDays] = useState<
    Array<{
      id: string;
      day_name: string;
      is_rest: boolean;
      exercises: WorkoutPlanExercise[];
    }>
  >(() => {
    if (planToEdit?.days && planToEdit.days.length > 0) {
      return planToEdit.days.map((d) => ({
        id: d.id,
        day_name: d.day_name,
        is_rest: d.day_name.toLowerCase().includes('descanso'),
        exercises: d.exercises || [],
      }));
    }
    return generateInitialDays(4);
  });

  // Atualiza os campos caso mude o planToEdit recebido
  React.useEffect(() => {
    if (planToEdit) {
      setTitle(planToEdit.title);
      setDurationWeeks(planToEdit.duration_weeks || 8);
      const activeWorkoutDays = planToEdit.days.filter(
        (d) => !d.day_name.toLowerCase().includes('descanso')
      ).length;
      setFrequencyDaysPerWeek(activeWorkoutDays || 4);
      setDays(
        planToEdit.days.map((d) => ({
          id: d.id,
          day_name: d.day_name,
          is_rest: d.day_name.toLowerCase().includes('descanso'),
          exercises: d.exercises || [],
        }))
      );
    } else {
      setTitle('');
      setDurationWeeks(8);
      setFrequencyDaysPerWeek(4);
      setDays(generateInitialDays(4));
    }
  }, [planToEdit, isOpen]);

  const [selectingExerciseForDayId, setSelectingExerciseForDayId] = useState<string | null>(null);

  // Helper para gerar a estrutura de dias e descansos com base na frequência semanal
  function generateInitialDays(freq: number) {
    const list: Array<{
      id: string;
      day_name: string;
      is_rest: boolean;
      exercises: WorkoutPlanExercise[];
    }> = [];
    const restDaysCount = Math.max(0, 7 - freq);

    const defaultNames: Record<number, string[]> = {
      3: ['Treino A - Peito & Tríceps', 'Treino B - Costas & Bíceps', 'Treino C - Pernas & Ombros'],
      4: ['Treino A - Peito & Tríceps', 'Treino B - Costas & Bíceps', 'Treino C - Pernas Completo', 'Treino D - Ombros & Abdômen'],
      5: ['Push 1 - Peitoral & Tríceps', 'Pull 1 - Dorsais & Bíceps', 'Legs 1 - Quadríceps & Panturrilhas', 'Upper 2 - Superior Geral', 'Legs 2 - Posterior & Glúteos'],
      6: ['Push 1', 'Pull 1', 'Leg 1', 'Push 2', 'Pull 2', 'Leg 2'],
      7: ['Treino 1', 'Treino 2', 'Treino 3', 'Treino 4', 'Treino 5', 'Treino 6', 'Treino 7'],
    };

    const names = defaultNames[freq] || Array.from({ length: freq }, (_, i) => `Treino ${i + 1}`);

    // Adiciona os dias de treino
    names.forEach((name, i) => {
      list.push({
        id: `day-${Date.now()}-${i}`,
        day_name: name,
        is_rest: false,
        exercises: [] as WorkoutPlanExercise[],
      });
    });

    // Adiciona os dias de descanso necessários
    if (restDaysCount > 0) {
      Array.from({ length: restDaysCount }, (_, i) => {
        list.push({
          id: `rest-${Date.now()}-${i}`,
          day_name: restDaysCount > 1 ? `Descanso (${i + 1})` : 'Descanso',
          is_rest: true,
          exercises: [] as WorkoutPlanExercise[],
        });
      });
    }

    return list;
  }

  const handleFrequencyChange = (freq: number) => {
    setFrequencyDaysPerWeek(freq);
    setDays(generateInitialDays(freq));
  };

  const handleAddExerciseToDay = (dayId: string, ex: Exercise) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          const newEx: WorkoutPlanExercise = {
            id: `wpe-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            exercise_id: ex.id,
            exercise: ex,
            target_sets: 3,
            min_reps: 8,
            max_reps: 12,
            order_index: d.exercises.length,
            rest_seconds: 60,
          };
          return { ...d, exercises: [...d.exercises, newEx] };
        }
        return d;
      })
    );
    setSelectingExerciseForDayId(null);
    setExerciseSearch('');
  };

  const handleUpdateExerciseField = (
    dayId: string,
    exercisePlanId: string,
    field: keyof WorkoutPlanExercise,
    value: any
  ) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: d.exercises.map((e) =>
              e.id === exercisePlanId ? { ...e, [field]: value } : e
            ),
          };
        }
        return d;
      })
    );
  };

  const handleRemoveExercise = (dayId: string, exercisePlanId: string) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          return {
            ...d,
            exercises: d.exercises.filter((e) => e.id !== exercisePlanId),
          };
        }
        return d;
      })
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Por favor, informe o título da sua ficha.');
      return;
    }

    const newPlan: WorkoutPlan = {
      id: isEditing && planToEdit ? planToEdit.id : `plan-${Date.now()}`,
      title: title.trim(),
      description: `Ficha de ${frequencyDaysPerWeek}x na semana • Validade de ${durationWeeks} semanas`,
      duration_weeks: Number(durationWeeks) || 8,
      is_active: isEditing && planToEdit ? planToEdit.is_active : true,
      created_at: isEditing && planToEdit ? planToEdit.created_at : new Date().toISOString(),
      days: days.map((d, idx) => ({
        id: d.id,
        plan_id: isEditing && planToEdit ? planToEdit.id : `plan-${Date.now()}`,
        day_name: d.day_name,
        order_index: idx,
        exercises: d.exercises,
      })),
    };

    onSavePlan(newPlan);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#141416] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto text-white">
        {/* Topo: Título e Fechar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white">
              {isEditing ? 'Editar Ficha de Treino' : 'Criar Treino do Zero'}
            </h2>
            <p className="text-xs text-zinc-400">
              {isEditing
                ? 'Ajuste os exercícios e repetições sem reiniciar a validade'
                : 'Monte sua divisão e escolha os exercícios'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Nome da Ficha & Duração em Semanas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-zinc-400">Nome da Ficha</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Minha Rotina Hipertrofia ABCD"
              className="w-full mt-1.5 px-4 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-400">Validade (Semanas)</label>
            <div className="relative mt-1.5">
              <input
                type="number"
                min="1"
                max="52"
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="absolute right-3 top-3.5 text-xs text-zinc-500 font-semibold pointer-events-none">
                sem
              </span>
            </div>
          </div>
        </div>

        {/* Atalhos rápidos para duração */}
        <div className="flex items-center gap-1.5 -mt-2">
          <span className="text-[10px] text-zinc-500 font-medium mr-1">Sugestões:</span>
          {[4, 6, 8, 10, 12].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setDurationWeeks(w)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                durationWeeks === w
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
            >
              {w} sem ({w * 7}d)
            </button>
          ))}
        </div>

        {/* 2. Seletor de Frequência Semanal (3x, 4x, 5x, 6x, 7x) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-zinc-400">Frequência Semanal</label>
            <span className="text-xs font-bold text-[#00ff2b]">
              {7 - frequencyDaysPerWeek === 0
                ? 'Sem descanso (7x)'
                : `${7 - frequencyDaysPerWeek} dia(s) de descanso`}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[3, 4, 5, 6, 7].map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => handleFrequencyChange(freq)}
                className={`py-2.5 rounded-xl font-black text-sm transition-all ${
                  frequencyDaysPerWeek === freq
                    ? 'bg-[#ff1a00] text-white shadow-lg shadow-red-950/60 scale-105'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                {freq}x
              </button>
            ))}
          </div>
        </div>

        {/* 3. Lista de Dias Criados */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-zinc-400">Dias da Rotina & Exercícios</label>

          {days.map((day, idx) => (
            <div
              key={day.id}
              className={`rounded-2xl p-4 border transition-all ${
                day.is_rest
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-zinc-900/90 border-white/5 text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                      day.is_rest ? 'bg-emerald-500 text-black' : 'bg-red-600 text-white'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={day.day_name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setDays((prev) =>
                        prev.map((d) => (d.id === day.id ? { ...d, day_name: newName } : d))
                      );
                    }}
                    className="bg-transparent font-bold text-sm text-white focus:outline-none border-b border-transparent focus:border-white/20"
                  />
                </div>

                {!day.is_rest && (
                  <button
                    onClick={() => setSelectingExerciseForDayId(day.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-[#ff2a10] text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Exercício</span>
                  </button>
                )}
              </div>

              {/* Lista dos exercícios adicionados ao dia */}
              {!day.is_rest && (
                <div className="mt-3 flex flex-col gap-2.5">
                  {day.exercises.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic py-1">
                      Nenhum exercício adicionado ainda. Toque em "+ Exercício".
                    </p>
                  ) : (
                    day.exercises.map((item, exIdx) => {
                      const technique = item.technique || 'normal';

                      return (
                        <div
                          key={item.id}
                          className="bg-black/50 rounded-2xl p-3 border border-white/5 flex flex-col gap-2.5"
                        >
                          {/* Linha 1: Nome do Exercício + Botão Excluir */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-400 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                {exIdx + 1}
                              </span>
                              <span className="font-bold text-xs text-white truncate">
                                {item.exercise.name}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(day.id, item.id)}
                              className="text-zinc-500 hover:text-red-400 p-1 flex-shrink-0 transition-colors"
                              title="Remover exercício"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Linha 2: Séries, Faixa de Repetições e Intervalo de Descanso */}
                          <div className="grid grid-cols-3 gap-2 bg-zinc-900/80 p-2 rounded-xl border border-white/5">
                            {/* Séries */}
                            <div>
                              <span className="text-[10px] text-zinc-400 font-medium block">
                                Séries
                              </span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={item.target_sets}
                                onChange={(e) =>
                                  handleUpdateExerciseField(
                                    day.id,
                                    item.id,
                                    'target_sets',
                                    Math.max(1, parseInt(e.target.value) || 1)
                                  )
                                }
                                className="w-full mt-1 px-2 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white font-bold text-xs text-center focus:outline-none focus:border-red-500"
                              />
                            </div>

                            {/* Repetições (Min - Max) */}
                            <div>
                              <span className="text-[10px] text-zinc-400 font-medium block">
                                Repetições
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={item.min_reps}
                                  onChange={(e) =>
                                    handleUpdateExerciseField(
                                      day.id,
                                      item.id,
                                      'min_reps',
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className="w-full px-1.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white font-bold text-xs text-center focus:outline-none focus:border-red-500"
                                  placeholder="Min"
                                />
                                <span className="text-zinc-500 text-[10px]">-</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={item.max_reps}
                                  onChange={(e) =>
                                    handleUpdateExerciseField(
                                      day.id,
                                      item.id,
                                      'max_reps',
                                      Math.max(1, parseInt(e.target.value) || 1)
                                    )
                                  }
                                  className="w-full px-1.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white font-bold text-xs text-center focus:outline-none focus:border-red-500"
                                  placeholder="Max"
                                />
                              </div>
                            </div>

                            {/* Intervalo de Descanso */}
                            <div>
                              <span className="text-[10px] text-zinc-400 font-medium block">
                                Descanso
                              </span>
                              <div className="relative mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="15"
                                  max="300"
                                  value={item.rest_seconds || 60}
                                  onChange={(e) =>
                                    handleUpdateExerciseField(
                                      day.id,
                                      item.id,
                                      'rest_seconds',
                                      Math.max(0, parseInt(e.target.value) || 0)
                                    )
                                  }
                                  className="w-full px-1.5 py-1 rounded-lg bg-zinc-800 border border-white/10 text-white font-bold text-xs text-center focus:outline-none focus:border-red-500"
                                />
                                <span className="absolute right-1.5 top-1.5 text-[9px] text-zinc-500 pointer-events-none">
                                  s
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Linha 3: Seletor de Técnica Avançada (Bi-set, Super-série, Drop-set, Up-set) */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-zinc-400 flex items-center gap-1">
                                <Zap className="w-3 h-3 text-amber-500" />
                                Técnica / Método:
                              </span>
                              {technique !== 'normal' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase">
                                  {technique === 'biset' && '2 Exercícios conjugados sem pausa'}
                                  {technique === 'superset' && 'Vários exercícios em circuito'}
                                  {technique === 'dropset' && 'Reduz carga na falha sem descanso'}
                                  {technique === 'upset' && 'Sobe carga progressiva entre séries'}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-5 gap-1">
                              {(
                                [
                                  { id: 'normal', label: 'Padrão' },
                                  { id: 'biset', label: 'Bi-set' },
                                  { id: 'superset', label: 'Super-set' },
                                  { id: 'dropset', label: 'Drop-set' },
                                  { id: 'upset', label: 'Up-set' },
                                ] as const
                              ).map((tech) => (
                                <button
                                  key={tech.id}
                                  type="button"
                                  onClick={() =>
                                    handleUpdateExerciseField(day.id, item.id, 'technique', tech.id)
                                  }
                                  className={`py-1 rounded-lg text-[9px] font-bold transition-all ${
                                    technique === tech.id
                                      ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-950/40 scale-105'
                                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {tech.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão de Salvar Ficha */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl bg-[#ff1a00] hover:bg-red-600 text-white font-extrabold text-base tracking-wide shadow-xl shadow-red-950/60 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3px]" />
          <span>Salvar e Ativar Ficha</span>
        </button>

        {/* MODAL: BANCO COMPLETO DE EXERCÍCIOS COM FILTROS E CRIAÇÃO */}
        <ExerciseDatabaseModal
          isOpen={Boolean(selectingExerciseForDayId)}
          onClose={() => setSelectingExerciseForDayId(null)}
          onSelectExercise={(ex) => {
            if (selectingExerciseForDayId) {
              handleAddExerciseToDay(selectingExerciseForDayId, ex);
            }
          }}
        />
      </div>
    </div>
  );
};
