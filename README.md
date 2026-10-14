# Antigravity 主题皮肤与汉化插件 (`antigravity-skin-i18n`)

面向 Google Antigravity 2.0 (Electron 桌面端) 与 Antigravity IDE (VS Code 内核) 的主题皮肤与中文汉化工具。内置 12 款主题皮肤、1,036 条 UI 词条与 20 条动态正则规则，支持纯中文、中英双语、原版英文实时切换，并提供 `app.asar` 自动备份与还原。

---

## 核心功能

### 1. 界面汉化（三模式切换，无需重启）
词条直接提取自 Antigravity v2.23.0 渲染层与主进程 (`ui_main.js` / `menu.js` / `tray.js`)：
- **简体中文 (`zh-CN`)**：覆盖侧边栏、设置 (`Settings`)、智能体 (`Agent` / `Subagents`)、权限控制 (`Permissions` / `Auto-approve`)、扩展定制 (`Plugins` / `Skills` / `Rules` / `MCP Servers`)、快捷键 (`Keybindings`)、内置浏览器 (`Browser`)、自动化任务 (`Automations`) 及 macOS 原生菜单栏。
- **中英双语 (`bilingual`)**：导航与操作按钮采用 `中文 · English` 对照显示。
- **原版英文 (`en-US`)**：基于 `WeakMap` 节点原始文本记录，随时无损切回官方英文界面。
- **代码块隔离保护**：DOM 遍历时自动跳过 `<pre>`、`<code>`、`.monaco-editor`、`.xterm`、`.cm-editor`、`[contenteditable="true"]`、`<input>` 与 `<textarea>`，不修改代码、终端日志、文件路径或输入框内容。

### 2. 12 款主题皮肤
覆盖 Antigravity 全局 CSS 变量（`--background`、`--foreground`、`--primary`、`--sidebar`、`--card`、`--border`、`--syntax-*`、`--sdk-*`、`--vscode-*`），支持独立开关毛玻璃模糊、卡片边框阴影、背景径向渐变以及自定义背景图片：

| 皮肤 ID | 名称 | 类型 | 说明 |
| :--- | :--- | :---: | :--- |
| `nebula-zero-g` | 深空蓝 (Nebula Zero-G) | 深色 | 深空蓝底色配青蓝高亮与毛玻璃面板（默认） |
| `cyberpunk-neon` | 赛博霓虹 (Cyberpunk Matrix) | 深色 | 深黑底色配洋红与青色高亮边框 |
| `aurora-glass` | 极光琉璃 (Aurora Glass) | 深色 | 深蓝底色配极光绿与冰川蓝半透明面板 |
| `tokyo-night` | 东京夜色 (Tokyo Night) | 深色 | 经典 Tokyo Night 蓝紫配色，低对比度柔和语法高亮 |
| `catppuccin-mocha` | 摩卡暖灰 (Catppuccin Mocha) | 深色 | 温暖摩卡暗色调配薰衣草紫高亮，适合长时间阅读 |
| `morandi-forest` | 莫兰迪绿 (Morandi Emerald) | 深色 | 低饱和松针绿底色配暖灰文字，缓解视觉疲劳 |
| `obsidian-gold` | 曜石黑金 (Obsidian Gold) | 深色 | 纯黑底色配香槟金高亮边框 |
| `retro-amber` | 琥珀终端 (Retro CRT Amber) | 深色 | 经典琥珀色 CRT 终端配色 |
| `oriental-ink` | 水墨宣纸 (Oriental Ink) | 浅色 | 温润宣纸米白底色配松烟墨黑文字与朱砂红点缀 |
| `sakura-breeze` | 樱花微风 (Sakura Breeze) | 浅色 | 象牙白底色配樱花粉高亮卡片 |
| `cupertino-light` | 云母浅白 (Cupertino Light) | 浅色 | macOS 原生浅灰白底色配系统蓝 |
| `native-default` | 官方默认 (Antigravity Native) | 默认 | 保留官方默认配色，仅启用汉化或自定义壁纸 |

---

## 使用方式

