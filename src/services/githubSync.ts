import { InventoryItem, StoreSettings } from '../types';
import {
  getEmbeddedDecryptedToken,
  isEmbeddedTokenActive,
  encryptToken,
  decryptToken,
  EMBEDDED_ENCRYPTED_TOKEN,
} from '../utils/tokenCrypto';

export { encryptToken, decryptToken, EMBEDDED_ENCRYPTED_TOKEN, isEmbeddedTokenActive };

const STORAGE_KEYS = {
  GITHUB_TOKEN: 'store_admin_gh_token',
  GITHUB_OWNER: 'store_admin_gh_owner',
  GITHUB_REPO: 'store_admin_gh_repo',
  GITHUB_BRANCH: 'store_admin_gh_branch',
  GITHUB_AUTO_SYNC: 'store_admin_gh_auto_sync',
};

export interface GitHubSyncConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  autoSync: boolean;
  isEmbedded?: boolean;
}

export function getGitHubSyncConfig(): GitHubSyncConfig {
  const localToken = localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN) || '';
  const embeddedToken = getEmbeddedDecryptedToken();
  const effectiveToken = localToken.trim() || embeddedToken;

  return {
    token: effectiveToken,
    owner: localStorage.getItem(STORAGE_KEYS.GITHUB_OWNER) || 'swkknk1',
    repo: localStorage.getItem(STORAGE_KEYS.GITHUB_REPO) || 'swkknk',
    branch: localStorage.getItem(STORAGE_KEYS.GITHUB_BRANCH) || 'main',
    autoSync: localStorage.getItem(STORAGE_KEYS.GITHUB_AUTO_SYNC) !== 'false',
    isEmbedded: !localToken.trim() && isEmbeddedTokenActive(),
  };
}

export function saveGitHubSyncConfig(config: Partial<GitHubSyncConfig>): void {
  if (config.token !== undefined) {
    if (config.token.trim()) {
      localStorage.setItem(STORAGE_KEYS.GITHUB_TOKEN, config.token.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.GITHUB_TOKEN);
    }
  }
  if (config.owner !== undefined) {
    localStorage.setItem(STORAGE_KEYS.GITHUB_OWNER, config.owner.trim() || 'swkknk1');
  }
  if (config.repo !== undefined) {
    localStorage.setItem(STORAGE_KEYS.GITHUB_REPO, config.repo.trim() || 'swkknk');
  }
  if (config.branch !== undefined) {
    localStorage.setItem(STORAGE_KEYS.GITHUB_BRANCH, config.branch.trim() || 'main');
  }
  if (config.autoSync !== undefined) {
    localStorage.setItem(STORAGE_KEYS.GITHUB_AUTO_SYNC, config.autoSync ? 'true' : 'false');
  }
}

/**
 * Robust UTF-8 safe Base64 encoder for browser environments
 */
