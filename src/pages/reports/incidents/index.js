import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES, API_ROUTES } from '@/constants/constants'
import Breadcrumb from '@/components/Breadcrumb'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  ListItemText,
  Autocomplete,
  Chip,
} from '@mui/material'
import {
  getAllIncidents,
  addNewIncident,
  editIncident,
  getUserSuggestion,
} from '@/constants/apis'
import Modal from '@/components/Modal'
import { openModal, closeModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'

const initialFormState = {
  incidentDate: dayjs(new Date()).format('YYYY-MM-DD'),
  rootCauseAnalysis: '',
  impact: '',
  action: '',
  description: '',
  responsibleEmployees: [],
  preventiveMeasures: '',
  isActive: true,
}

const IncidentsReport = () => {
  const user = useSelector(store => store.user)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState(initialFormState)
  const [editMode, setEditMode] = useState(false)

  // Query to fetch employees for responsible employees dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => await getUserSuggestion(user.accessToken),
    enabled: !!user.accessToken,
  })

  const formatPayload = data => {
    return {
      ...data,
      // Convert array of employee objects to comma-separated string of IDs
      responsibleEmployees: Array.isArray(data.responsibleEmployees)
        ? data.responsibleEmployees.map(emp => emp.id).join(',')
        : data.responsibleEmployees,
    }
  }

  const addIncidentMutation = useMutation({
    mutationFn: async data => {
      const formattedData = formatPayload(data)
      const response = await addNewIncident(user.accessToken, formattedData)
      if (response.status === 200) {
        toast.success('Incident added successfully', toastconfig)
        dispatch(closeModal('addIncidentModal'))
        setFormData(initialFormState)
        return response.data
      }
      throw new Error('Failed to add incident')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents'])
    },
  })

  const editIncidentMutation = useMutation({
    mutationFn: async data => {
      const formattedData = formatPayload(data)
      const response = await editIncident(user.accessToken, formattedData)
      if (response.status === 200) {
        toast.success('Incident updated successfully', toastconfig)
        dispatch(closeModal('addIncidentModal'))
        setFormData(initialFormState)
        setEditMode(false)
        return response.data
      }
      throw new Error('Failed to update incident')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['incidents'])
    },
  })

  const handleSubmit = e => {
    e.preventDefault()
    if (editMode) {
      let { createdBy, updatedBy, ...rest } = formData
      editIncidentMutation.mutate(rest)
    } else {
      addIncidentMutation.mutate(formData)
    }
  }

  const handleEdit = row => {
    // Format the incoming data to match form structure
    const formattedRow = {
      ...row,
      // Ensure responsibleEmployees is an array of objects
      responsibleEmployees: Array.isArray(row.responsibleEmployees)
        ? row.responsibleEmployees.map(emp => ({
            id: emp.id,
            fullName: emp.fullName,
          }))
        : [],
    }
    setFormData(formattedRow)
    setEditMode(true)
    dispatch(openModal('addIncidentModal'))
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'incidentDate',
      headerName: 'Incident Date',
      width: 150,
      valueFormatter: params => dayjs(params.value).format('DD-MM-YYYY'),
      filterable: true,
      type: 'string',
    },
    {
      field: 'rootCauseAnalysis',
      headerName: 'Root Cause Analysis',
      width: 200,
    },
    { field: 'impact', headerName: 'Impact', width: 150 },
    { field: 'action', headerName: 'Action', width: 150 },
    { field: 'description', headerName: 'Description', width: 200 },
    {
      field: 'responsibleEmployees',
      headerName: 'Responsible Employees',
      width: 200,
      renderCell: params => params.value.map(emp => emp.fullName).join(', '),
    },
    {
      field: 'preventiveMeasures',
      headerName: 'Preventive Measures',
      width: 200,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: params => (
        <span
          className={`px-2 py-1 rounded ${
            params.value
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {params.value ? 'Active' : 'Inactive'}
        </span>
      ),
      valueFormatter: params => (params.value ? 'Active' : 'Inactive'),
      filterable: true,
      type: 'string',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: params => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleEdit(params.row)}
        >
          Edit
        </Button>
      ),
    },
  ]

  // Query to fetch incidents data
  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => await getAllIncidents(user.accessToken),
  })

  return (
    <div className="p-4">
      <div className="mb-4">
        <Breadcrumb />
      </div>
      <Box className="mb-4 flex justify-end">
        <Button
          variant="outlined"
          onClick={() => dispatch(openModal('addIncidentModal'))}
        >
          Add Incident
        </Button>
      </Box>
      <Modal uniqueKey={'addIncidentModal'} maxWidth="sm">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">
            {editMode ? 'Edit' : 'Add'} Incident
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DatePicker
              label="Incident Date"
              value={dayjs(formData.incidentDate)}
              onChange={newValue =>
                setFormData({
                  ...formData,
                  incidentDate: dayjs(newValue).format('YYYY-MM-DD'),
                })
              }
              className="w-full"
            />

            <TextField
              label="Root Cause Analysis"
              value={formData.rootCauseAnalysis}
              onChange={e =>
                setFormData({ ...formData, rootCauseAnalysis: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={2}
            />

            <TextField
              label="Impact"
              value={formData.impact}
              onChange={e =>
                setFormData({ ...formData, impact: e.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Action"
              value={formData.action}
              onChange={e =>
                setFormData({ ...formData, action: e.target.value })
              }
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={3}
            />

            <Autocomplete
              multiple
              options={employeesData?.data || []}
              getOptionLabel={option => option.name || ''}
              value={
                formData?.responsibleEmployees
                  ? typeof formData.responsibleEmployees === 'string'
                    ? formData.responsibleEmployees
                        .split(',')
                        .map(id => {
                          const employee = employeesData?.data?.find(
                            emp => emp.id === parseInt(id),
                          )
                          return employee
                            ? { id: employee.id, name: employee.name }
                            : null
                        })
                        .filter(Boolean)
                    : formData.responsibleEmployees
                  : []
              }
              onChange={(event, newValue) => {
                setFormData({
                  ...formData,
                  responsibleEmployees: newValue.map(emp => ({
                    id: emp.id,
                    fullName: emp.name || emp.fullName,
                  })),
                })
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Responsible Employees"
                  required
                  error={
                    !formData?.responsibleEmployees ||
                    formData.responsibleEmployees.length === 0
                  }
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option.name || option.fullName}
                    {...getTagProps({ index })}
                    key={option.id}
                  />
                ))
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />

            <TextField
              label="Preventive Measures"
              value={formData.preventiveMeasures}
              onChange={e =>
                setFormData({ ...formData, preventiveMeasures: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={formData.isActive}
                onChange={e =>
                  setFormData({ ...formData, isActive: e.target.value })
                }
              >
                <MenuItem value={0}>Inactive</MenuItem>
                <MenuItem value={1}>Active</MenuItem>
              </Select>
            </FormControl>

            <div className="flex justify-end gap-2">
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  dispatch(closeModal('addIncidentModal'))
                  setFormData(initialFormState)
                  setEditMode(false)
                }}
              >
                Cancel
              </Button>
              <Button
                // variant="contained"
                type="submit"
                variant="outlined"
                // className="bg-blue-500"
                onClick={handleSubmit}
              >
                {editMode ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
      <div className="bg-white rounded-lg">
        <DataGrid
          rows={incidentsData?.data || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          // autoHeight
          loading={isLoading}
          disableSelectionOnClick
          getRowId={row => row.id}
          // height={700}
          sx={{
            height: '500px',
          }}
        />
      </div>
    </div>
  )
}

export default withPermission(IncidentsReport, true, 'incidents', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
