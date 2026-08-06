import React from 'react';
import { DynamicTable, Lozenge, Text } from '@forge/react';

import { CellContent } from './CellContent';

/**
 * Aparência por enum de status, conforme a página "Formato de Saída":
 * dimensões 1-3 e 5-10 usam OK/INCOMPLETO, a 4 usa BAIXO/MEDIO/ALTO e a 11 usa
 * SEM_HISTORICO/HISTORICO_POSITIVO/ALERTA/RISCO_CRITICO. O texto exibido é
 * sempre o enum exato — só a cor é derivada.
 */
const STATUS_APPEARANCE = {
  OK: 'success',
  BAIXO: 'success',
  HISTORICO_POSITIVO: 'success',
  MEDIO: 'moved',
  ALERTA: 'moved',
  INCOMPLETO: 'removed',
  ALTO: 'removed',
  RISCO_CRITICO: 'removed',
  SEM_HISTORICO: 'default',
};

const head = {
  cells: [
    { key: 'numero', content: '#', width: 5 },
    { key: 'nome', content: 'Dimensão', width: 25, isSortable: true },
    { key: 'status', content: 'Status', width: 15, isSortable: true },
    { key: 'resumo', content: 'Resumo', width: 55 },
  ],
};

export const DimensionsTable = ({ dimensions }) => {
  const rows = (dimensions || []).map((dimension) => ({
    key: `dimensao-${dimension.numero}`,
    cells: [
      { key: dimension.numero, content: <Text>{String(dimension.numero)}</Text> },
      { key: dimension.nome, content: <Text weight="medium">{dimension.nome}</Text> },
      {
        key: dimension.status,
        content: (
          <Lozenge appearance={STATUS_APPEARANCE[dimension.status] || 'default'} maxWidth={180}>
            {dimension.status}
          </Lozenge>
        ),
      },
      { key: dimension.resumo.text, content: <CellContent content={dimension.resumo} /> },
    ],
  }));

  return (
    <DynamicTable
      label="Avaliação das dimensões da mudança"
      head={head}
      rows={rows}
      emptyView="Nenhuma dimensão avaliada."
    />
  );
};
