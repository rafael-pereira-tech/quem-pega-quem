# Visão do Produto

## O que é

**Quem Pega Quem** é um simulador ao vivo, mobile-first, do mata-mata da Copa do
Mundo 2026. Conforme saem os placares da 3ª rodada da fase de grupos, o app
mostra na hora como se formam os 16-avos de final — incluindo os **8 melhores
terceiros** e o cruzamento exato do **Anexo C** da FIFA — e deixa o usuário
seguir a chave até a final.

## Para quem

Torcedores acompanhando os jogos com amigos: bolão, bar, grupo de WhatsApp. A
graça é responder "se a Argentina ganhar de 2, quem ela pega?" sem ninguém
precisar abrir o regulamento de 80 páginas.

- **Usuário comum** — palpita placares, vê a chave se rearranjar em tempo real,
  compara cenários. Entra sem cadastro (auth anônima).
- **Admin** — lança o placar OFICIAL de cada jogo conforme acontece; trava o
  resultado e ele se propaga para todos os clientes via Realtime.

## Escopo do MVP

- Tabela dos 12 grupos com desempate **oficial 2026** completo (incl. recursão
  do confronto direto).
- Ranking dos terceiros e seleção automática dos 8 que avançam.
- Montagem dos 16-avos pelo Anexo C (495 combinações) e da chave R32 → final.
- Camada de **palpite** do usuário sobre os jogos ainda abertos.
- Camada **oficial** (admin) que trava jogos já decididos e tem prioridade.
- Duas superfícies de UI: **mobile** (abas Grupos / Chave / Melhores 3º) e
  **desktop** (visão única). Funciona 100% client-side mesmo sem backend.

## Não-objetivos (por enquanto)

- Não é casa de apostas nem placar de pontuação de bolão entre amigos.
- Não cobre a fase de grupos como "previsão" estatística (probabilidades,
  Monte Carlo) — o motor é determinístico: dado um conjunto de placares,
  calcula UM resultado.
- Não tem contas com e-mail/senha, perfis sociais, comentários ou chat.
- Não é multi-torneio nem genérico para outras competições — é a Copa 2026.
- Sem app nativo, push notifications ou i18n (só PT-BR).

## Princípios

- **A regra é a fonte da verdade.** Desempates 2026 e Anexo C seguem o
  regulamento oficial da FIFA, validados e testados — nunca "o que parece certo".
- **Funciona offline-first.** Sem credenciais do Supabase, o app roda como
  simulador local; o backend só adiciona o placar ao vivo e compartilhamento.
- **Mobile primeiro.** A tela do bar é um celular na mão.
