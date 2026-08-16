import {
  Autocomplete,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  MenuItem,
  Switch,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Skeleton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import React, { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'
import { setUser } from '@/redux/userSlice'
import ReactSelect from 'react-select'
import {
  getAllAppointmentsReasons,
  bookReviewTreatmentCall,
  getBillTypeValuesByBillTypeId,
  createOtherAppointmentReason,
  getAvailableConsultationSlots,
  getNewAccessToken,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import RenderPrescriptionPharmacy from './RenderPrescriptionPharmacy'
import { getMultipleForQuatityCalculation } from '@/constants/utils'
import { resolveTreatmentCycleId } from '@/utils/patientTreatmentUtils'
import { Add, Check } from '@mui/icons-material'

const OTHERS_REASON_VALUE = '__others__'

function isAuthFailure(response) {
  return (
    Number(response?.status) === 401 ||
    response?.message === 'Token is Invalid / Expired' ||
    response?.message === 'Session TimeOut/Expired. Please login again'
  )
}

function ReviewTreatmentCall({
  appointmentId,
  type,
  patientInfo,
  treatmentCycleId,
  allBillTypeValues,
  // selectedPatient,
  // setSelectedPatient,
}) {
  const [reviewForm, setReviewForm] = React.useState({
    date: '',
    timeslot: '',
    appointmentReasonId: null,
    hasAnyFuturePrescription: false,
    lineBillEntries: [],
    branchId: null,
  })
  const [appointmentReasons, setAppointmentReasons] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [newReason, setNewReason] = useState({
    name: '',
    isSpouse: false,
  })
  const [inputValue, setInputValue] = useState('')
  const [appointmentReasonComment, setAppointmentReasonComment] = useState('')

  const queryClient = useQueryClient()

  const userDetails = useSelector((state) => state.user)
  const { branches, billTypes } = useSelector((store) => store.dropdowns)
  const [defaultLineBillValues, setDefaultLineBillValues] = useState(null)
  const dispatch = useDispatch()

  const getAuthToken = () => {
    const storedToken =
      typeof window !== 'undefined' ? localStorage.getItem('token') : ''
    return storedToken || userDetails?.accessToken || ''
  }

  const persistAuthToken = (newToken) => {
    if (!newToken) return
    localStorage.setItem('token', newToken)
    dispatch(
      setUser({
        ...userDetails,
        accessToken: newToken,
      }),
    )
  }

  const refreshAuthToken = async (currentToken) => {
    const refresh = await getNewAccessToken(currentToken)
    const newToken = refresh?.data?.accessToken
    if (refresh?.status !== 200 || !newToken) {
      return null
    }
    persistAuthToken(newToken)
    return newToken
  }

  const callWithAuthRetry = async (apiFn, tokenHolder) => {
    let response = await apiFn(tokenHolder.current)
    if (!isAuthFailure(response)) {
      return response
    }
    const newToken = await refreshAuthToken(tokenHolder.current)
    if (!newToken) {
      return response
    }
    tokenHolder.current = newToken
    return apiFn(newToken)
  }

  const billTypesMap = useMemo(() => {
    const map = {}
    billTypes.map((eachBillType) => {
      map[eachBillType.id] = eachBillType.name
      map[eachBillType.name] = eachBillType.id
    })
    return map
  }, [billTypes])

  // Get bill type values
  // const { data: allBillTypeValues } = useQuery({
  //   queryKey: ['billTypeValues'],
  //   queryFn: async () => {
  //     const promises = billTypes.map(async billType => {
  //       const response = await getBillTypeValuesByBillTypeId(
  //         userDetails.accessToken,
  //         billType.id,
  //       )
  //       console.log(response.data)
  //       return { [billType.name]: response.data }
  //     })
  //     const results = await Promise.all(promises)
  //     return Object.assign({}, ...results)
  //   },
  // })

  // Get appointment reasons
  // console.log(treatmentCycleId)
  const { data: availableSlots, isLoading: isLoadingAvailableSlots } = useQuery(
    {
      queryKey: [
        'ReviewTreatmentCallAvailableSlots',
        reviewForm?.date,
        userDetails?.id,
      ],
      queryFn: () =>
        getAvailableConsultationSlots(userDetails?.accessToken, {
          date: reviewForm?.date,
          doctorId: userDetails?.id,
        }),
      enabled: !!reviewForm?.date && !!userDetails?.id,
    },
  )

  const resolvedTreatmentCycleId = useMemo(
    () =>
      resolveTreatmentCycleId({
        treatmentCycleId,
        patientInfo,
      }),
    [treatmentCycleId, patientInfo],
  )

  const { data: appointmentReasonsList, isLoading: isLoadingReasons } =
    useQuery({
      queryKey: ['appointmentReasons', resolvedTreatmentCycleId],
      queryFn: async () => {
        const response = await getAllAppointmentsReasons(
          userDetails?.accessToken,
          'Treatment',
          resolvedTreatmentCycleId,
        )
        if (response.status === 200) {
          return response.data || []
        }
        throw new Error('Error fetching appointment reasons')
      },
      enabled: !!resolvedTreatmentCycleId,
    })

  const resolvedAppointmentReasons = useMemo(() => {
    if (Array.isArray(appointmentReasons)) return appointmentReasons
    if (Array.isArray(appointmentReasonsList)) return appointmentReasonsList
    return []
  }, [appointmentReasons, appointmentReasonsList])

  const appointmentReasonOptions = useMemo(() => {
    const reasons = resolvedAppointmentReasons
    const hasOthers = reasons.some(
      (each) => each?.name?.trim()?.toLowerCase() === 'others',
    )
    if (hasOthers) {
      return reasons
    }
    return [...reasons, { id: OTHERS_REASON_VALUE, name: 'Others' }]
  }, [resolvedAppointmentReasons])

  const selectedAppointmentReason = useMemo(() => {
    if (!reviewForm?.appointmentReasonId) return null
    return (
      appointmentReasonOptions.find(
        (each) => each.id === reviewForm?.appointmentReasonId,
      ) || null
    )
  }, [appointmentReasonOptions, reviewForm?.appointmentReasonId])

  const isOthersSelected =
    selectedAppointmentReason?.name?.trim()?.toLowerCase() === 'others'

  const appendCreatedReason = (createdReason) => {
    if (!createdReason?.id) return
    setAppointmentReasons((prev) => {
      const current = Array.isArray(prev)
        ? prev
        : Array.isArray(appointmentReasonsList)
          ? appointmentReasonsList
          : []
      if (current.some((reason) => reason.id === createdReason.id)) {
        return current
      }
      return [...current, createdReason]
    })
    queryClient.setQueryData(
      ['appointmentReasons', resolvedTreatmentCycleId],
      (prev) => {
        const current = Array.isArray(prev) ? prev : []
        if (current.some((reason) => reason.id === createdReason.id)) {
          return current
        }
        return [...current, createdReason]
      },
    )
  }

  const { mutateAsync: createOtherReasonAsync, isPending: isCreatingReason } =
    useMutation({
      mutationFn: async (payload) => {
        const tokenHolder = { current: getAuthToken() }
        return callWithAuthRetry(
          (token) => createOtherAppointmentReason(token, payload),
          tokenHolder,
        )
      },
    })

  function ConvertDataToDBFormat() {
    let billTypeStruct = []
    if (defaultLineBillValues) {
      const SelectedTypeIdArray = Object.keys(defaultLineBillValues)
      if (SelectedTypeIdArray.length != 0) {
        SelectedTypeIdArray?.map((data) => {
          const SelectedTypeValuesArray = defaultLineBillValues?.[data]
          if (SelectedTypeValuesArray?.length != 0) {
            const billTypeValues = SelectedTypeValuesArray.filter(
              (item) => item.status !== 'PAID',
            ).map(({ status, ...item }) => item)

            if (billTypeValues.length > 0) {
              billTypeStruct.push({
                billTypeId: data,
                billTypeValues: billTypeValues,
              })
            }
          }
        })
      }
    }
    return billTypeStruct
  }

  const setSelectedValues = (name) => (selectedOptions) => {
    const billTypeId = billTypesMap[name]
    let copyOfDefaultLineBillValues = { ...defaultLineBillValues }
    let billTypeValues = []

    selectedOptions?.forEach((element) => {
      const BillTypeValuesArray = allBillTypeValues[name]
      const BillTYpeValueObject = BillTypeValuesArray.find((values) => {
        return values.id === element.value
      })

      if (name === 'Pharmacy') {
        billTypeValues.push({
          id: element.value,
          name: element.label,
          amount: BillTYpeValueObject.amount,
          prescribedQuantity: 1,
          prescriptionDetails: '',
          prescriptionDays: 1,
          status: 'UNPAID',
        })
      } else {
        billTypeValues.push({
          id: element.value,
          name: element.label,
          amount: BillTYpeValueObject.amount,
          status: 'UNPAID',
        })
      }
    })

    copyOfDefaultLineBillValues[billTypeId] = billTypeValues
    setDefaultLineBillValues(copyOfDefaultLineBillValues)
  }

  // Book appointment mutation
  const bookAppointment = useMutation({
    mutationFn: async (payload) => {
      const tokenHolder = { current: getAuthToken() }
      const res = await callWithAuthRetry(
        (token) => bookReviewTreatmentCall(token, payload),
        tokenHolder,
      )
      if (isAuthFailure(res)) {
        toast.error(
          'Your session expired. Please log in again and retry.',
          toastconfig,
        )
        return res
      }
      if (res.status === 200) {
        toast.success(res.message, toastconfig)
        dispatch(closeModal('reviewTreatmentCall'))
        queryClient.invalidateQueries('appointmentsForDoctor')
        return res
      }
      toast.error(res.message || 'Failed to book review call', toastconfig)
      return res
    },
  })

  const handleBookAppointment = async () => {
    if (
      !reviewForm.branchId ||
      !reviewForm.date ||
      !reviewForm.timeslot ||
      !reviewForm.appointmentReasonId
    ) {
      toast.error('Please fill all required fields', toastconfig)
      return
    }

    if (!resolvedTreatmentCycleId) {
      toast.error(
        'Treatment cycle is missing for this patient. Please open the treatment appointment and try again.',
        toastconfig,
      )
      return
    }

    let appointmentReasonId = reviewForm.appointmentReasonId
    if (isOthersSelected) {
      const trimmedComment = appointmentReasonComment.trim()
      if (!trimmedComment) {
        toast.error('Please enter the appointment reason', toastconfig)
        return
      }

      const duplicateReason = appointmentReasonOptions?.find(
        (each) =>
          each?.name?.trim()?.toLowerCase() === trimmedComment.toLowerCase() &&
          each.id !== OTHERS_REASON_VALUE,
      )

      if (duplicateReason?.id) {
        appointmentReasonId = duplicateReason.id
      } else {
        const patientId =
          patientInfo?.id ??
          patientInfo?.patientId ??
          patientInfo?.patientMasterId
        if (!patientId) {
          toast.error(
            'Patient details are missing for this appointment',
            toastconfig,
          )
          return
        }

        try {
          const response = await createOtherReasonAsync({
            appointmentReasonName: trimmedComment,
            patientId,
            isSpouse: newReason.isSpouse ? 1 : 0,
          })
          if (isAuthFailure(response)) {
            toast.error(
              'Your session expired. Please log in again and retry.',
              toastconfig,
            )
            return
          }
          const createdReasonId = response?.data?.appointmentReasonId
          if (response?.status !== 200 || !createdReasonId) {
            toast.error(
              response?.message || 'Failed to create appointment reason',
              toastconfig,
            )
            return
          }
          appendCreatedReason({
            id: createdReasonId,
            name: response?.data?.appointmentReasonName || trimmedComment,
          })
          appointmentReasonId = createdReasonId
        } catch {
          toast.error('Failed to create appointment reason', toastconfig)
          return
        }
      }
    }

    if (
      appointmentReasonId == null ||
      appointmentReasonId === OTHERS_REASON_VALUE ||
      Number.isNaN(Number(appointmentReasonId))
    ) {
      toast.error('Please select a valid appointment reason', toastconfig)
      return
    }

    const payload = {
      currentAppointmentId: Number(appointmentId),
      type: type,
      date: reviewForm.date,
      doctorId: Number(userDetails?.id),
      timeStart: reviewForm.timeslot.split('-')[0].trim(),
      timeEnd: reviewForm.timeslot.split('-')[1].trim(),
      treatmentCycleId: resolvedTreatmentCycleId,
      appointmentReasonId: Number(appointmentReasonId),
      hasAnyFuturePrescription: reviewForm.hasAnyFuturePrescription,
      lineBillEntries: reviewForm.hasAnyFuturePrescription
        ? ConvertDataToDBFormat()
        : [],
      branchId: Number(reviewForm?.branchId),
    }

    bookAppointment.mutate(payload)
  }
  const handleIntakeChange = (prescriptionId, medIntake) => {
    const billTypeIdPrescription = '3' //bill type = prescription
    const copyOfDefaultLineBillValues = JSON.parse(
      JSON.stringify(defaultLineBillValues),
    )
    let tempLineBillValues = copyOfDefaultLineBillValues?.[
      billTypeIdPrescription
    ]?.map((lineBillValues) => {
      if (lineBillValues.id == prescriptionId) {
        lineBillValues.prescriptionDetails = medIntake
        lineBillValues.prescribedQuantity =
          lineBillValues.prescriptionDays *
          getMultipleForQuatityCalculation(medIntake)
      }
      return lineBillValues
    })
    if (copyOfDefaultLineBillValues[billTypeIdPrescription]?.length != 0) {
      copyOfDefaultLineBillValues[billTypeIdPrescription] = tempLineBillValues
      setDefaultLineBillValues(copyOfDefaultLineBillValues)
    }
  }

  const handleCreateNewReason = async () => {
    if (!inputValue.trim()) {
      toast.error('Please enter a reason name', toastconfig)
      return
    }

    const isDuplicate = resolvedAppointmentReasons.some(
      (reason) =>
        reason?.name?.toLowerCase() === inputValue.trim().toLowerCase(),
    )

    if (isDuplicate) {
      toast.error('This appointment reason already exists', toastconfig)
      return
    }

    const patientId =
      patientInfo?.id ?? patientInfo?.patientId ?? patientInfo?.patientMasterId
    if (!patientId) {
      toast.error(
        'Patient details are missing for this appointment',
        toastconfig,
      )
      return
    }

    try {
      const response = await createOtherReasonAsync({
        appointmentReasonName: inputValue.trim(),
        patientId,
        isSpouse: newReason.isSpouse ? 1 : 0,
      })
      const createdReasonId = response?.data?.appointmentReasonId
      if (response?.status !== 200 || !createdReasonId) {
        toast.error(
          response?.message || 'Failed to create appointment reason',
          toastconfig,
        )
        return
      }

      const createdReasonName =
        response?.data?.appointmentReasonName || inputValue.trim()
      appendCreatedReason({
        id: createdReasonId,
        name: createdReasonName,
      })
      setReviewForm((prev) => ({
        ...prev,
        appointmentReasonId: createdReasonId,
      }))
      setInputValue(createdReasonName)
      toast.success(
        response.message || 'Appointment reason created',
        toastconfig,
      )
    } catch {
      toast.error('Failed to create appointment reason', toastconfig)
    }
  }

  return (
    <div className="flex flex-col gap-5 items-start">
      <div className="flex gap-2 items-center flex-wrap">
        <FormControl className="min-w-[30%]">
          <Autocomplete
            options={branches || []}
            getOptionLabel={(option) => option.name}
            value={
              branches?.find((branch) => branch.id === reviewForm.branchId) ||
              null
            }
            onChange={(_, value) =>
              setReviewForm({
                ...reviewForm,
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
          className="bg-white rounded-lg min-w-[50%]"
          value={reviewForm?.date ? dayjs(reviewForm?.date) : null}
          onChange={(newValue) =>
            setReviewForm({
              ...reviewForm,
              date: dayjs(newValue).format('YYYY-MM-DD'),
              timeslot: '',
            })
          }
        />

        {reviewForm?.date && (
          <FormControl className="min-w-[30%]">
            <InputLabel id="review-treatment-timeslot-label">
              Time Slot
            </InputLabel>
            <Select
              labelId="review-treatment-timeslot-label"
              id="review-treatment-timeslot"
              className="bg-white rounded-lg"
              value={reviewForm.timeslot || ''}
              name="timeslot"
              label="Time Slot"
              onChange={(e) =>
                setReviewForm({
                  ...reviewForm,
                  timeslot: e.target.value,
                })
              }
            >
              {isLoadingAvailableSlots ? (
                <MenuItem disabled>
                  <Skeleton width="100%" />
                </MenuItem>
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

        <div className="flex gap-2 items-center w-full">
          <Autocomplete
            fullWidth
            className="min-w-[700px]"
            options={appointmentReasonOptions}
            getOptionLabel={(option) => option.name}
            value={selectedAppointmentReason}
            loading={isLoadingReasons}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
              setInputValue(newInputValue)
            }}
            onChange={(e, value) => {
              setReviewForm({
                ...reviewForm,
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
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {params.InputProps.endAdornment}
                      <div className="flex items-center gap-2 pr-2">
                        {(!reviewForm.appointmentReasonId ||
                          isOthersSelected) && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm">Is Spouse</p>
                            <Switch
                              checked={newReason.isSpouse}
                              onChange={(e) =>
                                setNewReason({
                                  ...newReason,
                                  isSpouse: e.target.checked,
                                })
                              }
                              size="small"
                            />
                          </div>
                        )}

                        {!!reviewForm.appointmentReasonId &&
                        !isOthersSelected ? (
                          <IconButton size="small" className="text-success">
                            <Check />
                          </IconButton>
                        ) : !isOthersSelected ? (
                          <IconButton
                            size="small"
                            onClick={handleCreateNewReason}
                            disabled={!inputValue.trim()}
                            className="text-secondary"
                          >
                            <Add />
                          </IconButton>
                        ) : null}
                      </div>
                    </>
                  ),
                }}
              />
            )}
          />
        </div>
      </div>

      {isOthersSelected && (
        <TextField
          fullWidth
          label="Specify Appointment Reason"
          className="bg-white rounded-lg"
          multiline
          minRows={3}
          value={appointmentReasonComment}
          onChange={(e) => setAppointmentReasonComment(e.target.value)}
          placeholder="Please provide the specific reason"
          required
        />
      )}

      <FormControlLabel
        control={
          <Checkbox
            checked={reviewForm.hasAnyFuturePrescription}
            onChange={(e) =>
              setReviewForm({
                ...reviewForm,
                hasAnyFuturePrescription: e.target.checked,
              })
            }
          />
        }
        className="flex items-center gap-2"
        label="Add default Prescription"
      />

      {reviewForm.hasAnyFuturePrescription && allBillTypeValues && (
        <div className="flex flex-col gap-3">
          {billTypes.map((billType) => (
            <React.Fragment key={`${billType.name}-multiselect`}>
              <p className="font-semibold">{billType.name}</p>
              <ReactSelect
                isMulti
                name={billType.name}
                options={allBillTypeValues[billType.name]?.map((data) => ({
                  value: data.id,
                  label: data.name,
                }))}
                onChange={setSelectedValues(billType.name)}
                classNamePrefix={`select-${billType.name.toLowerCase()}`}
              />
              {billType.name === 'Pharmacy' &&
                defaultLineBillValues?.['3']?.length > 0 && (
                  <div className="h-48 border flex flex-col items-center p-2 overflow-y-auto gap-2 bg-primary/10 rounded-lg">
                    {defaultLineBillValues['3'].map((prescription) => (
                      <RenderPrescriptionPharmacy
                        key={`prescription-${prescription.id}`}
                        prescriptionId={prescription.id}
                        prescriptionName={prescription.name}
                        prescribedQuantity={prescription.prescribedQuantity}
                        prescriptionIntake={prescription.prescriptionDetails}
                        prescriptionDays={prescription.prescriptionDays}
                        prescriptionIntakeChange={handleIntakeChange}
                      />
                    ))}
                  </div>
                )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="flex w-full justify-end">
        <Button
          variant="contained"
          className="bg-secondary text-white"
          onClick={handleBookAppointment}
          disabled={bookAppointment.isPending || isCreatingReason}
        >
          Book Review Call
        </Button>
      </div>
    </div>
  )
}

export default ReviewTreatmentCall
