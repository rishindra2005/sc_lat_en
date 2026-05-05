import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

export async function POST(req: NextRequest) {
  try {
    const { latex, images } = await req.json();
    if (!latex) {
      return NextResponse.json({ error: 'No LaTeX content provided' }, { status: 400 });
    }

    const id = uuidv4();
    const tempDir = path.join(os.tmpdir(), `latex-${id}`);
    fs.mkdirSync(tempDir);

    const texFile = path.join(tempDir, 'document.tex');
    fs.writeFileSync(texFile, latex);

    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.name) {
          const imgPath = path.join(tempDir, img.name);
          if (img.data) {
            fs.writeFileSync(imgPath, img.data, 'base64');
          } else if (img.url) {
            try {
              const imgRes = await fetch(img.url);
              if (imgRes.ok) {
                const arrayBuffer = await imgRes.arrayBuffer();
                fs.writeFileSync(imgPath, Buffer.from(arrayBuffer));
              }
            } catch (err) {
              console.error(`Failed to fetch image ${img.url}`, err);
            }
          }
        }
      }
    }

    // Run pdflatex twice for references if needed, but once for now
    return new Promise<NextResponse>((resolve) => {
      exec(`pdflatex -interaction=nonstopmode document.tex`, { cwd: tempDir }, (error, stdout, stderr) => {
        const pdfFile = path.join(tempDir, 'document.pdf');
        
        if (fs.existsSync(pdfFile)) {
          const pdfBuffer = fs.readFileSync(pdfFile);
          
          // Cleanup
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (e) {
            console.error('Cleanup error', e);
          }

          resolve(new NextResponse(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline; filename="document.pdf"',
            },
          }));
        } else {
          console.error('PDF not generated', stdout, stderr);
          resolve(NextResponse.json({ error: 'Failed to generate PDF', log: stdout }, { status: 500 }));
        }
      });
    });
  } catch (error: any) {
    console.error('Compilation error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
