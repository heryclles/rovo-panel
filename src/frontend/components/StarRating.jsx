import React from 'react';
import { Icon, Inline, Pressable, Text, xcss } from '@forge/react';

const STARS = [1, 2, 3, 4, 5];

const starButtonStyles = xcss({
  backgroundColor: 'color.background.neutral.subtle',
  borderRadius: 'border.radius',
  ':hover': {
    backgroundColor: 'color.background.neutral.subtle.hovered',
  },
  ':active': {
    backgroundColor: 'color.background.neutral.subtle.pressed',
  },
});

/**
 * Nota de 1 a 5. Não há componente de rating no UI Kit, então são cinco
 * Pressables com o mesmo glyph de estrela — o que muda é a cor, cheia até a
 * nota escolhida e apagada depois dela.
 */
export const StarRating = ({ value, onChange, isReadOnly }) => {
  const rating = Number(value) || 0;

  if (isReadOnly) {
    return (
      <Inline space="space.025" alignBlock="center">
        {STARS.map((star) => (
          <Icon
            key={star}
            glyph="star-filled"
            label={star === rating ? `Nota ${rating} de 5` : ''}
            color={star <= rating ? 'color.icon.accent.orange' : 'color.icon.subtlest'}
          />
        ))}
      </Inline>
    );
  }

  return (
    <Inline space="space.025" alignBlock="center">
      {STARS.map((star) => (
        <Pressable
          key={star}
          onClick={() => onChange(star)}
          padding="space.050"
          xcss={starButtonStyles}
        >
          <Icon
            glyph="star-filled"
            label={`Dar nota ${star} de 5`}
            color={star <= rating ? 'color.icon.accent.orange' : 'color.icon.subtlest'}
          />
        </Pressable>
      ))}
      {rating > 0 ? (
        <Text size="small" color="color.text.subtlest">
          {` ${rating} de 5`}
        </Text>
      ) : null}
    </Inline>
  );
};
