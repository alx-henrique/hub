import React, { useState } from 'react';
import {
  WorkoutPlan,
  WorkoutPlanDay,
  WorkoutPlanExercise,
  MuscleGroup,
  MUSCLE_LABELS,
  Exercise,
} from '../types';
import { FitnessStorageService } from '../services/storageService';
import { ExerciseVectorIllustration } from './ExerciseVectorIllustration';
import {
  Plus,
  Dumbbell,
  Calendar,
  Play,
  Trash2,
  Search,
  Filter,
  Check,
  Sparkles,
  ChevronRight,
  Flame,
  Layers,
  X,
} from 'lucide-react';

interface WorkoutPlanManagerProps {
  plans: WorkoutPlan[];
  onSavePlans: (plans: WorkoutPlan[]) => void;
  onStartWorkout: (day: WorkoutPlanDay) => void;
}

type QuickCategory = 'all' | 'deadlifts' | 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export const WorkoutPlanManager: React.FC<WorkoutPlanManagerProps> = ({
  plans,
  onSavePlans,
  onStartWorkout,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isAddingExerciseToDayId, setIsAddingExerciseToDayId] = useState<string | null>(null);

  // Filtros do Seletor de Exercícios
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [quickCategory, setQuickCategory] = useState<QuickCategory>('all');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<MuscleGroup | 'all'>('all');
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState<string | 'all'>('all');

  // Estado do formulário de nova ficha
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanWeeks, setNewPlanWeeks] = useState(8);
  const [newPlanDays, setNewPlanDays] = useState<string[]>([
    'Treino A - Peito, Ombros & Tríceps (Push)',
    'Treino B - Costas, Levantamento Terra & Bíceps (Pull)',
    'Treino C - Pernas, RDL & Panturrilhas (Legs)',
  ]);

  const activePlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const allExercises = FitnessStorageService.getAllExercises();

  // Adicionar exercício selecionado ao dia do plano
  const handleSelectExerciseForDay = (ex: Exercise, dayId: string) => {
    if (!activePlan) return;

    const newExerciseItem: WorkoutPlanExercise = {
      id: `pe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      exercise_id: ex.id,
      exercise: ex,
      target_sets: 4,
      min_reps: ex.id.includes('deadlift') ? 6 : 8,
      max_reps: ex.id.includes('deadlift') ? 8 : 12,
      order_index: 99,
      rest_seconds: ex.id.includes('deadlift') ? 120 : 75,
    };

    const updatedDays = activePlan.days.map((day) => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: [...day.exercises, newExerciseItem],
        };
      }
      return day;
    });

    const updatedPlan: WorkoutPlan = {
      ...activePlan,
      days: updatedDays,
    };

    const updatedPlans = plans.map((p) => (p.id === activePlan.id ? updatedPlan : p));
    onSavePlans(updatedPlans);
    setIsAddingExerciseToDayId(null);
  };

  // Remover exercício de um dia
  const handleRemoveExercise = (dayId: string, planExerciseId: string) => {
    if (!activePlan) return;
    const updatedDays = activePlan.days.map((day) => {
      if (day.id === dayId) {
        return {
          ...day,
          exercises: day.exercises.filter((pe) => pe.id !== planExerciseId),
        };
      }
      return day;
    });
    const updatedPlans = plans.map((p) => (p.id === activePlan.id ? { ...activePlan, days: updatedDays } : p));
    onSavePlans(updatedPlans);
  };

  // Criar novo plano
  const handleCreatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    const createdPlan: WorkoutPlan = {
      id: `plan-${Date.now()}`,
      title: newPlanTitle,
      duration_weeks: newPlanWeeks,
      is_active: true,
      created_at: new Date().toISOString(),
      days: newPlanDays.map((dayName, idx) => ({
        id: `day-${Date.now()}-${idx}`,
        plan_id: `plan-${Date.now()}`,
        day_name: dayName,
        order_index: idx,
        exercises: [],
      })),
    };

    const updated = [createdPlan, ...plans];
    onSavePlans(updated);
    setSelectedPlanId(createdPlan.id);
    setIsCreatingPlan(false);
    setNewPlanTitle('');
  };

  // Filtro avançado incluindo atalho especial para Levantamento Terra e compostos
  const filteredExercises = allExercises.filter((ex) => {
    const s = exerciseSearch.toLowerCase().trim();
    const matchesSearch =
      !s ||
      ex.name.toLowerCase().includes(s) ||
      (ex.target_muscle && MUSCLE_LABELS[ex.target_muscle]?.toLowerCase().includes(s));

    // Filtro rápido inteligente
    let matchesQuick = true;
    if (quickCategory === 'deadlifts') {
      matchesQuick =
        ex.id.includes('deadlift') ||
        ex.id.includes('stiff') ||
        ex.id.includes('good-morning') ||
        ex.name.toLowerCase().includes('terra') ||
        ex.name.toLowerCase().includes('rdl') ||
        ex.name.toLowerCase().includes('stiff');
    } else if (quickCategory === 'chest') {
      matchesQuick = ex.target_muscle === 'chest';
    } else if (quickCategory === 'back') {
      matchesQuick = ex.target_muscle === 'back';
    } else if (quickCategory === 'legs') {
      matchesQuick = ['quadriceps', 'hamstrings', 'calves', 'glutes'].includes(ex.target_muscle);
    } else if (quickCategory === 'shoulders') {
      matchesQuick = ex.target_muscle === 'shoulders';
    } else if (quickCategory === 'arms') {
      matchesQuick = ['biceps', 'triceps', 'forearms'].includes(ex.target_muscle);
    } else if (quickCategory === 'core') {
      matchesQuick = ex.target_muscle === 'core';
    }

    const matchesMuscle =
      selectedMuscleFilter === 'all' || ex.target_muscle === selectedMuscleFilter;
    const matchesEquipment =
      selectedEquipmentFilter === 'all' || ex.category === selectedEquipmentFilter;

    return matchesSearch && matchesQuick && matchesMuscle && matchesEquipment;
  });

  return (
    <div className="space-y-6">
      {/* SELETOR DE FICHA ATIVA / BOTÃO CRIAR */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">Fichas de Treino</h2>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {plans.length} Salvas
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Periodização com metas de repetições e progressão de sobrecarga
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {plans.length > 1 && (
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white text-xs font-medium rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-zinc-600 transition-colors"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.duration_weeks} sem)
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => setIsCreatingPlan(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Nova Ficha
          </button>
        </div>
      </div>

      {/* DETALHES DO PLANO ATIVO */}
      {activePlan && (
        <div className="space-y-5">
          {/* Header Resumo da Ficha */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                  {activePlan.is_active ? 'Ficha Ativa' : 'Arquivada'}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Ciclo de {activePlan.duration_weeks} semanas
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{activePlan.title}</h3>
              {activePlan.description && (
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">{activePlan.description}</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-400 bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-zinc-700/60">
                {activePlan.days.length} divisões
              </span>
            </div>
          </div>

          {/* LISTA DE DIAS DE TREINO */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlan.days.map((day) => (
              <div
                key={day.id}
                className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700/60">
                      Divisão {String.fromCharCode(65 + day.order_index)}
                    </span>
                    <span className="text-xs font-medium text-zinc-400">
                      {day.exercises.length} movimentos
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-3 tracking-tight">{day.day_name}</h4>

                  {/* Lista de Exercícios Programados no Dia */}
                  <div className="space-y-2">
                    {day.exercises.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-zinc-950/60 border border-dashed border-zinc-800">
                        <p className="text-xs text-zinc-400">Nenhum exercício programado ainda.</p>
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Adicione exercícios abaixo.
                        </p>
                      </div>
                    ) : (
                      day.exercises.map((pe) => (
                        <div
                          key={pe.id}
                          className="flex items-center justify-between p-2.5 bg-zinc-900/80 hover:bg-zinc-850 rounded-xl border border-zinc-800/80 transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                              <ExerciseVectorIllustration
                                exerciseId={pe.exercise?.id || pe.exercise_id}
                                exerciseName={pe.exercise?.name}
                                targetMuscle={pe.exercise?.target_muscle}
                                category={pe.exercise?.category}
                                imageUrl={pe.exercise?.thumbnail_url}
                                showBiomechanics={false}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-xs text-white block truncate group-hover:text-zinc-200 transition-colors">
                                {pe.exercise?.name || 'Exercício'}
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                                <span className="text-zinc-300 font-medium">
                                  {MUSCLE_LABELS[pe.exercise?.target_muscle as MuscleGroup] || 'Musculação'}
                                </span>
                                <span>·</span>
                                <span className="font-mono text-zinc-400">
                                  {pe.target_sets} séries × {pe.min_reps}-{pe.max_reps} reps
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(day.id, pe.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Remover exercício da ficha"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Ações do Dia: Adicionar Exercício & Iniciar Treino */}
                <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingExerciseToDayId(day.id);
                      setQuickCategory('all');
                      setExerciseSearch('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 text-xs font-medium text-zinc-200 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-zinc-300" /> Adicionar Exercício
                  </button>

                  <button
                    type="button"
                    disabled={day.exercises.length === 0}
                    onClick={() => onStartWorkout(day)}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5 fill-zinc-950" /> Iniciar Treino
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVA FICHA DE TREINO */}
      {isCreatingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Criar Nova Ficha de Treino</h3>
              <button
                type="button"
                onClick={() => setIsCreatingPlan(false)}
                className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-5">
              Defina o nome da periodização e as divisões semanais (A/B/C/D)
            </p>

            <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  Título da Ficha *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Força & Hipertrofia (Push / Pull / Legs)"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-zinc-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  Duração Programada (em semanas)
                </label>
                <input
                  type="number"
                  min="2"
                  max="24"
                  value={newPlanWeeks}
                  onChange={(e) => setNewPlanWeeks(parseInt(e.target.value) || 8)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-xs focus:border-zinc-500 focus:outline-none placeholder:text-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-300 font-medium block mb-1">
                  Divisões de Treino (Dias)
                </label>
                <div className="space-y-2">
                  {newPlanDays.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={d}
                        onChange={(e) => {
                          const updated = [...newPlanDays];
                          updated[i] = e.target.value;
                          setNewPlanDays(updated);
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-zinc-500"
                      />
                      {newPlanDays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewPlanDays(newPlanDays.filter((_, idx) => idx !== i))}
                          className="px-2 text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setNewPlanDays([
                        ...newPlanDays,
                        `Treino ${String.fromCharCode(65 + newPlanDays.length)} - Nova Divisão`,
                      ])
                    }
                    className="text-xs text-zinc-300 hover:text-white font-medium hover:underline block pt-1 cursor-pointer"
                  >
                    + Adicionar outro dia de divisão
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingPlan(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-sm transition-all"
                >
                  Salvar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SELETOR DE EXERCÍCIOS */}
      {isAddingExerciseToDayId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
            {/* Header do Seletor */}
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Catálogo de Exercícios</h3>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                    {allExercises.length} Movimentos
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Selecione para incluir na divisão de treino
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingExerciseToDayId(null)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* BARRA DE BUSCA + FILTROS RÁPIDOS */}
            <div className="py-3.5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por nome (ex: terra, supino, agachamento, stiff)..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:border-zinc-500 focus:outline-none placeholder:text-zinc-600"
                />
                {exerciseSearch && (
                  <button
                    type="button"
                    onClick={() => setExerciseSearch('')}
                    className="absolute right-3.5 top-2.5 text-zinc-500 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* FILTROS RÁPIDOS EM TABS MINIMALISTAS */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => setQuickCategory('all')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'all'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos ({allExercises.length})
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCategory('deadlifts')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'deadlifts'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Terra & Variações
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCategory('chest')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'chest'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Peito & Supinos
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCategory('back')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'back'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Costas & Puxadas
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCategory('legs')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'legs'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Pernas & Agachamentos
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCategory('shoulders')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'shoulders'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Ombros
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCategory('arms')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'arms'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Braços
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCategory('core')}
                  className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                    quickCategory === 'core'
                      ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  Abdômen
                </button>
              </div>

              {/* Filtro por Equipamento */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-zinc-400 pt-0.5">
                <span className="font-medium text-zinc-500 uppercase tracking-wider text-[10px] mr-1">
                  Aparelho:
                </span>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'barbell', label: 'Barra' },
                  { id: 'dumbbell', label: 'Halteres' },
                  { id: 'machine', label: 'Máquinas' },
                  { id: 'cable', label: 'Cabos & Polia' },
                  { id: 'bodyweight', label: 'Peso Corporal' },
                ].map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setSelectedEquipmentFilter(eq.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedEquipmentFilter === eq.id
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {eq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* LISTAGEM DOS EXERCÍCIOS ENCONTRADOS */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-1">
              <div className="text-[11px] font-medium text-zinc-400 px-1">
                {filteredExercises.length} movimentos encontrados:
              </div>

              {filteredExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-3 bg-zinc-950/60 hover:bg-zinc-800/50 rounded-2xl border border-zinc-800/80 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 shrink-0 bg-zinc-900">
                      <ExerciseVectorIllustration
                        exerciseId={ex.id}
                        exerciseName={ex.name}
                        targetMuscle={ex.target_muscle}
                        category={ex.category}
                        showBiomechanics={false}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors truncate">
                        {ex.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span className="font-medium text-zinc-300">
                          {MUSCLE_LABELS[ex.target_muscle as MuscleGroup]}
                        </span>
                        <span>·</span>
                        <span className="capitalize text-zinc-400">
                          {ex.category === 'barbell'
                            ? 'Barra'
                            : ex.category === 'dumbbell'
                            ? 'Halteres'
                            : ex.category === 'machine'
                            ? 'Máquina'
                            : ex.category === 'cable'
                            ? 'Cabo'
                            : 'Peso Corporal'}
                        </span>
                      </div>
                      {ex.instructions && ex.instructions[0] && (
                        <p className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                          {ex.instructions[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectExerciseForDay(ex, isAddingExerciseToDayId)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
                  >
                    + Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
