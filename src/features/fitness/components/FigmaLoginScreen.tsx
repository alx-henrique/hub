import React, { useState } from 'react';
import { Dumbbell, ArrowRight, UserCheck, ShieldCheck, Zap } from 'lucide-react';

interface FigmaLoginScreenProps {
  onLoginSuccess: (name: string) => void;
}

export const FigmaLoginScreen: React.FC<FigmaLoginScreenProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLoginSuccess(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col justify-between p-6 max-w-md mx-auto relative overflow-hidden">
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Topo: Logo & Badge */}
      <div className="flex items-center justify-between pt-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-950/50">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight">Personal HUB</span>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
          v2.0 Elite
        </span>
      </div>

      {/* Meio: Apresentação e Boas-vindas */}
      <div className="flex flex-col gap-3 relative z-10 my-auto py-8">
        <span className="text-xs font-bold text-red-500 tracking-widest uppercase">
          Academia Inteligente
        </span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none">
          Bora quebrar <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-orange-500">
            o mundo.
          </span>
        </h1>
        <p className="text-sm text-zinc-400 font-medium leading-relaxed mt-1">
          Acompanhe sua evolução corporal, hipertrofia contínua e progressão de carga em tempo real.
        </p>

        {/* Formulário / Botão de Acesso Rápido */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-6">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Como prefere ser chamado?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full mt-1.5 px-4 py-3.5 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full py-4 rounded-2xl font-extrabold text-base tracking-wide shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2 group ${
              name.trim()
                ? 'bg-[#ff1a00] text-white shadow-red-950/60 hover:bg-red-600'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Entrar no Hub</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      {/* Rodapé: Pilares de Confiança */}
      <div className="relative z-10 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Local-First & Offline</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span>Dupla Progressão & RPE</span>
        </div>
      </div>
    </div>
  );
};
