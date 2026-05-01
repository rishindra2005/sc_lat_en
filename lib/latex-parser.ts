export type TemplateType = 'Standard Article' | 'IEEE / Two-Column' | 'APA' | 'Modern / Custom';

export const TEMPLATES: Record<TemplateType, { preamble: string; postamble: string }> = {
  'Standard Article': {
    preamble: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{xcolor}
\\usepackage{tabularx}
\\usepackage{mwe}

\\begin{document}
`,
    postamble: `\n\\end{document}`,
  },
  'IEEE / Two-Column': {
    preamble: `\\documentclass[10pt,journal,compsoc]{IEEEtran}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{cite}
\\usepackage{tabularx}
\\usepackage{mwe}

\\begin{document}
`,
    postamble: `\n\\end{document}`,
  },
  'APA': {
    preamble: `\\documentclass[man, apa7]{apa7}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{hyperref}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{tabularx}
\\usepackage{mwe}

\\begin{document}
`,
    postamble: `\n\\end{document}`,
  },
  'Modern / Custom': {
    preamble: `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{titlesec}
\\usepackage{xcolor}
\\usepackage{booktabs}
\\usepackage{tcolorbox}
\\usepackage{graphicx}
\\usepackage{tabularx}
\\usepackage{mwe}

\\definecolor{primary}{HTML}{4F46E5}
\\titleformat{\\section}{\\color{primary}\\normalfont\\Large\\bfseries}{\\thesection}{1em}{}

\\begin{document}
`,
    postamble: `\n\\end{document}`,
  },
};

export const parseToLatex = (json: any, template: TemplateType): string => {
  if (!json || !json.content) return '';

  const { preamble, postamble } = TEMPLATES[template] || TEMPLATES['Standard Article'];
  let latex = preamble;

  // Find entitySection for frontmatter
  const entityNode = json.content.find((node: any) => node.type === 'entitySection');
  if (entityNode) {
    const { title, authors, college } = entityNode.attrs;
    latex += `\\title{${escapeLatex(title || '')}}\n`;
    latex += `\\author{${escapeLatex(authors || '')}${college ? `\\\\ \\small ${escapeLatex(college)}` : ''}}\n`;
    latex += `\\date{\\today}\n`;
    latex += `\\maketitle\n\n`;
  }

  // Parse remaining nodes
  json.content.forEach((node: any) => {
    if (node.type === 'entitySection') return;
    latex += parseNode(node);
  });

  latex += postamble;
  return latex;
};

const getRawText = (content: any[]): string => {
  if (!content) return '';
  return content.map(item => {
    if (item.type === 'text') return item.text;
    if (item.content) return getRawText(item.content);
    return '';
  }).join('');
};

const parseNode = (node: any): string => {
  switch (node.type) {
    case 'paragraph': {
      const rawText = getRawText(node.content);
      
      // CRITICAL FIX: Split by double newlines because TipTap sometimes crams 
      // multiple logical blocks into a single paragraph text node.
      const blocks = rawText.split(/\n\n+/);
      if (blocks.length > 1) {
        return blocks.map(b => parseNode({ type: 'paragraph', content: [{ type: 'text', text: b }] })).join('');
      }

      // Special case: If paragraph ONLY contains an image (or image + empty text), handle it as a block image
      const isOnlyImage = node.content?.length === 1 && node.content[0].type === 'image';
      if (isOnlyImage) {
        return parseNode(node.content[0]);
      }

      const contentText = rawText.trim();
      if (!contentText && (!node.content || node.content.length === 0)) return '\n\n';

      // 1. Abstract detection
      if (/^abstract:?\s*/i.test(contentText)) {
        const text = contentText.replace(/^abstract:?\s*/i, '').trim();
        return `\\begin{abstract}\n${escapeLatex(text)}\n\\end{abstract}\n\n`;
      }

      // 2. Markdown-style Heading detection (hashes)
      const mdMatch = contentText.match(/^(#{1,3})\s*(?:\d+(?:\.\d+)*\.?\s*)?(.+)/);
      if (mdMatch) {
        const level = mdMatch[1].length;
        const title = mdMatch[2].trim();
        const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
        return `\\${cmd}{${escapeLatex(title)}}\n\n`;
      }

      // 3. Numbered Heading detection (no hashes)
      const numMatch = contentText.match(/^(\d+(?:\.\d+)*\.?\s+)(.+)/);
      if (numMatch && contentText.length < 150) {
        const numbering = numMatch[1];
        const title = numMatch[2].trim();
        const dots = (numbering.match(/\./g) || []).length;
        const level = dots <= 1 ? 1 : dots === 2 ? 2 : 3;
        const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
        return `\\${cmd}{${escapeLatex(title)}}\n\n`;
      }

      // 4. Semantic Section Keywords
      const clean = contentText.replace(/[:.]$/, '').trim();
      const lower = clean.toLowerCase();
      const keywords = ['introduction', 'conclusion', 'references', 'materials and methods', 'discussion', 'results', 'background', 'acknowledgments'];
      if (keywords.includes(lower) && contentText.length < 50) {
        return `\\section{${clean.charAt(0).toUpperCase() + clean.slice(1)}}\n\n`;
      }

      return `${parseContent(node.content)}\n\n`;
    }
    case 'heading': {
      const level = node.attrs.level;
      const rawTitle = getRawText(node.content).trim();
      const title = rawTitle.replace(/^(?:\d+(?:\.\d+)*\.?\s*)?/, '').trim();
      const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
      return `\\${cmd}{${escapeLatex(title)}}\n\n`;
    }
    case 'bulletList':
      return `\\begin{itemize}\n${parseContent(node.content)}\\end{itemize}\n\n`;
    case 'orderedList':
      return `\\begin{enumerate}\n${parseContent(node.content)}\\end{enumerate}\n\n`;
    case 'listItem':
      return `  \\item ${parseContent(node.content).trim()}\n`;
    case 'table':
      return parseTable(node);
    case 'image':
      const alt = node.attrs.alt || 'image';
      // In professional LaTeX, we use example-image-a for placeholder if src is missing or external
      return `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\linewidth]{example-image-a}\n  \\caption{${escapeLatex(alt)}}\n\\end{figure}\n\n`;
    case 'citation':
      return `\\cite{${node.attrs.id || 'ref'}}`;
    case 'referenceSection':
      return `\\section*{References}\n${parseContent(node.content)}\n`;
    case 'horizontalRule':
      return `\\hrule\n\n`;
    case 'hardBreak':
      return '\\\\\n';
    case 'blockquote':
      return `\\begin{quote}\n${parseContent(node.content)}\n\\end{quote}\n\n`;
    case 'codeBlock':
      return `\\begin{verbatim}\n${parseContent(node.content)}\n\\end{verbatim}\n\n`;
    default:
      return '';
  }
};

const parseContent = (content: any[]): string => {
  if (!content) return '';
  return content.map(item => {
    if (item.type === 'text') {
      let text = escapeLatex(item.text);
      if (item.marks) {
        item.marks.forEach((mark: any) => {
          if (mark.type === 'bold') text = `\\textbf{${text}}`;
          if (mark.type === 'italic') text = `\\textit{${text}}`;
          if (mark.type === 'underline') text = `\\underline{${text}}`;
          if (mark.type === 'link') text = `\\href{${mark.attrs.href}}{${text}}`;
          if (mark.type === 'code') text = `\\texttt{${text}}`;
        });
      }
      return text;
    }
    // RECURSIVE FIX: Ensure images or other nodes nested inside paragraph content are parsed
    return parseNode(item);
  }).join('');
};

const parseTable = (node: any): string => {
  const rows = node.content || [];
  if (rows.length === 0) return '';

  const firstRow = rows[0].content || [];
  const colCount = firstRow.length;
  const colSpec = `${'X'.repeat(colCount)}`;

  let tableLatex = `\\begin{table*}[t]\n\\centering\n\\begin{tabularx}{\\textwidth}{${colSpec}}\n\\toprule\n`;

  rows.forEach((row: any, index: number) => {
    const cells = row.content || [];
    const cellContents = cells.map((cell: any) => parseContent(cell.content).trim());
    tableLatex += `  ${cellContents.join(' & ')} \\\\ \n`;
    
    if (index === 0) {
      tableLatex += `\\midrule\n`;
    }
  });

  tableLatex += `\\bottomrule\n\\end{tabularx}\n\\end{table*}\n\n`;
  return tableLatex;
};

const escapeLatex = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash ')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/\^/g, '\\^{}')
    .replace(/~/g, '\\~{}');
};
