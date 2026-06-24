// Marca do Quem-Pega-Quem (handoff `design/design_handoff_marca`, direção B "Chave").
// O símbolo é 100% geometria — recriado como SVG inline, com as cores vindas dos
// tokens do tema (`var(--color-*)` definidos em src/index.css). Mantém paridade 1:1
// com `public/icon.svg`.

type BrandVariant = 'full' | 'mono' | 'light';

// Hífen não-quebrável: "QUEM-PEGA-QUEM" nunca quebra entre as palavras.
const WORDMARK = 'Quem‑Pega‑Quem';

const PALETTE: Record<
  BrandVariant,
  { tile: string; red: string; yellow: string; arch: string; dot: string }
> = {
  full: {
    tile: 'var(--color-surface)',
    red: 'var(--color-live)',
    yellow: 'var(--color-third)',
    arch: 'var(--color-go)',
    dot: 'var(--color-lime)',
  },
  // No claro o tile escurece, mas o símbolo continua colorido (não inverter).
  light: {
    tile: 'var(--color-bg)',
    red: 'var(--color-live)',
    yellow: 'var(--color-third)',
    arch: 'var(--color-go)',
    dot: 'var(--color-lime)',
  },
  // 1 cor: tudo lime.
  mono: {
    tile: 'var(--color-surface)',
    red: 'var(--color-lime)',
    yellow: 'var(--color-lime)',
    arch: 'var(--color-lime)',
    dot: 'var(--color-lime)',
  },
};

interface BrandMarkProps {
  /** Lado do tile em px. */
  size?: number;
  variant?: BrandVariant;
  /** Decorativo (escondido de leitores de tela) — use quando houver wordmark ao lado. */
  decorative?: boolean;
  className?: string;
}

/** Só o símbolo (tile + chave), sem o wordmark. */
export function BrandMark({
  size = 40,
  variant = 'full',
  decorative = false,
  className,
}: BrandMarkProps) {
  const c = PALETTE[variant];
  return (
    <svg
      viewBox="0 0 90 90"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Quem-Pega-Quem'}
      aria-hidden={decorative || undefined}
    >
      <rect width="90" height="90" rx="20" fill={c.tile} />
      <rect x="18" y="24.5" width="28" height="4" rx="2" fill={c.red} />
      <rect x="18" y="61.5" width="28" height="4" rx="2" fill={c.yellow} />
      <path
        d="M46 26.5 H54 A5 5 0 0 1 59 31.5 V58.5 A5 5 0 0 1 54 63.5 H46"
        fill="none"
        stroke={c.arch}
        strokeWidth="4"
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      <circle cx="65.5" cy="45" r="6.5" fill={c.dot} />
    </svg>
  );
}

interface LogoProps {
  orientation?: 'horizontal' | 'stacked';
  variant?: BrandVariant;
  /** Sub-rótulo "Mata-mata ao vivo · Copa 2026" (só no horizontal). */
  sub?: boolean;
  /** Lado do tile em px (default 64 horizontal / 72 empilhado). */
  markSize?: number;
  className?: string;
}

/** Lockup completo: símbolo + wordmark "QUEM-PEGA-QUEM". */
export function Logo({
  orientation = 'horizontal',
  variant = 'full',
  sub = false,
  markSize,
  className,
}: LogoProps) {
  const wordColor = variant === 'light' ? 'text-bg' : 'text-text-hi';

  if (orientation === 'stacked') {
    return (
      <div className={`flex flex-col items-center gap-[18px] text-center ${className ?? ''}`}>
        <BrandMark size={markSize ?? 72} variant={variant} decorative />
        <div
          aria-label="Quem-Pega-Quem"
          className={`font-display text-[1.875rem] leading-[.9] font-extrabold tracking-[.01em] uppercase ${wordColor}`}
        >
          <span>Quem</span>
          <br />
          <span>Pega</span>
          <br />
          <span>Quem</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-5 ${className ?? ''}`}>
      <BrandMark size={markSize ?? 64} variant={variant} decorative />
      <div>
        <div
          className={`font-display text-[2.5rem] leading-[.92] font-extrabold tracking-[.01em] uppercase ${wordColor}`}
        >
          {WORDMARK}
        </div>
        {sub && (
          <div className="text-text-low mt-[7px] font-mono text-[.6875rem] tracking-[.16em] uppercase">
            Mata&#8209;mata ao vivo · Copa 2026
          </div>
        )}
      </div>
    </div>
  );
}
