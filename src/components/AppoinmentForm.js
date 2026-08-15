import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import React from 'react'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import {
  getAllAppointmentsReasons,
  getAppointmentReasonsByPatientType,
} from '@/constants/apis'
import { useSelector } from 'react-redux'

export default function AppoinmentForm({
  appointmentForm,
  handleChangeForm,
  doctorsList,
  setAppointmentForm,
  availableSlots,
  handleBookAppointment,
  appointmentId,
  visitTypeId,
}) {
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const branches = dropdowns?.branches || []
  //getAllAppointmentsReasons using useQuery
  const useTreatmentReasons = Boolean(
    appointmentForm?.consultationId &&
      appointmentId != null &&
      appointmentId !== '',
  )

  const { data: appointmentReasons } = useQuery({
    queryKey: [
      'getAllAppointmentsReasons',
      appointmentForm?.consultationId,
      appointmentId,
    ],
    queryFn: async () => {
      const response = await getAllAppointmentsReasons(
        user?.accessToken,
        appointmentForm.consultationId,
        appointmentId,
      )
      if (response?.status === 200) {
        return response.data ?? []
      }
      throw new Error(response?.message || 'Could not load appointment reasons')
    },
    enabled: Boolean(user?.accessToken && useTreatmentReasons),
  })

  const { data: visitTypeReasons } = useQuery({
    queryKey: ['appointmentReasonsByVisitType', visitTypeId],
    queryFn: async () => {
      const response = await getAppointmentReasonsByPatientType(
        user?.accessToken,
        visitTypeId,
      )
      if (response?.status === 200) {
        return response.data ?? []
      }
      throw new Error(response?.message || 'Could not load appointment reasons')
    },
    enabled: Boolean(
      user?.accessToken && !useTreatmentReasons && visitTypeId != null,
    ),
  })

  const resolvedAppointmentReasons = useTreatmentReasons
    ? appointmentReasons
    : visitTypeReasons
  const appointmentReasonOptions = React.useMemo(() => {
    const reasons = resolvedAppointmentReasons ?? []
    const hasOthers = reasons.some((reason) =>
      reason?.name?.toString().trim().toLowerCase().includes('other'),
    )
    if (hasOthers) {
      return reasons
    }
    return [
      ...reasons,
      {
        id: null,
        name: 'Others',
        appointmentCharges: 0,
        isSpouse: 0,
      },
    ]
  }, [resolvedAppointmentReasons])
  const selectedAppointmentReason = appointmentReasonOptions.find(
    (reason) => reason.id === appointmentForm?.appointmentReasonId,
  )
  const isOtherAppointmentReason =
    appointmentForm?.appointmentReasonIsOther ||
    (selectedAppointmentReason?.name
      ?.toString()
      .trim()
      .toLowerCase()
      .includes('other') ??
      false)

  return (
    <div className="flex flex-col gap-5">
      <DatePicker
        label="Appointment Date"
        format="DD/MM/YYYY"
        // disabled={isEdit == 'noneditable'}
        className="bg-white rounded-lg"
        value={appointmentForm?.date ? dayjs(appointmentForm?.date) : null}
        name="date"
        onChange={(newValue) =>
          setAppointmentForm({
            ...appointmentForm,
            date: dayjs(newValue).format('YYYY-MM-DD'),
            doctorId: '',
            timeslot: '',
          })
        }
      />

      <FormControl fullWidth>
        <Autocomplete
          options={branches || []}
          getOptionLabel={(option) => option.name}
          value={
            branches?.find(
              (branch) => branch.id === appointmentForm.branchId,
            ) || null
          }
          onChange={(_, value) =>
            setAppointmentForm({
              ...appointmentForm,
              branchId: value?.id || null,
              doctorId: '',
              timeslot: '',
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Branch" fullWidth />
          )}
        />
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Doctor</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          className="bg-white rounded-lg"
          value={appointmentForm?.doctorId ? appointmentForm.doctorId : ''}
          name="doctorId"
          label="Doctor"
          onChange={handleChangeForm}
        >
          {doctorsList?.map((each) => (
            <MenuItem key={each.doctorId} value={each.doctorId}>
              {each.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Time Slot</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          className="bg-white rounded-lg"
          value={appointmentForm?.timeslot ? appointmentForm.timeslot : ''}
          name="timeslot"
          label="Time Slot"
          onChange={handleChangeForm}
        >
          {availableSlots?.data?.map((each) => (
            <MenuItem key={each} value={each}>
              {each}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Autocomplete
        options={appointmentReasonOptions}
        getOptionLabel={(option) =>
          option.name +
          ' ( Rs.' +
          option.appointmentCharges +
          ' )' +
          (option.isSpouse === 1 ? ' - Male' : '')
        }
        onChange={(e, v) => {
          const isOtherReason =
            v?.name?.toString().trim().toLowerCase().includes('other') ?? false
          setAppointmentForm({
            ...appointmentForm,
            appointmentReasonId: v?.id,
            appointmentReasonIsOther: isOtherReason,
            appointmentReasonComment: isOtherReason
              ? appointmentForm?.appointmentReasonComment || ''
              : '',
          })
        }}
        name="appointmentReasonId"
        renderInput={(params) => (
          <TextField
            {...params}
            label="Appointment Reason"
            className="min-w-56"
          />
        )}
      />
      {isOtherAppointmentReason && (
        <TextField
          fullWidth
          multiline
          minRows={3}
          label="Describe Reason"
          name="appointmentReasonComment"
          value={appointmentForm?.appointmentReasonComment || ''}
          onChange={handleChangeForm}
          required
          placeholder="Please provide the specific reason"
        />
      )}
      <Button onClick={handleBookAppointment} variant="outlined">
        Book Appointment
      </Button>
    </div>
  )
}
