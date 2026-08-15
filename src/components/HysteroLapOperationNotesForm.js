import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Select,
  InputLabel,
  FormControl,
  Autocomplete,
  Paper,
  IconButton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import ImageIcon from '@mui/icons-material/Image'
import DeleteIcon from '@mui/icons-material/Delete'
import PrintIcon from '@mui/icons-material/Print'
import { openHysteroLapPrintWindow } from '../utils/hysteroLapPrint'

const BRANCH_OPTIONS = ['Khammam', 'Hanmkonda', 'Hyderabad', 'Sathupalli']
const GYNAECOLOGIST_OPTIONS = [
  'Dr. K. Jhansi Rani',
  'Dr. P. Sravani',
  'Dr. S. Swetha',
  'Dr. Annapurna',
  'Dr. Sneha',
  'Dr. D. Teja',
]
const EXPERT_OPTIONS = [
  'Dr. K. Jhansi Rani',
  'Dr. P. Sravani',
  'Dr. S. Swetha',
  'Dr. Annapurna',
  'Dr. Sneha',
  'Dr. D. Teja',
]

const emptyForm = () => ({
  formType: '',
  clinicalDiagnosis: '',
  lmp: null,
  dayOfCycle: '',
  admissionDate: null,
  procedureDate: null,
  dischargeDate: null,
  procedureType: '',
  finalDiagnosisAfterOperation: '',
  hospitalBranch: '',
  gynecologist: '',
  assistant: '',
  anesthetist: '',
  otAssistant: '',
  diagnosis: '',
  procedure: '',
  entry: '',
  uterus: '',
  endometrialThickness: '',
  abnormality: '',
  operativeFindings: '',
  intraopComplications: '',
  postopCourse: '',
  reviewOn: null,
  dischargeMedications: '',
  expertConsultant: '',
})

const normalizeReferenceImages = (data) => {
  if (!Array.isArray(data?.referenceImages)) return []
  return data.referenceImages
    .map((image) => ({
      id: image?.id ?? image?.imageId ?? null,
      imageUrl: image?.imageUrl ?? image?.ImageUrl ?? '',
    }))
    .filter((image) => image.imageUrl)
}

const toReferenceImage = (value) => {
  if (!value) return null
  if (typeof value === 'string') return { id: null, imageUrl: value }
  return {
    id: value?.id ?? value?.imageId ?? null,
    imageUrl: value?.imageUrl ?? value?.ImageUrl ?? '',
  }
}

