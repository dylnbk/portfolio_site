/**
 * Shared chat markdown rendering helpers.
 */

export function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, (char) => {
    const specialChars = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return specialChars[char];
  });
}

export function processLinksForNewTab(html = '') {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const links = tempDiv.querySelectorAll('a[href]');
  links.forEach((link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  return tempDiv.innerHTML;
}

export function renderMarkdownToSafeHtml(markdown = '') {
  const source = typeof markdown === 'string' ? markdown : String(markdown ?? '');

  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') {
    return escapeHTML(source).replace(/\n/g, '<br>');
  }

  try {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    const renderedHtml = marked.parse(source);
    const sanitizedHtml = DOMPurify.sanitize(renderedHtml);

    return processLinksForNewTab(sanitizedHtml);
  } catch (error) {
    console.warn('Failed to render markdown, falling back to escaped text.', error);
    return escapeHTML(source).replace(/\n/g, '<br>');
  }
}
