import React, { useState } from 'react'
import {
  Button,
  TextField,
  Tooltip,
  IconButton,
  FormControl,
  Autocomplete,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { EditNote, Close } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

// Constants
import {
  getConsultantRoasters,
  addConsultantRoaster,
  editConsultantRoaster,
} from '@/constants/apis'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import Breadcrumb from '@/components/Breadcrumb'

const priorityOptions = ['LOW', 'MEDIUM', 'HIGH']

const ConsultantRoasters = () => {
  const user = useSelector(state => state.user)
  const dropdowns = useSelector(state => state.dropdowns)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { branches, consultantTypeList } = dropdowns

  const roasterModel = {
    id: null,
    branchId: '',
    consultantTypeId: '',
    priority: 'LOW',
    consultantName: '',
    contactNumber: '',
    workAddress: '',
  }

  const [modalType, setModalType] = useState('add')
  const [roasterForm, setRoasterForm] = useState(roasterModel)

  const { data: roastersData } = useQuery({
    queryKey: ['consultantRoasters'],
    queryFn: async () => {
      const res = await getConsultantRoasters(user.accessToken)
      if (res.status === 200) return res.data
      throw new Error('Failed to fetch consultant roasters')
    },
  })

  const addMutation = useMutation({
    mutationFn: async payload => {
      const res = await addConsultantRoaster(user.accessToken, payload)
      if (res.status === 200) {
        queryClient.invalidateQueries(['consultantRoasters'])
        dispatch(closeModal('Roaster'))
        setRoasterForm(roasterModel)
        toast.success('Roaster added successfully')
      } else if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status === 500) {
        toast.error('Something went wrong, please try again')
      } else {
        throw new Error('Add failed')
      }
    },
  })

  const editMutation = useMutation({
    mutationFn: async payload => {
      const res = await editConsultantRoaster(user.accessToken, payload)
      if (res.status === 200) {
        queryClient.invalidateQueries(['consultantRoasters'])
        dispatch(closeModal('Roaster'))
        setRoasterForm(roasterModel)
        toast.success('Roaster updated successfully')
      } else if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status === 500) {
        toast.error('Something went wrong, please try again')
      } else {
        throw new Error('Edit failed')
      }
    },
  })

  const handleEdit = row => {
    setRoasterForm({
      id: row.id,
      branchId: row.branchId,
      consultantTypeId: row.consultantTypeId,
      priority: row.priority,
      consultantName: row.consultantName,
      contactNumber: row.contactNumber,
      workAddress: row.workAddress,
    })
    setModalType('edit')
    dispatch(openModal('Roaster'))
  }

  const handleOpen = () => {
    setModalType('add')
    setRoasterForm(roasterModel)
    dispatch(openModal('Roaster'))
  }

  const handleChange = e => {
    setRoasterForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = () => {
    const { id, ...rest } = roasterForm
    modalType === 'add'
      ? addMutation.mutate({ ...rest })
      : editMutation.mutate(roasterForm)
  }

  const columns = [
    { field: 'branch', headerName: 'Branch', flex: 0.3 },
    { field: 'consultantName', headerName: 'Name', flex: 0.7 },
    { field: 'consultantTypeName', headerName: 'Type', flex: 0.5 },
    { field: 'contactNumber', headerName: 'Contact', flex: 0.7 },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 0.5,
      renderCell: params => (
        <span
          className={`${
            params.row.priority === 'LOW'
              ? 'text-green-500'
              : params.row.priority === 'MEDIUM'
              ? 'text-yellow-500'
              : 'text-red-500'
          }`}
        >
          {params.row.priority}
        </span>
      ),
    },
    { field: 'workAddress', headerName: 'Address', flex: 1.5 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: params => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<EditNote />}
          onClick={() => handleEdit(params.row)}
        >
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div className="p-5">
      <div className="flex justify-between m-3">
        <Breadcrumb />
        <Button variant="contained" className="text-white" onClick={handleOpen}>
          Add New
        </Button>
      </div>

      <DataGrid
        rows={roastersData || []}
        columns={columns}
        getRowId={row => row.id}
        autoHeight
        pageSize={5}
        rowsPerPageOptions={[5]}
      />

      <Modal uniqueKey="Roaster" maxWidth="sm" closeOnOutsideClick={false}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {modalType === 'add' ? 'Add' : 'Edit'} Consultant Roaster
          </h2>
          <IconButton onClick={() => dispatch(closeModal('Roaster'))}>
            <Close />
          </IconButton>
        </div>

        <div className="flex flex-col gap-4 mt-4">
          <FormControl>
            <Autocomplete
              options={branches || []}
              getOptionLabel={opt => opt.name || ''}
              value={branches?.find(b => b.id === roasterForm.branchId) || null}
              onChange={(_, val) =>
                setRoasterForm({ ...roasterForm, branchId: val?.id || '' })
              }
              renderInput={params => <TextField {...params} label="Branch" />}
            />
          </FormControl>

          <FormControl>
            <Autocomplete
              options={consultantTypeList || []}
              getOptionLabel={opt => opt.name || ''}
              value={
                consultantTypeList?.find(
                  c => c.id === roasterForm.consultantTypeId,
                ) || null
              }
              onChange={(_, val) =>
                setRoasterForm({
                  ...roasterForm,
                  consultantTypeId: val?.id || '',
                })
              }
              renderInput={params => (
                <TextField {...params} label="Consultant Type" />
              )}
            />
          </FormControl>

          <FormControl>
            <Autocomplete
              options={priorityOptions}
              value={roasterForm.priority}
              onChange={(_, val) =>
                setRoasterForm({ ...roasterForm, priority: val || 'LOW' })
              }
              renderInput={params => <TextField {...params} label="Priority" />}
            />
          </FormControl>

          <TextField
            label="Consultant Name"
            name="consultantName"
            value={roasterForm.consultantName}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Contact Number"
            name="contactNumber"
            value={roasterForm.contactNumber}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Work Address"
            name="workAddress"
            multiline
            rows={3}
            value={roasterForm.workAddress}
            onChange={handleChange}
            fullWidth
          />

          <div className="flex justify-end">
            <Button variant="outlined" onClick={handleSubmit}>
              {modalType === 'add' ? 'Add' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ConsultantRoasters
