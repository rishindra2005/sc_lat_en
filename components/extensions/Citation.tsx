import { Node, mergeAttributes } from '@tiptap/core';

export const Citation = Node.create({
  name: 'citation',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      label: { default: 'citation' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="citation"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'citation', class: 'bg-indigo-100 text-indigo-700 px-1 rounded text-sm font-medium' }), 0];
  },
});
