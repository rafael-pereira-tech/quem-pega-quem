# 0007 Roteamento com react-router + rota de admin protegida

## Status

Accepted

## Contexto

A navegação **app ↔ admin** e entre as seções (grupos / chave / terceiros) era
por **estado local** (`useState`) no `App`, com a rota de admin detectada na mão
via `window.location.pathname`. As URLs não refletiam a tela (nada de
compartilhar/bookmarkar nem back/forward), e a "proteção" do admin era um `if`
espalhado pelo componente. Conforme o app cresce, isso fica frágil e pouco
profissional.

## Decisão

Adotamos **`react-router-dom` (v7)** para rotas declarativas:

- `/` (grupos), `/chave`, `/terceiros` — as abas viram **`NavLink`** (com
  `aria-current` automático). No desktop, todas renderizam a `DesktopScreen`.
- **`/admin` é uma rota PROTEGIDA**: mostra o `AdminPanel` só quando
  `session.isAdmin`; senão, a tela de login (magic link). A fronteira de
  segurança **real** continua sendo a **RLS + `is_admin()`** (ADRs 0003/0006) —
  a rota é guarda de **UI**, não de dados.
- `*` redireciona para `/`.
- `BrowserRouter` no `main.tsx`; o SPA fallback do Cloudflare Pages
  (`public/_redirects` → `/* /index.html 200`) já serve qualquer rota.

## Consequências

- URLs refletem a tela: compartilháveis, bookmarkáveis, com back/forward.
- A proteção do admin fica num **único lugar** (o elemento da rota), não
  espalhada em flags.
- Uma dependência nova (`react-router-dom`), pequena e padrão de mercado;
  `npm audit` segue limpo.
- O estado de aba sai do `App` (vira rota): menos `useState`, navegação por
  `Link`/`NavLink`.

## Alternativas

- **Manter por estado** — descartado: não dá URL por tela nem histórico, e a
  proteção fica ad-hoc.
- **Roteador caseiro** (hash/pathname na mão) — descartado: reinventaria o que o
  react-router já faz bem (matching, links, navegação, acessibilidade).
- **TanStack Router / Wouter** — react-router é o mais difundido e suficiente;
  sem necessidade de type-safe routing nem de bundle mínimo aqui.
