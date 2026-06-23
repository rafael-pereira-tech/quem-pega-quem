import { flagOf } from '../lib/flags';

/** Emoji de bandeira da seleção (pelo código FIFA). */
export function Flag({ code, className = '' }: { code: string | undefined; className?: string }) {
  return (
    <span className={`leading-none ${className}`} aria-hidden>
      {flagOf(code)}
    </span>
  );
}
