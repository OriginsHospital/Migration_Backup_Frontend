import React, { useMemo, useState } from 'react'
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Close, DeleteOutlined, EditNote } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import FilteredDataGrid from './FilteredDataGrid'
import Modal from './Modal'
import {
  createPharmacyMasterData,
  editPharmacyMasterData,
  getPharmacyMasterData,
} from '@/constants/apis'
import { API_ROUTES } from '@/constants/constants'
import { closeModal, openModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import {
  parseKitMedicines,
  ACTIVE_PHARMACY_KITS_QUERY_KEY,
} from '@/utils/prescriptionPharmacySelect'

const EMPTY_MEDICINE = { name: '', quantity: 1 }

function PharmacyKitMasterPanel({ accessToken }) {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [formState, setFormState] = useState({
    kitName: '',
    kitValue: '',
    isActive: 1,
    medicines: [{ ...EMPTY_MEDICINE }],
  })
  const [isEditMode, setIsEditMode] = useState(false)

  const { data: kitsResponse, isLoading } = useQuery({
    queryKey: ['pharmacyKitMasterData'],
    queryFn: () =>
      getPharmacyMasterData(accessToken, API_ROUTES.GET_ALL_PHARMACY_KITS),
    enabled: !!accessToken,
  })

  const rows = useMemo(() => {
    return (kitsResponse?.data || []).map((row) => ({
      ...row,
      medicines: parseKitMedicines(row.medicines),
      medicineCount: parseKitMedicines(row.medicines).length,
    }))
  }, [kitsResponse])

  const resetForm = () => {
    setFormState({
      kitName: '',
      kitValue: '',
      isActive: 1,
      medicines: [{ ...EMPTY_MEDICINE }],
    })
    setIsEditMode(false)
  }

  const openFormModal = (row = null) => {
    if (row) {
      const kitMedicines = parseKitMedicines(row.medicines)
      setIsEditMode(true)
      setFormState({
        id: row.id,
        kitName: row.kitName || '',
        kitValue: row.kitValue || '',
        isActive: row.isActive ? 1 : 0,
        medicines:
          kitMedicines.length > 0 ? kitMedicines : [{ ...EMPTY_MEDICINE }],
      })
    } else {
      resetForm()
      setIsEditMode(false)
    }
    dispatch(openModal('pharmacyKitFormModal'))
  }

  const createMutation = useMutation({
    mutationFn: (payload) =>
      createPharmacyMasterData(
        accessToken,
        payload,
        API_ROUTES.ADD_NEW_PHARMACY_KIT,
      ),
    onSuccess: (data) => {
      if (data?.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['pharmacyKitMasterData'] })
        queryClient.invalidateQueries({
          queryKey: ACTIVE_PHARMACY_KITS_QUERY_KEY,
        })
        dispatch(closeModal())
        resetForm()
        toast.success(data?.message, toastconfig)
      } else {
        toast.error(data?.message, toastconfig)
      }
    },
  })

  const editMutation = useMutation({
    mutationFn: (payload) =>
      editPharmacyMasterData(
        accessToken,
        payload,
        API_ROUTES.EDIT_PHARMACY_KIT,
      ),
    onSuccess: (data) => {
      if (data?.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['pharmacyKitMasterData'] })
        queryClient.invalidateQueries({
          queryKey: ACTIVE_PHARMACY_KITS_QUERY_KEY,
        })
        dispatch(closeModal())
        resetForm()
        toast.success(data?.message, toastconfig)
      } else {
        toast.error(data?.message, toastconfig)
      }
    },
  })

  const handleMedicineChange = (index, field, value) => {
    setFormState((prev) => {
      const medicines = [...prev.medicines]
      medicines[index] = { ...medicines[index], [field]: value }
      return { ...prev, medicines }
    })
  }

  const addMedicineRow = () => {
    setFormState((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { ...EMPTY_MEDICINE }],
    }))
  }

  const removeMedicineRow = (index) => {
    setFormState((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = () => {
    const trimmedMedicines = formState.medicines
      .map((item) => ({
        name: item.name?.trim(),
        quantity: Number(item.quantity) || 1,
      }))
      .filter((item) => item.name)

    if (!formState.kitName?.trim()) {
      toast.error('Kit name is required', toastconfig)
      return
    }
    if (trimmedMedicines.length === 0) {
      toast.error('Add at least one medicine to the kit', toastconfig)
      return
    }

    const payload = {
      kitName: formState.kitName.trim(),
      kitValue: formState.kitValue?.trim() || undefined,
      isActive: Number(formState.isActive),
      medicines: trimmedMedicines,
    }

    if (isEditMode) {
      editMutation.mutate({ ...payload, id: formState.id })
    } else {
      createMutation.mutate(payload)
    }
  }

  const columns = [
    { field: 'kitName', headerName: 'Kit Name', flex: 1, minWidth: 180 },
    { field: 'kitValue', headerName: 'Kit Code', width: 180 },
    {
      field: 'medicineCount',
      headerName: 'Medicines',
      width: 110,
      type: 'number',
    },
    {
      field: 'isActive',
      headerName: 'IsActive',
      width: 100,
      type: 'boolean',
    },
    {
      field: 'actionField',
      headerName: 'Action',
      width: 100,
      renderCell: (params) => (
        <Button
          variant="outlined"
          color="primary"
          size="small"
          startIcon={<EditNote />}
          onClick={() => openFormModal(params.row)}
        >
          Edit
        </Button>
      ),
    },
  ]

  return (
    <div className="h-full max-w-[calc(100vw-550px)]">
      <div className="flex justify-end mb-3">
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => openFormModal()}
        >
          Add New
        </Button>
      </div>

      <FilteredDataGrid
        columns={columns}
        rows={rows}
        loading={isLoading}
        getRowId={(row) => row.id}
        customFilters={[
          { field: 'kitName', label: 'Kit Name', type: 'text' },
          { field: 'kitValue', label: 'Kit Code', type: 'text' },
          {
            field: 'isActive',
            label: 'Is Active',
            type: 'select',
            options: [
              { value: '1', label: 'Yes' },
              { value: '0', label: 'No' },
            ],
          },
        ]}
        filterData={(data, filters) =>
          data.filter((row) =>
            Object.entries(filters).every(([field, filterConfig]) => {
              if (!filterConfig?.value) return true
              const cellValue = row[field]?.toString() ?? ''
              return cellValue
                .toLowerCase()
                .includes(filterConfig.value.toLowerCase())
            }),
          )
        }
        getUniqueValues={(field) => [
          ...new Set(
            rows?.map((row) => row[field]?.toString()).filter(Boolean),
          ),
        ]}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { page: 0, pageSize: 100 } },
        }}
        sx={{ '& .MuiDataGrid-main': { height: '60vh' } }}
        columnVisibilityModel={{ id: false }}
      />

      <Modal
        uniqueKey="pharmacyKitFormModal"
        closeOnOutsideClick={false}
        maxWidth="md"
      >
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">
            {isEditMode ? 'Edit Pharmacy Kit' : 'Add Pharmacy Kit'}
          </Typography>
          <IconButton
            onClick={() => {
              dispatch(closeModal())
              resetForm()
            }}
          >
            <Close />
          </IconButton>
        </div>

        <div className="flex flex-col gap-4 p-2 max-h-[70vh] overflow-y-auto">
          <TextField
            label="Kit Name"
            value={formState.kitName}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, kitName: e.target.value }))
            }
            required
            fullWidth
          />
          <TextField
            label="Kit Code (optional)"
            value={formState.kitValue}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, kitValue: e.target.value }))
            }
            helperText="Leave blank to auto-generate from kit name"
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="pharmacy-kit-active">Is Active</InputLabel>
            <Select
              labelId="pharmacy-kit-active"
              label="Is Active"
              value={formState.isActive}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  isActive: Number(e.target.value),
                }))
              }
            >
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle1" className="font-semibold">
            Kit Medicines
          </Typography>

          {formState.medicines.map((medicine, index) => (
            <div key={`medicine-${index}`} className="flex gap-2 items-start">
              <TextField
                label="Medicine Name"
                value={medicine.name}
                onChange={(e) =>
                  handleMedicineChange(index, 'name', e.target.value)
                }
                className="flex-grow"
                fullWidth
              />
              <TextField
                label="Qty"
                type="number"
                value={medicine.quantity}
                onChange={(e) =>
                  handleMedicineChange(index, 'quantity', e.target.value)
                }
                sx={{ width: 100 }}
                inputProps={{ min: 1 }}
              />
              <IconButton
                color="error"
                onClick={() => removeMedicineRow(index)}
                disabled={formState.medicines.length <= 1}
              >
                <DeleteOutlined />
              </IconButton>
            </div>
          ))}

          <Button variant="text" startIcon={<Add />} onClick={addMedicineRow}>
            Add Medicine
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createMutation.isPending || editMutation.isPending}
          >
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default PharmacyKitMasterPanel
