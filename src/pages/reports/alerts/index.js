import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { Box, Button, TextField } from '@mui/material'
import {
  getAllAlerts,
  editAlert,
  deleteAlert,
  createAlert,
} from '@/constants/apis'
import Modal from '@/components/Modal'
import { openModal, closeModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import Breadcrumb from '@/components/Breadcrumb'

const initialFormState = {
  alertMessage: '',
}

function Alerts() {
  const userDetails = useSelector(state => state.user)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(initialFormState)
  const [editMode, setEditMode] = useState(false)

  // Query to fetch all alerts
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => await getAllAlerts(userDetails.accessToken),
    enabled: !!userDetails.accessToken,
  })

  // Mutation for adding new alert
  const addAlertMutation = useMutation({
    mutationFn: async data => {
      const response = await createAlert(userDetails?.accessToken, data)
      if (response.status === 200) {
        toast.success('Alert added successfully', toastconfig)
        dispatch(closeModal('addAlertModal'))
        setFormData(initialFormState)
        return response.data
      }
      throw new Error('Failed to add alert')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts'])
    },
  })

  // Mutation for editing alert
  const editAlertMutation = useMutation({
    mutationFn: async data => {
      const response = await editAlert(userDetails?.accessToken, data)
      if (response.status === 200) {
        toast.success('Alert updated successfully', toastconfig)
        dispatch(closeModal('addAlertModal'))
        setFormData(initialFormState)
        setEditMode(false)
        return response.data
      }
      throw new Error('Failed to update alert')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts'])
    },
  })

  // Mutation for deleting alert
  const deleteAlertMutation = useMutation({
    mutationFn: async alertId => {
      const response = await deleteAlert(userDetails?.accessToken, alertId)
      if (response.status === 200) {
        toast.success('Alert deleted successfully', toastconfig)
        return response.data
      }
      throw new Error('Failed to delete alert')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts'])
    },
  })

  const handleSubmit = e => {
    e.preventDefault()
    if (editMode) {
      editAlertMutation.mutate({
        alertId: formData.id,
        alertMessage: formData.alertMessage,
      })
    } else {
      addAlertMutation.mutate({
        alertMessage: formData.alertMessage,
      })
    }
  }

  const handleEdit = row => {
    setFormData(row)
    setEditMode(true)
    dispatch(openModal('addAlertModal'))
  }

  const handleDelete = alertId => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      deleteAlertMutation.mutate(alertId)
    }
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'alertMessage', headerName: 'Alert Message', width: 300 },
    // { field: 'createdBy', headerName: 'Created By', width: 130 },
    // {
    //     field: 'createdAt',
    //     headerName: 'Created At',
    //     width: 180,
    //     valueGetter: params => new Date(params.row.createdAt).toLocaleString(),
    // },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      renderCell: params => (
        <Box>
          <Button onClick={() => handleEdit(params.row)}>Edit</Button>
          <Button color="error" onClick={() => handleDelete(params.row.id)}>
            Delete
          </Button>
        </Box>
      ),
    },
  ]

  return (
    <div className="p-4">
      <div className="flex justify-between mb-4">
        {/* <h1 className="text-2xl font-bold">Alerts</h1> */}
        <Breadcrumb />
        <Button
          variant="contained"
          onClick={() => dispatch(openModal('addAlertModal'))}
        >
          Add New Alert
        </Button>
      </div>
      <Modal
        // open={true}
        uniqueKey="addAlertModal"
        title={editMode ? 'Edit Alert' : 'Add New Alert'}
      >
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Alert Message"
              value={formData.alertMessage}
              onChange={e =>
                setFormData(prev => ({ ...prev, alertMessage: e.target.value }))
              }
              margin="normal"
              required
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  dispatch(closeModal('addAlertModal'))
                  setFormData(initialFormState)
                  setEditMode(false)
                }}
              >
                Cancel
              </Button>
              <Button variant="contained" type="submit">
                {editMode ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="bg-white rounded-lg">
        <DataGrid
          rows={alertsData?.data || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={isLoading}
          disableSelectionOnClick
          getRowId={row => row.id}
          sx={{
            height: '500px',
          }}
          columnVisibilityModel={{
            id: false,
          }}
        />
      </div>
    </div>
  )
}

export default withPermission(Alerts, true, 'alerts', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
