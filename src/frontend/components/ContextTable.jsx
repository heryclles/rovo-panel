import React from 'react';
import { DynamicTable, Text } from '@forge/react';

import { CellContent } from './CellContent';

// Sem colunas ordenáveis: a ordem dos blocos (Anexos, Atividades RDM, falhas,
// sucesso) é a definida pelo agente e faz parte da leitura.
const head = {
  cells: [
    { key: 'rotulo', content: 'Bloco', width: 25 },
    { key: 'conteudo', content: 'Conteúdo', width: 75 },
  ],
};

export const ContextTable = ({ blocks }) => {
  const rows = (blocks || []).map((block, index) => ({
    key: `bloco-${index}-${block.rotulo}`,
    cells: [
      { key: block.rotulo, content: <Text weight="medium">{block.rotulo}</Text> },
      { key: block.conteudo.text, content: <CellContent content={block.conteudo} /> },
    ],
  }));

  return (
    <DynamicTable
      label="Enriquecimento de contexto da mudança"
      head={head}
      rows={rows}
      emptyView="Nenhum bloco de contexto encontrado."
    />
  );
};
