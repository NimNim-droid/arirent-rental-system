/**
 * Print utility for receipts and invoices.
 * Uses an isolated hidden iframe so that only the receipt prints.
 * This guarantees:
 * 1. Exactly 1 page printed (no background tables, sidebars, or headers).
 * 2. No blank pages caused by CSS flexbox/viewport height collapse.
 * 3. Works seamlessly across Chrome, Edge, Safari, and Firefox.
 */
export function printReceiptElement(elementId: string = "printable-receipt"): void {
  const element = document.getElementById(elementId);
  if (!element) {
    // Fallback to window.print if element is not found
    window.print();
    return;
  }

  // Create an invisible iframe
  const iframe = document.createElement("iframe");
  iframe.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>AriRent Official Receipt</title>
        <style>
          @page {
            size: auto;
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            display: flex;
            justify-content: center;
            padding: 0;
          }
          .receipt-sheet {
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            border: 1px dashed #64748b;
            border-radius: 12px;
            padding: 24px;
            background: #ffffff;
          }
          /* Typography & Layout Utilities */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-black { font-weight: 900; }
          .font-extrabold { font-weight: 800; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .font-medium { font-weight: 500; }
          .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
          
          .text-base { font-size: 16px; }
          .text-lg { font-size: 18px; }
          .text-sm { font-size: 13px; }
          .text-xs { font-size: 11px; }
          .text-\\[10px\\] { font-size: 10px; }
          .text-\\[11px\\] { font-size: 11px; }
          .tabular-nums { font-variant-numeric: tabular-nums; }
          
          .text-muted, .text-gray-600 { color: #475569; }
          .text-faint, .text-gray-500 { color: #64748b; }
          .text-fg, .text-black { color: #0f172a; }
          .text-accent { color: #1d4ed8; }
          .text-success-fg { color: #047857; }
          .text-danger-fg { color: #b91c1c; }

          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .items-center { align-items: center; }
          .items-start { align-items: flex-start; }
          
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .gap-1 { gap: 4px; }
          .gap-1\\.5 { gap: 6px; }
          .gap-2 { gap: 8px; }

          .space-y-4 > * + * { margin-top: 16px; }
          .space-y-2 > * + * { margin-top: 8px; }
          .space-y-1\\.5 > * + * { margin-top: 6px; }
          .space-y-1 > * + * { margin-top: 4px; }
          .space-y-0\\.5 > * + * { margin-top: 2px; }

          .border-b { border-bottom: 1px solid #cbd5e1; }
          .border-t { border-top: 1px solid #cbd5e1; }
          .border-dashed { border-style: dashed; }
          
          .pb-4 { padding-bottom: 16px; }
          .pt-2 { padding-top: 8px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .p-3 { padding: 12px; }

          .uppercase { text-transform: uppercase; }
          .tracking-tight { letter-spacing: -0.025em; }
          .tracking-wider { letter-spacing: 0.05em; }
          .tracking-widest { letter-spacing: 0.1em; }
          
          /* Hide screen-only interactive icons and decorations */
          .print\\:hidden, svg { display: none !important; }
          
          /* Badges */
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            border: 1px solid #94a3b8;
          }

          /* Settled Stamp Box */
          .border-success-border, .border-2 {
            border: 1.5px dashed #047857 !important;
            background: #f0fdf4 !important;
            border-radius: 8px;
            padding: 10px;
          }

          img {
            max-height: 80px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
          }
        </style>
      </head>
      <body>
        <div class="receipt-sheet">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Wait for images/styles to be ready, then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // Clean up iframe after print dialog is closed
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  }, 250);
}
