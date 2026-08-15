import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Checkbox,
  Autocomplete,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'

function AddTaskModal({
  open,
  onClose,
  onSuccess,
  task,
  staffList,
  createMutation,
  updateMutation,
}) {
  const [formData, setFormData] = useState({
    taskName: '',
    description: '',
    remarks: '',
    priority: 'MEDIUM',
    startDate: null,
    endDate: null,
    alertEnabled: false,
    alertDate: null,
    assignedTo: null,
    assignedToMultiple: [],
    department: '',
    category: '',
  })
  const [allowMultipleAssignees, setAllowMultipleAssignees] = useState(false)
  const [errors, setErrors] = useState({})

  // Predefined departments (same as tickets)
  const departments = [
    'Nursing',
    'Pharmacy',
    'Administration',
    'IPD',
    'OPD',
    'Laboratory',
    'Radiology',
    'IT Support',
    'Housekeeping',
    'Security',
    'Other',
  ]

  // Predefined categories (same as tickets)
  const categories = [
    'Maintenance',
    'Equipment',
    'Supplies',
    'Follow-up',
    'Cleaning',
    'Security',
    'IT Support',
    'Other',
  ]

  useEffect(() => {
    if (task) {
      const assignedToValue = task.assignedTo || task.assigned_to || null
      const isMultiple = Array.isArray(assignedToValue)
      setFormData({
        taskName: task.taskName || task.task_name || '',
        description: task.description || '',
        remarks: task.remarks || '',
        status: task.status || 'Pending',
        startDate:
          task.startDate || task.start_date
            ? dayjs(task.startDate || task.start_date)
            : null,
        endDate:
          task.endDate || task.end_date
            ? dayjs(task.endDate || task.end_date)
            : null,
        alertEnabled: task.alertEnabled || task.alert_enabled || false,
        alertDate:
          task.alertDate || task.alert_date
            ? dayjs(task.alertDate || task.alert_date)
            : null,
        assignedTo: isMultiple ? null : assignedToValue,
        assignedToMultiple: isMultiple ? assignedToValue : [],
        department: task.department || '',
        category: task.category || '',
      })
      setAllowMultipleAssignees(isMultiple)
    } else {
      setFormData({
        taskName: '',
        description: '',
        remarks: '',
        priority: 'MEDIUM',
        startDate: null,
        endDate: null,
        alertEnabled: false,
        alertDate: null,
        assignedTo: null,
        assignedToMultiple: [],
        department: '',
        category: '',
      })
      setAllowMultipleAssignees(false)
    }
    setErrors({})
  }, [task, open])

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.taskName.trim()) {
      newErrors.taskName = 'Task name is required'
    }
    // Note: Assignee validation is optional for tasks, but we can add it if needed
    // if (allowMultipleAssignees) {
    //   if (!formData.assignedToMultiple || formData.assignedToMultiple.length === 0) {
    //     newErrors.assignedTo = 'Please assign the task to at least one staff member'
    //   }
    // } else {
    //   // Assignee is optional for tasks
    // }
    return newErrors
  }

  const handleSubmit = () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const payload = {
      taskName: formData.taskName,
      description: formData.description || null,
      remarks: formData.remarks || null,
      priority: formData.priority,
      startDate: formData.startDate
        ? formData.startDate.format('YYYY-MM-DD')
        : null,
      endDate: formData.endDate ? formData.endDate.format('YYYY-MM-DD') : null,
      alertEnabled: formData.alertEnabled,
      alertDate: formData.alertDate ? formData.alertDate.toISOString() : null,
      assignedTo: allowMultipleAssignees
        ? formData.assignedToMultiple.length > 0
          ? formData.assignedToMultiple
          : null
        : formData.assignedTo || null,
      department: formData.department || null,
      category: formData.category || null,
    }

    if (task) {
      payload.taskId = task.id
      updateMutation.mutate(payload, {
        onSuccess: () => {
          onSuccess()
          onClose()
        },
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onSuccess()
          onClose()
        },
      })
    }
  }

  // Common styles for consistent appearance
  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'text.primary',
    mb: 0.75,
    display: 'block',
  }

  const inputStyle = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '6px',
      fontSize: '0.875rem',
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.87)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'primary.main',
        borderWidth: '2px',
      },
    },
    '& .MuiInputBase-input::placeholder': {
      color: 'rgba(0, 0, 0, 0.4)',
      opacity: 1,
    },
  }

  const selectStyle = {
    ...inputStyle,
    '& .MuiSelect-select': {
      fontSize: '0.875rem',
    },
  }

  const autocompleteStyle = {
    ...inputStyle,
    '& .MuiAutocomplete-inputRoot': {
      fontSize: '0.875rem',
    },
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          width: '600px',
          maxWidth: '600px',
          height: '85vh',
          maxHeight: '85vh',
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 2,
          pr: 1,
          pt: 2.5,
          px: 3,
          flexShrink: 0,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          pt: 2.5,
          pb: 0,
          px: 3,
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          id="create-task-form"
        >
          <Grid container spacing={2.5}>
            {/* Task Name - Full Width */}
            <Grid item xs={12}>
              <Typography sx={labelStyle}>
                Task Name <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter a brief summary..."
                value={formData.taskName}
                onChange={(e) => handleChange('taskName', e.target.value)}
                error={!!errors.taskName}
                helperText={errors.taskName}
                multiline
                rows={2}
                size="small"
                sx={inputStyle}
              />
            </Grid>

            {/* Description - Full Width */}
            <Grid item xs={12}>
              <Typography sx={labelStyle}>Remarks</Typography>
              <TextField
                fullWidth
                placeholder="Describe the task in detail..."
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                multiline
                rows={3}
                size="small"
                sx={inputStyle}
              />
            </Grid>

            {/* Assign To / Priority - 2 Column Grid */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={allowMultipleAssignees}
                    onChange={(e) => {
                      setAllowMultipleAssignees(e.target.checked)
                      // Reset assignee fields when toggling
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          assignedTo: null,
                          assignedToMultiple: [],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          assignedTo: null,
                          assignedToMultiple: [],
                        })
                      }
                      if (errors.assignedTo) {
                        setErrors({ ...errors, assignedTo: '' })
                      }
                    }}
                    size="small"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Assign to multiple employees
                  </Typography>
                }
                sx={{
                  m: 0,
                  mb: 0.75,
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              />
              <Typography sx={labelStyle}>Assign To</Typography>
              {allowMultipleAssignees ? (
                <Autocomplete
                  multiple
                  size="small"
                  options={staffList || []}
                  getOptionLabel={(option) => option.fullName || ''}
                  getOptionKey={(option) => option.id || option.fullName}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={
                    staffList?.filter((staff) =>
                      formData.assignedToMultiple.includes(staff.id),
                    ) || []
                  }
                  onChange={(e, newValue) => {
                    setFormData({
                      ...formData,
                      assignedToMultiple: newValue.map((staff) => staff.id),
                    })
                    if (errors.assignedTo) {
                      setErrors({ ...errors, assignedTo: '' })
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Select staff members"
                      error={!!errors.assignedTo}
                      helperText={errors.assignedTo}
                      sx={autocompleteStyle}
                    />
                  )}
                />
              ) : (
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.assignedTo || ''}
                    onChange={(e) => handleChange('assignedTo', e.target.value)}
                    displayEmpty
                    sx={selectStyle}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {staffList.map((staff) => (
                      <MenuItem key={staff.id} value={staff.id}>
                        {staff.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Box sx={{ width: '20px', height: '20px' }} />}
                label={
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      visibility: 'hidden',
                    }}
                  >
                    Assign to multiple employees
                  </Typography>
                }
                sx={{
                  m: 0,
                  mb: 0.75,
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              />
              <Typography sx={labelStyle}>Priority</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  displayEmpty
                  sx={selectStyle}
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Department / Category - 2 Column Grid */}
            <Grid item xs={12} sm={6}>
              <Typography sx={labelStyle}>Department</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  displayEmpty
                  sx={selectStyle}
                >
                  <MenuItem value="">Select a department</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={labelStyle}>Category</Typography>
              <Autocomplete
                freeSolo
                size="small"
                options={categories}
                value={formData.category}
                onChange={(e, newValue) =>
                  handleChange('category', newValue || '')
                }
                onInputChange={(e, newInputValue) =>
                  handleChange('category', newInputValue)
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select or enter category"
                    sx={autocompleteStyle}
                  />
                )}
              />
            </Grid>

            {/* Start Date / End Date - 2 Column Grid */}
            <Grid item xs={12} sm={6}>
              <Typography sx={labelStyle}>Start Date</Typography>
              <DatePicker
                value={formData.startDate}
                onChange={(value) => handleChange('startDate', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select start date',
                    sx: inputStyle,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={labelStyle}>End Date</Typography>
              <DatePicker
                value={formData.endDate}
                onChange={(value) => handleChange('endDate', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small',
                    placeholder: 'Select end date',
                    sx: inputStyle,
                  },
                }}
              />
            </Grid>

            {/* Set Alert - Full Width */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', pb: 0.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.alertEnabled}
                      onChange={(e) =>
                        handleChange('alertEnabled', e.target.checked)
                      }
                      size="small"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      Set Alert
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
            </Grid>

            {/* Alert Date & Time - Conditional, Full Width */}
            {formData.alertEnabled && (
              <Grid item xs={12}>
                <Typography sx={labelStyle}>Alert Date & Time</Typography>
                <DatePicker
                  value={formData.alertDate}
                  onChange={(value) => handleChange('alertDate', value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'Select alert date & time',
                      sx: { ...inputStyle, maxWidth: '400px' },
                    },
                  }}
                />
              </Grid>
            )}
          </Grid>
        </form>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2.5,
          pt: 2,
          pb: 2.5,
          px: 3,
          gap: 1.5,
          justifyContent: 'flex-end',
          flexShrink: 0,
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          size="medium"
          sx={{
            minWidth: 100,
            textTransform: 'none',
            fontSize: '0.875rem',
            borderRadius: '6px',
            borderColor: 'rgba(0, 0, 0, 0.23)',
            '&:hover': {
              borderColor: 'rgba(0, 0, 0, 0.87)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="create-task-form"
          variant="contained"
          size="medium"
          disabled={createMutation.isPending || updateMutation.isPending}
          startIcon={
            createMutation.isPending || updateMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : null
          }
          sx={{
            bgcolor: '#06aee9',
            '&:hover': { bgcolor: '#0599d1' },
            minWidth: 120,
            textTransform: 'none',
            fontSize: '0.875rem',
            borderRadius: '6px',
            fontWeight: 500,
          }}
        >
          {task ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTaskModal
