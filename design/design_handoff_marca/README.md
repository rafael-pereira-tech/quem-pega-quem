# Handoff: Quem-Pega-Quem — Identidade & Share (logo, favicon, Open Graph)

## Overview
Kit de marca do **Quem-Pega-Quem**, o webapp de "segunda tela" pra acompanhar o mata-mata da Copa 2026 ao vivo. Este pacote define o **símbolo (logo), os lockups, o favicon (app icon) e a imagem de compartilhamento (Open Graph / Twitter card)**. Tudo nas cores e tipografia já estabelecidas pela plataforma (tema escuro).

O símbolo escolhido é a **direção "Chave"**: dois confrontos (barra vermelha + barra amarela) convergindo por um arco verde até um ponto lime — o campeão. Lê como uma chave de mata-mata em miniatura.

> O board de referência (`Marca.dc.html`) também mostra duas direções descartadas (A · Barras, C · Monograma) **apenas como contexto**. A produção usa só a **direção B (Chave)**.

## About the Design Files
Os arquivos deste bundle são **referências de design feitas em HTML** — protótipos que mostram aparência e construção pretendidas, **não** código de produção pra copiar direto. A tarefa é **recriar estes assets no ambiente do codebase alvo** (React/Vue/Svelte/etc.) e, principalmente, **gerar os arquivos de imagem reais** (PNG/ICO/SVG) a partir das especificações abaixo. Se ainda não existe ambiente, gere os assets como **SVG** (o símbolo é 100% geometria — vetor é o formato natural) e rasterize pros tamanhos de favicon.

O arquivo `Marca.dc.html` é um **Design Component** (formato proprietário desta ferramenta). Abre direto no navegador e serve como **referência visual** — leia o markup inline pra valores exatos. Não integre o runtime `.dc.html` no app.

## Fidelity
**High-fidelity (hifi).** Cores, proporções, raios e tipografia são finais. O símbolo é feito só de retângulos arredondados e bordas — reproduza as proporções exatamente. Recrie como **SVG** (ver geometria canônica abaixo) e exporte os rasters.

---

## O símbolo (direção B · Chave)

### Geometria canônica (viewBox lógico ~58 × 44, sobre um tile)
O símbolo vive dentro de um **tile** (quadrado de cantos arredondados) com fundo `#141A24`. Dentro do tile, centralizado vertical e horizontalmente, há a marca composta por 4 elementos numa linha (`display:flex; align-items:center`):

1. **Coluna de confrontos** (as duas "entradas" da chave) — uma coluna (`flex-direction:column; justify-content:space-between`) com altura = **altura do arco**, contendo duas barras horizontais:
   - Barra superior: **vermelha `#FF2D55`**
   - Barra inferior: **amarela `#FFB400`**
   - Cada barra: largura ≈ **52%** da largura total da marca, altura fina (`~9%` da altura do arco), cantos arredondados.
2. **Arco "]" (o cruzamento)** — um retângulo com **apenas 3 bordas** (`border-top`, `border-right`, `border-bottom`) na cor **verde `#36C275`**, cantos arredondados só do lado direito (`border-top-right-radius` / `border-bottom-right-radius`). Largura ≈ 28% da marca, altura = altura total. As pontas (top e bottom) **alinham exatamente** com as barras vermelha e amarela (por isso a coluna usa `justify-content:space-between` com a mesma altura do arco).
3. **Ponto campeão** — um círculo **lime `#C6F24E`** encostado na ponta direita do arco (`margin-left` negativo de ~2 unidades pra sobrepor levemente). Diâmetro ≈ altura da barra fina × ~4.

### Proporções por tamanho (valores em px, tile → conteúdo)
A marca é dimensionada pela **largura** disponível (`A = lado do tile − 2·padding`); escala `s = A / 58`. Altura do arco = `44·s`.

