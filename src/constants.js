/**
 * Campos preenchidos pelo agente de IA (Rovo) via automação no projeto GML.
 * Os IDs são fixos na instância clarobr.atlassian.net.
 */
export const REVIEW_FIELDS = {
  enriquecimentoContexto: 'customfield_31913',
  avaliacaoDimensoes: 'customfield_31914',
  resultadoRevisao: 'customfield_31915',
  justificativaRevisao: 'customfield_31916',
  pontosAtencao: 'customfield_31917',
};

/** Issue type "[System] Mudança" — o painel só é relevante nesse tipo. */
export const TARGET_ISSUE_TYPE_ID = '10056';

/** Projeto "Central de Mudanças e Liberação". */
export const TARGET_PROJECT_KEY = 'GML';

/**
 * Piloto controlado: enquanto o painel está em validação, apenas estas contas
 * enxergam o módulo. Para liberar geral, esvazie a lista e remova a condição
 * `jiraExpression` do manifest.yml.
 */
export const ALLOWED_ACCOUNT_IDS = [
  '712020:72bf3386-d379-4be9-8784-65ca4ef74442', // Heryclles Henrique do Nascimento
];
