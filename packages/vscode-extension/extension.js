'use strict';
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const SKINS = [
  {
    "id": "nebula-zero-g",
    "themeLabel": "Antigravity · 深空反重力 (Nebula Zero-G)",
    "name": "深空反重力",
    "nameEn": "Nebula Zero-G",
    "badge": "旗舰推荐",
    "description": "深邃宇宙靛蓝底色搭配悬浮星云毛玻璃卡片与极光青蓝高亮，专为沉浸式 AI 结对编程打造。",
    "category": "dark"
  },
  {
    "id": "cyberpunk-neon",
    "themeLabel": "Antigravity · 赛博霓虹 (Cyberpunk Matrix)",
    "name": "赛博霓虹",
    "nameEn": "Cyberpunk Matrix",
    "badge": "高能炫酷",
    "description": "暗夜黑曜石底色碰撞电光洋红与赛博青，微发光能量边框带来未来感十足的终端体验。",
    "category": "dark"
  },
  {
    "id": "aurora-glass",
    "themeLabel": "Antigravity · 极光琉璃 (Aurora Glassmorphism)",
    "name": "极光琉璃",
    "nameEn": "Aurora Glassmorphism",
    "badge": "毛玻璃高透",
    "description": "北欧极光翡翠绿与冰川蓝交织的通透毛玻璃界面，呼吸感十足，轻盈如失重悬浮。",
    "category": "dark"
  },
  {
    "id": "tokyo-night",
    "themeLabel": "Antigravity · 东京夜色 (Tokyo Night Pro)",
    "name": "东京夜色",
    "nameEn": "Tokyo Night Pro",
    "badge": "极客最爱",
    "description": "致敬经典 Tokyo Night 风暴蓝紫配色，低对比度柔和语法高亮，深夜长效编码不伤眼。",
    "category": "dark"
  },
  {
    "id": "catppuccin-mocha",
    "themeLabel": "Antigravity · 猫爪摩卡 (Catppuccin Mocha)",
    "name": "猫爪摩卡",
    "nameEn": "Catppuccin Mocha",
    "badge": "温润舒适",
    "description": "温暖丝滑的摩卡可可暗色调搭配薰衣草紫与奶油蜜桃色，兼顾颜值与长时间阅读舒适度。",
    "category": "dark"
  },
  {
    "id": "morandi-forest",
    "themeLabel": "Antigravity · 莫兰迪森系 (Morandi Emerald)",
    "name": "莫兰迪森系",
    "nameEn": "Morandi Emerald",
    "badge": "深度护眼",
    "description": "低饱和度松针墨绿与苔藓灰绿交融，辅以暖羊皮纸文字，极大缓解视觉疲劳。",
    "category": "dark"
  },
  {
    "id": "obsidian-gold",
    "themeLabel": "Antigravity · 黑金尊享 (Obsidian Champagne Gold)",
    "name": "黑金尊享",
    "nameEn": "Obsidian Champagne Gold",
    "badge": "奢华质感",
    "description": "碳纤黑丝绒质感机身搭配香槟流金高亮，沉稳内敛的旗舰商务美学。",
    "category": "dark"
  },
  {
    "id": "retro-amber",
    "themeLabel": "Antigravity · 复古琥珀终端 (Retro CRT Amber)",
    "name": "复古琥珀终端",
    "nameEn": "Retro CRT Amber",
    "badge": "复古极客",
    "description": "致敬 80 年代 IBM 琥珀磷光显像管终端，温暖复古的纯正 Hacker 氛围。",
    "category": "dark"
  },
  {
    "id": "oriental-ink",
    "themeLabel": "Antigravity · 东方水墨·宣纸 (Oriental Ink & Rice Paper)",
    "name": "东方水墨·宣纸",
    "nameEn": "Oriental Ink & Rice Paper",
    "badge": "国风浅色",
    "description": "宋式温润宣纸底色配松烟墨字与朱砂印泥红点缀，书卷气十足的日间阅读与创作体验。",
    "category": "light"
  },
  {
    "id": "sakura-breeze",
    "themeLabel": "Antigravity · 樱花微风 (Sakura Breeze)",
    "name": "樱花微风",
    "nameEn": "Sakura Breeze",
    "badge": "清新浅色",
    "description": "春日柔光象牙白与樱花粉渐变卡片，轻柔明亮，让高强度工作也拥有好心情。",
    "category": "light"
  },
  {
    "id": "cupertino-light",
    "themeLabel": "Antigravity · 果味极简·云母白 (Cupertino Studio Light)",
    "name": "果味极简·云母白",
    "nameEn": "Cupertino Studio Light",
    "badge": "macOS 原生感",
    "description": "遵循 Apple HIG 视觉规范的云母暖灰白与经典系统蓝，干净利落，层次分明。",
    "category": "light"
  }
];

