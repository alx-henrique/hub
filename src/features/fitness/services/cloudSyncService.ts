/**
 * Serviço de Sincronização e Backup em Nuvem
 * Suporta Google Drive (REST API v3 com OAuth2 implicit token / picker)
 * e Webhook / Nuvem JSON segura sem backend complexo.
 */

export interface CloudSyncConfig {
  google_access_token?: string;
  last_sync_timestamp?: string;
  auto_sync_enabled: boolean;
}

const CLOUD_CONFIG_KEY = 'ph_cloud_sync_config_v1';
const BACKUP_FILENAME = 'personal_hub_backup.json';

export class CloudSyncService {
  static getConfig(): CloudSyncConfig {
    try {
      const data = localStorage.getItem(CLOUD_CONFIG_KEY);
      return data ? JSON.parse(data) : { auto_sync_enabled: false };
    } catch {
      return { auto_sync_enabled: false };
    }
  }

  static saveConfig(config: CloudSyncConfig) {
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
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
  static async uploadToGoogleDrive(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const content = JSON.stringify(this.getFullExportData(), null, 2);
      const boundary = 'foo_bar_baz';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      // 1. Procura se o arquivo já existe no Drive
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id, name)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!listRes.ok) {
        throw new Error('Falha de autenticação com o Google Drive');
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
        // Atualiza arquivo existente
        uploadRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          }
        );
      } else {
        // Cria novo arquivo no Drive
        uploadRes = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          }
        );
      }

      if (uploadRes.ok) {
        const config = this.getConfig();
        config.last_sync_timestamp = new Date().toISOString();
        config.google_access_token = accessToken;
        this.saveConfig(config);
        return { success: true, message: 'Backup salvo no Google Drive com sucesso!' };
      } else {
        const err = await uploadRes.json();
        return { success: false, message: err.error?.message || 'Erro ao enviar para o Drive' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro de conexão com o Google Drive' };
    }
  }

  /**
   * Baixa o backup mais recente do Google Drive e restaura
   */
  static async restoreFromGoogleDrive(accessToken: string): Promise<{ success: boolean; message: string }> {
    try {
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false&fields=files(id, name, modifiedTime)`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
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
        headers: { Authorization: `Bearer ${accessToken}` },
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
