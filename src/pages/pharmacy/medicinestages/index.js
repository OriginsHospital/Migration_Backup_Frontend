import React, { useEffect, useRef, useState, useCallback } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Button,
  TableHead,
  TableContainer,
  TableFooter,
  Avatar,
  Typography,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Divider,
  IconButton,
  Menu,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import dayjs from 'dayjs'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import {
  Generate_Invoice,
  getCoupons,
  getOrderId,
  getPharmacyDetailsByDate,
  savePaymentBreakup,
  savePharmacyItems,
  getAvailableGrnInfoByItemId,
  getPharmacyMasterData,
  addPaymentDetails,
} from '@/constants/apis'
import { API_ROUTES } from '@/constants/constants'
import { toast, Bounce } from 'react-toastify'
import {
  Close,
  Info,
  PrintRounded,
  Add,
  Delete,
  DeleteOutline,
  Edit,
  LocalOffer,
  Undo,
} from '@mui/icons-material'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { useRouter } from 'next/router'
const columns = [
  { label: 'PRESCRIBED' },
  { label: 'PACKED' },
  { label: 'PAID' },
]

const PHARMACIST_ROLE_ID = 3

const isPharmacistRole = (roleDetails) => {
  const roleName = (
    roleDetails?.roleName ||
    roleDetails?.name ||
    roleDetails?.role ||
    ''
  )
    .toString()
    .toLowerCase()
  return (
    roleDetails?.id === PHARMACIST_ROLE_ID || roleName.includes('pharmacist')
  )
}
const toastconfig = {
  position: 'top-right',
  autoClose: 800,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}

const hasActivePackageIndicator = (header) => {
  if (!header) return false

  return (
    header.hasActivePackage === 1 ||
    header.hasActivePackage === true ||
    header.hasActivePackage === '1'
  )
}

