# react-ai-translator — demo app

A minimal Vite + React app demonstrating the `react-ai-translator` package installed from the local build.

## Setup

```bash
# From the repo root — build the library first
npm run build

# Then install and run the demo
cd demo
npm install
npm run dev
```

Open http://localhost:5173 — the floating globe button appears in the bottom-right corner.

## What it shows

- `AITranslatorProvider` wrapping the entire app (the recommended usage pattern)
- Floating translate button auto-injected via the provider
- Click → language picker → full page translation in-browser
- Long-press or right-click the button to revert
