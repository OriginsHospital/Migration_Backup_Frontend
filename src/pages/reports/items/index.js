import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material'
import {
  getPharmacyMasterData,
  getItemPurchaseHistoryReport,
} from '@/constants/apis'
import { API_ROUTES } from '@/constants/constants'
import CustomToolbar from '@/components/CustomToolbar'
import Breadcrumb from '@/components/Breadcrumb'
import Modal from '@/components/Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Close } from '@mui/icons-material'
import FilteredDataGrid from '@/components/FilteredDataGrid'

const ItemsReport = () => {
  const user = useSelector(store => store.user)
  const [selectedItem, setSelectedItem] = useState(null)
  const [filterModel, setFilterModel] = useState({
    items: [],
    quickFilterValues: [],
  })
  const dispatch = useDispatch()

  // Fetch pharmacy items
  const { data: pharmacyItems } = useQuery({
    queryKey: ['pharmacyItems'],
    queryFn: async () => {
      const response = await getPharmacyMasterData(
        user.accessToken,
        API_ROUTES.GET_ALL_PHARMACY_ITEMS,
      )
      if (response.status === 200) {
        return response.data
      }
      throw new Error('Failed to fetch pharmacy items')
    },
  })

  // Fetch item purchase history when an item is selected
  const { data: purchaseHistory, isLoading } = useQuery({
    queryKey: ['itemPurchaseHistory', selectedItem?.id],
    enabled: !!selectedItem?.id,
    queryFn: async () => {
      const response = await getItemPurchaseHistoryReport(
        user.accessToken,
        selectedItem?.id,
      )
      if (response.status === 200) {
        return response.data
      }
      throw new Error('Failed to fetch purchase history')
    },
  })

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'itemName', headerName: 'Item Name', width: 300 },
    // {
    //     field: 'inventoryType',
    //     headerName: 'Inventory Type',
    //     width: 150,
    //     valueGetter: (params) => params.row.inventoryType?.name
    // },
    // {
    //     field: 'manufacturerName',
    //     headerName: 'Manufacturer',
    //     width: 150,
    //     valueGetter: (params) => params.row.manufacturer?.manufacturer
    // },
    // { field: 'hsnCode', headerName: 'HSN Code', width: 130 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: params => (
        <Button
          variant="outlined"
          size="small"
          // className='bg-primary text-white'
          onClick={() => {
            console.log(params.row)
            dispatch(openModal(params.row.id))
            setSelectedItem(params.row)
          }}
        >
          View
        </Button>
      ),
    },
  ]

  const purchaseHistoryColumns = [
    { field: 'orderId', headerName: 'Order ID', width: 150 },
    { field: 'orderDate', headerName: 'Order Date', width: 150 },
    // { field: 'itemName', headerName: 'Item Name', width: 200 },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      width: 200,
      renderCell: params => (
        <div className="flex flex-col">
          {/* patient name , patietnid*/}
          <span>{params.row.patientName}</span>
          <span>{params.row.patientId}</span>
        </div>
      ),
    },
    { field: 'purchaseQuantity', headerName: 'Purchase Quantity', width: 150 },
    {
      field: 'prescribedBy',
      headerName: 'Prescribed By',
      width: 150,
      renderCell: params => <Chip label={params.row.prescribedBy} />,
    },
    {
      field: 'paymentMode',
      headerName: 'Payment Mode',
      width: 150,
      renderCell: params => <Chip label={params.row.paymentMode} />,
    },
  ]

  // Custom filters configuration
  const customFilters = [
    {
      field: 'itemName',
      label: 'Item Name',
      type: 'text',
    },
    // {
    //   field: 'inventoryType',
    //   label: 'Inventory Type',
    //   type: 'select',
    //   options: [
    //     { value: 'CONSUMABLE', label: 'Consumable' },
    //     { value: 'NON_CONSUMABLE', label: 'Non-Consumable' }
    //   ]
    // }
  ]

  // Filter the data based on filterModel
  const getFilteredRows = rows => {
    if (!rows) return []

    return rows.filter(row => {
      return filterModel.items.every(filter => {
        const value = row[filter.field]
        const filterValue = filter.value

        if (!value || !filterValue) return true

        switch (filter.field) {
          case 'itemName':
            return value.toLowerCase().includes(filterValue.toLowerCase())
          // case 'inventoryType':
          //   return value === filterValue
          default:
            return true
        }
      })
    })
  }

  // Filter data based on applied filters
  const filterData = (data, filters) => {
    // console.log('filter', filters)
    if (!data) return []
    return data.filter(row => {
      return Object.entries(filters).every(([field, filter]) => {
        if (!filter || !filter.value) return true

        const fieldPath = field.split('.')
        let value = row
        for (const path of fieldPath) {
          value = value?.[path]
        }
        // console.log('value', value)
        if (!value) return false

        switch (filter.prefix) {
          case 'LIKE':
            return value.toLowerCase().includes(filter.value.toLowerCase())
          case 'NOT LIKE':
            return !value.toLowerCase().includes(filter.value.toLowerCase())
          case 'LESS_THAN':
            return value < filter.value
          case 'GREATER_THAN':
            return value > filter.value
          case 'EQUAL_TO':
            return value === filter.value
          case 'NOT_EQUAL_TO':
            return value !== filter.value
          case 'IN':
            return filter.value.includes(value)
          case 'NOT IN':
            return !filter.value.includes(value)
          default:
            return true
        }
      })
    })
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Breadcrumb />
      </div>

      <FilteredDataGrid
        rows={getFilteredRows(pharmacyItems) || []}
        columns={columns}
        // pageSize={10}
        // filterModel={filterModel}
        // onFilterModelChange={setFilterModel}
        className="my-5 mx-2 py-3 bg-white h-[calc(100vh-200px)] overflow-y-auto"
        loading={isLoading}
        customFilters={customFilters}
        filterData={filterData}
        // getUniqueValues={getUniqueValues}
        disableRowSelectionOnClick
        // autoHeight
        // height={600}
        // className=" overflow-y-auto"
      />
      <Modal
        // title={'Item Details'}
        uniqueKey={selectedItem?.id}
        closeOnOutsideClick={true}
        maxWidth={'md'}
      >
        <div>
          <div className="flex justify-end items-center">
            <IconButton onClick={() => dispatch(closeModal())}>
              <Close />
            </IconButton>
          </div>
          <Box sx={{}}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
              Purchase History - {selectedItem?.itemName}
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : purchaseHistory?.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  No purchase history available for this item
                </Typography>
              </Box>
            ) : (
              <FilteredDataGrid
                rows={purchaseHistory || []}
                columns={purchaseHistoryColumns}
                pageSize={10}
                getRowId={row => row.orderId}
                customFilters={[
                  {
                    field: 'purchaseQuantity',
                    label: 'PurchaseQuantity',
                    type: 'number',
                  },
                  {
                    field: 'paymentMode',
                    label: 'Payment Mode',
                    type: 'select',
                    options: [
                      { value: 'CASH', label: 'Cash' },
                      { value: 'ONLINE', label: 'Online' },
                      { value: 'UPI', label: 'UPI' },
                    ],
                  },
                ]}
                filterData={filterData}
                className="h-[60vh] overflow-y-auto"
              />
            )}
          </Box>
        </div>
      </Modal>
    </div>
  )
}

export default ItemsReport
