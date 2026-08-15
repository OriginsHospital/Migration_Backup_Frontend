import React, { useState } from 'react'
import { Button, Box, Typography, Paper } from '@mui/material'
import { exportReport, generateReportFileName } from '@/utils/reportExport'

/**
 * Test component to verify export functionality
 * This component can be used to test the export features
 */
const ExportTestComponent = () => {
  const [testData, setTestData] = useState([
    {
      id: 1,
      name: 'Test Item 1',
      amount: 100,
      date: '2025-01-27',
      category: 'Office Supplies',
    },
    {
      id: 2,
      name: 'Test Item 2',
      amount: 250,
      date: '2025-01-27',
      category: 'Equipment',
    },
    {
      id: 3,
      name: 'Test Item 3',
      amount: 75,
      date: '2025-01-27',
      category: 'Utilities',
    },
  ])

  const testColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'amount', headerName: 'Amount', width: 100 },
    { field: 'date', headerName: 'Date', width: 120 },
    { field: 'category', headerName: 'Category', width: 150 },
  ]

  const handleTestExport = (format) => {
    const options = {
      reportName: 'Test_Report',
      reportType: 'test',
      branchName: 'Test_Branch',
      filters: {},
    }

    try {
      exportReport(testData, testColumns, format, options)
      console.log(`Test export completed: ${format}`)
    } catch (error) {
      console.error('Test export failed:', error)
      alert('Export test failed. Check console for details.')
    }
  }

  const testFileNameGeneration = () => {
    const testCases = [
      {
        reportName: 'Expense_Report',
        reportType: 'expenses',
        branchName: 'Main_Branch',
        format: 'csv',
      },
      {
        reportName: 'Orders_Report',
        reportType: 'orders',
        branchName: 'Warehouse_Branch',
        format: 'xlsx',
      },
      {
        reportName: 'Revenue_Report',
        reportType: 'revenue',
        branchName: 'All_Branches',
        format: 'pdf',
      },
    ]

    console.log('=== File Name Generation Test ===')
    testCases.forEach((testCase, index) => {
      const fileName = generateReportFileName({
        ...testCase,
        date: new Date(),
        includeTimestamp: true,
        includeUniqueId: false,
      })
      console.log(`Test ${index + 1}: ${fileName}`)
    })
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Export Functionality Test
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Test data: {testData.length} rows
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => handleTestExport('csv')}
          color="primary"
        >
          Test CSV Export
        </Button>
        <Button
          variant="contained"
          onClick={() => handleTestExport('xlsx')}
          color="secondary"
        >
          Test Excel Export
        </Button>
        <Button
          variant="contained"
          onClick={() => handleTestExport('pdf')}
          color="success"
        >
          Test PDF Export
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={testFileNameGeneration}>
          Test File Name Generation
        </Button>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Check the browser console for detailed logs and file name examples.
        </Typography>
      </Box>
    </Paper>
  )
}

export default ExportTestComponent
