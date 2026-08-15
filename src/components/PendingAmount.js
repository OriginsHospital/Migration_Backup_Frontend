import { useDispatch, useSelector } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { closeModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import dayjs from 'dayjs'
import {
  getCoupons,
  getOrderIdTreatment,
  sendTransactionDetailsTreatment,
} from '@/constants/apis'
import { useEffect, useMemo, useState } from 'react'
import {
  Autocomplete,
  Button,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import {
  Add,
  CheckCircle,
  Close,
  CreditCard,
  Delete,
  DeleteOutline,
  Money,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers'
import { toastconfig } from '@/utils/toastconfig'

const PendingAmount = ({
  patientDetails,
  treatmentPendings,
  allPaymentDetails,
  initialSelectedProductType,
}) => {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const [selectedMilestones, setSelectedMilestones] = useState([])
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [discountedAmount, setDiscountedAmount] = useState(0)
  const [discountedMilestones, setDiscountedMilestones] = useState([])
  const [payableAmounts, setPayableAmounts] = useState({})
  // const [dueDates, setDueDates] = useState({})
  // const [comments, setComments] = useState({})
  const isAdmin = user.roleDetails?.id === 1 || user.roleDetails?.id === 7

  // Get coupons from API
  const { data: coupons } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await getCoupons(user.accessToken)
      return res.data
    },
  })

  // Initialize payable amounts when milestones change
  useEffect(() => {
    const initialPayableAmounts = {}
    treatmentPendings?.forEach((milestone) => {
      initialPayableAmounts[milestone.productTypeEnum] =
        milestone.pending_amount
    })
    setPayableAmounts(initialPayableAmounts)
  }, [treatmentPendings])

  useEffect(() => {
    const normalizeValue = (value) =>
      String(value || '')
        .trim()
        .toLowerCase()
    const selectionKey = normalizeValue(initialSelectedProductType)

    if (!selectionKey) {
      setSelectedMilestones([])
      return
    }

    const matchedMilestone = (allPaymentDetails || []).find((item) =>
      [
        item?.productTypeEnum,
        item?.productType,
        item?.displayName,
        item?.dateColumn,
      ].some((value) => normalizeValue(value) === selectionKey),
    )

    if (matchedMilestone) {
      setSelectedMilestones([matchedMilestone])
    } else {
      setSelectedMilestones([])
    }
  }, [initialSelectedProductType, allPaymentDetails])

  // Calculate total payable amount based on selected milestones and payable amounts
  const totalPayableAmount = useMemo(() => {
    return selectedMilestones.reduce((sum, milestone) => {
      return sum + Number(payableAmounts[milestone.productTypeEnum] || 0)
    }, 0)
  }, [selectedMilestones, payableAmounts])

  // Handle payable amount change with validation
  const handlePayableAmountChange = (productTypeEnum, value, pendingAmount) => {
    const numValue = Number(value) || 0
    // Ensure entered amount doesn't exceed pending amount
    const validatedAmount = Math.min(numValue, pendingAmount)

    setPayableAmounts((prev) => ({
      ...prev,
      [productTypeEnum]: validatedAmount,
    }))
  }

  // Currency formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate discounted milestones when coupon changes
  useEffect(() => {
    if (!selectedCoupon || selectedMilestones.length === 0) {
      setDiscountedMilestones(
        selectedMilestones.map((milestone) => ({
          ...milestone,
          originalAmount: payableAmounts[milestone.productTypeEnum],
          discountedAmount: payableAmounts[milestone.productTypeEnum],
          appliedDiscount: 0,
        })),
      )
      setDiscountedAmount(totalPayableAmount)
      return
    }

    const discountPercentage = Number(selectedCoupon.discountPercentage)
    const totalDiscount = (totalPayableAmount * discountPercentage) / 100

    // Use original order from treatmentPendings for selected milestones
    const orderedMilestones = treatmentPendings.filter((pending) =>
      selectedMilestones.some(
        (m) => m.productTypeEnum === pending.productTypeEnum,
      ),
    )

    let remainingDiscount = totalDiscount
    const updatedMilestones = orderedMilestones.map((milestone) => {
      const payableAmount = payableAmounts[milestone.productTypeEnum]
      const maxDiscountForMilestone = payableAmount
      const appliedDiscount = Math.min(
        remainingDiscount,
        maxDiscountForMilestone,
      )
      remainingDiscount -= appliedDiscount

      return {
        ...milestone,
        originalAmount: payableAmount,
        discountedAmount: payableAmount - appliedDiscount,
        appliedDiscount,
      }
    })

    setDiscountedMilestones(updatedMilestones)
    setDiscountedAmount(totalPayableAmount - totalDiscount)
  }, [
    selectedCoupon,
    selectedMilestones,
    payableAmounts,
    totalPayableAmount,
    treatmentPendings,
  ])

  // Handle milestone selection
  const handleMilestoneSelect = (milestone) => {
    setSelectedMilestones((prev) => {
      const isSelected = prev.some(
        (m) => m.productTypeEnum === milestone.productTypeEnum,
      )
      if (isSelected) {
        return prev.filter(
          (m) => m.productTypeEnum !== milestone.productTypeEnum,
        )
      } else {
        return [...prev, milestone]
      }
    })
  }
  const generatePaymentPayload = (paymentMode) => {
    return {
      packageDetails: null,
      isPackageExists: patientDetails.isPackageExists,
      visitId: patientDetails.visitId,
      paymentMode: paymentMode,
      orderDetails: selectedMilestones.map((milestone) => {
        const originalAmount = payableAmounts[milestone.productTypeEnum] || 0
        const isDeferred = milestone.pending_amount > originalAmount
        const remainingPending = milestone.pending_amount - originalAmount
        const discountedItem = discountedMilestones.find(
          (m) => m.productTypeEnum === milestone.productTypeEnum,
        )

        return {
          totalOrderAmount: String(milestone.pending_amount), // total to be paid
          payableAmount: String(originalAmount), // paying amount for now
          couponCode: selectedCoupon?.id || null, // optional
          discountAmount: String(discountedItem?.appliedDiscount || 0), // discount amount
          payableAfterDiscountAmount: String(
            originalAmount - (discountedItem?.appliedDiscount || 0),
          ), // amount after discount
          pendingOrderAmount: String(remainingPending),
          productType: milestone.productTypeEnum,
          appointmentId: patientDetails.appointmentId,
          dateColumn: milestone.dateColumn || 'NA',
          mileStoneStartedDate: milestone.mileStoneStartedDate || 'NA',
          // comments: isDeferred ? comments[milestone.productTypeEnum] || '' : '',
          // dueDate: isDeferred ? dueDates[milestone.productTypeEnum] || '' : '',
        }
      }),
    }
  }
  const handlePayment = async (paymentMode) => {
    const payload = generatePaymentPayload(paymentMode)
    console.log(payload)
    if (paymentMode === 'CASH') {
      if (window.confirm('Are you sure you want to pay offline?')) {
        const order = await getOrderIdTreatment(user?.accessToken, payload)
        if (order.status === 200) {
          toast.success('Payment successful through cash', toastconfig)
          queryClient.invalidateQueries('allAppointments')
          setSelectedMilestones([])
          // setDueDates({})
          // setComments({})
          setSelectedCoupon(null)
          setPayableAmounts({})
          setDiscountedMilestones([])
          setDiscountedAmount(0)
        }
      }
    } else if (paymentMode === 'UPI') {
      if (window.confirm('Are you sure you want to pay UPI?')) {
        const order = await getOrderIdTreatment(user?.accessToken, payload)
        if (order.status === 200) {
          toast.success('Payment successful through UPI', toastconfig)
          queryClient.invalidateQueries('allAppointments')
          setSelectedMilestones([])
          // setDueDates({})
          // setComments({})
          setSelectedCoupon(null)
          setPayableAmounts({})
          setDiscountedMilestones([])
          setDiscountedAmount(0)
        }
      }
    } else if (paymentMode === 'ONLINE') {
      const order = await getOrderIdTreatment(user?.accessToken, payload)
      if (order.status === 200) {
        let options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_ID,
          amount: order.data.totalOrderAmount * 100,
          currency: 'INR',
          name: 'Origins',
          image:
            'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
          description: 'Test Transaction',
          order_id: order.data.orderId,
          'theme.color': '#FF6C22',
          handler: async (response) => {
            const order_details = {
              visitId: order.data.visitId,
              appointmentId: patientDetails.appointmentId,
              orderId: response.razorpay_order_id,
              transactionId: response.razorpay_payment_id,
              packageDetails: order.data.packageDetails,
              isPackageExists: order.data.isPackageExists,
              dateColumns: order.data.dateColumns,
            }
            const p = await sendTransactionDetailsTreatment(
              user.accessToken,
              order_details,
            )
            if (p.status === 200) {
              toast.success('Payment successful through online', toastconfig)
              queryClient.invalidateQueries('allAppointments')
              setSelectedMilestones([])
              // setDueDates({})
              // setComments({})
              setSelectedCoupon(null)
              setPayableAmounts({})
              setDiscountedMilestones([])
              setDiscountedAmount(0)
            }
          },
        }

        const paymentObject = new window.Razorpay(options)
        paymentObject.open()

        paymentObject.on('payment.failed', function (response) {
          console.log(response.error.code)
          console.log(response.error.description)
          console.log(response.error.source)
        })

        paymentObject.on('payment.success', function (response) {
          console.log('on success ', response)
        })
      }
    }
  }

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-secondary">
          Collect Pending Amount
        </h2>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>
      {/* Multiselect for all the milestones using allPaymentDetails */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max p-3">
          {/* chips */}
          {/* {allPaymentDetails?.map((item, index) => (
            <Chip
              key={index}
              label={
                <div className="flex flex-col">
                  <span>{item.displayName}</span>
                  <span className="text-xs">
                    {formatCurrency(item.pending_amount)}
                  </span>
                </div>
              }
              onClick={() => handleMilestoneSelect(item)}
              // color={

              //     selectedMilestones.some(m => m.productTypeEnum === item.productTypeEnum) ? "secondary" : "default"}
              icon={
                item.pending_amount > 0 ? (
                  selectedMilestones.some(
                    m => m.productTypeEnum === item.productTypeEnum,
                  ) ? (
                    <CheckCircle className="text-secondary" />
                  ) : (
                    <Add />
                  )
                ) : (
                  <CheckCircle className="text-green-600" />
                )
              }
              // onDelete={() => handleMilestoneSelect(item)}
              className={`h-auto py-2 ${
                item.pending_amount > 0 ? 'bg-primary/20' : 'bg-success/20'
              } ${
                selectedMilestones.some(
                  m => m.productTypeEnum === item.productTypeEnum,
                )
                  ? 'bg-primary/50'
                  : 'bg-white'
              }`}
              // disabled={item.mileStoneStartedDate === 'NA'}
            />
          ))} */}
          {/* {selectedTab === 'pending' ? ( */}
          <Autocomplete
            className="w-full"
            multiple
            options={allPaymentDetails || []}
            value={selectedMilestones}
            onChange={(event, newValue) => {
              setSelectedMilestones(newValue)
            }}
            getOptionLabel={(option) => option.displayName}
            renderOption={(props, option) => (
              <li {...props}>
                <div className="flex justify-between gap-5 items-center">
                  <span>{option.displayName}</span>
                  <div className="flex gap-2 text-xs">
                    {option.totalPaid > 0 && (
                      <span className="text-green-600 flex items-center gap-1">
                        <span>Paid: {formatCurrency(option.totalPaid)}</span>
                      </span>
                    )}
                    {option.pending_amount > 0 ? (
                      <>
                        <span className="text-red-600">
                          Pending: {formatCurrency(option.pending_amount)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                {option.pending_amount > 0 ? (
                  selectedMilestones.some(
                    (m) => m.productTypeEnum === option.productTypeEnum,
                  ) ? (
                    <CheckCircle className="text-secondary ml-auto" />
                  ) : (
                    <Add className="ml-auto" />
                  )
                ) : (
                  <CheckCircle className="text-green-600 ml-auto" />
                )}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Select Milestones"
                placeholder="Select milestones"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={index}
                  label={option.displayName}
                  className={`${
                    option.pending_amount > 0
                      ? 'bg-primary/20'
                      : 'bg-success/20'
                  }`}
                />
              ))
            }
          />
          {/* ) : (
                        organizedMilestones.paid.map((item, index) => (
                            <Chip
                                key={index}
                                label={
                                    <div className="flex flex-col">
                                        <span>{item.displayName}</span>
                                        <span className="text-xs text-green-600">Paid</span>
                                    </div>
                                }
                                icon={<CheckCircle className="text-green-600" />}
                                className="h-auto py-2"
                                variant="outlined"
                            />
                        ))
                    )} */}
        </div>
      </div>

      {treatmentPendings && (
        <div className="mt-6">
          {/* Milestone List */}
          <div className="space-y-2">
            {selectedMilestones.map((item, index) => {
              const isSelected = selectedMilestones.some(
                (m) => m.productTypeEnum === item.productTypeEnum,
              )
              const isDeferred =
                item.pending_amount > payableAmounts[item.productTypeEnum]

              const discountedItem = discountedMilestones.find(
                (m) => m.productTypeEnum === item.productTypeEnum,
              )
              const remainingPending =
                item.pending_amount -
                (payableAmounts[item.productTypeEnum] || 0)
              // const discountPosition = getMilestoneDiscountPosition(item)

              return (
                <div
                  key={index}
                  className={`flex flex-col justify-between p-3 rounded-lg border 
                      ${
                        selectedMilestones.some(
                          (m) => m.productTypeEnum === item.productTypeEnum,
                        )
                          ? 'bg-primary/20'
                          : ' bg-white'
                      }
                      `}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className={`flex items-center gap-3 `}>
                      {/* <Checkbox
                                                checked={selectedMilestones.some(
                                                    m => m.productTypeEnum === item.productTypeEnum,
                                                )}
                                                onChange={() => handleMilestoneSelect(item)}
                                            // disabled={item.mileStoneStartedDate === 'NA' || item.pending_amount === 0}
                                            /> */}
                      {/* <IconButton>
                                                <DeleteOutline
                                                    className="text-red-600"
                                                    onClick={() => handleMilestoneSelect(item)}
                                                />
                                            </IconButton> */}
                      {/* <Divider orientation="vertical" flexItem /> */}
                      <div>
                        <Typography ariant="subtitle1">
                          {item.displayName}
                        </Typography>
                        {item.mileStoneStartedDate !== 'NA' && (
                          <Typography
                            variant="caption"
                            className="text-gray-500"
                          >
                            Milestone Started on{' '}
                            {dayjs(item.mileStoneStartedDate).format(
                              'DD MMM YYYY',
                            )}
                          </Typography>
                        )}
                        <div className="flex flex-col mt-1">
                          {/* {item.pending_amount > 0 && ( */}
                          <Typography
                            variant="caption"
                            className="text-blue-600"
                          >
                            Total : {formatCurrency(item.totalAmount)}
                          </Typography>
                          {/* )} */}
                          {item.pending_amount > 0 && (
                            <Typography
                              variant="caption"
                              className="text-yellow-600"
                            >
                              Pending: {formatCurrency(item.pending_amount)}
                            </Typography>
                          )}
                          {remainingPending > 0 &&
                            payableAmounts[item.productTypeEnum] > 0 && (
                              <Typography
                                variant="caption"
                                className="text-orange-600"
                              >
                                Remaining: {formatCurrency(remainingPending)}
                              </Typography>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col gap-2">
                      {isAdmin && item.pending_amount > 0 ? (
                        <TextField
                          type="number"
                          size="small"
                          label="Payable Amount"
                          value={payableAmounts[item.productTypeEnum] || ''}
                          onChange={(e) =>
                            handlePayableAmountChange(
                              item.productTypeEnum,
                              e.target.value,
                              item.pending_amount,
                            )
                          }
                          // disabled={!selectedMilestones.some(m => m.productTypeEnum === item.productTypeEnum)}
                          InputProps={{
                            startAdornment: (
                              <span className="text-gray-500 mr-1">₹</span>
                            ),
                            inputProps: {
                              min: 0,
                              max: item.pending_amount,
                              step: '0.01',
                            },
                          }}
                          // helperText={`Max: ${formatCurrency(item.pending_amount)}`}
                        />
                      ) : (
                        <Typography variant="subtitle1" className="font-medium">
                          {item.pending_amount > 0 ? (
                            formatCurrency(
                              payableAmounts[item.productTypeEnum] || 0,
                            )
                          ) : (
                            <span className="text-green-600">
                              {formatCurrency(
                                allPaymentDetails.find(
                                  (m) =>
                                    m.productTypeEnum === item.productTypeEnum,
                                )?.totalPaid || 0,
                              )}
                            </span>
                          )}
                        </Typography>
                      )}

                      {/* discount information */}
                      {discountedItem && discountedItem.appliedDiscount > 0 && (
                        <div className="space-y-1">
                          <Typography
                            variant="caption"
                            className="text-green-600"
                          >
                            After discount:{' '}
                            {formatCurrency(discountedItem.discountedAmount)}
                          </Typography>
                          {/* <Typography variant="caption" className="text-gray-500">
                            Discount priority: {discountPosition}
                          </Typography> */}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* {remainingPending > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <DatePicker
                        label="Due Date"
                        value={
                          dueDates[item.productTypeEnum]
                            ? dayjs(dueDates[item.productTypeEnum])
                            : null
                        }
                        onChange={newDate => {
                          if (newDate) {
                            setDueDates(prev => ({
                              ...prev,
                              [item.productTypeEnum]: dayjs(newDate).format(
                                'YYYY-MM-DD',
                              ),
                            }))
                          } else {
                            // Handle null/cleared date
                            setDueDates(prev => {
                              const updated = { ...prev }
                              delete updated[item.productTypeEnum]
                              return updated
                            })
                          }
                        }}
                        format="DD/MM/YYYY"
                        minDate={dayjs().add(1, 'day')}
                        slotProps={{
                          textField: {
                            size: 'small',
                            error: false,
                          },
                        }}
                      />
                      <TextField
                        label="Comments"
                        size="small"
                        value={comments[item.productTypeEnum] || ''}
                        onChange={e =>
                          setComments(prev => ({
                            ...prev,
                            [item.productTypeEnum]: e.target.value,
                          }))
                        }
                        placeholder="Enter payment comments"
                      />
                    </div>
                  )} */}
                </div>
              )
            })}
          </div>

          {/* Coupon Section */}
          {selectedMilestones.length > 0 && (
            <div className="mt-4">
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
                    label="Apply Coupon"
                    variant="outlined"
                    size="medium"
                  />
                )}
              />
              {/* {selectedCoupon && (
                  <Typography variant="caption" className="mt-2 text-gray-600 block">
                    Discount will be applied sequentially in milestone order
                  </Typography>
                )} */}
            </div>
          )}

          {/* Payment Summary */}
          {selectedMilestones.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <Typography variant="h6" className="mb-3">
                Payment Summary
              </Typography>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Selected Amount</span>
                  <span>{formatCurrency(totalPayableAmount)}</span>
                </div>
                {selectedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({selectedCoupon.discountPercentage}%)</span>
                    <span>
                      -{formatCurrency(totalPayableAmount - discountedAmount)}
                    </span>
                  </div>
                )}
                <Divider />
                <div className="flex justify-between font-bold">
                  <span>Final Amount</span>
                  <span>{formatCurrency(discountedAmount)}</span>
                </div>
              </div>

              {/* Payment Buttons */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <Button
                  color="success"
                  variant="contained"
                  className="capitalize py-3"
                  onClick={() => handlePayment('ONLINE')}
                  startIcon={<CreditCard />}
                  disabled={true}
                >
                  Pay Online
                </Button>
                <Button
                  color="success"
                  variant="outlined"
                  className="capitalize py-3"
                  onClick={() => handlePayment('UPI')}
                  startIcon={<Money />}
                >
                  Pay UPI
                </Button>
                <Button
                  color="success"
                  variant="outlined"
                  className="capitalize py-3"
                  onClick={() => handlePayment('CASH')}
                  startIcon={<Money />}
                >
                  Pay Cash
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default PendingAmount
