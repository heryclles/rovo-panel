import React from 'react';
import { AdfRenderer, Stack, Text } from '@forge/react';

const replaceUnsupportedNode = (node) => ({
  type: 'paragraph',
  content: [{ type: 'text', text: `Conteúdo não suportado neste painel (${node.type}).` }],
});

/** Renderiza um campo de texto longo preenchido pela IA, ou um aviso de vazio. */
export const RichTextSection = ({ document, emptyLabel }) => {
  if (!document) {
    return (
      <Stack space="space.050">
        <Text>{emptyLabel}</Text>
      </Stack>
    );
  }

  return <AdfRenderer document={document} replaceUnsupportedNode={replaceUnsupportedNode} />;
};
