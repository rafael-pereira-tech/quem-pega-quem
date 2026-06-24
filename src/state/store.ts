import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { emptyScenario, type OfficialResult, type ScenarioData } from '../lib/buildInput';
import { trackScoreEditOnce } from '../supabase/events';

import type { KnockoutScore } from '../engine/types';

interface AppState {
  scenario: ScenarioData;
  /** Resultados oficiais (vêm do Supabase; vazio enquanto não ligado). */
  official: Record<string, OfficialResult>;

  setGroupScore: (matchId: string, homeGoals: number | null, awayGoals: number | null) => void;
  setKoScore: (id: string, patch: Partial<KnockoutScore>) => void;
  setOfficial: (results: Record<string, OfficialResult>) => void;
  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      scenario: emptyScenario(),
      official: {},

      setGroupScore: (matchId, homeGoals, awayGoals) => {
        trackScoreEditOnce();
        set((s) => ({
          scenario: {
            ...s.scenario,
            groupScores: { ...s.scenario.groupScores, [matchId]: { homeGoals, awayGoals } },
          },
        }));
      },

      setKoScore: (id, patch) => {
        trackScoreEditOnce();
        set((s) => {
          const prev: KnockoutScore = s.scenario.koScores[id] ?? {
            homeGoals: null,
            awayGoals: null,
          };
          return {
            scenario: {
              ...s.scenario,
              koScores: { ...s.scenario.koScores, [id]: { ...prev, ...patch } },
            },
          };
        });
      },

      setOfficial: (results) => set({ official: results }),

      reset: () => set({ scenario: emptyScenario() }),
    }),
    {
      name: 'qpq-scenario',
      // só o cenário do usuário persiste; o oficial sempre vem fresco.
      partialize: (s) => ({ scenario: s.scenario }),
    },
  ),
);
