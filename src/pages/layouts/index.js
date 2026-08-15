import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import debounce from 'lodash/debounce'
import { toast } from 'react-toastify'
import {
  closeIpRegistration,
  createIPRegistration,
  createPatientRecord,
  getAllPatients,
  getBedDetails,
  getLayoutOverview,
  registerBuildingStructure,
} from '@/constants/apis'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { LuBedDouble } from 'react-icons/lu'
import { PiCrownSimpleFill } from 'react-icons/pi'

const statusStyles = {
  available: 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100',
  occupied: 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100',
  reserved:
    'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
}

const WARD_TYPES = ['IVF Suite', 'General', 'Recovery', 'VIP']

const DEFAULT_MARITAL_STATUS = [
  { value: 'Married', label: 'Married' },
  { value: 'Single', label: 'Single' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
]

const DEFAULT_GENDER_OPTIONS = [
  { value: 'Female', label: 'Female' },
  { value: 'Male', label: 'Male' },
  { value: 'Other', label: 'Other' },
]

const defaultPatientType = [{ value: 1, label: 'General' }]

const LayoutsPage = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const dropdowns = useSelector((store) => store.dropdowns)
  const user = useSelector((store) => store.user)

  const branches = dropdowns?.branches || []
  const [selectedBranch, setSelectedBranch] = useState(
    branches[0]?.id ? Number(branches[0].id) : '',
  )
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [activeFloorId, setActiveFloorId] = useState(null)

  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    buildingName: '',
    branchId: branches[0]?.id ? Number(branches[0].id) : '',
    numberOfFloors: 1,
    roomsPerFloor: 1,
    bedsPerRoom: 1,
    wardType: WARD_TYPES[0],
    description: '',
  })
  const [registerErrors, setRegisterErrors] = useState({})
  const resetRegisterForm = useCallback(
    (branchIdValue = selectedBranch || '') => {
      setRegisterForm({
        buildingName: '',
        branchId: branchIdValue === '' ? '' : Number(branchIdValue),
        numberOfFloors: 1,
        roomsPerFloor: 1,
        bedsPerRoom: 1,
        wardType: WARD_TYPES[0],
        description: '',
      })
    },
    [selectedBranch],
  )

  const [bookingModalState, setBookingModalState] = useState({
    open: false,
    bed: null,
    activeTab: 0,
  })
  const [patientModalState, setPatientModalState] = useState({
    open: false,
    bed: null,
    loading: false,
    data: null,
  })

  const genderOptions = useMemo(() => {
    const options = (dropdowns?.gender || [])
      .map((option) => {
        if (!option) return null
        if (typeof option === 'string') {
          return { value: option, label: option }
        }
        const value = option?.value ?? option?.name ?? option?.id ?? ''
        const label = option?.name ?? option?.label ?? option?.value ?? value
        return value ? { value, label } : null
      })
      .filter(Boolean)
    if (options.length) return options
    return DEFAULT_GENDER_OPTIONS
  }, [dropdowns?.gender])

  const maritalStatusOptions = useMemo(() => {
    const options = (dropdowns?.maritalStatus || [])
      .map((option) => {
        if (!option) return null
        if (typeof option === 'string') {
          return { value: option, label: option }
        }
        const value = option?.value ?? option?.name ?? option?.id ?? ''
        const label = option?.name ?? option?.label ?? option?.value ?? value
        return value ? { value, label } : null
      })
      .filter(Boolean)
    if (options.length) return options
    return DEFAULT_MARITAL_STATUS
  }, [dropdowns?.maritalStatus])

  const patientTypeOptions = useMemo(() => {
    const options = (dropdowns?.patientTypeList || [])
      .map((option) => {
        if (!option) return null
        const value = option?.id ?? option?.value ?? ''
        const label =
          option?.name ?? option?.patientType ?? option?.label ?? value
        return value ? { value, label } : null
      })
      .filter(Boolean)
    if (options.length) return options
    return defaultPatientType
  }, [dropdowns?.patientTypeList])

  const procedureOptions = useMemo(() => {
    return (dropdowns?.otProcedureList || [])
      .map((option) => {
        if (!option) return null
        const value = option?.id ?? option?.value ?? ''
        const label =
          option?.name ?? option?.procedureName ?? option?.label ?? value
        return value ? { value, label } : null
      })
      .filter(Boolean)
  }, [dropdowns?.otProcedureList])

  useEffect(() => {
    if (branches.length && !selectedBranch) {
      setSelectedBranch(Number(branches[0].id))
    }
  }, [branches, selectedBranch])

  useEffect(() => {
    setRegisterForm((prev) => ({
      ...prev,
      branchId: selectedBranch ? Number(selectedBranch) : '',
    }))
  }, [selectedBranch])

  const {
    data: layoutResponse,
    isLoading: isLayoutLoading,
    isFetching: isLayoutFetching,
  } = useQuery({
    queryKey: ['layoutsOverview', selectedBranch],
    queryFn: () => getLayoutOverview(user?.accessToken, selectedBranch),
    enabled: Boolean(user?.accessToken && selectedBranch),
    staleTime: 30_000,
  })

  const layoutItems = useMemo(() => {
    if (layoutResponse?.status === 200) {
      return layoutResponse.data || []
    }
    return []
  }, [layoutResponse])

  const uniqueByKey = useCallback((items, key, labelKey) => {
    const map = new Map()
    items.forEach((item) => {
      const identifier = item?.[key]
      if (identifier === undefined || identifier === null) return
      if (!map.has(identifier)) {
        const labelCandidate =
          item?.[labelKey] ?? item?.name ?? item?.label ?? `ID ${identifier}`
        map.set(identifier, labelCandidate)
      }
    })
    return Array.from(map.entries()).map(([id, label]) => ({
      id: Number(id),
      name: label || `ID ${id}`,
    }))
  }, [])

  const buildingOptions = useMemo(() => {
    return uniqueByKey(layoutItems, 'buildingId', 'buildingName')
  }, [layoutItems, uniqueByKey])

  useEffect(() => {
    if (!buildingOptions.length) {
      setSelectedBuilding(null)
      return
    }
    const exists = buildingOptions.some(
      (option) => option.id === selectedBuilding,
    )
    if (!exists) {
      setSelectedBuilding(buildingOptions[0].id)
    }
  }, [buildingOptions, selectedBuilding])

  const floorsStructure = useMemo(() => {
    if (!selectedBuilding) return []
    const floorsMap = new Map()

    layoutItems.forEach((row) => {
      if (row.buildingId !== selectedBuilding) return
      if (!floorsMap.has(row.floorId)) {
        floorsMap.set(row.floorId, {
          floorId: row.floorId,
          floorName: row.floorName,
          rooms: new Map(),
        })
      }
      const floorEntry = floorsMap.get(row.floorId)
      if (!floorEntry.rooms.has(row.roomId)) {
        floorEntry.rooms.set(row.roomId, {
          roomId: row.roomId,
          roomName: row.roomName,
          beds: [],
        })
      }
      floorEntry.rooms.get(row.roomId).beds.push(row)
    })

    return Array.from(floorsMap.values())
      .map((floor) => ({
        floorId: floor.floorId,
        floorName: floor.floorName,
        rooms: Array.from(floor.rooms.values())
          .map((room) => ({
            ...room,
            beds: room.beds.sort((a, b) =>
              a.bedName.localeCompare(b.bedName, undefined, {
                sensitivity: 'base',
                numeric: true,
              }),
            ),
          }))
          .sort((a, b) =>
            a.roomName.localeCompare(b.roomName, undefined, {
              sensitivity: 'base',
              numeric: true,
            }),
          ),
      }))
      .sort((a, b) =>
        a.floorName.localeCompare(b.floorName, undefined, {
          sensitivity: 'base',
          numeric: true,
        }),
      )
  }, [layoutItems, selectedBuilding])

  const activeFloor = useMemo(() => {
    if (!floorsStructure.length) return null
    return (
      floorsStructure.find((floor) => floor.floorId === activeFloorId) || null
    )
  }, [floorsStructure, activeFloorId])

  useEffect(() => {
    if (!floorsStructure.length) {
      setActiveFloorId(null)
      return
    }
    const exists = floorsStructure.some(
      (floor) => floor.floorId === activeFloorId,
    )
    if (!exists) {
      setActiveFloorId(floorsStructure[0].floorId)
    }
  }, [floorsStructure, activeFloorId])

  const [existingPatientSearch, setExistingPatientSearch] = useState('')
  const [patientOptions, setPatientOptions] = useState([])
  const [isPatientSearching, setIsPatientSearching] = useState(false)
  const [selectedExistingPatient, setSelectedExistingPatient] = useState(null)
  const [selectedProcedure, setSelectedProcedure] = useState(
    procedureOptions[0]?.value || '',
  )
  const [admissionDate, setAdmissionDate] = useState(dayjs())
  const [admissionTime, setAdmissionTime] = useState(dayjs())
  const [packageAmount, setPackageAmount] = useState('')
  const [bookingErrors, setBookingErrors] = useState({})

  const [newPatientForm, setNewPatientForm] = useState({
    aadhaarNo: '',
    branchId: selectedBranch,
    mobileNo: '',
    email: '',
    firstName: '',
    lastName: '',
    gender: genderOptions[0]?.value || 'Female',
    maritalStatus: maritalStatusOptions[0]?.value || 'Married',
    dateOfBirth: null,
    patientTypeId: patientTypeOptions[0]?.value || '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    hasGuardianInfo: false,
    guardianDetails: '{}',
    createActiveVisit: true,
  })
  const [newPatientErrors, setNewPatientErrors] = useState({})

  useEffect(() => {
    setNewPatientForm((prev) => ({
      ...prev,
      branchId: selectedBranch,
      gender: prev.gender || genderOptions[0]?.value || 'Female',
      maritalStatus:
        prev.maritalStatus || maritalStatusOptions[0]?.value || 'Married',
      patientTypeId: prev.patientTypeId || patientTypeOptions[0]?.value || '',
    }))
  }, [selectedBranch, genderOptions, maritalStatusOptions, patientTypeOptions])

  useEffect(() => {
    if (procedureOptions.length && !selectedProcedure) {
      setSelectedProcedure(procedureOptions[0].value)
    }
  }, [procedureOptions, selectedProcedure])

  const searchPatients = useCallback(
    debounce(async (searchValue) => {
      const trimmed = searchValue.trim()
      if (!trimmed) {
        setPatientOptions([])
        setIsPatientSearching(false)
        return
      }
      try {
        const response = await getAllPatients(user?.accessToken, trimmed)
        if (response.status === 200) {
          setPatientOptions(response.data || [])
        } else {
          toast.error(response.message || 'Failed to fetch patients')
        }
      } catch (error) {
        console.error('Error searching patients:', error)
        toast.error('Failed to fetch patients')
      } finally {
        setIsPatientSearching(false)
      }
    }, 500),
    [user?.accessToken],
  )

  useEffect(() => {
    return () => {
      if (searchPatients.cancel) searchPatients.cancel()
    }
  }, [searchPatients])

  const bedDetailsMutation = useMutation({
    mutationFn: (bedId) => getBedDetails(user?.accessToken, bedId),
    onSuccess: (response) => {
      setPatientModalState((prev) => ({
        ...prev,
        loading: false,
        data: response?.status === 200 ? response.data : null,
      }))
      if (response?.status !== 200) {
        toast.error(response?.message || 'Failed to load bed details')
      }
    },
    onError: () => {
      setPatientModalState((prev) => ({ ...prev, loading: false }))
      toast.error('Failed to load bed details')
    },
  })

  const createBookingMutation = useMutation({
    mutationFn: (payload) => createIPRegistration(user?.accessToken, payload),
    onSuccess: (response) => {
      if (response?.status === 200) {
        toast.success('Bed booked successfully')
        setBookingModalState({ open: false, bed: null, activeTab: 0 })
        queryClient.invalidateQueries(['layoutsOverview', selectedBranch])
      } else {
        toast.error(response?.message || 'Failed to book bed')
      }
    },
    onError: () => {
      toast.error('Failed to book bed')
    },
  })

  const dischargeMutation = useMutation({
    mutationFn: (payload) => closeIpRegistration(user?.accessToken, payload),
    onSuccess: (response) => {
      if (response?.status === 200) {
        toast.success('Patient discharged and bed freed')
        setPatientModalState({
          open: false,
          bed: null,
          loading: false,
          data: null,
        })
        queryClient.invalidateQueries(['layoutsOverview', selectedBranch])
      } else {
        toast.error(response?.message || 'Failed to discharge patient')
      }
    },
    onError: () => {
      toast.error('Failed to discharge patient')
    },
  })

  const createPatientMutation = useMutation({
    mutationFn: (payload) =>
      createPatientRecord(user?.accessToken, payload, null),
    onSuccess: (response) => {
      if (response?.status === 200) {
        toast.success('Patient registered successfully')
        const patient = response?.data || {}
        const patientId = patient?.id
        const patientName = [patient?.lastName, patient?.firstName]
          .filter(Boolean)
          .join(' ')
          .trim()
        if (patientId) {
          setSelectedExistingPatient(patientId)
          setExistingPatientSearch(patientName)
          setPatientOptions((prev) => {
            if (prev.some((option) => option.id === patientId)) return prev
            return [
              ...prev,
              {
                id: patientId,
                Name: patientName || `Patient ${patientId}`,
                patientId: patient?.patientId,
              },
            ]
          })
          setBookingModalState((prev) => ({ ...prev, activeTab: 0 }))
        }
      } else {
        toast.error(response?.message || 'Failed to register patient')
      }
    },
    onError: () => {
      toast.error('Failed to register patient')
    },
  })

  const registerBuildingMutation = useMutation({
    mutationFn: (payload) =>
      registerBuildingStructure(user?.accessToken, payload),
    onSuccess: (response, variables) => {
      if (response?.status === 200) {
        toast.success('Building registered successfully')
        setRegisterModalOpen(false)
        setRegisterErrors({})
        resetRegisterForm(variables.branchId)
        queryClient.invalidateQueries(['layoutsOverview', variables.branchId])
        if (variables.branchId === selectedBranch) {
          setSelectedBuilding(response?.data?.buildingId || selectedBuilding)
        }
      } else {
        toast.error(response?.message || 'Failed to register building')
      }
    },
    onError: () => {
      toast.error('Failed to register building')
    },
  })

  const resetBookingForms = () => {
    setExistingPatientSearch('')
    setPatientOptions([])
    setSelectedExistingPatient(null)
    setAdmissionDate(dayjs())
    setAdmissionTime(dayjs())
    setSelectedProcedure(procedureOptions[0]?.value || '')
    setPackageAmount('')
    setBookingErrors({})
    setNewPatientForm({
      aadhaarNo: '',
      branchId: selectedBranch,
      mobileNo: '',
      email: '',
      firstName: '',
      lastName: '',
      gender: genderOptions[0]?.value || 'Female',
      maritalStatus: maritalStatusOptions[0]?.value || 'Married',
      dateOfBirth: null,
      patientTypeId: patientTypeOptions[0]?.value || '',
      addressLine1: '',
      addressLine2: '',
      pincode: '',
      hasGuardianInfo: false,
      guardianDetails: '{}',
      createActiveVisit: true,
    })
    setNewPatientErrors({})
  }

  const handleRegisterFieldChange = (field, value) => {
    setRegisterForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBranchChange = (event) => {
    const value = Number(event.target.value)
    setSelectedBranch(value)
    setSelectedBuilding(null)
  }

  const handleBuildingChange = (event) => {
    const value = Number(event.target.value)
    setSelectedBuilding(value)
    setActiveFloorId(null)
  }

  const handleBedClick = (bed) => {
    if (bed.status === 'occupied') {
      setPatientModalState({ open: true, bed, loading: true, data: null })
      bedDetailsMutation.mutate(bed.bedId)
      return
    }

    if (bed.status === 'reserved') {
      const reservedInfo =
        bed.latestNote ||
        `Bed ${bed.bedName} is currently reserved. Please contact admin for details.`
      toast.info(reservedInfo)
      return
    }

    // Booking moved to Book Option page
    router.push({
      pathname: '/book-option',
      query: {
        branchId: selectedBranch || '',
      },
    })
  }

  const handleSearchInputChange = (event) => {
    const value = event.target.value
    setExistingPatientSearch(value)
    setIsPatientSearching(true)
    searchPatients(value)
  }

  const handleBookBed = () => {
    const errors = {}
    if (!selectedExistingPatient) {
      errors.patient = 'Patient is required'
    }
    if (!selectedProcedure) {
      errors.procedure = 'Procedure is required'
    }
    if (!admissionDate) {
      errors.admissionDate = 'Admission date is required'
    }
    if (!admissionTime) {
      errors.admissionTime = 'Admission time is required'
    }
    setBookingErrors(errors)
    if (Object.keys(errors).length) return
    if (!bookingModalState?.bed) return

    const payload = {
      branchId: selectedBranch,
      patientId: Number(selectedExistingPatient),
      procedureId: Number(selectedProcedure),
      dateOfAdmission: admissionDate.format('YYYY-MM-DD'),
      timeOfAdmission: admissionTime.format('HH:mm:ss'),
      buildingId: bookingModalState.bed.buildingId,
      floorId: bookingModalState.bed.floorId,
      roomId: bookingModalState.bed.roomId,
      bedId: bookingModalState.bed.bedId,
    }

    if (packageAmount) {
      payload.packageAmount = Number(packageAmount)
    }

    createBookingMutation.mutate(payload)
  }

  const handleRegisterSubmit = () => {
    const errors = {}
    if (!registerForm.buildingName.trim()) {
      errors.buildingName = 'Building name is required'
    }
    if (!registerForm.branchId) {
      errors.branchId = 'Branch is required'
    }

    const floorsCount = Number(registerForm.numberOfFloors)
    const roomsCount = Number(registerForm.roomsPerFloor)
    const bedsCount = Number(registerForm.bedsPerRoom)

    if (!Number.isInteger(floorsCount) || floorsCount < 1) {
      errors.numberOfFloors = 'Enter a valid number of floors'
    }
    if (!Number.isInteger(roomsCount) || roomsCount < 1) {
      errors.roomsPerFloor = 'Enter a valid number of rooms per floor'
    }
    if (!Number.isInteger(bedsCount) || bedsCount < 1) {
      errors.bedsPerRoom = 'Enter a valid number of beds per room'
    }

    setRegisterErrors(errors)
    if (Object.keys(errors).length) return

    const payload = {
      branchId: Number(registerForm.branchId),
      buildingName: registerForm.buildingName.trim(),
      numberOfFloors: floorsCount,
      roomsPerFloor: roomsCount,
      bedsPerRoom: bedsCount,
      wardType: registerForm.wardType,
      description: registerForm.description?.trim() || '',
    }

    registerBuildingMutation.mutate(payload)
  }

  const validateNewPatientForm = () => {
    const errors = {}
    if (!newPatientForm.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!newPatientForm.aadhaarNo || newPatientForm.aadhaarNo.length !== 12) {
      errors.aadhaarNo = 'Valid Aadhaar number is required'
    }
    if (!newPatientForm.mobileNo || newPatientForm.mobileNo.length !== 10) {
      errors.mobileNo = 'Valid mobile number is required'
    }
    if (!newPatientForm.patientTypeId) {
      errors.patientTypeId = 'Patient type is required'
    }
    if (!newPatientForm.maritalStatus) {
      errors.maritalStatus = 'Marital status is required'
    }
    setNewPatientErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateNewPatient = () => {
    if (!validateNewPatientForm()) return

    const payload = {
      ...newPatientForm,
      branchId: selectedBranch,
      patientTypeId: Number(newPatientForm.patientTypeId),
      dateOfBirth: newPatientForm.dateOfBirth
        ? dayjs(newPatientForm.dateOfBirth).format('YYYY-MM-DD')
        : '',
      guardianDetails: newPatientForm.hasGuardianInfo
        ? JSON.stringify(newPatientForm.guardianDetails || {})
        : '{}',
    }
    createPatientMutation.mutate(payload)
  }

  const handleDischarge = () => {
    const ipId = patientModalState?.data?.booking?.ipId
    if (!ipId) {
      toast.error('Unable to discharge: booking not found')
      return
    }
    dischargeMutation.mutate({
      id: ipId,
      dateOfDischarge: dayjs().format('YYYY-MM-DD'),
    })
  }

  const getStatusCount = (status) =>
    layoutItems.filter((item) => {
      if (selectedBuilding && item.buildingId !== selectedBuilding) return false
      return item.status === status
    }).length

  const renderLegend = () => (
    <div className="flex flex-wrap items-center gap-4">
      {[
        { label: 'Available', status: 'available' },
        { label: 'Occupied', status: 'occupied' },
        { label: 'Reserved', status: 'reserved' },
      ].map((item) => (
        <div key={item.status} className="flex items-center gap-2 text-sm">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              {
                available: 'bg-green-500',
                occupied: 'bg-red-500',
                reserved: 'bg-yellow-500',
              }[item.status]
            }`}
          />
          <span className="text-gray-600">
            {item.label}{' '}
            <span className="font-semibold text-secondary">
              {getStatusCount(item.status)}
            </span>
          </span>
        </div>
      ))}
    </div>
  )

  const renderBedSeat = (bed) => {
    const statusClass =
      {
        available:
          'border-green-500 text-green-600 hover:border-green-600 hover:bg-green-50',
        occupied: 'border-red-500 bg-red-50 text-red-600 hover:border-red-600',
        reserved:
          'border-yellow-500 bg-yellow-50 text-yellow-600 hover:border-yellow-600',
      }[bed.status] || 'border-gray-300 text-secondary'

    const tooltipTitle = `${
      bed.bedName ? `Bed ${bed.bedName}` : 'Bed'
    }${bed.roomName ? ` · ${bed.roomName}` : ''}${
      bed.patientName ? ` · ${bed.patientName}` : ''
    }`

    return (
      <Tooltip key={`${bed.bedId}-${bed.ipId || 'empty'}`} title={tooltipTitle}>
        <button
          type="button"
          onClick={() => handleBedClick(bed)}
          className={`relative flex h-12 w-12 items-center justify-center rounded-md border-2 text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50 ${statusClass}`}
        >
          {bed.bedName}
          {bed.isVip && (
            <PiCrownSimpleFill className="absolute -top-2 -right-2 text-xs text-amber-500" />
          )}
        </button>
      </Tooltip>
    )
  }

  const renderFloorsSidebar = () => {
    if (!selectedBuilding) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
          Select a branch and building to view floors.
        </div>
      )
    }

    if (!floorsStructure.length) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
          Building structure not found. Register the building to configure
          floors, rooms, and beds.
        </div>
      )
    }

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Typography
          variant="subtitle1"
          className="mb-3 font-semibold text-secondary"
        >
          Floors
        </Typography>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {floorsStructure.map((floor) => {
            const isActive = floor.floorId === activeFloorId
            return (
              <button
                key={floor.floorId}
                type="button"
                onClick={() => setActiveFloorId(floor.floorId)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {floor.floorName}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const renderBlueprint = () => {
    if (!selectedBuilding) {
      return (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 text-sm text-gray-500">
          Select a branch and building to view the layout.
        </div>
      )
    }

    if (!activeFloor || !activeFloor.rooms.length) {
      return (
        <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 text-sm text-gray-500">
          No rooms found for the selected floor.
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {activeFloor.rooms.map((room) => (
          <div
            key={room.roomId}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuBedDouble className="text-secondary" />
                <Typography
                  variant="subtitle1"
                  className="font-semibold text-secondary"
                >
                  {room.roomName}
                </Typography>
              </div>
              <span className="text-xs text-gray-500">
                {room.beds.length} beds
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {room.beds.map(renderBedSeat)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderRegisterBuildingModal = () => (
    <Dialog
      open={registerModalOpen}
      onClose={() => {
        if (registerBuildingMutation.isLoading) return
        setRegisterModalOpen(false)
        setRegisterErrors({})
        resetRegisterForm()
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Register Building</DialogTitle>
      <DialogContent dividers>
        <div className="space-y-4">
          <TextField
            fullWidth
            label="Building Name"
            value={registerForm.buildingName}
            onChange={(event) =>
              handleRegisterFieldChange('buildingName', event.target.value)
            }
            error={!!registerErrors.buildingName}
            helperText={registerErrors.buildingName}
          />
          <FormControl fullWidth error={!!registerErrors.branchId}>
            <InputLabel id="register-branch-select">Branch</InputLabel>
            <Select
              labelId="register-branch-select"
              label="Branch"
              value={registerForm.branchId}
              onChange={(event) =>
                handleRegisterFieldChange(
                  'branchId',
                  Number(event.target.value),
                )
              }
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={Number(branch.id)}>
                  {branch.name || branch.branchName || `Branch ${branch.id}`}
                </MenuItem>
              ))}
            </Select>
            {registerErrors.branchId && (
              <FormHelperText>{registerErrors.branchId}</FormHelperText>
            )}
          </FormControl>
          <div className="grid gap-4 sm:grid-cols-3">
            <TextField
              label="Floors"
              type="number"
              inputProps={{ min: 1 }}
              value={registerForm.numberOfFloors}
              onChange={(event) =>
                handleRegisterFieldChange('numberOfFloors', event.target.value)
              }
              error={!!registerErrors.numberOfFloors}
              helperText={registerErrors.numberOfFloors}
            />
            <TextField
              label="Rooms / Floor"
              type="number"
              inputProps={{ min: 1 }}
              value={registerForm.roomsPerFloor}
              onChange={(event) =>
                handleRegisterFieldChange('roomsPerFloor', event.target.value)
              }
              error={!!registerErrors.roomsPerFloor}
              helperText={registerErrors.roomsPerFloor}
            />
            <TextField
              label="Beds / Room"
              type="number"
              inputProps={{ min: 1 }}
              value={registerForm.bedsPerRoom}
              onChange={(event) =>
                handleRegisterFieldChange('bedsPerRoom', event.target.value)
              }
              error={!!registerErrors.bedsPerRoom}
              helperText={registerErrors.bedsPerRoom}
            />
          </div>
          <FormControl fullWidth>
            <InputLabel id="ward-type-select">Ward Type</InputLabel>
            <Select
              labelId="ward-type-select"
              label="Ward Type"
              value={registerForm.wardType}
              onChange={(event) =>
                handleRegisterFieldChange('wardType', event.target.value)
              }
            >
              {WARD_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Description / Notes"
            multiline
            minRows={3}
            value={registerForm.description}
            onChange={(event) =>
              handleRegisterFieldChange('description', event.target.value)
            }
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            if (registerBuildingMutation.isLoading) return
            setRegisterModalOpen(false)
            setRegisterErrors({})
            resetRegisterForm()
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleRegisterSubmit}
          disabled={registerBuildingMutation.isLoading}
        >
          {registerBuildingMutation.isLoading ? (
            <CircularProgress color="inherit" size={18} />
          ) : (
            'Create Building'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
  const renderPatientModal = () => {
    const data = patientModalState.data
    const booking = data?.booking
    const patient = data?.patient
    const stayDays = booking?.dateOfAdmission
      ? Math.max(dayjs().diff(dayjs(booking.dateOfAdmission), 'day'), 0)
      : 0
    const age = patient?.dateOfBirth
      ? Math.max(dayjs().diff(dayjs(patient.dateOfBirth), 'year'), 0)
      : null

    return (
      <Dialog
        open={patientModalState.open}
        onClose={() =>
          dischargeMutation.isLoading
            ? null
            : setPatientModalState({
                open: false,
                bed: null,
                loading: false,
                data: null,
              })
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {patientModalState.bed
            ? `Bed ${patientModalState.bed.bedName} · Patient Details`
            : 'Patient Details'}
        </DialogTitle>
        <DialogContent dividers>
          {patientModalState.loading ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <CircularProgress size={32} />
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Patient Name
                  </Typography>
                  <Typography variant="body1" className="font-semibold">
                    {patient?.fullName || 'NA'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Age / Gender
                  </Typography>
                  <Typography variant="body1" className="font-semibold">
                    {age !== null ? `${age} yrs` : 'NA'}{' '}
                    {patient?.gender ? `/ ${patient.gender}` : ''}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Doctor
                  </Typography>
                  <Typography variant="body1" className="font-semibold">
                    {data?.doctor || 'NA'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Ward & Room
                  </Typography>
                  <Typography variant="body1" className="font-semibold">
                    {patientModalState?.bed?.roomName || 'NA'} (
                    {patientModalState?.bed?.buildingName || 'NA'})
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Admission Date
                  </Typography>
                  <Typography variant="body1" className="font-semibold">
                    {booking?.dateOfAdmission
                      ? dayjs(booking.dateOfAdmission).format('DD MMM YYYY')
                      : 'NA'}
                  </Typography>
                </div>
                <div>
                  <Typography variant="caption" color="textSecondary">
                    Stay Duration
                  </Typography>
                  <Typography variant="body1" className="font-semibold">
                    🕒 Staying for {stayDays} {stayDays === 1 ? 'day' : 'days'}
                  </Typography>
                </div>
              </div>
              <Divider />
              <div>
                <Typography variant="caption" color="textSecondary">
                  Remarks
                </Typography>
                <Typography variant="body2">
                  {data?.latestNote || 'No remarks recorded'}
                </Typography>
              </div>
            </div>
          ) : (
            <Typography variant="body2" color="textSecondary">
              Unable to load patient details.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setPatientModalState({
                open: false,
                bed: null,
                loading: false,
                data: null,
              })
            }
            disabled={dischargeMutation.isLoading}
          >
            Close
          </Button>
          {data && (
            <Button
              color="error"
              variant="contained"
              onClick={handleDischarge}
              disabled={dischargeMutation.isLoading}
            >
              {dischargeMutation.isLoading ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                'Discharge / Free Bed'
              )}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    )
  }

  const renderExistingPatientForm = () => (
    <div className="space-y-4">
      <TextField
        fullWidth
        label="Search Patient"
        value={existingPatientSearch}
        onChange={handleSearchInputChange}
        helperText="Search by name, mobile, patient ID or Aadhaar"
        InputProps={{
          endAdornment: isPatientSearching ? (
            <CircularProgress size={18} />
          ) : null,
        }}
      />
      <FormControl fullWidth error={!!bookingErrors.patient}>
        <InputLabel id="layouts-existing-patient-select">
          Select Patient
        </InputLabel>
        <Select
          labelId="layouts-existing-patient-select"
          label="Select Patient"
          value={selectedExistingPatient ?? ''}
          onChange={(event) => setSelectedExistingPatient(event.target.value)}
        >
          {patientOptions.length === 0 && (
            <MenuItem value="" disabled>
              {existingPatientSearch
                ? 'No matches found'
                : 'Search to load patients'}
            </MenuItem>
          )}
          {patientOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.Name || option.patientName || `Patient ${option.id}`}{' '}
              {option.patientId ? `(${option.patientId})` : ''}
            </MenuItem>
          ))}
        </Select>
        {bookingErrors.patient && (
          <FormHelperText>{bookingErrors.patient}</FormHelperText>
        )}
      </FormControl>
      <FormControl fullWidth error={!!bookingErrors.procedure}>
        <InputLabel id="layouts-procedure-select">Procedure</InputLabel>
        <Select
          labelId="layouts-procedure-select"
          label="Procedure"
          value={selectedProcedure}
          onChange={(event) => setSelectedProcedure(event.target.value)}
        >
          {procedureOptions.length === 0 && (
            <MenuItem value="" disabled>
              No procedures configured
            </MenuItem>
          )}
          {procedureOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {bookingErrors.procedure && (
          <FormHelperText>{bookingErrors.procedure}</FormHelperText>
        )}
      </FormControl>
      <div className="grid gap-4 sm:grid-cols-2">
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Admission Date"
            value={admissionDate}
            onChange={(value) => setAdmissionDate(value)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!bookingErrors.admissionDate,
                helperText: bookingErrors.admissionDate,
              },
            }}
          />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <TimePicker
            label="Admission Time"
            value={admissionTime}
            onChange={(value) => setAdmissionTime(value)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!bookingErrors.admissionTime,
                helperText: bookingErrors.admissionTime,
              },
            }}
          />
        </LocalizationProvider>
      </div>
      <TextField
        fullWidth
        label="Package Amount (optional)"
        value={packageAmount}
        onChange={(event) => setPackageAmount(event.target.value)}
        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
      />
      <Divider />
      <div className="flex justify-end">
        <Button
          variant="contained"
          onClick={handleBookBed}
          disabled={createBookingMutation.isLoading}
        >
          {createBookingMutation.isLoading ? (
            <CircularProgress color="inherit" size={18} />
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </div>
    </div>
  )

  const renderNewPatientForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          fullWidth
          label="First Name"
          value={newPatientForm.firstName}
          onChange={(event) =>
            setNewPatientForm((prev) => ({
              ...prev,
              firstName: event.target.value,
            }))
          }
          error={!!newPatientErrors.firstName}
          helperText={newPatientErrors.firstName}
        />
        <TextField
          fullWidth
          label="Last Name"
          value={newPatientForm.lastName}
          onChange={(event) =>
            setNewPatientForm((prev) => ({
              ...prev,
              lastName: event.target.value,
            }))
          }
        />
        <TextField
          fullWidth
          label="Aadhaar Number"
          value={newPatientForm.aadhaarNo}
          onChange={(event) =>
            setNewPatientForm((prev) => ({
              ...prev,
              aadhaarNo: event.target.value.replace(/\D/g, '').slice(0, 12),
            }))
          }
          error={!!newPatientErrors.aadhaarNo}
          helperText={newPatientErrors.aadhaarNo || 'Enter 12 digit Aadhaar'}
        />
        <TextField
          fullWidth
          label="Mobile Number"
          value={newPatientForm.mobileNo}
          onChange={(event) =>
            setNewPatientForm((prev) => ({
              ...prev,
              mobileNo: event.target.value.replace(/\D/g, '').slice(0, 10),
            }))
          }
          error={!!newPatientErrors.mobileNo}
          helperText={newPatientErrors.mobileNo || 'Enter 10 digit mobile'}
        />
        <TextField
          fullWidth
          label="Email (optional)"
          value={newPatientForm.email}
          onChange={(event) =>
            setNewPatientForm((prev) => ({
              ...prev,
              email: event.target.value,
            }))
          }
        />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date of Birth"
            value={
              newPatientForm.dateOfBirth
                ? dayjs(newPatientForm.dateOfBirth)
                : null
            }
            onChange={(value) =>
              setNewPatientForm((prev) => ({
                ...prev,
                dateOfBirth: value,
              }))
            }
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
        <FormControl fullWidth>
          <InputLabel id="layouts-gender-select">Gender</InputLabel>
          <Select
            labelId="layouts-gender-select"
            label="Gender"
            value={newPatientForm.gender}
            onChange={(event) =>
              setNewPatientForm((prev) => ({
                ...prev,
                gender: event.target.value,
              }))
            }
          >
            {genderOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth error={!!newPatientErrors.maritalStatus}>
          <InputLabel id="layouts-marital-status-select">
            Marital Status
          </InputLabel>
          <Select
            labelId="layouts-marital-status-select"
            label="Marital Status"
            value={newPatientForm.maritalStatus}
            onChange={(event) =>
              setNewPatientForm((prev) => ({
                ...prev,
                maritalStatus: event.target.value,
              }))
            }
          >
            {maritalStatusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {newPatientErrors.maritalStatus && (
            <FormHelperText>{newPatientErrors.maritalStatus}</FormHelperText>
          )}
        </FormControl>
        <FormControl fullWidth error={!!newPatientErrors.patientTypeId}>
          <InputLabel id="layouts-patient-type-select">Patient Type</InputLabel>
          <Select
            labelId="layouts-patient-type-select"
            label="Patient Type"
            value={newPatientForm.patientTypeId}
            onChange={(event) =>
              setNewPatientForm((prev) => ({
                ...prev,
                patientTypeId: event.target.value,
              }))
            }
          >
            {patientTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {newPatientErrors.patientTypeId && (
            <FormHelperText>{newPatientErrors.patientTypeId}</FormHelperText>
          )}
        </FormControl>
      </div>
      <TextField
        fullWidth
        label="Address Line 1"
        value={newPatientForm.addressLine1}
        onChange={(event) =>
          setNewPatientForm((prev) => ({
            ...prev,
            addressLine1: event.target.value,
          }))
        }
      />
      <TextField
        fullWidth
        label="Address Line 2"
        value={newPatientForm.addressLine2}
        onChange={(event) =>
          setNewPatientForm((prev) => ({
            ...prev,
            addressLine2: event.target.value,
          }))
        }
      />
      <TextField
        fullWidth
        label="Pincode"
        value={newPatientForm.pincode}
        onChange={(event) =>
          setNewPatientForm((prev) => ({
            ...prev,
            pincode: event.target.value.replace(/\D/g, '').slice(0, 6),
          }))
        }
      />
      <FormControlLabel
        control={
          <Switch
            checked={newPatientForm.createActiveVisit}
            onChange={(event) =>
              setNewPatientForm((prev) => ({
                ...prev,
                createActiveVisit: event.target.checked,
              }))
            }
          />
        }
        label="Create Active Visit"
      />
      <Divider />
      <div className="flex justify-end">
        <Button
          variant="contained"
          onClick={handleCreateNewPatient}
          disabled={createPatientMutation.isLoading}
        >
          {createPatientMutation.isLoading ? (
            <CircularProgress color="inherit" size={18} />
          ) : (
            'Register Patient'
          )}
        </Button>
      </div>
    </div>
  )

  const renderBookingModal = () => (
    <Dialog
      open={bookingModalState.open}
      onClose={() =>
        createBookingMutation.isLoading || createPatientMutation.isLoading
          ? null
          : setBookingModalState({ open: false, bed: null, activeTab: 0 })
      }
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {bookingModalState.bed
          ? `Book Bed · ${bookingModalState.bed.bedName}`
          : 'Book Bed'}
      </DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={bookingModalState.activeTab}
          onChange={(_, value) =>
            setBookingModalState((prev) => ({ ...prev, activeTab: value }))
          }
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Existing Patient" />
          <Tab label="Register New Patient" />
        </Tabs>
        {bookingModalState.activeTab === 0
          ? renderExistingPatientForm()
          : renderNewPatientForm()}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() =>
            setBookingModalState({ open: false, bed: null, activeTab: 0 })
          }
          disabled={
            createBookingMutation.isLoading || createPatientMutation.isLoading
          }
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <div className="flex h-full flex-col gap-6 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Typography variant="h5" className="text-secondary">
            Layouts
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Bed status overview. Use Book Option to admit patients; Master
            Layouts to configure floors, rooms and beds.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            onClick={() =>
              router.push({
                pathname: '/book-option',
                query: selectedBranch ? { branchId: selectedBranch } : {},
              })
            }
          >
            Book Option
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              resetRegisterForm(selectedBranch || registerForm.branchId || '')
              setRegisterModalOpen(true)
              setRegisterErrors({})
            }}
          >
            Register Building
          </Button>
        </div>
      </div>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          padding: 3,
          borderRadius: 2,
          backgroundColor: 'white',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormControl size="small">
            <InputLabel id="layouts-branch-select">Branch</InputLabel>
            <Select
              labelId="layouts-branch-select"
              label="Branch"
              value={selectedBranch}
              onChange={handleBranchChange}
            >
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={Number(branch.id)}>
                  {branch.name || branch.branchName || `Branch ${branch.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" disabled={!buildingOptions.length}>
            <InputLabel id="layouts-building-select">Building</InputLabel>
            <Select
              labelId="layouts-building-select"
              label="Building"
              value={selectedBuilding ?? ''}
              onChange={handleBuildingChange}
            >
              {buildingOptions.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <Divider />
        <div className="flex flex-wrap items-center justify-between gap-4">
          {renderLegend()}
        </div>
      </Box>

      {isLayoutLoading || isLayoutFetching ? (
        <div className="flex flex-1 items-center justify-center">
          <CircularProgress />
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-4 lg:flex-row">
          <div className="lg:w-64">{renderFloorsSidebar()}</div>
          <div className="flex-1">{renderBlueprint()}</div>
        </div>
      )}

      {renderBookingModal()}
      {renderPatientModal()}
      {renderRegisterBuildingModal()}
    </div>
  )
}

export default withPermission(LayoutsPage, true, 'layouts', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
