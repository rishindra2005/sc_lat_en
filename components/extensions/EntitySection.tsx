import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import React from 'react';

const EntitySectionComponent = ({ node, updateAttributes }: NodeViewProps) => {
  const { title, authors, college, elevation } = node.attrs;

  return (
    <NodeViewWrapper className="my-8 p-8 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm text-center group transition-all hover:border-indigo-200">
      <input
        value={title}
        onChange={(e) => updateAttributes({ title: e.target.value })}
        placeholder="Enter Title"
        className="w-full text-3xl font-extrabold text-slate-900 mb-4 text-center outline-none bg-transparent placeholder:text-slate-300"
      />
      <div className="flex flex-col items-center gap-2">
        <input
          value={authors}
          onChange={(e) => updateAttributes({ authors: e.target.value })}
          placeholder="Authors (e.g. John Doe, Jane Smith)"
          className="w-full text-lg font-semibold text-indigo-600 uppercase tracking-widest text-center outline-none bg-transparent placeholder:text-indigo-200"
        />
        <input
          value={college}
          onChange={(e) => updateAttributes({ college: e.target.value })}
          placeholder="Institution / College"
          className="w-full text-md text-slate-500 italic text-center outline-none bg-transparent placeholder:text-slate-300"
        />
      </div>
      <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <select
          value={elevation}
          onChange={(e) => updateAttributes({ elevation: e.target.value })}
          className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full outline-none"
        >
          <option value="elevation-1">Style 1</option>
          <option value="elevation-2">Style 2</option>
          <option value="elevation-3">Style 3</option>
        </select>
      </div>
    </NodeViewWrapper>
  );
};

export const EntitySection = Node.create({
  name: 'entitySection',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      title: { default: '' },
      authors: { default: '' },
      college: { default: '' },
      elevation: { default: 'elevation-1' },
      textAlign: { default: 'center' },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="entity-section"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'entity-section' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(EntitySectionComponent);
  },
});
