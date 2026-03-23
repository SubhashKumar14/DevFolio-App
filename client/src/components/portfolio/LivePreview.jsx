import { useMemo } from 'react';

export default function LivePreview({ html, css, js }) {
  // Build the full HTML document as a string for srcdoc
  const srcdoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css || ''}</style>
</head>
<body>
  ${html || '<p style="color:#999;font-family:sans-serif;text-align:center;margin-top:40px;">Write some HTML to see it here...</p>'}
  <script>${js || ''}<\/script>
</body>
</html>`;
  }, [html, css, js]);

  return (
    <div className="flex-1 bg-white rounded-lg overflow-hidden border border-border">
      <iframe
        srcDoc={srcdoc}
        title="Portfolio Preview"
        sandbox="allow-scripts"
        className="w-full h-full border-0 min-h-[400px]"
      />
    </div>
  );
}
