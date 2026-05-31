import './App.css'

export default function App() {
  return (
    <main>
      <header>
        <h1>react-ai-translator demo</h1>
        <p>
          A floating globe button appears in the bottom-right corner. Click it,
          pick a language, and watch the entire page translate in your browser —
          no server, no API key.
        </p>
      </header>

      <section>
        <h2>How it works</h2>
        <p>
          The package uses <strong>@xenova/transformers</strong> to run a
          Helsinki-NLP translation model entirely inside a Web Worker. On first
          use the model (~150 MB) is downloaded from HuggingFace and cached in
          the browser's IndexedDB, so subsequent visits are instant.
        </p>
      </section>

      <section>
        <h2>Installation</h2>
        <pre><code>npm install react-ai-translator</code></pre>
        <pre><code>{`// main.tsx
import { AITranslatorProvider } from 'react-ai-translator'

<AITranslatorProvider>
  <App />
</AITranslatorProvider>`}</code></pre>
      </section>

      <section>
        <h2>Features</h2>
        <ul>
          <li>100% client-side — no API key or server required</li>
          <li>Floating translate button, auto-injected via provider</li>
          <li>Supports 10+ languages with live search</li>
          <li>One-click revert to original text</li>
          <li>Model download progress indicator</li>
          <li>Styles fully isolated — nothing leaks into your app</li>
        </ul>
      </section>

      <section>
        <h2>Supported languages</h2>
        <p>
          French, Spanish, German, Italian, Portuguese, Dutch, Russian, Chinese
          (Simplified), Japanese, Arabic, Hindi, and more.
        </p>
      </section>

      <footer>
        <p>
          Built with{' '}
          <a href="https://www.npmjs.com/package/react-ai-translator" target="_blank" rel="noreferrer">
            react-ai-translator
          </a>{' '}
          · Open source · MIT licence
        </p>
      </footer>
    </main>
  )
}
