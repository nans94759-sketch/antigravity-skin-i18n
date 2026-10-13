import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SKIN_PRESETS, getSkinById } from '../src/skins/presets.mjs';
import { EXACT_DICT, PATTERN_RULES, translateText } from '../src/i18n/dictionary.mjs';
import {
  PATCH_MARKER_START,
  sha256File,
  checkPatchStatus,
  installPatchToResources,
  restoreResourcesFromBackup,
} from '../src/patcher/asar-patcher.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

console.log('======================================================================');
console.log(' 🧪 Running Isolated Sandbox Test Suite (零侵入隔离沙箱自动化测试)');
console.log(' 🛡️  安全保证：全程仅在 /tmp 虚拟沙箱中测试，绝不触碰正在运行的 Antigravity');
console.log('======================================================================\n');

// ---------------------------------------------------------------------------
// 1. 测试 12 款反重力高定皮肤预设完整性
// ---------------------------------------------------------------------------
console.log('▶ [1/5] 验证 12 款反重力高定主题皮肤预设与 VS Code 主题文件...');
assert.equal(SKIN_PRESETS.length, 12, '应包含 12 款预设皮肤');
for (const skin of SKIN_PRESETS) {
  assert.ok(skin.id && skin.name && skin.nameEn, `皮肤缺少基本标识: ${skin.id}`);
  assert.ok(skin.preview.bg && skin.preview.primary, `皮肤缺少预览色板: ${skin.id}`);
  if (skin.id !== 'native-default') {
    assert.ok(skin.tokens['--background'], `皮肤 ${skin.id} 缺少 --background`);
    assert.ok(skin.tokens['--foreground'], `皮肤 ${skin.id} 缺少 --foreground`);
    assert.ok(skin.tokens['--primary'], `皮肤 ${skin.id} 缺少 --primary`);
    assert.ok(skin.tokens['--sidebar'], `皮肤 ${skin.id} 缺少 --sidebar`);
    assert.ok(skin.tokens['--card'], `皮肤 ${skin.id} 缺少 --card`);
    const themeJsonPath = path.join(
      ROOT_DIR,
      'packages',
      'vscode-extension',
      'themes',
      `${skin.id}.json`
    );
    assert.ok(fs.existsSync(themeJsonPath), `VS Code 主题文件不存在: ${themeJsonPath}`);
  }
}
assert.equal(getSkinById('cyberpunk-neon').name, '赛博霓虹');
console.log('  ✅ 12 款反重力皮肤与 11 个 VS Code 主题 JSON 全部校验通过！\n');

// ---------------------------------------------------------------------------
// 2. 测试全量汉化词典、双语模式与动态正则匹配
// ---------------------------------------------------------------------------
console.log('▶ [2/5] 验证全量中文汉化词典 (1036+ 词条) 与动态正则引擎...');
assert.ok(Object.keys(EXACT_DICT).length >= 1000, '精确词条数应不少于 1000 条');
assert.equal(translateText('New Conversation', 'zh-CN'), '新建对话');
assert.equal(translateText('Scheduled Tasks', 'zh-CN'), '定时任务');
assert.equal(translateText('Skills & Customizations', 'zh-CN'), '技能与扩展定制');
assert.equal(translateText('Always Proceed', 'zh-CN'), '始终自动执行 (Always Proceed)');
assert.equal(
  translateText('New Conversation', 'bilingual'),
  '新建对话 · New Conversation',
  '双语模式应同时展示中文与英文原词'
);
assert.equal(translateText('New Conversation', 'en-US'), 'New Conversation');
assert.equal(translateText('3 agents running', 'zh-CN'), '3 个智能体正在运行');
assert.equal(translateText('15m ago', 'zh-CN'), '15 分钟前');
assert.equal(translateText('Step 8', 'zh-CN'), '步骤 8');
assert.equal(translateText('  Settings  ', 'zh-CN'), '  设置中心  ', '应保留首尾空格');
console.log(
  `  ✅ 词典校验通过 (${Object.keys(EXACT_DICT).length} 条精确词条 + ${PATTERN_RULES.length} 条动态规则)！\n`
);

// ---------------------------------------------------------------------------
// 3. 测试编译后的运行时引擎 agy-skin-i18n-runtime.js
// ---------------------------------------------------------------------------
console.log('▶ [3/5] 在隔离 VM 环境中验证运行时引擎 (agy-skin-i18n-runtime.js)...');
const runtimePath = path.join(ROOT_DIR, 'src', 'runtime', 'agy-skin-i18n-runtime.js');
assert.ok(fs.existsSync(runtimePath), 'agy-skin-i18n-runtime.js 应已构建');
const runtimeCode = fs.readFileSync(runtimePath, 'utf8');

const sandboxWindow = {
  localStorage: {
    _data: {},
    getItem(k) {
      return this._data[k] || null;
    },
    setItem(k, v) {
      this._data[k] = String(v);
    },
  },
  addEventListener() {},
};
const vmContext = vm.createContext({
  window: sandboxWindow,
  globalThis: sandboxWindow,
  localStorage: sandboxWindow.localStorage,
  console,
  setTimeout,
  clearTimeout,
});
vm.runInContext(runtimeCode, vmContext);

