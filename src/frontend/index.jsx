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
import { FeedbackModal } from './components/FeedbackModal';
import { FeedbackPrompt } from './components/FeedbackPrompt';
import { IncompleteReviewWarning } from './components/IncompleteReviewWarning';
import { ReviewVerdict } from './components/ReviewVerdict';
import { RichTextSection } from './components/RichTextSection';
import { getMissingFieldLabels } from './labels';
import { parseContextBlocks, parseDimensions } from './parseReview';

const App = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  // O feedback vive aqui em cima porque é editado pelo botão do cabeçalho e
  // exibido na aba de avaliação.
  const [feedback, setFeedback] = useState(null);
  const [isRating, setIsRating] = useState(false);
  // Nota escolhida no rodapé, usada para abrir o modal já preenchido.
  const [ratingDraft, setRatingDraft] = useState(0);

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
          setFeedback(response.feedback);
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
        description={
          'O agente Rovo revisa a mudança quando o item entra no status "Validação GMUD". ' +
          'Antes disso, os campos da revisão ficam vazios — é o caso deste item agora. ' +
          'Assim que a automação rodar, recarregue a página para ver o resultado, a justificativa, ' +
          'as dimensões avaliadas e os pontos de atenção.'
        }
      />
    );
  }

  const { review } = data;
  const missingFields = getMissingFieldLabels(review);
  // Se o texto não seguir o formato esperado, cai no ADF cru em vez de esconder
  // conteúdo que o parser não soube interpretar.
  const dimensions = parseDimensions(review.avaliacaoDimensoes);
  const contextBlocks = parseContextBlocks(review.enriquecimentoContexto);

  // As abas são montadas a partir de uma lista para que Tab e TabPanel nunca
  // saiam de ordem quando a aba de avaliação entra ou sai.
  const tabs = [
    {
      key: 'justificativa',
      title: 'Justificativa',
      content: (
        <RichTextSection
          document={review.justificativaRevisao}
          emptyLabel="A revisão não registrou justificativa para a decisão."
        />
      ),
    },
    {
      key: 'dimensoes',
      title: 'Dimensões',
      content:
        dimensions.length > 0 ? (
          <DimensionsTable dimensions={dimensions} />
        ) : (
          <RichTextSection
            document={review.avaliacaoDimensoes}
            emptyLabel="A avaliação das dimensões ainda não foi preenchida."
          />
        ),
    },
    {
      key: 'contexto',
      title: 'Contexto',
      content:
        contextBlocks.length > 0 ? (
          <ContextTable blocks={contextBlocks} />
        ) : (
          <RichTextSection
            document={review.enriquecimentoContexto}
            emptyLabel="O enriquecimento de contexto ainda não foi preenchido."
          />
        ),
    },
  ];

  return (
    <Stack space="space.200">
      <ReviewVerdict result={review.resultadoRevisao} />
      <IncompleteReviewWarning missingFields={missingFields} />
      <AttentionPoints points={review.pontosAtencao} />
      <Tabs id="change-management-revisor-tabs">
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.key}>{tab.title}</Tab>
          ))}
        </TabList>
        {tabs.map((tab) => (
          <TabPanel key={tab.key}>{tab.content}</TabPanel>
        ))}
      </Tabs>
      {data.feedbackEnabled ? (
        <FeedbackPrompt
          feedback={feedback}
          onPick={(star) => {
            setRatingDraft(star);
            setIsRating(true);
          }}
          onEdit={() => {
            setRatingDraft(0);
            setIsRating(true);
          }}
        />
      ) : null}
      {isRating ? (
        <FeedbackModal
          current={feedback}
          initialRating={ratingDraft}
          onClose={() => setIsRating(false)}
          onSaved={(saved) => {
            setFeedback(saved);
            setIsRating(false);
          }}
        />
      ) : null}
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
