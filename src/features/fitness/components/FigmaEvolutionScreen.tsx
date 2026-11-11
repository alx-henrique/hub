import React, { useState, useMemo } from 'react';
import { BodyMeasurement, Exercise } from '../types';
import { FitnessStorageService } from '../services/storageService';
import { analyzeMuscleBalance } from '../utils/muscleBalanceLogic';
import { estimateBodyFat, calculateEvolutionAnalysis } from '../utils/bodyCompositionLogic';
import {
  Ruler,
  Calendar,
  Scale,
  Plus,
  X,
  TrendingUp,
  Dumbbell,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Award,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Percent,
  Activity,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface FigmaEvolutionScreenProps {
  measurements: BodyMeasurement[];
  onAddMeasurement: (m: BodyMeasurement) => void;
  onDeleteMeasurement?: (id: string) => void;
}

export const FigmaEvolutionScreen: React.FC<FigmaEvolutionScreenProps> = ({
  measurements,
  onAddMeasurement,
  onDeleteMeasurement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null);
  const [showHistoryList, setShowHistoryList] = useState(false);

  const [selectedMetric, setSelectedMetric] = useState<
    | 'weight_kg'
    | 'body_fat_pct'
    | 'shoulders_cm'
    | 'chest_cm'
    | 'biceps_right_cm'
    | 'biceps_left_cm'
    | 'arm_right_cm'
    | 'arm_left_cm'
    | 'waist_cm'
    | 'abdomen_cm'
    | 'glutes_cm'
    | 'thigh_right_cm'
    | 'thigh_left_cm'
    | 'calf_right_cm'
    | 'calf_left_cm'
  >('weight_kg');

  const [selectedExercise, setSelectedExercise] = useState<string>('ex-bench-press');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // Estado do formulário de inclusão/edição
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    weight_kg: 80,
    height_cm: 175,
    shoulders_cm: 115,
    chest_cm: 102,
    biceps_right_cm: 37,
    biceps_left_cm: 36.5,
    arm_right_cm: 38,
    arm_left_cm: 37.5,
    waist_cm: 82,
    abdomen_cm: 84,
    glutes_cm: 100,
    thigh_right_cm: 58,
    thigh_left_cm: 58,
    calf_right_cm: 38,
    calf_left_cm: 37.5,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Abrir modal para novo registro
  const handleOpenNew = () => {
    setEditingMeasurementId(null);
    const latest = measurements[0];
    if (latest) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight_kg: latest.weight_kg || 80,
        height_cm: latest.height_cm || 175,
        shoulders_cm: latest.shoulders_cm || 115,
        chest_cm: latest.chest_cm || 102,
        biceps_right_cm: latest.biceps_right_cm || latest.biceps_cm || 37,
        biceps_left_cm: latest.biceps_left_cm || latest.biceps_cm || 36.5,
        arm_right_cm: latest.arm_right_cm || latest.arms_cm || 38,
        arm_left_cm: latest.arm_left_cm || latest.arms_cm || 37.5,
        waist_cm: latest.waist_cm || 82,
        abdomen_cm: latest.abdomen_cm || 84,
        glutes_cm: latest.glutes_cm || 100,
        thigh_right_cm: latest.thigh_right_cm || latest.thighs_cm || 58,
        thigh_left_cm: latest.thigh_left_cm || latest.thighs_cm || 58,
        calf_right_cm: latest.calf_right_cm || latest.calves_cm || 38,
        calf_left_cm: latest.calf_left_cm || latest.calves_cm || 37.5,
      });
    } else {
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  // Abrir modal para editar registro existente
  const handleEditMeasurement = (m: BodyMeasurement) => {
    setEditingMeasurementId(m.id);
    const dateFormatted = m.date || (m.recorded_at ? m.recorded_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormData({
      date: dateFormatted,
      weight_kg: m.weight_kg || 0,
      height_cm: m.height_cm || 175,
      shoulders_cm: m.shoulders_cm || 0,
      chest_cm: m.chest_cm || 0,
      biceps_right_cm: m.biceps_right_cm || m.biceps_cm || 0,
      biceps_left_cm: m.biceps_left_cm || m.biceps_cm || 0,
      arm_right_cm: m.arm_right_cm || m.arms_cm || 0,
      arm_left_cm: m.arm_left_cm || m.arms_cm || 0,
      waist_cm: m.waist_cm || 0,
      abdomen_cm: m.abdomen_cm || 0,
      glutes_cm: m.glutes_cm || 0,
      thigh_right_cm: m.thigh_right_cm || m.thighs_cm || 0,
      thigh_left_cm: m.thigh_left_cm || m.thighs_cm || 0,
      calf_right_cm: m.calf_right_cm || m.calves_cm || 0,
      calf_left_cm: m.calf_left_cm || m.calves_cm || 0,
    });
    setIsModalOpen(true);
  };

  // Excluir registro
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta medição?')) {
      if (onDeleteMeasurement) {
        onDeleteMeasurement(id);
      } else {
        FitnessStorageService.deleteMeasurement(id);
      }
    }
  };

  // Dados para o Gráfico de Medidas
  const chartData = [...measurements]
    .sort((a, b) => new Date(a.date || a.recorded_at).getTime() - new Date(b.date || b.recorded_at).getTime())
    .map((m) => ({
      date: new Date(m.date || m.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      weight_kg: m.weight_kg,
      body_fat_pct: m.body_fat_pct || estimateBodyFat(m, gender).bodyFatPct,
      shoulders_cm: m.shoulders_cm || 0,
      biceps_right_cm: m.biceps_right_cm || m.biceps_cm || 0,
      biceps_left_cm: m.biceps_left_cm || m.biceps_cm || 0,
      arm_right_cm: m.arm_right_cm || m.arms_cm || 0,
      arm_left_cm: m.arm_left_cm || m.arms_cm || 0,
      chest_cm: m.chest_cm || 0,
      waist_cm: m.waist_cm || 0,
      abdomen_cm: m.abdomen_cm || 0,
      glutes_cm: m.glutes_cm || 0,
      thigh_right_cm: m.thigh_right_cm || m.thighs_cm || 0,
      thigh_left_cm: m.thigh_left_cm || m.thighs_cm || 0,
      calf_right_cm: m.calf_right_cm || m.calves_cm || 0,
      calf_left_cm: m.calf_left_cm || m.calves_cm || 0,
    }));

  // Sessões e lista dinâmica de exercícios disponíveis
  const sessions = useMemo(() => FitnessStorageService.getSessions(), []);
  const allExercises = useMemo(() => FitnessStorageService.getAllExercises(), []);
  const exerciseMap = useMemo(() => new Map<string, Exercise>(allExercises.map((e) => [e.id, e])), [allExercises]);

  // Lista dinâmica de exercícios que o usuário já treinou
  const trainedExerciseIds = useMemo(() => {
    const ids = new Set<string>();
    sessions.forEach((s) => {
      Object.keys(s.exercises_logs || {}).forEach((id) => {
        if (s.exercises_logs[id]?.some((set) => set.completed && set.weight_kg > 0)) {
          ids.add(id);
        }
      });
    });
    return Array.from(ids);
  }, [sessions]);

  // Opções para o select: primeiro os já treinados, depois os mais populares
  const exerciseOptions = useMemo(() => {
    const list: Array<{ id: string; name: string; hasHistory: boolean }> = [];
    
    // Treinados primeiro
    trainedExerciseIds.forEach((id) => {
      const ex = exerciseMap.get(id);
      list.push({
        id,
        name: ex?.name || id,
        hasHistory: true,
      });
    });

    // Depois exercícios populares que ainda não foram treinados
    const defaultIds = [
      'ex-bench-press',
      'ex-deadlift-conventional',
      'ex-barbell-squat',
      'ex-barbell-row',
      'ex-overhead-press',
      'ex-biceps-curl',
    ];

    defaultIds.forEach((id) => {
      if (!trainedExerciseIds.includes(id)) {
        const ex = exerciseMap.get(id);
        list.push({
          id,
          name: ex?.name || id,
          hasHistory: false,
        });
      }
    });

    return list;
  }, [trainedExerciseIds, exerciseMap]);

  // Ajusta selectedExercise para o primeiro treinado se o default não tiver dados
  const activeExerciseId = useMemo(() => {
    if (selectedExercise && trainedExerciseIds.includes(selectedExercise)) {
      return selectedExercise;
    }
    return trainedExerciseIds[0] || selectedExercise || 'ex-bench-press';
  }, [selectedExercise, trainedExerciseIds]);

  // Histórico de Cargas do Exercício Selecionado
  const exerciseWeightsData = useMemo(() => {
    return sessions
      .filter((s) => s.exercises_logs[activeExerciseId]?.length)
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      .map((s) => {
        const logs = s.exercises_logs[activeExerciseId] || [];
        const completedSets = logs.filter((l) => l.completed && l.weight_kg > 0);
        const maxWeight = completedSets.length > 0 ? Math.max(...completedSets.map((l) => l.weight_kg || 0)) : 0;
        const totalReps = completedSets.reduce((acc, l) => acc + (l.reps_performed || 0), 0);
        return {
          date: new Date(s.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          fullDate: new Date(s.started_at).toLocaleDateString('pt-BR'),
          carga: maxWeight,
          reps: totalReps,
          setsCount: completedSets.length,
        };
      })
      .filter((item) => item.carga > 0);
  }, [sessions, activeExerciseId]);

  // Estatísticas de evolução de carga do exercício
  const exerciseStats = useMemo(() => {
    if (exerciseWeightsData.length === 0) return null;
    const weights = exerciseWeightsData.map((d) => d.carga);
    const pr = Math.max(...weights);
    const initialWeight = weights[0];
    const latestWeight = weights[weights.length - 1];
    const diffKg = latestWeight - initialWeight;
    const diffPct = initialWeight > 0 ? Math.round((diffKg / initialWeight) * 100) : 0;

    return {
      pr,
      latestWeight,
      initialWeight,
      diffKg,
      diffPct,
      sessionsCount: exerciseWeightsData.length,
    };
  }, [exerciseWeightsData]);

  // Análise de Desequilíbrio Muscular
  const muscleBalance = useMemo(() => analyzeMuscleBalance(), [sessions]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const recordedTimestamp = formData.date
      ? new Date(`${formData.date}T12:00:00`).toISOString()
      : new Date().toISOString();

    const measurementToSave: BodyMeasurement = {
      id: editingMeasurementId || `meas-${Date.now()}`,
      recorded_at: recordedTimestamp,
      date: formData.date || new Date().toISOString().split('T')[0],
      weight_kg: Number(formData.weight_kg),
      height_cm: Number(formData.height_cm) || 175,
      shoulders_cm: Number(formData.shoulders_cm),
      biceps_right_cm: Number(formData.biceps_right_cm),
      biceps_left_cm: Number(formData.biceps_left_cm),
      biceps_cm: Number(formData.biceps_right_cm),
      arm_right_cm: Number(formData.arm_right_cm),
      arm_left_cm: Number(formData.arm_left_cm),
      arms_cm: Number(formData.arm_right_cm),
      chest_cm: Number(formData.chest_cm),
      waist_cm: Number(formData.waist_cm),
      abdomen_cm: Number(formData.abdomen_cm),
      glutes_cm: Number(formData.glutes_cm),
      thigh_right_cm: Number(formData.thigh_right_cm),
      thigh_left_cm: Number(formData.thigh_left_cm),
      thighs_cm: Number(formData.thigh_right_cm),
      calf_right_cm: Number(formData.calf_right_cm),
      calf_left_cm: Number(formData.calf_left_cm),
      calves_cm: Number(formData.calf_right_cm),
      notes: editingMeasurementId ? 'Editado via app' : 'Registro via app',
    };

    // Estima e anexa o percentual de gordura calculado
    const fatCalc = estimateBodyFat(measurementToSave, gender);
    measurementToSave.body_fat_pct = fatCalc.bodyFatPct;

    onAddMeasurement(measurementToSave);
    setIsModalOpen(false);
    setEditingMeasurementId(null);
  };

  // Medição mais recente e cálculos analíticos
  const latestMeasurement = measurements[0] || null;

  // Estimativa de % de gordura corporal atual
  const currentBodyFatEstimate = useMemo(() => {
    return latestMeasurement ? estimateBodyFat(latestMeasurement, gender) : null;
  }, [latestMeasurement, gender]);

  // Diagnóstico de Evolução por Médias Móveis (Evoluindo / Regredindo / Estagnado)
  const evolutionDiagnosis = useMemo(() => {
    return calculateEvolutionAnalysis(measurements, sessions, gender);
  }, [measurements, sessions, gender]);

  const metricLabels: Record<string, string> = {
    weight_kg: 'Peso Corporal (kg)',
    body_fat_pct: '% Gordura Corporal (%BF)',
    shoulders_cm: 'Ombros (cm)',
    chest_cm: 'Peitoral (cm)',
    biceps_right_cm: 'Bíceps Direito (cm)',
    biceps_left_cm: 'Bíceps Esquerdo (cm)',
    arm_right_cm: 'Braço Direito (cm)',
    arm_left_cm: 'Braço Esquerdo (cm)',
    waist_cm: 'Cintura (cm)',
    abdomen_cm: 'Abdômen (cm)',
    glutes_cm: 'Glúteos (cm)',
    thigh_right_cm: 'Coxa Direita (cm)',
    thigh_left_cm: 'Coxa Esquerda (cm)',
    calf_right_cm: 'Panturrilha Direita (cm)',
    calf_left_cm: 'Panturrilha Esquerda (cm)',
  };

  return (
    <div className="flex flex-col gap-6 pb-28 text-white">
      {/* Título da Tela */}
      <div className="pt-2">
        <h1 className="text-2xl font-black text-white tracking-tight">
          Minha Evolução
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Acompanhamento antropométrico, estimativa de gordura e cálculo de progresso
        </p>
      </div>

      {/* PAINEL DE DIAGNÓSTICO POR MÉDIA: EVOLUINDO / REGREDINDO / ESTAGNADO */}
      <div
        className={`rounded-3xl border p-5 sm:p-6 shadow-xl flex flex-col gap-4 transition-all ${
          evolutionDiagnosis.status === 'EVOLVING'
            ? 'bg-gradient-to-br from-[#0e1a14] via-[#101412] to-[#111114] border-emerald-500/40 shadow-emerald-950/20'
            : evolutionDiagnosis.status === 'REGRESSING'
            ? 'bg-gradient-to-br from-[#1a1012] via-[#141012] to-[#111114] border-red-500/40 shadow-red-950/20'
            : 'bg-gradient-to-br from-[#1a1710] via-[#141310] to-[#111114] border-amber-500/40 shadow-amber-950/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
              style={{
                backgroundColor: `${evolutionDiagnosis.statusColor}25`,
                border: `1px solid ${evolutionDiagnosis.statusColor}50`,
              }}
            >
              {evolutionDiagnosis.status === 'EVOLVING' ? (
                <TrendingUp className="w-6 h-6 text-emerald-400 stroke-[2.5]" />
              ) : evolutionDiagnosis.status === 'REGRESSING' ? (
                <AlertTriangle className="w-6 h-6 text-red-400 stroke-[2.5]" />
              ) : (
                <Minus className="w-6 h-6 text-amber-400 stroke-[3]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wider"
                  style={{
                    backgroundColor: `${evolutionDiagnosis.statusColor}20`,
                    color: evolutionDiagnosis.statusColor,
                    borderColor: `${evolutionDiagnosis.statusColor}40`,
                  }}
                >
                  {evolutionDiagnosis.statusLabel}
                </span>
                <span className="text-xs text-zinc-400 font-semibold">
                  Score: <strong className="text-white">{evolutionDiagnosis.score}%</strong>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                {evolutionDiagnosis.title}
              </h2>
            </div>
          </div>

          {/* Seletor de Sexo para Calibração Biomecânica */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gender === 'male'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Homem
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gender === 'female'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Mulher
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed bg-black/25 p-3.5 rounded-2xl border border-white/5">
          {evolutionDiagnosis.summary}
        </p>

        {/* COMPARATIVO DE MÉDIAS MÓVEIS (Atual vs Anterior) */}
        {evolutionDiagnosis.status !== 'INSUFFICIENT_DATA' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
            {/* Peso */}
            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-white/5">
              <span className="text-[10px] font-medium text-zinc-400 block">Média de Peso</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-black text-white">
                  {evolutionDiagnosis.details.currentAvgWeight} kg
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    evolutionDiagnosis.details.weightDiff > 0 ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  {evolutionDiagnosis.details.weightDiff > 0 ? `+${evolutionDiagnosis.details.weightDiff}` : evolutionDiagnosis.details.weightDiff}
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">
                Ant: {evolutionDiagnosis.details.previousAvgWeight} kg
              </span>
            </div>

            {/* % Gordura */}
            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-white/5">
              <span className="text-[10px] font-medium text-zinc-400 block">% Gordura Médio</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-black text-white">
                  {evolutionDiagnosis.details.currentAvgBodyFat}%
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    evolutionDiagnosis.details.bodyFatDiff <= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {evolutionDiagnosis.details.bodyFatDiff > 0 ? `+${evolutionDiagnosis.details.bodyFatDiff}%` : `${evolutionDiagnosis.details.bodyFatDiff}%`}
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">
                Ant: {evolutionDiagnosis.details.previousAvgBodyFat}%
              </span>
            </div>

            {/* Massa Magra */}
            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-white/5">
              <span className="text-[10px] font-medium text-zinc-400 block">Massa Magra Média</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-black text-white">
                  {evolutionDiagnosis.details.currentAvgLeanMass} kg
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    evolutionDiagnosis.details.leanMassDiff >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {evolutionDiagnosis.details.leanMassDiff > 0 ? `+${evolutionDiagnosis.details.leanMassDiff}` : evolutionDiagnosis.details.leanMassDiff}
                </span>
              </div>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">
                Ant: {evolutionDiagnosis.details.previousAvgLeanMass} kg
              </span>
            </div>

            {/* Força e Cargas */}
            <div className="p-3 rounded-2xl bg-zinc-900/70 border border-white/5">
              <span className="text-[10px] font-medium text-zinc-400 block">Sobrecarga Treinos</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base font-black text-white">
                  {evolutionDiagnosis.details.strengthProgressionPct >= 0
                    ? `+${evolutionDiagnosis.details.strengthProgressionPct}%`
                    : `${evolutionDiagnosis.details.strengthProgressionPct}%`}
                </span>
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <span className="text-[9px] text-zinc-500 mt-0.5 block">
                Volume nas séries
              </span>
            </div>
          </div>
        )}

        {/* Recomendações Práticas */}
        {evolutionDiagnosis.recommendations.length > 0 && (
          <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Direcionamento Estratégico:
            </span>
            <ul className="flex flex-col gap-1 text-[11px] text-zinc-300">
              {evolutionDiagnosis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#ff3322] font-black">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* GRID RESPONSIVO: 1 coluna no Mobile, 2 colunas no Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* COLUNA ESQUERDA: Medidas Corporais, Gordura & Histórico */}
        <div className="flex flex-col gap-5">
          {/* ESTIMATIVA DE % DE GORDURA CORPORAL ATUAL & COMPOSIÇÃO */}
          {currentBodyFatEstimate && latestMeasurement && (
            <div className="rounded-3xl bg-[#111114] border border-white/5 p-5 flex flex-col gap-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Percent className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">
                      Estimativa de Gordura
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Método Antropométrico Clínico (RFM / Navy)
                    </p>
                  </div>
                </div>

                <span
                  className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${currentBodyFatEstimate.categoryColor}20`,
                    color: currentBodyFatEstimate.categoryColor,
                    borderColor: `${currentBodyFatEstimate.categoryColor}40`,
                  }}
                >
                  {currentBodyFatEstimate.categoryLabel}
                </span>
              </div>

              {/* Display do Percentual e Massa */}
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-3xl font-black text-white tracking-tight">
                    {currentBodyFatEstimate.bodyFatPct}%
                  </span>
                  <span className="text-xs text-zinc-400 ml-1.5 font-medium">Gordura Corporal</span>
                </div>

                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-200">
                    Massa Magra: <strong className="text-emerald-400">{currentBodyFatEstimate.leanMassKg} kg</strong>
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Massa Gorda: {currentBodyFatEstimate.fatMassKg} kg
                  </p>
                </div>
              </div>

              {/* Barra de escala visual com gradiente */}
              <div className="flex flex-col gap-1 pt-1">
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(10, (currentBodyFatEstimate.bodyFatPct / 35) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-zinc-500 font-semibold px-0.5">
                  <span>Atleta &lt;12%</span>
                  <span>Fitness 13-17%</span>
                  <span>Médio 18-24%</span>
                  <span>Acima &gt;25%</span>
                </div>
              </div>
            </div>
          )}

          {/* 1. BOTÃO PARA REGISTRAR MEDIDAS */}
      <button
        onClick={handleOpenNew}
        className="w-full text-left rounded-3xl bg-gradient-to-r from-[#181510] to-[#121215] border border-amber-500/30 p-5 shadow-lg hover:border-amber-500/50 transition-all flex items-center justify-between group active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Ruler className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block">
              Registrar Novas Medidas
            </span>
            <span className="text-xs text-zinc-400 mt-0.5 block">
              Peso, ombros, peitoral, braços, cintura, coxas e panturrilhas
            </span>
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black group-hover:scale-105 transition-transform flex-shrink-0">
          <Plus className="w-5 h-5 stroke-[3]" />
        </div>
      </button>

      {/* 2. GRÁFICO COM EVOLUÇÃO DAS MEDIDAS */}
      <div className="rounded-3xl bg-[#111114] border border-white/5 p-5 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Gráfico de medidas
            </h3>
            <p className="text-[11px] text-zinc-400">
              {metricLabels[selectedMetric]}
            </p>
          </div>

          {/* Seletor rápido de métrica */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="bg-zinc-800 text-xs font-semibold text-white px-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none max-w-[150px] truncate"
          >
            <option value="weight_kg">Peso (kg)</option>
            <option value="shoulders_cm">Ombros (cm)</option>
            <option value="chest_cm">Peitoral (cm)</option>
            <option value="biceps_right_cm">Bíceps D (cm)</option>
            <option value="biceps_left_cm">Bíceps E (cm)</option>
            <option value="arm_right_cm">Braço D (cm)</option>
            <option value="arm_left_cm">Braço E (cm)</option>
            <option value="waist_cm">Cintura (cm)</option>
            <option value="abdomen_cm">Abdômen (cm)</option>
            <option value="glutes_cm">Glúteos (cm)</option>
            <option value="thigh_right_cm">Coxa D (cm)</option>
            <option value="thigh_left_cm">Coxa E (cm)</option>
            <option value="calf_right_cm">Panturrilha D (cm)</option>
            <option value="calf_left_cm">Panturrilha E (cm)</option>
          </select>
        </div>

        {/* Gráfico Recharts */}
        <div className="h-52 w-full pt-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke="#eab308"
                  strokeWidth={3}
                  dot={{ fill: '#eab308', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              Nenhuma medida registrada ainda.
            </div>
          )}
        </div>
      </div>

      {/* 3. HISTÓRICO E EDIÇÃO DE MEDIDAS ANTIGAS */}
      <div className="rounded-3xl bg-[#111114] border border-white/5 p-5 flex flex-col gap-3 shadow-lg">
        <div
          onClick={() => setShowHistoryList(!showHistoryList)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <span>Histórico de Medições</span>
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
                {measurements.length}
              </span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Clique em qualquer medição antiga para editar valores ou datas
            </p>
          </div>
          <button className="p-1 rounded-xl bg-zinc-800 text-zinc-400">
            {showHistoryList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showHistoryList && (
          <div className="flex flex-col gap-2.5 pt-2">
            {measurements.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Nenhum registro anterior.</p>
            ) : (
              measurements.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between hover:border-amber-500/30 transition-all"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {new Date(m.date || m.recorded_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[11px] font-black text-amber-400">
                        {m.weight_kg} kg
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-zinc-400">
                      {m.shoulders_cm ? <span>Ombros: <strong className="text-zinc-200">{m.shoulders_cm}cm</strong></span> : null}
                      {m.chest_cm ? <span>Peito: <strong className="text-zinc-200">{m.chest_cm}cm</strong></span> : null}
                      {m.arm_right_cm || m.arms_cm ? (
                        <span>Braço D: <strong className="text-zinc-200">{m.arm_right_cm || m.arms_cm}cm</strong></span>
                      ) : null}
                      {m.waist_cm ? <span>Cintura: <strong className="text-zinc-200">{m.waist_cm}cm</strong></span> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEditMeasurement(m)}
                      title="Editar esta medição"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-300 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      title="Excluir medição"
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

        </div>

        {/* COLUNA DIREITA: Cargas e Equilíbrio Muscular */}
        <div className="flex flex-col gap-5">
          {/* 4. GRÁFICO COM EVOLUÇÃO DOS PESOS UTILIZADOS (DINÂMICO E COMPLETO) */}
      <div className="rounded-3xl bg-[#111114] border border-white/5 p-5 flex flex-col gap-3.5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight">
                Evolução de Cargas
              </h3>
              {exerciseStats && (
                <span className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Award className="w-3 h-3" />
                  <span>PR: {exerciseStats.pr} kg</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              Histórico de progressão contínua por exercício
            </p>
          </div>

          {/* Seletor dinâmico de exercício */}
          <select
            value={activeExerciseId}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-zinc-800 text-xs font-semibold text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-red-500 max-w-full sm:max-w-[200px] truncate"
          >
            {exerciseOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.hasHistory ? '★ ' : ''}{opt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Resumo Rápido de Métricas do Exercício */}
        {exerciseStats && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-white/5">
              <span className="text-[10px] text-zinc-400 font-medium block">Carga Inicial</span>
              <span className="text-sm font-black text-zinc-300">
                {exerciseStats.initialWeight} kg
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-white/5">
              <span className="text-[10px] text-zinc-400 font-medium block">Carga Atual</span>
              <span className="text-sm font-black text-white">
                {exerciseStats.latestWeight} kg
              </span>
            </div>
            <div className="p-2.5 rounded-2xl bg-zinc-900/80 border border-white/5">
              <span className="text-[10px] text-zinc-400 font-medium block">Progressão</span>
              <span
                className={`text-sm font-black ${
                  exerciseStats.diffKg >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {exerciseStats.diffKg > 0 ? `+${exerciseStats.diffKg}` : exerciseStats.diffKg} kg{' '}
                <span className="text-[10px] font-bold">
                  ({exerciseStats.diffPct > 0 ? `+${exerciseStats.diffPct}%` : `${exerciseStats.diffPct}%`})
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Gráfico Recharts de Carga */}
        <div className="h-56 w-full pt-1">
          {exerciseWeightsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={exerciseWeightsData}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} unit="kg" tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#18181b] border border-white/10 rounded-2xl p-3 shadow-xl text-xs">
                          <p className="font-bold text-zinc-300">{data.fullDate}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-[#ff3322]" />
                            <span className="text-white font-extrabold text-sm">
                              {data.carga} kg
                            </span>
                            <span className="text-zinc-400 text-[11px]">
                              ({data.setsCount} {data.setsCount === 1 ? 'série' : 'séries'})
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="carga"
                  stroke="#ff3322"
                  strokeWidth={3}
                  dot={{ fill: '#ff3322', r: 4, strokeWidth: 2, stroke: '#0d0d0d' }}
                  activeDot={{ r: 6, fill: '#ff6655' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-zinc-900/30 border border-dashed border-white/5 gap-1.5">
              <Dumbbell className="w-6 h-6 text-zinc-600" />
              <p className="text-xs font-semibold text-zinc-400">
                Nenhum treino com carga registrado para este exercício.
              </p>
              <p className="text-[10px] text-zinc-500 max-w-xs">
                Realize um treino com este exercício para visualizar a curva de progressão dupla.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. EQUILÍBRIO MUSCULAR & SAÚDE POSTURAL (PREVENÇÃO DE LESÕES) */}
      <div className="rounded-3xl bg-[#111114] border border-white/5 p-5 flex flex-col gap-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">
                Equilíbrio & Prevenção
              </h3>
              <p className="text-[11px] text-zinc-400">
                Simetria biomecânica e saúde articular
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-white/5">
            <span className="text-[10px] text-zinc-400 font-semibold">Harmonia:</span>
            <span
              className={`text-xs font-black ${
                muscleBalance.overallScore >= 80
                  ? 'text-emerald-400'
                  : muscleBalance.overallScore >= 55
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {muscleBalance.overallScore}%
            </span>
          </div>
        </div>

        {/* Lista de Alertas e Sugestões Biomecânicas */}
        <div className="flex flex-col gap-2.5 pt-1">
          {muscleBalance.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 transition-all ${
                alert.type === 'danger'
                  ? 'bg-red-950/20 border-red-500/30'
                  : alert.type === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-emerald-950/20 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {alert.type === 'danger' ? (
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  )}
                  <span className="text-xs font-black text-white">{alert.title}</span>
                </div>
                <span
                  className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    alert.type === 'danger'
                      ? 'bg-red-500/20 text-red-400'
                      : alert.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {alert.type === 'danger' ? 'Alerta Crítico' : alert.type === 'warning' ? 'Atenção' : 'Equilibrado'}
                </span>
              </div>

              <p className="text-[11px] font-semibold text-zinc-300">
                {alert.ratioDescription}
              </p>

              <p className="text-[10px] text-zinc-400 leading-relaxed bg-black/30 p-2 rounded-xl border border-white/5">
                💡 <strong className="text-zinc-200">Recomendação:</strong> {alert.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

        </div>
      </div>

      {/* MODAL / DRAWER: REGISTRAR OU EDITAR MEDIDAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingMeasurementId ? 'Editar Medidas Corporais' : 'Registrar Medidas Corporais'}
                </h3>
                <p className="text-[11px] text-zinc-400">
                  {editingMeasurementId
                    ? 'Altere os valores ou a data e clique em salvar'
                    : 'Medição completa com ombros, tronco e membros bilaterais'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingMeasurementId(null);
                }}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Data da Medição, Peso Corporal & Altura */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <label className="text-[11px] font-bold">Data</label>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1 block">
                    Data do registro
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Scale className="w-3.5 h-3.5 text-red-500" />
                    <label className="text-[11px] font-bold">Peso (kg)</label>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight_kg}
                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-black text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Ruler className="w-3.5 h-3.5 text-blue-400" />
                    <label className="text-[11px] font-bold">Altura (cm)</label>
                  </div>
                  <input
                    type="number"
                    step="1"
                    placeholder="Ex: 175"
                    value={formData.height_cm}
                    onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 175 })}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-black text-sm focus:outline-none focus:border-blue-400"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1 block">
                    Para % de gordura
                  </span>
                </div>
              </div>

              {/* Seção Tronco & Cintura Escapular (com Ombros) */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Tronco & Ombros
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 flex items-center justify-between">
                      <span>Ombros (cm)</span>
                      <span className="text-[9px] text-amber-400 font-bold uppercase">Novo</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 115"
                      value={formData.shoulders_cm}
                      onChange={(e) => setFormData({ ...formData, shoulders_cm: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-amber-500/30 text-white font-bold text-sm focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400">Peitoral (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.chest_cm}
                      onChange={(e) => setFormData({ ...formData, chest_cm: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400">Cintura (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.waist_cm}
                      onChange={(e) => setFormData({ ...formData, waist_cm: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-400">Abdômen (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.abdomen_cm}
                      onChange={(e) => setFormData({ ...formData, abdomen_cm: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] font-semibold text-zinc-400">Glúteos (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.glutes_cm}
                      onChange={(e) => setFormData({ ...formData, glutes_cm: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Seção Bilateral: Membros Superiores */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                  Membros Superiores (Bilateral)
                </span>
                
                {/* Bíceps D e E */}
                <div>
                  <span className="text-[11px] font-semibold text-zinc-300 block mb-1">Bíceps (cm)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Direito (D)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.biceps_right_cm}
                        onChange={(e) => setFormData({ ...formData, biceps_right_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Esquerdo (E)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.biceps_left_cm}
                        onChange={(e) => setFormData({ ...formData, biceps_left_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Braço D e E */}
                <div>
                  <span className="text-[11px] font-semibold text-zinc-300 block mb-1">Braço Completo (cm)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Direito (D)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.arm_right_cm}
                        onChange={(e) => setFormData({ ...formData, arm_right_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Esquerdo (E)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.arm_left_cm}
                        onChange={(e) => setFormData({ ...formData, arm_left_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Bilateral: Membros Inferiores */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                  Membros Inferiores (Bilateral)
                </span>

                {/* Coxa D e E */}
                <div>
                  <span className="text-[11px] font-semibold text-zinc-300 block mb-1">Coxa (cm)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Direita (D)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.thigh_right_cm}
                        onChange={(e) => setFormData({ ...formData, thigh_right_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Esquerda (E)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.thigh_left_cm}
                        onChange={(e) => setFormData({ ...formData, thigh_left_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Panturrilha D e E */}
                <div>
                  <span className="text-[11px] font-semibold text-zinc-300 block mb-1">Panturrilha (cm)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Direita (D)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.calf_right_cm}
                        onChange={(e) => setFormData({ ...formData, calf_right_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Esquerda (E)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={formData.calf_left_cm}
                        onChange={(e) => setFormData({ ...formData, calf_left_cm: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-2xl bg-[#ff1a00] text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-950/40"
              >
                {editingMeasurementId ? 'Atualizar Medidas' : 'Salvar Medidas'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
