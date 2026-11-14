import React, { useState } from 'react';
import { CloudSyncService } from '../services/cloudSyncService';
import {
  Cloud,
  Download,
  Upload,
  X,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Settings2,
  Copy,
  ExternalLink,
  LogOut,
  HelpCircle,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(() => CloudSyncService.getConfig());
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(() => CloudSyncService.getClientId());
  const [clientIdSaved, setClientIdSaved] = useState(false);

  if (!isOpen) return null;

  const currentAppOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentAppOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleSaveClientId = () => {
    CloudSyncService.setClientId(clientIdInput);
    setClientIdSaved(true);
    setStatusMessage({
      text: 'Client ID do Google salvo com sucesso! Agora clique em "Conectar Conta Google".',
      type: 'success',
    });
    setTimeout(() => setClientIdSaved(false), 3000);
  };

  const handleConnectGoogle = () => {
    setLoading(true);
    setStatusMessage({
      text: 'Abrindo autenticação oficial do Google...',
      type: 'info',
    });

    CloudSyncService.requestGoogleDriveToken(
      async (token, userInfo) => {
        setStatusMessage({
          text: `Conectado como ${userInfo?.name || 'sua conta'}! Salvando backup inicial...`,
          type: 'info',
        });
        const res = await CloudSyncService.uploadToGoogleDrive(token);
        setLoading(false);
        setConfig(CloudSyncService.getConfig());
        setStatusMessage({
          text: res.success
            ? `Conta Google vinculada com sucesso! Backup salvo no seu Drive.`
            : res.message,
          type: res.success ? 'success' : 'error',
        });
      },
      (err) => {
        setLoading(false);
        setStatusMessage({
          text:
            err?.message ||
            'Não foi possível conectar com o Google no momento. Verifique a configuração do Client ID.',
          type: 'error',
        });
      }
    );
  };

  const handleDisconnectGoogle = () => {
    if (confirm('Deseja desconectar sua conta Google deste dispositivo? Seus dados locais serão preservados.')) {
      CloudSyncService.disconnectGoogle();
      setConfig(CloudSyncService.getConfig());
      setStatusMessage({ text: 'Conta Google desconectada com sucesso.', type: 'info' });
    }
  };

  const handleExportDrive = async () => {
    setLoading(true);
    setStatusMessage({ text: 'Enviando backup atualizado para o Google Drive...', type: 'info' });
    const res = await CloudSyncService.uploadToGoogleDrive();
    setLoading(false);
    setStatusMessage({ text: res.message, type: res.success ? 'success' : 'error' });
    if (res.success) {
      setConfig(CloudSyncService.getConfig());
    }
  };

  const handleRestoreDrive = async () => {
    if (!confirm('Deseja restaurar o backup do Google Drive? Os dados locais serão atualizados com os dados da nuvem.')) {
      return;
    }
    setLoading(true);
    setStatusMessage({ text: 'Buscando backup no seu Google Drive...', type: 'info' });
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
    setStatusMessage({
      text: 'Arquivo de backup (.json) baixado! Você pode salvá-lo no seu Google Drive.',
      type: 'success',
    });
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
          alert('Backup restaurado com sucesso! Atualizando o app...');
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
      <div className="w-full max-w-lg bg-[#141417] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff1a00] to-orange-500 flex items-center justify-center shadow-lg shadow-red-950/40">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                Vincular ao Google
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sincronização em nuvem e segurança de dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status do Último Backup */}
        <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs">
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

        {/* CARD PRINCIPAL: GOOGLE DRIVE (CONECTADO OU DESCONECTADO) */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-3">
          {isGoogleConnected ? (
            /* CONECTADO COM SUCESSO */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {config.user_avatar ? (
                    <img
                      src={config.user_avatar}
                      alt="Avatar"
                      className="w-10 h-10 rounded-xl border border-emerald-500/30 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm">
                      {config.user_name?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {config.user_name || 'Conta Google'}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Vinculado
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                      {config.user_email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDisconnectGoogle}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                  title="Desconectar conta Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 leading-snug">
                ⚡ Sincronização automática ativa: todos os seus treinos concluídos são salvos silenciosamente no seu Google Drive.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleExportDrive}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-[#ff1a00] hover:bg-red-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 transition-all active:scale-95 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Salvar Agora</span>
                </button>
                <button
                  onClick={handleRestoreDrive}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Restaurar do Drive</span>
                </button>
              </div>
            </div>
          ) : (
            /* DESCONECTADO: BOTÃO COM 1 CLIQUE */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Google Drive em Nuvem</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold uppercase">
                  Desconectado
                </span>
              </div>

              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Vincule sua conta Google para nunca perder seus treinos, histórico de cargas e fotos de evolução mesmo trocando de celular ou navegador.
              </p>

              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-extrabold text-xs bg-white hover:bg-zinc-100 text-zinc-900 shadow-xl flex items-center justify-center gap-2.5 transition-all active:scale-95 cursor-pointer border border-white/20"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
                ) : (
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
                )}
                <span>{loading ? 'Conectando ao Google...' : 'Vincular Minha Conta Google'}</span>
              </button>
            </div>
          )}
        </div>

        {/* MENSAGEM DE STATUS / FEEDBACK */}
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

        {/* GUIA DE CONFIGURAÇÃO DO GOOGLE (ACCORDION INTUITIVO) */}
        <div className="border border-white/5 rounded-2xl bg-zinc-900/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowConfigGuide(!showConfigGuide)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" />
              <span>Configurar Google Client ID (Guia Rápido)</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              {showConfigGuide ? '▲ Ocultar' : '▼ Ver'}
            </span>
          </button>

          {showConfigGuide && (
            <div className="p-4 pt-1 border-t border-white/5 flex flex-col gap-3 text-xs text-zinc-300">
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                O Google exige que qualquer Web App que acesse o Google Drive registre sua URL no console oficial (é gratuito e leva 2 minutos):
              </p>

              {/* Passo 1: Copiar URL do App */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Passo 1: Copie o link do seu app
                </span>
                <div className="flex items-center justify-between gap-2 bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-white/5">
                  <span className="text-[11px] font-mono text-zinc-200 truncate">
                    {currentAppOrigin}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOrigin}
                    className="flex-shrink-0 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedUrl ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Passo 2: Google Cloud Console */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Passo 2: No Google Cloud Console
                </span>
                <ol className="list-decimal list-inside text-[11px] text-zinc-400 space-y-1">
                  <li>
                    Acesse{' '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#ff3322] hover:underline inline-flex items-center gap-0.5"
                    >
                      console.cloud.google.com <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </li>
                  <li>Crie ou selecione um projeto e ative a <strong>Google Drive API</strong>.</li>
                  <li>Clique em <strong>Criar Credenciais &gt; ID do cliente OAuth</strong> (Tipo: <em>Aplicativo da Web</em>).</li>
                  <li>Em <strong>Origens JavaScript autorizadas</strong>, cole a URL copiada acima.</li>
                </ol>
              </div>

              {/* Passo 3: Colar o Client ID */}
              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Passo 3: Cole o Client ID gerado aqui
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="ex: 123456789-xyz.apps.googleusercontent.com"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveClientId}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs transition-colors cursor-pointer"
                  >
                    {clientIdSaved ? 'Salvo!' : 'Salvar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OPÇÃO 2: BACKUP MANUAL OFFLINE (SEMPRE DISPONÍVEL) */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Backup Manual em Arquivo (.json)</span>
            <span className="text-[10px] text-zinc-500 font-medium">100% Offline</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Se preferir não configurar a nuvem agora, baixe um arquivo seguro com 1 clique para guardar no seu computador ou celular.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-0.5">
            <button
              onClick={handleDirectDownload}
              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Baixar Backup</span>
            </button>
            <label className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Restaurar Backup</span>
              <input type="file" accept=".json" onChange={handleDirectUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
