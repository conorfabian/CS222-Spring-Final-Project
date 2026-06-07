const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TOP_Y = PAGE_HEIGHT - MARGIN;
const BOTTOM_Y = MARGIN;
const FOOTER_Y = 38;

const FONT_MAP = {
  serif: 'F1',
  bold: 'F2',
  mono: 'F3'
};

const TEXT_STYLES = {
  title: { font: 'bold', fontSize: 17, lineHeight: 20, align: 'center' },
  author: { font: 'serif', fontSize: 11, lineHeight: 13, align: 'center' },
  section: { font: 'bold', fontSize: 12, lineHeight: 14, align: 'left' },
  body: { font: 'serif', fontSize: 11, lineHeight: 14, align: 'left' },
  mono: { font: 'mono', fontSize: 10, lineHeight: 13, align: 'left' },
  footer: { font: 'serif', fontSize: 10, lineHeight: 12, align: 'center' }
};

export function renderProposalPdfBytes(latex, fallbackTitle = 'Research Proposal') {
  const document = parseProposalLatex(latex, fallbackTitle);
  const pages = paginateDocument(document);
  return buildPdf(pages);
}

export function estimateProposalPageCount(latex, fallbackTitle = 'Research Proposal') {
  const document = parseProposalLatex(latex, fallbackTitle);
  return paginateDocument(document).length;
}

function parseProposalLatex(source, fallbackTitle) {
  const completeSource = ensureCompleteLatexDocumentForParsing(source, fallbackTitle);
  const title = normalizeInlineLatex(extractCommandArgument(completeSource, 'title') || fallbackTitle) || fallbackTitle;
  const authorRaw = extractCommandArgument(completeSource, 'author');
  const authorLines = normalizeAuthorLines(authorRaw);
  const body = extractDocumentBody(completeSource).replace(/\\maketitle/g, '').trim();
  const sections = extractSections(body);

  return {
    title,
    authorLines: authorLines.length ? authorLines : ['[Student Name]', '[student@university.edu]', '[University / Program]'],
    sections
  };
}

function ensureCompleteLatexDocumentForParsing(source, title) {
  const cleanSource = String(source || '').trim();

  if (/\\documentclass\b/.test(cleanSource) && /\\begin\{document\}/.test(cleanSource)) {
    return cleanSource;
  }

  return String.raw`\documentclass[11pt]{article}
\title{${escapeLatexText(title)}}
\author{}
\begin{document}
\maketitle
${cleanSource}
\end{document}
`;
}

function extractDocumentBody(source) {
  const match = String(source || '').match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
  return match ? match[1] : String(source || '');
}

function extractCommandArgument(source, commandName) {
  const commandIndex = String(source || '').indexOf(`\\${commandName}`);

  if (commandIndex === -1) return '';

  const braceIndex = source.indexOf('{', commandIndex);
  if (braceIndex === -1) return '';

  return readBalancedGroup(source, braceIndex);
}

function readBalancedGroup(source, startIndex) {
  let depth = 0;
  let output = '';

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
      if (depth > 1) output += char;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) return output;
      output += char;
      continue;
    }

    if (depth > 0) output += char;
  }

  return output;
}

function normalizeAuthorLines(authorRaw) {
  return String(authorRaw || '')
    .replace(/\\\\(?:\[[^\]]*\])?/g, '\n')
    .split('\n')
    .map((line) => normalizeInlineLatex(line))
    .filter(Boolean);
}

function extractSections(body) {
  const sectionMatches = [...String(body || '').matchAll(/\\section\{([^}]*)\}/g)];

  if (!sectionMatches.length) {
    return [{ heading: '', blocks: parseBlocks(body) }];
  }

  return sectionMatches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = index + 1 < sectionMatches.length ? sectionMatches[index + 1].index : body.length;

    return {
      heading: normalizeInlineLatex(match[1]),
      blocks: parseBlocks(body.slice(start, end))
    };
  });
}

function parseBlocks(sectionContent) {
  const blocks = [];
  const normalized = preprocessBlockLatex(sectionContent);
  const itemizePattern = /\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g;
  let lastIndex = 0;

  for (const match of normalized.matchAll(itemizePattern)) {
    const before = normalized.slice(lastIndex, match.index);
    blocks.push(...parseParagraphBlocks(before));

    const items = [...match[1].matchAll(/\\item\s+([\s\S]*?)(?=(\\item\b|$))/g)]
      .map((itemMatch) => normalizeParagraphLatex(itemMatch[1]))
      .filter(Boolean);

    if (items.length) {
      blocks.push({ type: 'bullet-list', items });
    }

    lastIndex = match.index + match[0].length;
  }

  blocks.push(...parseParagraphBlocks(normalized.slice(lastIndex)));
  return blocks.filter((block) => (block.type === 'paragraph' ? block.text : block.items?.length));
}

