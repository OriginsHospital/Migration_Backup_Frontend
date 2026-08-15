import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Close from '@mui/icons-material/Close'
import { getOpuSheetsByDate } from '@/constants/apis'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import Modal from '@/components/Modal'
import DischargeCard, {
  hasDischargeCardDraft,
  resolveDischargeCardData,
} from '@/components/DischargeCard'
import { openModal } from '@/redux/modalSlice'
import {
  buildDischargeCardPrintHtml,
  openDischargeCardPrintWindow,
} from '@/utils/dischargeCardPrint'

function ScanDischargeCardPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails

  const [date, setDate] = useState()
  const [branchId, setBranchId] = useState()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [viewHtml, setViewHtml] = useState(null)
  const [viewTitle, setViewTitle] = useState('')
  const [draftTick, setDraftTick] = useState(0)

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
          pathname: '/scan/discharge-card',
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
        pathname: '/scan/discharge-card',
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
        pathname: '/scan/discharge-card',
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
    queryKey: ['scanDischargeCardByDate', date, branchId],
    enabled: !!date,
    queryFn: async () => {
      const response = await getOpuSheetsByDate(
        user.accessToken,
        `${date.$y}-${date.$M + 1}-${date.$D}`,
        branchId,
      )
      if (response.status === 200) {
        return response.data || []
      }
      throw new Error(
        response?.message || 'Could not load appointments for this date',
      )
    },
  })

  const filteredRows = useMemo(() => {
    const query = patientSearch.trim().toLowerCase()
    const withDraftFlag = rows.map((row) => ({
      ...row,
      hasDraft: hasDischargeCardDraft(row.patientId, row.treatmentCycleId),
    }))
    if (!query) return withDraftFlag
    return withDraftFlag.filter((row) =>
      String(row.patientName || '')
        .toLowerCase()
        .includes(query),
    )
  }, [rows, patientSearch, draftTick])

  const openEditor = (row) => {
    if (!row?.patientId) {
      toast.error('Patient not found for this appointment', toastconfig)
      return
    }
    setSelectedPatient(row)
    dispatch(openModal('ScanDischargeCardModal'))
  }

  const openDischargeCard = useCallback(
    (row, mode) => {
      const cardData = resolveDischargeCardData(row, row.treatmentCycleId, user)

      if (mode === 'view') {
        setViewTitle(`Discharge Card — ${row.patientName || 'Patient'}`)
        setViewHtml(buildDischargeCardPrintHtml(cardData))
        return
      }

      const opened = openDischargeCardPrintWindow(cardData)
      if (!opened) {
        toast.error('Pop-up blocked. Allow pop-ups to print.', toastconfig)
      }
    },
    [user],
  )

  const printPreview = () => {
    if (!viewHtml) return
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      toast.error('Pop-up blocked. Allow pop-ups to print.', toastconfig)
      return
    }
    printWindow.document.write(viewHtml)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
  }

  const columns = [
    {
      field: 'patientName',
      headerName: 'Patient',
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: 'appointmentReason',
      headerName: 'Reason',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'doctorName',
      headerName: 'Doctor',
      flex: 0.9,
      minWidth: 130,
    },
    {
      field: 'timeStart',
      headerName: 'Time',
      flex: 0.5,
      minWidth: 90,
      valueGetter: (value, row) => {
        if (!row) return value ?? ''
        if (row.timeStart && row.timeEnd) {
          return `${row.timeStart} – ${row.timeEnd}`
        }
        return row.timeStart || ''
      },
    },
    {
      field: 'hasDraft',
      headerName: 'Draft',
      flex: 0.4,
      minWidth: 80,
      valueGetter: (value, row) => (row?.hasDraft ? 'Saved' : '—'),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      minWidth: 150,
      flex: 0.7,
      renderCell: (params) => (
        <div className="flex items-center gap-1 h-full">
          <Tooltip title="View / Print preview">
            <IconButton
              size="small"
              color="primary"
              onClick={() => openDischargeCard(params.row, 'view')}
              aria-label="View discharge card"
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Print">
            <IconButton
              size="small"
              color="primary"
              onClick={() => openDischargeCard(params.row, 'print')}
              aria-label="Print discharge card"
            >
              <PrintOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit discharge card">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => openEditor(params.row)}
              aria-label="Edit discharge card"
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ),
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
          label="Appointment date"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
        <TextField
          label="Patient name"
          value={patientSearch}
          onChange={(e) => setPatientSearch(e.target.value)}
          fullWidth
          placeholder="Search by patient name"
        />
      </div>

      <div className="grow h-full shadow rounded bg-white overflow-hidden flex flex-col p-3">
        <Typography variant="h6" className="mb-2 text-secondary font-semibold">
          Discharge Card — appointments
        </Typography>
        <div
          style={{ height: 'calc(100vh - 220px)', width: '100%' }}
          className="min-h-[400px]"
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={isLoading}
            getRowId={(row) =>
              `${row.appointmentId}-${row.treatmentCycleId || row.patientId}`
            }
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
            slots={{
              noRowsOverlay: () => (
                <div className="flex items-center justify-center h-full text-gray-400">
                  {patientSearch.trim()
                    ? 'No patients match your search for this branch and date'
                    : 'No appointments found for this branch and date'}
                </div>
              ),
            }}
          />
        </div>
      </div>

      <Modal
        uniqueKey="ScanDischargeCardModal"
        maxWidth="md"
        closeOnOutsideClick={true}
        onOutsideClick={() => setDraftTick((tick) => tick + 1)}
      >
        {selectedPatient ? (
          <DischargeCard
            patientInfo={selectedPatient}
            treatmentCycleId={selectedPatient.treatmentCycleId}
            onAfterClose={() => setDraftTick((tick) => tick + 1)}
          />
        ) : null}
      </Modal>

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
          <span>{viewTitle || 'Discharge Card'}</span>
          <div className="flex items-center gap-1">
            <Tooltip title="Print">
              <IconButton
                onClick={printPreview}
                aria-label="Print from preview"
                color="primary"
              >
                <PrintOutlinedIcon />
              </IconButton>
            </Tooltip>
            <IconButton
              onClick={() => {
                setViewHtml(null)
                setViewTitle('')
              }}
              aria-label="Close"
            >
              <Close />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent dividers className="max-h-[80vh] overflow-auto p-0">
          {viewHtml ? (
            <iframe
              title="Discharge card preview"
              srcDoc={viewHtml}
              className="w-full min-h-[70vh] border-0"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withPermission(ScanDischargeCardPage, true, 'scanModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
