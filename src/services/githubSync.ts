import { InventoryItem, StoreSettings } from '../types';

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
}

export function getGitHubSyncConfig(): GitHubSyncConfig {
  return {
    token: localStorage.getItem(STORAGE_KEYS.GITHUB_TOKEN) || '',
    owner: localStorage.getItem(STORAGE_KEYS.GITHUB_OWNER) || 'swkknk1',
    repo: localStorage.getItem(STORAGE_KEYS.GITHUB_REPO) || 'swkknk',
    branch: localStorage.getItem(STORAGE_KEYS.GITHUB_BRANCH) || 'main',
    autoSync: localStorage.getItem(STORAGE_KEYS.GITHUB_AUTO_SYNC) !== 'false',
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
