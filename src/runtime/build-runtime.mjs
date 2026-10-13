import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SKIN_PRESETS } from '../skins/presets.mjs';
import { EXACT_DICT, PATTERN_RULES, NATIVE_MENU_DICT } from '../i18n/dictionary.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serializedSkins = JSON.stringify(SKIN_PRESETS, null, 2);
const serializedExactDict = JSON.stringify(EXACT_DICT, null, 2);
const serializedNativeMenuDict = JSON.stringify(NATIVE_MENU_DICT, null, 2);
const serializedPatterns = `[
${PATTERN_RULES.map(
  (r) => `  { pattern: ${r.pattern.toString()}, replace: ${JSON.stringify(r.replace)} }`
).join(',\n')}
]`;

const runtimeSource = `/**
 * ============================================================================
 * Antigravity Skin & Chinese Localization Runtime (反重力主题皮肤与全量汉化运行时引擎)
 * Version: 1.0.0
 * Supports:
 *   - Google Antigravity 2.0 Desktop App (Electron preload / webContents injection)
 *   - Antigravity IDE (Cascade Webview & Workbench)
 *   - Standalone Browser Preview Studio
 * ============================================================================
 */
(function () {
  'use strict';

  if (typeof window !== 'undefined' && window.__AGY_SKIN_I18N_LOADED__) {
    return;
  }
  if (typeof window !== 'undefined') {
    window.__AGY_SKIN_I18N_LOADED__ = true;
  }

  const STORAGE_KEY = 'antigravity.skin.i18n.config.v1';

  const SKIN_PRESETS = ${serializedSkins};

  const EXACT_DICT = ${serializedExactDict};

  const NATIVE_MENU_DICT = ${serializedNativeMenuDict};

  const PATTERN_RULES = ${serializedPatterns};

  const DEFAULT_CONFIG = {
    skinId: 'nebula-zero-g',
    langMode: 'zh-CN', // 'zh-CN' | 'bilingual' | 'en-US'
    enableGlass: true,
    enableGlow: true,
    enableAmbientBg: true,
    wallpaperUrl: '',
    wallpaperOpacity: 0.18,
    wallpaperBlur: 8,
    wallpaperFit: 'cover',
    fontFamily: '',
    codeFontFamily: '',
    fontScale: 100,
    showFloatingButton: true,
    customDict: {},
  };

  function loadConfig() {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      if (!raw) return { ...DEFAULT_CONFIG };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        customDict: { ...(parsed.customDict || {}) },
      };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  function saveConfig(cfg) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      }
    } catch {
      // ignore storage errors
    }
  }

  let state = loadConfig();
  let translatedNodeCount = 0;
  let isPanelOpen = false;
  let activeTab = 'skins'; // 'skins' | 'i18n' | 'effects' | 'about'
  let skinCategoryFilter = 'all'; // 'all' | 'dark' | 'light'

  // WeakMap storing original text of DOM Text nodes so switching back to en-US is 100% lossless
  const originalTextMap = new WeakMap();
  const lastTranslatedMap = new WeakMap();

  const SKIP_TAGS = new Set([
    'CODE',
    'PRE',
    'SCRIPT',
    'STYLE',
    'TEXTAREA',
    'INPUT',
    'SVG',
    'PATH',
    'NOSCRIPT',
    'KBD',
  ]);

  const SKIP_SELECTOR =
    'pre, code, .monaco-editor, .xterm, .cm-editor, .prism-code, [contenteditable="true"], [data-agy-no-translate="true"], #agy-skin-i18n-root';

  function getSkinById(id) {
    return SKIN_PRESETS.find((s) => s.id === id) || SKIN_PRESETS[0];
  }

  // ==========================================================================
  // 1. 文本翻译核心函数 (Text Translation Core)
  // ==========================================================================
  function translateString(rawText, mode, customDict) {
    if (!rawText || typeof rawText !== 'string') return null;
    if (mode === 'en-US') return rawText;

    const trimmed = rawText.trim();
    if (!trimmed || trimmed.length > 260) return null;

    // Skip strings that look like file paths, URLs, or pure numbers/symbols
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('file://') ||
      trimmed.startsWith('~/.') ||
      !/[a-zA-Z]/.test(trimmed)
    ) {
      return null;
    }

    let zh = (customDict && customDict[trimmed]) || EXACT_DICT[trimmed];

    if (!zh) {
      for (let i = 0; i < PATTERN_RULES.length; i++) {
        const rule = PATTERN_RULES[i];
        if (rule.pattern.test(trimmed)) {
          zh = trimmed.replace(rule.pattern, rule.replace);
          break;
        }
      }
    }

    if (!zh) return null;

    const leading = (rawText.match(/^\\s*/) || [''])[0];
    const trailing = (rawText.match(/\\s*$/) || [''])[0];

    if (mode === 'bilingual') {
      if (trimmed.length <= 26 && zh !== trimmed) {
        return leading + zh + ' · ' + trimmed + trailing;
      }
    }

    return leading + zh + trailing;
  }

  function shouldSkipElement(el) {
    if (!el || el.nodeType !== 1) return true;
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.closest && el.closest(SKIP_SELECTOR)) return true;
    return false;
  }

  function processTextNode(textNode) {
    const parent = textNode.parentElement;
    if (!parent || shouldSkipElement(parent)) return false;

    const currentVal = textNode.nodeValue;
    if (!currentVal || !currentVal.trim()) return false;

    // Record original English text if not yet recorded or if underlying framework updated it
    const lastTranslated = lastTranslatedMap.get(textNode);
    if (!originalTextMap.has(textNode) || (lastTranslated && currentVal !== lastTranslated)) {
      originalTextMap.set(textNode, currentVal);
    }

    const originalVal = originalTextMap.get(textNode);
    if (state.langMode === 'en-US') {
      if (currentVal !== originalVal) {
        textNode.nodeValue = originalVal;
        lastTranslatedMap.set(textNode, originalVal);
        return true;
      }
      return false;
    }

    const target = translateString(originalVal, state.langMode, state.customDict);
    if (target && target !== currentVal) {
      textNode.nodeValue = target;
      lastTranslatedMap.set(textNode, target);
      translatedNodeCount++;
      return true;
    }
    return false;
  }

  const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];

  function processElementAttributes(el) {
    if (!el || el.nodeType !== 1 || shouldSkipElement(el)) return;
    for (let i = 0; i < TRANSLATABLE_ATTRS.length; i++) {
      const attr = TRANSLATABLE_ATTRS[i];
      if (!el.hasAttribute(attr)) continue;
      const currentAttr = el.getAttribute(attr);
      if (!currentAttr) continue;

      const origKey = 'data-agy-orig-' + attr;
      const lastKey = 'data-agy-last-' + attr;
      const lastAttr = el.getAttribute(lastKey);

      if (!el.hasAttribute(origKey) || (lastAttr && currentAttr !== lastAttr)) {
        el.setAttribute(origKey, currentAttr);
      }

      const originalAttr = el.getAttribute(origKey);
      if (state.langMode === 'en-US') {
        if (currentAttr !== originalAttr) {
          el.setAttribute(attr, originalAttr);
          el.setAttribute(lastKey, originalAttr);
        }
        continue;
      }

      const translated = translateString(originalAttr, state.langMode, state.customDict);
      if (translated && translated !== currentAttr) {
        el.setAttribute(attr, translated);
        el.setAttribute(lastKey, translated);
        translatedNodeCount++;
      }
    }
  }

  function translateSubtree(root) {
    if (!root || typeof document === 'undefined') return;
    if (root.nodeType === 3) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1 && shouldSkipElement(root)) return;

    if (root.nodeType === 1) {
      processElementAttributes(root);
    }

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (node.nodeType === 1) {
            if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
            if (node.id === 'agy-skin-i18n-root') return NodeFilter.FILTER_REJECT;
            if (
              node.classList &&
              (node.classList.contains('monaco-editor') ||
                node.classList.contains('xterm') ||
                node.classList.contains('cm-editor'))
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            if (node.getAttribute && node.getAttribute('contenteditable') === 'true') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let current = walker.nextNode();
    while (current) {
      if (current.nodeType === 3) {
        processTextNode(current);
      } else if (current.nodeType === 1) {
        processElementAttributes(current);
      }
      current = walker.nextNode();
    }
  }

  // ==========================================================================
  // 2. 反重力主题皮肤引擎 (Anti-Gravity Skin & Visual Effects Engine)
  // ==========================================================================
  let isApplyingSkin = false;

  function installStylePropertyGuard() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    const docStyle = document.documentElement.style;
    if (docStyle.__agyGuarded) return;

    const origSetProperty = docStyle.setProperty.bind(docStyle);
    docStyle.__agyOrigSetProperty = origSetProperty;
    docStyle.__agyGuarded = true;

    docStyle.setProperty = function (prop, value, priority) {
      if (!isApplyingSkin && state.skinId !== 'native-default') {
        const activeSkin = getSkinById(state.skinId);
        if (activeSkin && activeSkin.tokens && activeSkin.tokens[prop]) {
          return origSetProperty(prop, activeSkin.tokens[prop], 'important');
        }
      }
      return origSetProperty(prop, value, priority);
    };
  }

  function applySkin() {
    if (typeof document === 'undefined' || !document.documentElement) return;
    installStylePropertyGuard();

    const skin = getSkinById(state.skinId);
    const isLight = skin.category === 'light';
    const docEl = document.documentElement;
    const origSetProperty = docEl.style.__agyOrigSetProperty || docEl.style.setProperty.bind(docEl.style);

    let styleEl = document.getElementById('agy-skin-theme-vars');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'agy-skin-theme-vars';
      (document.head || docEl).appendChild(styleEl);
    }

    if (skin.id === 'native-default' && !state.wallpaperUrl && !state.fontFamily && state.fontScale === 100) {
      styleEl.textContent = '';
      docEl.removeAttribute('data-agy-skin');
      updateWallpaperLayer();
      return;
    }

    docEl.setAttribute('data-agy-skin', skin.id);
    docEl.setAttribute('data-agy-skin-category', skin.category);

    // Sync body theme classes when body is ready
    if (document.body && skin.id !== 'native-default') {
      document.body.classList.toggle('dark', !isLight);
      document.body.classList.toggle('dark-theme', !isLight);
      document.body.classList.toggle('theme-dark', !isLight);
      document.body.classList.toggle('theme-light', isLight);
      docEl.style.colorScheme = isLight ? 'light' : 'dark';
    }

    isApplyingSkin = true;
    try {
      const tokenLines = [];
      if (skin.tokens && Object.keys(skin.tokens).length > 0) {
        for (const [k, v] of Object.entries(skin.tokens)) {
          tokenLines.push(\`  \${k}: \${v} !important;\`);
          origSetProperty(k, v, 'important');
        }
        // Mirror core tokens to --vscode-* and --sdk-* so embedded widgets match seamlessly
        const bg = skin.tokens['--background'];
        const fg = skin.tokens['--foreground'];
        const sidebar = skin.tokens['--sidebar'];
        const primary = skin.tokens['--primary'];
        const primaryFg = skin.tokens['--primary-foreground'];
        const card = skin.tokens['--card'];
        const border = skin.tokens['--border'];
        if (bg) {
          tokenLines.push(\`  --vscode-editor-background: \${bg} !important;\`);
          tokenLines.push(\`  --sdk-background-base: \${bg} !important;\`);
          tokenLines.push(\`  --sdk-background-primary: \${bg} !important;\`);
        }
        if (fg) {
          tokenLines.push(\`  --vscode-foreground: \${fg} !important;\`);
          tokenLines.push(\`  --sdk-color-text-base: \${fg} !important;\`);
        }
        if (sidebar) {
          tokenLines.push(\`  --vscode-sideBar-background: \${sidebar} !important;\`);
          tokenLines.push(\`  --vscode-titleBar-activeBackground: \${sidebar} !important;\`);
          tokenLines.push(\`  --sdk-background-secondary: \${sidebar} !important;\`);
        }
        if (card) {
          tokenLines.push(\`  --sdk-background-tertiary: \${card} !important;\`);
          tokenLines.push(\`  --sdk-color-surface: \${card} !important;\`);
        }
        if (primary) {
          tokenLines.push(\`  --vscode-button-background: \${primary} !important;\`);
          tokenLines.push(\`  --sdk-primary-color: \${primary} !important;\`);
        }
        if (primaryFg) {
          tokenLines.push(\`  --vscode-button-foreground: \${primaryFg} !important;\`);
        }
        if (border) {
          tokenLines.push(\`  --sdk-border-color: \${border} !important;\`);
        }
      }

      if (state.fontFamily) {
        tokenLines.push(\`  --vscode-font-family: \${state.fontFamily} !important;\`);
        tokenLines.push(\`  --font-sans: \${state.fontFamily} !important;\`);
      }
      if (state.codeFontFamily) {
        tokenLines.push(\`  --vscode-editor-font-family: \${state.codeFontFamily} !important;\`);
        tokenLines.push(\`  --editor-font-family: \${state.codeFontFamily} !important;\`);
        tokenLines.push(\`  --font-mono: \${state.codeFontFamily} !important;\`);
      }

      const ambientCss =
        state.enableAmbientBg && skin.effects && skin.effects.ambientBg && skin.effects.ambientBg !== 'none'
          ? \`background-image: \${skin.effects.ambientBg} !important; background-attachment: fixed !important;\`
          : '';

      const glassCss =
        state.enableGlass && skin.effects && skin.effects.glassBlur && skin.effects.glassBlur !== '0px'
          ? \`
  .bg-card, [class*="bg-card"], .sdk-card {
    backdrop-filter: blur(\${skin.effects.glassBlur}) saturate(140%) !important;
    -webkit-backdrop-filter: blur(\${skin.effects.glassBlur}) saturate(140%) !important;
  }\`
          : '';

      const glowCss =
        state.enableGlow && skin.effects && skin.effects.cardGlow && skin.effects.cardGlow !== 'none'
          ? \`
  .bg-card, .rounded-xl.border.border-border.shadow-lg {
    box-shadow: \${skin.effects.cardGlow} !important;
  }\`
          : '';

      const fontZoomCss =
        state.fontScale && state.fontScale !== 100
          ? \`html { font-size: \${(16 * state.fontScale) / 100}px !important; }\`
          : '';

      styleEl.textContent = \`
:root, html, body, body.theme-standalone, body.theme-dark, body.theme-light, .dark, .light {
\${tokenLines.join('\\n')}
}
body {
  background-color: var(--background) !important;
  color: var(--foreground) !important;
  \${ambientCss}
  \${state.fontFamily ? \`font-family: \${state.fontFamily} !important;\` : ''}
  transition: background-color 0.25s ease, color 0.2s ease;
}
\${glassCss}
\${glowCss}
\${fontZoomCss}
\`;
    } finally {
      isApplyingSkin = false;
    }

    updateWallpaperLayer();
  }

  function updateWallpaperLayer() {
    if (typeof document === 'undefined' || !document.body) return;
    let wp = document.getElementById('agy-skin-wallpaper-layer');
    if (!state.wallpaperUrl) {
      if (wp) wp.remove();
      return;
    }
    if (!wp) {
      wp = document.createElement('div');
      wp.id = 'agy-skin-wallpaper-layer';
      document.body.prepend(wp);
    }
    wp.style.cssText = \`
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9990;
      background-image: url("\${state.wallpaperUrl.replace(/"/g, '%22')}");
      background-size: \${state.wallpaperFit || 'cover'};
      background-position: center center;
      background-repeat: no-repeat;
      opacity: \${Number(state.wallpaperOpacity ?? 0.18)};
      filter: blur(\${Number(state.wallpaperBlur ?? 8)}px);
      transition: opacity 0.3s ease, filter 0.3s ease;
    \`;
  }

  // ==========================================================================
  // 3. 悬浮控制面板 UI (In-App Floating Capsule & Studio Drawer)
  // ==========================================================================
  function ensureControlPanel() {
    if (typeof document === 'undefined' || !document.body) return;
    if (document.getElementById('agy-skin-i18n-root')) return;

    const root = document.createElement('div');
    root.id = 'agy-skin-i18n-root';
    root.setAttribute('data-agy-no-translate', 'true');

    const style = document.createElement('style');
    style.textContent = \`
      #agy-skin-i18n-root {
        position: fixed;
        z-index: 2147483640;
        font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        line-height: 1.5;
        color: #E2E8F0;
        user-select: none;
      }
      .agy-fab {
        position: fixed;
        right: 18px;
        bottom: 18px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 14px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(56, 189, 248, 0.35);
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45), 0 0 14px rgba(56, 189, 248, 0.18);
        color: #F8FAFC;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 2147483641;
      }
      .agy-fab:hover {
        transform: translateY(-2px) scale(1.02);
        border-color: rgba(56, 189, 248, 0.75);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.35);
      }
      .agy-fab-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #38BDF8;
        box-shadow: 0 0 8px #38BDF8;
      }
      .agy-fab-badge {
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        background: rgba(56, 189, 248, 0.18);
        color: #38BDF8;
      }
      .agy-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(2, 6, 23, 0.55);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 2147483642;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
      }
      .agy-backdrop.open {
        opacity: 1;
        pointer-events: auto;
      }
      .agy-drawer {
        position: fixed;
        top: 16px;
        right: 16px;
        bottom: 16px;
        width: 440px;
        max-width: calc(100vw - 32px);
        background: rgba(13, 18, 30, 0.96);
        backdrop-filter: blur(24px) saturate(160%);
        -webkit-backdrop-filter: blur(24px) saturate(160%);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 16px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(56, 189, 248, 0.12);
        display: flex;
        flex-direction: column;
        z-index: 2147483643;
        transform: translateX(480px);
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        overflow: hidden;
      }
      .agy-drawer.open {
        transform: translateX(0);
      }
      .agy-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.14);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.10), rgba(129, 140, 248, 0.06));
      }
      .agy-title-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .agy-logo {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: linear-gradient(135deg, #38BDF8, #818CF8);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        box-shadow: 0 4px 12px rgba(56, 189, 248, 0.35);
      }
      .agy-title {
        font-size: 15px;
        font-weight: 700;
        color: #F8FAFC;
        margin: 0;
      }
      .agy-subtitle {
        font-size: 11px;
        color: #94A3B8;
        margin: 0;
      }
      .agy-close-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #CBD5E1;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }
      .agy-close-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #FFFFFF;
      }
      .agy-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        padding: 10px 16px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        background: rgba(9, 13, 22, 0.5);
      }
      .agy-tab {
        padding: 7px 6px;
        border-radius: 8px;
        border: 1px solid transparent;
        background: transparent;
        color: #94A3B8;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        text-align: center;
        transition: all 0.15s ease;
      }
      .agy-tab:hover {
        color: #E2E8F0;
        background: rgba(255, 255, 255, 0.04);
      }
      .agy-tab.active {
        background: rgba(56, 189, 248, 0.15);
        color: #38BDF8;
        border-color: rgba(56, 189, 248, 0.35);
      }
      .agy-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }
      .agy-section-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #94A3B8;
        margin: 0 0 10px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .agy-lang-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }
      .agy-lang-btn {
        padding: 10px 8px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(30, 41, 59, 0.55);
        color: #E2E8F0;
        cursor: pointer;
        text-align: center;
        transition: all 0.15s ease;
      }
      .agy-lang-btn:hover {
        border-color: rgba(56, 189, 248, 0.45);
      }
      .agy-lang-btn.active {
        background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(129, 140, 248, 0.18));
        border-color: #38BDF8;
        color: #FFFFFF;
        box-shadow: 0 0 14px rgba(56, 189, 248, 0.22);
      }
      .agy-lang-btn-title {
        font-size: 13px;
        font-weight: 700;
        display: block;
      }
      .agy-lang-btn-sub {
        font-size: 10px;
        color: #94A3B8;
        margin-top: 2px;
        display: block;
      }
      .agy-skin-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .agy-skin-card {
        border-radius: 12px;
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.65);
        padding: 10px;
        cursor: pointer;
        transition: all 0.18s ease;
        position: relative;
        overflow: hidden;
      }
      .agy-skin-card:hover {
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.5);
      }
      .agy-skin-card.active {
        border-color: #38BDF8;
        box-shadow: 0 0 0 1px #38BDF8, 0 8px 20px rgba(56, 189, 248, 0.2);
      }
      .agy-skin-preview {
        height: 54px;
        border-radius: 8px;
        margin-bottom: 8px;
        display: flex;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      .agy-skin-preview-sidebar {
        width: 28%;
        height: 100%;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .agy-skin-preview-main {
        flex: 1;
        padding: 6px 8px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .agy-skin-swatch-bar {
        height: 6px;
        border-radius: 3px;
        width: 75%;
      }
      .agy-skin-swatch-pill {
        height: 10px;
        width: 45%;
        border-radius: 4px;
        align-self: flex-end;
      }
      .agy-skin-name-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 4px;
      }
      .agy-skin-name {
        font-size: 12.5px;
        font-weight: 700;
        color: #F8FAFC;
      }
      .agy-skin-badge {
        font-size: 10px;
        padding: 1px 6px;
        border-radius: 999px;
        background: rgba(56, 189, 248, 0.16);
        color: #7DD3FC;
      }
      .agy-skin-desc {
        font-size: 11px;
        color: #94A3B8;
        margin-top: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .agy-control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(30, 41, 59, 0.45);
        border: 1px solid rgba(148, 163, 184, 0.14);
        margin-bottom: 10px;
      }
      .agy-input {
        width: 100%;
        box-sizing: border-box;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.25);
        background: rgba(15, 23, 42, 0.8);
        color: #F8FAFC;
        font-size: 12px;
        outline: none;
      }
      .agy-input:focus {
        border-color: #38BDF8;
      }
      .agy-btn {
        padding: 7px 12px;
        border-radius: 8px;
        border: 1px solid rgba(56, 189, 248, 0.35);
        background: rgba(56, 189, 248, 0.15);
        color: #38BDF8;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .agy-btn:hover {
        background: rgba(56, 189, 248, 0.28);
        color: #FFFFFF;
      }
      .agy-btn-secondary {
        border-color: rgba(148, 163, 184, 0.25);
        background: rgba(30, 41, 59, 0.6);
        color: #CBD5E1;
      }
      .agy-footer {
        padding: 12px 20px;
        border-top: 1px solid rgba(148, 163, 184, 0.14);
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        color: #64748B;
        background: rgba(9, 13, 22, 0.65);
      }
    \`;

    root.appendChild(style);

    const fab = document.createElement('button');
    fab.className = 'agy-fab';
    fab.id = 'agy-skin-i18n-fab';
    fab.title = '打开反重力皮肤与汉化控制中心 (快捷键: Cmd/Ctrl + Shift + L)';
    fab.addEventListener('click', () => {
      togglePanel(true);
    });

    const backdrop = document.createElement('div');
    backdrop.className = 'agy-backdrop';
    backdrop.id = 'agy-skin-i18n-backdrop';
    backdrop.addEventListener('click', () => {
      togglePanel(false);
    });

    const drawer = document.createElement('div');
    drawer.className = 'agy-drawer';
    drawer.id = 'agy-skin-i18n-drawer';

    root.appendChild(fab);
    root.appendChild(backdrop);
    root.appendChild(drawer);
    document.body.appendChild(root);

    renderControlPanel();
  }

  function togglePanel(open) {
    isPanelOpen = typeof open === 'boolean' ? open : !isPanelOpen;
    const backdrop = document.getElementById('agy-skin-i18n-backdrop');
    const drawer = document.getElementById('agy-skin-i18n-drawer');
    if (backdrop && drawer) {
      backdrop.classList.toggle('open', isPanelOpen);
      drawer.classList.toggle('open', isPanelOpen);
    }
    if (isPanelOpen) {
      renderControlPanel();
    }
  }

  function renderControlPanel() {
    if (typeof document === 'undefined') return;
    const fab = document.getElementById('agy-skin-i18n-fab');
    const drawer = document.getElementById('agy-skin-i18n-drawer');
    if (!fab || !drawer) return;

    const currentSkin = getSkinById(state.skinId);
    const langLabel =
      state.langMode === 'zh-CN' ? '简体中文' : state.langMode === 'bilingual' ? '双语对照' : 'EN';

    fab.style.display = state.showFloatingButton ? 'inline-flex' : 'none';
    fab.innerHTML = \`
      <span class="agy-fab-dot" style="background:\${currentSkin.preview.primary};box-shadow:0 0 8px \${currentSkin.preview.primary}"></span>
      <span>🎨 \${currentSkin.name}</span>
      <span class="agy-fab-badge">\${langLabel}</span>
    \`;

    const filteredSkins = SKIN_PRESETS.filter(
      (s) => skinCategoryFilter === 'all' || s.category === skinCategoryFilter
    );

    let bodyHtml = '';

    if (activeTab === 'skins') {
      bodyHtml = \`
        <div class="agy-section-title">
          <span>快速切换语言 (Instant i18n)</span>
          <span style="color:#38BDF8;font-weight:600;">已汉化 \${translatedNodeCount} 处节点</span>
        </div>
        <div class="agy-lang-grid">
          <button class="agy-lang-btn \${state.langMode === 'zh-CN' ? 'active' : ''}" data-action="set-lang" data-lang="zh-CN">
            <span class="agy-lang-btn-title">🇨🇳 简体中文</span>
            <span class="agy-lang-btn-sub">全量界面汉化</span>
          </button>
          <button class="agy-lang-btn \${state.langMode === 'bilingual' ? 'active' : ''}" data-action="set-lang" data-lang="bilingual">
            <span class="agy-lang-btn-title">🌗 中英双语</span>
            <span class="agy-lang-btn-sub">术语对照模式</span>
          </button>
          <button class="agy-lang-btn \${state.langMode === 'en-US' ? 'active' : ''}" data-action="set-lang" data-lang="en-US">
            <span class="agy-lang-btn-title">🇺🇸 English</span>
            <span class="agy-lang-btn-sub">还原官方英文</span>
          </button>
        </div>

        <div class="agy-section-title" style="margin-top:8px;">
          <span>反重力高定主题皮肤 (\${SKIN_PRESETS.length} 款)</span>
          <div style="display:flex;gap:4px;">
            <button class="agy-btn \${skinCategoryFilter === 'all' ? '' : 'agy-btn-secondary'}" style="padding:2px 8px;font-size:11px;" data-action="filter-skin" data-filter="all">全部</button>
            <button class="agy-btn \${skinCategoryFilter === 'dark' ? '' : 'agy-btn-secondary'}" style="padding:2px 8px;font-size:11px;" data-action="filter-skin" data-filter="dark">深色</button>
            <button class="agy-btn \${skinCategoryFilter === 'light' ? '' : 'agy-btn-secondary'}" style="padding:2px 8px;font-size:11px;" data-action="filter-skin" data-filter="light">浅色</button>
          </div>
        </div>
        <div class="agy-skin-grid">
          \${filteredSkins
            .map(
              (s) => \`
            <div class="agy-skin-card \${state.skinId === s.id ? 'active' : ''}" data-action="select-skin" data-skin="\${s.id}">
              <div class="agy-skin-preview" style="background:\${s.preview.bg}">
                <div class="agy-skin-preview-sidebar" style="background:\${s.preview.sidebar}">
                  <div class="agy-skin-swatch-bar" style="background:\${s.preview.primary};width:60%"></div>
                  <div class="agy-skin-swatch-bar" style="background:\${s.preview.text};opacity:0.35"></div>
                  <div class="agy-skin-swatch-bar" style="background:\${s.preview.text};opacity:0.2"></div>
                </div>
                <div class="agy-skin-preview-main">
                  <div style="background:\${s.preview.card};border-radius:5px;padding:5px;border:1px solid rgba(255,255,255,0.07)">
                    <div class="agy-skin-swatch-bar" style="background:\${s.preview.text};opacity:0.75;width:85%"></div>
                  </div>
                  <div class="agy-skin-swatch-pill" style="background:\${s.preview.primary}"></div>
                </div>
              </div>
              <div class="agy-skin-name-row">
                <span class="agy-skin-name">\${s.name}</span>
                <span class="agy-skin-badge">\${s.badge}</span>
              </div>
              <div class="agy-skin-desc">\${s.description}</div>
            </div>
          \`
            )
            .join('')}
        </div>
      \`;
    } else if (activeTab === 'i18n') {
      const customEntries = Object.entries(state.customDict || {});
      bodyHtml = \`
        <div class="agy-section-title">
          <span>语言模式设置</span>
        </div>
        <div class="agy-lang-grid">
          <button class="agy-lang-btn \${state.langMode === 'zh-CN' ? 'active' : ''}" data-action="set-lang" data-lang="zh-CN">
            <span class="agy-lang-btn-title">🇨🇳 简体中文</span>
            <span class="agy-lang-btn-sub">全量界面汉化</span>
          </button>
          <button class="agy-lang-btn \${state.langMode === 'bilingual' ? 'active' : ''}" data-action="set-lang" data-lang="bilingual">
            <span class="agy-lang-btn-title">🌗 中英双语</span>
            <span class="agy-lang-btn-sub">导航/按钮双语</span>
          </button>
          <button class="agy-lang-btn \${state.langMode === 'en-US' ? 'active' : ''}" data-action="set-lang" data-lang="en-US">
            <span class="agy-lang-btn-title">🇺🇸 English</span>
            <span class="agy-lang-btn-sub">原版英文界面</span>
          </button>
        </div>

        <div class="agy-control-row">
          <div>
            <div style="font-weight:600;color:#F8FAFC;">内置词条库容量</div>
            <div style="font-size:11px;color:#94A3B8;">精确词条 \${Object.keys(EXACT_DICT).length} 条 + 动态正则 \${PATTERN_RULES.length} 组</div>
          </div>
          <button class="agy-btn" data-action="rescan-dom">立即重扫页面</button>
        </div>

        <div class="agy-section-title" style="margin-top:16px;">
          <span>自定义术语覆盖 (Custom Glossary)</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
          <input class="agy-input" id="agy-custom-en" placeholder="输入英文原词 (例如: New Conversation)" />
          <div style="display:flex;gap:8px;">
            <input class="agy-input" id="agy-custom-zh" placeholder="输入自定义中文翻译 (例如: 开启新脑暴)" />
            <button class="agy-btn" style="white-space:nowrap;" data-action="add-custom-term">添加词条</button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:6px;">
          \${
            customEntries.length === 0
              ? '<div style="text-align:center;padding:18px;color:#64748B;border:1px dashed rgba(148,163,184,0.2);border-radius:10px;">暂未添加自定义词条，添加后将优先覆盖内置翻译</div>'
              : customEntries
                  .map(
                    ([en, zh]) => \`
                <div class="agy-control-row" style="margin-bottom:0;padding:8px 12px;">
                  <div style="font-size:12px;">
                    <span style="color:#94A3B8;">\${en}</span>
                    <span style="margin:0 6px;color:#38BDF8;">→</span>
                    <span style="color:#F8FAFC;font-weight:600;">\${zh}</span>
                  </div>
                  <button class="agy-btn agy-btn-secondary" style="padding:3px 8px;font-size:11px;" data-action="del-custom-term" data-en="\${encodeURIComponent(en)}">删除</button>
                </div>
              \`
                  )
                  .join('')
          }
        </div>
      \`;
    } else if (activeTab === 'effects') {
      bodyHtml = \`
        <div class="agy-section-title"><span>反重力视觉特效 (Visual Effects)</span></div>

        <div class="agy-control-row">
          <div>
            <div style="font-weight:600;color:#F8FAFC;">毛玻璃高透卡片 (Frosted Glass)</div>
            <div style="font-size:11px;color:#94A3B8;">为对话卡片与侧边栏启用 backdrop-filter 高斯模糊</div>
          </div>
          <input type="checkbox" \${state.enableGlass ? 'checked' : ''} data-action="toggle-glass" style="width:18px;height:18px;cursor:pointer;" />
        </div>

        <div class="agy-control-row">
          <div>
            <div style="font-weight:600;color:#F8FAFC;">能量微发光边框 (Neon Card Glow)</div>
            <div style="font-size:11px;color:#94A3B8;">为悬浮面板与活动卡片注入主题色环境辉光</div>
          </div>
          <input type="checkbox" \${state.enableGlow ? 'checked' : ''} data-action="toggle-glow" style="width:18px;height:18px;cursor:pointer;" />
        </div>

        <div class="agy-control-row">
          <div>
            <div style="font-weight:600;color:#F8FAFC;">星云环境渐变光晕 (Ambient Nebula)</div>
            <div style="font-size:11px;color:#94A3B8;">在窗口底层渲染柔和的双极光径向渐变</div>
          </div>
          <input type="checkbox" \${state.enableAmbientBg ? 'checked' : ''} data-action="toggle-ambient" style="width:18px;height:18px;cursor:pointer;" />
        </div>

        <div class="agy-section-title" style="margin-top:16px;">
          <span>自定义背景壁纸图层 (Wallpaper Overlay)</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;">
          <input class="agy-input" id="agy-wallpaper-url" value="\${state.wallpaperUrl || ''}" placeholder="输入图片 URL 或 Base64 数据地址..." />
          <div style="display:flex;gap:8px;">
            <button class="agy-btn" style="flex:1;" data-action="apply-wallpaper">应用壁纸</button>
            <label class="agy-btn agy-btn-secondary" style="flex:1;text-align:center;">
              上传本地图片
              <input type="file" accept="image/*" id="agy-wallpaper-file" style="display:none;" />
            </label>
            <button class="agy-btn agy-btn-secondary" data-action="clear-wallpaper">清除</button>
          </div>
        </div>

        <div class="agy-control-row">
          <span>壁纸不透明度 (\${Math.round((state.wallpaperOpacity || 0.18) * 100)}%)</span>
          <input type="range" min="0.02" max="0.55" step="0.02" value="\${state.wallpaperOpacity || 0.18}" data-action="wallpaper-opacity" />
        </div>

        <div class="agy-control-row">
          <span>壁纸高斯模糊 (\${state.wallpaperBlur ?? 8}px)</span>
          <input type="range" min="0" max="32" step="1" value="\${state.wallpaperBlur ?? 8}" data-action="wallpaper-blur" />
        </div>

        <div class="agy-section-title" style="margin-top:16px;">
          <span>字体与界面缩放 (Typography & Scale)</span>
        </div>
        <div class="agy-control-row">
          <span>全局字号缩放 (\${state.fontScale || 100}%)</span>
          <input type="range" min="85" max="125" step="5" value="\${state.fontScale || 100}" data-action="font-scale" />
        </div>
      \`;
    } else {
      bodyHtml = \`
        <div class="agy-section-title"><span>配置管理与快捷键</span></div>
        <div class="agy-control-row">
          <div>
            <div style="font-weight:600;color:#F8FAFC;">显示右下角悬浮球</div>
            <div style="font-size:11px;color:#94A3B8;">隐藏后仍可通过 Cmd/Ctrl + Shift + L 呼出面板</div>
          </div>
          <input type="checkbox" \${state.showFloatingButton ? 'checked' : ''} data-action="toggle-fab" style="width:18px;height:18px;cursor:pointer;" />
        </div>

        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <button class="agy-btn" style="flex:1;" data-action="export-config">导出配置 JSON</button>
          <button class="agy-btn agy-btn-secondary" style="flex:1;" data-action="reset-config">恢复默认设置</button>
        </div>

        <div style="padding:12px;border-radius:10px;background:rgba(15,23,42,0.75);border:1px solid rgba(148,163,184,0.16);font-size:12px;color:#94A3B8;line-height:1.7;">
          <div style="color:#F8FAFC;font-weight:700;margin-bottom:4px;">⌨️ 全局快捷键指南</div>
          <div>• <b>Cmd/Ctrl + Shift + L</b>：打开 / 关闭反重力皮肤与汉化面板</div>
          <div>• <b>Alt + Shift + Z</b>：一键在「简体中文 / 双语 / 英文」间循环切换</div>
          <div>• <b>Alt + Shift + S</b>：一键切换下一款反重力主题皮肤</div>
          <div style="margin-top:8px;color:#38BDF8;">🛡️ 代码安全隔离保护已开启：所有代码块 (&lt;pre&gt;/&lt;code&gt;)、Monaco 编辑器与 XTerm 终端内容均受严格保护，绝不被误翻译。</div>
        </div>
      \`;
    }

    drawer.innerHTML = \`
      <div class="agy-header">
        <div class="agy-title-wrap">
          <div class="agy-logo">🚀</div>
          <div>
            <h3 class="agy-title">反重力皮肤与汉化中心</h3>
            <p class="agy-subtitle">Antigravity Skin &amp; Localization Studio v1.0</p>
          </div>
        </div>
        <button class="agy-close-btn" data-action="close-panel" title="关闭 (Esc)">✕</button>
      </div>
      <div class="agy-tabs">
        <button class="agy-tab \${activeTab === 'skins' ? 'active' : ''}" data-action="switch-tab" data-tab="skins">🎨 主题皮肤</button>
        <button class="agy-tab \${activeTab === 'i18n' ? 'active' : ''}" data-action="switch-tab" data-tab="i18n">🌐 界面汉化</button>
        <button class="agy-tab \${activeTab === 'effects' ? 'active' : ''}" data-action="switch-tab" data-tab="effects">✨ 壁纸特效</button>
        <button class="agy-tab \${activeTab === 'about' ? 'active' : ''}" data-action="switch-tab" data-tab="about">⚙️ 快捷键</button>
      </div>
      <div class="agy-body">
        \${bodyHtml}
      </div>
      <div class="agy-footer">
        <span>当前皮肤：<b style="color:#E2E8F0">\${currentSkin.name}</b></span>
        <span>快捷键：<b>⌘/Ctrl + Shift + L</b></span>
      </div>
    \`;

    bindDrawerEvents(drawer);
  }

  function bindDrawerEvents(drawer) {
    drawer.querySelectorAll('[data-action]').forEach((el) => {
      const action = el.getAttribute('data-action');
      if (action === 'close-panel') {
        el.onclick = () => togglePanel(false);
      } else if (action === 'switch-tab') {
        el.onclick = () => {
          activeTab = el.getAttribute('data-tab');
          renderControlPanel();
        };
      } else if (action === 'filter-skin') {
        el.onclick = () => {
          skinCategoryFilter = el.getAttribute('data-filter');
          renderControlPanel();
        };
      } else if (action === 'select-skin') {
        el.onclick = () => {
          state.skinId = el.getAttribute('data-skin');
          saveConfig(state);
          applySkin();
          renderControlPanel();
        };
      } else if (action === 'set-lang') {
        el.onclick = () => {
          state.langMode = el.getAttribute('data-lang');
          saveConfig(state);
          translatedNodeCount = 0;
          translateSubtree(document.body);
          renderControlPanel();
        };
      } else if (action === 'rescan-dom') {
        el.onclick = () => {
          translatedNodeCount = 0;
          translateSubtree(document.body);
          renderControlPanel();
        };
      } else if (action === 'add-custom-term') {
        el.onclick = () => {
          const enInput = drawer.querySelector('#agy-custom-en');
          const zhInput = drawer.querySelector('#agy-custom-zh');
          const en = enInput ? enInput.value.trim() : '';
          const zh = zhInput ? zhInput.value.trim() : '';
          if (en && zh) {
            state.customDict[en] = zh;
            saveConfig(state);
            translateSubtree(document.body);
            renderControlPanel();
          }
        };
      } else if (action === 'del-custom-term') {
        el.onclick = () => {
          const en = decodeURIComponent(el.getAttribute('data-en') || '');
          delete state.customDict[en];
          saveConfig(state);
          translateSubtree(document.body);
          renderControlPanel();
        };
      } else if (action === 'toggle-glass') {
        el.onchange = () => {
          state.enableGlass = el.checked;
          saveConfig(state);
          applySkin();
        };
      } else if (action === 'toggle-glow') {
        el.onchange = () => {
          state.enableGlow = el.checked;
          saveConfig(state);
          applySkin();
        };
      } else if (action === 'toggle-ambient') {
        el.onchange = () => {
          state.enableAmbientBg = el.checked;
          saveConfig(state);
          applySkin();
        };
      } else if (action === 'apply-wallpaper') {
        el.onclick = () => {
          const input = drawer.querySelector('#agy-wallpaper-url');
          state.wallpaperUrl = input ? input.value.trim() : '';
          saveConfig(state);
          applySkin();
        };
      } else if (action === 'clear-wallpaper') {
        el.onclick = () => {
          state.wallpaperUrl = '';
          saveConfig(state);
          applySkin();
          renderControlPanel();
        };
      } else if (action === 'wallpaper-opacity') {
        el.oninput = () => {
          state.wallpaperOpacity = parseFloat(el.value);
          saveConfig(state);
          updateWallpaperLayer();
          renderControlPanel();
        };
      } else if (action === 'wallpaper-blur') {
        el.oninput = () => {
          state.wallpaperBlur = parseInt(el.value, 10);
          saveConfig(state);
          updateWallpaperLayer();
          renderControlPanel();
        };
      } else if (action === 'font-scale') {
        el.oninput = () => {
          state.fontScale = parseInt(el.value, 10);
          saveConfig(state);
          applySkin();
          renderControlPanel();
        };
      } else if (action === 'toggle-fab') {
        el.onchange = () => {
          state.showFloatingButton = el.checked;
          saveConfig(state);
          renderControlPanel();
        };
      } else if (action === 'export-config') {
        el.onclick = () => {
          const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'antigravity-skin-i18n-config.json';
          a.click();
          URL.revokeObjectURL(url);
        };
      } else if (action === 'reset-config') {
        el.onclick = () => {
          state = { ...DEFAULT_CONFIG, customDict: {} };
          saveConfig(state);
          applySkin();
          translateSubtree(document.body);
          renderControlPanel();
        };
      }
    });

    const fileInput = drawer.querySelector('#agy-wallpaper-file');
    if (fileInput) {
      fileInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          state.wallpaperUrl = String(reader.result || '');
          saveConfig(state);
          applySkin();
          renderControlPanel();
        };
        reader.readAsDataURL(file);
      };
    }
  }

  // ==========================================================================
  // 4. MutationObserver 实时监听与快捷键绑定 (Lifecycle & Observer)
  // ==========================================================================
  let pendingNodes = new Set();
  let rafScheduled = false;

  function scheduleFlush() {
    if (rafScheduled) return;
    rafScheduled = true;
    const scheduler =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (fn) => setTimeout(fn, 16);
    scheduler(() => {
      rafScheduled = false;
      const nodes = Array.from(pendingNodes);
      pendingNodes.clear();
      for (let i = 0; i < nodes.length; i++) {
        translateSubtree(nodes[i]);
      }
    });
  }

  function startObserver() {
    if (typeof document === 'undefined' || !document.body) return;
    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'childList') {
          for (let j = 0; j < m.addedNodes.length; j++) {
            pendingNodes.add(m.addedNodes[j]);
          }
        } else if (m.type === 'characterData') {
          pendingNodes.add(m.target);
        } else if (m.type === 'attributes') {
          pendingNodes.add(m.target);
        }
      }
      if (pendingNodes.size > 0) {
        scheduleFlush();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TRANSLATABLE_ATTRS,
    });
  }

  function registerShortcuts() {
    if (typeof window === 'undefined') return;
    window.addEventListener(
      'keydown',
      (e) => {
        // Cmd/Ctrl + Shift + L => Toggle Studio Panel
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
          e.preventDefault();
          togglePanel();
        }
        // Alt + Shift + Z => Cycle Language Mode
        if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault();
          const order = ['zh-CN', 'bilingual', 'en-US'];
          const nextIdx = (order.indexOf(state.langMode) + 1) % order.length;
          state.langMode = order[nextIdx];
          saveConfig(state);
          translateSubtree(document.body);
          renderControlPanel();
        }
        // Alt + Shift + S => Cycle Skin Preset
        if (e.altKey && e.shiftKey && e.key.toLowerCase() === 's') {
          e.preventDefault();
          const curIdx = SKIN_PRESETS.findIndex((s) => s.id === state.skinId);
          const nextSkin = SKIN_PRESETS[(curIdx + 1) % SKIN_PRESETS.length];
          state.skinId = nextSkin.id;
          saveConfig(state);
          applySkin();
          renderControlPanel();
        }
        // Escape => Close Panel
        if (e.key === 'Escape' && isPanelOpen) {
          togglePanel(false);
        }
      },
      true
    );
  }

  function init() {
    applySkin();
    if (typeof document !== 'undefined' && document.body) {
      ensureControlPanel();
      translateSubtree(document.body);
      startObserver();
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      init();
    }
    registerShortcuts();
  }

  // Expose programmatic API for Studio, Preload, and Automated Sandbox Tests
  const api = {
    version: '1.0.0',
    SKIN_PRESETS,
    EXACT_DICT,
    NATIVE_MENU_DICT,
    PATTERN_RULES,
    getState: () => ({ ...state }),
    setSkin: (skinId) => {
      state.skinId = skinId;
      saveConfig(state);
      applySkin();
      renderControlPanel();
    },
    setLangMode: (langMode) => {
      state.langMode = langMode;
      saveConfig(state);
      translatedNodeCount = 0;
      if (typeof document !== 'undefined' && document.body) {
        translateSubtree(document.body);
      }
      renderControlPanel();
    },
    setWallpaper: (url, opacity = 0.18, blur = 8) => {
      state.wallpaperUrl = url;
      state.wallpaperOpacity = opacity;
      state.wallpaperBlur = blur;
      saveConfig(state);
      applySkin();
      renderControlPanel();
    },
    translateString: (text, mode) =>
      translateString(text, mode || state.langMode, state.customDict),
    translateSubtree,
    applySkin,
    togglePanel,
  };

  if (typeof window !== 'undefined') {
    window.AntigravitySkinI18n = api;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.AntigravitySkinI18n = api;
  }
})();
`;

const outputPath = path.join(__dirname, 'agy-skin-i18n-runtime.js');
fs.writeFileSync(outputPath, runtimeSource, 'utf8');
console.log(
  `[build-runtime] Built ${outputPath} (${(Buffer.byteLength(runtimeSource) / 1024).toFixed(1)} KB) with ${SKIN_PRESETS.length} skins & ${Object.keys(EXACT_DICT).length} dictionary entries.`
);
