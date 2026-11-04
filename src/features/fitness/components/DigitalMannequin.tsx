import React, { useState } from 'react';
import { MuscleGroup, MuscleVolumeScore, MUSCLE_LABELS } from '../types';
import { Check, Flame, Activity, Zap, Sparkles, ChevronRight, Layers } from 'lucide-react';

interface DigitalMannequinProps {
  muscleScores: Partial<Record<MuscleGroup, MuscleVolumeScore>>;
  selectedMuscle?: MuscleGroup | null;
  onSelectMuscle?: (muscle: MuscleGroup) => void;
  className?: string;
}

export const DigitalMannequin: React.FC<DigitalMannequinProps> = ({
  muscleScores,
  selectedMuscle,
  onSelectMuscle,
  className = '',
}) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  // Cores anatômicas minimalistas de alto contraste (sem brilhos neon cibernéticos)
  const getMuscleFill = (muscle: MuscleGroup): string => {
    const score = muscleScores[muscle]?.score || 0;
    if (score === 0) return '#27272a'; // zinc-800 neutro
    if (score < 30) return '#3f3f46'; // zinc-700
    if (score < 65) return '#52525b'; // zinc-600
    if (score < 85) return '#a1a1aa'; // zinc-400 ativo
    return '#f4f4f5'; // zinc-100 pico de estímulo
  };

  const getMuscleFilter = (_muscle: MuscleGroup): string => 'none';

  const isSelected = (m: MuscleGroup) => selectedMuscle === m;

  // Lista de músculos para os seletores
  const frontMuscles: MuscleGroup[] = [
    'chest',
    'shoulders',
    'biceps',
    'forearms',
    'core',
    'quadriceps',
    'calves',
  ];

  const backMuscles: MuscleGroup[] = [
    'back',
    'shoulders',
    'triceps',
    'glutes',
    'hamstrings',
    'calves',
  ];

  const currentMuscleList = view === 'front' ? frontMuscles : backMuscles;
  const activeInfo = selectedMuscle ? muscleScores[selectedMuscle] : null;

  return (
    <div
      className={`relative bg-[#111114] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm overflow-hidden ${className}`}
    >
      {/* HEADER: TÍTULO & TOGGLE FRONT/BACK */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider text-zinc-400 block">
            Bio-Feedback Muscular
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
            Mapeamento Anatômico
          </h3>
        </div>

        {/* Toggle Front / Back minimalista */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
          <button
            type="button"
            onClick={() => setView('front')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              view === 'front'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setView('back')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              view === 'back'
                ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Costas
          </button>
        </div>
      </div>

      {/* CORPO PRINCIPAL: LISTA DE MÚSCULOS À ESQUERDA + SILHUETA À DIREITA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Coluna 1: Lista Minimalista de Músculos */}
        <div className="md:col-span-5 flex flex-col gap-1.5">
          {currentMuscleList.map((m) => {
            const score = muscleScores[m]?.score || 0;
            const active = isSelected(m);
            const isTrained = score > 0;

            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMuscle?.(m)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl border transition-all text-left cursor-pointer ${
                  active
                    ? 'bg-zinc-800 border-zinc-500 text-white'
                    : isTrained
                    ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    : 'bg-zinc-900/30 border-transparent text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      isTrained
                        ? 'bg-white text-zinc-950 font-bold'
                        : 'border border-zinc-700 text-transparent'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span
                    className={`text-xs ${
                      active ? 'font-bold text-white' : isTrained ? 'font-medium text-zinc-200' : 'text-zinc-400'
                    }`}
                  >
                    {MUSCLE_LABELS[m]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                      score >= 70
                        ? 'bg-zinc-800 text-white font-bold'
                        : score > 0
                        ? 'bg-zinc-900 text-zinc-300'
                        : 'text-zinc-600'
                    }`}
                  >
                    {score}%
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 ${
                      active ? 'text-white' : 'text-zinc-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Coluna 2: Ilustração Anatômica Minimalista */}
        <div className="md:col-span-7 flex flex-col items-center justify-center relative py-2">
          <div className="relative w-full max-w-[240px] flex items-center justify-center">
            <svg
              viewBox="0 0 240 370"
              className="w-full h-auto select-none transition-all duration-300"
            >
              <defs>
                <radialGradient id="subtleAuraGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* SILHUETA BASE CHARCOAL */}
              <circle cx="120" cy="30" r="16" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
              <path d="M 112 47 L 128 47 L 126 58 L 114 58 Z" fill="#18181b" />

              {view === 'front' ? (
                /* =================== FRENTE (FRONT SIDE) =================== */
                <g id="front-anatomy">
                  {/* PESCOÇO / TRAPÉZIO SUPERIOR */}
                  <polygon
                    points="106,52 134,52 148,66 92,66"
                    fill="#222938"
                    stroke="#141720"
                    strokeWidth="1.5"
                  />

                  {/* OMBROS (DELTOIDES) */}
                  <path
                    d="M 88 66 C 74 70, 62 86, 66 106 C 75 100, 86 90, 92 72 Z"
                    fill={getMuscleFill('shoulders')}
                    stroke={isSelected('shoulders') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('shoulders') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('shoulders') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('shoulders')}
                  />
                  <path
                    d="M 152 66 C 166 70, 178 86, 174 106 C 165 100, 154 90, 148 72 Z"
                    fill={getMuscleFill('shoulders')}
                    stroke={isSelected('shoulders') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('shoulders') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('shoulders') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('shoulders')}
                  />

                  {/* PEITORAL (CHEST) */}
                  <path
                    d="M 94 70 L 118 72 L 118 105 C 102 105, 88 98, 85 84 Z"
                    fill={getMuscleFill('chest')}
                    stroke={isSelected('chest') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('chest') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('chest') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('chest')}
                  />
                  <path
                    d="M 146 70 L 122 72 L 122 105 C 138 105, 152 98, 155 84 Z"
                    fill={getMuscleFill('chest')}
                    stroke={isSelected('chest') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('chest') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('chest') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('chest')}
                  />

                  {/* BÍCEPS */}
                  <rect
                    x="56"
                    y="108"
                    width="17"
                    height="42"
                    rx="8"
                    fill={getMuscleFill('biceps')}
                    stroke={isSelected('biceps') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('biceps') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('biceps') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('biceps')}
                  />
                  <rect
                    x="167"
                    y="108"
                    width="17"
                    height="42"
                    rx="8"
                    fill={getMuscleFill('biceps')}
                    stroke={isSelected('biceps') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('biceps') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('biceps') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('biceps')}
                  />

                  {/* ANTEBRAÇOS */}
                  <polygon
                    points="55,154 72,154 67,198 50,198"
                    fill={getMuscleFill('forearms')}
                    stroke={isSelected('forearms') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('forearms') ? 2.5 : 1.5}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onSelectMuscle?.('forearms')}
                  />
                  <polygon
                    points="169,154 186,154 191,198 174,198"
                    fill={getMuscleFill('forearms')}
                    stroke={isSelected('forearms') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('forearms') ? 2.5 : 1.5}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onSelectMuscle?.('forearms')}
                  />

                  {/* ABDÔMEN & CORE */}
                  <path
                    d="M 97 109 L 143 109 L 137 170 L 103 170 Z"
                    fill={getMuscleFill('core')}
                    stroke={isSelected('core') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('core') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('core') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('core')}
                  />
                  <line x1="120" y1="110" x2="120" y2="168" stroke="#0C0E14" strokeWidth="2" />
                  <line x1="102" y1="128" x2="138" y2="128" stroke="#0C0E14" strokeWidth="2" />
                  <line x1="104" y1="148" x2="136" y2="148" stroke="#0C0E14" strokeWidth="2" />

                  {/* QUADRÍCEPS / PERNAS */}
                  <path
                    d="M 92 176 L 118 176 L 112 258 L 80 252 Z"
                    fill={getMuscleFill('quadriceps')}
                    stroke={isSelected('quadriceps') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('quadriceps') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('quadriceps') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('quadriceps')}
                  />
                  <path
                    d="M 148 176 L 122 176 L 128 258 L 160 252 Z"
                    fill={getMuscleFill('quadriceps')}
                    stroke={isSelected('quadriceps') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('quadriceps') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('quadriceps') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('quadriceps')}
                  />

                  {/* JOELHOS */}
                  <circle cx="96" cy="264" r="6" fill="#1C212D" stroke="#0C0E14" />
                  <circle cx="144" cy="264" r="6" fill="#1C212D" stroke="#0C0E14" />

                  {/* PANTURRILHAS */}
                  <rect
                    x="83"
                    y="274"
                    width="23"
                    height="64"
                    rx="9"
                    fill={getMuscleFill('calves')}
                    stroke={isSelected('calves') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('calves') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('calves') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('calves')}
                  />
                  <rect
                    x="134"
                    y="274"
                    width="23"
                    height="64"
                    rx="9"
                    fill={getMuscleFill('calves')}
                    stroke={isSelected('calves') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('calves') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('calves') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('calves')}
                  />
                </g>
              ) : (
                /* =================== COSTAS (BACK SIDE) =================== */
                <g id="back-anatomy">
                  {/* COSTAS / DORSAIS / TRAPÉZIO */}
                  <path
                    d="M 98 66 L 142 66 L 154 110 L 134 152 L 106 152 L 86 110 Z"
                    fill={getMuscleFill('back')}
                    stroke={isSelected('back') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('back') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('back') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('back')}
                  />
                  <line x1="120" y1="66" x2="120" y2="152" stroke="#0C0E14" strokeWidth="2" />

                  {/* OMBROS POSTERIORES */}
                  <path
                    d="M 88 66 C 74 70, 62 86, 66 106 C 75 100, 86 90, 92 72 Z"
                    fill={getMuscleFill('shoulders')}
                    stroke={isSelected('shoulders') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('shoulders') ? 2.5 : 1.5}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onSelectMuscle?.('shoulders')}
                  />
                  <path
                    d="M 152 66 C 166 70, 178 86, 174 106 C 165 100, 154 90, 148 72 Z"
                    fill={getMuscleFill('shoulders')}
                    stroke={isSelected('shoulders') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('shoulders') ? 2.5 : 1.5}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onSelectMuscle?.('shoulders')}
                  />

                  {/* TRÍCEPS */}
                  <rect
                    x="55"
                    y="108"
                    width="17"
                    height="44"
                    rx="8"
                    fill={getMuscleFill('triceps')}
                    stroke={isSelected('triceps') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('triceps') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('triceps') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('triceps')}
                  />
                  <rect
                    x="168"
                    y="108"
                    width="17"
                    height="44"
                    rx="8"
                    fill={getMuscleFill('triceps')}
                    stroke={isSelected('triceps') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('triceps') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('triceps') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('triceps')}
                  />

                  {/* GLÚTEOS */}
                  <path
                    d="M 91 156 L 120 158 L 118 196 C 103 198, 89 191, 86 174 Z"
                    fill={getMuscleFill('glutes')}
                    stroke={isSelected('glutes') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('glutes') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('glutes') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('glutes')}
                  />
                  <path
                    d="M 149 156 L 120 158 L 122 196 C 137 198, 151 191, 154 174 Z"
                    fill={getMuscleFill('glutes')}
                    stroke={isSelected('glutes') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('glutes') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('glutes') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('glutes')}
                  />

                  {/* POSTERIORES DE COXA */}
                  <path
                    d="M 89 200 L 116 200 L 111 258 L 82 252 Z"
                    fill={getMuscleFill('hamstrings')}
                    stroke={isSelected('hamstrings') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('hamstrings') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('hamstrings') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('hamstrings')}
                  />
                  <path
                    d="M 151 200 L 124 200 L 129 258 L 158 252 Z"
                    fill={getMuscleFill('hamstrings')}
                    stroke={isSelected('hamstrings') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('hamstrings') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('hamstrings') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('hamstrings')}
                  />

                  {/* PANTURRILHAS POSTERIORES */}
                  <rect
                    x="81"
                    y="272"
                    width="25"
                    height="64"
                    rx="9"
                    fill={getMuscleFill('calves')}
                    stroke={isSelected('calves') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('calves') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('calves') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('calves')}
                  />
                  <rect
                    x="134"
                    y="272"
                    width="25"
                    height="64"
                    rx="9"
                    fill={getMuscleFill('calves')}
                    stroke={isSelected('calves') ? '#FFFFFF' : '#0C0E14'}
                    strokeWidth={isSelected('calves') ? 2.5 : 1.5}
                    style={{ filter: getMuscleFilter('calves') }}
                    className="cursor-pointer transition-all duration-300 hover:brightness-125"
                    onClick={() => onSelectMuscle?.('calves')}
                  />
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* FOOTER DO MANEQUIM: CARD DE BIO-FEEDBACK DETALHADO */}
      {selectedMuscle && (
        <div className="mt-5 p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-medium text-zinc-400 tracking-wider">
              Grupamento Selecionado
            </span>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
              {MUSCLE_LABELS[selectedMuscle]}
              {(activeInfo?.score || 0) >= 70 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-zinc-950">
                  Alto Volume
                </span>
              )}
            </h4>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-[10px] text-zinc-400 block">Volume Total</span>
              <span className="font-mono font-medium text-white">
                {(activeInfo?.totalVolumeLoad || 0).toLocaleString()} kg
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Séries</span>
              <span className="font-mono font-medium text-zinc-200">
                {activeInfo?.totalSets || 0} sets
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block">Último Estímulo</span>
              <span className="font-mono font-medium text-zinc-400">
                {activeInfo?.lastTrainedDaysAgo !== undefined
                  ? `${activeInfo.lastTrainedDaysAgo}d atrás`
                  : 'Nenhum'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
