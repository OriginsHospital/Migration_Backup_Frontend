import {
  bookConsultationAppointment,
  createOtherAppointmentReason,
  createConsultationOrTreatment,
  getAppointmentsById,
  getAvailableConsultationSlots,
  getDoctorsForAvailabilityConsultation,
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
  IconButton,
} from '@mui/material'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import React, { useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Modal from './Modal'
import VerticalTabs from './VerticalConsultationTabs'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Close, ExpandMore } from '@mui/icons-material'
import { closeSideDrawer, openSideDrawer } from '@/redux/sideDrawerSlice'
import AppoinmentForm from './AppoinmentForm'
import { SideDrawer } from './SideDrawer'
import { CalendarIcon } from '@mui/x-date-pickers'
import { FaPlusCircle } from 'react-icons/fa'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'

export default function Consultations({
  Consultations,
  selectedVisit,
  selectedTab,
  setSelectedTab,
}) {
  const QueryClient = useQueryClient()

  const [form, setForm] = useState({
    createType: 'Consultation', //Consultation or  Treatment
    visitId: selectedVisit?.id,
    type: '', // Intial Consultation , FollowUp Consultation , Treatment Type1
  })
  const [appointmentForm, setAppointmentForm] = useState({})
  const userDetails = useSelector((state) => state.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()
  const handleNewConsulation = (e) => {
    console.log(e.target.name)
    // setViewForm(true)
    dispatch(openModal('consultation'))
  }
  const createConsultation = useMutation({
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
  }
  const handleCreate = () => {
    if (form.type && selectedVisit.id) {
      createConsultation.mutate({
        createType: 'Consultation',
        visitId: selectedVisit.id,
        type: form.type,
      })
    } else {
      alert('error creating')
    }
  }
  const handleChangeForm = (event) => {
    setAppointmentForm({
      ...appointmentForm,
      [event.target.name]: event.target.value,
    })
  }

  // const [value, setValue] = useState(0);
  const { data: getConsultationAppointments } = useQuery({
    queryKey: ['consultationAppointments', selectedTab?.id],
    queryFn: () =>
      getAppointmentsById(
        userDetails?.accessToken,
        'Consultation',
        selectedTab?.id,
      ),
    enabled: !!selectedTab?.id && selectedTab.type === 'consultation',
  })

  /** Prefer latest appointment's branch (visit location); else user's default branch — not registration-only. */
  const defaultBookBranchId = useMemo(() => {
    const appts = getConsultationAppointments?.data
    if (appts?.length) {
      const latest = [...appts].sort(
        (a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate),
      )[0]
      if (latest?.branchId != null) return latest.branchId
    }
    return userDetails?.branchDetails?.[0]?.id
  }, [getConsultationAppointments?.data, userDetails?.branchDetails])
  const { data: doctorsList } = useQuery({
    queryKey: ['doctors', appointmentForm?.date, appointmentForm?.branchId],
    queryFn: () =>
      getDoctorsForAvailabilityConsultation(
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
      getAvailableConsultationSlots(userDetails?.accessToken, {
        date: appointmentForm?.date,
        doctorId: appointmentForm?.doctorId,
      }),
    enabled: !!appointmentForm?.date && !!appointmentForm?.doctorId,
  })
  const queryClient = useQueryClient()

  const bookingAppointment = useMutation({
    mutationFn: async (payload) => {
      const res = await bookConsultationAppointment(
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
      consultationId: selectedTab?.id,
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
    iteratedConsultationType,
  ) {
    console.log(iteratedConsultationType, getConsultationAppointments)
    if (
      clickedConsultationOrTreatmentType == iteratedType &&
      clickedConsultationOrTreatmentId == iteratedId
    ) {
      return (
        <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-4">
          {getConsultationAppointments?.data.map((eachAppointment, i) => (
            <div
              className="p-2 flex flex-col  rounded-lg shadow shadow-secondary "
              key={eachAppointment.id + 'consultation'}
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
          {iteratedConsultationType == 'Initial Consultation' ? (
            getConsultationAppointments?.data?.length < 1 && (
              <Button
                className="flex gap-2 items-center capitalize text-sm"
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
                variant="outlined"
              >
                <FaPlusCircle size={20} />
                <span>New Appointment</span>
              </Button>
            )
          ) : (
            <Button
              className="flex gap-2 items-center capitalize text-sm"
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
              variant="outlined"
            >
              <FaPlusCircle size={20} />
              <span>New Appointment</span>
            </Button>
          )}
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
    } else {
      setSelectedTab({
        type: '',
        id: '',
      })
    }
  }

  return (
    <div className="bg-white px-5 py-3 rounded shadow mb-5">
      <div className="flex justify-end">
        {/* <h1 className=' text-2 font-semibold'>Consultations</h1> */}
        {selectedVisit?.isActive == 1 && (
          <Button
            variant="contained"
            className="text-white"
            onClick={(e) => handleNewConsulation(e)}
            name="Consultation"
          >
            New Consultaion
          </Button>
        )}
      </div>
      <Card variant="outlined" className="m-3 border mt-5">
        {Consultations?.length > 0 ? (
          <div className="flex flex-col">
            {Consultations.map((eachConsultation, i) => (
              <Accordion
                key={eachConsultation.id}
                expanded={
                  selectedTab.type == 'consultation' &&
                  eachConsultation.id == selectedTab?.id
                }
                onChange={(e, isExpanded) => {
                  onAccordionClick(
                    'consultation',
                    eachConsultation.id,
                    isExpanded,
                  )
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <div className="flex gap-5">
                    <span>{`${i + 1}.`}</span>
                    <span>{eachConsultation.type}</span>
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  {renderRespectiveAppointments(
                    selectedTab.type,
                    'consultation',
                    selectedTab?.id,
                    eachConsultation.id,
                    eachConsultation.type,
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
          <div className="h-full">
            <span className="opacity-50">{'No Consultations'}</span>
          </div>
        )}
        <Modal
          // open={viewForm}
          uniqueKey="consultation"
          // handleClose={() => setViewForm(false)}
          // title={'Create New Consultation'}
          closeOnOutsideClick={true}
          maxWidth={'xs'}
          // handleSubmit={handleCreate}
        >
          <div className="flex justify-between">
            <span className="text-xl font-semibold text-secondary flex items-center py-5 gap-4">
              <CalendarIcon className="" />
              Create New Consultation
            </span>
            <IconButton onClick={() => dispatch(closeModal())}>
              <Close />
            </IconButton>
          </div>
          <div className="p-5 flex flex-col gap-5">
            <FormControl>
              <Select
                value={form.value}
                className={`bg-white rounded-lg min-w-48`}
                name="type"
                onChange={handleForm}
              >
                {/* <MenuItem value='Intial Consultation'>Intial Consultation</MenuItem>
    <MenuItem value='FollowUp Consultation'>FollowUp Consultation</MenuItem> */}
                {dropdowns?.consultationTypes?.map((each, index) => (
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

// function Card({ consultation }) {
//     return (
//         <div className='border p-5'>
//             <p>{consultation.id}{consultation.type}</p>
//         </div>
//     )
// }
