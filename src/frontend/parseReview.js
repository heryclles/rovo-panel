/**
 * Parsers do conteúdo produzido pelo agente. Os dois campos longos chegam como
 * um único parágrafo ADF, com as linhas separadas por hardBreak:
 *
 *   avaliacao               -> **N. Nome — STATUS:** observação   (11 linhas)
 *   enriquecimento_contexto -> **Bloco:** conteúdo                (4 blocos)
 *
 * Como o Jira converte o texto do agente usando wiki markup (onde negrito é
 * *texto*, com um asterisco só), os `**` do agente deixam asteriscos órfãos no
 * conteúdo — por isso os parsers os descartam em vez de interpretá-los.
 *
 * O rótulo de cada linha vira texto simples, mas o conteúdo continua sendo ADF:
 * essas linhas costumam citar outras issues como `inlineCard`, e é o AdfRenderer
 * que as transforma em smart links carregados pelo Jira. Achatar tudo para
 * string deixaria só a URL crua na tela.
 */

/** Achata um documento ADF em texto puro, preservando as quebras de linha. */
export const flattenAdf = (node) => {
  if (!node || typeof node !== 'object') {
    return '';
  }

  if (node.type === 'text') {
    return typeof node.text === 'string' ? node.text : '';
  }

  if (node.type === 'hardBreak') {
    return '\n';
  }

  if (node.type === 'inlineCard') {
    return node.attrs?.url || '';
  }

  const children = Array.isArray(node.content) ? node.content.map(flattenAdf).join('') : '';

  // Parágrafos e itens de lista são blocos: cada um termina em quebra de linha.
  return ['paragraph', 'listItem', 'heading'].includes(node.type) ? `${children}\n` : children;
};

const BLOCK_TYPES = ['paragraph', 'listItem', 'heading'];

/**
 * Quebra o documento em linhas, mantendo os nós inline intactos. Uma linha
 * termina num hardBreak ou no fim de um nó de bloco.
 */
export const splitAdfLines = (document) => {
  const lines = [];
  let current = [];

  const flush = () => {
    if (current.length > 0) {
      lines.push(current);
      current = [];
    }
  };

  const walk = (node) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.type === 'hardBreak') {
      flush();
      return;
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(walk);

      if (BLOCK_TYPES.includes(node.type)) {
        flush();
      }

      return;
    }

    // Qualquer outro nó é inline (text, inlineCard, mention, emoji, status...).
    current.push(node);
  };

  walk(document);
  flush();

  return lines;
};

const lineToText = (nodes) => nodes.map(flattenAdf).join('');

/** Descarta os primeiros `offset` caracteres da linha, cortando nós se preciso. */
const sliceNodesFrom = (nodes, offset) => {
  const result = [];
  let remaining = offset;

  for (const node of nodes) {
    if (remaining <= 0) {
      result.push(node);
      continue;
    }

    const length = flattenAdf(node).length;

    if (remaining >= length) {
      remaining -= length;
      continue;
    }

    // O corte cai no meio deste nó: só faz sentido fatiar se for texto.
    result.push(node.type === 'text' ? { ...node, text: node.text.slice(remaining) } : node);
    remaining = 0;
  }

  return result;
};

/** Remove os marcadores de wiki markup que sobraram nas bordas do conteúdo. */
const trimMarkers = (nodes) => {
  const result = nodes.map((node) => ({ ...node }));

  const first = result[0];
  if (first?.type === 'text') {
    first.text = first.text.replace(/^[*\s]+/, '');
  }

  const last = result[result.length - 1];
  if (last?.type === 'text') {
    last.text = last.text.replace(/[*\s]+$/, '');
  }

  return result.filter((node) => node.type !== 'text' || node.text.length > 0);
};

const stripMarkers = (value) => value.replace(/^[*\s]+/, '').replace(/[*\s]+$/, '');

/**
 * Empacota os nós de uma célula. `isRich` diz se vale a pena pagar o custo do
 * AdfRenderer: para texto puro sem marcação, um Text simples basta.
 */
const buildCellContent = (nodes) => {
  const clean = trimMarkers(nodes);
  const text = lineToText(clean);

  if (clean.length === 0) {
    return { text: '', document: null, isRich: false };
  }

  const isRich = clean.some((node) => node.type !== 'text' || (node.marks || []).length > 0);

  return {
    text,
    document: isRich ? { type: 'doc', version: 1, content: [{ type: 'paragraph', content: clean }] } : null,
    isRich,
  };
};

const DIMENSION_PATTERN = /^\s*\**\s*(\d{1,2})\s*\.\s*(.+?)\s*[—–-]\s*([A-Z_]{2,})\s*:\**\s*(.*)$/;

/**
 * Extrai as dimensões avaliadas. Devolve lista vazia quando o texto não segue o
 * formato esperado — nesse caso o painel volta a renderizar o ADF cru, em vez de
 * esconder conteúdo que não soube interpretar.
 */
export const parseDimensions = (document) => {
  if (!document) {
    return [];
  }

  return splitAdfLines(document)
    .map((nodes) => {
      const line = lineToText(nodes);
      const match = DIMENSION_PATTERN.exec(line);

      if (!match) {
        return null;
      }

      const [, numero, nome, status, resumo] = match;

      return {
        numero: Number(numero),
        nome: stripMarkers(nome),
        status,
        // O grupo do resumo vai até o fim da linha, então o que sobra antes dele
        // é exatamente o prefixo a descartar dos nós.
        resumo: buildCellContent(sliceNodesFrom(nodes, line.length - resumo.length)),
      };
    })
    .filter(Boolean);
};

// O rótulo vai até o primeiro `:` e não contém `:` nem `*`; o resto é conteúdo.
const BLOCK_PATTERN = /^\s*\**\s*([^:*]+?)\s*:\s*\**\s*(.*)$/;

/**
 * Extrai os blocos do enriquecimento de contexto (Anexos, Atividades RDM,
 * Histórico de falhas, Histórico de sucesso).
 *
 * Diferente das dimensões, o padrão `Rótulo: conteúdo` é genérico o bastante
 * para casar com prosa comum, então só devolvemos uma tabela quando **todas** as
 * linhas casam e há pelo menos duas. Qualquer coisa fora disso vira lista vazia
 * e o painel volta a renderizar o ADF cru.
 */
export const parseContextBlocks = (document) => {
  if (!document) {
    return [];
  }

  const lines = splitAdfLines(document).filter((nodes) => lineToText(nodes).trim().length > 0);

  if (lines.length < 2) {
    return [];
  }

  const blocks = [];

  for (const nodes of lines) {
    const line = lineToText(nodes);
    const match = BLOCK_PATTERN.exec(line);

    if (!match) {
      return [];
    }

    const [, rotulo, conteudo] = match;

    blocks.push({
      rotulo: stripMarkers(rotulo),
      conteudo: buildCellContent(sliceNodesFrom(nodes, line.length - conteudo.length)),
    });
  }

  return blocks;
};
