import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  TextField,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
// import { getAllAppointmentsReasons } from '@/constants/apis'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'
import {
  bookReviewCallConsultationAppointment,
  createOtherAppointmentReason,
  getAppointmentReasonsByPatientType,
  getAvailableConsultationSlots,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
const OTHERS_REASON_VALUE = '__others__'

function ReviewCallForm({
  appointmentId,
  type,
  patientInfo,
  reviewAppointmentForm,
  setReviewAppointmentForm,
  // selectedPatient,
  // setSelectedPatient,
}) {
  const [appointmentReasonComment, setAppointmentReasonComment] = useState('')
  const userDetails = useSelector((state) => state.user)
  const { branches } = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { data: availableSlots, isLoading: isLoadingAvailableSlots } = useQuery(
    {
      queryKey: [
        'ReviewCallAvailableSlots',
        reviewAppointmentForm?.date,
        userDetails?.id,
      ],
      queryFn: () =>
        getAvailableConsultationSlots(userDetails?.accessToken, {
          date: reviewAppointmentForm?.date,
          doctorId: userDetails?.id,
        }),
      enabled: !!reviewAppointmentForm?.date && !!userDetails?.id,
    },
  )
  useEffect(() => {
    console.log(availableSlots)
  }, [availableSlots])

  const { data: appointmentReasons, isLoading: isLoadingReasons } = useQuery({
    queryKey: ['appointmentReasonsByPatientType', patientInfo?.patientTypeId],
    queryFn: async () => {
      const response = await getAppointmentReasonsByPatientType(
        userDetails?.accessToken,
        patientInfo?.patientTypeId,
      )
      return response.data
    },
    enabled: !!patientInfo?.patientTypeId && !!userDetails?.accessToken,
  })

  const appointmentReasonOptions = useMemo(() => {
    const reasons = appointmentReasons || []
    const hasOthers = reasons.some(
      (each) => each?.name?.trim()?.toLowerCase() === 'others',
    )
    if (hasOthers) {
      return reasons
    }
    return [...reasons, { id: OTHERS_REASON_VALUE, name: 'Others' }]
  }, [appointmentReasons])

  const selectedAppointmentReason = useMemo(() => {
    if (!reviewAppointmentForm?.appointmentReasonId) return null
    return (
      appointmentReasonOptions.find(
        (each) => each.id === reviewAppointmentForm?.appointmentReasonId,
      ) || null
    )
  }, [appointmentReasonOptions, reviewAppointmentForm?.appointmentReasonId])

  const isOthersSelected =
    selectedAppointmentReason?.name?.trim()?.toLowerCase() === 'others'

  const bookingAppointment = useMutation({
    mutationFn: async (payload) => {
      const res = await bookReviewCallConsultationAppointment(
        userDetails.accessToken,
        payload,
      )
      if (res.status === 400) {
        toast.error(res.message, toastconfig)
      } else {
        toast.success(res.message, toastconfig)
        dispatch(closeModal('reviewCall'))
        queryClient.invalidateQueries('appointmentsForDoctor')
        // setSelectedPatient({ ...selectedPatient, isReviewCall: true })
      }
    },
  })
  const createOtherReasonMutation = useMutation({
    mutationFn: async (comment) => {
      const response = await createOtherAppointmentReason(
        userDetails.accessToken,
        {
          appointmentReasonName: comment,
          patientId: patientInfo?.id,
          isSpouse: 0,
        },
      )
      return response
    },
  })

  const handleBookAppointment = async () => {
    if (
      !reviewAppointmentForm?.branchId ||
      !reviewAppointmentForm?.date ||
      !reviewAppointmentForm?.timeslot ||
      !reviewAppointmentForm?.appointmentReasonId
    ) {
      toast.error('Please fill all required fields', toastconfig)
      return
    }

    let appointmentReasonId = reviewAppointmentForm?.appointmentReasonId
    if (isOthersSelected) {
      const trimmedComment = appointmentReasonComment.trim()
      if (!trimmedComment) {
        toast.error('Please enter comment for Others reason', toastconfig)
        return
      }

      const duplicateReason = appointmentReasons?.find(
        (each) =>
          each?.name?.trim()?.toLowerCase() === trimmedComment.toLowerCase(),
      )

      if (duplicateReason?.id) {
        appointmentReasonId = duplicateReason.id
      } else {
        const response =
          await createOtherReasonMutation.mutateAsync(trimmedComment)
        if (response?.status !== 200) {
          toast.error(
            response?.message || 'Failed to create appointment reason',
          )
          return
        }
        appointmentReasonId = response?.data?.appointmentReasonId
      }
    }

    const payload = {
      currentAppointmentId: appointmentId,
      type: type,
      date: reviewAppointmentForm?.date,
      patientId: patientInfo?.id,
      doctorId: userDetails?.id,
      timeStart: reviewAppointmentForm?.timeslot?.split('-')[0].trim(),
      timeEnd: reviewAppointmentForm?.timeslot?.split('-')[1].trim(),
      appointmentReasonId,
      branchId: reviewAppointmentForm?.branchId,
    }
    console.log(payload)
    bookingAppointment.mutate(payload)
  }
  return (
    <div className="flex flex-col gap-5">
      <FormControl className="min-w-[30%]">
        <Autocomplete
          options={branches || []}
          getOptionLabel={(option) => option.name}
          value={
            branches?.find(
              (branch) => branch.id === reviewAppointmentForm?.branchId,
            ) || null
          }
          onChange={(_, value) =>
            setReviewAppointmentForm({
              ...reviewAppointmentForm,
              branchId: value?.id || null,
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Branch" fullWidth />
          )}
        />
      </FormControl>
      <DatePicker
        label="Appointment Date"
        format="DD/MM/YYYY"
        // disabled={isEdit == 'noneditable'}
        className="bg-white rounded-lg"
        value={
          reviewAppointmentForm?.date
            ? dayjs(reviewAppointmentForm?.date)
            : null
        }
        name="date"
        onChange={(newValue) =>
          setReviewAppointmentForm({
            ...reviewAppointmentForm,
            date: dayjs(newValue).format('YYYY-MM-DD'),
            timeslot: '',
          })
        }
      />
      {reviewAppointmentForm?.date && (
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Time Slot</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            className="bg-white rounded-lg"
            value={
              reviewAppointmentForm?.timeslot
                ? reviewAppointmentForm.timeslot
                : ''
            }
            name="timeslot"
            label="Time Slot"
            onChange={(e) =>
              setReviewAppointmentForm({
                ...reviewAppointmentForm,
                timeslot: e.target.value,
              })
            }
          >
            {' '}
            {isLoadingAvailableSlots ? (
              <Skeleton />
            ) : (
              availableSlots?.data?.map((each) => (
                <MenuItem key={each} value={each}>
                  {each}
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
      )}
      <Autocomplete
        options={appointmentReasonOptions}
        getOptionLabel={(option) => option.name}
        value={selectedAppointmentReason}
        loading={isLoadingReasons}
        onChange={(e, value) => {
          setReviewAppointmentForm({
            ...reviewAppointmentForm,
            appointmentReasonId: value?.id || null,
          })
          if (value?.name?.trim()?.toLowerCase() !== 'others') {
            setAppointmentReasonComment('')
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Appointment Reason"
            className="bg-white rounded-lg"
          />
        )}
      />
      {isOthersSelected && (
        <TextField
          label="Comment"
          className="bg-white rounded-lg"
          multiline
          minRows={3}
          value={appointmentReasonComment}
          onChange={(e) => setAppointmentReasonComment(e.target.value)}
          placeholder="Enter appointment reason comment"
        />
      )}
      <div className="flex justify-end">
        <Button
          onClick={handleBookAppointment}
          variant="outlined"
          disabled={
            bookingAppointment.isPending || createOtherReasonMutation.isPending
          }
        >
          Book Appointment
        </Button>
      </div>
    </div>
  )
}

export default ReviewCallForm
