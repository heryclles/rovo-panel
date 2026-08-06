/**
 * Normaliza o valor de um campo de texto longo do Jira para um documento ADF.
 * Campos rich text já chegam como ADF; campos de texto simples chegam como string.
 */
export const toAdfDocument = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const paragraphs = value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) {
      return null;
    }

    return {
      type: 'doc',
      version: 1,
      content: paragraphs.map((text) => ({
        type: 'paragraph',
        content: [{ type: 'text', text }],
      })),
    };
  }

  if (typeof value === 'object' && value.type === 'doc' && Array.isArray(value.content)) {
    return value.content.length > 0 ? value : null;
  }

  return null;
};

/** Extrai o valor textual de um campo de lista de seleção única. */
export const toOptionValue = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.trim() || null;
  }

  return typeof value.value === 'string' ? value.value : null;
};

/** Extrai os valores textuais de um campo de lista de seleção múltipla. */
export const toOptionValues = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(toOptionValue).filter(Boolean);
};
