# Handoff — Tela Desktop: Input 1/3 · Mata-mata 2/3 (full-width)

## Objetivo
Implementar **a tela desktop** do app *Quem-Pega-Quem* (bracket de torneio ao vivo) no padrão **1/3 input · 2/3 mata-mata**, estourada **full-width** no desktop, com o chaveamento espelhado: **dois 16-avos detalhados, um de cada lado**, e as fases posteriores (oitavas, quartas) **minimizadas** convergindo para a final no centro.

## Sobre os arquivos deste bundle
`Transmissão.dc.html` é uma **referência de design feita em HTML** — um protótipo que mostra aparência e comportamento pretendidos, **não código de produção para copiar diretamente**. A tarefa é **recriar este design no ambiente/codebase de destino** (React, Vue, Svelte, etc.) usando seus padrões, componentes e sistema de estilos. Se ainda não houver ambiente, escolha o framework mais adequado e implemente lá.

A tela desktop está na seção **`03 · Telas → Desktop — 1/3 input · 2/3 bracket`** do arquivo (procure pelo comentário `<!-- ===== TELA · DESKTOP ===== -->`, ~linha 600 em diante).

## Fidelidade
**Alta-fidelidade (hifi).** Cores, tipografia, espaçamentos e estados são finais. Recrie pixel-a-pixel usando as bibliotecas/padrões do codebase. Os valores exatos estão na seção *Design Tokens*.

---

## Layout da tela

No mock, a tela é exibida dentro de uma janela de 1340px (chrome com traffic-lights) **apenas para apresentação**. **Em produção, o painel é full-bleed (100% da largura do viewport)** — descarte a moldura da janela. A barra superior do app permanece.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR  ● RODADA 3 · AO VIVO · 78'                  11/12 grupos · 8 terc.    │
├──────────────────┬────────────────────────────────────────────────────────────┤
│ ESQUERDA  1/3    │ DIREITA  2/3 — MATA-MATA                                    │
│ (input/grupos)   │                                                            │
│ width fixa 392px │ flex:1  (ocupa todo o resto, estoura full-width)           │
│                  │                                                            │
│ · "Última rodada"│  16-AVOS │conec│ OITAVAS │c│ QUARTAS │   FINAL   │ QUARTAS │…│
│ · cards de jogo  │ (detalhe)│     │ (mín.)  │ │ (mín.)  │   🏆      │ (espelho)  │
│ · grupos colaps. │  4 slots │     │ 2 slots │ │ 1 slot  │           │            │
└──────────────────┴────────────────────────────────────────────────────────────┘
```

### Estrutura raiz
- Container do corpo: `display:flex`, altura cheia (no mock `height:760px`; em produção use `height:100vh` menos a topbar, ou `min-height` do conteúdo), `background:#0B0E14`, fonte `Barlow`.
- **Topbar** (full-width): `display:flex; align-items:center; gap:8px; padding:13px 18px; background:#11141b; border-bottom:1px solid #1B212D`.
  - Esq.: nome do app `Quem-Pega-Quem` (Barlow Condensed 800, 16px, uppercase, `#EBF1FB`).
  - Status ao vivo: ponto `#FF2D55` 7px com halo `box-shadow:0 0 0 3px rgba(255,45,85,.25)` + texto mono 11px `#FF2D55` `RODADA 3 · AO VIVO · 78'`.
  - Dir. (`margin-left:auto`): mono 11px `#687087` `11/12 grupos · 8 terceiros definidos`.
  - *(No mock só há os 3 traffic-lights da janela — não reproduzir em produção.)*

---

## Coluna ESQUERDA — 1/3 (input dos grupos)
- `width:392px; flex:none; border-right:1px solid #1B212D; display:flex; flex-direction:column`.
  - Em produção pode usar `flex:0 0 360–400px` ou `clamp(340px, 26%, 420px)`; o essencial é **largura fixa/limitada** enquanto a direita flexiona.
- **Header da coluna** (`padding:16px 18px 10px; flex; justify-content:space-between`):
  - Título `Última rodada` — Barlow Condensed 800, 22px, uppercase, `letter-spacing:.02em`, `#EBF1FB`, `white-space:nowrap`.
  - Pill `12 grupos` — mono 10px `#98A2B4`, `background:#141A24; border:1px solid #28303F; padding:4px 8px; border-radius:99px`.
