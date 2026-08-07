# CLAUDE.md

Contexto para agentes trabalhando neste repositório. O `README.md` descreve o
produto; este arquivo registra o que **não** está óbvio no código.

## O que é

App Forge (UI Kit, JavaScript) com um painel de item de trabalho no Jira
chamado **Change Management Revisor**. Ele lê 5 campos que uma automação
preenche a partir da saída de um agente de IA do Rovo e os apresenta juntos.

O painel **lê** os 5 campos da revisão e **grava** apenas os 4 campos de
feedback do usuário (nota de 1 a 5 e comentário). Não executa IA, não altera os
campos da revisão nem transiciona a issue. Escopos: `read:jira-work` e
`write:jira-work`.

**Toda chamada ao Jira usa `api.asApp()`** — leitura e escrita. Avaliar a
revisão não deveria exigir permissão de edição na issue, e a leitura seguiu o
mesmo caminho a pedido do usuário. Consequência: nenhuma chamada carrega a
permissão de quem está no painel, então quem faz o controle de acesso é o
resolver (projeto, tipo e `ALLOWED_ACCOUNT_IDS`) somado ao fato de o painel só
ser montado dentro da issue aberta. A autoria do feedback fica registrada no
campo "Avaliado por", preenchido com o `accountId` de quem estava no painel.

Enquanto `FEEDBACK_FIELDS` (em `src/constants.js`) tiver IDs vazios, o bloco de
feedback não aparece e nada é gravado — dá para deployar antes de os campos
existirem no Jira.

## Ambiente real

| | |
| --- | --- |
| Site | `clarobr.atlassian.net` (cloudId `aa5de586-c438-44fe-b575-10a193f4d92f`) |
| Projeto | `GML` — Central de Mudanças e Liberação (JSM) |
| Tipo de item | `[System] Mudança`, id `10056` |
| Issue com dados reais | `GML-151723` — útil para conferir formatos |
| Usuários | Todos que enxergam a issue (`ALLOWED_ACCOUNT_IDS` vazio) |
| Ambiente instalado | **`production`** — e só ele |

O painel já foi um piloto restrito a uma conta; o mecanismo continua no código.
Restringir de novo exige mexer em **dois** lugares que precisam ficar em
sincronia: `displayConditions` no `manifest.yml` (`jiraExpression` com o
accountId) e `ALLOWED_ACCOUNT_IDS` em `src/constants.js`. Display conditions
rodam no cliente, então o resolver revalida projeto, tipo e conta antes de
devolver dados.

## Comandos

```bash
npx forge deploy -e production --non-interactive    # publica; roda forge lint junto
npx forge install list                              # confere versão e ambiente instalados
npx eslint "src/**/*.{js,jsx}"                      # lint do código
```

**Deploy em `development` não chega a ninguém.** A única instalação no site é
de `production` (confirmado em 07/08/2026 via `forge install list`) — publicar
em development só cria uma versão que nenhum usuário roda. É um erro fácil de
cometer e difícil de perceber, porque o deploy termina com sucesso. Sempre
confira com `forge install list` qual ambiente e major estão instalados antes
de concluir que uma correção está no ar.

Enquanto os escopos do `manifest.yml` não mudarem, o deploy se propaga sozinho
para a instalação (o status vira `Up-to-date` na nova minor) e **não** é preciso
reinstalar. Se os escopos mudarem, aí sim rode
`npx forge install --upgrade --site clarobr.atlassian.net --product jira -e production`;
sem `--upgrade` falha com "already installed". Upload para o S3 às vezes cai com
"socket hang up"; basta repetir o deploy.

Não há suíte de testes. Para validar lógica pura (parsers, hash), escreva um
script `.mjs` temporário em `/tmp` importando os módulos por caminho absoluto e
rode com `node` — os arquivos são ESM sem `"type": "module"` no package.json,
então o Node reclama por warning mas funciona.

## Decisões já tomadas (não reverter sem pedir)

- **Valores de campo aparecem crus.** Nada de dicionário traduzindo
  `REPROVADA` → "Reprovada". Existiu um e foi removido a pedido do usuário. A
  única leitura do conteúdo é a *cor* do lozenge do veredito.
- **Sem botões no painel.** Não há cache: toda montagem relê a issue, então
  recarregar a página basta. Botões de "Atualizar"/"Tentar novamente" foram
  removidos por serem redundantes.
- **Tags dos pontos de atenção usam o visual padrão do `Tag`** (fundo suave,
  contorno leve). Chips preenchidos com `Box` + `xcss` foram testados e
  rejeitados por ficarem pesados.
