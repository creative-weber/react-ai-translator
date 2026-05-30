export interface Language {
  code: string;
  label: string;
  flag: string;
}

export interface ChatMessage {
  id: string;
  originalText: string;
  translatedText?: string;
  fromLang: string;
  toLang: string;
  status: 'pending' | 'loading' | 'done' | 'error';
  progress?: number; // 0-100 download progress
  error?: string;
  timestamp: Date;
}

export type WorkerResponse =
  | { id: string; status: 'loading'; model: string }
  | { id: string; status: 'progress'; loaded: number; total: number }
  | { id: string; status: 'done'; result: string }
  | { id: string; status: 'error'; error: string };
