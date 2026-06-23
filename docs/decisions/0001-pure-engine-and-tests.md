# 0001 Motor puro + testes como contrato

## Status

Accepted

## Contexto

A parte difícil e sutil do produto são as **regras de classificação** da Copa
2026: o desempate da fase de grupos (oficial 2026) e a montagem dos 16-avos.
Essas regras são fáceis de implementar quase-certo e difíceis de implementar
exatamente-certo. O caso mais traiçoeiro é a **recursão do confronto direto**:
quando o confronto direto separa _algumas_ mas não _todas_ as seleções
empatadas em pontos, a escada de desempate tem de ser **reaplicada do topo**
apenas no subconjunto que continua empatado — e o confronto direto é
**recalculado** somente entre as seleções desse subconjunto menor. Errar isso
produz uma chave errada que ninguém percebe até o jogo acontecer.

## Decisão

O motor de regras vive em `src/engine/` e é **puro**: sem React, sem DOM, sem
IO, sem ler arquivos. São funções de dados→dados; a entrada de topo é
`simulate(input)` (`src/engine/index.ts`), determinística.

- Toda regra de classificação/desempate entra aqui, nunca na UI.
- A escada 2026 está em `orderGroup` (`tiebreakers.ts`):
  pontos → (confronto direto: pts/SG/GP, recursivo) → SG geral → GP geral →
  fair play → ranking FIFA. O ranking FIFA sempre separa.
- O ranking dos terceiros (`thirds.ts`) usa critérios gerais **sem** confronto
  direto (são grupos diferentes).
- Os testes em `src/engine/__tests__/` são o **contrato** do motor. Há um
  teste-prova explícito da recursão de confronto direto (separação parcial →
  reaplica do topo no subconjunto → recalcula o h2h menor).

## Consequências

- Regras testáveis isoladamente, em Node (rápido), sem montar componentes.
- Refactor de UI **não pode** mudar um resultado de jogo — se mudar, um teste
  do motor quebra.
- Disciplina: corrigir/alterar uma regra exige um teste que falha antes e passa
  depois. A escada 2026 e a recursão não se mexem sem revalidar.
- A UI fica burra de propósito: só desenha o `TournamentResult`.

## Alternativas

- **Calcular dentro dos componentes** — descartado: mistura regra com render,
  impossível de testar barato e fácil de quebrar num refactor de tela.
- **Desempate iterativo simples (sem recursão do h2h)** — descartado: produz
  ordem errada em empates parciais; viola o regulamento 2026.
- **Confiar em validação de dados em vez de testes de lógica** — insuficiente:
  `npm run validate` prova a _estrutura_ dos dados, não a _ordem_; ordem é
  responsabilidade dos testes do motor.
