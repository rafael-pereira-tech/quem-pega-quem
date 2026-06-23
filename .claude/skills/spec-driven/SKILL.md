---
name: spec-driven-development
description: Use the 4-phase gated workflow (Specify → Plan → Tasks → Implement) when starting a new feature or when requirements are ambiguous. Each phase produces a reviewable artefact and requires human sign-off before advancing. Skip for typo fixes and unambiguous one-liners.
---

Canonical definition lives in `ai/skills/spec-driven/SKILL.md`. Read
that file end-to-end before applying.

Highest-stakes rules (in case the file read fails):

1. The workflow is **gated**: each phase needs human sign-off before
   the next starts. Do not skip ahead.
2. The artefact for each phase IS the deliverable for that phase —
   SPECIFY produces a specification, PLAN produces a plan, TASKS
   produces a task list with acceptance criteria, IMPLEMENT produces
   the code.
3. Use this for new features. Skip for typos, one-liners, and
   bug fixes whose root cause is already understood.
