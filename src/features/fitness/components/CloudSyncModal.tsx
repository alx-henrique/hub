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
  Key,
  FolderArchive,
  ArrowRight,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalTab = 'connect' | 'setup_id' | 'manual';

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState(() => CloudSyncService.getConfig());
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Se o usuário ainda não colocou um Client ID próprio, abre direto na aba de configuração
  const [activeTab, setActiveTab] = useState<ModalTab>(() => {
    return CloudSyncService.isUsingCustomClientId() ? 'connect' : 'setup_id';
  });

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

  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setClientIdInput(text.trim());
        }
      }
    } catch {
      // Caso o navegador bloqueie leitura automática, o usuário cola normalmente
    }
  };

  const handleSaveClientId = () => {
    const cleanId = clientIdInput.trim();
    if (!cleanId) {
      setStatusMessage({
        text: 'Por favor, cole um Client ID válido antes de salvar.',
        type: 'error',
      });
      return;
    }

    CloudSyncService.setClientId(cleanId);
    setClientIdSaved(true);
    setStatusMessage({
      text: 'Client ID salvo com sucesso! Agora clique em Vincular para conectar sua conta.',
      type: 'success',
    });

    // Direciona imediatamente para a tela de conexão
    setTimeout(() => {
      setClientIdSaved(false);
      setActiveTab('connect');
    }, 1200);
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
        const errorText = err?.message || 'Falha ao autenticar com o Google.';
        setStatusMessage({
          text: errorText,
          type: 'error',
        });

        // Se for erro de client id, sugere ir para a aba de configuração
        if (errorText.toLowerCase().includes('client') || errorText.toLowerCase().includes('oauth')) {
          setActiveTab('setup_id');
        }
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
  const isUsingCustomId = CloudSyncService.isUsingCustomClientId();

  return (
    /* CONTAINER EXTERNO COM SCROLL LIVRE E COMPLETO */
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain flex items-center justify-center p-3 sm:p-4 text-white">
      {/* CARD DO MODAL */}
      <div className="w-full max-w-lg bg-[#141417] rounded-3xl border border-white/10 p-5 sm:p-6 flex flex-col gap-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER COM BOTÃO FECHAR */}
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff1a00] to-orange-500 flex items-center justify-center shadow-lg shadow-red-950/40">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white leading-tight">
                Google Drive & Backup
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sincronize seus treinos e nunca perca dados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* NAVEGAÇÃO POR ABAS NO TOPO (MUITO MAIS FÁCIL E DIRETO) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-zinc-900/90 border border-white/5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('connect')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'connect'
                ? 'bg-white text-zinc-900 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="truncate">1. Conectar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('setup_id')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'setup_id'
                ? 'bg-amber-400 text-black shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="truncate">2. Colocar ID</span>
            {!isUsingCustomId && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-zinc-900 shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span className="truncate">3. Arquivo</span>
          </button>
        </div>

        {/* MENSAGEM DE STATUS / FEEDBACK VISÍVEL */}
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
            <span className="leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 1: CONECTAR COM GOOGLE */}
        {/* ============================================================== */}
        {activeTab === 'connect' && (
          <div className="flex flex-col gap-3.5">
            {isGoogleConnected ? (
              /* CONECTADO */
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {config.user_avatar ? (
                      <img
                        src={config.user_avatar}
                        alt="Avatar"
                        className="w-11 h-11 rounded-xl border border-emerald-500/40 object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-sm">
                        {config.user_name?.charAt(0) || 'G'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">
                          {config.user_name || 'Conta Google'}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Vinculado
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate max-w-[210px]">
                        {config.user_email}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDisconnectGoogle}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    title="Desconectar conta Google"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/5">
                  <span>Última sincronização:</span>
                  <span className="text-zinc-200 font-mono font-medium">
                    {config.last_sync_timestamp
                      ? new Date(config.last_sync_timestamp).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Nenhuma ainda'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleExportDrive}
                    disabled={loading}
                    className="py-3 px-3 rounded-xl bg-[#ff1a00] hover:bg-red-600 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-950/40 transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Salvar Agora</span>
                  </button>
                  <button
                    onClick={handleRestoreDrive}
                    disabled={loading}
                    className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Restaurar do Drive</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DESCONECTADO */
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-2.5">
                  <span className="text-xs font-bold text-white">Google Drive em Tempo Real</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Sincronize todo o seu histórico no seu Google Drive com segurança total e sem nenhum custo de servidor.
                  </p>

                  <button
                    type="button"
                    onClick={handleConnectGoogle}
                    disabled={loading}
                    className="w-full mt-1 py-4 px-4 rounded-2xl font-black text-sm bg-white hover:bg-zinc-100 text-zinc-900 shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.99] cursor-pointer border border-white/20"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-zinc-900" />
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
                    <span>{loading ? 'Conectando...' : 'Vincular Minha Conta Google'}</span>
                  </button>
                </div>

                {!isUsingCustomId && (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-medium">
                      Precisa configurar seu ID do Google?
                    </span>
                    <button
                      onClick={() => setActiveTab('setup_id')}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 text-black font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Colocar ID</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 2: CONFIGURAR / COLAR O CLIENT ID (DIRETO E SEM ROLAGEM) */}
        {/* ============================================================== */}
        {activeTab === 'setup_id' && (
          <div className="flex flex-col gap-3.5">
            {/* CAMPO DE COLAR CLIENT ID COM DESTAQUE MÁXIMO */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/40 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Cole aqui o seu Client ID do Google:
                </label>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Colar da área de transferência
                </button>
              </div>

              <textarea
                rows={3}
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Exemplo: 123456789-abcdef.apps.googleusercontent.com"
                className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-400 resize-none"
              />

              <button
                type="button"
                onClick={handleSaveClientId}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40"
              >
                <span>{clientIdSaved ? '✓ Salvo com Sucesso!' : 'Salvar Client ID e Prosseguir'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* BOTÃO COPIAR URL DO APP */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-1.5">
              <span className="text-[11px] font-bold text-zinc-300">
                Link do seu App para colar no Google Cloud:
              </span>
              <div className="flex items-center justify-between gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                <span className="text-xs font-mono text-zinc-200 truncate">
                  {currentAppOrigin}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrigin}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUrl ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* RESUMO DOS 3 PASSOS */}
            <div className="p-3 rounded-2xl bg-zinc-900/30 border border-white/5 text-[11px] text-zinc-400 flex flex-col gap-1">
              <span className="font-bold text-zinc-300">Lembrete rápido do Google Cloud:</span>
              <p>
                1. No{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline font-semibold inline-flex items-center gap-0.5"
                >
                  console.cloud.google.com <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                clique em <strong>Criar Credenciais &gt; ID do cliente OAuth</strong>.
              </p>
              <p>2. Tipo: <strong>Aplicativo da Web</strong>.</p>
              <p>3. Em <strong>Origens JavaScript autorizadas</strong>, cole o link copiado acima.</p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ABA 3: BACKUP MANUAL OFFLINE (DOWNLOAD/UPLOAD JSON) */}
        {/* ============================================================== */}
        {activeTab === 'manual' && (
          <div className="flex flex-col gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col gap-2">
              <span className="text-xs font-bold text-white">Backup Manual em Arquivo (.json)</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Não quer mexer no Google Cloud agora? Baixe seu arquivo de treino com 1 toque e salve na pasta do Google Drive do seu computador ou celular.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={handleDirectDownload}
                  className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Baixar Backup</span>
                </button>
                <label className="py-3 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/5 transition-all active:scale-95 cursor-pointer">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Restaurar Backup</span>
                  <input type="file" accept=".json" onChange={handleDirectUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
