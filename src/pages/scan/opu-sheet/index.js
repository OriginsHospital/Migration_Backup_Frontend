import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { Autocomplete, Button, TextField, Typography } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { DataGrid } from '@mui/x-data-grid'
import { getOpuSheetsByDate } from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { toast } from 'react-toastify'
import Modal from '@/components/Modal'
import PickupSheet from '@/components/PickupSheet'
import { openModal } from '@/redux/modalSlice'
import { isOpuSheetExcludedTreatment } from '@/utils/treatmentTypeUtils'

function ScanOpuSheetPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails

  const [date, setDate] = useState()
  const [branchId, setBranchId] = useState()
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedTreatmentCycleId, setSelectedTreatmentCycleId] = useState(null)

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
          pathname: '/scan/opu-sheet',
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
        pathname: '/scan/opu-sheet',
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
        pathname: '/scan/opu-sheet',
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
    queryKey: ['scanOpuSheetsByDate', date, branchId],
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
        response?.message ||
          'Could not load treatment appointments for this date',
      )
    },
  })

  const filteredRows = useMemo(() => {
    const opuEligibleRows = rows.filter(
      (row) => !isOpuSheetExcludedTreatment(row),
    )
    const query = patientSearch.trim().toLowerCase()
    if (!query) return opuEligibleRows
    return opuEligibleRows.filter((row) =>
      String(row.patientName || '')
        .toLowerCase()
        .includes(query),
    )
  }, [rows, patientSearch])

  const openOpuSheet = (treatmentCycleId) => {
    if (!treatmentCycleId) {
      toast.error('Treatment cycle not found for this appointment', toastconfig)
      return
    }
    setSelectedTreatmentCycleId(treatmentCycleId)
    dispatch(openModal('ScanOpuSheetModal'))
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
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      filterable: false,
      minWidth: 160,
      flex: 0.7,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          className="text-secondary capitalize"
          onClick={() => openOpuSheet(params.row.treatmentCycleId)}
        >
          View OPU sheet
        </Button>
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
          OPU sheets — treatment appointments
        </Typography>
        <div
          style={{ height: 'calc(100vh - 220px)', width: '100%' }}
          className="min-h-[400px]"
        >
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => `${row.appointmentId}-${row.treatmentCycleId}`}
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
                    : 'No treatment appointments found for this branch and date'}
                </div>
              ),
            }}
          />
        </div>
      </div>

      <Modal
        uniqueKey="ScanOpuSheetModal"
        maxWidth="xl"
        closeOnOutsideClick={true}
      >
        {selectedTreatmentCycleId ? (
          <PickupSheet TreatmentCycleId={selectedTreatmentCycleId} />
        ) : null}
      </Modal>
    </div>
  )
}

export default ScanOpuSheetPage
