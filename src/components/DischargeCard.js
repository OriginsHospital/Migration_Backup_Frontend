import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { useDispatch, useSelector } from 'react-redux'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { closeModal } from '@/redux/modalSlice'
import { openDischargeCardPrintWindow } from '@/utils/dischargeCardPrint'
import { getDischargeCard, saveDischargeCard } from '@/constants/apis'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'

const SEX_OPTIONS = ['Female', 'Male', 'Other']
const BABY_SEX_OPTIONS = ['Male', 'Female']
const DELIVERY_TYPE_OPTIONS = [
  'Normal Vaginal Delivery',
  'LSCS',
  'Assisted / Instrumental',
  'Other',
]

const emptyForm = () => ({
  consultantDr: '',
  patientName: '',
  age: '',
  woDo: '',
  sex: 'Female',
  address: '',
  regdNo: '',
  dateOfAdmission: '',
  typeOfDelivery: '',
  dateOfOperation: '',
  dateOfDelivery: '',
  dateOfDischarge: '',
  timeOfDelivery: '',
  sexOfBaby: '',
  birthWeight: '',
  diagnosis: '',
  typeOfOperation: '',
  history: '',
  findings: '',
  treatmentGiven: '',
  investigations: '',
  dischargeAdvise: '',
  followUp: '',
  reviewAfter: '',
})

const parseCardData = (cardData) => {
  if (!cardData) return null
  if (typeof cardData === 'string') {
    try {
      return JSON.parse(cardData)
    } catch {
      return null
    }
  }
  return cardData
}

const toPositiveInt = (value) => {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

export const resolveDischargeCardVisitId = (patientInfo, visitId) =>
  toPositiveInt(visitId) ||
  toPositiveInt(patientInfo?.visitId) ||
  toPositiveInt(patientInfo?.visit_id) ||
  toPositiveInt(patientInfo?.activeVisitId)

export const resolveDischargeCardPatientId = (patientInfo) =>
  toPositiveInt(patientInfo?.id) ||
  toPositiveInt(patientInfo?.patientAutoId) ||
  toPositiveInt(patientInfo?.patientId)

export const buildPrefill = (patientInfo, user) => {
  if (!patientInfo) return emptyForm()

  const firstName = patientInfo.firstName || ''
  const lastName = patientInfo.lastName || ''
  const patientName =
    [lastName, firstName].filter(Boolean).join(' ').trim() ||
    patientInfo.Name ||
    patientInfo.patientName ||
    ''

  const ageYears = patientInfo.dateOfBirth
    ? dayjs().diff(dayjs(patientInfo.dateOfBirth), 'year')
    : patientInfo.age || patientInfo.patientAge || ''

  const addressParts = [
    patientInfo.addressLine1,
    patientInfo.addressLine2,
    patientInfo.cityName || patientInfo.city,
  ].filter(Boolean)

  const woDo =
    patientInfo.spouseName ||
    patientInfo.husbandName ||
    patientInfo.fatherName ||
    ''

  const rawGender = String(patientInfo.gender || '')
    .trim()
    .toLowerCase()
  let sex = 'Female'
  if (rawGender === 'male' || rawGender === 'm') sex = 'Male'
  else if (rawGender === 'other' || rawGender === 'o') sex = 'Other'
  else if (rawGender === 'female' || rawGender === 'f') sex = 'Female'
  else if (patientInfo.gender) sex = patientInfo.gender

  const consultantFromRow =
    patientInfo.consultantDr ||
    patientInfo.doctorName ||
    patientInfo.gynecologist ||
    ''

  return {
    ...emptyForm(),
    consultantDr: consultantFromRow
      ? consultantFromRow.startsWith('Dr')
        ? consultantFromRow
        : `Dr. ${consultantFromRow}`
      : user?.fullName
        ? `Dr. ${user.fullName}`
        : '',
    patientName,
    age: ageYears !== '' && ageYears != null ? String(ageYears) : '',
    woDo,
    sex,
    address: addressParts.join(', '),
    regdNo: String(
      patientInfo.uhid || patientInfo.patientId || patientInfo.id || '',
    ),
  }
}

export const resolveDischargeCardData = (
  patientInfo,
  treatmentCycleId,
  user,
  savedCardData,
) => {
  const prefill = buildPrefill(patientInfo, user)
  const draft = parseCardData(savedCardData)
  return draft ? { ...prefill, ...draft } : prefill
}

export const hasDischargeCardDraft = (row) => {
  const raw = row?.hasSavedCard ?? row?.hasDraft
  if (raw === true || raw === 1 || raw === '1') return true
  if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
    return Number(raw.data[0]) === 1
  }
  return Number(raw) === 1
}

