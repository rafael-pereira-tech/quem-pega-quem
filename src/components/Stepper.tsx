import { scoreFieldProps } from '../lib/scoreFocus';

interface StepperProps {
  value: number | null;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  /** Nome acessível do campo (ex.: "Gols de BRA — mandante"). */
  label?: string;
}

/** Stepper horizontal: − [número editável] +. */
export function Stepper({ value, onChange, disabled, label }: StepperProps) {
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
        tabIndex={-1}
        className={`grid h-[22px] w-[22px] place-items-center rounded-full leading-none font-bold transition active:scale-95 ${minusDisabled ? 'bg-surface-dim text-text-faint ring-hairline cursor-not-allowed ring-1' : 'bg-raised text-text-mid ring-border ring-1'}`}
      >
        −
      </button>
      <input
        {...scoreFieldProps}
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
        className="font-display text-text-hi focus:border-live disabled:text-text-hi w-6 border-b-2 border-[#2c3442] bg-transparent text-center text-2xl leading-none font-extrabold tabular-nums disabled:border-transparent"
        placeholder="–"
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled}
        aria-label="+1"
        tabIndex={-1}
        className="bg-live grid h-[22px] w-[22px] place-items-center rounded-full leading-none font-bold text-white transition active:scale-95 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
