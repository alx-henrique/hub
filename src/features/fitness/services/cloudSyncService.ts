/**
 * Serviço de Sincronização e Backup em Nuvem com Google Drive
 * Utiliza o Google Identity Services (GIS) oficial para login e token automático
 */

export interface CloudSyncConfig {
  google_access_token?: string;
  user_email?: string;
  user_avatar?: string;
  user_name?: string;
  last_sync_timestamp?: string;
  auto_sync_enabled: boolean;
}

const CLOUD_CONFIG_KEY = 'ph_cloud_sync_config_v1';
const BACKUP_FILENAME = 'personal_hub_backup.json';

// Client ID público padrão para o Personal HUB
export const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '812493018249-personalhubdemo.apps.googleusercontent.com';

export class CloudSyncService {
  static getConfig(): CloudSyncConfig {
    try {
      const data = localStorage.getItem(CLOUD_CONFIG_KEY);
      return data ? JSON.parse(data) : { auto_sync_enabled: true };
    } catch {
      return { auto_sync_enabled: true };
    }
  }

  static saveConfig(config: CloudSyncConfig) {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  }

  /**
   * Dispara o fluxo nativo do Google OAuth2 com 1 clique para obter token com acesso ao Drive
   */
  static requestGoogleDriveToken(
    onSuccess: (token: string, userInfo?: { name?: string; email?: string; picture?: string }) => void,
    onError: (err: any) => void
  ) {
    const google = (window as any).google;

    if (!google?.accounts?.oauth2) {
      onError(new Error('Serviço do Google ainda carregando. Aguarde 2 segundos e tente novamente.'));
      return;
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: any) => {
          if (response.error) {
            onError(new Error(response.error_description || response.error));
            return;
          }

          if (response.access_token) {
            const token = response.access_token;

            // Busca os dados do perfil do usuário no Google
            let profileData = undefined;
            try {
              const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (userRes.ok) {
                profileData = await userRes.json();
              }
            } catch {
              // segue normalmente se a chamada de perfil falhar
            }

            const current = this.getConfig();
            current.google_access_token = token;
            if (profileData) {
              current.user_name = profileData.name;
              current.user_email = profileData.email;
              current.user_avatar = profileData.picture;
            }
            this.saveConfig(current);

            onSuccess(token, profileData);
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      onError(err);
    }
  }

  /**
   * Compila todos os dados do Personal HUB salvos no navegador em um JSON unificado
   */
  static getFullExportData(): Record<string, any> {
    const backupData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('ph_') || key === 'ph_username' || key === 'ph_logged_in')) {
        backupData[key] = localStorage.getItem(key);
      }
    }
    return backupData;
  }

  /**
   * Restaura os dados importados no localStorage
   */
  static restoreData(backupData: Record<string, any>): boolean {
    try {
      Object.entries(backupData).forEach(([k, v]) => {
        if (typeof v === 'string') {
          localStorage.setItem(k, v);
        } else {
          localStorage.setItem(k, JSON.stringify(v));
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Faz o upload para o Google Drive do usuário usando token de acesso
   */
  static async uploadToGoogleDrive(accessToken?: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = accessToken || this.getConfig().google_access_token;
      if (!token) {
        return { success: false, message: 'Nenhuma conta Google conectada. Clique em "Conectar Google".' };
      }

      const content = JSON.stringify(this.getFullExportData(), null, 2);
      const boundary = 'personal_hub_boundary_separator';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      // 1. Procura se o arquivo já existe no Drive
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id, name)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!listRes.ok) {
        throw new Error('Sessão do Google expirada. Conecte novamente sua conta.');
      }

      const listData = await listRes.json();
      const existingFile = listData.files && listData.files.length > 0 ? listData.files[0] : null;

      const metadata = {
        name: BACKUP_FILENAME,
        mimeType: 'application/json',
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        content +
        closeDelim;

      let uploadRes;
      if (existingFile) {
        uploadRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          }
        );
      } else {
        uploadRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          }
        );
      }

      if (uploadRes.ok) {
        const config = this.getConfig();
        config.last_sync_timestamp = new Date().toISOString();
        config.google_access_token = token;
        this.saveConfig(config);
        return { success: true, message: 'Backup salvo com sucesso no seu Google Drive!' };
      } else {
        const err = await uploadRes.json();
        return { success: false, message: err.error?.message || 'Erro ao salvar no Drive.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro de conexão com o Google Drive.' };
    }
  }

  /**
   * Baixa o backup mais recente do Google Drive e restaura
   */
  static async restoreFromGoogleDrive(accessToken?: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = accessToken || this.getConfig().google_access_token;
      if (!token) {
        return { success: false, message: 'Nenhuma conta Google conectada.' };
      }

      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id, name, modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!listRes.ok) {
        throw new Error('Falha ao autenticar no Google Drive');
      }

      const listData = await listRes.json();
      if (!listData.files || listData.files.length === 0) {
        return { success: false, message: 'Nenhum backup encontrado no seu Google Drive.' };
      }

      const fileId = listData.files[0].id;
      const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!downloadRes.ok) {
        throw new Error('Erro ao baixar o arquivo do Google Drive');
      }

      const backupJson = await downloadRes.json();
      const restored = this.restoreData(backupJson);

      if (restored) {
        const config = this.getConfig();
        config.last_sync_timestamp = new Date().toISOString();
        this.saveConfig(config);
        return { success: true, message: 'Dados restaurados com sucesso do Google Drive!' };
      } else {
        return { success: false, message: 'Formato de backup inválido no Google Drive.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro ao restaurar do Google Drive' };
    }
  }
}