### 方式一：不关闭软件、零安装临时体验（开发者工具）

如果你正在使用 `Antigravity.app` 不想重启，可通过控制台直接加载：
1. 在 Antigravity 窗口按 `Cmd + Option + I` (`Ctrl + Shift + I`) 打开开发者工具，切换到 `Console`。
2. 复制 [`src/runtime/agy-skin-i18n-runtime.js`](./src/runtime/agy-skin-i18n-runtime.js) 的内容粘贴到控制台并回车。
3. 右下角将出现悬浮按钮，点击即可切换皮肤与语言。

---

### 方式二：安装到 `Antigravity.app` 桌面客户端（永久生效）

安装程序带有运行态进程检测锁，若检测到 `Antigravity.app` 正在运行会自动中止写入，防止影响当前会话。

1. 正常退出 `Antigravity.app`。
2. 在终端执行：
   ```bash
   npm run install-app
   ```
   安装程序会自动备份原始 `app.asar.orig.bak`（含 SHA-256 校验值）并写入皮肤与汉化补丁。
3. 如需还原官方纯净版，随时执行：
   ```bash
   npm run restore-app
   ```

---

### 方式三：安装到 `Antigravity IDE` 或 `VS Code`

项目已打包标准扩展文件 [`packages/vscode-extension/antigravity-skin-i18n-1.0.0.vsix`](./packages/vscode-extension/antigravity-skin-i18n-1.0.0.vsix)。

- **命令行安装**：
  ```bash
  npm run install-ide
  ```
- **手动安装**：
  在 `Antigravity IDE` 或 `VS Code` 中打开扩展面板 (`Cmd/Ctrl + Shift + X`) -> 点击右上角 `...` -> 选择 `Install from VSIX...` -> 导入 `packages/vscode-extension/antigravity-skin-i18n-1.0.0.vsix`。

---

### 方式四：浏览器独立预览台与沙箱测试

```bash
# 在浏览器打开 1:1 模拟预览台
npm run studio

# 查看本机客户端与补丁状态（只读）
npm run status

# 在 /tmp 隔离沙箱中运行测试套件（不触碰真实软件）
npm test
```

---

## 快捷键（客户端内）

| 快捷键 (macOS) | 快捷键 (Win / Linux) | 说明 |
| :---: | :---: | :--- |
| `Cmd + Shift + L` | `Ctrl + Shift + L` | 打开 / 关闭皮肤与汉化设置面板 |
| `Option + Shift + Z` | `Alt + Shift + Z` | 循环切换语言模式（简体中文 / 中英双语 / English） |
| `Option + Shift + S` | `Alt + Shift + S` | 顺序切换 12 款主题皮肤 |

---

## 目录结构

```text
antigravity-skin-i18n/
├── bin/
│   └── agy-skin-i18n.mjs                 # CLI 命令行工具
├── src/
│   ├── i18n/
│   │   └── dictionary.mjs                # 1,036 条 UI 词条 + 20 条动态正则 + 原生菜单词典
│   ├── skins/
│   │   └── presets.mjs                   # 12 款主题皮肤 CSS 变量与视觉效果配置
│   ├── runtime/
│   │   ├── build-runtime.mjs             # 渲染层运行时构建脚本
│   │   ├── agy-skin-i18n-runtime.js      # 编译后的单文件运行时引擎
│   │   ├── build-vscode-ext.mjs          # VS Code / Antigravity IDE 扩展与 VSIX 构建脚本
│   │   └── build-studio.mjs              # 独立浏览器预览台构建脚本
│   └── patcher/
│       └── asar-patcher.mjs              # 带 SHA-256 备份与还原的 ASAR 补丁模块
├── packages/
│   └── vscode-extension/
│       └── antigravity-skin-i18n-1.0.0.vsix
├── plugins/
│   └── antigravity-skin-i18n/            # Antigravity 原生 Plugin 与 Skill
├── studio/
│   └── index.html                        # 独立浏览器预览页面
└── tests/
    └── sandbox-test.mjs                  # 隔离沙箱自动化测试
```

---

## 开源协议

[MIT License](./LICENSE)
