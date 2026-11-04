import { ProgressionInput, ProgressionRecommendation } from '../types';

/**
 * Calcula a recomendação do próximo treino aplicando a Dupla Progressão (Double Progression).
 *
 * REGRA:
 * 1. O usuário primeiro preenche o teto da faixa de repetições (ex: 12 reps) em todas as séries com a carga atual.
 * 2. Se bateu o topo em todas as séries -> Aumenta a carga (+2kg membros superiores, +4kg inferiores) e volta para o piso (ex: 8 reps).
 * 3. Se falhou o piso em alguma série (< min_reps) -> Mantém o peso e foca na execução e cadência.
 * 4. Se está no meio da faixa (ex: 9 ou 10 reps) -> Mantém o peso e busca +1 repetição na série mais fraca.
 */
export function calculateDoubleProgression({
  targetMinReps,
  targetMaxReps,
  lastSessionSets,
  isUpperBody = true,
}: ProgressionInput): ProgressionRecommendation {
  if (!lastSessionSets || lastSessionSets.length === 0) {
    const defaultWeight = 20;
    return {
      suggestedWeight: defaultWeight,
      suggestedWeightKg: defaultWeight,
      suggestedRepsTarget: targetMinReps,
      rationale: 'Primeiro treino registrado: inicie com carga moderada e teste sua técnica.',
      reason: 'Primeiro treino registrado: inicie com carga moderada e teste sua técnica.',
      status: 'MAINTAIN',
      shouldIncreaseWeight: false,
    };
  }

  // Incremento padrão: 2kg para membros superiores, 4kg para inferiores (máquinas/pernas)
  const incrementStep = isUpperBody ? 2 : 4;

  // Carga mais recente usada
  const lastWeight = lastSessionSets[0].weight_kg;

  // Verifica se todas as séries atingiram ou superaram o teto
  const allSetsHitCeiling = lastSessionSets.every(
    (s) => s.reps_performed >= targetMaxReps
  );

  // Verifica se alguma série ficou abaixo do piso estipulado
  const anySetFailedFloor = lastSessionSets.some(
    (s) => s.reps_performed < targetMinReps
  );

  // CASO 1: Bateu o topo da faixa em todas as séries -> AUMENTAR CARGA
  if (allSetsHitCeiling) {
    const nextWeight = lastWeight + incrementStep;
    const msg = `Meta batida! Todas as séries atingiram ${targetMaxReps} reps. Suba a carga para ${nextWeight}kg (+${incrementStep}kg) e mire no piso de ${targetMinReps} reps hoje.`;
    return {
      suggestedWeight: nextWeight,
      suggestedWeightKg: nextWeight,
      suggestedRepsTarget: targetMinReps,
      rationale: msg,
      reason: msg,
      status: 'INCREASE_WEIGHT',
      shouldIncreaseWeight: true,
    };
  }

  // CASO 2: Ficou abaixo do piso de repetições estipulado -> SEGURAR/ESTABILIZAR
  if (anySetFailedFloor) {
    const lowestReps = Math.min(...lastSessionSets.map((s) => s.reps_performed));
    const msg = `Na última sessão você fez ${lowestReps} reps (< piso de ${targetMinReps}). Mantenha ${lastWeight}kg e consolide o movimento com segurança.`;
    return {
      suggestedWeight: lastWeight,
      suggestedWeightKg: lastWeight,
      suggestedRepsTarget: targetMinReps,
      rationale: msg,
      reason: msg,
      status: 'MAINTAIN',
      shouldIncreaseWeight: false,
    };
  }

  // CASO 3: Está no meio da faixa (ex: 9 ou 10 reps em faixa de 8-12) -> BUSCAR MAIS REPS
  const lowestReps = Math.min(...lastSessionSets.map((s) => s.reps_performed));
  const nextTargetReps = Math.min(lowestReps + 1, targetMaxReps);
  const msg = `Você está na faixa de evolução! Mantenha ${lastWeight}kg e tente alcançar ${nextTargetReps} reps em cada série hoje.`;

  return {
    suggestedWeight: lastWeight,
    suggestedWeightKg: lastWeight,
    suggestedRepsTarget: nextTargetReps,
    rationale: msg,
    reason: msg,
    status: 'INCREASE_REPS',
    shouldIncreaseWeight: false,
  };
}

/**
 * Calcula o Volume Load (Carga x Repetições x Séries)
 */
export function calculateVolumeLoad(sets: Array<{ weight_kg: number; reps_performed: number; completed?: boolean }>): number {
  return sets
    .filter((s) => s.completed !== false)
    .reduce((acc, curr) => acc + curr.weight_kg * curr.reps_performed, 0);
}

/**
 * Estima o 1RM (Uma Repetição Máxima) usando a fórmula clássica de Epley
 */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}