function HysteroLapOperationNotesForm({
  formType,
  visitId,
  patientId,
  patientName = '',
  patientAge = '',
  initialData = null,
  onSave,
  onCancel,
  onImageUpload,
  onImageDelete,
}) {
  const isFormDirtyRef = useRef(false)
  const imagesDirtyRef = useRef(false)
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState({})
  const [uploadedImages, setUploadedImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [deletingImageIndex, setDeletingImageIndex] = useState(null)

  useEffect(() => {
    isFormDirtyRef.current = false
    imagesDirtyRef.current = false
  }, [visitId, patientId])

  const mapInitialDataToForm = (data) => {
    const legacyFinalDiagnosis =
      !data.finalDiagnosisAfterOperation &&
      data.consultantName &&
      !data.expertConsultant
        ? data.consultantName
        : ''

    return {
      formType: data.formType || formType || '',
      clinicalDiagnosis: data.clinicalDiagnosis || '',
      lmp: data.lmp ? dayjs(data.lmp) : null,
      dayOfCycle: data.dayOfCycle || '',
      admissionDate: data.admissionDate ? dayjs(data.admissionDate) : null,
      procedureDate: data.procedureDate ? dayjs(data.procedureDate) : null,
      dischargeDate: data.dischargeDate ? dayjs(data.dischargeDate) : null,
      procedureType: data.procedureType || '',
      finalDiagnosisAfterOperation:
        data.finalDiagnosisAfterOperation || legacyFinalDiagnosis || '',
      hospitalBranch: data.hospitalBranch || '',
      gynecologist: data.gynecologist || '',
      assistant: data.assistant || '',
      anesthetist: data.anesthetist || '',
      otAssistant: data.otAssistant || '',
      diagnosis: data.diagnosis || '',
      procedure: data.anesthesiaType || data.procedure || '',
      entry: data.entry || '',
      uterus: data.uterus || '',
      endometrialThickness: data.endometrialThickness || '',
      abnormality: data.distensionMedia || data.abnormality || '',
      operativeFindings: data.operativeFindings || '',
      intraopComplications: data.intraopComplications || '',
      postopCourse: data.postopCourse || '',
      reviewOn: data.reviewOn ? dayjs(data.reviewOn) : null,
      dischargeMedications: data.dischargeMedications || '',
      expertConsultant: data.consultantName || '',
    }
  }

  useEffect(() => {
    if (initialData) {
      if (!isFormDirtyRef.current) {
        setForm(mapInitialDataToForm(initialData))
      }
      if (!imagesDirtyRef.current) {
        setUploadedImages(normalizeReferenceImages(initialData))
      }
    } else if (formType) {
      setForm((prev) => ({ ...prev, formType: prev.formType || formType }))
    }
  }, [initialData, formType])

  const handleChange = (name, value) => {
    isFormDirtyRef.current = true
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.procedureType?.trim()) nextErrors.procedureType = 'Required'
    if (!form.hospitalBranch) nextErrors.hospitalBranch = 'Required'
    if (!form.gynecologist) nextErrors.gynecologist = 'Required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildPayload = () => ({
    patientId,
    visitId,
    formType: form.formType || formType,
    clinicalDiagnosis: form.clinicalDiagnosis,
    lmp: form.lmp ? form.lmp.format('YYYY-MM-DD') : null,
    dayOfCycle: form.dayOfCycle,
    admissionDate: form.admissionDate
      ? form.admissionDate.format('YYYY-MM-DD')
      : null,
    procedureDate: form.procedureDate
      ? form.procedureDate.format('YYYY-MM-DD')
      : null,
    dischargeDate: form.dischargeDate
      ? form.dischargeDate.format('YYYY-MM-DD')
      : null,
    procedureType: form.procedureType,
    finalDiagnosisAfterOperation: form.finalDiagnosisAfterOperation,
    hospitalBranch: form.hospitalBranch,
    gynecologist: form.gynecologist,
    assistant: form.assistant,
    anesthetist: form.anesthetist,
    otAssistant: form.otAssistant,
    diagnosis: form.diagnosis,
    anesthesiaType: form.procedure,
    entry: form.entry,
    uterus: form.uterus,
    endometrialThickness: form.endometrialThickness,
    distensionMedia: form.abnormality,
    operativeFindings: form.operativeFindings,
    intraopComplications: form.intraopComplications,
    postopCourse: form.postopCourse,
    reviewOn: form.reviewOn ? form.reviewOn.format('YYYY-MM-DD') : null,
    dischargeMedications: form.dischargeMedications,
    consultantName: form.expertConsultant,
    expertConsultant: form.expertConsultant,
  })

  const handleSave = () => {
    if (!validate()) return
    onSave?.(buildPayload())
  }

  const handlePrint = () => {
    openHysteroLapPrintWindow({
      ...form,
      patientName:
        patientName ||
        initialData?.patientName ||
        initialData?.PatientName ||
        '',
      age: patientAge || initialData?.age || initialData?.patientAge || '',
      anesthesiaType: form.procedure,
      distensionMedia: form.abnormality,
      consultantName: form.expertConsultant,
    })
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length || !onImageUpload) return

    setIsUploading(true)
    try {
      const uploadedImagesList = []
      for (const file of files) {
        const result = await onImageUpload(file, visitId)
        const image = toReferenceImage(result)
        if (image?.imageUrl) uploadedImagesList.push(image)
      }
      if (uploadedImagesList.length) {
        imagesDirtyRef.current = true
        setUploadedImages((prev) => [...prev, ...uploadedImagesList])
      }
    } catch (error) {
      console.error('Error uploading images:', error)
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = async (index) => {
    const image = uploadedImages[index]
    if (!image) return

    setDeletingImageIndex(index)
    const previousImages = uploadedImages

    imagesDirtyRef.current = true
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))

    if (!onImageDelete) {
      setDeletingImageIndex(null)
      return
    }

    try {
      await onImageDelete(image)
    } catch (error) {
      console.error('Error deleting image:', error)
      imagesDirtyRef.current = false
      setUploadedImages(previousImages)
    } finally {
      setDeletingImageIndex(null)
    }
  }

  const title =
    form.formType || formType
      ? `${form.formType || formType} Operation Notes`
      : 'Hystero/Lap Operation Notes'

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        {title}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Clinical Diagnosis"
            value={form.clinicalDiagnosis}
            onChange={(e) => handleChange('clinicalDiagnosis', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <DatePicker
            label="LMP"
            value={form.lmp}
            onChange={(val) => handleChange('lmp', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Day of Cycle"
            value={form.dayOfCycle}
            onChange={(e) => handleChange('dayOfCycle', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Date of Admission"
            value={form.admissionDate}
            onChange={(val) => handleChange('admissionDate', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Date of Procedure"
            value={form.procedureDate}
            onChange={(val) => handleChange('procedureDate', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Date of Discharge"
            value={form.dischargeDate}
            onChange={(val) => handleChange('dischargeDate', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Type of Procedures"
            value={form.procedureType}
            onChange={(e) => handleChange('procedureType', e.target.value)}
            fullWidth
            required
            error={!!errors.procedureType}
            helperText={errors.procedureType}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Final Diagnosis After Operation"
            value={form.finalDiagnosisAfterOperation}
            onChange={(e) =>
              handleChange('finalDiagnosisAfterOperation', e.target.value)
            }
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required error={!!errors.hospitalBranch}>
            <InputLabel>Hospital</InputLabel>
            <Select
              value={form.hospitalBranch}
              label="Hospital"
              onChange={(e) => handleChange('hospitalBranch', e.target.value)}
            >
              {BRANCH_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Autocomplete
            options={GYNAECOLOGIST_OPTIONS}
            value={form.gynecologist}
            onChange={(_, val) => handleChange('gynecologist', val || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Gynaecologist"
                required
                error={!!errors.gynecologist}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Assistant"
            value={form.assistant}
            onChange={(e) => handleChange('assistant', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Anaesthetist"
            value={form.anesthetist}
            onChange={(e) => handleChange('anesthetist', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="OT Assistant"
            value={form.otAssistant}
            onChange={(e) => handleChange('otAssistant', e.target.value)}
            fullWidth
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Diagnosis"
            value={form.diagnosis}
            onChange={(e) => handleChange('diagnosis', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Operative Findings"
            value={form.operativeFindings}
            onChange={(e) => handleChange('operativeFindings', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Procedure"
            value={form.procedure}
            onChange={(e) => handleChange('procedure', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Entry"
            value={form.entry}
            onChange={(e) => handleChange('entry', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Uterus"
            value={form.uterus}
            onChange={(e) => handleChange('uterus', e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Endometrial Thickness"
            value={form.endometrialThickness}
            onChange={(e) =>
              handleChange('endometrialThickness', e.target.value)
            }
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Abnormality"
            value={form.abnormality}
            onChange={(e) => handleChange('abnormality', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Intra Operation Complication"
            value={form.intraopComplications}
            onChange={(e) =>
              handleChange('intraopComplications', e.target.value)
            }
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Post Operation Course"
            value={form.postopCourse}
            onChange={(e) => handleChange('postopCourse', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Review On"
            value={form.reviewOn}
            onChange={(val) => handleChange('reviewOn', val)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            label="Discharge Medication"
            value={form.dischargeMedications}
            onChange={(e) =>
              handleChange('dischargeMedications', e.target.value)
            }
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            freeSolo
            options={EXPERT_OPTIONS}
            value={form.expertConsultant}
            inputValue={form.expertConsultant}
            onChange={(_, val) => handleChange('expertConsultant', val || '')}
            onInputChange={(_, val) => handleChange('expertConsultant', val)}
            renderInput={(params) => (
              <TextField {...params} label="Consultant Name" fullWidth />
            )}
          />
        </Grid>
      </Grid>

      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Reference Images
        </Typography>
        <Button
          variant="outlined"
          component="label"
          startIcon={<ImageIcon />}
          disabled={!onImageUpload || isUploading}
          fullWidth
        >
          {isUploading ? 'Uploading...' : 'Upload Images'}
          <input
            type="file"
            hidden
            multiple
            accept="image/*"
            onChange={handleFileUpload}
          />
        </Button>
        {uploadedImages.length > 0 && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {uploadedImages.map((image, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={image.id || `${image.imageUrl}-${index}`}
              >
                <Paper elevation={2} sx={{ position: 'relative', p: 1 }}>
                  <Box
                    component="img"
                    src={image.imageUrl}
                    alt={`Reference ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: 160,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    disabled={deletingImageIndex === index}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'white',
                    }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Box
        mt={3}
        display="flex"
        gap={2}
        justifyContent="flex-end"
        flexWrap="wrap"
      >
        <Button variant="outlined" color="error" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          Print
        </Button>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
      </Box>
    </Box>
  )
}

export default HysteroLapOperationNotesForm