function Field({
  label,
  name,
  value,
  onChange,
  multiline = false,
  rows = 1,
  select = false,
  options = [],
  type = 'text',
  placeholder = '',
}) {
  const commonProps = {
    fullWidth: true,
    size: 'small',
    label,
    name,
    value: value ?? '',
    onChange,
    multiline,
    rows: multiline ? rows : undefined,
    type: select ? undefined : type,
    placeholder,
    InputLabelProps:
      type === 'date' || type === 'time' ? { shrink: true } : undefined,
    sx: {
      '& .MuiInputBase-root': {
        backgroundColor: '#fff',
      },
    },
  }

  if (select) {
    return (
      <TextField {...commonProps} select>
        <MenuItem value="">
          <em>Select</em>
        </MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    )
  }

  return <TextField {...commonProps} />
}

function DischargeCard({
  patientInfo,
  visitId: visitIdProp,
  appointmentId,
  appointmentType,
  treatmentCycleId,
  onAfterClose,
}) {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector((store) => store.user)
  const visitId = resolveDischargeCardVisitId(patientInfo, visitIdProp)
  const numericPatientId = resolveDischargeCardPatientId(patientInfo)

  const [form, setForm] = useState(() => buildPrefill(patientInfo, user))
  const formRef = useRef(form)
  const hydratedKeyRef = useRef(null)

  useEffect(() => {
    formRef.current = form
  }, [form])

  const { data: savedCard, isFetching: isLoadingSavedCard } = useQuery({
    queryKey: ['dischargeCard', visitId, numericPatientId],
    enabled: Boolean((visitId || numericPatientId) && user?.accessToken),
    queryFn: async () => {
      const response = await getDischargeCard(
        user.accessToken,
        visitId,
        numericPatientId,
      )
      if (response.status === 200) {
        return response.data || null
      }
      throw new Error(response?.message || 'Could not load discharge card')
    },
  })

  useEffect(() => {
    if (isLoadingSavedCard) return
    const key = `${visitId || 'none'}:${numericPatientId || 'none'}:${savedCard?.id || 'empty'}:${savedCard?.updatedAt || ''}`
    if (hydratedKeyRef.current === key) return
    hydratedKeyRef.current = key
    const prefill = buildPrefill(patientInfo, user)
    const saved = parseCardData(savedCard?.cardData)
    setForm(saved ? { ...prefill, ...saved } : prefill)
  }, [
    visitId,
    numericPatientId,
    savedCard,
    isLoadingSavedCard,
    patientInfo,
    user,
  ])

  const persistCard = async () => {
    if (!visitId) {
      toast.error(
        'Visit not found for this appointment. Cannot save discharge card.',
        toastconfig,
      )
      return false
    }
    if (!numericPatientId) {
      toast.error(
        'Patient not found for this appointment. Cannot save discharge card.',
        toastconfig,
      )
      return false
    }

    const response = await saveDischargeCard(user.accessToken, {
      visitId,
      patientId: numericPatientId,
      appointmentId:
        toPositiveInt(appointmentId) ||
        toPositiveInt(patientInfo?.appointmentId),
      appointmentType:
        appointmentType ||
        patientInfo?.appointmentType ||
        patientInfo?.type ||
        null,
      treatmentCycleId:
        toPositiveInt(treatmentCycleId) ||
        toPositiveInt(patientInfo?.treatmentCycleId),
      cardData: formRef.current,
    })

    if (response.status !== 200) {
      throw new Error(response?.message || 'Unable to save discharge card')
    }

    await queryClient.invalidateQueries({
      queryKey: ['dischargeCard', visitId],
    })
    await queryClient.invalidateQueries({
      queryKey: ['scanDischargeCardByDate'],
      exact: false,
    })
    onAfterClose?.()
    return true
  }

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleClose = () => {
    dispatch(closeModal())
    onAfterClose?.()
  }

  const handleSaveDraft = async () => {
    try {
      const saved = await persistCard()
      if (saved) {
        toast.success('Discharge card saved', toastconfig)
      }
    } catch {
      toast.error('Unable to save discharge card', toastconfig)
    }
  }

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Reset discharge card to patient defaults? Saved data for this visit will be replaced.',
    )
    if (!confirmed) return
    const prefill = buildPrefill(patientInfo, user)
    setForm(prefill)
    try {
      if (!visitId || !numericPatientId) {
        toast.info('Discharge card reset', toastconfig)
        return
      }
      const response = await saveDischargeCard(user.accessToken, {
        visitId,
        patientId: numericPatientId,
        appointmentId:
          toPositiveInt(appointmentId) ||
          toPositiveInt(patientInfo?.appointmentId),
        appointmentType:
          appointmentType ||
          patientInfo?.appointmentType ||
          patientInfo?.type ||
          null,
        treatmentCycleId:
          toPositiveInt(treatmentCycleId) ||
          toPositiveInt(patientInfo?.treatmentCycleId),
        cardData: prefill,
      })
      if (response.status !== 200) {
        throw new Error(response?.message || 'Unable to reset discharge card')
      }
      await queryClient.invalidateQueries({
        queryKey: ['dischargeCard', visitId],
      })
      await queryClient.invalidateQueries({
        queryKey: ['scanDischargeCardByDate'],
        exact: false,
      })
      toast.info('Discharge card reset', toastconfig)
      onAfterClose?.()
    } catch {
      toast.error('Unable to reset saved discharge card', toastconfig)
    }
  }

  const handlePrint = async () => {
    const printed = openDischargeCardPrintWindow(form)
    if (!printed) {
      toast.error('Unable to print. Allow pop-ups and try again.', toastconfig)
      return
    }
    try {
      await persistCard()
    } catch {
      // print still succeeded
    }
  }

  return (
    <Box className="p-4 max-h-[85vh] overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Typography variant="h6" className="font-semibold tracking-wide">
          ORIGINS HOSPITAL - DISCHARGE CARD
        </Typography>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<SaveOutlinedIcon />}
            onClick={handleSaveDraft}
            disabled={isLoadingSavedCard}
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button variant="outlined" color="error" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>

      <Box
        className="border border-gray-800 bg-[#fafafa] p-4 md:p-6"
        sx={{ maxWidth: 920, mx: 'auto' }}
      >
        <Typography
          align="center"
          className="font-bold uppercase tracking-wider underline mb-4"
          sx={{ fontSize: '1.1rem' }}
        >
          ORIGINS HOSPITAL - DISCHARGE CARD
        </Typography>

        <div className="mb-4">
          <Field
            label="Consultant Dr."
            name="consultantDr"
            value={form.consultantDr}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Field
            label="Pt. Name"
            name="patientName"
            value={form.patientName}
            onChange={handleChange}
          />
          <Field
            label="Age"
            name="age"
            value={form.age}
            onChange={handleChange}
          />
          <Field
            label="W/o, D/o"
            name="woDo"
            value={form.woDo}
            onChange={handleChange}
          />
          <Field
            label="Sex"
            name="sex"
            value={form.sex}
            onChange={handleChange}
            select
            options={SEX_OPTIONS}
          />
          <Field
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
          />
          <Field
            label="Regd. No."
            name="regdNo"
            value={form.regdNo}
            onChange={handleChange}
          />
          <Field
            label="Date of Admission"
            name="dateOfAdmission"
            value={form.dateOfAdmission}
            onChange={handleChange}
            type="date"
          />
          <Field
            label="Type of Delivery"
            name="typeOfDelivery"
            value={form.typeOfDelivery}
            onChange={handleChange}
            select
            options={DELIVERY_TYPE_OPTIONS}
          />
          <Field
            label="Date of Operation"
            name="dateOfOperation"
            value={form.dateOfOperation}
            onChange={handleChange}
            type="date"
          />
          <Field
            label="Date of Delivery"
            name="dateOfDelivery"
            value={form.dateOfDelivery}
            onChange={handleChange}
            type="date"
          />
          <Field
            label="Date of Discharge"
            name="dateOfDischarge"
            value={form.dateOfDischarge}
            onChange={handleChange}
            type="date"
          />
          <Field
            label="Time of Delivery"
            name="timeOfDelivery"
            value={form.timeOfDelivery}
            onChange={handleChange}
            type="time"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <Field
            label="Sex of Baby"
            name="sexOfBaby"
            value={form.sexOfBaby}
            onChange={handleChange}
            select
            options={BABY_SEX_OPTIONS}
          />
          <Field
            label="Birth Weight"
            name="birthWeight"
            value={form.birthWeight}
            onChange={handleChange}
            placeholder="e.g. 2.8 kg"
          />
        </div>

        <div className="flex flex-col gap-3 mb-3">
          <Field
            label="Diagnosis"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
          />
          <Field
            label="Type of Operation"
            name="typeOfOperation"
            value={form.typeOfOperation}
            onChange={handleChange}
          />
          <Field
            label="History"
            name="history"
            value={form.history}
            onChange={handleChange}
            multiline
            rows={2}
          />
          <Field
            label="Findings"
            name="findings"
            value={form.findings}
            onChange={handleChange}
            multiline
            rows={2}
          />
        </div>

        <div className="flex flex-col gap-3">
          <Field
            label="TREATMENT GIVEN"
            name="treatmentGiven"
            value={form.treatmentGiven}
            onChange={handleChange}
            multiline
            rows={3}
          />
          <Field
            label="INVESTIGATIONS"
            name="investigations"
            value={form.investigations}
            onChange={handleChange}
            multiline
            rows={3}
          />
          <Field
            label="DISCHARGE ADVISE"
            name="dischargeAdvise"
            value={form.dischargeAdvise}
            onChange={handleChange}
            multiline
            rows={3}
          />
          <Field
            label="FOLLOW UP"
            name="followUp"
            value={form.followUp}
            onChange={handleChange}
            multiline
            rows={2}
          />
          <Field
            label="Review after"
            name="reviewAfter"
            value={form.reviewAfter}
            onChange={handleChange}
            placeholder="e.g. 7 days / 2 weeks"
          />
        </div>

        <Typography align="right" className="mt-8 font-semibold text-gray-700">
          Consulting Doctor Sign.
        </Typography>
      </Box>
    </Box>
  )
}

export default DischargeCard
