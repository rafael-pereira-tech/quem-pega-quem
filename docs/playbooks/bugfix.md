# Playbook: Bugfix

Use ao corrigir comportamento quebrado.

## Passos

1. **Reproduzir.** Ache a entrada mínima que dispara o bug — ou anote por que
   não dá para reproduzir.
2. **Teste que falha.** Escreva o teste no nível mais barato e específico
   possível **antes** de corrigir:
   - regra de classificação (desempate, terceiros, Anexo C, chave) → teste do
     **motor** em Node (`src/engine/__tests__`);
   - fusão de placar (oficial > seed > palpite) → `src/lib/__tests__`;
   - UI → Vitest + Testing Library (jsdom);
   - dado inconsistente → reproduza via `npm run validate`.

   O teste tem de **falhar pelo motivo certo**.

3. **Corrigir.** Mexa na menor superfície que faz o teste passar. Regra fica no
   motor, nunca no componente.
4. **Checar impacto adjacente.** O bug toca dados oficiais, RLS, segredos ou
   acessibilidade? Se a regra estava errada, há outros casos com o mesmo erro?
5. **Docs.** Atualize um ADR/reference só se o comportamento documentado estava
   errado.

## Definition of Done

- O teste de regressão **falha antes** da correção e **passa depois**.
- `npm run check` passa (e `npm run validate` se tocou `data/`).
- Se o bug era vazamento entre usuários ou escrita indevida, o `rls-auditor`
  revisou e há teste cobrindo a fronteira.
