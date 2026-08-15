import React, { useState, useCallback, useEffect, useMemo } from 'react'

import { Board } from '@/components/Board'
import FlyoutLink from '@/components/FlyoutLink'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import {
  changeAppointmentStatus,
  getAllAppointmentsByDate,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { useRouter } from 'next/router'
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { exportReport } from '@/utils/reportExport'
import { toastconfig } from '@/utils/toastconfig'
import { getSelectableBranches } from '@/utils/branchMapping'

const ALL_BRANCHES_VALUE = 'all'
const ALL_BRANCHES_OPTION = {
  id: ALL_BRANCHES_VALUE,
  name: 'All',
  branchCode: 'All',
}

const STAGE_LABELS = {
  Booked: 'Booked',
  Arrived: 'Arrived',
  Scan: 'Check-In / Vitals',
  Doctor: 'Doctor',
  Seen: 'Seen / Billing',
  Done: 'Completed',
}

const APPOINTMENT_EXPORT_COLUMNS = [
  { field: 'appointmentDate', headerName: 'Appointment Date' },
  { field: 'branch', headerName: 'Branch' },
  { field: 'patientId', headerName: 'Patient ID' },
  { field: 'patientName', headerName: 'Patient Name' },
  { field: 'type', headerName: 'Type' },
  { field: 'visitType', headerName: 'Visit Type' },
  { field: 'appointmentReason', headerName: 'Appointment Reason' },
  { field: 'stage', headerName: 'Stage' },
  { field: 'timeStart', headerName: 'Time' },
  { field: 'doctorName', headerName: 'Doctor' },
  { field: 'isDelayed', headerName: 'Delayed' },
  { field: 'isPrescribed', headerName: 'Prescribed' },
  { field: 'noShow', headerName: 'No Show' },
  { field: 'noShowReason', headerName: 'No Show Reason' },
]

const Appointments = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [date, setDate] = useState()
  const userDetails = useSelector((store) => store.user)
  const router = useRouter()
  const dropdowns = useSelector((store) => store.dropdowns)
  const branches = useMemo(
    () => getSelectableBranches(userDetails, dropdowns?.branches),
    [userDetails, dropdowns?.branches],
  )
  const [branchId, setBranchId] = useState(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFromDate, setExportFromDate] = useState(dayjs())
  const [exportToDate, setExportToDate] = useState(dayjs())
  const [exportBranchId, setExportBranchId] = useState(ALL_BRANCHES_VALUE)
  const [exportFormat, setExportFormat] = useState('xlsx')
  const [isExporting, setIsExporting] = useState(false)

  const branchOptions = useMemo(
    () => [ALL_BRANCHES_OPTION, ...(branches || [])],
    [branches],
  )

  useEffect(() => {
    const date = router.query.date
    const branchId = router.query.branchId
    if (date) {
      // If date is provided in the query, set it
      setDate(dayjs(date))
    } else {
      setDate(dayjs(new Date()))
      router.push({ query: { date: dayjs(new Date()).format('YYYY-MM-DD') } })
    }
    if (branchId) {
      // If branchId is provided in the query, set it
      setBranchId(parseInt(branchId))
    } else if (branches?.length > 0) {
      setBranchId(branches[0]?.id || null)
    }
  }, [router.query.date, router.query.branchId, branches])
  const { data: allAppointmentsData } = useQuery({
    queryKey: ['allAppointments', userDetails?.accessToken, date, branchId],
    queryFn: async () => {
      dispatch(showLoader())
      const res = await getAllAppointmentsByDate(
        userDetails?.accessToken,
        dayjs(date).format('YYYY-MM-DD'),
        branchId,
      )
      dispatch(hideLoader())
      return res
    },
  })

  function handleDateChange(value) {
    setDate(value)
    router.push({ query: { date: dayjs(value).format('YYYY-MM-DD') } })
  }
  const handleBranchChange = (_, value) => {
    setBranchId(value?.id || null)
    router.push({
      query: {
        date: dayjs(date).format('YYYY-MM-DD'),
        branchId: value?.id || null,
      },
    })
  }

  const openExportDialog = () => {
    setExportFromDate(date ? dayjs(date) : dayjs())
    setExportToDate(date ? dayjs(date) : dayjs())
    setExportBranchId(branchId ?? ALL_BRANCHES_VALUE)
    setExportFormat('xlsx')
    setExportOpen(true)
  }

  const getBranchLabel = useCallback(
    (id) => {
      if (id === ALL_BRANCHES_VALUE) return 'All'
      const branch = branches?.find((b) => b.id === id)
      return branch?.branchCode || branch?.name || ''
    },
    [branches],
  )

  const formatAppointmentRow = useCallback(
    (row) => ({
      appointmentDate: row.appointmentDate
        ? dayjs(row.appointmentDate).format('DD/MM/YYYY')
        : '',
      branch: getBranchLabel(row.branchId),
      patientId: row.patientId || '',
      patientName: row.patientName || '',
      type: row.type || '',
      visitType: row.visitType || '',
      appointmentReason: row.appointmentReason || '',
      stage: STAGE_LABELS[row.stage] || row.stage || '',
      timeStart: row.timeStart || '',
      doctorName: row.doctorName || '',
      isDelayed: row.isDelayed === 'Yes' ? 'Yes' : 'No',
      isPrescribed: row.isPrescribed === 1 ? 'Yes' : 'No',
      noShow: row.noShow === 1 ? 'Yes' : 'No',
      noShowReason: row.noShowReason || '',
    }),
    [getBranchLabel],
  )

  const handleExport = async () => {
    if (!exportFromDate || !exportToDate) {
      toast.error('Please select both from and to dates', toastconfig)
      return
    }
    if (exportFromDate.isAfter(exportToDate, 'day')) {
      toast.error('From date cannot be after to date', toastconfig)
      return
    }

    const queryBranchId =
      exportBranchId === ALL_BRANCHES_VALUE ? null : exportBranchId

    setIsExporting(true)
    dispatch(showLoader())

    try {
      const allRows = []
      let currentDate = exportFromDate.startOf('day')
      const endDate = exportToDate.startOf('day')

      while (!currentDate.isAfter(endDate, 'day')) {
        const dateStr = currentDate.format('YYYY-MM-DD')
        const res = await getAllAppointmentsByDate(
          userDetails?.accessToken,
          dateStr,
          queryBranchId,
        )

        if (res?.status === 200 && Array.isArray(res.data)) {
          allRows.push(...res.data.map(formatAppointmentRow))
        }

        currentDate = currentDate.add(1, 'day')
      }

      if (!allRows.length) {
        toast.info(
          'No appointments found for the selected filters',
          toastconfig,
        )
        return
      }

      exportReport(allRows, APPOINTMENT_EXPORT_COLUMNS, exportFormat, {
        reportName: 'Appointments_Report',
        branchName: getBranchLabel(exportBranchId),
      })

      toast.success('Export downloaded successfully', toastconfig)
      setExportOpen(false)
    } catch (error) {
      toast.error(
        'Failed to export appointments. Please try again.',
        toastconfig,
      )
    } finally {
      setIsExporting(false)
      dispatch(hideLoader())
    }
  }

  const updateStage = useMutation({
    mutationFn: async (payload) => {
      dispatch(showLoader())
      const res = await changeAppointmentStatus(
        userDetails.accessToken,
        payload,
      )
      if (res.status === 200) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
      queryClient.invalidateQueries(['allAppointments'])
      dispatch(hideLoader())
    },
  })

  return (
    <div className="">
      <div className="flex justify-end p-3 gap-4 items-center">
        <div>
          <Autocomplete
            className="w-[120px]"
            options={branches || []}
            getOptionLabel={(option) => option?.branchCode || option?.name}
            value={branches?.find((branch) => branch.id === branchId) || null}
            onChange={handleBranchChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
            clearIcon={null}
          />
        </div>
        <DatePicker
          className="bg-white"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={openExportDialog}
          sx={{ textTransform: 'none', bgcolor: 'white' }}
        >
          Export
        </Button>
      </div>
      <div className="bg-white rounded-lg m-2 border shadow h-[75vh]">
        <Board
          allAppointmentsData={allAppointmentsData}
          updateStage={updateStage}
        />
      </div>

      <Dialog
        open={exportOpen}
        onClose={() => !isExporting && setExportOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Appointments</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-2">
          <div className="flex gap-3 flex-wrap mt-2">
            <DatePicker
              label="From Date"
              value={exportFromDate}
              format="DD/MM/YYYY"
              onChange={(value) =>
                setExportFromDate(value ? dayjs(value) : null)
              }
              slotProps={{
                textField: { size: 'small', fullWidth: true },
              }}
            />
            <DatePicker
              label="To Date"
              value={exportToDate}
              format="DD/MM/YYYY"
              onChange={(value) => setExportToDate(value ? dayjs(value) : null)}
              slotProps={{
                textField: { size: 'small', fullWidth: true },
              }}
            />
          </div>
          <Autocomplete
            options={branchOptions}
            getOptionLabel={(option) =>
              option?.id === ALL_BRANCHES_VALUE
                ? 'All'
                : option?.branchCode || option?.name || ''
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={
              exportBranchId === ALL_BRANCHES_VALUE
                ? ALL_BRANCHES_OPTION
                : branches?.find((b) => b.id === exportBranchId) || null
            }
            onChange={(_, value) => {
              setExportBranchId(value?.id ?? ALL_BRANCHES_VALUE)
            }}
            renderInput={(params) => (
              <TextField {...params} label="Branch" size="small" />
            )}
            clearIcon={null}
          />
          <FormControl>
            <FormLabel>Download Format</FormLabel>
            <RadioGroup
              row
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <FormControlLabel
                value="xlsx"
                control={<Radio />}
                label="Excel"
              />
              <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportOpen(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Download'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default withPermission(Appointments, true, 'appointment', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
