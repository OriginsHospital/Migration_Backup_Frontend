import React, { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import HotelIcon from '@mui/icons-material/Hotel'
import LocalHotelIcon from '@mui/icons-material/LocalHotel'
import EngineeringIcon from '@mui/icons-material/Engineering'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import Breadcrumb from '@/components/Breadcrumb'

const initialLayoutData = [
  {
    id: 'telangana',
    name: 'Telangana',
    cities: [
      {
        id: 'hyderabad',
        name: 'Hyderabad',
        branches: [
          {
            id: 'kokapet',
            name: 'Kokapet',
            displayName: 'Kokapet Origins IVF',
            floors: [
              {
                id: 'floor-5',
                name: 'Floor 5',
                rooms: [
                  {
                    id: 'room-501',
                    name: 'Room 501',
                    beds: [
                      {
                        id: 'bed-501-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-501-2',
                        label: 'Bed 2',
                        status: 'maintenance',
                        booking: null,
                      },
                      {
                        id: 'bed-501-3',
                        label: 'Bed 3',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-501-4',
                        label: 'Bed 4',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                  {
                    id: 'room-502',
                    name: 'Room 502',
                    beds: [
                      {
                        id: 'bed-502-1',
                        label: 'Bed 1',
                        status: 'booked',
                        booking: null,
                      },
                      {
                        id: 'bed-502-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'floor-4',
                name: 'Floor 4',
                rooms: [
                  {
                    id: 'room-401',
                    name: 'Room 401',
                    beds: [
                      {
                        id: 'bed-401-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-401-2',
                        label: 'Bed 2',
                        status: 'booked',
                        booking: null,
                      },
                      {
                        id: 'bed-401-3',
                        label: 'Bed 3',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                  {
                    id: 'room-402',
                    name: 'Room 402',
                    beds: [
                      {
                        id: 'bed-402-1',
                        label: 'Bed 1',
                        status: 'maintenance',
                        booking: null,
                      },
                      {
                        id: 'bed-402-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'floor-3',
                name: 'Floor 3',
                rooms: [
                  {
                    id: 'room-301',
                    name: 'Room 301',
                    beds: [
                      {
                        id: 'bed-301-1',
                        label: 'Bed 1',
                        status: 'booked',
                        booking: null,
                      },
                      {
                        id: 'bed-301-2',
                        label: 'Bed 2',
                        status: 'booked',
                        booking: null,
                      },
                      {
                        id: 'bed-301-3',
                        label: 'Bed 3',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-301-4',
                        label: 'Bed 4',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                  {
                    id: 'room-302',
                    name: 'Room 302',
                    beds: [
                      {
                        id: 'bed-302-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-302-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'floor-2',
                name: 'Floor 2',
                rooms: [
                  {
                    id: 'room-201',
                    name: 'Room 201',
                    beds: [
                      {
                        id: 'bed-201-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-201-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-201-3',
                        label: 'Bed 3',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                  {
                    id: 'room-202',
                    name: 'Room 202',
                    beds: [
                      {
                        id: 'bed-202-1',
                        label: 'Bed 1',
                        status: 'booked',
                        booking: null,
                      },
                      {
                        id: 'bed-202-2',
                        label: 'Bed 2',
                        status: 'maintenance',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'floor-1',
                name: 'Floor 1',
                rooms: [
                  {
                    id: 'room-101',
                    name: 'Room 101',
                    beds: [
                      {
                        id: 'bed-101-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-101-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-101-3',
                        label: 'Bed 3',
                        status: 'booked',
                        booking: null,
                      },
                      {
                        id: 'bed-101-4',
                        label: 'Bed 4',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                  {
                    id: 'room-102',
                    name: 'Room 102',
                    beds: [
                      {
                        id: 'bed-102-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'bed-102-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: 'kukkatpally',
            name: 'Kukatpally',
            displayName: 'Kukatpally Origins IVF',
            floors: [
              {
                id: 'kuk-floor-3',
                name: 'Floor 3',
                rooms: [
                  {
                    id: 'kuk-room-301',
                    name: 'Room 301',
                    beds: [
                      {
                        id: 'kuk-bed-301-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'kuk-bed-301-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'kuk-floor-2',
                name: 'Floor 2',
                rooms: [
                  {
                    id: 'kuk-room-201',
                    name: 'Room 201',
                    beds: [
                      {
                        id: 'kuk-bed-201-1',
                        label: 'Bed 1',
                        status: 'booked',
                        booking: null,
                      },
                      {
                        id: 'kuk-bed-201-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'kuk-floor-1',
                name: 'Floor 1',
                rooms: [
                  {
                    id: 'kuk-room-101',
                    name: 'Room 101',
                    beds: [
                      {
                        id: 'kuk-bed-101-1',
                        label: 'Bed 1',
                        status: 'maintenance',
                        booking: null,
                      },
                      {
                        id: 'kuk-bed-101-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'warangal',
        name: 'Hanamkonda',
        branches: [
          {
            id: 'hanamkonda-branch',
            name: 'Hanamkonda',
            displayName: 'Hanamkonda Origins IVF',
            floors: [
              {
                id: 'han-floor-2',
                name: 'Floor 2',
                rooms: [
                  {
                    id: 'han-room-201',
                    name: 'Room 201',
                    beds: [
                      {
                        id: 'han-bed-201-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'han-bed-201-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'han-floor-1',
                name: 'Floor 1',
                rooms: [
                  {
                    id: 'han-room-101',
                    name: 'Room 101',
                    beds: [
                      {
                        id: 'han-bed-101-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'han-bed-101-2',
                        label: 'Bed 2',
                        status: 'maintenance',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    cities: [
      {
        id: 'bengaluru',
        name: 'Bengaluru',
        branches: [
          {
            id: 'indiranagar',
            name: 'Indiranagar',
            displayName: 'Indiranagar Origins IVF',
            floors: [
              {
                id: 'ini-floor-4',
                name: 'Floor 4',
                rooms: [
                  {
                    id: 'ini-room-401',
                    name: 'Room 401',
                    beds: [
                      {
                        id: 'ini-bed-401-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'ini-bed-401-2',
                        label: 'Bed 2',
                        status: 'booked',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'ini-floor-3',
                name: 'Floor 3',
                rooms: [
                  {
                    id: 'ini-room-301',
                    name: 'Room 301',
                    beds: [
                      {
                        id: 'ini-bed-301-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'ini-bed-301-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'ini-bed-301-3',
                        label: 'Bed 3',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'ini-floor-2',
                name: 'Floor 2',
                rooms: [
                  {
                    id: 'ini-room-201',
                    name: 'Room 201',
                    beds: [
                      {
                        id: 'ini-bed-201-1',
                        label: 'Bed 1',
                        status: 'maintenance',
                        booking: null,
                      },
                      {
                        id: 'ini-bed-201-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
              {
                id: 'ini-floor-1',
                name: 'Floor 1',
                rooms: [
                  {
                    id: 'ini-room-101',
                    name: 'Room 101',
                    beds: [
                      {
                        id: 'ini-bed-101-1',
                        label: 'Bed 1',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'ini-bed-101-2',
                        label: 'Bed 2',
                        status: 'available',
                        booking: null,
                      },
                      {
                        id: 'ini-bed-101-3',
                        label: 'Bed 3',
                        status: 'booked',
                        booking: null,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

const BuildingShell = styled(Box)(({ theme }) => ({
  width: 'min(420px, 90vw)',
  padding: theme.spacing(4, 2, 2),
  background: `linear-gradient(160deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.dark} 100%)`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[10],
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: theme.spacing(2),
    border: `1px solid ${theme.palette.primary.main}`,
    opacity: 0.2,
  },
}))

const BuildingFloor = styled(Box)(({ theme, ownerState }) => {
  const { isSelected } = ownerState
  return {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: theme.shadows[isSelected ? 6 : 2],
    cursor: 'pointer',
    transform: 'skew(-6deg)',
    transition: 'all 0.25s ease',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: theme.spacing(1),
      border: `1px solid ${theme.palette.primary.main}`,
      opacity: isSelected ? 0.6 : 0.2,
      transform: 'skew(6deg)',
    },
    '&:hover': {
      transform: 'translateY(-6px) skew(-6deg)',
      boxShadow: theme.shadows[8],
    },
  }
})

const StatusLegend = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  boxShadow: theme.shadows[1],
  border: `1px solid ${theme.palette.divider}`,
}))

const BedBox = styled(Box)(({ theme, ownerState }) => {
  const statusColors = {
    available: theme.palette.success.main,
    booked: theme.palette.error.main,
    maintenance: theme.palette.info.main,
  }

  const hoverColors = {
    available: theme.palette.success.dark,
    booked: theme.palette.error.dark,
    maintenance: theme.palette.info.dark,
  }

  const { status } = ownerState

  return {
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    border: `1px solid ${statusColors[status]}`,
    backgroundColor: `${statusColors[status]}1a`,
    color: theme.palette.getContrastText(statusColors[status]),
    textAlign: 'center',
    cursor: status === 'maintenance' ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: `${hoverColors[status]}22`,
      transform: status === 'maintenance' ? 'none' : 'translateY(-2px)',
    },
    '&:active': {
      transform: status === 'maintenance' ? 'none' : 'translateY(0)',
    },
  }
})

const LegendItem = ({ color, label, icon }) => (
  <Stack direction="row" alignItems="center" spacing={1.5}>
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: 0.5,
        backgroundColor: color,
        boxShadow: (theme) =>
          `0 0 0 2px ${theme.palette.common.white}, 0 0 0 3px ${color}`,
      }}
    />
    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
    >
      {icon}
      {label}
    </Typography>
  </Stack>
)

const LayoutsPage = () => {
  const [layoutData, setLayoutData] = useState(initialLayoutData)
  const [selectedStateId, setSelectedStateId] = useState(
    initialLayoutData[0]?.id || '',
  )
  const [selectedCityId, setSelectedCityId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedFloorId, setSelectedFloorId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [bookBedDialog, setBookBedDialog] = useState({
    open: false,
    context: null,
  })
  const [viewBookingDialog, setViewBookingDialog] = useState({
    open: false,
    context: null,
  })
  const [vacateDialog, setVacateDialog] = useState({
    open: false,
    context: null,
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const [bookingForm, setBookingForm] = useState({
    appointmentId: '',
    patientName: '',
    mobileNumber: '',
    doctorName: '',
    admissionDate: '',
    admissionTime: '',
  })

  const user = useSelector((store) => store.user)
  const router = useRouter()

  const selectedState = useMemo(
    () => layoutData.find((state) => state.id === selectedStateId),
    [layoutData, selectedStateId],
  )

  const cityOptions = useMemo(
    () => selectedState?.cities || [],
    [selectedState],
  )
  const selectedCity = useMemo(
    () => cityOptions.find((city) => city.id === selectedCityId),
    [cityOptions, selectedCityId],
  )

  const branchOptions = useMemo(
    () => selectedCity?.branches || [],
    [selectedCity],
  )
  const selectedBranch = useMemo(
    () => branchOptions.find((branch) => branch.id === selectedBranchId),
    [branchOptions, selectedBranchId],
  )

  const selectedFloor = useMemo(
    () => selectedBranch?.floors.find((floor) => floor.id === selectedFloorId),
    [selectedBranch, selectedFloorId],
  )

  const selectedRoom = useMemo(
    () => selectedFloor?.rooms.find((room) => room.id === selectedRoomId),
    [selectedFloor, selectedRoomId],
  )

  const handleStateChange = (event) => {
    const value = event.target.value
    setSelectedStateId(value)
    setSelectedCityId('')
    setSelectedBranchId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleCityChange = (event) => {
    const value = event.target.value
    setSelectedCityId(value)
    setSelectedBranchId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleBranchChange = (event) => {
    const value = event.target.value
    setSelectedBranchId(value)
    setSelectedFloorId('')
    setSelectedRoomId('')
    setBranchDialogOpen(!!value)
  }

  const handleFloorSelect = (floorId) => {
    setSelectedFloorId(floorId)
    setSelectedRoomId('')
    setBranchDialogOpen(false)
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = (_, reason) => {
    if (reason === 'clickaway') return
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const resetBookingForm = () => {
    setBookingForm({
      appointmentId: '',
      patientName: '',
      mobileNumber: '',
      doctorName: '',
      admissionDate: '',
      admissionTime: '',
    })
  }

  const updateBedStatus = (context, updater) => {
    const { stateId, cityId, branchId, floorId, roomId, bedId } = context
    setLayoutData((prev) =>
      prev.map((state) => {
        if (state.id !== stateId) return state
        return {
          ...state,
          cities: state.cities.map((city) => {
            if (city.id !== cityId) return city
            return {
              ...city,
              branches: city.branches.map((branch) => {
                if (branch.id !== branchId) return branch
                return {
                  ...branch,
                  floors: branch.floors.map((floor) => {
                    if (floor.id !== floorId) return floor
                    return {
                      ...floor,
                      rooms: floor.rooms.map((room) => {
                        if (room.id !== roomId) return room
                        return {
                          ...room,
                          beds: room.beds.map((bed) => {
                            if (bed.id !== bedId) return bed
                            return updater(bed)
                          }),
                        }
                      }),
                    }
                  }),
                }
              }),
            }
          }),
        }
      }),
    )
  }

  const handleBedClick = (room, bed) => {
    if (!selectedBranch || !selectedFloor) {
      showSnackbar('Please select a floor to view the layout.', 'info')
      return
    }

    const context = {
      stateId: selectedState?.id,
      cityId: selectedCity?.id,
      branchId: selectedBranch?.id,
      branchName: selectedBranch?.displayName || selectedBranch?.name,
      floorId: selectedFloor?.id,
      floorName: selectedFloor?.name,
      roomId: room.id,
      roomName: room.name,
      bedId: bed.id,
      bedLabel: bed.label,
    }

    if (bed.status === 'maintenance') {
      showSnackbar('This bed is under maintenance.', 'warning')
      return
    }

    if (bed.status === 'booked' && bed.booking) {
      setViewBookingDialog({
        open: true,
        context: { ...context, booking: bed.booking },
      })
      return
    }

    if (bed.status === 'booked') {
      // Legacy data without booking details
      setViewBookingDialog({
        open: true,
        context: {
          ...context,
          booking: {
            patientName: 'Not available',
            appointmentId: 'N/A',
            mobileNumber: 'N/A',
            doctorName: 'N/A',
            bookedBy: 'System',
            bookedAt: dayjs().toISOString(),
          },
        },
      })
      return
    }

    resetBookingForm()
    setBookBedDialog({ open: true, context })
  }

  const handleBookBedSubmit = (event) => {
    event.preventDefault()
    if (!bookBedDialog.context) return

    const {
      appointmentId,
      patientName,
      mobileNumber,
      doctorName,
      admissionDate,
      admissionTime,
    } = bookingForm
    const missingFields = []
    if (!appointmentId.trim()) missingFields.push('Appointment ID')
    if (!patientName.trim()) missingFields.push('Patient Name')
    if (!mobileNumber.trim()) missingFields.push('Mobile Number')
    if (!doctorName.trim()) missingFields.push('Doctor Name')

    if (missingFields.length) {
      showSnackbar(`Please fill: ${missingFields.join(', ')}`, 'error')
      return
    }

    updateBedStatus(bookBedDialog.context, (bed) => ({
      ...bed,
      status: 'booked',
      booking: {
        appointmentId: appointmentId.trim(),
        patientName: patientName.trim(),
        mobileNumber: mobileNumber.trim(),
        doctorName: doctorName.trim(),
        admissionDate: admissionDate || null,
        admissionTime: admissionTime || null,
        bookedAt: dayjs().toISOString(),
        bookedBy:
          user?.name ||
          user?.fullName ||
          `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
          user?.email ||
          'Admin',
        location: {
          state: selectedState?.name,
          city: selectedCity?.name,
          branch: bookBedDialog.context.branchName,
          floor: selectedFloor?.name,
          room: bookBedDialog.context.roomName,
          bed: bookBedDialog.context.bedLabel,
        },
      },
    }))

    setBookBedDialog({ open: false, context: null })
    showSnackbar('Bed successfully booked!', 'success')
  }

  const handleVacateConfirm = () => {
    if (!vacateDialog.context) return
    updateBedStatus(vacateDialog.context, (bed) => ({
      ...bed,
      status: 'available',
      booking: null,
    }))
    setVacateDialog({ open: false, context: null })
    setViewBookingDialog({ open: false, context: null })
    showSnackbar('Bed is now available for booking.', 'success')
  }

  const renderFloorLegend = () => (
    <StatusLegend direction="row" flexWrap="wrap">
      <LegendItem
        color="#22c55e"
        label="Available"
        icon={<HotelIcon fontSize="small" />}
      />
      <LegendItem
        color="#ef4444"
        label="Booked"
        icon={<LocalHotelIcon fontSize="small" />}
      />
      <LegendItem
        color="#3b82f6"
        label="Under Maintenance"
        icon={<EngineeringIcon fontSize="small" />}
      />
    </StatusLegend>
  )

  const renderBlueprint = () => {
    if (!selectedBranch || !selectedFloor) {
      return (
        <Card
          elevation={0}
          sx={{
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            py: 6,
          }}
        >
          <CardContent>
            <Stack spacing={2} alignItems="center">
              <MeetingRoomIcon color="disabled" sx={{ fontSize: 48 }} />
              <Typography variant="h6" color="text.secondary" align="center">
                Select a branch and floor to view the blueprint layout.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )
    }

    return (
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Box>
            <Typography variant="h5">
              {selectedBranch.displayName || selectedBranch.name} •{' '}
              {selectedFloor.name}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Interactive blueprint with real-time bed status
            </Typography>
          </Box>
          {renderFloorLegend()}
        </Stack>

        <Grid container spacing={3}>
          {selectedFloor.rooms.map((room) => (
            <Grid item xs={12} md={6} lg={4} key={room.id}>
              <Card
                elevation={selectedRoomId === room.id ? 6 : 2}
                sx={{
                  borderRadius: 3,
                  border: (theme) =>
                    selectedRoomId === room.id
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {room.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {room.beds.length} Beds
                      </Typography>
                    </Stack>
                    <Button
                      size="small"
                      variant={
                        selectedRoomId === room.id ? 'contained' : 'text'
                      }
                      onClick={() =>
                        setSelectedRoomId((prev) =>
                          prev === room.id ? '' : room.id,
                        )
                      }
                    >
                      {selectedRoomId === room.id ? 'Selected' : 'Focus'}
                    </Button>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 1.5,
                      gridTemplateColumns:
                        'repeat(auto-fill, minmax(96px, 1fr))',
                    }}
                  >
                    {room.beds.map((bed) => (
                      <Tooltip
                        key={bed.id}
                        title={`Status: ${bed.status}`}
                        arrow
                      >
                        <BedBox
                          ownerState={{ status: bed.status }}
                          onClick={() => handleBedClick(room, bed)}
                          sx={{
                            minHeight: 70,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {bed.label}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ textTransform: 'capitalize' }}
                          >
                            {bed.status}
                          </Typography>
                        </BedBox>
                      </Tooltip>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    )
  }

  return (
    <Box className="p-5 space-y-5">
      <Breadcrumb />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
      >
        <div>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Welcome to Origins Layout
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Visualise and manage in-patient layouts across Origins branches.
          </Typography>
        </div>
        <Button variant="outlined" onClick={() => router.push('/ipmodule')}>
          Back to IP Module
        </Button>
      </Stack>

      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel>State</InputLabel>
                <Select
                  label="State"
                  value={selectedStateId}
                  onChange={handleStateChange}
                  displayEmpty={!selectedStateId}
                >
                  {layoutData.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium" disabled={!selectedStateId}>
                <InputLabel>City</InputLabel>
                <Select
                  label="City"
                  value={selectedCityId}
                  onChange={handleCityChange}
                  displayEmpty={!selectedCityId}
                >
                  {cityOptions.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="medium" disabled={!selectedCityId}>
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={selectedBranchId}
                  onChange={handleBranchChange}
                  displayEmpty={!selectedBranchId}
                >
                  {branchOptions.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {renderBlueprint()}

      <Dialog
        open={branchDialogOpen && Boolean(selectedBranch)}
        onClose={() => setBranchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {`Welcome to ${selectedBranch?.displayName || selectedBranch?.name}`}
          </Typography>
          <IconButton onClick={() => setBranchDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} alignItems="center">
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
            >
              Choose a floor to explore the in-patient blueprint layout.
            </Typography>
            <BuildingShell>
              {selectedBranch?.floors
                ?.slice()
                .reverse()
                .map((floor) => (
                  <BuildingFloor
                    key={floor.id}
                    ownerState={{ isSelected: selectedFloorId === floor.id }}
                    onClick={() => handleFloorSelect(floor.id)}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ transform: 'skew(6deg)', fontWeight: 600 }}
                    >
                      {floor.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ transform: 'skew(6deg)', color: 'text.secondary' }}
                    >
                      {floor.rooms.length} rooms
                    </Typography>
                  </BuildingFloor>
                ))}
            </BuildingShell>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBranchDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={bookBedDialog.open}
        onClose={() => setBookBedDialog({ open: false, context: null })}
        maxWidth="sm"
        fullWidth
        component="form"
        onSubmit={handleBookBedSubmit}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Book Bed • {bookBedDialog.context?.bedLabel}
          </Typography>
          <IconButton
            onClick={() => setBookBedDialog({ open: false, context: null })}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              {bookBedDialog.context
                ? `${bookBedDialog.context.branchName} • ${bookBedDialog.context.floorName} • ${bookBedDialog.context.roomName}`
                : ''}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Appointment ID"
                  fullWidth
                  value={bookingForm.appointmentId}
                  onChange={(event) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      appointmentId: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Patient Name"
                  fullWidth
                  value={bookingForm.patientName}
                  onChange={(event) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      patientName: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Mobile Number"
                  fullWidth
                  value={bookingForm.mobileNumber}
                  onChange={(event) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      mobileNumber: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  label="Doctor / Assigned Doctor"
                  fullWidth
                  value={bookingForm.doctorName}
                  onChange={(event) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      doctorName: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Admission Date (optional)"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={bookingForm.admissionDate}
                  onChange={(event) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      admissionDate: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Admission Time (optional)"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={bookingForm.admissionTime}
                  onChange={(event) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      admissionTime: event.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBookBedDialog({ open: false, context: null })}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={viewBookingDialog.open}
        onClose={() => setViewBookingDialog({ open: false, context: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Bed Booking Details
          </Typography>
          <IconButton
            onClick={() => setViewBookingDialog({ open: false, context: null })}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {viewBookingDialog.context && (
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                {viewBookingDialog.context.branchName} •{' '}
                {viewBookingDialog.context.floorName} •{' '}
                {viewBookingDialog.context.roomName} •{' '}
                {viewBookingDialog.context.bedLabel}
              </Typography>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="body1">
                  <strong>Patient:</strong>{' '}
                  {viewBookingDialog.context.booking.patientName}
                </Typography>
                <Typography variant="body1">
                  <strong>Appointment ID:</strong>{' '}
                  {viewBookingDialog.context.booking.appointmentId}
                </Typography>
                <Typography variant="body1">
                  <strong>Mobile:</strong>{' '}
                  {viewBookingDialog.context.booking.mobileNumber}
                </Typography>
                <Typography variant="body1">
                  <strong>Doctor:</strong>{' '}
                  {viewBookingDialog.context.booking.doctorName}
                </Typography>
                {viewBookingDialog.context.booking.admissionDate && (
                  <Typography variant="body1">
                    <strong>Admission:</strong>{' '}
                    {dayjs(
                      viewBookingDialog.context.booking.admissionDate,
                    ).format('DD MMM YYYY')}
                    {viewBookingDialog.context.booking.admissionTime
                      ? ` • ${viewBookingDialog.context.booking.admissionTime}`
                      : ''}
                  </Typography>
                )}
                <Typography variant="body1">
                  <strong>Booked On:</strong>{' '}
                  {dayjs(viewBookingDialog.context.booking.bookedAt).format(
                    'DD MMM YYYY, hh:mm A',
                  )}
                </Typography>
                <Typography variant="body1">
                  <strong>Booked By:</strong>{' '}
                  {viewBookingDialog.context.booking.bookedBy}
                </Typography>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            color="error"
            onClick={() =>
              setVacateDialog({
                open: true,
                context: viewBookingDialog.context,
              })
            }
          >
            Vacate
          </Button>
          <Button
            onClick={() => setViewBookingDialog({ open: false, context: null })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={vacateDialog.open}
        onClose={() => setVacateDialog({ open: false, context: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Vacate Bed</DialogTitle>
        <DialogContent dividers>
          <Typography>
            Are you sure you want to vacate {vacateDialog.context?.bedLabel}?
            This will make the bed available for new bookings.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setVacateDialog({ open: false, context: null })}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleVacateConfirm}
          >
            Confirm Vacate
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={closeSnackbar}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LayoutsPage
