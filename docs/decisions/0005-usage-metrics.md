# 0005 Telemetria de uso mínima: CF Web Analytics + tabela `events`

## Status

Accepted

## Contexto

Queremos enxergar uso real do produto — quantas pessoas abrem, se voltam, se
chegam a dar palpite — sem montar um aparato de analytics nem ferir a postura
de privacidade/baixo-atrito do app (ver ADR 0003). O time é pequeno e o app é
majoritariamente client-side com deploy em Cloudflare Pages e backend Supabase
já no ar. Precisamos do mínimo que responda "quantos acessos?" e "quais ações
importam?" sem um SaaS de terceiros nem PII.

Duas necessidades distintas: **tráfego** (visitas, origem, país — onde a
deduplicação de bots e únicos é difícil de fazer na mão) e **eventos de
produto** (cliques que só fazem sentido pra este app).

## Decisão

Abordagem **híbrida**, cada metade na ferramenta que ela já faz bem:

- **Tráfego → Cloudflare Web Analytics.** Habilitado no painel do Pages
  (auto-injeta o beacon, sem cookies, sem código no repositório). Cuida de
  pageviews/visitas/origem/país com filtragem de bot e únicos.
- **Eventos de produto → tabela `public.events` no Supabase**, append-only,
  com RLS no mesmo padrão das outras tabelas:
  - `insert` só do próprio usuário (`with check (user_id = auth.uid())`) — toda
    sessão, inclusive anônima, registra **só os seus** eventos.
  - `select` **só admin** (`using (public.is_admin())`) — agregação no SQL
    Editor / painel admin futuro; o público não lê telemetria.
  - sem `update`/`delete` via cliente (append-only); limpeza via `service_role`.
- **Identidade = a sessão anônima que já existe** (`auth.uid()`), guardada em
  `events.user_id`. Permite distinguir únicos / novos vs. recorrentes / DAU sem
  cadastro e sem PII.
- **Conjunto mínimo e tipado de eventos** (no cliente, `EventName`):
  `app_open`, `score_edit` (1ª edição de placar da sessão = engajamento),
  `reset`, `admin_open`. Crescer a lista é trivial; começamos enxuto.
- **Telemetria é best-effort**: o cliente faz `insert` fire-and-forget e
  engole erros — nunca bloqueia nem quebra a UI, e é no-op sem Supabase/sessão.

## Consequências

- Respostas de uso sem SaaS externo nem PII; dados de produto são seus e
  consultáveis em SQL.
- O CF Web Analytics não tem evento customizado — por isso os cliques vão pro
  Supabase; o tráfego vai pro CF. São duas superfícies de consulta, não uma.
- A tabela `events` é insert-only por sessão anônima: é **abusável** (dá pra
  scriptar inserts atribuídos a si mesmo). Para o porte atual é risco aceito;
  endurecer (rate-limit por trigger, cap de tamanho de `props`) fica como
  evolução, não pré-requisito. Não há filtragem de bot nos eventos do Supabase
  — o número "confiável" de visitas é o do CF.
- Mais uma migração + policy a manter sob o `rls-auditor` e o playbook de
  migração. Habilitar o CF é um passo de painel (fora do repositório).

## Alternativas

- **Só Cloudflare** (Web Analytics + Analytics Engine via Pages Function para
  cliques) — descartado por ora: adiciona um Worker e a consulta dos eventos é
  por API, menos prática que SQL, sem ganho claro sobre uma tabela.
- **Só Supabase** (page_view também como linha) — possível, mas perde a
  precisão de visitas/únicos/bot que o CF dá de graça.
- **SaaS de analytics** (GA, Plausible, PostHog, Umami) — descartado: dependência
  externa e considerações de privacidade/consentimento para um ganho que a dupla
  CF + tabela própria já cobre no nível "mínimo".
- **Não medir nada** — descartado: voar às cegas sobre adoção trava decisão de
  produto.
