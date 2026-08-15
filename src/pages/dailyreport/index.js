import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  DialogContentText,
  Divider,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { DataGrid } from '@mui/x-data-grid'
import { useSelector } from 'react-redux'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import Breadcrumb from '@/components/Breadcrumb'
import { createExportHandler } from '@/utils/exportHandler'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import CloseIcon from '@mui/icons-material/Close'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

const DEPARTMENTS = ['Pharmacy', 'Front Desk']
const PAYMENT_MODES = ['Cash', 'UPI', 'Online']

const defaultFormValues = {
  id: '',
  date: dayjs().format('YYYY-MM-DD'),
  branchId: '',
  department: DEPARTMENTS[0],
  description: '',
  paymentMode: PAYMENT_MODES[0],
  amount: '',
}

function DailyReportPage() {
  const dropdowns = useSelector((store) => store.dropdowns)
  const userDetails = useSelector((store) => store.user)
  const userRoleName = useMemo(() => {
    return (
      userDetails?.roleDetails?.roleName ||
      userDetails?.roleDetails?.name ||
      userDetails?.roleDetails?.role ||
      ''
    )
  }, [userDetails?.roleDetails])

  const normalizedRole = userRoleName.toLowerCase()
  const isAdmin = normalizedRole === 'admin'
  const isManager = normalizedRole === 'manager'
  const isPharmacist = normalizedRole === 'pharmacist'
  const isFrontDesk =
    normalizedRole === 'front desk' || normalizedRole === 'frontdesk'

  const allowedDepartments = useMemo(() => {
    if (isAdmin || isManager) return DEPARTMENTS
    if (isPharmacist) return ['Pharmacy']
    if (isFrontDesk) return ['Front Desk']
    return DEPARTMENTS
  }, [isAdmin, isManager, isPharmacist, isFrontDesk])
  const [rows, setRows] = useState([])
  const [searchValue, setSearchValue] = useState('')
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [filters, setFilters] = useState({
    branchId: '',
    department: 'All',
  })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState(defaultFormValues)
  const [formErrors, setFormErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [selectedViewRow, setSelectedViewRow] = useState(null)

  useEffect(() => {
    if (dropdowns?.branches?.length && !filters.branchId) {
      const defaultBranch = dropdowns.branches[0].id
      setFilters((prev) => ({
        ...prev,
        branchId: defaultBranch,
        department: isAdmin || isManager ? 'All' : allowedDepartments[0],
      }))
      setFormValues((prev) => ({
        ...prev,
        branchId: defaultBranch,
        department: allowedDepartments[0],
      }))
    }
  }, [
    dropdowns?.branches,
    filters.branchId,
    allowedDepartments,
    isAdmin,
    isManager,
  ])

  useEffect(() => {
    if (!rows.length && dropdowns?.branches?.length) {
      const branchName = dropdowns.branches[0]?.name || 'Main Branch'
      const sampleData = [
        {
          id: uuidv4(),
          date: dayjs().format('YYYY-MM-DD'),
          branchId: dropdowns.branches[0].id,
          branchName,
          department: 'Pharmacy',
          description: 'Morning pharmacy collection',
          paymentMode: 'Cash',
          amount: 2750,
        },
        {
          id: uuidv4(),
          date: dayjs().format('YYYY-MM-DD'),
          branchId: dropdowns.branches[0].id,
          branchName,
          department: 'Front Desk',
          description: 'OP collection summary',
          paymentMode: 'Online',
          amount: 5320,
        },
      ]
      setRows(sampleData)
    }
  }, [dropdowns?.branches, rows.length])

  const branchLookup = useMemo(() => {
    if (!dropdowns?.branches) return {}
    return dropdowns.branches.reduce((acc, branch) => {
      acc[branch.id] = branch.name
      return acc
    }, {})
  }, [dropdowns?.branches])

  const handleOpenForm = (mode = 'create', row = null) => {
    if (!isAdmin) return
    if (mode === 'edit' && row) {
      setEditingId(row.id)
      setFormValues({
        id: row.id,
        date: row.date,
        branchId: row.branchId,
        department: row.department,
        description: row.description,
        paymentMode: row.paymentMode,
        amount: row.amount?.toFixed(2) || '',
      })
    } else {
      setEditingId(null)
      setFormValues((prev) => ({
        ...defaultFormValues,
        branchId: filters.branchId || dropdowns?.branches?.[0]?.id || '',
        department: allowedDepartments[0],
      }))
    }
    setFormErrors({})
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingId(null)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors = {}
    if (!formValues.date) errors.date = 'Date is required'
    if (!formValues.branchId) errors.branchId = 'Branch is required'
    if (!formValues.department) errors.department = 'Department is required'
    if (!formValues.paymentMode) errors.paymentMode = 'Payment mode is required'
    if (!formValues.description.trim())
      errors.description = 'Description is required'

    const amountValue = Number(formValues.amount)
    if (!formValues.amount) {
      errors.amount = 'Amount is required'
    } else if (Number.isNaN(amountValue) || amountValue <= 0) {
      errors.amount = 'Enter a valid positive amount'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitForm = (event) => {
    event.preventDefault()
    if (!isAdmin) return
    if (!validateForm()) return

    const payload = {
      ...formValues,
      id: editingId || uuidv4(),
      branchName: branchLookup[formValues.branchId] || 'Branch',
      amount: Number(formValues.amount),
    }

    setRows((prev) => {
      if (editingId) {
        return prev.map((row) => (row.id === editingId ? payload : row))
      }
      return [payload, ...prev]
    })

    toast.success(
      `Daily report ${editingId ? 'updated' : 'added'} successfully`,
    )
    handleCloseForm()
  }

  const handleDeleteRow = (rowId) => {
    if (!isAdmin) return
    const row = rows.find((item) => item.id === rowId)
    const confirmation = window.confirm(
      `Delete daily report for ${row?.branchName || 'branch'} on ${dayjs(
        row?.date,
      ).format('DD MMM YYYY')}?`,
    )
    if (!confirmation) return

    setRows((prev) => prev.filter((item) => item.id !== rowId))
    toast.success('Daily report deleted')
  }

  const handleFilterChange = (field, value) => {
    if (field === 'department') {
      if (value !== 'All' && !allowedDepartments.includes(value)) {
        return
      }
    }
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (filters.branchId && row.branchId !== filters.branchId) {
          return false
        }

        const departmentFilter =
          filters.department === 'All'
            ? allowedDepartments
            : [filters.department]

        if (!departmentFilter.includes(row.department)) {
          return false
        }

        if (fromDate && dayjs(row.date).isBefore(fromDate, 'day')) {
          return false
        }

        if (toDate && dayjs(row.date).isAfter(toDate, 'day')) {
          return false
        }

        if (searchValue.trim()) {
          const searchLower = searchValue.toLowerCase()
          const amountString = (Number(row.amount) || 0)
            .toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
            .toLowerCase()

          return (
            dayjs(row.date).format('DD-MM-YYYY').includes(searchLower) ||
            row.branchName?.toLowerCase().includes(searchLower) ||
            row.department.toLowerCase().includes(searchLower) ||
            row.description.toLowerCase().includes(searchLower) ||
            String(row.paymentMode).toLowerCase().includes(searchLower) ||
            amountString.includes(searchLower)
          )
        }

        return true
      })
      .map((row) => ({
        ...row,
        formattedDate: dayjs(row.date).format('DD-MM-YYYY'),
        formattedAmount: (row.amount || 0).toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }))
  }, [rows, filters, fromDate, toDate, searchValue, allowedDepartments])

  const { totalAmount, totalCash, totalOnline } = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        const amount = Number(row.amount) || 0
        const paymentMode = String(row.paymentMode || '').toLowerCase()

        acc.totalAmount += amount

        if (paymentMode === 'cash') {
          acc.totalCash += amount
        }

        if (paymentMode === 'online' || paymentMode === 'upi') {
          acc.totalOnline += amount
        }

        return acc
      },
      { totalAmount: 0, totalCash: 0, totalOnline: 0 },
    )
  }, [filteredRows])

  const canExport = isAdmin || isManager
  const canAdd = isAdmin
  const showActionsColumn = isAdmin || isManager
  const departmentFilterOptions = useMemo(() => {
    if (isAdmin || isManager) {
      return ['All', ...DEPARTMENTS]
    }
    return [...allowedDepartments]
  }, [isAdmin, isManager, allowedDepartments])

  const exportHandler = useMemo(() => {
    return createExportHandler({
      reportName: 'Daily_Report',
      reportType: 'daily-report',
      branchName: filters.branchId
        ? branchLookup[filters.branchId]
        : 'All Branches',
      filters: {
        fromDate: fromDate ? fromDate.format('YYYY-MM-DD') : '',
        toDate: toDate ? toDate.format('YYYY-MM-DD') : '',
        department: filters.department,
        search: searchValue,
      },
      includeTimestamp: true,
    })
  }, [
    filters.branchId,
    branchLookup,
    fromDate,
    toDate,
    filters.department,
    searchValue,
  ])

  const handleExport = (format) => {
    if (!canExport) {
      toast.info('You do not have permission to export daily reports.')
      return
    }

    if (!filteredRows.length) {
      toast.info('No data available to export for the selected filters.')
      return
    }

    const exportRows = filteredRows.map((row) => ({
      Date: row.formattedDate,
      Branch: row.branchName,
      Department: row.department,
      Description: row.description,
      'Payment Mode': row.paymentMode,
      Amount: row.formattedAmount,
    }))

    const columns = [
      { field: 'Date', headerName: 'Date' },
      { field: 'Branch', headerName: 'Branch' },
      { field: 'Department', headerName: 'Department' },
      { field: 'Description', headerName: 'Description' },
      { field: 'Payment Mode', headerName: 'Payment Mode' },
      { field: 'Amount', headerName: 'Amount' },
    ]

    if (format === 'excel') {
      exportHandler.exportExcel(exportRows, columns)
    } else {
      exportHandler.exportCSV(exportRows, columns)
    }
  }

  const columns = useMemo(() => {
    const baseColumns = [
      {
        field: 'formattedDate',
        headerName: 'Date',
        flex: 0.7,
        minWidth: 110,
      },
      {
        field: 'branchName',
        headerName: 'Branch',
        flex: 1,
        minWidth: 140,
      },
      {
        field: 'department',
        headerName: 'Department',
        flex: 0.8,
        minWidth: 130,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.5,
        minWidth: 220,
      },
      {
        field: 'paymentMode',
        headerName: 'Payment Mode',
        flex: 0.8,
        minWidth: 120,
      },
      {
        field: 'formattedAmount',
        headerName: 'Amount',
        flex: 0.9,
        minWidth: 130,
        align: 'right',
        headerAlign: 'right',
      },
    ]

    if (showActionsColumn) {
      baseColumns.push({
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        filterable: false,
        align: 'center',
        headerAlign: 'center',
        minWidth: isAdmin ? 160 : 120,
        renderCell: (params) => {
          if (isAdmin) {
            return (
              <Stack direction="row" spacing={1} justifyContent="center">
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenForm('edit', params.row)}
                    color="primary"
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteRow(params.row.id)}
                    color="error"
                  >
                    <DeleteOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            )
          }

          if (isManager) {
            return (
              <Tooltip title="View">
                <IconButton
                  size="small"
                  onClick={() => setSelectedViewRow(params.row)}
                  color="primary"
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          }

          return null
        },
      })
    }

    return baseColumns
  }, [showActionsColumn, isAdmin, isManager, handleDeleteRow, handleOpenForm])

  return (
    <Box className="p-5 space-y-5">
      <Breadcrumb />

      <Card className="shadow-sm">
        <CardContent>
          <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SearchIcon className="text-gray-500" />
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Search by date, branch, department"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="bg-white"
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(value) => setFromDate(value)}
                format="DD-MM-YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(value) => setToDate(value)}
                format="DD-MM-YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" className="bg-white">
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={filters.branchId || ''}
                  onChange={(event) =>
                    handleFilterChange('branchId', event.target.value)
                  }
                >
                  {dropdowns?.branches?.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" className="bg-white">
                <InputLabel>Department</InputLabel>
                <Select
                  label="Department"
                  value={filters.department}
                  onChange={(event) =>
                    handleFilterChange('department', event.target.value)
                  }
                  disabled={departmentFilterOptions.length === 1}
                >
                  {departmentFilterOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                {canExport && (
                  <Button
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    onClick={() => handleExport('excel')}
                  >
                    Export
                  </Button>
                )}
                {canAdd && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm('create')}
                  >
                    Add Daily Report
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper elevation={1} className="p-4">
        <Stack
          direction="column"
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          spacing={0.25}
          className="mb-3"
        >
          <Typography
            variant="subtitle2"
            color="textSecondary"
            textAlign={{ xs: 'left', sm: 'right' }}
          >
            Total: ₹
            {totalAmount.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
          <Typography
            variant="subtitle2"
            color="textSecondary"
            textAlign={{ xs: 'left', sm: 'right' }}
          >
            Total Cash: ₹
            {totalCash.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            | Total Online: ₹
            {totalOnline.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Stack>

        <DataGrid
          autoHeight
          rowHeight={56}
          rows={filteredRows}
          columns={columns}
          getRowId={(row) => row.id}
          disableColumnMenu
          disableRowSelectionOnClick
          initialState={{
            pagination: {
              paginationModel: { page: 0, pageSize: 100 },
            },
          }}
          pageSizeOptions={[25, 50, 100, 200]}
          slotProps={{
            pagination: {
              labelRowsPerPage: 'Rows per page:',
            },
          }}
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'rgba(6, 174, 233, 0.08)',
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f1f5f9',
            },
          }}
        />
      </Paper>

      <Dialog
        open={isFormOpen && isAdmin}
        onClose={handleCloseForm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between">
          <span>{editingId ? 'Edit Daily Report' : 'Add Daily Report'}</span>
          <IconButton onClick={handleCloseForm}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmitForm}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Date"
                  value={formValues.date ? dayjs(formValues.date) : null}
                  onChange={(value) =>
                    setFormValues((prev) => ({
                      ...prev,
                      date: value ? value.format('YYYY-MM-DD') : '',
                    }))
                  }
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: Boolean(formErrors.date),
                      helperText: formErrors.date,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(formErrors.branchId)}>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    label="Branch"
                    value={formValues.branchId || ''}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        branchId: event.target.value,
                      }))
                    }
                  >
                    {dropdowns?.branches?.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.branchId && (
                    <Typography variant="caption" color="error">
                      {formErrors.branchId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(formErrors.department)}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={formValues.department}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        department: event.target.value,
                      }))
                    }
                    disabled={!isAdmin && allowedDepartments.length === 1}
                  >
                    {allowedDepartments.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.department && (
                    <Typography variant="caption" color="error">
                      {formErrors.department}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={Boolean(formErrors.paymentMode)}>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    label="Payment Mode"
                    value={formValues.paymentMode}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        paymentMode: event.target.value,
                      }))
                    }
                  >
                    {PAYMENT_MODES.map((item) => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.paymentMode && (
                    <Typography variant="caption" color="error">
                      {formErrors.paymentMode}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  placeholder="Enter amount (e.g. 500.00)"
                  value={formValues.amount}
                  onChange={(event) => {
                    const value = event.target.value
                    if (/^\d*(\.\d{0,2})?$/.test(value)) {
                      setFormValues((prev) => ({ ...prev, amount: value }))
                    }
                  }}
                  error={Boolean(formErrors.amount)}
                  helperText={formErrors.amount}
                  inputProps={{ inputMode: 'decimal' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  minRows={3}
                  value={formValues.description}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  error={Boolean(formErrors.description)}
                  helperText={formErrors.description}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseForm}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(selectedViewRow)}
        onClose={() => setSelectedViewRow(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between">
          <span>Daily Report Details</span>
          <IconButton onClick={() => setSelectedViewRow(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        {selectedViewRow && (
          <DialogContent dividers>
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Date
                </Typography>
                <Typography variant="body1">
                  {dayjs(selectedViewRow.date).format('DD MMM YYYY')}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Branch
                </Typography>
                <Typography variant="body1">
                  {selectedViewRow.branchName}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Department
                </Typography>
                <Typography variant="body1">
                  {selectedViewRow.department}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Description
                </Typography>
                <DialogContentText>
                  {selectedViewRow.description}
                </DialogContentText>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Payment Mode
                </Typography>
                <Typography variant="body1">
                  {selectedViewRow.paymentMode}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Amount
                </Typography>
                <Typography variant="body1">
                  ₹
                  {(selectedViewRow.amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setSelectedViewRow(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default withPermission(DailyReportPage, true, 'reportsModule', [
  ACCESS_TYPES.READ,
])
