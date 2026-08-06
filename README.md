# Change Management Revisor

App Forge (UI Kit) que adiciona um painel de item de trabalho no Jira reunindo, em um só lugar, a revisão de mudança produzida pelo agente de IA do Rovo.

O painel apenas **lê e apresenta** os campos que a automação preenche — ele não executa a IA nem grava valores.

## Onde o painel aparece

| | |
| --- | --- |
| Site | `clarobr.atlassian.net` |
| Projeto | `GML` — Central de Mudanças e Liberação |
| Tipo de item | `[System] Mudança` (id `10056`) |
| Usuários | Piloto controlado — apenas as contas em `ALLOWED_ACCOUNT_IDS` |

A restrição é feita por `displayConditions` no `manifest.yml` e revalidada no resolver, já que display conditions são avaliadas no cliente.

### Liberar o painel para todo mundo

O piloto está preso em dois lugares que precisam ser alterados juntos:

1. remover a condição `jiraExpression` do bloco `displayConditions` em `manifest.yml`;
2. esvaziar `ALLOWED_ACCOUNT_IDS` em `src/constants.js` (lista vazia desliga a checagem do resolver).

Para adicionar outra pessoa ao piloto em vez de liberar geral, inclua o accountId nos dois pontos.

## Estados do painel

| Situação | O que aparece |
| --- | --- |
| Nenhum dos 5 campos preenchido | `EmptyState`: "Revisão de IA ainda não executada" |
| Alguns campos preenchidos | Aviso `warning` nomeando os campos ausentes, seguido da análise parcial |
| Pontos de Atenção vazio | Não gera aviso — lista vazia é estado válido, seja qual for o resultado |
| Todos os campos preenchidos | Análise completa, sem avisos |
| Item fora de GML / `[System] Mudança` | Mensagem de não aplicável (defesa do resolver) |
| Usuário fora do piloto | Mensagem de acesso não liberado |

## Campos exibidos

| Campo | ID | Tipo | Onde aparece no painel |
| --- | --- | --- | --- |
| Resultado da Revisão | `customfield_31915` | Lista de seleção (única) | Cabeçalho, como lozenge colorido |
| Pontos de Atenção | `customfield_31917` | Lista de seleção (múltipla) | Tags centralizadas abaixo do cabeçalho |
| Justificativa da Revisão | `customfield_31916` | Texto longo | Aba "Justificativa" |
| Avaliação das Dimensões | `customfield_31914` | Texto longo | Aba "Dimensões", como tabela |
| Enriquecimento de Contexto | `customfield_31913` | Texto longo | Aba "Contexto", como tabela |

### Tabelas a partir do texto do agente

O agente entrega `avaliacao` e `enriquecimento_contexto` como texto corrido, mas ambos têm estrutura fixa, então o painel monta tabelas a partir deles (`src/frontend/parseReview.js`):

| Campo | Formato por linha | Colunas da tabela |
| --- | --- | --- |
| `avaliacao` | `**N. Nome — STATUS:** observação` (11 linhas) | #, Dimensão, Status (lozenge), Resumo |
| `enriquecimento_contexto` | `**Bloco:** conteúdo` (4 blocos) | Bloco, Conteúdo |

Detalhe que explica o parser: a automação do Jira converte o texto do agente usando **wiki markup**, onde negrito é `*texto*` com **um** asterisco. Como o prompt do agente pede markdown (`**texto**`), sobra um `*` órfão antes e outro depois de cada negrito no ADF gravado — o parser descarta esses marcadores. Corrigir o prompt para `*texto*` limpa o campo na origem, e o painel continua funcionando dos dois jeitos.

**As células de conteúdo continuam sendo ADF, não texto.** Só o rótulo de cada linha (nome da dimensão, status, nome do bloco) vira string; o resumo e o conteúdo mantêm os nós ADF originais e são renderizados por `AdfRenderer` via `CellContent`. Isso importa porque essas linhas citam outras issues como `inlineCard` — achatar para string deixaria a URL crua no lugar do smart link que o Jira carrega sozinho. Quando a célula é texto puro sem marcação, `CellContent` usa um `Text` simples e evita o custo do renderer.

