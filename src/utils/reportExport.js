import dayjs from 'dayjs'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Utility functions for report export with dynamic file naming
 */

/**
 * Sanitizes a string to be safe for use in file names
 * @param {string} str - The string to sanitize
 * @returns {string} - Sanitized string safe for file names
 */
export const sanitizeFileName = (str) => {
  if (!str) return ''

  return (
    str
      .toString()
      .trim()
      // Replace spaces with underscores
      .replace(/\s+/g, '_')
      // Replace special characters with underscores
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      // Remove multiple consecutive underscores
      .replace(/_+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_+|_+$/g, '')
  )
}

/**
 * Generates a timestamp string for file naming
 * @param {Date} date - Optional date, defaults to current date
 * @returns {string} - Formatted timestamp (YYYY-MM-DD_HHMM)
 */
export const generateTimestamp = (date = new Date()) => {
  return dayjs(date).format('YYYY-MM-DD_HHmm')
}

/**
 * Generates a unique identifier for file naming
 * @returns {string} - Unique ID string
 */
export const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}

/**
 * Determines the file extension based on export format
 * @param {string} format - Export format (csv, xlsx, pdf, etc.)
 * @returns {string} - File extension with dot
 */
export const getFileExtension = (format) => {
  const formatMap = {
    csv: '.csv',
    xlsx: '.xlsx',
    xls: '.xls',
    pdf: '.pdf',
    json: '.json',
    txt: '.txt',
  }

  return formatMap[format?.toLowerCase()] || '.csv'
}

/**
 * Generates a dynamic file name for report downloads
 * @param {Object} options - Configuration options
 * @returns {string} - Generated file name
 */
export const generateReportFileName = ({
  reportName,
  reportType,
  format = 'csv',
  date = new Date(),
  branchName = null,
  includeTimestamp = true,
  includeUniqueId = false,
}) => {
  // Start with the report name or type
  let fileName = reportName || reportType || 'Report'

  // Add branch name if provided
  if (branchName) {
    fileName += `_${sanitizeFileName(branchName)}`
  }

  // Add date
  const dateStr = dayjs(date).format('YYYY-MM-DD')
  fileName += `_${dateStr}`

  // Add timestamp if requested
  if (includeTimestamp) {
    const timeStr = dayjs(date).format('HHmm')
    fileName += `_${timeStr}`
  }

  // Add unique ID if requested (for multiple downloads on same day)
  if (includeUniqueId) {
    fileName += `_${generateUniqueId()}`
  }

  // Sanitize the entire filename
  fileName = sanitizeFileName(fileName)

  // Add file extension
  const extension = getFileExtension(format)
  fileName += extension

  return fileName
}

/**
 * Get raw cell value for export (no CSV escaping)
 * @param {Object} row - Data row
 * @param {Object} col - Column definition
 * @returns {string} - Extracted value
 */
const getRawCellValue = (row, col) => {
  if (col.valueGetter && typeof col.valueGetter === 'function') {
    try {
      const result = col.valueGetter({ row, value: row[col.field] })
      if (result !== null && result !== undefined) {
        return String(result)
      }
    } catch (error) {
      console.warn('Error in valueGetter for column', col.field, error)
    }
  }

  let value = row[col.field]

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (col.field === 'city') {
      value = value.name || value.cityName || ''
    } else if (col.field === 'patientType' || col.field === 'type') {
      value = value.name || value.typeName || ''
    } else if (col.field === 'referralSource') {
      value = value.referralSource || value.name || value.source || ''
    } else {
      value =
        value.name ||
        value.label ||
        value.value ||
        value.text ||
        value.title ||
        ''
    }
  }

  if (Array.isArray(value)) {
    value = value
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          return item.name || item.label || item.value || String(item)
        }
        return String(item)
      })
      .join(', ')
  }

  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value).trim()
}

/**
 * Get value from row for a column, handling nested objects (CSV-safe)
 * @param {Object} row - Data row
 * @param {Object} col - Column definition
 * @returns {string} - Extracted value
 */