/** MySQL JSON_ARRAYAGG may arrive as a string; optional .forEach on strings is a no-op. */
const parsePharmacyItemDetails = (itemDetails) => {
  if (!itemDetails) return []
  if (Array.isArray(itemDetails)) {
    return itemDetails.filter(Boolean)
  }
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

const formatPharmacyQueryDate = (value) => {
  if (!value) return ''
  if (dayjs.isDayjs(value)) {
    return value.format('YYYY-MM-DD')
  }
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : ''
}

/** Avoid src="null" — on /pharmacy/* routes the browser requests /pharmacy/null (404). */
const getPatientPhotoSrc = (photoPath) => {
  if (
    !photoPath ||
    photoPath === 'null' ||
    photoPath === 'undefined' ||
    photoPath === 'NULL'
  ) {
    return undefined
  }
  return photoPath
}

const ActivePackageDot = ({ show }) => {
  if (!show) return null

  return (
    <span
      style={{
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#ff0000',
        border: '2px solid white',
        boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
        display: 'inline-block',
        flexShrink: 0,
      }}
      title="Active package"
    />
  )
}

function RenderAccordianDetails({
  itemDetails,
  column,
  type,
  hdrKey,
  header,
  selectedbranch,
  date,
}) {
  const user = useSelector((store) => store.user)
  const [details, setDetails] = useState([])
  const [disabled, setDisabled] = useState(true)
  const queryClient = useQueryClient()
  const [saveEnabled, setSaveEnabled] = useState(false)
  const dispatch = useDispatch()
  const [grnRows, setGrnRows] = useState({})
  // State for per-item coupons: { itemId: { applied: boolean, discount: number } }
  const [itemCoupons, setItemCoupons] = useState({})
  // State for coupon menu anchor (which item's coupon menu is open)
  const [couponMenuAnchor, setCouponMenuAnchor] = useState(null)
  const [selectedItemForCoupon, setSelectedItemForCoupon] = useState(null)
  const [nonPurchaseReasons, setNonPurchaseReasons] = useState({})

  const shouldShowNonPurchaseReason = (prescribedQuantity, purchaseQuantity) =>
    Number(purchaseQuantity || 0) < Number(prescribedQuantity || 0)

  const updateNonPurchaseReason = (itemId, value) => {
    setNonPurchaseReasons((prev) => ({
      ...prev,
      [itemId]: value,
    }))
    setSaveEnabled(true)
  }

  const reasonForItem = (itemId, prescribedQuantity, purchaseQuantity) => {
    if (!shouldShowNonPurchaseReason(prescribedQuantity, purchaseQuantity)) {
      return null
    }
    const reason = nonPurchaseReasons[itemId]
    return typeof reason === 'string' ? reason.trim() : ''
  }

  const addGrnRow = (medicineId) => {
    console.log(grnRows)
    setGrnRows((prev) => ({
      ...prev,
      [medicineId]: [
        ...(prev[medicineId] || []),
        { grn: null, usedQuantity: 0 },
      ],
    }))
  }

  const handleGrnRowChange = (medicineId, index, field, value) => {
    const normalizedValue =
      field === 'usedQuantity' || field === 'returnedQuantity'
        ? value === '' || value === null || value === undefined
          ? 0
          : Number(value)
        : value

    setGrnRows((prev) => ({
      ...prev,
      [medicineId]: prev[medicineId].map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: normalizedValue,
            }
          : row,
      ),
    }))
  }

  const validateGrnSelections = (medicineId, prescribedQuantity) => {
    const grnInfo = grnRows[medicineId] || []
    if (!grnInfo.length) return false

    // Use initial packed qty when present (PACKED edit); otherwise entered qty (PRESCRIBED)
    const totalPackedQuantity = grnInfo.reduce((sum, row) => {
      const initialQty = Number(
        row.initialUsedQuantity ?? row.usedQuantity ?? 0,
      )
      const returnedQty = Number(row.returnedQuantity || 0)
      return sum + initialQty - returnedQty
    }, 0)

    const hasInvalidReturn = grnInfo.some((row) => {
      const initialQty = Number(
        row.initialUsedQuantity ?? row.usedQuantity ?? 0,
      )
      const returnedQty = Number(row.returnedQuantity || 0)
      return returnedQty < 0 || returnedQty > initialQty
    })

    return (
      !hasInvalidReturn &&
      totalPackedQuantity >= 0 &&
      totalPackedQuantity <= Number(prescribedQuantity || 0)
    )
  }
  const validateAndCallAPI = () => {
    // Filter to only include medicines that have quantities entered (GRN rows selected)
    const dbFormat = details
      .filter((itemInfo) => {
        // Only include medicines that have GRN rows with valid entries
        const medicineGrnRows = grnRows[itemInfo.id] || []
        return (
          medicineGrnRows.length > 0 &&
          medicineGrnRows.some(
            (row) => row.grnId && Number(row.usedQuantity || 0) > 0,
          )
        )
      })
      .map((itemInfo) => {
        const itemGrnRows = grnRows[itemInfo.id]
        const purchaseQuantity = itemGrnRows.reduce(
          (sum, row) => sum + Number(row.usedQuantity || 0),
          0,
        )
        const nonPurchaseReason = reasonForItem(
          itemInfo.id,
          itemInfo.prescribedQuantity,
          purchaseQuantity,
        )
        const itemPurchaseInformation = itemGrnRows
          .filter((row) => row.grnId && row.usedQuantity > 0)
          .map((row) => ({
            grnId: row.grnId.grnId,
            expiryDate: row.grnId.expiryDate,
            mrpPerTablet: row.grnId.mrpPerTablet,
            initialUsedQuantity: Number(row.usedQuantity || 0), // Set initial quantity when moving to packed
            usedQuantity: Number(row.usedQuantity || 0),
            returnedQuantity: 0, // Initialize return quantity as 0
            batchNo: row.grnId.batchNo,
            nonPurchaseReason,
          }))

        return {
          id: itemInfo.id,
          type: type,
          purchaseQuantity,
          itemPurchaseInformation,
        }
      })

    // Only call API if there are medicines to move
    if (dbFormat.length === 0) {
      toast.error(
        'Please enter quantity for at least one medicine',
        toastconfig,
      )
      return
    }

    // Get IDs of medicines that will be moved
    const movedMedicineIds = dbFormat.map((item) => item.id)

    // Store moved IDs for cleanup after successful API call
    const movedIdsRef = movedMedicineIds

    // Call API to move to packed
    mutate(
      {
        movetopackedstage: dbFormat,
      },
      {
        onSuccess: () => {
          // Remove moved medicines from details so they disappear from Prescribed
          setDetails((prevDetails) =>
            prevDetails.filter((med) => !movedIdsRef.includes(med.id)),
          )
          // Clear GRN rows for moved medicines
          setGrnRows((prevGrnRows) => {
            const newGrnRows = { ...prevGrnRows }
            movedIdsRef.forEach((id) => {
              delete newGrnRows[id]
            })
            return newGrnRows
          })
        },
        onError: (error) => {
          console.error('Error moving medicines to packed:', error)
          // Don't remove medicines if API call failed
        },
      },
    )
  }

  const paymentBreakup = useMutation({
    mutationFn: async (payload) => {
      console.log('generateBreakUp', payload)
      const res = await savePaymentBreakup(user.accessToken, {
        generateBreakUp: payload.generateBreakUp,
      })
      console.log('Payment breakup response:', res)
      // Handle response structure: could be { data: [...] } or { generateBreakUp: [...] } or just [...]
      return res.data || res.generateBreakUp || res
    },
    onSuccess: (res, variables) => {
      // Ensure res is an array
      const breakupArray = Array.isArray(res) ? res : []
      console.log('Processing payment breakup array:', breakupArray)

      if (breakupArray.length > 0) {
        // Match by refId (backend field) === line-bill id. Never match by itemName —
        // that incorrectly copies one medicine's totalCost onto every same-named row.
        const findBreakupForMedicine = (medicineDetails) => {
          const medicineId = medicineDetails?.id
          if (medicineId == null) return undefined
          return breakupArray.find(
            (item) =>
              String(item.refId) === String(medicineId) ||
              String(item.id) === String(medicineId),
          )
        }

        setDetails((prevDetails) => {
          if (!prevDetails?.length) return prevDetails

          return prevDetails.map((medicineDetails) => {
            const itemResObject = findBreakupForMedicine(medicineDetails)
            if (!itemResObject) return medicineDetails

            return {
              ...medicineDetails,
              refId: itemResObject?.refId,
              totalCost: itemResObject?.totalCost,
              type: itemResObject?.type,
              purchaseDetails: itemResObject?.purchaseDetails,
              purchaseQuantity: (itemResObject?.purchaseDetails || []).reduce(
                (sum, detail) => sum + Number(detail.usedQuantity || 0),
                0,
              ),
              itemPurchaseInformation: (
                itemResObject?.purchaseDetails || []
              ).map((detail) => ({
                grnId: detail.grnId,
                expiryDate: detail.expiryDate,
                mrpPerTablet: detail.mrpPerTablet,
                usedQuantity: detail.usedQuantity,
                returnedQuantity: detail.returnedQuantity,
                batchNo: detail.batchNo,
                nonPurchaseReason: detail.nonPurchaseReason || null,
                initialUsedQuantity:
                  detail.initialUsedQuantity || detail.usedQuantity,
              })),
            }
          })
        })
      }

      if (variables.clickedFromPacked) {
        setSaveEnabled(false)
        if (variables.editMedicineId != null) {
          dispatch(closeModal(`pack-modal-${variables.editMedicineId}`))
          setGrnRows((prev) => {
            const next = { ...prev }
            delete next[variables.editMedicineId]
            return next
          })
        }
        queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
        toast.success('Data updated successfully', toastconfig)
      }
    },
    onError: (error, variables) => {
      console.log(error)
      toast.error('Data updation failed', toastconfig)
    },
  })
  const validateAndPack = (
    prescribedQuantity,
    availableQuantity,
    medicineId,
  ) => {
    if (prescribedQuantity > availableQuantity) {
      toast.error('please check quantity', toastconfig)
    } else {
      dispatch(openModal(`pack-modal-${medicineId}`))
      // Get GRN info for this item
      getGrnInfo.mutate(medicineId)
    }
  }
  // Handle payment mode selection (just sets state, doesn't process payment)
  const handlePaymentModeSelect = (modeOfPayment) => {
    setSelectedPaymentMode(modeOfPayment)
    setIsSplitPaymentMode(false)
    setSplitPayments([
      { method: '', amount: '' },
      { method: '', amount: '' },
    ])
  }

  // Handle split payment mode toggle
  const handleSplitPaymentToggle = () => {
    setIsSplitPaymentMode(!isSplitPaymentMode)
    setSelectedPaymentMode(null)
    if (!isSplitPaymentMode) {
      // Reset split payments when enabling
      setSplitPayments([
        { method: '', amount: '' },
        { method: '', amount: '' },
      ])
    }
  }

  // Handle split payment field changes
  const handleSplitPaymentChange = (index, field, value) => {
    setSplitPayments((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Validate split payment
  const validateSplitPayment = () => {
    const totalAmount = discountedAmount || calculateAmount()
    const enteredAmounts = splitPayments
      .filter((p) => p.method && p.amount)
      .map((p) => Number(p.amount) || 0)
    const totalEntered = enteredAmounts.reduce((sum, amt) => sum + amt, 0)

    // Check if at least two payment methods are selected
    const selectedMethods = splitPayments
      .filter((p) => p.method)
      .map((p) => p.method)

    if (selectedMethods.length < 2) {
      toast.error(
        'Please select at least two different payment methods',
        toastconfig,
      )
      return false
    }

    // Check if payment methods are different
    if (selectedMethods[0] === selectedMethods[1]) {
      toast.error('Payment methods must be different', toastconfig)
      return false
    }

    // Check if total matches
    if (Math.abs(totalEntered - totalAmount) > 0.01) {
      toast.error(
        `Total split amount (₹${totalEntered.toFixed(2)}) must equal bill amount (₹${totalAmount.toFixed(2)})`,
        toastconfig,
      )
      return false
    }

    return true
  }

  // Handle actual payment processing
  const handlePay = async () => {
    // Validate split payment if in split mode
    if (isSplitPaymentMode) {
      if (!validateSplitPayment()) {
        return
      }
    } else {
      if (!selectedPaymentMode) {
        toast.error('Please select a payment mode', toastconfig)
        return
      }
    }

    // Prevent duplicate requests
    if (isProcessingPayment) {
      return
    }

    if (!header?.appointmentId) {
      toast.error(
        'Patient ID is missing. Please reload and try again.',
        toastconfig,
      )
      console.error('Missing header.appointmentId:', header)
      return
    }

    setIsProcessingPayment(true)

    try {
      dispatch(showLoader())

      const detailsCopy = details
      // Build orderDetails with complete item structure matching backend format
      let paymentDBFormat = []
      const parseMaybeJSON = (value) => {
        if (value === null || value === undefined) return null
        if (typeof value !== 'string') return value
        try {
          return JSON.parse(value)
        } catch (e) {
          // Some inventory fields may already be plain text; keep original value.
          return value
        }
      }
      detailsCopy.map((medicineInfo) => {
        // Use discounted price if coupon is applied, otherwise use original totalCost
        const discountedPrice = getItemPrice(medicineInfo.id)

        // Find full item data from pharmacy items by matching itemName
        const fullItemData = pharmacyItems?.find(
          (item) => item.itemName === medicineInfo.itemName,
        )

        if (!fullItemData) {
          console.warn(
            `Full item data not found for: ${medicineInfo.itemName}. Using minimal structure.`,
          )
        }

        // Build complete item object matching backend structure from inventory SQL
        // Structure must match getAllPharmacyItemsQuery response
        const orderItem = {
          id: fullItemData?.id || null,
          itemName: medicineInfo.itemName,
          inventoryType: parseMaybeJSON(fullItemData?.inventoryType),
          manufacturer: parseMaybeJSON(fullItemData?.manufacturer),
          hsnCode: fullItemData?.hsnCode || null,
          categoryName: fullItemData?.categoryName || null,
          taxCategory: parseMaybeJSON(fullItemData?.taxCategory),
          isActive: fullItemData?.isActive ?? true,
          departmentId: fullItemData?.departmentId || null,
          departmentName: fullItemData?.departmentName || null,
          createdBy: parseMaybeJSON(fullItemData?.createdBy),
          createdAt: fullItemData?.createdAt || null,
          updatedAt: fullItemData?.updatedAt || null,
          prescribed: medicineInfo.purchaseQuantity || 0,
          totalCost: discountedPrice,
          refId: medicineInfo.refId, // Reference ID for line bill association
          type: header?.type || 'Treatment', // Required: "Treatment" or "Consultation"
          purchaseDetails: Array.isArray(medicineInfo?.itemPurchaseInformation)
            ? medicineInfo.itemPurchaseInformation.map((row) => ({
                grnId: row?.grnId,
                expiryDate: row?.expiryDate,
                mrpPerTablet: row?.mrpPerTablet,
                usedQuantity: row?.usedQuantity,
                returnedQuantity: row?.returnedQuantity,
                initialUsedQuantity: row?.initialUsedQuantity,
                batchNo: row?.batchNo,
                nonPurchaseReason:
                  row?.nonPurchaseReason ||
                  nonPurchaseReasons[medicineInfo.id] ||
                  null,
              }))
            : [],
        }

        paymentDBFormat.push(orderItem)
      })
      const totalAmount = detailsCopy.reduce(function (acc, obj) {
        return acc + Number(getItemPrice(obj.id))
      }, 0)

      const normalizeCurrency = (value, fallback = 0) => {
        const numericValue = Number(value)
        return Number.isFinite(numericValue)
          ? Number(numericValue.toFixed(2))
          : Number(fallback.toFixed(2))
      }

      // Avoid sending 0 accidentally when discountedAmount is not initialized yet.
      const paidOrderAmount = normalizeCurrency(discountedAmount, totalAmount)
      const discountAmount = normalizeCurrency(totalAmount - paidOrderAmount, 0)

      // Build payment payload for order creation
      let paymentPayload = {
        totalOrderAmount: Number(totalAmount.toFixed(2)),
        paidOrderAmount,
        discountAmount,
        couponCode: selectedCoupon?.id || null,
        orderDetails: paymentDBFormat,
        productType: 'PHARMACY',
      }

      // Prepare split payments data
      let splitPaymentsData = null
      if (isSplitPaymentMode) {
        const validPayments = splitPayments
          .filter((p) => p.method && p.amount)
          .map((p) => ({
            method: p.method,
            amount: Number(Number(p.amount || 0).toFixed(2)),
          }))

        // Keep existing backend contract by using the first method as paymentMode
        paymentPayload.paymentMode = validPayments[0]?.method || null
        splitPaymentsData = validPayments

        // Persist split metadata in order details so invoice can render exact split values.
        const splitPaymentSummary = validPayments
          .map((payment) => `${payment.method}: ₹${payment.amount.toFixed(2)}`)
          .join(', ')

        paymentPayload.orderDetails = paymentPayload.orderDetails.map(
          (item) => ({
            ...item,
            splitPayment: validPayments,
            splitPaymentSummary,
            isSplitPayment: true,
          }),
        )
      } else {
        paymentPayload.paymentMode = selectedPaymentMode // CASH, UPI, or ONLINE
      }

      console.log('Pharmacy order creation payload:', paymentPayload)

      // Step 1: Create order and get orderId
      const orderData = await getOrderId(user.accessToken, paymentPayload)

      console.log('Pharmacy order creation response:', orderData)

      // Extract orderId from response (different backends shape this differently)
      const orderId =
        orderData?.data?.orderId ||
        orderData?.orderId ||
        orderData?.data?.dataValues?.orderId ||
        orderData?.data?.id ||
        orderData?.id

      const orderCreatedSuccessfully =
        orderData?.status === 200 ||
        orderData?.success === true ||
        orderData?.data?.success === true ||
        orderData?.message === 'Payment Successful' ||
        orderData?.data?.message === 'Payment Successful'

      if (!orderId && !orderCreatedSuccessfully) {
        dispatch(hideLoader())
        setIsProcessingPayment(false)
        const createOrderErrorMessage =
          orderData?.message ||
          orderData?.error?.message ||
          orderData?.error ||
          'Failed to create order. Please try again.'
        toast.error(createOrderErrorMessage, toastconfig)
        return
      }

      // Step 2: Split metadata is stored in orderDetails and reused in invoice
      const data = orderData

      if (isSplitPaymentMode && splitPaymentsData) {
        console.log('Split payment details saved:', {
          orderId: orderId,
          payments: splitPaymentsData,
        })
      }

      // For CASH/UPI: backend directly processes payment
      // For ONLINE: backend might return orderId, but we treat it as successful without Razorpay
      // For SPLIT: check both order creation and split payment API responses
      if (
        data?.status === 200 ||
        data?.success === true ||
        data?.data?.orderId ||
        data?.message === 'Payment Successful'
      ) {
        dispatch(hideLoader())

        // Capture payment info before resetting state
        const appointmentId = header?.appointmentId
        const finalAmount = discountedAmount || calculateAmount()
        const currentSplitPayments = [...splitPayments]
        const currentIsSplitMode = isSplitPaymentMode
        // For split payment, use first method; otherwise use selected mode
        const currentPaymentMode = isSplitPaymentMode
          ? splitPayments.find((p) => p.method && p.amount)?.method || null
          : selectedPaymentMode

        // Close payment modal
        dispatch(closeModal(header?.appointmentId + 'pay' + column.label))

        // Reset payment state
        setSelectedCoupon(null)
        setDiscountedAmount(0)
        setSelectedPaymentMode(null)
        setIsSplitPaymentMode(false)
        setSplitPayments([
          { method: '', amount: '' },
          { method: '', amount: '' },
        ])

        // Immediately update React Query cache to move patient from PACKED → PAID
        if (appointmentId) {
          queryClient.setQueryData(
            ['pharmacyModuleInfoByDate', date, selectedbranch],
            (oldData) => {
              if (!oldData) return oldData

              const updatedData = { ...oldData }

              // Find patient in PACKED array
              const packedArray = updatedData.PACKED || []
              const patientIndex = packedArray.findIndex(
                (patient) => patient[appointmentId],
              )

              if (patientIndex !== -1) {
                // Get the patient data
                const patientData = packedArray[patientIndex]
                const patientKey = Object.keys(patientData)[0]
                const patient = patientData[patientKey]

                // Update itemDetails to mark items as PAID
                const updatedItemDetails = patient.itemDetails.map((item) => ({
                  ...item,
                  itemStage: 'PAID',
                }))

                // Prepare payment method information
                const paymentMethods = currentIsSplitMode
                  ? currentSplitPayments
                      .filter((p) => p.method && p.amount)
                      .map((p) => ({
                        method: p.method,
                        amount: Number(p.amount),
                      }))
                  : currentPaymentMode
                    ? [{ method: currentPaymentMode, amount: finalAmount }]
                    : null

                // Create updated patient object with payment method info
                const updatedPatient = {
                  [patientKey]: {
                    ...patient,
                    itemDetails: updatedItemDetails,
                    header: {
                      ...patient.header,
                      paymentMode: currentPaymentMode,
                      paymentMethods: paymentMethods,
                    },
                  },
                }

                // Remove from PACKED
                updatedData.PACKED = [
                  ...packedArray.slice(0, patientIndex),
                  ...packedArray.slice(patientIndex + 1),
                ]

                // Add to PAID
                if (!updatedData.PAID) {
                  updatedData.PAID = []
                }
                updatedData.PAID = [...updatedData.PAID, updatedPatient]

                return updatedData
              }

              return oldData
            },
          )
        }

        toast.success('Payment Successful! Patient moved to Paid.', toastconfig)

        // Refetch to ensure backend consistency (runs in background)
        queryClient.refetchQueries({
          queryKey: ['pharmacyModuleInfoByDate', date, selectedbranch],
        })
      } else {
        dispatch(hideLoader())
        const errorMessage =
          data?.message ||
          data?.error?.message ||
          data?.error ||
          'Payment processing failed'
        console.error('Payment failed:', data)
        toast.error(`Payment failed: ${errorMessage}`, toastconfig)
      }
    } catch (error) {
      dispatch(hideLoader())
      console.error('Error processing payment:', error)
      let errorMessage = 'Payment failed, please try again'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      toast.error(`Payment Error: ${errorMessage}`, toastconfig)
    } finally {
      setIsProcessingPayment(false)
    }
  }
  const getPrescribedValue = (appointmentID, stage) => {
    const searchedContent = details?.find((info) => info?.id === appointmentID)
    return stage === 'PRESCRIBED'
      ? searchedContent?.prescribedQuantity
      : searchedContent?.purchaseQuantity
  }
  const setQuantity = (appointmentID, value, stage) => {
    const changedValues = details?.map((info) => {
      if (info && info?.id == appointmentID) {
        if (stage === 'PRESCRIBED') {
          info.prescribedQuantity = value
        } else {
          setSaveEnabled(true)
          info.purchaseQuantity = value
        }
      }
      return info
    })
    setDetails(changedValues)
  }
  // const calculateAmount = () => {
  //   // console.log('paymentBreakup', details)
  //   let totalAmount = 0
  //   if (details?.length !== 0) {
  //     details.forEach(medicineInfo => {
  //       let itemPurchaseInformation = JSON.parse(medicineInfo?.itemPurchaseInformation)
  //       totalAmount += itemPurchaseInformation?.reduce((sum, row) => {
  //         return sum + ((row.usedQuantity - row.returnedQuantity) * row.mrpPerTablet)
  //       }, 0)
  //     })
  //   }
  //   return totalAmount
  // }
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await savePharmacyItems(user.accessToken, payload)
      if (res.status === 200) {
        toast.success('Packed successfully', toastconfig)
        console.log(res)
      } else {
        toast.error(res, toastconfig)
      }
      queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
    },
  })

  const canMoveBackToPrescribed =
    column.label === 'PACKED' && isPharmacistRole(user?.roleDetails)

  const moveToPrescribedMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await savePharmacyItems(user.accessToken, {
        movetopackedstage: payload,
      })
      return res
    },
    onSuccess: (res, variables) => {
      if (res?.status === 200) {
        const count = variables.length
        toast.success(
          `${count} item(s) moved to Prescribed successfully`,
          toastconfig,
        )
        const movedIds = variables.map((item) => item.id)
        setDetails((prev) => prev.filter((med) => !movedIds.includes(med.id)))
        setGrnRows((prev) => {
          const next = { ...prev }
          movedIds.forEach((id) => delete next[id])
          return next
        })
        queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
      } else {
        toast.error(res?.message || 'Failed to move items', toastconfig)
      }
    },
    onError: () => {
      toast.error('Failed to move items to Prescribed', toastconfig)
    },
  })

  const buildMoveToPrescribedPayload = (items) =>
    items.map((item) => ({
      id: item.id,
      type,
      purchaseQuantity: 0,
      itemPurchaseInformation: [],
    }))

  const handleMoveToPrescribed = (items) => {
    if (!items?.length) return
    const itemNames = items.map((item) => item.itemName).join(', ')
    if (
      confirm(
        `Move ${items.length} item(s) back to Prescribed? This will reset packed quantities for: ${itemNames}`,
      )
    ) {
      moveToPrescribedMutation.mutate(buildMoveToPrescribedPayload(items))
    }
  }

  const handleMoveAllToPrescribed = () => {
    if (!details?.length) return
    handleMoveToPrescribed(details)
  }
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [discountedAmount, setDiscountedAmount] = useState()
  // Single payment mode state for Packed → Pay popup
  const [selectedPaymentMode, setSelectedPaymentMode] = useState(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  // Split payment state
  const [isSplitPaymentMode, setIsSplitPaymentMode] = useState(false)
  const [splitPayments, setSplitPayments] = useState([
    { method: '', amount: '' },
    { method: '', amount: '' },
  ])

  // Add sample coupons (you can replace with API data)
  // const coupons = [
  //   { id: 1, code: 'PHARMACY50', discount: 50 },
  //   { id: 2, code: 'SAVE20', discount: 20 },
  //   { id: 3, code: 'SPECIAL30', discount: 30 },
  // ]
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await getCoupons(user.accessToken)
      return res.data
    },
  })

  // Fetch pharmacy items to get full item structure for orderDetails
  const { data: pharmacyItems } = useQuery({
    queryKey: ['pharmacyItems'],
    queryFn: async () => {
      const res = await getPharmacyMasterData(
        user.accessToken,
        API_ROUTES.GET_ALL_PHARMACY_ITEMS,
      )
      if (res.status === 200) {
        return res.data
      }
      return []
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
  // const coupons = useSelector(store => store.coupon)
  // console.log(coupons)
  const calculateDiscountedAmount = (coupon) => {
    if (!coupon) return calculateAmount()
    const discount = (calculateAmount() * coupon.discountPercentage) / 100
    return calculateAmount() - discount
  }
  const makePayment = useMutation({
    mutationFn: async (payload) => {
      const res = await getOrderId(user.accessToken, payload)
      // return res
    },
    onSuccess: (response) => {
      console.log(response)
    },
  })
  const handleButtonAction = (isSaveEnabled, editMedicineId = null) => {
    let raiseToast = false
    details.map((medData) => {
      if (medData.purchaseQuantity > medData.prescribedQuantity) {
        console.log(medData)

        raiseToast = true
      }
    })

    if (raiseToast) {
      toast.error(
        'Purchased quantity greater than prescribed quantity',
        toastconfig,
      )
    } else {
      if (isSaveEnabled) {
        let data = details
        const dbFormat = []

        data.forEach((itemInfo) => {
          // Check if this item has modified GRN rows
          if (grnRows[itemInfo.id]) {
            // This item has been modified - use new GRN data
            const itemGrnRows = grnRows[itemInfo.id]

            // Calculate total quantities from initial packed − returns
            const totalUsedQuantity = itemGrnRows.reduce(
              (sum, row) =>
                sum + Number(row.initialUsedQuantity ?? row.usedQuantity ?? 0),
              0,
            )
            const totalReturnedQuantity = itemGrnRows.reduce(
              (sum, row) => sum + Number(row.returnedQuantity || 0),
              0,
            )
            console.log(
              'totalUsedQuantity & totalReturnedQuantity',
              totalUsedQuantity,
              totalReturnedQuantity,
            )
            const finalQuantity = totalUsedQuantity - totalReturnedQuantity
            const nonPurchaseReason = reasonForItem(
              itemInfo.id,
              itemInfo.prescribedQuantity,
              finalQuantity,
            )

            // Format GRN information for modified items
            const itemPurchaseInformation = itemGrnRows
              .filter((row) => {
                if (!row.grnId) return false
                const initialQty = Number(
                  row.initialUsedQuantity ?? row.usedQuantity ?? 0,
                )
                const returnedQty = Number(row.returnedQuantity || 0)
                return initialQty > 0 || returnedQty > 0
              })
              .map((row) => {
                const initialQty = Number(
                  row.initialUsedQuantity ?? row.usedQuantity ?? 0,
                )
                const returnedQty = Number(row.returnedQuantity || 0)
                return {
                  grnId: row.grnId.grnId,
                  expiryDate: row.grnId.expiryDate,
                  mrpPerTablet: row.grnId.mrpPerTablet,
                  usedQuantity: Math.max(0, initialQty - returnedQty),
                  returnedQuantity: returnedQty,
                  initialUsedQuantity: initialQty,
                  batchNo: row.grnId.batchNo,
                  nonPurchaseReason,
                }
              })

            dbFormat.push({
              id: itemInfo.id,
              type: type,
              purchaseQuantity: finalQuantity,
              itemPurchaseInformation: itemPurchaseInformation,
            })
          } else {
            // This item was not modified - use existing data
            dbFormat.push({
              id: itemInfo.id,
              type: type,
              purchaseQuantity: itemInfo.purchaseQuantity || 0,
              itemPurchaseInformation: (itemInfo.itemPurchaseInformation
                ? typeof itemInfo.itemPurchaseInformation === 'string'
                  ? JSON.parse(itemInfo.itemPurchaseInformation)
                  : itemInfo.itemPurchaseInformation
                : []
              ).map((detail) => ({
                ...detail,
                nonPurchaseReason: reasonForItem(
                  itemInfo.id,
                  itemInfo.prescribedQuantity,
                  itemInfo.purchaseQuantity || 0,
                ),
              })),
            })
          }
        })

        // Validate the data before sending
        const isValid = dbFormat.every((item) => {
          if (!grnRows[item.id]) return true // Skip validation for unmodified items

          const totalPackedQuantity = item.itemPurchaseInformation.reduce(
            (sum, grn) =>
              sum +
              Number(grn.initialUsedQuantity || 0) -
              Number(grn.returnedQuantity || 0),
            0,
          )
          console.log(
            'totalPackedQuantity',
            totalPackedQuantity,
            item.purchaseQuantity,
          )
          return totalPackedQuantity === item.purchaseQuantity
        })

        if (!isValid) {
          toast.error('Please check quantities and return values', toastconfig)
          return
        }

        paymentBreakup.mutate({
          generateBreakUp: dbFormat,
          clickedFromPacked: true,
          editMedicineId,
        })
      } else {
        console.log(hdrKey)
        dispatch(openModal(hdrKey + 'pay' + column.label))
      }
    }
  }
  useEffect(() => {
    if (
      isPending ||
      paymentBreakup?.isLoading ||
      moveToPrescribedMutation.isPending
    ) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [
    isPending,
    itemDetails,
    paymentBreakup?.isLoading,
    moveToPrescribedMutation.isPending,
  ])
  useEffect(() => {
    let data = itemDetails.map((itemInfo) => {
      let items = JSON.parse(itemInfo.itemPurchaseInformation)
      console.log(items)
      return {
        ...itemInfo,
        itemPurchaseInformation: items,
        // itemPurchaseInformation: itemInfo.itemPurchaseInformation
        //   ? JSON.parse(itemInfo.itemPurchaseInformation)
        //   : [],
        pack: false,
        saveEnabled: false,
      }
    })
    const initialReasons = {}
    data.forEach((itemInfo) => {
      initialReasons[itemInfo.id] =
        itemInfo?.nonPurchaseReason ||
        itemInfo?.itemPurchaseInformation?.find(
          (detail) => detail?.nonPurchaseReason,
        )?.nonPurchaseReason ||
        ''
    })
    setNonPurchaseReasons(initialReasons)

    const dbFormat = data.map((itemInfo) => {
      return {
        id: itemInfo.id,
        type: type,
        purchaseQuantity: itemInfo?.purchaseQuantity || 0,
        itemPurchaseInformation: itemInfo.itemPurchaseInformation,
      }
    })

    if (column?.label === 'PACKED') {
      console.log(dbFormat)
      paymentBreakup.mutate({
        generateBreakUp: dbFormat,
        clickedFromPacked: false,
      })
    }

    console.log('data', data)
    setDetails(data)
  }, [])

  // Re-validate button state when grnRows changes (for PRESCRIBED section)
  useEffect(() => {
    if (column?.label === 'PRESCRIBED' && details?.length > 0) {
      validateQuantities(details)
    }
  }, [grnRows, details, column?.label])

  // const paymentBreakup = useMutation({
  //   mutationFn: async (payload) => {
  //     const res = await
  //     if (res.status === 200) {
  //       toast.success('Packed successfully', toastconfig)
  //       console.log(res)
  //     } else {
  //       toast.error(res, toastconfig)
  //     }
  //   },
  // })
  const reportRef = useRef(null)
  const invoiceModalId =
    header?.invoiceOrderId || header?.invoiceDbId || header?.appointmentId
  const generateReport = useMutation({
    mutationFn: async (payload) => {
      const res = await Generate_Invoice(user.accessToken, payload)
      console.log(res.data)
      reportRef.current.innerHTML = res?.data
      console.log(res.data)
    },
  })

  const handleInvoicePrint = async () => {
    const invoiceDbId = Number(header?.invoiceDbId)
    await generateReport.mutate({
      appointmentId: header.appointmentId,
      productType: 'PHARMACY', // same values used in tranasction api
      type: header.type, // Consultation or Treatment
      ...(Number.isFinite(invoiceDbId) ? { id: invoiceDbId } : {}),
    })
    dispatch(openModal(invoiceModalId + 'invoice'))
  }

  const Print = async () => {
    const { default: html2pdf } = await import('html2pdf.js')
    if (window && reportRef.current) {
      const element = reportRef.current
      const opt = {
        margin: 10,
        filename: 'report.pdf',
        image: { type: 'png', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          pdf.autoPrint()
          window.open(pdf.output('bloburl'), '_blank')
        })
    }
  }
  const getInfo = (med) => {
    if (med?.prescriptionDetails?.startsWith('OTHER_')) {
      return `Dosage: ${med?.prescriptionDetails.split('_')[1]}, Days - ${
        med?.prescriptionDays
      }`
    }
    return `Quantity: ${med?.prescriptionDetails} , Days - ${med?.prescriptionDays}`
  }

  // GRN stock options keyed by medicine line-bill id — shared list caused one
  // medicine's MRP to price every other medicine in the accordion.
  const [availableGrnsByItemId, setAvailableGrnsByItemId] = useState({})

  // Calculate price for a medicine in PRESCRIBED section
  // Uses actual entered/packed quantity, not prescribed quantity
  const calculateMedicinePrice = (med) => {
    // Get the actual quantity entered/selected (from GRN rows or TextField)
    const medicineGrnRows = grnRows[med.id] || []

    // If GRN rows are selected, use actual GRN quantities and their individual MRPs
    if (
      medicineGrnRows.length > 0 &&
      medicineGrnRows.some((row) => row.grnId && row.usedQuantity > 0)
    ) {
      const selectedGrns = medicineGrnRows.filter(
        (row) => row.grnId && Number(row.usedQuantity || 0) > 0,
      )

      if (selectedGrns.length > 0) {
        // Calculate price based on actual GRN quantities × their MRPs
        const totalPrice = selectedGrns.reduce((sum, row) => {
          const qty = Number(row.usedQuantity || 0)
          const mrpPerTablet = Number(row.grnId?.mrpPerTablet || 0)
          return sum + qty * mrpPerTablet
        }, 0)
        return totalPrice
      }
    }

    // If no GRN rows selected yet, use the quantity from TextField (user-entered quantity)
    // This is stored in med.prescribedQuantity after setQuantity is called
    const enteredQty = Number(med?.prescribedQuantity || 0)
    if (enteredQty === 0) return 0

    // Average MRP from THIS medicine's GRNs only (never share across medicines)
    const medicineAvailableGrns = availableGrnsByItemId[med.id] || []
    const grnsInStock = medicineAvailableGrns.filter(
      (grn) => Number(grn.totalQuantity || 0) > 0,
    )
    if (grnsInStock.length > 0) {
      const avgMrp =
        grnsInStock.reduce(
          (sum, grn) => sum + Number(grn.mrpPerTablet || 0),
          0,
        ) / grnsInStock.length
      return enteredQty * avgMrp
    }

    // No price data available yet
    return 0
  }

  // Calculate grand total for PRESCRIBED section
  // Automatically recalculates when details or grnRows change
  const calculateGrandTotal = () => {
    if (column.label !== 'PRESCRIBED') return 0
    return details.reduce((total, med) => {
      return total + calculateMedicinePrice(med)
    }, 0)
  }

  // Memoize grand total calculation for performance (optional optimization)
  // Note: calculateMedicinePrice already uses current state values, so it's reactive

  const getGrnInfo = useMutation({
    mutationFn: async (itemId) => {
      const res = await getAvailableGrnInfoByItemId(
        user.accessToken,
        itemId,
        type,
        selectedbranch,
      )
      return { res, itemId }
    },
    onSuccess: ({ res, itemId }) => {
      console.log('data', res)
      if (res.status == 200) {
        setAvailableGrnsByItemId((prev) => ({
          ...prev,
          [itemId]: res.data.availableGrnInfo || [],
        }))
      } else {
        setAvailableGrnsByItemId((prev) => ({
          ...prev,
          [itemId]: [],
        }))
        toast.error(res.message)
      }
    },
  })

  // Updated validation: Check if at least one medicine has quantity entered
  // Button enables when at least one medicine has valid GRN selections or quantity entered
  const validateQuantities = (items) => {
    // Check if items array exists and has elements
    if (!items || items.length === 0) {
      setDisabled(true)
      return false
    }

    // Check if at least one item has a valid GRN entry or quantity entered
    // A valid entry means:
    // 1. At least one GRN row exists for the medicine
    // 2. That GRN row has a grnId selected
    // 3. The usedQuantity is > 0
    // 4. The total GRN quantity doesn't exceed prescribed quantity
    const hasAtLeastOneValid = items.some((item) => {
      // Get GRN rows for this specific medicine
      const medicineGrnRows = grnRows[item.id] || []

      // Check if there's at least one valid GRN entry
      const hasValidGrnEntry = medicineGrnRows.some(
        (row) => row.grnId && Number(row.usedQuantity || 0) > 0,
      )

      if (!hasValidGrnEntry) {
        return false
      }

      // Calculate total quantity from selected GRNs for this medicine
      const totalGrnQuantity = medicineGrnRows.reduce((sum, row) => {
        return sum + (Number(row.usedQuantity) || 0)
      }, 0)

      // Ensure total GRN quantity doesn't exceed prescribed quantity
      const prescribedQty = parseFloat(item.prescribedQuantity) || 0
      return totalGrnQuantity > 0 && totalGrnQuantity <= prescribedQty
    })

    // Set button disabled state based on validation
    // Enable if at least one medicine has quantity entered
    setDisabled(!hasAtLeastOneValid)
    return hasAtLeastOneValid
  }
  const handleGrnSelection = (medicineId) => {
    // Update the details state to include the selected GRNs
    setDetails((prevDetails) => {
      const updatedDetails = prevDetails.map((med) => {
        if (med.id === medicineId) {
          return {
            ...med,
            itemPurchaseInformation: grnRows[medicineId]
              .filter((row) => row.grnId && row.usedQuantity > 0)
              .map((row) => ({
                expiryDate: row.grnId.expiryDate,
                mrpPerTablet: row.grnId.mrpPerTablet,
                grnId: row.grnId.grnId,
                returnedQuantity: 0,
                usedQuantity: Number(row.usedQuantity),
                batchNo: row.grnId.batchNo,
              })),
          }
        }
        return med
      })

      // Validate with updated details (will also be validated by useEffect when state updates)
      // This ensures immediate validation feedback
      validateQuantities(updatedDetails)

      return updatedDetails
    })

    dispatch(closeModal(`pack-modal-${medicineId}`))
  }

  // Function to validate quantities and control button state

  // console.log('grnRows-', grnRows)

  // Add new state for pricing
  const [priceDetails, setPriceDetails] = useState({
    itemPrices: {}, // Store individual item prices
    totalAmount: 0, // Store total amount
  })

  // Create a function to calculate prices
  const calculatePrices = useCallback(() => {
    console.log('details', priceDetails)
    if (!details?.length) {
      setPriceDetails({ itemPrices: {}, totalAmount: 0 })
      return
    }

    const newItemPrices = {}
    let newTotalAmount = 0

    details.forEach((medicineInfo) => {
      // Check if coupon is applied for this item
      const couponApplied =
        itemCoupons[medicineInfo.id]?.applied &&
        itemCoupons[medicineInfo.id]?.discount === 100

      // If totalCost exists from API response, use it (but apply coupon discount)
      if (medicineInfo.totalCost !== undefined) {
        const basePrice = medicineInfo.totalCost
        // Apply coupon discount
        const discountedPrice = couponApplied ? 0 : basePrice
        newItemPrices[medicineInfo.id] = discountedPrice
        newTotalAmount += discountedPrice
      } else {
        // Otherwise calculate from itemPurchaseInformation
        let itemPurchaseInformation = medicineInfo?.itemPurchaseInformation
          ? typeof medicineInfo.itemPurchaseInformation === 'string'
            ? JSON.parse(medicineInfo.itemPurchaseInformation)
            : medicineInfo.itemPurchaseInformation
          : []

        const itemPrice = itemPurchaseInformation.reduce((sum, row) => {
          const mrpPerTablet = Number(row.mrpPerTablet) || 0
          const usedQuantity = Number(
            row.initialUsedQuantity || row.usedQuantity || 0,
          )
          const returnedQuantity = Number(row.returnedQuantity || 0)
          const finalQuantity = usedQuantity - returnedQuantity

          return sum + finalQuantity * mrpPerTablet
        }, 0)

        // Apply coupon discount
        const discountedPrice = couponApplied ? 0 : itemPrice
        newItemPrices[medicineInfo.id] = discountedPrice
        newTotalAmount += discountedPrice
      }
    })

    setPriceDetails({
      itemPrices: newItemPrices,
      totalAmount: newTotalAmount,
    })
  }, [details, itemCoupons])

  // Update prices when details change
  useEffect(() => {
    calculatePrices()
  }, [details, calculatePrices])

  // Replace calculateAmount with a simple getter
  const calculateAmount = () => priceDetails.totalAmount

  // Update discounted amount when coupon or prices change
  useEffect(() => {
    setDiscountedAmount(calculateDiscountedAmount(selectedCoupon))
  }, [selectedCoupon, priceDetails.totalAmount, itemCoupons])

  // Add a function to get individual item price (with coupon discount applied)
  const getItemPrice = (itemId) => {
    const basePrice = priceDetails.itemPrices[itemId] || 0
    // Apply coupon discount if coupon is applied for this item
    if (itemCoupons[itemId]?.applied && itemCoupons[itemId]?.discount === 100) {
      return 0 // 100% discount means free
    }
    return basePrice
  }

  // Handle coupon menu open
  const handleCouponMenuOpen = (event, itemId) => {
    setCouponMenuAnchor(event.currentTarget)
    setSelectedItemForCoupon(itemId)
  }

  // Handle coupon menu close
  const handleCouponMenuClose = () => {
    setCouponMenuAnchor(null)
    setSelectedItemForCoupon(null)
  }

  // Handle applying 100% discount coupon
  const handleApplyCoupon = (itemId) => {
    setItemCoupons((prev) => ({
      ...prev,
      [itemId]: {
        applied: true,
        discount: 100,
      },
    }))

    // Update the details to reflect the discount in totalCost
    setDetails((prevDetails) =>
      prevDetails.map((med) => {
        if (med.id === itemId) {
          return {
            ...med,
            totalCost: 0, // Set totalCost to 0 for this item
          }
        }
        return med
      }),
    )

    handleCouponMenuClose()
    toast.success('100% Discount coupon applied!', toastconfig)
  }

  const handleEdit = (med, index) => {
    // Parse existing GRN information
    let existingGrns =
      typeof med.itemPurchaseInformation === 'string'
        ? (() => {
            try {
              return JSON.parse(med.itemPurchaseInformation)
            } catch {
              return []
            }
          })()
        : med.itemPurchaseInformation

    if (!Array.isArray(existingGrns)) {
      existingGrns = []
    }

    if (existingGrns.length === 0) {
      toast.error('No packed GRN details found for this medicine', toastconfig)
      return
    }

    getGrnInfo.mutate(med?.id)
    dispatch(openModal(`pack-modal-${med?.id}`))

    console.log('existingGrns', existingGrns)
    // Set GRN rows with all three quantities for return/edit flow
    setGrnRows((prev) => ({
      ...prev,
      [med.id]: existingGrns.map((info) => {
        const initialQty = Number(
          info.initialUsedQuantity ?? info.usedQuantity ?? 0,
        )
        const returnedQty = Number(info.returnedQuantity || 0)
        const currentQty = Number(
          info.usedQuantity ?? Math.max(0, initialQty - returnedQty),
        )
        return {
          grnId: {
            grnId: info.grnId,
            expiryDate: info.expiryDate,
            mrpPerTablet: info.mrpPerTablet,
            totalQuantity: initialQty,
            batchNo: info.batchNo,
          },
          initialUsedQuantity: initialQty,
          usedQuantity: currentQty,
          returnedQuantity: returnedQty,
        }
      }),
    }))
  }
  return (
    <div>
      <Modal
        // uniqueKey={'invoice'}
        key="invoice"
        uniqueKey={invoiceModalId + 'invoice'}
        maxWidth={'md'}
        closeOnOutsideClick={false}
        onOutsideClick={() => {
          dispatch(closeModal(invoiceModalId + 'invoice'))
        }}
      >
        <div className="relative flex justify-end">
          <Button
            onClick={() => Print()}
            className="gap-2 flex right-0 capitalize text-white"
            variant="contained"
          >
            <span>Print</span>
            <PrintRounded color="white" />
          </Button>
          <IconButton
            onClick={() => dispatch(closeModal(invoiceModalId + 'invoice'))}
          >
            <Close />
          </IconButton>
        </div>
        <div ref={reportRef} className="transition-all"></div>
      </Modal>
      <TableContainer className="flex-1">
        <Table>
          <TableHead>
            <TableRow className="bg-slate-200 rounder-lg">
              <TableCell
                align="center"
                className="font-bold border-0 rounder-lg"
              >
                Medicine
              </TableCell>
              {column.label === 'PAID' && (
                <>
                  {
                    <TableCell
                      align="center"
                      className="font-bold border-0 rounder-lg"
                    >
                      {'InTake Time'}
                    </TableCell>
                  }
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    Payment Method
                  </TableCell>
                </>
              )}
              {column.label === 'PRESCRIBED' && (
                <>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'Available Quantity'} placement="top">
                      Available
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'Prescribed Quantity'} placement="top">
                      Prescribed
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip
                      title={'Remaining = Prescribed - Dispensed'}
                      placement="top"
                    >
                      Balance
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip
                      title={'Price = Prescribed × Price per unit'}
                      placement="top"
                    >
                      Price
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    Action
                  </TableCell>
                </>
              )}
              {column.label === 'PACKED' && (
                <>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    Packed
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'Edit GRNs'} placement="top">
                      GRNs
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'Apply Coupon'} placement="top">
                      Coupon
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="center"
                    className="font-bold border-0 rounder-lg"
                  >
                    <Tooltip title={'MRP per unit'} placement="top">
                      Price
                    </Tooltip>
                  </TableCell>
                  {canMoveBackToPrescribed && (
                    <TableCell
                      align="center"
                      className="font-bold border-0 rounder-lg"
                    >
                      Action
                    </TableCell>
                  )}
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {console.log(details)} */}
            {details?.map((med, index) => (
              <TableRow key={med?.id + column.label + index + med?.itemName}>
                <TableCell align="center" className="border-0">
                  {med?.itemName}
                </TableCell>
                {column.label === 'PAID' && (
                  <>
                    {
                      <TableCell align="center" className="border-0">
                        {/* {getPrescriptionDetails(med?.prescriptionDetails)} */}
                        <span className="flex gap-2 flex-wrap">
                          {med?.prescriptionDetails
                            ?.split(',')
                            .map((each, index) => (
                              <Chip
                                key={
                                  index + 'chip' + each + med?.id + column.label
                                }
                                // label={each}
                                label={
                                  each.split('_')[0] == 'OTHER'
                                    ? each.split('_')[1]
                                    : each
                                }
                                color="success"
                              />
                            ))}
                        </span>
                      </TableCell>
                    }
                    <TableCell align="center" className="border-0">
                      {header?.paymentMethods ? (
                        <span className="flex gap-2 flex-wrap justify-center">
                          {Array.isArray(header.paymentMethods) ? (
                            header.paymentMethods.map((pm, idx) => (
                              <Chip
                                key={idx}
                                label={`${pm.method}: ₹${pm.amount}`}
                                color="primary"
                                size="small"
                              />
                            ))
                          ) : (
                            <Chip
                              label={header.paymentMethods}
                              color="primary"
                              size="small"
                            />
                          )}
                        </span>
                      ) : header?.paymentMode ? (
                        <Chip
                          label={header.paymentMode}
                          color="primary"
                          size="small"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                  </>
                )}
                {column.label === 'PRESCRIBED' && (
                  <>
                    <TableCell align="center" className="border-0">
                      {med?.availableQuantity}
                    </TableCell>
                    <TableCell
                      align="center"
                      className="border-0 flex items-center gap-2"
                    >
                      <TextField
                        id="standard-basic"
                        align="center"
                        size="small"
                        value={getPrescribedValue(med?.id, column?.label)}
                        type="number"
                        InputProps={{
                          // startAdornment: <span className="text-gray-500 mr-1">₹</span>,
                          inputProps: {
                            min: 0,
                            max: med?.prescribedQuantity,
                            step: '1',
                          },
                        }}
                        // InputProps={{ inputProps: { min: 1, max: med?.prescribedQuantity } }}
                        error={med?.prescribedQuantity > med?.availableQuantity}
                        onChange={(e) => {
                          setQuantity(med?.id, e.target.value, column.label)
                        }}
                        disabled={
                          med?.prescribedQuantity < med?.availableQuantity
                        }
                      />
                      {/* info icon */}
                      <Tooltip title={`${getInfo(med)}`} placement="top">
                        <Info className="w-4 h-4" />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      {Math.max(
                        0,
                        Number(med?.prescribedQuantity || 0) -
                          Number(
                            (grnRows[med.id] || []).reduce(
                              (sum, row) => sum + Number(row.usedQuantity || 0),
                              0,
                            ),
                          ),
                      )}
                    </TableCell>
                    <TableCell align="center" className="border-0 font-medium">
                      ₹{calculateMedicinePrice(med).toFixed(2)}
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      <Button
                        variant={!med?.pack ? 'outlined' : 'contained'}
                        className={`h-10  w-24 capitalize`}
                        onClick={() =>
                          validateAndPack(
                            med?.prescribedQuantity,
                            med?.availableQuantity,
                            med?.id,
                            column.label,
                          )
                        }
                        color={
                          grnRows[med.id]?.reduce(
                            (sum, row) => sum + Number(row.usedQuantity || 0),
                            0,
                          ) === Number(med.prescribedQuantity)
                            ? 'success'
                            : 'primary'
                        }
                        size="small"
                      >
                        {grnRows[med.id]?.reduce(
                          (sum, row) => sum + Number(row.usedQuantity || 0),
                          0,
                        ) === Number(med?.prescribedQuantity)
                          ? 'Packed'
                          : 'Pack'}
                      </Button>
                    </TableCell>
                  </>
                )}
                {column.label === 'PACKED' && (
                  <>
                    <TableCell align="center" className="border-0">
                      {/* {console.log(med)} */}
                      <Typography>
                        {med?.itemPurchaseInformation?.reduce(
                          (sum, detail) => sum + Number(detail.usedQuantity),
                          0,
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      <IconButton onClick={() => handleEdit(med, index)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      <div className="flex flex-col items-center gap-1">
                        <IconButton
                          size="small"
                          onClick={(e) => handleCouponMenuOpen(e, med.id)}
                          disabled={itemCoupons[med.id]?.applied}
                          color={
                            itemCoupons[med.id]?.applied ? 'success' : 'primary'
                          }
                        >
                          <LocalOffer />
                        </IconButton>
                        {itemCoupons[med.id]?.applied && (
                          <Chip
                            label="100% OFF"
                            size="small"
                            color="success"
                            className="text-xs"
                          />
                        )}
                      </div>
                      <Menu
                        anchorEl={couponMenuAnchor}
                        open={
                          Boolean(couponMenuAnchor) &&
                          selectedItemForCoupon === med.id
                        }
                        onClose={handleCouponMenuClose}
                      >
                        <MenuItem onClick={() => handleApplyCoupon(med.id)}>
                          100% Discount
                        </MenuItem>
                      </Menu>
                    </TableCell>
                    <TableCell align="center" className="border-0">
                      <div className="flex flex-col items-center gap-1">
                        {itemCoupons[med.id]?.applied ? (
                          <>
                            <Typography
                              variant="body2"
                              className="line-through text-gray-400"
                            >
                              {(() => {
                                // Calculate original price from itemPurchaseInformation
                                let itemPurchaseInformation =
                                  med?.itemPurchaseInformation
                                    ? typeof med.itemPurchaseInformation ===
                                      'string'
                                      ? JSON.parse(med.itemPurchaseInformation)
                                      : med.itemPurchaseInformation
                                    : []
                                const originalPrice =
                                  itemPurchaseInformation.reduce((sum, row) => {
                                    const mrpPerTablet =
                                      Number(row.mrpPerTablet) || 0
                                    const usedQuantity = Number(
                                      row.initialUsedQuantity ||
                                        row.usedQuantity ||
                                        0,
                                    )
                                    const returnedQuantity = Number(
                                      row.returnedQuantity || 0,
                                    )
                                    const finalQuantity =
                                      usedQuantity - returnedQuantity
                                    return sum + finalQuantity * mrpPerTablet
                                  }, 0)
                                return originalPrice > 0
                                  ? originalPrice.toFixed(2)
                                  : (med.totalCost || 0).toFixed(2)
                              })()}
                            </Typography>
                            <Typography
                              variant="body2"
                              className="text-green-600 font-bold"
                            >
                              {getItemPrice(med?.id).toFixed(2)}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2">
                            {getItemPrice(med?.id).toFixed(2)}
                          </Typography>
                        )}
                      </div>
                    </TableCell>
                    {canMoveBackToPrescribed && (
                      <TableCell align="center" className="border-0">
                        <Tooltip
                          title="Move back to Prescribed"
                          placement="top"
                        >
                          <span>
                            <IconButton
                              size="small"
                              color="warning"
                              disabled={moveToPrescribedMutation.isPending}
                              onClick={() => handleMoveToPrescribed([med])}
                            >
                              <Undo fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    )}
                  </>
                )}
              </TableRow>
            ))}
            {column.label == 'PAID' && (
              <Button onClick={handleInvoicePrint}>Print Invoice</Button>
            )}
          </TableBody>
          {column.label === 'PRESCRIBED' && details?.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={4}
                  align="right"
                  className="font-bold border-t-2"
                >
                  Grand Total:
                </TableCell>
                <TableCell align="center" className="font-bold border-t-2">
                  ₹{calculateGrandTotal().toFixed(2)}
                </TableCell>
                <TableCell className="border-t-2"></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
      {column.label == 'PRESCRIBED' && (
        <div>
          <Button
            variant="contained"
            className=" float-right"
            onClick={() => {
              validateAndCallAPI()
            }}
            disabled={disabled}
          >
            Move to packed
          </Button>
        </div>
      )}
      {column.label == 'PACKED' && (
        <div className="flex flex-col gap-3">
          {details
            ?.filter((med) => {
              const packedQty = Number(
                med?.purchaseQuantity ??
                  med?.itemPurchaseInformation?.reduce(
                    (sum, detail) => sum + Number(detail.usedQuantity),
                    0,
                  ) ??
                  0,
              )
              const prescribedQty = Number(med?.prescribedQuantity || 0)
              return shouldShowNonPurchaseReason(prescribedQty, packedQty)
            })
            .map((med) => (
              <div
                key={`packed-reason-${med.id}`}
                className="flex flex-col gap-1"
              >
                <Typography
                  variant="caption"
                  className="font-medium text-gray-700"
                >
                  Reason (Optional) - {med?.itemName}
                </Typography>
                <TextField
                  value={nonPurchaseReasons[med.id] || ''}
                  onChange={(e) =>
                    updateNonPurchaseReason(med.id, e.target.value)
                  }
                  placeholder="Reason for partial / not purchased"
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                />
              </div>
            ))}

          <div className="flex justify-between items-center flex-wrap gap-2">
            <span className=" font-medium">
              Tot. Amount: ₹{calculateAmount().toFixed(2)}
            </span>
            <div className="flex gap-2 flex-wrap">
              {canMoveBackToPrescribed && details?.length > 0 && (
                <Button
                  variant="outlined"
                  color="warning"
                  className="h-10 capitalize"
                  disabled={moveToPrescribedMutation.isPending}
                  onClick={handleMoveAllToPrescribed}
                >
                  {moveToPrescribedMutation.isPending
                    ? 'Moving...'
                    : 'Move to Prescribed'}
                </Button>
              )}
              <Button
                variant="contained"
                className="h-10 text-white"
                onClick={() => handleButtonAction(saveEnabled)}
              >
                {saveEnabled ? 'Save' : 'Pay'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* {payClicked && ( */}
      <Modal
        maxWidth={'sm'}
        uniqueKey={header?.appointmentId + 'pay' + column.label}
        closeOnOutsideClick={true}
        onOutsideClick={() => {
          // Reset payment state when modal closes
          setSelectedPaymentMode(null)
          setIsSplitPaymentMode(false)
          setSplitPayments([
            { method: '', amount: '' },
            { method: '', amount: '' },
          ])
          dispatch(closeModal(header?.appointmentId + 'pay' + column.label))
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">Payment Details</Typography>
          <div className="flex gap-2">
            <IconButton
              onClick={() => {
                // Reset payment state when closing
                setSelectedPaymentMode(null)
                setIsSplitPaymentMode(false)
                setSplitPayments([
                  { method: '', amount: '' },
                  { method: '', amount: '' },
                ])
                dispatch(
                  closeModal(header?.appointmentId + 'pay' + column.label),
                )
              }}
            >
              <Close />
            </IconButton>
          </div>
        </div>
        {/* {console.log(details)} */}
        <div className=" flex flex-col gap-3">
          <div className=" flex justify-between">
            <span className=" flex-1 font-medium">{`Item Name`}</span>
            <span className=" flex-1 font-medium">{`Purchase Qn.`}</span>
            <span className=" flex-1 font-medium">{`Total Cost`}</span>
            {/* <span className=" flex-1 font-medium">{`Status`}</span> */}
          </div>
          {details.map((itemInfo, index) => {
            return (
              <div
                className=" flex justify-between"
                key={itemInfo?.itemName + index}
              >
                <span className=" flex-1 font-normal">
                  {itemInfo?.itemName}
                </span>
                <span className=" flex-1 font-normal">
                  {itemInfo?.purchaseQuantity}
                </span>
                <span className=" flex-1 font-medium">
                  {getItemPrice(itemInfo.id).toFixed(2)}
                </span>
                {/* <span className=" flex-1 font-medium">
                  {itemInfo?.status}
                </span> */}
              </div>
            )
          })}
          <div className="mt-4">
            <Autocomplete
              options={coupons}
              getOptionLabel={(option) =>
                `${option.couponCode} (${option.discountPercentage}% off)`
              }
              value={selectedCoupon}
              onChange={(event, newValue) => {
                setSelectedCoupon(newValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Apply Coupon"
                  variant="outlined"
                  fullWidth
                  size="small"
                />
              )}
            />

            {/* Show discount details when coupon is selected */}
            {selectedCoupon && (
              <div className="mt-4 space-y-2 bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between text-green-600">
                  <span>Discount ({selectedCoupon.discountPercentage}%)</span>
                  <span>
                    -₹{(calculateAmount() - discountedAmount).toFixed(2)}
                  </span>
                </div>
                <Divider />
                <div className="flex justify-between font-bold text-green-700">
                  <span>Final Amount</span>
                  <span>₹{discountedAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 pt-5">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">
                Total Amount: ₹{discountedAmount?.toFixed(2)}
              </span>
            </div>

            {/* Split Payment Button */}
            <div className="flex justify-center">
              <Button
                variant={isSplitPaymentMode ? 'contained' : 'outlined'}
                className="capitalize py-2 px-6"
                onClick={handleSplitPaymentToggle}
                disabled={isProcessingPayment}
                sx={{
                  backgroundColor: isSplitPaymentMode
                    ? '#1976d2'
                    : 'transparent',
                  color: isSplitPaymentMode ? '#fff' : '#1976d2',
                  borderColor: isSplitPaymentMode ? '#1976d2' : '#1976d2',
                  '&:hover': {
                    backgroundColor: isSplitPaymentMode
                      ? '#1565c0'
                      : 'rgba(25, 118, 210, 0.04)',
                    borderColor: '#1565c0',
                  },
                }}
              >
                SPLIT PAYMENT
              </Button>
            </div>

            {/* Split Payment Fields */}
            {isSplitPaymentMode ? (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <Typography variant="subtitle2" className="font-semibold mb-3">
                  Enter Split Payment Details
                </Typography>
                {splitPayments.map((payment, index) => (
                  <div key={index} className="flex gap-3 items-center">
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Method {index + 1}</InputLabel>
                      <Select
                        value={payment.method}
                        label={`Payment Method ${index + 1}`}
                        onChange={(e) =>
                          handleSplitPaymentChange(
                            index,
                            'method',
                            e.target.value,
                          )
                        }
                        disabled={isProcessingPayment}
                      >
                        <MenuItem value="CASH">CASH</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                        <MenuItem value="ONLINE">ONLINE</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      type="number"
                      label={`Amount ${index + 1}`}
                      size="small"
                      value={payment.amount}
                      onChange={(e) =>
                        handleSplitPaymentChange(
                          index,
                          'amount',
                          e.target.value,
                        )
                      }
                      disabled={isProcessingPayment}
                      InputProps={{
                        inputProps: {
                          min: 0,
                          step: 0.01,
                        },
                      }}
                      sx={{ width: 150 }}
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <Typography variant="body2" className="text-gray-600">
                    Total Entered: ₹
                    {splitPayments
                      .filter((p) => p.method && p.amount)
                      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                      .toFixed(2)}
                    {' / '}
                    <span className="font-semibold">
                      Required: ₹{discountedAmount?.toFixed(2)}
                    </span>
                  </Typography>
                </div>
              </div>
            ) : (
              /* Single Payment Mode Buttons */
              <div className="flex gap-3 justify-center">
                <Button
                  variant={
                    selectedPaymentMode === 'ONLINE' ? 'contained' : 'outlined'
                  }
                  className="capitalize py-3 px-6"
                  onClick={() => handlePaymentModeSelect('ONLINE')}
                  disabled={isProcessingPayment}
                  sx={{
                    backgroundColor:
                      selectedPaymentMode === 'ONLINE'
                        ? '#1976d2'
                        : 'transparent',
                    color:
                      selectedPaymentMode === 'ONLINE' ? '#fff' : '#1976d2',
                    borderColor: '#1976d2',
                    '&:hover': {
                      backgroundColor:
                        selectedPaymentMode === 'ONLINE'
                          ? '#1565c0'
                          : 'rgba(25, 118, 210, 0.04)',
                      borderColor: '#1565c0',
                    },
                  }}
                >
                  ONLINE
                </Button>
                <Button
                  variant={
                    selectedPaymentMode === 'UPI' ? 'contained' : 'outlined'
                  }
                  className="capitalize py-3 px-6"
                  onClick={() => handlePaymentModeSelect('UPI')}
                  disabled={isProcessingPayment}
                  sx={{
                    backgroundColor:
                      selectedPaymentMode === 'UPI' ? '#1976d2' : 'transparent',
                    color: selectedPaymentMode === 'UPI' ? '#fff' : '#1976d2',
                    borderColor: '#1976d2',
                    '&:hover': {
                      backgroundColor:
                        selectedPaymentMode === 'UPI'
                          ? '#1565c0'
                          : 'rgba(25, 118, 210, 0.04)',
                      borderColor: '#1565c0',
                    },
                  }}
                >
                  UPI
                </Button>
                <Button
                  variant={
                    selectedPaymentMode === 'CASH' ? 'contained' : 'outlined'
                  }
                  className="capitalize py-3 px-6"
                  onClick={() => handlePaymentModeSelect('CASH')}
                  disabled={isProcessingPayment}
                  sx={{
                    backgroundColor:
                      selectedPaymentMode === 'CASH'
                        ? '#1976d2'
                        : 'transparent',
                    color: selectedPaymentMode === 'CASH' ? '#fff' : '#1976d2',
                    borderColor: '#1976d2',
                    '&:hover': {
                      backgroundColor:
                        selectedPaymentMode === 'CASH'
                          ? '#1565c0'
                          : 'rgba(25, 118, 210, 0.04)',
                      borderColor: '#1565c0',
                    },
                  }}
                >
                  CASH
                </Button>
              </div>
            )}

            {/* Pay Button - Show for both single and split payment */}
            {(selectedPaymentMode || isSplitPaymentMode) && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="contained"
                  className="capitalize py-3 px-8 text-lg font-bold"
                  onClick={handlePay}
                  disabled={isProcessingPayment}
                  sx={{
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: '#45a049',
                    },
                    '&:disabled': {
                      backgroundColor: '#cccccc',
                      color: '#666666',
                    },
                  }}
                >
                  {isProcessingPayment ? 'Processing...' : 'PAY'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
      {/* )} */}
      {details?.map((med) => (
        <Modal
          key={`pack-modal-${med.id}`}
          uniqueKey={`pack-modal-${med.id}`}
          maxWidth="lg"
          onOutsideClick={() => {
            dispatch(closeModal(`pack-modal-${med.id}`))
            // setGrnRows(prev => {
            //   const newState = { ...prev }
            //   delete newState[med.id]
            //   return newState
            // })
          }}
        >
          <div className="flex justify-between items-center mb-4">
            {column.label === 'PRESCRIBED' ? (
              <Typography variant="h6">Select GRNs</Typography>
            ) : (
              <Typography variant="h6">Packed Details</Typography>
            )}
            <IconButton
              onClick={() => {
                dispatch(closeModal(`pack-modal-${med.id}`))
                // setGrnRows(prev => {
                //   const newState = { ...prev }
                //   delete newState[med.id]
                //   return newState
                // })
              }}
            >
              <Close />
            </IconButton>
          </div>

          <div className="p-4">
            {/* Display prescribed and packing quantities */}
            <span className="text-lg font-bold">{med.itemName}</span>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              {column.label === 'PACKED' ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Initial Packed
                    </Typography>
                    <Typography variant="h6">
                      {grnRows[med.id]?.reduce(
                        (sum, row) =>
                          sum + Number(row.initialUsedQuantity || 0),
                        0,
                      ) || 0}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Current Packed
                    </Typography>
                    <Typography variant="h6">
                      {grnRows[med.id]?.reduce(
                        (sum, row) =>
                          sum +
                          Number(
                            row.initialUsedQuantity || row.usedQuantity || 0,
                          ) -
                          Number(row.returnedQuantity || 0),
                        0,
                      ) || 0}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Returned
                    </Typography>
                    <Typography variant="h6" className="text-orange-500">
                      {grnRows[med.id]?.reduce(
                        (sum, row) => sum + Number(row.returnedQuantity || 0),
                        0,
                      ) || 0}
                    </Typography>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Prescribed Qty
                    </Typography>
                    <Typography variant="h6">
                      {med?.prescribedQuantity}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="subtitle2" color="textSecondary">
                      Remaining to Pack
                    </Typography>
                    <Typography variant="h6" className="text-red-500">
                      {Math.max(
                        0,
                        med?.prescribedQuantity -
                          (grnRows[med.id]?.reduce(
                            (sum, row) =>
                              sum +
                              Number(
                                row.initialUsedQuantity ||
                                  row.usedQuantity ||
                                  0,
                              ) -
                              Number(row.returnedQuantity || 0),
                            0,
                          ) || 0),
                      )}
                    </Typography>
                  </div>
                </div>
              )}
            </div>

            {/* GRN Selection Rows */}
            {(grnRows[med.id] || []).map((row, index) => (
              <div
                key={index + 'grn' + row.grnId}
                className="flex items-start gap-4 mb-3"
              >
                {column.label === 'PRESCRIBED' && (
                  <Autocomplete
                    className="flex-1"
                    options={(availableGrnsByItemId[med.id] || []).filter(
                      (grn) => Number(grn.totalQuantity || 0) > 0,
                    )}
                    value={row.grnId}
                    onChange={(_, newValue) =>
                      handleGrnRowChange(med.id, index, 'grnId', newValue)
                    }
                    getOptionLabel={(option) => {
                      console.log('option', option)
                      return `Expiry: ${dayjs(option.expiryDate).format(
                        'DD/MM/YYYY',
                      )} | MRP: ${option.mrpPerTablet} | Available: ${
                        option.totalQuantity
                      }| Batch No: ${option.batchNo}
                    `
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Select GRN" size="small" />
                    )}
                  />
                )}
                {column.label === 'PACKED' && (
                  <div className="flex flex-col gap-2 w-full p-2.5 rounded-lg bg-primary/50 border border-primary-200 shadow-sm">
                    {row.grnId ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-secondary">
                        <div>
                          <span className="font-medium">Batch No:</span>{' '}
                          {row.grnId.batchNo}
                        </div>
                        <div>
                          <span className="font-medium">Expiry:</span>{' '}
                          {dayjs(row.grnId.expiryDate).format('DD/MM/YYYY')}
                        </div>
                        <div>
                          <span className="font-medium">MRP:</span> ₹
                          {row.grnId.mrpPerTablet}
                        </div>
                        <div>
                          <span className="font-medium">Available:</span>{' '}
                          {
                            (availableGrnsByItemId[med.id] || []).find(
                              (grn) => grn.grnId === row.grnId.grnId,
                            )?.totalQuantity
                          }
                        </div>
                      </div>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Please select a GRN to view details.
                      </Typography>
                    )}
                  </div>
                )}
                <TextField
                  type="number"
                  label={column.label === 'PACKED' ? 'Packed Qty' : 'Quantity'}
                  size="small"
                  value={row.initialUsedQuantity || row.usedQuantity}
                  onChange={(e) =>
                    handleGrnRowChange(
                      med.id,
                      index,
                      'usedQuantity',
                      e.target.value,
                    )
                  }
                  disabled={column.label === 'PACKED'}
                  error={
                    row.grnId &&
                    Number(row.usedQuantity) > row.grnId.totalQuantity
                  }
                  helperText={
                    row.grnId &&
                    Number(row.usedQuantity) > row.grnId.totalQuantity
                      ? 'Exceeds available quantity'
                      : ''
                  }
                  sx={{ width: 120 }}
                  InputProps={{
                    inputProps: {
                      min: 0,
                      max: row.grnId ? row.grnId.totalQuantity : 0,
                    },
                  }}
                />

                {/* Show return quantity and final quantity fields only in PACKED stage */}
                {column.label === 'PACKED' && (
                  <>
                    <TextField
                      type="number"
                      label="Return Qty"
                      size="small"
                      value={row.returnedQuantity || 0}
                      onChange={(e) =>
                        handleGrnRowChange(
                          med.id,
                          index,
                          'returnedQuantity',
                          e.target.value,
                        )
                      }
                      error={
                        Number(row.returnedQuantity || 0) >
                        Number(row.initialUsedQuantity || row.usedQuantity || 0)
                      }
                      helperText={
                        Number(row.returnedQuantity || 0) >
                        Number(row.initialUsedQuantity || row.usedQuantity || 0)
                          ? 'Cannot exceed packed quantity'
                          : ''
                      }
                      sx={{ width: 120 }}
                      InputProps={{
                        inputProps: {
                          min: 0,
                          max: Number(
                            row.initialUsedQuantity || row.usedQuantity || 0,
                          ),
                        },
                      }}
                    />
                    <TextField
                      type="number"
                      label="Final Qty"
                      size="small"
                      value={Math.max(
                        0,
                        Number(
                          row.initialUsedQuantity || row.usedQuantity || 0,
                        ) - Number(row.returnedQuantity || 0),
                      )}
                      disabled
                      sx={{ width: 120 }}
                    />
                  </>
                )}

                {column.label !== 'PACKED' && (
                  <IconButton
                    onClick={() => {
                      setGrnRows((prev) => ({
                        ...prev,
                        [med.id]: prev[med.id].filter((_, i) => i !== index),
                      }))
                    }}
                  >
                    <DeleteOutline color="error" />
                  </IconButton>
                )}
              </div>
            ))}

            <div className="flex justify-end mt-4 gap-2">
              {column.label === 'PRESCRIBED' && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => addGrnRow(med.id)}
                    startIcon={<Add />}
                  >
                    Add GRN
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (
                        validateGrnSelections(med.id, med.prescribedQuantity)
                      ) {
                        handleGrnSelection(med.id)
                      } else {
                        toast.error(
                          'Total quantity exceeds prescribed quantity',
                          toastconfig,
                        )
                      }
                    }}
                    disabled={
                      !grnRows[med.id]?.length ||
                      !validateGrnSelections(med.id, med.prescribedQuantity)
                    }
                  >
                    Confirm
                  </Button>
                </>
              )}
              {column.label === 'PACKED' && (
                <Button
                  variant="contained"
                  className="text-white capitalize "
                  onClick={() => {
                    if (validateGrnSelections(med.id, med.prescribedQuantity)) {
                      handleButtonAction(true, med.id)
                    } else {
                      toast.error('Please check return quantities', toastconfig)
                    }
                  }}
                  disabled={
                    !grnRows[med.id]?.length ||
                    !validateGrnSelections(med.id, med.prescribedQuantity) ||
                    paymentBreakup.isPending
                  }
                >
                  {paymentBreakup.isPending ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      ))}
    </div>
  )
}
function RenderAccordianComponent({
  patientDetails,
  column,
  expandedId,
  setClickeId,
  selectedbranch,
  date,
}) {
  const [activeTab, setActiveTab] = useState('patient')

  const getFilteredItems = (details, isSpouse) => {
    return details
      .map((patient) => {
        const key = Object.keys(patient)[0]
        const filteredItems = {
          ...patient,
          [key]: {
            ...patient[key],
            itemDetails: patient[key].itemDetails.filter((item) =>
              isSpouse ? item.isSpouse === 1 : item.isSpouse !== 1,
            ),
          },
        }
        return filteredItems[key].itemDetails.length > 0 ? filteredItems : null
      })
      .filter(Boolean)
  }

  const patientItems = getFilteredItems(patientDetails, false)
  const spouseItems = getFilteredItems(patientDetails, true)
  useEffect(() => {
    setClickeId(null)
  }, [activeTab])
  return (
    <div className="flex flex-col gap-2">
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <div className="flex gap-2">
          <Button
            // variant={activeTab === 'patient' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('patient')}
            size="small"
            className={`capitalize ${
              activeTab === 'patient' ? 'bg-white' : 'text-secondary'
            }`}
          >
            Patient ({patientItems.length})
          </Button>
          <Button
            // variant={activeTab === 'spouse' ? 'contained' : 'outlined'}
            onClick={() => setActiveTab('spouse')}
            size="small"
            className={`capitalize ${
              activeTab === 'spouse' ? 'bg-white' : 'text-secondary'
            }`}
          >
            Spouse ({spouseItems.length})
          </Button>
        </div>
      </Box>

      <div className="flex flex-col gap-2">
        {activeTab === 'patient' ? (
          patientItems.length > 0 ? (
            patientItems.map((patient) => {
              const key = Object.keys(patient)[0]
              const appointmentID = patient[key].header?.appointmentId
              const groupId = key
              const photoSrc = getPatientPhotoSrc(
                patient[key].header?.photoPath,
              )
              const hasActivePackage = hasActivePackageIndicator(
                patient[key].header,
              )

              return (
                <Accordion
                  key={key + column?.label + 'Accordion'}
                  expanded={groupId + column?.label === expandedId}
                  onChange={(e, isExpanded) => {
                    setClickeId(isExpanded ? groupId + column?.label : null)
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon className="text-gray-600" />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex flex-nowrap w-full items-center gap-4 py-2">
                      <div className="relative">
                        <Avatar
                          alt={patient[key].header?.patientName}
                          src={photoSrc}
                          sx={{
                            width: 60,
                            height: 60,
                            border: '2px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}
                        />
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2">
                          <Typography
                            variant="subtitle1"
                            component="h6"
                            className="font-semibold text-gray-800"
                            sx={{
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={patient[key].header?.patientName}
                          >
                            {patient[key].header?.patientName}
                          </Typography>
                          <ActivePackageDot show={hasActivePackage} />
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <PersonOutlineIcon className="w-4 h-4" />
                          <span>{patient[key].header?.doctorName}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails className="flex flex-col gap-3">
                    {patient &&
                      patient[key] &&
                      patient[key].itemDetails.length != 0 &&
                      groupId + column?.label === expandedId && (
                        <RenderAccordianDetails
                          type={patient[key].header?.type}
                          itemDetails={patient[key].itemDetails}
                          column={column}
                          hdrKey={patient[key].header?.appointmentId}
                          header={patient[key].header}
                          selectedbranch={selectedbranch}
                          date={date}
                        />
                      )}
                  </AccordionDetails>
                </Accordion>
              )
            })
          ) : (
            <span className="text-center text-gray-500">
              No patient items found
            </span>
          )
        ) : spouseItems.length > 0 ? (
          spouseItems.map((patient) => {
            const key = Object.keys(patient)[0]
            const appointmentID = patient[key].header?.appointmentId
            const groupId = key
            const photoSrc = getPatientPhotoSrc(patient[key].header?.photoPath)
            const hasActivePackage = hasActivePackageIndicator(
              patient[key].header,
            )

            return (
              <Accordion
                key={key + column?.label + 'Accordion'}
                expanded={groupId + column?.label === expandedId}
                onChange={(e, isExpanded) => {
                  setClickeId(isExpanded ? groupId + column?.label : null)
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon className="text-gray-600" />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                  className="hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-nowrap w-full items-center gap-4 py-2">
                    <div className="relative">
                      <Avatar
                        alt={patient[key].header?.patientName}
                        src={photoSrc}
                        sx={{
                          width: 60,
                          height: 60,
                          border: '2px solid #fff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <Typography
                          variant="subtitle1"
                          component="h6"
                          className="font-semibold text-gray-800"
                          sx={{
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={patient[key].header?.spouseName}
                        >
                          {patient[key].header?.spouseName}
                        </Typography>
                        <ActivePackageDot show={hasActivePackage} />
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PersonOutlineIcon className="w-4 h-4" />
                        <span>{patient[key].header?.doctorName}</span>
                      </div>
                    </div>
                  </div>
                </AccordionSummary>
                <AccordionDetails className="flex flex-col gap-3">
                  {patient &&
                    patient[key] &&
                    patient[key].itemDetails.length != 0 &&
                    groupId + column?.label === expandedId && (
                      <RenderAccordianDetails
                        type={patient[key].header?.type}
                        itemDetails={patient[key].itemDetails}
                        column={column}
                        hdrKey={patient[key].header?.appointmentId}
                        header={patient[key].header}
                        selectedbranch={selectedbranch}
                        date={date}
                      />
                    )}
                </AccordionDetails>
              </Accordion>
            )
          })
        ) : (
          <span className="text-center text-gray-500">
            No spouse items found
          </span>
        )}
      </div>
    </div>
  )
}

function Index() {
  const user = useSelector((store) => store.user)
  const dropDown = useSelector((store) => store.dropdowns)
  const router = useRouter()
  const [date, setDate] = useState()
  const [expandedId, setExpandedId] = useState()
  // const [patientData, setPaientData] = useState([])
  let defaultBranch = user['branchDetails'][0]
  const [selectedbranch, setSelectedBranch] = useState(defaultBranch?.id)
  const dispatch = useDispatch()
  // let obj = []
  let branch = dropDown['branches']
  branch = branch.map((item) => {
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
    // setPaientData([])
  }

  function handleBranchChange(branchId) {
    setSelectedBranch(branchId)
    updateURL(date, branchId)
  }
  const {
    data: patientData,
    isLoading: isValuesLoading,
    isError,
  } = useQuery({
    queryKey: ['pharmacyModuleInfoByDate', date, selectedbranch],
    enabled: !!date && selectedbranch != null && selectedbranch !== '',
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const res = await getPharmacyDetailsByDate(
        user?.accessToken,
        formatPharmacyQueryDate(date),
        selectedbranch,
      )

      if (res.status !== 200) {
        throw new Error(
          res?.message ||
            'Error occurred while fetching medicine details for pharmacy',
        )
      }

      const obj = {}
      const fetchedData = Array.isArray(res.data) ? res.data : []

      fetchedData.forEach((patientHeader) => {
        parsePharmacyItemDetails(patientHeader?.itemDetails).forEach(
          (itemDetails) => {
            const stage = itemDetails?.itemStage
            if (!stage || !['PRESCRIBED', 'PACKED', 'PAID'].includes(stage)) {
              return
            }
            const appointmentId = patientHeader?.appointmentId
            const orderGroupKey =
              stage === 'PAID'
                ? itemDetails?.orderDbId ||
                  itemDetails?.orderId ||
                  `legacy-${appointmentId}`
                : 'NA'
            const groupKey =
              stage === 'PAID'
                ? `${appointmentId}-${orderGroupKey}`
                : `${appointmentId}`

            if (!obj[stage]) {
              obj[stage] = []
            }

            const existingPatientIndex = obj[stage].findIndex(
              (item) => item[groupKey],
            )

            if (existingPatientIndex !== -1) {
              // Add to existing patient's items
              obj[stage][existingPatientIndex][groupKey].itemDetails.push(
                itemDetails,
              )
              if (stage === 'PAID') {
                obj[stage][existingPatientIndex][groupKey].header = {
                  ...obj[stage][existingPatientIndex][groupKey].header,
                  invoiceOrderId:
                    obj[stage][existingPatientIndex][groupKey].header
                      ?.invoiceOrderId || itemDetails?.orderId,
                  invoiceDbId:
                    obj[stage][existingPatientIndex][groupKey].header
                      ?.invoiceDbId || itemDetails?.orderDbId,
                }
              }
            } else {
              // Create new patient entry
              const { itemDetails: _, ...headerInfo } = patientHeader
              obj[stage].push({
                [groupKey]: {
                  header: {
                    ...headerInfo,
                    invoiceOrderId:
                      stage === 'PAID' ? itemDetails?.orderId : null,
                    invoiceDbId:
                      stage === 'PAID' ? itemDetails?.orderDbId : null,
                  },
                  itemDetails: [itemDetails],
                },
              })
            }
          },
        )
      })

      return obj
    },
  })
  //   useEffect(() => {
  //     /*
  //     Inside API call we are Structring object in this format
  //     Const data = {
  //         prescribed:{
  //             [
  //                 patientname1:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 },
  //                 patientname2:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 }
  //             ]
  //         }
  //         packed:{
  //             [
  //                 patientname:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 }
  //             }
  //         }
  //         payment:{
  //             [
  //                 patientname:
  //                 {
  //                    headerdata:{},
  //                    itemDetails:[]
  //                 }
  //             }
  //         }
  //     }
  // */
  //     if (isValuesLoading || patientData?.length != 0) {
  //       dispatch(showLoader())
  //     } else {
  //       dispatch(hideLoader())
  //       setPaientData(patientInformation)
  //     }
  //   }, [patientInformation, date, isValuesLoading, selectedbranch])
  useEffect(() => {
    setExpandedId()
  }, [date, selectedbranch])

  // Handle URL parameters and set initial values
  useEffect(() => {
    if (!router.isReady) return

    const { date: urlDate, branch: urlBranch } = router.query

    if (urlDate && urlBranch) {
      const parsedDate = dayjs(urlDate)
      if (parsedDate.isValid()) {
        setDate(parsedDate)
      }
      setSelectedBranch(Number(urlBranch))
      return
    }

    if (defaultBranch?.id) {
      const today = dayjs()
      const firstBranch = defaultBranch.id
      setDate(today)
      setSelectedBranch(firstBranch)
      router.replace(
        {
          pathname: router.pathname,
          query: {
            date: today.format('YYYY-MM-DD'),
            branch: firstBranch,
          },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.isReady, router.query, defaultBranch?.id])
  return (
    <div>
      <div className="flex justify-between flex-row p-3">
        <DatePicker
          className="bg-white"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
        <FormControl sx={{ width: '200px' }}>
          <InputLabel id="demo-simple-select-label">Branch</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={selectedbranch}
            label="Branch"
            onChange={(e) => handleBranchChange(e.target.value)}
          >
            {branch.map((branchinfo) => {
              return (
                <MenuItem value={branchinfo?.id} key={branchinfo.label}>
                  {branchinfo?.label}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
      </div>
      <div className="bg-white rounded-lg border shadow">
        <Box className="flex gap-3 p-3">
          {columns?.map((column) => (
            <Box
              className="flex flex-col h-[80vh] rounded transition-colors bg-primary p-2 w-full"
              key={column?.label + 'IndexBox'}
            >
              <Box className="flex items-center justify-center rounded p-3">
                <Typography variant="subtitle1" className="text-lg font-medium">
                  {column?.label.substring(0, 1).toLocaleUpperCase() +
                    column?.label.substring(1).toLocaleLowerCase()}
                </Typography>
              </Box>
              <Stack spacing={2} style={{ overflowY: 'auto', height: '100%' }}>
                {isValuesLoading ? (
                  <div className="w-full h-full flex justify-center items-center">
                    <span className="opacity-50">Loading...</span>
                  </div>
                ) : isError ? (
                  <div className="w-full h-full flex justify-center items-center">
                    <span className="opacity-50">
                      Failed to load pharmacy details
                    </span>
                  </div>
                ) : patientData && patientData[column?.label] ? (
                  <RenderAccordianComponent
                    key={column?.label + 'indexAccordion'}
                    patientDetails={patientData[column?.label]}
                    column={column}
                    expandedId={expandedId}
                    setClickeId={setExpandedId}
                    selectedbranch={selectedbranch}
                    date={date}
                  />
                ) : (
                  <div className="w-full h-full flex justify-center items-center">
                    <span className="opacity-50">No details found</span>
                  </div>
                )}
              </Stack>
            </Box>
          ))}
        </Box>
      </div>
    </div>
  )
}

export default withPermission(Index, true, 'pharmacy', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
