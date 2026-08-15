import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
} from '@mui/material'
import { getActiveIP, getClosedIP } from '@/constants/apis'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'

function IPModule() {
  const router = useRouter()
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails || []

  const [selectedBranch, setSelectedBranch] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!branches?.length) return
    const queryBranch = router.query.branch
    if (queryBranch) {
      const match = branches.find((b) => String(b.id) === String(queryBranch))
      if (match) {
        setSelectedBranch(match.id)
        return
      }
    }
    if (!selectedBranch) {
      setSelectedBranch(branches[0].id)
    }
  }, [branches, router.query.branch, selectedBranch])

  const { data: activeIPData } = useQuery({
    queryKey: ['activeIP', selectedBranch],
    queryFn: () => getActiveIP(user.accessToken, selectedBranch),
    enabled: Boolean(user.accessToken && selectedBranch),
  })

  const { data: closedIPData } = useQuery({
    queryKey: ['closedIP', selectedBranch],
    queryFn: () => getClosedIP(user.accessToken, selectedBranch),
    enabled: Boolean(user.accessToken && selectedBranch),
  })

  const handleBranchChange = (event) => {
    const branchId = event.target.value
    setSelectedBranch(branchId)
    router.push(
      {
        pathname: '/ipmodule',
        query: { branch: branchId },
      },
      undefined,
      { shallow: true },
    )
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'patientId', headerName: 'Patient ID', width: 130 },
    { field: 'visitId', headerName: 'Visit ID', width: 130 },
    { field: 'roomCode', headerName: 'Room', width: 130 },
    {
      field: 'dateOfAdmission',
      headerName: 'Admission Date',
      width: 180,
    },
    {
      field: 'timeOfAdmission',
      headerName: 'Admission Time',
      width: 180,
    },
    {
      field: 'dateOfDischarge',
      headerName: 'Discharge Date',
      width: 180,
    },
    {
      field: 'packageAmount',
      headerName: 'Package Amount',
      width: 150,
    },
  ]

  return (
    <div style={{ padding: '20px' }}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">IP Module</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Branch</InputLabel>
            <Select
              value={selectedBranch}
              onChange={handleBranchChange}
              label="Branch"
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name || branch.branchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              router.push({
                pathname: '/book-option',
                query: selectedBranch ? { branchId: selectedBranch } : {},
              })
            }
          >
            Book Option
          </Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Active IP" />
          <Tab label="Closed IP" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <FilteredDataGrid
          rows={activeIPData?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          className="h-[calc(100vh-250px)]"
        />
      )}

      {activeTab === 1 && (
        <FilteredDataGrid
          rows={closedIPData?.data || []}
          columns={columns}
          getRowId={(row) => row.id}
          className="h-[calc(100vh-250px)]"
        />
      )}
    </div>
  )
}

export default withPermission(IPModule, true, 'ipmodule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
