import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'

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

const parseBranchId = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

const Appointments = () => {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [date, setDate] = useState(() => dayjs())
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

  const selectedBranch =
    branches?.find((branch) => String(branch.id) === String(branchId)) || null

  const dateStr = date ? dayjs(date).format('YYYY-MM-DD') : null
  const routerRef = useRef(router)
  routerRef.current = router

  const syncFilterQuery = useCallback((nextDate, nextBranchId) => {
    const currentRouter = routerRef.current
    if (!currentRouter.isReady) return

    const nextDateStr = dayjs(nextDate).format('YYYY-MM-DD')
    const nextBranchStr =
      nextBranchId === null || nextBranchId === undefined || nextBranchId === ''
        ? ''
        : String(nextBranchId)
    const currentDateStr = currentRouter.query.date || ''
    const currentBranchStr =
      currentRouter.query.branchId === undefined ||
      currentRouter.query.branchId === null
        ? ''
        : String(currentRouter.query.branchId)

    if (currentDateStr === nextDateStr && currentBranchStr === nextBranchStr) {
      return
    }

    const query = {
      ...currentRouter.query,
      date: nextDateStr,
    }
    if (nextBranchStr) {
      query.branchId = nextBranchStr
    } else {
      delete query.branchId
    }

    currentRouter.replace(
      {
        pathname: '/appointments',
        query,
      },
      undefined,
      { shallow: true },
    )
  }, [])

  useEffect(() => {
    if (!router.isReady) return

    const routeDate = Array.isArray(router.query.date)
      ? router.query.date[0]
      : router.query.date
    const routeBranchId = Array.isArray(router.query.branchId)
      ? router.query.branchId[0]
      : router.query.branchId

    const nextDate = routeDate ? dayjs(routeDate) : dayjs()
    const parsedRouteBranchId = parseBranchId(routeBranchId)
    const routeBranchAllowed =
      parsedRouteBranchId != null &&
      (!branches?.length ||
        branches.some(
          (branch) => String(branch.id) === String(parsedRouteBranchId),
        ))
    const nextBranchId = routeBranchAllowed
      ? parsedRouteBranchId
      : parseBranchId(branches?.[0]?.id)

    setDate((prev) => (prev && prev.isSame(nextDate, 'day') ? prev : nextDate))
    setBranchId((prev) =>
      String(prev ?? '') === String(nextBranchId ?? '') ? prev : nextBranchId,
    )

    if (!routeDate || !routeBranchAllowed) {
      syncFilterQuery(nextDate, nextBranchId)
    }
  }, [
    router.isReady,
    router.query.date,
    router.query.branchId,
    branches,
    syncFilterQuery,
  ])

  const { data: allAppointmentsData } = useQuery({
    queryKey: ['allAppointments', dateStr, branchId],
    enabled: Boolean(userDetails?.accessToken && dateStr && branchId != null),
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getAllAppointmentsByDate(userDetails?.accessToken, dateStr, branchId),
  })

  const boardAppointmentsData = useMemo(() => {
    if (!allAppointmentsData || branchId == null) return allAppointmentsData
    const rows = allAppointmentsData.data
    if (!Array.isArray(rows)) return allAppointmentsData
    return {
      ...allAppointmentsData,
      data: rows.filter((row) => String(row.branchId) === String(branchId)),
    }
  }, [allAppointmentsData, branchId])

  function handleDateChange(value) {
    if (!value || (typeof value.isValid === 'function' && !value.isValid())) {
      return
    }
    setDate(value)
    syncFilterQuery(value, branchId)
  }

  const handleBranchChange = (_, value) => {
    const nextBranchId = parseBranchId(value?.id)
    setBranchId(nextBranchId)
    syncFilterQuery(date, nextBranchId)
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
      const branch = branches?.find((b) => String(b.id) === String(id))
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
            getOptionLabel={(option) =>
              option?.branchCode || option?.name || ''
            }
            isOptionEqualToValue={(option, value) =>
              String(option?.id) === String(value?.id)
            }
            value={selectedBranch}
            onChange={handleBranchChange}
            renderInput={(params) => <TextField {...params} fullWidth />}
            clearIcon={null}
          />
        </div>
        <DatePicker
          className="bg-white"
          value={date ?? null}
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
          allAppointmentsData={boardAppointmentsData}
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
            isOptionEqualToValue={(option, value) =>
              String(option?.id) === String(value?.id)
            }
            value={
              exportBranchId === ALL_BRANCHES_VALUE
                ? ALL_BRANCHES_OPTION
                : branches?.find(
                    (b) => String(b.id) === String(exportBranchId),
                  ) || null
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
