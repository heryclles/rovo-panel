import api, { route } from '@forge/api';

import { REVIEW_FIELDS } from '../constants';
import { toAdfDocument, toOptionValue, toOptionValues } from './adf';

// A lista fica literal no template porque `route` faz percent-encoding dos
// valores interpolados, o que quebraria os separadores da query `fields`.
const FIELDS_QUERY =
  'issuetype,project,' +
  'customfield_31913,customfield_31914,customfield_31915,customfield_31916,customfield_31917';

/**
 * Lê a issue como o usuário logado, para que o painel nunca exponha dados
 * além do que a pessoa já enxerga na própria issue.
 */
export const getIssue = async (issueKey) => {
  const response = await api
    .asUser()
    .requestJira(route`/rest/api/3/issue/${issueKey}?fields=${FIELDS_QUERY}`, {
      headers: { Accept: 'application/json' },
    });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Item de trabalho ${issueKey} não encontrado ou sem permissão de acesso.`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Você não tem permissão para visualizar este item de trabalho.');
    }
    throw new Error(`Falha ao consultar a API do Jira (HTTP ${response.status}).`);
  }

  return response.json();
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
    hasReview,
  };
};
