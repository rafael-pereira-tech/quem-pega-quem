import { useEffect, useRef, useState } from 'react';

import type { FormEvent } from 'react';

interface AdminLoginProps {
  signInWithOtp: (email: string) => Promise<{ error: string | null }>;
}

/** Tela de login do admin (rota secreta /admin): pede o e-mail e dispara o
 *  magic link. Sem botão visível no app — só quem conhece a rota chega aqui.
 *  Ver ADR 0006. */
export function AdminLogin({ signInWithOtp }: AdminLoginProps) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <div className="grid h-full place-items-center px-4">
      <div className="bg-surface ring-border w-full max-w-xs rounded-2xl p-5 ring-1">
        <h2 className="font-display text-lg font-extrabold tracking-wide uppercase">
          Login do admin
        </h2>
        {status === 'sent' ? (
          <p className="text-text-mid mt-3 text-sm">
            Link enviado para <span className="text-text-hi">{value}</span>. Confira seu e-mail e
            clique para entrar.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-2">
            <input
              ref={inputRef}
              type="email"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="seu@email.com"
              aria-label="E-mail do admin"
              className="bg-bg ring-border w-full rounded-md px-3 py-2 text-sm ring-1"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="bg-third w-full rounded-md py-2 text-sm font-bold text-black uppercase disabled:opacity-50"
            >
              {status === 'sending' ? 'enviando…' : 'enviar link'}
            </button>
            {status === 'error' && <p className="text-card-red text-xs">{errMsg}</p>}
          </form>
        )}
        <p className="text-text-faint mt-3 font-mono text-[10px] tracking-wide uppercase">
          Acesso restrito
        </p>
      </div>
    </div>
  );
}
