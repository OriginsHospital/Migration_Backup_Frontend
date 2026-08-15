import dayjs from 'dayjs'

/**
 * Utility functions for generating dynamic file names for report downloads
 */

/**
 * Sanitizes a string to be safe for use in file names
 * Replaces spaces and special characters with underscores or dashes
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
 * @param {string} options.reportName - Name of the report
 * @param {string} options.reportType - Type of report (revenue, expenses, orders, etc.)
 * @param {string} options.format - Export format (csv, xlsx, pdf)
 * @param {Date} options.date - Date for the report
 * @param {string} options.branchName - Branch name if applicable
 * @param {boolean} options.includeTimestamp - Whether to include timestamp
 * @param {boolean} options.includeUniqueId - Whether to include unique ID
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
 * Detects report context from the current page/component
 * @param {string} pathname - Current page path
 * @param {Object} props - Component props
 * @returns {Object} - Report context information
 */
export const detectReportContext = (pathname, props = {}) => {
  const contextMap = {
    '/reports/revenue': {
      reportName: 'Revenue_Report',
      reportType: 'revenue',
      defaultFormat: 'csv',
    },
    '/reports/expenses': {
      reportName: 'Expenses_Report',
      reportType: 'expenses',
      defaultFormat: 'csv',
    },
    '/reports/orders': {
      reportName: 'Orders_Report',
      reportType: 'orders',
      defaultFormat: 'csv',
    },
    '/reports/stockReport': {
      reportName: 'Stock_Report',
      reportType: 'stock',
      defaultFormat: 'csv',
    },
    '/reports/treatmentCycles': {
      reportName: 'Treatment_Cycles_Report',
      reportType: 'treatment_cycles',
      defaultFormat: 'csv',
    },
    '/reports/stageReports': {
      reportName: 'Stage_Reports',
      reportType: 'stage_reports',
      defaultFormat: 'csv',
    },
    '/reports/prescribedReport': {
      reportName: 'Prescribed_Report',
      reportType: 'prescribed',
      defaultFormat: 'csv',
    },
    '/reports/noShowReport': {
      reportName: 'No_Show_Report',
      reportType: 'no_show',
      defaultFormat: 'csv',
    },
    '/reports/incidents': {
      reportName: 'Incidents_Report',
      reportType: 'incidents',
      defaultFormat: 'csv',
    },
    '/reports/gstGRN': {
      reportName: 'GST_GRN_Report',
      reportType: 'gst_grn',
      defaultFormat: 'csv',
    },
    '/reports/grnvendor': {
      reportName: 'GRN_Vendor_Report',
      reportType: 'grn_vendor',
      defaultFormat: 'csv',
    },
    '/reports/formFReport': {
      reportName: 'Form_F_Report',
      reportType: 'form_f',
      defaultFormat: 'csv',
    },
    '/reports/alerts': {
      reportName: 'Alerts_Report',
      reportType: 'alerts',
      defaultFormat: 'csv',
    },
  }

  // Get context from pathname
  const context = contextMap[pathname] || {
    reportName: 'Report',
    reportType: 'general',
    defaultFormat: 'csv',
  }

  // Add branch information if available
  if (props.branchId && props.branchName) {
    context.branchName = props.branchName
  }

  return context
}

/**
 * Enhanced file naming for specific report types with custom logic
 * @param {Object} options - Configuration options
 * @returns {string} - Generated file name
 */
export const generateEnhancedReportFileName = (options) => {
  const {
    reportName,
    reportType,
    format = 'csv',
    date = new Date(),
    branchName = null,
    filters = {},
    includeTimestamp = true,
    includeUniqueId = false,
  } = options

  let fileName = reportName || reportType || 'Report'

  // Add branch name if provided
  if (branchName) {
    fileName += `_${sanitizeFileName(branchName)}`
  }

  // Add date range if filters contain date range
  if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
    const startDate = dayjs(filters.dateRange.start).format('YYYY-MM-DD')
    const endDate = dayjs(filters.dateRange.end).format('YYYY-MM-DD')
    fileName += `_${startDate}_to_${endDate}`
  } else {
    // Add single date
    const dateStr = dayjs(date).format('YYYY-MM-DD')
    fileName += `_${dateStr}`
  }

  // Add timestamp if requested
  if (includeTimestamp) {
    const timeStr = dayjs(date).format('HHmm')
    fileName += `_${timeStr}`
  }

  // Add unique ID if requested
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
 * Browser-compatible file download with dynamic naming
 * @param {Blob} blob - File blob to download
 * @param {string} fileName - Generated file name
 */
export const downloadFile = (blob, fileName) => {
  // Create download link
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName

  // Trigger download
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export default {
  sanitizeFileName,
  generateTimestamp,
  generateUniqueId,
  getFileExtension,
  generateReportFileName,
  detectReportContext,
  generateEnhancedReportFileName,
  downloadFile,
}
