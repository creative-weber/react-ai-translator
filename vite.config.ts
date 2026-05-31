import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.lib.json',
      insertTypesEntry: true,
    }),
  ],
  publicDir: false,
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'ReactAITranslator',
      formats: ['es', 'cjs'],
      fileName: (format) => `react-ai-translator.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
  },
  resolve: {
    alias: {
      // Point onnxruntime-web to its fully self-contained bundle so that
      // onnxruntime-common is bundled internally and registerBackend is never
      // undefined at startup inside the Web Worker.
      // ort-web.es6.min.js externalises onnxruntime-common (UMD param), which
      // leaves registerBackend undefined when the worker bundle resolves it.
      // ort.es6.min.js bundles everything inline and has no external deps.
      'onnxruntime-web': path.resolve(
        './node_modules/onnxruntime-web/dist/ort.es6.min.js'
      ),
    },
  },
  optimizeDeps: {
    // Keep @xenova/transformers out of the pre-bundler so its dynamic WASM
    // asset loading is not disturbed.  onnxruntime-web must be pre-bundled
    // so esbuild converts the UMD alias target (ort.es6.min.js) to ESM —
    // without this the browser receives raw UMD and ONNX resolves as undefined.
    exclude: ['@xenova/transformers'],
  },
  worker: {
    format: 'es',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
