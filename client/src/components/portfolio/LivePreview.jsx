import { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import { escapeScriptContent } from '@/utils/portfolioUtils';

export default function LivePreview({ html, css, js }) {
  const [logs, setLogs] = useState([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const iframeRef = useRef(null);

  const previewDoc = useMemo(() => {
    // Inject script to mirror iframe console output in editor panel.
    const hijackConsole = `
      (function() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        console.log = function(...args) {
          window.parent.postMessage({ type: 'CONSOLE', method: 'log', args: args.map(String) }, '*');
          originalLog.apply(console, args);
        };
        console.warn = function(...args) {
          window.parent.postMessage({ type: 'CONSOLE', method: 'warn', args: args.map(String) }, '*');
          originalWarn.apply(console, args);
        };
        console.error = function(...args) {
          window.parent.postMessage({ type: 'CONSOLE', method: 'error', args: args.map(String) }, '*');
          originalError.apply(console, args);
        };
        
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          window.parent.postMessage({ type: 'CONSOLE', method: 'error', args: [\`\${msg} at line \${lineNo}\`] }, '*');
          return false;
        };
      })();
    `;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css || ''}</style>
  <script>${escapeScriptContent(hijackConsole)}</script>
</head>
<body>
  ${html || '<p style="color:#999;font-family:sans-serif;text-align:center;margin-top:40px;">Write some HTML to see it here...</p>'}
  <script>${escapeScriptContent(js || '')}</script>
</body>
</html>`;
  }, [html, css, js]);

  useEffect(() => {
    const handleMessage = (e) => {
      const frameWindow = iframeRef.current?.contentWindow;
      if (!frameWindow || e.source !== frameWindow) {
        return;
      }

      if (e.data && e.data.type === 'CONSOLE') {
        setLogs((prev) => [...prev, { method: e.data.method, messages: e.data.args }].slice(-200));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-card rounded-lg overflow-hidden border border-border">
      <div className="flex-1 relative min-h-[400px]">
        <iframe
          ref={iframeRef}
          srcDoc={previewDoc}
          onLoad={() => setLogs([])}
          title="Portfolio Preview"
          sandbox="allow-scripts"
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {/* Console Panel */}
      <div className="border-t border-border bg-card-elevated">
        <div className="flex items-center justify-between bg-card-elevated border-b border-border">
          <button
            type="button"
            aria-expanded={isConsoleOpen}
            aria-controls="portfolio-console-output"
            onClick={() => setIsConsoleOpen((wasOpen) => !wasOpen)}
            className="flex flex-1 items-center gap-2 px-4 py-2 text-left hover:bg-card-elevated/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-cyan"
          >
            <Terminal className="w-4 h-4 text-muted" />
            <span className="text-sm font-medium">Console</span>
            {logs.length > 0 && (
              <span className="text-xs bg-accent-cyan/20 text-accent-cyan px-2 py-0.5 rounded-full font-bold">
                {logs.length}
              </span>
            )}
          </button>
          <div className="flex gap-3 pr-4">
            <button
              type="button"
              className="text-xs text-muted hover:text-foreground underline decoration-muted/50 transition-colors"
              onClick={() => setLogs([])}
            >
              Clear
            </button>
          </div>
        </div>

        {isConsoleOpen && (
          <div id="portfolio-console-output" role="region" aria-label="Console output" className="h-48 overflow-y-auto w-full p-2 bg-card border-t border-border shadow-inner custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-xs text-muted italic px-2">No output</p>
            ) : (
              logs.map((log, i) => (
                <div 
                  key={i} 
                  className={`px-3 py-1 text-xs font-mono border-b border-border/60 last:border-0 ${
                    log.method === 'error' ? 'text-red-400 bg-red-500/10' : 
                    log.method === 'warn' ? 'text-yellow-400 bg-yellow-500/10' : 
                    'text-foreground'
                  }`}
                >
                  <span className="opacity-50 select-none pr-3">›</span>
                  {log.messages.join(' ')}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