function preprocessBlockLatex(source) {
  return String(source || '')
    .replace(/\r\n/g, '\n')
    .replace(/\\includegraphics(?:\s*\[[^\]]*\])?\s*\{([^{}]+)\}/g, (_, filename) => {
      return `External image asset \\texttt{${escapeLatexText(filename)}} was omitted in the built-in PDF preview.`;
    })
    .replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g, '\n')
    .replace(/\\begin\{center\}|\\end\{center\}/g, '\n')
    .replace(/\\fbox\s*\{/g, '')
    .replace(/\\begin\{minipage\}\{[^}]*\}|\\end\{minipage\}/g, '\n')
    .replace(/\\centering/g, '')
    .replace(/\\footnotesize/g, '')
    .replace(/\\linewidth/g, 'linewidth');
}

function parseParagraphBlocks(source) {
  return String(source || '')
    .split(/\n\s*\n+/)
    .map((paragraph) => normalizeParagraphLatex(paragraph))
    .filter(Boolean)
    .map((text) => ({ type: 'paragraph', text }));
}

function normalizeParagraphLatex(source) {
  return normalizeInlineLatex(String(source || '').replace(/\s*\n\s*/g, ' '));
}

function normalizeInlineLatex(source) {
  let output = String(source || '');
  let previous = '';

  while (output !== previous) {
    previous = output;
    output = output
      .replace(/\\href\{([^{}]*)\}\{([^{}]*)\}/g, (_, href, text) => `${normalizeInlineLatex(text)} (${normalizeInlineLatex(href)})`)
      .replace(/\\(?:textbf|textit|emph|texttt)\{([^{}]*)\}/g, (_, text) => normalizeInlineLatex(text));
  }

  return output
    .replace(/\\\\(?:\[[^\]]*\])?/g, '\n')
    .replace(/\$\\rightarrow\$/g, '->')
    .replace(/\\rightarrow/g, '->')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function paginateDocument(document) {
  const pages = [[]];
  let cursorY = TOP_Y;

  const newPage = () => {
    pages.push([]);
    cursorY = TOP_Y;
  };

  const remainingHeight = () => cursorY - BOTTOM_Y;

  const addCommand = (command) => {
    pages[pages.length - 1].push(command);
  };

  const addSpacing = (amount) => {
    cursorY -= amount;
  };

  const writeWrappedBlock = (lines, styleName, options = {}) => {
    const style = TEXT_STYLES[styleName];
    const spacingBefore = options.spacingBefore || 0;
    const spacingAfter = options.spacingAfter || 0;
    const indent = options.indent || 0;
    const keepTogether = options.keepTogether || false;
    const prepared = lines.filter(Boolean).map((text) => ({
      text,
      style,
      indent,
      align: options.align || style.align
    }));
    const blockHeight = spacingBefore + prepared.length * style.lineHeight + spacingAfter;

    if (keepTogether && blockHeight <= TOP_Y - BOTTOM_Y && remainingHeight() < blockHeight) {
      newPage();
    }

    addSpacing(spacingBefore);

    prepared.forEach((line) => {
      if (remainingHeight() < style.lineHeight) {
        newPage();
      }

      addCommand(drawTextLine(line.text, cursorY, line.style, { align: line.align, indent: line.indent }));
      cursorY -= style.lineHeight;
    });

    addSpacing(spacingAfter);
  };

  const titleLines = wrapText(document.title, CONTENT_WIDTH, TEXT_STYLES.title);
  writeWrappedBlock(titleLines, 'title', { spacingAfter: 8, keepTogether: true });
  writeWrappedBlock(document.authorLines, 'author', { spacingAfter: 16, keepTogether: true });

  document.sections.forEach((section, sectionIndex) => {
    if (section.heading) {
      const headingLines = wrapText(section.heading, CONTENT_WIDTH, TEXT_STYLES.section);
      const nextBlock = section.blocks[0];
      const minHeight = headingLines.length * TEXT_STYLES.section.lineHeight
        + 8
        + estimateBlockHeight(nextBlock);

      if (sectionIndex > 0) {
        addSpacing(4);
      }

      if (minHeight <= TOP_Y - BOTTOM_Y && remainingHeight() < minHeight) {
        newPage();
      }

      writeWrappedBlock(headingLines, 'section', { spacingBefore: 10, spacingAfter: 6, keepTogether: true });
    }

    section.blocks.forEach((block) => {
      if (block.type === 'paragraph') {
        const lines = wrapText(block.text, CONTENT_WIDTH, TEXT_STYLES.body);
        writeWrappedBlock(lines, 'body', { spacingAfter: 6 });
        return;
      }

      if (block.type === 'bullet-list') {
        block.items.forEach((item, itemIndex) => {
          const bulletIndent = 14;
          const lines = wrapText(item, CONTENT_WIDTH - bulletIndent, TEXT_STYLES.body);
          const bulletLines = lines.map((line, lineIndex) => (lineIndex === 0 ? `- ${line}` : line));
          writeWrappedBlock(bulletLines, 'body', {
            indent: bulletIndent,
            spacingAfter: itemIndex === block.items.length - 1 ? 8 : 4
          });
        });
      }
    });
  });

  return pages.filter((page) => page.length);
}

