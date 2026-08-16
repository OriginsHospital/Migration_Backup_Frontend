import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAllOrders,
  getAllDepartments,
  getAllVendors,
  getAllVendorsByDepartmentId,
  createNewOrder,
  getAllPayments,
  createPayment,
  updatePaymentFiles,
} from '@/constants/apis'
import { useSelector, useDispatch } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import {
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Typography,
  MenuItem,
  Autocomplete,
  Chip,
  Grid,
  LinearProgress,
  Divider,
  Paper,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  Menu,
} from '@mui/material'
import dayjs from 'dayjs'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { DatePicker } from '@mui/x-date-pickers'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import {
  Close,
  Visibility,
  Download,
  FileDownload,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Payment,
  AccountBalance,
  Business,
  Category,
  Assessment,
  CalendarToday,
  Store,
  ArrowUpward,
  ArrowDownward,
  Remove,
  CloudUpload,
  FilterList,
} from '@mui/icons-material'
import { Pie, Bar, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js'
import JSZip from 'jszip'
import { exportReport } from '@/utils/reportExport'

// Register Chart.js components
ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
)

// Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>
)

// Always use the desktop popper so date pickers never mount a full-screen MUI Modal.
const DATE_PICKER_DESKTOP_QUERY = '@media (min-width: 0px)'

