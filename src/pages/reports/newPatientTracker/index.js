import Breadcrumb from '@/components/Breadcrumb'
import { getAllPatients } from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { exportAsCSV } from '@/utils/reportExport'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React, { useState, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  CircularProgress,
  Button,
  Box,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import DownloadIcon from '@mui/icons-material/Download'
import { useRouter } from 'next/router'

function NewPatientTracker() {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const router = useRouter()
  const { branches } = dropdowns || {}

  // Get default branch - user's branch or first branch
  const defaultBranch = useMemo(() => {
    if (userDetails?.branchDetails?.[0]?.branchCode) {
      return userDetails.branchDetails[0].branchCode
    }
    if (userDetails?.branchId && branches?.length) {
      const userBranch = branches.find((b) => b.id === userDetails.branchId)
      if (userBranch?.branchCode) {
        return userBranch.branchCode
      }
      // Fallback to branch name if branchCode not available
      if (userBranch?.name) {
        return userBranch.name
      }
    }
    // Return first available branch code or name
    const firstBranch = branches?.[0]
    return firstBranch?.branchCode || firstBranch?.name || ''
  }, [userDetails, branches])

  const [selectedBranch, setSelectedBranch] = useState('')
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)

  // Update selected branch when default branch is available
  useEffect(() => {
    if (defaultBranch && !selectedBranch) {
      setSelectedBranch(defaultBranch)
    }
  }, [defaultBranch, selectedBranch])

  // Get active branches for dropdown (defined early so it can be used in trackerData useMemo)
  const activeBranches = useMemo(() => {
    return branches?.filter((branch) => branch.isActive !== false) || []
  }, [branches])

  // Get branch value for display and API
  const getBranchValue = (branch) => {
    return branch.branchCode || branch.name || branch.id
  }

  // Fetch all patients using the existing API
  const {
    data: allPatientsResponse,
    isLoading: isLoadingPatients,
    isError: isErrorPatients,
  } = useQuery({
    queryKey: ['ALL_PATIENTS_FOR_TRACKER', userDetails?.accessToken],
    queryFn: async () => {
      try {
        if (!userDetails?.accessToken) {
          return null
        }
        // Fetch all patients with empty search query to get all patients
        const res = await getAllPatients(userDetails.accessToken, '')
        if (res.status === 200) {
          return res.data || []
        } else {
          console.error('Failed to fetch patients:', res)
          return []
        }
      } catch (error) {
        console.error('Error fetching patients:', error)
        toast.error('Failed to load patient data', toastconfig)
        return []
      }
    },
    enabled: !!userDetails?.accessToken,
  })

  // Filter and transform patient data for the tracker
  const trackerData = useMemo(() => {
    if (!allPatientsResponse || !Array.isArray(allPatientsResponse)) {
      return []
    }

    // Filter patients with no treatment started
    // A patient is "new" if hasTreatment is 0 or false
    const patientsWithNoTreatment = allPatientsResponse.filter((patient) => {
      // Check if patient has treatment using the hasTreatment flag from backend
      const hasTreatment =
        patient.hasTreatment === 1 || patient.hasTreatment === true

      // Patient is new if hasTreatment is false/0
      return !hasTreatment
    })

    // Filter by branch if selected
    let filteredByBranch = patientsWithNoTreatment
    if (selectedBranch) {
      // Find the selected branch object from dropdowns to get its ID
      const selectedBranchObj = activeBranches.find(
        (b) => getBranchValue(b) === selectedBranch,
      )
      const selectedBranchId = selectedBranchObj?.id
      const selectedBranchCode =
        selectedBranchObj?.branchCode || selectedBranchObj?.name

      filteredByBranch = patientsWithNoTreatment.filter((patient) => {
        // Try to match by branchId first (most reliable)
        if (selectedBranchId && patient.branchId) {
          return patient.branchId === selectedBranchId
        }

        // Match by branchCode or branch name
        const patientBranch =
          patient.branch ||
          patient.branchCode ||
          patient.branchName ||
          patient.branchDetails?.branchCode ||
          patient.branchDetails?.name

        if (patientBranch) {
          const branchValue = selectedBranch.toString().toLowerCase().trim()
          const patientBranchValue = patientBranch
            .toString()
            .toLowerCase()
            .trim()
          return (
            patientBranchValue === branchValue ||
            patientBranchValue?.includes(branchValue) ||
            branchValue?.includes(patientBranchValue)
          )
        }

        // If no branch data in patient, include it (show all patients without branch filter)
        return false
      })
    }

    // Filter by date range (from / to) when set
    let filteredByDate = filteredByBranch
    if (fromDate || toDate) {
      const from = fromDate ? dayjs(fromDate).startOf('day') : null
      const to = toDate ? dayjs(toDate).endOf('day') : null
      filteredByDate = filteredByBranch.filter((patient) => {
        const regDate =
          patient.registrationDate ||
          patient.registeredDate ||
          patient.createdAt ||
          patient.dateOfBirth
        if (!regDate) return false
        const d = dayjs(regDate)
        if (from && d.isBefore(from)) return false
        if (to && d.isAfter(to)) return false
        return true
      })
    }

    // Transform data to match table structure
    return filteredByDate.map((patient) => {
      // Get branch name - try to match with dropdown branches first
      let branchName = 'N/A'
      if (patient.branchId && activeBranches.length > 0) {
        const branchObj = activeBranches.find((b) => b.id === patient.branchId)
        if (branchObj) {
          branchName = branchObj.branchCode || branchObj.name || 'N/A'
        }
      }

      // Fallback to direct branch fields if not found in dropdowns
      if (branchName === 'N/A') {
        branchName =
          patient.branch ||
          patient.branchCode ||
          patient.branchName ||
          patient.branchDetails?.name ||
          patient.branchDetails?.branchCode ||
          'N/A'
      }

      // Get patient name
      const patientName =
        patient.Name ||
        patient.patientName ||
        patient.name ||
        `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
        'N/A'

      // Get referral source
      const referralSource =
        patient.referralSource?.referralSource ||
        patient.referralSource ||
        'Unknown'

      // Get registered date (registration date or date of birth or created date)
      const registeredDate =
        patient.registrationDate ||
        patient.registeredDate ||
        patient.createdAt ||
        patient.dateOfBirth ||
        null

      // Get last appointment date (from visits if available)
      let lastAppointmentDate = null
      if (
        patient.visits &&
        Array.isArray(patient.visits) &&
        patient.visits.length > 0
      ) {
        const sortedVisits = patient.visits
          .filter((v) => v.appointmentDate || v.date)
          .sort((a, b) => {
            const dateA = new Date(a.appointmentDate || a.date)
            const dateB = new Date(b.appointmentDate || b.date)
            return dateB - dateA
          })
        if (sortedVisits.length > 0) {
          lastAppointmentDate =
            sortedVisits[0].appointmentDate || sortedVisits[0].date
        }
      }

      // Get last consultation notes (from last visit/consultation)
      let lastConsultationNotes = ''
      if (
        patient.visits &&
        Array.isArray(patient.visits) &&
        patient.visits.length > 0
      ) {
        const consultations = patient.visits
          .filter((v) => v.consultationNotes || v.notes)
          .sort((a, b) => {
            const dateA = new Date(a.appointmentDate || a.date || 0)
            const dateB = new Date(b.appointmentDate || b.date || 0)
            return dateB - dateA
          })
        if (consultations.length > 0) {
          lastConsultationNotes =
            consultations[0].consultationNotes || consultations[0].notes || ''
        }
      }

      return {
        id: patient.patientId || patient.id,
        patientId: patient.patientId || patient.id,
        branch: branchName,
        patientName: patientName,
        referralSource: referralSource,
        registeredDate: registeredDate,
        lastAppointmentDate: lastAppointmentDate,
        lastConsultationNotes: lastConsultationNotes,
        aadhaarNo: patient.aadhaarNo || patient.aadhaar || '',
      }
    })
  }, [
    allPatientsResponse,
    selectedBranch,
    activeBranches,
    getBranchValue,
    fromDate,
    toDate,
  ])

  const isLoading = isLoadingPatients
  const isError = isErrorPatients

  const handleBranchChange = (event) => {
    const newBranch = event.target.value
    setSelectedBranch(newBranch)
  }

  const handlePatientClick = (patientId, aadhaarNo) => {
    router.push({
      pathname: '/patient/register',
      query: { search: patientId || aadhaarNo },
    })
  }

  const handleExport = () => {
    if (!trackerData.length) {
      toast.warning('No data to export', toastconfig)
      return
    }
    // Pre-format dates for CSV: use DD.MM.YYYY so Excel doesn't treat hyphens as subtraction (which causes ########)
    const exportData = trackerData.map((row) => ({
      ...row,
      registeredDate: row.registeredDate
        ? dayjs(row.registeredDate).format('DD.MM.YYYY')
        : 'N/A',
      lastAppointmentDate: row.lastAppointmentDate
        ? dayjs(row.lastAppointmentDate).format('DD.MM.YYYY')
        : 'No Appointments',
    }))
    // Export columns without valueGetter so getCellValue uses the pre-formatted row fields
    const exportColumns = columns.map((col) => {
      if (
        col.field === 'registeredDate' ||
        col.field === 'lastAppointmentDate'
      ) {
        const { valueGetter, ...rest } = col
        return rest
      }
      return col
    })
    exportAsCSV(exportData, exportColumns, {
      reportName: 'New_Patient_Tracker',
      branchName: selectedBranch || undefined,
    })
    toast.success('Export started', toastconfig)
  }

  const columns = [
    {
      field: 'branch',
      headerName: 'Branch',
      flex: 0.8,
      minWidth: 100,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      flex: 1.5,
      minWidth: 200,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        const patientId = params.row.patientId || params.row.id
        const aadhaarNo = params.row.aadhaarNo
        return (
          <Button
            variant="text"
            color="primary"
            onClick={() => handlePatientClick(patientId, aadhaarNo)}
            sx={{
              textTransform: 'none',
              justifyContent: 'flex-start',
              textAlign: 'left',
            }}
          >
            {params.row.patientName || 'N/A'}
          </Button>
        )
      },
    },
    {
      field: 'referralSource',
      headerName: 'Referral Source',
      flex: 1.2,
      minWidth: 150,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        const source = params.row.referralSource || 'Unknown'
        return (
          <>
            {source
              .split(' ')
              .map(
                (word) =>
                  word?.charAt(0)?.toUpperCase() +
                  word?.slice(1)?.toLowerCase(),
              )
              .join(' ')}
          </>
        )
      },
    },
    {
      field: 'registeredDate',
      headerName: 'Registered Date',
      flex: 1,
      minWidth: 130,
      align: 'left',
      headerAlign: 'left',
      valueGetter: (params) => {
        const row = params?.row
        if (!row?.registeredDate) return 'N/A'
        return dayjs(row.registeredDate).format('DD-MM-YYYY')
      },
      renderCell: (params) => {
        if (!params.row.registeredDate) return 'N/A'
        return (
          <div>{dayjs(params.row.registeredDate).format('DD-MM-YYYY')}</div>
        )
      },
    },
    {
      field: 'lastAppointmentDate',
      headerName: 'Last Appointment Date',
      flex: 1.2,
      minWidth: 160,
      align: 'left',
      headerAlign: 'left',
      valueGetter: (params) => {
        const row = params?.row
        if (!row?.lastAppointmentDate) return 'No Appointments'
        return dayjs(row.lastAppointmentDate).format('DD-MM-YYYY')
      },
      renderCell: (params) => {
        if (!params.row.lastAppointmentDate) {
          return <div>No Appointments</div>
        }
        return (
          <div>
            {dayjs(params.row.lastAppointmentDate).format('DD-MM-YYYY')}
          </div>
        )
      },
    },
    {
      field: 'lastConsultationNotes',
      headerName: 'Last Consultation Notes',
      flex: 2,
      minWidth: 250,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => {
        const notes = params.row.lastConsultationNotes
        if (!notes || notes.trim() === '') {
          return <div>No Consultation</div>
        }
        return (
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={notes}
          >
            {notes}
          </div>
        )
      },
    },
  ]

  return (
    <div className="m-5">
      <div className="mb-5">
        <Breadcrumb />
      </div>
      <div className="mb-4">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <FormControl size="small" className="bg-white" sx={{ minWidth: 200 }}>
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              value={selectedBranch || ''}
              onChange={handleBranchChange}
            >
              {activeBranches.map((branch) => {
                const branchValue = getBranchValue(branch)
                const branchLabel =
                  branch.branchCode || branch.name || `Branch ${branch.id}`
                return (
                  <MenuItem key={branch.id} value={branchValue}>
                    {branchLabel}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={(value) => setFromDate(value)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: 'small',
                sx: { bgcolor: 'white', minWidth: 160 },
              },
            }}
          />
          <DatePicker
            label="To Date"
            value={toDate}
            onChange={(value) => setToDate(value)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: {
                size: 'small',
                sx: { bgcolor: 'white', minWidth: 160 },
              },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={!trackerData.length}
            size="medium"
          >
            Export Data
          </Button>
        </Box>
      </div>
      <div>
        {isLoading ? (
          <div
            className="flex justify-center items-center"
            style={{ height: '400px' }}
          >
            <CircularProgress />
          </div>
        ) : (
          <DataGrid
            rows={trackerData}
            columns={columns}
            getRowId={(row) => row.patientId || row.id || Math.random()}
            autoHeight
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            loading={isLoading}
            disableRowSelectionOnClick
          />
        )}
        {isError && (
          <div className="text-red-500 text-center mt-4 p-4">
            <div className="font-semibold mb-2">Error loading patient data</div>
            <div className="text-sm">
              Please refresh the page or try again later.
            </div>
          </div>
        )}
        {!isLoading && !isError && trackerData.length === 0 && (
          <div className="text-gray-500 text-center mt-4 p-4">
            {selectedBranch ? (
              <div>
                <div className="font-semibold mb-2">No new patients found</div>
                <div className="text-sm">
                  No patients without treatment started found for the selected
                  branch.
                </div>
              </div>
            ) : (
              <div>
                <div className="font-semibold mb-2">No patients found</div>
                <div className="text-sm">
                  Please select a branch to view patients.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NewPatientTracker