Os parsers são conservadores: se o texto não seguir o formato, devolvem lista vazia e o painel renderiza o ADF cru com `AdfRenderer`. Isso vale também se um dia o campo passar a conter uma tabela ADF de verdade — nesse caso o `AdfRenderer` a renderiza nativamente, sem mudança no código.

Os IDs ficam centralizados em `src/constants.js`.

Os **Pontos de Atenção** viram `Tag`s coloridas: a cor sai de um hash FNV-1a (com finalizador MurmurHash3) do próprio texto, sobre uma paleta de 10 cores. Assim o mesmo ponto tem sempre a mesma cor, em qualquer item, sem manter lista de valores possíveis — e valores novos ganham cor sozinhos.

O visual é o do próprio `Tag`: fundo bem suave com contorno leve. Chegamos a testar chips com `Box` + `xcss` e `color.background.accent.{hue}.subtle`, que dão preenchimento sólido, mas o resultado ficou pesado demais para o painel — se um dia quiser retomar, o par correto é esse fundo com texto em `color.text.accent.{hue}.bolder`.

Como a cor vem só do hash, dois pontos distintos podem cair na mesma cor no mesmo item — é esperado com 10 cores e não indica relação entre eles. A cor é decorativa e não carrega significado.

Os valores das listas de seleção são exibidos **exatamente como o Jira devolve** — sem tradução, dicionário ou reformatação. A única leitura do conteúdo é a cor do lozenge do resultado (`getVerdictAppearance` em `src/frontend/labels.js`), que procura trechos como "reprov", "ressalv" e "aprov" ignorando acentos e caixa; qualquer valor não reconhecido fica na cor neutra, sem alterar o texto exibido.

## Estrutura

```
src/
├── index.js                        # exporta o handler do resolver
├── constants.js                    # IDs dos campos, alvo (projeto/tipo) e piloto
├── resolvers/index.js              # resolver getChangeReview
├── services/
│   ├── jira-service.js             # leitura da issue via REST API + mapeamento
│   └── adf.js                      # normalização de ADF e listas de seleção
└── frontend/
    ├── index.jsx                   # painel: estados, abas e composição
    ├── labels.js                   # cor do veredito, paleta das tags, campos ausentes
    ├── parseReview.js              # texto do agente -> linhas de tabela (preservando ADF)
    └── components/
        ├── ReviewVerdict.jsx       # resultado da revisão, centralizado e em destaque
        ├── AttentionPoints.jsx     # tags coloridas por hash
        ├── IncompleteReviewWarning.jsx  # aviso de campos ainda não preenchidos
        ├── DimensionsTable.jsx     # tabela das 11 dimensões
        ├── ContextTable.jsx        # tabela dos blocos de contexto
        ├── CellContent.jsx         # célula: AdfRenderer quando rica, Text quando não
        └── RichTextSection.jsx     # fallback ADF cru dos textos longos
```

A issue é lida com `api.asUser()`, então o painel nunca mostra nada além do que a pessoa já enxerga na própria issue.

O painel não tem botões: ele lê a issue a cada montagem e não guarda cache, então recarregar a página já busca tudo de novo — igual a qualquer outro campo da issue.

## Desenvolvimento

```bash
forge deploy -e development     # publica o código
forge install --upgrade         # necessário após mudança de escopos
forge tunnel                    # invocações locais durante o desenvolvimento
forge lint                      # validação do manifesto e do código
npx eslint "src/**/*.{js,jsx}"  # lint do código-fonte
```

Escopo exigido: `read:jira-work`.

## Suporte

Documentação da plataforma: [developer.atlassian.com/platform/forge](https://developer.atlassian.com/platform/forge).
