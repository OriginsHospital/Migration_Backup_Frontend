import {
  addOtherPayment,
  getAllAppointmentsReasons,
  getAppointmentReasonsByPatientType,
  getOtherPaymentsStatus,
  getCoupons,
  getOtherPaymentsOrderId,
  sendOtherPaymentsTransactionId,
  downloadOtherPaymentsInvoice,
  downloadPDF,
  updateAdvancePaymentHistory,
  deleteAdvancePaymentHistory,
  deleteAdvancePaymentEntry,
} from '@/constants/apis'
import React, { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import Button from '@mui/material/Button'
import Modal from './Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
// import TextJoedit from './TextJoedit'
import {
  IconButton,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from '@mui/material'
import {
  Close,
  ExpandMore,
  Payment,
  Receipt,
  Discount,
  ReceiptLong,
  DocumentScanner,
  PaymentSharp,
  CreditCard,
  Money,
  Download,
  Edit,
  Delete,
  MoreVert,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import dynamic from 'next/dynamic'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

// Category and Sub-Category mapping
const CATEGORY_SUBCATEGORY_MAP = {
  'IVF Package': [
    'Registration Fee',
    'D1',
    'Trigger',
    'Middle',
    'FET',
    'UPT',
    'Donor Booking',
  ],
  'Embryo Freezing': [
    '1 Embryo – 1 Year',
    '1 Embryo – 6 Months',
    '1 Embryo – 3 Months',
    '2 Embryos – 1 Year',
    '2 Embryos – 6 Months',
    '2 Embryos – 3 Months',
    '3 Embryos – 1 Year',
    '3 Embryos – 6 Months',
    '3 Embryos – 3 Months',
    '4 Embryos – 1 Year',
    '4 Embryos – 6 Months',
    '4 Embryos – 3 Months',
  ],
  PGTA: ['1 Embryo', '2 Embryos', '3 Embryos', '4 Embryos'],
  ERA: [],
  Procedures: [
    'Hysteroscopy / Laparoscopy / Polypectomy',
    'Cervical Cerclage',
    'Emergency LSCS',
    'Elective LSCS',
    'Consultation Fees (Antenatal)',
    'Consultation Fees (Gynec)',
    'Dated Payments',
    'Observation Amount',
  ],
  'Donor Sperm': [],
  Microfluidics: [],
  Others: [],
}

const CATEGORIES = Object.keys(CATEGORY_SUBCATEGORY_MAP)

function AdvancePayments({ formData }) {
  const userDetails = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [editablePayableAmount, setEditablePayableAmount] = useState(0)
  const [invoiceHtml, setInvoiceHtml] = useState('')
  const [showInvoicePreview, setShowInvoicePreview] = useState(false)
  const [expandedPaymentIndex, setExpandedPaymentIndex] = useState(null)
  const [newlyAddedPayment, setNewlyAddedPayment] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const [cardMenuPayment, setCardMenuPayment] = useState(null) // when menu opened from card header
  const [menuParentPayment, setMenuParentPayment] = useState(null) // parent row when menu opened from history line
  const [selectedPaymentHistory, setSelectedPaymentHistory] = useState(null)
  const [editPaymentHistory, setEditPaymentHistory] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteEntryConfirm, setDeleteEntryConfirm] = useState(null) // for deleting whole advance payment entry (pending)
  const [editFormData, setEditFormData] = useState({
    paymentTitle: '',
    paidOrderAmount: '',
    discountAmount: '',
    paymentMode: '',
    orderDate: '',
    couponCode: '',
  })

  // Validation errors
  const [errors, setErrors] = useState({})

  // Check if user is admin (role ID 1 or 7)
  const isAdmin =
    userDetails.roleDetails?.id === 1 || userDetails.roleDetails?.id === 7

  // Edit/delete advance payments only for this account (email on profile; userName if it is the same login id)
  const allowedEmail = 'nikhilsuvva77@gmail.com'
  const norm = (v) =>
    String(v ?? '')
      .trim()
      .toLowerCase()
  const canEditDeleteAdvancePayment =
    norm(userDetails?.email || userDetails?.userDetails?.email) ===
      allowedEmail ||
    norm(userDetails?.userName || userDetails?.userDetails?.userName) ===
      allowedEmail

  // Handle menu open (from payment history row)
  const handleMenuOpen = (event, paymentHistory, parentPayment = null) => {
    event.stopPropagation() // Prevent accordion from expanding
    setMenuAnchor(event.currentTarget)
    setCardMenuPayment(null)
    setMenuParentPayment(parentPayment)
    setSelectedPaymentHistory(paymentHistory)
  }

  // Handle menu open from card header (show Edit/Delete for each payment history entry, or message if none)
  const handleCardMenuOpen = (event, payment) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setCardMenuPayment(payment)
    setMenuParentPayment(null)
    setSelectedPaymentHistory(null)
  }

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchor(null)
    setCardMenuPayment(null)
    setMenuParentPayment(null)
    setSelectedPaymentHistory(null)
  }

  // Handle edit click (history optional when called from card menu)
  const handleEditClick = (historyEntry) => {
    const entry = historyEntry ?? selectedPaymentHistory
    const parentRow = cardMenuPayment ?? menuParentPayment
    if (entry) {
      setEditPaymentHistory(entry)
      // The query returns paidOrderAmountBeforeDiscount as 'paidOrderAmount' in the JSON
      // So we need to calculate the actual paid amount (after discount) for editing
      const paidAmountBeforeDiscount = parseFloat(entry.paidOrderAmount || 0)
      const discount = parseFloat(entry.discountAmount || 0)
      const paidAmountAfterDiscount = paidAmountBeforeDiscount - discount

      setEditFormData({
        paymentTitle: parentRow?.paymentReason ?? '',
        paidOrderAmount:
          paidAmountAfterDiscount > 0
            ? paidAmountAfterDiscount.toString()
            : paidAmountBeforeDiscount.toString(),
        discountAmount: entry.discountAmount || '',
        paymentMode: entry.paymentMode || '',
        orderDate: entry.paymentDate
          ? dayjs(entry.paymentDate).format('YYYY-MM-DD')
          : '',
        couponCode: entry.couponCode || '',
      })
    }
    handleMenuClose()
  }

  // Handle delete click (historyEntry optional when called from card menu)
  const handleDeleteClick = (historyEntry) => {
    const entry = historyEntry ?? selectedPaymentHistory
    if (entry) {
      setDeleteConfirm(entry)
    }
    handleMenuClose()
  }

  // Update payment history mutation
  const updatePaymentHistoryMutation = useMutation({
    mutationFn: async ({ paymentHistoryId, paymentData }) => {
      return await updateAdvancePaymentHistory(
        userDetails.accessToken,
        paymentHistoryId,
        paymentData,
      )
    },
    onSuccess: async () => {
      toast.success('Payment history updated successfully', toastconfig)
      setEditPaymentHistory(null)
      setEditFormData({
        paymentTitle: '',
        paidOrderAmount: '',
        discountAmount: '',
        paymentMode: '',
        orderDate: '',
        couponCode: '',
      })
      await queryClient.invalidateQueries({
        queryKey: ['otherPaymentsStatus', formData.id],
      })
      await refetchPayments()
    },
    onError: (error) => {
      console.error('Error updating payment history:', error)
      toast.error(
        error?.response?.data?.message ||
          error?.data?.message ||
          error?.message ||
          'Failed to update payment history',
        toastconfig,
      )
    },
  })

  // Delete payment history mutation
  const deletePaymentHistoryMutation = useMutation({
    mutationFn: async (paymentHistoryId) => {
      return await deleteAdvancePaymentHistory(
        userDetails.accessToken,
        paymentHistoryId,
      )
    },
    onSuccess: async () => {
      toast.success('Payment history deleted successfully', toastconfig)
      setDeleteConfirm(null)
      setSelectedPaymentHistory(null)
      // Invalidate queries first
      queryClient.invalidateQueries({
        queryKey: ['otherPaymentsStatus', formData.id],
      })
      // Refetch after a delay to ensure backend has processed the deletion
      setTimeout(async () => {
        try {
          const result = await refetchPayments()
          console.log('Payment data refetched after delete:', result?.data)
        } catch (error) {
          console.error('Error refetching payments after delete:', error)
        }
      }, 600)
    },
    onError: (error) => {
      console.error('Error deleting payment history:', error)
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to delete payment history',
        toastconfig,
      )
    },
  })

  // Delete entire advance payment entry (pending or any) – removes entry and all its details
  const deleteAdvancePaymentEntryMutation = useMutation({
    mutationFn: async (refId) => {
      return await deleteAdvancePaymentEntry(userDetails.accessToken, refId)
    },
    onSuccess: async (response) => {
      toast.success(
        response?.message || 'Advance payment entry deleted successfully',
        toastconfig,
      )
      setDeleteEntryConfirm(null)
      queryClient.invalidateQueries({
        queryKey: ['otherPaymentsStatus', formData.id],
      })
      setTimeout(async () => {
        try {
          await refetchPayments()
        } catch (error) {
          console.error('Error refetching payments after delete entry:', error)
        }
      }, 400)
    },
    onError: (error) => {
      console.error('Error deleting advance payment entry:', error)
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Failed to delete advance payment entry',
        toastconfig,
      )
    },
  })

  // Handle edit form submit
  const handleEditSubmit = () => {
    if (!editPaymentHistory) return

    const titleTrimmed = (editFormData.paymentTitle || '').trim()
    if (!titleTrimmed) {
      toast.error('Payment title is required', toastconfig)
      return
    }
    if (titleTrimmed.length > 100) {
      toast.error('Payment title must be at most 100 characters', toastconfig)
      return
    }

    const paymentData = {
      appointmentReason: titleTrimmed,
      paidOrderAmount: parseFloat(editFormData.paidOrderAmount) || 0,
      discountAmount: parseFloat(editFormData.discountAmount) || 0,
      paymentMode: editFormData.paymentMode,
      orderDate: editFormData.orderDate
        ? dayjs(editFormData.orderDate).format('YYYY-MM-DD HH:mm:ss')
        : null,
      couponCode: editFormData.couponCode || null,
    }

    updatePaymentHistoryMutation.mutate({
      paymentHistoryId: editPaymentHistory.id,
      paymentData,
    })
  }

  // Handle delete confirm (payment history entry)
  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deletePaymentHistoryMutation.mutate(deleteConfirm.id)
    }
  }

  // Handle delete advance payment entry confirm (whole line)
  const handleDeleteEntryConfirm = () => {
    if (deleteEntryConfirm?.refId != null) {
      deleteAdvancePaymentEntryMutation.mutate(deleteEntryConfirm.refId)
    }
  }

  const {
    data: otherPaymentsStatus,
    isLoading,
    error,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ['otherPaymentsStatus', formData.id],
    queryFn: async () => {
      return await getOtherPaymentsStatus(userDetails.accessToken, formData.id)
    },
    enabled: !!formData?.id,
    staleTime: 0,
  })

  // Get coupons for discount
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await getCoupons(userDetails.accessToken)
      return res.data
    },
  })
  const queryClient = useQueryClient()
  const { mutate: addOtherPaymentMutation, isPending: addOtherPaymentLoading } =
    useMutation({
      mutationFn: async ({ payload, paymentDetails }) => {
        const response = await addOtherPayment(userDetails.accessToken, payload)
        return { response, paymentDetails }
      },
      onSuccess: async ({ response, paymentDetails }) => {
        // Check if the response indicates success
        if (response.status !== 200) {
          toast.error('Failed to add advance payment', toastconfig)
          return
        }

        // Store the newly added payment details to identify it after refetch
        setNewlyAddedPayment(paymentDetails)
        setCategory('')
        setSubCategory('')
        setDescription('')
        setAmount('')
        setErrors({})
        dispatch(closeModal('advance-payment-modal'))

        toast.success('Advance payment added successfully', toastconfig)

        // Small delay to ensure backend has processed the request
        setTimeout(async () => {
          // Invalidate and refetch to get the latest data
          await queryClient.invalidateQueries({
            queryKey: ['otherPaymentsStatus', formData.id],
          })
          await refetchPayments()
        }, 500)
      },
      onError: (error) => {
        console.error('Error adding payment:', error)
        toast.error(
          'Failed to add advance payment. Please try again.',
          toastconfig,
        )
      },
    })
  // Get sub-categories for selected category
  const getSubCategories = () => {
    if (!category) return []
    return CATEGORY_SUBCATEGORY_MAP[category] || []
  }

  // Check if sub-category is required
  const isSubCategoryRequired = () => {
    const subCategories = getSubCategories()
    return subCategories.length > 0
  }

  // Handle category change - reset sub-category
  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory)
    setSubCategory('') // Reset sub-category when category changes
    setErrors((prev) => ({ ...prev, category: '', subCategory: '' }))
  }

  // Check if form is valid (for button disable state)
  const isFormValid = () => {
    if (!category) return false
    if (isSubCategoryRequired() && !subCategory) return false
    // Description is now optional, so we don't check it
    if (!amount || parseFloat(amount) <= 0) return false
    return true
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!category) {
      newErrors.category = 'Category is required'
    }

    if (isSubCategoryRequired() && !subCategory) {
      newErrors.subCategory = 'Sub-Category is required'
    }

    // Description is now optional, so we don't validate it

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount is required and must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddOtherPayment = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly', toastconfig)
      return
    }

    // Construct appointmentReason from category, subCategory, and description
    let appointmentReason = category
    if (isSubCategoryRequired() && subCategory) {
      appointmentReason += ` - ${subCategory}`
    }
    // Add description only if provided (description is now optional)
    if (description && description.trim()) {
      appointmentReason += `: ${description.trim()}`
    }

    const payload = {
      patientId: formData.id,
      appointmentReason: appointmentReason,
      amount: parseFloat(amount).toString(), // Backend expects string
    }

    // Store for matching after refetch
    const paymentDetails = {
      category: category,
      subCategory: isSubCategoryRequired() ? subCategory : null,
      description: description.trim(),
      amount: parseFloat(amount),
    }

    addOtherPaymentMutation({ payload, paymentDetails })
  }

  // Payment handling functions
  const handlePayment = async (paymentMode, paymentData) => {
    const payload = {
      refId: paymentData.refId,
      totalOrderAmount: paymentData.totalAmount,
      payableAmount: paymentData.payableAmount || paymentData.totalAmount,
      couponCode: paymentData.couponCode || null,
      discountAmount: paymentData.discountAmount || 0,
      payableAfterDiscountAmount: paymentData.discountedAmount,
      pendingOrderAmount: 0,
      paymentMode: paymentMode,
    }

    if (paymentMode === 'ONLINE') {
      try {
        const order = await getOtherPaymentsOrderId(
          userDetails.accessToken,
          payload,
        )
        if (order.status === 200) {
          const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_ID,
            amount: order.data.totalOrderAmount * 100,
            currency: 'INR',
            name: 'Origins',
            image:
              'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
            description: 'Advance Payment',
            order_id: order.data.orderId,
            'theme.color': '#FF6C22',
            handler: async (response) => {
              const order_details = {
                orderId: response.razorpay_order_id,
                transactionId: response.razorpay_payment_id,
              }
              const result = await sendOtherPaymentsTransactionId(
                userDetails.accessToken,
                order_details,
              )
              if (result.status === 200) {
                toast.success('Payment successful through online', toastconfig)
                dispatch(closeModal('payment-modal'))
                queryClient.invalidateQueries({
                  queryKey: ['otherPaymentsStatus', formData.id],
                })
              }
            },
          }
          const paymentObject = new window.Razorpay(options)
          paymentObject.open()
          paymentObject.on('payment.failed', function (response) {
            toast.error('Payment failed', toastconfig)
          })
          paymentObject.on('payment.success', function (response) {
            toast.success('Payment successful through online', toastconfig)
            dispatch(closeModal('payment-modal'))
            queryClient.invalidateQueries({
              queryKey: ['otherPaymentsStatus', formData.id],
            })
          })
        }
      } catch (error) {
        toast.error('Error processing online payment', toastconfig)
      }
    } else if (paymentMode === 'CASH') {
      if (window.confirm('Are you sure you want to pay offline?')) {
        try {
          const order = await getOtherPaymentsOrderId(
            userDetails.accessToken,
            payload,
          )
          if (order.status === 200) {
            toast.success('Payment successful through cash', toastconfig)
            dispatch(closeModal('payment-modal'))
            queryClient.invalidateQueries({
              queryKey: ['otherPaymentsStatus', formData.id],
            })
          }
        } catch (error) {
          toast.error('Error processing cash payment', toastconfig)
        }
      }
    } else if (paymentMode === 'UPI') {
      if (window.confirm('Are you sure you want to pay UPI?')) {
        try {
          const order = await getOtherPaymentsOrderId(
            userDetails.accessToken,
            payload,
          )
          if (order.status === 200) {
            toast.success('Payment successful through UPI', toastconfig)
            dispatch(closeModal('payment-modal'))
            queryClient.invalidateQueries({
              queryKey: ['otherPaymentsStatus', formData.id],
            })
          }
        } catch (error) {
          toast.error('Error processing UPI payment', toastconfig)
        }
      }
    } else if (paymentMode === 'SPLIT') {
      const cashAmount = Number(paymentData.splitPayment?.cashAmount || 0)
      const upiAmount = Number(paymentData.splitPayment?.upiAmount || 0)
      const totalSplitAmount = Number((cashAmount + upiAmount).toFixed(2))
      const billAmount = Number(
        Number(paymentData.discountedAmount || 0).toFixed(2),
      )

      if (cashAmount <= 0 || upiAmount <= 0) {
        toast.error(
          'Split payment requires both Cash and UPI amounts greater than 0',
          toastconfig,
        )
        return
      }

      if (totalSplitAmount !== billAmount) {
        toast.error(
          `Split amount should be exactly ₹${billAmount.toFixed(2)}`,
          toastconfig,
        )
        return
      }

      if (
        !window.confirm(
          'Confirm split payment: divide amount across Cash and UPI?',
        )
      ) {
        return
      }

      const splitPayload = {
        ...payload,
        paymentMode: 'SPLIT',
        isSplitPayment: true,
        splitPayment: {
          cashAmount,
          upiAmount,
          totalAmount: totalSplitAmount,
        },
        splitPaymentSummary: `Cash: ₹${cashAmount.toFixed(2)}, UPI: ₹${upiAmount.toFixed(2)}`,
      }

      try {
        const order = await getOtherPaymentsOrderId(
          userDetails.accessToken,
          splitPayload,
        )
        if (order.status === 200) {
          toast.success('Split payment recorded successfully', toastconfig)
          dispatch(closeModal('payment-modal'))
          queryClient.invalidateQueries({
            queryKey: ['otherPaymentsStatus', formData.id],
          })
        } else {
          toast.error(
            order?.message || 'Failed to process split payment',
            toastconfig,
          )
        }
      } catch (error) {
        toast.error('Error processing split payment', toastconfig)
      }
    }
  }

  // Handle payable amount change for admin
  const handlePayableAmountChange = (value, maxAmount) => {
    const numValue = Number(value) || 0
    // Ensure entered amount doesn't exceed max amount
    const validatedAmount = Math.min(numValue, maxAmount)
    setEditablePayableAmount(validatedAmount)
  }

  // Handle download invoice
  const handleDownloadInvoice = async (payment) => {
    try {
      const response = await downloadOtherPaymentsInvoice(
        userDetails.accessToken,
        {
          refId: payment.refId,
          patientId: formData.id,
        },
      )

      // Check if response has data (HTML content)
      console.log('response.data', response.data)
      if (response.data) {
        setInvoiceHtml(response.data)
        setShowInvoicePreview(true)
        dispatch(openModal('invoice-preview-modal'))
      } else {
        // Fallback to PDF download if no HTML data
        // downloadPDF(response)
        // toast.success('Invoice downloaded successfully', toastconfig)
        toast.error('Invoice not found', toastconfig)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice', toastconfig)
    }
  }

  // Handle different response structures - MUST be before early returns
  const payments = useMemo(() => {
    if (!otherPaymentsStatus) return []
    // Handle both direct array and nested data structure
    if (Array.isArray(otherPaymentsStatus)) {
      return otherPaymentsStatus
    }
    if (otherPaymentsStatus.data && Array.isArray(otherPaymentsStatus.data)) {
      return otherPaymentsStatus.data
    }
    return []
  }, [otherPaymentsStatus])

  // Auto-expand and open payment modal for newly added payment - MUST be before early returns
  useEffect(() => {
    if (newlyAddedPayment && payments.length > 0) {
      // Find the newly added payment by matching amount and checking if it's unpaid
      // Newly added payments typically have no payment history and match the amount
      const matchingPaymentIndex = payments.findIndex((payment) => {
        const paymentAmount = parseFloat(
          payment.totalAmount || payment.amount || 0,
        )
        const matchesAmount =
          Math.abs(paymentAmount - parseFloat(newlyAddedPayment.amount)) < 0.01
        const isUnpaid =
          !payment.paidAmount ||
          payment.paidAmount === 0 ||
          parseFloat(payment.totalAmount || payment.amount || 0) -
            (payment.paidAmount || 0) >
            0
        const paymentReason = (
          payment.paymentReason ||
          payment.description ||
          ''
        ).toLowerCase()
        // Try to match by category or description in paymentReason as additional check
        const matchesCategory = newlyAddedPayment.category
          ? paymentReason.includes(newlyAddedPayment.category.toLowerCase())
          : true
        const matchesDescription = newlyAddedPayment.description
          ? paymentReason.includes(
              newlyAddedPayment.description.substring(0, 20).toLowerCase(),
            )
          : true

        return (
          matchesAmount && isUnpaid && (matchesCategory || matchesDescription)
        )
      })

      if (matchingPaymentIndex !== -1) {
        const matchingPayment = payments[matchingPaymentIndex]
        // Auto-expand the accordion
        setExpandedPaymentIndex(matchingPaymentIndex)
        // Auto-open payment modal
        setSelectedPayment(matchingPayment)
        const totalAmount = parseFloat(
          matchingPayment.totalAmount || matchingPayment.amount || 0,
        )
        const paidAmount = matchingPayment.paidAmount || 0
        setEditablePayableAmount(totalAmount - paidAmount)
        dispatch(openModal('payment-modal'))
        // Clear the newly added payment flag
        setNewlyAddedPayment(null)
      } else if (payments.length > 0) {
        // If we can't find exact match but have payments, just expand the first one (most recent)
        // This handles cases where matching might fail due to data format differences
        setExpandedPaymentIndex(0)
        setNewlyAddedPayment(null)
      }
    }
  }, [payments, newlyAddedPayment, dispatch])

  if (isLoading) {
    return <div className="p-4">Loading payment data...</div>
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading payment data: {error.message}
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* <h1 className="text-2xl font-bold mb-4">Advance Payments</h1> */}
      <div className="flex justify-end pb-4">
        <Button
          variant="outlined"
          color="primary"
          className="capitalize"
          onClick={() => {
            setCategory('')
            setSubCategory('')
            setDescription('')
            setAmount('')
            setErrors({})
            dispatch(openModal('advance-payment-modal'))
          }}
        >
          Add Advance Payment
        </Button>
      </div>
      {payments.length === 0 ? (
        <div className="text-center py-8">
          <Receipt
            className="text-gray-400 mx-auto mb-4"
            style={{ fontSize: '3rem' }}
          />
          <Typography variant="h6" color="textSecondary">
            No advance payments found
          </Typography>
          <Typography variant="body2" color="textSecondary" className="mt-2">
            Add your first advance payment using the button above
          </Typography>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <Accordion
              key={index}
              className="shadow-sm border border-gray-200"
              expanded={expandedPaymentIndex === index}
              onChange={(event, isExpanded) => {
                setExpandedPaymentIndex(isExpanded ? index : null)
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                className="bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center space-x-3">
                    <PaymentSharp className="text-secondary" />
                    <div>
                      <Typography
                        variant="h6"
                        color="primary"
                        className="font-medium"
                      >
                        {payment.paymentReason}
                      </Typography>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canEditDeleteAdvancePayment && (
                      <IconButton
                        size="small"
                        onClick={(e) => handleCardMenuOpen(e, payment)}
                        sx={{ mr: 0.5 }}
                        aria-label="Edit or delete payment history"
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    )}
                    <Typography
                      variant="subtitle2"
                      className={`px-2 py-1 rounded-full text-sm ${
                        parseFloat(payment.totalAmount) - payment.paidAmount ===
                        0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {parseFloat(payment.totalAmount) - payment.paidAmount ===
                      0
                        ? 'Paid'
                        : 'Pending'}
                    </Typography>
                  </div>
                </div>
              </AccordionSummary>

              <AccordionDetails className="bg-white">
                <div className="w-full space-y-6">
                  {/* Payment Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="primary"
                        className="font-bold"
                      >
                        ₹{parseFloat(payment.totalAmount).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Amount
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="success.main"
                        className="font-bold"
                      >
                        ₹
                        {(
                          parseFloat(payment?.paidAmount) -
                          (payment.paymentHistory
                            ? payment?.paymentHistory?.reduce(
                                (acc, curr) =>
                                  acc + parseFloat(curr.discountAmount),
                                0,
                              )
                            : 0)
                        ).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Paid Amount
                      </Typography>
                    </div>
                    {/* Discount Amount */}
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="warning.main"
                        className="font-bold"
                      >
                        ₹
                        {payment.paymentHistory
                          ? payment.paymentHistory
                              ?.reduce(
                                (acc, curr) =>
                                  acc + parseFloat(curr.discountAmount),
                                0,
                              )
                              .toLocaleString()
                          : 0}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Discount Amount
                      </Typography>
                    </div>
                    <div className="text-center">
                      <Typography
                        variant="h6"
                        color="error.main"
                        className="font-bold"
                      >
                        ₹
                        {(
                          parseFloat(payment.totalAmount) - payment.paidAmount
                        ).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Remaining
                      </Typography>
                    </div>
                    {parseFloat(payment.totalAmount) - payment.paidAmount >
                      0 && (
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="contained"
                          color="success"
                          className="text-white h-10"
                          onClick={() => {
                            // console.log('payment', payment)
                            setSelectedPayment(payment)
                            setEditablePayableAmount(
                              parseFloat(payment.totalAmount) -
                                payment.paidAmount,
                            )
                            dispatch(openModal('payment-modal'))
                          }}
                        >
                          Pay Now
                        </Button>
                      </div>
                    )}
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="outlined"
                        color="primary"
                        className="h-10"
                        startIcon={<Receipt />}
                        onClick={() => handleDownloadInvoice(payment)}
                      >
                        Invoice
                      </Button>
                    </div>
                  </div>

                  {/* Payment History */}
                  {payment.paymentHistory &&
                    payment.paymentHistory.length > 0 && (
                      <div>
                        <Typography
                          variant="h6"
                          className="font-semibold mb-4 flex items-center"
                        >
                          <Receipt className="mr-2 text-gray-600" />
                          Payment History
                        </Typography>
                        <div className="space-y-3">
                          {payment.paymentHistory.map(
                            (history, historyIndex) => (
                              <Accordion
                                key={historyIndex}
                                className="border border-gray-200"
                              >
                                <AccordionSummary
                                  expandIcon={<ExpandMore />}
                                  className="bg-gray-50"
                                >
                                  <div className="flex items-center justify-between w-full pr-4">
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`w-3 h-3 rounded-full ${
                                          history.isSplitPayment ||
                                          history.paymentMode === 'SPLIT'
                                            ? 'bg-purple-500'
                                            : history.paymentMode === 'CASH' ||
                                                history.paymentMode === 'UPI'
                                              ? 'bg-green-500'
                                              : history.paymentMode === 'ONLINE'
                                                ? 'bg-blue-500'
                                                : 'bg-gray-500'
                                        }`}
                                      />
                                      <div>
                                        <Typography
                                          variant="subtitle1"
                                          className="font-medium"
                                        >
                                          {history.isSplitPayment
                                            ? 'SPLIT'
                                            : history.paymentMode}
                                        </Typography>
                                        {history.isSplitPayment &&
                                          history.splitPaymentSummary && (
                                            <Typography
                                              variant="caption"
                                              color="textSecondary"
                                            >
                                              {history.splitPaymentSummary}
                                            </Typography>
                                          )}
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                        >
                                          {dayjs(history.paymentDate).format(
                                            'DD/MM/YYYY',
                                          )}
                                        </Typography>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Chip
                                        label={`₹${parseFloat(
                                          history.paidOrderAmount,
                                        ).toLocaleString()}`}
                                        color="success"
                                        size="small"
                                      />
                                      {parseFloat(history.discountAmount) >
                                        0 && (
                                        <Chip
                                          icon={<Discount />}
                                          label={`₹${parseFloat(
                                            history.discountAmount,
                                          ).toLocaleString()}`}
                                          color="warning"
                                          size="small"
                                        />
                                      )}
                                      {canEditDeleteAdvancePayment && (
                                        <IconButton
                                          size="small"
                                          onClick={(e) =>
                                            handleMenuOpen(e, history, payment)
                                          }
                                          sx={{ ml: 1 }}
                                        >
                                          <MoreVert fontSize="small" />
                                        </IconButton>
                                      )}
                                    </div>
                                  </div>
                                </AccordionSummary>

                                <AccordionDetails>
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                        >
                                          Payment Date
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          className="font-medium"
                                        >
                                          {dayjs(history.paymentDate).format(
                                            'DD/MM/YYYY',
                                          )}
                                        </Typography>
                                      </div>
                                      <div>
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                        >
                                          Payment Mode
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          className="font-medium"
                                        >
                                          {history.isSplitPayment
                                            ? 'SPLIT (Cash + UPI)'
                                            : history.paymentMode}
                                        </Typography>
                                      </div>
                                      {history.isSplitPayment && (
                                        <>
                                          <div>
                                            <Typography
                                              variant="body2"
                                              color="textSecondary"
                                            >
                                              Cash
                                            </Typography>
                                            <Typography
                                              variant="body1"
                                              className="font-medium"
                                            >
                                              ₹
                                              {parseFloat(
                                                history.splitCashAmount || 0,
                                              ).toLocaleString()}
                                            </Typography>
                                          </div>
                                          <div>
                                            <Typography
                                              variant="body2"
                                              color="textSecondary"
                                            >
                                              UPI
                                            </Typography>
                                            <Typography
                                              variant="body1"
                                              className="font-medium"
                                            >
                                              ₹
                                              {parseFloat(
                                                history.splitUpiAmount || 0,
                                              ).toLocaleString()}
                                            </Typography>
                                          </div>
                                        </>
                                      )}
                                      <div>
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                        >
                                          Amount Paid
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          className="font-medium text-green-600"
                                        >
                                          ₹
                                          {parseFloat(
                                            history.paidOrderAmount,
                                          ).toLocaleString()}
                                        </Typography>
                                      </div>
                                      <div>
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                        >
                                          Discount Applied
                                        </Typography>
                                        <Typography
                                          variant="body1"
                                          className="font-medium text-blue-600"
                                        >
                                          ₹
                                          {parseFloat(
                                            history.discountAmount,
                                          ).toLocaleString()}
                                        </Typography>
                                      </div>
                                    </div>

                                    {history.couponCode && (
                                      <div className="pt-2 border-t border-gray-200">
                                        <Typography
                                          variant="body2"
                                          color="textSecondary"
                                          className="mb-1"
                                        >
                                          Coupon Code
                                        </Typography>
                                        <Chip
                                          label={history.couponCode}
                                          color="primary"
                                          variant="outlined"
                                          className="font-mono"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </AccordionDetails>
                              </Accordion>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      )}

      <Modal
        uniqueKey="advance-payment-modal"
        maxWidth={'md'}
        paperSx={{
          maxHeight: '80vh',
          width: '100%',
          maxWidth: '600px',
        }}
        onClose={() => {
          setCategory('')
          setSubCategory('')
          setDescription('')
          setAmount('')
          setErrors({})
          dispatch(closeModal('advance-payment-modal'))
        }}
      >
        <Box
          sx={{
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Advance Payment</h1>
            <IconButton
              onClick={() => {
                setCategory('')
                setSubCategory('')
                setDescription('')
                setAmount('')
                setErrors({})
                dispatch(closeModal('advance-payment-modal'))
              }}
            >
              <Close />
            </IconButton>
          </div>

          <div className="flex flex-col gap-6">
            {/* Category Dropdown */}
            <FormControl fullWidth required error={!!errors.category}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                label="Category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
              {errors.category && (
                <Typography
                  variant="caption"
                  color="error"
                  className="mt-1 ml-2"
                >
                  {errors.category}
                </Typography>
              )}
            </FormControl>

            {/* Sub-Category Dropdown - Conditional */}
            {isSubCategoryRequired() && (
              <FormControl fullWidth required error={!!errors.subCategory}>
                <InputLabel id="subcategory-label">Sub-Category</InputLabel>
                <Select
                  labelId="subcategory-label"
                  label="Sub-Category"
                  value={subCategory}
                  onChange={(e) => {
                    setSubCategory(e.target.value)
                    setErrors((prev) => ({ ...prev, subCategory: '' }))
                  }}
                >
                  {getSubCategories().map((subCat) => (
                    <MenuItem key={subCat} value={subCat}>
                      {subCat}
                    </MenuItem>
                  ))}
                </Select>
                {errors.subCategory && (
                  <Typography
                    variant="caption"
                    color="error"
                    className="mt-1 ml-2"
                  >
                    {errors.subCategory}
                  </Typography>
                )}
              </FormControl>
            )}

            {/* Description Field */}
            <TextField
              label="Description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setErrors((prev) => ({ ...prev, description: '' }))
              }}
              fullWidth
              multiline
              rows={3}
              placeholder="Enter description (optional)"
              error={!!errors.description}
              helperText={errors.description || 'Optional field'}
            />

            {/* Amount Field */}
            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setErrors((prev) => ({ ...prev, amount: '' }))
              }}
              fullWidth
              required
              placeholder="Enter amount"
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: <span className="text-gray-500 mr-1">₹</span>,
                inputProps: {
                  min: 0,
                  step: '0.01',
                },
              }}
            />

            <div className="flex justify-end mt-4">
              <Button
                variant="outlined"
                color="primary"
                className="capitalize"
                onClick={() => handleAddOtherPayment()}
                disabled={addOtherPaymentLoading || !isFormValid()}
                sx={{ minWidth: '120px', height: '40px' }}
              >
                {addOtherPaymentLoading ? 'Adding...' : 'Add'}
              </Button>
            </div>
          </div>
        </Box>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        payment={selectedPayment}
        coupons={coupons}
        onPayment={handlePayment}
        onClose={() => {
          dispatch(closeModal('payment-modal'))
          setEditablePayableAmount(0)
          setSelectedPayment(null)
        }}
        isAdmin={isAdmin}
        editablePayableAmount={editablePayableAmount}
        onPayableAmountChange={handlePayableAmountChange}
      />

      {/* Invoice Preview Modal */}
      <Modal
        uniqueKey="invoice-preview-modal"
        maxWidth={'lg'}
        onClose={() => {
          dispatch(closeModal('invoice-preview-modal'))
          setShowInvoicePreview(false)
          setInvoiceHtml('')
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Invoice Preview</h1>
          <IconButton
            onClick={() => {
              dispatch(closeModal('invoice-preview-modal'))
              setShowInvoicePreview(false)
              setInvoiceHtml('')
            }}
          >
            <Close />
          </IconButton>
        </div>

        {showInvoicePreview && (
          <div className="max-h-[70vh] overflow-y-auto">
            <InvoicePreview content={invoiceHtml} />
          </div>
        )}
      </Modal>

      {/* 3-dot Menu (card header: list per entry; row: single Edit/Delete) */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          },
        }}
      >
        {cardMenuPayment ? (
          cardMenuPayment.paymentHistory?.length > 0 ? (
            cardMenuPayment.paymentHistory?.map((history, idx) => (
              <React.Fragment key={history.id ?? idx}>
                <MenuItem onClick={() => handleEditClick(history)}>
                  <ListItemIcon>
                    <Edit fontSize="small" sx={{ color: 'primary.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Edit"
                    secondary={`${history.paymentMode} - ${dayjs(history.paymentDate).format('DD/MM/YYYY')}`}
                  />
                </MenuItem>
                <MenuItem onClick={() => handleDeleteClick(history)}>
                  <ListItemIcon>
                    <Delete fontSize="small" sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Delete"
                    secondary={`${history.paymentMode} - ${dayjs(history.paymentDate).format('DD/MM/YYYY')}`}
                  />
                </MenuItem>
              </React.Fragment>
            ))
          ) : (
            <MenuItem
              onClick={() => {
                setDeleteEntryConfirm(cardMenuPayment)
                handleMenuClose()
              }}
            >
              <ListItemIcon>
                <Delete fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="Delete advance payment"
                secondary="Remove this entry and its details"
              />
            </MenuItem>
          )
        ) : (
          <>
            <MenuItem onClick={() => handleEditClick()}>
              <ListItemIcon>
                <Edit fontSize="small" sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleDeleteClick()}>
              <ListItemIcon>
                <Delete fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Edit Payment History Dialog */}
      <Dialog
        open={!!editPaymentHistory}
        onClose={() => {
          setEditPaymentHistory(null)
          setEditFormData({
            paymentTitle: '',
            paidOrderAmount: '',
            discountAmount: '',
            paymentMode: '',
            orderDate: '',
            couponCode: '',
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Payment History</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Payment title"
              value={editFormData.paymentTitle}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  paymentTitle: e.target.value,
                }))
              }
              fullWidth
              size="small"
              required
              inputProps={{ maxLength: 100 }}
              helperText="Shown on the advance payment row (max 100 characters)"
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
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="SPLIT">SPLIT (Cash + UPI)</MenuItem>
              </Select>
            </FormControl>

            {/* Payment Date */}
            <TextField
              label="Payment Date"
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

            {/* Paid Amount */}
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
              InputProps={{
                startAdornment: <span className="text-gray-500 mr-1">₹</span>,
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
              InputProps={{
                startAdornment: <span className="text-gray-500 mr-1">₹</span>,
              }}
            />

            {/* Coupon Code */}
            <TextField
              label="Coupon Code"
              value={editFormData.couponCode}
              onChange={(e) =>
                setEditFormData((prev) => ({
                  ...prev,
                  couponCode: e.target.value,
                }))
              }
              fullWidth
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditPaymentHistory(null)
              setEditFormData({
                paymentTitle: '',
                paidOrderAmount: '',
                discountAmount: '',
                paymentMode: '',
                orderDate: '',
                couponCode: '',
              })
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={updatePaymentHistoryMutation.isPending}
          >
            {updatePaymentHistoryMutation.isPending ? 'Updating...' : 'Update'}
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
            Are you sure you want to delete this payment history entry? This
            action cannot be undone.
          </Typography>
          {deleteConfirm && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Payment Mode:</strong> {deleteConfirm.paymentMode}
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> ₹
                {parseFloat(deleteConfirm.paidOrderAmount).toLocaleString(
                  'en-IN',
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong>{' '}
                {dayjs(deleteConfirm.paymentDate).format('DD MMM, YYYY')}
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
            disabled={deletePaymentHistoryMutation.isPending}
          >
            {deletePaymentHistoryMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Advance Payment Entry Confirmation (whole line – e.g. pending) */}
      <Dialog
        open={!!deleteEntryConfirm}
        onClose={() => setDeleteEntryConfirm(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete advance payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this advance payment entry? This
            will remove the entry and all details (amount, description, and any
            payment history). This action cannot be undone.
          </Typography>
          {deleteEntryConfirm && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Description:</strong> {deleteEntryConfirm.paymentReason}
              </Typography>
              <Typography variant="body2">
                <strong>Total amount:</strong> ₹
                {parseFloat(deleteEntryConfirm.totalAmount || 0).toLocaleString(
                  'en-IN',
                )}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteEntryConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteEntryConfirm}
            disabled={deleteAdvancePaymentEntryMutation.isPending}
          >
            {deleteAdvancePaymentEntryMutation.isPending
              ? 'Deleting...'
              : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

// Payment Modal Component
const PaymentModal = ({
  payment,
  coupons,
  onPayment,
  onClose,
  isAdmin,
  editablePayableAmount,
  onPayableAmountChange,
}) => {
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [discountedAmount, setDiscountedAmount] = useState(0)
  const [paymentFlow, setPaymentFlow] = useState('single')
  const [splitPaymentAmounts, setSplitPaymentAmounts] = useState({
    cashAmount: '',
    upiAmount: '',
  })

  // Calculate discounted amount when coupon changes
  useEffect(() => {
    if (!payment) return

    const totalAmount = parseFloat(payment.totalAmount)
    const remainingAmount = totalAmount - payment.paidAmount
    const payableAmount = isAdmin ? editablePayableAmount : remainingAmount

    if (!selectedCoupon) {
      setDiscountedAmount(payableAmount)
      return
    }

    const discount = (payableAmount * selectedCoupon.discountPercentage) / 100
    setDiscountedAmount(payableAmount - discount)
  }, [selectedCoupon, payment, isAdmin, editablePayableAmount])

  if (!payment) return null

  const totalAmount = parseFloat(payment.totalAmount)
  const remainingAmount = totalAmount - payment.paidAmount
  const payableAmount = isAdmin ? editablePayableAmount : remainingAmount

  const splitCashAmount = Number(splitPaymentAmounts.cashAmount || 0)
  const splitUpiAmount = Number(splitPaymentAmounts.upiAmount || 0)
  const splitTotalAmount = Number((splitCashAmount + splitUpiAmount).toFixed(2))
  const splitBalanceAmount = Number(
    (discountedAmount - splitTotalAmount).toFixed(2),
  )

  const paymentDataBase = {
    refId: payment.refId,
    totalAmount: payableAmount,
    payableAmount: payableAmount,
    discountedAmount: discountedAmount,
    discountAmount: payableAmount - discountedAmount,
    couponCode: selectedCoupon?.id,
  }

  return (
    <Modal
      uniqueKey="payment-modal"
      maxWidth={'lg'}
      paperSx={{
        maxHeight: '95vh',
        width: '100%',
        maxWidth: '800px',
        borderRadius: '12px',
      }}
      onClose={onClose}
    >
      <Box
        sx={{
          padding: '24px 32px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold">Payment Details</h1>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </div>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
          }}
        >
          {/* Payment Summary */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              p: 2,
              borderRadius: 2,
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Typography variant="body2" color="textSecondary">
                  Total Amount
                </Typography>
                <Typography variant="h6" className="font-bold">
                  ₹{totalAmount.toLocaleString()}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Paid Amount
                </Typography>
                <Typography variant="h6" className="font-bold text-green-600">
                  ₹{payment.paidAmount.toLocaleString()}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Remaining Amount
                </Typography>
                <Typography variant="h6" className="font-bold text-orange-600">
                  ₹{remainingAmount.toLocaleString()}
                </Typography>
              </div>
              <div>
                <Typography variant="body2" color="textSecondary">
                  Payment Reason
                </Typography>
                <Typography variant="body1" className="font-medium">
                  {payment.paymentReason}
                </Typography>
              </div>
            </div>
          </Box>

          {/* Admin Payable Amount Field */}
          {isAdmin && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }} fontWeight={600}>
                Payable Amount (Admin)
              </Typography>
              <TextField
                type="number"
                label="Payable Amount"
                value={editablePayableAmount || ''}
                onChange={(e) =>
                  onPayableAmountChange(e.target.value, remainingAmount)
                }
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <span className="text-gray-500 mr-1">₹</span>,
                  inputProps: {
                    min: 0,
                    max: remainingAmount,
                    step: '0.01',
                  },
                }}
                helperText={`Max: ₹${remainingAmount.toLocaleString()}`}
              />
            </Box>
          )}

          {/* Coupon Section */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }} fontWeight={600}>
              Apply Coupon
            </Typography>
            <Autocomplete
              options={coupons || []}
              getOptionLabel={(option) =>
                `${option.couponCode} (${option.discountPercentage}% off)`
              }
              value={selectedCoupon}
              onChange={(event, newValue) => setSelectedCoupon(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Coupon"
                  variant="outlined"
                  fullWidth
                />
              )}
            />
          </Box>

          {/* Discount Summary */}
          {selectedCoupon && (
            <Box
              sx={{
                bgcolor: 'success.50',
                p: 2.5,
                borderRadius: 2,
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-green-600">
                  <Typography variant="body1" fontWeight={500}>
                    Discount ({selectedCoupon.discountPercentage}%)
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    -₹{(payableAmount - discountedAmount).toFixed(2)}
                  </Typography>
                </div>
                <div className="border-t border-green-200 pt-2">
                  <div className="flex justify-between font-bold text-green-700">
                    <Typography variant="h6" fontWeight={600}>
                      Final Amount
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      ₹{discountedAmount.toFixed(2)}
                    </Typography>
                  </div>
                </div>
              </div>
            </Box>
          )}

          {/* Payment method */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }} fontWeight={600}>
              How do you want to pay?
            </Typography>
            <ToggleButtonGroup
              exclusive
              fullWidth
              value={paymentFlow}
              onChange={(e, next) => next != null && setPaymentFlow(next)}
              size="small"
              sx={{ mb: 2 }}
            >
              <ToggleButton value="single">Single method</ToggleButton>
              <ToggleButton value="splitExpert">
                Split payment (Cash + UPI)
              </ToggleButton>
            </ToggleButtonGroup>

            {paymentFlow === 'single' && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 2,
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  className="capitalize"
                  onClick={() => onPayment('ONLINE', paymentDataBase)}
                  startIcon={<CreditCard />}
                  disabled={true}
                  sx={{ height: '44px', fontSize: '0.95rem' }}
                >
                  Pay Online
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  className="capitalize"
                  onClick={() => onPayment('UPI', paymentDataBase)}
                  startIcon={<Money />}
                  sx={{ height: '44px', fontSize: '0.95rem' }}
                >
                  Pay UPI
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  className="capitalize"
                  onClick={() => onPayment('CASH', paymentDataBase)}
                  startIcon={<Money />}
                  sx={{ height: '44px', fontSize: '0.95rem' }}
                >
                  Pay Cash
                </Button>
              </Box>
            )}

            {paymentFlow === 'splitExpert' && (
              <Box className="p-3 border rounded-md bg-gray-50">
                <Typography variant="subtitle2" gutterBottom>
                  Divide payable amount across Cash and UPI
                </Typography>
                <Grid container spacing={2} sx={{ mt: 0 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Cash amount"
                      type="number"
                      value={splitPaymentAmounts.cashAmount}
                      onChange={(e) =>
                        setSplitPaymentAmounts((prev) => ({
                          ...prev,
                          cashAmount: e.target.value,
                        }))
                      }
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="UPI amount"
                      type="number"
                      value={splitPaymentAmounts.upiAmount}
                      onChange={(e) =>
                        setSplitPaymentAmounts((prev) => ({
                          ...prev,
                          upiAmount: e.target.value,
                        }))
                      }
                      inputProps={{ min: 0, step: '0.01' }}
                    />
                  </Grid>
                </Grid>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1.5, mb: 1.5 }}
                >
                  Payable: ₹{discountedAmount.toFixed(2)} | Split total: ₹
                  {splitTotalAmount.toFixed(2)} | Balance: ₹
                  {splitBalanceAmount.toFixed(2)}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  className="capitalize"
                  disabled={
                    discountedAmount <= 0 ||
                    splitCashAmount <= 0 ||
                    splitUpiAmount <= 0 ||
                    splitBalanceAmount !== 0
                  }
                  onClick={() =>
                    onPayment('SPLIT', {
                      ...paymentDataBase,
                      splitPayment: {
                        cashAmount: splitCashAmount,
                        upiAmount: splitUpiAmount,
                        totalAmount: splitTotalAmount,
                      },
                    })
                  }
                >
                  Pay with split (Cash + UPI)
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Modal>
  )
}

// Invoice Preview Component
const InvoicePreview = ({ content }) => {
  console.log('content', content)
  return (
    <div className="w-full">
      {/* <TextJoedit
        placeholder="Invoice content will appear here..."
        content={content}
        readonly={true}
      /> */}
      <JoditEditor value={content} config={{ readonly: true }} />
    </div>
  )
}

export default AdvancePayments