const getCellValue = (row, col) => {
  const stringValue = getRawCellValue(row, col)

  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

const getVisibleColumns = (columns) =>
  columns.filter((col) => col.field && col.headerName)

/**
 * Converts data to CSV format
 * @param {Array} data - Data to convert
 * @param {Array} columns - Column definitions
 * @returns {string} - CSV content
 */
export const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) return ''

  // Get visible columns
  const visibleColumns = columns.filter((col) => col.field && col.headerName)

  // Create header row
  const headers = visibleColumns.map((col) => col.headerName).join(',')

  // Create data rows
  const rows = data.map((row) => {
    return visibleColumns
      .map((col) => {
        return getCellValue(row, col)
      })
      .join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Downloads a file with the given content and filename
 * @param {string} content - File content
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (content, fileName, mimeType = 'text/csv') => {
  try {
    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF'
    const contentWithBOM = mimeType.includes('csv') ? BOM + content : content

    // Create blob
    const blob = new Blob([contentWithBOM], { type: mimeType })

    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'

    // Add to DOM, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up
    window.URL.revokeObjectURL(url)

    console.log(`File downloaded: ${fileName}`)
  } catch (error) {
    console.error('Download failed:', error)
    // Fallback: open in new window
    const url = window.URL.createObjectURL(
      new Blob([content], { type: mimeType }),
    )
    window.open(url, '_blank')
  }
}

/**
 * Exports data as CSV with dynamic naming
 * @param {Array} data - Data to export
 * @param {Array} columns - Column definitions
 * @param {Object} options - Export options
 */
export const exportAsCSV = (data, columns, options = {}) => {
  const fileName = generateReportFileName({
    reportName: options.reportName || 'Report',
    reportType: options.reportType || 'data',
    format: 'csv',
    date: new Date(),
    branchName: options.branchName,
    includeTimestamp: true,
    includeUniqueId: false,
  })

  const csvContent = convertToCSV(data, columns)
  downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;')
}

/**
 * Exports data as Excel (.xlsx)
 * @param {Array} data - Data to export
 * @param {Array} columns - Column definitions
 * @param {Object} options - Export options
 */
export const exportAsExcel = (data, columns, options = {}) => {
  const fileName = generateReportFileName({
    reportName: options.reportName || 'Report',
    reportType: options.reportType || 'data',
    format: 'xlsx',
    date: new Date(),
    branchName: options.branchName,
    includeTimestamp: true,
    includeUniqueId: false,
  })

  const visibleColumns = getVisibleColumns(columns)
  const exportRows = data.map((row) => {
    const record = {}
    visibleColumns.forEach((col) => {
      record[col.headerName] = getRawCellValue(row, col)
    })
    return record
  })

  const worksheet = XLSX.utils.json_to_sheet(exportRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
  XLSX.writeFile(workbook, fileName)
}

/**
 * Exports data as PDF
 * @param {Array} data - Data to export
 * @param {Array} columns - Column definitions
 * @param {Object} options - Export options
 */
export const exportAsPDF = (data, columns, options = {}) => {
  const fileName = generateReportFileName({
    reportName: options.reportName || 'Report',
    reportType: options.reportType || 'data',
    format: 'pdf',
    date: new Date(),
    branchName: options.branchName,
    includeTimestamp: true,
    includeUniqueId: false,
  })

  const visibleColumns = getVisibleColumns(columns)
  const useLandscape = visibleColumns.length > 5
  const doc = new jsPDF({
    orientation: useLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const title = options.reportName || 'Report'
  doc.setFontSize(14)
  doc.text(title, 14, 12)
  doc.setFontSize(9)
  doc.text(`Generated: ${dayjs().format('DD MMM YYYY, hh:mm A')}`, 14, 18)

  autoTable(doc, {
    startY: 24,
    head: [visibleColumns.map((col) => col.headerName)],
    body: data.map((row) =>
      visibleColumns.map((col) => getRawCellValue(row, col)),
    ),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 10, right: 10 },
  })

  doc.save(fileName)
}

/**
 * Converts data to text format
 * @param {Array} data - Data to convert
 * @param {Array} columns - Column definitions
 * @returns {string} - Text content
 */
export const convertToText = (data, columns) => {
  if (!data || data.length === 0) return ''

  const visibleColumns = getVisibleColumns(columns)
  const headers = visibleColumns.map((col) => col.headerName).join('\t')
  const rows = data.map((row) =>
    visibleColumns.map((col) => getRawCellValue(row, col)).join('\t'),
  )

  return [headers, ...rows].join('\n')
}

/**
 * Main export function that handles all formats
 * @param {Array} data - Data to export
 * @param {Array} columns - Column definitions
 * @param {string} format - Export format (csv, xlsx, pdf)
 * @param {Object} options - Export options
 */
export const exportReport = (data, columns, format, options = {}) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  switch (format.toLowerCase()) {
    case 'csv':
      exportAsCSV(data, columns, options)
      break
    case 'xlsx':
    case 'excel':
      exportAsExcel(data, columns, options)
      break
    case 'pdf':
      exportAsPDF(data, columns, options)
      break
    default:
      exportAsCSV(data, columns, options)
  }
}

export default {
  sanitizeFileName,
  generateTimestamp,
  generateUniqueId,
  getFileExtension,
  generateReportFileName,
  convertToCSV,
  downloadFile,
  exportAsCSV,
  exportAsExcel,
  exportAsPDF,
  exportReport,
}
