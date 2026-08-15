import React, { useState } from 'react'
import { GridToolbarContainer } from '@mui/x-data-grid'
import { Button, Menu, MenuItem, Box } from '@mui/material'
import { Download } from '@mui/icons-material'
import { exportReport } from '@/utils/reportExport'

/**
 * Custom export toolbar for reports with dynamic file naming
 */
const ReportExportToolbar = ({
  data = [],
  columns = [],
  reportName = 'Report',
  reportType = 'data',
  branchName = null,
  filters = {},
}) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleExportClose = () => {
    setAnchorEl(null)
  }

  const handleExportFormat = (format) => {
    try {
      // Prepare export options
      const exportOptions = {
        reportName,
        reportType,
        branchName,
        filters,
      }

      // Export the data
      exportReport(data, columns, format, exportOptions)

      console.log(`Exporting ${format} with ${data.length} rows`)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }

    handleExportClose()
  }

  return (
    <GridToolbarContainer>
      <Button
        startIcon={<Download />}
        onClick={handleExportClick}
        size="small"
        variant="outlined"
        disabled={!data || data.length === 0}
      >
        Export ({data.length} rows)
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

export default ReportExportToolbar
