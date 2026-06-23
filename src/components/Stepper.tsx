interface StepperProps {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
}

/** Stepper horizontal: − [número editável] +. */
export function Stepper({ value, onChange, disabled }: StepperProps) {
  const inc = () => onChange(value === null ? 0 : value + 1);
  const dec = () => {
    if (value === null || value <= 0) return;
    onChange(value - 1);
  };
  const minusDisabled = disabled || value === null || value <= 0;

  return (
    <div className="flex items-center gap-1.5 select-none">
      <button
        type="button"
        onClick={dec}
        disabled={minusDisabled}
        aria-label="-1"
        className={`w-[22px] h-[22px] rounded-full grid place-items-center font-bold leading-none transition active:scale-95
          ${minusDisabled ? "bg-surface-dim text-text-faint ring-1 ring-hairline cursor-not-allowed" : "bg-raised text-text-mid ring-1 ring-border"}`}
      >
        −
      </button>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Math.max(0, Math.floor(Number(v))));
        }}
        className="w-6 text-center font-display font-extrabold text-2xl leading-none tabular-nums bg-transparent
          text-text-hi outline-none border-b-2 border-[#2c3442] focus:border-live disabled:border-transparent
          disabled:text-text-hi"
        placeholder="–"
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled}
        aria-label="+1"
        className="w-[22px] h-[22px] rounded-full bg-live text-white grid place-items-center font-bold leading-none
          transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-live/25 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
