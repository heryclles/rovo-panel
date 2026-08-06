import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  EmptyState,
  SectionMessage,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
} from '@forge/react';
import { invoke } from '@forge/bridge';

import { AttentionPoints } from './components/AttentionPoints';
import { ContextTable } from './components/ContextTable';
import { DimensionsTable } from './components/DimensionsTable';
import { IncompleteReviewWarning } from './components/IncompleteReviewWarning';
import { ReviewVerdict } from './components/ReviewVerdict';
import { RichTextSection } from './components/RichTextSection';
import { getMissingFieldLabels } from './labels';
import { parseContextBlocks, parseDimensions } from './parseReview';

const App = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // O painel lê a issue a cada montagem e não guarda cache, então recarregar a
  // página já busca os dados de novo — como qualquer outro campo da issue.
  useEffect(() => {
    let active = true;

    invoke('getChangeReview')
      .then((response) => {
        if (!active) {
          return;
        }

        if (response?.ok) {
          setData(response);
        } else if (response?.notApplicable) {
          setError('Este painel só se aplica a mudanças da Central de Mudanças e Liberação (GML).');
        } else if (response?.notAllowed) {
          setError('O painel está em piloto controlado e ainda não foi liberado para o seu usuário.');
        } else {
          setError(response?.error || 'Não foi possível carregar a revisão.');
        }
      })
      .catch(() => {
        if (active) {
          setError('Falha de comunicação com o app. Recarregue a página para tentar de novo.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!data && !error) {
    return <Spinner label="Carregando revisão de mudança" />;
  }

  if (error) {
    return (
      <SectionMessage title="Não foi possível exibir a revisão" appearance="error">
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  if (!data.hasReview) {
    return (
      <EmptyState
        header="Revisão de IA ainda não executada"
        description="Nenhum dos campos preenchidos pelo agente Rovo foi encontrado neste item. Assim que a automação de revisão rodar, recarregue a página para ver o resultado, a justificativa, as dimensões avaliadas e os pontos de atenção."
      />
    );
  }

  const { review } = data;
  const missingFields = getMissingFieldLabels(review);
  // Se o texto não seguir o formato esperado, cai no ADF cru em vez de esconder
  // conteúdo que o parser não soube interpretar.
  const dimensions = parseDimensions(review.avaliacaoDimensoes);
  const contextBlocks = parseContextBlocks(review.enriquecimentoContexto);

  return (
    <Stack space="space.200">
      <ReviewVerdict result={review.resultadoRevisao} />
      <IncompleteReviewWarning missingFields={missingFields} />
      <AttentionPoints points={review.pontosAtencao} />
      <Tabs id="change-management-revisor-tabs">
        <TabList>
          <Tab>Justificativa</Tab>
          <Tab>Dimensões</Tab>
          <Tab>Contexto</Tab>
        </TabList>
        <TabPanel>
          <RichTextSection
            document={review.justificativaRevisao}
            emptyLabel="A revisão não registrou justificativa para a decisão."
          />
        </TabPanel>
        <TabPanel>
          {dimensions.length > 0 ? (
            <DimensionsTable dimensions={dimensions} />
          ) : (
            <RichTextSection
              document={review.avaliacaoDimensoes}
              emptyLabel="A avaliação das dimensões ainda não foi preenchida."
            />
          )}
        </TabPanel>
        <TabPanel>
          {contextBlocks.length > 0 ? (
            <ContextTable blocks={contextBlocks} />
          ) : (
            <RichTextSection
              document={review.enriquecimentoContexto}
              emptyLabel="O enriquecimento de contexto ainda não foi preenchido."
            />
          )}
        </TabPanel>
      </Tabs>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
