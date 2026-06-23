import { useEffect } from 'react';

import { useStore } from '../state/store';

import { supabase } from './client';
import { fetchOfficial } from './official';

/**
 * Carrega os resultados oficiais e assina o Realtime: quando o admin grava,
 * todos os clientes recebem a atualização e a chave recalcula sozinha.
 */
export function useOfficialSync() {
  const setOfficial = useStore((s) => s.setOfficial);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    let active = true;

    const refresh = () => {
      void fetchOfficial().then((o) => {
        if (active) setOfficial(o);
      });
    };
    refresh();

    const channel = sb
      .channel('official_results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'official_results' }, refresh)
      .subscribe();

    return () => {
      active = false;
      void sb.removeChannel(channel);
    };
  }, [setOfficial]);
}
