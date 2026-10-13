import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const RUNTIME_BUNDLE_PATH = path.join(ROOT_DIR, 'src', 'runtime', 'agy-skin-i18n-runtime.js');

export const PATCH_MARKER_START = '/* === AGY_SKIN_I18N_PATCH_START === */';
export const PATCH_MARKER_END = '/* === AGY_SKIN_I18N_PATCH_END === */';

/**
 * 计算文件的 SHA-256 校验值
 */
export function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * 自动探测本机安装的 Antigravity 2.0 与 Antigravity IDE 路径
 */
export function detectAntigravityPaths() {
  const platform = process.platform;
  const candidates = [];

  if (platform === 'darwin') {
    candidates.push(
      {
        type: 'app-2.0',
        name: 'Antigravity 2.0 (macOS App)',
        appRoot: '/Applications/Antigravity.app',
        resourcesDir: '/Applications/Antigravity.app/Contents/Resources',
        asarPath: '/Applications/Antigravity.app/Contents/Resources/app.asar',
      },
      {
        type: 'ide',
        name: 'Antigravity IDE (macOS App)',
        appRoot: '/Applications/Antigravity IDE.app',
        resourcesDir: '/Applications/Antigravity IDE.app/Contents/Resources',
        ideExtensionsDir: path.join(os.homedir(), '.antigravity-ide', 'extensions'),
      }
    );
  } else if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    candidates.push({
      type: 'app-2.0',
      name: 'Antigravity 2.0 (Windows)',
      appRoot: path.join(localAppData, 'Programs', 'Antigravity'),
      resourcesDir: path.join(localAppData, 'Programs', 'Antigravity', 'resources'),
      asarPath: path.join(localAppData, 'Programs', 'Antigravity', 'resources', 'app.asar'),
    });
  } else {
    candidates.push({
      type: 'app-2.0',
      name: 'Antigravity 2.0 (Linux)',
      appRoot: '/opt/Antigravity',
      resourcesDir: '/opt/Antigravity/resources',
      asarPath: '/opt/Antigravity/resources/app.asar',
    });
  }

  return candidates.map((c) => ({
    ...c,
    exists: fs.existsSync(c.asarPath || c.resourcesDir),
  }));
}

/**
 * 生成注入到 preload.js 末尾的无损引导代码
 */
export function createPreloadInjectionSnippet() {
  return `
${PATCH_MARKER_START}
;(function () {
  try {
    const fs = require('fs');
    const path = require('path');
    const { webFrame } = require('electron');
    const runtimePath = path.join(__dirname, 'agy-skin-i18n-runtime.js');
    if (fs.existsSync(runtimePath)) {
      const runtimeCode = fs.readFileSync(runtimePath, 'utf-8');
      const injectToMainWorld = () => {
        try {
          void webFrame.executeJavaScript(runtimeCode);
        } catch (err) {
          console.error('[agy-skin-i18n] Failed to execute in main world:', err);
        }
      };
      if (typeof window !== 'undefined' && window.document) {
        if (window.document.readyState === 'loading') {
          window.addEventListener('DOMContentLoaded', injectToMainWorld, { once: true });
        } else {
          injectToMainWorld();
        }
      }
    }
  } catch (err) {
    console.error('[agy-skin-i18n] Preload bootstrap error:', err);
  }
})();
${PATCH_MARKER_END}
`;
}

/**
 * 对 menu.js 与 tray.js 进行轻量无损原生菜单汉化
 */
