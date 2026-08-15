import React, { useState, useEffect } from 'react'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { Button, Menu, MenuItem, Box } from '@mui/material'
import { Download } from '@mui/icons-material'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import {
  generateReportFileName,
  detectReportContext,
  generateEnhancedReportFileName,
  downloadFile,
} from '@/utils/fileNamingUtils'

/**
 * Custom export toolbar with dynamic file naming
 */
const DynamicExportToolbar = ({
  reportName,
  reportType,
  branchName,
  filters = {},
  data = [],
  columns = [],
  onExport,
}) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const router = useRouter()
  const dropdowns = useSelector((store) => store.dropdowns)

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
      filters,
      includeTimestamp: true,
      includeUniqueId: false,
    })
  }

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setAnchorEl(null)
  }

  const handleExportFormat = (format) => {
    const fileName = generateDynamicFileName(format)

    // Convert data to the requested format
    let content, mimeType

    switch (format) {
      case 'csv':
        content = convertToCSV(data, columns)
        mimeType = 'text/csv;charset=utf-8;'
        break
      case 'xlsx':
        content = convertToCSV(data, columns) // Simplified - in production use xlsx library
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      case 'pdf':
        content = convertToText(data, columns) // Simplified - in production use jsPDF
        mimeType = 'application/pdf'
        break
      default:
        content = convertToCSV(data, columns)
        mimeType = 'text/csv;charset=utf-8;'
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType })
    downloadFile(blob, fileName)

    // Call custom export handler if provided
    if (onExport) {
      onExport(format, fileName, content)
    }

    handleExportClose()
  }

  // Convert data to CSV format
  const convertToCSV = (data, columns) => {
    if (!data || data.length === 0) return ''

    // Get visible columns
    const visibleColumns = columns.filter((col) => col.field && col.headerName)

    // Create header row
    const headers = visibleColumns.map((col) => col.headerName).join(',')

    // Create data rows
    const rows = data.map((row) => {
      return visibleColumns
        .map((col) => {
          const value = row[col.field]
          // Escape commas and quotes in CSV
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value || ''
        })
        .join(',')
    })

    return [headers, ...rows].join('\n')
  }

  // Convert data to text format
  const convertToText = (data, columns) => {
    if (!data || data.length === 0) return ''

    const visibleColumns = columns.filter((col) => col.field && col.headerName)

    // Create header
    const headers = visibleColumns.map((col) => col.headerName).join('\t')

    // Create data rows
    const rows = data.map((row) => {
      return visibleColumns
        .map((col) => {
          return row[col.field] || ''
        })
        .join('\t')
    })

    return [headers, ...rows].join('\n')
  }

  return (
    <GridToolbarContainer>
      <Button
        startIcon={<Download />}
        onClick={handleExportClick}
        size="small"
        variant="outlined"
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleExportClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => handleExportFormat('csv')}>
          Download as CSV
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat('xlsx')}>
          Download as Excel
        </MenuItem>
        <MenuItem onClick={() => handleExportFormat('pdf')}>
          Download as PDF
        </MenuItem>
      </Menu>
    </GridToolbarContainer>
  )
}

export default DynamicExportToolbar
