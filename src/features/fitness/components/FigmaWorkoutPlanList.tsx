import React, { useState } from 'react';
import { WorkoutPlan, WorkoutPlanDay, WorkoutSession } from '../types';
import { CreateWorkoutPlanModal } from './CreateWorkoutPlanModal';
import { ExerciseDatabaseModal } from './ExerciseDatabaseModal';
import { ArrowLeft, Plus, Play, Dumbbell, Clock, Edit3, ChevronRight, Check, Sparkles } from 'lucide-react';

interface FigmaWorkoutPlanListProps {
  plan: WorkoutPlan | null;
  onSelectDay: (day: WorkoutPlanDay) => void;
  onBack: () => void;
  userName?: string;
  onSavePlan: (newPlan: WorkoutPlan) => void;
  onRecordRestDay?: (day: WorkoutPlanDay) => void;
  sessions?: WorkoutSession[];
}

export const FigmaWorkoutPlanList: React.FC<FigmaWorkoutPlanListProps> = ({
  plan,
  onSelectDay,
  onBack,
  userName = 'Alex',
  onSavePlan,
  onRecordRestDay,
  sessions = [],
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExercisesModalOpen, setIsExercisesModalOpen] = useState(false);
  const [justMarkedRestId, setJustMarkedRestId] = useState<string | null>(null);
  const days = plan?.days || [];

  const handleMarkRest = (day: WorkoutPlanDay) => {
    if (onRecordRestDay) {
      onRecordRestDay(day);
      setJustMarkedRestId(day.id);
      setTimeout(() => setJustMarkedRestId(null), 3000);
    } else {
      onSelectDay(day);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-28 text-white">
      {/* 1. HEADER: Voltar & Ações de Biblioteca/Edição */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao início</span>
        </button>

        <div className="flex items-center gap-2">
          {plan && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="h-8 px-3 rounded-xl bg-[#141417] border border-white/10 text-amber-400 hover:text-white hover:border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Ficha</span>
            </button>
          )}

          <button
            onClick={() => setIsExercisesModalOpen(true)}
            className="h-8 px-3 rounded-xl bg-[#141417] border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
            <span>Biblioteca</span>
          </button>
        </div>
      </div>

      {/* 2. TÍTULO DA TELA & CARD DE CABEÇALHO */}
      <div className="rounded-3xl card-glass p-5 flex flex-col gap-3.5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Ficha de Treino
              </h2>
              {plan?.duration_weeks && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Ciclo de {plan.duration_weeks} semanas
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {plan?.title || 'Nenhuma divisão cadastrada no momento'}
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 px-4 rounded-xl btn-brand-primary font-black text-xs flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Criar Ficha</span>
          </button>
        </div>

        {/* Validade da ficha sutil e minimalista */}
        {plan && (
          <div className="pt-2.5 border-t border-white/[0.08] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Progresso do Ciclo</span>
              </span>
              <span className="font-mono text-zinc-300 font-bold">
                {plan.duration_weeks ? `${plan.duration_weeks} semanas recomendadas` : '8 semanas'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800/80 overflow-hidden ring-1 ring-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      8,
                      Math.round(
                        ((Date.now() - new Date(plan.created_at || Date.now()).getTime()) /
                          ((plan.duration_weeks || 8) * 7 * 24 * 60 * 60 * 1000)) *
                          100
                      )
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. LISTA DE DIAS DE TREINO */}
      {(!plan || days.length === 0) ? (
        <div className="rounded-3xl bg-[#111114] border border-white/5 p-8 flex flex-col items-center text-center gap-4 shadow-lg my-2">
          <div className="w-14 h-14 rounded-2xl bg-[#ff3322]/10 border border-[#ff3322]/20 flex items-center justify-center text-[#ff3322]">
            <Dumbbell className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Nenhum treino na sua ficha</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
              Crie sua divisão semanal personalizada (ex: ABC, ABCD, Push/Pull/Legs) com seus exercícios favoritos.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full max-w-xs py-3 px-5 rounded-xl bg-[#ff3322] hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Criar Primeira Ficha</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {days.map((day, index) => {
            const isToday = index === 0;
            const isRest = day.day_name.toLowerCase().includes('descanso') || !day.exercises || day.exercises.length === 0;
            const todayStr = new Date().toISOString().split('T')[0];
            const isRestRecordedToday = sessions.some((s) => {
              const sDate = new Date(s.started_at).toISOString().split('T')[0];
              return sDate === todayStr && (s.is_rest || s.plan_day_title?.toLowerCase().includes('descanso') || s.plan_day_id === day.id);
            });
            const isJustMarked = justMarkedRestId === day.id;

            return (
              <div
                key={day.id}
                className={`rounded-3xl p-4.5 flex items-center justify-between gap-3.5 transition-all shadow-md ${
                  isToday && !isRest
                    ? 'card-glow-red'
                    : isRest
                    ? 'card-glass'
                    : 'card-glass-interactive'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#ff3322] text-white uppercase tracking-wider shadow-[0_0_8px_rgba(255,51,34,0.4)]">
                        Hoje
                      </span>
                    )}
                    {isRest && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                        Descanso
                      </span>
                    )}
                    <h3 className="text-base font-black text-white tracking-tight truncate">
                      {day.day_name.includes('-') ? day.day_name.split('-')[0].trim() : day.day_name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 truncate font-medium">
                    {isRest
                      ? 'Recuperação muscular e descanso ativo'
                      : `${day.exercises.length} exercícios • ~${day.exercises.length * 8} min`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => (isRest ? handleMarkRest(day) : onSelectDay(day))}
                  className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                    isToday && !isRest
                      ? 'btn-brand-primary'
                      : isRest && (isRestRecordedToday || isJustMarked)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isRest
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40'
                      : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-white/5 hover:border-white/10'
                  }`}
                >
                  {isRest ? (
                    isRestRecordedToday || isJustMarked ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                        <span>Feito</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Marcar</span>
                      </>
                    )
                  ) : (
                    <>
                      <span>Treinar</span>
                      <Play className="w-3 h-3 fill-current" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PARA CRIAR TREINO DO ZERO */}
      <CreateWorkoutPlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSavePlan={onSavePlan}
      />

      {/* MODAL PARA EDITAR FICHA ATUAL */}
      <CreateWorkoutPlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSavePlan={onSavePlan}
        planToEdit={plan}
      />

      {/* MODAL DO BANCO COMPLETO DE EXERCÍCIOS */}
      <ExerciseDatabaseModal
        isOpen={isExercisesModalOpen}
        onClose={() => setIsExercisesModalOpen(false)}
      />
    </div>
  );
};
