'use strict';
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const SKINS = [
  {
    "id": "nebula-zero-g",
    "themeLabel": "Antigravity · 深空蓝 (Nebula Zero-G)",
    "name": "深空蓝",
    "nameEn": "Nebula Zero-G",
    "badge": "默认深色",
    "description": "深空蓝底色配青蓝高亮与毛玻璃面板。",
    "category": "dark"
  },
  {
    "id": "cyberpunk-neon",
    "themeLabel": "Antigravity · 赛博霓虹 (Cyberpunk Matrix)",
    "name": "赛博霓虹",
    "nameEn": "Cyberpunk Matrix",
    "badge": "高对比",
    "description": "深黑底色配洋红与青色高亮边框。",
    "category": "dark"
  },
  {
    "id": "aurora-glass",
    "themeLabel": "Antigravity · 极光琉璃 (Aurora Glass)",
    "name": "极光琉璃",
    "nameEn": "Aurora Glass",
    "badge": "毛玻璃",
    "description": "深蓝底色配极光绿与冰川蓝半透明面板。",
    "category": "dark"
  },
  {
    "id": "tokyo-night",
    "themeLabel": "Antigravity · 东京夜色 (Tokyo Night)",
    "name": "东京夜色",
    "nameEn": "Tokyo Night",
    "badge": "柔和深色",
    "description": "经典 Tokyo Night 蓝紫配色，低对比度柔和语法高亮。",
    "category": "dark"
  },
  {
    "id": "catppuccin-mocha",
    "themeLabel": "Antigravity · 摩卡暖灰 (Catppuccin Mocha)",
    "name": "摩卡暖灰",
    "nameEn": "Catppuccin Mocha",
    "badge": "暖调深色",
    "description": "温暖摩卡暗色调配薰衣草紫高亮，适合长时间阅读。",
    "category": "dark"
  },
  {
    "id": "morandi-forest",
    "themeLabel": "Antigravity · 莫兰迪绿 (Morandi Emerald)",
    "name": "莫兰迪绿",
    "nameEn": "Morandi Emerald",
    "badge": "护眼深色",
    "description": "低饱和松针绿底色配暖灰文字，缓解视觉疲劳。",
    "category": "dark"
  },
  {
    "id": "obsidian-gold",
    "themeLabel": "Antigravity · 曜石黑金 (Obsidian Gold)",
    "name": "曜石黑金",
    "nameEn": "Obsidian Gold",
    "badge": "纯黑深色",
    "description": "纯黑底色配香槟金高亮边框。",
    "category": "dark"
  },
  {
    "id": "retro-amber",
    "themeLabel": "Antigravity · 琥珀终端 (Retro CRT Amber)",
    "name": "琥珀终端",
    "nameEn": "Retro CRT Amber",
    "badge": "复古深色",
    "description": "经典琥珀色 CRT 终端配色。",
    "category": "dark"
  },
  {
    "id": "oriental-ink",
    "themeLabel": "Antigravity · 水墨宣纸 (Oriental Ink)",
    "name": "水墨宣纸",
    "nameEn": "Oriental Ink",
    "badge": "暖调浅色",
    "description": "温润宣纸米白底色配松烟墨黑文字与朱砂红点缀。",
    "category": "light"
  },
  {
    "id": "sakura-breeze",
    "themeLabel": "Antigravity · 樱花微风 (Sakura Breeze)",
    "name": "樱花微风",
    "nameEn": "Sakura Breeze",
    "badge": "柔和浅色",
    "description": "象牙白底色配樱花粉高亮卡片。",
    "category": "light"
  },
  {
    "id": "cupertino-light",
    "themeLabel": "Antigravity · 云母浅白 (Cupertino Light)",
    "name": "云母浅白",
    "nameEn": "Cupertino Light",
    "badge": "原生浅色",
    "description": "macOS 原生浅灰白底色配系统蓝。",
    "category": "light"
  }
];

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
      label: `${s.name} (${s.nameEn})`,
      description: `[${s.badge}]`,
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
      vscode.window.showInformationMessage(`已切换主题皮肤：${picked.label}`);
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
      vscode.window.showInformationMessage(`已切换语言模式：${picked.label}`);
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
    panel.webview.html = `<!DOCTYPE html>
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
  <script>${runtimeCode}</script>
  <script>setTimeout(() => { if (window.AntigravitySkinI18n) window.AntigravitySkinI18n.togglePanel(true); }, 150);</script>
</body>
</html>`;
  });

  context.subscriptions.push(switchSkinCmd, switchLangCmd, openStudioCmd);
}

function deactivate() {}

module.exports = { activate, deactivate };
