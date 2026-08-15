import { addNewIndent } from '@/constants/apis'
import {
  Autocomplete,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { debounce } from 'lodash'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { closeModal } from '@/redux/modalSlice'
import { Add, Close } from '@mui/icons-material'

function AddIndentForm({
  isLoadingPatients,
  patientSuggestions,
  debouncedGetPatientSuggestions,
  pharmacyItems,
  isLoadingPharmacyItems,
  isErrorPharmacyItems,
}) {
  const user = useSelector(store => store.user)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  // Form state
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedPharmacyItems, setSelectedPharmacyItems] = useState([])
  const [newItem, setNewItem] = useState({
    item: null,
    quantity: '',
  })

  // Add indent mutation
  const { mutate: addIndent, isPending } = useMutation({
    mutationFn: async payload => {
      const response = await addNewIndent(user?.accessToken, payload)
      return response
    },
    onSuccess: data => {
      if (data.status === 200) {
        toast.success('Indent added successfully!', toastconfig)
        queryClient.invalidateQueries(['indentList'])
        handleCloseModal()
        resetForm()
      } else {
        toast.error(data.message || 'Failed to add indent', toastconfig)
      }
    },
    onError: error => {
      console.error('Error adding indent:', error)
      toast.error('Failed to add indent. Please try again.', toastconfig)
    },
  })

  // Handle patient selection
  const handlePatientChange = (event, newValue) => {
    setSelectedPatient(newValue)
  }

  // Handle pharmacy item selection
  const handlePharmacyItemChange = (event, newValue) => {
    setNewItem(prev => ({
      ...prev,
      item: newValue,
    }))
  }

  // Handle quantity change
  const handleQuantityChange = e => {
    setNewItem(prev => ({
      ...prev,
      quantity: e.target.value,
    }))
  }

  // Add item to list
  const handleAddItem = () => {
    if (!newItem.item || !newItem.quantity || newItem.quantity <= 0) {
      toast.error(
        'Please select an item and enter a valid quantity',
        toastconfig,
      )
      return
    }

    // Check if item already exists
    const existingItem = selectedPharmacyItems.find(
      item => item.id === newItem.item.id,
    )
    if (existingItem) {
      toast.error('This item is already in the list', toastconfig)
      return
    }

    const itemToAdd = {
      id: newItem.item.id,
      itemName: newItem.item.itemName,
      prescribedQuantity: parseInt(newItem.quantity),
    }

    setSelectedPharmacyItems(prev => [...prev, itemToAdd])
    setNewItem({ item: '', quantity: '' })
  }

  // Remove item from list
  const handleRemoveItem = itemId => {
    setSelectedPharmacyItems(prev => prev.filter(item => item.id !== itemId))
    // setNewItem({ item: null, quantity: '' })
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient', toastconfig)
      return
    }

    if (selectedPharmacyItems.length === 0) {
      toast.error('Please add at least one item', toastconfig)
      return
    }

    const payload = {
      patientId: selectedPatient.id,
      items: selectedPharmacyItems.map(item => ({
        itemId: item.id,
        prescribedQuantity: item.prescribedQuantity,
      })),
    }

    addIndent(payload)
  }

  // Reset form
  const resetForm = () => {
    setSelectedPatient(null)
    setSelectedPharmacyItems([])
    setNewItem({ item: null, quantity: '' })
  }

  // Handle modal close
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
        {/* Patient Selection */}
        <Autocomplete
          freeSolo
          loading={isLoadingPatients}
          options={patientSuggestions}
          getOptionLabel={option => {
            return typeof option === 'string' ? option : option?.Name || ''
          }}
          value={selectedPatient}
          onChange={handlePatientChange}
          onInputChange={(event, newInputValue) => {
            if (newInputValue && newInputValue.length > 2) {
              debouncedGetPatientSuggestions(newInputValue)
            }
          }}
          renderInput={params => (
            <TextField
              {...params}
              label="Patient"
              name="patientName"
              required
              fullWidth
            />
          )}
        />

        {/* Pharmacy Items Section */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Add Pharmacy Items
          </Typography>

          <div className="flex gap-2 mb-4 w-[100%]">
            <Autocomplete
              freeSolo
              loading={isLoadingPharmacyItems}
              options={
                pharmacyItems &&
                newItem.item &&
                typeof newItem.item === 'string'
                  ? pharmacyItems.filter(option =>
                      (option?.itemName || '')
                        .toLowerCase()
                        .startsWith(newItem.item.toLowerCase()),
                    )
                  : pharmacyItems || []
              }
              getOptionLabel={option => {
                return typeof option === 'string'
                  ? option
                  : option?.itemName || ''
              }}
              value={newItem.item}
              onChange={handlePharmacyItemChange}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Select Item"
                  size="small"
                  sx={{ minWidth: 200 }}
                />
              )}
            />

            <TextField
              label="Quantity"
              type="number"
              value={newItem.quantity}
              onChange={handleQuantityChange}
              size="small"
              inputProps={{ min: 1 }}
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

          {/* Selected Items List */}
          {selectedPharmacyItems.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Selected Items:
              </Typography>
              <div className="space-y-2">
                {selectedPharmacyItems.map((item, index) => (
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

        {/* Action Buttons */}
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
