const DISCHARGE_PRINT_STYLES = `
  @page {
    size: A4;
    margin: 12mm;
  }
  * {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff !important;
    color: #000 !important;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    padding: 8mm;
  }
  table {
    width: 100% !important;
    max-width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed;
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  th, td, p, div, span, h1, h2, h3, h4, strong, b {
    background: #fff !important;
    background-color: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  th, td {
    border: 1px solid #000 !important;
    padding: 6px 8px !important;
    vertical-align: top;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-size: 12px !important;
  }
  img {
    max-width: 100% !important;
    height: auto !important;
    page-break-inside: avoid;
  }
`

const toBlackAndWhiteHtml = (html = '') =>
  String(html)
    .replace(
      /(?<![\w-])color\s*:\s*(?:white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\));?/gi,
      'color: #000000;',
    )
    .replace(/background-color\s*:\s*[^;"']+;?/gi, 'background-color: #ffffff;')
    .replace(/\bbackground\s*:\s*[^;"']+;?/gi, 'background: #ffffff;')

const extractBodyHtml = (html = '') => {
  const match = String(html).match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  return match ? match[1] : html
}

export function printDischargeSummary(html) {
  if (!html?.trim()) {
    return false
  }

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    return false
  }

  const bodyContent = toBlackAndWhiteHtml(extractBodyHtml(html))

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Discharge Summary</title>
        <style>${DISCHARGE_PRINT_STYLES}</style>
      </head>
      <body>${bodyContent}</body>
    </html>
  `)
  printWindow.document.close()

  setTimeout(() => {
    printWindow.focus()
    printWindow.print()
  }, 300)

  return true
}

export { toBlackAndWhiteHtml }
