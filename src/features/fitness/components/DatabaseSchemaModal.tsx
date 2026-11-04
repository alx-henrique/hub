import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, ShieldAlert, Cpu, Layers, BookOpen, X } from 'lucide-react';
import { FREE_EXERCISE_DB_SQL_SCRIPT } from '../data/freeExerciseDbSql';

interface DatabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUPABASE_SQL_SCRIPT = `-- =========================================================================
-- PERSONAL HUB - MÓDULO 1: ACADEMIA INTELIGENTE
-- SCHEMA COMPLETO SUPABASE / POSTGRESQL COM RLS E INTEGRIDADE REFERENCIAL
-- =========================================================================

-- 1. EXTENSÃO PARA UUIDS SEGUROS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM DOS GRUPOS MUSCULARES
CREATE TYPE muscle_group AS ENUM (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 
    'quadriceps', 'hamstrings', 'calves', 'glutes', 'core'
);

-- 3. TABELA: PERFIS DE USUÁRIO (VINCULADO AO SUPABASE AUTH)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    height_cm NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: MEDIDAS BIOMÉTRICAS CORPORAIS
CREATE TABLE public.body_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5,2) NOT NULL,
    body_fat_pct NUMERIC(4,2),
    chest_cm NUMERIC(5,2),
    arms_cm NUMERIC(5,2),
    waist_cm NUMERIC(5,2),
    thighs_cm NUMERIC(5,2),
    calves_cm NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA: FICHAS DE TREINO (WORKOUT PLANS)
CREATE TABLE public.workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- Ex: "Hipertrofia A/B/C"
    duration_weeks INT NOT NULL DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.1 TABELA: DIVISÕES DO TREINO (Treino A, Treino B, Treino C)
CREATE TABLE public.workout_plan_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL, -- Ex: "Treino A - Peito e Tríceps"
    order_index INT NOT NULL DEFAULT 0
);

-- 5.2 TABELA: EXERCÍCIOS PROGRAMADOS NA FICHA
CREATE TABLE public.workout_plan_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_day_id UUID NOT NULL REFERENCES public.workout_plan_days(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL,
    target_sets INT NOT NULL DEFAULT 3,
    min_reps INT NOT NULL DEFAULT 8,
    max_reps INT NOT NULL DEFAULT 12,
    rest_seconds INT NOT NULL DEFAULT 60,
    order_index INT NOT NULL DEFAULT 0
);

-- 6. TABELA: SESSÕES DE TREINO REALIZADAS (LOGS DE SESSÃO)
CREATE TABLE public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_day_id UUID REFERENCES public.workout_plan_days(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_minutes INT,
    notes TEXT
);

-- 6.1 TABELA: SÉRIES EFETIVAS REGISTRADAS (SETS & CARGAS)
CREATE TABLE public.workout_set_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL,
    set_number INT NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL,
    reps_performed INT NOT NULL,
    rpe NUMERIC(3,1), -- Percepção subjetiva de esforço (6 a 10)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES DE ALTA PERFORMANCE PARA CONSULTAS TEMPORAIS
CREATE INDEX idx_sessions_user_date ON public.workout_sessions(user_id, started_at DESC);
CREATE INDEX idx_set_logs_exercise ON public.workout_set_logs(exercise_id, created_at DESC);
CREATE INDEX idx_measurements_user ON public.body_measurements(user_id, recorded_at DESC);

-- POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_set_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seu próprio perfil" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Usuários gerenciam suas medidas corporais" ON public.body_measurements
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários gerenciam suas fichas de treino" ON public.workout_plans
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários gerenciam suas sessões de treino" ON public.workout_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários gerenciam suas séries de treino" ON public.workout_set_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s 
            WHERE s.id = workout_set_logs.session_id AND s.user_id = auth.uid()
        )
    );
`;

export const DatabaseSchemaModal: React.FC<DatabaseSchemaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const [activeTab, setActiveTab] = useState<'hub' | 'seed'>('seed');
  const [copied, setCopied] = useState(false);

  const currentSql = activeTab === 'seed' ? FREE_EXERCISE_DB_SQL_SCRIPT : SUPABASE_SQL_SCRIPT;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in font-sans">
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Scripts SQL para Supabase (PT-BR)</h3>
              <p className="text-xs text-zinc-400">PostgreSQL com DDL, RLS e Seed do Free Exercise DB</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SELETOR DE ABAS ENTRE OS SCRIPTS */}
        <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('seed')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'seed'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Seed Free Exercise DB (100+ PT-BR)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('hub')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'hub'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Schema Hub (Perfis, Fichas, RLS)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" /> Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copiar Script SQL ({activeTab === 'seed' ? '100+ Exercícios' : 'Schema'})
              </>
            )}
          </button>
        </div>

        {/* Explicação da Aba Ativa */}
        <div className="text-xs text-zinc-400 mb-2 px-1">
          {activeTab === 'seed' ? (
            <span>
              Cria a tabela <code className="text-zinc-200 font-mono bg-zinc-950 px-1 py-0.5 rounded border border-zinc-800">public.exercicios</code> e insere os <strong>100+ exercícios</strong> com levantamentos básicos, variações de terra e rotinas de hipertrofia traduzidos para PT-BR.
            </span>
          ) : (
            <span>
              Cria as tabelas relacionais de usuários, medidas, fichas de treino, dias e logs com regras de segurança RLS no Supabase.
            </span>
          )}
        </div>

        {/* Visualizador de Código SQL */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 rounded-2xl border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed scrollbar-thin select-all">
          <pre>{currentSql}</pre>
        </div>

        {/* Rodapé do Modal */}
        <div className="pt-3 mt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Cole e execute diretamente no <strong>SQL Editor</strong> do painel Supabase</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
