import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography, Alert, CircularProgress, Button } from '@mui/material'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import {
  getAllPatients,
  getIndentList,
  getPharmacyMasterData,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import AddIndentForm from '@/components/Indent/AddIndentForm'
import { debounce } from 'lodash'
import { API_ROUTES } from '@/constants/constants'

const IndentPage = () => {
  const user = useSelector(store => store.user)
  const dispatch = useDispatch()
  const [searchText, setSearchText] = useState('')
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [patientSuggestions, setPatientSuggestions] = useState([])

  const {
    data: pharmacyItems,
    isLoading: isLoadingPharmacyItems,
    isError: isErrorPharmacyItems,
  } = useQuery({
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

  // Debounced function to fetch patient suggestions
  const debouncedGetPatientSuggestions = debounce(async searchText => {
    try {
      setIsLoadingPatients(true)
      const response = await getAllPatients(user?.accessToken, searchText)
      setPatientSuggestions(response.data || [])
    } catch (error) {
      console.error('Error fetching patient suggestions:', error)
    } finally {
      setIsLoadingPatients(false)
    }
  }, 300)
  const { data: indentData, isLoading, error } = useQuery({
    queryKey: ['indentList'],
    queryFn: async () => {
      const response = await getIndentList(user?.accessToken)
      if (response.status === 200) {
        return response.data
      } else {
        toast.error(response.message, toastconfig)
        throw new Error(response.message)
      }
    },
  })

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'indentId',
      headerName: 'Indent ID',
      width: 120,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      width: 180,
      flex: 1,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'itemName',
      headerName: 'Item Name',
      width: 200,
      flex: 1.2,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'prescribedQuantity',
      headerName: 'Prescribed Qty',
      width: 150,
      type: 'number',
      flex: 0.7,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'prescribedOn',
      headerName: 'Prescribed On',
      width: 150,
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      renderCell: params => {
        return params.row.prescribedOn
          ? dayjs(params.row.prescribedOn).format('DD/MM/YYYY')
          : ''
      },
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 150,
      flex: 0.7,
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      width: 180,
      align: 'center',
      headerAlign: 'center',
      valueFormatter: params => {
        return params.value
          ? dayjs(params.value).format('DD/MM/YYYY HH:mm')
          : ''
      },
    },
  ]

  // Define custom filters
  const customFilters = [
    {
      field: 'itemName',
      label: 'Item Name',
      type: 'text',
    },
    {
      field: 'patientName',
      label: 'Patient Name',
      type: 'text',
    },
    {
      field: 'createdBy',
      label: 'Created By',
      type: 'text',
    },
    {
      field: 'prescribedQuantity',
      label: 'Prescribed Quantity',
      type: 'number',
    },
    {
      field: 'prescribedOn',
      label: 'Prescribed On',
      type: 'date',
    },
  ]

  // Get unique values for select filters
  const getUniqueValues = field => {
    if (!indentData?.length) return []

    switch (field) {
      case 'itemName':
        return [...new Set(indentData.map(row => row.itemName))]
          .filter(Boolean)
          .map(value => ({
            value: value,
            label: value,
          }))
      case 'patientName':
        return [...new Set(indentData.map(row => row.patientName))]
          .filter(Boolean)
          .map(value => ({
            value: value,
            label: value,
          }))
      case 'createdBy':
        return [...new Set(indentData.map(row => row.createdBy))]
          .filter(Boolean)
          .map(value => ({
            value: value,
            label: value,
          }))
      case 'prescribedOn':
        return [...new Set(indentData.map(row => row.prescribedOn))]
          .filter(Boolean)
          .map(value => ({
            value: value,
            label: dayjs(value).format('DD/MM/YYYY'),
          }))
      default:
        return []
    }
  }

  // Filter data based on applied filters
  const filterData = (data, filters) => {
    if (!data) return []

    return data.filter(row => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue || filterValue === null) return true

        const { prefix, value } = filterValue
        if (!value || (Array.isArray(value) && value.length === 0)) return true

        const selectedValues = Array.isArray(value) ? value : [value]

        switch (field) {
          case 'itemName': {
            const itemName = row.itemName
            if (!itemName) return false
            if (prefix === 'LIKE') {
              return itemName.toLowerCase().includes(value.toLowerCase())
            }
            return prefix === 'NOT LIKE'
              ? !itemName.toLowerCase().includes(value.toLowerCase())
              : true
          }
          case 'patientName': {
            const patientName = row.patientName
            if (!patientName) return false
            if (prefix === 'LIKE') {
              return patientName.toLowerCase().includes(value.toLowerCase())
            }
            return prefix === 'NOT LIKE'
              ? !patientName.toLowerCase().includes(value.toLowerCase())
              : true
          }
          case 'createdBy': {
            const createdBy = row.createdBy
            if (!createdBy) return false
            if (prefix === 'LIKE') {
              return createdBy.toLowerCase().includes(value.toLowerCase())
            }
            return prefix === 'NOT LIKE'
              ? !createdBy.toLowerCase().includes(value.toLowerCase())
              : true
          }
          case 'prescribedQuantity': {
            const quantity = Number(row.prescribedQuantity)
            const filterValue = Number(value)

            if (isNaN(quantity) || isNaN(filterValue)) return true

            switch (prefix) {
              case 'LESS_THAN':
                return quantity < filterValue
              case 'GREATER_THAN':
                return quantity > filterValue
              case 'EQUAL_TO':
                return quantity === filterValue
              default:
                return true
            }
          }
          case 'prescribedOn': {
            if (!filterValue.start && !filterValue.end) return true

            const rowDate = dayjs(row.prescribedOn)
            if (!rowDate.isValid()) return false

            if (
              filterValue.start &&
              rowDate.isBefore(dayjs(filterValue.start).startOf('day'))
            ) {
              return false
            }
            if (
              filterValue.end &&
              rowDate.isAfter(dayjs(filterValue.end).endOf('day'))
            ) {
              return false
            }
            return true
          }
          default:
            return true
        }
      })
    })
  }

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      <div className="flex justify-end">
        <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            dispatch(openModal('addIndent'))
          }}
        >
          Add New Indent
        </Button>
      </div>
      <Modal
        uniqueKey={'addIndent'}
        onClose={() => {
          dispatch(closeModal())
        }}
      >
        <AddIndentForm
          isLoadingPatients={isLoadingPatients}
          patientSuggestions={patientSuggestions}
          debouncedGetPatientSuggestions={debouncedGetPatientSuggestions}
          pharmacyItems={pharmacyItems}
          isLoadingPharmacyItems={isLoadingPharmacyItems}
        />
      </Modal>
      <Box mt={3}>
        {console.log('Total records being passed to grid:', indentData?.length)}
        <FilteredDataGrid
          rows={indentData}
          columns={columns}
          customFilters={customFilters}
          filterData={filterData}
          getUniqueValues={getUniqueValues}
          pageSize={Math.max(20, indentData?.length || 10)}
          rowsPerPageOptions={[10, 20, 30, 50]}
          className="h-[calc(100vh-200px)]"
          disableSelectionOnClick
          getRowId={row => row.id}
          initialState={{
            pagination: {
              pageSize: 20,
            },
            columns: {
              columnVisibilityModel: {
                updatedAt: false,
                id: false,
                indentId: false,
                createdAt: false,
              },
            },
          }}
        />
      </Box>
    </Box>
  )
}

export default IndentPage
