# CLAUDE.md

Contexto para agentes trabalhando neste repositório. O `README.md` descreve o
produto; este arquivo registra o que **não** está óbvio no código.

## O que é

App Forge (UI Kit, JavaScript) com um painel de item de trabalho no Jira
chamado **Change Management Revisor**. Ele lê 5 campos que uma automação
preenche a partir da saída de um agente de IA do Rovo e os apresenta juntos.

**O painel só lê.** Não executa IA, não grava campo, não transiciona issue. Se
uma tarefa pedir escrita, confirme antes — hoje o escopo é só `read:jira-work`.

## Ambiente real

| | |
| --- | --- |
| Site | `clarobr.atlassian.net` (cloudId `aa5de586-c438-44fe-b575-10a193f4d92f`) |
| Projeto | `GML` — Central de Mudanças e Liberação (JSM) |
| Tipo de item | `[System] Mudança`, id `10056` |
| Issue com dados reais | `GML-151723` — útil para conferir formatos |
| Piloto | Só `ALLOWED_ACCOUNT_IDS` (hoje: a conta do Heryclles) enxerga o painel |

Restringir a visibilidade exige mexer em **dois** lugares que precisam ficar em
sincronia: `displayConditions` no `manifest.yml` e `ALLOWED_ACCOUNT_IDS` em
`src/constants.js`. Display conditions rodam no cliente, então o resolver
revalida projeto, tipo e conta antes de devolver dados.

## Comandos

```bash
npx forge deploy -e development --non-interactive   # publica; roda forge lint junto
npx forge install --upgrade --site clarobr.atlassian.net --product jira -e development
npx eslint "src/**/*.{js,jsx}"                      # lint do código
```

O app **já está instalado** no site (development). `forge install` sem
`--upgrade` falha com "already installed" — use `--upgrade`. Upload para o S3
às vezes cai com "socket hang up"; basta repetir o deploy.

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
- **`route` faz percent-encoding dos valores interpolados**, o que quebraria as
  vírgulas da query `fields` — por isso a lista de campos é literal no template
  em `jira-service.js`.

## Convenções

- JavaScript, não TypeScript. Sem framework de teste.
- Textos de UI e comentários em português.
- Componentes UI Kit apenas (`@forge/react`); nada de HTML nativo.
- Antes de usar um componente ou prop do UI Kit, confira na doc via MCP
  (`search-forge-docs`) — vários props diferem do React comum.
- Rode `npx eslint` e faça deploy após mudanças; o deploy roda `forge lint`.
