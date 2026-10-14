import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SKIN_PRESETS } from '../skins/presets.mjs';
import { EXACT_DICT } from '../i18n/dictionary.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const EXT_DIR = path.join(ROOT_DIR, 'packages', 'vscode-extension');
const THEMES_DIR = path.join(EXT_DIR, 'themes');
const RUNTIME_DIR = path.join(EXT_DIR, 'runtime');

fs.mkdirSync(THEMES_DIR, { recursive: true });
fs.mkdirSync(RUNTIME_DIR, { recursive: true });

// Copy the compiled runtime into the extension
const runtimeSrc = path.join(__dirname, 'agy-skin-i18n-runtime.js');
if (fs.existsSync(runtimeSrc)) {
  fs.copyFileSync(runtimeSrc, path.join(RUNTIME_DIR, 'agy-skin-i18n-runtime.js'));
}

// Generate 11 custom VS Code / Antigravity IDE Color Theme JSON files
const themeContributions = [];

for (const skin of SKIN_PRESETS) {
  if (skin.id === 'native-default') continue;

  const isLight = skin.category === 'light';
  const t = skin.tokens;
  const bg = t['--background'];
  const fg = t['--foreground'];
  const sidebar = t['--sidebar'];
  const sidebarSec = t['--sidebar-secondary'];
  const card = t['--card'];
  const cardBorder = t['--card-border'];
  const primary = t['--primary'];
  const primaryFg = t['--primary-foreground'];
  const secondary = t['--secondary'];
  const secondaryFg = t['--secondary-foreground'];
  const muted = t['--muted'];
  const mutedFg = t['--muted-foreground'];
  const accent = t['--accent'];
  const err = t['--error'];
  const warn = t['--warning'];
  const ok = t['--success'];

  const vscodeTheme = {
    $schema: 'vscode://schemas/color-theme',
    name: `Antigravity · ${skin.name} (${skin.nameEn})`,
    type: isLight ? 'light' : 'dark',
    semanticHighlighting: true,
    colors: {
      'editor.background': bg,
      'editor.foreground': fg,
      'sideBar.background': sidebar,
      'sideBar.foreground': fg,
      'sideBar.border': cardBorder,
      'sideBarSectionHeader.background': sidebarSec,
      'sideBarSectionHeader.foreground': fg,
      'activityBar.background': sidebar,
      'activityBar.foreground': primary,
      'activityBar.inactiveForeground': mutedFg,
      'activityBar.border': cardBorder,
      'activityBarBadge.background': primary,
      'activityBarBadge.foreground': primaryFg,
      'titleBar.activeBackground': sidebar,
      'titleBar.activeForeground': fg,
      'titleBar.inactiveBackground': sidebar,
      'titleBar.inactiveForeground': mutedFg,
      'titleBar.border': cardBorder,
      'statusBar.background': sidebar,
      'statusBar.foreground': secondaryFg,
      'statusBar.border': cardBorder,
      'statusBar.noFolderBackground': sidebar,
      'tab.activeBackground': bg,
      'tab.activeForeground': fg,
      'tab.activeBorderTop': primary,
      'tab.inactiveBackground': sidebar,
      'tab.inactiveForeground': mutedFg,
      'tab.border': cardBorder,
      'editorGroupHeader.tabsBackground': sidebar,
      'editorGroupHeader.tabsBorder': cardBorder,
      'editorWidget.background': card,
      'editorWidget.border': cardBorder,
      'input.background': muted,
      'input.foreground': fg,
      'input.border': cardBorder,
      'input.placeholderForeground': t['--placeholder'],
      'button.background': primary,
      'button.foreground': primaryFg,
      'button.hoverBackground': accent,
      'button.secondaryBackground': secondary,
      'button.secondaryForeground': secondaryFg,
      'dropdown.background': card,
      'dropdown.foreground': fg,
      'dropdown.border': cardBorder,
      'list.activeSelectionBackground': secondary,
      'list.activeSelectionForeground': fg,
      'list.hoverBackground': muted,
      'list.inactiveSelectionBackground': muted,
      'panel.background': sidebar,
      'panel.border': cardBorder,
      'terminal.background': bg,
      'terminal.foreground': fg,
      'focusBorder': primary,
      'textLink.foreground': t['--link'],
      'errorForeground': err,
      'editorWarning.foreground': warn,
      'editorError.foreground': err,
      'gitDecoration.addedResourceForeground': ok,
      'gitDecoration.modifiedResourceForeground': primary,
      'gitDecoration.deletedResourceForeground': err,
    },
    tokenColors: [
      {
        scope: ['comment', 'punctuation.definition.comment'],
        settings: { foreground: t['--syntax-comment'], fontStyle: 'italic' },
      },
      {
        scope: ['keyword', 'storage.type', 'storage.modifier'],
        settings: { foreground: t['--syntax-keyword'] },
      },
      {
        scope: ['entity.name.function', 'support.function'],
        settings: { foreground: t['--syntax-function'] },
      },
      {
        scope: ['entity.name.type', 'entity.name.class', 'support.class'],
        settings: { foreground: t['--syntax-class-name'] },
      },
      {
        scope: ['string', 'punctuation.definition.string'],
        settings: { foreground: t['--syntax-string'] },
      },
      {
        scope: ['constant.numeric', 'constant.language', 'constant.character'],
        settings: { foreground: t['--syntax-number'] },
      },
      {
        scope: ['variable', 'support.variable'],
        settings: { foreground: t['--syntax-variable'] },
      },
      {
        scope: ['entity.name.tag', 'punctuation.definition.tag'],
        settings: { foreground: t['--syntax-tag'] },
      },
      {
        scope: ['entity.other.attribute-name'],
        settings: { foreground: t['--syntax-attr-name'] },
      },
      {
        scope: ['keyword.operator'],
        settings: { foreground: t['--syntax-operator'] },
      },
    ],
  };

  const themeFileName = `${skin.id}.json`;
  fs.writeFileSync(path.join(THEMES_DIR, themeFileName), JSON.stringify(vscodeTheme, null, 2));

  themeContributions.push({
    id: `antigravity-skin-${skin.id}`,
    label: `Antigravity · ${skin.name} (${skin.nameEn})`,
    uiTheme: isLight ? 'vs' : 'vs-dark',
    path: `./themes/${themeFileName}`,
  });
}

