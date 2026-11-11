import React, { useState } from 'react';
import { WorkoutPlan, WorkoutPlanDay } from '../types';
import { CreateWorkoutPlanModal } from './CreateWorkoutPlanModal';
import { ExerciseDatabaseModal } from './ExerciseDatabaseModal';
import { ArrowLeft, Plus, Play, Dumbbell, Clock, Edit3, ChevronRight } from 'lucide-react';

interface FigmaWorkoutPlanListProps {
  plan: WorkoutPlan | null;
  onSelectDay: (day: WorkoutPlanDay) => void;
  onBack: () => void;
  userName?: string;
  onSavePlan: (newPlan: WorkoutPlan) => void;
}

export const FigmaWorkoutPlanList: React.FC<FigmaWorkoutPlanListProps> = ({
  plan,
  onSelectDay,
  onBack,
  userName = 'Alex',
  onSavePlan,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExercisesModalOpen, setIsExercisesModalOpen] = useState(false);
  const days = plan?.days || [];

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
      <div className="rounded-3xl bg-[#111114] border border-white/5 p-5 flex flex-col gap-3 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Ficha de Treino
              </h2>
              {plan?.duration_weeks && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
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
            className="h-9 px-3.5 rounded-xl bg-[#ff3322] hover:bg-red-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3px]" />
            <span>Criar Ficha</span>
          </button>
        </div>

        {/* Validade da ficha sutil e minimalista */}
        {plan && (
          <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Progresso do Ciclo</span>
              </span>
              <span className="font-mono text-zinc-300">
                {plan.duration_weeks ? `${plan.duration_weeks} semanas recomendadas` : '8 semanas'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-zinc-800/80 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
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
            const isRest = day.day_name.toLowerCase().includes('descanso');

            return (
              <div
                key={day.id}
                className={`rounded-2xl border p-4 flex items-center justify-between gap-3 transition-all ${
                  isToday
                    ? 'bg-gradient-to-r from-[#1a1214] to-[#121215] border-[#ff3322]/30 shadow-md'
                    : isRest
                    ? 'bg-[#111114] border-white/5 opacity-80'
                    : 'bg-[#111114] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {isToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#ff3322] text-white uppercase tracking-wider">
                        Hoje
                      </span>
                    )}
                    <h3 className="text-base font-bold text-white tracking-tight truncate">
                      {day.day_name.includes('-') ? day.day_name.split('-')[0].trim() : day.day_name}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">
                    {isRest
                      ? 'Recuperação muscular e descanso ativo'
                      : `${day.exercises.length} exercícios • ~${day.exercises.length * 8} min`}
                  </p>
                </div>

                <button
                  onClick={() => isRest ? onBack() : onSelectDay(day)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0 cursor-pointer ${
                    isToday
                      ? 'bg-[#ff3322] hover:bg-red-600 text-white shadow-md shadow-red-950/40'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                  }`}
                >
                  <span>{isRest ? 'Marcar' : 'Treinar'}</span>
                  <Play className="w-3 h-3 fill-current" />
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
