import React from 'react';
import { Heading, Inline, Stack, Tag, Text } from '@forge/react';

import { getTagColor } from '../labels';

/**
 * Dimensões que a IA sinalizou como merecedoras de atenção na revisão.
 *
 * As tags ficam num Inline, e não num TagGroup: o TagGroup só alinha a
 * `start`/`end` e ocupa a largura toda, então centralizar o Stack em volta não
 * move as tags. O Inline centraliza os próprios filhos, inclusive quando eles
 * quebram em mais de uma linha.
 */
export const AttentionPoints = ({ points }) => {
  const values = points || [];

  return (
    <Stack space="space.100" alignInline="center">
      <Heading size="xsmall">Pontos de atenção</Heading>
      {values.length === 0 ? (
        <Text size="small">Nenhum ponto de atenção sinalizado pela revisão.</Text>
      ) : (
        <Inline space="space.050" rowSpace="space.050" shouldWrap alignInline="center">
          {values.map((point) => (
            <Tag key={point} text={point} color={getTagColor(point)} appearance="rounded" />
          ))}
        </Inline>
      )}
    </Stack>
  );
};