- **Lista** (`flex:1; overflow:hidden; padding:0 14px; flex column; gap:11px; position:relative`). Itens, de cima p/ baixo:
  1. **Grupo colapsado** (ex. Grupo J): barra `background:#141A24; border:1px solid <cor-grupo>33; border-radius:12px; padding:9px 11px`. Conteúdo: quadradinho da letra (20×20, `border-radius:6px`, fundo na cor do grupo) + nome `Grupo J` (Condensed 700, 13px, uppercase) + spacer + chips de classificação (mono 9px: 1º/2º verde `#36C275` sobre `#36c2751a`, 3º âmbar `#FFB400` sobre `#FFB4001a`) + chevron `▾` `#687087`.
  2. **Card de JOGOS** (`background:#141A24; border:1px solid #1B212D; border-radius:14px; overflow:hidden`):
     - Cabeçalho com navegador de rodada: setas circulares 26px (`‹` ativa `#C6F24E` / `›` desabilitada `#3a4150`) e título `3ª Rodada · Jogos`.
     - 2 partidas compactas estilo GE empilhadas (divisor `height:1px; background:#1B212D; margin:0 12px`). Cada partida (layout **compacto**, ~2 linhas de altura):
       - **Linha de cabeçalho** (`flex; justify-content:space-between`): local · data à esquerda (11px), **badge `AO VIVO · 78'` à direita na MESMA linha** (mono 10px, branco sobre `#FF2D55`, ponto branco 5px, `border-radius:6px`). Não há linha de badge separada nem linha de cartões/nomes embaixo.
       - **Linha de placar** (`flex; align-items:center; gap:6px`): sigla (Condensed 700 14px, `width:30px`) · bandeira (20×14) · **stepper horizontal** · `×` · **stepper horizontal** · bandeira · sigla.
       - **Stepper horizontal** (`flex; align-items:center; gap:5px`): botão `−` (22px círculo `#1B2230` borda `#28303F`, `cursor:pointer`) · **número editável** · botão `+` (22px círculo `#FF2D55`). O número é um campo **editável por teclado** (`contenteditable="true" inputmode="numeric"`): Condensed 800 24px `#EBF1FB`, `min-width:16px`, `text-align:center`, `outline:none`, sublinhado sutil `border-bottom:2px solid #2c3442` como affordance. Em produção, use um `<input type="number">`/campo controlado equivalente.
  3. **Grupos colapsados K e L** (mesmo padrão do item 1, borda neutra `#1B212D`).
  - **Fade inferior**: `position:absolute; left/right:0; bottom:0; height:70px; background:linear-gradient(180deg,transparent,#0B0E14 80%); pointer-events:none`.

---

## Coluna DIREITA — 2/3 (mata-mata espelhado)
- `flex:1; display:flex; flex-direction:column; overflow:hidden` → **é esta coluna que estoura full-width**.
- **Header** (`padding:16px 22px 8px; flex; align-items:center; gap:14px`):
  - Título `Mata-mata` (Condensed 800, 22px, uppercase).
  - Legenda **definido**: quadradinho 8px `#36C275` + texto mono 10px `#36C275`.
  - Legenda **provisório (melhor 3º)**: quadradinho 8px `#FFB400` + texto mono 10px `#FFB400`.
  - `margin-left:auto`: mono 10px `#687087` `16-avos → final`.

### Faixa do bracket (`flex:1; display:flex; align-items:stretch; padding:8px 22px 18px; gap:6px`)
Colunas, da esquerda para o centro e espelhadas à direita:

| # | Coluna | width | Tratamento |
|---|--------|-------|------------|
| 1 | **16-AVOS (esq.)** | `150px`, `flex:none` | **DETALHADO** — 4 cards de confronto |
| 2 | **Fases posteriores (esq.)** | `138px`, `align-self:stretch` | **MÍNIMO** — funil + linha com marcadores `OITAVAS · QF` |
| 3 | **FINAL** | `flex:1; min-width:120px` | troféu 🏆 + card do campeão |
| 4 | **Fases posteriores (dir.)** | `138px` | mínimo (espelho) |
| 5 | **16-AVOS (dir.)** | `150px` | **DETALHADO** — 4 cards (espelho) |

