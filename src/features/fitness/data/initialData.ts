import { BodyMeasurement, WorkoutPlan, WorkoutSession } from '../types';

// O usuário inicial não deve ter nenhuma ficha pré-criada; começa 100% limpo
export const INITIAL_WORKOUT_PLANS: WorkoutPlan[] = [];

// Histórico de treinos (inicia vazio para o usuário registrar seus próprios treinos)
export const INITIAL_SESSIONS: WorkoutSession[] = [];

// Histórico de medidas antropométricas (inicia vazio para o usuário registrar suas medidas)
export const INITIAL_MEASUREMENTS: BodyMeasurement[] = [];
