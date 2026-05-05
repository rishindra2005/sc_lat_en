'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileText, FileCode, Play, ChevronDown, Loader2 } from 'lucide-react';
import TiptapEditor from '@/components/TiptapEditor';
import { parseToLatex, TemplateType } from '@/lib/latex-parser';
import debounce from 'lodash/debounce';

export default function Home() {
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [latexSource, setLatexSource] = useState<string>('% Start typing or upload a JSON...');
  const [template, setTemplate] = useState<TemplateType>('Standard Article');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [images, setImages] = useState<{name: string, data?: string, url?: string}[]>([]);

  // Debounced LaTeX update and compilation
  const debouncedCompile = useRef(
    debounce(async (latex: string, imagesToCompile?: {name: string, data?: string, url?: string}[]) => {
      if (!latex || latex.length < 50) return;
      
      setIsCompiling(true);
      try {
        const response = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latex, images: imagesToCompile || [] }),
        });

        if (response.ok) {
          const blob = await response.blob();
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (err) {
        console.error('Compilation failed', err);
      } finally {
        setIsCompiling(false);
      }
    }, 1500)
  ).current;

  const handleEditorChange = useCallback((json: any) => {
    setJsonContent(json);
    const imageList: {name: string, data?: string, url?: string}[] = [];
    const latex = parseToLatex(json, template, imageList);
    setImages(imageList);
    setLatexSource(latex);
    debouncedCompile(latex, imageList);
  }, [template, debouncedCompile]);

  useEffect(() => {
    if (jsonContent) {
      const imageList: {name: string, data?: string, url?: string}[] = [];
      const latex = parseToLatex(jsonContent, template, imageList);
      setImages(imageList);
      setLatexSource(latex);
      debouncedCompile(latex, imageList);
    }
  }, [template, jsonContent, debouncedCompile]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let rawText = (e.target?.result as string).trim();
          
          if (rawText.endsWith(',')) {
            rawText = rawText.slice(0, -1);
          }

          if (rawText.startsWith('"content":')) {
            rawText = `{ ${rawText} }`;
          }

          const json = JSON.parse(rawText);
          
          let actualContent = json;
          if (json.content) {
            if (typeof json.content === 'string') {
              try {
                const parsed = JSON.parse(json.content);
                actualContent = parsed;
              } catch (e) {
                actualContent = json.content;
              }
            } else {
              actualContent = json.content;
            }
          }
          
          console.log('Setting Editor Content:', actualContent);
          setJsonContent(actualContent);
        } catch (err) {
          console.error('JSON Parse Error:', err);
          alert('Invalid JSON file format. Check console for details.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <nav className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <FileText className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">TipTap <span className="text-indigo-600">LaTeX</span> App</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-md hover:bg-slate-200 transition-colors border">
              <span className="text-sm font-medium">{template}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border rounded-md shadow-lg hidden group-hover:block z-50 overflow-hidden">
              {['Standard Article', 'IEEE / Two-Column', 'APA', 'Modern / Custom'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t as TemplateType)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors border-b last:border-0"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 cursor-pointer transition-colors shadow-sm">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload JSON</span>
            <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </nav>

      {/* Main Content: 3 Columns */}
      <main className="flex-1 flex overflow-hidden">
        {/* Column 1: TipTap Editor */}
        <section className="flex-1 flex flex-col border-r bg-white min-w-[30%]">
          <div className="h-10 border-b bg-slate-50 px-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-3 h-3" /> TipTap Editor
            </span>
          </div>
          <div className="flex-1 overflow-auto p-6 prose prose-indigo max-w-none">
            <TiptapEditor content={jsonContent} onChange={handleEditorChange} />
          </div>
        </section>

        {/* Column 2: LaTeX Source */}
        <section className="flex-1 flex flex-col border-r bg-slate-900 min-w-[25%]">
          <div className="h-10 border-b border-slate-800 bg-slate-950 px-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileCode className="w-3 h-3 text-indigo-400" /> LaTeX Source
            </span>
            <div className="flex items-center gap-2">
              {isCompiling && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
              <button 
                onClick={() => debouncedCompile(latexSource, images)}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Play className="w-3 h-3" fill="currentColor" />
              </button>
            </div>
          </div>
          <textarea
            value={latexSource}
            onChange={(e) => setLatexSource(e.target.value)}
            className="flex-1 w-full overflow-auto bg-transparent p-4 font-mono text-xs text-indigo-100 selection:bg-indigo-500/30 whitespace-pre-wrap resize-none outline-none"
            spellCheck={false}
          />
        </section>

        {/* Column 3: PDF Preview */}
        <section className="flex-1 flex flex-col bg-slate-200 min-w-[35%]">
          <div className="h-10 border-b border-slate-300 bg-slate-100 px-4 flex items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">PDF Preview</span>
          </div>
          <div className="flex-1 flex items-center justify-center p-4">
             <div className="bg-white w-full h-full shadow-2xl rounded-sm flex items-center justify-center text-slate-400 relative">
               {pdfUrl ? (
                 <iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" />
               ) : (
                 <div className="text-center p-8">
                   <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                   <p className="text-sm">PDF Preview will appear after compilation</p>
                 </div>
               )}
               {isCompiling && (
                 <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <span className="text-xs font-bold text-indigo-600">Compiling LaTeX...</span>
                    </div>
                 </div>
               )}
             </div>
          </div>
        </section>
      </main>
    </div>
  );
}