Apenas as colunas de **16-avos** trazem o rótulo `16-AVOS` no topo (mono 9px `#687087`, `text-align:center`, `letter-spacing:.1em`) e usam `flex column; justify-content:space-around`. As caixas explícitas de oitavas/quartas e os colchetes individuais foram **substituídos** pelo tratamento mínimo abaixo.

#### Card de confronto 16-avos (detalhado)
- `background:#141A24; border:1px solid #36c27540; border-radius:8px; padding:5px 7px`.
  - Borda **verde `#36c27540`** quando ambos os times estão definidos.
  - Borda **âmbar `#FFB40055`** quando um slot é um melhor-3º ainda provisório.
- Duas linhas (`display:flex; align-items:center; gap:5px`, 2ª com `margin-top:3px`):
  - Seed mono 8px largura 14px — `#36C275` (1º/2º de grupo) ou `#FFB400` (3º) — + quadradinho de bandeira 10px (`border-radius:3px`) + sigla 11px `#EBF1FB` peso 600.
  - Slot de 3º indefinido: bandeira = `#1B2230` com `border:1px dashed #FFB40088` e sigla `3?` em `#FFB400` itálico.
- Confrontos no mock — **esquerda**: `1A/3º` (BRA/POL), `1E/3º` (FRA/3?), `1G/2H` (ENG/BEL), `1C/2F` (ESP/CRO). **Direita (espelho)**: `1B/3º` (ARG/MEX), `1D/2A` (POR/SUI), `1H/3º` (URU/KOR), `1F/2I` (NED/JPN).

#### Fases posteriores — tratamento MÍNIMO (oitavas + quartas)
Depois dos 16-avos, as fases até a final são reduzidas a **um funil + uma linha fina com pequenos marcadores** (cabe folgado no desktop e tira o peso visual de caixas vazias). Container `width:138px; align-self:stretch; flex column; justify-content:center`, com um bloco interno `height:170px`:
- **Funil** (`width:13px; padding:8px 0`): um `<div flex:1>` com 3 bordas `1.5px solid #28303F` arredondadas no lado voltado ao centro (`border-radius:0 9px 9px 0` à esquerda; `9px 0 0 9px` à direita) — recolhe os 4 confrontos num ponto.
- **Linha + marcadores** (`flex:1; flex column; justify-content:center; gap:7px`):
  - micro-rótulo `OITAVAS · QF` (espelhado: `QF · OITAVAS`) — mono 8px `#687087`, centralizado, `letter-spacing:.12em`.
  - linha horizontal (`flex; align-items:center`) com dois **dots** de fase intercalados por segmentos `height:1.5px; background:#28303F`: cada dot `width/height:8px; border-radius:99px; background:#0F141C; border:1.5px solid #28303F`. O lado espelhado inverte a ordem dos segmentos.
- Quando um confronto de oitavas/quartas existir de fato, o dot correspondente acende (`border`/`background` na cor do estado) — substitui a antiga caixa `aguardando`.

#### Centro — Final
- `flex:1; flex column; align-items:center; justify-content:center; gap:10px; min-width:120px`.
- Emoji troféu `🏆` 30px (substituir por ícone do design system se houver).
- Rótulo `Final` — Condensed 800, 18px, `#C6F24E`, uppercase, `letter-spacing:.08em`.
- Card do campeão: `width:108px; background:linear-gradient(180deg,#1B2230,#141A24); border:1px solid #C6F24E44; border-radius:10px; padding:14px 8px; text-align:center; box-shadow:0 0 24px rgba(198,242,78,.12)`. Conteúdo: `campeão` (mono 9px `#687087`) + `?` (Condensed 800, 22px, `#3a4150`).

---

