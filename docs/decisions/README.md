# Decisões (ADRs)

Um **ADR** (Architecture Decision Record) registra uma decisão de arquitetura
relevante e durável: o contexto, a escolha feita, as consequências e as
alternativas descartadas. Existe para que, meses depois, ninguém precise
adivinhar **por que** o projeto é do jeito que é — e para que divergir de uma
decisão seja um ato consciente, não um acidente.

Leia os ADRs aceitos **antes** de propor uma alternativa.

## O que merece um ADR

- Uma escolha que custa caro para reverter (motor puro, fonte do Anexo C,
  modelo de auth/RLS, gate de qualidade).
- Adoção/troca de uma biblioteca ou serviço estrutural.
- Divergir de propósito de um ADR anterior (aí o novo ADR _supersede_ o antigo).

Não vire ADR: nome de variável, classe CSS, escolha reversível num único PR.

## Formato

Copie [`0000-template.md`](./0000-template.md). Seções fixas: **Contexto**,
**Decisão**, **Consequências**, **Alternativas**. Curto e direto — um ADR cabe
numa tela.

## Status

- **Proposed** — em discussão; ainda não vale.
- **Accepted** — vale agora; é a regra.
- **Superseded** — substituído por outro ADR (linke: "Superseded by 00NN").

Mudou de ideia? Não reescreva um ADR aceito. Crie um novo que o supersede e
marque o antigo.

## Numeração

Sequencial, com 4 dígitos e título em kebab-case:
`0007-meu-titulo.md`. O próximo número é o maior existente + 1; o `0000` é
reservado para o template.

## Índice

| #    | Título                            | Status   |
| ---- | --------------------------------- | -------- |
| 0001 | Motor puro + testes como contrato | Accepted |
| 0002 | Anexo C como fonte da verdade     | Accepted |
| 0003 | Supabase: auth anônima + RLS      | Accepted |
| 0004 | Tooling e gate de qualidade       | Accepted |
