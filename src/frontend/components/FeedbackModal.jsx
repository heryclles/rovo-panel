import React, { useState } from 'react';
import {
  Button,
  Label,
  LoadingButton,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  SectionMessage,
  Stack,
  Text,
  TextArea,
} from '@forge/react';
import { invoke } from '@forge/bridge';

import { StarRating } from './StarRating';

const COMMENT_MAX_LENGTH = 1000;

/**
 * Modal de avaliação da revisão: nota obrigatória, comentário opcional.
 *
 * `initialRating` vem da estrela clicada no rodapé, para a pessoa não ter que
 * escolher a nota de novo aqui dentro.
 */
export const FeedbackModal = ({ current, initialRating, onClose, onSaved }) => {
  const [rating, setRating] = useState(initialRating || current?.nota || 0);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    if (rating < 1) {
      setError('Escolha uma nota de 1 a 5 para enviar a avaliação.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await invoke('saveAgentFeedback', { rating, comment });

      if (response?.ok) {
        onSaved(response.feedback);
      } else {
        setError(response?.error || 'Não foi possível salvar a avaliação.');
      }
    } catch (err) {
      setError('Falha de comunicação ao salvar a avaliação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} width="medium">
      <ModalHeader>
        <ModalTitle>Avaliar a revisão do agente</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <Stack space="space.200">
          {error ? (
            <SectionMessage appearance="error">
              <Text>{error}</Text>
            </SectionMessage>
          ) : null}
          <Stack space="space.100">
            <Label labelFor="feedback-rating">Quanto esta revisão ajudou na análise?</Label>
            <StarRating value={rating} onChange={setRating} />
          </Stack>
          <Stack space="space.100">
            <Label labelFor="feedback-comment">Comentário (opcional)</Label>
            <TextArea
              id="feedback-comment"
              name="feedback-comment"
              value={comment}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder="O que funcionou bem ou o que faltou na análise do agente?"
              onChange={(e) => setComment(String(e.target?.value ?? ''))}
            />
          </Stack>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button appearance="subtle" onClick={onClose} isDisabled={isSaving}>
          Cancelar
        </Button>
        <LoadingButton appearance="primary" onClick={save} isLoading={isSaving}>
          Enviar avaliação
        </LoadingButton>
      </ModalFooter>
    </Modal>
  );
};
