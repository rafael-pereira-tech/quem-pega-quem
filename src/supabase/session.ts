import { useEffect, useState } from 'react';

import { supabase } from './client';

import type { Session } from '@supabase/supabase-js';

export interface SessionState {
  userId: string | null;
  isAdmin: boolean;
  nickname: string | null;
  /** e-mail quando logado por magic link; null para sessão anônima. */
  email: string | null;
  /** auth resolvido (mesmo que sem supabase). */
  ready: boolean;
}

const INITIAL: SessionState = {
  userId: null,
  isAdmin: false,
  nickname: null,
  email: null,
  ready: false,
};

/**
 * Garante uma sessão (login anônimo se necessário) e carrega role + apelido.
 * Usuário comum = anônimo; admin entra por magic link (e-mail) — ver ADR 0006.
 * Sem supabase configurado, resolve em modo "offline" (ready, sem usuário).
 */
export function useSession() {
  const [state, setState] = useState<SessionState>(INITIAL);

  useEffect(() => {
    if (!supabase) {
      setState((s) => ({ ...s, ready: true }));
      return;
    }
    let active = true;

    async function loadProfile(userId: string) {
      const { data } = await supabase!
        .from('profiles')
        .select('role, nickname')
        .eq('user_id', userId)
        .maybeSingle();
      return {
        isAdmin: (data as { role?: string } | null)?.role === 'admin',
        nickname: (data as { nickname?: string | null } | null)?.nickname ?? null,
      };
    }

    async function apply(session: Session) {
      const { user } = session;
      const prof = await loadProfile(user.id);
      if (active) setState({ userId: user.id, email: user.email ?? null, ...prof, ready: true });
    }

    async function init() {
      const { data } = await supabase!.auth.getSession();
      let session = data.session;
      if (!session) {
        const { data: anon, error } = await supabase!.auth.signInAnonymously();
        if (error) {
          console.error('signInAnonymously', error.message);
          if (active) setState((s) => ({ ...s, ready: true }));
          return;
        }
        session = anon.session;
      }
      if (session) await apply(session);
    }

    void init();

    // Recarrega role/e-mail a cada mudança de auth (login por link, logout→anon).
    // Sessões nulas são ignoradas: o logout dispara um novo login anônimo, que
    // chega aqui como SIGNED_IN e atualiza o estado — sem piscar "sem usuário".
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) void apply(session);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function setNickname(nickname: string) {
    if (!supabase || !state.userId) return;
    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('user_id', state.userId);
    if (!error) setState((s) => ({ ...s, nickname }));
  }

  /** Envia o magic link de login para o e-mail (admin). */
  async function signInWithOtp(email: string): Promise<{ error: string | null }> {
    if (!supabase) return { error: 'Supabase não configurado' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }

  /** Sai da conta e volta para uma sessão anônima. */
  async function signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
    await supabase.auth.signInAnonymously();
  }

  return { ...state, setNickname, signInWithOtp, signOut };
}