const extPackageJson = {
  name: 'antigravity-skin-i18n',
  displayName: '%displayName%',
  description: '%description%',
  version: '1.0.0',
  publisher: 'combob',
  engines: {
    vscode: '^1.68.0',
  },
  categories: ['Themes', 'Language Packs', 'Other'],
  keywords: ['antigravity', 'theme', 'skin', 'chinese', 'i18n', '反重力', '汉化', '皮肤'],
  main: './extension.js',
  activationEvents: ['*'],
  contributes: {
    themes: themeContributions,
    commands: [
      {
        command: 'antigravitySkinI18n.openStudio',
        title: '%cmd.openStudio%',
        category: 'Antigravity 反重力',
      },
      {
        command: 'antigravitySkinI18n.switchSkin',
        title: '%cmd.switchSkin%',
        category: 'Antigravity 反重力',
      },
      {
        command: 'antigravitySkinI18n.switchLanguage',
        title: '%cmd.switchLanguage%',
        category: 'Antigravity 反重力',
      },
    ],
    keybindings: [
      {
        command: 'antigravitySkinI18n.openStudio',
        key: 'ctrl+shift+l',
        mac: 'cmd+shift+l',
      },
    ],
  },
};

fs.writeFileSync(path.join(EXT_DIR, 'package.json'), JSON.stringify(extPackageJson, null, 2));

