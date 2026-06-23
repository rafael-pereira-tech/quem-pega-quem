interface ScoreBoxProps {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  label?: string;
}

/** Campo de placar (gols), aceita vazio = null. */
export function ScoreBox({ value, onChange, disabled, label }: ScoreBoxProps) {
  return (
    <input
      type="number"
      min={0}
      inputMode="numeric"
      aria-label={label}
      disabled={disabled}
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Math.max(0, Math.floor(Number(v))));
      }}
      className="w-9 rounded-md bg-slate-800 py-1 text-center text-slate-100 tabular-nums ring-1 ring-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}
