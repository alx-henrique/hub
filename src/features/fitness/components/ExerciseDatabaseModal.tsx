import React, { useState, useMemo } from 'react';
import { Exercise, MuscleGroup, MUSCLE_LABELS } from '../types';
import { FitnessStorageService } from '../services/storageService';
import {
  Search,
  Plus,
  Dumbbell,
  Filter,
  X,
  Check,
  ChevronRight,
  Info,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ExerciseDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise?: (exercise: Exercise) => void;
}

export const ExerciseDatabaseModal: React.FC<ExerciseDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>(() =>
    FitnessStorageService.getAllExercises()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'
  >('all');
  const [activeExerciseDetail, setActiveExerciseDetail] = useState<Exercise | null>(null);

  // Modal para Criar Novo Exercício Personalizado
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customCategory, setCustomCategory] = useState<
    'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'
  >('barbell');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customThumbnail, setCustomThumbnail] = useState('');

  // Atualiza lista se criar novo
  const reloadExercises = () => {
    setExercises(FitnessStorageService.getAllExercises());
  };

  // Filtragem Otimizada com suporte a Português e Inglês
  const filteredExercises = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term && selectedMuscle === 'all' && selectedCategory === 'all') {
      return exercises;
    }

    return exercises.filter((ex) => {
      const matchSearch = !term ||
        ex.name.toLowerCase().includes(term) ||
        (ex.english_name && ex.english_name.toLowerCase().includes(term)) ||
        ex.id.toLowerCase().includes(term) ||
        (ex.instructions &&
          ex.instructions.some((inst) =>
            inst.toLowerCase().includes(term)
          ));

      const matchMuscle =
        selectedMuscle === 'all'
          ? true
          : ex.target_muscle === selectedMuscle ||
            (ex.secondary_muscles && ex.secondary_muscles.includes(selectedMuscle));

      const matchCategory =
        selectedCategory === 'all' ? true : ex.category === selectedCategory;

      return matchSearch && matchMuscle && matchCategory;
    });
  }, [exercises, searchTerm, selectedMuscle, selectedCategory]);

  const handleSaveCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEx: Exercise = {
      id: `custom-ex-${Date.now()}`,
      name: customName.trim(),
      target_muscle: customMuscle,
      secondary_muscles: [],
      category: customCategory,
      thumbnail_url:
        customThumbnail.trim() ||
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80',
      instructions: customInstructions.trim()
        ? customInstructions.split('\n').filter((l) => l.trim().length > 0)
        : ['Execução controlada mantendo postura e respiração adequadas.'],
      is_custom: true,
    };

    FitnessStorageService.addCustomExercise(newEx);
    reloadExercises();
    setIsCreatingCustom(false);
    setCustomName('');
    setCustomInstructions('');
    setCustomThumbnail('');
  };

  const categoryLabels = {
    barbell: 'Barra',
    dumbbell: 'Halter',
    machine: 'Máquina',
    cable: 'Polia / Cabo',
    bodyweight: 'Peso Corporal',
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md h-[92vh] sm:h-[85vh] bg-[#141416] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#18181b]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 text-[#ff1a00] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Banco de Exercícios</h2>
              <p className="text-[10px] text-zinc-400 font-medium">
                {exercises.length} movimentos catalogados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingCustom(true)}
              className="px-3 py-1.5 rounded-xl bg-[#ff1a00] text-white font-extrabold text-xs flex items-center gap-1 shadow-md hover:bg-red-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Novo</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="p-3 border-b border-white/5 bg-[#17171a] flex flex-col gap-2.5 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar exercício (ex: supino, rdl, elevação)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-semibold text-xs focus:outline-none focus:border-red-500 placeholder:text-zinc-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* FILTRO: Músculo Alvo */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedMuscle('all')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${
                selectedMuscle === 'all'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-950/40'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
              }`}
            >
              Todos os Músculos
            </button>
            {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((group) => (
              <button
                key={group}
                onClick={() => setSelectedMuscle(group)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${
                  selectedMuscle === group
                    ? 'bg-red-600 text-white shadow-sm shadow-red-950/40'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
              >
                {MUSCLE_LABELS[group]}
              </button>
            ))}
          </div>

          {/* FILTRO: Tipo de Equipamento */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {(
              [
                { id: 'all', label: 'Todos Equip.' },
                { id: 'barbell', label: 'Barra' },
                { id: 'dumbbell', label: 'Halteres' },
                { id: 'machine', label: 'Máquinas' },
                { id: 'cable', label: 'Cabos' },
                { id: 'bodyweight', label: 'Corporal' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#eab308] text-black font-extrabold'
                    : 'bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTA DE EXERCÍCIOS */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {filteredExercises.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4">
              <Dumbbell className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-xs font-bold text-zinc-400">Nenhum exercício encontrado</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Tente buscar com outro termo ou crie um exercício personalizado.
              </p>
              <button
                onClick={() => setIsCreatingCustom(true)}
                className="mt-3 px-3 py-1.5 rounded-xl bg-zinc-800 text-red-400 font-bold text-xs hover:bg-zinc-700"
              >
                + Criar este Exercício
              </button>
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <div
                key={ex.id}
                onClick={() => {
                  if (onSelectExercise) {
                    onSelectExercise(ex);
                  } else {
                    setActiveExerciseDetail(ex);
                  }
                }}
                className="p-2.5 rounded-2xl bg-zinc-900/70 border border-white/5 hover:border-red-500/40 flex items-center justify-between gap-3 cursor-pointer group transition-all"
              >
                {/* Thumbnail ou Ícone */}
                <div className="w-12 h-12 rounded-xl bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-white/5 relative">
                  {ex.thumbnail_url ? (
                    <img
                      src={ex.thumbnail_url}
                      alt={ex.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  ) : (
                    <Dumbbell className="w-5 h-5 text-zinc-500" />
                  )}
                  {ex.is_custom && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition-colors truncate">
                      {ex.name}
                    </h4>
                  </div>
                  {ex.english_name && (
                    <p className="text-[10px] text-zinc-400 italic truncate mt-0.5">
                      {ex.english_name}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold text-red-500 capitalize">
                      {MUSCLE_LABELS[ex.target_muscle] || ex.target_muscle}
                    </span>
                    <span className="text-[9px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {categoryLabels[ex.category] || ex.category}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveExerciseDetail(ex);
                    }}
                    className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
                    title="Ver instruções detalhadas"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  {onSelectExercise ? (
                    <span className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-md">
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL / BOTTOM DRAWER: DETALHES DO EXERCÍCIO */}
        {activeExerciseDetail && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <div className="pr-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
                    {MUSCLE_LABELS[activeExerciseDetail.target_muscle] || activeExerciseDetail.target_muscle}
                  </span>
                  <h3 className="text-base font-black text-white mt-0.5">
                    {activeExerciseDetail.name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveExerciseDetail(null)}
                  className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {activeExerciseDetail.thumbnail_url && (
                <div className="w-full h-44 rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                  <img
                    src={activeExerciseDetail.thumbnail_url}
                    alt={activeExerciseDetail.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Tag Secundários */}
              {activeExerciseDetail.secondary_muscles.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 block mb-1">
                    Músculos Secundários:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeExerciseDetail.secondary_muscles.map((sec) => (
                      <span
                        key={sec}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/5"
                      >
                        {MUSCLE_LABELS[sec] || sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instruções passo a passo */}
              <div>
                <span className="text-[10px] font-bold text-zinc-400 block mb-1.5">
                  Execução e Postura:
                </span>
                <ul className="flex flex-col gap-2">
                  {activeExerciseDetail.instructions.map((step, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-zinc-300 flex items-start gap-2 bg-zinc-900/60 p-2 rounded-xl border border-white/5"
                    >
                      <span className="w-4 h-4 rounded-full bg-red-600/20 text-red-500 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {onSelectExercise && (
                <button
                  onClick={() => {
                    onSelectExercise(activeExerciseDetail);
                    setActiveExerciseDetail(null);
                  }}
                  className="w-full py-3 rounded-xl bg-[#ff1a00] text-white font-black text-xs hover:bg-red-600 transition-colors shadow-lg"
                >
                  Adicionar ao Treino
                </button>
              )}
            </div>
          </div>
        )}

        {/* MODAL: CRIAR NOVO EXERCÍCIO */}
        {isCreatingCustom && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white">Criar Exercício</h3>
                  <p className="text-[10px] text-zinc-400">Adicione ao seu banco pessoal</p>
                </div>
                <button
                  onClick={() => setIsCreatingCustom(false)}
                  className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomExercise} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Nome do Exercício *
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Ex: Tríceps Testa no Banco Declinado"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      Músculo Alvo
                    </label>
                    <select
                      value={customMuscle}
                      onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-semibold text-xs focus:outline-none"
                    >
                      {(Object.keys(MUSCLE_LABELS) as MuscleGroup[]).map((m) => (
                        <option key={m} value={m}>
                          {MUSCLE_LABELS[m]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                      Equipamento
                    </label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as any)}
                      className="w-full px-2 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-semibold text-xs focus:outline-none"
                    >
                      <option value="barbell">Barra</option>
                      <option value="dumbbell">Halter</option>
                      <option value="machine">Máquina</option>
                      <option value="cable">Polia / Cabo</option>
                      <option value="bodyweight">Peso Corporal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    URL da Imagem / GIF (Opcional)
                  </label>
                  <input
                    type="url"
                    value={customThumbnail}
                    onChange={(e) => setCustomThumbnail(e.target.value)}
                    placeholder="https://exemplo.com/exercicio.gif"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                    Instruções de Execução (1 por linha)
                  </label>
                  <textarea
                    rows={3}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Mantenha os cotovelos alinhados...&#10;Controle a descida até 90 graus..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-medium text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#ff1a00] text-white font-black text-xs hover:bg-red-600 transition-colors shadow-lg"
                >
                  Salvar Exercício
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
