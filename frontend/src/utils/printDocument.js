const PRINT_TARGETS = [
  '.invoice-print-container',
  '.service-invoice-print-area',
];

function sanitizeFileName(name) {
  if (!name || typeof name !== 'string') return 'Invoice';
  return name.replace(/[/\\:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || 'Invoice';
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getBillToName(element) {
  if (!element) return '';
  const fromData = element.getAttribute('data-bill-to-name')?.trim();
  if (fromData) return fromData;
  const billToEl = element.querySelector('.bill-to-name, .si-customer-name, [data-bill-to-name]');
  const name = billToEl?.getAttribute('data-bill-to-name')?.trim()
    || billToEl?.textContent?.trim();
  if (!name || name.toUpperCase() === 'N/A') return '';
  return name;
}

function collectDocumentStyles() {
  const links = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => `<link rel="stylesheet" href="${link.href}">`)
    .join('\n');

  const inlineStyles = [...document.querySelectorAll('style')]
    .map((style) => style.textContent?.trim())
    .filter(Boolean)
    .map((css) => `<style>${css}</style>`)
    .join('\n');

  return `${links}\n${inlineStyles}`;
}

function waitForResources(doc, callback) {
  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  const images = [...doc.images];
  const total = links.length + images.length;

  if (total === 0) {
    callback();
    return;
  }

  let loaded = 0;
  const done = () => {
    loaded += 1;
    if (loaded >= total) callback();
  };

  links.forEach((link) => {
    if (link.sheet) done();
    else {
      link.onload = done;
      link.onerror = done;
    }
  });

  images.forEach((img) => {
    if (img.complete) done();
    else {
      img.onload = done;
      img.onerror = done;
    }
  });
}

/** Print invoice in an isolated frame so SPA layout does not produce blank PDFs. */
export function printDocument({ fileName } = {}) {
  const element = PRINT_TARGETS.map((selector) => document.querySelector(selector)).find(Boolean);
  const printTitle = sanitizeFileName(fileName || getBillToName(element));

  if (!element) {
    const originalTitle = document.title;
    document.title = printTitle;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };
    window.addEventListener('afterprint', restoreTitle);
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
  });

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const doc = frameWindow.document;
  const styles = collectDocumentStyles();

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(printTitle)}</title>
    ${styles}
    <style>
      @page { size: A4 portrait; margin: 6mm; }
      html, body {
        margin: 0;
        padding: 0;
        background: #fff;
        height: auto;
        min-height: 0;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .invoice-outer-border {
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
      }
    </style>
  </head>
  <body>${element.outerHTML}</body>
</html>`);
  doc.close();

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 500);
  };

  const runPrint = () => {
    const originalTitle = document.title;

    doc.title = printTitle;
    document.title = printTitle;

    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
      if (frameWindow) {
        frameWindow.removeEventListener('afterprint', restoreTitle);
      }
    };

    window.addEventListener('afterprint', restoreTitle);
    frameWindow.addEventListener('afterprint', restoreTitle);

    frameWindow.focus();
    frameWindow.print();
    cleanup();
  };

  waitForResources(doc, () => {
    setTimeout(runPrint, 200);
  });
}
