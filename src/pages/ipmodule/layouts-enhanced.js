import React, { useMemo, useState, useEffect } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
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
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import HotelIcon from '@mui/icons-material/Hotel'
import LocalHotelIcon from '@mui/icons-material/LocalHotel'
import EngineeringIcon from '@mui/icons-material/Engineering'
import BusinessIcon from '@mui/icons-material/Business'
import ApartmentIcon from '@mui/icons-material/Apartment'
import StairsIcon from '@mui/icons-material/Stairs'
import { styled } from '@mui/material/styles'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Breadcrumb from '@/components/Breadcrumb'
import {
  getStates,
  getCities,
  getBranches,
  getBuildings,
  getFloors,
  getRooms,
  getBeds,
  createState,
  createCity,
  createBranch,
  createBuilding,
  createFloor,
  createRoom,
  createBed,
  createBedsBulk,
  updateState,
  updateCity,
  updateBranch,
  updateBuilding,
  updateFloor,
  updateRoom,
  updateBed,
  deleteFloor,
  deleteRoom,
  deleteBed,
} from '../../constants/apis'

// Styled components
const BedBox = styled(Box)(({ theme, ownerState }) => {
  const statusColors = {
    Available: theme.palette.success.main,
    Occupied: theme.palette.error.main,
    Reserved: theme.palette.warning.main,
    Maintenance: theme.palette.info.main,
  }

  const { status } = ownerState

  return {
    borderRadius: theme.spacing(1),
    padding: theme.spacing(1),
    border: `2px solid ${statusColors[status] || theme.palette.divider}`,
    backgroundColor: `${statusColors[status] || theme.palette.divider}15`,
    color: theme.palette.getContrastText(
      statusColors[status] || theme.palette.background.paper,
    ),
    textAlign: 'center',
    cursor: status === 'Maintenance' ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    minHeight: 70,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 0.5,
    '&:hover': {
      backgroundColor: `${statusColors[status]}25`,
      transform: status === 'Maintenance' ? 'none' : 'translateY(-2px)',
    },
  }
})

