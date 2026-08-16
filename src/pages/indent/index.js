import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import {
  getActiveIP,
  getIndentList,
  getIndentPharmacyItems,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import AddIndentForm from '@/components/Indent/AddIndentForm'

const IndentPage = () => {
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const branches = user?.branchDetails || []
  const [selectedBranch, setSelectedBranch] = useState('')

  useEffect(() => {
    if (!branches?.length) return
    if (!selectedBranch) {
      setSelectedBranch(branches[0].id)
    }
  }, [branches, selectedBranch])

  const { data: pharmacyItems, isLoading: isLoadingPharmacyItems } = useQuery({
    queryKey: ['indentPharmacyItems', selectedBranch],
    queryFn: async () => {
      const response = await getIndentPharmacyItems(
        user.accessToken,
        selectedBranch,
      )
      if (response.status === 200) {
        return response.data
      }
      throw new Error(response.message || 'Failed to fetch pharmacy items')
    },
    enabled: Boolean(user?.accessToken && selectedBranch),
  })

  const { data: activeIPData } = useQuery({
    queryKey: ['activeIP', selectedBranch],
    queryFn: () => getActiveIP(user.accessToken, selectedBranch),
    enabled: Boolean(user?.accessToken && selectedBranch),
  })

  const ipPatients = (activeIPData?.data || []).map((row) => ({
    id: row.patientId,
    Name: row.patientName || row.Name || '-',
    patientId: row.patientDisplayId,
    roomCode: row.roomCode,
    ipId: row.id,
    ipStatus: 'Admitted',
  }))

  const {
    data: indentData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['indentList', selectedBranch],
    queryFn: async () => {
      const response = await getIndentList(user?.accessToken, selectedBranch)
      if (response.status === 200) {
        return response.data
      }
      toast.error(response.message, toastconfig)
      throw new Error(response.message)
    },
    enabled: Boolean(user?.accessToken && selectedBranch),
  })

  const selectedBranchLabel =
    branches.find((branch) => String(branch.id) === String(selectedBranch))
      ?.branchCode ||
    branches.find((branch) => String(branch.id) === String(selectedBranch))
      ?.name ||
    ''

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
      field: 'roomCode',
      headerName: 'Room / Bed',
      width: 130,
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
      renderCell: (params) => {
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
      valueFormatter: (params) => {
        return params.value
          ? dayjs(params.value).format('DD/MM/YYYY HH:mm')
          : ''
      },
    },
  ]

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

  const getUniqueValues = (field) => {
    if (!indentData?.length) return []

    switch (field) {
      case 'itemName':
        return [...new Set(indentData.map((row) => row.itemName))]
          .filter(Boolean)
          .map((value) => ({
            value: value,
            label: value,
          }))
      case 'patientName':
        return [...new Set(indentData.map((row) => row.patientName))]
          .filter(Boolean)
          .map((value) => ({
            value: value,
            label: value,
          }))
      case 'createdBy':
        return [...new Set(indentData.map((row) => row.createdBy))]
          .filter(Boolean)
          .map((value) => ({
            value: value,
            label: value,
          }))
      case 'prescribedOn':
        return [...new Set(indentData.map((row) => row.prescribedOn))]
          .filter(Boolean)
          .map((value) => ({
            value: value,
            label: dayjs(value).format('DD/MM/YYYY'),
          }))
      default:
        return []
    }
  }

  const filterData = (data, filters) => {
    if (!data) return []

    return data.filter((row) => {
      return Object.entries(filters).every(([field, filterValue]) => {
        if (!filterValue || filterValue === null) return true

        const { prefix, value } = filterValue
        if (!value || (Array.isArray(value) && value.length === 0)) return true

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
            const filterQty = Number(value)

            if (isNaN(quantity) || isNaN(filterQty)) return true

            switch (prefix) {
              case 'LESS_THAN':
                return quantity < filterQty
              case 'GREATER_THAN':
                return quantity > filterQty
              case 'EQUAL_TO':
                return quantity === filterQty
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

  const isAdmin = Number(user?.roleDetails?.id) === 1

  if (!selectedBranch || isLoading) {
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
        <Alert severity="error">{error.message || String(error)}</Alert>
      </Box>
    )
  }

  return (
    <Box p={3}>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">IP Indent</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Branch</InputLabel>
            <Select
              value={selectedBranch}
              onChange={(event) => setSelectedBranch(event.target.value)}
              label="Branch"
              disabled={!isAdmin && branches.length <= 1}
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.branchCode || branch.name || branch.branchName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              dispatch(openModal('addIndent'))
            }}
            disabled={!selectedBranch}
          >
            Add New Indent
          </Button>
        </div>
      </div>
      <Modal
        uniqueKey={'addIndent'}
        onClose={() => {
          dispatch(closeModal())
        }}
      >
        <AddIndentForm
          key={selectedBranch}
          branchId={selectedBranch}
          branchLabel={selectedBranchLabel}
          ipPatients={ipPatients}
          pharmacyItems={pharmacyItems}
          isLoadingPharmacyItems={isLoadingPharmacyItems}
        />
      </Modal>
      <Box mt={3}>
        <FilteredDataGrid
          rows={indentData || []}
          columns={columns}
          customFilters={customFilters}
          filterData={filterData}
          getUniqueValues={getUniqueValues}
          pageSize={Math.max(20, indentData?.length || 10)}
          rowsPerPageOptions={[10, 20, 30, 50]}
          className="h-[calc(100vh-200px)]"
          disableSelectionOnClick
          getRowId={(row) => row.id}
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
