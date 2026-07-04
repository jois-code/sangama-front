import React, { useMemo } from 'react';
import { Download, ArrowLeft, ChevronLeft, ChevronRight, List } from 'lucide-react';

interface InlinePdfViewerProps {
  url: string;
  title: string;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
  nextTitle?: string;
  prevTitle?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const InlinePdfViewer: React.FC<InlinePdfViewerProps> = ({ url, title, onClose, onNext, onPrev, hasNext, hasPrev, nextTitle, prevTitle, isSidebarOpen, onToggleSidebar }) => {
  
  // Format the URL to ensure it renders inline instead of downloading
  const renderUrl = useMemo(() => {
    try {
      // Handle Google Drive links
      if (url.includes('drive.google.com')) {
        // If it's a /view or /edit link, change to /preview
        if (url.includes('/view') || url.includes('/edit')) {
          return url.replace(/\/(?:view|edit).*/, '/preview');
        }
        // If it's a direct download link (uc?id=...), convert to /preview
        const urlObj = new URL(url);
        if (urlObj.pathname === '/uc' && urlObj.searchParams.has('id')) {
          return `https://drive.google.com/file/d/${urlObj.searchParams.get('id')}/preview`;
        }
        return url;
      }
      
      // If it's a direct PDF link, wrap it in Google Docs viewer to prevent forced downloads from headers
      if (url.toLowerCase().endsWith('.pdf') && !url.includes('docs.google.com/viewer')) {
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      }
      
      return url;
    } catch (e) {
      return url;
    }
  }, [url]);
  return (
    <div className="flex flex-col h-full w-full bg-background animate-in fade-in duration-300">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b border-white/[0.05] bg-surface/30 gap-4 flex-shrink-0">
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 p-2 px-3 hover:bg-white/[0.05] rounded-xl transition-colors text-white/60 hover:text-white font-medium text-sm border border-white/[0.05]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to List</span>
          </button>
          <div className="h-6 w-px bg-white/10 hidden md:block"></div>
          <h2 className="text-lg font-bold text-white/90 truncate max-w-xs md:max-w-md tracking-tight">{title}</h2>
        </div>
        
        <div className="flex flex-wrap justify-center items-center gap-4 bg-black/40 rounded-xl p-1.5 border border-white/[0.05] shadow-inner">
          {/* Actions */}
          <div className="flex items-center gap-1 px-3">
            <button
              onClick={onPrev}
              disabled={!hasPrev}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-white/50 hover:text-white transition-colors"
              title={prevTitle ? `Previous: ${prevTitle}` : "Previous Document"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent text-white/50 hover:text-white transition-colors"
              title={nextTitle ? `Next: ${nextTitle}` : "Next Document"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <a 
              href={url} 
              download
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-primary/20 text-white/50 hover:text-primary transition-colors"
              title="Download Original"
            >
              <Download className="w-4 h-4" />
            </a>
            {onToggleSidebar && (
              <>
                <div className="w-px h-4 bg-white/10 mx-1"></div>
                <button
                  onClick={onToggleSidebar}
                  className={`p-1.5 rounded-lg transition-colors ${isSidebarOpen ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                  title="Toggle Playlist"
                >
                  <List className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* PDF Document Container */}
      <div className="flex-1 w-full h-full bg-[#121212] relative overflow-hidden flex items-center justify-center">
        <iframe 
          src={renderUrl} 
          title={title}
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};

export default InlinePdfViewer;
