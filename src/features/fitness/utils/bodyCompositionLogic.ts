import { BodyMeasurement, WorkoutSession } from '../types';
import { calculateVolumeLoad } from './progressionLogic';

export interface BodyFatEstimate {
  bodyFatPct: number;
  leanMassKg: number;
  fatMassKg: number;
  category: 'essential' | 'athlete' | 'fitness' | 'average' | 'above_average';
  categoryLabel: string;
  categoryColor: string;
}

export type EvolutionStatus = 'EVOLVING' | 'REGRESSING' | 'STAGNATED' | 'INSUFFICIENT_DATA';

export interface EvolutionAnalysis {
  status: EvolutionStatus;
  statusLabel: string;
  statusColor: string;
  score: number; // 0 a 100
  title: string;
  summary: string;
  details: {
    currentAvgWeight: number;
    previousAvgWeight: number;
    weightDiff: number;
    currentAvgBodyFat: number;
    previousAvgBodyFat: number;
    bodyFatDiff: number;
    currentAvgLeanMass: number;
    previousAvgLeanMass: number;
    leanMassDiff: number;
    strengthProgressionPct: number;
  };
  recommendations: string[];
}

/**
 * Estima o percentual de gordura corporal (%BF) utilizando o método RFM (Relative Fat Mass)
 * e o método antropométrico da Marinha dos EUA (U.S. Navy), referências mundiais sem necessidade de adipômetro.
 */
export function estimateBodyFat(
  measurement: Partial<BodyMeasurement>,
  gender: 'male' | 'female' = 'male'
): BodyFatEstimate {
  const weight = Number(measurement.weight_kg) || 75;
  const height = Number(measurement.height_cm) || 175;
  const waist = Number(measurement.waist_cm) || Number(measurement.abdomen_cm) || 84;
  const neck = (measurement as any).neck_cm || (gender === 'male' ? height * 0.225 : height * 0.205);
  const hip = Number(measurement.glutes_cm) || waist * 1.05;

  let bodyFatPct = 0;

  // Se já tiver % de gordura digitado manualmente
  if (measurement.body_fat_pct && measurement.body_fat_pct > 3 && measurement.body_fat_pct < 60) {
    bodyFatPct = measurement.body_fat_pct;
  } else if (measurement.body_fat_percentage && measurement.body_fat_percentage > 3) {
    bodyFatPct = measurement.body_fat_percentage;
  } else {
    // 1. Método RFM (Relative Fat Mass - Cedars-Sinai Medical Center):
    // Homens: 64 - (20 * altura / cintura)
    // Mulheres: 76 - (20 * altura / cintura)
    const rfmFat = gender === 'male' ? 64 - (20 * height) / waist : 76 - (20 * height) / waist;

    // 2. Método US Navy:
    let navyFat = 15;
    try {
      if (gender === 'male') {
        const diff = Math.max(1, waist - neck);
        navyFat = 86.01 * Math.log10(diff) - 70.041 * Math.log10(height) + 36.76;
      } else {
        const diff = Math.max(1, waist + hip - neck);
        navyFat = 163.205 * Math.log10(diff) - 97.684 * Math.log10(height) - 78.387;
      }
    } catch {
      navyFat = rfmFat;
    }

    // Combina os modelos antropométricos para alta robustez e suavidade
    bodyFatPct = (rfmFat * 0.6 + navyFat * 0.4);
    // Limites fisiológicos razoáveis
    bodyFatPct = Math.max(5, Math.min(48, Math.round(bodyFatPct * 10) / 10));
  }

  const fatMassKg = Math.round((weight * (bodyFatPct / 100)) * 10) / 10;
  const leanMassKg = Math.round((weight - fatMassKg) * 10) / 10;

  let category: BodyFatEstimate['category'] = 'fitness';
  let categoryLabel = 'Fitness';
  let categoryColor = '#10b981';

  if (gender === 'male') {
    if (bodyFatPct < 6) {
      category = 'essential';
      categoryLabel = 'Gordura Essencial';
      categoryColor = '#f59e0b';
    } else if (bodyFatPct <= 13) {
      category = 'athlete';
      categoryLabel = 'Atleta / Definido';
      categoryColor = '#10b981';
    } else if (bodyFatPct <= 17) {
      category = 'fitness';
      categoryLabel = 'Fitness / Bom';
      categoryColor = '#3b82f6';
    } else if (bodyFatPct <= 24) {
      category = 'average';
      categoryLabel = 'Médio / Moderado';
      categoryColor = '#eab308';
    } else {
      category = 'above_average';
      categoryLabel = 'Acima da Média';
      categoryColor = '#ef4444';
    }
  } else {
    if (bodyFatPct < 14) {
      category = 'essential';
      categoryLabel = 'Gordura Essencial';
      categoryColor = '#f59e0b';
    } else if (bodyFatPct <= 20) {
      category = 'athlete';
      categoryLabel = 'Atleta / Definida';
      categoryColor = '#10b981';
    } else if (bodyFatPct <= 24) {
      category = 'fitness';
      categoryLabel = 'Fitness / Bom';
      categoryColor = '#3b82f6';
    } else if (bodyFatPct <= 31) {
      category = 'average';
      categoryLabel = 'Médio / Moderado';
      categoryColor = '#eab308';
    } else {
      category = 'above_average';
      categoryLabel = 'Acima da Média';
      categoryColor = '#ef4444';
    }
  }

  return {
    bodyFatPct,
    leanMassKg,
    fatMassKg,
    category,
    categoryLabel,
    categoryColor,
  };
}

