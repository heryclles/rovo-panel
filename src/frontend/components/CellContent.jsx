import React from 'react';
import { AdfRenderer, Text } from '@forge/react';

const replaceUnsupportedNode = (node) => ({
  type: 'paragraph',
  content: [{ type: 'text', text: `Conteúdo não suportado neste painel (${node.type}).` }],
});

/**
 * Conteúdo de uma célula das tabelas da revisão. Usa o AdfRenderer quando a
 * linha tem marcação ou nós ricos — é o que faz menções a outras issues virarem
 * smart links carregados pelo Jira — e um Text simples no resto dos casos.
 */
export const CellContent = ({ content }) => {
  if (!content || !content.text) {
    return <Text>—</Text>;
  }

  if (content.isRich && content.document) {
    return (
      <AdfRenderer document={content.document} replaceUnsupportedNode={replaceUnsupportedNode} />
    );
  }

  return <Text>{content.text}</Text>;
};
