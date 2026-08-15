import Breadcrumb from '@/components/Breadcrumb'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { withPermission } from '@/components/withPermission'
import {
  getPharmacyMasterData,
  getVendorManufacturerDepartmentReport,
} from '@/constants/apis'
import { ACCESS_TYPES, API_ROUTES } from '@/constants/constants'
import { useSelector } from 'react-redux'
import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Autocomplete,
  FormControlLabel,
  Paper,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { hasVendorManufacturerReportAccess } from '@/utils/vendorManufacturerReportAccess'
import { vendorManufacturerDeptReportFilterData } from '@/constants/filters'

function VendorManufacturerReport() {
  const user = useSelector((store) => store.user)

  const [department, setDepartment] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [manufacturer, setManufacturer] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [includeReturned, setIncludeReturned] = useState(false)
  const [chartBy, setChartBy] = useState('vendor')
  const [metric, setMetric] = useState('totalAmount')

  const hasAccess = hasVendorManufacturerReportAccess(user?.email)

  const { data: departmentsData } = useQuery({
    queryKey: [
      'DEPARTMENTS_LIST_FOR_VENDOR_MANUFACTURER_REPORT',
      user?.accessToken,
    ],
    enabled: !!user?.accessToken && hasAccess,
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DEPARTMENTS_LIST}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        },
      )
      return res.json()
    },
  })

  const { data: suppliersData } = useQuery({
    queryKey: ['SUPPLIERS_FOR_VENDOR_MANUFACTURER_REPORT', user?.accessToken],
    enabled: !!user?.accessToken && hasAccess,
    queryFn: async () => {
      const responsejson = await getPharmacyMasterData(
        user?.accessToken,
        API_ROUTES.GET_SUPPLIERS,
      )
      return responsejson
    },
  })

  const { data: manufacturersData } = useQuery({
    queryKey: [
      'MANUFACTURERS_FOR_VENDOR_MANUFACTURER_REPORT',
      user?.accessToken,
    ],
    enabled: !!user?.accessToken && hasAccess,
    queryFn: async () => {
      const responsejson = await getPharmacyMasterData(
        user?.accessToken,
        API_ROUTES.GET_MANUFACTURER,
      )
      return responsejson
    },
  })

  const { data: reportRes, isLoading } = useQuery({
    queryKey: [
      'VENDOR_MANUFACTURER_DEPT_REPORT',
      user?.accessToken,
      department?.id || null,
      vendor?.id || null,
      manufacturer?.id || null,
      searchQuery,
      includeReturned,
    ],
    enabled: !!user?.accessToken && hasAccess,
    queryFn: async () => {
      const res = await getVendorManufacturerDepartmentReport(
        user?.accessToken,
        {
          departmentId: department?.id,
          vendorId: vendor?.id,
          manufacturerId: manufacturer?.id,
          searchQuery: searchQuery?.trim() ? searchQuery.trim() : undefined,
          includeReturned: includeReturned ? 'true' : 'false',
        },
      )
      return res
    },
  })

  const rows = useMemo(() => {
    if (reportRes?.status !== 200) return []
    return reportRes?.data || []
  }, [reportRes])

  const columns = useMemo(
    () => [
      { field: 'departmentName', headerName: 'Department', width: 200 },
      { field: 'vendorName', headerName: 'Vendor', width: 260 },
      { field: 'manufacturerName', headerName: 'Manufacturer', width: 260 },
      { field: 'grnCount', headerName: 'GRNs', width: 110, type: 'number' },
      {
        field: 'lineItems',
        headerName: 'Line Items',
        width: 120,
        type: 'number',
      },
      {
        field: 'totalQuantity',
        headerName: 'Total Qty',
        width: 130,
        type: 'number',
      },
      {
        field: 'totalAmount',
        headerName: 'Total Amount',
        width: 140,
        type: 'number',
      },
    ],
    [],
  )

  const chartData = useMemo(() => {
    const key = chartBy === 'manufacturer' ? 'manufacturerName' : 'vendorName'
    const map = new Map()
    rows.forEach((r) => {
      const name = r?.[key] || 'Unknown'
      const prev = map.get(name) || 0
      const add = Number(r?.[metric] || 0)
      map.set(name, prev + (Number.isFinite(add) ? add : 0))
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [rows, chartBy, metric])

  const customFilters = [
    { field: 'departmentName', label: 'Department', type: 'text' },
    { field: 'vendorName', label: 'Vendor', type: 'text' },
    { field: 'manufacturerName', label: 'Manufacturer', type: 'text' },
  ]

  const getUniqueValues = (field) => {
    const values = new Set(rows.map((r) => r?.[field]))
    return Array.from(values).filter(Boolean)
  }

  if (!hasAccess) {
    return (
      <div className="m-5">
        <Breadcrumb />
        <Paper className="p-6 mt-4">
          <Typography variant="h6">Access restricted</Typography>
          <Typography variant="body2" color="text.secondary" className="mt-2">
            You don’t have access to this report. Please contact an admin.
          </Typography>
        </Paper>
      </div>
    )
  }

  return (
    <div className="m-5 flex flex-col gap-4">
      <Breadcrumb />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Autocomplete
          options={departmentsData?.data || []}
          getOptionLabel={(o) => o?.name || ''}
          value={department}
          onChange={(_, v) => setDepartment(v)}
          renderInput={(params) => <TextField {...params} label="Department" />}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          clearOnEscape
        />

        <Autocomplete
          options={suppliersData?.data || []}
          getOptionLabel={(o) => o?.supplier || o?.name || ''}
          value={vendor}
          onChange={(_, v) => setVendor(v)}
          renderInput={(params) => (
            <TextField {...params} label="Vendor (Supplier)" />
          )}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          clearOnEscape
        />

        <Autocomplete
          options={manufacturersData?.data || []}
          getOptionLabel={(o) => o?.manufacturer || o?.name || ''}
          value={manufacturer}
          onChange={(_, v) => setManufacturer(v)}
          renderInput={(params) => (
            <TextField {...params} label="Manufacturer" />
          )}
          isOptionEqualToValue={(a, b) => a?.id === b?.id}
          clearOnEscape
        />

        <TextField
          label="Search (Dept / Vendor / Manufacturer)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <ToggleButtonGroup
            value={chartBy}
            exclusive
            onChange={(_, v) => v && setChartBy(v)}
            size="small"
          >
            <ToggleButton value="vendor">Chart by Vendor</ToggleButton>
            <ToggleButton value="manufacturer">
              Chart by Manufacturer
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={metric}
            exclusive
            onChange={(_, v) => v && setMetric(v)}
            size="small"
          >
            <ToggleButton value="totalAmount">Amount</ToggleButton>
            <ToggleButton value="totalQuantity">Quantity</ToggleButton>
            <ToggleButton value="grnCount">GRNs</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <FormControlLabel
          control={
            <Switch
              checked={includeReturned}
              onChange={(e) => setIncludeReturned(e.target.checked)}
            />
          }
          label="Include returned items"
        />
      </div>

      <Paper className="p-4">
        <Typography variant="subtitle1" className="mb-2">
          Top 10 {chartBy === 'manufacturer' ? 'Manufacturers' : 'Vendors'} by{' '}
          {metric === 'totalAmount'
            ? 'Amount'
            : metric === 'totalQuantity'
              ? 'Quantity'
              : 'GRNs'}
        </Typography>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1f7a8c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Typography variant="caption" color="text.secondary">
          Tip: apply filters first, then use the chart for “who provides more”.
        </Typography>
      </Paper>

      <Paper className="p-3">
        <FilteredDataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) =>
            `${row.departmentId || 'd'}-${row.vendorId || 'v'}-${row.manufacturerId || 'm'}`
          }
          customFilters={customFilters}
          filterData={vendorManufacturerDeptReportFilterData}
          getUniqueValues={getUniqueValues}
          loading={isLoading}
          pageSize={10}
        />
      </Paper>
    </div>
  )
}

export default withPermission(VendorManufacturerReport, true, 'reportsModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
