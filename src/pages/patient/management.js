import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tabs,
  Tab,
  TextField,
  Chip,
  IconButton,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  LocalHospital as LocalHospitalIcon,
  CalendarToday as CalendarTodayIcon,
  History as HistoryIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Bolt as BoltIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import {
  getAllPatients,
  getAppointmentsByPatient,
  getPatientVisits,
  getConsultationsHistoryByVisitId,
  getTreatmentsHistoryByVisitId,
  getPatientTreatmentCycles,
  getNotesHistoryByVisitId,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { CircularProgress, Alert } from '@mui/material'

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

function PatientManagement() {
  const user = useSelector((store) => store.user)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [activeTab, setActiveTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('')
  const [followUpComment, setFollowUpComment] = useState('')

  const handleSearch = () => {
    setAppliedSearchQuery(searchQuery.trim())
  }

  // Fetch all patients
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['allPatientsManagement', appliedSearchQuery],
    queryFn: () => getAllPatients(user?.accessToken, appliedSearchQuery),
    enabled: !!user?.accessToken,
  })

  // Fetch patient visits for medical history
  const { data: visitsData, isLoading: isLoadingVisits } = useQuery({
    queryKey: ['patientVisits', selectedPatient?.patientId],
    queryFn: () =>
      getPatientVisits(user?.accessToken, selectedPatient?.patientId),
    enabled: !!selectedPatient?.patientId && !!user?.accessToken,
  })

  // Parse and get patient details from visits data
  const patientDetailsFromVisits = useMemo(() => {
    if (!visitsData) return null

    // Log for debugging
    console.log('Visits Data Response:', visitsData)

    // Handle different response structures
    let patientDetails = null

    // Case 1: response.data is an array with patientDetails
    if (Array.isArray(visitsData.data) && visitsData.data.length > 0) {
      const firstItem = visitsData.data[0]
      // Check if it has patientDetails property or is the patientDetails itself
      patientDetails = firstItem?.patientDetails || firstItem
    }
    // Case 2: response.data.patientDetails directly
    else if (visitsData.data?.patientDetails) {
      patientDetails = visitsData.data.patientDetails
    }
    // Case 3: response.data is the patientDetails object itself
    else if (
      visitsData.data &&
      (visitsData.data.patientId || visitsData.data.patientName)
    ) {
      patientDetails = visitsData.data
    }

    // If patientDetails is a string, parse it
    if (typeof patientDetails === 'string') {
      try {
        patientDetails = JSON.parse(patientDetails)
      } catch (e) {
        console.error('Error parsing patientDetails:', e)
        return null
      }
    }

    console.log('Parsed Patient Details:', patientDetails)
    return patientDetails
  }, [visitsData])

  // Get active visit ID
  const activeVisit = useMemo(() => {
    if (!patientDetailsFromVisits?.visitDetails) return null

    // Handle visitDetails as array or string
    let visits = patientDetailsFromVisits.visitDetails
    if (typeof visits === 'string') {
      try {
        visits = JSON.parse(visits)
      } catch (e) {
        console.error('Error parsing visitDetails:', e)
        return null
      }
    }

    if (!Array.isArray(visits) || visits.length === 0) return null

    return visits.find((v) => v.isActive) || visits[0]
  }, [patientDetailsFromVisits])

  // Fetch consultations history for medical history
  const { data: consultationsData, isLoading: isLoadingConsultations } =
    useQuery({
      queryKey: ['consultationsHistory', activeVisit?.visitId],
      queryFn: () =>
        getConsultationsHistoryByVisitId(
          user?.accessToken,
          activeVisit?.visitId,
        ),
      enabled: !!activeVisit?.visitId && !!user?.accessToken,
    })

  // Fetch treatments history for medical history
  const { data: treatmentsHistoryData, isLoading: isLoadingTreatmentsHistory } =
    useQuery({
      queryKey: ['treatmentsHistory', activeVisit?.visitId],
      queryFn: () =>
        getTreatmentsHistoryByVisitId(user?.accessToken, activeVisit?.visitId),
      enabled: !!activeVisit?.visitId && !!user?.accessToken,
    })

  // Fetch treatment cycles for treatment plan
  const { data: treatmentCyclesData, isLoading: isLoadingTreatmentCycles } =
    useQuery({
      queryKey: ['patientTreatmentCycles', selectedPatient?.patientId],
      queryFn: () =>
        getPatientTreatmentCycles(
          user?.accessToken,
          selectedPatient?.patientId || '',
        ),
      enabled: !!selectedPatient?.patientId && !!user?.accessToken,
    })

  // Filter treatment cycles for the selected patient
  const filteredTreatmentCycles = useMemo(() => {
    if (!treatmentCyclesData || !selectedPatient?.patientId) {
      console.log('Treatment Cycles - No data or patient:', {
        hasData: !!treatmentCyclesData,
        patientId: selectedPatient?.patientId,
      })
      return []
    }

    // Handle different response structures
    let cycles = []
    if (Array.isArray(treatmentCyclesData.data)) {
      cycles = treatmentCyclesData.data
    } else if (Array.isArray(treatmentCyclesData)) {
      cycles = treatmentCyclesData
    } else if (
      treatmentCyclesData.data &&
      Array.isArray(treatmentCyclesData.data)
    ) {
      cycles = treatmentCyclesData.data
    }

    console.log('Treatment Cycles Raw Data:', {
      rawData: treatmentCyclesData,
      cyclesCount: cycles.length,
      selectedPatientId: selectedPatient.patientId,
    })

    // Filter by patientId to ensure we only show cycles for the selected patient
    const filtered = cycles.filter(
      (cycle) =>
        cycle.patientId === selectedPatient.patientId ||
        cycle.patientId === selectedPatient.id ||
        (cycle.patientName &&
          selectedPatient.Name &&
          cycle.patientName
            .toLowerCase()
            .includes(selectedPatient.Name.toLowerCase())),
    )

    console.log('Filtered Treatment Cycles:', filtered)
    return filtered
  }, [treatmentCyclesData, selectedPatient])

  // Fetch appointments for selected patient
  // Note: API expects internal database ID (id), not patientId string
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery(
    {
      queryKey: [
        'patientAppointments',
        selectedPatient?.id || selectedPatient?.patientId,
      ],
      queryFn: () => {
        // Use internal ID if available, otherwise fallback to patientId
        const patientIdentifier =
          selectedPatient?.id || selectedPatient?.patientId
        console.log('Fetching appointments for patient:', {
          id: selectedPatient?.id,
          patientId: selectedPatient?.patientId,
          using: patientIdentifier,
        })
        return getAppointmentsByPatient(user?.accessToken, patientIdentifier)
      },
      enabled:
        !!(selectedPatient?.id || selectedPatient?.patientId) &&
        !!user?.accessToken,
    },
  )

  // Process appointments data
  const processedAppointments = useMemo(() => {
    if (!appointmentsData) {
      console.log('Appointments - No data')
      return []
    }

    console.log('Appointments Raw Response:', appointmentsData)

    // Handle different response structures
    let appointments = []
    if (Array.isArray(appointmentsData.data)) {
      appointments = appointmentsData.data
    } else if (Array.isArray(appointmentsData)) {
      appointments = appointmentsData
    } else if (
      appointmentsData.status === 200 &&
      Array.isArray(appointmentsData.data)
    ) {
      appointments = appointmentsData.data
    }

    console.log('Processed Appointments:', appointments)
    return appointments
  }, [appointmentsData])

  // Get last appointment (most recent by date)
  const lastAppointment = useMemo(() => {
    if (!processedAppointments || processedAppointments.length === 0)
      return null

    // Sort by appointment date descending and get the first one
    const sorted = [...processedAppointments].sort((a, b) => {
      const dateA = a.appointmentDate
        ? new Date(a.appointmentDate)
        : new Date(0)
      const dateB = b.appointmentDate
        ? new Date(b.appointmentDate)
        : new Date(0)
      return dateB - dateA
    })

    return sorted[0]
  }, [processedAppointments])

  // Fetch notes history for follow-up
  const { data: notesHistoryData, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notesHistory', activeVisit?.visitId],
    queryFn: () =>
      getNotesHistoryByVisitId(user?.accessToken, activeVisit?.visitId),
    enabled: !!activeVisit?.visitId && !!user?.accessToken,
  })

  // Filter notes to remove entries with Admin, N/A, or HTML content
  const filteredNotesHistory = useMemo(() => {
    if (!notesHistoryData?.data || !Array.isArray(notesHistoryData.data)) {
      return []
    }

    return notesHistoryData.data.filter((note) => {
      const author = note.createdByName || note.author || ''
      const timestamp = note.createdAt || note.timestamp || ''
      const notes = note.notes || note.comment || ''

      // Check if it's an unwanted entry
      const isAdmin = author === 'Admin' || author.toLowerCase() === 'admin'
      const isNA = timestamp === 'N/A' || timestamp.toLowerCase() === 'n/a'
      const hasHTML = /<[^>]+>/.test(notes) // Check for HTML tags

      // Filter out entries that match unwanted criteria
      // Remove if it's Admin with N/A timestamp, or if it contains HTML
      if ((isAdmin && isNA) || hasHTML) {
        return false
      }

      return true
    })
  }, [notesHistoryData])

  const patients = patientsData?.data || []

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient)
    setActiveTab(0) // Reset to first tab
  }

  const handleAddFollowUpComment = () => {
    if (followUpComment.trim()) {
      // TODO: Implement API call to save follow-up comment
      console.log('Adding follow-up comment:', followUpComment)
      setFollowUpComment('')
      // You would typically call an API here to save the comment
    }
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    return dayjs().diff(dayjs(dateOfBirth), 'year')
  }

  // Get last visit date
  const getLastVisit = (patient) => {
    // This would typically come from patient data or visits
    // For now, using registeredDate as placeholder
    return patient.registeredDate
      ? dayjs(patient.registeredDate).format('M/D/YYYY')
      : 'N/A'
  }

  // Mock follow-up comments data (replace with actual API call)
  const followUpComments = [
    {
      id: 1,
      author: 'Admin',
      authorAvatar: null,
      comment: 'Test',
      timestamp: '12/19/2025, 6:32:02 PM',
    },
    {
      id: 2,
      author: 'Dr. Emily Carter',
      authorAvatar: null,
      comment:
        'Patient called to report mild bloating after starting FSH injections. Reassured her this is a common side effect. Advised to monitor for severe symptoms and drink plenty of fluids. Scheduled a follow-up call for tomorrow.',
      timestamp: '6/20/2024, 5:30:00 AM',
    },
    {
      id: 3,
      author: 'Admin',
      authorAvatar: null,
      comment:
        'Follow-up call with Sarah. She reports symptoms have not worsened. She feels less anxious after our conversation. Confirmed her next ultrasound appointment.',
      timestamp: '6/21/2024, 5:30:00 AM',
    },
  ]

  // Patient List View
  if (!selectedPatient) {
    return (
      <Box sx={{ p: 4, bgcolor: '#F5F7FA', minHeight: '100vh' }}>
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, color: '#1A202C', mb: 1 }}
            >
              Patient Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Maintain detailed patient records, including medical history and
              treatment plans.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              bgcolor: '#2196F3',
              '&:hover': { bgcolor: '#1976D2' },
              textTransform: 'none',
              px: 3,
            }}
          >
            Add Patient
          </Button>
        </Box>

        <Card sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              All Patients
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              A list of all patients in the clinic.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <TextField
                placeholder="Search by Patient ID / Mobile / Name / Aadhaar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                size="small"
                sx={{ width: 300 }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
                sx={{ ml: 1, textTransform: 'none' }}
              >
                Search
              </Button>
            </Box>

            {isLoadingPatients ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F7FAFC' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Age</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        Assigned Doctor
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Visit</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No patients found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      patients.map((patient) => (
                        <TableRow
                          key={patient.patientId}
                          hover
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#F7FAFC' },
                          }}
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              <Avatar
                                src={patient.photoPath}
                                alt={patient.Name}
                                sx={{ width: 40, height: 40 }}
                              />
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {patient.Name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  {patient.email || `${patient.mobileNo || ''}`}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {calculateAge(patient.dateOfBirth)} years old
                          </TableCell>
                          <TableCell>
                            {patient.assignedDoctor || 'Not assigned'}
                          </TableCell>
                          <TableCell>{getLastVisit(patient)}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePatientSelect(patient)
                              }}
                            >
                              <ArrowForwardIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Patient Detail View
  return (
    <Box sx={{ p: 4, bgcolor: '#F5F7FA', minHeight: '100vh' }}>
      <Button
        startIcon={<ArrowForwardIcon sx={{ transform: 'rotate(180deg)' }} />}
        onClick={() => setSelectedPatient(null)}
        sx={{ mb: 3, textTransform: 'none' }}
      >
        Back to Patients
      </Button>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Left: Patient Profile Card */}
        <Card
          sx={{
            width: 350,
            bgcolor: 'white',
            borderRadius: 2,
            boxShadow: 2,
            height: 'fit-content',
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={selectedPatient.photoPath}
              alt={selectedPatient.Name}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                border: '3px solid #E2E8F0',
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {selectedPatient.Name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Patient ID: {selectedPatient.patientId}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'left' }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <CakeIcon sx={{ color: '#718096', fontSize: 20 }} />
                <Typography variant="body2">
                  {calculateAge(selectedPatient.dateOfBirth)} years old
                </Typography>
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <EmailIcon sx={{ color: '#718096', fontSize: 20 }} />
                <Typography
                  variant="body2"
                  component="a"
                  href={`mailto:${selectedPatient.email || ''}`}
                  sx={{
                    color: '#2196F3',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {selectedPatient.email || 'N/A'}
                </Typography>
              </Box>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
              >
                <PhoneIcon sx={{ color: '#718096', fontSize: 20 }} />
                <Typography variant="body2">
                  {selectedPatient.mobileNo || 'N/A'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalHospitalIcon sx={{ color: '#718096', fontSize: 20 }} />
                <Typography variant="body2">
                  {selectedPatient.assignedDoctor || 'Dr. Not Assigned'}
                </Typography>
              </Box>
            </Box>

            {/* Last Appointment History */}
            {lastAppointment && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 2, color: '#2D3748' }}
                  >
                    Last Appointment
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {lastAppointment.appointmentDate
                        ? dayjs(lastAppointment.appointmentDate).format(
                            'DD MMM YYYY',
                          )
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Time
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {lastAppointment.timeStart && lastAppointment.timeEnd
                        ? `${lastAppointment.timeStart} - ${lastAppointment.timeEnd}`
                        : lastAppointment.timeStart || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Type
                    </Typography>
                    <Chip
                      label={lastAppointment.type || 'N/A'}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor:
                          lastAppointment.type === 'Consultation'
                            ? '#E3F2FD'
                            : '#FFF3E0',
                        color:
                          lastAppointment.type === 'Consultation'
                            ? '#1976D2'
                            : '#F57C00',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                  {lastAppointment.appointmentReason && (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Reason
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {lastAppointment.appointmentReason}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={lastAppointment.stage || 'Scheduled'}
                        size="small"
                        sx={{
                          bgcolor:
                            lastAppointment.stage === 'Done'
                              ? '#E8F5E9'
                              : lastAppointment.stage === 'Seen'
                                ? '#FFF3E0'
                                : lastAppointment.stage === 'Doctor'
                                  ? '#E3F2FD'
                                  : '#F3E5F5',
                          color:
                            lastAppointment.stage === 'Done'
                              ? '#2E7D32'
                              : lastAppointment.stage === 'Seen'
                                ? '#F57C00'
                                : lastAppointment.stage === 'Doctor'
                                  ? '#1976D2'
                                  : '#7B1FA2',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right: Patient Details Tabs */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ bgcolor: 'white', borderRadius: 2, boxShadow: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 500,
                    minHeight: 64,
                  },
                }}
              >
                <Tab
                  icon={<HistoryIcon />}
                  iconPosition="start"
                  label="Medical History"
                />
                <Tab
                  icon={<AssignmentIcon />}
                  iconPosition="start"
                  label="Treatment Plan"
                />
                <Tab
                  icon={<EventNoteIcon />}
                  iconPosition="start"
                  label="Appointments"
                />
                <Tab
                  icon={<CommentIcon />}
                  iconPosition="start"
                  label="Follow-up"
                />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Medical History Tab */}
              <TabPanel value={activeTab} index={0}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Medical History
                </Typography>

                {isLoadingVisits ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : patientDetailsFromVisits ? (
                  <Box>
                    {/* Patient Basic Info */}
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 1 }}
                      >
                        Patient Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Name:</strong>{' '}
                        {patientDetailsFromVisits.patientName ||
                          selectedPatient.Name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>DOB:</strong>{' '}
                        {patientDetailsFromVisits.dob
                          ? dayjs(patientDetailsFromVisits.dob).format(
                              'DD/MM/YYYY',
                            )
                          : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Mobile:</strong>{' '}
                        {patientDetailsFromVisits.mobileNumber ||
                          selectedPatient.mobileNo ||
                          'N/A'}
                      </Typography>
                      {patientDetailsFromVisits.email && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Email:</strong>{' '}
                          {patientDetailsFromVisits.email}
                        </Typography>
                      )}
                    </Box>

                    {/* Visits */}
                    {(() => {
                      let visitDetails = patientDetailsFromVisits.visitDetails
                      if (typeof visitDetails === 'string') {
                        try {
                          visitDetails = JSON.parse(visitDetails)
                        } catch (e) {
                          visitDetails = null
                        }
                      }
                      return Array.isArray(visitDetails) &&
                        visitDetails.length > 0 ? (
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 2 }}
                          >
                            Visit History
                          </Typography>
                          {visitDetails.map((visit, idx) => (
                            <Card
                              key={idx}
                              sx={{
                                mb: 2,
                                p: 2,
                                bgcolor: visit.isActive ? '#F0F9FF' : '#FAFAFA',
                                border: visit.isActive
                                  ? '1px solid #BAE6FD'
                                  : '1px solid #E2E8F0',
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {visit.visitType || 'Visit'}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Date:{' '}
                                    {visit.visitDate
                                      ? dayjs(visit.visitDate).format(
                                          'DD/MM/YYYY',
                                        )
                                      : 'N/A'}
                                  </Typography>
                                  {visit.packageChosen && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Package: {visit.packageChosen}
                                    </Typography>
                                  )}
                                </Box>
                                {visit.isActive && (
                                  <Chip
                                    label="Active"
                                    size="small"
                                    sx={{ bgcolor: '#2196F3', color: 'white' }}
                                  />
                                )}
                              </Box>
                            </Card>
                          ))}
                        </Box>
                      ) : null
                    })()}

                    {/* Consultations */}
                    {isLoadingConsultations ? (
                      <CircularProgress size={24} />
                    ) : (
                      consultationsData?.data?.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 2 }}
                          >
                            Consultations
                          </Typography>
                          {consultationsData.data.map((consultation, idx) => (
                            <Card
                              key={idx}
                              sx={{ mb: 2, p: 2, bgcolor: '#FAFAFA' }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {consultation.consultationType ||
                                  'Consultation'}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Date:{' '}
                                {consultation.consultationDate
                                  ? dayjs(consultation.consultationDate).format(
                                      'DD/MM/YYYY',
                                    )
                                  : 'N/A'}
                              </Typography>
                            </Card>
                          ))}
                        </Box>
                      )
                    )}

                    {/* Treatments */}
                    {isLoadingTreatmentsHistory ? (
                      <CircularProgress size={24} />
                    ) : (
                      treatmentsHistoryData?.data?.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600, mb: 2 }}
                          >
                            Treatments
                          </Typography>
                          {treatmentsHistoryData.data.map((treatment, idx) => (
                            <Card
                              key={idx}
                              sx={{ mb: 2, p: 2, bgcolor: '#FAFAFA' }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {treatment.treatmentType || 'Treatment'}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Date:{' '}
                                {treatment.treatmentDate
                                  ? dayjs(treatment.treatmentDate).format(
                                      'DD/MM/YYYY',
                                    )
                                  : 'N/A'}
                              </Typography>
                            </Card>
                          ))}
                        </Box>
                      )
                    )}

                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          window.open(
                            `/patient?patientHistoryId=${selectedPatient.patientId}&activeVisitId=${activeVisit?.visitId || selectedPatient.activeVisitId}`,
                            '_blank',
                          )
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        View Detailed Medical History
                      </Button>
                    </Box>
                  </Box>
                ) : visitsData?.status === 200 ? (
                  <Alert severity="info">
                    Patient has no visit history yet. Medical history will
                    appear here once visits are recorded in the system.
                  </Alert>
                ) : visitsData?.status && visitsData?.status !== 200 ? (
                  <Alert severity="warning">
                    {visitsData?.message ||
                      'Unable to fetch medical history. Please try again later.'}
                  </Alert>
                ) : (
                  <Alert severity="info">
                    No medical history data available. If this patient has
                    visits, please ensure they are properly recorded in the
                    system.
                  </Alert>
                )}
              </TabPanel>

              {/* Treatment Plan Tab */}
              <TabPanel value={activeTab} index={1}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Treatment Plan
                </Typography>

                {isLoadingTreatmentCycles ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : filteredTreatmentCycles?.length > 0 ? (
                  <Box>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#F7FAFC' }}>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Treatment
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Registration
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Day 1
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Pick Up
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Hysteroscopy
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              Day 5 Freezing
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>FET</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>ERA</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              UPT Positive
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredTreatmentCycles.map((cycle, idx) => (
                            <TableRow key={cycle.visitId || idx} hover>
                              <TableCell>
                                <Chip
                                  label={cycle.treatmentName || 'N/A'}
                                  size="small"
                                  sx={{
                                    bgcolor: '#E3F2FD',
                                    color: '#1976D2',
                                    fontWeight: 600,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.registrationDate || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.day1Date || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.pickUpDate || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.hysteroscopyDate || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.day5FreezingDate || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.fetDate || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.eraDate || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {cycle.uptPositiveDate || '-'}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          window.open(
                            `/patient/treatmentcycles?patientId=${selectedPatient.patientId}`,
                            '_blank',
                          )
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        View All Treatment Cycles
                      </Button>
                    </Box>
                  </Box>
                ) : treatmentCyclesData?.status === 200 ? (
                  <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      No active treatment cycles found for this patient.
                      Treatment plan information will appear here once a
                      treatment cycle is initiated.
                    </Alert>
                    <Card
                      sx={{
                        bgcolor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: 2,
                        p: 3,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        Treatment Plan Overview
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        Starting second IVF cycle with an antagonist protocol.
                        Follicle-stimulating hormone (FSH) injections daily.
                        Regular monitoring via ultrasound and blood tests.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Treatment cycles will be displayed here once they are
                        initiated and recorded in the system.
                      </Typography>
                    </Card>
                  </Box>
                ) : treatmentCyclesData?.status &&
                  treatmentCyclesData?.status !== 200 ? (
                  <Alert severity="warning">
                    {treatmentCyclesData?.message ||
                      'Unable to fetch treatment cycles. Please try again later.'}
                  </Alert>
                ) : (
                  <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                      No treatment cycles data available. Please ensure
                      treatment cycles are properly recorded in the system.
                    </Alert>
                    <Card
                      sx={{
                        bgcolor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: 2,
                        p: 3,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 2 }}
                      >
                        Treatment Plan Overview
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Starting second IVF cycle with an antagonist protocol.
                        Follicle-stimulating hormone (FSH) injections daily.
                        Regular monitoring via ultrasound and blood tests.
                      </Typography>
                    </Card>
                  </Box>
                )}
              </TabPanel>

              {/* Appointments Tab */}
              <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Patient Appointments
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  A list of past and upcoming appointments for{' '}
                  {selectedPatient.Name}.
                </Typography>

                {/* Last Appointment History Card */}
                {lastAppointment && !isLoadingAppointments && (
                  <Card
                    sx={{
                      mb: 3,
                      bgcolor: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      borderRadius: 2,
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          Last Appointment History
                        </Typography>
                        <Chip
                          label={lastAppointment.stage || 'Scheduled'}
                          size="small"
                          sx={{
                            bgcolor:
                              lastAppointment.stage === 'Done'
                                ? '#E8F5E9'
                                : lastAppointment.stage === 'Seen'
                                  ? '#FFF3E0'
                                  : lastAppointment.stage === 'Doctor'
                                    ? '#E3F2FD'
                                    : '#F3E5F5',
                            color:
                              lastAppointment.stage === 'Done'
                                ? '#2E7D32'
                                : lastAppointment.stage === 'Seen'
                                  ? '#F57C00'
                                  : lastAppointment.stage === 'Doctor'
                                    ? '#1976D2'
                                    : '#7B1FA2',
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Date
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {lastAppointment.appointmentDate
                              ? dayjs(lastAppointment.appointmentDate).format(
                                  'DD MMMM YYYY',
                                )
                              : 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Time
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {lastAppointment.timeStart &&
                            lastAppointment.timeEnd
                              ? `${lastAppointment.timeStart} - ${lastAppointment.timeEnd}`
                              : lastAppointment.timeStart || 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Type
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={lastAppointment.type || 'N/A'}
                              size="small"
                              sx={{
                                bgcolor:
                                  lastAppointment.type === 'Consultation'
                                    ? '#E3F2FD'
                                    : '#FFF3E0',
                                color:
                                  lastAppointment.type === 'Consultation'
                                    ? '#1976D2'
                                    : '#F57C00',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </Box>
                        {lastAppointment.visitType && (
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Visit Type
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {lastAppointment.visitType}
                            </Typography>
                          </Box>
                        )}
                        {lastAppointment.appointmentReason && (
                          <Box>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Reason
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {lastAppointment.appointmentReason}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {isLoadingAppointments ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : processedAppointments?.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#F7FAFC' }}>
                          <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            Visit Type
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {processedAppointments.map((appointment, index) => (
                          <TableRow
                            key={appointment.appointmentId || index}
                            hover
                          >
                            <TableCell>
                              <Typography variant="body2">
                                {appointment.appointmentDate
                                  ? dayjs(appointment.appointmentDate).format(
                                      'DD/MM/YYYY',
                                    )
                                  : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {appointment.timeStart
                                  ? `${appointment.timeStart}${appointment.timeEnd ? ` - ${appointment.timeEnd}` : ''}`
                                  : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={appointment.type || 'N/A'}
                                size="small"
                                sx={{
                                  bgcolor:
                                    appointment.type === 'Consultation'
                                      ? '#E3F2FD'
                                      : '#FFF3E0',
                                  color:
                                    appointment.type === 'Consultation'
                                      ? '#1976D2'
                                      : '#F57C00',
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {appointment.visitType || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {appointment.appointmentReason || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={appointment.stage || 'Scheduled'}
                                size="small"
                                sx={{
                                  bgcolor:
                                    appointment.stage === 'Done'
                                      ? '#E8F5E9'
                                      : appointment.stage === 'Seen'
                                        ? '#FFF3E0'
                                        : appointment.stage === 'Doctor'
                                          ? '#E3F2FD'
                                          : '#F3E5F5',
                                  color:
                                    appointment.stage === 'Done'
                                      ? '#2E7D32'
                                      : appointment.stage === 'Seen'
                                        ? '#F57C00'
                                        : appointment.stage === 'Doctor'
                                          ? '#1976D2'
                                          : '#7B1FA2',
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : appointmentsData?.status === 200 ? (
                  <Alert severity="info">
                    No appointments found for this patient. Appointments will
                    appear here once they are scheduled and recorded in the
                    system.
                  </Alert>
                ) : appointmentsData?.status &&
                  appointmentsData?.status !== 200 ? (
                  <Alert severity="warning">
                    {appointmentsData?.message ||
                      'Unable to fetch appointments. Please try again later.'}
                  </Alert>
                ) : (
                  <Alert severity="info">
                    No appointments data available. Please ensure appointments
                    are properly recorded in the system.
                  </Alert>
                )}
              </TabPanel>

              {/* Follow-up Tab */}
              <TabPanel value={activeTab} index={3}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Follow-up & Communication Log
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Track all communications and follow-up actions for this
                  patient.
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Add a new follow-up comment..."
                    value={followUpComment}
                    onChange={(e) => setFollowUpComment(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleAddFollowUpComment}
                    disabled={!followUpComment.trim()}
                    sx={{
                      bgcolor: '#2196F3',
                      '&:hover': { bgcolor: '#1976D2' },
                      textTransform: 'none',
                    }}
                  >
                    Add Comment
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                {isLoadingNotes ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
                    {filteredNotesHistory?.length > 0 ? (
                      filteredNotesHistory.map((note, index) => {
                        // Strip HTML tags from notes if any remain
                        const cleanNotes = (
                          note.notes ||
                          note.comment ||
                          'No comment'
                        )
                          .replace(/<[^>]+>/g, '') // Remove HTML tags
                          .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
                          .trim()

                        return (
                          <Box
                            key={note.id || index}
                            sx={{
                              display: 'flex',
                              gap: 2,
                              mb: 3,
                              pb: 3,
                              borderBottom: '1px solid #E2E8F0',
                              '&:last-child': { borderBottom: 'none' },
                            }}
                          >
                            <Avatar sx={{ width: 40, height: 40 }}>
                              {(
                                note.createdBy ||
                                note.author ||
                                note.createdByName ||
                                'U'
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {note.createdByName ||
                                    note.author ||
                                    'Unknown'}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {note.createdAt || note.timestamp
                                    ? dayjs(
                                        note.createdAt || note.timestamp,
                                      ).format('DD/MM/YYYY, h:mm A')
                                    : 'N/A'}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {cleanNotes}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      })
                    ) : (
                      <Alert severity="info">No follow-up comments found</Alert>
                    )}
                  </Box>
                )}
              </TabPanel>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}

export default PatientManagement
