import { useState } from 'react';

import { staticData, teamsById } from '../data/static';
import { GROUP_IDS, type GroupId } from '../engine/types';
import { useStore } from '../state/store';
import { deleteOfficial, upsertOfficial } from '../supabase/official';

import { ScoreBox } from './ScoreBox';

const teamName = (id: string) => teamsById.get(id)?.name || id;

export function AdminPanel({ userId }: { userId: string }) {
  const official = useStore((s) => s.official);
  const [draft, setDraft] = useState<Record<string, { h: number | null; a: number | null }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const valueOf = (matchId: string) => {
    const d = draft[matchId];
    if (d) return d;
    const off = official[matchId];
    return { h: off?.homeGoals ?? null, a: off?.awayGoals ?? null };
  };

  const setDraftFor = (matchId: string, patch: Partial<{ h: number | null; a: number | null }>) =>
    setDraft((prev) => ({ ...prev, [matchId]: { ...valueOf(matchId), ...patch } }));

  async function save(matchId: string) {
    const { h, a } = valueOf(matchId);
    if (h === null || a === null) return;
    setBusy(matchId);
    const { error } = await upsertOfficial({
      matchId,
      phase: 'group',
      homeGoals: h,
      awayGoals: a,
      locked: true,
      userId,
    });
    setBusy(null);
    setMsg(error ? `Erro: ${error}` : 'Salvo ✓');
    if (!error)
      setDraft((prev) => {
        const n = { ...prev };
        delete n[matchId];
        return n;
      });
    setTimeout(() => setMsg(null), 2500);
  }

  async function clear(matchId: string) {
    setBusy(matchId);
    const { error } = await deleteOfficial(matchId);
    setBusy(null);
    setMsg(error ? `Erro: ${error}` : 'Removido');
    if (!error)
      setDraft((prev) => {
        const n = { ...prev };
        delete n[matchId];
        return n;
      });
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Cravar resultados <span className="font-medium text-emerald-400">oficiais</span> dos
          grupos. Ao salvar, o jogo trava e atualiza ao vivo pra todos.
        </p>
        {msg && <span className="text-xs text-slate-300">{msg}</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {GROUP_IDS.map((g: GroupId) => {
          const matches = staticData.seedMatches.filter((m) => m.group === g);
          return (
            <section key={g} className="rounded-xl bg-slate-900 p-3 ring-1 ring-slate-800">
              <h2 className="mb-2 font-bold">Grupo {g}</h2>
              <div className="space-y-1.5">
                {matches.map((m) => {
                  const v = valueOf(m.id);
                  const isOfficial = official[m.id]?.locked === true;
                  const canSave = v.h !== null && v.a !== null && busy !== m.id;
                  return (
                    <div key={m.id} className="flex items-center gap-1.5 text-sm">
                      <span className="w-4 text-[10px] text-slate-600">R{m.round}</span>
                      <span className="flex-1 truncate text-right">{teamName(m.home)}</span>
                      <ScoreBox
                        value={v.h}
                        onChange={(x) => setDraftFor(m.id, { h: x })}
                        label="casa"
                      />
                      <span className="text-slate-600">×</span>
                      <ScoreBox
                        value={v.a}
                        onChange={(x) => setDraftFor(m.id, { a: x })}
                        label="fora"
                      />
                      <span className="flex-1 truncate">{teamName(m.away)}</span>
                      <button
                        onClick={() => save(m.id)}
                        disabled={!canSave}
                        className="rounded bg-emerald-600 px-2 py-0.5 text-[11px] text-white disabled:opacity-40"
                      >
                        {isOfficial ? '↑' : 'salvar'}
                      </button>
                      {isOfficial && (
                        <button
                          onClick={() => clear(m.id)}
                          title="remover oficial"
                          className="text-[11px] text-slate-500 hover:text-red-400"
                        >
                          ✕
                        </button>
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
