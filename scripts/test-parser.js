const fs = require('fs');
const path = require('path');

// Mock escapeLatex for the test
const escapeLatex = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash ')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/\^/g, '\\^{}')
    .replace(/~/g, '\\~{}');
};

const getRawText = (content) => {
  if (!content) return '';
  return content.map(item => {
    if (item.type === 'text') return item.text;
    if (item.content) return getRawText(item.content);
    return '';
  }).join('');
};

const parseNode = (node) => {
  switch (node.type) {
    case 'paragraph': {
      const rawText = getRawText(node.content);
      
      // FIX: Split content by double newlines to handle "crammed" text nodes
      const blocks = rawText.split(/\n\n+/);
      if (blocks.length > 1) {
        return blocks.map(b => parseNode({ type: 'paragraph', content: [{ type: 'text', text: b }] })).join('');
      }

      const content = rawText.trim();
      if (!content) return '\n\n';

      // Heading detection
      const mdMatch = content.match(/^(#{1,3})\s*(?:\d+(?:\.\d+)*\.?\s*)?(.+)/);
      const numMatch = content.match(/^(\d+(?:\.\d+)*\.?\s+)(.+)/);
      
      if (mdMatch) {
        const level = mdMatch[1].length;
        const title = mdMatch[2].trim();
        const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
        return `\\${cmd}{${escapeLatex(title)}}\n\n`;
      }

      if (numMatch && content.length < 150) {
        const numbering = numMatch[1];
        const title = numMatch[2].trim();
        const dots = (numbering.match(/\./g) || []).length;
        const level = dots <= 1 ? 1 : dots === 2 ? 2 : 3;
        const cmd = level === 1 ? 'section' : level === 2 ? 'subsection' : 'subsubsection';
        return `\\${cmd}{${escapeLatex(title)}}\n\n`;
      }

      return `${escapeLatex(content)}\n\n`;
    }
    default:
      return '';
  }
};

// Test with a sample from 2.json
const sampleParagraph = {
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": "2. Materials and methods\n\n2.1. Data management and analysis pipeline setup\n\nA robust system..."
    }
  ]
};

console.log("--- TEST OUTPUT ---");
console.log(parseNode(sampleParagraph));
console.log("--- END TEST ---");
