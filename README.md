# react-ai-translator

Drop-in floating AI translation button for any React app.  
Runs **100% in the browser** — no API key, no server, no data leaving the device.

```bash
npm install react-ai-translator
```

---

## How it works

1. Wrap your app with `<AITranslatorProvider>`.
2. A floating globe button appears in the bottom-right corner.
3. The user clicks it, picks a language, and every visible text node on the page is translated in-place.
4. Click again to revert or switch languages.

Translation is powered by [`@xenova/transformers`](https://github.com/xenova/transformers.js) running inside a Web Worker via WebAssembly. On first use the model (~150 MB) downloads from HuggingFace and is cached in the browser — subsequent uses are instant.

---

## Quick start

### Option A — Provider (recommended)

Wrap your app once and the floating button appears automatically:

```tsx
// main.tsx or App.tsx
import { AITranslatorProvider } from 'react-ai-translator';

export default function App() {
  return (
    <AITranslatorProvider>
      <YourApp />
    </AITranslatorProvider>
  );
}
```

### Option B — Manual button placement

Suppress the auto-injected button and place it yourself:

```tsx
import { AITranslatorProvider, FloatingTranslatorButton, useAITranslator } from 'react-ai-translator';

function MyButton() {
  const { status, modelProgress, currentLanguage, translatePage, revertPage } = useAITranslator();
  return (
    <FloatingTranslatorButton
      status={status}
      modelProgress={modelProgress}
      currentLanguage={currentLanguage}
      onTranslate={translatePage}
      onRevert={revertPage}
      position="bottom-left"
    />
  );
}

export default function App() {
  return (
    <AITranslatorProvider showFloatingButton={false}>
      <MyButton />
      <YourApp />
    </AITranslatorProvider>
  );
}
```

### Option C — Programmatic control

Drive translation from your own UI:

```tsx
import { AITranslatorProvider, useAITranslator } from 'react-ai-translator';

function TranslateButton() {
  const { translatePage, revertPage, status, currentLanguage } = useAITranslator();

  return (
    <div>
      <p>Status: {status}</p>
      <p>Language: {currentLanguage ?? 'original'}</p>
      <button onClick={() => translatePage('fr')}>Translate to French</button>
      <button onClick={revertPage}>Revert</button>
    </div>
  );
}

export default function App() {
  return (
    <AITranslatorProvider showFloatingButton={false}>
      <TranslateButton />
      <YourApp />
    </AITranslatorProvider>
  );
}
```

---

## API Reference

### `<AITranslatorProvider>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `ButtonPosition` | `'bottom-right'` | Where to place the floating button |
| `showFloatingButton` | `boolean` | `true` | Set to `false` to suppress the auto-injected button |
| `fromLang` | `string` | `'en'` | Source language code |
| `children` | `ReactNode` | — | Your app tree |

### `useAITranslator()`

Returns the full `UsePageTranslatorReturn` object:

| Property | Type | Description |
|----------|------|-------------|
| `status` | `TranslatorStatus` | Current state: `'idle' \| 'loading-model' \| 'translating' \| 'done' \| 'error'` |
| `modelProgress` | `number` | Model download progress 0–100 (relevant during `'loading-model'`) |
| `currentLanguage` | `string \| null` | Language code currently applied, or `null` if original |
| `error` | `string \| null` | Error message if `status === 'error'` |
| `translatePage` | `(toLang: string, fromLang?: string, root?: Node) => Promise<void>` | Translate the page (or a subtree) |
| `revertPage` | `() => void` | Restore all original text |
| `dispose` | `() => void` | Terminate the worker (call on unmount if not using the provider) |

### `<FloatingTranslatorButton>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `TranslatorStatus` | — | Current translator status |
| `modelProgress` | `number` | — | Download progress 0–100 |
| `currentLanguage` | `string \| null` | — | Currently active language |
| `onTranslate` | `(langCode: string) => void` | — | Called when a language is selected |
| `onRevert` | `() => void` | — | Called on long-press / right-click to revert |
| `position` | `ButtonPosition` | `'bottom-right'` | Button placement |

### `<LanguagePicker>`

| Prop | Type | Description |
|------|------|-------------|
| `onSelect` | `(code: string) => void` | Called when a language is chosen |
| `onClose` | `() => void` | Called when the picker is dismissed |
| `currentLang` | `string \| null` | Highlights the currently active language |

### `<TranslationProgress>`

| Prop | Type | Description |
|------|------|-------------|
| `progress` | `number` | Download progress 0–100 |

---

## TypeScript types

All public types are exported:

```ts
import type {
  // Core
  Language,
  WorkerResponse,

  // Status & state
  TranslatorStatus,
  PageTranslatorState,
  UsePageTranslatorReturn,

  // Context
  AITranslatorContextValue,
  AITranslatorProviderProps,

  // Components
  ButtonPosition,
  FloatingTranslatorButtonProps,
  LanguagePickerProps,
  TranslationProgressProps,

  // DOM engine
  TextNodeEntry,
  TextItem,
  Chunk,
} from 'react-ai-translator';
```

---

## Opt-out of translation

Add `data-no-translate` to any element to exclude it and all its children:

```html
<div data-no-translate>This text will never be translated.</div>
```

---

## SPAs / dynamic content

After a route change, call `translatePage` again to re-translate newly rendered content:

```ts
const { translatePage, currentLanguage } = useAITranslator();

useEffect(() => {
  if (currentLanguage) {
    translatePage(currentLanguage);
  }
}, [pathname]);
```

---

## Browser support

| Feature | Requirement |
|---------|-------------|
| Web Workers | All modern browsers |
| WebAssembly | All modern browsers |
| Model cache | IndexedDB (via transformers.js) |

---

## License

MIT

---

## Contributing

```bash
# clone the repo
git clone https://github.com/your-username/react-ai-translator.git
cd react-ai-translator

# install dependencies
npm install

# start the dev server
npm run dev
```

### Build for Production

```bash
npm run build
```
```

---

## Opt-out of translation

Add `data-no-translate` to any element to exclude it and all its children:

```html
<div data-no-translate>This text will never be translated.</div>
```

---

## SPAs / dynamic content

After a route change, call `translatePage` again to re-translate newly rendered content:

```ts
const { translatePage, currentLanguage } = useAITranslator();

useEffect(() => {
  if (currentLanguage) {
    translatePage(currentLanguage);
  }
}, [pathname]);
```

---

## Browser support

| Feature | Requirement |
|---------|-------------|
| Web Workers | All modern browsers |
| WebAssembly | All modern browsers |
| Model cache | IndexedDB (via transformers.js) |

---

## License

MIT

---

## Contributing

```bash
# clone the repo
git clone https://github.com/your-username/react-ai-translator.git
cd react-ai-translator

# install dependencies
npm install

# start the dev server
npm run dev
```

### Build for Production

```bash
npm run build
```
```