function estimateBlockHeight(block) {
  if (!block) return 0;

  if (block.type === 'paragraph') {
    return wrapText(block.text, CONTENT_WIDTH, TEXT_STYLES.body).length * TEXT_STYLES.body.lineHeight + 6;
  }

  if (block.type === 'bullet-list') {
    return block.items.reduce((total, item) => {
      return total + wrapText(item, CONTENT_WIDTH - 14, TEXT_STYLES.body).length * TEXT_STYLES.body.lineHeight + 4;
    }, 0);
  }

  return 0;
}

function wrapText(text, maxWidth, style) {
  const cleanText = String(text || '').trim();

  if (!cleanText) return [];

  const words = cleanText.split(/\s+/);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;

    if (measureTextWidth(next, style) <= maxWidth) {
      current = next;
      return;
    }

    if (current) {
      lines.push(current);
      current = '';
    }

    if (measureTextWidth(word, style) <= maxWidth) {
      current = word;
      return;
    }

    const segments = splitLongWord(word, maxWidth, style);
    lines.push(...segments.slice(0, -1));
    current = segments.at(-1) || '';
  });

  if (current) lines.push(current);
  return lines;
}

function splitLongWord(word, maxWidth, style) {
  const characters = [...String(word || '')];
  const parts = [];
  let current = '';

  characters.forEach((character) => {
    const next = `${current}${character}`;

    if (!current || measureTextWidth(next, style) <= maxWidth) {
      current = next;
      return;
    }

    parts.push(current);
    current = character;
  });

  if (current) parts.push(current);
  return parts;
}

function measureTextWidth(text, style) {
  const fontSize = style.fontSize;
  let total = 0;

  for (const character of String(text || '')) {
    total += characterWidthFactor(character, style.font) * fontSize;
  }

  return total;
}

function characterWidthFactor(character, font) {
  if (character === ' ') return 0.28;
  if ('il.:,;!|'.includes(character)) return 0.22;
  if ('mwMW@#%&'.includes(character)) return font === 'mono' ? 0.6 : 0.8;
  if ('()[]{}"'.includes(character)) return 0.28;
  if ('-_/\\'.includes(character)) return 0.3;
  if (/[A-Z]/.test(character)) return font === 'bold' ? 0.68 : 0.63;
  if (font === 'mono') return 0.6;
  return font === 'bold' ? 0.58 : 0.52;
}

function drawTextLine(text, y, style, options = {}) {
  const indent = options.indent || 0;
  const align = options.align || style.align;
  const width = measureTextWidth(text, style);
  let x = MARGIN + indent;

  if (align === 'center') {
    x = (PAGE_WIDTH - width) / 2;
  } else if (align === 'right') {
    x = PAGE_WIDTH - MARGIN - width;
  }

  return `BT /${FONT_MAP[style.font]} ${style.fontSize} Tf 1 0 0 1 ${formatNumber(x)} ${formatNumber(y)} Tm (${escapePdfText(text)}) Tj ET`;
}

function buildPdf(pageCommands) {
  const encoder = new TextEncoder();
  const objects = new Map();
  const pageObjectNumbers = [];
  const fontSerifObject = 3;
  const fontBoldObject = 4;
  const fontMonoObject = 5;
  let nextObjectNumber = 6;

  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objects.set(fontSerifObject, '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
  objects.set(fontBoldObject, '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');
  objects.set(fontMonoObject, '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  pageCommands.forEach((commands, index) => {
    const contentObjectNumber = nextObjectNumber++;
    const pageObjectNumber = nextObjectNumber++;
    const footer = drawTextLine(`Page ${index + 1} of ${pageCommands.length}`, FOOTER_Y, TEXT_STYLES.footer);
    const stream = [...commands, footer].join('\n');
    const length = encoder.encode(stream).length;

    objects.set(contentObjectNumber, `<< /Length ${length} >>\nstream\n${stream}\nendstream`);
    objects.set(
      pageObjectNumber,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontSerifObject} 0 R /F2 ${fontBoldObject} 0 R /F3 ${fontMonoObject} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
    pageObjectNumbers.push(pageObjectNumber);
  });

  objects.set(2, `<< /Type /Pages /Count ${pageObjectNumbers.length} /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(' ')}] >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  const maxObjectNumber = nextObjectNumber - 1;

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    offsets[objectNumber] = encoder.encode(pdf).length;
    pdf += `${objectNumber} 0 obj\n${objects.get(objectNumber)}\nendobj\n`;
  }

  const startXref = encoder.encode(pdf).length;
  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    pdf += `${String(offsets[objectNumber]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectNumber + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;
  return encoder.encode(pdf);
}

function escapePdfText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

function escapeLatexText(value) {
  return String(value || '')
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

function formatNumber(value) {
  return Number(value).toFixed(2).replace(/\.00$/, '');
}
