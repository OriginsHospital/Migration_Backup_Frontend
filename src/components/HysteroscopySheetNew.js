import React, { useState } from 'react'
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
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'

function HysteroscopySheetNew({ onSave, onPrint, onCancel }) {
  // Sample dropdown values
  const formTypeOptions = ['Hysteroscopy', 'Laparoscopy', 'HysteroLap']
  const procedureTypeOptions = [
    'Diagnostic Hysteroscopy',
    'Diagnostic Hysteroscopy + Polypectomy',
    'Diagnostic Hysteroscopy + Septal Resection',
    'Diagnostic Hysteroscopy + Submucous Fibroid Resection',
    'DHL',
    'DHL + CPT',
    'DHL + Tubal Delinking',
    'Lap Tubal Delinking',
    'Lap Adhesiolysis',
    'Lap Myomectomy',
    'Lap Isthmocle Repair',
    'Hysteroscopic Isthmocle Repair',
  ]
  const hospitalBranchOptions = ['Main Branch', 'Branch 2']
  const gynecologistOptions = ['Dr. A', 'Dr. B']
  const assistantOptions = ['Nurse X', 'Nurse Y']
  const anesthesiaTypeOptions = ['General', 'Spinal', 'Local']
  const anesthetistOptions = ['Dr. C', 'Dr. D']
  const otAssistantOptions = ['OT Nurse 1', 'OT Nurse 2']
  const consultantNameOptions = ['Dr. E', 'Dr. F']

  const distensionMediaOptions = [
    { value: 'Glycine', label: 'Glycine' },
    { value: 'NS', label: 'NS' },
  ]

  const [form, setForm] = useState({
    formType: '',
    clinicalDiagnosis: '',
    lmp: null,
    dayOfCycle: '',
    admissionDate: null,
    procedureDate: null,
    dischargeDate: null,
    procedureType: '',
    hospitalBranch: '',
    gynecologist: '',
    assistant: '',
    anesthesiaType: '',
    anesthetist: '',
    otAssistant: '',
    diagnosis: '',
    distensionMedia: '',
    entry: '',
    uterus: '',
    endometrialThickness: '',
    operativeFindings: '',
    intraopComplications: '',
    postopCourse: '',
    reviewOn: null,
    dischargeMedications: '',
    consultantName: '',
    uploadedImages: [],
  })

  const handleChange = e => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = e => {
    setForm(prev => ({
      ...prev,
      uploadedImages: Array.from(e.target.files),
    }))
  }

  const handleSave = () => {
    // Prepare payload for save
    const payload = {
      ...form,
      lmp: form.lmp ? dayjs(form.lmp).format('YYYY-MM-DD') : '',
      admissionDate: form.admissionDate
        ? dayjs(form.admissionDate).format('YYYY-MM-DD')
        : '',
      procedureDate: form.procedureDate
        ? dayjs(form.procedureDate).format('YYYY-MM-DD')
        : '',
      dischargeDate: form.dischargeDate
        ? dayjs(form.dischargeDate).format('YYYY-MM-DD')
        : '',
      reviewOn: form.reviewOn ? dayjs(form.reviewOn).format('YYYY-MM-DD') : '',
      endometrialThickness: form.endometrialThickness
        ? Number(form.endometrialThickness)
        : '',
      dayOfCycle: form.dayOfCycle ? Number(form.dayOfCycle) : '',
      uploadedImages: form.uploadedImages.map(f => f.name),
    }
    if (onSave) onSave(payload)
    else alert(JSON.stringify(payload, null, 2))
  }

  return (
    <Box p={3}>
      {/* <Typography variant="h5" gutterBottom>
                Hystero/Lap Form
            </Typography> */}
      <Grid container spacing={2}>
        {/* Form Type */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Form Type</InputLabel>
            <Select
              name="formType"
              value={form.formType}
              label="Form Type"
              onChange={handleChange}
            >
              {formTypeOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Clinical Diagnosis */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Clinical Diagnosis"
            name="clinicalDiagnosis"
            value={form.clinicalDiagnosis}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        {/* LMP */}
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="LMP"
            value={form.lmp}
            onChange={val => handleDateChange('lmp', val)}
            slotProps={{ textField: { fullWidth: true, name: 'lmp' } }}
          />
        </Grid>
        {/* Day of Cycle */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Day of Cycle"
            name="dayOfCycle"
            type="number"
            value={form.dayOfCycle}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        {/* Admission Date */}
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Admission Date"
            value={form.admissionDate}
            onChange={val => handleDateChange('admissionDate', val)}
            slotProps={{
              textField: { fullWidth: true, name: 'admissionDate' },
            }}
          />
        </Grid>
        {/* Procedure Date */}
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Procedure Date"
            value={form.procedureDate}
            onChange={val => handleDateChange('procedureDate', val)}
            slotProps={{
              textField: { fullWidth: true, name: 'procedureDate' },
            }}
          />
        </Grid>
        {/* Discharge Date */}
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Discharge Date"
            value={form.dischargeDate}
            onChange={val => handleDateChange('dischargeDate', val)}
            slotProps={{
              textField: { fullWidth: true, name: 'dischargeDate' },
            }}
          />
        </Grid>
        {/* Type of Procedure */}
        <Grid item xs={12} sm={8}>
          <FormControl fullWidth>
            <InputLabel>Type of Procedure</InputLabel>
            <Select
              name="procedureType"
              value={form.procedureType}
              label="Type of Procedure"
              onChange={handleChange}
            >
              {procedureTypeOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Hospital/Branch */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Hospital/Branch</InputLabel>
            <Select
              name="hospitalBranch"
              value={form.hospitalBranch}
              label="Hospital/Branch"
              onChange={handleChange}
            >
              {hospitalBranchOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Gynecologist */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Gynecologist</InputLabel>
            <Select
              name="gynecologist"
              value={form.gynecologist}
              label="Gynecologist"
              onChange={handleChange}
            >
              {gynecologistOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Assistant */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Assistant</InputLabel>
            <Select
              name="assistant"
              value={form.assistant}
              label="Assistant"
              onChange={handleChange}
            >
              {assistantOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Type of Anesthesia */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Type of Anesthesia</InputLabel>
            <Select
              name="anesthesiaType"
              value={form.anesthesiaType}
              label="Type of Anesthesia"
              onChange={handleChange}
            >
              {anesthesiaTypeOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Anesthetist */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Anesthetist</InputLabel>
            <Select
              name="anesthetist"
              value={form.anesthetist}
              label="Anesthetist"
              onChange={handleChange}
            >
              {anesthetistOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* OT Assistant */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>OT Assistant</InputLabel>
            <Select
              name="otAssistant"
              value={form.otAssistant}
              label="OT Assistant"
              onChange={handleChange}
            >
              {otAssistantOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Diagnosis */}
        <Grid item xs={12} sm={8}>
          <TextField
            label="Diagnosis"
            name="diagnosis"
            value={form.diagnosis}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        {/* Distension Media */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Distension Media</InputLabel>
            <Select
              name="distensionMedia"
              value={form.distensionMedia}
              label="Distension Media"
              onChange={handleChange}
            >
              {distensionMediaOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Entry */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Entry"
            name="entry"
            value={form.entry}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        {/* Uterus */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Uterus"
            name="uterus"
            value={form.uterus}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        {/* Endometrial Thickness */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Endometrial Thickness (mm)"
            name="endometrialThickness"
            type="number"
            value={form.endometrialThickness}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        {/* Operative Findings */}
        <Grid item xs={12} sm={8}>
          <TextField
            label="Operative Findings"
            name="operativeFindings"
            value={form.operativeFindings}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        {/* Intraop Complications */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Intraop Complications"
            name="intraopComplications"
            value={form.intraopComplications}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        {/* Postop Course */}
        <Grid item xs={12} sm={8}>
          <TextField
            label="Postop Course"
            name="postopCourse"
            value={form.postopCourse}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        {/* Review On */}
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Review On"
            value={form.reviewOn}
            onChange={val => handleDateChange('reviewOn', val)}
            slotProps={{ textField: { fullWidth: true, name: 'reviewOn' } }}
          />
        </Grid>
        {/* Discharge Medications */}
        <Grid item xs={12} sm={8}>
          <TextField
            label="Discharge Medications"
            name="dischargeMedications"
            value={form.dischargeMedications}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
          />
        </Grid>
        {/* Consultant Name */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Consultant Name</InputLabel>
            <Select
              name="consultantName"
              value={form.consultantName}
              label="Consultant Name"
              onChange={handleChange}
            >
              {consultantNameOptions.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* Upload Images */}
        <Grid item xs={12} sm={8}>
          <Button variant="outlined" component="label" fullWidth>
            Upload Images
            <input type="file" hidden multiple onChange={handleFileChange} />
          </Button>
          {form.uploadedImages.length > 0 && (
            <Box mt={1}>
              {form.uploadedImages.map((file, idx) => (
                <Typography key={idx} variant="body2">
                  {file.name}
                </Typography>
              ))}
            </Box>
          )}
        </Grid>
      </Grid>
      {/* Action Buttons */}
      <Box mt={4} display="flex" gap={2}>
        <Button variant="contained" color="primary" onClick={handleSave}>
          Save
        </Button>
        <Button variant="outlined" color="secondary" onClick={onPrint}>
          Print
        </Button>
        <Button variant="outlined" color="error" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  )
}

export default HysteroscopySheetNew
