#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  detectAntigravityPaths,
  checkPatchStatus,
  installPatchToResources,
  restoreResourcesFromBackup,
} from '../src/patcher/asar-patcher.mjs';
import { SKIN_PRESETS } from '../src/skins/presets.mjs';
import { EXACT_DICT, PATTERN_RULES } from '../src/i18n/dictionary.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0] || 'status';

function parseFlagValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) return args[idx + 1];
  return null;
}

function isAntigravityAppRunning() {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      const out = execFileSync('ps', ['aux'], { encoding: 'utf8' });
      return out.includes('/Antigravity.app/Contents/MacOS/Antigravity');
    }
  } catch {
    // ignore
  }
  return false;
}

function printBanner() {
  console.log('----------------------------------------------------------------------');
  console.log(' Antigravity 主题皮肤与汉化工具 (agy-skin-i18n v1.0.0)');
  console.log(
    ` 主题预设: ${SKIN_PRESETS.length} 款 | 词条: ${Object.keys(EXACT_DICT).length} 条精确匹配 + ${PATTERN_RULES.length} 条动态规则`
  );
  console.log('----------------------------------------------------------------------');
}

async function main() {
  printBanner();

  if (command === 'status') {
    const targets = detectAntigravityPaths();
    for (const t of targets) {
      console.log(`\n[${t.name}]`);
      console.log(`  路径: ${t.appRoot}`);
      console.log(`  状态: ${t.exists ? '已检测到' : '未安装'}`);
      if (t.type === 'app-2.0' && t.exists) {
        const st = checkPatchStatus(t.resourcesDir);
        console.log(`  补丁: ${st.patched ? '已安装' : '未安装 (官方原版)'}`);
        console.log(`  备份: ${st.hasBackup ? `已创建 (${st.backupPath})` : '未创建'}`);
        console.log(`  SHA-256: ${st.currentSha256.slice(0, 16)}...`);
      } else if (t.type === 'ide' && t.exists) {
        const extDest = path.join(t.ideExtensionsDir, 'combob.antigravity-skin-i18n-1.0.0');
        console.log(
          `  扩展: ${fs.existsSync(extDest) ? '已安装 (~/.antigravity-ide/extensions)' : '未安装 (可运行 npm run install-ide)'}`
        );
      }
    }
    console.log('\n常用命令:');
    console.log('  npm run studio        打开浏览器预览台');
    console.log('  npm run sandbox-test  在 /tmp 沙箱中运行自检测试');
    console.log('  npm run install-app   安装皮肤与汉化补丁到 Antigravity.app');
    console.log('  npm run restore-app   从备份还原 Antigravity.app 官方原版');
    return;
  }

  if (command === 'install') {
    const customResources = parseFlagValue('--target-resources');
    const force = args.includes('--force');

    if (!customResources && isAntigravityAppRunning() && !force) {
      console.log('\n[安全拦截] 检测到 Antigravity.app 正在运行，已中止写入。');
      console.log('请先退出 Antigravity.app 后再执行 npm run install-app（或先运行 npm run studio 在浏览器中预览）。');
      process.exit(0);
    }

    const targetResources =
      customResources ||
      detectAntigravityPaths().find((t) => t.type === 'app-2.0' && t.exists)?.resourcesDir;

    if (!targetResources) {
      console.error('错误: 未找到 Antigravity Resources 目录，可通过 --target-resources <dir> 指定。');
      process.exit(1);
    }

    console.log(`\n正在写入皮肤与汉化补丁: ${targetResources}`);
    const meta = installPatchToResources(targetResources);
    console.log('补丁安装完成。');
    console.log(`  原始 SHA-256: ${meta.origSha256}`);
    console.log(`  当前 SHA-256: ${meta.patchedSha256}`);
    console.log('  重启 Antigravity 后生效，可点击右下角悬浮按钮或按 Cmd/Ctrl + Shift + L 打开设置面板。');
    return;
  }

  if (command === 'restore' || command === 'uninstall') {
    const customResources = parseFlagValue('--target-resources');
    const targetResources =
      customResources ||
      detectAntigravityPaths().find((t) => t.type === 'app-2.0' && t.exists)?.resourcesDir;

    if (!targetResources) {
      console.error('错误: 未找到目标 Resources 目录。');
      process.exit(1);
    }

    console.log(`\n正在从备份还原: ${targetResources}`);
    const res = restoreResourcesFromBackup(targetResources);
    console.log(`已还原官方原版 app.asar (SHA-256 校验通过: ${res.verified})。`);
    return;
  }

  if (command === 'install-ide') {
    const extSrc = path.join(ROOT_DIR, 'packages', 'vscode-extension');
    const ideExtRoot = path.join(os.homedir(), '.antigravity-ide', 'extensions');
    const dest = path.join(ideExtRoot, 'combob.antigravity-skin-i18n-1.0.0');
    fs.mkdirSync(ideExtRoot, { recursive: true });
    fs.cpSync(extSrc, dest, { recursive: true });
    console.log(`\n已安装 Antigravity IDE 扩展至: ${dest}`);
    console.log(
      `也可在 IDE 中通过 "Install from VSIX..." 导入: ${path.join(extSrc, 'antigravity-skin-i18n-1.0.0.vsix')}`
    );
    return;
  }

  if (command === 'install-plugin') {
    const pluginSrc = path.join(ROOT_DIR, 'plugins', 'antigravity-skin-i18n');
    const wsDest = path.join(ROOT_DIR, '.agents', 'plugins', 'antigravity-skin-i18n');
    fs.mkdirSync(path.dirname(wsDest), { recursive: true });
    fs.cpSync(pluginSrc, wsDest, { recursive: true });
    console.log(`\n已部署工作区插件包至: ${wsDest}`);
    return;
  }

  if (command === 'studio') {
    const studioFile = path.join(ROOT_DIR, 'studio', 'index.html');
    console.log(`\n正在打开浏览器预览台: ${studioFile}`);
    if (process.platform === 'darwin') {
      spawnSync('open', [studioFile]);
    }
    return;
  }

  if (command === 'sandbox-test') {
    const testScript = path.join(ROOT_DIR, 'tests', 'sandbox-test.mjs');
    const res = spawnSync(process.execPath, [testScript], { stdio: 'inherit' });
    process.exit(res.status ?? 0);
  }

  console.log(`未知命令: ${command}`);
  console.log('可用命令: status | studio | sandbox-test | install | restore | install-ide | install-plugin');
}

main().catch((err) => {
  console.error('执行出错:', err.message);
  process.exit(1);
});
