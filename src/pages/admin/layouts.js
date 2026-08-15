import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SaveIcon from '@mui/icons-material/Save'
import BusinessIcon from '@mui/icons-material/Business'
import StairsIcon from '@mui/icons-material/Stairs'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import HotelIcon from '@mui/icons-material/Hotel'
import CloseIcon from '@mui/icons-material/Close'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Breadcrumb from '@/components/Breadcrumb'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  getBuildings,
  getFloors,
  getRooms,
  getBeds,
  createBuilding,
  createFloor,
  createRoom,
  createBed,
  createBedsBulk,
  updateBuilding,
  updateFloor,
  updateRoom,
  updateBed,
  deleteFloor,
  deleteRoom,
  deleteBed,
} from '@/constants/apis'

const ROOM_TYPES = ['AC', 'Non-AC']
const ROOM_CATEGORIES = [
  'General',
  'Semi-Private',
  'Private',
  'Emergency',
  'Luxury',
  'VIP',
]
const BED_TYPES = ['Normal', 'ICU', 'Emergency', 'Luxury']
const BED_STATUSES = ['Available', 'Occupied', 'Reserved', 'Maintenance']

const emptyBuilding = {
  name: '',
  branchId: '',
  buildingCode: '',
  totalFloors: '',
  isActive: true,
}

const emptyFloor = {
  name: '',
  buildingId: '',
  floorNumber: '',
  floorType: 'IP',
  isActive: true,
}

const emptyRoom = {
  name: '',
  floorId: '',
  roomNumber: '',
  type: 'AC',
  roomCategory: 'General',
  genderRestriction: 'Any',
  totalBeds: 1,
  charges: 0,
  isActive: true,
}

const emptyBed = {
  name: '',
  roomId: '',
  bedNumber: '',
  bedType: 'Normal',
  hasOxygen: false,
  hasVentilator: false,
  charge: 0,
  status: 'Available',
  isActive: true,
}

const categoryColor = (category) => {
  const map = {
    Emergency: 'error',
    Luxury: 'warning',
    VIP: 'secondary',
    General: 'success',
    'Semi-Private': 'info',
    Private: 'primary',
  }
  return map[category] || 'default'
}

