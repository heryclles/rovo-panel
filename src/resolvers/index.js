import Resolver from '@forge/resolver';

import {
  ALLOWED_ACCOUNT_IDS,
  FEEDBACK_COMMENT_MAX_LENGTH,
  FEEDBACK_MAX_RATING,
  FEEDBACK_MIN_RATING,
  TARGET_ISSUE_TYPE_ID,
  TARGET_PROJECT_KEY,
  isFeedbackConfigured,
} from '../constants';
import { getIssue, mapIssueToReview, saveFeedback } from '../services/jira-service';

const resolver = new Resolver();

/** Checagens comuns a toda chamada: piloto, item atual, projeto e tipo. */
const resolveContext = async (req) => {
  const issueKey = req.context?.extension?.issue?.key;
  const accountId = req.context?.accountId;

  // Display conditions são avaliadas no cliente, então o piloto é reforçado aqui.
  if (ALLOWED_ACCOUNT_IDS.length > 0 && !ALLOWED_ACCOUNT_IDS.includes(accountId)) {
    return { error: { ok: false, notAllowed: true } };
  }

  if (!issueKey) {
    return { error: { ok: false, error: 'Não foi possível identificar o item de trabalho atual.' } };
  }

  const result = mapIssueToReview(await getIssue(issueKey));
  const { projectKey, issueTypeId } = result.issue;

  if (projectKey !== TARGET_PROJECT_KEY || issueTypeId !== TARGET_ISSUE_TYPE_ID) {
    return { error: { ok: false, notApplicable: true } };
  }

  return { issueKey, accountId, result };
};

resolver.define('getChangeReview', async (req) => {
  try {
    const { error, result } = await resolveContext(req);

    if (error) {
      return error;
    }

    return { ok: true, feedbackEnabled: isFeedbackConfigured(), ...result };
  } catch (err) {
    console.error('getChangeReview falhou:', err);
    return { ok: false, error: err.message || 'Erro inesperado ao consultar o Jira.' };
  }
});

resolver.define('saveAgentFeedback', async (req) => {
  const { rating, comment } = req.payload || {};

  if (!isFeedbackConfigured()) {
    return { ok: false, error: 'Os campos de feedback ainda não foram configurados no app.' };
  }

  const parsedRating = Number(rating);
  const isValidRating =
    Number.isInteger(parsedRating) &&
    parsedRating >= FEEDBACK_MIN_RATING &&
    parsedRating <= FEEDBACK_MAX_RATING;

  if (!isValidRating) {
    return {
      ok: false,
      error: `A nota precisa ser um número inteiro de ${FEEDBACK_MIN_RATING} a ${FEEDBACK_MAX_RATING}.`,
    };
  }

  const trimmedComment = typeof comment === 'string' ? comment.trim() : '';

  if (trimmedComment.length > FEEDBACK_COMMENT_MAX_LENGTH) {
    return {
      ok: false,
      error: `O comentário passa de ${FEEDBACK_COMMENT_MAX_LENGTH} caracteres.`,
    };
  }

  try {
    const { error, issueKey, accountId } = await resolveContext(req);

    if (error) {
      return error;
    }

    await saveFeedback(issueKey, {
      rating: parsedRating,
      comment: trimmedComment,
      accountId,
    });

    // Relê a issue para devolver o feedback já como o Jira o gravou.
    const updated = mapIssueToReview(await getIssue(issueKey));

    return { ok: true, feedback: updated.feedback };
  } catch (err) {
    console.error('saveAgentFeedback falhou:', err);
    return { ok: false, error: err.message || 'Erro inesperado ao salvar a avaliação.' };
  }
});

export const handler = resolver.getDefinitions();
