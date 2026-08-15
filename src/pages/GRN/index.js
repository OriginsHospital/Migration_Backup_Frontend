import GrnComponent from '@/components/GrnComponent'
// import PharmacyMasterTable from '@/components/PharmacyMasterTable'
import {
  getAllGrnData,
  getGrnDataById,
  getGRNReturnedHistory,
  getPharmacyMasterData,
  grnSalesReport,
  saveGrnReturn,
} from '@/constants/apis'
import { API_ROUTES } from '@/constants/constants'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Autocomplete,
  Button,
  Checkbox,
  Divider,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import dayjs from 'dayjs'
import { DataGrid } from '@mui/x-data-grid'
import { closeModal, openModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import DataDisplay from '@/components/DataDisplay'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { grnStockReport } from '@/constants/apis'
import StockReport from '../reports/stockReport'
import {
  createGrnBranchTransfer,
  getGrnBranchTransferHistory,
  getGrnBranchTransferPreview,
} from '@/constants/apis'
const createEmptyItem = () => ({
  itemId: '',
  itemName: '',
  batchNo: '',
  expiryDate: '',
  pack: 0,
  quantity: 0,
  freeQuantity: 0,
  mrp: 0,
  rate: 0,
  mrpPerTablet: 0,
  ratePerTablet: 0,
  taxPercentage: 0,
  discountAmount: 0,
  discountPercentage: 0,
  taxAmount: 0,
  amount: 0,
})

const createEmptyPaymentDetails = () => ({
  subTotal: 0,
  overAllDiscountPercentage: 0,
  overAllDiscountAmount: 0,
  // taxAmount: 0,
  netAmount: 0,
  otherCharges: 0,
  freight: 0,
  cst: 0,
  excise: 0,
  cess: 0,
  creditNoteAmount: 0,
  netPayable: 0,
  remarks: '',
})
const createEmptyGrnDetail = () => ({
  // grnNo: '',
  date: dayjs(new Date()).format('YYYY-MM-DD'),
  supplierId: null,
  supplierName: '',
  supplierEmail: '',
  supplierAddress: '',
  supplierGstNumber: '',
  invoiceNumber: '',
})

const allGRNsTableColumns = [
  // ['id', 'grnNo', 'date', 'supplierName', 'supplierEmail', 'supplierAddress', 'supplierGstNumber', 'invoiceNumber']

  {
    field: 'grnNo',
    headerName: 'GRN No',
    width: 120,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 0.1,
  },
  {
    field: 'branchName',
    headerName: 'Branch',
    width: 120,
    minWidth: 75,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 0.1,
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 150,
    type: 'date',
    headerClassName: 'bg-primary text-secondary font-bold',

    valueFormatter: (value) => {
      if (value == null || value === '') return ''
      const d = dayjs(value)
      return d.isValid() ? d.format('DD-MM-YYYY') : ''
    },
    flex: 0.4,
  },
  {
    field: 'supplierName',
    headerName: 'Supplier Name',
    width: 300,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 1.2,
  },
  {
    field: 'supplierEmail',
    headerName: 'Supplier Email',
    width: 200,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 1,
    renderCell: (params) => {
      return params.row?.supplierEmail?.toLowerCase()
    },
  },
  {
    field: 'supplierAddress',
    headerName: 'Sp. Address',
    width: 150,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 0.5,
  },
  {
    field: 'supplierGstNumber',
    headerName: 'Supplier GST Number',
    width: 150,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 0.7,
  },
  {
    field: 'invoiceNumber',
    headerName: 'Invoice Number',
    width: 150,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 0.5,
  },
]
const GRNsReturnTable = [
  // ['id', 'grnNo', 'date', 'supplierName', 'supplierEmail', 'supplierAddress', 'supplierGstNumber', 'invoiceNumber']

  {
    field: 'grnNo',
    headerName: 'GRN No',
    width: 120,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 0.5,
  },
  {
    field: 'branchName',
    headerName: 'Branch',
    width: 80,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 0.5,
  },
  {
    field: 'returnedDate',
    headerName: 'Return Date',
    width: 150,
    type: 'date',
    headerClassName: 'bg-primary text-secondary font-bold',

    valueFormatter: (value) => {
      if (value == null || value === '') return ''
      const d = dayjs(value)
      return d.isValid() ? d.format('DD-MM-YYYY') : ''
    },
    flex: 0.5,
  },
  {
    field: 'supplierName',
    headerName: 'Supplier Name',
    width: 200,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 1,
  },
  {
    field: 'totalAmount',
    headerName: 'Total Amount',
    width: 200,
    headerClassName: 'bg-primary text-secondary font-bold',
    flex: 1,
  },
]
function Grn() {
  // const [suppliers,setSuppliers]=useState('');
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const [grnDetails, setGrnDetails] = useState(createEmptyGrnDetail())
  const dispatch = useDispatch()

  const [grnItemDetails, setGrnItemDetails] = useState([createEmptyItem()])

  const [grnPaymentDetails, setGrnPaymentDetails] = useState(
    createEmptyPaymentDetails(),
  )

  const [selectedRow, setSelectedRow] = useState()
  const [selectedRowReturn, setSelectedRowReturn] = useState()
  const suppliers = useQuery({
    queryKey: ['getSuppliersInGRN'],
    queryFn: async () => {
      // Simulating API call
      const responsejson = await getPharmacyMasterData(
        user.accessToken,
        API_ROUTES.GET_SUPPLIERS,
      )
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occured while fetching labtest field values')
      }
    },
  })
  const [selectedTab, setSelectedTab] = useState('addGRNs')
  const [branchTransferForm, setBranchTransferForm] = useState({
    grnId: '',
    itemId: null,
    quantity: '',
    destinationBranchId: null,
  })
  const { data: getAllGRNs } = useQuery({
    queryKey: ['getAllGRNs'],
    queryFn: async () => {
      // Simulating API getcall
      const responsejson = await getAllGrnData(user.accessToken)
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occured while fetching labtest field values')
      }
    },
  })
  const transferPreview = useQuery({
    queryKey: ['getGrnBranchTransferPreview', branchTransferForm.grnId],
    queryFn: async () => {
      const response = await getGrnBranchTransferPreview(
        user.accessToken,
        Number(branchTransferForm.grnId),
      )
      if (response.status === 200) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch transfer preview')
    },
    enabled: Boolean(branchTransferForm.grnId),
    retry: false,
  })
  const { data: branchTransferHistory = [] } = useQuery({
    queryKey: ['getGrnBranchTransferHistory'],
    queryFn: async () => {
      const response = await getGrnBranchTransferHistory(user.accessToken)
      if (response.status === 200) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch transfer history')
    },
  })
  const { data: getGRNById } = useQuery({
    queryKey: ['getGRNById', selectedRow],
    queryFn: async () => {
      // Simulating API getcall
      const responsejson = await getGrnDataById(
        user.accessToken,
        selectedRow?.id,
      )
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occured while fetching labtest field values')
      }
    },
    enabled: !!selectedRow?.id,
  })

  const handleRowEdit = (row) => {
    console.log('row clicked', row)
    dispatch(openModal('editModalInGRNTable'))
    setSelectedRow(row)
  }
  const queryClient = useQueryClient()
  const [selectedItems, setSelectedItems] = useState([])
  const handleCheckboxChange = (item) => {
    if (selectedItems.some((selected) => selected.itemId === item.itemId)) {
      setSelectedItems(
        selectedItems.filter((selected) => selected.itemId !== item.itemId),
      )
    } else {
      setSelectedItems([...selectedItems, item])
    }
  }
  const isReturnButtonEnabled = selectedItems?.length > 0

  // dispatch(openModal('editModalInPharmacyMasterData'))
  const grnDetailsKeys = [
    'grnNo',
    'date',
    'supplierId',
    'supplierEmail',
    'supplierAddress',
    'supplierGstNumber',
    'invoiceNumber',
  ]
  const grnItemKeys = [
    'itemId',
    // 'itemName',
    'batchNo',
    'expiryDate',
    'pack',
    'quantity',
    'freeQuantity',
    'initialQuantity',
    'totalQuantity',
    'mrp',
    'rate',
    'mrpPerTablet',
    'ratePerTablet',
    'taxPercentage',
    'discountAmount',
    'discountPercentage',
    'taxAmount',
    'amount',

    // 'isReturn'
  ]
  const grnPaymentDetailsKeys = [
    'subTotal',
    'overAllDiscountPercentage',
    'overAllDiscountAmount',
    'taxAmount',
    'netAmount',
    'otherCharges',
    'freight',
    'cst',
    'excise',
    'cess',
    'creditNoteAmount',
    'netPayable',
    'remarks',
  ]
  const grnReturnDetailsKeys = [
    'grnId',
    'grnNo',
    'returnedDate',
    'supplierId',
    'supplierName',
    'totalAmount',
  ]
  const handleReturn = async () => {
    const payload = {
      grnId: getGRNById?.grnDetails.id,
      supplierId: getGRNById?.grnDetails.supplierId,
      returnDetails: selectedItems.map((item) => ({
        itemId: item.itemId,
        batchNo: item.batchNo,
        itemName: item.itemName,
        totalQuantity: item.pack * item.quantity + item.freeQuantity,
        mrpPerTable: item.mrpPerTablet,
      })),
      totalAmount: selectedItems.reduce(
        (total, item) =>
          total +
          (item.pack * item.quantity + item.freeQuantity) * item.mrpPerTablet,
        0,
      ),
    }

    // onReturn(payload);
    console.log(payload)
    const response = await saveGrnReturn(user.accessToken, payload)
    console.log(response)

    if (response.status == 200) {
      toast.success(response.message, toastconfig)
      // handleModalClose()
      queryClient.invalidateQueries('getGRNById')
      setSelectedItems([])
    } else {
      toast.error(response.message, toastconfig)
    }
  }
  const handleModalClose = () => {
    dispatch(closeModal())
    setSelectedRow(null)
    setSelectedRowReturn(null)
    setSelectedItems([])
  }
  const branchOptions = useMemo(() => {
    const globalBranches = dropdowns?.branches || []
    if (globalBranches.length > 0) {
      return globalBranches
    }
    return user?.branchDetails || []
  }, [dropdowns, user])
  const destinationBranchOptions = useMemo(() => {
    const sourceBranchId = transferPreview?.data?.sourceBranchId
    return branchOptions.filter((branch) => branch.id !== sourceBranchId)
  }, [branchOptions, transferPreview?.data?.sourceBranchId])

  const transferHistoryColumns = [
    { field: 'sourceBranchCode', headerName: 'Source', width: 120 },
    { field: 'destinationBranchCode', headerName: 'Destination', width: 140 },
    {
      field: 'transferInvoiceNumber',
      headerName: 'Transfer Invoice',
      width: 200,
    },
    { field: 'itemName', headerName: 'Medicine', width: 220, flex: 1 },
    { field: 'transferredQuantity', headerName: 'Quantity', width: 120 },
    {
      field: 'transferDate',
      headerName: 'Transfer Date',
      width: 170,
      valueFormatter: (value) => {
        if (value == null || value === '') return ''
        const d = dayjs(value)
        return d.isValid() ? d.format('DD-MM-YYYY HH:mm') : ''
      },
    },
    { field: 'transferredByName', headerName: 'Transferred By', width: 180 },
  ]

  const handleBranchTransferSubmit = async () => {
    if (
      !branchTransferForm.grnId ||
      !branchTransferForm.itemId ||
      !branchTransferForm.quantity ||
      !branchTransferForm.destinationBranchId
    ) {
      toast.error(
        'Please fill GRN ID, medicine, quantity, and destination branch.',
        toastconfig,
      )
      return
    }
    const payload = {
      grnId: Number(branchTransferForm.grnId),
      itemId: Number(branchTransferForm.itemId),
      quantity: Number(branchTransferForm.quantity),
      destinationBranchId: Number(branchTransferForm.destinationBranchId),
    }
    const response = await createGrnBranchTransfer(user.accessToken, payload)
    if (response.status === 200) {
      toast.success(
        `Transfer complete. Invoice: ${response?.data?.transferInvoiceNumber || ''}`,
        toastconfig,
      )
      queryClient.invalidateQueries(['getGrnBranchTransferHistory'])
      queryClient.invalidateQueries(['getAllGRNs'])
      queryClient.invalidateQueries(['getGrnBranchTransferPreview'])
      setBranchTransferForm({
        grnId: '',
        itemId: null,
        quantity: '',
        destinationBranchId: null,
      })
    } else {
      toast.error(response.message || 'Failed to transfer stock', toastconfig)
    }
  }
  // getGRNReturnedHistory
  // useQuery
  const { data: getGRNReturnedHistoryData } = useQuery({
    queryKey: ['getGRNReturnedHistory'],
    queryFn: async () => {
      // Simulating API getcall
      const responsejson = await getGRNReturnedHistory(user.accessToken)
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occured while fetching labtest field values')
      }
    },
  })
  const handleRowEditReturnedGRN = (row) => {
    dispatch(openModal('editModalInReturnedGRNTable'))
    //write code here
    console.log(row)
    setSelectedRowReturn(row.row)
  }
  //GRN_SALES_REPORT
  const { data: getGRNSalesReportData } = useQuery({
    queryKey: ['getGRNSalesReport'],
    queryFn: async () => {
      // Simulating API getcall
      const responsejson = await grnSalesReport(user.accessToken)
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occured while fetching labtest field values')
      }
    },
  })
  // "supplier": "Bhavani Medical Agencies",
  // "grnNo": "A54874582",
  // "invoiceId": "2024090115050820",
  // "invoiceDate": "2024-08-30",
  // "amount": "2008.27"
  const grnSalesColumns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 70,
    },
    {
      field: 'supplier',
      headerName: 'Supplier',
      width: 200,
    },
    {
      field: 'grnNo',
      headerName: 'GRN No',
      width: 150,
    },
    {
      field: 'invoiceId',
      headerName: 'Invoice ID',
      width: 150,
    },
    {
      field: 'invoiceDate',
      headerName: 'Invoice Date',
      width: 150,
      // type: 'date',
      // formatString: 'dd/MM/yyyy',
    },
    {
      field: 'Tax12Gross',
      headerName: 'Tax 12% Gross',
      width: 150,
    },
    {
      field: 'Tax12Amount',
      headerName: 'Tax 12% Amount',
      width: 150,
    },
    {
      field: 'Tax5Gross',
      headerName: 'Tax 5% Gross',
      width: 150,
    },
    {
      field: 'Tax5Amount',
      headerName: 'Tax 5% Amount',
      width: 150,
    },
    {
      field: 'Tax18Gross',
      headerName: 'Tax 18% Gross',
      width: 150,
    },
    {
      field: 'Tax18Amount',
      headerName: 'Tax 18% Amount',
      width: 150,
    },
    {
      field: 'Tax28Gross',
      headerName: 'Tax 28% Gross',
      width: 150,
    },
    {
      field: 'Tax28Amount',
      headerName: 'Tax 28% Amount',
      width: 150,
    },
    {
      field: 'discount',
      headerName: 'Discount',
      width: 150,
    },
    {
      field: 'TotalGRN',
      headerName: 'Total GRN',
      width: 150,
      // valueFormatter: (params) => `$${params.value?.toFixed(2)}`,
      // footerValue: (rows) =>
      //     rows.reduce((acc, row) => acc + row.TotalGRN, 0).toFixed(2),
      // footerStyle: { fontWeight: 'bold' },
      // cellClassName: 'text-right',
      // headerClassName: 'bg-primary text-secondary font-bold',
      // headerFooterClassName: 'bg-primary text-secondary font-bold',
      // footerClassName: 'bg-primary text-secondary font-bold',
    },
  ]
  // useEffect(() => {
  //   console.log(getGRNSalesReportData)
  // }, [])

  return (
    <div>
      <TabContext value={selectedTab}>
        <TabList
          onChange={(event, newValue) => {
            setSelectedTab(newValue)
          }}
          orientation="horizontal"
        >
          <Tab value={`addGRNs`} label={`GRN`}></Tab>
          <Tab value={`allGRNs`} label={`All GRN's`}></Tab>
          <Tab value={`returnGRNs`} label={`Returned GRN's`}></Tab>
          <Tab value={`branchTransfer`} label={`Branch Transfer`}></Tab>
          <Tab value={`StockReport`} label={`GRN Stock Report`}></Tab>
        </TabList>
        <TabPanel value={`allGRNs`}>
          {/* <PharmacyMasterTable rows={getAllGRNs} fields={allGRNsTableColumns}
                        handleRowEdit={handleRowEdit}
                        selectedRow={selectedRow}
                        setSelectedRow={setSelectedRow}
                    /> */}
          <DataGrid
            rows={getAllGRNs}
            getRowId={(row) => row.grnId}
            columns={allGRNsTableColumns}
            onRowClick={handleRowEdit}
          />
          <Modal
            uniqueKey={'editModalInGRNTable'}
            closeOnOutsideClick={false}
            showCloseButton
            onOutsideClick={handleModalClose}
            maxWidth="md"
          >
            {/* {
                            getGRNById?.grnItemDetails?.map((eachItem, index) => {
                                return <div className='flex items-baseline' key={eachItem.itemName + index}>
                                    <span className='font-semibold'>{index + 1}.</span>
                                    <EachItemDetail key={eachItem.grnId} item={eachItem}></EachItemDetail>
                                </div>
                            })} */}
            <DataDisplay
              title={'GRN Details'}
              sectionData={getGRNById?.grnDetails || {}}
              keys={grnDetailsKeys}
            />
            <Divider className="my-5" />
            {getGRNById?.grnItemDetails?.map((eachItem, index) => {
              return (
                <div
                  key={eachItem?.itemId + 'item' + index}
                  className="flex items-center gap-5"
                >
                  {eachItem.isReturned !== 1 ? (
                    <Checkbox
                      checked={selectedItems.some(
                        (selected) => selected.itemId === eachItem.itemId,
                      )}
                      onChange={() => handleCheckboxChange(eachItem)}
                      // disabled={eachItem.isReturned === 1}

                      color={eachItem.isReturned === 1 ? 'error' : 'primary'}
                      indeterminate={eachItem.isReturned === 1}
                    />
                  ) : (
                    <Tooltip title={`Already Returned`}>
                      <Checkbox
                        checked={true} // disabled={eachItem.isReturned === 1}
                        color={eachItem.isReturned === 1 ? 'error' : 'primary'}
                        indeterminate={eachItem.isReturned === 1}
                      />
                    </Tooltip>
                  )}
                  <DataDisplay
                    title={'Item - ' + eachItem?.itemName}
                    sectionData={eachItem || {}}
                    keys={grnItemKeys}
                  />
                </div>
              )
            })}
            <Button
              variant="contained"
              color="primary"
              disabled={!isReturnButtonEnabled}
              onClick={handleReturn}
            >
              Return Selected Items
            </Button>
            <Divider className="my-5" />
            <DataDisplay
              title={'GRN Payment Details'}
              sectionData={getGRNById?.grnPaymentDetails || {}}
              keys={grnPaymentDetailsKeys}
            />
          </Modal>
        </TabPanel>
        <TabPanel value={`addGRNs`}>
          <GrnComponent
            suppliers={suppliers?.data}
            grnDetails={grnDetails}
            setGrnDetails={setGrnDetails}
            grnItemDetails={grnItemDetails}
            setGrnItemDetails={setGrnItemDetails}
            grnPaymentDetails={grnPaymentDetails}
            setGrnPaymentDetails={setGrnPaymentDetails}
            createEmptyGrnDetail={createEmptyGrnDetail}
            createEmptyPaymentDetails={createEmptyPaymentDetails}
            createEmptyItem={createEmptyItem}
          />
        </TabPanel>

        <TabPanel value={`returnGRNs`}>
          <DataGrid
            rows={getGRNReturnedHistoryData}
            getRowId={(row) => row.id}
            columns={GRNsReturnTable}
            onRowClick={handleRowEditReturnedGRN}
          />
          <Modal
            uniqueKey={'editModalInReturnedGRNTable'}
            closeOnOutsideClick={false}
            showCloseButton
            onOutsideClick={handleModalClose}
            maxWidth="md"
          >
            <DataDisplay
              title={'Returned GRN Details'}
              sectionData={selectedRowReturn || {}}
              keys={grnReturnDetailsKeys}
            />
            <Divider className="my-5" />
            {selectedRowReturn && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Batch No</TableCell>
                      <TableCell>Total Quantity</TableCell>
                      <TableCell>MRP Per Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRowReturn.returnDetails?.map((item) => (
                      <TableRow key={item.itemId}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.batchNo}</TableCell>
                        <TableCell>{item.totalQuantity}</TableCell>
                        <TableCell>{item.mrpPerTable}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Modal>
        </TabPanel>
        <TabPanel value={`StockReport`}>
          <StockReport breadcrumb={false} />
        </TabPanel>
        <TabPanel value={`branchTransfer`}>
          <div className="flex flex-col gap-4 p-2">
            <div className="flex flex-wrap gap-4 items-end">
              <TextField
                label="GRN ID"
                type="number"
                value={branchTransferForm.grnId}
                onChange={(event) =>
                  setBranchTransferForm((prev) => ({
                    ...prev,
                    grnId: event.target.value,
                    itemId: null,
                    quantity: '',
                  }))
                }
              />
              <Autocomplete
                className="min-w-64"
                options={transferPreview?.data?.items || []}
                getOptionLabel={(option) =>
                  `${option.itemName} (Available: ${option.availableQuantity})`
                }
                value={
                  (transferPreview?.data?.items || []).find(
                    (item) => item.itemId === branchTransferForm.itemId,
                  ) || null
                }
                onChange={(_, value) =>
                  setBranchTransferForm((prev) => ({
                    ...prev,
                    itemId: value?.itemId || null,
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Medicine Name"
                    helperText={
                      transferPreview.error
                        ? 'Enter a valid GRN ID from your branch.'
                        : ''
                    }
                  />
                )}
              />
              <TextField
                label="Quantity"
                type="number"
                value={branchTransferForm.quantity}
                onChange={(event) =>
                  setBranchTransferForm((prev) => ({
                    ...prev,
                    quantity: event.target.value,
                  }))
                }
              />
              <Autocomplete
                className="min-w-56"
                options={destinationBranchOptions}
                getOptionLabel={(option) =>
                  `${option.branchCode || option.name} - ${option.name}`
                }
                value={
                  destinationBranchOptions.find(
                    (branch) =>
                      branch.id === branchTransferForm.destinationBranchId,
                  ) || null
                }
                onChange={(_, value) =>
                  setBranchTransferForm((prev) => ({
                    ...prev,
                    destinationBranchId: value?.id || null,
                  }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Destination Branch" />
                )}
              />
              <Button
                variant="contained"
                onClick={handleBranchTransferSubmit}
                disabled={transferPreview.isFetching}
              >
                Confirm Transfer
              </Button>
            </div>
            {transferPreview?.data?.sourceBranchName && (
              <div className="text-sm text-secondary">
                Source Branch: {transferPreview?.data?.sourceBranchCode} -{' '}
                {transferPreview?.data?.sourceBranchName}
              </div>
            )}
            <Divider />
            <h3 className="text-lg font-semibold text-secondary">
              Transfer History
            </h3>
            <DataGrid
              rows={branchTransferHistory}
              getRowId={(row) => row.id}
              columns={transferHistoryColumns}
              autoHeight
            />
          </div>
        </TabPanel>
      </TabContext>
    </div>
  )
}

export default Grn

// function StockReport() {
//   // usequery to fetch the GRN_STOCK_REPORT
//   const userDetails = useSelector(store => store.user)

//   return (
//     <div className="m-5">
//       {/* <h1>{`Stock Data`}</h1> */}
//       <div className="mb-5">
//         <Breadcrumb />
//       </div>

//     </div>
//   )
// }

// export default StockReport