const LayoutsPage = () => {
  const user = useSelector((store) => store.user)
  const router = useRouter()
  const queryClient = useQueryClient()
  const branches = user?.branchDetails || []

  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedFloorId, setSelectedFloorId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  const [buildingModal, setBuildingModal] = useState(false)
  const [floorModal, setFloorModal] = useState(false)
  const [roomModal, setRoomModal] = useState(false)
  const [bedModal, setBedModal] = useState(false)
  const [bulkBedsModal, setBulkBedsModal] = useState(false)

  const [editingBuilding, setEditingBuilding] = useState(null)
  const [editingFloor, setEditingFloor] = useState(null)
  const [editingRoom, setEditingRoom] = useState(null)
  const [editingBed, setEditingBed] = useState(null)

  const [buildingForm, setBuildingForm] = useState(emptyBuilding)
  const [floorForm, setFloorForm] = useState(emptyFloor)
  const [roomForm, setRoomForm] = useState(emptyRoom)
  const [bedForm, setBedForm] = useState(emptyBed)
  const [bulkBedsForm, setBulkBedsForm] = useState({
    bedCount: 1,
    bedPrefix: 'Bed',
    startNumber: 1,
    bedType: 'Normal',
    charge: 0,
  })
  const [formErrors, setFormErrors] = useState({})
  const [inlineRoomForm, setInlineRoomForm] = useState(null)
  const [inlineDirty, setInlineDirty] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    type: '',
    id: null,
    name: '',
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    if (!branches.length) return
    const queryBranch = router.query.branchId
    if (queryBranch) {
      const match = branches.find((b) => String(b.id) === String(queryBranch))
      if (match) {
        setSelectedBranchId(match.id)
        return
      }
    }
    if (!selectedBranchId) setSelectedBranchId(branches[0].id)
  }, [branches, router.query.branchId, selectedBranchId])

  useEffect(() => {
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }, [selectedBranchId])

  useEffect(() => {
    setSelectedFloorId('')
    setSelectedRoomId('')
  }, [selectedBuildingId])

  useEffect(() => {
    setSelectedRoomId('')
  }, [selectedFloorId])

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const { data: buildingsResponse, isLoading: loadingBuildings } = useQuery({
    queryKey: ['buildings', selectedBranchId],
    queryFn: () => getBuildings(user.accessToken, selectedBranchId),
    enabled: Boolean(user.accessToken && selectedBranchId),
  })

  const buildings = useMemo(() => {
    const data = buildingsResponse?.data || buildingsResponse
    return Array.isArray(data) ? data : []
  }, [buildingsResponse])

  const { data: floorsResponse, isLoading: loadingFloors } = useQuery({
    queryKey: ['floors', selectedBuildingId],
    queryFn: () => getFloors(user.accessToken, selectedBuildingId),
    enabled: Boolean(user.accessToken && selectedBuildingId),
  })

  const floors = useMemo(() => {
    const data = floorsResponse?.data || floorsResponse
    const list = Array.isArray(data) ? data : []
    return [...list].sort(
      (a, b) => Number(a.floorNumber || 0) - Number(b.floorNumber || 0),
    )
  }, [floorsResponse])

  const { data: roomsResponse, isLoading: loadingRooms } = useQuery({
    queryKey: ['rooms', selectedFloorId],
    queryFn: () => getRooms(user.accessToken, selectedFloorId),
    enabled: Boolean(user.accessToken && selectedFloorId),
  })

  const rooms = useMemo(() => {
    const data = roomsResponse?.data || roomsResponse
    return Array.isArray(data) ? data : []
  }, [roomsResponse])

  const { data: bedsResponse, isLoading: loadingBeds } = useQuery({
    queryKey: ['beds', selectedRoomId],
    queryFn: () => getBeds(user.accessToken, selectedRoomId),
    enabled: Boolean(user.accessToken && selectedRoomId),
  })

  const beds = useMemo(() => {
    const data = bedsResponse?.data || bedsResponse
    return Array.isArray(data) ? data : []
  }, [bedsResponse])

  const selectedBuilding = buildings.find(
    (b) => String(b.id) === String(selectedBuildingId),
  )
  const selectedFloor = floors.find(
    (f) => String(f.id) === String(selectedFloorId),
  )
  const selectedRoom = rooms.find(
    (r) => String(r.id) === String(selectedRoomId),
  )

  // Auto-select single items so Save panel is immediately available
  useEffect(() => {
    if (!selectedBuildingId && buildings.length === 1) {
      setSelectedBuildingId(buildings[0].id)
    }
  }, [buildings, selectedBuildingId])

  useEffect(() => {
    if (!selectedFloorId && floors.length === 1) {
      setSelectedFloorId(floors[0].id)
    }
  }, [floors, selectedFloorId])

  useEffect(() => {
    if (!selectedRoomId && rooms.length === 1) {
      setSelectedRoomId(rooms[0].id)
    }
  }, [rooms, selectedRoomId])

  useEffect(() => {
    if (!selectedRoom) {
      setInlineRoomForm(null)
      setInlineDirty(false)
      return
    }
    setInlineRoomForm({
      name: selectedRoom.name || '',
      roomNumber: selectedRoom.roomNumber || '',
      type: selectedRoom.type || 'AC',
      roomCategory: selectedRoom.roomCategory || 'General',
      charges: selectedRoom.charges ?? 0,
      totalBeds: selectedRoom.totalBeds ?? beds.length ?? 0,
      genderRestriction: selectedRoom.genderRestriction || 'Any',
      isActive: selectedRoom.isActive !== false,
      floorId: selectedRoom.floorId || selectedFloorId,
    })
    setInlineDirty(false)
  }, [selectedRoom?.id, selectedFloorId])

  const invalidateLayout = () => {
    queryClient.invalidateQueries({ queryKey: ['buildings'] })
    queryClient.invalidateQueries({ queryKey: ['floors'] })
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
    queryClient.invalidateQueries({ queryKey: ['beds'] })
  }

  const buildingMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...buildingForm,
        branchId: selectedBranchId,
        totalFloors: buildingForm.totalFloors
          ? Number(buildingForm.totalFloors)
          : undefined,
      }
      if (editingBuilding) {
        return updateBuilding(user.accessToken, editingBuilding, payload)
      }
      return createBuilding(user.accessToken, payload)
    },
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        showMessage(response.message || 'Building save failed', 'error')
        return
      }
      invalidateLayout()
      showMessage(
        response?.message ||
          (editingBuilding ? 'Building updated' : 'Building created'),
      )
      setBuildingModal(false)
      setEditingBuilding(null)
      setBuildingForm(emptyBuilding)
    },
    onError: (error) =>
      showMessage(error.message || 'Building save failed', 'error'),
  })

  const floorMutation = useMutation({
    mutationFn: async () => {
      const floorNumber = Number(floorForm.floorNumber)
      const payload = {
        ...floorForm,
        buildingId: selectedBuildingId,
        floorNumber,
        name: floorForm.name?.trim() || `Floor ${floorNumber}`,
      }
      if (editingFloor) {
        return updateFloor(user.accessToken, editingFloor, payload)
      }
      return createFloor(user.accessToken, payload)
    },
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        showMessage(response.message || 'Floor save failed', 'error')
        return
      }
      invalidateLayout()
      showMessage(
        response?.message || (editingFloor ? 'Floor updated' : 'Floor created'),
      )
      setFloorModal(false)
      setEditingFloor(null)
      setFloorForm(emptyFloor)
    },
    onError: (error) =>
      showMessage(error.message || 'Floor save failed', 'error'),
  })

  const roomMutation = useMutation({
    mutationFn: async () => {
      const totalBeds = Number(roomForm.totalBeds) || 0
      const payload = {
        ...roomForm,
        floorId: selectedFloorId,
        name: roomForm.name?.trim() || `Room ${roomForm.roomNumber}`,
        totalBeds,
        charges: Number(roomForm.charges) || 0,
      }
      if (editingRoom) {
        return updateRoom(user.accessToken, editingRoom, payload)
      }
      const response = await createRoom(user.accessToken, payload)
      const roomData = response?.data || response
      if (roomData?.id && totalBeds > 0 && !editingRoom) {
        await createBedsBulk(user.accessToken, {
          roomId: roomData.id,
          bedCount: totalBeds,
          bedPrefix: 'Bed',
          startNumber: 1,
          bedType: 'Normal',
          charge: Number(roomForm.charges) || 0,
        })
      }
      return response
    },
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        showMessage(response.message || 'Room save failed', 'error')
        return
      }
      invalidateLayout()
      showMessage(
        response?.message ||
          (editingRoom
            ? 'Room saved'
            : `Room saved${roomForm.totalBeds > 0 ? ` with ${roomForm.totalBeds} bed(s)` : ''}`),
      )
      setRoomModal(false)
      setEditingRoom(null)
      setRoomForm(emptyRoom)
    },
    onError: (error) =>
      showMessage(error.message || 'Room save failed', 'error'),
  })

  const inlineRoomSaveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRoomId || !inlineRoomForm) {
        throw new Error('Select a room to save')
      }
      const desiredBeds = Number(inlineRoomForm.totalBeds) || 0
      const payload = {
        ...inlineRoomForm,
        floorId: selectedFloorId,
        name:
          inlineRoomForm.name?.trim() || `Room ${inlineRoomForm.roomNumber}`,
        totalBeds: desiredBeds,
        charges: Number(inlineRoomForm.charges) || 0,
      }
      const response = await updateRoom(
        user.accessToken,
        selectedRoomId,
        payload,
      )
      const missingBeds = Math.max(desiredBeds - beds.length, 0)
      if (missingBeds > 0) {
        await createBedsBulk(user.accessToken, {
          roomId: selectedRoomId,
          bedCount: missingBeds,
          bedPrefix: 'Bed',
          startNumber: beds.length + 1,
          bedType: 'Normal',
          charge: Number(inlineRoomForm.charges) || 0,
        })
      }
      return { response, missingBeds }
    },
    onSuccess: ({ response, missingBeds }) => {
      if (response?.status && response.status !== 200) {
        showMessage(response.message || 'Room save failed', 'error')
        return
      }
      invalidateLayout()
      setInlineDirty(false)
      showMessage(
        missingBeds > 0
          ? `Room saved and ${missingBeds} bed(s) created`
          : response?.message || 'Room details saved',
      )
    },
    onError: (error) =>
      showMessage(error.message || 'Room save failed', 'error'),
  })

  const bedMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...bedForm,
        roomId: selectedRoomId,
        name: bedForm.name?.trim() || `Bed ${bedForm.bedNumber}`,
        charge: Number(bedForm.charge) || 0,
      }
      if (editingBed) {
        return updateBed(user.accessToken, editingBed, payload)
      }
      return createBed(user.accessToken, payload)
    },
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        showMessage(response.message || 'Bed save failed', 'error')
        return
      }
      invalidateLayout()
      showMessage(
        response?.message || (editingBed ? 'Bed updated' : 'Bed created'),
      )
      setBedModal(false)
      setEditingBed(null)
      setBedForm(emptyBed)
    },
    onError: (error) =>
      showMessage(error.message || 'Bed save failed', 'error'),
  })

  const bulkBedsMutation = useMutation({
    mutationFn: () =>
      createBedsBulk(user.accessToken, {
        roomId: selectedRoomId,
        bedCount: Number(bulkBedsForm.bedCount),
        bedPrefix: bulkBedsForm.bedPrefix || 'Bed',
        startNumber: Number(bulkBedsForm.startNumber) || 1,
        bedType: bulkBedsForm.bedType,
        charge: Number(bulkBedsForm.charge) || 0,
      }),
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        showMessage(response.message || 'Bulk beds failed', 'error')
        return
      }
      invalidateLayout()
      showMessage(response?.message || 'Beds created')
      setBulkBedsModal(false)
      setBulkBedsForm({
        bedCount: 1,
        bedPrefix: 'Bed',
        startNumber: 1,
        bedType: 'Normal',
        charge: 0,
      })
    },
    onError: (error) =>
      showMessage(error.message || 'Bulk beds failed', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { type, id } = deleteConfirm
      if (type === 'floor') return deleteFloor(user.accessToken, id)
      if (type === 'room') return deleteRoom(user.accessToken, id)
      if (type === 'bed') return deleteBed(user.accessToken, id)
      throw new Error('Unsupported delete')
    },
    onSuccess: (response) => {
      if (response?.status && response.status !== 200) {
        showMessage(response.message || 'Delete failed', 'error')
        return
      }
      invalidateLayout()
      if (deleteConfirm.type === 'floor') setSelectedFloorId('')
      if (deleteConfirm.type === 'room') setSelectedRoomId('')
      showMessage(response?.message || 'Deleted successfully')
      setDeleteConfirm({ open: false, type: '', id: null, name: '' })
    },
    onError: (error) => showMessage(error.message || 'Delete failed', 'error'),
  })

  const openAddBuilding = () => {
    setEditingBuilding(null)
    setBuildingForm({ ...emptyBuilding, branchId: selectedBranchId })
    setFormErrors({})
    setBuildingModal(true)
  }

  const openEditBuilding = (building) => {
    setEditingBuilding(building.id)
    setBuildingForm({
      name: building.name || '',
      branchId: building.branchId || selectedBranchId,
      buildingCode: building.buildingCode || '',
      totalFloors: building.totalFloors ?? '',
      isActive: building.isActive !== false,
    })
    setFormErrors({})
    setBuildingModal(true)
  }

  const openAddFloor = () => {
    setEditingFloor(null)
    setFloorForm({
      ...emptyFloor,
      buildingId: selectedBuildingId,
      floorNumber: String((floors[floors.length - 1]?.floorNumber || 0) + 1),
    })
    setFormErrors({})
    setFloorModal(true)
  }

  const openEditFloor = (floor) => {
    setEditingFloor(floor.id)
    setFloorForm({
      name: floor.name || '',
      buildingId: floor.buildingId || selectedBuildingId,
      floorNumber: floor.floorNumber ?? '',
      floorType: floor.floorType || 'IP',
      isActive: floor.isActive !== false,
    })
    setFormErrors({})
    setFloorModal(true)
  }

  const openAddRoom = () => {
    setEditingRoom(null)
    setRoomForm({ ...emptyRoom, floorId: selectedFloorId })
    setFormErrors({})
    setRoomModal(true)
  }

  const openEditRoom = (room) => {
    setEditingRoom(room.id)
    setRoomForm({
      name: room.name || '',
      floorId: room.floorId || selectedFloorId,
      roomNumber: room.roomNumber || '',
      type: room.type || 'AC',
      roomCategory: room.roomCategory || 'General',
      genderRestriction: room.genderRestriction || 'Any',
      totalBeds: room.totalBeds ?? 0,
      charges: room.charges ?? 0,
      isActive: room.isActive !== false,
    })
    setFormErrors({})
    setRoomModal(true)
  }

  const openAddBed = () => {
    setEditingBed(null)
    setBedForm({
      ...emptyBed,
      roomId: selectedRoomId,
      charge: selectedRoom?.charges || 0,
    })
    setFormErrors({})
    setBedModal(true)
  }

  const openEditBed = (bed) => {
    setEditingBed(bed.id)
    setBedForm({
      name: bed.name || '',
      roomId: bed.roomId || selectedRoomId,
      bedNumber: bed.bedNumber || '',
      bedType: bed.bedType || 'Normal',
      hasOxygen: !!bed.hasOxygen,
      hasVentilator: !!bed.hasVentilator,
      charge: bed.charge ?? 0,
      status: bed.status || 'Available',
      isActive: bed.isActive !== false,
    })
    setFormErrors({})
    setBedModal(true)
  }

  const validateBuilding = () => {
    const errors = {}
    if (!buildingForm.name?.trim()) errors.name = 'Building name is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateFloor = () => {
    const errors = {}
    if (
      floorForm.floorNumber === '' ||
      floorForm.floorNumber === null ||
      Number.isNaN(Number(floorForm.floorNumber))
    ) {
      errors.floorNumber = 'Floor number is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateRoom = () => {
    const errors = {}
    if (!roomForm.roomNumber?.trim() && !roomForm.name?.trim()) {
      errors.roomNumber = 'Room number or name is required'
    }
    if (!roomForm.type) errors.type = 'Room type is required'
    if (!roomForm.roomCategory) errors.roomCategory = 'Category is required'
    if (Number(roomForm.totalBeds) < 0) {
      errors.totalBeds = 'Beds cannot be negative'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateBed = () => {
    const errors = {}
    if (!bedForm.name?.trim() && !bedForm.bedNumber?.trim()) {
      errors.name = 'Bed name or number is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleBranchChange = (value) => {
    setSelectedBranchId(value)
    router.replace(
      {
        pathname: '/admin/layouts',
        query: { branchId: value || '' },
      },
      undefined,
      { shallow: true },
    )
  }

  const bedStatusSx = (status) => {
    const key = String(status || 'Available').toLowerCase()
    if (key === 'occupied')
      return { borderColor: '#F87171', bgcolor: '#FEE2E2' }
    if (key === 'reserved')
      return { borderColor: '#FBBF24', bgcolor: '#FEF3C7' }
    if (key === 'maintenance')
      return { borderColor: '#9CA3AF', bgcolor: '#F3F4F6' }
    return { borderColor: '#4ADE80', bgcolor: '#F0FDF4' }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Breadcrumb />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3, mt: 1 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Master Layouts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a branch, then add buildings, floors, rooms (type & cost) and
            beds. This is part of Master Data. Booking is done from Book Option.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            onClick={() =>
              router.push({
                pathname: '/book-option',
                query: selectedBranchId ? { branchId: selectedBranchId } : {},
              })
            }
          >
            Book Option
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push('/admin/managefields')}
          >
            Back to Master Data
          </Button>
        </Stack>
      </Stack>

      <Card
        elevation={0}
        sx={{ mb: 2.5, border: '1px solid', borderColor: 'divider' }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  value={selectedBranchId || ''}
                  onChange={(e) => handleBranchChange(e.target.value)}
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name || branch.branchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={<BusinessIcon />}
                  label={`${buildings.length} building(s)`}
                  variant="outlined"
                />
                {selectedBuilding && (
                  <Chip
                    icon={<StairsIcon />}
                    label={`${floors.length} floor(s)`}
                    variant="outlined"
                  />
                )}
                {selectedFloor && (
                  <Chip
                    icon={<MeetingRoomIcon />}
                    label={`${rooms.length} room(s)`}
                    variant="outlined"
                  />
                )}
                {selectedRoom && (
                  <Chip
                    icon={<HotelIcon />}
                    label={`${beds.length} bed(s)`}
                    variant="outlined"
                  />
                )}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {!selectedBranchId ? (
        <Alert severity="info">Select a branch to manage layouts.</Alert>
      ) : (
        <Grid container spacing={2.5}>
          {/* Buildings */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Buildings
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={openAddBuilding}
                  >
                    Add
                  </Button>
                </Stack>

                {loadingBuildings ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                ) : buildings.length === 0 ? (
                  <Alert severity="warning">
                    No buildings yet. Add a building name to continue.
                  </Alert>
                ) : (
                  <Stack spacing={1.25}>
                    {buildings.map((building) => {
                      const selected =
                        String(building.id) === String(selectedBuildingId)
                      return (
                        <Box
                          key={building.id}
                          onClick={() => setSelectedBuildingId(building.id)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: selected ? 'primary.main' : 'divider',
                            bgcolor: selected ? '#EFF6FF' : 'background.paper',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'primary.light' },
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
                                {building.name}
                              </Typography>
                              {building.buildingCode && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Code: {building.buildingCode}
                                </Typography>
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditBuilding(building)
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Floors */}
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Floors
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    variant="contained"
                    disabled={!selectedBuildingId}
                    onClick={openAddFloor}
                  >
                    Add
                  </Button>
                </Stack>

                {!selectedBuildingId ? (
                  <Typography variant="body2" color="text.secondary">
                    Select a building to manage floors.
                  </Typography>
                ) : loadingFloors ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                ) : floors.length === 0 ? (
                  <Alert severity="info">
                    No floors. Add floor numbers for this building.
                  </Alert>
                ) : (
                  <Stack spacing={1}>
                    {floors.map((floor) => {
                      const selected =
                        String(floor.id) === String(selectedFloorId)
                      return (
                        <Box
                          key={floor.id}
                          onClick={() => setSelectedFloorId(floor.id)}
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: selected ? 'primary.main' : 'divider',
                            bgcolor: selected ? '#EFF6FF' : 'background.paper',
                            cursor: 'pointer',
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700 }}
                              >
                                {floor.name &&
                                String(floor.name) !== String(floor.floorNumber)
                                  ? floor.name
                                  : `Floor ${floor.floorNumber}`}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Floor No. {floor.floorNumber}
                              </Typography>
                            </Box>
                            <Stack direction="row">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditFloor(floor)
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'floor',
                                    id: floor.id,
                                    name:
                                      floor.name ||
                                      `Floor ${floor.floorNumber}`,
                                  })
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Rooms + Beds */}
          <Grid item xs={12} md={5}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Rooms & Beds
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    variant="contained"
                    disabled={!selectedFloorId}
                    onClick={openAddRoom}
                  >
                    Add room
                  </Button>
                </Stack>

                {!selectedFloorId ? (
                  <Typography variant="body2" color="text.secondary">
                    Select a floor to add rooms (type, cost, beds).
                  </Typography>
                ) : loadingRooms ? (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 4 }}
                  >
                    <CircularProgress size={28} />
                  </Box>
                ) : rooms.length === 0 ? (
                  <Alert severity="info">
                    No rooms on this floor. Add a room with type, cost and beds
                    per room.
                  </Alert>
                ) : (
                  <Stack spacing={1.5}>
                    {rooms.map((room) => {
                      const selected =
                        String(room.id) === String(selectedRoomId)
                      return (
                        <Box
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '2px solid',
                            borderColor: selected ? 'primary.main' : 'divider',
                            bgcolor: selected ? '#EFF6FF' : 'background.paper',
                            cursor: 'pointer',
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
                                {room.name || `Room ${room.roomNumber}`}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0.75}
                                sx={{ mt: 0.75 }}
                                flexWrap="wrap"
                                useFlexGap
                              >
                                <Chip
                                  size="small"
                                  label={room.type || 'AC'}
                                  color={
                                    room.type === 'AC' ? 'info' : 'default'
                                  }
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={room.roomCategory || 'General'}
                                  color={categoryColor(room.roomCategory)}
                                />
                                <Chip
                                  size="small"
                                  label={`₹${room.charges ?? 0}`}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={`${room.totalBeds ?? 0} beds`}
                                  variant="outlined"
                                />
                              </Stack>
                            </Box>
                            <Stack direction="row">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openEditRoom(room)
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm({
                                    open: true,
                                    type: 'room',
                                    id: room.id,
                                    name:
                                      room.name || `Room ${room.roomNumber}`,
                                  })
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Box>
                      )
                    })}
                  </Stack>
                )}

                {selectedRoomId && inlineRoomForm && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: inlineDirty ? 'warning.main' : 'divider',
                        bgcolor: inlineDirty ? '#FFFBEB' : '#F8FAFC',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ mb: 1.5 }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          Room details — edit & save
                        </Typography>
                        {inlineDirty && (
                          <Chip size="small" color="warning" label="Unsaved" />
                        )}
                      </Stack>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <TextField
                            label="Room no."
                            size="small"
                            fullWidth
                            value={inlineRoomForm.roomNumber}
                            onChange={(e) => {
                              setInlineRoomForm({
                                ...inlineRoomForm,
                                roomNumber: e.target.value,
                              })
                              setInlineDirty(true)
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Cost (₹)"
                            type="number"
                            size="small"
                            fullWidth
                            value={inlineRoomForm.charges}
                            onChange={(e) => {
                              setInlineRoomForm({
                                ...inlineRoomForm,
                                charges: e.target.value,
                              })
                              setInlineDirty(true)
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Type</InputLabel>
                            <Select
                              label="Type"
                              value={inlineRoomForm.type}
                              onChange={(e) => {
                                setInlineRoomForm({
                                  ...inlineRoomForm,
                                  type: e.target.value,
                                })
                                setInlineDirty(true)
                              }}
                            >
                              {ROOM_TYPES.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select
                              label="Category"
                              value={inlineRoomForm.roomCategory}
                              onChange={(e) => {
                                setInlineRoomForm({
                                  ...inlineRoomForm,
                                  roomCategory: e.target.value,
                                })
                                setInlineDirty(true)
                              }}
                            >
                              {ROOM_CATEGORIES.map((cat) => (
                                <MenuItem key={cat} value={cat}>
                                  {cat}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            label="Beds per room"
                            type="number"
                            size="small"
                            fullWidth
                            helperText={`Current beds: ${beds.length}. Saving a higher count creates the missing beds.`}
                            value={inlineRoomForm.totalBeds}
                            onChange={(e) => {
                              setInlineRoomForm({
                                ...inlineRoomForm,
                                totalBeds: e.target.value,
                              })
                              setInlineDirty(true)
                            }}
                          />
                        </Grid>
                      </Grid>
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        sx={{ mt: 2 }}
                      >
                        <Button
                          size="small"
                          disabled={!inlineDirty}
                          onClick={() => {
                            if (!selectedRoom) return
                            setInlineRoomForm({
                              name: selectedRoom.name || '',
                              roomNumber: selectedRoom.roomNumber || '',
                              type: selectedRoom.type || 'AC',
                              roomCategory:
                                selectedRoom.roomCategory || 'General',
                              charges: selectedRoom.charges ?? 0,
                              totalBeds:
                                selectedRoom.totalBeds ?? beds.length ?? 0,
                              genderRestriction:
                                selectedRoom.genderRestriction || 'Any',
                              isActive: selectedRoom.isActive !== false,
                              floorId: selectedRoom.floorId || selectedFloorId,
                            })
                            setInlineDirty(false)
                          }}
                        >
                          Discard
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<SaveIcon />}
                          disabled={inlineRoomSaveMutation.isPending}
                          onClick={() => inlineRoomSaveMutation.mutate()}
                        >
                          {inlineRoomSaveMutation.isPending
                            ? 'Saving…'
                            : 'Save room'}
                        </Button>
                      </Stack>
                    </Box>
                  </>
                )}

                {selectedRoomId && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1.5 }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Beds in{' '}
                        {selectedRoom?.name ||
                          `Room ${selectedRoom?.roomNumber}`}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={openAddBed}>
                          Add bed
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SaveIcon />}
                          onClick={() => {
                            setBulkBedsForm({
                              bedCount: Math.max(
                                1,
                                Number(inlineRoomForm?.totalBeds) || 1,
                              ),
                              bedPrefix: 'Bed',
                              startNumber: (beds.length || 0) + 1,
                              bedType: 'Normal',
                              charge: selectedRoom?.charges || 0,
                            })
                            setBulkBedsModal(true)
                          }}
                        >
                          Bulk add & save
                        </Button>
                      </Stack>
                    </Stack>

                    {loadingBeds ? (
                      <CircularProgress size={22} />
                    ) : beds.length === 0 ? (
                      <Alert
                        severity="warning"
                        action={
                          <Button
                            color="inherit"
                            size="small"
                            startIcon={<SaveIcon />}
                            onClick={() => {
                              setBulkBedsForm({
                                bedCount: Math.max(
                                  1,
                                  Number(inlineRoomForm?.totalBeds) || 1,
                                ),
                                bedPrefix: 'Bed',
                                startNumber: 1,
                                bedType: 'Normal',
                                charge: Number(inlineRoomForm?.charges) || 0,
                              })
                              setBulkBedsModal(true)
                            }}
                          >
                            Save beds
                          </Button>
                        }
                      >
                        No beds yet. Set beds per room above and Save room, or
                        use Save beds.
                      </Alert>
                    ) : (
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1,
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(100px, 1fr))',
                        }}
                      >
                        {beds.map((bed) => (
                          <Tooltip
                            key={bed.id}
                            title={`${bed.bedType || 'Normal'} · ${bed.status || 'Available'}`}
                          >
                            <Box
                              sx={{
                                ...bedStatusSx(bed.status),
                                border: '2px solid',
                                borderRadius: 2,
                                p: 1,
                                position: 'relative',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, display: 'block' }}
                              >
                                {bed.name || bed.bedNumber}
                              </Typography>
                              <Typography variant="caption">
                                {bed.status || 'Available'}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={0}
                                sx={{ position: 'absolute', top: 0, right: 0 }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => openEditBed(bed)}
                                >
                                  <EditIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      type: 'bed',
                                      id: bed.id,
                                      name: bed.name || bed.bedNumber,
                                    })
                                  }
                                >
                                  <DeleteIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Building modal */}
      <Dialog
        open={buildingModal}
        onClose={() => setBuildingModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">
              {editingBuilding ? 'Edit building' : 'Add building'}
            </Typography>
            <IconButton onClick={() => setBuildingModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Building name"
              fullWidth
              required
              value={buildingForm.name}
              error={!!formErrors.name}
              helperText={formErrors.name}
              onChange={(e) =>
                setBuildingForm({ ...buildingForm, name: e.target.value })
              }
            />
            <TextField
              label="Building code"
              fullWidth
              value={buildingForm.buildingCode}
              onChange={(e) =>
                setBuildingForm({
                  ...buildingForm,
                  buildingCode: e.target.value,
                })
              }
            />
            <TextField
              label="Total floors (optional)"
              type="number"
              fullWidth
              value={buildingForm.totalFloors}
              onChange={(e) =>
                setBuildingForm({
                  ...buildingForm,
                  totalFloors: e.target.value,
                })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={buildingForm.isActive}
                  onChange={(e) =>
                    setBuildingForm({
                      ...buildingForm,
                      isActive: e.target.checked,
                    })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuildingModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={buildingMutation.isPending}
            onClick={() => validateBuilding() && buildingMutation.mutate()}
          >
            {buildingMutation.isPending ? 'Saving…' : 'Save building'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floor modal */}
      <Dialog
        open={floorModal}
        onClose={() => setFloorModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingFloor ? 'Edit floor' : 'Add floor'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Floor number"
              type="number"
              fullWidth
              required
              value={floorForm.floorNumber}
              error={!!formErrors.floorNumber}
              helperText={formErrors.floorNumber}
              onChange={(e) =>
                setFloorForm({ ...floorForm, floorNumber: e.target.value })
              }
            />
            <TextField
              label="Floor name (optional)"
              fullWidth
              placeholder="Auto: Floor {number}"
              value={floorForm.name}
              onChange={(e) =>
                setFloorForm({ ...floorForm, name: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Floor type</InputLabel>
              <Select
                label="Floor type"
                value={floorForm.floorType}
                onChange={(e) =>
                  setFloorForm({ ...floorForm, floorType: e.target.value })
                }
              >
                <MenuItem value="IP">IP</MenuItem>
                <MenuItem value="OP">OP</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
                <MenuItem value="OT">OT</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFloorModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={floorMutation.isPending}
            onClick={() => validateFloor() && floorMutation.mutate()}
          >
            {floorMutation.isPending ? 'Saving…' : 'Save floor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Room modal */}
      <Dialog
        open={roomModal}
        onClose={() => setRoomModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingRoom ? 'Edit room' : 'Add room'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Room number"
              fullWidth
              required
              value={roomForm.roomNumber}
              error={!!formErrors.roomNumber}
              helperText={formErrors.roomNumber}
              onChange={(e) =>
                setRoomForm({ ...roomForm, roomNumber: e.target.value })
              }
            />
            <TextField
              label="Room name (optional)"
              fullWidth
              placeholder="Auto: Room {number}"
              value={roomForm.name}
              onChange={(e) =>
                setRoomForm({ ...roomForm, name: e.target.value })
              }
            />
            <FormControl fullWidth error={!!formErrors.type}>
              <InputLabel>Room type (AC / Non-AC)</InputLabel>
              <Select
                label="Room type (AC / Non-AC)"
                value={roomForm.type}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, type: e.target.value })
                }
              >
                {ROOM_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.type && (
                <FormHelperText>{formErrors.type}</FormHelperText>
              )}
            </FormControl>
            <FormControl fullWidth error={!!formErrors.roomCategory}>
              <InputLabel>Room category</InputLabel>
              <Select
                label="Room category"
                value={roomForm.roomCategory}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, roomCategory: e.target.value })
                }
              >
                {ROOM_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Room cost / charges"
              type="number"
              fullWidth
              value={roomForm.charges}
              onChange={(e) =>
                setRoomForm({ ...roomForm, charges: e.target.value })
              }
            />
            <TextField
              label="Beds per room"
              type="number"
              fullWidth
              error={!!formErrors.totalBeds}
              helperText={
                formErrors.totalBeds ||
                (editingRoom
                  ? 'Updating count does not auto-create beds — use Bulk add'
                  : 'Beds will be auto-created when the room is saved')
              }
              value={roomForm.totalBeds}
              onChange={(e) =>
                setRoomForm({ ...roomForm, totalBeds: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Gender restriction</InputLabel>
              <Select
                label="Gender restriction"
                value={roomForm.genderRestriction}
                onChange={(e) =>
                  setRoomForm({
                    ...roomForm,
                    genderRestriction: e.target.value,
                  })
                }
              >
                <MenuItem value="Any">Any</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={roomMutation.isPending}
            onClick={() => validateRoom() && roomMutation.mutate()}
          >
            {roomMutation.isPending ? 'Saving…' : 'Save room'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bed modal */}
      <Dialog
        open={bedModal}
        onClose={() => setBedModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingBed ? 'Edit bed' : 'Add bed'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Bed name"
              fullWidth
              value={bedForm.name}
              error={!!formErrors.name}
              helperText={formErrors.name}
              onChange={(e) => setBedForm({ ...bedForm, name: e.target.value })}
            />
            <TextField
              label="Bed number"
              fullWidth
              value={bedForm.bedNumber}
              onChange={(e) =>
                setBedForm({ ...bedForm, bedNumber: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Bed type</InputLabel>
              <Select
                label="Bed type"
                value={bedForm.bedType}
                onChange={(e) =>
                  setBedForm({ ...bedForm, bedType: e.target.value })
                }
              >
                {BED_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={bedForm.status}
                onChange={(e) =>
                  setBedForm({ ...bedForm, status: e.target.value })
                }
              >
                {BED_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Bed charge"
              type="number"
              fullWidth
              value={bedForm.charge}
              onChange={(e) =>
                setBedForm({ ...bedForm, charge: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={bedForm.hasOxygen}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, hasOxygen: e.target.checked })
                  }
                />
              }
              label="Has oxygen"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={bedForm.hasVentilator}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, hasVentilator: e.target.checked })
                  }
                />
              }
              label="Has ventilator"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBedModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={bedMutation.isPending}
            onClick={() => validateBed() && bedMutation.mutate()}
          >
            {bedMutation.isPending ? 'Saving…' : 'Save bed'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk beds */}
      <Dialog
        open={bulkBedsModal}
        onClose={() => setBulkBedsModal(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Bulk add beds</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Number of beds"
              type="number"
              fullWidth
              value={bulkBedsForm.bedCount}
              onChange={(e) =>
                setBulkBedsForm({ ...bulkBedsForm, bedCount: e.target.value })
              }
            />
            <TextField
              label="Name prefix"
              fullWidth
              value={bulkBedsForm.bedPrefix}
              onChange={(e) =>
                setBulkBedsForm({ ...bulkBedsForm, bedPrefix: e.target.value })
              }
            />
            <TextField
              label="Start number"
              type="number"
              fullWidth
              value={bulkBedsForm.startNumber}
              onChange={(e) =>
                setBulkBedsForm({
                  ...bulkBedsForm,
                  startNumber: e.target.value,
                })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Bed type</InputLabel>
              <Select
                label="Bed type"
                value={bulkBedsForm.bedType}
                onChange={(e) =>
                  setBulkBedsForm({ ...bulkBedsForm, bedType: e.target.value })
                }
              >
                {BED_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Charge per bed"
              type="number"
              fullWidth
              value={bulkBedsForm.charge}
              onChange={(e) =>
                setBulkBedsForm({ ...bulkBedsForm, charge: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkBedsModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={bulkBedsMutation.isPending}
            onClick={() => bulkBedsMutation.mutate()}
          >
            {bulkBedsMutation.isPending ? 'Saving…' : 'Save beds'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() =>
          setDeleteConfirm({ open: false, type: '', id: null, name: '' })
        }
      >
        <DialogTitle>Delete {deleteConfirm.type}?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{deleteConfirm.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteConfirm({ open: false, type: '', id: null, name: '' })
            }
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sticky save bar */}
      {selectedRoomId && (
        <Box
          sx={{
            position: 'sticky',
            bottom: 16,
            zIndex: 10,
            mt: 3,
            p: 2,
            borderRadius: 2,
            border: '1px solid',
            borderColor: inlineDirty ? 'warning.light' : 'divider',
            bgcolor: 'background.paper',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={1.5}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Save options
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {inlineDirty
                  ? 'You have unsaved room changes.'
                  : 'Edit room cost, type, category or beds above, then save.'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                disabled={!selectedRoomId}
                onClick={() => {
                  setBulkBedsForm({
                    bedCount: Math.max(
                      1,
                      Number(inlineRoomForm?.totalBeds) || 1,
                    ),
                    bedPrefix: 'Bed',
                    startNumber: (beds.length || 0) + 1,
                    bedType: 'Normal',
                    charge: Number(inlineRoomForm?.charges) || 0,
                  })
                  setBulkBedsModal(true)
                }}
              >
                Save beds
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={!inlineRoomForm || inlineRoomSaveMutation.isPending}
                onClick={() => inlineRoomSaveMutation.mutate()}
              >
                {inlineRoomSaveMutation.isPending
                  ? 'Saving…'
                  : 'Save room details'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default withPermission(LayoutsPage, true, 'masterData', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
