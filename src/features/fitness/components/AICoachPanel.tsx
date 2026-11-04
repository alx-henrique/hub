import React, { useState } from 'react';
import { BodyMeasurement, MuscleGroup, WorkoutPlan, WorkoutSession } from '../types';
import { FitnessStorageService } from '../services/storageService';
import {
  Brain,
  Sparkles,
  Scale,
  Ruler,
  TrendingUp,
  Send,
  Plus,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowRight,
  MessageSquare,
  Bot,
  Activity,
} from 'lucide-react';

interface AICoachPanelProps {
  measurements: BodyMeasurement[];
  onAddMeasurement: (m: BodyMeasurement) => void;
  sessions: WorkoutSession[];
  activePlan?: WorkoutPlan;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({
  measurements,
  onAddMeasurement,
  sessions,
  activePlan,
}) => {
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);
  const [coachSource, setCoachSource] = useState<string | null>(null);
  const [customQuestion, setCustomQuestion] = useState('');

  // Compila e envia os dados ao AI Coach (Gemini API via server endpoint)
  const handleConsultCoach = async (promptOverride?: string) => {
    setLoadingCoach(true);
    setCoachResponse(null);

    const questionToAsk = promptOverride || customQuestion.trim();

    try {
      const muscleScores = FitnessStorageService.calculateMuscleScores();

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          measurements,
          volumeStats: muscleScores,
          activePlan: activePlan
            ? {
                title: activePlan.title,
                duration_weeks: activePlan.duration_weeks,
                daysCount: activePlan.days.length,
              }
            : null,
          promptOverride: questionToAsk || undefined,
        }),
      });

      const data = await response.json();
      setCoachResponse(data.insight || data.fallback || 'Análise concluída.');
      setCoachSource(data.source || 'gemini');
      setCustomQuestion('');
    } catch (err: any) {
      console.error('Error fetching coach analysis:', err);
      setCoachResponse(
        '### 🎯 Diagnóstico do Treinador\n- Seus registros indicam ritmo consistente. Para o próximo ciclo, busque consolidar o teto de repetições nos exercícios compostos (Supino, Levantamento Terra e Agachamento) antes de subir a carga.\n- Garanta 1.8g a 2.0g de proteína por kg e 7-8h de sono de qualidade para máxima hipertrofia.'
      );
      setCoachSource('local_fallback');
    } finally {
      setLoadingCoach(false);
    }
  };

  const currentMeas = measurements[0];
  const prevMeas = measurements[1];
  const weightDelta =
    prevMeas && currentMeas ? Math.round((currentMeas.weight_kg - prevMeas.weight_kg) * 10) / 10 : 0;

  return (
    <div className="flex flex-col gap-6 text-white pb-24">
      {/* 1. TÍTULO: AI Coach Inteligente */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 3.8 Flash Pro</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          AI <span className="text-[#ff1a00]">Coach</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
          Cientista do esporte conectado aos seus treinos, cargas e medidas corporais
        </p>
      </div>

      {/* 2. CARD HERO DE IMPACTO: CONSULTA RÁPIDA */}
      <div className="rounded-[32px] bg-gradient-to-br from-[#1a1a1d] to-[#141416] border border-white/5 p-6 shadow-2xl relative overflow-hidden flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff1a00] to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-950/60">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Análise do Treinador</h3>
              <p className="text-[11px] text-zinc-400">
                {activePlan?.title || 'Ficha Push Pull Leg'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Online
          </span>
        </div>

        {/* Input de Pergunta Personalizada */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="relative">
            <input
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConsultCoach()}
              placeholder="Ex: Como acelerar o ganho de braço e peitoral?"
              className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-black/60 border border-white/10 text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-zinc-500"
            />
            <button
              onClick={() => handleConsultCoach()}
              disabled={loadingCoach}
              className="absolute right-2 top-2 w-9 h-9 rounded-xl bg-[#ff1a00] flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loadingCoach ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            onClick={() => handleConsultCoach()}
            disabled={loadingCoach}
            className="w-full py-3.5 rounded-2xl bg-[#ff1a00] hover:bg-red-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-red-950/50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loadingCoach ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analisando Biometria & Cargas...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Gerar Diagnóstico Completo</span>
              </>
            )}
          </button>
        </div>

        {/* Botões de Perguntas Rápidas Estilo Pílulas */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
          <span className="text-[10px] text-zinc-500 font-bold self-center mr-1">Rápido:</span>
          {[
            'Como aumentar a carga no Supino?',
            'Estou descansando o suficiente?',
            'Meta ideal de proteínas hoje',
          ].map((promptText) => (
            <button
              key={promptText}
              onClick={() => handleConsultCoach(promptText)}
              disabled={loadingCoach}
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-white/5 transition-colors disabled:opacity-50"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* 3. RESPOSTA DA IA (DIAGNÓSTICO EM CARD DARK MODERNO) */}
      {coachResponse && (
        <div className="rounded-[32px] bg-[#141416] border border-red-500/30 p-6 shadow-2xl relative overflow-hidden flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Prescrição do Treinador</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono">
              {coachSource === 'gemini' ? '⚡ Gemini 3.8 Flash' : 'Motor Esportivo'}
            </span>
          </div>

          <div className="text-xs leading-relaxed text-zinc-300 whitespace-pre-line space-y-2 font-normal">
            {coachResponse}
          </div>
        </div>
      )}

      {/* 4. RESUMO BIOMÉTRICO CONECTADO AO COACH */}
      <div className="rounded-[32px] bg-[#141416] border border-white/5 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white">Dados Alimentando a IA</h3>
          <span className="text-[11px] text-zinc-400">
            {currentMeas ? `${currentMeas.weight_kg}kg corporal` : 'Sem registros'}
          </span>
        </div>

        {currentMeas && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5">
              <span className="text-[10px] text-zinc-400 block font-medium">Bíceps (D/E)</span>
              <span className="text-xs font-black text-white mt-0.5 block">
                {currentMeas.biceps_right_cm || currentMeas.biceps_cm || 37} / {currentMeas.biceps_left_cm || currentMeas.biceps_cm || 36.5} cm
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5">
              <span className="text-[10px] text-zinc-400 block font-medium">Braço (D/E)</span>
              <span className="text-xs font-black text-white mt-0.5 block">
                {currentMeas.arm_right_cm || currentMeas.arms_cm || 38} / {currentMeas.arm_left_cm || currentMeas.arms_cm || 37.5} cm
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5">
              <span className="text-[10px] text-zinc-400 block font-medium">Coxa (D/E)</span>
              <span className="text-xs font-black text-white mt-0.5 block">
                {currentMeas.thigh_right_cm || currentMeas.thighs_cm || 58} / {currentMeas.thigh_left_cm || currentMeas.thighs_cm || 58} cm
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5">
              <span className="text-[10px] text-zinc-400 block font-medium">Panturrilha (D/E)</span>
              <span className="text-xs font-black text-white mt-0.5 block">
                {currentMeas.calf_right_cm || currentMeas.calves_cm || 38} / {currentMeas.calf_left_cm || currentMeas.calves_cm || 37.5} cm
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
