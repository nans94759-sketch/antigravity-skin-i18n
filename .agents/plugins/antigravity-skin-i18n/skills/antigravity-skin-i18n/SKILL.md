---
name: antigravity-skin-i18n
description: 管理 Google Antigravity (反重力) 的主题皮肤、全量中文汉化、中英双语对照、自定义壁纸及 VS Code (.vsix) 扩展。当用户提到“反重力皮肤”、“Antigravity 汉化”、“切换皮肤/主题”、“双语模式”或安装/还原界面补丁时触发。
---

# Antigravity 反重力主题皮肤与全量汉化技能 (`antigravity-skin-i18n`)

本技能用于管理 Antigravity 2.0 桌面端与 Antigravity IDE 的主题皮肤及中文汉化补丁。

## 核心命令 (CLI)

在项目根目录下可执行以下命令：

1. **查看检测状态与安装情况（安全只读）**：
   ```bash
   node ./bin/agy-skin-i18n.mjs status
   ```
2. **启动可视化 1:1 皮肤与汉化预览工作台 (Studio)**：
   ```bash
   node ./bin/agy-skin-i18n.mjs studio
   ```
3. **在隔离沙箱中测试补丁与汉化引擎（绝不触碰正在运行的软件）**：
   ```bash
   node ./bin/agy-skin-i18n.mjs sandbox-test
   ```
4. **一键安装到 Antigravity.app（自动创建 `.orig.bak` 备份与 SHA-256 校验）**：
   > ⚠️ 注意：建议在关闭 Antigravity 或空闲时执行，安装后重启生效。
   ```bash
   node ./bin/agy-skin-i18n.mjs install
   ```
5. **一键无损还原官方原版**：
   ```bash
   node ./bin/agy-skin-i18n.mjs restore
   ```

## 内置 12 款反重力高定皮肤 ID
- `nebula-zero-g`：深空反重力 (Nebula Zero-G) [旗舰深色]
- `cyberpunk-neon`：赛博霓虹 (Cyberpunk Matrix) [深色]
- `aurora-glass`：极光琉璃 (Aurora Glassmorphism) [深色毛玻璃]
- `tokyo-night`：东京夜色 (Tokyo Night Pro) [深色]
- `catppuccin-mocha`：猫爪摩卡 (Catppuccin Mocha) [深色]
- `morandi-forest`：莫兰迪森系 (Morandi Emerald) [深色护眼]
- `obsidian-gold`：黑金尊享 (Obsidian Champagne Gold) [深色奢华]
- `retro-amber`：复古琥珀终端 (Retro CRT Amber) [深色极客]
- `oriental-ink`：东方水墨·宣纸 (Oriental Ink & Rice Paper) [国风浅色]
- `sakura-breeze`：樱花微风 (Sakura Breeze) [清新浅色]
- `cupertino-light`：果味极简·云母白 (Cupertino Studio Light) [macOS 浅色]
- `native-default`：原生经典 (Antigravity Native) [官方默认]
