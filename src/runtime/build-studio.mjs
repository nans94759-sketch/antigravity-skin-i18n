import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const STUDIO_DIR = path.join(ROOT_DIR, 'studio');
const RUNTIME_PATH = path.join(__dirname, 'agy-skin-i18n-runtime.js');

fs.mkdirSync(STUDIO_DIR, { recursive: true });

const runtimeCode = fs.readFileSync(RUNTIME_PATH, 'utf8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Antigravity 反重力皮肤与全量汉化 1:1 交互预览工作台</title>
  <style>
    :root {
      --background: #101010;
      --foreground: #cccccc;
      --primary: #007acc;
      --primary-foreground: #ffffff;
      --secondary: #272727;
      --secondary-foreground: #9d9d9d;
      --muted: #151515;
      --muted-foreground: #6e6e6e;
      --placeholder: #484848;
      --border: rgba(255, 255, 255, 0.12);
      --card: #191919;
      --card-border: #222222;
      --sidebar: #151515;
      --sidebar-secondary: #1b1b1b;
      --sidebar-muted: #151515;
      --error: #de5555;
      --warning: #e8975f;
      --link: #6a9fcb;
      --success: #7aae66;
      --code-foreground: #d7ba7d;
      --syntax-keyword: #c084fc;
      --syntax-function: #38bdf8;
      --syntax-string: #6ee7b7;
      --syntax-comment: #64748b;
      --syntax-number: #fbbf24;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background-color: var(--background);
      color: var(--foreground);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
    }
    .app-shell {
      display: grid;
      grid-template-columns: 250px 1fr 330px;
      height: 100vh;
      width: 100vw;
    }
    /* Left Sidebar */
    .sidebar {
      background: var(--sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 14px 12px;
      gap: 6px;
    }
    .traffic-lights {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 6px 12px;
    }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot.red { background: #ff5f56; }
    .dot.yellow { background: #ffbd2e; }
    .dot.green { background: #27c93f; }
    .brand-badge {
      margin-left: auto;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--secondary);
      color: var(--primary);
    }
    .nav-btnPrimary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 12px;
      border-radius: 10px;
      background: var(--primary);
      color: var(--primary-foreground);
      font-weight: 600;
      font-size: 13px;
      border: none;
      cursor: pointer;
      margin-bottom: 8px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      border-radius: 8px;
      color: var(--foreground);
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .nav-item:hover, .nav-item.active {
      background: var(--sidebar-secondary);
    }
    .nav-section-header {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--muted-foreground);
      padding: 12px 10px 4px;
    }
    .search-input {
      width: 100%;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: var(--muted);
      color: var(--foreground);
      font-size: 12px;
      margin-bottom: 6px;
    }
    /* Center Canvas */
    .main-canvas {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }
    .topbar {
      height: 52px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      background: var(--muted);
    }
    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .pill-btn {
      padding: 5px 11px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      background: var(--card);
      color: var(--foreground);
      font-size: 12px;
      cursor: pointer;
    }
    .pill-btn.primary {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
      font-weight: 600;
    }
    .canvas-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .bg-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 18px 20px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .setting-row:last-child { border-bottom: none; }
    .setting-label { font-weight: 600; font-size: 13.5px; }
    .setting-desc { font-size: 12px; color: var(--muted-foreground); margin-top: 2px; }
    .badge {
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: var(--secondary);
      color: var(--primary);
    }
    pre[class*="language-"] {
      background: var(--muted);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      overflow-x: auto;
      margin: 10px 0 0;
    }
    .token.keyword { color: var(--syntax-keyword); }
    .token.function { color: var(--syntax-function); }
    .token.string { color: var(--syntax-string); }
    .token.comment { color: var(--syntax-comment); font-style: italic; }
    .token.number { color: var(--syntax-number); }
    /* Right Aux Pane */
    .aux-pane {
      background: var(--sidebar);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 14px;
      gap: 12px;
    }
    .aux-tabs {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
      flex-wrap: wrap;
    }
    .aux-tab {
      font-size: 11.5px;
      padding: 4px 8px;
      border-radius: 6px;
      background: var(--secondary);
      color: var(--foreground);
    }
  </style>
</head>
<body class="theme-standalone dark dark-theme theme-dark">
  <div class="app-shell">
    <!-- Left Sidebar (Antigravity 2.0 Surface) -->
    <aside class="sidebar">
      <div class="traffic-lights">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
        <span class="brand-badge">Antigravity 2.23</span>
      </div>

      <button class="nav-btnPrimary">+ <span>New Conversation</span></button>
      <input class="search-input" placeholder="Search conversations..." title="Search conversations (by name or Cascade ID)" />

      <div class="nav-item active"><span>Conversations</span><span class="badge">3</span></div>
      <div class="nav-item"><span>Projects</span></div>
      <div class="nav-item"><span>Scheduled Tasks</span></div>
      <div class="nav-item"><span>Skills & Customizations</span></div>
      <div class="nav-item"><span>Marketplace</span></div>
      <div class="nav-item"><span>Settings</span></div>

      <div class="nav-section-header"><span>Pinned Conversations</span></div>
      <div class="nav-item"><span>Conversation 1</span><span style="font-size:11px;color:var(--muted-foreground)">5m ago</span></div>
      <div class="nav-item"><span>Conversation 2</span><span style="font-size:11px;color:var(--muted-foreground)">2h ago</span></div>

      <div class="nav-section-header" style="margin-top:auto"><span>Status</span></div>
      <div class="nav-item"><span>2 agents running</span><span class="badge" style="color:var(--success)">Running</span></div>
    </aside>

    <!-- Center Chat & Settings Simulator -->
    <main class="main-canvas">
      <header class="topbar">
        <div style="display:flex;align-items:center;gap:12px;">
          <strong><span>Model Selection</span>:</strong>
          <span class="badge">Gemini 4 Argon</span>
          <span class="badge"><span>Autonomous Mode</span></span>
        </div>
        <div class="topbar-actions">
          <button class="pill-btn" title="Toggle Sidebar"><span>Toggle Sidebar</span></button>
          <button class="pill-btn" title="Toggle Auxiliary Pane"><span>Toggle Auxiliary Pane</span></button>
          <button class="pill-btn primary" onclick="window.AntigravitySkinI18n && window.AntigravitySkinI18n.togglePanel(true)">
            皮肤与汉化设置
          </button>
        </div>
      </header>

      <div class="canvas-scroll">
        <!-- Welcome Banner Card -->
        <div class="bg-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <h2 style="margin:0;font-size:18px;"><span>Pick a suggestion below to get started, or ask me anything.</span></h2>
            <span class="badge"><span>Ready</span></span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
            <span class="pill-btn"><span>Build new features</span></span>
            <span class="pill-btn"><span>Debug and fix</span></span>
            <span class="pill-btn"><span>Research anything</span></span>
            <span class="pill-btn"><span>Write and edit docs</span></span>
          </div>
        </div>

        <!-- Settings Preview Grid -->
        <div class="grid-2">
          <div class="bg-card">
            <h3 style="margin:0 0 12px 0;font-size:15px;color:var(--primary)"><span>Appearance</span> &amp; <span>General</span></h3>
            <div class="setting-row">
              <div>
                <div class="setting-label"><span>Theme</span></div>
                <div class="setting-desc"><span>Configure the agent's visual theme and display preferences.</span></div>
              </div>
              <span class="badge"><span>Dark Theme</span></span>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-label"><span>Conversation Width</span></div>
                <div class="setting-desc"><span>Configure the maximum width of the conversation panel.</span></div>
              </div>
              <span class="badge"><span>Wide</span></span>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-label"><span>Verbose Agent Chat</span></div>
                <div class="setting-desc"><span>Display and preserve intermediate thinking steps.</span></div>
              </div>
              <span class="badge"><span>Always Allow</span></span>
            </div>
          </div>

          <div class="bg-card">
            <h3 style="margin:0 0 12px 0;font-size:15px;color:var(--primary)"><span>Terminal & Tooling Permissions</span></h3>
            <div class="setting-row">
              <div>
                <div class="setting-label"><span>Terminal Command Auto Execution</span></div>
                <div class="setting-desc"><span>Controls whether terminal commands require your approval before running.</span></div>
              </div>
              <span class="badge"><span>Always Proceed</span></span>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-label"><span>Enable Terminal Sandbox</span></div>
                <div class="setting-desc"><span>Run terminal commands with sandbox restrictions.</span></div>
              </div>
              <span class="badge"><span>Sandboxed</span></span>
            </div>
            <div class="setting-row">
              <div>
                <div class="setting-label"><span>Prevent Sleep</span></div>
                <div class="setting-desc"><span>Prevent the computer from sleeping while the app is running.</span></div>
              </div>
              <span class="badge"><span>Installed</span></span>
            </div>
          </div>
        </div>

        <!-- Code Protection Verification Card -->
        <div class="bg-card">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <strong style="font-size:14px;"><span>Agent Edits</span> · 代码块隔离保护预览（下方代码跳过翻译）</strong>
            <div style="display:flex;gap:6px;">
              <button class="pill-btn"><span>Accept Step</span></button>
              <button class="pill-btn"><span>Reject Step</span></button>
              <button class="pill-btn"><span>Copy</span></button>
            </div>
          </div>
          <pre class="language-typescript"><code><span class="token comment">// Code blocks (&lt;pre&gt;/&lt;code&gt;) are strictly protected from UI translation:</span>
<span class="token keyword">export async function</span> <span class="token function">launchAntigravityAgent</span>(options = { mode: <span class="token string">"Always Proceed"</span>, label: <span class="token string">"New Conversation"</span> }) {
  <span class="token keyword">const</span> maxRetries = <span class="token number">3</span>;
  <span class="token keyword">return</span> await startSession(options);
}</code></pre>
        </div>
      </div>
    </main>

    <!-- Right Auxiliary Pane -->
    <aside class="aux-pane">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <strong><span>Auxiliary Pane</span></strong>
        <span class="badge"><span>Side-by-Side</span></span>
      </div>
      <div class="aux-tabs">
        <span class="aux-tab"><span>Subagents</span></span>
        <span class="aux-tab"><span>Background Tasks</span></span>
        <span class="aux-tab"><span>Artifacts</span></span>
        <span class="aux-tab"><span>Files Changed</span></span>
        <span class="aux-tab"><span>Terminals</span></span>
      </div>

      <div class="bg-card" style="padding:14px;">
        <div style="font-weight:600;margin-bottom:6px;"><span>Review Changes</span></div>
        <div style="font-size:12px;color:var(--muted-foreground);margin-bottom:10px;"><span>Staged Changes</span> (3)</div>
        <div style="display:flex;gap:6px;">
          <button class="pill-btn primary"><span>Commit</span></button>
          <button class="pill-btn"><span>Push</span></button>
          <button class="pill-btn"><span>Generate Commit Message</span></button>
        </div>
      </div>

      <div class="bg-card" style="padding:14px;">
        <div style="font-weight:600;margin-bottom:6px;"><span>Skills</span> &amp; <span>Plugins</span></div>
        <div style="font-size:12px;color:var(--muted-foreground);margin-bottom:8px;"><span>Skills are instructions that extend what Agent can do.</span></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <span class="badge"><span>Installed Skills</span></span>
          <span class="badge"><span>MCP Servers</span></span>
          <span class="badge"><span>Hooks</span></span>
        </div>
      </div>
    </aside>
  </div>

  <script>${runtimeCode}</script>
  <script>
    // Auto-open the Skin & i18n drawer on first visit to Studio so the user immediately sees all controls
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        if (window.AntigravitySkinI18n) {
          window.AntigravitySkinI18n.togglePanel(true);
        }
      }, 200);
    });
  </script>
</body>
</html>`;

const outFile = path.join(STUDIO_DIR, 'index.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log(`[build-studio] Generated standalone interactive studio: ${outFile}`);
