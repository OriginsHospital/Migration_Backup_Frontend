import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'
import {
  createPatientTrackerData,
  editPatientTrackerData,
} from '@/constants/apis'

const treatmentTypeOptions = [
  { value: 'IVF', label: 'IVF' },
  { value: 'OI-TI', label: 'OI-TI' },
  { value: 'IUI', label: 'IUI' },
]

const cycleStatusOptions = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Registered', label: 'Registered' },
  { value: 'Running', label: 'Running' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const stageOfCycleOptions = [
  { value: 'Registered', label: 'Registered' },
  { value: 'Initial Appointment', label: 'Initial Appointment' },
  { value: 'Follow up', label: 'Follow up' },
  { value: 'Treatment', label: 'Treatment' },
  { value: 'Cycle Started', label: 'Cycle Started' },
  { value: 'OPU', label: 'OPU' },
  { value: 'FET-D1', label: 'FET-D1' },
  { value: 'FET', label: 'FET' },
  { value: 'UPT', label: 'UPT' },
  { value: 'UPT Positive', label: 'UPT Positive' },
  { value: 'UPT Negative', label: 'UPT Negative' },
]

const uptResultOptions = [
  { value: 'Positive', label: 'Positive' },
  { value: 'Negative', label: 'Negative' },
  { value: 'Others', label: 'Others' },
]

const normalizeTreatmentType = (value) => {
  if (!value || value === '-') return ''
  const normalized = String(value)
    .trim()
    .toUpperCase()
    .replace(/\+/g, '-')
    .replace(/\s+/g, '-')
  if (normalized === 'OI-TI' || normalized === 'OITI') return 'OI-TI'
  if (normalized === 'IVF') return 'IVF'
  if (normalized === 'IUI') return 'IUI'
  return ''
}

const toDayjsOrNull = (value) => {
  if (!value || value === '-') return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

const emptyForm = () => ({
  id: null,
  date: dayjs(),
  branchId: '',
  patientId: '',
  patientName: '',
  mobileNumber: '',
  referralSourceId: '',
  referralName: '',
  plan: '',
  treatmentType: '',
  cycleStatus: '',
  stageOfCycle: '',
  packageName: '',
  packageAmount: '',
  registrationAmount: '',
  paidAmount: '',
  icsiD1: null,
  opu: null,
  fetD1: null,
  fet: null,
  numberOfEmbryos: '',
  numberOfEmbryosUsed: '',
  numberOfEmbryosDiscarded: '',
  lastRenewalDate: null,
  uptResult: '',
  uptManualEntry: '',
})

const buildInitialForm = ({ patientRow, trackerRecord, branchOptions }) => {
  const base = emptyForm()
  const source = trackerRecord || {}
  const row = patientRow || {}

  const branchFromRow =
    branchOptions.find(
      (b) =>
        b.label === row.branch ||
        String(b.value) === String(row.branchId) ||
        String(b.value) === String(source.branchId),
    )?.value ||
    source.branchId ||
    row.branchId ||
    ''

  return {
    ...base,
    id: source.id || null,
    date: toDayjsOrNull(source.date) || toDayjsOrNull(row.date) || dayjs(),
    branchId: branchFromRow,
    patientId: source.patientId || row.patientId || '',
    patientName: source.patientName || row.patientName || '',
    mobileNumber:
      source.mobileNumber ||
      (row.mobileNumber && row.mobileNumber !== '-' ? row.mobileNumber : '') ||
      '',
    referralSourceId: source.referralSourceId || '',
    referralName:
      source.referralName ||
      (row.referralName && row.referralName !== '-' ? row.referralName : '') ||
      '',
    plan: source.plan || (row.plan && row.plan !== '-' ? row.plan : '') || '',
    treatmentType:
      normalizeTreatmentType(source.treatmentType) ||
      normalizeTreatmentType(row.treatmentType) ||
      '',
    cycleStatus:
      source.cycleStatus ||
      (row.cycleStatus === 'Registered' || row.cycleStatus === 'Follow up'
        ? row.cycleStatus === 'Follow up'
          ? 'Not Started'
          : 'Registered'
        : '') ||
      '',
    stageOfCycle:
      source.stageOfCycle ||
      (row.stageOfCycle && row.stageOfCycle !== '-' ? row.stageOfCycle : '') ||
      '',
    packageName: source.packageName || '',
    packageAmount:
      source.packageAmount ?? row.marketingPackage ?? row.doctorsPackage ?? '',
    registrationAmount:
      source.registrationAmount ?? row.registrationAmount ?? '',
    paidAmount: source.paidAmount ?? row.paidAmount ?? '',
    icsiD1: toDayjsOrNull(source.icsiD1) || toDayjsOrNull(row.icsiD1),
    opu: toDayjsOrNull(source.opu) || toDayjsOrNull(row.opu),
    fetD1: toDayjsOrNull(source.fetD1) || toDayjsOrNull(row.fetD1),
    fet: toDayjsOrNull(source.fet) || toDayjsOrNull(row.fet),
    numberOfEmbryos:
      source.numberOfEmbryos ??
      (row.numberOfEmbryos && row.numberOfEmbryos !== '-'
        ? row.numberOfEmbryos
        : '') ??
      '',
    numberOfEmbryosUsed:
      source.numberOfEmbryosUsed ??
      (row.numberOfEmbryosUsed && row.numberOfEmbryosUsed !== '-'
        ? row.numberOfEmbryosUsed
        : '') ??
      '',
    numberOfEmbryosDiscarded:
      source.numberOfEmbryosDiscarded ??
      (row.numberOfEmbryosDiscarded && row.numberOfEmbryosDiscarded !== '-'
        ? row.numberOfEmbryosDiscarded
        : '') ??
      '',
    lastRenewalDate:
      toDayjsOrNull(source.lastRenewalDate) ||
      toDayjsOrNull(row.lastRenewalDate),
    uptResult:
      source.uptResult ||
      (row.uptResult && row.uptResult !== '-' ? row.uptResult : '') ||
      '',
    uptManualEntry: source.uptManualEntry || '',
  }
}

const formatDatePayload = (value) =>
  value && dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : null

/**
 * Drawer for Summary Automated: search/select patient → Data Entry or Edit.
 */
export default function SummaryAutomatedEntryDrawer({
  open,
  onClose,
  mode = 'create', // 'create' | 'edit'
  patientRow,
  trackerRecord,
  accessToken,
  branchOptions = [],
  referralSourceOptions = [],
  onSaved,
}) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      buildInitialForm({
        patientRow,
        trackerRecord: mode === 'edit' ? trackerRecord : null,
        branchOptions,
      }),
    )
  }, [open, mode, patientRow, trackerRecord, branchOptions])

  const pendingAmount = useMemo(() => {
    const packageAmt = parseFloat(form.packageAmount) || 0
    const paidAmt = parseFloat(form.paidAmount) || 0
    const regAmt = parseFloat(form.registrationAmount) || 0
    return paidAmt === 0 ? packageAmt - regAmt : packageAmt - paidAmt
  }, [form.packageAmount, form.paidAmount, form.registrationAmount])

  const embryosRemaining = useMemo(() => {
    const total = parseFloat(form.numberOfEmbryos) || 0
    const used = parseFloat(form.numberOfEmbryosUsed) || 0
    return total - used
  }, [form.numberOfEmbryos, form.numberOfEmbryosUsed])

  const missingFields = useMemo(() => {
    const checks = [
      ['cycleStatus', form.cycleStatus],
      ['stageOfCycle', form.stageOfCycle],
      ['icsiD1', form.icsiD1],
      ['opu', form.opu],
      ['fetD1', form.fetD1],
      ['fet', form.fet],
      ['uptResult', form.uptResult],
      ['numberOfEmbryos', form.numberOfEmbryos],
    ]
    return checks.filter(([, v]) => v === null || v === undefined || v === '')
      .length
  }, [form])

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (
      !form.patientId ||
      !form.date ||
      !form.branchId ||
      !form.treatmentType ||
      !form.cycleStatus
    ) {
      toast.error(
        'Please fill required fields: Branch, Treatment Type, Cycle Status',
        { position: 'top-right' },
      )
      return
    }

    const payload = {
      date: formatDatePayload(form.date),
      branchId: Number(form.branchId),
      patientId: form.patientId,
      patientName: form.patientName,
      mobileNumber: form.mobileNumber || null,
      referralSourceId: form.referralSourceId
        ? Number(form.referralSourceId)
        : null,
      referralName: form.referralName || null,
      plan: form.plan || null,
      treatmentType: form.treatmentType,
      cycleStatus: form.cycleStatus,
      stageOfCycle: form.stageOfCycle || null,
      packageName: form.packageName || null,
      packageAmount: parseFloat(form.packageAmount) || 0,
      registrationAmount: parseFloat(form.registrationAmount) || 0,
      paidAmount: parseFloat(form.paidAmount) || 0,
      pendingAmount,
      icsiD1: formatDatePayload(form.icsiD1),
      opu: formatDatePayload(form.opu),
      fetD1: formatDatePayload(form.fetD1),
      fet: formatDatePayload(form.fet),
      numberOfEmbryos: parseInt(form.numberOfEmbryos, 10) || 0,
      numberOfEmbryosUsed: parseInt(form.numberOfEmbryosUsed, 10) || 0,
      numberOfEmbryosDiscarded:
        parseInt(form.numberOfEmbryosDiscarded, 10) || 0,
      lastRenewalDate: formatDatePayload(form.lastRenewalDate),
      embryosRemaining,
      uptResult: form.uptResult || null,
      uptManualEntry: form.uptManualEntry || null,
    }

    setSaving(true)
    try {
      let response
      if (mode === 'edit' && form.id) {
        response = await editPatientTrackerData(accessToken, {
          id: form.id,
          ...payload,
        })
      } else {
        response = await createPatientTrackerData(accessToken, payload)
      }

      if (response?.status === 200) {
        toast.success(
          mode === 'edit'
            ? 'Tracker data updated successfully'
            : 'Tracker data saved successfully',
          { position: 'top-right' },
        )
        onSaved?.(response.data || { ...payload, id: form.id })
        onClose?.()
      } else {
        toast.error(response?.message || 'Failed to save tracker data', {
          position: 'top-right',
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to save tracker data', { position: 'top-right' })
    } finally {
      setSaving(false)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 520, md: 560 }, p: 0 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isEdit ? '#eef7fb' : '#f3faf4',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEdit ? <EditIcon color="primary" /> : <AddIcon color="success" />}
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              {isEdit ? 'Edit Tracker Data' : 'Data Entry'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {form.patientName || 'Patient'} · {form.patientId || '—'}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={isEdit ? 'Existing record' : 'New entry'}
          color={isEdit ? 'primary' : 'success'}
          variant="outlined"
        />
        {missingFields > 0 && (
          <Chip
            size="small"
            label={`${missingFields} attribute(s) missing`}
            color="warning"
            variant="outlined"
          />
        )}
        {form.mobileNumber && (
          <Chip size="small" label={form.mobileNumber} variant="outlined" />
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 2, overflowY: 'auto', height: '100%' }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={1.5}>
            <Grid item xs={12}>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Patient ID"
                value={form.patientId}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Patient Name"
                value={form.patientName}
                onChange={(e) => setField('patientName', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Date *"
                value={form.date}
                onChange={(v) => setField('date', v)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Branch *</InputLabel>
                <Select
                  label="Branch *"
                  value={form.branchId}
                  onChange={(e) => setField('branchId', e.target.value)}
                >
                  {branchOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Mobile"
                value={form.mobileNumber}
                onChange={(e) => setField('mobileNumber', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Referral Source</InputLabel>
                <Select
                  label="Referral Source"
                  value={form.referralSourceId}
                  onChange={(e) => setField('referralSourceId', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {referralSourceOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Referral Name"
                value={form.referralName}
                onChange={(e) => setField('referralName', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="overline" color="text.secondary">
                Treatment
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Plan"
                value={form.plan}
                onChange={(e) => setField('plan', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Treatment Type *</InputLabel>
                <Select
                  label="Treatment Type *"
                  value={form.treatmentType}
                  onChange={(e) => setField('treatmentType', e.target.value)}
                >
                  {treatmentTypeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Cycle Status *</InputLabel>
                <Select
                  label="Cycle Status *"
                  value={form.cycleStatus}
                  onChange={(e) => setField('cycleStatus', e.target.value)}
                >
                  {cycleStatusOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Stage of Cycle</InputLabel>
                <Select
                  label="Stage of Cycle"
                  value={form.stageOfCycle}
                  onChange={(e) => setField('stageOfCycle', e.target.value)}
                >
                  {stageOfCycleOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="overline" color="text.secondary">
                Clinical dates (often missing)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="ICSI - D1"
                value={form.icsiD1}
                onChange={(v) => setField('icsiD1', v)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="OPU"
                value={form.opu}
                onChange={(v) => setField('opu', v)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="FET - D1"
                value={form.fetD1}
                onChange={(v) => setField('fetD1', v)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="FET"
                value={form.fet}
                onChange={(v) => setField('fet', v)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="overline" color="text.secondary">
                Embryology & UPT
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Embryos"
                value={form.numberOfEmbryos}
                onChange={(e) => setField('numberOfEmbryos', e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Used"
                value={form.numberOfEmbryosUsed}
                onChange={(e) =>
                  setField('numberOfEmbryosUsed', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Discarded"
                value={form.numberOfEmbryosDiscarded}
                onChange={(e) =>
                  setField('numberOfEmbryosDiscarded', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Remaining"
                value={embryosRemaining}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <DatePicker
                label="Last Renewal"
                value={form.lastRenewalDate}
                onChange={(v) => setField('lastRenewalDate', v)}
                format="DD/MM/YYYY"
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>UPT Result</InputLabel>
                <Select
                  label="UPT Result"
                  value={form.uptResult}
                  onChange={(e) => setField('uptResult', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {uptResultOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {form.uptResult === 'Others' && (
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="UPT Manual Entry"
                  value={form.uptManualEntry}
                  onChange={(e) => setField('uptManualEntry', e.target.value)}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="overline" color="text.secondary">
                Package (optional override)
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                label="Package Name"
                value={form.packageName}
                onChange={(e) => setField('packageName', e.target.value)}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Package Amount"
                value={form.packageAmount}
                onChange={(e) => setField('packageAmount', e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Registration"
                value={form.registrationAmount}
                onChange={(e) => setField('registrationAmount', e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Paid"
                value={form.paidAmount}
                onChange={(e) => setField('paidAmount', e.target.value)}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                size="small"
                label="Pending"
                value={pendingAmount}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
          justifyContent: 'flex-end',
        }}
      >
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : isEdit ? 'Update' : 'Save Entry'}
        </Button>
      </Box>
    </Drawer>
  )
}