export function patchMenuAndTraySource(menuCode, trayCode) {
  let patchedMenu = menuCode;
  if (menuCode && !menuCode.includes(PATCH_MARKER_START)) {
    patchedMenu =
      menuCode
        .replace(/label:\s*'New Window'/g, "label: '新建窗口 (New Window)'")
        .replace(/label:\s*'Docs'/g, "label: '官方文档 (Docs)'")
        .replace(/label:\s*'Connect to WSL'/g, "label: '连接到 WSL'")
        .replace(/label:\s*'Reopen Locally'/g, "label: '在本地重新打开'") +
      `\n${PATCH_MARKER_START}\n${PATCH_MARKER_END}\n`;
  }

  let patchedTray = trayCode;
  if (trayCode && !trayCode.includes(PATCH_MARKER_START)) {
    patchedTray =
      trayCode
        .replace(/label:\s*'No agents running'/g, "label: '当前无运行中的智能体'")
        .replace(/label:\s*'Quit'/g, "label: '退出 (Quit)'")
        .replace(/label:\s*\`Open \$\{electron_1\.app\.getName\(\)\}\`/g, 'label: `打开 ${electron_1.app.getName()}`') +
      `\n${PATCH_MARKER_START}\n${PATCH_MARKER_END}\n`;
  }

  return { patchedMenu, patchedTray };
}

/**
 * 执行 asar 解包或打包 (使用 npx @electron/asar)
 */
function runAsarCommand(args) {
  execFileSync('npx', ['--yes', '@electron/asar', ...args], {
    stdio: 'pipe',
  });
}

/**
 * 检查指定 Resources 目录下的 app.asar 状态
 */
export function checkPatchStatus(resourcesDir) {
  const asarPath = path.join(resourcesDir, 'app.asar');
  const backupPath = path.join(resourcesDir, 'app.asar.orig.bak');
  const shaPath = path.join(resourcesDir, 'app.asar.orig.sha256');
  const metaPath = path.join(resourcesDir, 'agy-skin-i18n.meta.json');

  if (!fs.existsSync(asarPath)) {
    return { exists: false, asarPath };
  }

  const hasBackup = fs.existsSync(backupPath);
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    : null;

  return {
    exists: true,
    asarPath,
    backupPath,
    hasBackup,
    origSha256: fs.existsSync(shaPath) ? fs.readFileSync(shaPath, 'utf8').trim() : null,
    currentSha256: sha256File(asarPath),
    patched: Boolean(meta && meta.patched),
    meta,
  };
}

/**
 * 向目标 Resources 目录下的 app.asar 注入反重力皮肤与汉化插件
 * 具备：
 *  1. 原子级 .orig.bak 备份与 SHA-256 校验
 *  2. 临时目录解包注入与语法验证
 *  3. 原子替换，绝不损坏原包
 */
export function installPatchToResources(resourcesDir, options = {}) {
  const asarPath = path.join(resourcesDir, 'app.asar');
  const backupPath = path.join(resourcesDir, 'app.asar.orig.bak');
  const shaPath = path.join(resourcesDir, 'app.asar.orig.sha256');
  const metaPath = path.join(resourcesDir, 'agy-skin-i18n.meta.json');

  if (!fs.existsSync(asarPath)) {
    throw new Error(`未找到目标 app.asar: ${asarPath}`);
  }
  if (!fs.existsSync(RUNTIME_BUNDLE_PATH)) {
    throw new Error(`未找到运行时文件，请先运行 npm run build: ${RUNTIME_BUNDLE_PATH}`);
  }

  // 1. 若尚无原始备份，先创建原子备份并记录 SHA-256
  if (!fs.existsSync(backupPath)) {
    const origHash = sha256File(asarPath);
    fs.copyFileSync(asarPath, backupPath);
    fs.writeFileSync(shaPath, origHash, 'utf8');
  }

  // 2. 从纯净备份解包到临时工作目录
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-asar-patch-'));
  const extractDir = path.join(workDir, 'extracted');
  const stagedAsar = path.join(workDir, 'app.asar.staged');

  try {
    runAsarCommand(['extract', backupPath, extractDir]);

    const preloadPath = path.join(extractDir, 'dist', 'preload.js');
    const menuPath = path.join(extractDir, 'dist', 'menu.js');
    const trayPath = path.join(extractDir, 'dist', 'tray.js');
    const targetRuntimePath = path.join(extractDir, 'dist', 'agy-skin-i18n-runtime.js');

    if (!fs.existsSync(preloadPath)) {
      throw new Error(`目标 app.asar 结构不匹配，未找到 dist/preload.js`);
    }

    // 拷贝运行时引擎
    fs.copyFileSync(RUNTIME_BUNDLE_PATH, targetRuntimePath);

    // 注入 preload.js
    const origPreload = fs.readFileSync(preloadPath, 'utf8');
    if (!origPreload.includes(PATCH_MARKER_START)) {
      const nextPreload = origPreload + '\n' + createPreloadInjectionSnippet();
      fs.writeFileSync(preloadPath, nextPreload, 'utf8');
    }

    // 注入原生菜单与托盘汉化
    if (options.patchNativeMenu !== false && fs.existsSync(menuPath) && fs.existsSync(trayPath)) {
      const { patchedMenu, patchedTray } = patchMenuAndTraySource(
        fs.readFileSync(menuPath, 'utf8'),
        fs.readFileSync(trayPath, 'utf8')
      );
      fs.writeFileSync(menuPath, patchedMenu, 'utf8');
      fs.writeFileSync(trayPath, patchedTray, 'utf8');
    }

    // 3. 重新打包为 staged asar 并验证完整性
    runAsarCommand(['pack', extractDir, stagedAsar, '--unpack', '{*.node,**/node_modules/node-pty/**,**/node_modules/@vscode/ripgrep/**}']);

    if (!fs.existsSync(stagedAsar) || fs.statSync(stagedAsar).size < 100000) {
      throw new Error('打包后的 app.asar.staged 体积异常，已中止替换以保护原程序');
    }

    // 4. 原子替换目标 app.asar
    fs.copyFileSync(stagedAsar, asarPath);

    const meta = {
      patched: true,
      version: '1.0.0',
      patchedAt: new Date().toISOString(),
      origSha256: fs.readFileSync(shaPath, 'utf8').trim(),
      patchedSha256: sha256File(asarPath),
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

    return meta;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

/**
 * 从 .orig.bak 备份无损还原 app.asar，并验证 SHA-256 完全一致
 */
export function restoreResourcesFromBackup(resourcesDir) {
  const asarPath = path.join(resourcesDir, 'app.asar');
  const backupPath = path.join(resourcesDir, 'app.asar.orig.bak');
  const shaPath = path.join(resourcesDir, 'app.asar.orig.sha256');
  const metaPath = path.join(resourcesDir, 'agy-skin-i18n.meta.json');

  if (!fs.existsSync(backupPath)) {
    throw new Error(`未找到原始备份文件: ${backupPath}`);
  }

  const expectedHash = fs.existsSync(shaPath) ? fs.readFileSync(shaPath, 'utf8').trim() : null;
  const backupHash = sha256File(backupPath);

  if (expectedHash && expectedHash !== backupHash) {
    throw new Error(`备份文件 SHA-256 校验不匹配 (期望 ${expectedHash}, 实际 ${backupHash})`);
  }

  fs.copyFileSync(backupPath, asarPath);
  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
  }

  const restoredHash = sha256File(asarPath);
  return {
    restored: true,
    sha256: restoredHash,
    verified: !expectedHash || restoredHash === expectedHash,
  };
}