- **Cor das tags vem de hash do texto** (FNV-1a + finalizador MurmurHash3, em
  `labels.js`), para que o mesmo ponto tenha sempre a mesma cor sem manter
  lista de valores. Colisão entre dois pontos no mesmo item é esperada.
- **Parsers são conservadores.** `parseReview.js` devolve lista vazia quando o
  texto foge do formato, e o painel cai no `AdfRenderer` com o conteúdo cru.
  Nunca esconda conteúdo que o parser não entendeu.
- **Pontos de Atenção vazio não é campo faltando.** Fica fora do aviso de
  revisão incompleta (`FIELD_LABELS` em `labels.js`), sem olhar para o
  resultado — uma mudança aprovada pode ter pontos, e uma reprovada pode não
  ter.

## Armadilhas descobertas na marra

- **App em "Not sharing" só funciona para os contributors.** Foi a causa de
  todo mundo, menos o autor, ver "you need to grant it access to Atlassian apps
  on your behalf" no lugar do painel. A doc é explícita: com distribuição
  **Not sharing** o app é tratado como de uso exclusivo de quem o desenvolve, e
  todos os demais — inclusive usuários licenciados e contas portal-only do JSM
  — são barrados. **Não tem relação com `asApp` vs `asUser`**: apps `asApp`-only
  sofrem igual. Correção: developer console → app → **Distribution** →
  *Distribution controls* → **Edit** → **Sharing**. Não é preciso reinstalar
  nem usar o link de instalação gerado; o link serve para instalar em outros
  sites. Não existe comando de CLI para isso.
  Ver [doc](https://developer.atlassian.com/platform/forge/distribute-your-apps/)
  e [thread da comunidade](https://community.developer.atlassian.com/t/jsm-portal-customers-hit-allow-access-on-your-behalf-consent-asapp-only-app/101231).

- **`asUser()` também exige consentimento individual**, por outro caminho —
  mas não era a causa do sintoma acima. Hoje o app é `asApp` em tudo, então a
  questão não se aplica.

- **A automação do Jira converte o texto do agente com wiki markup, não
  markdown.** Negrito é `*texto*` com **um** asterisco. Como o prompt do agente
  emite `**texto**`, sobra um `*` órfão antes e outro depois de cada negrito no
  ADF gravado — por isso os parsers descartam esses marcadores. Corrigir o
  prompt do agente para `*texto*` limpa a origem.
- **Tabelas em markdown não viram tabela no campo.** A KB da Atlassian sobre
  conversão wiki → ADF documenta só `noformat`, `panel` e `code`; tabela wiki
  (`||h||h||`) não está confirmada. Por isso as tabelas são montadas no painel,
  a partir do texto. Se um dia o campo passar a conter tabela ADF de verdade, o
  fallback do `AdfRenderer` já a renderiza sem mudança de código.
- **Preserve os nós ADF nas células.** As linhas citam outras issues como
  `inlineCard`; achatar para string troca o smart link por uma URL crua.
  `parseReview.js` fatia por offset de caracteres e corta parcialmente só o nó
  de texto onde o corte cai.
- **`TagGroup` só alinha a `start`/`end`** e ocupa a largura toda — para
  centralizar tags, use `Inline` com `alignInline="center"`.
- **Nos design tokens o cinza é `gray`; no componente `Tag` é `grey`.**
- **`xcss` do `@forge/react` é `(style) => style`** — identidade em runtime, sem
  transformação de build, então dá para montar tokens dinamicamente.
- **`route` faz percent-encoding dos valores interpolados na query.** Para a
  lista de `fields`, `jira-service.js` usa `URLSearchParams` repetindo o
  parâmetro (`fields=a&fields=b`), o que evita vírgulas codificadas e permite
  montar a lista dinamicamente.
- **Escrever em campo exige o campo na tela de EDIÇÃO** do projeto/tipo. Sem
  isso a REST API responde 400 "Field cannot be set. It is not on the
  appropriate screen, or unknown." Automação do Jira não sofre disso, app sim.

## Convenções

- JavaScript, não TypeScript. Sem framework de teste.
- Textos de UI e comentários em português.
- Componentes UI Kit apenas (`@forge/react`); nada de HTML nativo.
- Antes de usar um componente ou prop do UI Kit, confira na doc via MCP
  (`search-forge-docs`) — vários props diferem do React comum.
- Rode `npx eslint` e faça deploy após mudanças; o deploy roda `forge lint`.
