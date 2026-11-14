import React, { useState } from 'react';
import { WorkoutSession } from '../types';
import { Trophy, Clock, Dumbbell, CheckCircle2, Share2, Sparkles, X } from 'lucide-react';
import { SessionPersonalRecord } from '../utils/prLogic';

interface FigmaPostWorkoutCelebrationModalProps {
  session: WorkoutSession;
  previousSession?: WorkoutSession | null;
  personalRecords?: SessionPersonalRecord[];
  onClose: () => void;
}

export const FigmaPostWorkoutCelebrationModal: React.FC<FigmaPostWorkoutCelebrationModalProps> = ({
  session,
  previousSession,
  personalRecords = [],
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Calcula total de séries completadas
  const allSets = Object.values(session.exercises_logs || {}).flat();
  const completedSets = allSets.filter((s) => s.completed);
  const totalVolume = completedSets.reduce(
    (acc, set) => acc + (set.weight_kg || 0) * (set.reps_performed || 0),
    0
  );

  // Compara volume com sessão anterior do mesmo treino
  let volumeComparisonText: string | null = null;
  if (previousSession) {
    const prevSets = Object.values(previousSession.exercises_logs || {}).flat();
    const prevVolume = prevSets
      .filter((s) => s.completed)
      .reduce((acc, s) => acc + (s.weight_kg || 0) * (s.reps_performed || 0), 0);

    if (prevVolume > 0) {
      const diffPct = Math.round(((totalVolume - prevVolume) / prevVolume) * 100);
      if (diffPct > 0) {
        volumeComparisonText = `+${diffPct}% de volume vs. último treino! 🚀`;
      } else if (diffPct === 0) {
        volumeComparisonText = `Volume idêntico ao último treino! 🎯`;
      } else {
        volumeComparisonText = `${diffPct}% de volume vs. anterior`;
      }
    }
  }

  const handleShare = async () => {
    let prsText = '';
    if (personalRecords.length > 0) {
      prsText = `\n🏆 Recordes Batidos: ${personalRecords
        .map((p) => `${p.exerciseName} (${p.newWeight}kg)`)
        .join(', ')}`;
    }

    const shareContent = `🏋️‍♂️ Treino Concluído no Personal HUB!\n📅 ${session.plan_day_title}\n⏱️ Duração: ${session.duration_minutes || 0} min\n💥 Volume Total: ${totalVolume.toLocaleString('pt-BR')} kg\n✅ Séries: ${completedSets.length} concluídas${prsText}\n\n#PersonalHUB #Treino #Hipertrofia`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Treino Concluído - Personal HUB',
          text: shareContent,
        });
      } else {
        await navigator.clipboard.writeText(shareContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      // Fallback para clipboard
      try {
        await navigator.clipboard.writeText(shareContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141417] border border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full text-center shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow de fundo */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#ff3322]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ícone Troféu com Gradiente */}
        <div className="relative mx-auto mb-3 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#ff1a00] via-orange-500 to-amber-400 opacity-80 blur-lg animate-pulse" />
          <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-tr from-[#ff1a00] via-orange-500 to-amber-400 text-white flex items-center justify-center shadow-xl shadow-red-950/70 border border-white/20">
            <Trophy className="w-9 h-9 stroke-[2.5]" />
          </div>
        </div>

        <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Treino Finalizado com Sucesso
        </span>

        <h3 className="text-2xl font-black text-white mt-1 tracking-tight">
          {session.plan_day_title}
        </h3>

        {/* GRID DE MÉTRICAS */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Duração</span>
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              {session.duration_minutes || 1} min
            </span>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-2xl border border-white/5 flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-semibold mb-1">
              <Dumbbell className="w-3.5 h-3.5 text-zinc-400" />
              <span>Volume Total</span>
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              {totalVolume.toLocaleString('pt-BR')} kg
            </span>
            {volumeComparisonText && (
              <span className="text-[10px] text-emerald-400 font-bold mt-0.5">
                {volumeComparisonText}
              </span>
            )}
          </div>
        </div>

        {/* SÉRIES CONCLUÍDAS */}
        <div className="bg-zinc-900/50 rounded-2xl p-2.5 border border-white/5 flex items-center justify-between text-xs px-4 mb-4">
          <span className="text-zinc-400 font-medium">Séries concluídas:</span>
          <span className="font-black text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            {completedSets.length} de {allSets.length} séries
          </span>
        </div>

        {/* RECORDES PESSOAIS BATIDOS */}
        {personalRecords.length > 0 && (
          <div className="mb-4 text-left p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-1.5 mb-2 text-amber-300 font-black text-xs uppercase tracking-wide">
              <span>🏆</span>
              <span>{personalRecords.length} Novo(s) Recorde(s) Pessoal(is)!</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {personalRecords.map((pr, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/5"
                >
                  <span className="text-zinc-200 font-semibold truncate max-w-[190px]">
                    {pr.exerciseName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-black">{pr.newWeight} kg</span>
                    {pr.differenceKg > 0 && (
                      <span className="text-[10px] text-emerald-400 font-bold">
                        (+{pr.differenceKg}kg)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-400 leading-relaxed mb-5">
          Todas as cargas e repetições foram gravadas. A sobrecarga progressiva para a próxima sessão já foi recalculada!
        </p>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-zinc-300" />
            <span>{copied ? '✓ Resumo Copiado!' : 'Compartilhar Treino'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#ff1a00] hover:bg-red-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-950/50 transition-all active:scale-[0.99] cursor-pointer"
          >
            Continuar para o Início
          </button>
        </div>
      </div>
    </div>
  );
};
