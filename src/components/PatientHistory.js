import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  // CreditCard,
  // Money,
  TextField,
  InputAdornment,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material'

import React, { useEffect, useState, useMemo } from 'react'
import Modal from './Modal'
import {
  getConsultationsHistoryByVisitId,
  getEmbryologyHistoryByVisitId,
  getNotesHistoryByVisitId,
  getPatientVisits,
  getPaymentHistoryByVisitId,
  getTreatmentsHistoryByVisitId,
  updatePaymentHistory,
  deletePaymentHistory,
  getChecklistByPatientId,
  getSavedLabTestResult,
} from '@/constants/apis'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal, openModal } from '@/redux/modalSlice'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import {
  Download,
  CreditCard,
  Money,
  Search,
  FilterAltOff,
  BackHand,
  ExitToApp,
  ArrowBack,
  Close,
  Edit,
  Delete,
  MoreVert,
  Visibility,
} from '@mui/icons-material'
import { Generate_Invoice } from '@/constants/apis'
import { useRouter } from 'next/router'
import AppointmentDetail from '@/components/AppointmentDetail'
import RichText from './RichText'
import { ACCESS_TYPES } from '@/constants/constants'
import { usePermissionCheck, withPermission } from '@/components/withPermission'
import { exportReport } from '@/utils/reportExport'

const PAYMENT_EXPORT_COLUMNS = [
  {
    field: 'orderDate',
    headerName: 'Date',
    valueGetter: ({ row }) =>
      dayjs(row.orderDate).format('DD MMM, YYYY hh:mm A'),
  },
  { field: 'orderId', headerName: 'Order ID' },
  { field: 'type', headerName: 'Type' },
  {
    field: 'productType',
    headerName: 'Product',
    valueGetter: ({ row }) => row.productType || 'CONSULTATION FEE',
  },
  { field: 'paymentMode', headerName: 'Payment Mode' },
  {
    field: 'totalOrderAmount',
    headerName: 'Amount',
    valueGetter: ({ row }) =>
      `₹${Number.parseFloat(row.totalOrderAmount || 0).toLocaleString('en-IN')}`,
  },
  {
    field: 'discountAmount',
    headerName: 'Discount',
    valueGetter: ({ row }) => {
      const discount = row.discountAmount
      if (discount === '0' || discount === '0.00' || !discount) return '-'
      return `₹${Number.parseFloat(discount).toLocaleString('en-IN')}`
    },
  },
  {
    field: 'paidOrderAmount',
    headerName: 'Paid Amount',
    valueGetter: ({ row }) =>
      `₹${Number.parseFloat(row.paidOrderAmount || 0).toLocaleString('en-IN')}`,
  },
]

const getEmbryologyReportSource = (details = []) => {
  const templateReport = details.find((detail) => detail?.template)?.template
  if (templateReport) return templateReport

  const linkedReport = details.find((detail) => detail?.imageLink)?.imageLink
  return linkedReport || null
}

const viewEmbryologyReport = (reportSource) => {
  if (!reportSource) return

  if (
    typeof reportSource === 'string' &&
    (reportSource.startsWith('http') || reportSource.includes('.pdf'))
  ) {
    window.open(reportSource, '_blank', 'noopener,noreferrer')
    return
  }

  const newWindow = window.open()
  if (!newWindow) return
  newWindow.document.write(reportSource)
  newWindow.document.close()
}