## Comportamento & estados
- **Stepper de placar** (cards de jogo na coluna esquerda): layout **horizontal** `−  número  +`. `+` incrementa, `−` decrementa (mínimo 0 → botão `−` desabilitado: `#0F141C`/`#1B212D`, texto `#3a4150`). Estado *press* no `+`: halo `box-shadow:0 0 0 4px rgba(255,45,85,.25)`. O **número é editável por teclado** além dos botões — campo `contenteditable`/`<input>` numérico; sincronize as duas formas de edição no mesmo estado.
- **Atualização ao vivo**: o ponto `AO VIVO` pulsa; minuto em mono. Mudanças de placar nos grupos recalculam classificação e **propagam para os slots do bracket** (seeds 1º/2º definidos = verde; melhor-3º = âmbar/provisório até a matemática travar).
- **Slots provisórios → definidos**: borda âmbar `#FFB40055` + `3?` viram borda verde `#36c27540` + sigla real quando o confronto fica determinado.
- **Grupos colapsados**: clique expande para a classificação completa (ver componente "Grupo · classificação" no design system / seção Componentes do arquivo).
- **Navegador de rodada**: `‹`/`›` trocam a rodada exibida; seta no limite fica desabilitada (`#3a4150`).
- **Responsivo**: abaixo do breakpoint desktop, esta tela colapsa para o layout **mobile** (coluna única com tabs Grupos/Chave/Terceiros) — ver os 3 frames de 358px na seção `Telas · Mobile` do arquivo.

---

## Design Tokens

### Cores — superfícies & texto
| Token | Hex |
|---|---|
| canvas | `#05070B` |
| bg / tela | `#0B0E14` |
| surface | `#141A24` |
| raised | `#1B2230` |
| surface-dim | `#0F141C` |
| border | `#28303F` |
| border-dim | `#1B212D` |
| text-hi | `#EBF1FB` |
| text-mid | `#98A2B4` |
| text-low | `#687087` |
| text-disabled | `#3a4150` / `#4a5163` |

### Cores — funcionais
| Uso | Hex |
|---|---|
| ao vivo / ação | `#FF2D55` |
| destaque / final | `#C6F24E` |
| classifica (go) | `#36C275` |
| 3º / provisório | `#FFB400` |
| cartão amarelo | `#FFC400` |
| cartão vermelho | `#F4324C` |

### Cores — 12 grupos (A→L)
`A #FF3B6B · B #FF7A00 · C #FFB400 · D #36C275 · E #00B3A6 · F #2E9BFF · G #6C5CE7 · H #C44CFF · I #FF4FA3 · J #18C0C4 · K #8BC34A · L #FF5C5C`

### Tipografia
- **Barlow Condensed** (700/800, uppercase, tracking levemente aberto): placares, títulos, letras de grupo, seeds grandes.
- **Barlow** (400–700): nomes de seleção, rótulos, corpo de UI.
- **Space Mono** (400/700): seeds (`1A`, `3º`), minutos (`78'`), rótulos uppercase, pts/saldo — ar técnico de transmissão.
- Import: `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap`

### Raio
`7` chip · `8` card-bracket · `10` controle · `12–14` card · `16` card-jogo · `20` sheet · `99px` pill.

### Espaçamento
Escala base-4: `4 · 8 · 12 · 16 · 20 · 24`. Gap do bracket `6px`; gap da lista esquerda `11px`.

### Elevação & foco
- overlay: `box-shadow:0 16px 40px rgba(0,0,0,.5)` (janela: `0 26px 64px rgba(0,0,0,.5)`).
- foco/ativo: `box-shadow:0 0 0 2px #FF2D55`.
- glow da final: `box-shadow:0 0 24px rgba(198,242,78,.12)`.

---

## Assets
- Nenhuma imagem externa. Bandeiras são **swatches CSS** (quadradinhos de cor sólida ou `linear-gradient` de 3 faixas — ex. Argentina `linear-gradient(180deg,#74ACDF 33%,#fff 33% 66%,#74ACDF 66%)`). Em produção, substitua por ícones de bandeira reais do sistema, mantendo o tamanho (10–24px) e o `border-radius:3px`.
- Troféu = emoji `🏆`; trocar por ícone do design system se existir.
- Ícones de seta/chevron são glifos (`‹ › ▾ ▲ ▼ ✂ ✓`) — trocar por ícones do sistema.

## Arquivos de referência
- `Transmissão.dc.html` — protótipo completo (design system + telas mobile + **tela desktop**, seção `03 · Telas`). A tela alvo deste handoff é o bloco `<!-- ===== TELA · DESKTOP ===== -->`.
