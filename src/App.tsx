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
import { DesktopSidebar } from './features/fitness/components/DesktopSidebar';
import { CloudSyncModal } from './features/fitness/components/CloudSyncModal';
import { FigmaHomeScreen } from './features/fitness/components/FigmaHomeScreen';
import { FigmaWorkoutPlanList } from './features/fitness/components/FigmaWorkoutPlanList';
import { FigmaStartWorkoutPreview } from './features/fitness/components/FigmaStartWorkoutPreview';
import { FigmaWorkoutExecution } from './features/fitness/components/FigmaWorkoutExecution';
import { FigmaActivityScreen } from './features/fitness/components/FigmaActivityScreen';
import { FigmaEvolutionScreen } from './features/fitness/components/FigmaEvolutionScreen';
import { AICoachPanel } from './features/fitness/components/AICoachPanel';
import { FigmaLoginScreen } from './features/fitness/components/FigmaLoginScreen';
import { FigmaPostWorkoutCelebrationModal } from './features/fitness/components/FigmaPostWorkoutCelebrationModal';
import { calculateVolumeLoad } from './features/fitness/utils/progressionLogic';
import { SessionPersonalRecord } from './features/fitness/utils/prLogic';
import { CloudSyncService } from './features/fitness/services/cloudSyncService';
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

  // Modal de Celebração de Treino Concluído & Recordes
  const [completedCelebrationSession, setCompletedCelebrationSession] = useState<WorkoutSession | null>(null);
  const [sessionPersonalRecords, setSessionPersonalRecords] = useState<SessionPersonalRecord[]>([]);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);

  // Plano ativo
  const activePlan = plans.find((p) => p.is_active) || plans[0] || null;

  // Treino sugerido para atalhos rápidos
  const suggestedWorkout = (() => {
    const days = activePlan?.days || [];
    if (!days.length) return null;
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
    const lastSession = sorted.find((s) => s.completed_at);
    if (!lastSession) return days[0];
    const lastIdx = days.findIndex(
      (d) =>
        d.id === lastSession.plan_day_id ||
        d.day_name.toLowerCase().trim() === lastSession.plan_day_title?.toLowerCase().trim()
    );
    return lastIdx >= 0 ? days[(lastIdx + 1) % days.length] : days[0];
  })();

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

  // Finalização do Treino com Auto-Sync em Nuvem (Google Drive) e Recordes
  const handleFinishWorkout = (newSession: WorkoutSession, prs?: SessionPersonalRecord[]) => {
    const updated = FitnessStorageService.addSession(newSession);
    setSessions(updated);
    setActiveExecutingDay(null);
    setPreviewWorkoutDay(null);
    setSessionPersonalRecords(prs || []);
    setCompletedCelebrationSession(newSession);

    // Auto-backup no Google Drive silencioso se a conta estiver conectada
    const cloudConfig = CloudSyncService.getConfig();
    if (cloudConfig.google_access_token && cloudConfig.auto_sync_enabled) {
      CloudSyncService.uploadToGoogleDrive().catch(() => {});
    }
  };

  // Adicionar ou Atualizar Medidas com Auto-Sync
  const handleAddMeasurement = (newMeas: BodyMeasurement) => {
    const updated = FitnessStorageService.addMeasurement(newMeas);
    setMeasurements(updated);

    const cloudConfig = CloudSyncService.getConfig();
    if (cloudConfig.google_access_token && cloudConfig.auto_sync_enabled) {
      CloudSyncService.uploadToGoogleDrive().catch(() => {});
    }
  };

  const handleDeleteMeasurement = (id: string) => {
    const updated = FitnessStorageService.deleteMeasurement(id);
    setMeasurements(updated);
  };

  // Salvar plano (novo ou editado) com Auto-Sync
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

    const cloudConfig = CloudSyncService.getConfig();
    if (cloudConfig.google_access_token && cloudConfig.auto_sync_enabled) {
      CloudSyncService.uploadToGoogleDrive().catch(() => {});
    }
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
    <div className="min-h-screen bg-[#0d0d0d] text-white flex">
      {/* SIDEBAR LATERAL FIXA PARA NAVEGADORES DESKTOP */}
      {!activeExecutingDay && (
        <DesktopSidebar
          activeTab={activeTab}
          onChangeTab={(tab) => {
            setPreviewWorkoutDay(null);
            setActiveTab(tab);
          }}
          userName={userName}
          weeklyWorkoutsCount={weeklyWorkoutsCount}
          suggestedWorkout={suggestedWorkout}
          onStartSuggestedWorkout={(day) => setPreviewWorkoutDay(day)}
          onOpenCloudModal={() => setIsCloudModalOpen(true)}
          onResetData={handleResetAllData}
        />
      )}

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Responsivo: Mobile-First + Expansão Fluida no Desktop) */}
      <div className={`flex-1 min-h-screen flex flex-col transition-all duration-200 ${!activeExecutingDay ? 'md:pl-64 lg:md:pl-72' : ''}`}>
        <main className="w-full max-w-md md:max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto px-4 md:px-8 pt-3 md:pt-6 pb-20 md:pb-12 relative flex-1">
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

        {/* MODAL ÉPICO DE CELEBRAÇÃO DE TREINO CONCLUÍDO */}
        {completedCelebrationSession && (
          <FigmaPostWorkoutCelebrationModal
            session={completedCelebrationSession}
            previousSession={
              sessions.find(
                (s) =>
                  s.id !== completedCelebrationSession.id &&
                  (s.plan_day_id === completedCelebrationSession.plan_day_id ||
                    s.plan_day_title?.trim().toLowerCase() ===
                      completedCelebrationSession.plan_day_title?.trim().toLowerCase())
              ) || null
            }
            personalRecords={sessionPersonalRecords}
            onClose={() => setCompletedCelebrationSession(null)}
          />
        )}
        </main>
      </div>

      {/* MODAL DE SINCRONIZAÇÃO EM NUVEM / GOOGLE DRIVE */}
      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
      />

      {/* BARRA DE NAVEGAÇÃO INFERIOR MODERNA (BOTTOM NAV - SOMENTE MOBILE) */}
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
