import { addNewIndent } from '@/constants/apis'
import {
  Autocomplete,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { closeModal } from '@/redux/modalSlice'
import { Add, Close } from '@mui/icons-material'

function AddIndentForm({
  branchId,
  branchLabel,
  ipPatients = [],
  pharmacyItems,
  isLoadingPharmacyItems,
}) {
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedPharmacyItems, setSelectedPharmacyItems] = useState([])
  const [newItem, setNewItem] = useState({
    item: null,
    quantity: '',
  })

  const { mutate: addIndent, isPending } = useMutation({
    mutationFn: async (payload) => {
      const response = await addNewIndent(user?.accessToken, payload)
      return response
    },
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success('Indent added and stock deducted', toastconfig)
        queryClient.invalidateQueries({ queryKey: ['indentList'] })
        queryClient.invalidateQueries({ queryKey: ['indentPharmacyItems'] })
        queryClient.invalidateQueries({ queryKey: ['ipBilling'] })
        handleCloseModal()
        resetForm()
      } else {
        toast.error(data.message || 'Failed to add indent', toastconfig)
      }
    },
    onError: (error) => {
      console.error('Error adding indent:', error)
      toast.error(
        error?.message || 'Failed to add indent. Please try again.',
        toastconfig,
      )
    },
  })

  const handlePatientChange = (event, newValue) => {
    setSelectedPatient(newValue)
  }

  const handlePharmacyItemChange = (event, newValue) => {
    setNewItem((prev) => ({
      ...prev,
      item: newValue,
    }))
  }

  const handleQuantityChange = (e) => {
    setNewItem((prev) => ({
      ...prev,
      quantity: e.target.value,
    }))
  }

  const handleAddItem = () => {
    if (!newItem.item || !newItem.quantity || newItem.quantity <= 0) {
      toast.error(
        'Please select an item and enter a valid quantity',
        toastconfig,
      )
      return
    }

    const existingItem = selectedPharmacyItems.find(
      (item) => item.id === newItem.item.id,
    )
    if (existingItem) {
      toast.error('This item is already in the list', toastconfig)
      return
    }

    const available = Number(newItem.item.availableQuantity || 0)
    const qty = parseInt(newItem.quantity, 10)
    if (qty > available) {
      toast.error(
        `Only ${available} available in ${branchLabel || 'this branch'} pharmacy`,
        toastconfig,
      )
      return
    }

    const itemToAdd = {
      id: newItem.item.id,
      itemName: newItem.item.itemName,
      prescribedQuantity: qty,
      availableQuantity: available,
    }

    setSelectedPharmacyItems((prev) => [...prev, itemToAdd])
    setNewItem({ item: null, quantity: '' })
  }

  const handleRemoveItem = (itemId) => {
    setSelectedPharmacyItems((prev) =>
      prev.filter((item) => item.id !== itemId),
    )
  }

  const handleSubmit = () => {
    if (!selectedPatient) {
      toast.error('Please select an admitted / booked patient', toastconfig)
      return
    }

    if (selectedPharmacyItems.length === 0) {
      toast.error('Please add at least one item', toastconfig)
      return
    }

    if (!branchId) {
      toast.error('Branch is required', toastconfig)
      return
    }

    const payload = {
      patientId: selectedPatient.id,
      branchId: Number(branchId),
      items: selectedPharmacyItems.map((item) => ({
        itemId: item.id,
        prescribedQuantity: item.prescribedQuantity,
      })),
    }

    addIndent(payload)
  }

  const resetForm = () => {
    setSelectedPatient(null)
    setSelectedPharmacyItems([])
    setNewItem({ item: null, quantity: '' })
  }

  const handleCloseModal = () => {
    dispatch(closeModal())
    resetForm()
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center border-b pb-4 mb-4">
        <Typography variant="h6">Add New Indent</Typography>
        <IconButton onClick={handleCloseModal}>
          <Close />
        </IconButton>
      </div>

      <div className="space-y-4">
        <Alert severity="info">
          Only patients admitted or booked in{' '}
          <strong>{branchLabel || 'this branch'}</strong>. Stock will be
          deducted from this branch pharmacy.
        </Alert>

        <Autocomplete
          options={ipPatients}
          loading={false}
          getOptionLabel={(option) => {
            if (!option) return ''
            const name = option.Name || option.patientName || ''
            const displayId = option.patientId ? ` (${option.patientId})` : ''
            const room = option.roomCode ? ` · ${option.roomCode}` : ''
            return `${name}${displayId}${room}`
          }}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          value={selectedPatient}
          onChange={handlePatientChange}
          noOptionsText="No admitted / booked patients in this branch"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Admitted / booked patient"
              name="patientName"
              required
              fullWidth
              helperText="Search patients currently admitted or booked in this branch"
            />
          )}
        />

        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Add Pharmacy Items
          </Typography>

          <div className="flex gap-2 mb-4 w-[100%] flex-wrap">
            <Autocomplete
              loading={isLoadingPharmacyItems}
              options={pharmacyItems || []}
              getOptionLabel={(option) => {
                if (!option) return ''
                const name = option.itemName || option.name || ''
                const qty = Number(option.availableQuantity || 0)
                return `${name} (Avail: ${qty})`
              }}
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              value={newItem.item}
              onChange={handlePharmacyItemChange}
              sx={{ minWidth: 260, flex: 1 }}
              noOptionsText={`No stock in ${branchLabel || 'this branch'} pharmacy`}
              renderInput={(params) => (
                <TextField {...params} label="Select Item" size="small" />
              )}
            />

            <TextField
              label="Quantity"
              type="number"
              value={newItem.quantity}
              onChange={handleQuantityChange}
              size="small"
              inputProps={{ min: 1 }}
              sx={{ width: 120 }}
            />

            <Button
              variant="outlined"
              onClick={handleAddItem}
              startIcon={<Add />}
              size="small"
            >
              Add
            </Button>
          </div>

          {selectedPharmacyItems.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Selected Items:
              </Typography>
              <div className="space-y-2">
                {selectedPharmacyItems.map((item) => (
                  <Box
                    key={item.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    p={1}
                    border={1}
                    borderColor="grey.300"
                    borderRadius={1}
                  >
                    <Box>
                      <Typography variant="body2">{item.itemName}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Quantity: {item.prescribedQuantity}
                        {item.availableQuantity != null
                          ? ` · Available: ${item.availableQuantity}`
                          : ''}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveItem(item.id)}
                      color="error"
                    >
                      <Close />
                    </IconButton>
                  </Box>
                ))}
              </div>
            </Box>
          )}
        </Box>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outlined"
            onClick={handleCloseModal}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            className="text-white"
            disabled={
              isPending ||
              !selectedPatient ||
              selectedPharmacyItems.length === 0
            }
          >
            {isPending ? 'Adding...' : 'Add Indent'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddIndentForm
