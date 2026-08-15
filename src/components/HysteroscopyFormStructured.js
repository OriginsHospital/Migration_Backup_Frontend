import React, { useState, useEffect } from 'react'
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
  Chip,
  Autocomplete,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import ImageIcon from '@mui/icons-material/Image'

// Constants
const BRANCH_OPTIONS = ['Khammam', 'Hanmkonda', 'Hyderabad', 'Sathupalli']
const GYNAECOLOGIST_OPTIONS = [
  'Dr. K. Jhansi Rani',
  'Dr. P. Sravani',
  'Dr. S. Swetha',
  'Dr. Annapurna',
  'Dr. Sneha',
  'Dr. D. Teja',
]
const STAFF_NURSE_OPTIONS = [
  'Ashwini Gorige',
  'Suhasini Muddemari',
  'Shruthi Macherla',
  'Prabhavathi Vadde',
]
const ANESTHETIST_OPTIONS = ['Dr. Athyun', 'Dr. Karthik']
const OT_ASSISTANT_OPTIONS = ['Rama Krishna']
const PROCEDURE_OPTIONS = [
  'DHL + B/L tubal DE-LINKING',
  'DHL + HYSTEROSCOPIC SEPTAL RESECTION',
  'DIAGNOSTIC HYSTEROLAPROSCOPY',
  'DIAGNOSTIC HYSTEROSCOPY',
  'HYSTEROSCOPIC POLYPECTOMY',
]
const INDICATION_OPTIONS = [
  'Sub septate / Bicornate uterus',
  'Sub septate Uterus',
  'Endometrial Polyp',
  'Primary infertility',
  'Primary infertility with 1 failed IVF',
  'Primary infertility with B/L chocolate cysts',
  'Primary infertility with B/L tubal block',
  'Primary infertility with B/L HSX',
  'Primary infertility with Fibroid',
  'Primary infertility with Hypomenorrhea',
  'Primary infertility with Low Ovarian Reserve with multiple fibroids',
  'Primary infertility with Multiple Fibroids',
  'Secondary infertility with B/L tubal block',
  'Secondary infertility',
]
const DISTENTION_MEDIUM_OPTIONS = ['Normal Saline', 'Glycine']

