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

/**
 * Campos onde o painel grava o feedback do usuário sobre a revisão do agente.
 *
 * PREENCHER com os IDs depois de criar os campos no Jira. Enquanto estiverem
 * vazios, o bloco de feedback simplesmente não aparece e nada é gravado — dá
 * para deployar o app antes dos campos existirem.
 *
 * Os campos precisam estar na tela de EDIÇÃO do projeto GML / [System] Mudança,
 * senão a REST API recusa a escrita com "Field cannot be set. It is not on the
 * appropriate screen, or unknown."
 */
export const FEEDBACK_FIELDS = {
  nota: '', // Number field   — nota de 1 a 5
  comentario: '', // Paragraph      — comentário opcional
  autor: '', // User picker    — quem avaliou
  data: '', // Date time picker — quando avaliou
};

/** O feedback só entra em cena quando todos os quatro IDs estão preenchidos. */
export const isFeedbackConfigured = () => Object.values(FEEDBACK_FIELDS).every(Boolean);

export const FEEDBACK_MIN_RATING = 1;
export const FEEDBACK_MAX_RATING = 5;
export const FEEDBACK_COMMENT_MAX_LENGTH = 1000;

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
