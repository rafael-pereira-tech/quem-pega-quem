import { useState } from 'react';

import { staticData, teamsById } from '../data/static';
import { GROUP_IDS, type GroupId, type GroupMatch } from '../engine/types';
import { buildCards, countsOf, fairPlayOf, type CardCounts } from '../lib/officialCards';
import { useStore } from '../state/store';
import { deleteOfficial, upsertOfficial } from '../supabase/official';

import { ScoreBox } from './ScoreBox';

const teamName = (id: string) => teamsById.get(id)?.name || id;

interface Draft {
  h: number | null;
  a: number | null;
  home: CardCounts;
  away: CardCounts;
}

const CARD_FIELDS = [
  { key: 'y', icon: '🟨', aria: 'Amarelos' },
  { key: 'yy', icon: '🟨🟨', aria: '2º amarelo' },
  { key: 'r', icon: '🟥', aria: 'Vermelhos' },
  { key: 'yr', icon: '🟨🟥', aria: 'Amarelo e vermelho' },
] as const satisfies readonly { key: keyof CardCounts; icon: string; aria: string }[];

export function AdminPanel({ userId }: { userId: string }) {
  const official = useStore((s) => s.official);
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [detailed, setDetailed] = useState(false);

  const fields = detailed ? CARD_FIELDS : CARD_FIELDS.filter((f) => f.key === 'y' || f.key === 'r');

  const valueOf = (m: GroupMatch): Draft => {
    const d = draft[m.id];
    if (d) return d;
    // oficial (admin) tem prioridade; senão cai na nossa base (jogo já jogado).
    const src = official[m.id] ?? {
      homeGoals: m.homeGoals,
      awayGoals: m.awayGoals,
      cards: m.cards,
    };
    return {
      h: src.homeGoals,
      a: src.awayGoals,
      home: countsOf(src.cards?.[m.home]),
      away: countsOf(src.cards?.[m.away]),
    };
  };

  const update = (m: GroupMatch, fn: (d: Draft) => Draft) =>
    setDraft((prev) => ({ ...prev, [m.id]: fn(valueOf(m)) }));

  const clearDraft = (matchId: string) =>
    setDraft((prev) => {
      const n = { ...prev };
      delete n[matchId];
      return n;
    });

  /** Grava o resultado: `locked=false` = ao vivo (overlay), `true` = encerrado
   *  (entra na simulação de todos). Ver ADR 0006. */
  async function push(m: GroupMatch, locked: boolean) {
    const v = valueOf(m);
    if (v.h === null || v.a === null) return;
    setBusy(m.id);
    const { error } = await upsertOfficial({
      matchId: m.id,
      phase: 'group',
      homeGoals: v.h,
      awayGoals: v.a,
      cards: buildCards(m.home, m.away, v.home, v.away),
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-text-mid max-w-md text-sm">
          Lançar jogos <span className="text-live font-medium">ao vivo</span>: placar e cartões
          atualizam pra todos em tempo real. <span className="text-go font-medium">Encerrar</span>{' '}
          trava e entra na simulação. Jogos já encerrados (da base) vêm travados.
        </p>
        <div className="flex items-center gap-2">
          {msg && <span className="text-text-hi text-xs">{msg}</span>}
          <button
            onClick={() => setDetailed((d) => !d)}
            aria-pressed={detailed}
            title="Detalhado expõe 2º amarelo e amarelo+vermelho (fair-play fiel)"
            className="ring-border text-text-mid shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase ring-1"
          >
            cartões: {detailed ? 'detalhado' : 'simples'}
          </button>
        </div>
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
                  const v = valueOf(m);
                  const off = official[m.id];
                  // já encerrado pela nossa base → travado (read-only, sem botões)
                  const locked = m.homeGoals !== null && m.awayGoals !== null;
                  const status = locked || off?.locked ? 'final' : off ? 'live' : 'none';
                  const hasScore = v.h !== null && v.a !== null;
                  const disabled = !hasScore || busy === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`ring-hairline rounded-lg p-2 ring-1 ${locked ? 'bg-surface-dim' : 'bg-bg'}`}
                    >
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
                          disabled={locked}
                          onChange={(x) => update(m, (d) => ({ ...d, h: x }))}
                          label={`Gols de ${teamName(m.home)} (casa)`}
                        />
                        <span className="text-text-faint">×</span>
                        <ScoreBox
                          value={v.a}
                          disabled={locked}
                          onChange={(x) => update(m, (d) => ({ ...d, a: x }))}
                          label={`Gols de ${teamName(m.away)} (fora)`}
                        />
                        <span className="flex-1 truncate font-semibold">{teamName(m.away)}</span>
                      </div>

                      <div className="text-text-mid mt-1.5 space-y-1 font-mono text-[10px]">
                        {(
                          [
                            { sideKey: 'home', team: m.home },
                            { sideKey: 'away', team: m.away },
                          ] as const
                        ).map(({ sideKey, team }) => {
                          const counts = v[sideKey];
                          const fp = fairPlayOf(counts);
                          return (
                            <div key={sideKey} className="flex items-center gap-1.5">
                              <span className="text-text-low mr-auto truncate uppercase">
                                {teamName(team)}
                              </span>
                              {fields.map((f) => (
                                <span key={f.key} className="flex items-center gap-0.5">
                                  <span aria-hidden="true">{f.icon}</span>
                                  <ScoreBox
                                    value={counts[f.key]}
                                    disabled={locked}
                                    onChange={(x) =>
                                      update(m, (d) => ({
                                        ...d,
                                        [sideKey]: { ...d[sideKey], [f.key]: x },
                                      }))
                                    }
                                    label={`${f.aria} ${teamName(team)}`}
                                  />
                                </span>
                              ))}
                              {fp < 0 && (
                                <span
                                  className="text-third tabular-nums"
                                  aria-label={`Fair play ${fp}`}
                                >
                                  FP {fp}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {!locked && (
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
                      )}
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
