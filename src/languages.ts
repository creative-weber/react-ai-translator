export const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'fr', label: 'French',     flag: '🇫🇷' },
  { code: 'de', label: 'German',     flag: '🇩🇪' },
  { code: 'es', label: 'Spanish',    flag: '🇪🇸' },
  { code: 'it', label: 'Italian',    flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', label: 'Dutch',      flag: '🇳🇱' },
  { code: 'ru', label: 'Russian',    flag: '🇷🇺' },
  { code: 'zh', label: 'Chinese',    flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic',     flag: '🇸🇦' },
] as const;

export function getLangLabel(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.label ?? code.toUpperCase();
}

export function getLangFlag(code: string): string {
  return LANGUAGES.find(l => l.code === code)?.flag ?? '🌐';
}