function HysteroscopyFormStructured({
  visitId,
  patientId,
  initialData = null,
  onSave,
  onPrint,
  onCancel,
  onImageUpload,
}) {
  const [formData, setFormData] = useState({
    branchLocation: '',
    clinicalDiagnosis: '',
    lmpDate: null,
    dayOfCycle: '',
    admissionDate: null,
    procedureDate: null,
    dischargeDate: null,
    gynaecologistName: '',
    staffNurseName: '',
    anesthetistName: '',
    otAssistantName: '',
    procedure: '',
    indications: [],
    chiefComplaints: '',
    intraOpFindings: '',
    distentionMedium: 'Normal Saline',
    courseInHospital: '',
    postOpInstructions: '',
    followUp: '',
    imageUrls: [],
  })

  const [errors, setErrors] = useState({})
  const [uploadedImages, setUploadedImages] = useState([])

  useEffect(() => {
    if (initialData) {
      setFormData({
        branchLocation: initialData.hospitalBranch || '',
        clinicalDiagnosis: initialData.clinicalDiagnosis || '',
        lmpDate: initialData.lmp ? dayjs(initialData.lmp) : null,
        dayOfCycle: initialData.dayOfCycle || '',
        admissionDate: initialData.admissionDate
          ? dayjs(initialData.admissionDate)
          : null,
        procedureDate: initialData.procedureDate
          ? dayjs(initialData.procedureDate)
          : null,
        dischargeDate: initialData.dischargeDate
          ? dayjs(initialData.dischargeDate)
          : null,
        gynaecologistName: initialData.gynecologist || '',
        staffNurseName: initialData.assistant || '',
        anesthetistName: initialData.anesthetist || '',
        otAssistantName: initialData.otAssistant || '',
        procedure: initialData.procedureType || '',
        indications:
          typeof initialData.diagnosis === 'string'
            ? initialData.diagnosis
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
            : Array.isArray(initialData.diagnosis)
              ? initialData.diagnosis
              : typeof initialData.indications === 'string'
                ? JSON.parse(initialData.indications || '[]')
                : initialData.indications || [],
        chiefComplaints: initialData.entry || initialData.chiefComplaints || '',
        intraOpFindings:
          initialData.operativeFindings || initialData.intraOpFindings || '',
        distentionMedium: initialData.distensionMedia || 'Normal Saline',
        courseInHospital:
          initialData.postopCourse || initialData.courseInHospital || '',
        postOpInstructions:
          initialData.dischargeMedications ||
          initialData.postOpInstructions ||
          '',
        followUp: initialData.consultantName || initialData.followUp || '',
        imageUrls: Array.isArray(initialData.referenceImages)
          ? initialData.referenceImages
              .map((image) => image?.imageUrl)
              .filter(Boolean)
          : typeof initialData.imageUrls === 'string'
            ? JSON.parse(initialData.imageUrls || '[]')
            : initialData.imageUrls || [],
      })
      setUploadedImages(
        Array.isArray(initialData.referenceImages)
          ? initialData.referenceImages
              .map((image) => image?.imageUrl)
              .filter(Boolean)
          : typeof initialData.imageUrls === 'string'
            ? JSON.parse(initialData.imageUrls || '[]')
            : initialData.imageUrls || [],
      )
    }
  }, [initialData])

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleDateChange = (name, value) => {
    handleChange(name, value)
    // Validate discharge date >= procedure date
    if (name === 'dischargeDate' && formData.procedureDate) {
      if (value && dayjs(value).isBefore(dayjs(formData.procedureDate))) {
        setErrors((prev) => ({
          ...prev,
          dischargeDate: 'Discharge Date must be >= Procedure Date',
        }))
      }
    }
    if (name === 'procedureDate' && formData.dischargeDate) {
      if (
        formData.dischargeDate &&
        dayjs(formData.dischargeDate).isBefore(dayjs(value))
      ) {
        setErrors((prev) => ({
          ...prev,
          dischargeDate: null,
        }))
      }
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    try {
      // Upload files and get URLs
      const uploadedUrls = []
      for (const file of files) {
        if (onImageUpload) {
          const url = await onImageUpload(file, visitId)
          uploadedUrls.push(url)
        } else {
          // Fallback: create object URL for preview
          uploadedUrls.push(URL.createObjectURL(file))
        }
      }
      const newUrls = [...formData.imageUrls, ...uploadedUrls]
      handleChange('imageUrls', newUrls)
      setUploadedImages(newUrls)
    } catch (error) {
      console.error('Error uploading images:', error)
    }
  }

  const handleRemoveImage = (index) => {
    const newUrls = formData.imageUrls.filter((_, i) => i !== index)
    handleChange('imageUrls', newUrls)
    setUploadedImages(newUrls)
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.branchLocation) newErrors.branchLocation = 'Required'
    if (!formData.admissionDate) newErrors.admissionDate = 'Required'
    if (!formData.procedureDate) newErrors.procedureDate = 'Required'
    if (!formData.dischargeDate) newErrors.dischargeDate = 'Required'
    if (!formData.gynaecologistName) newErrors.gynaecologistName = 'Required'
    if (!formData.staffNurseName) newErrors.staffNurseName = 'Required'
    if (!formData.anesthetistName) newErrors.anesthetistName = 'Required'
    if (!formData.otAssistantName) newErrors.otAssistantName = 'Required'
    if (!formData.procedure) newErrors.procedure = 'Required'
    if (formData.dischargeDate && formData.procedureDate) {
      if (
        dayjs(formData.dischargeDate).isBefore(dayjs(formData.procedureDate))
      ) {
        newErrors.dischargeDate = 'Discharge Date must be >= Procedure Date'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveClick = () => {
    if (!validate()) {
      return
    }

    const payload = {
      visitId,
      patientId,
      branchLocation: formData.branchLocation,
      clinicalDiagnosis: formData.clinicalDiagnosis,
      lmpDate: formData.lmpDate ? formData.lmpDate.toISOString() : null,
      dayOfCycle: formData.dayOfCycle,
      admissionDate: formData.admissionDate.toISOString(),
      procedureDate: formData.procedureDate.toISOString(),
      dischargeDate: formData.dischargeDate.toISOString(),
      gynaecologistName: formData.gynaecologistName,
      staffNurseName: formData.staffNurseName,
      anesthetistName: formData.anesthetistName,
      otAssistantName: formData.otAssistantName,
      procedure: formData.procedure,
      indications: formData.indications,
      chiefComplaints: formData.chiefComplaints,
      intraOpFindings: formData.intraOpFindings,
      distentionMedium: formData.distentionMedium,
      courseInHospital: formData.courseInHospital,
      postOpInstructions: formData.postOpInstructions,
      followUp: formData.followUp,
      imageUrls: formData.imageUrls,
    }

    if (onSave) {
      onSave(payload)
    }
  }

  const handlePrintClick = () => {
    if (onPrint) {
      onPrint(formData)
    }
  }

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        HYSTEROSCOPY OPERATION NOTES
      </Typography>

      {/* A. Admission & Patient Details */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">A. Admission & Patient Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required error={!!errors.branchLocation}>
                <InputLabel>Branch Location</InputLabel>
                <Select
                  value={formData.branchLocation}
                  label="Branch Location"
                  onChange={(e) =>
                    handleChange('branchLocation', e.target.value)
                  }
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
              <TextField
                label="Clinical Diagnosis"
                value={formData.clinicalDiagnosis}
                onChange={(e) =>
                  handleChange('clinicalDiagnosis', e.target.value)
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="LMP Date"
                value={formData.lmpDate}
                onChange={(val) => handleChange('lmpDate', val)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Day of Cycle"
                value={formData.dayOfCycle}
                onChange={(e) => handleChange('dayOfCycle', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Admission Date"
                value={formData.admissionDate}
                onChange={(val) => handleDateChange('admissionDate', val)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.admissionDate,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Procedure Date"
                value={formData.procedureDate}
                onChange={(val) => handleDateChange('procedureDate', val)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.procedureDate,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Discharge Date"
                value={formData.dischargeDate}
                onChange={(val) => handleDateChange('dischargeDate', val)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.dischargeDate,
                    helperText: errors.dischargeDate,
                  },
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* B. Medical Team */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">B. Medical Team</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={GYNAECOLOGIST_OPTIONS}
                value={formData.gynaecologistName}
                onChange={(e, newValue) =>
                  handleChange('gynaecologistName', newValue || '')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Gynaecologist Name"
                    required
                    error={!!errors.gynaecologistName}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={STAFF_NURSE_OPTIONS}
                value={formData.staffNurseName}
                onChange={(e, newValue) =>
                  handleChange('staffNurseName', newValue || '')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Staff Nurse Name"
                    required
                    error={!!errors.staffNurseName}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={ANESTHETIST_OPTIONS}
                value={formData.anesthetistName}
                onChange={(e, newValue) =>
                  handleChange('anesthetistName', newValue || '')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Anesthetist Name"
                    required
                    error={!!errors.anesthetistName}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={OT_ASSISTANT_OPTIONS}
                value={formData.otAssistantName}
                onChange={(e, newValue) =>
                  handleChange('otAssistantName', newValue || '')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="OT Assistant Name"
                    required
                    error={!!errors.otAssistantName}
                  />
                )}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* C. Procedure Details */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">C. Procedure Details</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!errors.procedure}>
                <InputLabel>Procedure</InputLabel>
                <Select
                  value={formData.procedure}
                  label="Procedure"
                  onChange={(e) => handleChange('procedure', e.target.value)}
                >
                  {PROCEDURE_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={INDICATION_OPTIONS}
                value={formData.indications}
                onChange={(e, newValue) =>
                  handleChange('indications', newValue)
                }
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      key={option}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Indications"
                    placeholder="Select indications"
                  />
                )}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* D. Chief Complaints */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">D. Chief Complaints</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Chief Complaints"
            value={formData.chiefComplaints}
            onChange={(e) => handleChange('chiefComplaints', e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </AccordionDetails>
      </Accordion>

      {/* E. Intra OP Findings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">E. Intra OP Findings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Intra OP Findings"
                value={formData.intraOpFindings}
                onChange={(e) =>
                  handleChange('intraOpFindings', e.target.value)
                }
                fullWidth
                multiline
                minRows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Distention Medium</InputLabel>
                <Select
                  value={formData.distentionMedium}
                  label="Distention Medium"
                  onChange={(e) =>
                    handleChange('distentionMedium', e.target.value)
                  }
                >
                  {DISTENTION_MEDIUM_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* F. Course in Hospital */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">F. Course in Hospital</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Course in Hospital"
            value={formData.courseInHospital}
            onChange={(e) => handleChange('courseInHospital', e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </AccordionDetails>
      </Accordion>

      {/* G. Post OP Instructions */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">G. Post OP Instructions</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Post OP Instructions"
            value={formData.postOpInstructions}
            onChange={(e) => handleChange('postOpInstructions', e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </AccordionDetails>
      </Accordion>

      {/* H. Follow-up */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">H. Follow-up</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Follow-up"
            value={formData.followUp}
            onChange={(e) => handleChange('followUp', e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </AccordionDetails>
      </Accordion>

      {/* I. Image Uploads */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">I. Image Uploads</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<ImageIcon />}
                fullWidth
              >
                Upload Images
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </Button>
            </Grid>
            {uploadedImages.length > 0 && (
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  {uploadedImages.map((url, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Paper elevation={2} sx={{ position: 'relative', p: 1 }}>
                        <Box
                          component="img"
                          src={url}
                          alt={`Uploaded ${index + 1}`}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor: 'white',
                          }}
                          onClick={() => handleRemoveImage(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Action Buttons */}
      <Box mt={4} display="flex" gap={2} justifyContent="flex-end">
        <Button variant="outlined" color="error" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="outlined" color="secondary" onClick={handlePrintClick}>
          Print
        </Button>
        <Button variant="contained" color="primary" onClick={handleSaveClick}>
          Save
        </Button>
      </Box>
    </Box>
  )
}

export default HysteroscopyFormStructured