const downloadEmbryologyReport = (reportSource, reportName) => {
  if (!reportSource) return

  const safeName = (reportName || 'embryology-report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  const link = document.createElement('a')

  if (
    typeof reportSource === 'string' &&
    (reportSource.startsWith('http') || reportSource.includes('.pdf'))
  ) {
    link.href = reportSource
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.download = `${safeName || 'embryology-report'}.pdf`
    link.click()
    return
  }

  const blob = new Blob([String(reportSource)], {
    type: 'text/html;charset=utf-8',
  })
  const blobUrl = URL.createObjectURL(blob)
  link.href = blobUrl
  link.download = `${safeName || 'embryology-report'}.html`
  link.click()
  URL.revokeObjectURL(blobUrl)
}

// EmbryologyTab Component
const EmbryologyTab = ({ data }) => {
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <Card key={index} className="mb-4 shadow-md border border-gray-200">
          {item.embryologyDetails?.length > 0 ? (
            <div className="bg-gray-50">
              {item.embryologyDetails.map((type, typeIdx) => {
                const reportSource = getEmbryologyReportSource(type?.details)
                const canAccessReport = !!reportSource

                return (
                  <div
                    key={typeIdx}
                    className={`flex w-full items-center gap-3 px-3 py-2 ${
                      typeIdx !== item.embryologyDetails.length - 1
                        ? 'border-b border-gray-200'
                        : ''
                    }`}
                  >
                    <Typography className="font-medium min-w-[95px]">
                      {dayjs(item.appointmentDate).format('DD/MM/YYYY')}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      className="min-w-[90px]"
                    >
                      {item.doctorName}
                    </Typography>
                    <Chip
                      label={item.type}
                      className={'bg-secondary text-white shrink-0'}
                      size="small"
                    />
                    <Typography
                      variant="body2"
                      className="font-medium flex-1 truncate"
                    >
                      {type.embryologyName}
                    </Typography>
                    <div className="flex items-center shrink-0">
                      <Tooltip title="View report">
                        <span>
                          <IconButton
                            size="small"
                            disabled={!canAccessReport}
                            onClick={() => viewEmbryologyReport(reportSource)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Download report">
                        <span>
                          <IconButton
                            size="small"
                            disabled={!canAccessReport}
                            onClick={() =>
                              downloadEmbryologyReport(
                                reportSource,
                                type.embryologyName,
                              )
                            }
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-4">
              <Typography color="text.secondary" className="text-center py-4">
                No Embryology details available
              </Typography>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}

// PaymentHistoryTab Component
const PaymentHistoryTab = ({ data, patientLabel }) => {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [filters, setFilters] = useState({
    type: 'all',
    paymentMode: 'all',
    dateRange: {
      start: '',
      end: '',
    },
    search: '',
  })
  const [editPayment, setEditPayment] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [editFormData, setEditFormData] = useState({
    totalOrderAmount: '',
    discountAmount: '',
    paidOrderAmount: '',
    paymentMode: '',
    productType: '',
    orderDate: '',
  })
  const [exportAnchor, setExportAnchor] = useState(null)

  // Check if user is admin
  const isAdmin = user?.roleDetails?.name?.toLowerCase() === 'admin'

  // Handle menu open
  const handleMenuOpen = (event, payment) => {
    setMenuAnchor(event.currentTarget)
    setSelectedPayment(payment)
  }

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedPayment(null)
  }

  // Handle edit click
  const handleEditClick = () => {
    if (selectedPayment) {
      setEditPayment(selectedPayment)
      setEditFormData({
        totalOrderAmount: selectedPayment.totalOrderAmount || '',
        discountAmount: selectedPayment.discountAmount || '',
        paidOrderAmount: selectedPayment.paidOrderAmount || '',
        paymentMode: selectedPayment.paymentMode || '',
        productType: selectedPayment.productType || '',
        orderDate: selectedPayment.orderDate
          ? dayjs(selectedPayment.orderDate).format('YYYY-MM-DD')
          : '',
      })
    }
    handleMenuClose()
  }

  // Handle delete click
  const handleDeleteClick = () => {
    if (selectedPayment) {
      setDeleteConfirm(selectedPayment)
    }
    handleMenuClose()
  }

  const getPaymentSource = (payment) =>
    payment?.paymentSource ||
    (payment?.appointmentId == null ? 'TREATMENT_ORDER' : 'ORDER_DETAILS')

  const invalidatePaymentAndAppointmentQueries = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey?.[0]
        return key === 'paymentHistory' || key === 'allAppointments'
      },
    })
  }

  // Update payment mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, paymentData, source }) => {
      return await updatePaymentHistory(user.accessToken, paymentId, {
        ...paymentData,
        source,
      })
    },
    onSuccess: () => {
      toast.success('Payment record updated successfully')
      setEditPayment(null)
      setEditFormData({
        totalOrderAmount: '',
        discountAmount: '',
        paidOrderAmount: '',
        paymentMode: '',
        productType: '',
        orderDate: '',
      })
      invalidatePaymentAndAppointmentQueries()
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to update payment record',
      )
    },
  })

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, source }) => {
      return await deletePaymentHistory(user.accessToken, paymentId, source)
    },
    onSuccess: () => {
      toast.success('Payment record deleted successfully')
      setDeleteConfirm(null)
      invalidatePaymentAndAppointmentQueries()
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to delete payment record',
      )
    },
  })

  // Handle edit form submit
  const handleEditSubmit = () => {
    if (!editPayment) return

    const paymentData = {
      totalOrderAmount: parseFloat(editFormData.totalOrderAmount) || 0,
      discountAmount: parseFloat(editFormData.discountAmount) || 0,
      paidOrderAmount: parseFloat(editFormData.paidOrderAmount) || 0,
      paymentMode: editFormData.paymentMode,
      productType: editFormData.productType,
      orderDate: editFormData.orderDate
        ? dayjs(editFormData.orderDate).format('YYYY-MM-DD HH:mm:ss')
        : null,
    }

    updatePaymentMutation.mutate({
      paymentId: editPayment.id,
      paymentData,
      source: getPaymentSource(editPayment),
    })
  }

  // Handle delete confirm
  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deletePaymentMutation.mutate({
        paymentId: deleteConfirm.id,
        source: getPaymentSource(deleteConfirm),
      })
    }
  }

  const generateReport = useMutation({
    mutationFn: async (payload) => {
      const result = await Generate_Invoice(user.accessToken, payload)
      if (result.status === 200) {
        const newWindow = window.open()
        newWindow.document.write(result.data)
        newWindow.document.close()
      }
      return result
    },
  })

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data?.filter((payment) => {
      const matchesType =
        filters.type === 'all' || payment.type === filters.type
      const matchesPaymentMode =
        filters.paymentMode === 'all' ||
        payment.paymentMode === filters.paymentMode
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        String(payment.orderId ?? '')
          .toLowerCase()
          .includes(searchLower) ||
        payment.productType?.toLowerCase().includes(searchLower)

      // Date filtering
      const paymentDate = dayjs(payment.orderDate)
      const startDate = filters.dateRange.start
        ? dayjs(filters.dateRange.start)
        : null
      const endDate = filters.dateRange.end
        ? dayjs(filters.dateRange.end)
        : null

      const matchesDateRange =
        (!startDate ||
          paymentDate.isAfter(startDate) ||
          paymentDate.isSame(startDate, 'day')) &&
        (!endDate ||
          paymentDate.isBefore(endDate) ||
          paymentDate.isSame(endDate, 'day'))

      return (
        matchesType && matchesPaymentMode && matchesSearch && matchesDateRange
      )
    })
  }, [data, filters])

  // Get unique types and payment modes for filters
  const uniqueTypes = useMemo(
    () => [...new Set(data?.map((payment) => payment.type))],
    [data],
  )
  const uniquePaymentModes = useMemo(
    () => [...new Set(data?.map((payment) => payment.paymentMode))],
    [data],
  )

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      paymentMode: 'all',
      dateRange: {
        start: '',
        end: '',
      },
      search: '',
    })
    setPage(0)
  }

  const handleExportFormat = (format) => {
    try {
      if (!filteredData?.length) {
        toast.warning('No records to export')
        return
      }
      exportReport(filteredData, PAYMENT_EXPORT_COLUMNS, format, {
        reportName: 'Patient_Payment_History',
        reportType: 'payment_history',
        branchName: patientLabel,
      })
      const formatLabel = format === 'xlsx' ? 'Excel' : format.toUpperCase()
      toast.success(`Payment history exported as ${formatLabel}`)
    } catch (error) {
      console.error('Payment history export failed:', error)
      toast.error(error?.message || 'Export failed. Please try again.')
    } finally {
      setExportAnchor(null)
    }
  }

  // Calculate paginated data
  const paginatedData = filteredData?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  )

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters Section */}
      <div className="p-4 border-b space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">Filters</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Download />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              disabled={!filteredData?.length}
            >
              Export
            </Button>
            <Menu
              anchorEl={exportAnchor}
              open={Boolean(exportAnchor)}
              onClose={() => setExportAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
            <Button
              size="small"
              startIcon={<FilterAltOff />}
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </Box>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Search Filter */}
          <TextField
            size="small"
            label="Search"
            variant="outlined"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {/* Type Filter */}
          <FormControl size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              label="Type"
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  type: e.target.value,
                }))
              }
            >
              <MenuItem value="all">All Types</MenuItem>
              {uniqueTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Payment Mode Filter */}
          <FormControl size="small">
            <InputLabel>Payment Mode</InputLabel>
            <Select
              value={filters.paymentMode}
              label="Payment Mode"
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  paymentMode: e.target.value,
                }))
              }
            >
              <MenuItem value="all">All Modes</MenuItem>
              {uniquePaymentModes.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Start Date Filter */}
          <TextField
            size="small"
            label="Start Date"
            type="date"
            value={filters.dateRange.start}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange,
                  start: e.target.value,
                },
              }))
            }
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* End Date Filter */}
          <TextField
            size="small"
            label="End Date"
            type="date"
            value={filters.dateRange.end}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: {
                  ...prev.dateRange,
                  end: e.target.value,
                },
              }))
            }
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2 items-center">
            {filters.type !== 'all' && (
              <Chip
                size="small"
                label={`Type: ${filters.type}`}
                onDelete={() =>
                  setFilters((prev) => ({ ...prev, type: 'all' }))
                }
              />
            )}
            {filters.paymentMode !== 'all' && (
              <Chip
                size="small"
                label={`Mode: ${filters.paymentMode}`}
                onDelete={() =>
                  setFilters((prev) => ({ ...prev, paymentMode: 'all' }))
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow className="bg-gray-50">
              <TableCell className="font-semibold">Date</TableCell>
              <TableCell className="font-semibold">Order ID</TableCell>
              <TableCell className="font-semibold">Type</TableCell>
              <TableCell className="font-semibold">Product</TableCell>
              <TableCell className="font-semibold">Payment Mode</TableCell>
              <TableCell className="font-semibold text-right">Amount</TableCell>
              <TableCell className="font-semibold text-right">
                Discount
              </TableCell>
              <TableCell className="font-semibold text-right">
                Paid Amount
              </TableCell>
              <TableCell className="font-semibold text-center">
                Invoice
              </TableCell>
              {isAdmin && (
                <TableCell className="font-semibold text-center">
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData?.map((payment, index) => (
              <TableRow
                key={index}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                {/* Date */}
                <TableCell>
                  <Typography variant="body2">
                    {dayjs(payment.orderDate).format('DD MMM, YYYY')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(payment.orderDate).format('hh:mm A')}
                  </Typography>
                </TableCell>

                {/* Order ID */}
                <TableCell>
                  <Typography variant="body2">{payment.orderId}</Typography>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <Chip
                    label={payment.type}
                    size="small"
                    className="bg-secondary text-white"
                  />
                </TableCell>

                {/* Product Type */}
                <TableCell>
                  <Typography variant="body2">
                    {payment.productType || 'CONSULTATION FEE'}
                  </Typography>
                </TableCell>

                {/* Payment Mode */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {payment.paymentMode === 'ONLINE' ? (
                      <CreditCard className="text-blue-500 w-4 h-4" />
                    ) : (
                      <Money className="text-green-500 w-4 h-4" />
                    )}
                    <Typography variant="body2">
                      {payment.paymentMode}
                    </Typography>
                  </div>
                </TableCell>

                {/* Total Amount */}
                <TableCell align="right">
                  <Typography variant="body2">
                    ₹
                    {parseFloat(payment.totalOrderAmount).toLocaleString(
                      'en-IN',
                    )}
                  </Typography>
                </TableCell>

                {/* Discount */}
                <TableCell align="right">
                  <div className="flex flex-col items-end">
                    {payment.discountAmount !== '0' &&
                    payment.discountAmount !== '0.00' ? (
                      <>
                        <Typography variant="body2" className="text-red-600">
                          ₹
                          {parseFloat(payment.discountAmount).toLocaleString(
                            'en-IN',
                          )}
                        </Typography>
                        {/* {payment.couponCode && (
                          <Tooltip title="Coupon Applied">
                            <Chip
                              label={payment.couponCode}
                              size="small"
                              className="bg-yellow-100 text-yellow-800 text-xs"
                            />
                          </Tooltip>
                        )} */}
                      </>
                    ) : (
                      <Typography variant="body2">-</Typography>
                    )}
                  </div>
                </TableCell>

                {/* Paid Amount */}
                <TableCell align="right">
                  <Typography
                    variant="body2"
                    className="text-green-600 font-medium"
                  >
                    ₹
                    {parseFloat(payment.paidOrderAmount).toLocaleString(
                      'en-IN',
                    )}
                  </Typography>
                </TableCell>

                {/* Invoice */}
                <TableCell align="center">
                  <Tooltip title="Download Invoice">
                    <IconButton
                      size="small"
                      onClick={() => {
                        generateReport.mutate({
                          appointmentId: payment.appointmentId,
                          id: payment.id,
                          productType:
                            payment.productType || 'CONSULTATION FEE',
                          type: payment.type,
                        })
                      }}
                    >
                      <Download className="text-secondary hover:text-secondary/80 w-5 h-5" />
                    </IconButton>
                  </Tooltip>
                </TableCell>

                {/* Actions Menu - Admin Only */}
                {isAdmin && (
                  <TableCell align="center">
                    <Tooltip title="More options">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, payment)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <MoreVert className="w-5 h-5" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <Edit fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <Delete fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Edit Payment Dialog */}
      <Dialog
        open={!!editPayment}
        onClose={() => {
          setEditPayment(null)
          setEditFormData({
            totalOrderAmount: '',
            discountAmount: '',
            paidOrderAmount: '',
            paymentMode: '',
            productType: '',
            orderDate: '',
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Payment Record</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Order ID (Read-only) */}
            <TextField
              label="Order ID"
              value={editPayment?.orderId || ''}
              disabled
              fullWidth
              size="small"
            />

            {/* Type (Read-only) */}
            <TextField
              label="Type"
              value={editPayment?.type || ''}
              disabled
              fullWidth
              size="small"
            />

            {/* Product Type */}
            <TextField
              label="Product Type"
              value={editFormData.productType}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  productType: e.target.value,
                }))
              }
              fullWidth
              size="small"
            />

            {/* Payment Mode */}
            <FormControl fullWidth size="small">
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={editFormData.paymentMode}
                label="Payment Mode"
                onChange={(e) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    paymentMode: e.target.value,
                  }))
                }
              >
                <MenuItem value="CASH">CASH</MenuItem>
                <MenuItem value="ONLINE">ONLINE</MenuItem>
                <MenuItem value="CARD">CARD</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </Select>
            </FormControl>

            {/* Order Date */}
            <TextField
              label="Order Date"
              type="date"
              value={editFormData.orderDate}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  orderDate: e.target.value,
                }))
              }
              fullWidth
              size="small"
              InputLabelProps={{
                shrink: true,
              }}
            />

            {/* Total Order Amount */}
            <TextField
              label="Total Amount"
              type="number"
              value={editFormData.totalOrderAmount}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  totalOrderAmount: e.target.value,
                }))
              }
              fullWidth
              size="small"
              inputProps={{
                step: '0.01',
                min: 0,
              }}
            />

            {/* Discount Amount */}
            <TextField
              label="Discount Amount"
              type="number"
              value={editFormData.discountAmount}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  discountAmount: e.target.value,
                }))
              }
              fullWidth
              size="small"
              inputProps={{
                step: '0.01',
                min: 0,
              }}
            />

            {/* Paid Order Amount */}
            <TextField
              label="Paid Amount"
              type="number"
              value={editFormData.paidOrderAmount}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  paidOrderAmount: e.target.value,
                }))
              }
              fullWidth
              size="small"
              inputProps={{
                step: '0.01',
                min: 0,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditPayment(null)
              setEditFormData({
                totalOrderAmount: '',
                discountAmount: '',
                paidOrderAmount: '',
                paymentMode: '',
                productType: '',
                orderDate: '',
              })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={updatePaymentMutation.isPending}
          >
            {updatePaymentMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this payment record? This action
            cannot be undone.
          </Typography>
          {deleteConfirm && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Order ID:</strong> {deleteConfirm.orderId}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {deleteConfirm.type}
              </Typography>
              <Typography variant="body2">
                <strong>Product:</strong> {deleteConfirm.productType || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> ₹
                {parseFloat(deleteConfirm.totalOrderAmount).toLocaleString(
                  'en-IN',
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong>{' '}
                {dayjs(deleteConfirm.orderDate).format('DD MMM, YYYY')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deletePaymentMutation.isPending}
          >
            {deletePaymentMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredData?.length || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        className="border-t"
      />

      {/* Empty State */}
      {(!filteredData || filteredData.length === 0) && (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <Typography variant="body1">
            {data?.length
              ? 'No matching records found'
              : 'No payment history available'}
          </Typography>
        </div>
      )}
    </div>
  )
}

function normalizeChecklistLabTests(rawData) {
  if (!rawData) return []
  const row = Array.isArray(rawData) ? rawData[0] : rawData
  let list = row?.labTestsList
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list)
    } catch {
      list = []
    }
  }
  return Array.isArray(list) ? list : []
}

const hasUploadedLabReport = (test) => {
  if (test?.hasReport !== undefined && test?.hasReport !== null) {
    return test.hasReport === 1 || test.hasReport === true
  }
  return false
}

const filterChecklistWithUploadedReports = (tests) =>
  (tests || []).filter(hasUploadedLabReport)

/** Constrain header/logo images in saved lab report HTML (e.g. VIRAL MARKERS, UPT). */
const normalizeLabReportHtmlForPreview = (html) => {
  if (!html || typeof html !== 'string') return html

  return html.replace(/<img\b([^>]*)\/?>/gi, (match, attrs) => {
    let cleaned = attrs.replace(/\s(width|height)\s*=\s*["'][^"']*["']/gi, '')
    const sizeStyles =
      'max-width:120px;height:auto;width:auto;object-fit:contain;display:block;'
    const styleMatch = cleaned.match(/style\s*=\s*["']([^"']*)["']/i)

    if (styleMatch) {
      cleaned = cleaned.replace(
        /style\s*=\s*["']([^"']*)["']/i,
        `style="${styleMatch[1]};${sizeStyles}"`,
      )
    } else {
      cleaned += ` style="${sizeStyles}"`
    }

    return `<img${cleaned}>`
  })
}

const labReportPreviewSx = {
  '& .ql-container': { border: 'none', fontFamily: 'inherit' },
  '& .ql-toolbar': { display: 'none' },
  '& .ql-editor': {
    padding: '8px 0',
    overflowX: 'auto',
    minHeight: 'unset',
  },
  '& .ql-editor img, & img': {
    maxWidth: '120px !important',
    width: 'auto !important',
    height: 'auto !important',
    objectFit: 'contain',
    display: 'block',
  },
}

function PatientHistory({ patient, onClose }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((store) => store.user)
  const billTypes = useSelector((store) => store.dropdowns?.billTypes ?? [])
  const [activeTab, setActiveTab] = useState(0)
  const [selectedVisit, setSelectedVisit] = useState()
  // patient?.activeVisitId
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false)
  const [selectedInvestigationTest, setSelectedInvestigationTest] =
    useState(null)

  const hasReadAccess = usePermissionCheck('manageUsers', [
    ACCESS_TYPES.READ,
    ACCESS_TYPES.WRITE,
  ])
  const hasWriteAccess = usePermissionCheck('manageUsers', [ACCESS_TYPES.WRITE])

  const {
    data: visits,
    isLoading: visitsLoading,
    error: visitsError,
    refetch,
  } = useQuery({
    queryKey: ['patientVisits', patient?.patientId],
    queryFn: () => getPatientVisits(user.accessToken, patient?.patientId),
    enabled: !!patient?.patientId,
  })

  const {
    data: embryologyData,
    isLoading: embryologyLoading,
    error: embryologyError,
  } = useQuery({
    queryKey: ['embryologyHistory', selectedVisit],
    queryFn: () =>
      getEmbryologyHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 0,
  })

  const {
    data: consultationsData,
    isLoading: consultationsLoading,
    error: consultationsError,
  } = useQuery({
    queryKey: ['consultationsHistory', selectedVisit],
    queryFn: () =>
      getConsultationsHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 1,
  })

  const {
    data: treatmentsData,
    isLoading: treatmentsLoading,
    error: treatmentsError,
  } = useQuery({
    queryKey: ['treatmentsHistory', selectedVisit],
    queryFn: () =>
      getTreatmentsHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 2,
  })

  const {
    data: investigationChecklist,
    isLoading: investigationChecklistLoading,
    error: investigationChecklistError,
  } = useQuery({
    queryKey: ['patientHistoryChecklist', patient?.patientId],
    queryFn: async () => {
      const responsejson = await getChecklistByPatientId(
        user.accessToken,
        patient?.patientId,
      )
      if (responsejson.status !== 200) {
        throw new Error(
          responsejson.message || 'Failed to load investigation checklist',
        )
      }
      return normalizeChecklistLabTests(responsejson.data)
    },
    enabled: !!patient?.patientId && activeTab === 3,
  })

  const checklistUsesHasReportFlag = useMemo(() => {
    if (!investigationChecklist?.length) return false
    return investigationChecklist.some(
      (test) => test.hasReport !== undefined && test.hasReport !== null,
    )
  }, [investigationChecklist])

  const {
    data: investigationTestsWithReportsFallback,
    isLoading: investigationReportsFilterLoading,
  } = useQuery({
    queryKey: [
      'patientHistoryChecklistWithReports',
      patient?.patientId,
      investigationChecklist?.map(
        (t) => `${t.appointmentId}-${t.billTypeValue}-${t.type}`,
      ),
    ],
    queryFn: async () => {
      const results = await Promise.all(
        investigationChecklist.map(async (test) => {
          try {
            const responsejson = await getSavedLabTestResult(
              user.accessToken,
              test.type,
              test.appointmentId,
              test.billTypeValue,
              test.isSpouse ?? 0,
            )
            if (responsejson.status !== 200) return null
            const labTestResult = responsejson.data?.labTestResult
            if (labTestResult == null || String(labTestResult).trim() === '') {
              return null
            }
            return test
          } catch {
            return null
          }
        }),
      )
      return results.filter(Boolean)
    },
    enabled:
      !!investigationChecklist?.length &&
      activeTab === 3 &&
      !checklistUsesHasReportFlag,
  })

  const investigationTestsWithReports = useMemo(() => {
    if (!investigationChecklist?.length) return []
    if (checklistUsesHasReportFlag) {
      return filterChecklistWithUploadedReports(investigationChecklist)
    }
    return investigationTestsWithReportsFallback ?? []
  }, [
    investigationChecklist,
    checklistUsesHasReportFlag,
    investigationTestsWithReportsFallback,
  ])

  const {
    data: notesHistory,
    isLoading: notesHistoryLoading,
    error: notesHistoryError,
  } = useQuery({
    queryKey: ['notesHistory', selectedVisit],
    queryFn: () => getNotesHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 4,
  })

  const {
    data: paymentHistory,
    isLoading: paymentHistoryLoading,
    error: paymentHistoryError,
  } = useQuery({
    queryKey: ['paymentHistory', selectedVisit],
    queryFn: () => getPaymentHistoryByVisitId(user.accessToken, selectedVisit),
    enabled: !!selectedVisit && activeTab === 5 && hasReadAccess,
  })

  const {
    data: investigationReportData,
    isLoading: investigationReportLoading,
    error: investigationReportError,
  } = useQuery({
    queryKey: [
      'patientHistoryLabReport',
      selectedInvestigationTest?.appointmentId,
      selectedInvestigationTest?.billTypeValue,
      selectedInvestigationTest?.type,
    ],
    queryFn: async () => {
      const responsejson = await getSavedLabTestResult(
        user.accessToken,
        selectedInvestigationTest?.type,
        selectedInvestigationTest?.appointmentId,
        selectedInvestigationTest?.billTypeValue,
        selectedInvestigationTest?.isSpouse ?? 0,
      )
      if (responsejson.status !== 200) {
        throw new Error(
          responsejson.message || 'Failed to load lab test result',
        )
      }
      const row = responsejson.data
      return row?.labTestResult ?? null
    },
    enabled: !!selectedInvestigationTest,
  })

  // Handle opening the modal with route
  const handleOpenModal = () => {
    refetch()
    dispatch(openModal(patient.patientId + 'History'))
    // Update URL with patient history params
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          patientHistoryId: patient.patientId,
          activeVisitId: patient.activeVisitId,
          activeTab: activeTab,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  // Handle closing the modal
  const handleCloseModal = () => {
    dispatch(closeModal())
    // Remove patient history params from URL
    const {
      patientHistoryId,
      activeVisitId,
      activeTab: tabFromQuery,
      ...restQuery
    } = router.query
    router.push(
      {
        pathname: router.pathname,
        query: restQuery,
      },
      undefined,
      { shallow: true },
    )
    onClose?.()
  }

  // Effect to handle URL params and modal state
  useEffect(() => {
    const {
      patientHistoryId,
      activeVisitId,
      activeTab: tabFromQuery,
    } = router.query

    // Only open modal if URL has matching patient history params
    if (patientHistoryId && patientHistoryId === patient?.patientId) {
      dispatch(openModal(patient.patientId + 'History'))
      if (activeVisitId) {
        setSelectedVisit(activeVisitId)
      }
      if (tabFromQuery) {
        setActiveTab(parseInt(tabFromQuery))
      }
    }
  }, [router.query, patient?.patientId])

  const LoadingState = () => (
    <div className="flex justify-center items-center min-h-[200px]">
      <CircularProgress />
    </div>
  )

  const ErrorState = ({ message }) => (
    <Alert severity="error" className="my-4">
      {message || 'An error occurred while fetching data'}
    </Alert>
  )

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-500">
      <svg
        className="w-16 h-16 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p>{message || 'No data available'}</p>
    </div>
  )

  const renderEmbryologyTab = () => {
    if (embryologyLoading) return <LoadingState />
    if (embryologyError) return <ErrorState message={embryologyError.message} />
    if (!embryologyData?.data?.length)
      return <EmptyState message="No embryology records found" />

    return <EmbryologyTab data={embryologyData.data} />
  }

  const renderConsultationsTab = () => {
    if (consultationsLoading) return <LoadingState />
    if (consultationsError)
      return <ErrorState message={consultationsError.message} />
    if (!consultationsData?.data?.length)
      return <EmptyState message="No consultation records found" />

    return (
      <div className="space-y-4">
        {consultationsData?.data?.map((consultation, index) => (
          <div key={index} className="border rounded-lg p-4 shadow">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">
                {consultation.consultationType}
              </span>
              <span>
                {dayjs(consultation.consultationDate).format('DD-MM-YYYY')}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {consultation.appointmentDetails?.map((apt, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg shadow-sm hover:shadow-md transition-all bg-white overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b p-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {apt.consultationDoctor}
                      </span>
                    </div>
                    <Chip
                      label={apt.currentStage}
                      size="small"
                      className="bg-blue-100 text-blue-800"
                    />
                  </div>

                  <div className="p-3">
                    <div className="mb-3">
                      <Typography
                        variant="body2"
                        className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-100 line-clamp-2"
                      >
                        {apt.appointmentReason || 'No reason specified'}
                      </Typography>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex flex-col">
                        <Typography variant="caption" className="text-gray-500">
                          Date
                        </Typography>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          <Typography variant="body2" className="font-medium">
                            {dayjs(apt.appointmentDate).format('DD MMM, YYYY')}
                          </Typography>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <Typography variant="caption" className="text-gray-500">
                          Time
                        </Typography>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="w-2 h-2 rounded-full bg-secondary"></div>
                          <Typography variant="body2" className="font-medium">
                            {apt.appointmentSlot
                              ?.split(' - ')[0]
                              .substring(0, 5)}
                          </Typography>
                        </div>
                      </div>

                      <Button
                        variant="outlined"
                        size="small"
                        // className="bg-primary hover:bg-primary/90 shadow-sm"
                        // endIcon={<ExitToApp />}
                        onClick={() =>
                          handleAppointmentClick({
                            ...apt,
                            type: 'Consultation',
                          })
                        }
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderTreatmentsTab = () => {
    if (treatmentsLoading) return <LoadingState />
    if (treatmentsError) return <ErrorState message={treatmentsError.message} />
    if (!treatmentsData?.data?.length)
      return <EmptyState message="No treatment records found" />

    return (
      <div className="space-y-4">
        {treatmentsData?.data?.map((treatment, index) => (
          <div key={index} className="border rounded-lg p-4 shadow">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">
                {treatment.treatmentType || 'Unknown Treatment'}
              </span>
              <span>{dayjs(treatment.treatmentDate).format('DD-MM-YYYY')}</span>
            </div>
            {treatment.appointmentDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {treatment.appointmentDetails.map((apt, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">
                        {apt.consultationDoctor}
                      </span>
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {apt.currentStage}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p>{dayjs(apt.appointmentDate).format('DD-MM-YYYY')}</p>
                      <p>{apt.appointmentSlot}</p>
                      <p className="text-gray-600">{apt.appointmentReason}</p>
                    </div>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      className="mt-2"
                      onClick={() =>
                        handleAppointmentClick({ ...apt, type: 'Treatment' })
                      }
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderInvestigationTab = () => {
    if (
      investigationChecklistLoading ||
      (!checklistUsesHasReportFlag && investigationReportsFilterLoading)
    ) {
      return <LoadingState />
    }
    if (investigationChecklistError)
      return <ErrorState message={investigationChecklistError.message} />
    if (!investigationChecklist?.length)
      return <EmptyState message="No check list data found" />
    if (!investigationTestsWithReports.length)
      return (
        <EmptyState message="No uploaded lab reports available for this patient" />
      )

    return (
      <div className="space-y-3">
        <div className="flex justify-start gap-3 items-center flex-wrap px-1">
          <span className="font-semibold text-secondary">Check List</span>
          <Chip
            label={`${investigationTestsWithReports.length} tests`}
            size="small"
            className="bg-blue-100 text-blue-800"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {investigationTestsWithReports.map((test, index) => (
            <Box
              key={`${test.appointmentId}-${test.billTypeValue}-${index}`}
              className="flex flex-col gap-2 p-2 items-start border border-gray-200 rounded-lg justify-between bg-white"
            >
              <div className="flex justify-between w-full">
                <span className="text-xs text-gray-500">
                  {billTypes.find((bt) => bt.id == test.billTypeId)?.name ||
                    'Lab Test'}
                </span>
                <span className="text-xs text-gray-500">
                  {test.appointmentDate
                    ? dayjs(test.appointmentDate).format('DD-MM-YYYY')
                    : '—'}
                </span>
              </div>
              <div className="flex gap-2 justify-between w-full items-center">
                <span className="text-base uppercase font-semibold text-gray-900 line-clamp-2">
                  {test.labTestName}
                </span>
                <IconButton
                  size="small"
                  aria-label="View lab report"
                  onClick={() => setSelectedInvestigationTest(test)}
                  className="hover:text-secondary shrink-0"
                >
                  <Visibility />
                </IconButton>
              </div>
            </Box>
          ))}
        </div>
      </div>
    )
  }

  const renderNotesHistoryTab = () => {
    if (notesHistoryLoading) return <LoadingState />
    if (notesHistoryError)
      return <ErrorState message={notesHistoryError.message} />
    if (!notesHistory?.data?.length)
      return <EmptyState message="No Notes history found" />

    return (
      <div className="space-y-4">
        {notesHistory?.data?.map((note, index) => (
          <Card key={index} className="shadow-lg border">
            <CardContent className="flex p-2 m-0">
              <div className="w-[12%] pr-1 border-r border-gray-200 flex flex-col items-center justify-center gap-1">
                <Typography variant="subtitle2" className="font-semibold">
                  {dayjs(note?.appointmentDate).format('DD-MM-YYYY')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <Chip
                    label={note?.type}
                    size="small"
                    className={
                      note?.type.toLowerCase() === 'consultation'
                        ? 'bg-orange-500 text-white'
                        : 'bg-green-500 text-white'
                    }
                  />
                </Typography>
              </div>
              <div className="w-[88%] pl-4">
                <Typography variant="body2" className="text-gray-700">
                  {/* {note?.notes} */}
                  <RichText
                    value={note?.notes || 'No Notes Provided'}
                    readOnly={true}
                  />
                </Typography>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderPaymentHistoryTab = () => {
    if (paymentHistoryLoading) return <LoadingState />
    if (paymentHistoryError)
      return <ErrorState message={paymentHistoryError.message} />
    if (!paymentHistory?.data?.length)
      return <EmptyState message="No payment history found" />

    return (
      <PaymentHistoryTab
        data={paymentHistory.data}
        patientLabel={
          patient?.Name || patient?.patientName || patient?.patientId
        }
      />
    )
  }

  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment)
    setShowAppointmentDetail(true)
  }

  const handleBackToHistory = () => {
    setShowAppointmentDetail(false)
    setSelectedAppointment(null)
  }

  return (
    <div key={patient?.patientId}>
      {/* <Button
        variant="outlined"
        className="capitalize"
        onClick={handleOpenModal}
      >
        Patient History
      </Button> */}
      <Modal
        uniqueKey={patient?.patientId + 'History'}
        closeOnOutsideClick={false}
        maxWidth="lg"
        onClose={handleCloseModal}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold">
              {showAppointmentDetail
                ? 'Appointment Details'
                : 'Patient History'}
            </span>

            {showAppointmentDetail ? (
              <div>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleBackToHistory}
                  className="mr-2"
                >
                  Back
                </Button>
                {/* <Button variant="outlined" color="error" onClick={handleCloseModal}>
                  Close
                </Button> */}
              </div>
            ) : (
              <IconButton onClick={handleCloseModal}>
                <Close />
              </IconButton>
            )}
          </div>

          {/* Slide transition between patient history and appointment details */}
          <div className="relative h-[70vh] max-h-[70vh] min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain">
            <div
              className={`transition-all duration-300 ${
                showAppointmentDetail
                  ? 'translate-x-[-100%] absolute w-full'
                  : 'translate-x-0'
              }`}
            >
              {/* Patient History Content */}
              {visitsLoading ? (
                <LoadingState />
              ) : visitsError ? (
                <ErrorState message={visitsError.message} />
              ) : (
                <>
                  <FormControl className="m-4 min-w-[230px]">
                    <InputLabel id="visit-select-label">Visit</InputLabel>
                    <Select
                      value={selectedVisit || ''}
                      onChange={(e) => setSelectedVisit(e.target.value)}
                      label="Visit"
                      labelId="visit-select-label"
                    >
                      {visits?.data?.visitDetails?.map((visit) => (
                        <MenuItem
                          key={visit.visitId}
                          value={visit.visitId}
                          sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: 'space-between',
                          }}
                        >
                          <span className="font-medium mr-3">
                            {visit?.visitType}
                          </span>
                          <span className="text-gray-600 text-xs mr-3 ">
                            {dayjs(visit.visitDate).format('DD-MM-YYYY')}
                          </span>
                          {visit?.isActive && (
                            <span className="text-green-600 text-xs ">
                              active{' '}
                            </span>
                          )}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                      value={activeTab}
                      onChange={(e, v) => {
                        setActiveTab(v)
                      }}
                    >
                      <Tab label="Embryology" />
                      <Tab label="Consultations" />
                      <Tab label="Treatments" />
                      <Tab label="INVESTIGATIONS" />
                      <Tab label="Notes" />
                      {hasReadAccess && <Tab label="Payment History" />}
                    </Tabs>
                  </Box>

                  <div className="mt-4 h-[330px] overflow-y-auto">
                    {activeTab === 0 && renderEmbryologyTab()}
                    {activeTab === 1 && renderConsultationsTab()}
                    {activeTab === 2 && renderTreatmentsTab()}
                    {activeTab === 3 && renderInvestigationTab()}
                    {activeTab === 4 && renderNotesHistoryTab()}
                    {activeTab === 5 &&
                      hasReadAccess &&
                      renderPaymentHistoryTab()}
                  </div>
                </>
              )}
            </div>

            {/* Appointment Detail Slide */}
            <div
              className={`transition-all duration-300 ${
                showAppointmentDetail
                  ? 'translate-x-0'
                  : 'translate-x-[100%] absolute w-full'
              }`}
            >
              {selectedAppointment && (
                <AppointmentDetail
                  appointmentId={selectedAppointment.appointmentId}
                  type={selectedAppointment.type}
                  onClose={handleBackToHistory}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Dialog
        fullScreen
        open={!!selectedInvestigationTest}
        onClose={() => setSelectedInvestigationTest(null)}
        PaperProps={{
          sx: { display: 'flex', flexDirection: 'column' },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" component="span">
            Lab report
            {selectedInvestigationTest?.labTestName
              ? ` — ${selectedInvestigationTest.labTestName}`
              : ''}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setSelectedInvestigationTest(null)}
            edge="end"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            p: { xs: 1, sm: 2 },
            overflow: 'auto',
            bgcolor: 'grey.50',
          }}
        >
          {investigationReportLoading && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          )}
          {investigationReportError && (
            <Alert severity="error" sx={{ my: 2 }}>
              {investigationReportError.message}
            </Alert>
          )}
          {!investigationReportLoading &&
            !investigationReportError &&
            (investigationReportData == null ||
            investigationReportData === '' ? (
              <DialogContentText color="text.secondary">
                No report uploaded for this test yet.
              </DialogContentText>
            ) : typeof investigationReportData === 'string' &&
              (investigationReportData.includes('.pdf') ||
                investigationReportData.startsWith('http')) ? (
              <Box
                component="iframe"
                title="Lab report"
                src={investigationReportData}
                sx={{
                  flex: 1,
                  width: '100%',
                  minHeight: 'calc(100vh - 72px)',
                  border: 0,
                  bgcolor: 'white',
                }}
              />
            ) : (
              <Box
                className="lab-report-preview"
                sx={{
                  ...labReportPreviewSx,
                  flex: 1,
                  width: '100%',
                  bgcolor: 'white',
                  borderRadius: 1,
                  p: 2,
                  '& .ql-editor img:not([alt="Hospital Logo"])': {
                    maxWidth: '100% !important',
                    width: 'auto !important',
                    height: 'auto !important',
                  },
                }}
              >
                <RichText
                  value={normalizeLabReportHtmlForPreview(
                    String(investigationReportData),
                  )}
                  readOnly={true}
                />
              </Box>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PatientHistory
