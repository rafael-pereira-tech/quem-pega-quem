import { useEffect, useRef, useState } from 'react';

import type { FormEvent } from 'react';

interface AdminAuthProps {
  email: string | null;
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const PILL =
  'ring-border text-text-mid rounded-md px-2 py-1.5 font-mono text-[10px] uppercase ring-1';

/** Controle de login do admin: "sair" quando logado por e-mail, ou um "entrar"
 *  que abre um campo de e-mail para receber o magic link (ver ADR 0006). */
export function AdminAuth({ email, signInWithOtp, signOut }: AdminAuthProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca o campo ao abrir (foco programático em vez de autoFocus, por a11y).
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (email) {
    return (
      <button onClick={() => void signOut()} title={email} className={PILL}>
        sair
      </button>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const addr = value.trim();
    if (!addr) return;
    setStatus('sending');
    setErrMsg(null);
    const { error } = await signInWithOtp(addr);
    if (error) {
      setStatus('error');
      setErrMsg(error);
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className={PILL}>
        entrar
      </button>
      {open && (
        <div className="bg-surface ring-border absolute right-0 z-50 mt-1.5 w-56 rounded-lg p-3 ring-1">
          {status === 'sent' ? (
            <p className="text-text-mid text-xs">
              Link enviado para <span className="text-text-hi">{value}</span>. Confira seu e-mail e
              clique para entrar.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-2">
              <p className="text-text-low font-mono text-[10px] tracking-wide uppercase">
                Login do admin
              </p>
              <input
                ref={inputRef}
                type="email"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="seu@email.com"
                aria-label="E-mail do admin"
                className="bg-bg ring-border w-full rounded-md px-2 py-1 text-sm ring-1"
              />
              <button
                type="submit"
                disabled={status === 'sending'}
                className="bg-third w-full rounded-md py-1 text-[11px] font-bold text-black uppercase disabled:opacity-50"
              >
                {status === 'sending' ? 'enviando…' : 'enviar link'}
              </button>
              {status === 'error' && <p className="text-card-red text-[10px]">{errMsg}</p>}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
