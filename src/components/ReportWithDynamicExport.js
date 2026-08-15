import React, { useState, useEffect } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import FilteredDataGrid from './FilteredDataGrid'
import {
  generateReportFileName,
  detectReportContext,
  generateEnhancedReportFileName,
} from '@/utils/fileNamingUtils'

/**
 * Example component showing how to use dynamic file naming in reports
 */
const ReportWithDynamicExport = ({
  data = [],
  columns = [],
  customFilters = [],
  filterData,
  getUniqueValues,
  reportName,
  reportType,
  branchName,
  filters = {},
  ...props
}) => {
  const router = useRouter()
  const dropdowns = useSelector((store) => store.dropdowns)
  const [exportOptions, setExportOptions] = useState({
    includeTimestamp: true,
    includeUniqueId: false,
  })

  // Generate dynamic file name based on context
  const generateDynamicFileName = (format = 'csv') => {
    // Detect report context from router path
    const reportContext = detectReportContext(router.pathname, {
      branchId: branchName,
      branchName: branchName,
    })

    // Get branch name from dropdowns if not provided
    const currentBranchName =
      branchName ||
      dropdowns?.branches?.find((branch) => branch.id === branchName)?.name ||
      'All_Branches'

    // Use enhanced file naming with filters
    return generateEnhancedReportFileName({
      reportName: reportName || reportContext.reportName,
      reportType: reportType || reportContext.reportType,
      format,
      date: new Date(),
      branchName: currentBranchName,
      filters: { ...filters },
      includeTimestamp: exportOptions.includeTimestamp,
      includeUniqueId: exportOptions.includeUniqueId,
    })
  }

  // Handle export with dynamic naming
  const handleExport = (format) => {
    const fileName = generateDynamicFileName(format)
    console.log(`Exporting ${format} with filename: ${fileName}`)

    // Here you would implement the actual export logic
    // This is just an example of how to use the dynamic naming
  }

  // Example of how to use the dynamic naming in different scenarios
  const examples = {
    // Basic report export
    basicExport: () => {
      const fileName = generateDynamicFileName('csv')
      console.log('Basic export filename:', fileName)
      // Example: "Revenue_Report_Main_Branch_2025-01-27_1430.csv"
    },

    // Export with date range
    dateRangeExport: () => {
      const fileName = generateEnhancedReportFileName({
        reportName: 'Monthly_Revenue_Report',
        reportType: 'revenue',
        format: 'xlsx',
        date: new Date(),
        branchName: 'Main_Branch',
        filters: {
          dateRange: {
            start: '2025-01-01',
            end: '2025-01-31',
          },
        },
        includeTimestamp: true,
        includeUniqueId: false,
      })
      console.log('Date range export filename:', fileName)
      // Example: "Monthly_Revenue_Report_Main_Branch_2025-01-01_to_2025-01-31_1430.xlsx"
    },

    // Export with unique ID for multiple downloads
    uniqueExport: () => {
      const fileName = generateEnhancedReportFileName({
        reportName: 'Daily_Sales_Report',
        reportType: 'sales',
        format: 'pdf',
        date: new Date(),
        branchName: 'All_Branches',
        filters: {},
        includeTimestamp: true,
        includeUniqueId: true,
      })
      console.log('Unique export filename:', fileName)
      // Example: "Daily_Sales_Report_All_Branches_2025-01-27_1430_A1B2C3.pdf"
    },
  }

  return (
    <div>
      <FilteredDataGrid
        rows={data}
        columns={columns}
        customFilters={customFilters}
        filterData={filterData}
        getUniqueValues={getUniqueValues}
        reportName={reportName}
        reportType={reportType}
        branchName={branchName}
        filters={filters}
        {...props}
      />

      {/* Example usage buttons */}
      <div style={{ marginTop: '20px', padding: '10px' }}>
        <h4>Dynamic File Naming Examples:</h4>
        <button onClick={examples.basicExport}>Test Basic Export Naming</button>
        <button onClick={examples.dateRangeExport}>
          Test Date Range Export Naming
        </button>
        <button onClick={examples.uniqueExport}>
          Test Unique Export Naming
        </button>
      </div>
    </div>
  )
}

export default ReportWithDynamicExport
