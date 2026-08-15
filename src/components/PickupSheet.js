import React, { useState, useEffect, useCallback } from 'react'
import { Typography, Paper, Button } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
import {
  getPickupSheetTemplate,
  updatePickupSheetTemplate,
} from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { closeModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import { printOpuSheet } from '@/utils/opuSheetPrint'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

function PickupSheet({ TreatmentCycleId }) {
  const user = useSelector((store) => store.user)
  const [template, setTemplate] = useState('')
  const dispatch = useDispatch()

  const {
    data: pickupTemplate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pickupTemplate', TreatmentCycleId],
    queryFn: () => getPickupSheetTemplate(user.accessToken, TreatmentCycleId),
    enabled: !!TreatmentCycleId && !!user.accessToken,
  })

  useEffect(() => {
    if (pickupTemplate?.data) {
      setTemplate(pickupTemplate.data.template)
    }
  }, [pickupTemplate])

  const handleTemplateChange = (value) => {
    setTemplate(value)
  }

  const handleUpdate = useMutation({
    mutationFn: async () => {
      const res = await updatePickupSheetTemplate(
        user.accessToken,
        TreatmentCycleId,
        template,
      )
      if (res.status === 200) {
        toast.success('OPU Sheet updated successfully', toastconfig)
      }
      return res
    },
  })

  const handlePrint = useCallback(
    (page) => {
      const printed = printOpuSheet(template, page)
      if (!printed) {
        toast.error(
          page === 2
            ? 'Instructions page is empty or pop-up was blocked.'
            : 'Unable to print. Allow pop-ups and try again.',
          toastconfig,
        )
      }
    },
    [template],
  )

  if (isLoading) {
    return <Typography>Loading OPU Sheet...</Typography>
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading OPU Sheet: {error.message}
      </Typography>
    )
  }

  return (
    <div className="p-4">
      <Typography variant="h6" gutterBottom>
        OPU Sheet
      </Typography>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          color="secondary"
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint(1)}
        >
          Print Operation Sheet
        </Button>
        <Button
          color="secondary"
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint(2)}
        >
          Print Instructions
        </Button>
        <Button
          color="secondary"
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={() => handlePrint('all')}
        >
          Print Both Pages
        </Button>
        <Button
          color="primary"
          variant="outlined"
          onClick={handleUpdate.mutate}
        >
          Update Sheet
        </Button>
        <Button
          color="error"
          variant="outlined"
          onClick={() => dispatch(closeModal())}
        >
          Close
        </Button>
      </div>
      <Paper className="m-4 p-4">
        <JoditEditor value={template} onBlur={handleTemplateChange} />
      </Paper>
    </div>
  )
}

export default PickupSheet