function utf8ToBase64(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

export function generateStoreDataTsContent(items: InventoryItem[], settings: StoreSettings): string {
  const safeSettings = { ...settings };
  delete safeSettings.adminPassword;
  if (safeSettings.smtpConfig) {
    safeSettings.smtpConfig = { ...safeSettings.smtpConfig, pass: '' };
  }

  return `import { InventoryItem, StoreSettings } from '../types';

export const INITIAL_SETTINGS: StoreSettings = ${JSON.stringify(safeSettings, null, 2)};

export const INITIAL_ITEMS: InventoryItem[] = ${JSON.stringify(items, null, 2)};
`;
}

/**
 * Direct GitHub REST API integration:
 * Commits storeData.ts directly to the repository on GitHub,
 * which triggers Netlify to automatically build and deploy across all devices!
 */
export async function syncStoreDataToGitHub(
  items: InventoryItem[],
  settings: StoreSettings,
  commitMessage = '更新商品与出清设置 [店主在线发布]'
): Promise<{ success: boolean; message: string; commitUrl?: string }> {
  const config = getGitHubSyncConfig();
  if (!config.token.trim()) {
    return {
      success: false,
      message: '尚未配置 GitHub 访问令牌 (Token)，请在下方填入以开启全网自动同步。',
    };
  }

  const owner = config.owner || 'swkknk1';
  const repo = config.repo || 'swkknk';
  const branch = config.branch || 'main';
  const filePath = 'src/data/storeData.ts';

  const headers = {
    Authorization: `Bearer ${config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    // 1. Fetch current file SHA if it exists
    let currentSha: string | undefined;
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );

    if (getRes.ok) {
      const data = await getRes.json();
      currentSha = data.sha;
    } else if (getRes.status === 401) {
      return {
        success: false,
        message: 'GitHub Token 无效或已过期，请核对并重新生成 Token (需开启 repo 权限)。',
      };
    } else if (getRes.status === 404) {
      // File might not exist yet, which is fine
    }

    // 2. Prepare new file content encoded in UTF-8 Base64
    const newTsContent = generateStoreDataTsContent(items, settings);
    const base64Content = utf8ToBase64(newTsContent);

    // 3. Put file to GitHub
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          sha: currentSha,
          branch,
        }),
      }
    );

    const putData = await putRes.json().catch(() => ({}));

    if (putRes.ok) {
      const commitUrl = putData?.commit?.html_url || `https://github.com/${owner}/${repo}/commits/${branch}`;
      return {
        success: true,
        message: '已成功提交至 GitHub 仓库！Netlify 已自动感知并在云端打包，预计 30~50 秒后全网生效。',
        commitUrl,
      };
    }

    if (putRes.status === 401) {
      return {
        success: false,
        message: 'GitHub 认证失败：请确认 Token 具备读写仓库 (Contents: Read and write) 的权限。',
      };
    }

    if (putRes.status === 409) {
      return {
        success: false,
        message: 'GitHub 发生版本冲突，请稍候再试或刷新重试。',
      };
    }

    return {
      success: false,
      message: putData.message || `提交至 GitHub 失败 (HTTP ${putRes.status})`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || '网络连接失败，请检查网络是否能连接 api.github.com',
    };
  }
}

/**
 * Robust UTF-8 safe Base64 decoder for browser environments
 */
export function base64ToUtf8(base64: string): string {
  const clean = base64.replace(/\s/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

/**
 * Extracts INITIAL_SETTINGS and INITIAL_ITEMS from storeData.ts source text
 */
export function parseStoreDataTs(tsContent: string): { items: InventoryItem[]; settings: Partial<StoreSettings> } | null {
  try {
    // 1. Extract INITIAL_SETTINGS
    const settingsIdx = tsContent.indexOf('INITIAL_SETTINGS');
    let settings: any = null;
    if (settingsIdx !== -1) {
      const eqIdx = tsContent.indexOf('=', settingsIdx);
      const braceStart = tsContent.indexOf('{', eqIdx !== -1 ? eqIdx : settingsIdx);
      if (braceStart !== -1) {
        let depth = 0;
        let inString: string | null = null;
        let escaped = false;
        let braceEnd = -1;
        for (let i = braceStart; i < tsContent.length; i++) {
          const char = tsContent[i];
          if (escaped) {
            escaped = false;
            continue;
          }
          if (char === '\\') {
            escaped = true;
            continue;
          }
          if (inString) {
            if (char === inString) {
              inString = null;
            }
            continue;
          }
          if (char === '"' || char === "'") {
            inString = char;
            continue;
          }
          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0) {
              braceEnd = i;
              break;
            }
          }
        }
        if (braceEnd !== -1) {
          const jsonStr = tsContent.slice(braceStart, braceEnd + 1);
          settings = JSON.parse(jsonStr);
        }
      }
    }

    // 2. Extract INITIAL_ITEMS
    const itemsIdx = tsContent.indexOf('INITIAL_ITEMS');
    let items: any = null;
    if (itemsIdx !== -1) {
      const eqIdx = tsContent.indexOf('=', itemsIdx);
      const bracketStart = tsContent.indexOf('[', eqIdx !== -1 ? eqIdx : itemsIdx);
      if (bracketStart !== -1) {
        let depth = 0;
        let inString: string | null = null;
        let escaped = false;
        let bracketEnd = -1;
        for (let i = bracketStart; i < tsContent.length; i++) {
          const char = tsContent[i];
          if (escaped) {
            escaped = false;
            continue;
          }
          if (char === '\\') {
            escaped = true;
            continue;
          }
          if (inString) {
            if (char === inString) {
              inString = null;
            }
            continue;
          }
          if (char === '"' || char === "'") {
            inString = char;
            continue;
          }
          if (char === '[') {
            depth++;
          } else if (char === ']') {
            depth--;
            if (depth === 0) {
              bracketEnd = i;
              break;
            }
          }
        }
        if (bracketEnd !== -1) {
          const jsonStr = tsContent.slice(bracketStart, bracketEnd + 1);
          items = JSON.parse(jsonStr);
        }
      }
    }

    return {
      items: Array.isArray(items) ? items : [],
      settings: settings || {},
    };
  } catch (err) {
    console.error('Failed to parse storeData.ts:', err);
    return null;
  }
}

