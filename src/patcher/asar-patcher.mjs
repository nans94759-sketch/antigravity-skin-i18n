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
        .replace(/label:\s*'New Window'/g, "label: '新建窗口'")
        .replace(/label:\s*'Docs'/g, "label: '文档'")
        .replace(/label:\s*'Connect to WSL'/g, "label: '连接到 WSL'")
        .replace(/label:\s*'Reopen Locally'/g, "label: '在本地重新打开'") +
      `\n${PATCH_MARKER_START}\n${PATCH_MARKER_END}\n`;
  }

  let patchedTray = trayCode;
  if (trayCode && !trayCode.includes(PATCH_MARKER_START)) {
    patchedTray =
      trayCode
        .replace(/label:\s*'No agents running'/g, "label: '无运行中的智能体'")
        .replace(/label:\s*'Quit'/g, "label: '退出'")
        .replace(/label:\s*\`Open \$\{electron_1\.app\.getName\(\)\}\`/g, 'label: `打开 ${electron_1.app.getName()}`') +
      `\n${PATCH_MARKER_START}\n${PATCH_MARKER_END}\n`;
  }

  return { patchedMenu, patchedTray };
}

/**
 * 计算 Buffer 的 ASAR 规范完整性对象 (SHA256 + 4MB 分块)
 */
function computeAsarIntegrity(buf) {
  const blockSize = 4 * 1024 * 1024;
  const blocks = [];
  for (let i = 0; i < buf.length; i += blockSize) {
    const slice = buf.subarray(i, Math.min(i + blockSize, buf.length));
    blocks.push(crypto.createHash('sha256').update(slice).digest('hex'));
  }
  if (blocks.length === 0) {
    blocks.push(crypto.createHash('sha256').update(Buffer.alloc(0)).digest('hex'));
  }
  return {
    algorithm: 'SHA256',
    hash: crypto.createHash('sha256').update(buf).digest('hex'),
    blockSize,
    blocks,
  };
}

/**
 * 解析 ASAR 二进制归档的 Header JSON 与 Payload Buffer
 */
export function parseAsarArchive(asarFilePath) {
  const raw = fs.readFileSync(asarFilePath);
  if (raw.length < 16) {
    throw new Error(`无效的 ASAR 文件: ${asarFilePath}`);
  }
  const headerSize = raw.readUInt32LE(4);
  const jsonSize = raw.readUInt32LE(12);
  const dataOffset = 8 + headerSize;
  const jsonStr = raw.subarray(16, 16 + jsonSize).toString('utf8').replace(/\0+$/, '');
  const header = JSON.parse(jsonStr);
  const payload = raw.subarray(dataOffset);
  return { header, payload, dataOffset };
}

/**
 * 从 ASAR Header + Payload 中读取指定路径的文件内容
 */
export function readFileFromAsar(header, payload, relPath) {
  const parts = relPath.split('/').filter(Boolean);
  let node = header;
  for (const part of parts) {
    if (!node || !node.files || !node.files[part]) {
      return null;
    }
    node = node.files[part];
  }
  if (!node || node.unpacked || node.offset === undefined) {
    return null;
  }
  const offset = Number(node.offset);
  const size = Number(node.size);
  return payload.subarray(offset, offset + size);
}

/**
 * 在 ASAR Header + Payload 末尾追加或更新指定路径的文件，不触碰任何 unpacked 外部目录
 */
function upsertFileInAsar(header, payloadChunks, currentPayloadLen, relPath, contentBuf) {
  const parts = relPath.split('/').filter(Boolean);
  const fileName = parts.pop();
  let dirNode = header;
  for (const part of parts) {
    if (!dirNode.files) {
      dirNode.files = {};
    }
    if (!dirNode.files[part]) {
      dirNode.files[part] = { files: {} };
    }
    dirNode = dirNode.files[part];
  }
  if (!dirNode.files) {
    dirNode.files = {};
  }

  dirNode.files[fileName] = {
    size: contentBuf.length,
    offset: String(currentPayloadLen),
    integrity: computeAsarIntegrity(contentBuf),
  };

  payloadChunks.push(contentBuf);
  return currentPayloadLen + contentBuf.length;
}

/**
 * 将修改后的 Header 对象与 Payload 块序列化为标准 Chromium Pickle ASAR 二进制 Buffer
 */
function serializeAsarArchive(header, payloadChunks) {
  const jsonBuf = Buffer.from(JSON.stringify(header), 'utf8');
  const jsonSize = jsonBuf.length;
  const alignedJsonSize = Math.ceil(jsonSize / 4) * 4;
  const innerSize = 4 + alignedJsonSize;
  const headerSize = 4 + innerSize;

  const prefixBuf = Buffer.alloc(16 + alignedJsonSize);
  prefixBuf.writeUInt32LE(4, 0);
  prefixBuf.writeUInt32LE(headerSize, 4);
  prefixBuf.writeUInt32LE(innerSize, 8);
  prefixBuf.writeUInt32LE(jsonSize, 12);
  jsonBuf.copy(prefixBuf, 16);

  return Buffer.concat([prefixBuf, ...payloadChunks]);
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
 *  2. 纯 Node.js 原生二进制流补丁，毫秒级完成，不依赖外部 npx 且完全保留 app.asar.unpacked 映射
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

  // 2. 直接在内存中解析纯净备份的 ASAR Header 与 Payload
  const { header, payload } = parseAsarArchive(backupPath);
  const origPreloadBuf = readFileFromAsar(header, payload, 'dist/preload.js');
  if (!origPreloadBuf) {
    throw new Error('目标 app.asar 结构不匹配，未找到 dist/preload.js');
  }

  const payloadChunks = [payload];
  let currentPayloadLen = payload.length;

  // 注入运行时引擎 dist/agy-skin-i18n-runtime.js
  const runtimeBuf = fs.readFileSync(RUNTIME_BUNDLE_PATH);
  currentPayloadLen = upsertFileInAsar(
    header,
    payloadChunks,
    currentPayloadLen,
    'dist/agy-skin-i18n-runtime.js',
    runtimeBuf
  );

  // 注入 dist/preload.js
  const origPreload = origPreloadBuf.toString('utf8');
  const nextPreload = origPreload.includes(PATCH_MARKER_START)
    ? origPreload
    : origPreload + '\n' + createPreloadInjectionSnippet();
  currentPayloadLen = upsertFileInAsar(
    header,
    payloadChunks,
    currentPayloadLen,
    'dist/preload.js',
    Buffer.from(nextPreload, 'utf8')
  );

  // 注入原生菜单与托盘汉化 (dist/menu.js & dist/tray.js)
  const origMenuBuf = readFileFromAsar(header, payload, 'dist/menu.js');
  const origTrayBuf = readFileFromAsar(header, payload, 'dist/tray.js');
  if (options.patchNativeMenu !== false && origMenuBuf && origTrayBuf) {
    const { patchedMenu, patchedTray } = patchMenuAndTraySource(
      origMenuBuf.toString('utf8'),
      origTrayBuf.toString('utf8')
    );
    currentPayloadLen = upsertFileInAsar(
      header,
      payloadChunks,
      currentPayloadLen,
      'dist/menu.js',
      Buffer.from(patchedMenu, 'utf8')
    );
    currentPayloadLen = upsertFileInAsar(
      header,
      payloadChunks,
      currentPayloadLen,
      'dist/tray.js',
      Buffer.from(patchedTray, 'utf8')
    );
  }

  // 3. 序列化为完整 ASAR 归档并先写入临时文件校验
  const finalAsarBuf = serializeAsarArchive(header, payloadChunks);
  if (finalAsarBuf.length < payload.length) {
    throw new Error('打包后的 app.asar 体积异常，已中止替换以保护原程序');
  }

  const stagedAsar = path.join(resourcesDir, 'app.asar.staged.tmp');
  fs.writeFileSync(stagedAsar, finalAsarBuf);
  fs.renameSync(stagedAsar, asarPath);

  const meta = {
    patched: true,
    version: '1.0.0',
    patchedAt: new Date().toISOString(),
    origSha256: fs.readFileSync(shaPath, 'utf8').trim(),
    patchedSha256: sha256File(asarPath),
  };
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

  return meta;
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
