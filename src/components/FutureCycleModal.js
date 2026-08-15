import { saveFutureCycle } from '@/constants/apis'
import {
  closeFutureCycleModal,
  openFutureCycleModal,
} from '@/redux/futureCycleSlice'
import { toastconfig } from '@/utils/toastconfig'
import Close from '@mui/icons-material/Close'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

export function getPatientMasterId(formData) {
  const rawId = formData?.id ?? formData?.patientMasterId
  const numericId = Number(rawId)
  if (Number.isFinite(numericId) && numericId > 0) {
    return numericId
  }
  return null
}

export function openFutureCycleForPatient(dispatch, formData) {
  const patientMasterId = getPatientMasterId(formData)
  if (!patientMasterId) {
    toast.error(
      'Patient record is missing. Please reload the patient.',
      toastconfig,
    )
    return
  }
  const patientDisplayName = formData?.firstName
    ? `${formData?.lastName || ''} ${formData?.firstName}`.trim()
    : formData?.Name || formData?.patientName || ''
  dispatch(
    openFutureCycleModal({
      patientMasterId,
      patientDisplayName,
    }),
  )
}

export function openFutureCycleForDoctorPatient(dispatch, patientInfo) {
  const patientMasterId = Number(patientInfo?.id)
  if (!Number.isFinite(patientMasterId) || patientMasterId <= 0) {
    toast.error(
      'Patient record is missing. Please reload the patient.',
      toastconfig,
    )
    return
  }
  const patientDisplayName = patientInfo?.firstName
    ? `${patientInfo?.lastName || ''} ${patientInfo?.firstName}`.trim()
    : ''
  dispatch(
    openFutureCycleModal({
      patientMasterId,
      patientDisplayName,
    }),
  )
}

/** Mounted once at app root */
export default function FutureCycleModalGlobal() {
  const dispatch = useDispatch()
  const userDetails = useSelector((store) => store.user)
  const { open, patientMasterId, patientDisplayName } = useSelector(
    (store) => store.futureCycle,
  )
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [cycleMonth, setCycleMonth] = useState(currentMonth)
  const [cycleYear, setCycleYear] = useState(currentYear)

  const yearOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => currentYear + i)
  }, [currentYear])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setCycleMonth(currentMonth)
      setCycleYear(currentYear)
    }
  }, [open, currentMonth, currentYear, patientMasterId])

  const handleClose = () => {
    dispatch(closeFutureCycleModal())
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      saveFutureCycle(userDetails?.accessToken, {
        patientId: Number(patientMasterId),
        cycleMonth: Number(cycleMonth),
        cycleYear: Number(cycleYear),
      }),
    onSuccess: (res) => {
      if (res?.status === 200) {
        toast.success('Future cycle scheduled successfully', toastconfig)
        queryClient.invalidateQueries({ queryKey: ['futureCycles'] })
        handleClose()
      } else {
        toast.error(res?.message || 'Failed to save future cycle', toastconfig)
      }
    },
    onError: () => {
      toast.error('Failed to save future cycle', toastconfig)
    },
  })

  const handleSave = () => {
    if (!patientMasterId) {
      toast.error(
        'Patient record is missing. Please reload the patient.',
        toastconfig,
      )
      return
    }
    saveMutation.mutate()
  }

  if (!mounted || !open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <Dialog
      open
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      disableScrollLock
      style={{ zIndex: 1600 }}
      PaperProps={{
        sx: { zIndex: 1601, position: 'relative' },
      }}
      BackdropProps={{
        sx: {
          zIndex: 1600,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pr: 1,
        }}
      >
        <span className="capitalize">Schedule Future Cycle</span>
        <IconButton aria-label="Close" onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent className="flex flex-col gap-4 pt-2">
        {patientDisplayName && (
          <p className="text-sm text-gray-600 m-0">
            Patient: <strong>{patientDisplayName}</strong>
          </p>
        )}
        <FormControl fullWidth size="small">
          <InputLabel id="future-cycle-month-label">Month</InputLabel>
          <Select
            labelId="future-cycle-month-label"
            label="Month"
            value={cycleMonth}
            onChange={(e) => setCycleMonth(Number(e.target.value))}
            MenuProps={{ sx: { zIndex: 1700 } }}
          >
            {MONTHS.map((m) => (
              <MenuItem key={m.value} value={m.value}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel id="future-cycle-year-label">Year</InputLabel>
          <Select
            labelId="future-cycle-year-label"
            label="Year"
            value={cycleYear}
            onChange={(e) => setCycleYear(Number(e.target.value))}
            MenuProps={{ sx: { zIndex: 1700 } }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="outlined" className="capitalize">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          className="capitalize text-white"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>,
    document.body,
  )
}
