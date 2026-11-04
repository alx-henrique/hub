import React, { useState } from 'react';
import { CloudSyncService } from '../services/cloudSyncService';
import { Cloud, Download, Upload, Check, X, ShieldCheck, RefreshCw, Key, HelpCircle } from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(() => CloudSyncService.getConfig());
  const [tokenInput, setTokenInput] = useState(config.google_access_token || '');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);

  if (!isOpen) return null;

  const handleExportDrive = async () => {
    if (!tokenInput.trim()) {
      setStatusMessage({ text: 'Informe seu Token OAuth do Google Drive para prosseguir.', type: 'error' });
      return;
    }
    setLoading(true);
    setStatusMessage({ text: 'Conectando ao Google Drive e enviando backup...', type: 'info' });
    const res = await CloudSyncService.uploadToGoogleDrive(tokenInput.trim());
    setLoading(false);
    setStatusMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) {
      setConfig(CloudSyncService.getConfig());
    }
  };

  const handleRestoreDrive = async () => {
    if (!tokenInput.trim()) {
      setStatusMessage({ text: 'Informe seu Token OAuth do Google Drive para prosseguir.', type: 'error' });
      return;
    }
    if (!confirm('Deseja restaurar o backup do Google Drive? Os dados locais serão substituídos.')) {
      return;
    }
    setLoading(true);
    setStatusMessage({ text: 'Buscando backup no Google Drive...', type: 'info' });
    const res = await CloudSyncService.restoreFromGoogleDrive(tokenInput.trim());
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
              <p className="text-[11px] text-zinc-400">Backup silencioso e sincronização</p>
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
            <span className="text-zinc-300 font-medium">Último backup salvo:</span>
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

        {/* Opção 1: Google Drive */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Google Drive Sync</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                Em Nuvem
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTokenHelp(!showTokenHelp)}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Como conectar?</span>
            </button>
          </div>

          {showTokenHelp && (
            <div className="p-3 rounded-xl bg-zinc-800/80 border border-white/5 text-[11px] text-zinc-300 leading-relaxed flex flex-col gap-1.5">
              <p>
                <strong>Para sincronizar sem custo com seu Google Drive:</strong>
              </p>
              <p>
                1. Você pode colar seu token OAuth gerado no Google Cloud ou Playground do Google Drive API (com escopo <code>drive.file</code>).
              </p>
              <p>
                2. O arquivo será criado na sua conta como <code>personal_hub_backup.json</code> acessível apenas por você.
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <label className="text-[11px] font-semibold">Google Access Token (OAuth2):</label>
            </div>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Cole seu token aqui..."
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-red-500"
            />
          </div>

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
        </div>

        {/* Opção 2: Backup Manual Rápido (Offline & Local) */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-2.5">
          <span className="text-xs font-bold text-white">Backup Manual em Arquivo</span>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Baixe um arquivo JSON no celular ou restaure de um backup antigo sem precisar de internet.
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
