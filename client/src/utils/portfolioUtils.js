/**
 * Build a complete HTML document from separate HTML, CSS, and JS strings.
 */
export function buildPortfolioHtml(html = '', css = '', js = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>${js}<\/script>
</body>
</html>`;
}

/**
 * Validate that portfolio content is not empty.
 */
export function isPortfolioEmpty(html, css, js) {
  return !html?.trim() && !css?.trim() && !js?.trim();
}
