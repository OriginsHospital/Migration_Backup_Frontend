import {
  createOtherAppointmentReason,
  createConsultationOrTreatment,
  getAppointmentsById,
  getDoctorsForAvailabilityTreatment,
  bookTreatmentAppointment,
  getAvailableTreatmentSlots,
} from '@/constants/apis'
import {
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Modal from './Modal'
import VerticalTabs from './VerticalTreatmentTabs'
import { closeModal, openModal } from '@/redux/modalSlice'
import { ExpandMore } from '@mui/icons-material'
import AppoinmentForm from './AppoinmentForm'
import { CalendarIcon } from '@mui/x-date-pickers'
import { SideDrawer } from './SideDrawer'
import { FaPlusCircle } from 'react-icons/fa'
import { closeSideDrawer, openSideDrawer } from '@/redux/sideDrawerSlice'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
// import VerticalTabs from './VerticalConsultationTabs';

export default function Treatments({
  Treatments,
  selectedVisit,
  selectedTab,
  setSelectedTab,
}) {
  const QueryClient = useQueryClient()

  // const [selectedTab, setSelectedTab] = useState(null)
  const dispatch = useDispatch()
  const [appointmentForm, setAppointmentForm] = useState({})
  const [viewForm, setViewForm] = useState(false)
  const [form, setForm] = useState({
    createType: 'Treatment', //Consultation or  Treatment
    visitId: selectedVisit?.id,
    type: '', // Intial Consultation , FollowUp Consultation , Treatment Type1
  })
  const userDetails = useSelector((state) => state.user)
  const dropdowns = useSelector((store) => store.dropdowns)

  const { data: getTreatmentAppointments } = useQuery({
    queryKey: ['treatmentAppointments', selectedTab?.id],
    queryFn: () =>
      getAppointmentsById(
        userDetails?.accessToken,
        'Treatment',
        selectedTab?.id,
      ),
    enabled: !!selectedTab?.id,
  })

  const defaultBookBranchId = useMemo(() => {
    const appts = getTreatmentAppointments?.data
    if (appts?.length) {
      const latest = [...appts].sort(
        (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
      )[0]
      if (latest?.branchId != null) return latest.branchId
    }
    return userDetails?.branchDetails?.[0]?.id
  }, [getTreatmentAppointments?.data, userDetails?.branchDetails])

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
  useEffect(() => {
    setForm({
      createType: 'Treatment', //Consultation or  Treatment
      visitId: selectedVisit?.id,
      type: '', // Intial Consultation , FollowUp Consultation , Treatment Type1
    })
  }, [selectedVisit])

  const handleNewTreatment = (e) => {
    console.log(e.target.name)
    setViewForm(true)
    dispatch(openModal('treatment'))
  }
  const createTreatment = useMutation({
    mutationFn: async (payload) => {
      const res = await createConsultationOrTreatment(
        userDetails.accessToken,
        payload,
      )
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      }
      // setViewForm(false)
      dispatch(closeModal())
      // setIsValidUsers(1)
    },
    onSuccess: () => {
      QueryClient.invalidateQueries(
        'visitInfo',
        // {
        //     queryKey: ['visitInfo']
        // }
      )
    },
  })
  const handleForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    console.log(form)
  }
  const handleChangeForm = (event) => {
    console.log(appointmentForm)
    setAppointmentForm({
      ...appointmentForm,
      [event.target.name]: event.target.value,
    })
  }
  const handleCreate = () => {
    createTreatment.mutate(form)
  }

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
        QueryClient.invalidateQueries(['treatmentAppointments'])
      }
    },
  })
  const handleBookAppointment = async () => {
    let appointmentReasonId = appointmentForm?.appointmentReasonId
    if (appointmentForm?.appointmentReasonIsOther) {
      const customReason = appointmentForm?.appointmentReasonComment?.trim()
      if (!customReason) {
        toast.error('Please describe the reason for Others', toastconfig)
        return
      }
      const patientId =
        selectedVisit?.patientId ||
        selectedVisit?.patientID ||
        selectedVisit?.patient?.id
      if (!patientId) {
        toast.error(
          'Patient details are missing for this appointment',
          toastconfig,
        )
        return
      }
      try {
        const response = await createOtherAppointmentReason(
          userDetails?.accessToken,
          {
            appointmentReasonName: customReason,
            patientId,
            isSpouse: 0,
          },
        )
        if (response?.status !== 200 || !response?.data?.appointmentReasonId) {
          toast.error(
            response?.message || 'Could not save the custom appointment reason',
            toastconfig,
          )
          return
        }
        appointmentReasonId = response.data.appointmentReasonId
      } catch (error) {
        toast.error('Could not save the custom appointment reason', toastconfig)
        return
      }
    }
    const payload = {
      date: appointmentForm?.date,
      doctorId: appointmentForm?.doctorId,
      treatmentCycleId: selectedTab?.id,
      timeStart: appointmentForm?.timeslot?.split('-')[0].trim(),
      timeEnd: appointmentForm?.timeslot?.split('-')[1].trim(),
      appointmentReasonId,
      branchId: appointmentForm?.branchId,
    }
    console.log(payload)
    bookingAppointment.mutate(payload)
  }
  function renderRespectiveAppointments(
    clickedConsultationOrTreatmentType,
    iteratedType,
    clickedConsultationOrTreatmentId,
    iteratedId,
  ) {
    if (
      clickedConsultationOrTreatmentType == iteratedType &&
      clickedConsultationOrTreatmentId == iteratedId
    ) {
      return (
        <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
          {getTreatmentAppointments?.data.map((eachAppointment, i) => (
            <div
              className="p-2 flex flex-col  rounded-lg shadow shadow-secondary "
              key={eachAppointment.appointmentId + 'treatment'}
            >
              <span
                title={eachAppointment.doctorName}
                className="max-w-48 text-nowrap text-ellipsis overflow-hidden font-semibold "
              >{`${eachAppointment.doctorName}`}</span>
              <div className="flex justify-between font-thin">
                <span className="">{`${eachAppointment.timeStart} `}</span>
                <span>
                  {dayjs(eachAppointment.appointmentDate).format('DD-MM-YYYY')}
                </span>
              </div>
            </div>
          ))}
          <Button
            className="flex gap-2 items-center"
            name={clickedConsultationOrTreatmentId}
            onClick={(e) => {
              dispatch(openSideDrawer(`new_appoitments_drawer`))

              setSelectedTab({
                id: clickedConsultationOrTreatmentId,
                type: clickedConsultationOrTreatmentType,
              })
              console.log(selectedTab)
              setAppointmentForm({
                consultationId: clickedConsultationOrTreatmentType,
                branchId: defaultBookBranchId,
              })
            }}
          >
            <FaPlusCircle />
            <span>New Appointment</span>
          </Button>
          {/* {
            <Modal
              uniqueKey="appointmentLineBillsAndNotes"
              closeOnOutsideClick={true}
            >
              <span>abc</span>
            </Modal>
          } */}
        </div>
      )
    } else return <span className="opacity-50"> No Appointments History</span>
  }
  function onAccordionClick(type, id, isExpanded) {
    if (isExpanded) {
      setSelectedTab({
        type: type,
        id: id,
      })
      console.log('Accordion clicked', type, id)
    } else {
      setSelectedTab({
        type: '',
        id: '',
      })
    }
  }

  return (
    <div className="bg-white px-5 py-3 rounded shadow">
      <div className="flex justify-end">
        {/* <h1 className=' text-2 font-semibold'>Treatments</h1> */}
        {/* {selectedVisit?.isActive == 1 && (
          <Button
            variant="contained"
            className="text-white"
            onClick={e => handleNewTreatment(e)}
            name="Treatment"
          >
            New Treatment
          </Button>
        )} */}
      </div>
      <Card variant="outlined" className="m-3 border mt-5">
        {Treatments?.length > 0 ? (
          // <VerticalTabs
          //   module="treatment"
          //   items={Treatments}
          //   selectedTab={selectedTab}
          //   setSelectedTab={setSelectedTab}
          //   appointments={getTreatmentAppointments}
          // />
          <div className="flex flex-col">
            {Treatments.map((eachConsultation, i) => (
              <Accordion
                key={eachConsultation.id}
                expanded={
                  selectedTab.type == 'Treatment' &&
                  eachConsultation.id == selectedTab?.id
                }
                onChange={(e, isExpanded) => {
                  onAccordionClick('Treatment', eachConsultation.id, isExpanded)
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <div className="flex gap-5">
                    <span>{`${i + 1}.`}</span>
                    <span>{eachConsultation.type}</span>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  {selectedTab.type == 'Treatment' &&
                    eachConsultation.id == selectedTab.id &&
                    renderRespectiveAppointments(
                      selectedTab.type,
                      'Treatment',
                      selectedTab?.id,
                      eachConsultation.id,
                    )}
                </AccordionDetails>
              </Accordion>
            ))}
            <SideDrawer
              closeOnOutsideClick={true}
              onOutsideClick={() => console.log('outsideclicked')}
              uniqueKey={`new_appoitments_drawer`}
            >
              <div>
                <p className="text-2xl font-semibold text-secondary flex items-center py-5 gap-4">
                  <CalendarIcon className="" />
                  Schedule Appointment (#{selectedTab?.id})
                </p>
                <AppoinmentForm
                  appointmentForm={appointmentForm}
                  handleChangeForm={handleChangeForm}
                  doctorsList={doctorsList?.data}
                  setAppointmentForm={setAppointmentForm}
                  availableSlots={availableSlots}
                  handleBookAppointment={handleBookAppointment}
                  appointmentId={selectedTab?.id}
                />
              </div>
            </SideDrawer>
          </div>
        ) : (
          <div>
            <h5 className="text-2 text-secondary font-semibold text-center p-20">
              No Treatments Found
            </h5>
          </div>
        )}

        <Modal
          uniqueKey="treatment"
          // handleClose={() => setViewForm(false)}
          title={'Create New Treatment'}
          closeOnOutsideClick={true}
        >
          <div className="p-5 flex flex-col gap-5">
            <FormControl>
              <Select
                value={form.value}
                className={`bg-white rounded-lg min-w-48`}
                name="type"
                onChange={handleForm}
              >
                {dropdowns?.treatmentTypes?.map((each, index) => (
                  <MenuItem key={index} value={each}>
                    {each}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button onClick={handleCreate}>Save</Button>
          </div>
        </Modal>
      </Card>
    </div>
  )
}
