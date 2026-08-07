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
 * Os campos precisam estar na tela de EDIÇÃO do projeto GML / [System] Mudança,
 * senão a REST API recusa a escrita com "Field cannot be set. It is not on the
 * appropriate screen, or unknown."
 *
 * Deixar qualquer ID vazio desliga o bloco de feedback no painel, sem quebrar
 * nada — útil para deployar antes de os campos existirem.
 */
export const FEEDBACK_FIELDS = {
  nota: 'customfield_31983', // Number field     — nota de 1 a 5
  comentario: 'customfield_31984', // Paragraph        — comentário opcional
  autor: 'customfield_31985', // User picker      — quem avaliou
  data: 'customfield_31986', // Date time picker — quando avaliou
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
 * Restringe o painel a contas específicas. Lista vazia = liberado para todos
 * que enxergam a issue, que é o estado atual.
 *
 * Para voltar a um piloto controlado, inclua os accountIds aqui **e** adicione
 * a condição correspondente no `displayConditions` do manifest.yml:
 *
 *   jiraExpression: 'user.accountId == "<accountId>"'
 *
 * Os dois pontos precisam ser mantidos em sincronia: o manifesto controla a
 * exibição do módulo (no cliente) e esta lista reforça a regra no resolver.
 */
export const ALLOWED_ACCOUNT_IDS = [];
