import { MuscleGroup, MuscleVolumeScore, WorkoutSession, Exercise } from '../types';
import { FitnessStorageService } from '../services/storageService';

export interface MuscleBalanceAlert {
  id: string;
  type: 'danger' | 'warning' | 'good';
  title: string;
  ratioDescription: string;
  recommendation: string;
  musclesInvolved: MuscleGroup[];
}

export interface MuscleBalanceAnalysis {
  overallScore: number; // 0 a 100 de equilíbrio geral
  status: 'balanced' | 'moderate' | 'unbalanced';
  alerts: MuscleBalanceAlert[];
  ratios: {
    chestToBackRatio: number;
    quadToHamstringRatio: number;
    upperToLowerRatio: number;
  };
  totalPushVolume: number;
  totalPullVolume: number;
}

export function analyzeMuscleBalance(
  scores?: Partial<Record<MuscleGroup, MuscleVolumeScore>>
): MuscleBalanceAnalysis {
  const muscleScores = scores || FitnessStorageService.calculateMuscleScores();

  const getVol = (m: MuscleGroup): number => {
    return muscleScores[m]?.total_volume_kg || 0;
  };

  const getSets = (m: MuscleGroup): number => {
    return muscleScores[m]?.total_sets_completed || 0;
  };

  const chestVol = getVol('chest');
  const backVol = getVol('back');
  const shouldersVol = getVol('shoulders');
  const bicepsVol = getVol('biceps');
  const tricepsVol = getVol('triceps');
  const quadVol = getVol('quadriceps');
  const hamVol = getVol('hamstrings');
  const calvesVol = getVol('calves');
  const glutesVol = getVol('glutes');

  const pushVol = chestVol + tricepsVol + shouldersVol * 0.6;
  const pullVol = backVol + bicepsVol + shouldersVol * 0.4;
  const legVol = quadVol + hamVol + calvesVol + glutesVol;
  const upperVol = pushVol + pullVol;

  const alerts: MuscleBalanceAlert[] = [];

  // 1. Peitoral vs Costas (Push/Pull de Tronco)
  const chestToBackRatio = backVol > 0 ? chestVol / backVol : chestVol > 0 ? 3 : 1;
  if (chestVol > 0 && backVol === 0 && chestVol > 1000) {
    alerts.push({
      id: 'chest-no-back',
      type: 'danger',
      title: 'Peitoral sem estímulo de Costas',
      ratioDescription: 'Volume de Peito muito alto sem registros de Costas',
      recommendation: 'Adicione puxadas e remadas urgentemente para prevenir hipercifose e dores no manguito rotador.',
      musclesInvolved: ['chest', 'back'],
    });
  } else if (chestToBackRatio >= 2.0 && chestVol > 1200) {
    alerts.push({
      id: 'chest-over-back',
      type: 'danger',
      title: 'Desequilíbrio: Peitoral dominante sobre Costas',
      ratioDescription: `Peitoral está com ${chestToBackRatio.toFixed(1)}x mais volume que Costas`,
      recommendation: 'Aumente o volume de remadas e crucifixo invertido para equilibrar a cintura escapular e evitar lesões nos ombros.',
      musclesInvolved: ['chest', 'back'],
    });
  } else if (backVol >= 2.2 * chestVol && backVol > 1500) {
    alerts.push({
      id: 'back-over-chest',
      type: 'warning',
      title: 'Costas com volume muito superior ao Peito',
      ratioDescription: `Costas está com ${(backVol / Math.max(chestVol, 1)).toFixed(1)}x mais volume que Peito`,
      recommendation: 'Considere distribuir melhor os exercícios de peito para manter a simetria do tronco.',
      musclesInvolved: ['chest', 'back'],
    });
  }

  // 2. Quadríceps vs Posteriores de Coxa (Hamstrings)
  const quadToHamstringRatio = hamVol > 0 ? quadVol / hamVol : quadVol > 0 ? 3 : 1;
  if (quadVol > 0 && hamVol === 0 && quadVol > 1000) {
    alerts.push({
      id: 'quad-no-ham',
      type: 'danger',
      title: 'Posteriores de Coxa negligenciados',
      ratioDescription: 'Quadríceps treinado sem treino de Posterior',
      recommendation: 'Risco elevado de estiramento muscular e sobrecarga no joelho (LCA). Inclua mesa flexora e stiff no treino.',
      musclesInvolved: ['quadriceps', 'hamstrings'],
    });
  } else if (quadToHamstringRatio >= 2.2 && quadVol > 1500) {
    alerts.push({
      id: 'quad-over-ham',
      type: 'danger',
      title: 'Desequilíbrio: Quadríceps dominante',
      ratioDescription: `Quadríceps com ${quadToHamstringRatio.toFixed(1)}x mais volume que Posterior`,
      recommendation: 'A proporção segura recomendada é de pelo menos 0.75x a 1x. Adicione mais séries de stiff e flexora.',
      musclesInvolved: ['quadriceps', 'hamstrings'],
    });
  }

  // 3. Superiores vs Inferiores
  const totalBodyVol = upperVol + legVol;
  const upperToLowerRatio = legVol > 0 ? upperVol / legVol : upperVol > 0 ? 5 : 1;
  if (totalBodyVol > 2000 && legVol < totalBodyVol * 0.18) {
    alerts.push({
      id: 'leg-skip',
      type: 'warning',
      title: 'Pernas negligenciadas',
      ratioDescription: `Apenas ${Math.round((legVol / totalBodyVol) * 100)}% do volume total é de pernas`,
      recommendation: 'O treino de pernas ativa os maiores grupos musculares do corpo e otimiza a liberação hormonal e gasto calórico.',
      musclesInvolved: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
    });
  }

  // Caso esteja tudo bem distribuído
  if (alerts.length === 0 && totalBodyVol > 1000) {
    alerts.push({
      id: 'balanced-harmony',
      type: 'good',
      title: 'Ótima Harmonia Muscular!',
      ratioDescription: 'Proporções entre empurrar, puxar e pernas estão equilibradas',
      recommendation: 'Excelente trabalho na periodização dos seus treinos. Continue progredindo com segurança.',
      musclesInvolved: ['chest', 'back', 'quadriceps'],
    });
  }

  // Cálculo da pontuação geral de harmonia (0 a 100)
  let overallScore = 95;
  alerts.forEach((alert) => {
    if (alert.type === 'danger') overallScore -= 30;
    if (alert.type === 'warning') overallScore -= 15;
  });
  overallScore = Math.max(20, Math.min(100, overallScore));

  const status: 'balanced' | 'moderate' | 'unbalanced' =
    overallScore >= 80 ? 'balanced' : overallScore >= 55 ? 'moderate' : 'unbalanced';

  return {
    overallScore,
    status,
    alerts,
    ratios: {
      chestToBackRatio,
      quadToHamstringRatio,
      upperToLowerRatio,
    },
    totalPushVolume: pushVol,
    totalPullVolume: pullVol,
  };
}
