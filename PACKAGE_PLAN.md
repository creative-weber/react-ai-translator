# react-ai-translator — npm Package Plan

## Overview

Convert the current `react-ai-chat` app into a reusable npm package.  
Install it in any React app → a floating AI translation button appears → user picks a language → the entire page is translated in-browser using `@xenova/transformers` (no API key, no server).

---

## User Experience Flow

```
App loads
   ↓
Floating globe/translate icon appears (bottom-right, fixed)
   ↓
User clicks icon
   ↓
Language picker popup opens (search + list of ~10 languages)
   ↓
User selects a language (e.g. French)
   ↓
Model loads (progress indicator shown on button)
   ↓
All visible text on the page is translated in-place
   ↓
Icon shows current language flag; click again to revert or switch
```

---

## Package API (Consumer-Facing)

### Option A — Provider (recommended)

```tsx
// main.tsx or App.tsx
import { AITranslatorProvider } from 'react-ai-translator';

<AITranslatorProvider>
  <App />
</AITranslatorProvider>
```

That's it. The floating button is injected automatically via the provider.

### Option B — Manual placement

```tsx
import { useAITranslator, FloatingTranslatorButton } from 'react-ai-translator';

// Place the button wherever you want
<FloatingTranslatorButton position="bottom-left" />
```

### Option C — Programmatic control

```tsx
import { useAITranslator } from 'react-ai-translator';

const { translatePage, revert, status, currentLanguage } = useAITranslator();
```

---

## Package Structure

```
react-ai-translator/
├── src/
│   ├── index.ts                          ← Public exports
│   ├── languages.ts                      ← Language list (reused from current)
│   ├── types.ts                          ← Shared types
│   │
│   ├── context/
│   │   └── TranslatorContext.tsx         ← React context + provider logic
│   │
│   ├── components/
│   │   ├── FloatingTranslatorButton.tsx  ← The floating icon button
│   │   ├── LanguagePicker.tsx            ← Dropdown/modal with language list
│   │   └── TranslationProgress.tsx      ← Model download progress UI
│   │
│   ├── hooks/
│   │   ├── usePageTranslator.ts          ← DOM walk + translate + revert
│   │   └── useTranslationWorker.ts       ← Worker lifecycle management
│   │
│   ├── utils/
│   │   ├── domWalker.ts                  ← Collect/replace visible text nodes
│   │   └── chunkText.ts                  ← Batch text into translation chunks
│   │
│   └── worker/
│       └── translation.worker.ts         ← Xenova pipeline (from current codebase)
│
├── package.json
├── vite.config.ts                        ← Library mode build
├── tsconfig.json
└── README.md
```

---

## Core Modules

### 1. `domWalker.ts`
- Walk `document.body` collecting all visible `Text` nodes
- Skip `<script>`, `<style>`, `<noscript>`, elements with `data-no-translate`
- Store `{ node, originalText }` references for revert
- Batch collected strings → send to worker → patch nodes back in-place

### 2. `TranslatorContext.tsx`
State managed by the provider:
```ts
{
  status: 'idle' | 'loading-model' | 'translating' | 'done' | 'error';
  modelProgress: number;        // 0-100 download %
  currentLanguage: string | null;
  translatePage: (toLang: string) => void;
  revertPage: () => void;
}
```

### 3. `useTranslationWorker.ts`
- Boots one `translation.worker.ts` instance (shared across calls)
- Exposes `translate(text, from, to): Promise<string>`
- Handles worker warmup, progress events, and error recovery

### 4. `FloatingTranslatorButton.tsx`
- Fixed position (configurable: `bottom-right` default)
- Shows globe icon when idle
- Shows spinner + % when model is loading
- Shows current language flag when translated
- Click → opens `LanguagePicker`
- Long press / right-click → revert to original

### 5. `LanguagePicker.tsx`
- Modal or popover
- Searchable list of languages
- Clicking a language calls `translatePage(code)`

---

## Build Configuration

### `vite.config.ts` — Library mode
```ts
build: {
  lib: {
    entry: 'src/index.ts',
    name: 'ReactAITranslator',
    formats: ['es', 'cjs'],
    fileName: (format) => `react-ai-translator.${format}.js`,
  },
  rollupOptions: {
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    output: {
      globals: { react: 'React', 'react-dom': 'ReactDOM' },
    },
  },
}
```

### `package.json` key fields
```json
{
  "name": "react-ai-translator",
  "version": "1.0.0",
  "main": "dist/react-ai-translator.cjs.js",
  "module": "dist/react-ai-translator.es.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/react-ai-translator.es.js",
      "require": "./dist/react-ai-translator.cjs.js"
    }
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "dependencies": {
    "@xenova/transformers": "^2.17.2"
  }
}
```

> **Note on `@xenova/transformers`:** The model runs fully client-side via WebAssembly. On first use it downloads the translation model (~150 MB) from HuggingFace and caches it in the browser. No server or API key needed.

---

## Web Worker Strategy

Because `@xenova/transformers` runs in a Web Worker, the package must either:

- **Bundle the worker** using Vite's `?worker&inline` import (recommended — zero config for consumers)
- Or document that the consumer must configure their bundler to handle `.worker.ts` files

The inline approach wraps the worker as a base64 blob URL, so no extra bundler config is needed by the consumer.

---

## Phases

### Phase 1 — Package scaffold ✅
- [x] Convert repo to library build (Vite library mode)
- [x] Create `src/index.ts` with public exports
- [x] Move worker to inline blob strategy (`?worker&inline` via `createWorker.ts`)
- [x] Add `tsconfig.lib.json` for declaration emit (`vite-plugin-dts`)

### Phase 2 — DOM translation engine ✅
- [x] Build `domWalker.ts` — collect visible text nodes
- [x] Build `chunkText.ts` — batch texts efficiently
- [x] Build `usePageTranslator.ts` — orchestrate walk → translate → patch → revert

### Phase 3 — UI components ✅
- [x] `FloatingTranslatorButton.tsx` with idle / loading / translated states
- [x] `LanguagePicker.tsx` with search
- [x] `TranslationProgress.tsx` for model download feedback
- [x] CSS-in-JS or scoped CSS so styles don't leak into consumer apps

### Phase 4 — Context & Provider ✅
- [x] `TranslatorContext.tsx` — full provider with state
- [x] `useAITranslator()` hook for programmatic access
- [x] `<AITranslatorProvider>` wrapping pattern

### Phase 5 — Polish & publish
- [x] README with install + usage examples
- [x] TypeScript type exports
- [x] `npm publish` (or GitHub Packages)
- [x] Demo app (Vite React app that installs from local build)

---

## Key Technical Challenges

| Challenge | Solution |
|-----------|----------|
| Worker bundling in library mode | Use `?worker&inline` Vite import to embed worker as blob |
| Model size (~150 MB first load) | Show download progress; cache in IndexedDB via transformers.js |
| CSS isolation | Use CSS Modules or `shadow DOM` for the floating button |
| Text node splitting (partial nodes) | Walk only leaf `Text` nodes; preserve HTML structure |
| Dynamic content (SPAs) | Expose `retranslate()` for consumers to call on route change; optionally use `MutationObserver` |
| RTL languages (Arabic, Hebrew) | Set `dir="auto"` on translated container |
| React portals | Inject floating button via `ReactDOM.createPortal` into `document.body` |
