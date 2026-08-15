import {
  generateReportFileName,
  detectReportContext,
  generateEnhancedReportFileName,
  sanitizeFileName,
  generateTimestamp,
  getFileExtension,
} from './fileNamingUtils'

/**
 * Test file for dynamic file naming functionality
 * This demonstrates how the file naming works across different scenarios
 */

// Test data for different report types
const testScenarios = [
  {
    name: 'Revenue Report',
    path: '/reports/revenue',
    reportName: 'Revenue_Report',
    reportType: 'revenue',
    branchName: 'Main_Branch',
    filters: {
      fromDate: '2025-01-01',
      toDate: '2025-01-31',
    },
  },
  {
    name: 'Expenses Report',
    path: '/reports/expenses',
    reportName: 'Expenses_Report',
    reportType: 'expenses',
    branchName: 'All_Branches',
    filters: {
      category: 'Office_Supplies',
    },
  },
  {
    name: 'Orders Report',
    path: '/reports/orders',
    reportName: 'Orders_Report',
    reportType: 'orders',
    branchName: 'Warehouse_Branch',
    filters: {
      status: 'completed',
    },
  },
]

// Test different file formats
const formats = ['csv', 'xlsx', 'pdf', 'json', 'txt']

/**
 * Test basic file naming functionality
 */
export const testBasicFileNaming = () => {
  console.log('=== Testing Basic File Naming ===')

  testScenarios.forEach((scenario) => {
    console.log(`\n${scenario.name}:`)

    formats.forEach((format) => {
      const fileName = generateReportFileName({
        reportName: scenario.reportName,
        reportType: scenario.reportType,
        format,
        date: new Date(),
        branchName: scenario.branchName,
        includeTimestamp: true,
        includeUniqueId: false,
      })

      console.log(`  ${format.toUpperCase()}: ${fileName}`)
    })
  })
}

/**
 * Test enhanced file naming with filters
 */
export const testEnhancedFileNaming = () => {
  console.log('\n=== Testing Enhanced File Naming ===')

  testScenarios.forEach((scenario) => {
    console.log(`\n${scenario.name}:`)

    formats.forEach((format) => {
      const fileName = generateEnhancedReportFileName({
        reportName: scenario.reportName,
        reportType: scenario.reportType,
        format,
        date: new Date(),
        branchName: scenario.branchName,
        filters: scenario.filters,
        includeTimestamp: true,
        includeUniqueId: false,
      })

      console.log(`  ${format.toUpperCase()}: ${fileName}`)
    })
  })
}

/**
 * Test context detection
 */
export const testContextDetection = () => {
  console.log('\n=== Testing Context Detection ===')

  const testPaths = [
    '/reports/revenue',
    '/reports/expenses',
    '/reports/orders',
    '/reports/stockReport',
    '/reports/treatmentCycles',
    '/reports/unknown',
  ]

  testPaths.forEach((path) => {
    const context = detectReportContext(path, {})
    console.log(`Path: ${path}`)
    console.log(`  Report Name: ${context.reportName}`)
    console.log(`  Report Type: ${context.reportType}`)
    console.log(`  Default Format: ${context.defaultFormat}`)
    console.log('')
  })
}

/**
 * Test file name sanitization
 */
export const testFileNameSanitization = () => {
  console.log('\n=== Testing File Name Sanitization ===')

  const testNames = [
    'Revenue Report 2025',
    'Expenses & Costs Report',
    'Orders/Inventory Report',
    'Report with "quotes"',
    'Report with spaces and special chars!@#$%',
    'Report_with_underscores',
    'Report-with-dashes',
    'Report.with.dots',
  ]

  testNames.forEach((name) => {
    const sanitized = sanitizeFileName(name)
    console.log(`Original: "${name}"`)
    console.log(`Sanitized: "${sanitized}"`)
    console.log('')
  })
}

/**
 * Test timestamp generation
 */
export const testTimestampGeneration = () => {
  console.log('\n=== Testing Timestamp Generation ===')

  const dates = [
    new Date('2025-01-27T14:30:00'),
    new Date('2025-12-31T23:59:59'),
    new Date('2025-01-01T00:00:00'),
  ]

  dates.forEach((date) => {
    const timestamp = generateTimestamp(date)
    console.log(`Date: ${date.toISOString()}`)
    console.log(`Timestamp: ${timestamp}`)
    console.log('')
  })
}

/**
 * Test file extension detection
 */
export const testFileExtensionDetection = () => {
  console.log('\n=== Testing File Extension Detection ===')

  const testFormats = ['csv', 'xlsx', 'xls', 'pdf', 'json', 'txt', 'unknown']

  testFormats.forEach((format) => {
    const extension = getFileExtension(format)
    console.log(`Format: ${format} -> Extension: ${extension}`)
  })
}

/**
 * Test edge cases and special scenarios
 */
export const testEdgeCases = () => {
  console.log('\n=== Testing Edge Cases ===')

  // Test with empty/null values
  console.log('Empty report name:')
  const emptyName = generateReportFileName({
    reportName: '',
    reportType: 'test',
    format: 'csv',
  })
  console.log(`Result: "${emptyName}"`)

  // Test with very long names
  console.log('\nLong report name:')
  const longName = generateReportFileName({
    reportName: 'Very Long Report Name That Should Be Handled Properly',
    reportType: 'test',
    format: 'csv',
  })
  console.log(`Result: "${longName}"`)

  // Test with special characters
  console.log('\nSpecial characters:')
  const specialChars = generateReportFileName({
    reportName: 'Report with Special Chars!@#$%^&*()',
    reportType: 'test',
    format: 'csv',
  })
  console.log(`Result: "${specialChars}"`)

  // Test with date range filters
  console.log('\nDate range filters:')
  const dateRange = generateEnhancedReportFileName({
    reportName: 'Monthly Report',
    reportType: 'revenue',
    format: 'xlsx',
    filters: {
      dateRange: {
        start: '2025-01-01',
        end: '2025-01-31',
      },
    },
  })
  console.log(`Result: "${dateRange}"`)
}

/**
 * Run all tests
 */
export const runAllTests = () => {
  console.log('🧪 Running Dynamic File Naming Tests\n')

  testBasicFileNaming()
  testEnhancedFileNaming()
  testContextDetection()
  testFileNameSanitization()
  testTimestampGeneration()
  testFileExtensionDetection()
  testEdgeCases()

  console.log('\n✅ All tests completed!')
}

// Example usage in a React component
export const useFileNamingInComponent = () => {
  const generateExportFileName = (format, additionalFilters = {}) => {
    return generateEnhancedReportFileName({
      reportName: 'Custom_Report',
      reportType: 'custom',
      format,
      date: new Date(),
      branchName: 'Current_Branch',
      filters: {
        ...additionalFilters,
      },
      includeTimestamp: true,
      includeUniqueId: false,
    })
  }

  return { generateExportFileName }
}

export default {
  testBasicFileNaming,
  testEnhancedFileNaming,
  testContextDetection,
  testFileNameSanitization,
  testTimestampGeneration,
  testFileExtensionDetection,
  testEdgeCases,
  runAllTests,
  useFileNamingInComponent,
}
