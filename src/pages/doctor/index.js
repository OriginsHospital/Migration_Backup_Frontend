import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { ToastContainer, toast } from 'react-toastify'
import { Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { TabContext } from '@mui/lab'
import { Card, CardContent, CardHeader, Tab, Typography } from '@mui/material'
import { Box } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Switch from '@mui/material/Switch'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import DialogTitle from '@mui/material/DialogTitle'
import Dialog from '@mui/material/Dialog'
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import EditIcon from '@mui/icons-material/Edit'
import {
  getDoctorsList,
  saveBlockedTimeSlots,
  getBlockedTimeSlots,
  getDoctorsForAvailability,
  saveDoctorAvailability,
  updateDoctorActiveStatus,
} from '@/constants/apis'
import { getTimeDivisions } from '@/utils/getTimeDivisions'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { openSideDrawer } from '@/redux/sideDrawerSlice'
import { SideDrawer } from '@/components/SideDrawer'
import dayjs from 'dayjs'
import { FaPlus } from 'react-icons/fa'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import IconButton from '@mui/material/IconButton'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

function BlockCalender({ doctorsData }) {
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const [date, setDate] = useState(null)
  const [blockedTimeSlot, setBlockedTimeSlot] = useState({
    doctorId: '',
    doctorName: '',
    type: 'B',
    from: '',
    to: '',
  })
  const [blockedTimeSlotsData, setBlockedTimeSlotsData] = useState([])
  const timeDivisionsData = useMemo(() => getTimeDivisions(15), [])
  const [filteredTimeDivisionsData, setFilteredTimeDivisionsData] = useState([
    ...timeDivisionsData,
  ])
  const [ids, setIds] = useState({})

  const QueryClient = useQueryClient()
  const toastconfig = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Bounce,
  }

  const { data: blockedSlotsByDate, isLoading } = useQuery({
    queryKey: ['blockedSlots', date],
    enabled: !!date,
    queryFn: async () => {
      const responsejson = await getBlockedTimeSlots(user.accessToken, {
        blockedDate: `${date.$y}-${date.$M + 1}-${date.$D}`,
      })
      if (responsejson.status === 200) {
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching blocked slots')
      }
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await saveBlockedTimeSlots(user.accessToken, payload)
      if (res.status === 200) {
        toast.success('Saved Successfully')
      } else {
        toast.error(res.message)
      }
    },
    onSuccess: () => {
      QueryClient.invalidateQueries({
        queryKey: ['blockedSlots'],
      })
    },
  })

  function handleDateChange(value) {
    // const d = new Date()
    // d.setFullYear(value.$y, value.$M, value.$D)
    // const dateString = d.toLocaleDateString()
    //value.$y, value.$M, value.$D
    setDate(value)
  }

  function handleDoctorChange(e, value) {
    setBlockedTimeSlot({
      ...blockedTimeSlot,
      type: 'B',
      doctorId: value.props.value,
      doctorName: value.props.children,
    })
  }

  function handleTypeChange(e) {
    setBlockedTimeSlot({ ...blockedTimeSlot, type: e.target.value })
    if (e.target.value == 'L' && blockedTimeSlot.doctorId) {
      const filteredDoctor = doctorsData.find(
        (eachDoctor) => eachDoctor.doctorId == blockedTimeSlot.doctorId,
      )
      if (filteredDoctor?.shiftFrom && filteredDoctor?.shiftTo) {
        setBlockedTimeSlot({
          ...blockedTimeSlot,
          type: 'L',
          from: filteredDoctor.shiftFrom,
          to: filteredDoctor.shiftTo,
        })
      }
    }
  }

  function handleFromChange(e) {
    setBlockedTimeSlot({ ...blockedTimeSlot, from: e.target.value })
    const division = timeDivisionsData.find(
      (eachDivision) => eachDivision.time == e.target.value,
    )
    const filtered = timeDivisionsData.filter(
      (eachDivision) => eachDivision.id > division.id,
    )
    setFilteredTimeDivisionsData([...filtered])
  }

  function handleToChange(e) {
    setBlockedTimeSlot({ ...blockedTimeSlot, to: e.target.value })
  }

  function validate() {
    const { doctorId, doctorName, type, from, to } = blockedTimeSlot
    if (!date || !doctorId || !doctorName || !type || !from || !to) return false
    return true
  }

  function handleAddClick() {
    if (validate()) {
      const id = `${blockedTimeSlot.doctorId}-${blockedTimeSlot.from}-${blockedTimeSlot.to}-${blockedTimeSlot.type}`
      if (!ids[id]) {
        setBlockedTimeSlotsData([
          {
            id: id,
            ...blockedTimeSlot,
            saved: false,
          },
          ...blockedTimeSlotsData,
        ])
        setIds({ ...ids, [id]: true })
      } else {
        toast.error('already exists', toastconfig)
      }
    } else {
      toast.error('Fill all fields', toastconfig)
    }
  }

  function handleCrossClick(id) {
    const filtered = blockedTimeSlotsData.filter(
      (eachSlot) => eachSlot.id != id,
    )
    setBlockedTimeSlotsData([...filtered])
  }

  function handleSaveClick() {
    const slotsArray = blockedTimeSlotsData.map((eachSlot) => {
      return {
        doctorId: eachSlot.doctorId,
        timeStart: eachSlot.from,
        timeEnd: eachSlot.to,
        blockedType: eachSlot.type,
      }
    })
    mutate({
      blockedDate: `${date?.$y}-${date?.$M + 1}-${date?.$D}`,
      blockedList: slotsArray,
    })
  }

  useEffect(() => {
    setBlockedTimeSlot({
      doctorId: '',
      doctorName: '',
      type: 'B',
      from: '',
      to: '',
    })
  }, [blockedTimeSlotsData])

  useEffect(() => {
    if (blockedSlotsByDate) {
      const idsObj = {}
      const modifiedData = blockedSlotsByDate.map((eachSlot) => {
        const id = `${eachSlot.doctorId}-${eachSlot.timeStart}-${eachSlot.timeEnd}-${eachSlot.blockType}`
        idsObj[id] = true
        return {
          id: id,
          doctorId: eachSlot.doctorId,
          doctorName: eachSlot.doctorName,
          type: eachSlot.blockType,
          from: eachSlot.timeStart,
          to: eachSlot.timeEnd,
          saved: true,
        }
      })
      setBlockedTimeSlotsData([...modifiedData])
      setIds({ ...idsObj })
    }
  }, [blockedSlotsByDate])

  useEffect(() => {
    if (isLoading || isPending) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isLoading, isPending])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between">
        <DatePicker
          className="bg-white"
          value={date}
          format="DD/MM/YYYY"
          onChange={handleDateChange}
        />
        <Button
          className="h-[50px] flex gap-3 text-success-content bg-success"
          variant="contained"
          // disabled
          onClick={handleSaveClick}
        >
          <CheckCircleOutlineRoundedIcon className="text-success-content" />
          SAVE
        </Button>
      </div>
      <div className="w-full min-h-24 p-3 flex justify-around items-center flex-wrap rounded shadow bg-white border">
        <FormControl sx={{ m: 1 }}>
          <InputLabel id="doctor">Doctor</InputLabel>
          <Select
            className="min-w-[200px] md:min-w-[350px] h-[50px]"
            labelId="doctor"
            label="Doctor"
            value={blockedTimeSlot.doctorId}
            onChange={handleDoctorChange}
          >
            {doctorsData?.map((eachDoctor) => {
              return (
                <MenuItem
                  key={eachDoctor.fullName + eachDoctor.doctorId}
                  value={eachDoctor.doctorId}
                >
                  {eachDoctor.fullName}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          className="h-[50px]"
          color="primary"
          value={blockedTimeSlot.type}
          exclusive
          onChange={handleTypeChange}
          aria-label="Type"
        >
          <ToggleButton value="B">Block</ToggleButton>
          <ToggleButton value="L">Leave</ToggleButton>
        </ToggleButtonGroup>

        <FormControl sx={{ m: 1 }}>
          <InputLabel id="from">From</InputLabel>
          <Select
            className="md:min-w-[200px] h-[50px]"
            labelId="from"
            label="From"
            value={blockedTimeSlot.from}
            onChange={handleFromChange}
          >
            {timeDivisionsData.map((eachDivision) => {
              return (
                <MenuItem key={eachDivision.id} value={eachDivision.time}>
                  {eachDivision.time}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <FormControl sx={{ m: 1 }}>
          <InputLabel id="to">To</InputLabel>
          <Select
            className="md:min-w-[200px] h-[50px]"
            labelId="to"
            label="To"
            value={blockedTimeSlot.to}
            onChange={handleToChange}
          >
            {filteredTimeDivisionsData?.map((eachDivision) => {
              return (
                <MenuItem key={eachDivision.id} value={eachDivision.time}>
                  {eachDivision.time}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <Button
          className="w-[100px] h-[50px] text-secondary border-2 flex gap-2"
          variant="outlined"
          // disabled={!validate()}
          onClick={handleAddClick}
        >
          <FaPlus />
          {/* <CheckCircleOutlineRoundedIcon color="success" /> */}
          <span className="">Add</span>
        </Button>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        {blockedTimeSlotsData.map((slot) => {
          return (
            <div
              className={`grid grid-cols-2 p-3 gap-3 rounded shadow bg-white border ${
                slot.saved && 'border-success text-success-content'
              }`}
              key={slot.id}
            >
              <div className="col-span-2 pb-3 flex justify-between border-b">
                <span className=" text-ellipsis font-semibold">
                  {slot.doctorName}
                </span>
                <HighlightOffIcon
                  // sx={{ color: 'red-200' }}
                  className="cursor-pointer  text-error-content rounded-full"
                  onClick={() => {
                    handleCrossClick(slot.id)
                  }}
                />
              </div>
              <div className="flex flex-col">
                {/* <span className="text-[10px]">Date</span> */}
                <span>
                  {/* {`${date.$y}-${date.$M + 1}-${date.$D}`} */}
                  {dayjs(date).format('MMMM D, YYYY')}
                </span>
              </div>
              <div className="flex flex-col">
                {/* <span className="text-[10px]">Type</span> */}
                <span>{slot.type == 'L' ? 'Leave' : 'Block'}</span>
              </div>
              <>
                <div className="flex flex-col">
                  <span className="text-[10px]">From</span>
                  <span>{slot.from}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px]">To</span>
                  <span>{slot.to}</span>
                </div>
              </>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ShiftTimings({ doctorsData, isDoctorStatusEditor }) {
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const [formDetails, setFormDetails] = useState({
    doctorId: '',
    doctorName: '',
    from: '',
    to: '',
  })
  const [open, setOpen] = useState(false)
  const [shiftTimingsData, setShiftTimingsData] = useState([])
  const timeDivisionsData = useMemo(() => getTimeDivisions(15), [])
  const [editShift, setEditShift] = useState({
    index: '',
    from: '',
    to: '',
  })
  const [ids, setIds] = useState({})
  const QueryClient = useQueryClient()
  const toastconfig = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    transition: Bounce,
  }

  const { data: savedShiftTimingsData, isLoading } = useQuery({
    queryKey: ['savedShiftTimings'],
    queryFn: async () => {
      const responsejson = await getDoctorsForAvailability(user.accessToken)
      if (responsejson.status === 200) {
        return responsejson.data ?? []
      }
      const msg =
        responsejson.message ||
        'Could not load doctor shifts. Please try again later.'
      toast.error(msg, toastconfig)
      throw new Error(msg)
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await saveDoctorAvailability(user.accessToken, payload)
      if (res.status === 200) {
        toast.success('Saved Successfully')
      } else {
        toast.error(res.message)
      }
    },
    onSuccess: () => {
      QueryClient.invalidateQueries({
        queryKey: ['savedShiftTimings'],
      })
    },
  })

  const { mutate: updateDoctorStatus, isPending: isDoctorStatusUpdating } =
    useMutation({
      mutationFn: async (payload) => {
        const res = await updateDoctorActiveStatus(user.accessToken, payload)
        if (res.status !== 200) {
          throw new Error(res.message || 'Could not update doctor status')
        }
        return res
      },
      onSuccess: () => {
        toast.success('Doctor status updated successfully')
        QueryClient.invalidateQueries({
          queryKey: ['savedShiftTimings'],
        })
      },
      onError: (error) => {
        toast.error(error.message || 'Could not update doctor status')
      },
    })

  function onDialogClose() {
    setEditShift({ index: '', from: '', to: '' })
    setOpen(false)
  }

  function handleDoctorChange(e, value) {
    setFormDetails({
      ...formDetails,
      doctorId: value.props.value,
      doctorName: value.props.children,
    })
  }

  function handleFromChange(e) {
    setFormDetails({ ...formDetails, from: e.target.value })
  }

  function handleToChange(e) {
    setFormDetails({ ...formDetails, to: e.target.value })
  }

  function validate() {
    const { doctorId, doctorName, from, to } = formDetails
    if (!doctorId || !doctorName || !from || !to) return false
    return true
  }

  function handleAddClick() {
    if (validate()) {
      const id = formDetails.doctorId
      if (!ids[id]) {
        setShiftTimingsData([
          {
            id: id,
            ...formDetails,
            isActive: 1,
            saved: false,
          },
          ...shiftTimingsData,
        ])
        setIds({ ...ids, [id]: true })
      } else {
        toast.error('already exists', toastconfig)
      }
    } else {
      toast.error('Fill all fields', toastconfig)
    }
  }

  function handleEditClick(index) {
    setEditShift({
      index: index,
      from: shiftTimingsData[index].from,
      to: shiftTimingsData[index].to,
    })
    setOpen(true)
  }

  function updateShiftTimings() {
    const ar = shiftTimingsData
    if (
      ar[editShift.index].from != editShift.from ||
      ar[editShift.index].to != editShift.to
    ) {
      ar[editShift.index] = {
        ...ar[editShift.index],
        from: editShift.from,
        to: editShift.to,
        saved: false,
      }
      setShiftTimingsData([...ar])
    }
    onDialogClose()
  }

  function handleSaveClick() {
    const shiftsArray = shiftTimingsData.map((eachShift) => {
      return {
        doctorId: eachShift.doctorId,
        doctorName: eachShift.doctorName,
        shiftFrom: eachShift.from,
        shiftTo: eachShift.to,
      }
    })
    mutate({
      shiftList: shiftsArray,
    })
  }

  function handleDoctorStatusToggle(shift, checked) {
    if (!isDoctorStatusEditor) return
    updateDoctorStatus({
      doctorId: shift.doctorId,
      isActive: checked ? 1 : 0,
    })
  }

  useEffect(() => {
    setFormDetails({
      doctorId: '',
      doctorName: '',
      from: '',
      to: '',
    })
  }, [shiftTimingsData])

  useEffect(() => {
    if (savedShiftTimingsData) {
      const idsObj = {}
      const modifiedData = savedShiftTimingsData.map((each) => {
        const id = each.doctorId
        idsObj[id] = true
        return {
          id: id,
          doctorId: each.doctorId,
          doctorName: each.doctorName,
          from: each.shiftFrom,
          to: each.shiftTo,
          isActive: Number(each.isActive) === 1 ? 1 : 0,
          saved: true,
        }
      })
      setShiftTimingsData([...modifiedData])
      setIds({ ...idsObj })
    }
  }, [savedShiftTimingsData])

  useEffect(() => {
    if (isLoading || isPending || isDoctorStatusUpdating) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isLoading, isPending, isDoctorStatusUpdating])

  // Add new function to check for unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return shiftTimingsData.some((shift) => !shift.saved)
  }, [shiftTimingsData])

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header Section with conditional save button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Doctor Shift Management
        </h2>

        {/* Animated save button that appears only when there are unsaved changes */}
        <div className="h-10">
          {hasUnsavedChanges && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleOutlineRoundedIcon />}
              onClick={handleSaveClick}
              className="px-6 animate-fade-in"
              // Add animation classes
              sx={{
                animation: 'fadeIn 0.3s ease-in-out',
                '@keyframes fadeIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(-10px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Status banner for unsaved changes */}
      {hasUnsavedChanges && (
        <div className="bg-warning/10 border-l-4 border-warning-content p-4 rounded-md animate-fade-in">
          <div className="flex items-center gap-2">
            <AccessTimeIcon className="text-warning-content" />
            <Typography className="text-warning-content">
              You have unsaved changes. Do not forget to save your changes
              before leaving.
            </Typography>
          </div>
        </div>
      )}

      {/* Form Card */}
      <Card elevation={2}>
        <CardContent className="flex flex-wrap gap-6 items-center">
          <FormControl sx={{ minWidth: 300 }}>
            <InputLabel>Select Doctor</InputLabel>
            <Select
              // size="small"
              value={formDetails.doctorId}
              onChange={handleDoctorChange}
              label="Select Doctor"
            >
              {doctorsData?.map((doctor) => (
                <MenuItem key={doctor.doctorId} value={doctor.doctorId}>
                  {doctor.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className="flex gap-4">
            <FormControl sx={{ width: 150 }}>
              <InputLabel>Shift Start</InputLabel>
              <Select
                // size="small"
                value={formDetails.from}
                onChange={handleFromChange}
                label="Shift Start"
              >
                {timeDivisionsData.map((time) => (
                  <MenuItem key={time.id} value={time.time}>
                    {time.time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ width: 150 }}>
              <InputLabel>Shift End</InputLabel>
              <Select
                // size="small"
                value={formDetails.to}
                onChange={handleToChange}
                label="Shift End"
              >
                {timeDivisionsData.map((time) => (
                  <MenuItem key={time.id} value={time.time}>
                    {time.time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>

          <Button
            variant="outlined"
            startIcon={<FaPlus />}
            onClick={handleAddClick}
            className="min-w-[120px]"
          >
            Add Shift
          </Button>
        </CardContent>
      </Card>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {shiftTimingsData.map((shift, index) => (
          <Card
            key={shift.id}
            className={`transition-all duration-200 hover:shadow-md
              ${
                shift.saved
                  ? 'border-l-4 border-l-success-content'
                  : 'border-l-4 border-l-warning-content animate-pulse-subtle'
              }`}
          >
            <CardHeader
              title={
                <div className="flex items-center justify-between">
                  <Typography
                    variant="subtitle1"
                    className="font-medium line-clamp-1"
                  >
                    {shift.doctorName}
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography
                      variant="caption"
                      className={`font-medium ${
                        shift.isActive ? 'text-success' : 'text-error'
                      }`}
                    >
                      {shift.isActive ? 'Active' : 'Inactive'}
                    </Typography>
                    {!shift.saved && (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-warning-content animate-pulse"></span>
                        <Typography
                          variant="caption"
                          className="text-warning-content"
                        >
                          Unsaved
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              }
              action={
                <div className="flex items-center">
                  {isDoctorStatusEditor && (
                    <Switch
                      checked={Number(shift.isActive) === 1}
                      onChange={(e) =>
                        handleDoctorStatusToggle(shift, e.target.checked)
                      }
                      color="success"
                    />
                  )}
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEditClick(index)}
                    className="hover:bg-primary/10"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </div>
              }
            />
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 text-gray-600">
                <AccessTimeIcon fontSize="small" />
                <Typography>
                  {shift.from} - {shift.to}
                </Typography>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={open} onClose={onDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle className="pb-2">Update Shift Timings</DialogTitle>
        <DialogContent className="flex flex-col gap-4 pt-4">
          <FormControl fullWidth>
            <InputLabel>Shift Start</InputLabel>
            <Select
              size="small"
              value={editShift.from}
              onChange={(e) =>
                setEditShift({ ...editShift, from: e.target.value })
              }
              label="Shift Start"
            >
              {timeDivisionsData.map((time) => (
                <MenuItem key={time.id} value={time.time}>
                  {time.time}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Shift End</InputLabel>
            <Select
              size="small"
              value={editShift.to}
              onChange={(e) =>
                setEditShift({ ...editShift, to: e.target.value })
              }
              label="Shift End"
            >
              {timeDivisionsData.map((time) => (
                <MenuItem key={time.id} value={time.time}>
                  {time.time}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions className="p-4 pt-2">
          <Button onClick={onDialogClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={updateShiftTimings}
            variant="contained"
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

function Doctor() {
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const [tab, setTab] = useState('shiftTimings')
  const userEmail = (user?.email || user?.userDetails?.email || '')
    .toString()
    .trim()
    .toLowerCase()
  const isDoctorStatusEditor = userEmail === 'nikhilsuvva@gmail.com'

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctorsList'],
    queryFn: async () => {
      const responsejson = await getDoctorsList(user.accessToken)
      if (responsejson.status === 200) {
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching doctors list')
      }
    },
  })

  function handleChangeTab(event, newTab) {
    setTab(newTab)
  }

  useEffect(() => {
    if (isLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isLoading])

  return (
    <div>
      <TabContext value={tab}>
        <Box
          sx={{
            paddingTop: '12px',
            paddingLeft: '12px',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <TabList onChange={handleChangeTab} aria-label="">
            <Tab label="Shift Timings" value="shiftTimings" />
            <Tab label="Block Calender" value="blockCalender" />
          </TabList>
        </Box>
        <TabPanel value="shiftTimings">
          <ShiftTimings
            doctorsData={doctorsData}
            isDoctorStatusEditor={isDoctorStatusEditor}
          />
        </TabPanel>
        <TabPanel value="blockCalender">
          <BlockCalender doctorsData={doctorsData} />
        </TabPanel>
      </TabContext>
    </div>
  )
}
export default Doctor

{
  /* <div className="col-span-2 p-2 flex justify-between ">
<span className=" text-ellipsis font-semibold ">{shift.doctorName}</span>

<div className="flex gap-2">
  <span>{shift.from}</span> to
  <span>{shift.to}</span>
</div>
<EditIcon
  // sx={{ color: 'red-200' }}
  className="cursor-pointer text-secondary"
  onClick={() => {
    handleEditClick(i)
  }}
/>
</div> */
}
