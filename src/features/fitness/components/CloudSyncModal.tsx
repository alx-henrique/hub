import React, { useState } from 'react';
import { CloudSyncService } from '../services/cloudSyncService';
import { Cloud, Download, Upload, X, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(() => CloudSyncService.getConfig());
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConnectGoogle = () => {
    setLoading(true);
    setStatusMessage({ text: 'Abrindo autenticação oficial do Google...', type: 'info' });

    CloudSyncService.requestGoogleDriveToken(
      async (token, userInfo) => {
        setStatusMessage({ text: `Conectado como ${userInfo?.name || 'sua conta'}! Salvando backup...`, type: 'info' });
        const res = await CloudSyncService.uploadToGoogleDrive(token);
        setLoading(false);
        setConfig(CloudSyncService.getConfig());
        setStatusMessage({ text: res.message, type: res.success ? 'success' : 'error' });
      },
      (err) => {
        setLoading(false);
        setStatusMessage({
          text: err?.message || 'Não foi possível conectar com o Google no momento.',
          type: 'error',
        });
      }
    );
  };

  const handleExportDrive = async () => {
    setLoading(true);
    setStatusMessage({ text: 'Enviando backup para o Google Drive...', type: 'info' });
    const res = await CloudSyncService.uploadToGoogleDrive();
    setLoading(false);
    setStatusMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) {
      setConfig(CloudSyncService.getConfig());
    }
  };

  const handleRestoreDrive = async () => {
    if (!confirm('Deseja restaurar o backup do Google Drive? Os dados locais serão substituídos.')) {
      return;
    }
    setLoading(true);
    setStatusMessage({ text: 'Buscando backup no Google Drive...', type: 'info' });
    const res = await CloudSyncService.restoreFromGoogleDrive();
    setLoading(false);
    setStatusMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) {
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleDirectDownload = () => {
    const data = CloudSyncService.getFullExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ text: 'Arquivo de backup baixado no seu dispositivo!', type: 'success' });
  };

  const handleDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const ok = CloudSyncService.restoreData(parsed);
        if (ok) {
          alert('Backup restaurado com sucesso!');
          window.location.reload();
        } else {
          setStatusMessage({ text: 'Arquivo de backup corrompido ou inválido.', type: 'error' });
        }
      } catch {
        setStatusMessage({ text: 'Falha ao processar o arquivo JSON.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const isGoogleConnected = Boolean(config.google_access_token);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 text-white">
      <div className="w-full max-w-md bg-[#18181b] rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff1a00] to-orange-500 flex items-center justify-center shadow-lg shadow-red-950/40">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Nuvem & Segurança</h3>
              <p className="text-[11px] text-zinc-400">Sincronização com Google Drive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status de Sincronização */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-300 font-medium">Último backup:</span>
          </div>
          <span className="text-zinc-400 font-mono text-[11px]">
            {config.last_sync_timestamp
              ? new Date(config.last_sync_timestamp).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Nunca sincronizado'}
          </span>
        </div>

        {/* Opção 1: Google Drive com 1 Clique */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Google Drive Automático</span>
              {isGoogleConnected ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Conectado
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold uppercase">
                  Desconectado
                </span>
              )}
            </div>
          </div>

          {config.user_email && (
            <p className="text-[11px] text-zinc-400">
              Conta ativa: <span className="text-zinc-200 font-semibold">{config.user_email}</span>
            </p>
          )}

          {!isGoogleConnected ? (
            <button
              onClick={handleConnectGoogle}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-white hover:bg-zinc-100 text-zinc-900 shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>{loading ? 'Conectando...' : 'Conectar Conta Google com 1 Clique'}</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleExportDrive}
                disabled={loading}
                className="py-3 px-3 rounded-xl bg-[#ff1a00] hover:bg-red-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Salvar no Drive</span>
              </button>
              <button
                onClick={handleRestoreDrive}
                disabled={loading}
                className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Restaurar do Drive</span>
              </button>
            </div>
          )}
        </div>

        {/* Opção 2: Backup Manual Rápido (Offline & Local) */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-2.5">
          <span className="text-xs font-bold text-white">Backup Manual em Arquivo (.json)</span>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Baixe um arquivo seguro no celular ou restaure treinos antigos offline.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleDirectDownload}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar Arquivo</span>
            </button>
            <label className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Carregar Arquivo</span>
              <input type="file" accept=".json" onChange={handleDirectUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Mensagem de Feedback */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                : 'bg-zinc-900 border border-white/10 text-zinc-300'
            }`}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" /> : null}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
