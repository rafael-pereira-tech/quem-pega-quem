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
      className="bg-raised text-text-hi ring-border w-9 rounded-md py-1 text-center tabular-nums ring-1 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}
