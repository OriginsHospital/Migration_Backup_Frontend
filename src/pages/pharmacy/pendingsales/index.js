import React, { useEffect, useState } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import TextField from '@mui/material/TextField'
import {
  Box,
  Button,
  Avatar,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  TableContainer,
  Paper,
  Chip,
  CircularProgress,
  Checkbox,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import dayjs from 'dayjs'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import {
  getPharmacyDetailsByDate,
  movePendingToPrescribed,
} from '@/constants/apis'
import { toast, Bounce } from 'react-toastify'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { useRouter } from 'next/router'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import Breadcrumb from '@/components/Breadcrumb'

const toastconfig = {
  position: 'top-right',
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}

/** Display names in uniform Title Case (e.g. VADUGULA NAVEEN → Vadugula Naveen). */
const toTitleCaseName = (name) => {
  if (!name || typeof name !== 'string') return ''
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      word
        .split('-')
        .map((part) =>
          part
            .split('.')
            .map((segment) =>
              segment
                ? segment.charAt(0).toUpperCase() + segment.slice(1)
                : segment,
            )
            .join('.'),
        )
        .join('-'),
    )
    .join(' ')
}

function PendingSalesPage() {
  const user = useSelector((store) => store.user)
  const dropDown = useSelector((store) => store.dropdowns)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [date, setDate] = useState(dayjs())
  const [expandedId, setExpandedId] = useState(null)
  const [selectedItems, setSelectedItems] = useState([])
  let defaultBranch = user['branchDetails']?.[0]
  const [selectedbranch, setSelectedBranch] = useState(defaultBranch?.id)
  let branch = dropDown['branches']
  branch = branch?.map((item) => {
    return { ...item, label: item.name }
  })

  // Update URL when date or branch changes
  const updateURL = (newDate, newBranch) => {
    const dateString = newDate
      ? newDate.format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD')
    router.push(
      {
        pathname: router.pathname,
        query: {
          date: dateString,
          branch: newBranch,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  function handleDateChange(value) {
    setDate(value)
    updateURL(value, selectedbranch)
  }

  function handleBranchChange(branchId) {
    setSelectedBranch(branchId)
    updateURL(date, branchId)
  }

  // Fetch pharmacy data
  const { data: patientData, isLoading: isValuesLoading } = useQuery({
    queryKey: ['pendingSalesByDate', date, selectedbranch],
    enabled: !!date && !!selectedbranch,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const dateStr = dayjs.isDayjs(date)
        ? date.format('YYYY-MM-DD')
        : dayjs(date).isValid()
          ? dayjs(date).format('YYYY-MM-DD')
          : ''
      const res = await getPharmacyDetailsByDate(
        user?.accessToken,
        dateStr,
        selectedbranch,
      )

      if (res.status !== 200) {
        throw new Error(
          'Error occurred while fetching medicine details for pharmacy',
        )
      }

      const fetchedData = Array.isArray(res.data) ? res.data : []

      const parseItemDetails = (itemDetails) => {
        if (!itemDetails) return []
        if (Array.isArray(itemDetails)) return itemDetails.filter(Boolean)
        if (typeof itemDetails === 'string') {
          try {
            const parsed = JSON.parse(itemDetails)
            return Array.isArray(parsed) ? parsed.filter(Boolean) : []
          } catch {
            return []
          }
        }
        return []
      }

      // Pending Sales = leftover qty on items NOT already in PRESCRIBED
      // (typically PAID/PACKED with prescribed > purchase). Pure PRESCRIBED
      // lines belong on Pharmacy → Prescribed and must not reappear here.
      const isPendingSalesItem = (item) => {
        const purchaseQty = Number(item.purchaseQuantity || 0)
        const prescribedQty = Number(item.prescribedQuantity || 0)
        const balance = prescribedQty - purchaseQty
        if (balance <= 0) return false

        const stage = String(item.itemStage || '').toUpperCase()
        if (stage === 'PRESCRIBED') return false
        if (purchaseQty === 0 && stage !== 'PAID' && stage !== 'PACKED') {
          return false
        }
        return true
      }

      const pendingItems = []
      fetchedData.forEach((patientHeader) => {
        const filteredItems = parseItemDetails(
          patientHeader?.itemDetails,
        ).filter(isPendingSalesItem)

        if (filteredItems && filteredItems.length > 0) {
          pendingItems.push({
            ...patientHeader,
            itemDetails: filteredItems,
          })
        }
      })

      return pendingItems
    },
  })

  // Handle URL parameters and set initial values
  useEffect(() => {
    const { date: urlDate, branch: urlBranch } = router.query

    if (urlDate && urlBranch) {
      const parsedDate = dayjs(urlDate)
      if (parsedDate.isValid()) {
        setDate(parsedDate)
      }
      setSelectedBranch(Number(urlBranch))
    } else {
      // Set default date if not in URL
      const defaultDate = dayjs()
      setDate(defaultDate)
      updateURL(defaultDate, selectedbranch)
    }
  }, [router.query])

  useEffect(() => {
    setExpandedId(null)
    setSelectedItems([]) // Clear selections when filters change
  }, [date, selectedbranch])

  // Handle checkbox selection
  const handleCheckboxChange = (item, type, appointmentId) => {
    setSelectedItems((prev) => {
      const uniqueKey = `${item.id}-${appointmentId}`
      const isSelected = prev.some((i) => {
        const iKey = `${i.id}-${i.appointmentId}`
        return iKey === uniqueKey
      })
      if (isSelected) {
        return prev.filter((i) => {
          const iKey = `${i.id}-${i.appointmentId}`
          return iKey !== uniqueKey
        })
      } else {
        return [
          ...prev,
          {
            ...item,
            type: type,
            appointmentId: appointmentId,
          },
        ]
      }
    })
  }

  const isItemSelected = (item, appointmentId) => {
    const uniqueKey = `${item.id}-${appointmentId}`
    return selectedItems.some((i) => {
      const iKey = `${i.id}-${i.appointmentId}`
      return iKey === uniqueKey
    })
  }

  // Move only selected pending items → PRESCRIBED; they leave this list
  const moveToPrescribedMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await movePendingToPrescribed(user?.accessToken, payload)
      return res
    },
    onSuccess: (res, variables) => {
      if (res?.status === 200) {
        const movedIds = new Set(variables.map((item) => item.id))
        const count = variables.length

        // Instantly remove moved rows so they disappear from Pending Sales
        queryClient.setQueryData(
          ['pendingSalesByDate', date, selectedbranch],
          (old) => {
            if (!Array.isArray(old)) return old
            return old
              .map((patient) => ({
                ...patient,
                itemDetails: (patient.itemDetails || []).filter(
                  (item) => !movedIds.has(item.id),
                ),
              }))
              .filter((patient) => (patient.itemDetails || []).length > 0)
          },
        )

        setSelectedItems((prev) =>
          prev.filter((item) => !movedIds.has(item.id)),
        )

        toast.success(
          `${count} item(s) moved to Prescribed for today`,
          toastconfig,
        )

        queryClient.invalidateQueries(['pendingSalesByDate'])
        queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
      } else {
        toast.error(res?.message || 'Failed to move items', toastconfig)
      }
    },
    onError: (error) => {
      console.error('Error moving to prescribed:', error)
      toast.error('Failed to move items to Prescribed', toastconfig)
    },
  })

  const handleBulkMoveToPrescribed = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item', toastconfig)
      return
    }

    const todayLabel = dayjs().format('DD-MM-YYYY')
    if (
      confirm(
        `Move ${selectedItems.length} selected item(s) to Prescribed for today (${todayLabel})?\n\n• Only checked items will be moved\n• Purchased quantity will not change\n• Pending quantity will appear under Pharmacy → Prescribed on today's date\n• Moved items will leave Pending Sales`,
      )
    ) {
      const payload = selectedItems.map((item) => ({
        id: item.id,
        type: item.type,
      }))

      moveToPrescribedMutation.mutate(payload)
    }
  }

  const calculateBalance = (item) => {
    const purchaseQty = item.purchaseQuantity || 0
    const prescribedQty = item.prescribedQuantity || 0
    return Math.max(0, prescribedQty - purchaseQty)
  }

  const calculatePrice = (item) => {
    // Calculate price based on purchase information if available
    const purchaseInfo = item.itemPurchaseInformation

    if (!purchaseInfo) {
      return 0
    }

    const purchaseInfoArray = Array.isArray(purchaseInfo)
      ? purchaseInfo
      : [purchaseInfo]

    if (purchaseInfoArray.length === 0) {
      return 0
    }

    return purchaseInfoArray.reduce((total, info) => {
      const usedQty = info.usedQuantity || info.initialUsedQuantity || 0
      const returnedQty = info.returnedQuantity || 0
      const netQty = usedQty - returnedQty
      const mrp = info.mrpPerTablet || 0
      return total + netQty * mrp
    }, 0)
  }

  return (
    <div className="flex flex-col w-full p-5">
      <div className="mb-5">
        <Breadcrumb />
      </div>
      <div className="mb-5">
        <Typography variant="h5" className="font-bold text-secondary mb-4">
          Pending Sales
        </Typography>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-5 items-center">
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Branch</InputLabel>
          <Select
            value={selectedbranch || ''}
            label="Branch"
            onChange={(e) => handleBranchChange(e.target.value)}
          >
            {branch?.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Date"
          value={date}
          onChange={handleDateChange}
          format="DD-MM-YYYY"
          renderInput={(params) => (
            <TextField {...params} size="small" sx={{ minWidth: 200 }} />
          )}
        />
      </div>

      {/* Loading State */}
      {isValuesLoading && (
        <div className="flex justify-center items-center py-10">
          <CircularProgress />
        </div>
      )}

      {/* Empty State */}
      {!isValuesLoading && (!patientData || patientData.length === 0) && (
        <div className="flex flex-col items-center justify-center py-10">
          <Typography variant="h6" color="textSecondary">
            No pending sales found for the selected date and branch.
          </Typography>
        </div>
      )}

      {/* Patient List */}
      {!isValuesLoading && patientData && patientData.length > 0 && (
        <div className="flex flex-col gap-3">
          {patientData.map((patient, index) => {
            const appointmentId = patient.appointmentId
            const isExpanded = expandedId === appointmentId
            const patientName = toTitleCaseName(patient.patientName)
            const spouseName = toTitleCaseName(patient.spouseName)
            const doctorName = toTitleCaseName(patient.doctorName)

            return (
              <Accordion
                key={appointmentId + index}
                expanded={isExpanded}
                onChange={(e, expanded) => {
                  setExpandedId(expanded ? appointmentId : null)
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon className="text-gray-600" />}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-nowrap w-full items-center gap-4 py-2">
                    <Avatar
                      src={
                        patient.photoPath &&
                        patient.photoPath !== 'null' &&
                        patient.photoPath !== 'undefined'
                          ? patient.photoPath
                          : undefined
                      }
                      alt={patientName}
                      sx={{ width: 56, height: 56 }}
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <Typography
                        variant="subtitle1"
                        className="font-semibold text-gray-800"
                        sx={{
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={patientName}
                      >
                        {patientName}
                      </Typography>
                      {spouseName && (
                        <Typography
                          variant="body2"
                          className="font-semibold text-gray-800"
                          sx={{
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={spouseName}
                        >
                          {spouseName}
                        </Typography>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <PersonOutlineIcon className="w-4 h-4" />
                        <span>{doctorName}</span>
                      </div>
                    </div>
                    <Chip
                      label={`${patient.itemDetails.length} item(s)`}
                      color="warning"
                      size="small"
                    />
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell className="font-semibold">
                            Medicine Name
                          </TableCell>
                          <TableCell className="font-semibold" align="right">
                            Prescribed Qty
                          </TableCell>
                          <TableCell className="font-semibold" align="right">
                            Balance Qty
                          </TableCell>
                          <TableCell className="font-semibold" align="right">
                            Price (₹)
                          </TableCell>
                          <TableCell className="font-semibold" align="center">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {patient.itemDetails.map((item, itemIndex) => {
                          const balance = calculateBalance(item)
                          const price = calculatePrice(item)
                          const itemSelected = isItemSelected(
                            item,
                            patient.appointmentId,
                          )

                          return (
                            <TableRow key={item.id || itemIndex}>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell align="right">
                                {item.prescribedQuantity || 0}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={balance}
                                  color="error"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                ₹{price.toFixed(2)}
                              </TableCell>
                              <TableCell align="center">
                                <Checkbox
                                  checked={itemSelected}
                                  onChange={() =>
                                    handleCheckboxChange(
                                      item,
                                      patient.type,
                                      patient.appointmentId,
                                    )
                                  }
                                  color="primary"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )
          })}
        </div>
      )}

      {/* Floating Bottom Action Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
          <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
            <Typography variant="body1" className="font-medium text-gray-700">
              ✔ {selectedItems.length} item(s) selected
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleBulkMoveToPrescribed}
              disabled={moveToPrescribedMutation.isPending}
              sx={{
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'none',
              }}
              startIcon={
                moveToPrescribedMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
            >
              {moveToPrescribedMutation.isPending
                ? 'Moving...'
                : 'MOVE TO PRESCRIBED'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default withPermission(PendingSalesPage, true, 'pharmacy', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
