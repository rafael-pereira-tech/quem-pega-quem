# Server Actions: N/A

Não usamos Server Actions neste projeto. O app é client-side (React +
Vite); não há camada de servidor (sem Next.js, sem RSC, sem
`next-safe-action`).

A escrita de dados é feita direto pelo cliente Supabase, com a RLS como
fronteira de autorização:

- **Resultados oficiais** (`official_results`): só admin grava — ver
  `src/supabase/official.ts` e `ai/docs/supabase-and-rls.md`.
- **Cenários** (`scenarios`): cada usuário grava os seus.

Arquivo mantido como placeholder: é referenciado pelo índice
(`ai/docs/README.md`). Se um dia adotarmos uma camada de servidor
(ex.: uma function para mutações auditadas), documente os padrões aqui.