fs.writeFileSync(
  path.join(EXT_DIR, 'package.nls.json'),
  JSON.stringify(
    {
      displayName: 'Antigravity Skin & Chinese Localization (反重力皮肤与汉化)',
      description:
        '12 theme skins + Simplified Chinese / Bilingual UI localization for Antigravity & Antigravity IDE.',
      'cmd.openStudio': 'Open Skin & i18n Settings (打开皮肤与汉化设置)',
      'cmd.switchSkin': 'Switch Theme Skin (切换主题皮肤)',
      'cmd.switchLanguage': 'Switch UI Language Mode (切换语言模式: 中文/双语/英文)',
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(EXT_DIR, 'package.nls.zh-cn.json'),
  JSON.stringify(
    {
      displayName: 'Antigravity 主题皮肤与汉化扩展',
      description:
        '内置 12 款主题皮肤与中文汉化/双语对照支持，适用于 Antigravity 2.0 与 Antigravity IDE。',
      'cmd.openStudio': '打开皮肤与汉化设置',
      'cmd.switchSkin': '切换主题皮肤',
      'cmd.switchLanguage': '切换界面语言模式 (中文 / 双语 / 英文)',
    },
    null,
    2
  )
);

const extensionJs = `'use strict';
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const SKINS = ${JSON.stringify(
  SKIN_PRESETS.filter((s) => s.id !== 'native-default').map((s) => ({
    id: s.id,
    themeLabel: `Antigravity · ${s.name} (${s.nameEn})`,
    name: s.name,
    nameEn: s.nameEn,
    badge: s.badge,
    description: s.description,
    category: s.category,
  })),
  null,
  2
)};

function activate(context) {
  // Create Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '反重力皮肤·汉化';
  statusBarItem.tooltip = '打开 Antigravity 皮肤与汉化设置 (Cmd/Ctrl+Shift+L)';
  statusBarItem.command = 'antigravitySkinI18n.openStudio';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Command 1: Switch Skin QuickPick
  const switchSkinCmd = vscode.commands.registerCommand('antigravitySkinI18n.switchSkin', async () => {
    const items = SKINS.map((s) => ({
      label: \`\${s.name} (\${s.nameEn})\`,
      description: \`[\${s.badge}]\`,
      detail: s.description,
      themeLabel: s.themeLabel,
    }));
    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: '选择主题皮肤',
    });
    if (picked) {
      await vscode.workspace
        .getConfiguration('workbench')
        .update('colorTheme', picked.themeLabel, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(\`已切换主题皮肤：\${picked.label}\`);
    }
  });

  // Command 2: Switch Language Mode
  const switchLangCmd = vscode.commands.registerCommand('antigravitySkinI18n.switchLanguage', async () => {
    const items = [
      { label: '简体中文 (zh-CN)', mode: 'zh-CN', detail: '纯中文界面' },
      { label: '中英双语 (Bilingual)', mode: 'bilingual', detail: '导航与按钮采用「中文 · English」对照显示' },
      { label: 'English (en-US)', mode: 'en-US', detail: '恢复官方默认英文界面' },
    ];
    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: '选择界面语言模式',
    });
    if (picked) {
      await vscode.workspace
        .getConfiguration('antigravitySkinI18n')
        .update('languageMode', picked.mode, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(\`已切换语言模式：\${picked.label}\`);
    }
  });

  // Command 3: Open Interactive Studio Webview
  const openStudioCmd = vscode.commands.registerCommand('antigravitySkinI18n.openStudio', () => {
    const panel = vscode.window.createWebviewPanel(
      'antigravitySkinStudio',
      '皮肤与汉化设置',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    const runtimePath = path.join(context.extensionPath, 'runtime', 'agy-skin-i18n-runtime.js');
    const runtimeCode = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf8') : '';
    panel.webview.html = \`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>皮肤与汉化设置</title>
  <style>
    body { margin: 0; padding: 32px; background: var(--background, #090D16); color: var(--foreground, #E2E8F0); font-family: system-ui, -apple-system, sans-serif; }
    .card { background: var(--card, #111827); border: 1px solid var(--card-border, #1E293B); border-radius: 14px; padding: 24px; max-width: 820px; margin: 0 auto; }
    h1 { margin-top: 0; font-size: 20px; color: var(--primary, #38BDF8); }
    .btn { padding: 9px 16px; border-radius: 8px; border: none; background: var(--primary, #38BDF8); color: var(--primary-foreground, #030712); font-weight: 600; cursor: pointer; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Antigravity 皮肤与汉化设置</h1>
    <p>点击右下角悬浮按钮或下方按钮，可预览并切换 12 款主题皮肤与中文/双语模式。</p>
    <p>
      <span>New Conversation</span> · <span>Scheduled Tasks</span> · <span>Skills & Customizations</span> · <span>Settings</span> · <span>Always Proceed</span>
    </p>
    <button class="btn" onclick="window.AntigravitySkinI18n && window.AntigravitySkinI18n.togglePanel(true)">打开设置面板</button>
  </div>
  <script>\${runtimeCode}</script>
  <script>setTimeout(() => { if (window.AntigravitySkinI18n) window.AntigravitySkinI18n.togglePanel(true); }, 150);</script>
</body>
</html>\`;
  });

  context.subscriptions.push(switchSkinCmd, switchLangCmd, openStudioCmd);
}

function deactivate() {}

module.exports = { activate, deactivate };
`;

fs.writeFileSync(path.join(EXT_DIR, 'extension.js'), extensionJs);

fs.writeFileSync(
  path.join(EXT_DIR, 'README.md'),
  `# Antigravity 主题皮肤与汉化扩展\n\n提供 12 款主题皮肤与简体中文/双语对照支持，包含 \`${Object.keys(EXACT_DICT).length}\` 条 UI 词条。\n`
);

// Build standard .vsix package (ZIP archive with [Content_Types].xml & extension.vsixmanifest)
const tmpVsixBuild = path.join('/tmp', `agy-vsix-build-${Date.now()}`);
const tmpExtSub = path.join(tmpVsixBuild, 'extension');
fs.mkdirSync(tmpExtSub, { recursive: true });

fs.cpSync(EXT_DIR, tmpExtSub, {
  recursive: true,
  filter: (src) => !src.endsWith('.vsix'),
});

const contentTypesXml = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension=".json" ContentType="application/json"/>
  <Default Extension=".js" ContentType="application/javascript"/>
  <Default Extension=".md" ContentType="text/markdown"/>
  <Default Extension=".vsixmanifest" ContentType="text/xml"/>
</Types>`;

const vsixManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="zh-CN" Id="antigravity-skin-i18n" Version="1.0.0" Publisher="combob" />
    <DisplayName>Antigravity 主题皮肤与汉化扩展</DisplayName>
    <Description xml:space="preserve">内置 12 款主题皮肤与中文汉化/双语对照支持，适用于 Antigravity 2.0 与 Antigravity IDE。</Description>
    <Tags>antigravity,theme,skin,chinese,i18n,反重力,汉化,皮肤</Tags>
    <Categories>Themes,Language Packs</Categories>
    <GalleryFlags>Public</GalleryFlags>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code"/>
  </Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
    <Asset Type="Microsoft.VisualStudio.Services.Content.Details" Path="extension/README.md" Addressable="true" />
  </Assets>
</PackageManifest>`;

fs.writeFileSync(path.join(tmpVsixBuild, '[Content_Types].xml'), contentTypesXml);
fs.writeFileSync(path.join(tmpVsixBuild, 'extension.vsixmanifest'), vsixManifestXml);

const vsixOutPath = path.join(EXT_DIR, 'antigravity-skin-i18n-1.0.0.vsix');
if (fs.existsSync(vsixOutPath)) fs.unlinkSync(vsixOutPath);

execFileSync('zip', ['-r', '-q', vsixOutPath, '[Content_Types].xml', 'extension.vsixmanifest', 'extension'], {
  cwd: tmpVsixBuild,
});

fs.rmSync(tmpVsixBuild, { recursive: true, force: true });
console.log(
  `[build-vscode-ext] Built ${themeContributions.length} VS Code themes and packaged ${vsixOutPath} (${(
    fs.statSync(vsixOutPath).size / 1024
  ).toFixed(1)} KB)`
);
