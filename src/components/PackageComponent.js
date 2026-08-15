import React, { useState, useEffect } from 'react'
import {
  TextField,
  Paper,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { styled } from '@mui/material/styles'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import dayjs from 'dayjs'
import { EditOutlined } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal, openModal } from '@/redux/modalSlice'
import Modal from './Modal'
import {
  getOrderIdTreatment,
  sendTransactionDetailsTreatment,
} from '@/constants/apis'
import { useQueryClient } from '@tanstack/react-query'
import { applyPackageDiscount } from '@/constants/apis'
import { hasPackageEditAccess } from '@/utils/packageEditAccess'

function PackageComponent({
  selectedVisit,
  packageData,
  createPackageMutate,
  editPackageMutate,
  isEditing,
  setIsEditing,
}) {
  const [newPackageData, setNewPackageData] = useState({
    // default values
    marketingPackage: 0,
    registrationAmount: 0,
    donorBookingAmount: 0,
    day1Amount: 0,
    pickUpAmount: 0,
    hysteroscopyAmount: 0,
    day5FreezingAmount: 0,
    pgtaAmount: 0,
    fetAmount: 0,
    eraAmount: 0,
    uptPositiveAmount: 0,
  })
  const [discountAmount, setDiscountAmount] = useState(0)
  const [paymentFlow, setPaymentFlow] = useState('single')
  const [splitPaymentAmounts, setSplitPaymentAmounts] = useState({
    cashAmount: '',
    upiAmount: '',
  })
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector((state) => state.user)
  const canEditPackage = hasPackageEditAccess(user)
  useEffect(() => {
    if (packageData && Object.keys(packageData).length > 0) {
      setNewPackageData(packageData)
    }
    // setIsEditing(packageData?.id ? false : true)
    console.log('newPackageData', newPackageData)
  }, [packageData])
  useEffect(() => {
    setSplitPaymentAmounts({ cashAmount: '', upiAmount: '' })
  }, [newPackageData.registrationAmount])
  // useEffect(() => {
  //     console.log('newPackageData', newPackageData)
  // }, [newPackageData])
  const handleInputChange = (field, value) => {
    // console.log(field, dayjs(value).format('YYYY-MM-DD'), newPackageData);
    if (field.includes('Date')) {
      setNewPackageData((prev) => ({
        ...prev,
        [field]: value ? dayjs(value).format('YYYY-MM-DD') : null,
      }))
    } else {
      setNewPackageData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = () => {
    // TODO: Implement save functionality
    // Validate that marketing package equals the sum of all other values
    const totalAmount = [
      newPackageData.registrationAmount,
      newPackageData.day1Amount,
      newPackageData.donorBookingAmount,
      newPackageData.pickUpAmount,
      newPackageData.hysteroscopyAmount,
      newPackageData.day5FreezingAmount,
      newPackageData.fetAmount,
      newPackageData.eraAmount,
      newPackageData.pgtaAmount,
      newPackageData.uptPositiveAmount,
    ].reduce((sum, amount) => sum + (amount || 0), 0)
    // validate if amount is not zero then associated date should be there
    // const validateAmountAndDate = (amount, date, fieldName) => {
    //     if (amount && !date) {
    //         toast.error(`Please provide a date for ${fieldName}`, toastconfig)
    //         return false
    //     }
    //     return true
    // }

    // const fieldsToValidate = [
    //     {
    //         amount: newPackageData.registrationAmount,
    //         date: newPackageData.registrationDate,
    //         name: 'Registration',
    //     },
    //     {
    //         amount: newPackageData.day1Amount,
    //         date: newPackageData.day1Date,
    //         name: 'Day 1',
    //     },
    //     {
    //         amount: newPackageData.pickUpAmount,
    //         date: newPackageData.pickUpDate,
    //         name: 'Pick Up',
    //     },
    //     {
    //         amount: newPackageData.hysteroscopyAmount,
    //         date: newPackageData.hysteroscopyDate,
    //         name: 'Hysteroscopy',
    //     },
    //     {
    //         amount: newPackageData.day5FreezingAmount,
    //         date: newPackageData.day5FreezingDate,
    //         name: 'Day 5 Freezing',
    //     },
    //     {
    //         amount: newPackageData.fetAmount,
    //         date: newPackageData.fetDate,
    //         name: 'FET',
    //     },
    //     {
    //         amount: newPackageData.eraAmount,
    //         date: newPackageData.eraDate,
    //         name: 'ERA',
    //     },
    //     {
    //         amount: newPackageData.uptPositiveAmount,
    //         date: newPackageData.uptPositiveDate,
    //         name: 'UPT Positive',
    //     },
    // ]

    // for (const field of fieldsToValidate) {
    //     if (!validateAmountAndDate(field.amount, field.date, field.name)) {
    //         return;
    //     }
    // }
    console.log(
      newPackageData.marketingPackage !== totalAmount,
      totalAmount == 0,
    )
    if (newPackageData.marketingPackage !== totalAmount) {
      toast.error(
        'The marketing package amount must equal the sum of all other amounts.',
        toastconfig,
      )
      return
    }

    const registrationAmount = Number(newPackageData.registrationAmount || 0)

    if (registrationAmount > 0) {
      if (!newPackageData.registrationDate) {
        toast.error('Select Registration Date.', toastconfig)
        return
      }

      handlePayAndSave(selectedVisit?.id)
      return
    }

    // Zero registration amount — save package details without payment.
    const savePayload = { ...newPackageData }
    delete savePayload.paidAmount
    delete savePayload.pendingAmount
    delete savePayload.packageDetails
    if (!!newPackageData?.id) {
      editPackageMutate?.mutate(savePayload)
    } else {
      createPackageMutate?.mutate(savePayload)
    }
  }

  const handleSavePackageChanges = () => {
    const totalAmount = [
      newPackageData.registrationAmount,
      newPackageData.day1Amount,
      newPackageData.donorBookingAmount,
      newPackageData.pickUpAmount,
      newPackageData.hysteroscopyAmount,
      newPackageData.day5FreezingAmount,
      newPackageData.fetAmount,
      newPackageData.eraAmount,
      newPackageData.pgtaAmount,
      newPackageData.uptPositiveAmount,
    ].reduce((sum, amount) => sum + (amount || 0), 0)

    if (newPackageData.marketingPackage !== totalAmount) {
      toast.error(
        'The marketing package amount must equal the sum of all other amounts.',
        toastconfig,
      )
      return
    }

    const registrationAmount = Number(newPackageData.registrationAmount || 0)
    if (registrationAmount > 0 && !newPackageData.registrationDate) {
      toast.error('Select Registration Date.', toastconfig)
      return
    }

    const savePayload = { ...newPackageData }
    delete savePayload.paidAmount
    delete savePayload.pendingAmount
    delete savePayload.packageDetails

    if (newPackageData?.id) {
      editPackageMutate?.mutate(savePayload)
    } else {
      createPackageMutate?.mutate(savePayload)
    }
  }

  const handlePayAndSave = (visitId) => {
    console.log('handlePayAndSave', visitId)
    dispatch(openModal('package' + visitId))
  }
  // const getHeading = () => {
  //   if (packageData && packageData.id) {
  //     return isEditing ? 'Editing Package' : 'Package Details'
  //   }
  //   return 'Create New Package'
  // }
  const handlePay = (modeOfPayment) => {
    let {
      doctorSuggestedPackage,
      paidAmount,
      pendingAmount,
      id,
      createdAt,
      updatedAt,
      day1Date,
      pickUpDate,
      hysteroscopyDate,
      day5FreezingDate,
      donorBookingDate,
      fetDate,
      eraDate,
      uptPositiveDate,
      pgtaDate,
      packageDetails,
      ...rest
    } = newPackageData
    console.log('rest', rest)
    const regAmount = Number(rest.registrationAmount || 0)
    if (!regAmount || regAmount <= 0) {
      toast.error(
        'Registration Amount is 0. Please enter amount to pay.',
        toastconfig,
      )
      return
    }
    if (modeOfPayment === 'Online') {
      handlePaymentMethodOnline({
        // visitId: selectedVisit?.id,
        // totalOrderAmount: rest.registrationAmount.toString(),
        // payableAmount: rest.registrationAmount.toString(),
        // pendingOrderAmount: '0',
        // discountAmount: '0',
        // payableAfterDiscountAmount: rest.registrationAmount.toString(),
        // paymentMode: 'ONLINE', // ONLINE OR CASH
        // productType: 'REGISTRATION_FEE', //PHARMACY or LAB or SCAN
        isPackageExists: 1,
        visitId: selectedVisit?.id,
        paymentMode: 'ONLINE',
        packageDetails: {
          ...rest,
          visitId: selectedVisit?.id,
        },
        orderDetails: [
          {
            totalOrderAmount: rest.registrationAmount.toString(),
            payableAmount: rest.registrationAmount.toString(),
            pendingOrderAmount: '0',
            discountAmount: '0',
            payableAfterDiscountAmount: rest.registrationAmount.toString(),
            dateColumn: 'registrationDate', // For Updating Dates
            productType: 'REGISTRATION_FEE', // For storing productType
          },
        ],
      })
    } else if (modeOfPayment === 'Cash') {
      if (window.confirm('Are you sure you want to pay cash?')) {
        handlePaymentMethodOffline({
          isPackageExists: 1,
          visitId: selectedVisit?.id,
          paymentMode: 'CASH',
          packageDetails: {
            ...rest,
            visitId: selectedVisit?.id,
          },
          orderDetails: [
            {
              totalOrderAmount: rest.registrationAmount.toString(),
              payableAmount: rest.registrationAmount.toString(),
              pendingOrderAmount: '0',
              discountAmount: '0',
              payableAfterDiscountAmount: rest.registrationAmount.toString(),
              dateColumn: 'registrationDate', // For Updating Dates
              productType: 'REGISTRATION_FEE', // For storing productType
            },
          ],
        })
      }
    } else if (modeOfPayment === 'UPI') {
      if (window.confirm('Are you sure you want to pay UPI?')) {
        handlePaymentMethodOffline({
          isPackageExists: 1,
          visitId: selectedVisit?.id,
          paymentMode: 'UPI',
          packageDetails: {
            ...rest,
            visitId: selectedVisit?.id,
          },
          orderDetails: [
            {
              totalOrderAmount: rest.registrationAmount.toString(),
              payableAmount: rest.registrationAmount.toString(),
              pendingOrderAmount: '0',
              discountAmount: '0',
              payableAfterDiscountAmount: rest.registrationAmount.toString(),
              dateColumn: 'registrationDate', // For Updating Dates
              productType: 'REGISTRATION_FEE', // For storing productType
            },
          ],
        })
      }
    }
  }

  const stripPackagePayload = () => {
    let {
      doctorSuggestedPackage,
      paidAmount,
      pendingAmount,
      id,
      createdAt,
      updatedAt,
      day1Date,
      pickUpDate,
      hysteroscopyDate,
      day5FreezingDate,
      donorBookingDate,
      fetDate,
      eraDate,
      uptPositiveDate,
      pgtaDate,
      packageDetails,
      ...rest
    } = newPackageData
    return rest
  }

  const handlePaySplitExpert = () => {
    const rest = stripPackagePayload()
    const regAmount = Number(rest.registrationAmount || 0)
    if (!regAmount || regAmount <= 0) {
      toast.error(
        'Registration Amount is 0. Please enter amount to pay.',
        toastconfig,
      )
      return
    }

    const cashAmount = Number(splitPaymentAmounts.cashAmount || 0)
    const upiAmount = Number(splitPaymentAmounts.upiAmount || 0)
    const totalSplitAmount = Number((cashAmount + upiAmount).toFixed(2))
    const billAmount = Number(Number(regAmount).toFixed(2))

    if (cashAmount <= 0 || upiAmount <= 0) {
      toast.error(
        'Split payment requires both Cash and UPI amounts greater than 0',
        toastconfig,
      )
      return
    }

    if (totalSplitAmount !== billAmount) {
      toast.error(
        `Split total must equal registration amount (₹${billAmount.toFixed(2)})`,
        toastconfig,
      )
      return
    }

    if (
      !window.confirm(
        'Confirm split payment (expert): registration fee divided across Cash and UPI?',
      )
    ) {
      return
    }

    handlePaymentMethodOffline({
      isPackageExists: 1,
      visitId: selectedVisit?.id,
      paymentMode: 'CASH',
      packageDetails: {
        ...rest,
        visitId: selectedVisit?.id,
      },
      orderDetails: [
        {
          totalOrderAmount: rest.registrationAmount.toString(),
          payableAmount: rest.registrationAmount.toString(),
          pendingOrderAmount: '0',
          discountAmount: '0',
          payableAfterDiscountAmount: rest.registrationAmount.toString(),
          dateColumn: 'registrationDate',
          productType: 'REGISTRATION_FEE',
          splitPayment: {
            cashAmount,
            upiAmount,
            totalAmount: totalSplitAmount,
          },
          splitPaymentSummary: `Cash: ₹${cashAmount.toFixed(2)}, UPI: ₹${upiAmount.toFixed(2)}`,
        },
      ],
    })
  }

  const regAmtNum = Number(newPackageData.registrationAmount || 0)
  const splitCashAmount = Number(splitPaymentAmounts.cashAmount || 0)
  const splitUpiAmount = Number(splitPaymentAmounts.upiAmount || 0)
  const splitTotalAmount = Number((splitCashAmount + splitUpiAmount).toFixed(2))
  const splitBalanceAmount = Number((regAmtNum - splitTotalAmount).toFixed(2))

  const handlePaymentMethodOffline = async (payload) => {
    try {
      const data = await getOrderIdTreatment(user.accessToken, payload)
      if (data.status == 200) {
        dispatch(closeModal())
        // setPayClicked(null)
        queryClient.invalidateQueries()
      }
    } catch (error) {
      console.log('Error fetching Order ID:', error)
    }
    // setIsLoading(false)
  }
  const handlePaymentMethodOnline = async (payload) => {
    console.log('payload', payload)

    try {
      const data = await getOrderIdTreatment(user.accessToken, payload)
      let options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_ID,
        amount: data.data.totalOrderAmount * 100, //{data.amount}
        currency: 'INR',
        name: 'Origins',

        image:
          'https://img.freepik.com/premium-vector/charity-abstract-logo-healthy-lifestyle_660762-34.jpg?size=626&ext=jpg',
        description: 'Test Transaction',
        order_id: data.data.orderId, //{ data.orderId}
        'theme.color': '#FF6C22',
        handler: async (response) => {
          console.log(response)
          const order_details = {
            orderId: response.razorpay_order_id,
            transactionId: response.razorpay_payment_id,
            packageDetails: payload.packageDetails,
            // ,
            // transactionType: response.razorpay_signature,
          }
          // handle payment success
          // write a mutate and invalidate the getPharmacyDetails
          const p = await sendTransactionDetailsTreatment(
            user.accessToken,
            order_details,
          )
          console.log(p)
          if (p.status == 200 && order_details && order_details.transactionId) {
            dispatch(closeModal())
            // setPayClicked(null)
            queryClient.invalidateQueries()
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
        //queryClient.invalidateQueries(['pharmacyModuleInfoByDate'])
        console.log('on success ', response)
      })
    } catch (error) {
      console.log('Error fetching Order ID:', error)
    }
    // setIsLoading(false)
  }

  const handleApplyDiscount = async () => {
    try {
      const data = await applyPackageDiscount(user.accessToken, {
        packageId: packageData?.id,
        discountAmount: discountAmount,
      })
      if (data.status == 200) {
        dispatch(closeModal('applyDiscount'))
        queryClient.invalidateQueries(['PackageData', selectedVisit?.id])
        toast.success(data.message)
      } else {
        toast.error(data.message)
        dispatch(closeModal('applyDiscount'))
      }
    } catch (error) {
      toast.error(error.message)
      console.log('Error fetching Order ID:', error)
    }
  }
  return (
    <Card elevation={3}>
      <CardContent>
        {!packageData && (
          <div className="text-center text-lg font-semibold">
            No Package Data Found
          </div>
        )}
        {packageData && (
          <>
            <Grid
              className="flex gap-3 items-center"
              style={{ marginBottom: '20px' }}
            >
              {/* <Typography variant="h5" gutterBottom>
                        {getHeading()}
                    </Typography> */}
              {canEditPackage && packageData?.id && !isEditing && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsEditing(true)}
                  startIcon={<EditOutlined />}
                  className="capitalize"
                >
                  Edit Package
                </Button>
              )}
              <>
                {isEditing && !packageData?.id && canEditPackage && (
                  <Button
                    variant="contained"
                    color="primary"
                    className="text-white capitalize w-[250px] h-[40px]"
                    onClick={handleSave}
                  >
                    Pay and Save
                  </Button>
                )}
                {isEditing && packageData?.id && canEditPackage && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      className="text-white capitalize w-[180px] h-[40px]"
                      onClick={handleSavePackageChanges}
                    >
                      Save Package
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      className="capitalize h-[40px]"
                      onClick={() => {
                        setNewPackageData(packageData)
                        setIsEditing(false)
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                <div className="flex justify-end gap-2 w-full items-center">
                  {packageData?.discount && (
                    <TextField
                      label="Applied Discount"
                      className="w-[250px]"
                      value={packageData?.discount}
                      disabled
                    />
                  )}
                  {!packageData?.discount &&
                    !isEditing &&
                    [1, 7].includes(user.roleDetails?.id) && (
                      <Button
                        variant="contained"
                        color="primary"
                        className="text-white capitalize h-[40px]"
                        onClick={() => dispatch(openModal('applyDiscount'))}
                      >
                        Apply Discount
                      </Button>
                    )}
                  <Modal
                    uniqueKey="applyDiscount"
                    size="sm"
                    closeOnOutsideClick={true}
                  >
                    <div className="flex flex-col gap-2 justify-center items-center">
                      <TextField
                        label="Discount Amount"
                        required
                        type="number"
                        className="w-[250px]"
                        onChange={(e) =>
                          setDiscountAmount(Number(e.target.value))
                        }
                      />
                      <div className="flex m-4 gap-2">
                        <Button
                          variant="contained"
                          color="primary"
                          className="text-white capitalize w-[100px]"
                          disabled={discountAmount <= 0}
                          onClick={handleApplyDiscount}
                        >
                          Apply
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          className="text-white capitalize w-[100px]"
                          onClick={() => dispatch(closeModal('applyDiscount'))}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Modal>
                </div>
              </>
              {/* )} */}
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Doctor Suggested Package Amount"
                  value={`${newPackageData?.doctorSuggestedPackage ?? ''}`}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Marketing Package Amount"
                  value={`${newPackageData.marketingPackage ?? ''}`}
                  type="number"
                  onChange={(e) =>
                    handleInputChange(
                      'marketingPackage',
                      Number(e.target.value),
                    )
                  }
                  InputProps={{
                    readOnly:
                      !isEditing || (packageData?.id && !canEditPackage),
                  }}
                />
              </Grid>
              {/* doctorSuggestedPackage */}

              {[
                {
                  label: 'Registration',
                  date: 'registrationDate',
                  amount: 'registrationAmount',
                },
                {
                  label: 'Donor Booking',
                  date: 'donorBookingDate',
                  amount: 'donorBookingAmount',
                },
                { label: 'Day 1', date: 'day1Date', amount: 'day1Amount' },
                {
                  label: 'Trigger',
                  date: 'pickUpDate',
                  amount: 'pickUpAmount',
                },
                {
                  label: 'Day 5 Freezing',
                  date: 'day5FreezingDate',
                  amount: 'day5FreezingAmount',
                },
                {
                  label: 'Hysteroscopy',
                  date: 'hysteroscopyDate',
                  amount: 'hysteroscopyAmount',
                },
                {
                  label: 'ERA',
                  date: 'eraDate',
                  amount: 'eraAmount',
                },
                {
                  label: 'FET',
                  date: 'fetDate',
                  amount: 'fetAmount',
                },
                {
                  label: 'PGT-A',
                  date: 'pgtaDate',
                  amount: 'pgtaAmount',
                },
                {
                  label: 'UPT Positive',
                  date: 'uptPositiveDate',
                  amount: 'uptPositiveAmount',
                },
              ].map(({ label, date, amount }) => (
                <React.Fragment key={label}>
                  <Grid item xs={12} sm={3}>
                    <DatePicker
                      label={`${label} Date`}
                      value={
                        newPackageData[date]
                          ? dayjs(newPackageData[date])
                          : null
                      }
                      format="DD/MM/YYYY"
                      onChange={(value) => handleInputChange(date, value)}
                      renderInput={(params) => (
                        <TextField {...params} fullWidth />
                      )}
                      readOnly={
                        date !== 'registrationDate' ||
                        !isEditing ||
                        (packageData?.id && !canEditPackage)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label={`${label} Amount`}
                      value={`${newPackageData[amount]}`}
                      type="number"
                      onChange={(e) =>
                        handleInputChange(amount, Number(e.target.value))
                      }
                      InputProps={{
                        readOnly:
                          !isEditing || (packageData?.id && !canEditPackage),
                      }}
                    />
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
          </>
        )}
      </CardContent>
      <Modal
        uniqueKey={'package' + selectedVisit?.id}
        closeOnOutsideClick={true}
        onOutsideClick={() =>
          dispatch(closeModal('package' + selectedVisit?.id))
        }
      >
        <div className="min-w-[280px]">
          <Typography variant="h6" gutterBottom>
            Payment
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Registration amount — {newPackageData.registrationAmount}
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
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
              Split payment (expert)
            </ToggleButton>
          </ToggleButtonGroup>

          {paymentFlow === 'single' && (
            <div className="flex justify-end gap-2 flex-wrap">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handlePay('Online')}
                disabled={regAmtNum <= 0}
              >
                Pay online
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handlePay('UPI')}
                disabled={regAmtNum <= 0}
              >
                Pay UPI
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handlePay('Cash')}
                disabled={regAmtNum <= 0}
              >
                Pay cash
              </Button>
            </div>
          )}

          {paymentFlow === 'splitExpert' && (
            <div className="p-3 border rounded-md bg-gray-50">
              <Typography variant="subtitle2" gutterBottom>
                Divide registration fee across Cash and UPI
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
                    disabled={regAmtNum <= 0}
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
                    disabled={regAmtNum <= 0}
                  />
                </Grid>
              </Grid>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1.5, mb: 1.5 }}
              >
                Split total: ₹{splitTotalAmount.toFixed(2)} | Balance: ₹
                {splitBalanceAmount.toFixed(2)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                className="capitalize"
                disabled={
                  regAmtNum <= 0 ||
                  splitCashAmount <= 0 ||
                  splitUpiAmount <= 0 ||
                  splitBalanceAmount !== 0
                }
                onClick={handlePaySplitExpert}
              >
                Pay split (₹{regAmtNum.toFixed(2)})
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  )
}

export default PackageComponent
