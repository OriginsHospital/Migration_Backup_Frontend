import React from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { getBranchName, getBranchNameWithDebug } from '@/utils/branchMapping'

/**
 * Test component to verify branch data mapping
 * This helps debug branch data issues
 */
const BranchDataTest = ({ data, branches }) => {
  const testBranchMapping = () => {
    console.log('=== Branch Data Test ===')
    console.log('Available branches:', branches)
    console.log('Sample data items:', data?.slice(0, 3))

    data?.slice(0, 3).forEach((item, index) => {
      const branchInfo = getBranchNameWithDebug(item, branches)
      console.log(`Item ${index + 1}:`, {
        originalData: item,
        branchName: branchInfo.branchName,
        debug: branchInfo.debug,
      })
    })
  }

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Branch Data Test
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Data items: {data?.length || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Available branches: {branches?.length || 0}
        </Typography>
      </Box>

      <Button variant="outlined" onClick={testBranchMapping} size="small">
        Test Branch Mapping
      </Button>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Check browser console for detailed branch mapping results.
        </Typography>
      </Box>
    </Paper>
  )
}

export default BranchDataTest
