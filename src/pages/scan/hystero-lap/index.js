import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import {
  Autocomplete,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DataGrid } from '@mui/x-data-grid'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import Close from '@mui/icons-material/Close'
import { getHysteroLapByDate, getHysteroscopyReport } from '@/constants/apis'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import {
  buildHysteroLapPrintHtml,
  openHysteroLapPrintWindow,
} from '@/utils/hysteroLapPrint'

function ScanHysteroLapPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails

  const [date, setDate] = useState()
  const [branchId, setBranchId] = useState()
  const [viewHtml, setViewHtml] = useState(null)
  const [viewTitle, setViewTitle] = useState('')

  useEffect(() => {
    const { date: routeDate, branchId: routeBranchId } = router.query
    if (routeDate !== undefined && routeBranchId !== undefined) {
      setDate(dayjs(routeDate))
      setBranchId(
        routeBranchId === '' || routeBranchId === 'null' ? null : routeBranchId,
      )
    } else if (branches?.length) {
      const d = dayjs()
      setDate(d)
      const bid = branches[0]?.id ?? null
      setBranchId(bid)
      router.replace(
        {
          pathname: '/scan/hystero-lap',
          query: {
            date: d.format('YYYY-MM-DD'),
            branchId: bid ?? '',
          },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.query, branches, router])

  const handleDateChange = (value) => {
    setDate(value)
    router.push(
      {
        pathname: '/scan/hystero-lap',
        query: {
          date: dayjs(value).format('YYYY-MM-DD'),
          branchId: branchId ?? '',
        },
      },
      undefined,
      { shallow: true },
    )
  }

  const onBranchChange = (value) => {
    const id = value?.id ?? null
    setBranchId(id)
    router.push(
      {
        pathname: '/scan/hystero-lap',
        query: {
          date: dayjs(date).format('YYYY-MM-DD'),
          branchId: id ?? '',
        },
      },
      undefined,
      { shallow: true },
    )
  }

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['scanHysteroLapByDate', date, branchId],
    enabled: !!date,
    queryFn: async () => {
      const response = await getHysteroLapByDate(
        user.accessToken,
        `${date.$y}-${date.$M + 1}-${date.$D}`,
        branchId,
      )
      if (response.status === 200) {
        return (response.data || []).map((row, index) => ({
          ...row,
          id:
            row.hysteroscopyId ||
            `${row.appointmentId}-${row.visitId}-${index}`,
          hasReport: Number(row.hasReport) === 1,
        }))
      }
      throw new Error(
        response?.message || 'Could not load Hystero/Lap records for this date',
      )
    },
  })

  const loadReport = useCallback(
    async (row) => {
      if (!row?.hasReport) {
        toast.error(
          'Hystero/Lap report is not saved yet for this appointment',
          toastconfig,
        )
        return null
      }

      const response = await getHysteroscopyReport(
        user.accessToken,
        row.patientId,
        row.visitId,
      )

      if (response.status !== 200 || !response.data) {
        toast.error(
          response?.message || 'Failed to load Hystero/Lap report',
          toastconfig,
        )
        return null
      }

      return Array.isArray(response.data) ? response.data[0] : response.data
    },
    [user.accessToken],
  )

  const openHysteroLapReport = useCallback(
    async (row, mode) => {
      dispatch(showLoader())
      try {
        const report = await loadReport(row)
        if (!report) return

        const reportWithPatient = {
          ...report,
          patientName:
            report.patientName || row.patientName || row.PatientName || '',
          age:
            report.age || report.patientAge || row.age || row.patientAge || '',
        }

        if (mode === 'view') {
          setViewTitle(
            `${report.formType || row.formType || 'Hystero/Lap'} — ${row.patientName}`,
          )
          setViewHtml(buildHysteroLapPrintHtml(reportWithPatient))
          return
        }

        const opened = openHysteroLapPrintWindow(reportWithPatient)
        if (!opened) {
          toast.error('Pop-up blocked. Allow pop-ups to print.', toastconfig)
        }
      } catch (error) {
        console.error(error)
        toast.error(
          'An error occurred while loading the Hystero/Lap report',
          toastconfig,
        )
      } finally {
        dispatch(hideLoader())
      }
    },
    [dispatch, loadReport],
  )

  const columns = [
    {
      field: 'patientName',
      headerName: 'Patient',
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: 'formType',
      headerName: 'Procedure',
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: 'branchCode',
      headerName: 'Branch',
      flex: 0.5,
      minWidth: 80,
    },
    {
      field: 'timeStart',
      headerName: 'Time',
      flex: 0.4,
      minWidth: 70,
    },
    {
      field: 'appointmentReason',
      headerName: 'Reason',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'gynecologist',
      headerName: 'Gynaecologist',
      flex: 0.9,
      minWidth: 130,
    },
    {
      field: 'doctorName',
      headerName: 'Doctor',
      flex: 0.9,
      minWidth: 130,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      minWidth: 120,
      flex: 0.6,
      renderCell: (params) => {
        const canPrint = params.row.hasReport
        return (
          <div className="flex items-center gap-1 h-full">
            <Tooltip title={canPrint ? 'View' : 'Report not saved yet'}>
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => openHysteroLapReport(params.row, 'view')}
                  disabled={!canPrint}
                  aria-label="View Hystero/Lap report"
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={canPrint ? 'Print' : 'Report not saved yet'}>
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => openHysteroLapReport(params.row, 'print')}
                  disabled={!canPrint}
                  aria-label="Print Hystero/Lap report"
                >
                  <PrintOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full h-full p-5 flex gap-5">
      <div className="min-w-80 p-3 h-full flex flex-col gap-3 shadow rounded bg-white overflow-y-auto">
        <Typography
          variant="subtitle2"
          className="text-secondary font-semibold"
        >
          Filters
        </Typography>
        <Autocomplete
          className="w-full text-center"
          options={branches || []}
          getOptionLabel={(option) => option?.branchCode || option?.name}
          value={branches?.find((branch) => branch.id == branchId) || null}
          onChange={(_, value) => onBranchChange(value)}
          renderInput={(params) => (
            <TextField {...params} label="Branch" fullWidth />
          )}
          clearIcon={null}
        />
        <DatePicker
          className="bg-white"
          label="Appointment Date"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
      </div>

      <div className="grow h-full shadow rounded bg-white overflow-hidden flex flex-col p-3">
        <Typography variant="h6" className="mb-2 text-secondary font-semibold">
          Hystero/Lap reports
        </Typography>
        <div
          style={{ height: 'calc(100vh - 220px)', width: '100%' }}
          className="min-h-[400px]"
        >
          <DataGrid
            rows={rows}
            columns={columns}
            loading={isLoading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
            slots={{
              noRowsOverlay: () => (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Hystero/Lap records found for this branch and date
                </div>
              ),
            }}
          />
        </div>
      </div>

      <Dialog
        open={Boolean(viewHtml)}
        onClose={() => {
          setViewHtml(null)
          setViewTitle('')
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="flex justify-between items-center">
          <span>{viewTitle || 'Hystero/Lap Report'}</span>
          <IconButton
            onClick={() => {
              setViewHtml(null)
              setViewTitle('')
            }}
            aria-label="Close"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers className="max-h-[80vh] overflow-auto p-0">
          {viewHtml ? (
            <iframe
              title="Hystero/Lap report preview"
              srcDoc={viewHtml}
              className="w-full min-h-[70vh] border-0"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withPermission(ScanHysteroLapPage, true, 'scanModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
