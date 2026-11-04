import React, { useId } from 'react';
import { MuscleGroup } from '../types';

interface ExerciseVectorIllustrationProps {
  exerciseId?: string;
  exerciseName?: string;
  targetMuscle?: MuscleGroup | string;
  category?: string;
  className?: string;
  showBiomechanics?: boolean;
  imageUrl?: string;
}

/**
 * ExerciseVectorIllustration
 * Modern 3D Anatomical Atlas Vector Engine (SVG) with High-Res Image Support.
 * If an imageUrl or uploaded custom image is provided, renders the photo/illustration directly
 * with biomechanical HUD badge overlays and graceful vector fallback.
 */
export const ExerciseVectorIllustration: React.FC<ExerciseVectorIllustrationProps> = ({
  exerciseId = '',
  exerciseName = '',
  targetMuscle = 'chest',
  category = 'barbell',
  className = 'w-full h-full',
  showBiomechanics = true,
  imageUrl = '',
}) => {
  const [imageError, setImageError] = React.useState(false);
  const uid = useId().replace(/:/g, '');

  // If a valid image URL is passed (user-provided generated image or asset) and hasn't errored
  if (imageUrl && !imageError) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={imageUrl}
          alt={exerciseName || 'Exercício'}
          className="w-full h-full object-cover object-center"
          onError={() => setImageError(true)}
          loading="lazy"
        />
        {/* Subtle dark vignette overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
        {showBiomechanics && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white/80 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm border border-white/10 font-bold uppercase">
              {targetMuscle?.toString()}
            </span>
          </div>
        )}
      </div>
    );
  }
  const normId = (exerciseId || '').toLowerCase();
  const normName = (exerciseName || '').toLowerCase();
  const normMuscle = (targetMuscle || '').toLowerCase();

  // 1. Bench Press / Chest Press variants
  const isBenchDecline =
    normId.includes('decline-bench') ||
    normId.includes('bench-press-decline') ||
    normId.includes('guillotine') ||
    normName.includes('declinado');

  const isBenchIncline =
    (normId.includes('incline') || normName.includes('inclinad')) &&
    (normId.includes('bench') ||
      normId.includes('press') ||
      normName.includes('supino') ||
      normName.includes('press'));

  const isBenchFlat =
    normId.includes('flat') ||
    normId.includes('bench-press') ||
    normId.includes('floor-press') ||
    normId.includes('spoto') ||
    normId.includes('larsen') ||
    normId.includes('close-grip-bench') ||
    normName.includes('supino reto') ||
    (normName.includes('supino') && !normName.includes('inclinad') && !normName.includes('declinad'));

  const isFlyPec =
    normId.includes('fly') ||
    normId.includes('pec-deck') ||
    normId.includes('crossover') ||
    normName.includes('crucifixo') ||
    normName.includes('pec deck') ||
    normName.includes('crossover');

  const isDips =
    normId.includes('dip') ||
    normName.includes('paralela') ||
    normName.includes('mergulho');

  const isPushup =
    normId.includes('pushup') ||
    normName.includes('flexão') ||
    normName.includes('apoio de frente');

  // 2. Deadlifts & Posterior Chain Hinges
  const isRDLOrStiff =
    normId.includes('romanian') ||
    normId.includes('rdl') ||
    normId.includes('stiff') ||
    normId.includes('good-morning') ||
    normId.includes('hyperextension') ||
    normId.includes('superman') ||
    normName.includes('stiff') ||
    normName.includes('romeno') ||
    normName.includes('bom dia') ||
    normName.includes('hiperextensão');

  const isDeadlift =
    (normId.includes('deadlift') ||
      normId.includes('rack-pull') ||
      normId.includes('trap-bar') ||
      normId.includes('jefferson') ||
      normName.includes('terra') ||
      normName.includes('rack pull')) &&
    !isRDLOrStiff;

  // 3. Squat & Leg Machines
  const isLegPress =
    normId.includes('leg-press') || normName.includes('leg press');

  const isLegExtension =
    normId.includes('leg-extension') ||
    normId.includes('extensora') ||
    normId.includes('sissy') ||
    normName.includes('extensora') ||
    normName.includes('sissy');

  const isLegCurl =
    normId.includes('leg-curl') ||
    normId.includes('nordic') ||
    normName.includes('flexora') ||
    normName.includes('nordic');

  const isBulgarianLunge =
    normId.includes('bulgarian') ||
    normId.includes('lunge') ||
    normId.includes('step-up') ||
    normName.includes('búlgaro') ||
    normName.includes('passada') ||
    normName.includes('afundo') ||
    normName.includes('step up');

  const isHipThrust =
    normId.includes('hip-thrust') ||
    normId.includes('glute-bridge') ||
    normId.includes('kickback') ||
    normId.includes('abductor') ||
    normName.includes('pélvica') ||
    normName.includes('hip thrust') ||
    normName.includes('glúteo') ||
    normName.includes('abdutora');

  const isSquat =
    (normId.includes('squat') ||
      normId.includes('hack') ||
      normId.includes('pendulum') ||
      normId.includes('goblet') ||
      normName.includes('agachamento') ||
      normName.includes('hack')) &&
    !isLegPress &&
    !isBulgarianLunge;

  const isCalfRaise =
    normId.includes('calf') ||
    normId.includes('tibialis') ||
    normName.includes('panturrilha') ||
    normName.includes('gêmeos') ||
    normName.includes('solear') ||
    normMuscle === 'calves';

  // 4. Back Pulldowns & Rows
  const isLatPulldownOrPullup =
    normId.includes('lat-pulldown') ||
    normId.includes('pull-up') ||
    normId.includes('chin-up') ||
    normId.includes('puxada') ||
    normName.includes('puxada') ||
    normName.includes('barra fixa') ||
    normName.includes('chin-up') ||
    normName.includes('pulldown');

  const isRowBack =
    (normId.includes('row') ||
      normId.includes('seal') ||
      normId.includes('meadows') ||
      normName.includes('remada') ||
      normName.includes('cavalinho') ||
      normName.includes('serrote')) &&
    !isLatPulldownOrPullup;

  // 5. Shoulders
  const isLateralRaise =
    normId.includes('lateral-raise') ||
    normId.includes('lu-raise') ||
    normName.includes('elevação lateral') ||
    normName.includes('lateral raise');

  const isRearDeltFacePull =
    normId.includes('rear-delt') ||
    normId.includes('face-pull') ||
    normId.includes('reverse-pec') ||
    normId.includes('shrug') ||
    normName.includes('deltoide posterior') ||
    normName.includes('face pull') ||
    normName.includes('crucifixo inverso') ||
    normName.includes('encolhimento');

  const isOverheadPress =
    (normId.includes('overhead') ||
      normId.includes('military') ||
      normId.includes('shoulder-press') ||
      normId.includes('arnold') ||
      normId.includes('behind-neck') ||
      normName.includes('desenvolvimento')) &&
    !isLateralRaise &&
    !isRearDeltFacePull;

  // 6. Arms & Forearms
  const isForearm =
    normId.includes('wrist') ||
    normId.includes('farmer') ||
    normId.includes('pinch') ||
    normName.includes('antebraço') ||
    normName.includes('punho') ||
    normMuscle === 'forearms';

  const isTriceps =
    normId.includes('triceps') ||
    normId.includes('pushdown') ||
    normId.includes('skull') ||
    normId.includes('katana') ||
    normId.includes('french') ||
    normId.includes('jm-press') ||
    normName.includes('tríceps') ||
    normMuscle === 'triceps';

  const isBicepsCurl =
    (normId.includes('biceps') ||
      normId.includes('curl') ||
      normName.includes('rosca') ||
      normMuscle === 'biceps') &&
    !isTriceps &&
    !isLegCurl &&
    !isForearm;

  // 7. Core & Abs
  const isCoreAbs =
    normId.includes('crunch') ||
    normId.includes('leg-raise') ||
    normId.includes('plank') ||
    normId.includes('ab-wheel') ||
    normId.includes('sit-up') ||
    normId.includes('vacuum') ||
    normId.includes('dragon-flag') ||
    normId.includes('russian-twist') ||
    normId.includes('woodchopper') ||
    normId.includes('pallof') ||
    normName.includes('abdominal') ||
    normName.includes('prancha') ||
    normMuscle === 'core';

  // SVG Common Defs (High-End Anatomical Atlas Style)
  const commonDefs = (
    <defs>
      {/* Radiant Muscle Glows (Fiery Crimson Aura) */}
      <filter id={`vectorGlow_${uid}`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`vectorGlowStrong_${uid}`} x="-35%" y="-35%" width="170%" height="170%">
        <feGaussianBlur stdDeviation="5" result="blur1" />
        <feGaussianBlur stdDeviation="2" result="blur2" />
        <feMerge>
          <feMergeNode in="blur1" />
          <feMergeNode in="blur2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Target Muscle - Radiant Crimson & Fiery Red-Orange (Strength Training Anatomy style) */}
      <linearGradient id={`flameRedGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFA07A" />
        <stop offset="25%" stopColor="#FF4500" />
        <stop offset="65%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>

      {/* Synergist Muscle - Warm Solar Amber & Coral */}
      <linearGradient id={`amberGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>

      {/* Anatomical Body - Sculpted Athletic Deep Slate */}
      <linearGradient id={`bodySlateGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="50%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>

      <linearGradient id={`bodyHighlightGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#64748B" />
        <stop offset="50%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>

      {/* Hardware Metals - Knurled Olympic Bar & Cast-Iron Plates */}
      <linearGradient id={`metalBar_${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="40%" stopColor="#F8FAFC" />
        <stop offset="60%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>

      <linearGradient id={`plateGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="50%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0B0F19" />
      </linearGradient>

      {/* Background Vignette & Precision Engineering Grid */}
      <radialGradient id={`bgVignette_${uid}`} cx="50%" cy="50%" r="70%">
        <stop offset="0%" stopColor="#18181b" />
        <stop offset="60%" stopColor="#0f0f11" />
        <stop offset="100%" stopColor="#09090b" />
      </radialGradient>

      <pattern id={`techGrid_${uid}`} width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.015)" strokeWidth="1" />
      </pattern>

      {/* Subtle Muscle Fiber Striation Pattern */}
      <pattern id={`striationPat_${uid}`} width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1" />
      </pattern>
    </defs>
  );

  // Background tech canvas with minimalist HUD crosshairs
  const renderBackground = () => (
    <>
      <rect width="400" height="250" fill={`url(#bgVignette_${uid})`} rx="16" />
      <rect width="400" height="250" fill={`url(#techGrid_${uid})`} rx="16" />
      {/* Precision corner brackets in fiery red-orange */}
      <path d="M 16 26 L 16 16 L 26 16" stroke="rgba(255, 69, 0, 0.45)" strokeWidth="1.5" fill="none" />
      <path d="M 384 26 L 384 16 L 374 16" stroke="rgba(255, 69, 0, 0.45)" strokeWidth="1.5" fill="none" />
      <path d="M 16 224 L 16 234 L 26 234" stroke="rgba(255, 69, 0, 0.45)" strokeWidth="1.5" fill="none" />
      <path d="M 384 224 L 384 234 L 374 234" stroke="rgba(255, 69, 0, 0.45)" strokeWidth="1.5" fill="none" />

      {/* Biomechanical Target concentric rings */}
      <circle cx="200" cy="125" r="95" stroke="rgba(255, 69, 0, 0.06)" strokeWidth="1" strokeDasharray="3 4" fill="none" />
      <circle cx="200" cy="125" r="50" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" fill="none" />
      <line x1="24" y1="226" x2="376" y2="226" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
    </>
  );

  // 1. SUPINO RETO / FLAT BENCH PRESS
  if (isBenchFlat) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Banco Reto */}
        <rect x="90" y="152" width="200" height="14" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
        <rect x="110" y="166" width="12" height="60" fill="#0F172A" stroke="#334155" strokeWidth="1" />
        <rect x="250" y="166" width="12" height="60" fill="#0F172A" stroke="#334155" strokeWidth="1" />

        {/* Rack de apoio */}
        <path d="M 98 226 L 98 115 L 106 115" stroke="#334155" strokeWidth="3" fill="none" />
        <path d="M 94 115 L 102 125" stroke="#64748B" strokeWidth="2.5" />

        {/* Cabeça do atleta */}
        <circle cx="118" cy="145" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        {/* Tronco */}
        <path d="M 130 150 Q 188 149 242 152 Q 245 139 222 137 Q 168 137 130 147 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* PEITORAL MAIOR (TARGET - RADIANT FLAME RED) */}
        <path
          d="M 150 140 Q 183 134 203 141 Q 196 148 158 149 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />
        {/* Estriações anatômicas do feixe esternal */}
        <path d="M 156 142 Q 178 138 196 142 M 160 146 Q 180 143 194 146" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" fill="none" />

        {/* Pernas apoiadas firmes no solo */}
        <path d="M 242 152 Q 272 157 282 182 L 287 226" stroke="#334155" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="280" y="222" width="22" height="5" rx="2" fill="#64748B" />

        {/* Braços estendendo barra (Tríceps & Deltoide Anterior sinergistas em âmbar) */}
        <path d="M 153 143 Q 163 112 176 85" stroke={`url(#amberGrad_${uid})`} strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M 176 85 L 196 81" stroke="#64748B" strokeWidth="8" strokeLinecap="round" fill="none" />

        {/* Barra Olímpica */}
        <line x1="75" y1="81" x2="310" y2="81" stroke={`url(#metalBar_${uid})`} strokeWidth="5" />
        {/* Anilhas Olímpicas de Ferro Fundido */}
        <rect x="90" y="52" width="8" height="58" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />
        <rect x="80" y="58" width="7" height="46" rx="2" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />
        <rect x="290" y="52" width="8" height="58" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />
        <rect x="301" y="58" width="7" height="46" rx="2" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.5" />

        <circle cx="176" cy="81" r="5" fill="#E2E8F0" />
        <circle cx="216" cy="81" r="5" fill="#E2E8F0" />

        {showBiomechanics && (
          <g>
            <path d="M 196 125 L 196 91" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="196,85 191,94 201,94" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="208" y="108" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              ROTAÇÃO ESCAPULAR 45°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 2. SUPINO INCLINADO / INCLINE BENCH
  if (isBenchIncline) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Banco Inclinado 30° */}
        <line x1="120" y1="182" x2="215" y2="122" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
        <line x1="105" y1="192" x2="135" y2="182" stroke="#1E293B" strokeWidth="12" strokeLinecap="round" />
        <path d="M 125 187 L 125 226 M 190 142 L 200 226" stroke="#334155" strokeWidth="2.5" />

        {/* Atleta no banco inclinado */}
        <circle cx="195" cy="95" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 188 107 L 135 175 L 155 182 L 205 122 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* FEIXE CLAVICULAR / PEITORAL SUPERIOR (TARGET - FLAME RED) */}
        <path
          d="M 188 111 L 168 133 Q 185 139 205 122 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />
        {/* Deltoide Anterior Sinergista */}
        <circle cx="186" cy="117" r="7" fill={`url(#amberGrad_${uid})`} stroke="#F59E0B" strokeWidth="1.2" />

        {/* Pernas */}
        <path d="M 135 179 L 155 192 L 155 226" stroke="#334155" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="145" y="222" width="20" height="5" rx="2" fill="#64748B" />

        {/* Braços e Halteres/Barra Inclinados */}
        <path d="M 186 117 L 220 92 L 235 65" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="210" y="49" width="46" height="8" rx="2" fill={`url(#metalBar_${uid})`} />
        <rect x="206" y="39" width="8" height="28" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />
        <rect x="246" y="39" width="8" height="28" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 215 107 L 235 72" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="237,67 231,73 238,78" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="248" y="87" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FEIXE CLAVICULAR 30°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 3. CRUCIFIXO / FLY / PECK DECK / CROSSOVER
  if (isFlyPec) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Colunas de Polia Cruzada */}
        <rect x="24" y="28" width="16" height="198" fill="#1E293B" stroke="#475569" strokeWidth="1.5" rx="3" />
        <rect x="360" y="28" width="16" height="198" fill="#1E293B" stroke="#475569" strokeWidth="1.5" rx="3" />
        <circle cx="32" cy="68" r="7" fill="#64748B" />
        <circle cx="368" cy="68" r="7" fill="#64748B" />

        {/* Cabos em alta tensão */}
        <line x1="32" y1="68" x2="140" y2="122" stroke="#FF4500" strokeWidth="1.5" strokeDasharray="4 2" />
        <line x1="368" y1="68" x2="260" y2="122" stroke="#FF4500" strokeWidth="1.5" strokeDasharray="4 2" />

        {/* Atleta em adução peitoral no centro */}
        <circle cx="200" cy="82" r="12" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 180 99 Q 200 97 220 99 L 214 172 L 186 172 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* PEITORAL EM CONTRAÇÃO MÁXIMA (TARGET - FLAME RED) */}
        <path
          d="M 185 103 Q 200 101 215 103 L 210 137 Q 200 143 190 137 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Pernas em base atlética escalonada */}
        <path d="M 188 172 L 175 226 M 212 172 L 230 226" stroke="#334155" strokeWidth="11" strokeLinecap="round" />

        {/* Braços em abraço / adução */}
        <path d="M 185 107 Q 150 112 140 122" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M 215 107 Q 250 112 260 122" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" fill="none" />
        <circle cx="140" cy="122" r="6" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
        <circle cx="260" cy="122" r="6" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 130 132 Q 170 152 190 132" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <path d="M 270 132 Q 230 152 210 132" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <text x="142" y="192" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              ADUÇÃO HORIZONTAL MÁXIMA
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 4. PARALELAS / DIPS / MERGULHO
  if (isDips) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Barras Paralelas */}
        <rect x="130" y="115" width="14" height="111" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
        <rect x="256" y="115" width="14" height="111" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
        <line x1="115" y1="115" x2="160" y2="115" stroke={`url(#metalBar_${uid})`} strokeWidth="8" strokeLinecap="round" />
        <line x1="240" y1="115" x2="285" y2="115" stroke={`url(#metalBar_${uid})`} strokeWidth="8" strokeLinecap="round" />

        {/* Atleta suspenso em mergulho */}
        <circle cx="200" cy="65" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 188 77 L 212 77 L 208 145 L 192 145 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* PEITORAL INFERIOR & TRÍCEPS (TARGET - FLAME RED) */}
        <path
          d="M 190 82 L 210 82 L 206 115 L 194 115 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Braços flexionados nas paralelas com cotovelos em 90° (Tríceps Sinergista) */}
        <path d="M 188 80 L 155 90 L 145 115" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 212 80 L 245 90 L 255 115" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="145" cy="115" r="5" fill="#E2E8F0" />
        <circle cx="255" cy="115" r="5" fill="#E2E8F0" />

        {/* Pernas cruzadas suspensas */}
        <path d="M 195 145 L 205 178 L 215 175" stroke="#334155" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {showBiomechanics && (
          <g>
            <path d="M 200 130 L 200 95" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="200,90 196,98 204,98" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="210" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              EMPURRE VERTICAL & LOCKOUT
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 5. FLEXÃO DE BRAÇO / PUSHUP
  if (isPushup) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Solo de apoio */}
        <line x1="60" y1="205" x2="340" y2="205" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

        {/* Prancha corporal reta */}
        <circle cx="130" cy="148" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        {/* Tronco alinhado */}
        <path d="M 140 152 L 285 188 L 280 200 L 135 164 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* PEITORAL & CORE ATIVOS (TARGET - FLAME RED) */}
        <path
          d="M 142 153 L 200 168 L 195 178 L 138 163 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Pernas e pés apoiados na ponta dos dedos */}
        <circle cx="295" cy="202" r="5" fill="#64748B" />

        {/* Braços empurrando o solo (cotovelos a 45°) */}
        <path d="M 152 156 L 165 182 L 155 205" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="148" y="202" width="14" height="4" rx="2" fill="#E2E8F0" />

        {showBiomechanics && (
          <g>
            <line x1="140" y1="152" x2="290" y2="190" stroke="#FF4500" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="175" y="135" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              ALINHAMENTO CERVICO-PÉLVICO 180°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 6. LEVANTAMENTO TERRA / DEADLIFT CONVENCIONAL & SUMÔ & TRAP BAR
  if (isDeadlift) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Atleta executando saída do chão (Hip Hinge potente) */}
        <circle cx="168" cy="78" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 174 86 L 226 122 L 212 142 L 162 98 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* DORSAL & ERETORES DA ESPINHA (TARGET - FLAME RED) */}
        <path
          d="M 176 90 L 219 123 L 209 135 L 168 100 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* GLÚTEO & POSTERIOR DE COXA (SINERGISTAS EM ÂMBAR & TARGET) */}
        <path d="M 226 122 Q 256 132 242 158 L 217 146 Z" fill={`url(#amberGrad_${uid})`} stroke="#F59E0B" strokeWidth="1.5" />
        <path d="M 242 156 L 222 196" stroke={`url(#flameRedGrad_${uid})`} strokeWidth="14" strokeLinecap="round" filter={`url(#vectorGlow_${uid})`} />
        <path d="M 222 196 L 222 226" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
        <rect x="212" y="222" width="28" height="5" rx="2" fill="#64748B" />

        {/* Braço perpendicular segurando a barra rente à canela */}
        <path d="M 172 96 L 182 181" stroke="#64748B" strokeWidth="8" strokeLinecap="round" />
        <circle cx="182" cy="181" r="5" fill="#E2E8F0" />

        {/* Barra Olímpica e Anilhas de 450mm */}
        <line x1="120" y1="181" x2="310" y2="181" stroke={`url(#metalBar_${uid})`} strokeWidth="6" />
        <circle cx="140" cy="181" r="32" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2.5" filter={`url(#vectorGlow_${uid})`} />
        <circle cx="140" cy="181" r="22" fill="#0B0F19" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="285" cy="181" r="32" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2.5" filter={`url(#vectorGlow_${uid})`} />
        <circle cx="285" cy="181" r="22" fill="#0B0F19" stroke="#F59E0B" strokeWidth="1.5" />

        {showBiomechanics && (
          <g>
            <path d="M 182 181 L 182 135" stroke="#FF4500" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="182,129 177,138 187,138" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="195" y="145" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              TRACIONAMENTO VERTICAL 90°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 7. RDL / STIFF / GOOD MORNING (ISQUIOTIBIAIS)
  if (isRDLOrStiff) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Cabeça e tronco em inclinação horizontal */}
        <circle cx="135" cy="100" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 142 108 L 226 122 L 222 138 L 138 124 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* ERETORES E GLÚTEO */}
        <path d="M 145 110 L 222 124 L 218 134 L 141 120 Z" fill={`url(#amberGrad_${uid})`} stroke="#F59E0B" strokeWidth="1.5" />

        {/* POSTERIOR DE COXA / ISQUIOTIBIAIS (TARGET - FLAME RED) */}
        <path d="M 226 122 L 236 175" stroke={`url(#flameRedGrad_${uid})`} strokeWidth="16" strokeLinecap="round" filter={`url(#vectorGlowStrong_${uid})`} />
        {/* Canela vertical (estabilidade de joelho fixa no stiff) */}
        <path d="M 236 175 L 238 226" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
        <rect x="228" y="222" width="26" height="5" rx="2" fill="#64748B" />

        {/* Braço descendo rente à tíbia */}
        <path d="M 155 118 L 195 185" stroke="#64748B" strokeWidth="8" strokeLinecap="round" />
        <circle cx="195" cy="185" r="5" fill="#E2E8F0" />
        <line x1="160" y1="185" x2="230" y2="185" stroke={`url(#metalBar_${uid})`} strokeWidth="5" />
        <rect x="170" y="165" width="8" height="40" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 220 120 Q 255 125 242 165" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <text x="140" y="80" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              ALONGAMENTO ISQUIOTIBIAL MÁXIMO
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 8. LEG PRESS 45°
  if (isLegPress) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Estrutura do Leg Press a 45 Graus */}
        <line x1="80" y1="210" x2="310" y2="70" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
        {/* Encosto do Atleta */}
        <line x1="100" y1="205" x2="165" y2="175" stroke="#334155" strokeWidth="14" strokeLinecap="round" />

        {/* Atleta deitado empurrando carrinho */}
        <circle cx="95" cy="195" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 108 200 L 165 175 L 175 190 L 118 215 Z" fill="#1E293B" />

        {/* QUADRÍCEPS FEMORAL (TARGET - FLAME RED) */}
        <path
          d="M 165 175 L 215 130"
          stroke={`url(#flameRedGrad_${uid})`}
          strokeWidth="16"
          strokeLinecap="round"
          filter={`url(#vectorGlowStrong_${uid})`}
        />
        {/* Pernas em flexão de 90° e extensão */}
        <path d="M 215 130 L 255 105" stroke={`url(#amberGrad_${uid})`} strokeWidth="12" strokeLinecap="round" />

        {/* Plataforma do Carrinho & Carga de Anilhas a 45° */}
        <line x1="240" y1="85" x2="275" y2="135" stroke={`url(#metalBar_${uid})`} strokeWidth="10" strokeLinecap="round" />
        <rect x="255" y="80" width="35" height="10" transform="rotate(-45 255 80)" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 240 120 L 270 90" stroke="#FF4500" strokeWidth="2.5" />
            <polygon points="274,86 266,92 272,98" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="215" y="70" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              VETOR DE EMPURRE 45°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 9. CADEIRA EXTENSORA / LEG EXTENSION
  if (isLegExtension) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Banco e Encosto */}
        <line x1="140" y1="120" x2="140" y2="175" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
        <line x1="140" y1="175" x2="215" y2="175" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
        <circle cx="215" cy="175" r="9" fill="#475569" />

        {/* Atleta sentado */}
        <circle cx="140" cy="100" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 145 110 L 145 170 L 215 170" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* QUADRÍCEPS FEMORAL (ISOLAMENTO PURO - TARGET FLAME RED) */}
        <path
          d="M 148 168 L 215 168"
          stroke={`url(#flameRedGrad_${uid})`}
          strokeWidth="16"
          strokeLinecap="round"
          filter={`url(#vectorGlowStrong_${uid})`}
        />
        {/* Perna estendendo alavanca mecânica */}
        <path d="M 215 175 L 265 140" stroke={`url(#amberGrad_${uid})`} strokeWidth="11" strokeLinecap="round" />
        <circle cx="265" cy="140" r="10" fill="#0F172A" stroke="#FF4500" strokeWidth="2.5" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 220 200 A 30 30 0 0 0 265 145" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <polygon points="265,140 257,146 264,152" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="210" y="115" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              EXTENSÃO TIBIAL MÁXIMA
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 10. MESA / CADEIRA FLEXORA / LEG CURL
  if (isLegCurl) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Banco Anatômico Angulado */}
        <line x1="85" y1="165" x2="175" y2="160" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
        <line x1="175" y1="160" x2="245" y2="172" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />

        {/* Atleta em decúbito ventral */}
        <circle cx="95" cy="145" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 105 152 L 180 152 L 235 165" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" fill="none" />

        {/* ISQUIOTIBIAIS EM CONTRAÇÃO (TARGET - FLAME RED) */}
        <path
          d="M 185 156 L 240 168"
          stroke={`url(#flameRedGrad_${uid})`}
          strokeWidth="16"
          strokeLinecap="round"
          filter={`url(#vectorGlowStrong_${uid})`}
        />
        {/* Perna flexionando em direção aos glúteos */}
        <path d="M 240 168 L 225 110" stroke={`url(#amberGrad_${uid})`} strokeWidth="11" strokeLinecap="round" />
        <circle cx="225" cy="110" r="10" fill="#0F172A" stroke="#FF4500" strokeWidth="2.5" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 255 160 A 40 40 0 0 1 225 105" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <polygon points="225,105 220,113 230,115" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="95" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FLEXÃO DE JOELHO 110°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 11. ELEVAÇÃO PÉLVICA / HIP THRUST / GLUTE BRIDGE
  if (isHipThrust) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Banco de apoio escápula */}
        <rect x="100" y="145" width="45" height="55" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* Atleta em Ponte Pélvica / Lockout Máximo */}
        <circle cx="120" cy="130" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        {/* Tronco alinhado horizontal */}
        <line x1="130" y1="145" x2="205" y2="145" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />

        {/* GLÚTEO MÁXIMO & MÉDIO (TARGET - FLAME RED) */}
        <path
          d="M 195 145 Q 225 140 215 165 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Joelhos a 90° e pés firmes no solo */}
        <path d="M 215 145 L 245 145 L 248 215" stroke="#334155" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="240" y="210" width="22" height="5" rx="2" fill="#64748B" />

        {/* Barra Olímpica sobre a pelve com protetor acolchoado */}
        <rect x="190" y="132" width="24" height="12" rx="3" fill="#0F172A" stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />
        <line x1="175" y1="138" x2="230" y2="138" stroke={`url(#metalBar_${uid})`} strokeWidth="5" />

        {showBiomechanics && (
          <g>
            <path d="M 205 170 L 205 125" stroke="#FF4500" strokeWidth="2.5" />
            <polygon points="205,120 200,128 210,128" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="98" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              EXTENSÃO COMPLETA DE QUADRIL 180°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 12. PANTURRILHA / CALF RAISE (GÊMEOS / SÓLEO)
  if (isCalfRaise) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Bloco / Step de elevação */}
        <rect x="170" y="210" width="80" height="20" fill="#1E293B" stroke="#475569" strokeWidth="1.5" rx="2" />

        {/* Atleta em pé */}
        <circle cx="205" cy="55" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <line x1="205" y1="68" x2="205" y2="135" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />
        <line x1="205" y1="135" x2="205" y2="165" stroke="#334155" strokeWidth="14" strokeLinecap="round" />

        {/* GASTROCNÊMIO / SÓLEO (TARGET - FLAME RED) */}
        <path
          d="M 198 165 Q 192 185 200 198 Q 212 185 208 165 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Pés na ponta dos dedos / Flexão Plantar */}
        <line x1="205" y1="198" x2="200" y2="212" stroke="#64748B" strokeWidth="8" strokeLinecap="round" />
        <line x1="200" y1="212" x2="215" y2="212" stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" />

        {showBiomechanics && (
          <g>
            <path d="M 225 210 L 225 180" stroke="#FF4500" strokeWidth="2.5" />
            <polygon points="225,175 221,183 229,183" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="235" y="190" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FLEXÃO PLANTAR MÁXIMA
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 13. AGACHAMENTO / SQUATS (LIVRE, FRONT, HACK)
  if (isSquat) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Atleta em Agachamento Profundo (Abaixo de 90°) */}
        <circle cx="165" cy="98" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 170 108 L 195 158 L 178 165 L 155 115 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* GLÚTEO & ERETORES */}
        <path d="M 195 158 Q 215 168 205 182 L 180 172 Z" fill={`url(#amberGrad_${uid})`} stroke="#F59E0B" strokeWidth="1.5" />

        {/* QUADRÍCEPS FEMORAL (TARGET - FLAME RED) */}
        <path
          d="M 195 160 L 235 168"
          stroke={`url(#flameRedGrad_${uid})`}
          strokeWidth="16"
          strokeLinecap="round"
          filter={`url(#vectorGlowStrong_${uid})`}
        />
        {/* Canela e pés apoiados */}
        <path d="M 235 168 L 225 226" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
        <rect x="215" y="222" width="28" height="5" rx="2" fill="#64748B" />

        {/* Barra Olímpica sobre os trapézios */}
        <circle cx="168" cy="110" r="7" fill={`url(#metalBar_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />
        <line x1="120" y1="110" x2="225" y2="110" stroke={`url(#metalBar_${uid})`} strokeWidth="6" />
        <circle cx="140" cy="110" r="28" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2.5" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 195 160 L 195 125" stroke="#FF4500" strokeWidth="2.5" strokeDasharray="3 3" />
            <polygon points="195,120 190,129 200,129" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="210" y="135" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              PROFUNDIDADE &lt; 90° (ROM MÁXIMA)
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 14. AGACHAMENTO BÚLGARO / PASSADA / LUNGE
  if (isBulgarianLunge) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Banco traseiro */}
        <rect x="80" y="170" width="45" height="55" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* Atleta em afundo */}
        <circle cx="215" cy="78" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <line x1="215" y1="90" x2="215" y2="155" stroke="#1E293B" strokeWidth="14" strokeLinecap="round" />

        {/* Perna de trás apoiada no banco */}
        <path d="M 215 155 L 145 175 L 115 170" stroke="#334155" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* QUADRÍCEPS & GLÚTEO DA PERNA DA FRENTE (TARGET - FLAME RED) */}
        <path
          d="M 215 155 L 265 165"
          stroke={`url(#flameRedGrad_${uid})`}
          strokeWidth="15"
          strokeLinecap="round"
          filter={`url(#vectorGlowStrong_${uid})`}
        />
        <path d="M 265 165 L 265 226" stroke="#334155" strokeWidth="12" strokeLinecap="round" />
        <rect x="255" y="222" width="26" height="5" rx="2" fill="#64748B" />

        {/* Halteres ao lado do corpo */}
        <line x1="228" y1="120" x2="228" y2="160" stroke={`url(#metalBar_${uid})`} strokeWidth="4" />
        <rect x="223" y="115" width="10" height="6" rx="1" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="1.5" filter={`url(#vectorGlow_${uid})`} />
        <rect x="223" y="158" width="10" height="6" rx="1" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="1.5" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 265 165 L 265 130" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="265,125 261,133 269,133" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="110" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              SOBRECARGA UNILATERAL
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 15. PUXADA FRONTAL / BARRA FIXA (LAT PULLDOWN / PULL-UPS)
  if (isLatPulldownOrPullup) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Barra de puxada suspensa */}
        <line x1="100" y1="42" x2="300" y2="42" stroke={`url(#metalBar_${uid})`} strokeWidth="6" strokeLinecap="round" />
        <circle cx="200" cy="42" r="5" fill="#FF4500" />
        <line x1="200" y1="20" x2="200" y2="42" stroke="#64748B" strokeWidth="3" />

        {/* Cabeça do atleta */}
        <circle cx="200" cy="85" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />

        {/* Tronco & LATÍSSIMO DO DORSO (TARGET - FLAME RED) */}
        <path
          d="M 175 98 L 225 98 L 210 160 L 190 160 Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="1.5"
        />
        {/* Asas dorsais em contração extrema */}
        <path
          d="M 172 100 Q 155 125 188 152 L 200 152 Q 235 125 228 100 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Braços tracionando a barra para o peito (Bíceps Sinergista em Âmbar) */}
        <path d="M 172 100 L 140 68 L 130 42" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 228 100 L 260 68 L 270 42" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Pernas travadas na almofada */}
        <path d="M 190 160 L 180 220 M 210 160 L 220 220" stroke="#334155" strokeWidth="11" strokeLinecap="round" />

        {showBiomechanics && (
          <g>
            <path d="M 140 50 L 160 85" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="163,90 155,87 160,80" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <path d="M 260 50 L 240 85" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="237,90 240,80 245,87" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="195" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              DEPRESSÃO ESCAPULAR COMPLETA
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 16. REMADA CURVADA / CAVALINHO / T-BAR / REMADA BAIXA
  if (isRowBack) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Atleta em Remada Curvada a 45° */}
        <circle cx="150" cy="85" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 158 92 L 230 128 L 218 145 L 148 110 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* DORSAL MÉDIO & ROMBOIDES (TARGET - FLAME RED) */}
        <path
          d="M 165 98 L 220 128 L 210 138 L 155 108 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Glúteo e pernas mantendo base rígida */}
        <path d="M 230 128 L 245 168 L 235 226" stroke="#334155" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="225" y="222" width="26" height="5" rx="2" fill="#64748B" />

        {/* Braço puxando barra para o abdômen (cotovelo para trás) */}
        <path d="M 160 102 L 180 130 L 195 110" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="195" cy="110" r="5" fill="#E2E8F0" />

        {/* Barra Olímpica rente ao umbigo */}
        <line x1="140" y1="110" x2="250" y2="110" stroke={`url(#metalBar_${uid})`} strokeWidth="5" />
        <rect x="150" y="85" width="8" height="50" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 195 140 L 195 110" stroke="#FF4500" strokeWidth="2.5" />
            <polygon points="195,105 190,114 200,114" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="70" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              ADUÇÃO ESCAPULAR (RETRAÇÃO)
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 17. DESENVOLVIMENTO MILITAR / OMBROS (OVERHEAD PRESS)
  if (isOverheadPress) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Atleta em pé com barra acima da cabeça (Lockout) */}
        <circle cx="200" cy="95" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 180 108 L 220 108 L 210 170 L 190 170 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* DELTOIDE ANTERIOR & LATERAL (TARGET - FLAME RED) */}
        <circle cx="178" cy="112" r="9" fill={`url(#flameRedGrad_${uid})`} filter={`url(#vectorGlowStrong_${uid})`} stroke="#FF3B30" strokeWidth="2" />
        <circle cx="222" cy="112" r="9" fill={`url(#flameRedGrad_${uid})`} filter={`url(#vectorGlowStrong_${uid})`} stroke="#FF3B30" strokeWidth="2" />

        {/* Braços estendidos no zênite (Tríceps Sinergista em Âmbar) */}
        <path d="M 178 112 L 175 75 L 182 45" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M 222 112 L 225 75 L 218 45" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Barra Olímpica no Topo */}
        <line x1="120" y1="45" x2="280" y2="45" stroke={`url(#metalBar_${uid})`} strokeWidth="5" />
        <rect x="135" y="20" width="8" height="50" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />
        <rect x="257" y="20" width="8" height="50" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {/* Pernas em base estrita */}
        <path d="M 190 170 L 185 226 M 210 170 L 215 226" stroke="#334155" strokeWidth="11" strokeLinecap="round" />

        {showBiomechanics && (
          <g>
            <path d="M 200 85 L 200 52" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" />
            <polygon points="200,47 196,55 204,55" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="205" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              LOCKOUT VERTICAL 180°
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 18. ELEVAÇÃO LATERAL (LATERAL RAISES)
  if (isLateralRaise) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Atleta em pé com abdução de ombros em 90° */}
        <circle cx="200" cy="85" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 185 98 L 215 98 L 210 170 L 190 170 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* DELTOIDE LATERAL (TARGET - FLAME RED) */}
        <circle cx="180" cy="104" r="10" fill={`url(#flameRedGrad_${uid})`} filter={`url(#vectorGlowStrong_${uid})`} stroke="#FF3B30" strokeWidth="2" />
        <circle cx="220" cy="104" r="10" fill={`url(#flameRedGrad_${uid})`} filter={`url(#vectorGlowStrong_${uid})`} stroke="#FF3B30" strokeWidth="2" />

        {/* Braços abduzidos horizontalmente no plano escapular */}
        <path d="M 180 104 L 140 106 L 105 110" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M 220 104 L 260 106 L 295 110" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" fill="none" />

        {/* Halteres nas extremidades */}
        <rect x="98" y="100" width="14" height="20" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />
        <rect x="288" y="100" width="14" height="20" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {/* Pernas */}
        <path d="M 190 170 L 185 226 M 210 170 L 215 226" stroke="#334155" strokeWidth="11" strokeLinecap="round" />

        {showBiomechanics && (
          <g>
            <path d="M 140 135 A 40 40 0 0 1 115 115" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <polygon points="110,112 118,114 116,122" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <path d="M 260 135 A 40 40 0 0 0 285 115" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <polygon points="290,112 284,122 282,114" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="195" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              PLANO ESCAPULAR (30° ANTERIOR)
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 19. FACE PULL / DELTOIDE POSTERIOR / ENCOLHIMENTO
  if (isRearDeltFacePull) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Cabo da polia alta */}
        <line x1="340" y1="70" x2="225" y2="85" stroke="#FF4500" strokeWidth="2" strokeDasharray="4 2" />
        <circle cx="340" cy="70" r="6" fill="#64748B" />

        {/* Atleta puxando a corda na altura dos olhos */}
        <circle cx="180" cy="85" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 170 98 L 205 98 L 195 170 L 175 170 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* DELTOIDE POSTERIOR & TRAPÉZIO (TARGET - FLAME RED) */}
        <circle cx="170" cy="102" r="9" fill={`url(#flameRedGrad_${uid})`} filter={`url(#vectorGlowStrong_${uid})`} stroke="#FF3B30" strokeWidth="2" />
        <path d="M 175 96 L 200 96 L 190 120 Z" fill={`url(#flameRedGrad_${uid})`} stroke="#FF3B30" strokeWidth="1.5" />

        {/* Braços com cotovelos altos e rotação externa */}
        <path d="M 170 102 L 185 85 L 220 85" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="220" cy="85" r="5" fill="#E2E8F0" />

        {/* Pernas firmes */}
        <path d="M 175 170 L 165 226 M 195 170 L 205 226" stroke="#334155" strokeWidth="11" strokeLinecap="round" />

        {showBiomechanics && (
          <g>
            <path d="M 235 85 L 200 85" stroke="#FF4500" strokeWidth="2.5" />
            <polygon points="195,85 203,81 203,89" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="195" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              ROTAÇÃO EXTERNA & RETRAÇÃO
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 20. ROSCA BÍCEPS / SCOTT / MARTELO (BICEPS CURLS)
  if (isBicepsCurl) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Atleta em pé flexionando cotovelos */}
        <circle cx="180" cy="75" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 172 88 L 198 88 L 192 165 L 175 165 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* BÍCEPS BRAQUIAL EM PICRO DE CONTRAÇÃO (TARGET - FLAME RED) */}
        <path
          d="M 195 95 Q 215 110 205 125 L 190 120 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Braço e antebraço segurando barra W / halteres */}
        <path d="M 195 95 L 195 130 L 215 105" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="215" cy="105" r="5" fill="#E2E8F0" />

        {/* Halter / Barra em flexão */}
        <rect x="208" y="95" width="14" height="20" rx="3" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {/* Pernas */}
        <path d="M 175 165 L 170 226 M 192 165 L 195 226" stroke="#334155" strokeWidth="11" strokeLinecap="round" />

        {showBiomechanics && (
          <g>
            <path d="M 210 145 A 35 35 0 0 0 215 105" stroke="#FF4500" strokeWidth="2.5" strokeDasharray="3 3" fill="none" />
            <polygon points="215,100 210,108 220,108" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="215" y="145" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              SUPINAÇÃO & FLEXÃO DE COTOVELO
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 21. TRÍCEPS CORDA / TESTA / PUSHDOWN
  if (isTriceps) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Polia Alta com Cabo */}
        <line x1="260" y1="35" x2="225" y2="105" stroke="#FF4500" strokeWidth="2" strokeDasharray="4 2" />
        <circle cx="260" cy="35" r="6" fill="#64748B" />

        {/* Atleta executando extensão de cotovelo */}
        <circle cx="175" cy="80" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <path d="M 168 92 L 192 92 L 188 165 L 170 165 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* TRÍCEPS BRAQUIAL - CABEÇA LONGA & LATERAL (TARGET - FLAME RED) */}
        <path
          d="M 188 95 Q 178 115 186 130 L 196 125 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />

        {/* Braço fixo ao lado do tronco e antebraço estendendo */}
        <path d="M 188 95 L 190 128 L 210 165" stroke={`url(#amberGrad_${uid})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="210" cy="165" r="6" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />

        {/* Pernas */}
        <path d="M 170 165 L 165 226 M 188 165 L 190 226" stroke="#334155" strokeWidth="11" strokeLinecap="round" />

        {showBiomechanics && (
          <g>
            <path d="M 215 130 L 215 165" stroke="#FF4500" strokeWidth="2.5" />
            <polygon points="215,170 210,161 220,161" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="215" y="125" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              LOCKOUT DE COTOVELO (EXTENSÃO)
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 22. ABDOMINAIS / CORE / PRANCHA / HANGING LEG RAISE
  if (isCoreAbs) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Atleta em Crunch / Flexão de Coluna */}
        <circle cx="150" cy="135" r="11" fill="#334155" stroke="#64748B" strokeWidth="1.5" />

        {/* RETO ABDOMINAL (TARGET - FLAME RED) */}
        <path
          d="M 160 142 Q 190 128 220 160 L 205 175 Q 180 152 155 155 Z"
          fill={`url(#flameRedGrad_${uid})`}
          filter={`url(#vectorGlowStrong_${uid})`}
          stroke="#FF3B30"
          strokeWidth="2"
        />
        {/* Gominhos anatômicos do six-pack */}
        <line x1="172" y1="145" x2="168" y2="152" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="185" y1="145" x2="182" y2="155" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <line x1="198" y1="150" x2="195" y2="162" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

        {/* Pernas flexionadas */}
        <path d="M 220 160 L 255 140 L 275 190" stroke="#334155" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="100" y1="192" x2="300" y2="192" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

        {showBiomechanics && (
          <g>
            <path d="M 160 120 Q 185 105 210 135" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <polygon points="160,120 168,122 165,129" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="95" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FLEXÃO DA CAIXA TORÁCICA À PELVE
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 23. ANTEBRAÇO / WRIST CURL / FARMER'S WALK
  if (isForearm) {
    return (
      <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
        {commonDefs}
        {renderBackground()}

        {/* Apoio no banco */}
        <rect x="120" y="150" width="160" height="15" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />

        {/* Antebraço apoiado (TARGET - FLAME RED) */}
        <path
          d="M 140 145 L 235 145 L 245 130"
          stroke={`url(#flameRedGrad_${uid})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#vectorGlowStrong_${uid})`}
          fill="none"
        />

        {/* Mão e Punho flexionando halter */}
        <circle cx="245" cy="130" r="6" fill="#E2E8F0" />
        <rect x="238" y="115" width="14" height="26" rx="3" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="2" filter={`url(#vectorGlow_${uid})`} />

        {showBiomechanics && (
          <g>
            <path d="M 235 155 Q 260 145 245 125" stroke="#FF4500" strokeWidth="2" strokeDasharray="3 3" fill="none" />
            <polygon points="245,125 247,133 255,130" fill="#FF4500" filter={`url(#vectorGlow_${uid})`} />
            <text x="145" y="115" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace">
              FLEXÃO MÁXIMA DE PUNHO
            </text>
          </g>
        )}
      </svg>
    );
  }

  // 24. SILHUETA ANATÔMICA DINÂMICA (PARA QUALQUER EXERCÍCIO OU VARIANTE ESPECÍFICA)
  const isChest = normMuscle === 'chest';
  const isBack = normMuscle === 'back';
  const isShoulders = normMuscle === 'shoulders';
  const isBiceps = normMuscle === 'biceps';
  const isTri = normMuscle === 'triceps';
  const isQuads = normMuscle === 'quadriceps';
  const isHams = normMuscle === 'hamstrings';
  const isGlutes = normMuscle === 'glutes';
  const isCalves = normMuscle === 'calves';
  const isCore = normMuscle === 'core';
  const isArms = normMuscle === 'forearms';

  return (
    <svg viewBox="0 0 400 250" className={className} xmlns="http://www.w3.org/2000/svg">
      {commonDefs}
      {renderBackground()}

      {/* Silhueta anatômica atlética de alta precisão */}
      <circle cx="200" cy="62" r="13" fill="#334155" stroke="#64748B" strokeWidth="1.5" />

      {/* Tronco & Peitoral / Dorsal */}
      <path
        d="M 175 80 L 225 80 L 215 145 L 185 145 Z"
        fill={isChest || isBack ? `url(#flameRedGrad_${uid})` : '#1E293B'}
        filter={isChest || isBack ? `url(#vectorGlowStrong_${uid})` : 'none'}
        stroke={isChest || isBack ? '#FF3B30' : '#475569'}
        strokeWidth="2"
      />

      {/* Ombros */}
      <circle
        cx="168"
        cy="88"
        r="11"
        fill={isShoulders ? `url(#flameRedGrad_${uid})` : '#334155'}
        filter={isShoulders ? `url(#vectorGlowStrong_${uid})` : 'none'}
        stroke={isShoulders ? '#FF3B30' : '#475569'}
        strokeWidth="1.5"
      />
      <circle
        cx="232"
        cy="88"
        r="11"
        fill={isShoulders ? `url(#flameRedGrad_${uid})` : '#334155'}
        filter={isShoulders ? `url(#vectorGlowStrong_${uid})` : 'none'}
        stroke={isShoulders ? '#FF3B30' : '#475569'}
        strokeWidth="1.5"
      />

      {/* Braços & Bíceps / Tríceps */}
      <path
        d="M 165 92 L 155 135 L 150 170"
        stroke={isBiceps || isTri || isArms ? `url(#flameRedGrad_${uid})` : '#334155'}
        strokeWidth="10"
        strokeLinecap="round"
        filter={isBiceps || isTri || isArms ? `url(#vectorGlowStrong_${uid})` : 'none'}
      />
      <path
        d="M 235 92 L 245 135 L 250 170"
        stroke={isBiceps || isTri || isArms ? `url(#flameRedGrad_${uid})` : '#334155'}
        strokeWidth="10"
        strokeLinecap="round"
        filter={isBiceps || isTri || isArms ? `url(#vectorGlowStrong_${uid})` : 'none'}
      />

      {/* Pernas (Quadríceps, Isquiotibiais, Panturrilhas, Glúteos) */}
      <path
        d="M 188 145 L 180 185 L 175 226"
        stroke={isQuads || isHams || isCalves || isGlutes ? `url(#flameRedGrad_${uid})` : '#334155'}
        strokeWidth="13"
        strokeLinecap="round"
        filter={isQuads || isHams || isCalves || isGlutes ? `url(#vectorGlowStrong_${uid})` : 'none'}
      />
      <path
        d="M 212 145 L 220 185 L 225 226"
        stroke={isQuads || isHams || isCalves || isGlutes ? `url(#flameRedGrad_${uid})` : '#334155'}
        strokeWidth="13"
        strokeLinecap="round"
        filter={isQuads || isHams || isCalves || isGlutes ? `url(#vectorGlowStrong_${uid})` : 'none'}
      />

      {/* Barra / Halteres biomecânicos na base */}
      <line x1="120" y1="175" x2="280" y2="175" stroke={`url(#metalBar_${uid})`} strokeWidth="4" />
      <rect x="130" y="160" width="8" height="30" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="1.5" />
      <rect x="262" y="160" width="8" height="30" rx="2" fill={`url(#plateGrad_${uid})`} stroke="#FF4500" strokeWidth="1.5" />

      {showBiomechanics && (
        <g>
          <text x="200" y="242" fill="#FF6B4A" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            VETOR BIOMECÂNICO · {targetMuscle?.toString().toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
};
