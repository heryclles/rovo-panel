import React from 'react';
import { Box, Button, Inline, Stack, Text, xcss } from '@forge/react';

import { RichTextSection } from './RichTextSection';
import { StarRating } from './StarRating';
import { formatDateTime } from '../labels';

// Faixa rebaixada e sem borda: fica claramente separada da análise acima sem
// competir com o card do resultado.
const promptStyles = xcss({
  padding: 'space.150',
  backgroundColor: 'elevation.surface.sunken',
  borderRadius: 'border.radius',
});

/**
 * Avaliação da revisão, no rodapé do painel.
 *
 * Sem nota ainda, as estrelas são clicáveis direto: escolher uma já abre o
 * modal com a nota pré-selecionada, restando só o comentário opcional.
 *
 * Com nota registrada, a mesma faixa passa a mostrar o que foi avaliado. A
 * linha de nota e autoria fica à direita, mas o comentário ocupa a largura
 * inteira — texto corrido alinhado à direita fica ruim de ler.
 */
export const FeedbackPrompt = ({ feedback, onPick, onEdit }) => {
  if (!feedback?.nota) {
    return (
      <Box xcss={promptStyles}>
        <Inline space="space.150" alignBlock="center" alignInline="end" shouldWrap>
          <Text size="small" color="color.text.subtlest">
            Esta revisão ajudou na sua análise?
          </Text>
          <StarRating value={0} onChange={onPick} />
        </Inline>
      </Box>
    );
  }

  const avaliadoEm = formatDateTime(feedback.data);
  const assinatura = [feedback.autor?.nome && `Avaliado por ${feedback.autor.nome}`, avaliadoEm]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box xcss={promptStyles}>
      <Stack space="space.100">
        <Inline space="space.150" alignBlock="center" alignInline="end" shouldWrap>
          {assinatura ? (
            <Text size="small" color="color.text.subtlest">
              {assinatura}
            </Text>
          ) : null}
          <StarRating value={feedback.nota} isReadOnly />
          <Button appearance="link" spacing="compact" onClick={onEdit}>
            Alterar
          </Button>
        </Inline>

        {feedback.comentario ? (
          <RichTextSection document={feedback.comentario} emptyLabel="" />
        ) : null}
      </Stack>
    </Box>
  );
};
