const isBlankHtml = (html = '') => {
  const text = String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return !text
}

const getMeaningfulHtml = (element) => {
  if (!element) return null
  const html = element.innerHTML?.trim()
  if (!html || isBlankHtml(html)) return null
  return html
}

const isSummaryLabel = (element) => {
  const label = element?.textContent?.replace(/\s+/g, ' ').trim().toUpperCase()
  return label === 'SUMMARY'
}

const resolveOpdSummaryContainer = (doc) => {
  if (!doc?.body) return null

  const candidates = doc.body.querySelectorAll(
    'h1,h2,h3,h4,h5,h6,td,th,div,p,span,strong,b',
  )

  for (const element of candidates) {
    if (!isSummaryLabel(element)) continue

    if (element.nextElementSibling) {
      return element.nextElementSibling
    }

    const parentNext = element.parentElement?.nextElementSibling
    if (parentNext) return parentNext

    const tableCell = element.closest('td,th')
    if (tableCell?.nextElementSibling) {
      return tableCell.nextElementSibling
    }

    const tableRow = element.closest('tr')
    if (tableRow?.nextElementSibling) {
      const nextRow = tableRow.nextElementSibling
      const cells = nextRow.querySelectorAll('td,th')
      if (cells.length > 1) return cells[cells.length - 1]
      return nextRow
    }

    const summaryContainer = element.closest('div,section,article')
    if (summaryContainer?.nextElementSibling) {
      return summaryContainer.nextElementSibling
    }
  }

  return null
}

const serializeHtmlDocument = (doc, originalHtml = '') => {
  const serialized = doc.documentElement.outerHTML
  if (/^\s*<!DOCTYPE/i.test(originalHtml)) {
    return `<!DOCTYPE html>\n${serialized}`
  }
  return serialized
}

const escapeHtml = (text = '') =>
  String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const extractOpdSummary = (html = '') => {
  if (!html?.trim()) return null

  if (typeof DOMParser === 'undefined') return null

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const container = resolveOpdSummaryContainer(doc)
  if (container) {
    const content = container.innerHTML?.trim()
    if (content && !isBlankHtml(content)) return content
  }

  for (const element of doc.body.querySelectorAll(
    'h1,h2,h3,h4,h5,h6,td,th,div,p,span,strong,b',
  )) {
    const label = element.textContent?.replace(/\s+/g, ' ').trim().toUpperCase()
    if (label !== 'SUMMARY') continue

    const nextSiblingContent = getMeaningfulHtml(element.nextElementSibling)
    if (nextSiblingContent) return nextSiblingContent

    const parentNextContent = getMeaningfulHtml(
      element.parentElement?.nextElementSibling,
    )
    if (parentNextContent) return parentNextContent

    const tableCell = element.closest('td,th')
    if (tableCell) {
      const adjacentCellContent = getMeaningfulHtml(
        tableCell.nextElementSibling,
      )
      if (adjacentCellContent) return adjacentCellContent
    }

    const tableRow = element.closest('tr')
    if (tableRow) {
      const nextRow = tableRow.nextElementSibling
      if (nextRow) {
        const cells = nextRow.querySelectorAll('td,th')
        const rowContent =
          cells.length > 1
            ? getMeaningfulHtml(cells[cells.length - 1])
            : getMeaningfulHtml(nextRow)
        if (rowContent) return rowContent
      }
    }

    const summaryContainer = element.closest('div,section,article')
    if (summaryContainer) {
      const containerNextContent = getMeaningfulHtml(
        summaryContainer.nextElementSibling,
      )
      if (containerNextContent) return containerNextContent
    }
  }

  const regexMatch = html.match(
    /SUMMARY[\s\S]*?<\/(?:h[1-6]|div|td|th|p|span)[^>]*>\s*(?:<\/div>)?\s*<(?:div|td|table)[^>]*>([\s\S]*?)<\/(?:div|td|table)>/i,
  )
  if (regexMatch?.[1] && !isBlankHtml(regexMatch[1])) {
    return regexMatch[1].trim()
  }

  return null
}

export const replaceOpdSummaryInTemplate = (html = '', newSummaryHtml = '') => {
  if (!html?.trim()) return html
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const container = resolveOpdSummaryContainer(doc)

  if (container) {
    container.innerHTML = newSummaryHtml
    return serializeHtmlDocument(doc, html)
  }

  const regexMatch = html.match(
    /(SUMMARY[\s\S]*?<\/(?:h[1-6]|div|td|th|p|span)[^>]*>\s*(?:<\/div>)?\s*<(?:div|td|table)[^>]*>)([\s\S]*?)(<\/(?:div|td|table)>)/i,
  )
  if (regexMatch) {
    return html.replace(
      regexMatch[0],
      `${regexMatch[1]}${newSummaryHtml}${regexMatch[3]}`,
    )
  }

  return html
}

export const summaryHtmlToPlainText = (html = '') => {
  if (!html?.trim()) return ''

  if (typeof DOMParser === 'undefined') {
    return String(html)
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\u00a0/g, ' ')
      .trim()
  }

  const doc = new DOMParser().parseFromString(
    `<div id="summary-root">${html}</div>`,
    'text/html',
  )
  const root = doc.getElementById('summary-root')
  if (!root) return ''

  const lines = []
  const walk = (node) => {
    if (!node) return
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\u00a0/g, ' ')
      if (text?.trim()) lines.push(text.trim())
      return
    }
    if (node.nodeName === 'BR') {
      lines.push('')
      return
    }
    if (['DIV', 'P', 'LI', 'TR'].includes(node.nodeName)) {
      const lineParts = []
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.replace(/\u00a0/g, ' ')
          if (text?.trim()) lineParts.push(text.trim())
        } else if (child.nodeName === 'BR') {
          if (lineParts.length) {
            lines.push(lineParts.join(' '))
            lineParts.length = 0
          }
          lines.push('')
        } else {
          const nested = child.textContent?.replace(/\u00a0/g, ' ').trim()
          if (nested) lineParts.push(nested)
        }
      })
      if (lineParts.length) lines.push(lineParts.join(' '))
      return
    }
    node.childNodes.forEach(walk)
  }

  root.childNodes.forEach(walk)
  return lines.join('\n').trim()
}

export const plainTextToSummaryHtml = (text = '') => {
  const lines = String(text).split('\n')
  if (!lines.length) return ''

  return lines
    .map((line) => {
      const trimmed = line.trimEnd()
      if (!trimmed) return '<br>'
      return `<div>${escapeHtml(trimmed)}</div>`
    })
    .join('')
}

export const hasOpdSummaryContent = (html = '') => {
  const summary = extractOpdSummary(html)
  return !!summary && !isBlankHtml(summary)
}
