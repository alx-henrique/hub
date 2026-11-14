import { WorkoutSession } from '../types';

export interface SessionPersonalRecord {
  exerciseId: string;
  exerciseName: string;
  newWeight: number;
  previousWeight: number;
  differenceKg: number;
}

/**
 * Retorna a maior carga histórica (em kg) realizada para um exercício
 */
export function getExerciseAllTimePR(exerciseId: string, sessions: WorkoutSession[]): number {
  let maxWeight = 0;
  for (const session of sessions) {
    const logs = session.exercises_logs?.[exerciseId];
    if (logs && Array.isArray(logs)) {
      for (const set of logs) {
        if (set.completed && typeof set.weight_kg === 'number' && set.weight_kg > maxWeight) {
          maxWeight = set.weight_kg;
        }
      }
    }
  }
  return maxWeight;
}

/**
 * Verifica se a carga recém completada superou o recorde histórico anterior
 */
export function checkIsNewPR(
  exerciseId: string,
  weight: number,
  sessions: WorkoutSession[]
): { isPR: boolean; previousPR: number; difference: number } {
  const previousPR = getExerciseAllTimePR(exerciseId, sessions);
  if (previousPR > 0 && weight > previousPR) {
    return {
      isPR: true,
      previousPR,
      difference: Math.round((weight - previousPR) * 10) / 10,
    };
  }
  return {
    isPR: false,
    previousPR,
    difference: 0,
  };
}