function PaymentsPage() {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const modal = useSelector((store) => store.modal)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState(0)
  const [invoiceUrl, setInvoiceUrl] = useState(null)
  const [receiptUrl, setReceiptUrl] = useState(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState(null)
  const [currentFilters, setCurrentFilters] = useState({})
  const [filteredPayments, setFilteredPayments] = useState([])
  const [isDownloadingInvoices, setIsDownloadingInvoices] = useState(false)
  const [isDownloadingReceipts, setIsDownloadingReceipts] = useState(false)
  const [filterAnchorEl, setFilterAnchorEl] = useState(null)
  const [filterValues, setFilterValues] = useState({})
  const [uploadingPaymentId, setUploadingPaymentId] = useState(null)
  const [uploadingFileType, setUploadingFileType] = useState(null)
  const [reportFilters, setReportFilters] = useState({
    branchId: '',
    departmentId: '',
    vendorId: '',
    amount: '',
    fromDate: null,
    toDate: null,
  })
  const [createSearchText, setCreateSearchText] = useState('')
  const [summarySearchText, setSummarySearchText] = useState('')
  const [reportSearchText, setReportSearchText] = useState('')
  const fileInputRefs = useRef({})
  const modalJustOpenedRef = useRef(false)

  useEffect(() => {
    return () => {
      dispatch(closeModal())
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.body.classList.remove('MuiModal-open')
    }
  }, [dispatch])

  // Fetch payments data
  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['allPayments'],
    queryFn: () => getAllPayments(userDetails?.accessToken),
  })

  const { data: reportData, isLoading: isReportLoading } = useQuery({
    queryKey: [
      'paymentsReportData',
      reportFilters.branchId,
      reportFilters.departmentId,
      reportFilters.vendorId,
      reportFilters.amount,
      reportFilters.fromDate
        ? dayjs(reportFilters.fromDate).format('YYYY-MM-DD')
        : null,
      reportFilters.toDate
        ? dayjs(reportFilters.toDate).format('YYYY-MM-DD')
        : null,
    ],
    enabled: activeTab === 2,
    queryFn: () =>
      getAllPayments(userDetails?.accessToken, {
        branchId: reportFilters.branchId || undefined,
        departmentId: reportFilters.departmentId || undefined,
        vendorId: reportFilters.vendorId || undefined,
        amount: reportFilters.amount || undefined,
        fromDate: reportFilters.fromDate
          ? dayjs(reportFilters.fromDate).format('YYYY-MM-DD')
          : undefined,
        toDate: reportFilters.toDate
          ? dayjs(reportFilters.toDate).format('YYYY-MM-DD')
          : undefined,
      }),
  })

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['allDepartments'],
    queryFn: () => getAllDepartments(userDetails?.accessToken),
  })

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ['allVendors'],
    queryFn: () => getAllVendors(userDetails?.accessToken),
  })

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    branchId: '',
    departmentId: '',
    vendorId: '',
    amount: '',
    paymentDate: dayjs().format('YYYY-MM-DD'),
    invoiceDate: dayjs().format('YYYY-MM-DD'),
    invoiceFile: null,
    receiptFile: null,
  })

  // Get vendors by department
  const { data: getVendorsByDepartment } = useQuery({
    queryKey: ['getVendorsByDepartment', paymentForm?.departmentId],
    queryFn: () =>
      getAllVendorsByDepartmentId(
        userDetails?.accessToken,
        paymentForm?.departmentId,
      ),
    enabled: !!paymentForm?.departmentId,
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setPaymentForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'departmentId') {
      setPaymentForm((prev) => ({ ...prev, vendorId: '' }))
    }
  }

  const handleFileChange = (field, event) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: event.target.files[0],
    }))
  }

  const viewInvoice = useCallback(
    (url) => {
      if (!url) {
        toast.error('Invoice URL not available', toastconfig)
        return
      }
      try {
        modalJustOpenedRef.current = true
        setInvoiceUrl(url)
        dispatch(openModal('viewInvoiceModal'))
        setTimeout(() => {
          modalJustOpenedRef.current = false
        }, 300)
      } catch (error) {
        console.error('Error opening invoice modal:', error)
        toast.error('Failed to open invoice. Please try again.', toastconfig)
        modalJustOpenedRef.current = false
      }
    },
    [dispatch],
  )

  const viewReceipt = useCallback(
    (url) => {
      if (!url) {
        toast.error('Receipt URL not available', toastconfig)
        return
      }
      try {
        modalJustOpenedRef.current = true
        setReceiptUrl(url)
        dispatch(openModal('viewReceiptModal'))
        setTimeout(() => {
          modalJustOpenedRef.current = false
        }, 300)
      } catch (error) {
        console.error('Error opening receipt modal:', error)
        toast.error('Failed to open receipt. Please try again.', toastconfig)
        modalJustOpenedRef.current = false
      }
    },
    [dispatch],
  )

  const downloadInvoice = (invoiceUrl, fileName) => {
    if (invoiceUrl) {
      const link = document.createElement('a')
      link.href = invoiceUrl
      link.download = fileName || 'invoice.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      if (document.body.contains(link)) {
        try {
          document.body.removeChild(link)
        } catch (error) {
          // Link might already be removed
        }
      }
    }
  }

  const downloadReceipt = (receiptUrl, fileName) => {
    if (receiptUrl) {
      const link = document.createElement('a')
      link.href = receiptUrl
      link.download = fileName || 'receipt.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      if (document.body.contains(link)) {
        try {
          document.body.removeChild(link)
        } catch (error) {
          // Link might already be removed
        }
      }
    }
  }

  // Get filtered payments data based on current filters
  const getFilteredPayments = () => {
    // Use filteredPayments if available (from onRowsChange), which represents the current filtered view
    // If no filters are applied, filteredPayments will be the same as paymentsData
    if (filteredPayments.length > 0) {
      return filteredPayments
    }
    // Fallback: if filters exist but filteredPayments is empty, apply filters manually
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      return filterData(paymentsData || [], currentFilters)
    }
    // No filters applied, return all data
    return paymentsData || []
  }

  // Handle filter changes from FilteredDataGrid
  const handleFilterChange = (filters) => {
    setCurrentFilters(filters)
    setFilterValues(filters)
  }

  // Sync filterValues with currentFilters on mount
  useEffect(() => {
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      setFilterValues(currentFilters)
    }
  }, [])

  // Handle rows change from FilteredDataGrid (gets filtered rows)
  const handleRowsChange = (rows) => {
    setFilteredPayments(rows)
  }

  // Download all invoices as ZIP
  const downloadAllInvoices = async () => {
    const filteredPayments = getFilteredPayments()
    const paymentsWithInvoices = filteredPayments.filter(
      (payment) => payment.invoiceUrl,
    )

    if (paymentsWithInvoices.length === 0) {
      toast.error('No invoices found to download', toastconfig)
      return
    }

    setIsDownloadingInvoices(true)
    try {
      const zip = new JSZip()
      const downloadPromises = paymentsWithInvoices.map(
        async (payment, index) => {
          try {
            const response = await fetch(payment.invoiceUrl)
            if (!response.ok)
              throw new Error(`Failed to fetch invoice ${index + 1}`)
            const blob = await response.blob()
            const fileName = `invoice_${payment.paymentId || payment.id || index}.pdf`
            zip.file(fileName, blob)
          } catch (error) {
            console.error(`Error downloading invoice ${index + 1}:`, error)
          }
        },
      )

      await Promise.all(downloadPromises)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `all_invoices_${dayjs().format('DD-MM-YYYY')}.zip`
      document.body.appendChild(link)
      link.click()
      if (document.body.contains(link)) {
        try {
          document.body.removeChild(link)
        } catch (error) {
          // Link might already be removed
        }
      }
      window.URL.revokeObjectURL(url)

      toast.success(
        `Downloaded ${paymentsWithInvoices.length} invoice(s)`,
        toastconfig,
      )
    } catch (error) {
      console.error('Error creating ZIP:', error)
      toast.error('Failed to download invoices', toastconfig)
    } finally {
      setIsDownloadingInvoices(false)
    }
  }

  // Download all receipts as ZIP
  const downloadAllReceipts = async () => {
    const filteredPayments = getFilteredPayments()
    const paymentsWithReceipts = filteredPayments.filter(
      (payment) => payment.receiptUrl,
    )

    if (paymentsWithReceipts.length === 0) {
      toast.error('No receipts found to download', toastconfig)
      return
    }

    setIsDownloadingReceipts(true)
    try {
      const zip = new JSZip()
      const downloadPromises = paymentsWithReceipts.map(
        async (payment, index) => {
          try {
            const response = await fetch(payment.receiptUrl)
            if (!response.ok)
              throw new Error(`Failed to fetch receipt ${index + 1}`)
            const blob = await response.blob()
            const fileName = `receipt_${payment.paymentId || payment.id || index}.pdf`
            zip.file(fileName, blob)
          } catch (error) {
            console.error(`Error downloading receipt ${index + 1}:`, error)
          }
        },
      )

      await Promise.all(downloadPromises)

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `all_receipts_${dayjs().format('DD-MM-YYYY')}.zip`
      document.body.appendChild(link)
      link.click()
      if (document.body.contains(link)) {
        try {
          document.body.removeChild(link)
        } catch (error) {
          // Link might already be removed
        }
      }
      window.URL.revokeObjectURL(url)

      toast.success(
        `Downloaded ${paymentsWithReceipts.length} receipt(s)`,
        toastconfig,
      )
    } catch (error) {
      console.error('Error creating ZIP:', error)
      toast.error('Failed to download receipts', toastconfig)
    } finally {
      setIsDownloadingReceipts(false)
    }
  }

  const mapPaymentRows = useCallback((rows) => {
    return (
      rows?.map((payment) => {
        const invoiceDate = payment.invoiceDate || null
        return {
          id: payment.id,
          paymentId: payment.id,
          branch: payment.branch || '',
          department: payment.department || '',
          vendor: payment.vendor || '',
          amount: payment.amount || 0,
          paymentDate: payment.paymentDate,
          invoiceDate: invoiceDate,
          invoiceUrl: payment.invoiceUrl,
          receiptUrl: payment.receiptUrl,
        }
      }) || []
    )
  }, [])

  // Transform payments data for display
  const paymentsData = mapPaymentRows(data?.data)
  const reportPaymentsData = mapPaymentRows(reportData?.data)

  // Initialize filteredPayments when paymentsData is available
  useEffect(() => {
    if (paymentsData && paymentsData.length > 0) {
      // Only set if filteredPayments is empty (initial load)
      setFilteredPayments((prev) => (prev.length === 0 ? paymentsData : prev))
    }
  }, [paymentsData])

  // Filter payments based on invoice and receipt upload status
  // Summary tab: payments with both invoice and receipt uploaded
  const summaryTabPayments = useMemo(() => {
    return paymentsData.filter(
      (payment) => payment.invoiceUrl && payment.receiptUrl,
    )
  }, [paymentsData])

  // Create tab: payments without both invoice and receipt uploaded
  const dataTabPayments = useMemo(() => {
    return paymentsData.filter(
      (payment) => !payment.invoiceUrl || !payment.receiptUrl,
    )
  }, [paymentsData])

  const searchPayments = useCallback((rows, searchText) => {
    const term = (searchText || '').trim().toLowerCase()
    if (!term) return rows || []
    return (rows || []).filter((row) => {
      const branch = String(row?.branch || '').toLowerCase()
      const department = String(row?.department || '').toLowerCase()
      const vendor = String(row?.vendor || '').toLowerCase()
      return (
        branch.includes(term) ||
        department.includes(term) ||
        vendor.includes(term)
      )
    })
  }, [])

  const createTabFilteredPayments = useMemo(
    () => searchPayments(dataTabPayments, createSearchText),
    [dataTabPayments, createSearchText, searchPayments],
  )

  const summaryTabFilteredPayments = useMemo(
    () => searchPayments(summaryTabPayments, summarySearchText),
    [summaryTabPayments, summarySearchText, searchPayments],
  )

  const reportTabFilteredPayments = useMemo(
    () => searchPayments(reportPaymentsData, reportSearchText),
    [reportPaymentsData, reportSearchText, searchPayments],
  )

  // Mutation for updating payment files
  const updatePaymentFilesMutation = useMutation({
    mutationFn: async ({ paymentId, invoiceFile, receiptFile }) => {
      const formData = new FormData()
      if (invoiceFile) {
        formData.append('invoiceFile', invoiceFile)
      }
      if (receiptFile) {
        formData.append('receiptFile', receiptFile)
      }
      return await updatePaymentFiles(
        userDetails?.accessToken,
        paymentId,
        formData,
      )
    },
    onSuccess: (res) => {
      if (res?.status === 200) {
        toast.success(
          res?.message || 'Files uploaded successfully',
          toastconfig,
        )
        queryClient.invalidateQueries(['allPayments'])
        setUploadingPaymentId(null)
        setUploadingFileType(null)
      } else {
        toast.error(res?.message || 'Failed to upload files', toastconfig)
        setUploadingPaymentId(null)
        setUploadingFileType(null)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload files', toastconfig)
      setUploadingPaymentId(null)
      setUploadingFileType(null)
    },
  })

  // Handle file upload from table
  const handleTableFileUpload = useCallback(
    (paymentId, fileType, file) => {
      if (!file) return

      setUploadingPaymentId(paymentId)
      setUploadingFileType(fileType)

      const payload = {
        paymentId,
        [fileType === 'invoice' ? 'invoiceFile' : 'receiptFile']: file,
      }

      updatePaymentFilesMutation.mutate(payload)
    },
    [updatePaymentFilesMutation],
  )

  const columns = useMemo(
    () => [
      {
        field: 'branch',
        headerName: 'Branch',
        flex: 0.8,
        minWidth: 70,
        cellClassName: 'cell-text',
        renderCell: ({ row }) => (
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {row.branch || '-'}
          </Box>
        ),
      },
      {
        field: 'paymentDate',
        headerName: 'Payment Date',
        flex: 1,
        minWidth: 110,
        cellClassName: 'cell-text',
        renderCell: ({ row }) => (
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {row.paymentDate
              ? dayjs(row.paymentDate).format('DD-MM-YYYY')
              : '-'}
          </Box>
        ),
      },
      {
        field: 'invoiceDate',
        headerName: 'Invoice Date',
        flex: 1,
        minWidth: 110,
        cellClassName: 'cell-text',
        renderCell: ({ row }) => {
          if (!row) return '-'

          // Try multiple field name variations
          const invoiceDate =
            row.invoiceDate || row.invoice_date || row.InvoiceDate || null

          if (!invoiceDate) return '-'

          try {
            const date = dayjs(invoiceDate)
            if (!date.isValid()) return '-'
            return date.format('DD-MM-YYYY')
          } catch (error) {
            return '-'
          }
        },
      },
      {
        field: 'department',
        headerName: 'Department',
        flex: 1.2,
        minWidth: 100,
        cellClassName: 'cell-text',
        renderCell: ({ row }) => (
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {row.department || '-'}
          </Box>
        ),
      },
      {
        field: 'vendor',
        headerName: 'Vendor',
        flex: 1.5,
        minWidth: 120,
        cellClassName: 'cell-text',
        renderCell: ({ row }) => (
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}
          >
            {row.vendor || '-'}
          </Box>
        ),
      },
      {
        field: 'amount',
        headerName: 'Amount',
        flex: 1,
        minWidth: 100,
        align: 'right',
        headerAlign: 'right',
        cellClassName: 'cell-text',
        renderCell: ({ row }) => (
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              textAlign: 'right',
            }}
          >
            ₹{parseFloat(row.amount || 0).toLocaleString('en-IN')}
          </Box>
        ),
      },
      {
        field: 'invoiceReceipt',
        headerName: 'Upload',
        flex: 1.8,
        minWidth: 180,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => {
          const isUploading = uploadingPaymentId === row.paymentId
          const isUploadingInvoice =
            isUploading && uploadingFileType === 'invoice'
          const isUploadingReceipt =
            isUploading && uploadingFileType === 'receipt'

          // In Create tab (activeTab === 0), show upload buttons if files are missing
          // In Summary tab (activeTab === 1), show view buttons if files exist
          const showUploadButtons =
            activeTab === 0 && (!row.invoiceUrl || !row.receiptUrl)

          return (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {showUploadButtons ? (
                <>
                  {/* Invoice Upload/View Button */}
                  {!row.invoiceUrl ? (
                    <label htmlFor={`invoice-upload-${row.paymentId}`}>
                      <input
                        id={`invoice-upload-${row.paymentId}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleTableFileUpload(
                              row.paymentId,
                              'invoice',
                              file,
                            )
                          }
                          e.target.value = '' // Reset input
                        }}
                        disabled={isUploading}
                      />
                      <Stack
                        direction="column"
                        alignItems="center"
                        spacing={0.25}
                        sx={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
                      >
                        <IconButton
                          component="span"
                          size="small"
                          color="primary"
                          disabled={isUploading}
                          sx={{
                            p: 0.75,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                          title={
                            isUploadingInvoice
                              ? 'Uploading Invoice...'
                              : 'Upload Invoice'
                          }
                        >
                          {isUploadingInvoice ? (
                            <CircularProgress size={18} />
                          ) : (
                            <CloudUpload fontSize="small" />
                          )}
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            color: isUploading
                              ? 'text.disabled'
                              : 'text.secondary',
                            fontWeight: 500,
                            lineHeight: 1,
                          }}
                        >
                          Invoice
                        </Typography>
                      </Stack>
                    </label>
                  ) : (
                    <Stack
                      direction="column"
                      alignItems="center"
                      spacing={0.25}
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          viewInvoice(row.invoiceUrl)
                        }}
                        sx={{
                          p: 0.75,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        title="View Invoice"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          color: 'text.secondary',
                          fontWeight: 500,
                          lineHeight: 1,
                        }}
                      >
                        Invoice
                      </Typography>
                    </Stack>
                  )}

                  {/* Receipt Upload/View Button */}
                  {!row.receiptUrl ? (
                    <label htmlFor={`receipt-upload-${row.paymentId}`}>
                      <input
                        id={`receipt-upload-${row.paymentId}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleTableFileUpload(
                              row.paymentId,
                              'receipt',
                              file,
                            )
                          }
                          e.target.value = '' // Reset input
                        }}
                        disabled={isUploading}
                      />
                      <Stack
                        direction="column"
                        alignItems="center"
                        spacing={0.25}
                        sx={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
                      >
                        <IconButton
                          component="span"
                          size="small"
                          color="primary"
                          disabled={isUploading}
                          sx={{
                            p: 0.75,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                          title={
                            isUploadingReceipt
                              ? 'Uploading Receipt...'
                              : 'Upload Receipt'
                          }
                        >
                          {isUploadingReceipt ? (
                            <CircularProgress size={18} />
                          ) : (
                            <CloudUpload fontSize="small" />
                          )}
                        </IconButton>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.65rem',
                            color: isUploading
                              ? 'text.disabled'
                              : 'text.secondary',
                            fontWeight: 500,
                            lineHeight: 1,
                          }}
                        >
                          Receipt
                        </Typography>
                      </Stack>
                    </label>
                  ) : (
                    <Stack
                      direction="column"
                      alignItems="center"
                      spacing={0.25}
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          viewReceipt(row.receiptUrl)
                        }}
                        sx={{
                          p: 0.75,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                        title="View Receipt"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.65rem',
                          color: 'text.secondary',
                          fontWeight: 500,
                          lineHeight: 1,
                        }}
                      >
                        Receipt
                      </Typography>
                    </Stack>
                  )}
                </>
              ) : (
                <>
                  {/* Summary tab: Show view buttons if files exist */}
                  <Stack direction="column" alignItems="center" spacing={0.25}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        viewInvoice(row.invoiceUrl)
                      }}
                      disabled={!row.invoiceUrl}
                      sx={{
                        p: 0.75,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      title="View Invoice"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        color: !row.invoiceUrl
                          ? 'text.disabled'
                          : 'text.secondary',
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      Invoice
                    </Typography>
                  </Stack>
                  <Stack direction="column" alignItems="center" spacing={0.25}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        viewReceipt(row.receiptUrl)
                      }}
                      disabled={!row.receiptUrl}
                      sx={{
                        p: 0.75,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      title="View Receipt"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        color: !row.receiptUrl
                          ? 'text.disabled'
                          : 'text.secondary',
                        fontWeight: 500,
                        lineHeight: 1,
                      }}
                    >
                      Receipt
                    </Typography>
                  </Stack>
                </>
              )}
            </Stack>
          )
        },
      },
      {
        field: 'actions',
        headerName: 'Download',
        flex: 1.5,
        minWidth: 140,
        align: 'center',
        headerAlign: 'center',
        renderCell: ({ row }) => (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Stack direction="column" alignItems="center" spacing={0.25}>
              <IconButton
                size="small"
                color="primary"
                onClick={() =>
                  downloadInvoice(
                    row.invoiceUrl,
                    `invoice_${row.paymentId}.pdf`,
                  )
                }
                disabled={!row.invoiceUrl}
                sx={{
                  p: 0.75,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                title="Download Invoice"
              >
                <FileDownload fontSize="small" />
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  color: !row.invoiceUrl ? 'text.disabled' : 'text.secondary',
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                Invoice
              </Typography>
            </Stack>
            <Stack direction="column" alignItems="center" spacing={0.25}>
              <IconButton
                size="small"
                color="primary"
                onClick={() =>
                  downloadReceipt(
                    row.receiptUrl,
                    `receipt_${row.paymentId}.pdf`,
                  )
                }
                disabled={!row.receiptUrl}
                sx={{
                  p: 0.75,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
                title="Download Receipt"
              >
                <FileDownload fontSize="small" />
              </IconButton>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  color: !row.receiptUrl ? 'text.disabled' : 'text.secondary',
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                Receipt
              </Typography>
            </Stack>
          </Stack>
        ),
      },
    ],
    [
      activeTab,
      uploadingPaymentId,
      uploadingFileType,
      handleTableFileUpload,
      viewInvoice,
      viewReceipt,
      downloadInvoice,
      downloadReceipt,
    ],
  )

  const reportColumns = useMemo(
    () => [
      {
        field: 'branch',
        headerName: 'Branch',
        flex: 0.8,
        minWidth: 100,
      },
      {
        field: 'paymentDate',
        headerName: 'Payment Date',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) =>
          row.paymentDate ? dayjs(row.paymentDate).format('DD-MM-YYYY') : '-',
      },
      {
        field: 'invoiceDate',
        headerName: 'Invoice Date',
        flex: 1,
        minWidth: 130,
        renderCell: ({ row }) =>
          row.invoiceDate ? dayjs(row.invoiceDate).format('DD-MM-YYYY') : '-',
      },
      {
        field: 'department',
        headerName: 'Department',
        flex: 1.2,
        minWidth: 130,
      },
      {
        field: 'vendor',
        headerName: 'Vendor',
        flex: 1.5,
        minWidth: 150,
      },
      {
        field: 'amount',
        headerName: 'Amount',
        flex: 1,
        minWidth: 120,
        align: 'right',
        headerAlign: 'right',
        renderCell: ({ row }) =>
          `₹${parseFloat(row.amount || 0).toLocaleString('en-IN')}`,
      },
    ],
    [],
  )
  const reportRowsForExport = useMemo(() => {
    // Always allow export: if no data, export headers with a blank row.
    return reportTabFilteredPayments && reportTabFilteredPayments.length > 0
      ? reportTabFilteredPayments
      : [{}]
  }, [reportTabFilteredPayments])

  const customFilters = [
    {
      field: 'branch',
      label: 'Branch',
      type: 'select',
      options: paymentsData
        ? [...new Set(paymentsData.map((row) => row.branch))]
        : [],
    },
    {
      field: 'department',
      label: 'Department',
      type: 'select',
      options: paymentsData
        ? [...new Set(paymentsData.map((row) => row.department))]
        : [],
    },
  ]

  const getUniqueValues = (field) => {
    if (!paymentsData) return []

    if (field === 'branch') {
      return [...new Set(paymentsData.map((row) => row.branch))]
    }

    if (field === 'department') {
      return [...new Set(paymentsData.map((row) => row.department))]
    }

    return []
  }

  const filterData = (data, filters) => {
    if (!data) return []

    return data.filter((row) => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue || filterValue === null) return true

        const { prefix, value } = filterValue

        if (!value || (Array.isArray(value) && value.length === 0)) return true

        const selectedValues = Array.isArray(value) ? value : [value]

        switch (field) {
          case 'branch': {
            if (prefix === 'IN') {
              return selectedValues.includes(row.branch)
            } else if (prefix === 'NOT IN') {
              return !selectedValues.includes(row.branch)
            }
            return true
          }
          case 'department': {
            if (prefix === 'IN') {
              return selectedValues.includes(row.department)
            } else if (prefix === 'NOT IN') {
              return !selectedValues.includes(row.department)
            }
            return true
          }
          default:
            return true
        }
      })
    })
  }

  // Advanced Summary calculations with useMemo for performance
  const summaryData = useMemo(() => {
    if (!paymentsData || paymentsData.length === 0) {
      return {
        totalPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        byDepartment: {},
        byBranch: {},
        byVendor: {},
        monthlyTrend: {},
        weeklyTrend: {},
        recentPayments: [],
        topVendors: [],
        departmentPercentages: {},
        branchPercentages: {},
        thisMonthTotal: 0,
        lastMonthTotal: 0,
        monthOverMonthChange: 0,
        thisWeekTotal: 0,
        lastWeekTotal: 0,
        weekOverWeekChange: 0,
      }
    }

    const totalAmount = paymentsData.reduce(
      (sum, payment) => sum + (parseFloat(payment.amount) || 0),
      0,
    )
    const totalPayments = paymentsData.length
    const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0

    // By Department
    const byDepartment = paymentsData.reduce((acc, payment) => {
      const dept = payment.department || 'Unknown'
      acc[dept] = (acc[dept] || 0) + (parseFloat(payment.amount) || 0)
      return acc
    }, {})

    // By Branch
    const byBranch = paymentsData.reduce((acc, payment) => {
      const branch = payment.branch || 'Unknown'
      acc[branch] = (acc[branch] || 0) + (parseFloat(payment.amount) || 0)
      return acc
    }, {})

    // By Vendor
    const byVendor = paymentsData.reduce((acc, payment) => {
      const vendor = payment.vendor || 'Unknown'
      acc[vendor] = (acc[vendor] || 0) + (parseFloat(payment.amount) || 0)
      return acc
    }, {})

    // Monthly Trend
    const monthlyTrend = paymentsData.reduce((acc, payment) => {
      if (payment.paymentDate) {
        const month = dayjs(payment.paymentDate).format('MMM YYYY')
        acc[month] = (acc[month] || 0) + (parseFloat(payment.amount) || 0)
      }
      return acc
    }, {})

    // Weekly Trend
    const weeklyTrend = paymentsData.reduce((acc, payment) => {
      if (payment.paymentDate) {
        const week = `Week ${dayjs(payment.paymentDate).week()} - ${dayjs(payment.paymentDate).format('MMM YYYY')}`
        acc[week] = (acc[week] || 0) + (parseFloat(payment.amount) || 0)
      }
      return acc
    }, {})

    // Recent Payments (last 5)
    const recentPayments = [...paymentsData]
      .sort(
        (a, b) =>
          dayjs(b.paymentDate).valueOf() - dayjs(a.paymentDate).valueOf(),
      )
      .slice(0, 5)

    // Top Vendors
    const topVendors = Object.entries(byVendor)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Department Percentages
    const departmentPercentages = Object.entries(byDepartment).reduce(
      (acc, [dept, amount]) => {
        acc[dept] = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        return acc
      },
      {},
    )

    // Branch Percentages
    const branchPercentages = Object.entries(byBranch).reduce(
      (acc, [branch, amount]) => {
        acc[branch] = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        return acc
      },
      {},
    )

    // This Month vs Last Month
    const now = dayjs()
    const thisMonthStart = now.startOf('month')
    const lastMonthStart = now.subtract(1, 'month').startOf('month')
    const lastMonthEnd = now.subtract(1, 'month').endOf('month')

    const thisMonthTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isAfter(thisMonthStart.subtract(1, 'day')),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const lastMonthTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isBetween(
            lastMonthStart,
            lastMonthEnd,
            null,
            '[]',
          ),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const monthOverMonthChange =
      lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : 0

    // This Week vs Last Week
    const thisWeekStart = now.startOf('week')
    const lastWeekStart = now.subtract(1, 'week').startOf('week')
    const lastWeekEnd = now.subtract(1, 'week').endOf('week')

    const thisWeekTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isAfter(thisWeekStart.subtract(1, 'day')),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const lastWeekTotal = paymentsData
      .filter(
        (p) =>
          p.paymentDate &&
          dayjs(p.paymentDate).isBetween(
            lastWeekStart,
            lastWeekEnd,
            null,
            '[]',
          ),
      )
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const weekOverWeekChange =
      lastWeekTotal > 0
        ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
        : 0

    return {
      totalPayments,
      totalAmount,
      averageAmount,
      byDepartment,
      byBranch,
      byVendor,
      monthlyTrend,
      weeklyTrend,
      recentPayments,
      topVendors,
      departmentPercentages,
      branchPercentages,
      thisMonthTotal,
      lastMonthTotal,
      monthOverMonthChange,
      thisWeekTotal,
      lastWeekTotal,
      weekOverWeekChange,
    }
  }, [paymentsData])

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: '#f5f7fa',
        minHeight: '100vh',
      }}
    >
      <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48,
                fontSize: '0.9375rem',
              },
            }}
          >
            <Tab label="Create" />
            <Tab label="Summary" />
            <Tab label="Report" />
          </Tabs>
        </Box>

        {/* CREATE TAB */}
        <TabPanel value={activeTab} index={0}>
          <CardContent sx={{ p: 3 }}>
            {/* Payment Entry Form */}
            <Card
              sx={{
                mb: 3,
                p: 2,
                bgcolor: '#f8f9fa',
                border: '1px solid #e0e0e0',
              }}
            >
              <CreatePaymentForm
                paymentForm={paymentForm}
                setPaymentForm={setPaymentForm}
                handleInputChange={handleInputChange}
                handleFileChange={handleFileChange}
                getVendorsByDepartment={getVendorsByDepartment}
                dropdowns={dropdowns}
              />
            </Card>

            {isError && (
              <div className="text-red-500 mb-4">{error.message}</div>
            )}

            {/* Filters and Action Buttons Row */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 3,
                flexWrap: 'wrap',
              }}
            >
              {/* Filter Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  size="small"
                  color={
                    Object.keys(currentFilters).filter(
                      (key) => currentFilters[key],
                    ).length > 0
                      ? 'primary'
                      : 'inherit'
                  }
                  sx={{ textTransform: 'none' }}
                >
                  Filters
                  {Object.keys(currentFilters).filter(
                    (key) => currentFilters[key],
                  ).length > 0 && (
                    <Chip
                      label={
                        Object.keys(currentFilters).filter(
                          (key) => currentFilters[key],
                        ).length
                      }
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Button>
                <Menu
                  anchorEl={filterAnchorEl}
                  open={Boolean(filterAnchorEl)}
                  onClose={() => setFilterAnchorEl(null)}
                  disableScrollLock
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <Box sx={{ p: 2, maxWidth: 500, minWidth: 300 }}>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {customFilters.map((filter) => (
                        <Box key={filter.field}>
                          <FormControl fullWidth size="small">
                            <InputLabel>{filter.label}</InputLabel>
                            <Select
                              multiple
                              MenuProps={{
                                disablePortal: true,
                                disableScrollLock: true,
                              }}
                              value={filterValues[filter.field]?.value || []}
                              label={filter.label}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setFilterValues((prev) => ({
                                  ...prev,
                                  [filter.field]: {
                                    prefix: 'IN',
                                    value: newValue,
                                  },
                                }))
                              }}
                              renderValue={(selected) => (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                  }}
                                >
                                  {selected.map((value) => (
                                    <Chip
                                      key={value}
                                      label={value}
                                      size="small"
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              {filter.options.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      ))}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      <Button
                        onClick={() => {
                          const clearedFilters = {}
                          customFilters.forEach((filter) => {
                            clearedFilters[filter.field] = null
                          })
                          setFilterValues({})
                          setCurrentFilters({})
                          handleFilterChange({})
                          setFilterAnchorEl(null)
                        }}
                        size="small"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={() => {
                          setCurrentFilters(filterValues)
                          handleFilterChange(filterValues)
                          setFilterAnchorEl(null)
                        }}
                        variant="contained"
                        size="small"
                      >
                        Apply
                      </Button>
                    </Box>
                  </Box>
                </Menu>
                <TextField
                  size="small"
                  placeholder="Search Branch / Department / Vendor"
                  value={createSearchText}
                  onChange={(e) => setCreateSearchText(e.target.value)}
                  sx={{ minWidth: 280 }}
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={downloadAllInvoices}
                  disabled={isDownloadingInvoices || isDownloadingReceipts}
                  sx={{ textTransform: 'none' }}
                >
                  {isDownloadingInvoices ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Downloading...
                    </>
                  ) : (
                    'Invoice'
                  )}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={downloadAllReceipts}
                  disabled={isDownloadingInvoices || isDownloadingReceipts}
                  sx={{ textTransform: 'none' }}
                >
                  {isDownloadingReceipts ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Downloading...
                    </>
                  ) : (
                    'Receipt'
                  )}
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                height: '70vh',
                width: '100%',
                overflow: 'hidden',
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-columnHeaders': {
                  padding: '0 12px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: '#f5f5f5',
                },
                '& .MuiDataGrid-columnHeader': {
                  padding: '8px 12px',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: '#fafafa',
                  },
                },
                '& .cell-text': {
                  fontSize: '0.875rem',
                },
              }}
            >
              <FilteredDataGrid
                rows={createTabFilteredPayments}
                getRowId={(row) => row.id}
                columns={columns}
                className="my-5 mx-2 py-3 bg-white"
                loading={isLoading}
                customFilters={customFilters}
                filterData={filterData}
                getUniqueValues={getUniqueValues}
                filters={currentFilters}
                onRowsChange={handleRowsChange}
                disableRowSelectionOnClick
                hideExport={true}
                autoHeight={false}
                disableColumnMenu
                disableDensitySelector
                disableColumnResize
                scrollbarSize={8}
                slots={{
                  toolbar: () => null,
                }}
                sx={{
                  '& .MuiDataGrid-main': {
                    overflowX: 'hidden',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    overflowX: 'hidden !important',
                  },
                  '& .MuiDataGrid-virtualScrollerContent': {
                    width: '100% !important',
                  },
                  '& .MuiDataGrid-toolbarContainer': {
                    display: 'none',
                  },
                }}
              />
            </Box>
          </CardContent>
        </TabPanel>

        {/* SUMMARY TAB - Enhanced */}
        <TabPanel value={activeTab} index={1}>
          <CardContent sx={{ p: 2.5 }}>
            {/* Filters and Action Buttons Row */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {/* Filter Button */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  size="small"
                  color={
                    Object.keys(currentFilters).filter(
                      (key) => currentFilters[key],
                    ).length > 0
                      ? 'primary'
                      : 'inherit'
                  }
                  sx={{ textTransform: 'none' }}
                >
                  Filters
                  {Object.keys(currentFilters).filter(
                    (key) => currentFilters[key],
                  ).length > 0 && (
                    <Chip
                      label={
                        Object.keys(currentFilters).filter(
                          (key) => currentFilters[key],
                        ).length
                      }
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Button>
                <Menu
                  anchorEl={filterAnchorEl}
                  open={Boolean(filterAnchorEl)}
                  onClose={() => setFilterAnchorEl(null)}
                  disableScrollLock
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                >
                  <Box sx={{ p: 2, maxWidth: 500, minWidth: 300 }}>
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      {customFilters.map((filter) => (
                        <Box key={filter.field}>
                          <FormControl fullWidth size="small">
                            <InputLabel>{filter.label}</InputLabel>
                            <Select
                              multiple
                              MenuProps={{
                                disablePortal: true,
                                disableScrollLock: true,
                              }}
                              value={filterValues[filter.field]?.value || []}
                              label={filter.label}
                              onChange={(e) => {
                                const newValue = e.target.value
                                setFilterValues((prev) => ({
                                  ...prev,
                                  [filter.field]: {
                                    prefix: 'IN',
                                    value: newValue,
                                  },
                                }))
                              }}
                              renderValue={(selected) => (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 0.5,
                                  }}
                                >
                                  {selected.map((value) => (
                                    <Chip
                                      key={value}
                                      label={value}
                                      size="small"
                                    />
                                  ))}
                                </Box>
                              )}
                            >
                              {filter.options.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      ))}
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      <Button
                        onClick={() => {
                          const clearedFilters = {}
                          customFilters.forEach((filter) => {
                            clearedFilters[filter.field] = null
                          })
                          setFilterValues({})
                          setCurrentFilters({})
                          handleFilterChange({})
                          setFilterAnchorEl(null)
                        }}
                        size="small"
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={() => {
                          setCurrentFilters(filterValues)
                          handleFilterChange(filterValues)
                          setFilterAnchorEl(null)
                        }}
                        variant="contained"
                        size="small"
                      >
                        Apply
                      </Button>
                    </Box>
                  </Box>
                </Menu>
                <TextField
                  size="small"
                  placeholder="Search Branch / Department / Vendor"
                  value={summarySearchText}
                  onChange={(e) => setSummarySearchText(e.target.value)}
                  sx={{ minWidth: 280 }}
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={downloadAllInvoices}
                  disabled={isDownloadingInvoices || isDownloadingReceipts}
                  sx={{ textTransform: 'none' }}
                >
                  {isDownloadingInvoices ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Downloading...
                    </>
                  ) : (
                    'Invoice'
                  )}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={downloadAllReceipts}
                  disabled={isDownloadingInvoices || isDownloadingReceipts}
                  sx={{ textTransform: 'none' }}
                >
                  {isDownloadingReceipts ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Downloading...
                    </>
                  ) : (
                    'Receipt'
                  )}
                </Button>
              </Box>
            </Box>

            <Box
              sx={{
                height: '70vh',
                width: '100%',
                mb: 3,
                overflow: 'hidden',
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-cell': {
                  padding: '8px 12px',
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-columnHeaders': {
                  padding: '0 12px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: '#f5f5f5',
                },
                '& .MuiDataGrid-columnHeader': {
                  padding: '8px 12px',
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: '#fafafa',
                  },
                },
                '& .cell-text': {
                  fontSize: '0.875rem',
                },
              }}
            >
              <FilteredDataGrid
                rows={summaryTabFilteredPayments}
                getRowId={(row) => row.id}
                columns={columns}
                className="my-5 mx-2 py-3 bg-white"
                loading={isLoading}
                customFilters={customFilters}
                filterData={filterData}
                getUniqueValues={getUniqueValues}
                filters={currentFilters}
                onRowsChange={handleRowsChange}
                disableRowSelectionOnClick
                hideExport={true}
                autoHeight={false}
                disableColumnMenu
                disableDensitySelector
                disableColumnResize
                scrollbarSize={8}
                slots={{
                  toolbar: () => null,
                }}
                sx={{
                  '& .MuiDataGrid-main': {
                    overflowX: 'hidden',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    overflowX: 'hidden !important',
                  },
                  '& .MuiDataGrid-virtualScrollerContent': {
                    width: '100% !important',
                  },
                  '& .MuiDataGrid-toolbarContainer': {
                    display: 'none',
                  },
                }}
              />
            </Box>

            <Typography
              variant="h5"
              fontWeight={700}
              sx={{ mb: 2.5, color: '#1976d2' }}
            >
              Payment Summary & Analytics
            </Typography>

            {/* KPI Cards Row */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        Total Payments
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {summaryData.totalPayments}
                      </Typography>
                    </Box>
                    <Payment sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        Total Amount
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ₹{summaryData.totalAmount.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    <AttachMoney sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        Average Payment
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ₹
                        {summaryData.averageAmount.toLocaleString('en-IN', {
                          maximumFractionDigits: 0,
                        })}
                      </Typography>
                    </Box>
                    <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card
                  sx={{
                    p: 2,
                    background:
                      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    height: '100%',
                    boxShadow: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -50,
                      right: -50,
                      width: 150,
                      height: 150,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ opacity: 0.9, mb: 0.5 }}
                      >
                        This Month
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        ₹{summaryData.thisMonthTotal.toLocaleString('en-IN')}
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                      >
                        {summaryData.monthOverMonthChange > 0 ? (
                          <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                        ) : summaryData.monthOverMonthChange < 0 ? (
                          <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                        ) : (
                          <Remove sx={{ fontSize: 16, mr: 0.5 }} />
                        )}
                        <Typography variant="caption" sx={{ opacity: 0.9 }}>
                          {Math.abs(summaryData.monthOverMonthChange).toFixed(
                            1,
                          )}
                          %
                        </Typography>
                      </Box>
                    </Box>
                    <CalendarToday sx={{ fontSize: 40, opacity: 0.8 }} />
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {/* Department Distribution Pie Chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Category sx={{ mr: 1, color: '#667eea' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Distribution by Department
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byDepartment).length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <Pie
                        data={{
                          labels: Object.keys(summaryData.byDepartment),
                          datasets: [
                            {
                              data: Object.values(summaryData.byDepartment),
                              backgroundColor: [
                                '#667eea',
                                '#f093fb',
                                '#4facfe',
                                '#43e97b',
                                '#fa709a',
                                '#fee140',
                                '#30cfd0',
                                '#a8edea',
                                '#fed6e3',
                                '#ffecd2',
                              ],
                              borderWidth: 2,
                              borderColor: '#fff',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                usePointStyle: true,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.label || ''
                                  const value = context.parsed || 0
                                  const total = context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0,
                                  )
                                  const percentage = (
                                    (value / total) *
                                    100
                                  ).toFixed(1)
                                  return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No department data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Branch Distribution Pie Chart */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Store sx={{ mr: 1, color: '#f5576c' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Distribution by Branch
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byBranch).length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <Pie
                        data={{
                          labels: Object.keys(summaryData.byBranch),
                          datasets: [
                            {
                              data: Object.values(summaryData.byBranch),
                              backgroundColor: [
                                '#f5576c',
                                '#4facfe',
                                '#43e97b',
                                '#fa709a',
                                '#fee140',
                                '#30cfd0',
                                '#667eea',
                                '#f093fb',
                              ],
                              borderWidth: 2,
                              borderColor: '#fff',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                usePointStyle: true,
                              },
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.label || ''
                                  const value = context.parsed || 0
                                  const total = context.dataset.data.reduce(
                                    (a, b) => a + b,
                                    0,
                                  )
                                  const percentage = (
                                    (value / total) *
                                    100
                                  ).toFixed(1)
                                  return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No branch data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Monthly Trend and Top Vendors */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {/* Monthly Trend Chart */}
              <Grid item xs={12} md={8}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp sx={{ mr: 1, color: '#4facfe' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Monthly Payment Trend
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.monthlyTrend).length > 0 ? (
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={{
                          labels: Object.keys(summaryData.monthlyTrend).sort(
                            (a, b) =>
                              dayjs(a, 'MMM YYYY').valueOf() -
                              dayjs(b, 'MMM YYYY').valueOf(),
                          ),
                          datasets: [
                            {
                              label: 'Payment Amount (₹)',
                              data: Object.keys(summaryData.monthlyTrend)
                                .sort(
                                  (a, b) =>
                                    dayjs(a, 'MMM YYYY').valueOf() -
                                    dayjs(b, 'MMM YYYY').valueOf(),
                                )
                                .map((key) => summaryData.monthlyTrend[key]),
                              backgroundColor: 'rgba(79, 172, 254, 0.8)',
                              borderColor: 'rgba(79, 172, 254, 1)',
                              borderWidth: 2,
                              borderRadius: 8,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) =>
                                  `₹${context.parsed.y.toLocaleString('en-IN')}`,
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: (value) =>
                                  `₹${value.toLocaleString('en-IN')}`,
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No trend data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Top Vendors */}
              <Grid item xs={12} md={4}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ mr: 1, color: '#43e97b' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Top Vendors
                    </Typography>
                  </Box>
                  {summaryData.topVendors.length > 0 ? (
                    <Stack spacing={1.5}>
                      {summaryData.topVendors.map((item, index) => (
                        <Box key={item.vendor}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {index + 1}. {item.vendor}
                            </Typography>
                            <Chip
                              label={`₹${item.amount.toLocaleString('en-IN')}`}
                              size="small"
                              sx={{
                                bgcolor:
                                  index === 0
                                    ? '#43e97b'
                                    : index === 1
                                      ? '#4facfe'
                                      : index === 2
                                        ? '#f5576c'
                                        : '#667eea',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={
                              (item.amount / summaryData.topVendors[0].amount) *
                              100
                            }
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                bgcolor:
                                  index === 0
                                    ? '#43e97b'
                                    : index === 1
                                      ? '#4facfe'
                                      : index === 2
                                        ? '#f5576c'
                                        : '#667eea',
                              },
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 200,
                      }}
                    >
                      <Typography color="text.secondary">
                        No vendor data available
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Department & Branch Breakdown with Progress Bars */}
            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              {/* Department Breakdown */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Category sx={{ mr: 1, color: '#667eea' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Department Breakdown
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byDepartment).length > 0 ? (
                    <Stack spacing={2}>
                      {Object.entries(summaryData.byDepartment)
                        .sort(([, a], [, b]) => b - a)
                        .map(([dept, amount]) => (
                          <Box key={dept}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="body2" fontWeight={500}>
                                {dept}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="primary"
                                >
                                  ₹{amount.toLocaleString('en-IN')}
                                </Typography>
                                <Chip
                                  label={`${summaryData.departmentPercentages[dept]?.toFixed(1) || 0}%`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={
                                summaryData.departmentPercentages[dept] || 0
                              }
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                              }}
                            />
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 4 }}
                    >
                      No department data available
                    </Typography>
                  )}
                </Card>
              </Grid>

              {/* Branch Breakdown */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 2, height: '100%', boxShadow: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Store sx={{ mr: 1, color: '#f5576c' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Branch Breakdown
                    </Typography>
                  </Box>
                  {Object.keys(summaryData.byBranch).length > 0 ? (
                    <Stack spacing={2}>
                      {Object.entries(summaryData.byBranch)
                        .sort(([, a], [, b]) => b - a)
                        .map(([branch, amount]) => (
                          <Box key={branch}>
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5,
                              }}
                            >
                              <Typography variant="body2" fontWeight={500}>
                                {branch}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color="secondary"
                                >
                                  ₹{amount.toLocaleString('en-IN')}
                                </Typography>
                                <Chip
                                  label={`${summaryData.branchPercentages[branch]?.toFixed(1) || 0}%`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={summaryData.branchPercentages[branch] || 0}
                              sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: 'secondary.main',
                                },
                              }}
                            />
                          </Box>
                        ))}
                    </Stack>
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{ textAlign: 'center', py: 4 }}
                    >
                      No branch data available
                    </Typography>
                  )}
                </Card>
              </Grid>
            </Grid>

            {/* Recent Payments */}
            {summaryData.recentPayments.length > 0 && (
              <Card sx={{ p: 2, boxShadow: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Payment sx={{ mr: 1, color: '#667eea' }} />
                  <Typography variant="h6" fontWeight={600}>
                    Recent Payments
                  </Typography>
                </Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                    <Box
                      component="table"
                      sx={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        '& th': {
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: '#666',
                          borderBottom: '2px solid #e0e0e0',
                          bgcolor: '#f8f9fa',
                        },
                        '& td': {
                          padding: '12px',
                          borderBottom: '1px solid #f0f0f0',
                        },
                        '& tr:hover': {
                          bgcolor: '#f5f5f5',
                        },
                      }}
                    >
                      <Box component="thead">
                        <Box component="tr">
                          <Box component="th">Date</Box>
                          <Box component="th">Department</Box>
                          <Box component="th">Vendor</Box>
                          <Box component="th">Branch</Box>
                          <Box component="th" sx={{ textAlign: 'right' }}>
                            Amount
                          </Box>
                        </Box>
                      </Box>
                      <Box component="tbody">
                        {summaryData.recentPayments.map((payment, index) => (
                          <Box
                            component="tr"
                            key={payment.id || index}
                            sx={{
                              '&:hover': {
                                bgcolor: '#f5f5f5',
                              },
                            }}
                          >
                            <Box component="td">
                              {payment.paymentDate
                                ? dayjs(payment.paymentDate).format(
                                    'DD MMM YYYY',
                                  )
                                : '-'}
                            </Box>
                            <Box component="td">
                              {payment.department || '-'}
                            </Box>
                            <Box component="td">{payment.vendor || '-'}</Box>
                            <Box component="td">
                              <Chip
                                label={payment.branch || '-'}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <Box
                              component="td"
                              sx={{
                                textAlign: 'right',
                                fontWeight: 600,
                                color: '#1976d2',
                              }}
                            >
                              ₹
                              {parseFloat(payment.amount || 0).toLocaleString(
                                'en-IN',
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              </Card>
            )}
          </CardContent>
        </TabPanel>

        {/* REPORT TAB */}
        <TabPanel value={activeTab} index={2}>
          <CardContent sx={{ p: 2.5 }}>
            <Card
              sx={{
                mb: 2.5,
                p: 2,
                bgcolor: '#f8f9fa',
                border: '1px solid #e0e0e0',
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <Autocomplete
                    options={[
                      { id: '', branchCode: 'All Branches' },
                      ...(dropdowns?.branches || []),
                    ]}
                    getOptionLabel={(option) =>
                      option?.branchCode || option?.name || ''
                    }
                    value={
                      [
                        { id: '', branchCode: 'All Branches' },
                        ...(dropdowns?.branches || []),
                      ].find(
                        (b) => String(b.id) === String(reportFilters.branchId),
                      ) || { id: '', branchCode: 'All Branches' }
                    }
                    onChange={(_, value) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        branchId: value?.id ?? '',
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Branch" size="small" />
                    )}
                    disableClearable
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="From Date"
                    value={reportFilters.fromDate}
                    onChange={(value) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        fromDate: value,
                      }))
                    }
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                    format="DD-MM-YYYY"
                    desktopModeMediaQuery={DATE_PICKER_DESKTOP_QUERY}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="To Date"
                    value={reportFilters.toDate}
                    onChange={(value) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        toDate: value,
                      }))
                    }
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                    format="DD-MM-YYYY"
                    desktopModeMediaQuery={DATE_PICKER_DESKTOP_QUERY}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Autocomplete
                    options={[
                      { id: '', name: 'All Departments' },
                      ...(departmentsData?.data || []),
                    ]}
                    getOptionLabel={(option) => option?.name || ''}
                    value={
                      [
                        { id: '', name: 'All Departments' },
                        ...(departmentsData?.data || []),
                      ].find(
                        (d) =>
                          String(d.id) === String(reportFilters.departmentId),
                      ) || { id: '', name: 'All Departments' }
                    }
                    onChange={(_, value) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        departmentId: value?.id ?? '',
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Department" size="small" />
                    )}
                    disableClearable
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Autocomplete
                    options={[
                      { id: '', name: 'All Vendors' },
                      ...(vendorsData?.data || []),
                    ]}
                    getOptionLabel={(option) => option?.name || ''}
                    value={
                      [
                        { id: '', name: 'All Vendors' },
                        ...(vendorsData?.data || []),
                      ].find(
                        (v) => String(v.id) === String(reportFilters.vendorId),
                      ) || { id: '', name: 'All Vendors' }
                    }
                    onChange={(_, value) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        vendorId: value?.id ?? '',
                      }))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Vendor" size="small" />
                    )}
                    disableClearable
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    label="Amount"
                    size="small"
                    fullWidth
                    value={reportFilters.amount}
                    onChange={(e) =>
                      setReportFilters((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                  />
                </Grid>
              </Grid>
            </Card>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setReportFilters({
                      branchId: '',
                      departmentId: '',
                      vendorId: '',
                      amount: '',
                      fromDate: null,
                      toDate: null,
                    })
                  }
                >
                  Clear Filters
                </Button>
                <TextField
                  size="small"
                  placeholder="Search Branch / Department / Vendor"
                  value={reportSearchText}
                  onChange={(e) => setReportSearchText(e.target.value)}
                  sx={{ minWidth: 280 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() =>
                    exportReport(reportRowsForExport, reportColumns, 'xlsx', {
                      reportName: 'Payments_Report',
                      reportType: 'payments',
                      branchName: reportFilters.branchId || 'All_Branches',
                    })
                  }
                  sx={{ textTransform: 'none' }}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() =>
                    exportReport(reportRowsForExport, reportColumns, 'pdf', {
                      reportName: 'Payments_Report',
                      reportType: 'payments',
                      branchName: reportFilters.branchId || 'All_Branches',
                    })
                  }
                  sx={{ textTransform: 'none' }}
                >
                  PDF
                </Button>
              </Box>
            </Box>

            <Box sx={{ height: '70vh', width: '100%' }}>
              <DataGrid
                rows={reportTabFilteredPayments}
                columns={reportColumns}
                loading={isReportLoading}
                getRowId={(row) => row.id}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 25 },
                  },
                }}
              />
            </Box>
          </CardContent>
        </TabPanel>
      </Card>

      {/* View Invoice Modal */}
      <Modal
        maxWidth="lg"
        uniqueKey="viewInvoiceModal"
        closeOnOutsideClick={true}
        onOutsideClick={() => {
          // Don't close if modal just opened
          if (modalJustOpenedRef.current) {
            return
          }
          setInvoiceUrl(null)
          dispatch(closeModal())
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h6">Invoice Preview</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (invoiceUrl) {
                    window.open(invoiceUrl, '_blank')
                  }
                }}
              >
                Open in New Tab
              </Button>
              <IconButton
                onClick={() => {
                  setInvoiceUrl(null)
                  dispatch(closeModal())
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {invoiceUrl ? (
              <iframe
                src={invoiceUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                title="Invoice Preview"
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading invoice...</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>

      {/* View Receipt Modal */}
      <Modal
        maxWidth="lg"
        uniqueKey="viewReceiptModal"
        closeOnOutsideClick={true}
        onOutsideClick={() => {
          // Don't close if modal just opened
          if (modalJustOpenedRef.current) {
            return
          }
          setReceiptUrl(null)
          dispatch(closeModal())
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            p: 0,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Typography variant="h6">Receipt Preview</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (receiptUrl) {
                    window.open(receiptUrl, '_blank')
                  }
                }}
              >
                Open in New Tab
              </Button>
              <IconButton
                onClick={() => {
                  setReceiptUrl(null)
                  dispatch(closeModal())
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {receiptUrl ? (
              <iframe
                src={receiptUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
                title="Receipt Preview"
              />
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading receipt...</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Modal>

      {/* Create Order Modal - Reuse from orders page */}
      <CreateOrderModalWrapper />
    </Box>
  )
}

// Create Order Modal Wrapper Component
const CreateOrderModalWrapper = () => {
  const dispatch = useDispatch()
  const modal = useSelector((store) => store.modal)
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const queryClient = useQueryClient()

  const [orderForm, setOrderForm] = useState({
    branchId: '',
    orderDate: dayjs().format('YYYY-MM-DD'),
    departmentId: '',
    vendorId: '',
  })

  const { data: getVendorsByDepartment } = useQuery({
    queryKey: ['getVendorsByDepartment', orderForm?.departmentId],
    queryFn: () =>
      getAllVendorsByDepartmentId(
        userDetails?.accessToken,
        orderForm?.departmentId,
      ),
    enabled: !!orderForm?.departmentId,
  })

  const createOrderMutation = useMutation({
    mutationFn: async (newOrder) => {
      const res = await createNewOrder(userDetails?.accessToken, newOrder)
      return res
    },
    onSuccess: (res) => {
      if (res?.status === 200) {
        toast.success(res?.message || 'Order created successfully', toastconfig)
        setOrderForm({
          branchId: '',
          orderDate: dayjs().format('YYYY-MM-DD'),
          departmentId: '',
          vendorId: '',
        })
        dispatch(closeModal())
        queryClient.invalidateQueries(['allOrders'])
      } else {
        toast.error(res?.message || 'Failed to create order', toastconfig)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create order', toastconfig)
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setOrderForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'departmentId') {
      setOrderForm((prev) => ({ ...prev, vendorId: '' }))
    }
  }

  const handleCreateOrder = () => {
    createOrderMutation.mutate(orderForm)
  }

  if (modal.key !== 'createNewOrder') return null

  return (
    <Modal
      uniqueKey="createNewOrder"
      maxWidth={'sm'}
      closeOnOutsideClick={true}
    >
      <div className="p-5 space-y-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Create New Order</h2>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>

        <Autocomplete
          fullWidth
          options={(dropdowns?.branches || [])
            .filter((branch) => {
              const branchCode = (
                branch.branchCode ||
                branch.name ||
                ''
              ).toUpperCase()
              return ['HYD', 'HNK', 'KMM', 'SPL'].includes(branchCode)
            })
            .slice()
            .sort((a, b) =>
              (a.name || a.branchCode || '').localeCompare(
                b.name || b.branchCode || '',
              ),
            )}
          getOptionLabel={(option) =>
            option.name || option.branchCode || `Branch ${option.id}` || ''
          }
          value={
            (dropdowns?.branches || [])
              .filter((branch) => {
                const branchCode = (
                  branch.branchCode ||
                  branch.name ||
                  ''
                ).toUpperCase()
                return ['HYD', 'HNK', 'KMM', 'SPL'].includes(branchCode)
              })
              .find((branch) => branch.id === orderForm.branchId) || null
          }
          onChange={(event, newValue) => {
            setOrderForm((prev) => ({
              ...prev,
              branchId: newValue?.id || '',
            }))
          }}
          renderInput={(params) => (
            <TextField {...params} label="Branch" variant="outlined" />
          )}
        />

        <DatePicker
          className="w-full"
          label="Order Date"
          value={dayjs(orderForm.orderDate)}
          onChange={(newDate) =>
            setOrderForm((prev) => ({
              ...prev,
              orderDate: dayjs(newDate).format('YYYY-MM-DD'),
            }))
          }
          format="DD-MM-YYYY"
          desktopModeMediaQuery={DATE_PICKER_DESKTOP_QUERY}
          renderInput={(params) => <TextField {...params} fullWidth />}
        />

        <Autocomplete
          fullWidth
          options={(dropdowns?.departmentList || [])
            .slice()
            .sort((a, b) => a.name?.localeCompare(b.name))}
          getOptionLabel={(option) => option.name || ''}
          value={
            (dropdowns?.departmentList || []).find(
              (dept) => dept.id === orderForm.departmentId,
            ) || null
          }
          onChange={(event, newValue) => {
            setOrderForm((prev) => ({
              ...prev,
              departmentId: newValue?.id || '',
              vendorId: '',
            }))
          }}
          renderInput={(params) => (
            <TextField {...params} label="Department" variant="outlined" />
          )}
        />

        <Autocomplete
          fullWidth
          options={(
            (getVendorsByDepartment ? getVendorsByDepartment?.data : []) || []
          )
            .slice()
            .sort((a, b) => a.name?.localeCompare(b.name))}
          getOptionLabel={(option) => option.name || ''}
          value={
            (
              (getVendorsByDepartment ? getVendorsByDepartment?.data : []) || []
            ).find((vendor) => vendor.id === orderForm.vendorId) || null
          }
          onChange={(event, newValue) => {
            setOrderForm((prev) => ({
              ...prev,
              vendorId: newValue?.id || '',
            }))
          }}
          renderInput={(params) => (
            <TextField {...params} label="Vendor" variant="outlined" />
          )}
          disabled={!orderForm.departmentId}
        />

        <div className="flex justify-end space-x-2 mt-4">
          <Button
            onClick={() => dispatch(closeModal())}
            variant="contained"
            color="error"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="capitalize text-white"
            color="primary"
            onClick={handleCreateOrder}
            disabled={createOrderMutation.isLoading}
          >
            {createOrderMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Create Order'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Create Payment Form Component
const CreatePaymentForm = ({
  paymentForm,
  setPaymentForm,
  handleInputChange,
  handleFileChange,
  getVendorsByDepartment,
  dropdowns,
}) => {
  const userDetails = useSelector((store) => store.user)
  const invoiceFileInputRef = useRef(null)
  const receiptFileInputRef = useRef(null)

  const queryClient = useQueryClient()

  const createPaymentMutation = useMutation({
    mutationFn: async (newPayment) => {
      const formData = new FormData()
      formData.append('branchId', newPayment.branchId)
      formData.append('paymentDate', newPayment.paymentDate)
      formData.append('invoiceDate', newPayment.invoiceDate)
      formData.append('departmentId', newPayment.departmentId)
      formData.append('vendorId', newPayment.vendorId)
      formData.append('amount', newPayment.amount)

      if (newPayment.invoiceFile) {
        formData.append('invoiceFile', newPayment.invoiceFile)
      }
      if (newPayment.receiptFile) {
        formData.append('receiptFile', newPayment.receiptFile)
      }

      return await createPayment(userDetails?.accessToken, formData)
    },
    onSuccess: (res) => {
      if (res?.status === 201) {
        toast.success(
          res?.message || 'Payment created successfully',
          toastconfig,
        )
        setPaymentForm({
          branchId: '',
          departmentId: '',
          vendorId: '',
          amount: '',
          paymentDate: dayjs().format('YYYY-MM-DD'),
          invoiceDate: dayjs().format('YYYY-MM-DD'),
          invoiceFile: null,
          receiptFile: null,
        })
        queryClient.invalidateQueries(['allPayments'])
      } else {
        toast.error(res?.message || 'Failed to create payment', toastconfig)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create payment', toastconfig)
    },
  })

  const handleSubmit = () => {
    if (
      !paymentForm.branchId ||
      !paymentForm.paymentDate ||
      paymentForm.paymentDate === 'Invalid Date' ||
      !paymentForm.invoiceDate ||
      paymentForm.invoiceDate === 'Invalid Date' ||
      !paymentForm.departmentId ||
      !paymentForm.vendorId ||
      !paymentForm.amount
    ) {
      toast.error('Please fill all required fields', toastconfig)
      return
    }

    createPaymentMutation.mutate(paymentForm)
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Form Container with Grid Layout */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Branch Field */}
        <Grid item xs={12} sm={6} md={2}>
          <Autocomplete
            size="small"
            fullWidth
            options={(dropdowns?.branches || [])
              .filter((branch) => {
                const branchCode = (
                  branch.branchCode ||
                  branch.name ||
                  ''
                ).toUpperCase()
                return ['HYD', 'HNK', 'KMM', 'SPL'].includes(branchCode)
              })
              .slice()
              .sort((a, b) =>
                (a.name || a.branchCode || '').localeCompare(
                  b.name || b.branchCode || '',
                ),
              )}
            getOptionLabel={(option) =>
              option.name || option.branchCode || `Branch ${option.id}` || ''
            }
            value={
              (dropdowns?.branches || [])
                .filter((branch) => {
                  const branchCode = (
                    branch.branchCode ||
                    branch.name ||
                    ''
                  ).toUpperCase()
                  return ['HYD', 'HNK', 'KMM', 'SPL'].includes(branchCode)
                })
                .find((branch) => branch.id === paymentForm.branchId) || null
            }
            onChange={(event, newValue) => {
              setPaymentForm((prev) => ({
                ...prev,
                branchId: newValue?.id || '',
              }))
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Branch *"
                variant="outlined"
                size="small"
                fullWidth
              />
            )}
            sx={{
              '& .MuiInputBase-root': {
                height: '40px',
              },
            }}
          />
        </Grid>

        {/* Payment Date Field */}
        <Grid item xs={12} sm={6} md={2}>
          <DatePicker
            label="Payment Date *"
            value={dayjs(paymentForm.paymentDate)}
            onChange={(newDate) =>
              setPaymentForm((prev) => ({
                ...prev,
                paymentDate:
                  newDate && dayjs(newDate).isValid()
                    ? dayjs(newDate).format('YYYY-MM-DD')
                    : '',
              }))
            }
            format="DD-MM-YYYY"
            desktopModeMediaQuery={DATE_PICKER_DESKTOP_QUERY}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
              },
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                height: '40px',
              },
            }}
          />
        </Grid>

        {/* Invoice Date Field */}
        <Grid item xs={12} sm={6} md={2}>
          <DatePicker
            label="Invoice Date *"
            value={dayjs(paymentForm.invoiceDate)}
            onChange={(newDate) =>
              setPaymentForm((prev) => ({
                ...prev,
                invoiceDate:
                  newDate && dayjs(newDate).isValid()
                    ? dayjs(newDate).format('YYYY-MM-DD')
                    : '',
              }))
            }
            format="DD-MM-YYYY"
            desktopModeMediaQuery={DATE_PICKER_DESKTOP_QUERY}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true,
              },
            }}
            sx={{
              width: '100%',
              '& .MuiInputBase-root': {
                height: '40px',
              },
            }}
          />
        </Grid>

        {/* Department Field */}
        <Grid item xs={12} sm={6} md={2}>
          <Autocomplete
            size="small"
            fullWidth
            options={(dropdowns?.departmentList || [])
              .slice()
              .sort((a, b) => a.name?.localeCompare(b.name))}
            getOptionLabel={(option) => option.name || ''}
            value={
              (dropdowns?.departmentList || []).find(
                (dept) => dept.id === paymentForm.departmentId,
              ) || null
            }
            onChange={(event, newValue) => {
              setPaymentForm((prev) => ({
                ...prev,
                departmentId: newValue?.id || '',
                vendorId: '',
              }))
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Department *"
                variant="outlined"
                size="small"
                fullWidth
              />
            )}
            sx={{
              '& .MuiInputBase-root': {
                height: '40px',
              },
            }}
          />
        </Grid>

        {/* Vendor Field */}
        <Grid item xs={12} sm={6} md={2}>
          <Autocomplete
            size="small"
            fullWidth
            options={(
              (getVendorsByDepartment ? getVendorsByDepartment?.data : []) || []
            )
              .slice()
              .sort((a, b) => a.name?.localeCompare(b.name))}
            getOptionLabel={(option) => option.name || ''}
            value={
              (
                (getVendorsByDepartment ? getVendorsByDepartment?.data : []) ||
                []
              ).find((vendor) => vendor.id === paymentForm.vendorId) || null
            }
            onChange={(event, newValue) => {
              setPaymentForm((prev) => ({
                ...prev,
                vendorId: newValue?.id || '',
              }))
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Vendor"
                variant="outlined"
                size="small"
                fullWidth
              />
            )}
            disabled={!paymentForm.departmentId}
            sx={{
              '& .MuiInputBase-root': {
                height: '40px',
              },
            }}
          />
        </Grid>

        {/* Amount Field */}
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            type="number"
            label="Amount"
            name="amount"
            value={paymentForm.amount}
            onChange={handleInputChange}
            required
            size="small"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                height: '40px',
              },
            }}
          />
        </Grid>

        {/* Action Buttons - Inline with form fields on desktop, separate row on mobile */}
        <Grid item xs={12} sm={12} md={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: { xs: 1, sm: 0 },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                height: '40px',
              }}
            >
              <input
                type="file"
                id="invoiceFile"
                ref={invoiceFileInputRef}
                onChange={(e) => handleFileChange('invoiceFile', e)}
                accept="application/pdf,image/*"
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  opacity: 0,
                  overflow: 'hidden',
                  zIndex: -1,
                  pointerEvents: 'none',
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => invoiceFileInputRef.current?.click()}
                size="small"
                sx={{
                  textTransform: 'none',
                  minWidth: '120px',
                  height: '40px',
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                Invoice
              </Button>
            </Box>

            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                height: '40px',
              }}
            >
              <input
                type="file"
                id="receiptFile"
                ref={receiptFileInputRef}
                onChange={(e) => handleFileChange('receiptFile', e)}
                accept="application/pdf,image/*"
                style={{
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  opacity: 0,
                  overflow: 'hidden',
                  zIndex: -1,
                  pointerEvents: 'none',
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => receiptFileInputRef.current?.click()}
                size="small"
                sx={{
                  textTransform: 'none',
                  minWidth: '120px',
                  height: '40px',
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                Receipt
              </Button>
            </Box>

            <Button
              variant="contained"
              className="capitalize text-white"
              color="primary"
              onClick={handleSubmit}
              disabled={createPaymentMutation.isLoading}
              size="small"
              sx={{
                minWidth: '120px',
                textTransform: 'none',
                height: '40px',
                boxShadow: 1,
                '&:hover': {
                  boxShadow: 2,
                },
              }}
            >
              {createPaymentMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : (
                'Submit'
              )}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PaymentsPage
