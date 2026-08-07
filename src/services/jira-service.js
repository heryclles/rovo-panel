import api, { route } from '@forge/api';

import { FEEDBACK_FIELDS, REVIEW_FIELDS, isFeedbackConfigured } from '../constants';
import { toAdfDocument, toOptionValue, toOptionValues } from './adf';

const BASE_FIELDS = ['issuetype', 'project'];

/**
 * `route` faz percent-encoding dos valores interpolados na query, então uma
 * lista separada por vírgula viraria `a%2Cb`. Repetir o parâmetro (`fields=a&
 * fields=b`) evita a questão por completo e mantém a lista dinâmica.
 */
const buildFieldsQuery = () => {
  const params = new URLSearchParams();

  BASE_FIELDS.forEach((field) => params.append('fields', field));
  Object.values(REVIEW_FIELDS).forEach((field) => params.append('fields', field));

  if (isFeedbackConfigured()) {
    Object.values(FEEDBACK_FIELDS).forEach((field) => params.append('fields', field));
  }

  return params;
};

/**
 * Lê a issue como o app. O painel só é montado dentro da própria issue, e o
 * resolver revalida projeto, tipo e conta antes de devolver qualquer dado.
 */
export const getIssue = async (issueKey) => {
  const response = await api
    .asApp()
    .requestJira(route`/rest/api/3/issue/${issueKey}?${buildFieldsQuery()}`, {
      headers: { Accept: 'application/json' },
    });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Item de trabalho ${issueKey} não encontrado.`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('O app não tem permissão para consultar este item de trabalho.');
    }
    throw new Error(`Falha ao consultar a API do Jira (HTTP ${response.status}).`);
  }

  return response.json();
};

const mapFeedback = (fields) => {
  if (!isFeedbackConfigured()) {
    return null;
  }

  const rating = fields[FEEDBACK_FIELDS.nota];
  const author = fields[FEEDBACK_FIELDS.autor];

  return {
    nota: typeof rating === 'number' ? rating : null,
    comentario: toAdfDocument(fields[FEEDBACK_FIELDS.comentario]),
    autor: author ? { accountId: author.accountId, nome: author.displayName || null } : null,
    data: fields[FEEDBACK_FIELDS.data] || null,
  };
};

/** Converte a resposta crua da API do Jira no contrato consumido pelo painel. */
export const mapIssueToReview = (issue) => {
  const fields = issue?.fields || {};

  const review = {
    enriquecimentoContexto: toAdfDocument(fields[REVIEW_FIELDS.enriquecimentoContexto]),
    avaliacaoDimensoes: toAdfDocument(fields[REVIEW_FIELDS.avaliacaoDimensoes]),
    resultadoRevisao: toOptionValue(fields[REVIEW_FIELDS.resultadoRevisao]),
    justificativaRevisao: toAdfDocument(fields[REVIEW_FIELDS.justificativaRevisao]),
    pontosAtencao: toOptionValues(fields[REVIEW_FIELDS.pontosAtencao]),
  };

  const hasReview = Boolean(
    review.enriquecimentoContexto ||
      review.avaliacaoDimensoes ||
      review.resultadoRevisao ||
      review.justificativaRevisao ||
      review.pontosAtencao.length > 0
  );

  return {
    // Só o necessário para o resolver revalidar projeto e tipo do item.
    issue: {
      key: issue?.key || null,
      issueTypeId: fields.issuetype?.id || null,
      projectKey: fields.project?.key || null,
    },
    review,
    feedback: mapFeedback(fields),
    hasReview,
  };
};

const toParagraphDocument = (text) => ({
  type: 'doc',
  version: 1,
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

/**
 * Grava o feedback como o app, e não como o usuário: avaliar a revisão não
 * deveria exigir permissão de edição na issue. A autoria fica registrada no
 * campo "Avaliado por", preenchido com quem estava no painel.
 */
export const saveFeedback = async (issueKey, { rating, comment, accountId }) => {
  const trimmed = (comment || '').trim();

  const fields = {
    [FEEDBACK_FIELDS.nota]: rating,
    [FEEDBACK_FIELDS.comentario]: trimmed ? toParagraphDocument(trimmed) : null,
    [FEEDBACK_FIELDS.autor]: accountId ? { accountId } : null,
    // Formato de data/hora aceito pelo Jira: ISO 8601 com offset explícito.
    [FEEDBACK_FIELDS.data]: new Date().toISOString().replace('Z', '+0000'),
  };

  const response = await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`Falha ao gravar feedback em ${issueKey}: HTTP ${response.status} — ${detail}`);

    if (response.status === 400) {
      throw new Error(
        'O Jira recusou a gravação. Confira se os campos de feedback estão na tela de edição do projeto.'
      );
    }
    throw new Error(`Não foi possível salvar a avaliação (HTTP ${response.status}).`);
  }
};
