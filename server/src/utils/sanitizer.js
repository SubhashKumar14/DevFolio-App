import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize raw HTML to prevent XSS attacks.
 * Used when saving portfolio code for public preview.
 * @param {string} rawHtml - Unsanitized HTML input
 * @returns {string} Sanitized HTML safe for public display
 */
export function sanitizeHtml(rawHtml) {
  if (!rawHtml) return '';
  return purify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'section',
      'header', 'footer', 'nav', 'main', 'article', 'aside',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'strong', 'em', 'b', 'i', 'u', 'code', 'pre', 'blockquote',
      'form', 'input', 'button', 'textarea', 'select', 'option', 'label',
      'video', 'audio', 'source', 'canvas', 'svg', 'path',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'type', 'name', 'value', 'placeholder',
      'width', 'height', 'cols', 'rows', 'for',
      'viewBox', 'd', 'fill', 'stroke', 'xmlns',
      'controls', 'autoplay', 'loop', 'muted',
    ],
    FORBID_ATTR: [
      'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
      'onblur', 'onsubmit', 'onchange', 'onkeydown', 'onkeyup',
      'onmouseenter', 'onmouseleave', 'ondblclick', 'oncontextmenu',
    ],
  });
}
