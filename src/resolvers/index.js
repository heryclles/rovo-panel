import Resolver from '@forge/resolver';

import { ALLOWED_ACCOUNT_IDS, TARGET_ISSUE_TYPE_ID, TARGET_PROJECT_KEY } from '../constants';
import { getIssue, mapIssueToReview } from '../services/jira-service';

const resolver = new Resolver();

resolver.define('getChangeReview', async (req) => {
  const issueKey = req.context?.extension?.issue?.key;
  const accountId = req.context?.accountId;

  // Display conditions são avaliadas no cliente, então o piloto é reforçado aqui.
  if (ALLOWED_ACCOUNT_IDS.length > 0 && !ALLOWED_ACCOUNT_IDS.includes(accountId)) {
    return { ok: false, notAllowed: true };
  }

  if (!issueKey) {
    return { ok: false, error: 'Não foi possível identificar o item de trabalho atual.' };
  }

  try {
    const result = mapIssueToReview(await getIssue(issueKey));

    const { projectKey, issueTypeId } = result.issue;
    if (projectKey !== TARGET_PROJECT_KEY || issueTypeId !== TARGET_ISSUE_TYPE_ID) {
      return { ok: false, notApplicable: true };
    }

    return { ok: true, ...result };
  } catch (error) {
    console.error(`getChangeReview falhou para ${issueKey}:`, error);
    return { ok: false, error: error.message || 'Erro inesperado ao consultar o Jira.' };
  }
});

export const handler = resolver.getDefinitions();
