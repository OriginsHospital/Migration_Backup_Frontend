import { getStockExpiryReport } from '@/constants/apis'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import { DataGrid } from '@mui/x-data-grid'
import {
  Autocomplete,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import CustomToolbar from '@/components/CustomToolbar'

const EXPIRY_TABS = {
  EXPIRED: 'expired',
  NEAR_EXPIRE: 'nearExpire',
}

const ALL_BRANCHES_VALUE = 'all'
const ALL_BRANCHES_OPTION = {
  id: ALL_BRANCHES_VALUE,
  name: 'All branches',
  branchCode: 'All',
}

const NEAR_EXPIRE_WINDOW_OPTIONS = [
  { value: 30, label: 'Next 30 days' },
  { value: 60, label: 'Next 60 days' },
  { value: 90, label: 'Next 90 days' },
]

function ExpiryStatusBadge({ daysToExpire, variant }) {
  if (variant === 'expired') {
    return (
      <Chip
        label="Expired"
        size="small"
        sx={{
          bgcolor: '#fee2e2',
          color: '#b91c1c',
          fontWeight: 600,
        }}
      />
    )
  }

  const days = parseInt(daysToExpire, 10)
  if (!Number.isFinite(days)) {
    return <Chip label="—" size="small" variant="outlined" />
  }

  let bgcolor = '#fef9c3'
  let color = '#a16207'
  let label = `${days} day${days === 1 ? '' : 's'} left`

  if (days === 0) {
    bgcolor = '#ffedd5'
    color = '#c2410c'
    label = 'Expires today'
  } else if (days <= 7) {
    bgcolor = '#ffedd5'
    color = '#c2410c'
  } else if (days <= 30) {
    bgcolor = '#fef9c3'
    color = '#a16207'
  } else {
    bgcolor = '#ecfccb'
    color = '#4d7c0f'
  }

  return (
    <Chip label={label} size="small" sx={{ bgcolor, color, fontWeight: 600 }} />
  )
}

const Index = () => {
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches = [] } = dropdowns
  const dispatch = useDispatch()

  const [activeTab, setActiveTab] = useState(EXPIRY_TABS.EXPIRED)
  const [branchId, setBranchId] = useState(ALL_BRANCHES_VALUE)
  const [nearExpireDays, setNearExpireDays] = useState(90)

  const branchOptions = useMemo(
    () => [ALL_BRANCHES_OPTION, ...branches],
    [branches],
  )

  const queryBranchId = branchId === ALL_BRANCHES_VALUE ? undefined : branchId

  const { data: reportsData, isLoading: isReportFetchLoading } = useQuery({
    queryKey: [
      'fetchStockExpiryReport',
      activeTab,
      queryBranchId,
      nearExpireDays,
    ],
    enabled: Boolean(user?.accessToken),
    queryFn: async () => {
      const responsejson = await getStockExpiryReport(user?.accessToken, {
        branchId: queryBranchId,
        reportType: activeTab,
        nearExpireDays:
          activeTab === EXPIRY_TABS.NEAR_EXPIRE ? nearExpireDays : undefined,
      })
      if (responsejson.status == 200) {
        return responsejson.data || []
      }
      throw new Error(
        'Error occurred while fetching medicine details for pharmacy',
      )
    },
  })

  useEffect(() => {
    if (isReportFetchLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isReportFetchLoading, dispatch])

  const baseColumns = [
    {
      field: 'itemName',
      headerName: 'Item',
      width: 200,
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'branchName',
      headerName: 'Branch',
      width: 120,
    },
    {
      field: 'batchNo',
      headerName: 'Batch No.',
      width: 110,
    },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 90,
      type: 'number',
    },
    {
      field: 'ratePerTablet',
      headerName: 'Rate Per Tablet',
      width: 120,
      type: 'number',
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      width: 120,
    },
    {
      field: 'totalStockLeft',
      headerName: 'Total Stock Left',
      width: 130,
      type: 'number',
    },
    {
      field: 'daysToExpire',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => (
        <ExpiryStatusBadge
          daysToExpire={params.value}
          variant={activeTab === EXPIRY_TABS.EXPIRED ? 'expired' : 'nearExpire'}
        />
      ),
    },
    {
      field: 'grnNo',
      headerName: 'GRN No.',
      width: 100,
    },
  ]

  const expiredOnlyColumn = {
    field: 'daysSinceExpire',
    headerName: 'Days Since Expire',
    width: 140,
    valueFormatter: (value) =>
      value === 'NA' || value == null ? '—' : `${value} days`,
  }

  const nearExpireOnlyColumn = {
    field: 'daysUntilExpiry',
    headerName: 'Days Left',
    width: 100,
    type: 'number',
    sortable: true,
  }

  const columnHeader =
    activeTab === EXPIRY_TABS.EXPIRED
      ? [...baseColumns, expiredOnlyColumn]
      : [
          ...baseColumns.slice(0, 6),
          nearExpireOnlyColumn,
          ...baseColumns.slice(6),
        ]

  const sortedRows = useMemo(() => {
    const rows = reportsData || []
    if (activeTab === EXPIRY_TABS.NEAR_EXPIRE) {
      return [...rows].sort((a, b) => {
        const da = Number(a.daysUntilExpiry ?? a.daysToExpire ?? 9999)
        const db = Number(b.daysUntilExpiry ?? b.daysToExpire ?? 9999)
        return da - db
      })
    }
    return [...rows].sort((a, b) => {
      const da = Number(a.daysUntilExpiry ?? -999999)
      const db = Number(b.daysUntilExpiry ?? -999999)
      return db - da
    })
  }, [reportsData, activeTab])

  const tabSummary =
    activeTab === EXPIRY_TABS.EXPIRED
      ? `${sortedRows.length} expired batch${sortedRows.length === 1 ? '' : 'es'} with stock`
      : `${sortedRows.length} active medicine batch${sortedRows.length === 1 ? '' : 'es'} expiring within ${nearExpireDays} days`

  return (
    <div className="flex flex-col">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          p: 2,
          pb: 0,
        }}
      >
        <Typography variant="h6" color="secondary" fontWeight={500}>
          Stock Expiry Report
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {activeTab === EXPIRY_TABS.NEAR_EXPIRE && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Window</InputLabel>
              <Select
                label="Window"
                value={nearExpireDays}
                onChange={(e) => setNearExpireDays(Number(e.target.value))}
              >
                {NEAR_EXPIRE_WINDOW_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Autocomplete
            size="small"
            sx={{ minWidth: 180 }}
            options={branchOptions}
            getOptionLabel={(option) =>
              option?.id === ALL_BRANCHES_VALUE
                ? 'All branches'
                : option?.branchCode || option?.name || ''
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={
              branchId === ALL_BRANCHES_VALUE
                ? ALL_BRANCHES_OPTION
                : (branches.find((b) => b.id === branchId) ?? null)
            }
            onChange={(_, value) => {
              if (!value) {
                setBranchId(ALL_BRANCHES_VALUE)
                return
              }
              setBranchId(
                value.id === ALL_BRANCHES_VALUE ? ALL_BRANCHES_VALUE : value.id,
              )
            }}
            renderInput={(params) => <TextField {...params} label="Branch" />}
            disableClearable
          />
        </Box>
      </Box>

      <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          aria-label="stock expiry report tabs"
        >
          <Tab value={EXPIRY_TABS.EXPIRED} label="Expired" />
          <Tab value={EXPIRY_TABS.NEAR_EXPIRE} label="Near to Expire" />
        </Tabs>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 1 }}>
        {tabSummary}
        {activeTab === EXPIRY_TABS.NEAR_EXPIRE &&
          ' — sorted with soonest expiry first'}
      </Typography>

      <div className="p-2">
        <div style={{ width: '100%' }}>
          <DataGrid
            key={`${activeTab}-${branchId}-${nearExpireDays}`}
            rows={sortedRows}
            columns={columnHeader}
            loading={isReportFetchLoading}
            pageSizeOptions={[5, 7, 10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 10 } },
              sorting: {
                sortModel:
                  activeTab === EXPIRY_TABS.NEAR_EXPIRE
                    ? [{ field: 'daysUntilExpiry', sort: 'asc' }]
                    : [{ field: 'daysSinceExpire', sort: 'asc' }],
              },
            }}
            slots={{
              toolbar: CustomToolbar,
            }}
            autoHeight
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-main': { minHeight: '55vh' },
            }}
            getRowId={(row) =>
              `${row.itemName}-${row.batchNo}-${row.grnNo}-${row.expiryDate}`
            }
          />
        </div>
      </div>
    </div>
  )
}

export default withPermission(Index, true, 'grnStockExpiryDate', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
