import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import debounce from 'lodash/debounce'
import dayjs from 'dayjs'
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import {
  DoorFront as RoomIcon,
  SingleBed as BedIcon,
  AcUnit as AcIcon,
  LocalHospital as EmergencyIcon,
  Spa as LuxuryIcon,
  MeetingRoom as GeneralIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import {
  createIPRegistration,
  getAllPatients,
  getBeds,
  getBuildings,
  getFloors,
  getRooms,
} from '@/constants/apis'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { toastconfig } from '@/utils/toastconfig'

const CATEGORY_META = {
  Emergency: {
    color: 'error',
    icon: <EmergencyIcon fontSize="small" />,
    bg: '#FEE2E2',
    border: '#F87171',
  },
  Luxury: {
    color: 'warning',
    icon: <LuxuryIcon fontSize="small" />,
    bg: '#FEF3C7',
    border: '#FBBF24',
  },
  VIP: {
    color: 'secondary',
    icon: <LuxuryIcon fontSize="small" />,
    bg: '#EDE9FE',
    border: '#A78BFA',
  },
  General: {
    color: 'success',
    icon: <GeneralIcon fontSize="small" />,
    bg: '#DCFCE7',
    border: '#4ADE80',
  },
  'Semi-Private': {
    color: 'info',
    icon: <GeneralIcon fontSize="small" />,
    bg: '#E0F2FE',
    border: '#38BDF8',
  },
  Private: {
    color: 'primary',
    icon: <GeneralIcon fontSize="small" />,
    bg: '#DBEAFE',
    border: '#60A5FA',
  },
}

const TYPE_META = {
  AC: { label: 'AC', color: 'info', icon: <AcIcon fontSize="small" /> },
  'Non-AC': { label: 'Non-AC', color: 'default', icon: null },
}

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
}

function isBedAvailable(bed) {
  const status = normalizeStatus(bed?.status)
  return (
    bed?.isActive !== false &&
    (status === 'available' || status === '' || !bed?.status)
  )
}

function getCategoryMeta(category) {
  return (
    CATEGORY_META[category] || {
      color: 'default',
      icon: <GeneralIcon fontSize="small" />,
      bg: '#F3F4F6',
      border: '#D1D5DB',
    }
  )
}

function BookOptionPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const branches = user?.branchDetails || []
  const procedures = dropdowns?.otProcedureList || []

  const [branchId, setBranchId] = useState('')
  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [bedId, setBedId] = useState('')

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patients, setPatients] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [procedureId, setProcedureId] = useState('')
  const [dateFrom, setDateFrom] = useState(dayjs())
  const [dateTo, setDateTo] = useState(null)
  const [admissionTime, setAdmissionTime] = useState(dayjs())
  const [packageAmount, setPackageAmount] = useState('')
  const [errors, setErrors] = useState({})
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')

  useEffect(() => {
    if (!branches?.length) return
    const queryBranch = router.query.branchId
    if (queryBranch) {
      const match = branches.find((b) => String(b.id) === String(queryBranch))
      if (match) {
        setBranchId(match.id)
        return
      }
    }
    if (!branchId) {
      setBranchId(branches[0].id)
    }
  }, [branches, router.query.branchId, branchId])

  const searchPatients = useCallback(
    debounce(async (searchValue) => {
      if (!searchValue?.trim()) {
        setPatients([])
        setIsSearching(false)
        return
      }
      try {
        const response = await getAllPatients(user.accessToken, searchValue)
        if (response.status === 200) {
          setPatients(response.data || [])
        }
      } catch (error) {
        console.error('Error searching patients:', error)
        toast.error('Failed to search patients', toastconfig)
      } finally {
        setIsSearching(false)
      }
    }, 500),
    [user.accessToken],
  )

  const { data: buildingsResponse, isLoading: loadingBuildings } = useQuery({
    queryKey: ['bookOptionBuildings', branchId],
    queryFn: () => getBuildings(user.accessToken, branchId),
    enabled: Boolean(user.accessToken && branchId),
  })

  const buildings = useMemo(() => {
    const data = buildingsResponse?.data || buildingsResponse
    return Array.isArray(data) ? data : []
  }, [buildingsResponse])

  const { data: floorsResponse, isLoading: loadingFloors } = useQuery({
    queryKey: ['bookOptionFloors', buildingId],
    queryFn: () => getFloors(user.accessToken, buildingId),
    enabled: Boolean(user.accessToken && buildingId),
  })

  const floors = useMemo(() => {
    const data = floorsResponse?.data || floorsResponse
    return Array.isArray(data) ? data : []
  }, [floorsResponse])

  const { data: roomsResponse, isLoading: loadingRooms } = useQuery({
    queryKey: ['bookOptionRooms', floorId],
    queryFn: () => getRooms(user.accessToken, floorId),
    enabled: Boolean(user.accessToken && floorId),
  })

  const rooms = useMemo(() => {
    const data = roomsResponse?.data || roomsResponse
    return Array.isArray(data) ? data.filter((r) => r.isActive !== false) : []
  }, [roomsResponse])

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const categoryOk =
        categoryFilter === 'All' || room.roomCategory === categoryFilter
      const typeOk = typeFilter === 'All' || room.type === typeFilter
      return categoryOk && typeOk
    })
  }, [rooms, categoryFilter, typeFilter])

  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.id) === String(roomId)) || null,
    [rooms, roomId],
  )

  const { data: bedsResponse, isLoading: loadingBeds } = useQuery({
    queryKey: ['bookOptionBeds', roomId],
    queryFn: () => getBeds(user.accessToken, roomId),
    enabled: Boolean(user.accessToken && roomId),
  })

  const beds = useMemo(() => {
    const data = bedsResponse?.data || bedsResponse
    return Array.isArray(data) ? data : []
  }, [bedsResponse])

  const availableBeds = useMemo(() => beds.filter(isBedAvailable), [beds])

  const selectedBed = useMemo(
    () => beds.find((b) => String(b.id) === String(bedId)) || null,
    [beds, bedId],
  )

  const roomCategories = useMemo(() => {
    const set = new Set(rooms.map((r) => r.roomCategory).filter(Boolean))
    return ['All', ...Array.from(set)]
  }, [rooms])

  useEffect(() => {
    setBuildingId('')
    setFloorId('')
    setRoomId('')
    setBedId('')
    setCategoryFilter('All')
    setTypeFilter('All')
  }, [branchId])

  useEffect(() => {
    setFloorId('')
    setRoomId('')
    setBedId('')
  }, [buildingId])

  useEffect(() => {
    setRoomId('')
    setBedId('')
  }, [floorId])

  useEffect(() => {
    setBedId('')
  }, [roomId])

  useEffect(() => {
    if (roomId && !filteredRooms.some((r) => String(r.id) === String(roomId))) {
      setRoomId('')
      setBedId('')
    }
  }, [filteredRooms, roomId])

  const bookMutation = useMutation({
    mutationFn: (payload) => createIPRegistration(user.accessToken, payload),
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        toast.error(response.message || 'Failed to book bed', toastconfig)
        return
      }
      toast.success(response?.message || 'Bed booked successfully', toastconfig)
      queryClient.invalidateQueries({ queryKey: ['activeIP'] })
      queryClient.invalidateQueries({ queryKey: ['bookOptionBeds', roomId] })
      queryClient.invalidateQueries({ queryKey: ['layoutsOverview'] })
      router.push({
        pathname: '/ipmodule',
        query: { branch: branchId },
      })
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to book bed', toastconfig)
    },
  })

  const validate = () => {
    const next = {}
    if (!branchId) next.branchId = 'Branch is required'
    if (!selectedPatient) next.patient = 'Patient is required'
    if (!procedureId) next.procedureId = 'Procedure is required'
    if (!dateFrom) next.dateFrom = 'From date is required'
    if (dateTo && dateFrom && dayjs(dateTo).isBefore(dayjs(dateFrom), 'day')) {
      next.dateTo = 'To date must be on or after from date'
    }
    if (!admissionTime) next.admissionTime = 'Admission time is required'
    if (!buildingId) next.buildingId = 'Building is required'
    if (!floorId) next.floorId = 'Floor is required'
    if (!roomId) next.roomId = 'Room is required'
    if (!bedId) next.bedId = 'Bed is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleBook = () => {
    if (!validate()) return
    const payload = {
      branchId: Number(branchId),
      patientId: Number(selectedPatient.id),
      procedureId: Number(procedureId),
      dateOfAdmission: dayjs(dateFrom).format('YYYY-MM-DD'),
      timeOfAdmission: dayjs(admissionTime).format('HH:mm:ss'),
      buildingId: Number(buildingId),
      floorId: Number(floorId),
      roomId: Number(roomId),
      bedId: Number(bedId),
    }
    if (dateTo) {
      payload.dateOfDischarge = dayjs(dateTo).format('YYYY-MM-DD')
    }
    if (packageAmount) {
      payload.packageAmount = Number(packageAmount)
    }
    bookMutation.mutate(payload)
  }

  const handleBranchChange = (value) => {
    setBranchId(value)
    router.replace(
      {
        pathname: '/book-option',
        query: { branchId: value || '' },
      },
      undefined,
      { shallow: true },
    )
  }

  const getBedTileStyles = (bed) => {
    const status = normalizeStatus(bed.status)
    const selected = String(bed.id) === String(bedId)
    if (selected) {
      return {
        border: '2px solid #2563EB',
        bgcolor: '#DBEAFE',
        color: '#1E3A8A',
      }
    }
    if (status === 'occupied') {
      return {
        border: '2px solid #F87171',
        bgcolor: '#FEE2E2',
        color: '#991B1B',
        opacity: 0.75,
        cursor: 'not-allowed',
      }
    }
    if (status === 'reserved') {
      return {
        border: '2px solid #FBBF24',
        bgcolor: '#FEF3C7',
        color: '#92400E',
        opacity: 0.85,
        cursor: 'not-allowed',
      }
    }
    if (status === 'maintenance') {
      return {
        border: '2px solid #9CA3AF',
        bgcolor: '#F3F4F6',
        color: '#4B5563',
        opacity: 0.7,
        cursor: 'not-allowed',
      }
    }
    return {
      border: '2px solid #4ADE80',
      bgcolor: '#F0FDF4',
      color: '#166534',
      cursor: 'pointer',
      '&:hover': { bgcolor: '#DCFCE7', transform: 'translateY(-1px)' },
    }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Book Option
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Book a bed for a patient by branch, stay dates, floor, room and bed.
            Floors, rooms and beds are managed under Admin → Master Data.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="text" onClick={() => router.push('/ipmodule')}>
            IP List
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={5}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Patient & Stay
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth error={!!errors.branchId}>
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={branchId || ''}
                  onChange={(e) => handleBranchChange(e.target.value)}
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name || branch.branchName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.branchId && (
                  <FormHelperText>{errors.branchId}</FormHelperText>
                )}
              </FormControl>

              <Autocomplete
                options={patients}
                loading={isSearching}
                value={selectedPatient}
                onChange={(_, newValue) => {
                  setSelectedPatient(newValue)
                  setErrors((prev) => ({ ...prev, patient: null }))
                }}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input') {
                    setIsSearching(true)
                    searchPatients(value)
                  }
                }}
                getOptionLabel={(option) =>
                  option
                    ? `${option.Name || option.name || ''} (ID: ${option.patientId || option.id})`
                    : ''
                }
                isOptionEqualToValue={(option, value) =>
                  option?.id === value?.id
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Avatar
                      src={option.photo}
                      sx={{ width: 32, height: 32, mr: 1.5 }}
                    >
                      {(option.Name || option.name || '?')[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {option.Name || option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {option.patientId || option.id}
                        {option.mobileNo ? ` · ${option.mobileNo}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search patient name"
                    placeholder="Type name, mobile or patient ID"
                    error={!!errors.patient}
                    helperText={errors.patient}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearching ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <FormControl fullWidth error={!!errors.procedureId}>
                <InputLabel>Procedure</InputLabel>
                <Select
                  label="Procedure"
                  value={procedureId}
                  onChange={(e) => {
                    setProcedureId(e.target.value)
                    setErrors((prev) => ({ ...prev, procedureId: null }))
                  }}
                >
                  {procedures.map((proc) => (
                    <MenuItem
                      key={proc.id || proc.value}
                      value={proc.id || proc.value}
                    >
                      {proc.name || proc.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.procedureId && (
                  <FormHelperText>{errors.procedureId}</FormHelperText>
                )}
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <DatePicker
                  label="From date"
                  value={dateFrom}
                  onChange={(value) => {
                    setDateFrom(value)
                    setErrors((prev) => ({ ...prev, dateFrom: null }))
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dateFrom,
                      helperText: errors.dateFrom,
                    },
                  }}
                />
                <DatePicker
                  label="To date"
                  value={dateTo}
                  minDate={dateFrom || undefined}
                  onChange={(value) => {
                    setDateTo(value)
                    setErrors((prev) => ({ ...prev, dateTo: null }))
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.dateTo,
                      helperText:
                        errors.dateTo || 'Optional expected discharge',
                    },
                  }}
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TimePicker
                  label="Admission time"
                  value={admissionTime}
                  onChange={(value) => {
                    setAdmissionTime(value)
                    setErrors((prev) => ({ ...prev, admissionTime: null }))
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.admissionTime,
                      helperText: errors.admissionTime,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Package amount"
                  type="number"
                  value={packageAmount}
                  onChange={(e) => setPackageAmount(e.target.value)}
                />
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={7}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Location & Bed
            </Typography>

            {!branchId && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Select a branch to load buildings and beds.
              </Alert>
            )}

            {branchId && !buildings.length && !loadingBuildings && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No buildings found for this branch. Add floors, rooms and beds
                under Admin → Master Data → Master Layouts.
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth error={!!errors.buildingId}>
                  <InputLabel>Building</InputLabel>
                  <Select
                    label="Building"
                    value={buildingId}
                    onChange={(e) => setBuildingId(e.target.value)}
                    disabled={!buildings.length || loadingBuildings}
                  >
                    {buildings.map((building) => (
                      <MenuItem key={building.id} value={building.id}>
                        {building.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.buildingId && (
                    <FormHelperText>{errors.buildingId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth error={!!errors.floorId}>
                  <InputLabel>Floor</InputLabel>
                  <Select
                    label="Floor"
                    value={floorId}
                    onChange={(e) => setFloorId(e.target.value)}
                    disabled={!floors.length || loadingFloors}
                  >
                    {floors.map((floor) => (
                      <MenuItem key={floor.id} value={floor.id}>
                        {floor.name || floor.floorName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.floorId && (
                    <FormHelperText>{errors.floorId}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Stack direction="row" spacing={1}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      label="Type"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      disabled={!rooms.length}
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="AC">AC</MenuItem>
                      <MenuItem value="Non-AC">Non-AC</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      label="Category"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      disabled={!rooms.length}
                    >
                      {roomCategories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <RoomIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Select room
              </Typography>
              {loadingRooms && <CircularProgress size={16} />}
            </Stack>

            {!floorId ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose a floor to see rooms.
              </Typography>
            ) : filteredRooms.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No rooms match the selected filters on this floor.
              </Alert>
            ) : (
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {filteredRooms.map((room) => {
                  const selected = String(room.id) === String(roomId)
                  const categoryMeta = getCategoryMeta(room.roomCategory)
                  const typeMeta = TYPE_META[room.type] || TYPE_META['Non-AC']
                  return (
                    <Grid item xs={12} sm={6} key={room.id}>
                      <Paper
                        elevation={0}
                        onClick={() => {
                          setRoomId(room.id)
                          setErrors((prev) => ({ ...prev, roomId: null }))
                        }}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          borderRadius: 2,
                          border: '2px solid',
                          borderColor: selected
                            ? 'primary.main'
                            : categoryMeta.border,
                          bgcolor: selected ? '#EFF6FF' : categoryMeta.bg,
                          transition: 'all 0.15s ease',
                          '&:hover': { boxShadow: 2 },
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700 }}
                            >
                              {room.name ||
                                room.roomNumber ||
                                `Room ${room.id}`}
                            </Typography>
                            {room.roomNumber && room.name && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                #{room.roomNumber}
                              </Typography>
                            )}
                          </Box>
                          {room.charges != null && room.charges !== '' && (
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 600 }}
                            >
                              ₹{room.charges}
                            </Typography>
                          )}
                        </Stack>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ mt: 1 }}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Chip
                            size="small"
                            icon={typeMeta.icon || undefined}
                            label={typeMeta.label}
                            color={typeMeta.color}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            icon={categoryMeta.icon}
                            label={room.roomCategory || 'General'}
                            color={categoryMeta.color}
                          />
                          {room.genderRestriction &&
                            room.genderRestriction !== 'Any' && (
                              <Chip
                                size="small"
                                label={room.genderRestriction}
                                variant="outlined"
                              />
                            )}
                        </Stack>
                      </Paper>
                    </Grid>
                  )
                })}
              </Grid>
            )}
            {errors.roomId && (
              <FormHelperText error sx={{ mb: 1 }}>
                {errors.roomId}
              </FormHelperText>
            )}

            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 1.5 }}
            >
              <BedIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Select bed
              </Typography>
              {loadingBeds && <CircularProgress size={16} />}
              {roomId && (
                <Typography variant="caption" color="text.secondary">
                  {availableBeds.length} available / {beds.length} total
                </Typography>
              )}
            </Stack>

            {!roomId ? (
              <Typography variant="body2" color="text.secondary">
                Select a room to view beds.
              </Typography>
            ) : beds.length === 0 && !loadingBeds ? (
              <Alert severity="warning">
                No beds configured for this room. Add beds under Admin → Master
                Data → Master Layouts.
              </Alert>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gap: 1.25,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                }}
              >
                {beds.map((bed) => {
                  const available = isBedAvailable(bed)
                  return (
                    <Tooltip
                      key={bed.id}
                      title={`${bed.name || bed.bedNumber} · ${bed.bedType || 'Normal'} · ${bed.status || 'Available'}${bed.hasOxygen ? ' · Oxygen' : ''}${bed.hasVentilator ? ' · Ventilator' : ''}`}
                    >
                      <Box
                        onClick={() => {
                          if (!available) return
                          setBedId(bed.id)
                          setErrors((prev) => ({ ...prev, bedId: null }))
                        }}
                        sx={{
                          ...getBedTileStyles(bed),
                          borderRadius: 2,
                          p: 1.25,
                          minHeight: 72,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, lineHeight: 1.2 }}
                        >
                          {bed.name || bed.bedNumber || `Bed ${bed.id}`}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.85 }}>
                          {bed.bedType || 'Normal'}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                        >
                          {bed.status || 'Available'}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )
                })}
              </Box>
            )}
            {errors.bedId && (
              <FormHelperText error sx={{ mt: 1 }}>
                {errors.bedId}
              </FormHelperText>
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 2 }}
              flexWrap="wrap"
              useFlexGap
            >
              <Chip
                size="small"
                label="Available"
                sx={{ bgcolor: '#F0FDF4', border: '1px solid #4ADE80' }}
              />
              <Chip
                size="small"
                label="Selected"
                sx={{ bgcolor: '#DBEAFE', border: '1px solid #2563EB' }}
              />
              <Chip
                size="small"
                label="Occupied"
                sx={{ bgcolor: '#FEE2E2', border: '1px solid #F87171' }}
              />
              <Chip
                size="small"
                label="Reserved"
                sx={{ bgcolor: '#FEF3C7', border: '1px solid #FBBF24' }}
              />
              <Chip
                size="small"
                label="Maintenance"
                sx={{ bgcolor: '#F3F4F6', border: '1px solid #9CA3AF' }}
              />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {(selectedPatient || selectedRoom || selectedBed) && (
        <Paper
          elevation={0}
          sx={{
            mt: 2.5,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Booking summary
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {selectedPatient && (
              <Chip
                label={`Patient: ${selectedPatient.Name || selectedPatient.name}`}
              />
            )}
            {dateFrom && (
              <Chip label={`From: ${dayjs(dateFrom).format('DD MMM YYYY')}`} />
            )}
            {dateTo && (
              <Chip label={`To: ${dayjs(dateTo).format('DD MMM YYYY')}`} />
            )}
            {selectedRoom && (
              <Chip
                label={`Room: ${selectedRoom.name || selectedRoom.roomNumber} (${selectedRoom.type || '-'} / ${selectedRoom.roomCategory || '-'})`}
              />
            )}
            {selectedBed && (
              <Chip
                color="primary"
                label={`Bed: ${selectedBed.name || selectedBed.bedNumber}`}
              />
            )}
          </Stack>
        </Paper>
      )}

      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1.5}
        sx={{ mt: 3 }}
      >
        <Button variant="outlined" onClick={() => router.push('/ipmodule')}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleBook}
          disabled={bookMutation.isPending}
        >
          {bookMutation.isPending ? (
            <CircularProgress size={22} color="inherit" />
          ) : (
            'Confirm booking'
          )}
        </Button>
      </Stack>
    </Box>
  )
}

export default withPermission(BookOptionPage, true, 'ipmodule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