const api = sandboxWindow.AntigravitySkinI18n;
assert.ok(api, '运行时应在 window 上挂载 AntigravitySkinI18n API');
assert.equal(api.SKIN_PRESETS.length, 12);
assert.equal(api.translateString('Toggle Sidebar', 'zh-CN'), '切换侧边栏');
assert.equal(
  api.translateString('https://antigravity.google/docs', 'zh-CN'),
  null,
  'URL 链接应受保护不被翻译'
);
api.setSkin('aurora-glass');
assert.equal(api.getState().skinId, 'aurora-glass');
api.setLangMode('bilingual');
assert.equal(api.getState().langMode, 'bilingual');
console.log('  ✅ 运行时引擎 API 与安全隔离保护校验通过！\n');

// ---------------------------------------------------------------------------
// 4. 在 /tmp 虚拟沙箱中测试 app.asar 注入与无损还原（绝不触碰真实软件）
// ---------------------------------------------------------------------------
console.log('▶ [4/5] 在 /tmp 独立虚拟沙箱中测试 app.asar 注入与 SHA-256 还原...');
const tmpSandboxRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-sandbox-verify-'));
const mockAppSource = path.join(tmpSandboxRoot, 'mock-app-src');
const mockResourcesDir = path.join(tmpSandboxRoot, 'Resources');
fs.mkdirSync(path.join(mockAppSource, 'dist'), { recursive: true });
fs.mkdirSync(mockResourcesDir, { recursive: true });

// 创建模拟的 Electron app.asar 源文件
fs.writeFileSync(
  path.join(mockAppSource, 'package.json'),
  JSON.stringify({ name: 'antigravity-mock-sandbox', version: '2.23.0', main: 'dist/main.js' }, null, 2)
);
fs.writeFileSync(
  path.join(mockAppSource, 'dist', 'preload.js'),
  `"use strict";\nconst electron_1 = require("electron");\nconsole.log("mock preload");\n`
);
fs.writeFileSync(
  path.join(mockAppSource, 'dist', 'menu.js'),
  `"use strict";\nconst item1 = { label: 'New Window' };\nconst item2 = { label: 'Docs' };\n`
);
fs.writeFileSync(
  path.join(mockAppSource, 'dist', 'tray.js'),
  `"use strict";\nconst t1 = { label: 'No agents running' };\nconst t2 = { label: 'Quit' };\n`
);

const mockAsarPath = path.join(mockResourcesDir, 'app.asar');
execFileSync('npx', ['--yes', '@electron/asar', 'pack', mockAppSource, mockAsarPath]);

const origSandboxSha = sha256File(mockAsarPath);
const beforeStatus = checkPatchStatus(mockResourcesDir);
assert.equal(beforeStatus.patched, false);

// 执行沙箱注入
const patchMeta = installPatchToResources(mockResourcesDir);
assert.equal(patchMeta.patched, true);
assert.equal(patchMeta.origSha256, origSandboxSha);
assert.notEqual(patchMeta.patchedSha256, origSandboxSha);

// 解包验证沙箱注入产物
const verifyExtractDir = path.join(tmpSandboxRoot, 'verify-extracted');
execFileSync('npx', ['--yes', '@electron/asar', 'extract', mockAsarPath, verifyExtractDir]);
assert.ok(
  fs.existsSync(path.join(verifyExtractDir, 'dist', 'agy-skin-i18n-runtime.js')),
  '注入后的 asar 应包含 dist/agy-skin-i18n-runtime.js'
);
const patchedPreload = fs.readFileSync(path.join(verifyExtractDir, 'dist', 'preload.js'), 'utf8');
assert.ok(patchedPreload.includes(PATCH_MARKER_START), 'preload.js 应包含注入标记');
const patchedMenu = fs.readFileSync(path.join(verifyExtractDir, 'dist', 'menu.js'), 'utf8');
assert.ok(patchedMenu.includes('新建窗口 (New Window)'), 'menu.js 应完成原生菜单汉化');

// 执行沙箱无损还原并校验 SHA-256
const restoreRes = restoreResourcesFromBackup(mockResourcesDir);
assert.equal(restoreRes.restored, true);
assert.equal(restoreRes.verified, true);
assert.equal(restoreRes.sha256, origSandboxSha, '还原后的 app.asar SHA-256 必须与原始文件 100% 一致');

fs.rmSync(tmpSandboxRoot, { recursive: true, force: true });
console.log('  ✅ /tmp 虚拟沙箱 app.asar 注入、解包验证与 100% 比特级无损还原测试通过！\n');

// ---------------------------------------------------------------------------
// 5. 验证パッケージ产物 (.vsix、Studio、Native Plugin) 完整性
// ---------------------------------------------------------------------------
console.log('▶ [5/5] 验证 VSIX 扩展包、Studio 工作台与原生 Plugin 产物...');
const vsixFile = path.join(
  ROOT_DIR,
  'packages',
  'vscode-extension',
  'antigravity-skin-i18n-1.0.0.vsix'
);
const studioFile = path.join(ROOT_DIR, 'studio', 'index.html');
const pluginJsonFile = path.join(ROOT_DIR, 'plugins', 'antigravity-skin-i18n', 'plugin.json');

assert.ok(fs.existsSync(vsixFile) && fs.statSync(vsixFile).size > 10000, 'VSIX 扩展包应存在且有效');
assert.ok(fs.existsSync(studioFile) && fs.statSync(studioFile).size > 50000, 'Studio 预览工作台应存在');
assert.ok(fs.existsSync(pluginJsonFile), '原生 Plugin 清单应存在');
console.log('  ✅ 全部构建产物完整性核验通过！\n');

console.log('🎉 ALL 5 SANDBOX TEST SUITES PASSED! (宿主机 Antigravity.app 保持 100% 原始未改动状态)');
