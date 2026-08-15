import Breadcrumb from '@/components/Breadcrumb'
import { getPharmacySalesDetailedReport } from '@/constants/apis'
import { exportReport } from '@/utils/reportExport'
import { Autocomplete, Button, TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { hasPharmacySalesReportAccess } from '@/utils/pharmacySalesReportAccess'

const ALL_BRANCHES_VALUE = 'all'
const ALL_BRANCHES_OPTION = {
  id: ALL_BRANCHES_VALUE,
  branchCode: 'All',
  name: 'All branches',
}

const exportFormatOptions = [
  { id: 'csv', label: 'CSV' },
  { id: 'excel', label: 'Excel' },
  { id: 'pdf', label: 'PDF' },
]

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const columns = [
  {
    field: 'patientName',
    headerName: 'Patient Name',
    minWidth: 220,
    flex: 1.1,
    renderCell: (params) => params?.row?.patientName || '-',
  },
  {
    field: 'medicineName',
    headerName: 'Medicine Name',
    minWidth: 220,
    flex: 1.2,
  },
  {
    field: 'mrp',
    headerName: 'MRP',
    minWidth: 120,
    flex: 0.6,
    renderCell: (params) => `Rs ${toNumber(params?.row?.mrp).toFixed(2)}`,
  },
  {
    field: 'totalQuantitySold',
    headerName: 'Total Qty Sold',
    minWidth: 150,
    flex: 0.8,
    renderCell: (params) => toNumber(params?.row?.totalQuantitySold).toFixed(2),
  },
  {
    field: 'totalAmount',
    headerName: 'Total Amount',
    minWidth: 150,
    flex: 0.8,
    renderCell: (params) =>
      `Rs ${toNumber(params?.row?.totalAmount).toFixed(2)}`,
  },
  {
    field: 'branch',
    headerName: 'Branch',
    minWidth: 170,
    flex: 0.8,
    renderCell: (params) => params?.row?.branch || '-',
  },
]

function PharmacySalesReport() {
  const router = useRouter()
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const branches = dropdowns?.branches || []

  useEffect(() => {
    if (user?.email && !hasPharmacySalesReportAccess(user.email)) {
      toast.error(
        'You do not have permission to access Pharmacy Sales Reports.',
        toastconfig,
      )
      router.replace('/home')
    }
  }, [user?.email, router])

  const [fromDate, setFromDate] = useState(dayjs().startOf('month'))
  const [toDate, setToDate] = useState(dayjs())
  const [branchId, setBranchId] = useState(ALL_BRANCHES_VALUE)
  const [searchText, setSearchText] = useState('')
  const [exportFormat, setExportFormat] = useState('excel')

  const branchOptions = useMemo(
    () => [ALL_BRANCHES_OPTION, ...branches],
    [branches],
  )

  const { data: reportData = [], isLoading } = useQuery({
    queryKey: [
      'PHARMACY_SALES_DETAILED_REPORT',
      user?.accessToken,
      fromDate?.format('YYYY-MM-DD') || null,
      toDate?.format('YYYY-MM-DD') || null,
      branchId,
    ],
    enabled: !!user?.accessToken && hasPharmacySalesReportAccess(user?.email),
    queryFn: async () => {
      const res = await getPharmacySalesDetailedReport(
        user.accessToken,
        fromDate ? fromDate.format('YYYY-MM-DD') : null,
        toDate ? toDate.format('YYYY-MM-DD') : null,
        branchId === ALL_BRANCHES_VALUE ? null : branchId,
      )
      if (res?.status === 200) return res.data || []
      return []
    },
  })

  const filteredRows = useMemo(() => {
    const q = String(searchText || '')
      .trim()
      .toLowerCase()
    if (!q) return reportData
    return (reportData || []).filter((row) => {
      return (
        String(row?.patientName || '')
          .toLowerCase()
          .includes(q) ||
        String(row?.medicineName || '')
          .toLowerCase()
          .includes(q) ||
        String(row?.branch || '')
          .toLowerCase()
          .includes(q)
      )
    })
  }, [reportData, searchText])

  const rowsForGrid = useMemo(
    () =>
      (filteredRows || []).map((row, idx) => ({
        id: `${row?.patientName || 'patient'}-${row?.medicineName || 'medicine'}-${row?.branch || 'branch'}-${idx}`,
        ...row,
      })),
    [filteredRows],
  )

  const grandTotal = useMemo(() => {
    return (filteredRows || []).reduce(
      (sum, row) => sum + Number(row?.totalAmount || 0),
      0,
    )
  }, [filteredRows])

  const handleExport = () => {
    const rows =
      rowsForGrid.length > 0
        ? rowsForGrid
        : [
            {
              patientName: '',
              medicineName: '',
              mrp: '',
              totalQuantitySold: '',
              totalAmount: '',
              branch: '',
            },
          ]

    exportReport(rows, columns, exportFormat, {
      reportName: 'Pharmacy_Sales_Report',
      branchName:
        branchId === ALL_BRANCHES_VALUE
          ? 'All_Branches'
          : String(
              branches.find((b) => String(b.id) === String(branchId))
                ?.branchCode || branchId,
            ),
      includeTimestamp: true,
    })
  }

  if (user?.email && !hasPharmacySalesReportAccess(user.email)) {
    return null
  }

  return (
    <div className="flex flex-col m-5 gap-5">
      <Breadcrumb />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-secondary">
          Pharmacy Sales Report
        </h1>
        <h2 className="text-lg font-semibold text-secondary">
          Grand Total: Rs {grandTotal.toFixed(2)}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 items-center">
        <DatePicker
          label="From Date"
          format="DD-MM-YYYY"
          value={fromDate}
          onChange={(value) =>
            setFromDate(value && dayjs(value).isValid() ? value : null)
          }
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
            },
          }}
        />
        <DatePicker
          label="To Date"
          format="DD-MM-YYYY"
          value={toDate}
          onChange={(value) =>
            setToDate(value && dayjs(value).isValid() ? value : null)
          }
          slotProps={{
            textField: {
              fullWidth: true,
              size: 'small',
            },
          }}
        />
        <Autocomplete
          options={branchOptions}
          value={
            branchOptions.find(
              (option) => String(option.id) === String(branchId),
            ) || ALL_BRANCHES_OPTION
          }
          onChange={(_, value) => setBranchId(value?.id ?? ALL_BRANCHES_VALUE)}
          getOptionLabel={(option) =>
            option?.id === ALL_BRANCHES_VALUE
              ? option?.name || 'All branches'
              : option?.branchCode || option?.name || ''
          }
          renderInput={(params) => (
            <TextField {...params} label="Branch" size="small" fullWidth />
          )}
        />
        <TextField
          size="small"
          fullWidth
          label="Search (Patient / Medicine / Branch)"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Autocomplete
          options={exportFormatOptions}
          value={
            exportFormatOptions.find((opt) => opt.id === exportFormat) ||
            exportFormatOptions[1]
          }
          onChange={(_, value) => setExportFormat(value?.id || 'excel')}
          getOptionLabel={(option) => option?.label || ''}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Export Format"
              size="small"
              fullWidth
            />
          )}
        />
        <div className="flex gap-2">
          <Button variant="outlined" onClick={handleExport}>
            Export
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setFromDate(dayjs().startOf('month'))
              setToDate(dayjs())
              setBranchId(ALL_BRANCHES_VALUE)
              setSearchText('')
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="h-[68vh]">
        <DataGrid
          rows={rowsForGrid}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
        />
      </div>
    </div>
  )
}

export default PharmacySalesReport
