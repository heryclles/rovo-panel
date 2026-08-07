import React from 'react';
import { Box, Heading, Text, xcss } from '@forge/react';

import { getVerdictTone } from '../labels';

/**
 * Fundo e borda suaves na cor do tom, para destacar sem virar um banner sólido.
 * O texto fica no `color.text` padrão, que tem contraste sobre todos eles.
 *
 * Cada tom carrega o estilo inteiro em vez de compor dois xcss: a prop `xcss`
 * do Box recebe um único objeto.
 */
const toneStyles = (backgroundColor, borderColor) =>
  xcss({
    backgroundColor,
    borderColor,
    padding: 'space.200',
    borderWidth: 'border.width',
    borderStyle: 'solid',
    borderRadius: 'border.radius',
  });

const TONE_STYLES = {
  success: toneStyles('color.background.success', 'color.border.success'),
  danger: toneStyles('color.background.danger', 'color.border.danger'),
  warning: toneStyles('color.background.warning', 'color.border.warning'),
  information: toneStyles('color.background.information', 'color.border.information'),
  neutral: toneStyles('elevation.surface.raised', 'color.border'),
};

/**
 * Cabeçalho do painel: a decisão da revisão. O valor fala por si, então não há
 * rótulo — o tom do card já indica se é aprovação, ressalva ou reprovação.
 */
export const ReviewVerdict = ({ result }) => (
  <Box xcss={TONE_STYLES[getVerdictTone(result)]}>
    {result ? (
      <Heading size="medium" as="h2">
        {result}
      </Heading>
    ) : (
      <Text>Ainda não decidido pela revisão de IA.</Text>
    )}
  </Box>
);
