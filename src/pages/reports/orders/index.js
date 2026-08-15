import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAllOrders,
  placeOrder,
  receiveOrder,
  payOrder,
  createOrder,
  getAllDepartments,
  getAllVendors,
  getAllSupplies,
  createNewOrder,
  getAllVendorsByDepartmentId,
  getAllSuppliesByDepartmentId,
} from '@/constants/apis'
import { useSelector, useDispatch } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import CustomToolbar from '@/components/CustomToolbar'
import ReportExportToolbar from '@/components/ReportExportToolbar'
import {
  Button,
  CircularProgress,
  IconButton,
  Input,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import dayjs from 'dayjs'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import { useEffect, useRef, useState } from 'react'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import Chip from '@mui/material/Chip'

import { useTheme } from '@mui/material/styles'
import OutlinedInput from '@mui/material/OutlinedInput'
import InputLabel from '@mui/material/InputLabel'
// import MenuItem from "@mui/material/MenuItem";
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import Autocomplete from '@mui/material/Autocomplete'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import { Close } from '@mui/icons-material'
// import TextField from "@mui/material/TextField";
import FilteredDataGrid from '@/components/FilteredDataGrid'

function OrdersPage() {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [invoiceUrl, setInvoiceUrl] = useState(null)

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['allOrders'],
    queryFn: () => getAllOrders(userDetails?.accessToken),
  })

  const handleAction = async (action, orderId) => {
    if (action === 'place') {
      setSelectedOrderId(orderId)
      dispatch(openModal('placeOrderModal'))
    } else if (action === 'receive') {
      setSelectedOrderId(orderId)
      dispatch(openModal('receiveOrderModal'))
    } else if (action === 'pay') {
      setSelectedOrderId(orderId)
      dispatch(openModal('payOrderModal'))
    }
  }

  const columns = [
    { field: 'branch', headerName: 'Branch', width: 70 },
    {
      field: 'orderDate',
      headerName: 'Order Date',
      width: 120,
      renderCell: ({ row }) => dayjs(row.orderDate).format('DD-MM-YYYY'),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      renderCell: ({ row }) => row.department.departmentName,
    },
    {
      field: 'vendor',
      headerName: 'Vendor',
      width: 200,
      renderCell: ({ row }) => row.vendor.vendorName,
    },
    {
      field: 'orderStatus',
      headerName: 'Status',
      width: 125,
      renderCell: ({ row }) => {
        const orderStatus = row.orderStatus.toLowerCase()
        return (
          <Chip
            label={orderStatus === 'ordered' ? 'Open' : row.orderStatus}
            className="capitalize w[125px]"
            color={'default'}
          />
        )
      },
    },
    {
      field: 'expectedArrivalDate',
      headerName: 'Expected Date',
      width: 150,
      renderCell: ({ row }) =>
        row.expectedArrivalDate
          ? dayjs(row.expectedArrivalDate).format('DD-MM-YYYY')
          : '',
    },
    {
      field: 'receivedDate',
      headerName: 'Received Date',
      width: 150,
      renderCell: ({ row }) =>
        row.receivedDate ? dayjs(row.receivedDate).format('DD-MM-YYYY') : '',
    },
    {
      field: 'paymentDate',
      headerName: 'Payment Date',
      width: 120,
      renderCell: ({ row }) =>
        row.paymentDate ? dayjs(row.paymentDate).format('DD-MM-YYYY') : '',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: ({ row }) => {
        const orderStatus = row.orderStatus.toLowerCase()
        return (
          <div>
            {orderStatus === 'ordered' && (
              <Button
                variant="contained"
                className="capitalize text-white bg-purple w-[90px]"
                color="error"
                onClick={() => handleAction('place', row.orderId)}
              >
                Place
              </Button>
            )}
            {orderStatus === 'placed' && (
              <Button
                variant="contained"
                className="capitalize text-white w-[90px]"
                color="warning"
                onClick={() => handleAction('receive', row.orderId)}
              >
                Receive
              </Button>
            )}
            {orderStatus === 'received' && (
              <Button
                variant="contained"
                color="success"
                className="capitalize w-[90px]"
                onClick={() => handleAction('pay', row.orderId)}
              >
                Pay
              </Button>
            )}
            {orderStatus === 'completed' && (
              <Chip
                label={row.orderStatus}
                color="success"
                className="w-[90px]"
              />
            )}
          </div>
        )
      },
    },
    {
      field: 'invoice',
      headerName: 'Invoice',
      width: 100,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          className="capitalize"
          color="info"
          disabled={!row.invoiceUrl}
          onClick={() => viewInvoice(row.invoiceUrl)}
        >
          Invoice
        </Button>
      ),
    },
    {
      field: 'viewInfo',
      headerName: 'Details',
      width: 80,
      renderCell: ({ row }) => (
        <Button
          variant="contained"
          className="capitalize"
          color="info"
          onClick={() => viewInfo(row.orderId)}
        >
          View
        </Button>
      ),
    },
  ]

  const [orderInfo, setOrderInfo] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [expectedArrivalDate, setExpectedArrivalDate] = useState(null)
  // const [paymentDate, setPaymentDate] = useState(null)
  const [receivedDate, setReceivedDate] = useState(null)
  const [invoiceFile, setInvoiceFile] = useState(null)
  const theme = useTheme()
  const [supply, setSupply] = useState([])
  const [supplyQuant, setSupplyQuant] = useState([])

  const handleFileChange = (event) => {
    setInvoiceFile(event.target.files[0])
  }

  const handleReceiveOrder = async () => {
    if (!receivedDate || !invoiceFile) {
      alert('Please select a date and upload an invoice.')
      return
    }
    try {
      const response = await receiveOrder(userDetails?.accessToken, {
        orderId: selectedOrderId,
        receivedDate,
        invoiceFile,
      })

      if (response?.status === 200) {
        dispatch(closeModal())
        toast.success('Order Received successfully', toastconfig)
        setSelectedOrderId(null)
        setReceivedDate(null)
        setInvoiceFile(null)
      } else {
        dispatch(closeModal())
        toast.error(response.message, toastconfig)
      }
      queryClient.invalidateQueries(['allOrders'])
    } catch (error) {
      console.error('Error receiving order:', error)
      toast.error('Something went wrong', toastconfig)
    }
  }

  useEffect(() => {
    if (data) {
      const selectedOrder = data.data.find(
        (order) => order.orderId === selectedOrderId,
      )
      setOrderInfo(selectedOrder)
    }
  }, [data, selectedOrderId])

  const viewInfo = (orderId) => {
    setSelectedOrderId(orderId)
    dispatch(openModal('viewInfoModal'))
  }

  const viewInvoice = (invoiceUrl) => {
    setInvoiceUrl(invoiceUrl)
    dispatch(openModal('viewInvoiceModal'))
  }

  const [orderForm, setOrderForm] = useState({
    branchId: 1,
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

  const { data: getSuppliesByDepartment } = useQuery({
    queryKey: ['getSuppliesByDepartment', orderForm?.departmentId],
    queryFn: () =>
      getAllSuppliesByDepartmentId(
        userDetails?.accessToken,
        orderForm?.departmentId,
      ),
    enabled: !!orderForm?.departmentId,
  })

  const createOrderMutation = useMutation({
    mutationFn: async (newOrder) => {
      const res = await createNewOrder(userDetails?.accessToken, newOrder)
      if (res?.status === 200) {
        toast.success(res?.message, toastconfig)
        setOrderForm({
          branchId: 1,
          orderDate: dayjs().format('YYYY-MM-DD'),
          departmentId: '',
          vendorId: '',
        })
        setSupplyQuant([])
        setSupply([])
        dispatch(closeModal())

        console.log('res', res.message)
      } else {
        dispatch(closeModal())
        toast.error(res.message, toastconfig)
      }
      queryClient.invalidateQueries(['allOrders'])
    },
    // onSuccess: () => {
    //   queryClient.invalidateQueries(['allOrders'])
    // },
  })

  const placeOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await placeOrder(userDetails?.accessToken, payload)
      if (res?.status === 200) {
        dispatch(closeModal())
        toast.success('Order placed successfully', toastconfig)
      } else {
        dispatch(closeModal())
        toast.error(res.message, toastconfig)
      }
      queryClient.invalidateQueries(['allOrders'])
    },
  })

  const payOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await payOrder(userDetails?.accessToken, payload)
      if (res?.status === 200) {
        dispatch(closeModal())
        toast.success('Order Paid successfully')
      } else {
        dispatch(closeModal())
        toast.error(res.message, toastconfig)
      }
      queryClient.invalidateQueries(['allOrders'])
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setOrderForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'departmentId') {
      setSupplyQuant([])
      setSupply([])
    }
  }

  const handleCreateOrder = () => {
    const updatedPayloadForCreate = { ...orderForm, supplyItems: supplyQuant }
    if (supplyQuant.length === 0) {
      alert('Please select atleast one supply item and quantity.')
    } else {
      const hasError = supplyQuant.some(
        (item) =>
          item.quantity === null || isNaN(item.quantity) || item.quantity === 0,
      )

      if (hasError) {
        alert('Please enter a valid quantity for all selected supplies.')
      } else {
        createOrderMutation.mutate(updatedPayloadForCreate)
      }
    }
  }

  const handlePlaceOrder = () => {
    placeOrderMutation.mutate({ orderId: selectedOrderId, expectedArrivalDate })
  }

  const handlePayOrder = (payload) => {
    payOrderMutation.mutate(payload)
  }

  // const ITEM_HEIGHT = 48
  // const ITEM_PADDING_TOP = 8
  // const MenuProps = {
  //   PaperProps: {
  //     style: {
  //       maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
  //       width: 250,
  //     },
  //   },
  // }
  const supplies = dropdowns?.suppliesList || []

  const handleSupplyChange = (event) => {
    const { value } = event.target
    const selectedSupplies =
      typeof value === 'string' ? value.split(',') : value

    setSupply(selectedSupplies)

    setSupplyQuant((prev) => {
      // Keep only selected items
      const updatedSupplyQuant = prev.filter((item) =>
        selectedSupplies.includes(
          supplies.find((s) => s.id === item.supplyItemId)?.name,
        ),
      )

      // Add new selections while preserving previous quantities
      selectedSupplies.forEach((selectedItem) => {
        const existingItem = updatedSupplyQuant.find(
          (item) =>
            item.supplyItemId ===
            supplies.find((s) => s.name === selectedItem)?.id,
        )

        if (!existingItem) {
          updatedSupplyQuant.push({
            supplyItemId: supplies.find((s) => s.name === selectedItem)?.id,
            quantity: null,
          })
        }
      })

      return updatedSupplyQuant
    })
  }

  const handleQuantity = (event, supplyItemId) => {
    const { value } = event.target

    setSupplyQuant((prev) =>
      prev.map((item) =>
        item.supplyItemId === supplyItemId
          ? { ...item, quantity: Number(value) }
          : item,
      ),
    )
  }

  const ViewInfoData = ({ orderInfo }) => (
    <div className="px-2 space-y-4 w-full">
      <div className="flex justify-end">
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>
      {orderInfo ? (
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-bold">Branch</span>
            <span>{orderInfo.branch}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Order Date</span>
            <span>{dayjs(orderInfo.orderDate).format('DD-MM-YYYY')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Department</span>
            <span>{orderInfo.department.departmentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Vendor</span>
            <span>{orderInfo.vendor.vendorName}</span>
          </div>
          <div className="space-y-2">
            <span className="font-bold">Supply Items</span>
            {orderInfo.supplyItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between p-2 border rounded-lg bg-gray-50 w-full"
              >
                <span>{item.supplyItemName}</span>
                <span>{item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Expected Arrival Date</span>
            <span>
              {orderInfo?.expectedArrivalDate
                ? dayjs(orderInfo?.expectedArrivalDate).format('DD-MM-YYYY')
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Received Date</span>
            <span>
              {orderInfo?.receivedDate
                ? dayjs(orderInfo.receivedDate).format('DD-MM-YYYY')
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Order Status</span>
            <span>{orderInfo.orderStatus}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Payment Amount</span>
            <span>
              {orderInfo?.paymentAmount ? orderInfo?.paymentAmount : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Payment Date</span>
            <span>
              {orderInfo?.paymentDate
                ? dayjs(orderInfo.paymentDate).format('DD-MM-YYYY')
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Created By</span>
            <span>{orderInfo.createdBy.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Created At</span>
            <span>
              {orderInfo?.createdAt
                ? dayjs(orderInfo.createdAt).format('DD-MM-YYYY')
                : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Invoice</span>
            <a
              href={orderInfo.invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              {orderInfo.invoiceUrl ? 'View Invoice' : 'No Invoice Yet'}
            </a>
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  )

  const customFilters = [
    {
      field: 'branch',
      label: 'Branch',
      type: 'select',
      options: data?.data
        ? [...new Set(data.data.map((row) => row.branch))]
        : [],
    },
    {
      field: 'department.departmentName',
      label: 'Department',
      type: 'select',
      options: data?.data
        ? [...new Set(data.data.map((row) => row.department.departmentName))]
        : [],
    },
    {
      field: 'orderStatus',
      label: 'Status',
      type: 'select',
      options: data?.data
        ? [...new Set(data.data.map((row) => row.orderStatus))]
        : [],
    },
  ]

  const getUniqueValues = (field) => {
    if (!data?.data) return []

    if (field === 'branch') {
      return [...new Set(data.data.map((row) => row.branch))]
    }

    if (field === 'department.departmentName') {
      return [...new Set(data.data.map((row) => row.department.departmentName))]
    }

    if (field === 'orderStatus') {
      return [...new Set(data.data.map((row) => row.orderStatus))]
    }

    return []
  }

  const filterData = (data, filters) => {
    if (!data) return []

    return data.filter((row) => {
      return Object.entries(filters).every(([field, filterValue]) => {
        // If no filter value is set or filter is null, include the row
        if (!filterValue || filterValue === null) return true

        const { prefix, value } = filterValue

        // If no value is set or empty array, include the row
        if (!value || (Array.isArray(value) && value.length === 0)) return true

        // Convert single value to array if needed
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
          case 'department.departmentName': {
            if (prefix === 'IN') {
              return selectedValues.includes(row.department.departmentName)
            } else if (prefix === 'NOT IN') {
              return !selectedValues.includes(row.department.departmentName)
            }
            return true
          }
          case 'orderStatus': {
            if (prefix === 'IN') {
              return selectedValues.includes(row.orderStatus)
            } else if (prefix === 'NOT IN') {
              return !selectedValues.includes(row.orderStatus)
            }
            return true
          }
          default:
            return true
        }
      })
    })
  }

  return (
    <div className="flex flex-col items-center w-full p-5">
      <div className="w-full flex justify-end mb-2 px-4">
        <Button
          variant="contained"
          className="capitalize text-white"
          color="primary"
          onClick={() => {
            dispatch(openModal('createNewOrder'))
            setOrderForm({
              branchId: 1,
              orderDate: dayjs().format('YYYY-MM-DD'),
              departmentId: '',
              vendorId: '',
            })
          }}
        >
          Create Order
        </Button>
      </div>
      {isError && <div>{error.message}</div>}
      <div style={{ height: '75vh', width: '100%' }}>
        <FilteredDataGrid
          rows={data?.data || []}
          getRowId={(row) => row.orderId}
          columns={columns}
          className="my-5 mx-2 py-3 bg-white"
          loading={isLoading}
          customFilters={customFilters}
          filterData={filterData}
          getUniqueValues={getUniqueValues}
          reportName="Orders_Report"
          reportType="orders"
          branchName="All_Branches"
          filters={{}}
          disableRowSelectionOnClick
          slots={{
            toolbar: ReportExportToolbar,
          }}
          slotProps={{
            toolbar: {
              data: data?.data || [],
              columns,
              reportName: 'Orders_Report',
              reportType: 'orders',
              branchName: 'All_Branches',
              filters: {},
            },
          }}
        />
      </div>
      <Modal uniqueKey="viewInfoModal" closeOnOutsideClick={true}>
        <ViewInfoData orderInfo={orderInfo} />
      </Modal>
      <Modal
        uniqueKey="createNewOrder"
        maxWidth={'sm'}
        closeOnOutsideClick={true}
      >
        <CreateOrderForm
          createOrderMutation={createOrderMutation}
          orderForm={orderForm}
          handleInputChange={handleInputChange}
          getVendorsByDepartment={getVendorsByDepartment}
          getSuppliesByDepartment={getSuppliesByDepartment}
          supply={supply}
          setSupply={setSupply}
          supplyQuant={supplyQuant}
          setSupplyQuant={setSupplyQuant}
          handleCreateOrder={handleCreateOrder}
          supplies={supplies}
          handleQuantity={handleQuantity}
          setOrderForm={setOrderForm}
        />
      </Modal>
      <Modal uniqueKey="placeOrderModal" closeOnOutsideClick={true}>
        <PlaceOrderForm
          placeOrderMutation={placeOrderMutation}
          expectedArrivalDate={expectedArrivalDate}
          setExpectedArrivalDate={setExpectedArrivalDate}
          handlePlaceOrder={handlePlaceOrder}
        />
      </Modal>
      <Modal uniqueKey="receiveOrderModal" closeOnOutsideClick={true}>
        <ReceiveOrderForm
          handleReceiveOrder={handleReceiveOrder}
          receivedDate={receivedDate}
          setReceivedDate={setReceivedDate}
          invoiceFile={invoiceFile}
          handleFileChange={handleFileChange}
        />
      </Modal>
      <Modal uniqueKey="payOrderModal" closeOnOutsideClick={true}>
        <PayOrderForm
          payOrderMutation={payOrderMutation}
          handlePayOrder={handlePayOrder}
          selectedOrderId={selectedOrderId}
        />
      </Modal>
      <Modal
        maxWidth="md"
        className="w-[20px]"
        uniqueKey="viewInvoiceModal"
        closeOnOutsideClick={true}
        onClose={() => setInvoiceUrl(null)}
      >
        {invoiceUrl && (
          <div className="w-[100%] h-[85vh]">
            <iframe
              src={invoiceUrl}
              className="w-full h-full zoom-out-iframe"
              title="Invoice Preview"
            ></iframe>
          </div>
        )}
      </Modal>
    </div>
  )
}
const CreateOrderForm = ({
  createOrderMutation,
  orderForm,
  handleInputChange,
  getVendorsByDepartment,
  getSuppliesByDepartment,
  supply,
  setSupply,
  supplyQuant,
  setSupplyQuant,
  handleCreateOrder,
  supplies,
  handleQuantity,
  setOrderForm,
}) => {
  const dropdowns = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()
  return (
    <div className="p-5 space-y-4 w-full">
      <h2 className="text-lg text-center font-bold">Create New Order</h2>
      <TextField
        select
        fullWidth
        label="Branch"
        name="branchId"
        value={orderForm.branchId}
        onChange={handleInputChange}
      >
        {dropdowns?.branches?.map((branch) => (
          <MenuItem key={branch.id} value={branch.id}>
            {branch.name}
          </MenuItem>
        ))}
      </TextField>
      {/* <LocalizationProvider dateAdapter={AdapterDayjs} className="w-full"> */}
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
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
      {/* </LocalizationProvider> */}
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
            vendorId: '', // Clear vendor when department changes
          }))
          setSupplyQuant([])
          setSupply([])
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
      <div>
        <Autocomplete
          multiple
          options={(getSuppliesByDepartment
            ? getSuppliesByDepartment?.data
            : []
          ).map((item) => item.name)}
          value={supply}
          onChange={(event, newValue) => {
            setSupply(newValue)
            setSupplyQuant((prev) => {
              const updatedSupplyQuant = prev.filter((item) =>
                newValue.includes(
                  supplies.find((s) => s.id === item.supplyItemId)?.name,
                ),
              )
              newValue.forEach((selectedItem) => {
                const existingItem = updatedSupplyQuant.find(
                  (item) =>
                    item.supplyItemId ===
                    supplies.find((s) => s.name === selectedItem)?.id,
                )
                if (!existingItem) {
                  updatedSupplyQuant.push({
                    supplyItemId: supplies.find((s) => s.name === selectedItem)
                      ?.id,
                    quantity: null,
                  })
                }
              })
              return updatedSupplyQuant
            })
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Supply Items"
              placeholder="Select supply Items"
            />
          )}
        />
        {supply?.length > 0 && (
          <div className="w-full border p-2 mt-2 flex flex-col items-center rounded bg-white gap-2 shadow-lg border-secondary">
            {supply?.map((item) => {
              const supplyItemId = supplies.find((s) => s.name === item)?.id
              const quantity =
                supplyQuant.find((q) => q.supplyItemId === supplyItemId)
                  ?.quantity || null
              console.log('supplyItemId', supplyItemId)
              return (
                <div
                  key={supplyItemId}
                  className="flex flex-row items-center gap-2 p-2 bg-white  rounded-lg w-full border-[#505357]"
                >
                  <p className="text-lg font-medium text-gray-700 w-[70%]">
                    {item}
                  </p>
                  <TextField
                    id={`quantity-${supplyItemId}`}
                    label="Quantity"
                    variant="outlined"
                    type="number"
                    value={quantity !== null ? quantity : ''}
                    onChange={(event) => handleQuantity(event, supplyItemId)}
                    onFocus={(event) => event.target.select()}
                    fullWidth
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          onClick={() => {
            dispatch(closeModal())
            setSupplyQuant([])
            setSupply([])
            setOrderForm({
              branchId: 1,
              orderDate: dayjs().format('YYYY-MM-DD'),
              departmentId: '',
              vendorId: '',
            })
          }}
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
  )
}

const PayOrderForm = ({
  handlePayOrder,
  payOrderMutation,
  selectedOrderId,
}) => {
  const dispatch = useDispatch()
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentDate, setPaymentDate] = useState(dayjs())
  return (
    <div className="p-5 space-y-4 w-full">
      <h2 className="text-lg text-center font-bold">Pay Order</h2>
      {/* <LocalizationProvider dateAdapter={AdapterDayjs} className="w-full"> */}
      <DatePicker
        className="w-full"
        label="Payment Date"
        value={paymentDate}
        format="DD-MM-YYYY"
        onChange={(newDate) => setPaymentDate(dayjs(newDate))}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
      {/* </LocalizationProvider> */}
      <TextField
        type="number"
        fullWidth
        label="Payment Amount"
        name="paymentAmount"
        value={paymentAmount.toString()}
        onChange={(e) => setPaymentAmount(e.target.value)}
      />
      <div className="flex justify-end space-x-2">
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
          onClick={() =>
            handlePayOrder({
              orderId: selectedOrderId,
              paymentAmount,
              paymentDate,
            })
          }
          disabled={payOrderMutation.isLoading}
        >
          {payOrderMutation.isLoading ? (
            <CircularProgress size={24} />
          ) : (
            'Pay Order'
          )}
        </Button>
      </div>
    </div>
  )
}

const ReceiveOrderForm = ({
  handleReceiveOrder,
  receivedDate,
  setReceivedDate,
  invoiceFile,
  handleFileChange,
}) => {
  const dispatch = useDispatch()
  return (
    <div className="p-5 space-y-4 justify-center items-center w-full flex-col">
      <h2 className="text-lg text-center font-bold">Receive Order</h2>
      {/* <LocalizationProvider dateAdapter={AdapterDayjs} className="w-full"> */}
      <DatePicker
        className="w-full"
        label="Received Date"
        value={receivedDate}
        format="DD-MM-YYYY"
        onChange={(newDate) => setReceivedDate(dayjs(newDate))}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
      {/* </LocalizationProvider> */}
      <div className="flex flex-col gap-2">
        <label htmlFor="invoiceFile">Upload Invoice</label>

        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf,image/*"
        />
        {invoiceFile && <p>Selected file: {invoiceFile.name}</p>}
      </div>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="contained"
          color="error"
          onClick={() => dispatch(closeModal())}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          className="capitalize text-white"
          color="primary"
          onClick={handleReceiveOrder}
        >
          Receive Order
        </Button>
      </Stack>
    </div>
  )
}

const PlaceOrderForm = ({
  placeOrderMutation,
  expectedArrivalDate,
  setExpectedArrivalDate,
  handlePlaceOrder,
}) => {
  const dispatch = useDispatch()
  return (
    <div className="p-5 space-y-4 w-full">
      <h2 className="text-lg text-center font-bold">Place Order</h2>
      {/* <LocalizationProvider dateAdapter={AdapterDayjs} className="w-full"> */}
      <DatePicker
        className="w-full"
        label="Expected Arrival Date"
        value={expectedArrivalDate}
        format="DD-MM-YYYY"
        onChange={(newDate) => setExpectedArrivalDate(dayjs(newDate))}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
      {/* </LocalizationProvider> */}
      <div className="flex justify-end space-x-2">
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
          onClick={handlePlaceOrder}
          disabled={placeOrderMutation.isLoading}
        >
          {placeOrderMutation.isLoading ? (
            <CircularProgress size={24} />
          ) : (
            'Place Order'
          )}
        </Button>
      </div>
    </div>
  )
}
export default OrdersPage
