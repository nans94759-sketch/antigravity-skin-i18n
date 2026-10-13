# 🌌 Antigravity 反重力全能皮肤与深度汉化套件 (`antigravity-skin-i18n`)

> **专为 Google Antigravity 2.0 (Electron 客户端) 与 Antigravity IDE (VS Code 内核) 打造的非破坏性高定主题皮肤引擎与全界面深度汉化套件。**  
> 內置 **12 款高定主题皮肤** + **1,036+ 条精准 UI 词条与 20 条动态正则汉化** + **双语对照模式** + **进程级安全守卫与 SHA-256 原子备份还原**。

---

## ✨ 核心特性

### 1. 🌏 深度汉化引擎（三模式实时切换，零重启）
基于对 Antigravity v2.23.0 渲染层与主进程 (`ui_main.js` / `menu.js` / `tray.js`) 的完整词条提取，内置 **1,036 条精准 UI 词条 + 20 条动态正则规则 + 原生菜单/托盘词典**：
- **🇨🇳 简体中文 (`zh-CN`)**：全量汉化设置中心 (`Settings`)、智能体控制 (`Agent` / `Subagents`)、权限审批 (`Permissions` / `Auto-approve`)、定制化中心 (`Customizations`: `Plugins` / `Skills` / `Rules` / `MCP Servers`)、快捷键 (`Keybindings`)、浏览器集成 (`Browser`)、计划任务 (`Automations`)、状态栏与弹窗提示。
- **🌗 中英双语对照 (`bilingual`)**：独创 `中文 · English` 对照显示模式，兼顾母语直观阅读与原版专业术语精准定位。
- **🇺🇸 原版英文 (`en-US`)**：基于 `WeakMap` 原始节点快照机制，一键毫秒级无损还原 100% 官方英文文本，无需刷新页面。
- **🛡️ 严格代码块与编辑器防误翻保护**：DOM `TreeWalker` 遍历时自动跳过 `<pre>`、`<code>`、`.monaco-editor`、`.xterm`、`.cm-editor`、`[contenteditable="true"]`、`<input>` 与 `<textarea>`，**绝不触碰任何一行代码、终端日志、文件路径或用户正在输入的 Prompt**。

### 2. 🎨 12 款反重力高定主题皮肤 (`Anti-Gravity Skins`)
接管并覆写 Antigravity 全量 CSS Token（`--background`、`--foreground`、`--primary`、`--sidebar`、`--card`、`--border`、`--syntax-*`、`--sdk-*`、`--vscode-*`），自带 `document.documentElement.style.setProperty` 拦截守卫，防止客户端切换会话时重置主题：

| 皮肤 ID | 名称 | 模式 | 视觉风格描述 |
| :--- | :--- | :---: | :--- |
| `nebula-zero-g` | **星云零重力 (Nebula Zero-G)** | 🌙 暗色 | 深空星云紫蓝渐变、零重力悬浮毛玻璃与霓虹微光边框（主打） |
| `cyberpunk-neon` | **赛博霓虹 2077 (Cyberpunk Neon)** | 🌙 暗色 | 暗夜黑底配电光品红与赛博青双色高对比霓虹发光面板 |
| `aurora-glass` | **极光冰晶毛玻璃 (Aurora Glass)** | 🌙 暗色 | 北极星夜深蓝底色，搭配极光翠绿与冰晶青多层毛玻璃呼吸灯效 |
| `tokyo-night` | **东京暗夜 (Tokyo Night Storm)** | 🌙 暗色 | 经典 Tokyo Night 配色，柔和蓝紫低对比护眼编码体验 |
| `catppuccin-mocha` | **摩卡星尘 (Catppuccin Mocha)** | 🌙 暗色 | 温暖柔和的粉彩摩卡暗色主题，长时间 AI 结对编程零视觉疲劳 |
| `morandi-forest` | **莫兰迪迷雾森林 (Morandi Forest)** | 🌙 暗色 | 温润低饱和松石绿与原木暖灰，沉静专注的禅意工作流 |
| `obsidian-gold` | **黑曜石流金 (Obsidian Gold)** | 🌙 暗色 | 极致纯黑 OLED 省电底色，点缀尊贵香槟流金高光边框 |
| `retro-amber` | **复古琥珀终端 (Retro Amber CRT)** | 🌙 暗色 | 致敬 80 年代太空船琥珀色磷光 CRT 显示器，沉浸式极客氛围 |
| `oriental-ink` | **东方水墨宣纸 (Oriental Ink)** | ☀️ 亮色 | 温润宣纸米白底色，配松烟墨黑与朱砂印红，尽显东方雅致 |
| `sakura-breeze` | **樱花微风 (Sakura Breeze)** | ☀️ 亮色 | 清新樱花粉白高透亮色，柔和玫瑰金与蜜桃粉点缀 |
| `cupertino-light` | **果味纯净白 (Cupertino Daylight)** | ☀️ 亮色 | Apple macOS 原生级高通透毛玻璃亮色，清爽锐利 |
| `native-default` | **官方原版默认 (Native Default)** | 🔄 跟随 | 不覆盖官方默认配色，仅启用深度汉化与快捷键增强 |

