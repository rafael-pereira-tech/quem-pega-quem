---
name: playwright
description: Use this skill when writing, debugging, or refactoring Playwright tests. Consult upstream guides for locators, fixtures, network mocking, visual regression, CI integration, and page objects.
---

Canonical definition lives in `ai/skills/playwright/SKILL.md`. Read
that file end-to-end before applying.

Adopted opinions (in case the file read fails):

1. **Fixtures over Page Objects** by default; POM only for screens
   with rich interaction surfaces.
2. **Locators by accessibility role** (`getByRole`, `getByLabel`,
   `getByText`); `data-testid` is the last resort.
3. **Critical-flow ceiling**: ADR 0008's list is the maximum scope
   for Playwright. Non-critical flows belong in RTL.
4. **MSW only for unit / component tests**. E2E hits real surfaces.
