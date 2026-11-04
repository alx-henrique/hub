import React, { useState } from 'react';
import { BodyMeasurement } from '../types';
import { FitnessStorageService } from '../services/storageService';
import {
  Ruler,
  TrendingUp,
  Plus,
  Scale,
  Calendar,
  CheckCircle2,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface FigmaEvolutionScreenProps {
  measurements: BodyMeasurement[];
  onAddMeasurement: (m: BodyMeasurement) => void;
}

export const FigmaEvolutionScreen: React.FC<FigmaEvolutionScreenProps> = ({
  measurements,
  onAddMeasurement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<
    | 'weight_kg'
    | 'biceps_right_cm'
    | 'biceps_left_cm'
    | 'arm_right_cm'
    | 'arm_left_cm'
    | 'chest_cm'
    | 'waist_cm'
    | 'abdomen_cm'
    | 'glutes_cm'
    | 'thigh_right_cm'
    | 'thigh_left_cm'
    | 'calf_right_cm'
    | 'calf_left_cm'
  >('weight_kg');

  const [selectedExercise, setSelectedExercise] = useState<string>('ex-bench-press');

  // Form de inclusão de medidas com bilaterais separados (D / E) e Data da medição
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    weight_kg: 80,
    // Bíceps separado de Braço
    biceps_right_cm: 37,
    biceps_left_cm: 36.5,
    // Braço (circunferência total do braço)
    arm_right_cm: 38,
    arm_left_cm: 37.5,
    // Tronco e Quadril
    chest_cm: 102,
    waist_cm: 82,
    abdomen_cm: 84,
    glutes_cm: 100,
    // Membros Inferiores
    thigh_right_cm: 58,
    thigh_left_cm: 58,
    calf_right_cm: 38,
    calf_left_cm: 37.5,
  });

  // Dados para o Gráfico de Medidas
  const chartData = [...measurements]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((m) => ({
      date: new Date(m.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      weight_kg: m.weight_kg,
      biceps_right_cm: m.biceps_right_cm || m.biceps_cm || 37,
      biceps_left_cm: m.biceps_left_cm || m.biceps_cm || 36.5,
      arm_right_cm: m.arm_right_cm || m.arms_cm || 38,
      arm_left_cm: m.arm_left_cm || m.arms_cm || 37.5,
      chest_cm: m.chest_cm || 100,
      waist_cm: m.waist_cm || 82,
      abdomen_cm: m.abdomen_cm || 84,
      glutes_cm: m.glutes_cm || 100,
      thigh_right_cm: m.thigh_right_cm || m.thighs_cm || 58,
      thigh_left_cm: m.thigh_left_cm || m.thighs_cm || 58,
      calf_right_cm: m.calf_right_cm || m.calves_cm || 38,
      calf_left_cm: m.calf_left_cm || m.calves_cm || 37.5,
    }));

  // Histórico de Cargas do Exercício Selecionado
  const sessions = FitnessStorageService.getSessions();
  const exerciseWeightsData = sessions
    .filter((s) => s.exercises_logs[selectedExercise]?.length)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
    .map((s) => {
      const logs = s.exercises_logs[selectedExercise];
      const maxWeight = Math.max(...logs.map((l) => l.weight_kg || 0));
      return {
        date: new Date(s.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        carga: maxWeight,
      };
    });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const recordedTimestamp = formData.date
      ? new Date(`${formData.date}T12:00:00`).toISOString()
      : new Date().toISOString();

    const newMeasurement: BodyMeasurement = {
      id: `meas-${Date.now()}`,
      recorded_at: recordedTimestamp,
      date: formData.date || new Date().toISOString().split('T')[0],
      weight_kg: Number(formData.weight_kg),
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
      notes: 'Registro via app',
    };
    onAddMeasurement(newMeasurement);
    setIsModalOpen(false);
  };

  const metricLabels: Record<string, string> = {
    weight_kg: 'Peso Corporal (kg)',
    biceps_right_cm: 'Bíceps Direito (cm)',
    biceps_left_cm: 'Bíceps Esquerdo (cm)',
    arm_right_cm: 'Braço Direito (cm)',
    arm_left_cm: 'Braço Esquerdo (cm)',
    chest_cm: 'Peitoral (cm)',
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
          Acompanhamento antropométrico e progressão contínua de cargas
        </p>
      </div>

      {/* 1. BOTÃO PARA REGISTRAR MEDIDAS (Design Premium Dark) */}
      <button
        onClick={() => setIsModalOpen(true)}
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
              Peso, bíceps, braço, tórax, cintura, coxas e panturrilhas
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
            <option value="biceps_right_cm">Bíceps D (cm)</option>
            <option value="biceps_left_cm">Bíceps E (cm)</option>
            <option value="arm_right_cm">Braço D (cm)</option>
            <option value="arm_left_cm">Braço E (cm)</option>
            <option value="chest_cm">Peito (cm)</option>
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

      {/* 3. GRÁFICO COM EVOLUÇÃO DOS PESOS UTILIZADOS */}
      <div className="rounded-3xl bg-[#111114] border border-white/5 p-5 flex flex-col gap-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">
              Evolução dos pesos
            </h3>
            <p className="text-[11px] text-zinc-400">
              Carga máxima utilizada no exercício
            </p>
          </div>

          {/* Seletor de exercício */}
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-zinc-800 text-xs font-semibold text-white px-2.5 py-1.5 rounded-xl border border-white/10 focus:outline-none max-w-[140px] truncate"
          >
            <option value="ex-bench-press">Supino Reto</option>
            <option value="ex-deadlift-conventional">Lev. Terra</option>
            <option value="ex-barbell-squat">Agachamento</option>
            <option value="ex-barbell-row">Remada Curvada</option>
            <option value="ex-overhead-press">Desenvolvimento</option>
            <option value="ex-biceps-curl">Rosca Direta</option>
          </select>
        </div>

        {/* Gráfico Recharts de Carga */}
        <div className="h-52 w-full pt-2">
          {exerciseWeightsData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={exerciseWeightsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} unit="kg" />
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
                  dataKey="carga"
                  stroke="#ff1a00"
                  strokeWidth={3}
                  dot={{ fill: '#ff1a00', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              Nenhum treino com carga registrado para este exercício.
            </div>
          )}
        </div>
      </div>

      {/* MODAL / DRAWER: REGISTRAR NOVAS MEDIDAS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">
                  Registrar Medidas Corporais
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Medição bilateral completa (Direito / Esquerdo)
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Data da Medição & Peso Corporal */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <label className="text-[11px] font-bold">Data da Medição</label>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-bold text-xs focus:outline-none focus:border-red-500"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1 block">
                    Permite dados retroativos
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
                    className="w-full mt-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white font-black text-sm focus:outline-none focus:border-red-500"
                  />
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

              {/* Seção Tronco e Quadril */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                  Tronco & Quadril
                </span>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
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

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-2xl bg-[#ff1a00] text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-950/40"
              >
                Salvar Medidas
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
