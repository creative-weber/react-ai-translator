import { LANGUAGES } from '../languages';

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  disabledCode?: string;
}

export function LanguageSelector({ label, value, onChange, disabledCode }: Props) {
  return (
    <div className="lang-selector">
      <label className="lang-label">{label}</label>
      <div className="select-wrapper">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label={label}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code} disabled={lang.code === disabledCode}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
        <span className="select-arrow">▾</span>
      </div>
    </div>
  );
}
