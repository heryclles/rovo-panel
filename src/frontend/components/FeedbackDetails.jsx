import React from 'react';
import { Heading, Inline, Stack, Text } from '@forge/react';

import { RichTextSection } from './RichTextSection';
import { StarRating } from './StarRating';
import { formatDateTime } from '../labels';

/** Aba com a avaliação que o analista deu para a revisão do agente. */
export const FeedbackDetails = ({ feedback }) => {
  const avaliadoEm = formatDateTime(feedback?.data);

  return (
    <Stack space="space.200">
      <Stack space="space.100">
        <Heading size="xsmall">Nota do analista</Heading>
        <Inline space="space.100" alignBlock="center">
          <StarRating value={feedback?.nota} isReadOnly />
          <Text weight="medium">{`${feedback?.nota} de 5`}</Text>
        </Inline>
      </Stack>

      <Stack space="space.100">
        <Heading size="xsmall">Comentário</Heading>
        <RichTextSection
          document={feedback?.comentario}
          emptyLabel="A avaliação foi enviada sem comentário."
        />
      </Stack>

      {feedback?.autor?.nome || avaliadoEm ? (
        <Text size="small" color="color.text.subtlest">
          {[feedback?.autor?.nome && `Avaliado por ${feedback.autor.nome}`, avaliadoEm]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      ) : null}
    </Stack>
  );
};
