import React, { useState } from 'react';
import {
  WorkoutPlan,
  WorkoutPlanDay,
  WorkoutSession,
  BodyMeasurement,
  Exercise,
} from './features/fitness/types';
import { FitnessStorageService } from './features/fitness/services/storageService';
import { BottomNav, NavTab } from './features/fitness/components/BottomNav';
import { FigmaHomeScreen } from './features/fitness/components/FigmaHomeScreen';
import { FigmaWorkoutPlanList } from './features/fitness/components/FigmaWorkoutPlanList';
import { FigmaStartWorkoutPreview } from './features/fitness/components/FigmaStartWorkoutPreview';
import { FigmaWorkoutExecution } from './features/fitness/components/FigmaWorkoutExecution';
import { FigmaActivityScreen } from './features/fitness/components/FigmaActivityScreen';
import { FigmaEvolutionScreen } from './features/fitness/components/FigmaEvolutionScreen';
import { AICoachPanel } from './features/fitness/components/AICoachPanel';
import { FigmaLoginScreen } from './features/fitness/components/FigmaLoginScreen';
import { calculateVolumeLoad } from './features/fitness/utils/progressionLogic';
import { Trophy } from 'lucide-react';

export default function App() {
  // Usuário ativo (inicia sem nome para o novo usuário se cadastrar)
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('ph_username') || '';
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('ph_logged_in') === 'true' && localStorage.getItem('ph_username'));
  });

  // Estados dos dados
  const [plans, setPlans] = useState<WorkoutPlan[]>(() => FitnessStorageService.getPlans());
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => FitnessStorageService.getSessions());
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>(() =>
    FitnessStorageService.getMeasurements()
  );

  // Navegação: 'home' | 'plans' | 'activity' | 'evolution' | 'coach'
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Estados de Treino
  const [previewWorkoutDay, setPreviewWorkoutDay] = useState<WorkoutPlanDay | null>(null);
  const [activeExecutingDay, setActiveExecutingDay] = useState<WorkoutPlanDay | null>(null);

  // Modal de Celebração de Treino Concluído
  const [completedCelebrationSession, setCompletedCelebrationSession] = useState<WorkoutSession | null>(null);

  // Plano ativo
  const activePlan = plans.find((p) => p.is_active) || plans[0] || null;

  // Login handler
  const handleLoginSuccess = (name: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    localStorage.setItem('ph_username', name);
    localStorage.setItem('ph_logged_in', 'true');
  };

  // Contagem de treinos essa semana e no mês
  const weeklyWorkoutsCount = sessions.filter((s) => {
    const diffDays = (Date.now() - new Date(s.started_at).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  const monthlyWorkoutsCount = sessions.filter((s) => {
    const diffDays = (Date.now() - new Date(s.started_at).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  // Finalização do Treino
  const handleFinishWorkout = (newSession: WorkoutSession) => {
    const updated = FitnessStorageService.addSession(newSession);
    setSessions(updated);
    setActiveExecutingDay(null);
    setPreviewWorkoutDay(null);
    setCompletedCelebrationSession(newSession);
  };

  // Adicionar ou Atualizar Medidas
  const handleAddMeasurement = (newMeas: BodyMeasurement) => {
    const updated = FitnessStorageService.addMeasurement(newMeas);
    setMeasurements(updated);
  };

  const handleDeleteMeasurement = (id: string) => {
    const updated = FitnessStorageService.deleteMeasurement(id);
    setMeasurements(updated);
  };

  // Salvar plano (novo ou editado)
  const handleSaveNewPlan = (newPlan: WorkoutPlan) => {
    const existingIndex = plans.findIndex((p) => p.id === newPlan.id);
    let updated: WorkoutPlan[];
    if (existingIndex >= 0) {
      updated = [...plans];
      updated[existingIndex] = newPlan;
    } else {
      updated = [newPlan, ...plans.map((p) => ({ ...p, is_active: false }))];
    }
    setPlans(updated);
    FitnessStorageService.savePlans(updated);
  };

  // Resetar tudo para experiência de novo usuário
  const handleResetAllData = () => {
    if (confirm('Deseja realmente limpar todo o histórico e começar como novo usuário?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Se não estiver logado, exibe tela de boas-vindas / login
  if (!isLoggedIn) {
    return <FigmaLoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Container Centralizado Mobile-First idêntico ao Figma */}
      <div className="max-w-md mx-auto min-h-screen px-4 pt-3 relative">
        {/* VIEW 1: HOME (Idêntica ao Figma "HOME.png") */}
        {activeTab === 'home' && !previewWorkoutDay && (
          <FigmaHomeScreen
            userName={userName}
            activePlan={activePlan}
            onSelectDay={(day) => setPreviewWorkoutDay(day)}
            onOpenPlans={() => setActiveTab('plans')}
            onOpenActivity={() => setActiveTab('activity')}
            onOpenEvolution={() => setActiveTab('evolution')}
            sessions={sessions}
            weeklyWorkoutsCount={weeklyWorkoutsCount}
            monthlyWorkoutsCount={monthlyWorkoutsCount}
            onResetData={handleResetAllData}
          />
        )}

        {/* VIEW 2: LISTA DE FICHAS DE TREINO (Idêntica ao Figma "Ficha de treino.png") */}
        {activeTab === 'plans' && !previewWorkoutDay && (
          <FigmaWorkoutPlanList
            plan={activePlan}
            onSelectDay={(day) => setPreviewWorkoutDay(day)}
            onBack={() => setActiveTab('home')}
            userName={userName}
            onSavePlan={handleSaveNewPlan}
          />
        )}

        {/* VIEW 3: MINHA ATIVIDADE (Idêntica ao Figma "Minha atividade.png") */}
        {activeTab === 'activity' && (
          <FigmaActivityScreen
            sessions={sessions}
          />
        )}

        {/* VIEW 4: MINHA EVOLUÇÃO (Idêntica ao Figma "Minha-evolução.png") */}
        {activeTab === 'evolution' && (
          <FigmaEvolutionScreen
            measurements={measurements}
            onAddMeasurement={handleAddMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
          />
        )}

        {/* VIEW 5: AI COACH (Gemini 3.8 Flash) */}
        {activeTab === 'coach' && (
          <div className="pb-28 pt-2">
            <AICoachPanel
              measurements={measurements}
              onAddMeasurement={handleAddMeasurement}
              sessions={sessions}
              activePlan={activePlan || undefined}
            />
          </div>
        )}

        {/* PRÉVIA / START WORKOUT: BOTÃO "GO!" (Idêntico ao Figma "Iniciando o treino.png") */}
        {previewWorkoutDay && !activeExecutingDay && (
          <FigmaStartWorkoutPreview
            planDay={previewWorkoutDay}
            onStart={() => setActiveExecutingDay(previewWorkoutDay)}
            onBack={() => setPreviewWorkoutDay(null)}
          />
        )}

        {/* EXECUÇÃO COMPLETA DO TREINO: TELA DE LOG (Idêntica ao Figma "Minha atividade-1.png") */}
        {activeExecutingDay && (
          <FigmaWorkoutExecution
            planDay={activeExecutingDay}
            onFinishWorkout={handleFinishWorkout}
            onClose={() => setActiveExecutingDay(null)}
          />
        )}

        {/* MODAL DE CELEBRAÇÃO DE TREINO CONCLUÍDO */}
        {completedCelebrationSession && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#18181b] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#ff1a00] to-orange-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-950/60">
                <Trophy className="w-8 h-8 stroke-[2.5]" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Treino Finalizado
              </span>
              <h3 className="text-2xl font-black text-white mt-1">
                {completedCelebrationSession.plan_day_title}
              </h3>

              <div className="grid grid-cols-2 gap-3 my-5">
                <div className="bg-zinc-900/80 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Duração</span>
                  <span className="text-lg font-black text-white">
                    {completedCelebrationSession.duration_minutes} min
                  </span>
                </div>

                <div className="bg-zinc-900/80 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-zinc-400 block font-semibold">Volume Total</span>
                  <span className="text-lg font-black text-white">
                    {calculateVolumeLoad(
                      Object.values(completedCelebrationSession.exercises_logs)
                        .flat()
                        .filter((s) => s.completed)
                    ).toLocaleString('pt-BR')}{' '}
                    kg
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Todas as cargas, repetições e notas foram salvas com sucesso. A sugestão de progressão para a próxima sessão já foi recalculada!
              </p>

              <button
                onClick={() => setCompletedCelebrationSession(null)}
                className="w-full py-4 rounded-2xl bg-[#ff1a00] hover:bg-red-600 text-white font-extrabold text-sm shadow-xl shadow-red-950/50 transition-all cursor-pointer active:scale-95"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE NAVEGAÇÃO INFERIOR MODERNA (BOTTOM NAV) */}
      {!activeExecutingDay && (
        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setPreviewWorkoutDay(null);
            setActiveTab(tab);
          }}
          hasActiveWorkout={false}
        />
      )}
    </div>
  );
}
