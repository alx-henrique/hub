import { BodyMeasurement, MuscleGroup, WorkoutPlan, WorkoutSession, WorkoutSetLog, MuscleVolumeScore, Exercise } from '../types';
import { INITIAL_MEASUREMENTS, INITIAL_SESSIONS, INITIAL_WORKOUT_PLANS } from '../data/initialData';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';
import { calculateVolumeLoad } from '../utils/progressionLogic';

const STORAGE_KEYS = {
  PLANS: 'ph_fitness_plans_v6',
  SESSIONS: 'ph_fitness_sessions_v6',
  MEASUREMENTS: 'ph_fitness_measurements_v6',
  CUSTOM_EXERCISES: 'ph_fitness_custom_exercises_v6',
  ACTIVE_PLAN_ID: 'ph_fitness_active_plan_id_v6',
  ACTIVE_SESSION: 'ph_fitness_active_session_draft_v6',
  MIGRATION_FLAG: 'ph_fitness_clean_v6',
};

export class FitnessStorageService {
  // Inicialização com dados limpos para a experiência de novo usuário
  private static ensureMigration() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.MIGRATION_FLAG)) {
        localStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, 'true');
        localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_WORKOUT_PLANS));
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify([]));
      }
    } catch {
      // Ignora erro em ambientes sem localStorage
    }
  }

  static getCustomExercises(): Exercise[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveCustomExercises(list: Exercise[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(list));
  }

  static addCustomExercise(ex: Exercise): Exercise[] {
    const list = this.getCustomExercises();
    const updated = [ex, ...list];
    this.saveCustomExercises(updated);
    return updated;
  }

  static getAllExercises(): Exercise[] {
    return [...this.getCustomExercises(), ...EXERCISE_DATABASE];
  }

  static getPlans(): WorkoutPlan[] {
    this.ensureMigration();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANS);
      const plans: WorkoutPlan[] = data ? JSON.parse(data) : INITIAL_WORKOUT_PLANS;
      
      // Hidratação segura dos exercícios em cada dia
      const allEx = this.getAllExercises();
      return plans.map((plan) => ({
        ...plan,
        days: plan.days.map((day) => ({
          ...day,
          exercises: day.exercises.map((pe) => {
            const resolvedEx =
              allEx.find((e) => e.id === pe.exercise_id || e.id === pe.exercise?.id) ||
              pe.exercise ||
              allEx[0];
            return {
              ...pe,
              exercise: resolvedEx,
            };
          }),
        })),
      }));
    } catch {
      return INITIAL_WORKOUT_PLANS;
    }
  }

  static savePlans(plans: WorkoutPlan[]) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  }

  static getSessions(): WorkoutSession[] {
    this.ensureMigration();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : INITIAL_SESSIONS;
    } catch {
      return INITIAL_SESSIONS;
    }
  }

  static saveSessions(sessions: WorkoutSession[]) {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  static addSession(session: WorkoutSession): WorkoutSession[] {
    const sessions = this.getSessions();
    const updated = [session, ...sessions];
    this.saveSessions(updated);
    return updated;
  }

  static getMeasurements(): BodyMeasurement[] {
    this.ensureMigration();
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
      return data ? JSON.parse(data) : INITIAL_MEASUREMENTS;
    } catch {
      return INITIAL_MEASUREMENTS;
    }
  }

  static saveMeasurements(measurements: BodyMeasurement[]) {
    localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(measurements));
  }

  static addMeasurement(measurement: BodyMeasurement): BodyMeasurement[] {
    const list = this.getMeasurements();
    const existingIndex = list.findIndex((m) => m.id === measurement.id);
    let updated: BodyMeasurement[];
    if (existingIndex >= 0) {
      updated = [...list];
      updated[existingIndex] = measurement;
    } else {
      updated = [measurement, ...list];
    }
    updated.sort(
      (a, b) =>
        new Date(b.date || b.recorded_at).getTime() -
        new Date(a.date || a.recorded_at).getTime()
    );
    this.saveMeasurements(updated);
    return updated;
  }

  static updateMeasurement(measurement: BodyMeasurement): BodyMeasurement[] {
    return this.addMeasurement(measurement);
  }

  static deleteMeasurement(id: string): BodyMeasurement[] {
    const list = this.getMeasurements();
    const updated = list.filter((m) => m.id !== id);
    this.saveMeasurements(updated);
    return updated;
  }

  static resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.MIGRATION_FLAG);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_WORKOUT_PLANS));
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(INITIAL_MEASUREMENTS));
    localStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG, 'true');
  }

  /**
   * Encontra as séries do ÚLTIMO treino realizado para um determinado exercício.
   * Usado para a referência visual: "Último: 40kg x 10" e cálculo da Dupla Progressão.
   */
  static getLastPerformanceForExercise(
    exerciseId: string,
    currentSessionIdToExclude?: string
  ): Array<{ weight_kg: number; reps_performed: number; rpe?: number }> | null {
    const sessions = this.getSessions();
    
    // Ordena as sessões da mais recente para a mais antiga
    const sorted = [...sessions]
      .filter((s) => s.id !== currentSessionIdToExclude && s.completed_at)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    for (const session of sorted) {
      const sets = session.exercises_logs?.[exerciseId];
      if (sets && sets.length > 0) {
        const validSets = sets.filter((s) => s.completed && s.reps_performed > 0);
        if (validSets.length > 0) {
          return validSets.map((s) => ({
            weight_kg: s.weight_kg,
            reps_performed: s.reps_performed,
            rpe: s.rpe,
          }));
        }
      }
    }
    return null;
  }

  /**
   * Salva o registro avulso de séries executadas diretamente na tela de exercício
   */
  static recordExercisePerformance(exerciseId: string, sets: WorkoutSetLog[]) {
    const session: WorkoutSession = {
      id: `session-single-${Date.now()}`,
      plan_day_id: 'custom',
      plan_day_title: 'Execução de Exercício',
      started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      completed_at: new Date().toISOString(),
      duration_minutes: 15,
      notes: 'Registro avulso do exercício via tela interativa de carga e reps.',
      exercises_logs: {
        [exerciseId]: sets,
      },
    };
    this.addSession(session);
  }

  /**
   * Calcula pontuações de volume relativo (0 a 100) por grupamento muscular.
   * Alimenta o Manequim Digital Bio-Feedback para renderizar a hipertrofia.
   */
  static calculateMuscleScores(): Partial<Record<MuscleGroup, MuscleVolumeScore>> {
    const sessions = this.getSessions();
    const allExercises = this.getAllExercises();
    const exMap = new Map<string, Exercise>(allExercises.map((e) => [e.id, e]));

    const volumeByMuscle: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      forearms: 0,
      quadriceps: 0,
      hamstrings: 0,
      calves: 0,
      glutes: 0,
      core: 0,
    };

    const setsByMuscle: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      forearms: 0,
      quadriceps: 0,
      hamstrings: 0,
      calves: 0,
      glutes: 0,
      core: 0,
    };

    // Considera os últimos 30 dias de treino
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    sessions
      .filter((s) => s.completed_at && new Date(s.started_at).getTime() >= thirtyDaysAgo)
      .forEach((session) => {
        Object.entries(session.exercises_logs || {}).forEach(([exId, sets]) => {
          const exercise = exMap.get(exId);
          if (!exercise) return;

          const completedSets = sets.filter((s) => s.completed);
          if (completedSets.length === 0) return;

          const totalVolume = calculateVolumeLoad(completedSets);

          // 100% do volume vai para o músculo primário
          volumeByMuscle[exercise.target_muscle] += totalVolume;
          setsByMuscle[exercise.target_muscle] += completedSets.length;

          // 35% do volume vai para os músculos secundários/sinergistas
          exercise.secondary_muscles.forEach((sec) => {
            volumeByMuscle[sec] += Math.round(totalVolume * 0.35);
            setsByMuscle[sec] += Math.round(completedSets.length * 0.35);
          });
        });
      });

    // Encontra o maior volume para normalização
    const maxVolume = Math.max(...Object.values(volumeByMuscle), 1);

    const scores: Partial<Record<MuscleGroup, MuscleVolumeScore>> = {};
    (Object.keys(volumeByMuscle) as MuscleGroup[]).forEach((muscle) => {
      const vol = volumeByMuscle[muscle];
      const sets = setsByMuscle[muscle];
      // Normalização com curva logarítmica suave para resposta visual realista
      const normalizedScore = vol === 0 ? 0 : Math.min(100, Math.round((vol / maxVolume) * 90 + 10));

      scores[muscle] = {
        muscle,
        score: normalizedScore,
        total_volume_kg: vol,
        total_sets_completed: sets,
        last_trained_date: this.getLastTrainedDate(muscle, sessions, exMap),
      };
    });

    return scores;
  }

  private static getLastTrainedDate(
    muscle: MuscleGroup,
    sessions: WorkoutSession[],
    exMap: Map<string, Exercise>
  ): string | undefined {
    for (const session of sessions) {
      if (!session.completed_at) continue;
      for (const exId of Object.keys(session.exercises_logs || {})) {
        const ex = exMap.get(exId);
        if (ex && (ex.target_muscle === muscle || ex.secondary_muscles.includes(muscle))) {
          return session.started_at.split('T')[0];
        }
      }
    }
    return undefined;
  }
}