> **✨ 视觉特效开关与自定义壁纸**：支持独立开关「星云极光流光氛围层」、「毛玻璃高透模糊 (`backdrop-filter`)」、「霓虹发光卡片边框」，并支持注入自定义图片 URL / DataURI 壁纸及调节壁纸透明度（`0% ~ 60%`）。

### 3. 🛸 四合一全形态交付架构
本项目同时提供 4 种形态，适配所有使用场景：
1. **🌐 独立交互式预览工作台 (`studio/index.html`)**：无需修改任何软件，直接在浏览器中 1:1 体验 Antigravity 2.0 界面、12 款皮肤实时切换、三模式汉化对比与词典搜索。
2. **💉 Antigravity.app 客户端安全热注入工具 (`bin/agy-skin-i18n.mjs`)**：自带**运行态进程保护锁**、**SHA-256 原始 `app.asar.orig.bak` 原子备份**、**沙盒预检**与**一键无损还原**。
3. **🧩 VS Code / Antigravity IDE 标准扩展包 (`.vsix`)**：位于 `packages/vscode-extension/antigravity-skin-i18n-1.0.0.vsix`，提供 11 款完整 VS Code Color Themes、中英双语命令面板、状态栏快捷入口与可视化 Studio Webview。
4. **🔌 Antigravity 原生 Plugin & Skill 插件包 (`plugins/antigravity-skin-i18n`)**：符合 Antigravity Customization 规范的原生插件与 `SKILL.md`。

---

## 🚀 快速开始

### 方式一：零侵入打开可视化工作台 & 1:1 模拟器（推荐先体验）

无需触碰正在运行的 Antigravity 软件，直接在浏览器中打开交互式模拟器：

```bash
npm run studio
```

或者直接用浏览器打开项目下的 [`studio/index.html`](./studio/index.html)。

---

### 方式二：运行全隔离沙盒测试（100% 不触碰真实软件）

本项目内置完整的隔离沙盒测试套件（在系统临时目录构建虚拟 `app.asar` 验证注入、校验、还原、词典完整性与代码块保护，并校验真实 `/Applications/Antigravity.app` 未被修改）：

```bash
npm test
```

查看当前系统环境与补丁状态（纯只读检查）：

```bash
npm run status
```

---

### 方式三：安装到 `Antigravity.app` 桌面客户端

> ⚠️ **安全守卫机制**：当你正在使用 `Antigravity.app` 时，安装程序会自动检测到活跃进程并**主动拒绝修改**，确保绝不会破坏正在运行的客户端！

1. **先正常退出 `Antigravity.app`**（确保没有正在进行的任务）。
2. 在终端运行一键安全安装命令：

```bash
npm run install-app
```

安装程序将自动完成：
- 计算 `/Applications/Antigravity.app/Contents/Resources/app.asar` 的 SHA-256 哈希；
- 创建不可覆盖的官方原版备份 `app.asar.orig.bak` 与 `.meta.json`；
- 将 `agy-skin-i18n-runtime.js` 安全注入渲染层并启用 macOS 原生菜单栏/托盘中文汉化。

3. **随时一键 100% 原子级还原官方纯净版**：

```bash
npm run restore-app
```

---

### 方式四：安装到 `Antigravity IDE.app` 或 VS Code

项目已打包好标准 `.vsix` 扩展文件：`packages/vscode-extension/antigravity-skin-i18n-1.0.0.vsix`。

**一键命令行安装：**

```bash
npm run install-ide
```

