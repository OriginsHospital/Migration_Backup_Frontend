import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import { useDispatch, useSelector } from 'react-redux'
import dayjs from 'dayjs'
import { closeModal } from '@/redux/modalSlice'
import { openDischargeCardPrintWindow } from '@/utils/dischargeCardPrint'
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

const storageKeyFor = (patientId, treatmentCycleId) =>
  `origins-discharge-card:${patientId || 'unknown'}:${treatmentCycleId || 'none'}`

const loadDischargeCardDraft = (patientId, treatmentCycleId) => {
  try {
    const saved = localStorage.getItem(
      storageKeyFor(patientId, treatmentCycleId),
    )
    if (!saved) return null
    return JSON.parse(saved)
  } catch {
    return null
  }
}

const buildPrefill = (patientInfo, user) => {
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
      patientInfo.patientId || patientInfo.uhid || patientInfo.id || '',
    ),
  }
}

export const resolveDischargeCardData = (
  patientInfo,
  treatmentCycleId,
  user,
) => {
  const prefill = buildPrefill(patientInfo, user)
  const draft = loadDischargeCardDraft(
    patientInfo?.patientId || patientInfo?.id,
    treatmentCycleId,
  )
  return draft ? { ...prefill, ...draft } : prefill
}

export const hasDischargeCardDraft = (patientId, treatmentCycleId) =>
  Boolean(loadDischargeCardDraft(patientId, treatmentCycleId))

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

function DischargeCard({ patientInfo, treatmentCycleId, onAfterClose }) {
  const dispatch = useDispatch()
  const user = useSelector((store) => store.user)
  const storageKey = useMemo(
    () =>
      storageKeyFor(
        patientInfo?.patientId || patientInfo?.id,
        treatmentCycleId,
      ),
    [patientInfo?.patientId, patientInfo?.id, treatmentCycleId],
  )

  const [form, setForm] = useState(() => buildPrefill(patientInfo, user))

  useEffect(() => {
    const prefill = buildPrefill(patientInfo, user)
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setForm({ ...prefill, ...parsed })
        return
      }
    } catch {
      // ignore corrupt local storage
    }
    setForm(prefill)
  }, [patientInfo, user, storageKey])

  const handleChange = useCallback((event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }, [])

  const handleClose = () => {
    dispatch(closeModal())
    onAfterClose?.()
  }

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(form))
      toast.success('Discharge card draft saved', toastconfig)
      onAfterClose?.()
    } catch {
      toast.error('Unable to save draft', toastconfig)
    }
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      'Reset discharge card to patient defaults? Saved draft for this patient will be cleared.',
    )
    if (!confirmed) return
    localStorage.removeItem(storageKey)
    setForm(buildPrefill(patientInfo, user))
    toast.info('Discharge card reset', toastconfig)
    onAfterClose?.()
  }

  const handlePrint = () => {
    const printed = openDischargeCardPrintWindow(form)
    if (!printed) {
      toast.error('Unable to print. Allow pop-ups and try again.', toastconfig)
      return
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(form))
      onAfterClose?.()
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
          >
            Save Draft
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
