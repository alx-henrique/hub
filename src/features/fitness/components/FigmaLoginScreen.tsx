import React, { useState } from 'react';
import { Dumbbell, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { CloudSyncService } from '../services/cloudSyncService';

interface FigmaLoginScreenProps {
  onLoginSuccess: (name: string) => void;
}

export const FigmaLoginScreen: React.FC<FigmaLoginScreenProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLoginSuccess(name.trim());
    }
  };

  const handleGoogleLogin = () => {
    setErrorMessage('');
    setIsGoogleLoading(true);

    CloudSyncService.requestGoogleDriveToken(
      (token, userInfo) => {
        setIsGoogleLoading(false);
        const resolvedName = userInfo?.name || 'Atleta';
        // Tenta restaurar backup pré-existente do Google Drive
        CloudSyncService.restoreFromGoogleDrive(token).catch(() => {});
        onLoginSuccess(resolvedName);
      },
      (err) => {
        setIsGoogleLoading(false);
        // Se a pessoa fechar o popup ou der erro de rede, exibe mensagem clara
        setErrorMessage(
          err?.message?.includes('popup_closed')
            ? 'Login com Google cancelado.'
            : 'Não foi possível conectar ao Google no momento. Você pode entrar digitando seu nome abaixo!'
        );
      }
    );
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
      <div className="flex flex-col gap-3 relative z-10 my-auto py-6">
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
          Acompanhe sua evolução corporal, hipertrofia contínua e sincronize seus treinos diretamente com o Google Drive.
        </p>

        {/* Botão de 1 Clique: Entrar com o Google */}
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm bg-white hover:bg-zinc-100 text-zinc-900 shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 border border-white/20"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Conectando...' : 'Entrar com o Google'}</span>
          </button>

          {errorMessage && (
            <p className="text-[11px] text-amber-400 font-medium text-center bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>
        </div>

        {/* Formulário / Acesso Rápido com Nome */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-zinc-400">Como prefere ser chamado?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              className="w-full mt-1.5 px-4 py-3 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-sm tracking-wide shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 group ${
              name.trim()
                ? 'bg-[#ff1a00] text-white shadow-red-950/60 hover:bg-red-600'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
            }`}
          >
            <span>Entrar sem Conta</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </div>

      {/* Rodapé: Pilares de Confiança */}
      <div className="relative z-10 pt-4 border-t border-white/5 grid grid-cols-2 gap-4 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Nuvem Google Drive</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span>Dupla Progressão & RPE</span>
        </div>
      </div>
    </div>
  );
};