function activate(context) {
  // Create Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(paintcan) 反重力皮肤·汉化';
  statusBarItem.tooltip = '点击打开 Antigravity 反重力皮肤与汉化控制台 (Cmd/Ctrl+Shift+L)';
  statusBarItem.command = 'antigravitySkinI18n.openStudio';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Command 1: Switch Skin QuickPick
  const switchSkinCmd = vscode.commands.registerCommand('antigravitySkinI18n.switchSkin', async () => {
    const items = SKINS.map((s) => ({
      label: `${s.category === 'light' ? '☀️' : '🌙'} ${s.name} (${s.nameEn})`,
      description: `[${s.badge}]`,
      detail: s.description,
      themeLabel: s.themeLabel,
    }));
    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: '选择一款 Antigravity 反重力高定主题皮肤（立即全局生效）',
    });
    if (picked) {
      await vscode.workspace
        .getConfiguration('workbench')
        .update('colorTheme', picked.themeLabel, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`🎨 已切换至反重力皮肤：${picked.label}`);
    }
  });

  // Command 2: Switch Language Mode
  const switchLangCmd = vscode.commands.registerCommand('antigravitySkinI18n.switchLanguage', async () => {
    const items = [
      { label: '🇨🇳 简体中文 (zh-CN)', mode: 'zh-CN', detail: '全量汉化 Antigravity 侧边栏、设置、按钮与提示信息' },
      { label: '🌗 中英双语对照 (Bilingual)', mode: 'bilingual', detail: '导航与核心操作采用「中文 · English」双语对照显示' },
      { label: '🇺🇸 原生英文 (English)', mode: 'en-US', detail: '恢复 Antigravity 官方默认英文界面' },
    ];
    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: '选择 Antigravity 界面语言模式',
    });
    if (picked) {
      await vscode.workspace
        .getConfiguration('antigravitySkinI18n')
        .update('languageMode', picked.mode, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(`🌐 已切换界面语言模式为：${picked.label}`);
    }
  });

  // Command 3: Open Interactive Studio Webview
  const openStudioCmd = vscode.commands.registerCommand('antigravitySkinI18n.openStudio', () => {
    const panel = vscode.window.createWebviewPanel(
      'antigravitySkinStudio',
      '🎨 反重力皮肤与汉化工作台',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );
    const runtimePath = path.join(context.extensionPath, 'runtime', 'agy-skin-i18n-runtime.js');
    const runtimeCode = fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath, 'utf8') : '';
    panel.webview.html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>反重力皮肤与汉化工作台</title>
  <style>
    body { margin: 0; padding: 32px; background: var(--background, #090D16); color: var(--foreground, #E2E8F0); font-family: system-ui, -apple-system, sans-serif; }
    .card { background: var(--card, #111827); border: 1px solid var(--card-border, #1E293B); border-radius: 14px; padding: 24px; max-width: 820px; margin: 0 auto; }
    h1 { margin-top: 0; color: var(--primary, #38BDF8); }
    .btn { padding: 10px 18px; border-radius: 8px; border: none; background: var(--primary, #38BDF8); color: var(--primary-foreground, #030712); font-weight: 700; cursor: pointer; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 Antigravity 反重力皮肤与汉化中心</h1>
    <p>欢迎使用反重力皮肤与全量汉化插件！点击右下角悬浮按钮或下方按钮即可实时预览并切换 12 款主题皮肤与中文/双语模式。</p>
    <p>
      <span>New Conversation</span> · <span>Scheduled Tasks</span> · <span>Skills & Customizations</span> · <span>Settings</span> · <span>Always Proceed</span>
    </p>
    <button class="btn" onclick="window.AntigravitySkinI18n && window.AntigravitySkinI18n.togglePanel(true)">打开皮肤与汉化抽屉面板</button>
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
