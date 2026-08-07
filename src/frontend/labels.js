/**
 * O painel exibe os valores exatamente como o Jira devolve — sem tradução nem
 * reformatação. A única leitura que fazemos do conteúdo é a cor do lozenge do
 * resultado, e qualquer valor não reconhecido cai na cor neutra.
 */
const withoutAccents = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

/**
 * Tom semântico do resultado, usado para o fundo, a borda e a cor do texto do
 * card de destaque. Qualquer valor não reconhecido cai em `neutral`, então o
 * texto exibido nunca depende desse mapeamento.
 */
export const getVerdictTone = (value) => {
  const normalized = withoutAccents(value);

  if (!normalized) {
    return 'neutral';
  }
  if (normalized.includes('REPROV') || normalized.includes('NAO APROV')) {
    return 'danger';
  }
  if (normalized.includes('RESSALV') || normalized.includes('CONDICION')) {
    return 'warning';
  }
  if (normalized.includes('APROV')) {
    return 'success';
  }
  if (normalized.includes('PENDENT') || normalized.includes('ANALISE')) {
    return 'information';
  }

  return 'neutral';
};

/**
 * Paleta dos pontos de atenção (cores do componente Tag — aqui é `grey`, não o
 * `gray` dos design tokens). A cor sai de um hash do próprio texto, então o
 * mesmo ponto recebe sempre a mesma cor, inclusive entre itens diferentes, sem
 * manter uma lista de valores possíveis.
 */
const TAG_COLORS = [
  'blue',
  'green',
  'purple',
  'teal',
  'magenta',
  'orange',
  'yellow',
  'lime',
  'red',
  'grey',
];

/**
 * FNV-1a de 32 bits seguido do finalizador do MurmurHash3. O FNV sozinho tem
 * pouca avalanche nos bits baixos, que são justamente os que o `%` usa — sem o
 * finalizador, textos parecidos ("PLANO_VALIDACAO"/"PLANO_ROLLBACK") caíam na
 * mesma cor com frequência.
 */
const hashText = (text) => {
  let hash = 0x811c9dc5;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b) >>> 0;
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35) >>> 0;
  hash ^= hash >>> 16;

  return hash >>> 0;
};

export const getTagColor = (value) => {
  const text = String(value || '').trim();
  return text ? TAG_COLORS[hashText(text) % TAG_COLORS.length] : 'standard';
};

/**
 * Ordem em que os campos ausentes são listados no aviso de revisão incompleta.
 *
 * "Pontos de Atenção" fica de fora de propósito: lista vazia ali é um estado
 * válido de preenchimento, não falta de dado — independente do resultado da
 * revisão. Quem comunica esse caso é o próprio bloco de pontos de atenção, com
 * "Nenhum ponto de atenção sinalizado pela revisão".
 */
const FIELD_LABELS = [
  ['resultadoRevisao', 'Resultado da Revisão'],
  ['justificativaRevisao', 'Justificativa da Revisão'],
  ['avaliacaoDimensoes', 'Avaliação das Dimensões'],
  ['enriquecimentoContexto', 'Enriquecimento de Contexto'],
];

const isEmptyValue = (value) => (Array.isArray(value) ? value.length === 0 : !value);

/** Nomes dos campos que a revisão de IA ainda não preencheu neste item. */
export const getMissingFieldLabels = (review) =>
  FIELD_LABELS.filter(([key]) => isEmptyValue(review?.[key])).map(([, label]) => label);

export const formatDateTime = (isoDate) => {
  if (!isoDate) {
    return null;
  }

  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
