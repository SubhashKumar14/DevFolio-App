/**
 * Build a complete HTML document from separate HTML, CSS, and JS strings.
 */
export function escapeScriptContent(script = '') {
  return String(script).replace(/<\/script/gi, '<\\/script');
}

export function buildPortfolioHtml(html = '', css = '', js = '') {
  const safeJs = escapeScriptContent(js);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${safeJs}</script>
</body>
</html>`;
}

/**
 * Validate that portfolio content is not empty.
 */
export function isPortfolioEmpty(html, css, js) {
  return !html?.trim() && !css?.trim() && !js?.trim();
}
