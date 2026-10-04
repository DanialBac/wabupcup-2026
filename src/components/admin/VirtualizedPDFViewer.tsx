import React, { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { usePdfLoader } from '../../hooks/usePdfLoader';

interface VirtualizedPDFViewerProps {
  url: string;
  fileId: string;
}

const PDFPage: React.FC<{ pdf: PDFDocumentProxy; pageNum: number }> = ({ pdf, pageNum }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Render once
        }
      },
      { rootMargin: '100px 0px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isVisible && pdf && canvasRef.current) {
      pdf.getPage(pageNum).then(page => {
        if (!isMounted) return;
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvas,
          canvasContext: context!,
          viewport,
        };
        
        renderTaskRef.current = page.render(renderContext);
        renderTaskRef.current.promise.catch(err => {
          if (err.name !== 'RenderingCancelledException') {
            console.error('Render error:', err);
          }
        });
      });
    }
    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [isVisible, pdf, pageNum]);

  return (
    <div ref={containerRef} className="w-full flex justify-center mb-4 bg-slate-100 min-h-[600px] border shadow-sm relative rounded overflow-hidden">
      {!isVisible && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          Loading Page {pageNum}...
        </div>
      )}
      <canvas ref={canvasRef} className="max-w-full h-auto" />
    </div>
  );
};

type EBProps = { url: string; children: React.ReactNode };
type EBState = { hasError: boolean };

class ErrorBoundary extends React.Component<EBProps, EBState> {
  declare props: EBProps;
  state: EBState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center bg-red-50 text-red-600 rounded">
          <p className="mb-4 font-bold">Gagal memuat atau merender PDF.</p>
          <a href={this.props.url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-red-600 text-white rounded font-medium text-sm">
            Buka PDF di Tab Baru
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}

const VirtualizedPDFViewer: React.FC<VirtualizedPDFViewerProps> = ({ url, fileId }) => {
  const { pdf, loading, error } = usePdfLoader(url, fileId);

  if (loading) return <div className="p-10 text-center animate-pulse">Memuat Dokumen PDF...</div>;
  if (error || !pdf) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded">
        <p className="mb-4 font-bold">PDF tidak dapat dimuat atau telah kedaluwarsa.</p>
        <a href={url} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 text-white rounded font-medium text-sm hover:bg-slate-700">
          Unduh / Buka Langsung
        </a>
      </div>
    );
  }

  const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);

  return (
    <ErrorBoundary url={url}>
      <div className="w-full max-h-[80vh] overflow-y-auto bg-slate-200/50 p-4 rounded-xl">
        {pages.map(num => (
          <PDFPage key={`${fileId}-${num}`} pdf={pdf} pageNum={num} />
        ))}
      </div>
    </ErrorBoundary>
  );
};

export default VirtualizedPDFViewer;
