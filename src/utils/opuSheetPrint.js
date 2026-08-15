const OPU_PRINT_STYLES = `
  @page { size: A4; margin: 15mm; }
  body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    box-sizing: border-box;
  }
  .opu-page {
    width: 100%;
    max-width: 190mm;
    margin: 0 auto;
  }
  .opu-page-inner {
    width: 100%;
    max-width: 190mm;
    margin: 0 auto;
  }
`

const INSTRUCTIONS_HEADING = 'INSTRUCTIONS AFTER THE EGG COLLECTION'

export function extractOpuPages(html) {
  if (!html?.trim()) {
    return { page1: '', page2: '' }
  }

  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const page1El = doc.querySelector('.opu-page-1')
    const page2El = doc.querySelector('.opu-page-2')

    if (page1El && page2El) {
      return {
        page1: page1El.outerHTML,
        page2: page2El.outerHTML,
      }
    }
  }

  const upper = html.toUpperCase()
  const splitIndex = upper.indexOf(INSTRUCTIONS_HEADING)
  if (splitIndex === -1) {
    return { page1: html, page2: '' }
  }

  const tagStart = html.lastIndexOf('<', splitIndex)
  const splitAt = tagStart >= 0 ? tagStart : splitIndex

  return {
    page1: `<div class="opu-page opu-page-1"><div class="opu-page-inner">${html.slice(0, splitAt)}</div></div>`,
    page2: `<div class="opu-page opu-page-2"><div class="opu-page-inner">${html.slice(splitAt)}</div></div>`,
  }
}

export function printOpuSheet(html, page = 'all') {
  const { page1, page2 } = extractOpuPages(html)

  let bodyContent = html
  if (page === 1) {
    bodyContent = page1
  } else if (page === 2) {
    bodyContent = page2
  } else if (page1 && page2) {
    bodyContent = `${page1}${page2}`
  }

  if (!bodyContent?.trim()) {
    return false
  }

  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    return false
  }

  const pageBreakStyle =
    page === 'all'
      ? `
        @media print {
          .opu-page {
            page-break-after: always;
            break-after: page;
          }
          .opu-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `
      : ''

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>OPU Sheet</title>
        <style>
          ${OPU_PRINT_STYLES}
          ${pageBreakStyle}
        </style>
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