/**
 * Calcula a evolução com média móvel entre o período mais recente e o período anterior.
 * Evita falsos positivos de flutuações diárias (água, glicogênio, sódio) e diz se está:
 * - EVOLUINDO 🚀
 * - REGREDINDO ⚠️
 * - ESTAGNADO / PLATÔ ⏸️
 */
export function calculateEvolutionAnalysis(
  measurements: BodyMeasurement[],
  sessions: WorkoutSession[] = [],
  gender: 'male' | 'female' = 'male'
): EvolutionAnalysis {
  if (!measurements || measurements.length === 0) {
    return {
      status: 'INSUFFICIENT_DATA',
      statusLabel: 'Aguardando Medições',
      statusColor: '#71717a',
      score: 50,
      title: 'Cadastre suas primeiras medições',
      summary: 'Registre pelo menos duas medições com intervalo de dias para calcular a média de evolução corporal.',
      details: {
        currentAvgWeight: 0,
        previousAvgWeight: 0,
        weightDiff: 0,
        currentAvgBodyFat: 0,
        previousAvgBodyFat: 0,
        bodyFatDiff: 0,
        currentAvgLeanMass: 0,
        previousAvgLeanMass: 0,
        leanMassDiff: 0,
        strengthProgressionPct: 0,
      },
      recommendations: [
        'Meça seu peso e circunferências (cintura, braços, peito, pernas) pela manhã em jejum.',
        'Faça uma nova medição a cada 1 a 2 semanas para formar a curva de médias.',
      ],
    };
  }

  // Ordena da mais recente para a mais antiga
  const sortedMeasurements = [...measurements].sort(
    (a, b) =>
      new Date(b.date || b.recorded_at).getTime() -
      new Date(a.date || a.recorded_at).getTime()
  );

  // Se houver apenas 1 medição, faz análise estática inicial
  if (sortedMeasurements.length === 1) {
    const single = sortedMeasurements[0];
    const est = estimateBodyFat(single, gender);
    return {
      status: 'INSUFFICIENT_DATA',
      statusLabel: 'Ponto de Partida Definido',
      statusColor: '#3b82f6',
      score: 60,
      title: 'Ponto de Partida Registrado!',
      summary: `Seu peso base é ${single.weight_kg} kg com estimativa de ${est.bodyFatPct}% de gordura (${est.leanMassKg} kg de massa magra). Registre a próxima medição para calcular se você está evoluindo!`,
      details: {
        currentAvgWeight: single.weight_kg,
        previousAvgWeight: single.weight_kg,
        weightDiff: 0,
        currentAvgBodyFat: est.bodyFatPct,
        previousAvgBodyFat: est.bodyFatPct,
        bodyFatDiff: 0,
        currentAvgLeanMass: est.leanMassKg,
        previousAvgLeanMass: est.leanMassKg,
        leanMassDiff: 0,
        strengthProgressionPct: 0,
      },
      recommendations: [
        'Mantenha a regularidade nos treinos e progrida as cargas série a série.',
        'Daqui a 7 a 14 dias adicione a segunda medição para ativar o diagnóstico de evolução.',
      ],
    };
  }

  // Divide o histórico em dois grupos para calcular a média móvel (Recente vs Anterior)
  const half = Math.max(1, Math.floor(sortedMeasurements.length / 2));
  const recentGroup = sortedMeasurements.slice(0, half);
  const previousGroup = sortedMeasurements.slice(half);

  const calcGroupAverages = (group: BodyMeasurement[]) => {
    let sumWeight = 0;
    let sumBodyFat = 0;
    let sumLeanMass = 0;

    group.forEach((m) => {
      sumWeight += Number(m.weight_kg) || 0;
      const est = estimateBodyFat(m, gender);
      sumBodyFat += est.bodyFatPct;
      sumLeanMass += est.leanMassKg;
    });

    const len = group.length || 1;
    return {
      avgWeight: Math.round((sumWeight / len) * 10) / 10,
      avgBodyFat: Math.round((sumBodyFat / len) * 10) / 10,
      avgLeanMass: Math.round((sumLeanMass / len) * 10) / 10,
    };
  };

  const current = calcGroupAverages(recentGroup);
  const previous = calcGroupAverages(previousGroup);

  const weightDiff = Math.round((current.avgWeight - previous.avgWeight) * 10) / 10;
  const bodyFatDiff = Math.round((current.avgBodyFat - previous.avgBodyFat) * 10) / 10;
  const leanMassDiff = Math.round((current.avgLeanMass - previous.avgLeanMass) * 10) / 10;

  // Analisa progressão de cargas nos treinos (últimos 30 dias vs anteriores)
  let strengthProgressionPct = 0;
  if (sessions.length >= 2) {
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );
    const halfSess = Math.floor(sortedSessions.length / 2);
    const firstHalf = sortedSessions.slice(0, halfSess);
    const secondHalf = sortedSessions.slice(halfSess);

    const calcAvgVolume = (sessList: WorkoutSession[]) => {
      let total = 0;
      sessList.forEach((s) => {
        const sets = Object.values(s.exercises_logs || {}).flat().filter((st) => st.completed);
        total += calculateVolumeLoad(sets);
      });
      return total / (sessList.length || 1);
    };

    const firstVol = calcAvgVolume(firstHalf);
    const secondVol = calcAvgVolume(secondHalf);

    if (firstVol > 0) {
      strengthProgressionPct = Math.round(((secondVol - firstVol) / firstVol) * 100);
    }
  }

  // ALGORITMO CLÍNICO DE DIAGNÓSTICO:
  // EVOLUINDO:
  // - Ganho de massa magra (leanMassDiff >= +0.3 kg) OU
  // - Redução de gordura (bodyFatDiff <= -0.4%) OU
  // - Recomposição corporal (massa magra estável/subindo e gordura caindo) OU
  // - Sobrecarga progressiva de força (+5% ou mais de volume/carga)
  //
  // REGREDINDO:
  // - Aumento significativo de gordura (bodyFatDiff >= +1.5%) e perda de massa magra (leanMassDiff <= -0.5 kg)
  // - Perda acentuada de força (-10% de carga) e desmotivação
  //
  // ESTAGNADO:
  // - Variação menor que ±0.3kg de massa magra E variação menor que ±0.4% de gordura por várias medições consecutivas

  let status: EvolutionStatus = 'STAGNATED';
  let statusLabel = 'Estagnado (Platô)';
  let statusColor = '#f59e0b';
  let score = 50;
  let title = 'Fase de Estagnação / Platô';
  let summary = '';
  const recommendations: string[] = [];

  const isGainingMuscle = leanMassDiff >= 0.4;
  const isLosingFat = bodyFatDiff <= -0.4;
  const isGainingFat = bodyFatDiff >= 1.2;
  const isLosingMuscle = leanMassDiff <= -0.5;
  const hasStrengthGain = strengthProgressionPct >= 5;

  if ((isGainingMuscle && !isGainingFat) || (isLosingFat && !isLosingMuscle) || (isGainingMuscle && isLosingFat) || (hasStrengthGain && !isGainingFat)) {
    status = 'EVOLVING';
    statusLabel = 'Evoluindo a Todo Vapor';
    statusColor = '#10b981';
    score = Math.min(98, 75 + Math.round((leanMassDiff > 0 ? leanMassDiff * 8 : 0) + (bodyFatDiff < 0 ? Math.abs(bodyFatDiff) * 6 : 0) + (hasStrengthGain ? 10 : 0)));

    if (isGainingMuscle && isLosingFat) {
      title = 'Recomposição Corporal Perfeita! 🚀';
      summary = `Você está no melhor cenário possível: sua média de massa magra aumentou em +${leanMassDiff} kg enquanto o percentual de gordura reduziu em ${Math.abs(bodyFatDiff)}%.`;
    } else if (isGainingMuscle) {
      title = 'Ganho de Massa Muscular Notável! 💪';
      summary = `Sua média aponta um ganho sólido de +${leanMassDiff} kg de massa magra, mantendo a composição corporal sob controle.`;
    } else if (isLosingFat) {
      title = 'Queima de Gordura e Definição! 🔥';
      summary = `Excelente resultado no cutting: você reduziu ${Math.abs(bodyFatDiff)}% de gordura média corporal preservando sua estrutura muscular.`;
    } else {
      title = 'Progresso Contínuo de Força & Volume! ⚡';
      summary = `Mesmo com peso estável, suas cargas e volume nos treinos subiram +${strengthProgressionPct}%, sinalizando adaptação neuromuscular de qualidade.`;
    }

    recommendations.push(
      'Mantenha a estratégia atual: o superávit/déficit calórico e o estímulo de treino estão funcionando perfeitamente.',
      'Continue aplicando a Dupla Progressão de cargas na primeira série de cada exercício.',
      'Garanta pelo menos 7 a 8 horas de sono para potencializar a síntese proteica.'
    );
  } else if ((isGainingFat && isLosingMuscle) || (bodyFatDiff >= 1.8 && leanMassDiff <= 0)) {
    status = 'REGREDINDO';
    statusLabel = 'Regredindo (Atenção)';
    statusColor = '#ef4444';
    score = Math.max(25, 45 - Math.round(bodyFatDiff * 5));
    title = 'Sinal de Alerta na Composição Corporal ⚠️';
    summary = `A comparação das médias indica aumento de gordura (+${bodyFatDiff}%) com oscilação negativa de massa magra (${leanMassDiff} kg). É hora de recalibrar a rotina.`;

    recommendations.push(
      'Ajuste alimentar urgente: reduza o excesso calórico ou alimentos ultraprocessados da dieta.',
      'Revise o aporte proteico diário (mínimo de 1.6g a 2.0g de proteína por kg de peso corporal).',
      'Verifique se a intensidade dos treinos (RPE 8-9) está sendo cumprida e evite faltar sessões programadas.'
    );
  } else {
    // Estagnado / Platô
    status = 'STAGNATED';
    statusLabel = 'Estagnado (Platô)';
    statusColor = '#f59e0b';
    score = 55;
    title = 'Estagnação / Platô Detectado ⏸️';
    summary = `Suas médias de peso (${current.avgWeight} kg), gordura (${current.avgBodyFat}%) e massa magra (${current.avgLeanMass} kg) apresentaram pouca ou nenhuma variação nas últimas medições. Seu corpo se adaptou ao estímulo atual.`;

    recommendations.push(
      'Quebre o platô calórico: ajuste o consumo em 200 a 300 kcal (aumente para bulking ou reduza para cutting).',
      'Aplique novas técnicas de intensidade: experimente Drop-sets ou Bi-sets em exercícios estagnados.',
      'Considere uma semana de Deload (reduzir 40% do volume com a mesma carga) para recuperação do sistema nervoso central.'
    );
  }

  return {
    status,
    statusLabel,
    statusColor,
    score,
    title,
    summary,
    details: {
      currentAvgWeight: current.avgWeight,
      previousAvgWeight: previous.avgWeight,
      weightDiff,
      currentAvgBodyFat: current.avgBodyFat,
      previousAvgBodyFat: previous.avgBodyFat,
      bodyFatDiff,
      currentAvgLeanMass: current.avgLeanMass,
      previousAvgLeanMass: previous.avgLeanMass,
      leanMassDiff,
      strengthProgressionPct,
    },
    recommendations,
  };
}
