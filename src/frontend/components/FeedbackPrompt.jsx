import React from 'react';
import { Box, Button, Inline, Text, xcss } from '@forge/react';

import { StarRating } from './StarRating';

// Faixa rebaixada e sem borda: fica claramente separada da análise acima sem
// competir com o card do resultado.
const promptStyles = xcss({
  padding: 'space.150',
  backgroundColor: 'elevation.surface.sunken',
  borderRadius: 'border.radius',
});

/**
 * Convite para avaliar a revisão, no rodapé do painel.
 *
 * As estrelas são clicáveis direto: escolher uma já abre o modal com a nota
 * pré-selecionada, restando só o comentário opcional.
 */
export const FeedbackPrompt = ({ feedback, onPick, onEdit }) => {
  const hasFeedback = Boolean(feedback?.nota);

  return (
    <Box xcss={promptStyles}>
      <Inline space="space.150" alignBlock="center" alignInline="end" shouldWrap>
        <Text size="small" color="color.text.subtlest">
          {hasFeedback ? 'Você avaliou esta revisão' : 'Esta revisão ajudou na sua análise?'}
        </Text>

        {hasFeedback ? (
          <>
            <StarRating value={feedback.nota} isReadOnly />
            <Button appearance="link" spacing="compact" onClick={onEdit}>
              Alterar
            </Button>
          </>
        ) : (
          <StarRating value={0} onChange={onPick} />
        )}
      </Inline>
    </Box>
  );
};
