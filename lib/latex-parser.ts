export type TemplateType = 'Standard Article' | 'IEEE / Two-Column' | 'IEEE / Single Col Abstract' | 'APA' | 'Modern / Custom';

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
  'IEEE / Single Col Abstract': {
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

export const parseToLatex = (json: any, template: TemplateType, imageList?: {name: string, data?: string, url?: string}[]): string => {
  if (!json || !json.content) return '';

  const { preamble, postamble } = TEMPLATES[template] || TEMPLATES['Standard Article'];
  let latex = preamble;

  const isIEEESingleCol = template === 'IEEE / Single Col Abstract';

  // Find entitySection for frontmatter
  const entityNode = json.content.find((node: any) => node.type === 'entitySection');
  if (entityNode) {
    const { title, authors, college } = entityNode.attrs;
    latex += `\\title{${escapeLatex(title || '')}}\n`;
    latex += `\\author{${escapeLatex(authors || '')}${college ? `\\\\ \\small ${escapeLatex(college)}` : ''}}\n`;
    latex += `\\date{\\today}\n`;
  }

  // If using the IEEE single column abstract, we need to extract the abstract now
  let abstractNode: any = null;
  let abstractText = '';
  
  if (isIEEESingleCol) {
    abstractNode = json.content.find((node: any) => {
      if (node.type === 'paragraph') {
        const rawText = getRawText(node.content);
        return /^abstract:?\s*/i.test(rawText.trim());
      }
      return false;
    });

    if (abstractNode) {
      const rawText = getRawText(abstractNode.content).trim();
      abstractText = escapeLatex(rawText.replace(/^abstract:?\s*/i, '').trim());
    }

    if (abstractText) {
      latex += `\\IEEEtitleabstractindextext{
\\begin{abstract}
${abstractText}
\\end{abstract}
}
`;
    }
  }

  // Emit maketitle after optional IEEEtitleabstractindextext
  if (entityNode) {
    latex += `\\maketitle\n\n`;
    if (isIEEESingleCol) {
      latex += `\\IEEEdisplaynontitleabstractindextext\n\\IEEEpeerreviewmaketitle\n\n`;
    }
  }

  // Parse remaining nodes
  json.content.forEach((node: any) => {
    if (node.type === 'entitySection') return;
    if (isIEEESingleCol && node === abstractNode) return; // Skip abstract as it's already rendered
    latex += parseNode(node, imageList);
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

const parseNode = (node: any, imageList?: {name: string, data?: string, url?: string}[]): string => {
  switch (node.type) {
    case 'paragraph': {
      const rawText = getRawText(node.content);
      
      const blocks = rawText.split(/\n\n+/);
      if (blocks.length > 1) {
        return blocks.map(b => parseNode({ type: 'paragraph', content: [{ type: 'text', text: b }] }, imageList)).join('');
      }

      const isOnlyImage = node.content?.length === 1 && node.content[0].type === 'image';
      if (isOnlyImage) {
        return parseNode(node.content[0], imageList);
      }

      const contentText = rawText.trim();
      if (!contentText && (!node.content || node.content.length === 0)) return '\n\n';

      if (/^abstract:?\s*/i.test(contentText)) {
        const text = contentText.replace(/^abstract:?\s*/i, '').trim();
        return `\\begin{abstract}\n${escapeLatex(text)}\n\\end{abstract}\n\n`;
      }

      const mdMatch = contentText.match(/^(#{1,3})\s*(?:\d+(?:\.\d+)*\.?\s*)?(.+)/);
      if (mdMatch) {
        const level = mdMatch[1].length;
        const title = mdMatch[2].trim();
        const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
        return `\\${cmd}{${escapeLatex(title)}}\n\n`;
      }

      const numMatch = contentText.match(/^(\d+(?:\.\d+)*\.?\s+)(.+)/);
      if (numMatch && contentText.length < 150) {
        const numbering = numMatch[1];
        const title = numMatch[2].trim();
        const dots = (numbering.match(/\./g) || []).length;
        const level = dots <= 1 ? 1 : dots === 2 ? 2 : 3;
        const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
        return `\\${cmd}{${escapeLatex(title)}}\n\n`;
      }

      const clean = contentText.replace(/[:.]$/, '').trim();
      const lower = clean.toLowerCase();
      const keywords = ['introduction', 'conclusion', 'references', 'materials and methods', 'discussion', 'results', 'background', 'acknowledgments'];
      if (keywords.includes(lower) && contentText.length < 50) {
        return `\\section{${clean.charAt(0).toUpperCase() + clean.slice(1)}}\n\n`;
      }

      return `${parseContent(node.content, imageList)}\n\n`;
    }
    case 'heading': {
      const level = node.attrs.level;
      const rawTitle = getRawText(node.content).trim();
      const title = rawTitle.replace(/^(?:\d+(?:\.\d+)*\.?\s*)?/, '').trim();
      const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
      return `\\${cmd}{${escapeLatex(title)}}\n\n`;
    }
    case 'bulletList':
      return `\\begin{itemize}\n${parseContent(node.content, imageList)}\\end{itemize}\n\n`;
    case 'orderedList':
      return `\\begin{enumerate}\n${parseContent(node.content, imageList)}\\end{enumerate}\n\n`;
    case 'listItem':
      return `  \\item ${parseContent(node.content, imageList).trim()}\n`;
    case 'table':
      return parseTable(node, imageList);
    case 'image': {
      const alt = node.attrs.alt || 'image';
      let filename = 'example-image-a';
      
      const src = node.attrs.src;
      if (src && imageList) {
        if (src.startsWith('data:image/')) {
          const match = src.match(/^data:image\/([a-zA-Z0-9]+);base64,/);
          const ext = match ? match[1] : 'png';
          const cleanExt = ext === 'jpeg' ? 'jpg' : ext;
          filename = `image_${imageList.length}.${cleanExt}`;
          const base64Data = src.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
          imageList.push({ name: filename, data: base64Data });
        } else if (src.startsWith('http://') || src.startsWith('https://')) {
          let ext = 'jpg';
          try {
            const urlObj = new URL(src);
            const pathParts = urlObj.pathname.split('.');
            if (pathParts.length > 1) {
              const urlExt = pathParts.pop()?.toLowerCase();
              if (urlExt && ['jpg', 'jpeg', 'png', 'pdf'].includes(urlExt)) {
                ext = urlExt === 'jpeg' ? 'jpg' : urlExt;
              }
            }
          } catch(e) {}
          filename = `image_${imageList.length}.${ext}`;
          imageList.push({ name: filename, url: src });
        }
      }

      return `\n\\begin{figure}[h]\n  \\centering\n  \\includegraphics[width=0.7\\linewidth]{${filename}}\n  \\caption{${escapeLatex(alt)}}\n\\end{figure}\n\n`;
    }
    case 'citation':
      return `\\cite{${node.attrs.id || 'ref'}}`;
    case 'referenceSection':
      return `\\section*{References}\n${parseContent(node.content, imageList)}\n`;
    case 'horizontalRule':
      return `\\hrule\n\n`;
    case 'hardBreak':
      return '\\\\\n';
    case 'blockquote':
      return `\\begin{quote}\n${parseContent(node.content, imageList)}\n\\end{quote}\n\n`;
    case 'codeBlock':
      return `\\begin{verbatim}\n${parseContent(node.content, imageList)}\n\\end{verbatim}\n\n`;
    default:
      return '';
  }
};

const parseContent = (content: any[], imageList?: {name: string, data?: string, url?: string}[]): string => {
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
    return parseNode(item, imageList);
  }).join('');
};

const parseTable = (node: any, imageList?: {name: string, data?: string, url?: string}[]): string => {
  const rows = node.content || [];
  if (rows.length === 0) return '';

  const firstRow = rows[0].content || [];
  const colCount = firstRow.length;
  const colSpec = `${'X'.repeat(colCount)}`;

  let tableLatex = `\\begin{table*}[t]\n\\centering\n\\begin{tabularx}{\\textwidth}{${colSpec}}\n\\toprule\n`;

  rows.forEach((row: any, index: number) => {
    const cells = row.content || [];
    const cellContents = cells.map((cell: any) => parseContent(cell.content, imageList).trim());
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
