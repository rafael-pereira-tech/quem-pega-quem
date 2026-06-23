import { useMemo } from 'react';

import { simulate } from '../engine';
import { buildSimulationInput } from '../lib/buildInput';
import { useStore } from '../state/store';

/** Recalcula tudo (classificação + terceiros + chave) a cada mudança de placar. */
export function useSimulation() {
  const scenario = useStore((s) => s.scenario);
  const official = useStore((s) => s.official);
  return useMemo(() => simulate(buildSimulationInput(scenario, official)), [scenario, official]);
}
