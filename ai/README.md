# ai/

Canonical home for AI-collaboration artefacts: conventions humans expect
agents (and other humans) to follow, agent definitions, reusable prompt
fragments, and skills.

Tool-specific homes (`.claude/`, `.cursor/rules/`, `opencode.json`,
top-level `AGENTS.md` for OpenAI Codex CLI) are **thin pointers** into
this directory. Edit content here; let the tool-specific files reference
it. The aim is one source of truth, not five.

## Layout

```
ai/
├── README.md            ← this file
├── conventions/         ← how we work (commits, PRs, branches, code style)
│   ├── commits.md
│   ├── prs.md
│   └── branches.md
├── agents/              ← role-scoped agent definitions
│   └── README.md        ← matrix of when to use which agent
├── skills/              ← reusable skill definitions
├── docs/                ← engineering learnings captured from shipped PRs
└── prompts/             ← reusable prompt fragments referenced by agents
```

## Reading order for a new contributor or agent

1. `AGENTS.md` (root) — non-negotiables: motor puro, regras de
   desempate/Anexo C, segredos, RLS. O compasso do projeto.
2. `docs/` — `product-vision.md`, `reference/` (estrutura do código),
   `decisions/` (ADRs aceitos — leia antes de propor alternativas),
   `playbooks/` (feature / bugfix / migration).
3. `ai/conventions/` — commits, PRs, branches, design-handoff.
4. `ai/agents/README.md` — qual agente serve para a tarefa; depois o
   arquivo do agente específico (dev-fe, supabase-be, rls-auditor, …).
5. `ai/docs/` — learnings de engenharia não-óbvios (testing, Supabase +
   RLS, segurança). Comece por aqui ao tocar testes ou o backend.
6. `ai/skills/` — skills adotadas e o status do MCP.

## Why a separate directory and not just `docs/`

`docs/` holds product vision, architecture/reference, decisions (ADRs),
and playbooks — material that lives close to the codebase decisions it
justifies. `ai/` is operational: how to _collaborate_ on those
decisions. Splitting the two keeps `docs/` reviewable as a product spec
and `ai/` reviewable as a workflow contract.
