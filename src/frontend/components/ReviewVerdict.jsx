import React from 'react';
import { Box, Lozenge, Stack, Text, xcss } from '@forge/react';

import { getVerdictAppearance } from '../labels';

const verdictBoxStyles = xcss({
  padding: 'space.200',
  backgroundColor: 'elevation.surface.raised',
  borderColor: 'color.border',
  borderWidth: 'border.width',
  borderStyle: 'solid',
  borderRadius: 'border.radius',
});

/** Cabeçalho do painel: a decisão da revisão, sozinha e em destaque. */
export const ReviewVerdict = ({ result }) => (
  <Box xcss={verdictBoxStyles}>
    <Stack space="space.100" alignInline="center">
      <Text size="small" weight="medium" color="color.text.subtlest">
        Resultado da revisão
      </Text>
      {result ? (
        <Lozenge appearance={getVerdictAppearance(result)} isBold maxWidth={400}>
          {result}
        </Lozenge>
      ) : (
        <Text>Ainda não decidido pela revisão de IA.</Text>
      )}
    </Stack>
  </Box>
);
