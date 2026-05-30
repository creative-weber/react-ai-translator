# react-ai-translator

A privacy-first, fully client-side AI translation app built with React, TypeScript, and Vite. All translation runs **locally in your browser** via a Web Worker powered by [`@xenova/transformers`](https://github.com/xenova/transformers.js) — no server, no API keys, no data leaving your device.

## Features

- **100% client-side** — translation happens in a Web Worker using WebAssembly/ONNX models
- **Multi-language support** — translate between a wide range of languages
- **Protected terms** — mark words or phrases that should not be translated
- **Chat-style UI** — messages display source and translated text side by side
- **Zero dependencies on external APIs** — works fully offline after the model is downloaded

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| AI / NLP | [@xenova/transformers](https://github.com/xenova/transformers.js) |
| Inference | Web Worker (off main thread) |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm / yarn)

### Install & Run

```bash
# clone the repo
git clone https://github.com/your-username/react-ai-translator.git
cd react-ai-translator

# install dependencies
pnpm install

# start the dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The translation model (~100 MB) is downloaded from Hugging Face on first use and cached in your browser. Subsequent translations are instant.

### Build for Production

```bash
pnpm build
pnpm preview
```

## Project Structure

```
src/
  components/
    LanguageSelector.tsx   # source / target language dropdowns
    MessageBubble.tsx      # chat message display
  worker/
    translation.worker.ts  # Web Worker — runs the AI model off-thread
  languages.ts             # supported language list
  types.ts                 # shared TypeScript types
  App.tsx                  # main application shell
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push and open a PR

## License

MIT — see [LICENSE](./LICENSE) for details.

---

<!-- original Vite template notes preserved below for reference -->
<details>
<summary>Vite + ESLint configuration notes</summary>

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
