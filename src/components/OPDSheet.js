import React, { useState, useEffect } from 'react'
import {
  Typography,
  Paper,
  Grid,
  Divider,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Button,
  IconButton,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import { getOpdSheetTemplate, updateOpdSheetTemplate } from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { closeModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import { Close, SaveTwoTone, Update } from '@mui/icons-material'

// Dynamically import JoditEditor for client-side rendering
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

// API function to get OPD sheet template

function OPDSheet({ patientInfo, vitalInfo }) {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [template, setTemplate] = useState('')
  const dispatch = useDispatch()
  // Fetch OPD sheet template using React Query
  const {
    data: opdTemplate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['opdSheet', patientInfo?.id],
    queryFn: () => getOpdSheetTemplate(user.accessToken, patientInfo?.id),
    enabled: !!patientInfo?.id && !!user.accessToken,
  })

  useEffect(() => {
    if (opdTemplate?.data) {
      setTemplate(opdTemplate.data.template)
    }
  }, [opdTemplate])
  const handleTemplateChange = (value) => {
    setTemplate(value)
  }
  const handleUpdate = useMutation({
    mutationFn: async () => {
      const res = await updateOpdSheetTemplate(
        user.accessToken,
        patientInfo?.id,
        template,
      )
      if (res.status === 200) {
        toast.success('OPD sheet updated successfully', toastconfig)
      }
      return res
    },
    onSuccess: (res) => {
      if (res?.status === 200 && patientInfo?.id) {
        queryClient.invalidateQueries({
          queryKey: ['opdSheetSummary', patientInfo.id],
        })
      }
    },
  })
  if (isLoading) {
    return <Typography>Loading OPD sheet...</Typography>
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading OPD sheet: {error.message}
      </Typography>
    )
  }

  return (
    <div className="p-4 max-h-[80vh]">
      <div className="flex justify-between gap-3 sticky top-0 bg-white">
        <Typography variant="h6" gutterBottom>
          OPD Sheet
        </Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>

      {/* OPD Template Editor */}
      <Paper className="m-4 p-4 overflow-y-auto h-[50vh]">
        <JoditEditor value={template} onBlur={handleTemplateChange} />
      </Paper>
      <div className="flex justify-end gap-3">
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate.mutate}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default OPDSheet
