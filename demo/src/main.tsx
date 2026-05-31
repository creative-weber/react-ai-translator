import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AITranslatorProvider } from 'react-ai-translator'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AITranslatorProvider>
      <App />
    </AITranslatorProvider>
  </StrictMode>
)