/**
 * Direct GitHub REST API integration:
 * Pulls storeData.ts from GitHub main branch down into browser localStorage
 * and optionally invokes local backend persistence if available.
 */
export async function pullStoreDataFromGitHub(): Promise<{
  success: boolean;
  message: string;
  items?: InventoryItem[];
  settings?: StoreSettings;
  commitSha?: string;
}> {
  const config = getGitHubSyncConfig();
  const owner = config.owner || 'swkknk1';
  const repo = config.repo || 'swkknk';
  const branch = config.branch || 'main';
  const filePath = 'src/data/storeData.ts';

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (config.token.trim()) {
    headers['Authorization'] = `Bearer ${config.token.trim()}`;
  }

  try {
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}&_t=${Date.now()}`,
      { headers }
    );

    if (getRes.status === 404) {
      return {
        success: false,
        message: `在 GitHub 仓库 (${owner}/${repo} 分支 ${branch}) 中未找到 ${filePath} 文件。`,
      };
    }

    if (getRes.status === 401) {
      return {
        success: false,
        message: 'GitHub 访问未授权：若仓库为私有，请在后台设置中配置有效的 GitHub Token (需开启 repo 权限)。',
      };
    }

    if (!getRes.ok) {
      const errData = await getRes.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || `从 GitHub 获取数据失败 (HTTP ${getRes.status})`,
      };
    }

    const data = await getRes.json();
    if (!data.content) {
      return {
        success: false,
        message: 'GitHub 返回的文件内容为空。',
      };
    }

    const tsContent = base64ToUtf8(data.content);
    const parsed = parseStoreDataTs(tsContent);

    if (!parsed) {
      return {
        success: false,
        message: '解析 GitHub storeData.ts 数据失败，格式可能不规范。',
      };
    }

    const { items, settings } = parsed;

    // Merge settings with existing local settings
    const existingSettingsStr = localStorage.getItem('inventory_store_settings');
    let mergedSettings: StoreSettings;
    try {
      const existingSettings = existingSettingsStr ? JSON.parse(existingSettingsStr) : {};
      mergedSettings = { ...existingSettings, ...settings };
    } catch {
      mergedSettings = settings as StoreSettings;
    }

    // Update browser localStorage so current session immediately reads new data
    try {
      localStorage.setItem('inventory_store_items', JSON.stringify(items));
      localStorage.setItem('inventory_store_settings', JSON.stringify(mergedSettings));
    } catch (e) {
      console.warn('Could not cache github synced items in localStorage:', e);
    }

    // If local Node server is running, also persist to local files on disk
    try {
      await fetch('/api/persist-to-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': sessionStorage.getItem('admin_session_token') || localStorage.getItem('admin_session_token') || '',
        },
        body: JSON.stringify({ items, settings: mergedSettings }),
      });
    } catch {
      // Static host or offline - localStorage update is sufficient
    }

    return {
      success: true,
      message: `已成功从 GitHub 仓库拉取线上最新数据（包含 ${items.length} 件在售商品）！`,
      items,
      settings: mergedSettings,
      commitSha: data.sha,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || '网络连接失败，请检查是否能连接 api.github.com',
    };
  }
}

