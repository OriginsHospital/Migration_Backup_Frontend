import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Autocomplete,
  Button,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { getItemSuggestionGRN, saveGrnDetails } from '@/constants/apis'
import { useSelector } from 'react-redux'
import { Bounce, toast, ToastContainer } from 'react-toastify'
import { CloseSharp } from '@mui/icons-material'
const toastconfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}

/** Branches allowed for GRN entry (pharmacy requirement). */
const GRN_ALLOWED_BRANCH_CODES = new Set(['HYD', 'HNK', 'SPL', 'KMM'])

const isActiveSupplier = (s) => {
  const v = s?.isActive
  return v === true || v === 1 || v === '1'
}

// const createEmptyItem = () => ({
//   itemId: '',
//   itemName: '',
//   batchNo: '',
//   expiryDate: dayjs(new Date()).format('YYYY-MM-DD'),
//   pack: '',
//   quantity: '',
//   freeQuantity: '',
//   mrp: '',
//   rate: '',
//   mrpPerTablet: '',
//   ratePerTablet: '',
//   taxPercentage: '',
//   discountAmount: '',
//   discountPercentage: '',
//   taxAmount: '',
//   amount: '',
// });

// const createEmptyPaymentDetails = () => ({
//   subTotal: '',
//   overAllDiscountPercentage: '',
//   overAllDiscountAmount: '',
//   taxAmount: '',
//   netAmount: '',
//   otherCharges: '',
//   freight: '',
//   cst: '',
//   excise: '',
//   cess: '',
//   creditNoteAmount: '',
//   netPayable: '',
//   remarks: '',
// });
// const createEmptyGrnDetail = () => (
//   {
//     grnNo: '',
//     date: dayjs(new Date).format('YYYY-MM-DD'),
//     supplierId: null,
//     supplierName: '',
//     supplierEmail: '',
//     supplierAddress: '',
//     supplierGstNumber: '',
//     invoiceNumber: '',
//   }
// )
const GrnComponent = ({
  suppliers,
  grnDetails,
  setGrnDetails,
  grnItemDetails,
  setGrnItemDetails,
  grnPaymentDetails,
  setGrnPaymentDetails,
  createEmptyItem,
  createEmptyPaymentDetails,
  createEmptyGrnDetail,
}) => {
  const [itemSuggestions, setItemSuggestions] = useState([])
  const [loadingItemsSuggestion, setLoadingItemsSuggestion] = useState(false)
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches } = dropdowns

  const grnBranchOptions = useMemo(() => {
    return (branches || []).filter((b) => {
      const code = (b.branchCode || b.name || '')
        .toString()
        .trim()
        .toUpperCase()
      return GRN_ALLOWED_BRANCH_CODES.has(code)
    })
  }, [branches])

  const grnSupplierOptions = useMemo(() => {
    const list = Array.isArray(suppliers) ? suppliers : []
    const active = list.filter(isActiveSupplier)
    return [...active].sort((a, b) =>
      (a.supplier || '').localeCompare(b.supplier || '', undefined, {
        sensitivity: 'base',
      }),
    )
  }, [suppliers])

  const handleSupplierChange = (event, value) => {
    if (value) {
      setGrnDetails((prevDetails) => ({
        ...prevDetails,
        supplierId: value.id,
        supplierName: value.supplier,
        supplierEmail: value.emailId,
        supplierAddress: value.address,
        supplierGstNumber: value.gstNumber,
      }))
    } else {
      setGrnDetails((prevDetails) => ({
        ...prevDetails,
        supplierId: null,
        supplierEmail: '',
        supplierAddress: '',
        supplierGstNumber: '',
      }))
    }
  }
  const handleAddItem = () => {
    setGrnItemDetails([...grnItemDetails, createEmptyItem()])
  }

  const handleGRNdetailsChange = (event) => {
    setGrnDetails({ ...grnDetails, [event.target.name]: event.target.value })
  }
  // const handleGRNItemdetailsChange = (index, event) => {
  //   const newGrnItemDetails = grnItemDetails.map((item, i) => {
  //     if (i === index) {
  //       switch (event.target.name) {
  //         case 'pack': {
  //           const ratePerTablet = Number(item.rate) / ((Number(item.quantity) + Number(item.freeQuantity)) * Number(event.target.value));
  //           const mrpPerTablet = Number(item.mrp) / (Number(item.quantity) * Number(event.target.value))

  //           return { ...item, pack: event.target.value, ratePerTablet: ratePerTablet, mrpPerTablet: mrpPerTablet };
  //         }

  //         case 'quantity': {
  //           const mrpPerTablet = Number(item.mrp) / Number(event.target.value) * Number(item.pack);
  //           const ratePerTablet = Number(item.rate) / Number(event.target.value);

  //           return { ...item, quantity: event.target.value, mrpPerTablet: mrpPerTablet, ratePerTablet: ratePerTablet };
  //         }
  //         case 'freeQuantity': {
  //           const ratePerTablet = Number(item.rate) / (Number(item.quantity) + Number(event.target.value));
  //           return { ...item, freeQuantity: event.target.value, ratePerTablet: ratePerTablet };
  //         }
  //         case 'mrp': {
  //           const mrpPerTablet = Number(event.target.value) / Number(item.quantity);
  //           return { ...item, mrp: event.target.value, mrpPerTablet: mrpPerTablet };
  //         }
  //         case 'rate': {
  //           const ratePerTablet = Number(event.target.value) / Number(item.quantity);
  //           const taxAmount = (Number(event.target.value) * Number(item.taxPercentage)) / 100;
  //           return { ...item, rate: event.target.value, ratePerTablet: ratePerTablet, taxAmount: taxAmount };
  //         }
  //         case 'taxPercentage': {
  //           const taxAmount = (Number(item.rate) * Number(event.target.value)) / 100;
  //           return { ...item, taxPercentage: event.target.value, taxAmount: taxAmount };
  //         }
  //         default: return { ...item, [event.target.name]: event.target.value };
  //       }
  //     }
  //     return item;
  //   });
  //   console.log(newGrnItemDetails)
  //   setGrnItemDetails(newGrnItemDetails);
  // };
  const handleGRNItemdetailsChange = (index, event) => {
    const { name, value } = event.target
    const parsedValue = Number(value)

    const updatedGrnItemDetails = [...grnItemDetails]
    const item = { ...updatedGrnItemDetails[index] }

    switch (name) {
      case 'pack': {
        item.pack = parsedValue
        // mrp per unit = Mrp per packsize * packsize
        item.mrpPerTablet = item.mrp / parsedValue
        // rate per unit = Rate per packsize * packsize
        item.ratePerTablet = item.rate / parsedValue

        // total quantity = packsize * (quantity + freeQuantity)
        const totalQuantity =
          parsedValue * (Number(item.quantity) + Number(item.freeQuantity))

        // tax Amount = mrp per packsize * quantity * (Tax %)
        item.taxAmount = item.rate * item.quantity * (item.taxPercentage / 100)

        // discount Amount = mrp per packsize * quantity * (Discount %)
        item.discountAmount =
          item.mrp * item.quantity * (item.discountPercentage / 100)

        // ItemAmount = (mrp per packsize * quantity) + tax Amount - Discount Amount
        item.amount =
          item.rate * item.quantity + item.taxAmount - item.discountAmount
        break
      }

      case 'quantity':
      case 'freeQuantity': {
        item[name] = parsedValue

        // total quantity = packsize * (quantity + freeQuantity)
        const totalQuantity =
          item.pack * (Number(item.quantity) + Number(item.freeQuantity))

        // tax Amount = mrp per packsize * quantity * (Tax %)
        item.taxAmount = item.rate * item.quantity * (item.taxPercentage / 100)

        // discount Amount = mrp per packsize * quantity * (Discount %)
        item.discountAmount =
          item.rate * item.quantity * (item.discountPercentage / 100)

        // ItemAmount = (mrp per packsize * quantity) + tax Amount - Discount Amount
        item.amount =
          item.rate * item.quantity + item.taxAmount - item.discountAmount
        break
      }

      case 'mrp': {
        item.mrp = parsedValue
        // mrp per unit = Mrp per packsize * packsize
        item.mrpPerTablet = parsedValue / item.pack

        // tax Amount = mrp per packsize * quantity * (Tax %)
        break
      }

      case 'rate': {
        item.rate = parsedValue
        item.taxAmount =
          parsedValue * item.quantity * (item.taxPercentage / 100)

        // discount Amount = mrp per packsize * quantity * (Discount %)
        item.discountAmount =
          parsedValue * item.quantity * (item.discountPercentage / 100)

        // ItemAmount = (mrp per packsize * quantity) + tax Amount - Discount Amount
        item.amount =
          parsedValue * item.quantity + item.taxAmount - item.discountAmount

        // rate per unit = Rate per packsize * packsize
        item.ratePerTablet = parsedValue / item.pack
        break
      }

      case 'taxPercentage': {
        item.taxPercentage = parsedValue
        // tax Amount = mrp per packsize * quantity * (Tax %)
        item.taxAmount = item.rate * item.quantity * (parsedValue / 100)
        // ItemAmount = (mrp per packsize * quantity) + tax Amount - Discount Amount
        item.amount =
          item.rate * item.quantity + item.taxAmount - item.discountAmount
        break
      }

      case 'discountPercentage': {
        item.discountPercentage = parsedValue
        // discount Amount = mrp per packsize * quantity * (Discount %)
        item.discountAmount = item.rate * item.quantity * (parsedValue / 100)
        // ItemAmount = (mrp per packsize * quantity) + tax Amount - Discount Amount
        item.amount =
          item.rate * item.quantity + item.taxAmount - item.discountAmount
        break
      }

      default:
        item[name] = value
    }

    updatedGrnItemDetails[index] = item
    setGrnItemDetails(updatedGrnItemDetails)

    // Update subtotal and payment details
    const subTotal = updatedGrnItemDetails.reduce(
      (acc, item) => acc + (item.amount || 0),
      0,
    )
    if (subTotal > 0) {
      console.log(subTotal)
      const roundedSubTotal = Number(subTotal.toFixed(2))
      setGrnPaymentDetails((prev) => ({
        ...prev,
        subTotal: roundedSubTotal,
        overAllDiscountAmount:
          prev.overAllDiscountPercentage === 0
            ? 0
            : roundedSubTotal * (prev.overAllDiscountPercentage / 100),
        netAmount:
          prev.overAllDiscountPercentage === 0
            ? roundedSubTotal
            : roundedSubTotal - prev.overAllDiscountAmount,
        netPayable:
          prev.overAllDiscountPercentage === 0 &&
          [
            prev.otherCharges,
            prev.freight,
            prev.cst,
            prev.excise,
            prev.cess,
          ].every((charge) => charge === 0)
            ? roundedSubTotal
            : roundedSubTotal -
              prev.overAllDiscountAmount +
              [
                prev.otherCharges,
                prev.freight,
                prev.cst,
                prev.excise,
                prev.cess,
              ].reduce((acc, charge) => acc + Number(charge), 0),
      }))
    }
  }

  const handleItemChange = (index, event, value) => {
    const newGrnItemDetails = grnItemDetails.map((item, i) => {
      if (i === index && value) {
        console.log(index, value)
        return {
          ...item,
          itemId: value.id,
          itemName: value.itemName,
        }
      }
      return item
    })
    setGrnItemDetails(newGrnItemDetails)
  }
  const handleSubmit = async () => {
    // Submit grn data to server
    // and display success message
    console.log(grnDetails, grnItemDetails, grnPaymentDetails)
    let payload = {
      grnDetails,
      grnItemDetails,
      grnPaymentDetails,
    }

    const response = await saveGrnDetails(user?.accessToken, payload)
    console.log(response)
    if (response.status == 200) {
      toast.success(response.message, toastconfig)
      setGrnDetails(createEmptyGrnDetail())
      setGrnItemDetails([createEmptyItem()])
      setGrnPaymentDetails(createEmptyPaymentDetails())
    } else {
      toast.error(response.message, toastconfig)
    }
  }
  const fetchItemSuggestions = async (searchValue) => {
    setLoadingItemsSuggestion(true)
    try {
      const response = await getItemSuggestionGRN(
        user?.accessToken,
        searchValue,
      )
      // console.log(response);
      setItemSuggestions(response?.data)

      setLoadingItemsSuggestion(false)
    } catch (error) {
      console.error('Error fetching item suggestions:', error)
    }
  }

  const handleItemInputChange = (event, value) => {
    console.log(value)
    fetchItemSuggestions(value)
  }
  const handleRemoveItem = (event, index) => {
    const updatedGrnItemDetails = [...grnItemDetails]
    updatedGrnItemDetails.splice(index, 1)
    setGrnItemDetails(updatedGrnItemDetails)
  }

  const handleGRNPaymentChange = useCallback((event) => {
    const { name, value } = event.target
    const parsedValue = Number(value)

    setGrnPaymentDetails((prev) => {
      const updated = { ...prev }

      if (name === 'overAllDiscountPercentage') {
        const discountAmount = Number(
          ((prev.subTotal * parsedValue) / 100).toFixed(2),
        )
        const netAmount = Number((prev.subTotal - discountAmount).toFixed(2))
        const charges = ['otherCharges', 'freight', 'cst', 'excise', 'cess']
        const totalCharges = charges.reduce(
          (sum, charge) => sum + Number(prev[charge]),
          0,
        )
        const netPayable =
          netAmount + totalCharges - Number(prev.creditNoteAmount)

        Object.assign(updated, {
          overAllDiscountPercentage: parsedValue,
          overAllDiscountAmount: discountAmount,
          netAmount,
          netPayable,
        })
      } else {
        updated[name] = parsedValue

        // Calculate net payable based on all charges
        const charges = ['otherCharges', 'freight', 'cst', 'excise', 'cess']
        const totalCharges = charges.reduce(
          (sum, charge) =>
            sum + Number(charge === name ? parsedValue : prev[charge]),
          0,
        )

        updated.netPayable =
          name === 'creditNoteAmount'
            ? Number(prev.netAmount) - parsedValue
            : Number(prev.netAmount) + totalCharges
      }

      return updated
    })
  }, [])

  const validateForm = () => {
    const isGRNDetailsValid = Object.values(grnDetails).every((value) => value)
    const areGRNItemsValid = grnItemDetails.every((item) =>
      Object.values(item).every((value) => value),
    )
    const isGRNPaymentDetailsValid = Object.values(grnPaymentDetails).every(
      (value) => value,
    )

    return isGRNDetailsValid && areGRNItemsValid && isGRNPaymentDetailsValid
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-5 text-secondary">GRN Details</h2>
        <div className="flex flex-wrap gap-4">
          {/* <TextField
            label="GRN No"
            value={grnDetails.grnNo}
            name="grnNo"
            onChange={handleGRNdetailsChange}
          /> */}
          <DatePicker
            className="w-56"
            value={dayjs(grnDetails.date)}
            name="date"
            format="DD/MM/YYYY"
            onChange={(newValue) =>
              setGrnDetails({
                ...grnDetails,
                date: dayjs(newValue).format('YYYY-MM-DD'),
              })
            }
          />
          <Autocomplete
            options={grnBranchOptions}
            getOptionLabel={(option) => option.name}
            value={
              grnBranchOptions.find((b) => b.id === grnDetails.branchId) ?? null
            }
            onChange={(_, value) =>
              setGrnDetails({
                ...grnDetails,
                branchId: value?.id || null,
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="branch" className="min-w-56" />
            )}
          />
          <Autocomplete
            options={grnSupplierOptions}
            value={
              grnSupplierOptions.find((s) => s.id === grnDetails.supplierId) ??
              null
            }
            isOptionEqualToValue={(a, b) => a?.id === b?.id}
            getOptionLabel={(option) => option.supplier}
            onChange={handleSupplierChange}
            renderInput={(params) => (
              <TextField {...params} label="Supplier" className="min-w-56" />
            )}
          />
          <TextField
            label="Supplier Email"
            value={grnDetails.supplierEmail}
            name="supplierEmail"
            onChange={handleGRNdetailsChange}
          />
          <TextField
            label="Supplier Address"
            value={grnDetails.supplierAddress}
            name="supplierAddress"
            onChange={handleGRNdetailsChange}
          />
          <TextField
            label="Supplier GST Number"
            value={grnDetails.supplierGstNumber}
            name="supplierGstNumber"
            onChange={handleGRNdetailsChange}
          />
          <TextField
            label="Invoice Number"
            value={grnDetails.invoiceNumber}
            name="invoiceNumber"
            onChange={handleGRNdetailsChange}
          />
        </div>
      </div>
      <Divider className="my-7" />
      <div className="mb-4 flex flex-col gap-5">
        <h2 className="text-xl font-bold mb-5 text-secondary">
          GRN Item Details
        </h2>
        {grnItemDetails.map((item, index) => (
          <div
            key={index + 'grnItemDetails'}
            className="flex flex-col items-baseline justify-around gap-2"
          >
            <div className="flex w-full justify-between">
              <span className="font-semibold">{`${index + 1}.`}</span>
              {index > 0 && (
                <Button
                  onClick={(e) => handleRemoveItem(e, index)}
                  variant="outlined"
                  color="error"
                  className="capitalize"
                  // className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  <CloseSharp />
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-4 m-4">
              <Autocomplete
                className="min-w-56"
                options={itemSuggestions}
                getOptionLabel={(option) => option.itemName}
                //No options
                value={itemSuggestions.find(
                  (option) => option.id === item.itemId,
                )}
                onInputChange={handleItemInputChange}
                loading={loadingItemsSuggestion}
                onChange={(event, value) =>
                  handleItemChange(index, event, value)
                }
                renderInput={(params) => <TextField {...params} label="Item" />}
              />
              <TextField
                label="Batch No"
                value={item.batchNo}
                name="batchNo"
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
              />
              <DatePicker
                className="w-56"
                label="Expiry Date"
                value={
                  item.expiryDate && dayjs(item.expiryDate).isValid()
                    ? dayjs(item.expiryDate)
                    : null
                }
                name="expiryDate"
                format="DD/MM/YYYY"
                onChange={(newValue) =>
                  handleGRNItemdetailsChange(index, {
                    target: {
                      name: 'expiryDate',
                      value:
                        newValue != null && dayjs(newValue).isValid()
                          ? dayjs(newValue).format('YYYY-MM-DD')
                          : '',
                    },
                  })
                }
              />
              <TextField
                label="Pack size"
                value={item.pack || ''}
                type="number"
                // defaultValue={''}
                name="pack"
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
              />
              <TextField
                label="Quantity"
                value={item.quantity || ''}
                name="quantity"
                type="number"
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
              />
              <TextField
                label="Free Quantity"
                value={item.freeQuantity || ''}
                name="freeQuantity"
                type="number"
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
              />
              <TextField
                label="MRP per pack size"
                value={item.mrp || ''}
                className="w-56"
                name="mrp"
                type="number"
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body1" className="">
                        {((item.mrpPerTablet * 100) | 0) / 100} / unit
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />
              {/* <TextField
              label="MRP Per Tablet"
              value={item.mrpPerTablet}
              name="mrpPerTablet"
              type='number'
              disabled
            // onChange={(event) => handleGRNItemdetailsChange(index, event)} */}

              {/* /> */}
              <TextField
                label="Rate per pack size"
                value={item.rate || ''}
                name="rate"
                className="w-56"
                type="number"
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body1" className="">
                        {((item.ratePerTablet * 100) | 0) / 100} / unit
                      </Typography>
                    </InputAdornment>
                  ),
                }}
              />

              {/* <TextField
              label="Rate Per Tablet"
              // value={item.ratePerTablet}
              value={item?.rate && item?.quantity ? item.rate / item.quantity : ''}
              disabled
              name="ratePerTablet"

            // onChange={(event) => handleGRNItemdetailsChange(index, event)}
            /> */}
              <TextField
                label="Tax Percentage"
                value={item.taxPercentage || ''}
                name="taxPercentage"
                type="number"
                className="w-56"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" className="">
                      <Typography variant="body1" className="">
                        %
                      </Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography variant="body1" className="">
                        ₹{Number(item.taxAmount.toFixed(2)) || 0}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  style: {
                    textAlign: 'center',
                    color: '#282F33',
                    zIndex: '1',
                    paddingBottom: '10px',
                    height: '56px',
                  },
                }}
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
              />
              {/* <TextField
              label="Tax Amount"
              value={item.taxAmount}
              name="taxAmount"
              type='number'
              onChange={(event) => handleGRNItemdetailsChange(index, event)}
            /> */}

              <TextField
                label="Discount Percentage"
                value={item.discountPercentage || ''}
                name="discountPercentage"
                type="number"
                className="w-56"
                InputProps={{
                  inputProps: { min: 0, max: 10 },
                  startAdornment: (
                    <InputAdornment position="start" className="">
                      <Typography variant="body1" className="">
                        %
                      </Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end" clas>
                      <Typography variant="body1" className="">
                        ₹{Number(item.discountAmount.toFixed(2)) || 0}
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                onChange={(event) => handleGRNItemdetailsChange(index, event)}
              />
              {/* <TextField
              label="Discount Amount"
              value={item.discountAmount}
              name="discountAmount"
              type='number'
              onChange={(event) => handleGRNItemdetailsChange(index, event)}
            /> */}

              {/* <TextField
              label="Amount"
              type='number'
              value={}

              name="amount"
              disabled={true}
              onChange={(event) => handleGRNItemdetailsChange(index, event)}
            /> */}
            </div>
            <div className="w-full flex justify-end">
              <div className=" flex  border rounded text-secondary  gap-5  items-center  ">
                <span className="font-semibold p-2">{`Item Amount`}</span>
                <span className="text-2xl font-semibold bg-primary p-2">
                  {` ₹ ${item.amount ? Number(item.amount.toFixed(2)) : 0}`}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex gap-4">
          <Button
            onClick={handleAddItem}
            variant="outlined"
            // className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Item
          </Button>
        </div>
      </div>
      <Divider className="my-4" />
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-5 text-secondary">
          GRN Payment Details
        </h2>
        <div className="flex flex-wrap gap-4">
          <TextField
            label="Sub Total"
            value={grnPaymentDetails.subTotal || ''}
            name="subTotal"
            disabled
            // onChange={(event) => setGrnPaymentDetails({ ...grnPaymentDetails, subTotal: event.target.value })}
          />
          <TextField
            label="Overall Discount"
            value={grnPaymentDetails.overAllDiscountPercentage || ''}
            name="overAllDiscountPercentage"
            className="w-56"
            InputProps={{
              inputProps: { min: 0, max: 10 },
              startAdornment: (
                <InputAdornment position="start" className="">
                  <Typography variant="body1" className="">
                    %
                  </Typography>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" clas>
                  <Typography variant="body1" className="">
                    ₹
                    {grnPaymentDetails.overAllDiscountAmount
                      ? Number(
                          grnPaymentDetails.overAllDiscountAmount.toFixed(2),
                        )
                      : 0}
                  </Typography>
                </InputAdornment>
              ),
            }}
            onChange={handleGRNPaymentChange}
          />
          {/* <TextField
            label="Overall Discount Amount"
            value={grnPaymentDetails.overAllDiscountAmount}
            name="overAllDiscountAmount"
            onChange={(event) => setGrnPaymentDetails({ ...grnPaymentDetails, overAllDiscountAmount: event.target.value })}
          /> */}
          {/* <TextField
            label="Tax Amount"
            value={grnPaymentDetails.taxAmount}
            name="taxAmount"
            onChange={(event) => setGrnPaymentDetails({ ...grnPaymentDetails, taxAmount: event.target.value })}
          /> */}
          <TextField
            label="Net Amount"
            value={
              grnPaymentDetails.netAmount
                ? Number(grnPaymentDetails.netAmount.toFixed(2))
                : 0
            }
            name="netAmount"
            disabled
            // onChange={(event) => setGrnPaymentDetails({ ...grnPaymentDetails, netAmount: event.target.value })}
          />
          <TextField
            label="Other Charges"
            value={grnPaymentDetails.otherCharges || ''}
            name="otherCharges"
            type="number"
            onChange={handleGRNPaymentChange}
          />
          <TextField
            label="Freight"
            value={grnPaymentDetails.freight || ''}
            name="freight"
            type="number"
            onChange={handleGRNPaymentChange}
          />
          <TextField
            label="CST"
            value={grnPaymentDetails.cst || ''}
            name="cst"
            type="number"
            onChange={handleGRNPaymentChange}
          />
          <TextField
            label="Excise"
            value={grnPaymentDetails.excise || ''}
            name="excise"
            type="number"
            onChange={handleGRNPaymentChange}
          />
          <TextField
            label="Cess"
            value={grnPaymentDetails.cess || ''}
            name="cess"
            type="number"
            onChange={handleGRNPaymentChange}
          />
          <TextField
            label="Credit Note Amount"
            value={grnPaymentDetails.creditNoteAmount || ''}
            name="creditNoteAmount"
            type="number"
            onChange={handleGRNPaymentChange}
          />
          <TextField
            label="Remarks"
            value={grnPaymentDetails.remarks || ''}
            name="remarks"
            // multiline
            // rows={3}
            className="w-56"
            onChange={(event) =>
              setGrnPaymentDetails({
                ...grnPaymentDetails,
                remarks: event.target.value,
              })
            }
          />
          <div className="w-full flex justify-end">
            <div className=" flex shadow border rounded text-secondary  gap-5  items-center  ">
              <span className="font-semibold p-2">{`Net Payable`}</span>
              <span className="text-2xl font-semibold bg-primary p-2">
                {` ₹ ${
                  grnPaymentDetails.netPayable
                    ? Number(grnPaymentDetails.netPayable.toFixed(2))
                    : 0
                }`}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Button onClick={handleSubmit} variant="contained" className="text-white">
        Submit
      </Button>
    </div>
  )
}

export default GrnComponent
