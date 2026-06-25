import { useState } from 'react';

import { staticData, teamsById } from '../data/static';
import { GROUP_IDS, type GroupId, type TeamId } from '../engine/types';
import { buildCards } from '../lib/officialCards';
import { useStore } from '../state/store';
import { deleteOfficial, upsertOfficial } from '../supabase/official';

import { ScoreBox } from './ScoreBox';

const teamName = (id: string) => teamsById.get(id)?.name || id;

interface Draft {
  h: number | null;
  a: number | null;
  hy: number | null; // amarelos casa
  hr: number | null; // vermelhos casa
  ay: number | null; // amarelos fora
  ar: number | null; // vermelhos fora
}

export function AdminPanel({ userId }: { userId: string }) {
  const official = useStore((s) => s.official);
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const valueOf = (matchId: string, home: TeamId, away: TeamId): Draft => {
    const d = draft[matchId];
    if (d) return d;
    const off = official[matchId];
    const hc = off?.cards?.[home];
    const ac = off?.cards?.[away];
    return {
      h: off?.homeGoals ?? null,
      a: off?.awayGoals ?? null,
      hy: hc?.yellow ?? null,
      hr: hc?.directRed ?? null,
      ay: ac?.yellow ?? null,
      ar: ac?.directRed ?? null,
    };
  };

  const setDraftFor = (matchId: string, home: TeamId, away: TeamId, patch: Partial<Draft>) =>
    setDraft((prev) => ({
      ...prev,
      [matchId]: { ...valueOf(matchId, home, away), ...patch },
    }));

  const clearDraft = (matchId: string) =>
    setDraft((prev) => {
      const n = { ...prev };
      delete n[matchId];
      return n;
    });

  /** Grava o resultado: `locked=false` = ao vivo (overlay), `true` = encerrado
   *  (entra na simulação de todos). Ver ADR 0006. */
  async function push(m: { id: string; home: TeamId; away: TeamId }, locked: boolean) {
    const v = valueOf(m.id, m.home, m.away);
    if (v.h === null || v.a === null) return;
    setBusy(m.id);
    const { error } = await upsertOfficial({
      matchId: m.id,
      phase: 'group',
      homeGoals: v.h,
      awayGoals: v.a,
      cards: buildCards(m.home, m.away, v),
      locked,
      userId,
    });
    setBusy(null);
    setMsg(error ? `Erro: ${error}` : locked ? 'Encerrado ✓' : 'Ao vivo ✓');
    if (!error) clearDraft(m.id);
    setTimeout(() => setMsg(null), 2500);
  }

  async function remove(matchId: string) {
    setBusy(matchId);
    const { error } = await deleteOfficial(matchId);
    setBusy(null);
    setMsg(error ? `Erro: ${error}` : 'Removido');
    if (!error) clearDraft(matchId);
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-text-mid text-sm">
          Lançar jogos <span className="text-live font-medium">ao vivo</span>: placar e cartões
          atualizam pra todos em tempo real. <span className="text-go font-medium">Encerrar</span>{' '}
          trava e entra na simulação de todos.
        </p>
        {msg && <span className="text-text-hi shrink-0 text-xs">{msg}</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {GROUP_IDS.map((g: GroupId) => {
          const matches = staticData.seedMatches.filter((m) => m.group === g);
          return (
            <section key={g} className="bg-surface ring-hairline rounded-xl p-3 ring-1">
              <h3 className="font-display mb-2 text-[15px] font-extrabold tracking-wide uppercase">
                Grupo {g}
              </h3>
              <div className="space-y-2">
                {matches.map((m) => {
                  const v = valueOf(m.id, m.home, m.away);
                  const off = official[m.id];
                  const status = !off ? 'none' : off.locked ? 'final' : 'live';
                  const hasScore = v.h !== null && v.a !== null;
                  const disabled = !hasScore || busy === m.id;
                  return (
                    <div key={m.id} className="bg-bg ring-hairline rounded-lg p-2 ring-1">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-text-faint font-mono text-[9px]">R{m.round}</span>
                        {status === 'live' && (
                          <span className="text-live flex items-center gap-1 font-mono text-[9px] uppercase">
                            <span className="live-dot bg-live inline-block h-1.5 w-1.5 rounded-full" />
                            ao vivo
                          </span>
                        )}
                        {status === 'final' && (
                          <span className="ring-border text-text-low rounded px-1.5 font-mono text-[9px] uppercase ring-1">
                            encerrado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-1.5 text-sm">
                        <span className="flex-1 truncate text-right font-semibold">
                          {teamName(m.home)}
                        </span>
                        <ScoreBox
                          value={v.h}
                          onChange={(x) => setDraftFor(m.id, m.home, m.away, { h: x })}
                          label={`Gols de ${teamName(m.home)} (casa)`}
                        />
                        <span className="text-text-faint">×</span>
                        <ScoreBox
                          value={v.a}
                          onChange={(x) => setDraftFor(m.id, m.home, m.away, { a: x })}
                          label={`Gols de ${teamName(m.away)} (fora)`}
                        />
                        <span className="flex-1 truncate font-semibold">{teamName(m.away)}</span>
                      </div>

                      <div className="text-text-mid mt-1.5 space-y-1 font-mono text-[10px]">
                        {(
                          [
                            { side: 'casa', y: 'hy', r: 'hr', team: m.home },
                            { side: 'fora', y: 'ay', r: 'ar', team: m.away },
                          ] as const
                        ).map(({ side, y, r, team }) => (
                          <div key={side} className="flex items-center justify-end gap-1.5">
                            <span className="text-text-low mr-auto truncate uppercase">
                              {teamName(team)}
                            </span>
                            <span aria-hidden="true">🟨</span>
                            <ScoreBox
                              value={v[y]}
                              onChange={(x) => setDraftFor(m.id, m.home, m.away, { [y]: x })}
                              label={`Amarelos ${teamName(team)}`}
                            />
                            <span aria-hidden="true">🟥</span>
                            <ScoreBox
                              value={v[r]}
                              onChange={(x) => setDraftFor(m.id, m.home, m.away, { [r]: x })}
                              label={`Vermelhos ${teamName(team)}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center gap-1.5">
                        <button
                          onClick={() => void push(m, false)}
                          disabled={disabled}
                          className="bg-live flex-1 rounded-md py-1 text-[11px] font-bold text-white uppercase disabled:opacity-40"
                        >
                          {status === 'final'
                            ? 'reabrir'
                            : status === 'live'
                              ? 'atualizar'
                              : 'ao vivo'}
                        </button>
                        <button
                          onClick={() => void push(m, true)}
                          disabled={disabled}
                          className="bg-go text-canvas flex-1 rounded-md py-1 text-[11px] font-bold uppercase disabled:opacity-40"
                        >
                          encerrar
                        </button>
                        {off && (
                          <button
                            onClick={() => void remove(m.id)}
                            disabled={busy === m.id}
                            aria-label={`Remover oficial de ${teamName(m.home)} x ${teamName(m.away)}`}
                            className="text-text-low hover:text-card-red px-1 text-sm"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