| Contexto | Tile | Padding | Arco (alt) | Barras (l × a, raio) | Arco (l, borda, raio) | Ponto (Ø, ml) |
|---|---|---|---|---|---|---|
| App icon 180 | 90 | 18 | 41 | 28 × 4, r3 | 15, 4, r7 | 13, −2 |
| Favicon 48 | 48 | 10 | 21 | 14 × 2, r1 | 8, 2, r4 | 7, −1 |
| Favicon 32 | 32 | 7 | 14 | 9 × 2, r1 | 5, 2, r2 | 4, −1 |
| Favicon 16 | 16 | 3 | 10 | *(omitir barras)* | 5, 2, r2 | 4, −1 |
| Lockup horiz. | 64 | 13 | 29 | 20 × 3, r2 | 10, 3, r5 | 9, −1 |
| Lockup empilhado / OG | 72 / 74 | 15 / 16 | 32 | 22 × 3, r2 | 12, 3, r6 | 10, −2 |

**Regra de simplificação:** abaixo de ~24px as duas barras finas viram ruído. No **16px** (e na aba do navegador, ~18px) use a versão reduzida: **só o arco verde + o ponto lime**. Continua reconhecível como ">•".

### Variantes de cor
- **Full color** (padrão): vermelho/amarelo/verde/lime como acima, sobre tile `#141A24`.
- **No claro:** mesma marca colorida, mas o tile vira **`#0B0E14`** (escuro) sobre fundo claro `#EBF1FB`. O símbolo é sempre sobre tile escuro — não inverter as cores das barras.
- **Mono / 1 cor:** todos os elementos (barras, arco, ponto) em **lime `#C6F24E`**, tile `#141A24`. Para impressões/usos de cor única.

---

## Lockups (marca + wordmark)
Wordmark: **"QUEM-PEGA-QUEM"** em **Barlow Condensed 800**, caixa alta, `letter-spacing .01em`, cor `#EBF1FB`. Hífens são **non-breaking hyphen** (`&#8209;`) pra não quebrar.

- **Horizontal:** tile 64px (raio 16) + gap 20px + wordmark 40px. Abaixo do wordmark, sub-rótulo em **Space Mono**, 11px, `letter-spacing .16em`, upper, `#687087`: "MATA-MATA AO VIVO · COPA 2026".
- **Empilhado:** tile 72px (raio 18) centralizado acima, wordmark em 3 linhas ("QUEM / PEGA / QUEM"), Condensed 800, 30px, `line-height .9`, centralizado.
- **No claro:** fundo `#EBF1FB`, tile escuro 56px (raio 14), wordmark `#0B0E14`.
- **Mono:** tile 56px, marca lime, wordmark `#EBF1FB`.

**Área de respiro:** mínimo = altura do tile ÷ 2 em todos os lados.

---

## Favicon / App icon
Gerar a partir do símbolo full-color sobre tile `#141A24`:

| Arquivo | Tamanho | Raio do tile | Observação |
|---|---|---|---|
| `favicon-16.png` | 16 | 4 | versão simplificada (arco + ponto) |
| `favicon-32.png` | 32 | 8 | marca completa |
| `favicon-48.png` | 48 | 11 | marca completa |
| `favicon.ico` | 16+32+48 | — | multi-resolução |
| `apple-touch-icon.png` | 180 | 40 (≈22%) | marca completa, sem transparência |
| `icon.svg` | vetor | — | fonte mestre (escalável) |

Tags sugeridas no `<head>`:
```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/icon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## Open Graph / Social (1200 × 630)
Card de compartilhamento. Fundo `#05070B`. Layout (offsets a partir do canto do card 1200×630):