**或手动安装：**
1. 打开 `Antigravity IDE` 或 `VS Code`；
2. 进入扩展面板 (`Cmd/Ctrl + Shift + X`) ➔ 点击右上角 `...` ➔ **从 VSIX 安装 (`Install from VSIX...`)**；
3. 选择 `packages/vscode-extension/antigravity-skin-i18n-1.0.0.vsix`；
4. 按 `Cmd/Ctrl + K Cmd/Ctrl + T` 即可切换 11 款 **Antigravity · 反重力** 主题皮肤，或点击底部状态栏 `🌌 反重力皮肤 & 汉化` 打开控制中心。

---

### 方式五：控制台零安装一键体验（Bookmarklet / DevTools）

如果你不想给 `app.asar` 打补丁，也可以在 `Antigravity.app` 中按下 `Cmd + Option + I` (`Ctrl + Shift + I`) 打开开发者工具 Console，粘贴 [`src/runtime/agy-skin-i18n-runtime.js`](./src/runtime/agy-skin-i18n-runtime.js) 的内容回车，即可立即在当前窗口唤出右下角 `🌌 反重力 · 汉化` 悬浮胶囊！

---

## ⌨️ 快捷键一览（客户端内）

| 快捷键 (macOS) | 快捷键 (Win / Linux) | 功能说明 |
| :---: | :---: | :--- |
| `Cmd + Shift + L` | `Ctrl + Shift + L` | 打开 / 关闭 **反重力皮肤与汉化控制抽屉 (Studio Drawer)** |
| `Option + Shift + Z` | `Alt + Shift + Z` | 循环切换语言模式：**简体中文 (`zh-CN`) ➔ 双语对照 (`bilingual`) ➔ 原版英文 (`en-US`)** |
| `Option + Shift + S` | `Alt + Shift + S` | 顺序切换 **12 款反重力高定主题皮肤** |

---

## 📂 项目目录结构

```text
antigravity-skin-i18n/
├── bin/
│   └── agy-skin-i18n.mjs                 # 命令行 CLI 主入口 (status / studio / install-app / restore-app / install-ide / sandbox-test)
├── src/
│   ├── i18n/
│   │   └── dictionary.mjs                # 1,036+ 精准 UI 词条 + 20 条动态正则 + 原生菜单/托盘汉化词库
│   ├── skins/
│   │   └── presets.mjs                   # 12 款反重力高定主题皮肤 CSS 变量与视觉特效定义
│   ├── runtime/
│   │   ├── build-runtime.mjs             # 浏览器/Electron 渲染层运行时编译器
│   │   ├── agy-skin-i18n-runtime.js      # 编译后的自包含单文件运行时引擎 (121 KB)
│   │   ├── build-vscode-ext.mjs          # VS Code / Antigravity IDE 扩展与 VSIX 打包器
│   │   └── build-studio.mjs              # 独立 1:1 交互式预览工作台生成器
│   └── patcher/
│       └── asar-patcher.mjs              # 带进程锁、SHA-256 备份与沙盒自检的原子级 ASAR 补丁引擎
├── packages/
│   └── vscode-extension/
│       ├── package.json                  # VS Code / Antigravity IDE 扩展清单
│       ├── package.nls.zh-cn.json        # 扩展中文语言包
│       ├── extension.js                  # 扩展主入口 (状态栏、QuickPick、Studio Webview、热注入桥接)
│       ├── themes/                       # 11 款标准 VS Code Color Theme JSON 文件
│       └── antigravity-skin-i18n-1.0.0.vsix  # 打包好的即装即用 VSIX 扩展包
├── plugins/
│   └── antigravity-skin-i18n/            # Antigravity 原生 Plugin & Skill 插件包
│       ├── .agents-plugin/plugin.json
│       ├── rules/AGENTS.md
│       └── skills/antigravity-skin-i18n/SKILL.md
├── studio/
│   └── index.html                        # 独立可运行的 Antigravity 2.0 1:1 皮肤与汉化交互实验室
├── tests/
│   └── sandbox-test.mjs                  # 全隔离沙盒自动化测试套件 (5 大测试集)
└── package.json
```

---

## 🛠️ 二次开发与构建

如果你修改了 [`src/i18n/dictionary.mjs`](./src/i18n/dictionary.mjs) 中的词条或 [`src/skins/presets.mjs`](./src/skins/presets.mjs) 中的皮肤配色，只需运行：

```bash
# 重新编译 Runtime 引擎、VS Code VSIX 扩展包与 Studio 预览页
npm run build

# 运行全套沙盒测试验证
npm test
```

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。