const LayoutsPage = () => {
  const user = useSelector((store) => store.user)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Selection states
  const [selectedStateId, setSelectedStateId] = useState('')
  const [selectedCityId, setSelectedCityId] = useState('')
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [selectedBuildingId, setSelectedBuildingId] = useState('')
  const [selectedFloorId, setSelectedFloorId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')

  // Modal states
  const [addStateModal, setAddStateModal] = useState(false)
  const [addCityModal, setAddCityModal] = useState(false)
  const [addBranchModal, setAddBranchModal] = useState(false)
  const [manageBuildingsModal, setManageBuildingsModal] = useState(false)
  const [addBuildingModal, setAddBuildingModal] = useState(false)
  const [addFloorModal, setAddFloorModal] = useState(false)
  const [addRoomModal, setAddRoomModal] = useState(false)
  const [addBedModal, setAddBedModal] = useState(false)
  const [addBedsBulkModal, setAddBedsBulkModal] = useState(false)

  // Form states
  const [stateForm, setStateForm] = useState({ name: '', isActive: true })
  const [cityForm, setCityForm] = useState({
    name: '',
    stateId: '',
    isActive: true,
  })
  const [branchForm, setBranchForm] = useState({
    name: '',
    cityId: '',
    branchCode: '',
    address: '',
    isActive: true,
  })
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    branchId: '',
    buildingCode: '',
    totalFloors: '',
    isActive: true,
  })
  const [floorForm, setFloorForm] = useState({
    name: '',
    buildingId: '',
    floorNumber: '',
    floorType: 'IP',
    isActive: true,
  })
  const [roomForm, setRoomForm] = useState({
    name: '',
    floorId: '',
    roomNumber: '',
    type: 'AC',
    roomCategory: 'General',
    genderRestriction: 'Any',
    totalBeds: 0,
    charges: 0,
    isActive: true,
  })
  const [bedForm, setBedForm] = useState({
    name: '',
    roomId: '',
    bedNumber: '',
    bedType: 'Normal',
    hasOxygen: false,
    hasVentilator: false,
    charge: 0,
    status: 'Available',
    isActive: true,
  })
  const [bedsBulkForm, setBedsBulkForm] = useState({
    roomId: '',
    bedCount: 1,
    bedPrefix: 'Bed',
    startNumber: 1,
    bedType: 'Normal',
    charge: 0,
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const [activeTab, setActiveTab] = useState(0)

  // Fetch data
  const { data: statesData } = useQuery({
    queryKey: ['states'],
    queryFn: () => getStates(user.accessToken),
    enabled: !!user.accessToken,
  })

  const { data: citiesData } = useQuery({
    queryKey: ['cities', selectedStateId],
    queryFn: () => getCities(user.accessToken, selectedStateId),
    enabled: !!user.accessToken && !!selectedStateId,
  })

  const { data: branchesData } = useQuery({
    queryKey: ['branches', selectedCityId],
    queryFn: () => getBranches(user.accessToken, selectedCityId),
    enabled: !!user.accessToken && !!selectedCityId,
  })

  const { data: buildingsData } = useQuery({
    queryKey: ['buildings', selectedBranchId],
    queryFn: () => getBuildings(user.accessToken, selectedBranchId),
    enabled: !!user.accessToken && !!selectedBranchId,
  })

  const { data: floorsData } = useQuery({
    queryKey: ['floors', selectedBuildingId],
    queryFn: () => getFloors(user.accessToken, selectedBuildingId),
    enabled: !!user.accessToken && !!selectedBuildingId,
  })

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', selectedFloorId],
    queryFn: () => getRooms(user.accessToken, selectedFloorId),
    enabled: !!user.accessToken && !!selectedFloorId,
  })

  const { data: bedsData } = useQuery({
    queryKey: ['beds', selectedRoomId],
    queryFn: () => getBeds(user.accessToken, selectedRoomId),
    enabled: !!user.accessToken && !!selectedRoomId,
  })

  const states = statesData?.data || []
  const cities = citiesData?.data || []
  const branches = branchesData?.data || []
  const buildings = buildingsData?.data || []
  const floors = floorsData?.data || []
  const rooms = roomsData?.data || []
  const beds = bedsData?.data || []

  // Mutations
  const createStateMutation = useMutation({
    mutationFn: (data) => createState(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['states'] })
      setSnackbar({
        open: true,
        message: 'State created successfully',
        severity: 'success',
      })
      setAddStateModal(false)
      setStateForm({ name: '', isActive: true })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create state',
        severity: 'error',
      })
    },
  })

  const createCityMutation = useMutation({
    mutationFn: (data) => createCity(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] })
      setSnackbar({
        open: true,
        message: 'City created successfully',
        severity: 'success',
      })
      setAddCityModal(false)
      setCityForm({ name: '', stateId: '', isActive: true })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create city',
        severity: 'error',
      })
    },
  })

  const createBranchMutation = useMutation({
    mutationFn: (data) => createBranch(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setSnackbar({
        open: true,
        message: 'Branch created successfully',
        severity: 'success',
      })
      setAddBranchModal(false)
      setBranchForm({
        name: '',
        cityId: '',
        branchCode: '',
        address: '',
        isActive: true,
      })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create branch',
        severity: 'error',
      })
    },
  })

  const createBuildingMutation = useMutation({
    mutationFn: (data) => createBuilding(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings'] })
      setSnackbar({
        open: true,
        message: 'Building created successfully',
        severity: 'success',
      })
      setAddBuildingModal(false)
      setBuildingForm({
        name: '',
        branchId: '',
        buildingCode: '',
        totalFloors: '',
        isActive: true,
      })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create building',
        severity: 'error',
      })
    },
  })

  const createFloorMutation = useMutation({
    mutationFn: (data) => createFloor(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] })
      setSnackbar({
        open: true,
        message: 'Floor created successfully',
        severity: 'success',
      })
      setAddFloorModal(false)
      setFloorForm({
        name: '',
        buildingId: '',
        floorNumber: '',
        floorType: 'IP',
        isActive: true,
      })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create floor',
        severity: 'error',
      })
    },
  })

  const createRoomMutation = useMutation({
    mutationFn: (data) => createRoom(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      setSnackbar({
        open: true,
        message: 'Room created successfully',
        severity: 'success',
      })
      setAddRoomModal(false)
      setRoomForm({
        name: '',
        floorId: '',
        roomNumber: '',
        type: 'AC',
        roomCategory: 'General',
        genderRestriction: 'Any',
        totalBeds: 0,
        charges: 0,
        isActive: true,
      })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create room',
        severity: 'error',
      })
    },
  })

  const createBedMutation = useMutation({
    mutationFn: (data) => createBed(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: 'Bed created successfully',
        severity: 'success',
      })
      setAddBedModal(false)
      setBedForm({
        name: '',
        roomId: '',
        bedNumber: '',
        bedType: 'Normal',
        hasOxygen: false,
        hasVentilator: false,
        charge: 0,
        status: 'Available',
        isActive: true,
      })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create bed',
        severity: 'error',
      })
    },
  })

  const createBedsBulkMutation = useMutation({
    mutationFn: (data) => createBedsBulk(user.accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] })
      setSnackbar({
        open: true,
        message: 'Beds created successfully',
        severity: 'success',
      })
      setAddBedsBulkModal(false)
      setBedsBulkForm({
        roomId: '',
        bedCount: 1,
        bedPrefix: 'Bed',
        startNumber: 1,
        bedType: 'Normal',
        charge: 0,
      })
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to create beds',
        severity: 'error',
      })
    },
  })

  // Handlers
  const handleStateChange = (event) => {
    const value = event.target.value
    setSelectedStateId(value)
    setSelectedCityId('')
    setSelectedBranchId('')
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleCityChange = (event) => {
    const value = event.target.value
    setSelectedCityId(value)
    setSelectedBranchId('')
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleBranchChange = (event) => {
    const value = event.target.value
    setSelectedBranchId(value)
    setSelectedBuildingId('')
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleBuildingChange = (event) => {
    const value = event.target.value
    setSelectedBuildingId(value)
    setSelectedFloorId('')
    setSelectedRoomId('')
  }

  const handleFloorChange = (event) => {
    const value = event.target.value
    setSelectedFloorId(value)
    setSelectedRoomId('')
  }

  const handleRoomChange = (event) => {
    const value = event.target.value
    setSelectedRoomId(value)
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const closeSnackbar = (_, reason) => {
    if (reason === 'clickaway') return
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  // Render functions
  const renderFilters = () => (
    <Card elevation={2} sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium">
              <InputLabel>State</InputLabel>
              <Select
                label="State"
                value={selectedStateId}
                onChange={handleStateChange}
                displayEmpty={!selectedStateId}
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => setAddStateModal(true)}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                }
              >
                {states.map((state) => (
                  <MenuItem key={state.id} value={state.id}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium" disabled={!selectedStateId}>
              <InputLabel>City</InputLabel>
              <Select
                label="City"
                value={selectedCityId}
                onChange={handleCityChange}
                displayEmpty={!selectedCityId}
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => {
                      setCityForm({ ...cityForm, stateId: selectedStateId })
                      setAddCityModal(true)
                    }}
                    disabled={!selectedStateId}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                }
              >
                {cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium" disabled={!selectedCityId}>
              <InputLabel>Branch</InputLabel>
              <Select
                label="Branch"
                value={selectedBranchId}
                onChange={handleBranchChange}
                displayEmpty={!selectedBranchId}
                endAdornment={
                  <IconButton
                    size="small"
                    onClick={() => {
                      setBranchForm({ ...branchForm, cityId: selectedCityId })
                      setAddBranchModal(true)
                    }}
                    disabled={!selectedCityId}
                    sx={{ mr: 1 }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                }
              >
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="medium" disabled={!selectedBranchId}>
              <InputLabel>Building</InputLabel>
              <Select
                label="Building"
                value={selectedBuildingId}
                onChange={handleBuildingChange}
                displayEmpty={!selectedBuildingId}
              >
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<BusinessIcon />}
              onClick={() => {
                setBuildingForm({ ...buildingForm, branchId: selectedBranchId })
                setManageBuildingsModal(true)
              }}
              disabled={!selectedBranchId}
              fullWidth
            >
              Manage Buildings
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderLayoutVisualization = () => {
    if (!selectedBuildingId || !selectedFloorId) {
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
                Select a building and floor to view the layout.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      )
    }

    const selectedFloor = floors.find((f) => f.id === selectedFloorId)
    const selectedRooms = rooms.filter((r) => r.floorId === selectedFloorId)

    return (
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5">
              {selectedFloor?.name || 'Floor Layout'}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Interactive layout with real-time bed status
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<StairsIcon />}
              onClick={() => {
                setFloorForm({ ...floorForm, buildingId: selectedBuildingId })
                setAddFloorModal(true)
              }}
            >
              Add Floor
            </Button>
            <Button
              variant="outlined"
              startIcon={<MeetingRoomIcon />}
              onClick={() => {
                setRoomForm({ ...roomForm, floorId: selectedFloorId })
                setAddRoomModal(true)
              }}
              disabled={!selectedFloorId}
            >
              Add Room
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            {floors.map((floor, index) => (
              <Tab
                key={floor.id}
                label={floor.name}
                onClick={() => setSelectedFloorId(floor.id)}
              />
            ))}
          </Tabs>
        </Box>

        <Grid container spacing={3}>
          {selectedRooms.map((room) => {
            const roomBeds = beds.filter((b) => b.roomId === room.id)
            return (
              <Grid item xs={12} md={6} lg={4} key={room.id}>
                <Card
                  elevation={selectedRoomId === room.id ? 6 : 2}
                  sx={{
                    borderRadius: 3,
                    border: (theme) =>
                      selectedRoomId === room.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            {room.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip label={room.type} size="small" />
                            <Chip
                              label={room.roomCategory}
                              size="small"
                              color="primary"
                            />
                          </Stack>
                        </Box>
                        <Button
                          size="small"
                          onClick={() => {
                            setBedForm({ ...bedForm, roomId: room.id })
                            setAddBedModal(true)
                          }}
                        >
                          Add Bed
                        </Button>
                      </Stack>

                      <Divider />

                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1.5,
                          gridTemplateColumns:
                            'repeat(auto-fill, minmax(96px, 1fr))',
                        }}
                      >
                        {roomBeds.map((bed) => (
                          <Tooltip
                            key={bed.id}
                            title={`Status: ${bed.status}`}
                            arrow
                          >
                            <BedBox ownerState={{ status: bed.status }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {bed.name}
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

                      {roomBeds.length === 0 && (
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => {
                            setBedsBulkForm({
                              ...bedsBulkForm,
                              roomId: room.id,
                            })
                            setAddBedsBulkModal(true)
                          }}
                        >
                          Add Beds (Bulk)
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Stack>
    )
  }

  // Modal components would go here - Add State, Add City, Add Branch, etc.
  // Due to length constraints, I'll create a separate file for modals or continue in next part

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
            IP Layout Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create and manage in-patient layouts across all branches.
          </Typography>
        </div>
        <Button variant="outlined" onClick={() => router.push('/ipmodule')}>
          Back to IP Module
        </Button>
      </Stack>

      {renderFilters()}
      {renderLayoutVisualization()}

      {/* Modals will be added in continuation */}
      {/* Add State Modal */}
      <Dialog
        open={addStateModal}
        onClose={() => setAddStateModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New State</Typography>
            <IconButton onClick={() => setAddStateModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="State Name"
              fullWidth
              required
              value={stateForm.name}
              onChange={(e) =>
                setStateForm({ ...stateForm, name: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stateForm.isActive}
                  onChange={(e) =>
                    setStateForm({ ...stateForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStateModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createStateMutation.mutate(stateForm)}
            disabled={!stateForm.name.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add City Modal */}
      <Dialog
        open={addCityModal}
        onClose={() => setAddCityModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New City</Typography>
            <IconButton onClick={() => setAddCityModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                label="State"
                value={cityForm.stateId}
                onChange={(e) =>
                  setCityForm({ ...cityForm, stateId: e.target.value })
                }
              >
                {states.map((state) => (
                  <MenuItem key={state.id} value={state.id}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="City Name"
              fullWidth
              required
              value={cityForm.name}
              onChange={(e) =>
                setCityForm({ ...cityForm, name: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={cityForm.isActive}
                  onChange={(e) =>
                    setCityForm({ ...cityForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCityModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createCityMutation.mutate(cityForm)}
            disabled={!cityForm.name.trim() || !cityForm.stateId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Branch Modal */}
      <Dialog
        open={addBranchModal}
        onClose={() => setAddBranchModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New Branch</Typography>
            <IconButton onClick={() => setAddBranchModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>City</InputLabel>
              <Select
                label="City"
                value={branchForm.cityId}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, cityId: e.target.value })
                }
              >
                {cities.map((city) => (
                  <MenuItem key={city.id} value={city.id}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Branch Name"
              fullWidth
              required
              value={branchForm.name}
              onChange={(e) =>
                setBranchForm({ ...branchForm, name: e.target.value })
              }
            />
            <TextField
              label="Branch Code"
              fullWidth
              value={branchForm.branchCode}
              onChange={(e) =>
                setBranchForm({ ...branchForm, branchCode: e.target.value })
              }
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={branchForm.address}
              onChange={(e) =>
                setBranchForm({ ...branchForm, address: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={branchForm.isActive}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBranchModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createBranchMutation.mutate(branchForm)}
            disabled={!branchForm.name.trim() || !branchForm.cityId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Buildings Modal */}
      <Dialog
        open={manageBuildingsModal}
        onClose={() => setManageBuildingsModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Manage Buildings</Typography>
            <IconButton onClick={() => setManageBuildingsModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setBuildingForm({ ...buildingForm, branchId: selectedBranchId })
                setAddBuildingModal(true)
              }}
            >
              Add New Building
            </Button>
            <Grid container spacing={2}>
              {buildings.map((building) => (
                <Grid item xs={12} md={6} key={building.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1">
                        {building.name}
                      </Typography>
                      {building.buildingCode && (
                        <Typography variant="body2" color="text.secondary">
                          Code: {building.buildingCode}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageBuildingsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add Building Modal */}
      <Dialog
        open={addBuildingModal}
        onClose={() => setAddBuildingModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New Building</Typography>
            <IconButton onClick={() => setAddBuildingModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Building Name"
              fullWidth
              required
              value={buildingForm.name}
              onChange={(e) =>
                setBuildingForm({ ...buildingForm, name: e.target.value })
              }
            />
            <TextField
              label="Building Code"
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
              label="Total Floors"
              type="number"
              fullWidth
              value={buildingForm.totalFloors}
              onChange={(e) =>
                setBuildingForm({
                  ...buildingForm,
                  totalFloors: parseInt(e.target.value) || '',
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
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
          <Button onClick={() => setAddBuildingModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createBuildingMutation.mutate(buildingForm)}
            disabled={!buildingForm.name.trim() || !buildingForm.branchId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Floor Modal */}
      <Dialog
        open={addFloorModal}
        onClose={() => setAddFloorModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New Floor</Typography>
            <IconButton onClick={() => setAddFloorModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Floor Name"
              fullWidth
              required
              value={floorForm.name}
              onChange={(e) =>
                setFloorForm({ ...floorForm, name: e.target.value })
              }
            />
            <TextField
              label="Floor Number"
              type="number"
              fullWidth
              value={floorForm.floorNumber}
              onChange={(e) =>
                setFloorForm({
                  ...floorForm,
                  floorNumber: parseInt(e.target.value) || '',
                })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Floor Type</InputLabel>
              <Select
                label="Floor Type"
                value={floorForm.floorType}
                onChange={(e) =>
                  setFloorForm({ ...floorForm, floorType: e.target.value })
                }
              >
                <MenuItem value="IP">IP</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
                <MenuItem value="Mixed">Mixed</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={floorForm.isActive}
                  onChange={(e) =>
                    setFloorForm({ ...floorForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFloorModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createFloorMutation.mutate(floorForm)}
            disabled={!floorForm.name.trim() || !floorForm.buildingId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Room Modal */}
      <Dialog
        open={addRoomModal}
        onClose={() => setAddRoomModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New Room</Typography>
            <IconButton onClick={() => setAddRoomModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Room Name"
              fullWidth
              required
              value={roomForm.name}
              onChange={(e) =>
                setRoomForm({ ...roomForm, name: e.target.value })
              }
            />
            <TextField
              label="Room Number"
              fullWidth
              value={roomForm.roomNumber}
              onChange={(e) =>
                setRoomForm({ ...roomForm, roomNumber: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Room Type</InputLabel>
              <Select
                label="Room Type"
                value={roomForm.type}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, type: e.target.value })
                }
              >
                <MenuItem value="AC">AC</MenuItem>
                <MenuItem value="Non-AC">Non-AC</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Room Category</InputLabel>
              <Select
                label="Room Category"
                value={roomForm.roomCategory}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, roomCategory: e.target.value })
                }
              >
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Semi-Private">Semi-Private</MenuItem>
                <MenuItem value="Private">Private</MenuItem>
                <MenuItem value="VIP">VIP</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Gender Restriction</InputLabel>
              <Select
                label="Gender Restriction"
                value={roomForm.genderRestriction}
                onChange={(e) =>
                  setRoomForm({
                    ...roomForm,
                    genderRestriction: e.target.value,
                  })
                }
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Any">Any</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Total Beds"
              type="number"
              fullWidth
              value={roomForm.totalBeds}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  totalBeds: parseInt(e.target.value) || 0,
                })
              }
            />
            <TextField
              label="Charges"
              type="number"
              fullWidth
              value={roomForm.charges}
              onChange={(e) =>
                setRoomForm({
                  ...roomForm,
                  charges: parseFloat(e.target.value) || 0,
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={roomForm.isActive}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRoomModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createRoomMutation.mutate(roomForm)}
            disabled={!roomForm.name.trim() || !roomForm.floorId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Bed Modal */}
      <Dialog
        open={addBedModal}
        onClose={() => setAddBedModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add New Bed</Typography>
            <IconButton onClick={() => setAddBedModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Bed Name"
              fullWidth
              required
              value={bedForm.name}
              onChange={(e) => setBedForm({ ...bedForm, name: e.target.value })}
            />
            <TextField
              label="Bed Number"
              fullWidth
              value={bedForm.bedNumber}
              onChange={(e) =>
                setBedForm({ ...bedForm, bedNumber: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Bed Type</InputLabel>
              <Select
                label="Bed Type"
                value={bedForm.bedType}
                onChange={(e) =>
                  setBedForm({ ...bedForm, bedType: e.target.value })
                }
              >
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
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
                <MenuItem value="Available">Available</MenuItem>
                <MenuItem value="Occupied">Occupied</MenuItem>
                <MenuItem value="Reserved">Reserved</MenuItem>
                <MenuItem value="Maintenance">Maintenance</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Bed Charges"
              type="number"
              fullWidth
              value={bedForm.charge}
              onChange={(e) =>
                setBedForm({
                  ...bedForm,
                  charge: parseFloat(e.target.value) || 0,
                })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={bedForm.hasOxygen}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, hasOxygen: e.target.checked })
                  }
                />
              }
              label="Has Oxygen"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={bedForm.hasVentilator}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, hasVentilator: e.target.checked })
                  }
                />
              }
              label="Has Ventilator"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={bedForm.isActive}
                  onChange={(e) =>
                    setBedForm({ ...bedForm, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBedModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createBedMutation.mutate(bedForm)}
            disabled={!bedForm.name.trim() || !bedForm.roomId}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Beds Bulk Modal */}
      <Dialog
        open={addBedsBulkModal}
        onClose={() => setAddBedsBulkModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Add Beds (Bulk)</Typography>
            <IconButton onClick={() => setAddBedsBulkModal(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Number of Beds"
              type="number"
              fullWidth
              required
              value={bedsBulkForm.bedCount}
              onChange={(e) =>
                setBedsBulkForm({
                  ...bedsBulkForm,
                  bedCount: parseInt(e.target.value) || 1,
                })
              }
            />
            <TextField
              label="Bed Prefix"
              fullWidth
              value={bedsBulkForm.bedPrefix}
              onChange={(e) =>
                setBedsBulkForm({ ...bedsBulkForm, bedPrefix: e.target.value })
              }
            />
            <TextField
              label="Start Number"
              type="number"
              fullWidth
              value={bedsBulkForm.startNumber}
              onChange={(e) =>
                setBedsBulkForm({
                  ...bedsBulkForm,
                  startNumber: parseInt(e.target.value) || 1,
                })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Bed Type</InputLabel>
              <Select
                label="Bed Type"
                value={bedsBulkForm.bedType}
                onChange={(e) =>
                  setBedsBulkForm({ ...bedsBulkForm, bedType: e.target.value })
                }
              >
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="ICU">ICU</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Bed Charges"
              type="number"
              fullWidth
              value={bedsBulkForm.charge}
              onChange={(e) =>
                setBedsBulkForm({
                  ...bedsBulkForm,
                  charge: parseFloat(e.target.value) || 0,
                })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBedsBulkModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => createBedsBulkMutation.mutate(bedsBulkForm)}
            disabled={!bedsBulkForm.roomId || bedsBulkForm.bedCount < 1}
          >
            Create Beds
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
