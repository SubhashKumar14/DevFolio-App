import { useEffect, useRef } from 'react';

export default function LivePreview({ html, css, js }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css || ''}</style>
</head>
<body>
  ${html || ''}
  <script>${js || ''}<\/script>
</body>
</html>`;

    doc.open();
    doc.write(content);
    doc.close();
  }, [html, css, js]);

  return (
    <div className="flex-1 bg-white rounded-lg overflow-hidden border border-border">
      <iframe
        ref={iframeRef}
        title="Portfolio Preview"
        sandbox="allow-scripts"
        className="w-full h-full border-0 min-h-[400px]"
      />
    </div>
  );
}
