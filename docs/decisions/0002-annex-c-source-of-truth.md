# 0002 Anexo C como fonte da verdade

## Status

Accepted

## Contexto

Nos 16-avos da Copa 2026, oito grupos têm seu vencedor enfrentando um dos 8
melhores terceiros. **Qual** terceiro encara **qual** vencedor não é livre: a
FIFA fixa isso no **Anexo C** do regulamento, uma tabela com uma linha para cada
conjunto possível de 8 grupos que classificam terceiros — **C(12,8) = 495
combinações**. Para um dado conjunto, o Anexo C diz o confronto exato de cada
terceiro.

É tentador "calcular" essa alocação por um algoritmo de menor-distância, mas a
tabela oficial nem sempre é deduzível só pelo `allowedGroups` de cada slot:
existem combos em que mais de uma alocação respeita as restrições, e só a
**tabela da FIFA** diz qual vale. Portanto a alocação dos terceiros **é tabela,
não algoritmo**.

## Decisão

- O Anexo C é uma **tabela fixa** em `data/anexo-c.json` (495 chaves canônicas,
  cada uma mapeando slot grupo-vencedor → grupo do terceiro). O motor só
  **consulta** (`lookupThirdAssignment` em `annexC.ts`), não deduz.
- Distinguimos duas coisas:
  - a **ordem** dos terceiros (quem são os 8 melhores) é **algorítmica** — vive
    em `thirds.ts` e é coberta pelos testes do motor;
  - os **confrontos** de cada terceiro são **tabela** — vêm do Anexo C.
- A tabela foi **validada contra o PDF oficial da FIFA**. O snapshot oficial
  está em `data/anexo-c.reference.json` e um **teste de regressão**
  (`src/data/__tests__/annex-c-reference.test.ts`) trava `anexo-c.json` contra
  ele: 495 combinações e ~3960 confrontos têm de bater exatamente. Qualquer
  edição acidental quebra o teste.
- `npm run validate` checa, por lógica, a integridade estrutural (495 combos,
  bijeção por combo, respeito ao `allowedGroups`) — separado do diff com a
  fonte oficial.

## Consequências

- Confronto de terceiro nos 16-avos é sempre o oficial; impossível "inventar"
  um cruzamento.
- Mexer no Anexo C exige atualizar `anexo-c.reference.json` conscientemente
  (com prova da fonte) — o teste de regressão impede mudança silenciosa.
- Dois níveis de garantia: estrutura por `npm run validate`, exatidão vs. FIFA
  pelo teste de regressão.

## Alternativas

- **Gerar a alocação por algoritmo** — descartado: em combos ambíguos o
  `allowedGroups` admite >1 alocação válida; só a tabela da FIFA decide. Um
  algoritmo poderia escolher diferente da oficial.
- **Só validação estrutural, sem snapshot oficial** — insuficiente: prova que a
  tabela é coerente, não que é a da FIFA. Por isso existe o snapshot + regressão.