- **Conteúdo principal:** bloco posicionado `left:80px; top:62px; right:80px`.
  - **Linha topo** (flex, space-between):
    - Esquerda: tile do símbolo **74px** (raio 18, conteúdo conforme tabela "OG") + rótulo Space Mono 14px, `letter-spacing .18em`, upper, `#687087`: "SEGUNDA TELA · COPA 2026".
    - Direita: pílula **"AO VIVO"** — fundo `#FF2D55`, padding 9×16, raio 99, dot branco 9px + texto Space Mono 13px bold, `letter-spacing .14em`, branco.
  - **Wordmark:** "QUEM-PEGA / -QUEM" em 2 linhas, Barlow Condensed 800, **118px**, `line-height .86`, upper, `#EBF1FB`, `margin-top 40px`.
  - **Legenda** (1 linha): Barlow 24px, `line-height 1.4`, `#98A2B4`, `max-width 760`, `margin-top 24px`: "A chave da Copa se montando ao vivo — a cada gol, tudo muda."
- **Rodapé:** posicionado `left:80px; bottom:56px` (flex, gap 14): "quempegaquem.app" (Space Mono 16px, **`#C6F24E`**) · dot 5px `#28303F` · "8 melhores 3º · 16-avos" (Space Mono 15px, `#687087`).
- **Motivo de chave ao fundo** (decorativo, `opacity .5`, lado direito): linhas e arcos `1px/3px solid #28303F` formando uma chave que afunila; um arco em destaque `#FFB400` e um ponto `#C6F24E`. Puramente ornamental — pode simplificar ou omitir.

> ⚠️ Cuidado de layout: o conteúdo é ancorado no topo e o rodapé é `position:absolute; bottom`. Garanta que a base da legenda fique **acima de ~y540** (folga ≥ ~100px até o rodapé). Se aumentar o wordmark ou a legenda virar 2 linhas, há risco de sobreposição com a URL.

Mesma arte serve pra `og:image` e `twitter:image` (`summary_large_image`). Derivados: **1080×1080** (quadrado) e **1080×1920** (story) reusando o **wordmark empilhado**.

Tags sugeridas:
```html
<meta property="og:title" content="Quem-Pega-Quem">
<meta property="og:description" content="A chave da Copa se montando ao vivo — a cada gol, tudo muda.">
<meta property="og:image" content="/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="/og-image.png">
```

---

## Design Tokens

### Cores
| Token | Hex | Uso |
|---|---|---|
| canvas | `#05070B` | fundo da OG / página |
| bg | `#0B0E14` | tile no claro, superfícies |
| surface / tile | `#141A24` | fundo do tile do símbolo |
| border | `#28303F` | bordas, motivo decorativo |
| text-hi | `#EBF1FB` | wordmark, texto primário |
| text-mid | `#98A2B4` | legenda |
| text-low | `#687087` | rótulos mono |
| live (vermelho) | `#FF2D55` | barra superior da chave, pílula "AO VIVO" |
| third (amarelo) | `#FFB400` | barra inferior da chave, arco de destaque |
| go (verde) | `#36C275` | arco "]" da chave |
| lime | `#C6F24E` | ponto campeão, URL, versão mono |

### Tipografia (Google Fonts)
- **Barlow Condensed** 700/800 — wordmark, display. Caixa alta.
- **Barlow** 400–700 — legenda/corpo.
- **Space Mono** 400/700 — rótulos, URL, meta. Upper, `letter-spacing .14–.18em`.

### Raios
Tile: ~22% do lado (16px→4, 32→8, 48→11, 74→18, 90→40/180). Pílula: 99px.

---

## Assets
- **Sem imagens externas.** O símbolo é 100% geometria (retângulos + bordas) — gerar como **SVG** e rasterizar. Sem fotos, sem ícones de terceiros.
- **Fontes:** Barlow Condensed, Barlow, Space Mono (Google Fonts).
- **Bandeiras / outros assets do app** não fazem parte deste kit (ver handoff principal `design_handoff_quem_pega_quem`).

## Files
- `Marca.dc.html` — board de referência: 3 direções de símbolo (B é a escolhida), lockups (horizontal/empilhado/claro/mono), favicon em escala (180/48/32/16) + mock de aba, e a OG 1200×630. Abra no navegador e leia o markup inline pra valores exatos.
