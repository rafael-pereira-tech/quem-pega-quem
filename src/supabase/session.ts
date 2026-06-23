import { useEffect, useState } from 'react';

import { supabase } from './client';

export interface SessionState {
  userId: string | null;
  isAdmin: boolean;
  nickname: string | null;
  /** auth resolvido (mesmo que sem supabase). */
  ready: boolean;
}

const INITIAL: SessionState = { userId: null, isAdmin: false, nickname: null, ready: false };

/**
 * Garante uma sessão (login anônimo se necessário) e carrega role + apelido.
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

    async function init() {
      const { data: sessionData } = await supabase!.auth.getSession();
      let session = sessionData.session;
      if (!session) {
        const { data, error } = await supabase!.auth.signInAnonymously();
        if (error) {
          console.error('signInAnonymously', error.message);
          if (active) setState((s) => ({ ...s, ready: true }));
          return;
        }
        session = data.session;
      }
      const userId = session?.user.id ?? null;
      const prof = userId ? await loadProfile(userId) : { isAdmin: false, nickname: null };
      if (active) setState({ userId, ...prof, ready: true });
    }

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session?.user) {
        setState((s) => ({ ...s, userId: session.user.id }));
      }
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

  return { ...state, setNickname };
}
