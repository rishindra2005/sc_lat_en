import { Node, mergeAttributes } from '@tiptap/core';

export const ReferenceSection = Node.create({
  name: 'referenceSection',
  group: 'block',
  content: 'block+',
  
  addAttributes() {
    return {
      styleId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="reference-section"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'reference-section', class: 'mt-8 pt-4 border-t border-slate-200' }), 0];
  },
});
