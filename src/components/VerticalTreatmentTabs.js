import PropTypes from 'prop-types'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Typography from '@mui/material/Typography'
import React, { useState, useEffect } from 'react'
import { Box, Button } from '@mui/material'
import { FaPlusCircle } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import { closeSideDrawer, openSideDrawer } from '@/redux/sideDrawerSlice'
import { SideDrawer } from './SideDrawer'
import { CalendarIcon } from '@mui/x-date-pickers'
import AppoinmentForm from './AppoinmentForm'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bookAppointment,
  bookTreatmentAppointment,
  getAppointmentsById,
  getAvailableSlots,
  getAvailableTreatmentSlots,
  getDoctorsForAvailabilityConsultation,
  getDoctorsForAvailabilityTreatment,
} from '@/constants/apis'

function TabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  )
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
}

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  }
}

export default function VerticalTabs({
  items,
  selectedTab,
  setSelectedTab,
  appointments,
}) {
  const [appointmentForm, setAppointmentForm] = useState({})
  // const [consultationId, setConsultationId] = useState(null);
  // const [treatmentId, setTreatmentId] = useState(null);
  const [value, setValue] = useState(0)

  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const userDetails = useSelector((store) => store.user)
  const modal = useSelector((store) => store.modal)

  useEffect(() => {
    if (items && items.length > 0) {
      console.log('items ', items, selectedTab)

      setSelectedTab((prevSelectedTab) => ({
        ...prevSelectedTab,
        treatment: { id: items[value]?.id },
      }))
    }
  }, [])

  const handleChange = (event, newValue) => {
    console.log('handleChange', event.target.name, newValue, selectedTab)
    setValue(newValue)
    setSelectedTab((prevSelectedTab) => ({
      ...prevSelectedTab,
      [event.target.name]: { id: items[newValue]?.id },
    }))

    setAppointmentForm({})
  }

  const handleBookAppointment = () => {
    const payload = {
      date: appointmentForm?.date,
      doctorId: appointmentForm?.doctorId,
      treatmentCycleId: selectedTab?.treatment?.id,
      timeStart: appointmentForm?.timeslot?.split('-')[0].trim(),
      timeEnd: appointmentForm?.timeslot?.split('-')[1].trim(),
      branchId: appointmentForm?.branchId,
    }
    console.log(payload)
    bookingAppointment.mutate(payload)
  }

  const handleChangeForm = (event) => {
    setAppointmentForm({
      ...appointmentForm,
      [event.target.name]: event.target.value,
    })
  }

  const { data: doctorsList } = useQuery({
    queryKey: ['doctors', appointmentForm?.date, appointmentForm?.branchId],
    queryFn: () =>
      getDoctorsForAvailabilityTreatment(
        userDetails?.accessToken,
        appointmentForm?.date,
        appointmentForm?.branchId,
      ),
    enabled: !!appointmentForm?.date && appointmentForm?.branchId != null,
  })

  const { data: availableSlots } = useQuery({
    queryKey: [
      'availableSlots',
      appointmentForm?.date,
      appointmentForm?.doctorId,
    ],
    queryFn: () =>
      getAvailableTreatmentSlots(userDetails?.accessToken, {
        date: appointmentForm?.date,
        doctorId: appointmentForm?.doctorId,
      }),
    enabled: !!appointmentForm?.date && !!appointmentForm?.doctorId,
  })

  const bookingAppointment = useMutation({
    mutationFn: async (payload) => {
      const res = await bookTreatmentAppointment(
        userDetails.accessToken,
        payload,
      )
      if (res.status === 400) {
        // toast.error(res.message);
      } else {
        // toast.success(res.data);
        dispatch(closeSideDrawer())
        queryClient.invalidateQueries(['consultationAppointments'])
      }
    },
  })

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: 'background.paper',
        display: 'flex',
        height: 224,
      }}
    >
      <SideDrawer
        closeOnOutsideClick={true}
        onOutsideClick={() => console.log('outsideclicked')}
      >
        <div>
          <p className="text-2xl font-semibold text-secondary flex items-center py-5 gap-4">
            <CalendarIcon className="" />
            Schedule Appointment (#{selectedTab?.treatment?.id})
          </p>
          <AppoinmentForm
            appointmentForm={appointmentForm}
            handleChangeForm={handleChangeForm}
            doctorsList={doctorsList?.data}
            setAppointmentForm={setAppointmentForm}
            availableSlots={availableSlots}
            handleBookAppointment={handleBookAppointment}
          />
        </div>
      </SideDrawer>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={value}
        onChange={handleChange}
        aria-label="Vertical tabs example"
        sx={{
          borderRight: 1,
          borderColor: 'divider',
          minWidth: '30%',
          maxWidth: '30%',
        }}
      >
        {items?.map((treatment, index) => (
          <Tab
            key={index}
            name="treatment"
            label={`#${treatment.id}-${treatment.type}`}
            {...a11yProps(index)}
          />
        ))}
      </Tabs>
      {items?.map((treatment, index) => (
        <TabPanel key={index} value={value} index={index}>
          <div className="flex flex-wrap p-5 gap-2 overflow-y-auto h-44">
            {/* Show all the appointments under each consultation */}
            {/* <p>{treatment.id}</p> */}
            {appointments?.data.length == 0 && (
              <div className="flex items-center">No appointments found</div>
            )}
            {appointments?.data?.map((data, index) => (
              <div key={index} className="p-3  flex flex-col rounded shadow">
                <span className="font-bold">{data.appointmentDate}</span>
                <span className="flex gap-2 text-sm">
                  <span>{data.timeStart}</span>-<span>{data.timeEnd}</span>
                </span>
                <span> {data.doctorName}</span>
              </div>
            ))}
            <Button
              className="flex gap-2 items-center"
              name="treatment"
              onClick={(e) => {
                dispatch(openSideDrawer())
                setSelectedTab((prevSelectedTab) => ({
                  ...prevSelectedTab,
                  [e.target.name]: { id: treatment?.id },
                }))
                console.log(selectedTab)
                setAppointmentForm({ treatmentId: [e.target.name].id })
              }}
            >
              <FaPlusCircle />
              <span>New Appointment</span>
            </Button>
          </div>
        </TabPanel>
      ))}
    </Box>
  )
}
