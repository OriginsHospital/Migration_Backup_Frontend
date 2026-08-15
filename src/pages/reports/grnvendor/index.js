import { getGrnVendorPaymentsReport, saveGrnPayments } from '@/constants/apis'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import {
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material'
import Modal from '@/components/Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
import DataDisplay from '@/components/DataDisplay'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import Breadcrumb from '@/components/Breadcrumb'
import { grnVendorReportFilterData } from '@/constants/filters'

const Index = () => {
  const user = useSelector(store => store.user)
  const [columns, setColumns] = useState([
    'grnNo',
    'date',
    'supplier',
    'supplierEmail',
    'supplierAddress',
    'supplierGstNumber',
    'invoiceNumber',
    'totalAmount',
    'returnAmount',
    'runningAmount',
    'totalDaysSince',
    'status',
    'delay',
    'stage',
  ])
  const [selectedVendorPayment, setSelectedVendor] = useState()

  const [paymentPayload, setPaymentPayload] = useState({
    typeOfPayment: 'CASH',
    paymentDate: dayjs(new Date()),
    remarks: '',
  })
  const dispatch = useDispatch()

  const handlePayment = e => {
    dispatch(openModal('vendorPayments'))
    setSelectedVendor(e.row)
  }

  const chipComponent = params => {
    const getStatusBG = status => {
      switch (status) {
        case 'DUE':
          return 'error'
        case 'PAID':
          return 'success'
      }
    }
    return (
      <>
        {params?.value !== 'DUE' ? (
          <Chip label={params.value} color={getStatusBG(params.value)} />
        ) : (
          <Button variant="outlined" onClick={() => handlePayment(params)}>
            Pay{' '}
          </Button>
        )}
      </>
    )
  }

  // Define custom filters
  const customFilters = [
    {
      field: 'grnNo',
      label: 'GRN Number',
      type: 'text',
    },
    {
      field: 'supplier',
      label: 'Supplier Name',
      type: 'text',
    },
    {
      field: 'status',
      label: 'Payment Status',
      type: 'select',
      options: [
        { value: 'DUE', label: 'Due' },
        { value: 'PAID', label: 'Paid' },
      ],
    },
    {
      field: 'totalAmount',
      label: 'Total Amount',
      type: 'number',
    },
    // {
    //   field: 'date',
    //   label: 'Date Range',
    //   type: 'dateRange',
    // },
  ]

  // Get unique values for dropdowns
  const getUniqueValues = field => {
    if (!reportsData) return []
    const values = new Set(reportsData.map(row => row[field]))
    return Array.from(values).filter(Boolean)
  }

  // Filter data based on applied filters

  const { data: reportsData, isLoading: isReportFetchLoading } = useQuery({
    queryKey: ['fetchGRNVendorPaymentsReportData'],
    enabled: true,
    queryFn: async () => {
      const responsejson = await getGrnVendorPaymentsReport(user?.accessToken)
      if (responsejson.status == 200) {
        const transformedData = responsejson?.data?.map(
          ({ paymentStageInfo, ...rest }) => ({
            ...rest,
            delay: paymentStageInfo?.delay,
            stage: paymentStageInfo?.stage,
          }),
        )
        return transformedData
      } else {
        throw new Error(
          'Error occurred while fetching medicine details for pharmcy',
        )
      }
    },
  })
  const queryClient = useQueryClient()
  useEffect(() => {
    if (isReportFetchLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isReportFetchLoading])
  const camelToNormalCase = str => {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
  const handlePaymentComplete = async () => {
    if (!paymentPayload.paymentDate) {
      toast.error('Payment date is required', toastconfig)
      return
    } else if (!paymentPayload.remarks) {
      toast.error('Remarks are required', toastconfig)
      return
    }
    const response = await saveGrnPayments(user.accessToken, {
      grnNo: selectedVendorPayment?.grnNo,
      amount:
        selectedVendorPayment?.totalAmount -
        selectedVendorPayment?.returnAmount,
      typeOfPayment: paymentPayload.typeOfPayment,
      paymentDate: paymentPayload.paymentDate,
      remarks: paymentPayload.remarks,
    })
    if (response.status == 200) {
      toast.success(response.data, toastconfig)
      dispatch(closeModal('vendorPayments'))
      queryClient.invalidateQueries('fetchGRNVendorPaymentsReportData')
    }
  }
  return (
    <div className=" flex flex-col m-5 gap-3">
      <Breadcrumb />
      <Modal
        uniqueKey={'vendorPayments'}
        closeOnOutsideClick={true}
        maxWidth={'md'}
      >
        <div className="flex flex-col gap-3">
          <DataDisplay
            title={'Vendor Payment'}
            keys={columns}
            sectionData={selectedVendorPayment}
          />
          <Divider className="mb-3" />
          <div className="grid grid-cols-4  gap-5">
            <div>
              <Typography
                variant="body2"
                color="textSecondary"
                className="truncate"
              >
                {`Total Amount`}
              </Typography>
              <Typography variant="h5" className="truncate">
                {selectedVendorPayment?.totalAmount}
              </Typography>
            </div>
            <div>
              <Typography
                variant="body2"
                color="textSecondary"
                className="truncate"
              >
                {`Returned Amount`}
              </Typography>
              <Typography variant="h5" className="truncate">
                {selectedVendorPayment?.returnAmount}
              </Typography>
            </div>

            <DatePicker
              label="Payment Date"
              format="DD/MM/YYYY"
              className="bg-white rounded-lg"
              value={
                paymentPayload?.paymentDate
                  ? dayjs(paymentPayload?.paymentDate)
                  : null
              }
              name="paymentDate"
              onChange={newValue =>
                setPaymentPayload({
                  ...paymentPayload,
                  paymentDate: dayjs(newValue).format('YYYY-MM-DD'),
                })
              }
            />
            <FormControl>
              <FormLabel>Mode of Payment</FormLabel>
              <RadioGroup
                value={paymentPayload?.typeOfPayment}
                name="typeOfPayment"
                onChange={e =>
                  setPaymentPayload({
                    ...paymentPayload,
                    [e.target.name]: e.target.value,
                  })
                }
              >
                <FormControlLabel
                  value="CASH"
                  control={<Radio />}
                  label="CASH"
                />
                <FormControlLabel
                  value="NEFT"
                  control={<Radio />}
                  label="NEFT"
                />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Remarks"
              name="remarks"
              className="col-span-2"
              multiline={true}
              rows={2}
              value={paymentPayload.remarks}
              onChange={e =>
                setPaymentPayload({
                  ...paymentPayload,
                  [e.target.name]: e.target.value,
                })
              }
            />
            <div>
              <Typography
                variant="body2"
                color="textSecondary"
                className="truncate"
              >
                {`Amount Payable`}
              </Typography>
              <Typography variant="h5" className="truncate">
                {selectedVendorPayment?.totalAmount -
                  selectedVendorPayment?.returnAmount}
              </Typography>
            </div>
            <div className="flex justify-end items-end">
              <Button onClick={handlePaymentComplete}>Pay Now</Button>
            </div>
          </div>

          <div className="flex gap-3"></div>
        </div>
      </Modal>
      <h2 className="text-2xl font-bold text-secondary">Vendor Payments</h2>
      <div className="">
        <FilteredDataGrid
          rows={reportsData || []}
          columns={columns?.map(columnName => ({
            field: columnName,
            headerName: camelToNormalCase(columnName),
            width: 150,
            renderCell: columnName == 'status' && chipComponent,
            cellClassName: params =>
              params.row.stage === 'DUE' ? 'bg-red-100' : 'bg-green-100',
          }))}
          customFilters={customFilters}
          filterData={grnVendorReportFilterData}
          getUniqueValues={getUniqueValues}
          disableRowSelectionOnClick
          pageSize={10}
        />
      </div>
    </div>
  )
}
export default Index
