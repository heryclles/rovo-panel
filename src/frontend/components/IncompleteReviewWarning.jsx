import React from 'react';
import { SectionMessage, Text } from '@forge/react';

/** Avisa quando parte dos campos da revisão de IA ainda não chegou neste item. */
export const IncompleteReviewWarning = ({ missingFields }) => {
  const missing = missingFields || [];

  if (missing.length === 0) {
    return null;
  }

  return (
    <SectionMessage title="Revisão incompleta" appearance="warning">
      <Text>
        {missing.length === 1
          ? `O campo "${missing[0]}" ainda não foi preenchido pela revisão de IA. A análise abaixo está parcial.`
          : `Os seguintes campos ainda não foram preenchidos pela revisão de IA: ${missing.join(
              ', '
            )}. A análise abaixo está parcial.`}
      </Text>
    </SectionMessage>
  );
};
