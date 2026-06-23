// Matchers do jest-dom (toBeInTheDocument, toBeDisabled, etc.).
// Side-effect import seguro tanto em Node (testes do motor) quanto em jsdom:
// só registra matchers no `expect`; os testes de DOM usam `// @vitest-environment jsdom`.
// O cleanup entre testes é automático do @testing-library/react (afterEach global).
import '@testing-library/jest-dom/vitest';
