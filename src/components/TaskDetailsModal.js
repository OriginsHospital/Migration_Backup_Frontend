import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Divider,
  Grid,
  Avatar,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  TextField,
  CircularProgress,
} from '@mui/material'
import { Close as CloseIcon, Comment as CommentIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  getTaskDetails,
  updateTask,
  updateTaskStatus,
  createTaskComment,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers'

// Priority badge colors
const getPriorityColor = (priority) => {
  switch (priority) {
    case 'HIGH':
      return { bg: '#fee2e2', text: '#dc2626', border: '#fecaca' }
    case 'MEDIUM':
      return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }
    case 'LOW':
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

// Status badge colors
const getStatusColor = (status) => {
  switch (status) {
    case 'OPEN':
    case 'Pending':
      return { bg: '#ffffff', text: '#374151', border: '#d1d5db' }
    case 'IN_PROGRESS':
    case 'In Progress':
      return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }
    case 'COMPLETED':
    case 'Completed':
      return { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' }
    case 'Cancelled':
      return { bg: '#ffebee', text: '#c62828', border: '#f44336' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

function TaskDetailsModal({ open, onClose, taskId, onEdit, onStatusChange }) {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [currentStatus, setCurrentStatus] = useState(null)
  const [originalStatus, setOriginalStatus] = useState(null)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const [statusChangeRequiresComment, setStatusChangeRequiresComment] =
    useState(false)
  const [alertEnabled, setAlertEnabled] = useState(false)
  const [alertDate, setAlertDate] = useState(null)
  const [originalAlertEnabled, setOriginalAlertEnabled] = useState(false)
  const [originalAlertDate, setOriginalAlertDate] = useState(null)

  // Fetch task details
  const {
    data: taskData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['taskDetails', taskId],
    queryFn: async () => {
      const response = await getTaskDetails(user?.accessToken, taskId)
      console.log('Task details response:', response)
      return response
    },
    enabled: !!taskId && !!user?.accessToken && open,
  })

  const task = taskData?.data || taskData

  // Normalize field names (handle both snake_case and camelCase)
  const normalizedTask = task
    ? {
        ...task,
        taskCode: task.taskCode || task.task_code,
        taskName: task.taskName || task.task_name,
        description: task.description || task.description,
        remarks: task.remarks || task.remarks,
        status: task.status || task.status,
        priority: task.priority || task.priority || 'MEDIUM',
        department: task.department || task.department,
        category: task.category || task.category,
        startDate: task.startDate || task.start_date,
        endDate: task.endDate || task.end_date,
        alertEnabled: task.alertEnabled || task.alert_enabled || false,
        alertDate: task.alertDate || task.alert_date || null,
        createdAt: task.createdAt || task.created_at,
        updatedAt: task.updatedAt || task.updated_at,
        createdBy: task.createdBy || task.created_by,
        assignedTo: task.assignedTo || task.assigned_to,
      }
    : null

  // Parse JSON fields - handle both array and single object
  let assignedToArray = []
  if (normalizedTask?.assignedToDetails) {
    try {
      const parsed =
        typeof normalizedTask.assignedToDetails === 'string'
          ? JSON.parse(normalizedTask.assignedToDetails)
          : normalizedTask.assignedToDetails
      assignedToArray = Array.isArray(parsed)
        ? parsed
        : [parsed].filter(Boolean)
    } catch (e) {
      assignedToArray = []
    }
  }
  const assignedTo = assignedToArray.length > 0 ? assignedToArray[0] : {}
  const createdBy = normalizedTask?.createdByDetails
    ? typeof normalizedTask.createdByDetails === 'string'
      ? JSON.parse(normalizedTask.createdByDetails)
      : normalizedTask.createdByDetails
    : {}
  const comments = normalizedTask?.comments
    ? typeof normalizedTask.comments === 'string'
      ? JSON.parse(normalizedTask.comments)
      : Array.isArray(normalizedTask.comments)
        ? normalizedTask.comments
        : []
    : []

  const priorityColor = getPriorityColor(normalizedTask?.priority)
  // Use pending status for color if status change is pending, otherwise use current status
  const statusForColor = pendingStatusChange || normalizedTask?.status
  const statusColor = getStatusColor(statusForColor)

  // Track original status when modal opens and initialize alert fields
  React.useEffect(() => {
    if (normalizedTask?.status) {
      if (originalStatus === null) {
        setOriginalStatus(normalizedTask.status)
        setCurrentStatus(normalizedTask.status)
      }
    }
    // Initialize alert fields from task data
    if (normalizedTask) {
      const enabled = normalizedTask.alertEnabled || false
      const date = normalizedTask.alertDate
        ? dayjs(normalizedTask.alertDate)
        : null
      setAlertEnabled(enabled)
      setAlertDate(date)
      setOriginalAlertEnabled(enabled)
      setOriginalAlertDate(date)
    }
  }, [
    normalizedTask?.status,
    normalizedTask?.alertEnabled,
    normalizedTask?.alertDate,
    originalStatus,
  ])

  // Reset when modal closes
  React.useEffect(() => {
    if (!open) {
      setCommentText('')
      setCommentError('')
      setPendingStatusChange(null)
      setStatusChangeRequiresComment(false)
      setCurrentStatus(null)
      setOriginalStatus(null)
      setAlertEnabled(false)
      setAlertDate(null)
      setOriginalAlertEnabled(false)
      setOriginalAlertDate(null)
    }
  }, [open])

  // Check if user can comment (Assigned User, Manager, Admin, Global Admin)
  const canComment = () => {
    if (!normalizedTask || !user) return false
    const userRole = user?.roleDetails?.name?.toLowerCase() || ''
    const isAdmin = userRole === 'admin' || userRole === 'global admin'
    const isManager = userRole === 'manager'
    const isAssignedUser = normalizedTask.assignedTo === user?.id
    const isCreator = normalizedTask.createdBy === user?.id
    return isAdmin || isManager || isAssignedUser || isCreator
  }

  // Update status mutation (for when status is changed with comment)
  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      updateTaskStatus(user?.accessToken, taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['taskDetails', taskId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update task status')
    },
  })

  // Update alert mutation
  const updateAlertMutation = useMutation({
    mutationFn: (alertData) => {
      const payload = {
        taskId: normalizedTask.id || taskId,
        alertEnabled: alertData.alertEnabled,
        alertDate: alertData.alertDate
          ? alertData.alertDate.toISOString()
          : null,
      }
      return updateTask(user?.accessToken, payload)
    },
    onSuccess: () => {
      toast.success('Alert settings saved successfully!')
      setOriginalAlertEnabled(alertEnabled)
      setOriginalAlertDate(alertDate)
      queryClient.invalidateQueries({ queryKey: ['taskDetails', taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to save alert settings. Please try again.'
      toast.error(errorMessage)
    },
  })

  // Check if alert settings have changed
  const alertHasChanged = () => {
    const enabledChanged = alertEnabled !== originalAlertEnabled
    const dateChanged =
      (alertDate && !originalAlertDate) ||
      (!alertDate && originalAlertDate) ||
      (alertDate &&
        originalAlertDate &&
        !alertDate.isSame(originalAlertDate, 'day'))
    return enabledChanged || dateChanged
  }

  // Handle save alert
  const handleSaveAlert = () => {
    updateAlertMutation.mutate({
      alertEnabled,
      alertDate,
    })
  }

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (commentText) => {
      const currentTaskId = normalizedTask?.id || taskId
      if (!currentTaskId) {
        throw new Error('Task ID is missing')
      }
      return createTaskComment(user?.accessToken, {
        taskId: currentTaskId,
        commentText: commentText.trim(),
      })
    },
    onSuccess: () => {
      // If there's a pending status change, update it now
      if (pendingStatusChange && pendingStatusChange !== originalStatus) {
        updateStatusMutation.mutate(
          {
            taskId: normalizedTask.id || taskId,
            status: pendingStatusChange,
          },
          {
            onSuccess: () => {
              toast.success('Status updated and comment posted successfully!')
              // Reset everything
              setCommentText('')
              setCommentError('')
              setPendingStatusChange(null)
              setStatusChangeRequiresComment(false)
              setOriginalStatus(pendingStatusChange)
              setCurrentStatus(pendingStatusChange)
              queryClient.invalidateQueries({
                queryKey: ['taskDetails', taskId],
              })
              queryClient.invalidateQueries({ queryKey: ['tasks'] })
            },
            onError: () => {
              toast.error('Comment posted but status update failed')
            },
          },
        )
      } else {
        toast.success('Comment posted successfully!')
        setCommentText('')
        setCommentError('')
        queryClient.invalidateQueries({ queryKey: ['taskDetails', taskId] })
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
      }
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to post comment. Please try again.'
      setCommentError(errorMessage)
      toast.error(errorMessage)
    },
  })

  // Handle status dropdown change
  const handleStatusChange = (newStatus) => {
    // If status is same as original, no change needed
    if (newStatus === originalStatus) {
      setCurrentStatus(newStatus)
      setPendingStatusChange(null)
      setStatusChangeRequiresComment(false)
      return
    }

    // Status is being changed - require comment
    setPendingStatusChange(newStatus)
    setStatusChangeRequiresComment(true)
    // Don't update status yet - wait for comment
    // Keep current status display as original
  }

  const handlePostComment = (e) => {
    e.preventDefault()
    setCommentError('')

    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty')
      return
    }

    if (commentText.trim().length < 1) {
      setCommentError('Comment must be at least 1 character')
      return
    }

    // If there's a pending status change, comment is required
    if (statusChangeRequiresComment && !commentText.trim()) {
      setCommentError('Comment is required when updating status')
      return
    }

    // Post comment (which will trigger status update if pending)
    createCommentMutation.mutate(commentText.trim())
  }

  const isAdmin = user?.roleDetails?.name?.toLowerCase() === 'admin'

  if (isLoading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        PaperProps={{ sx: { maxWidth: '500px' } }}
      >
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || !normalizedTask) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        PaperProps={{ sx: { maxWidth: '500px' } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 1.5, px: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" fontSize="1.1rem">
              Task Details
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Typography color="error" fontSize="0.875rem">
            {error?.message || 'Failed to load task details'}
          </Typography>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{ sx: { maxWidth: '500px', borderRadius: 2 } }}
    >
      <DialogTitle sx={{ pb: 1, pt: 1.5, px: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h6" fontWeight={600} fontSize="1.1rem">
            Task Details
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 2, py: 1.5 }}>
        <Grid container spacing={1.5}>
          {/* Task Code and Status */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography variant="h6" fontWeight={600} fontSize="1.15rem">
                {normalizedTask.taskCode || `Task #${normalizedTask.id}`}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                {(isAdmin || canComment()) &&
                normalizedTask.status !== 'Completed' &&
                normalizedTask.status !== 'Cancelled' ? (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                    <Select
                      value={
                        pendingStatusChange ||
                        currentStatus ||
                        normalizedTask.status ||
                        'Pending'
                      }
                      onChange={(e) => {
                        handleStatusChange(e.target.value)
                      }}
                      label="Status"
                      error={statusChangeRequiresComment && !commentText.trim()}
                      helperText={
                        statusChangeRequiresComment && !commentText.trim()
                          ? 'Comment required'
                          : ''
                      }
                      sx={{
                        bgcolor: statusColor.bg,
                        color: statusColor.text,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: '32px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: statusColor.border,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: statusColor.border,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: statusColor.border,
                        },
                      }}
                    >
                      <MenuItem value="Pending" sx={{ fontSize: '0.875rem' }}>
                        Pending
                      </MenuItem>
                      <MenuItem
                        value="In Progress"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        In Progress
                      </MenuItem>
                      <MenuItem value="Completed" sx={{ fontSize: '0.875rem' }}>
                        Completed
                      </MenuItem>
                      <MenuItem value="Cancelled" sx={{ fontSize: '0.875rem' }}>
                        Cancelled
                      </MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={
                      normalizedTask.status?.replace('_', ' ') || 'Pending'
                    }
                    size="small"
                    sx={{
                      bgcolor: statusColor.bg,
                      color: statusColor.text,
                      border: `1px solid ${statusColor.border}`,
                      fontWeight: 600,
                      height: '24px',
                      fontSize: '0.75rem',
                    }}
                  />
                )}
                <Chip
                  label={normalizedTask.priority || 'Medium'}
                  size="small"
                  sx={{
                    bgcolor: priorityColor.bg,
                    color: priorityColor.text,
                    border: `1px solid ${priorityColor.border}`,
                    fontWeight: 600,
                    height: '24px',
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Summary */}
          <Grid item xs={12}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Summary
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: '#f9fafb',
                p: 1,
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              {normalizedTask.taskName || 'No summary provided'}
            </Typography>
          </Grid>

          {/* Remarks */}
          <Grid item xs={12}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Remarks
            </Typography>
            <Typography
              variant="body2"
              sx={{
                bgcolor: '#f9fafb',
                p: 1,
                borderRadius: 1,
                fontSize: '0.875rem',
              }}
            >
              {normalizedTask.remarks || 'No remarks provided'}
            </Typography>
          </Grid>

          {/* Task Description */}
          {normalizedTask.description && (
            <Grid item xs={12}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.7rem"
                sx={{ mb: 0.25, display: 'block' }}
              >
                Task Description
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  bgcolor: '#f9fafb',
                  p: 1,
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                {normalizedTask.description}
              </Typography>
            </Grid>
          )}

          {/* Department and Category */}
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Department
            </Typography>
            {normalizedTask.department ? (
              <Chip
                label={normalizedTask.department}
                size="small"
                sx={{
                  bgcolor: '#e8f5e9',
                  color: '#2e7d32',
                  fontWeight: 500,
                  height: '24px',
                  fontSize: '0.75rem',
                }}
              />
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="0.875rem"
              >
                No department
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Category
            </Typography>
            {normalizedTask.category ? (
              <Chip
                label={normalizedTask.category}
                size="small"
                sx={{
                  bgcolor: '#f3e5f5',
                  color: '#7b1fa2',
                  fontWeight: 500,
                  height: '24px',
                  fontSize: '0.75rem',
                }}
              />
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="0.875rem"
              >
                No category
              </Typography>
            )}
          </Grid>

          {/* Assigned To */}
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Assigned To
            </Typography>
            {assignedToArray.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {assignedToArray.slice(0, 3).map((assignee, idx) => (
                  <Box
                    key={`${assignee?.id || 'unassigned'}-${idx}`}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        bgcolor: '#06aee9',
                        fontSize: '0.75rem',
                      }}
                    >
                      {assignee.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        fontSize="0.875rem"
                      >
                        {assignee.fullName || 'Unassigned'}
                      </Typography>
                      {assignee.roleName && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontSize="0.7rem"
                        >
                          {assignee.roleName}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
                {assignedToArray.length > 3 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize="0.7rem"
                    sx={{ ml: 3.5 }}
                  >
                    +{assignedToArray.length - 3} more
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: '#06aee9',
                    fontSize: '0.75rem',
                  }}
                >
                  U
                </Avatar>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  fontSize="0.875rem"
                >
                  Unassigned
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Created By */}
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Created By
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#10b981',
                  fontSize: '0.75rem',
                }}
              >
                {createdBy.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  fontSize="0.875rem"
                >
                  {createdBy.fullName || 'Unknown'}
                </Typography>
                {createdBy.roleName && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize="0.7rem"
                  >
                    {createdBy.roleName}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Dates */}
          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Created At
            </Typography>
            <Typography variant="body2" fontSize="0.875rem">
              {normalizedTask.createdAt
                ? dayjs(normalizedTask.createdAt).format('DD MMM YYYY, hh:mm A')
                : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontSize="0.7rem"
              sx={{ mb: 0.25, display: 'block' }}
            >
              Last Updated
            </Typography>
            <Typography variant="body2" fontSize="0.875rem">
              {normalizedTask.updatedAt
                ? dayjs(normalizedTask.updatedAt).format('DD MMM YYYY, hh:mm A')
                : 'N/A'}
            </Typography>
          </Grid>

          {/* Set Alert - Full Width */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pt: 0.5,
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={alertEnabled}
                    onChange={(e) => setAlertEnabled(e.target.checked)}
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
              {canComment() && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveAlert}
                  disabled={!alertHasChanged() || updateAlertMutation.isPending}
                  startIcon={
                    updateAlertMutation.isPending ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : null
                  }
                  sx={{
                    bgcolor: '#06aee9',
                    '&:hover': { bgcolor: '#0599d1' },
                    '&:disabled': { bgcolor: '#ccc' },
                    fontSize: '0.75rem',
                    px: 1.5,
                    py: 0.5,
                    minWidth: 90,
                    textTransform: 'none',
                  }}
                >
                  {updateAlertMutation.isPending ? 'Saving...' : 'Save Alert'}
                </Button>
              )}
            </Box>
          </Grid>

          {/* Alert Date & Time - Conditional, 40% Width */}
          {alertEnabled && (
            <Grid item xs={12}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontSize="0.7rem"
                sx={{ mb: 0.25, display: 'block' }}
              >
                Alert Date & Time
              </Typography>
              <Box sx={{ width: '40%' }}>
                <DatePicker
                  value={alertDate}
                  onChange={(value) => setAlertDate(value)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                      placeholder: 'Select alert date & time',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                        },
                      },
                    },
                  }}
                />
              </Box>
            </Grid>
          )}

          {/* Comments Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1.5 }} />
            <Typography
              variant="subtitle2"
              fontWeight={600}
              fontSize="0.9rem"
              sx={{ mb: 1 }}
            >
              Comments ({comments.length})
            </Typography>
            {comments && comments.length > 0 ? (
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {[...comments].reverse().map((comment) => (
                  <Box
                    key={comment.id || comment.commentId}
                    sx={{
                      p: 1,
                      mb: 0.75,
                      bgcolor: '#f9fafb',
                      borderRadius: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          fontSize="0.875rem"
                        >
                          {comment.commentedByName || 'Unknown'}
                        </Typography>
                        {comment.commentedByRole && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            fontSize="0.7rem"
                          >
                            {comment.commentedByRole}
                          </Typography>
                        )}
                      </Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontSize="0.7rem"
                      >
                        {dayjs(comment.createdAt).format(
                          'DD MMM YYYY, hh:mm A',
                        )}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}
                    >
                      {comment.commentText}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography
                variant="body2"
                color="text.secondary"
                fontSize="0.875rem"
              >
                No comments yet
              </Typography>
            )}

            {/* Comment Input Form */}
            {canComment() && (
              <Box sx={{ mt: 1.5 }}>
                <Divider sx={{ mb: 1.5 }} />
                <form onSubmit={handlePostComment}>
                  {/* Status Change Requires Comment Warning */}
                  {statusChangeRequiresComment && (
                    <Box
                      sx={{
                        mb: 1.5,
                        p: 1.5,
                        bgcolor: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          color: '#856404',
                          fontWeight: 500,
                          mb: 0.5,
                        }}
                      >
                        ⚠️ <strong>Comment Required:</strong> You must provide a
                        comment to update the task status.
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontSize: '0.75rem', color: '#856404' }}
                      >
                        Status will be updated from{' '}
                        <strong>{originalStatus?.replace('_', ' ')}</strong> to{' '}
                        <strong>
                          {pendingStatusChange?.replace('_', ' ')}
                        </strong>{' '}
                        when you post your comment.
                      </Typography>
                    </Box>
                  )}

                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder={
                      statusChangeRequiresComment
                        ? 'Add a comment to update status...'
                        : 'Add a comment...'
                    }
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value)
                      setCommentError('')
                    }}
                    error={
                      !!commentError ||
                      (statusChangeRequiresComment && !commentText.trim())
                    }
                    helperText={
                      commentError ||
                      (statusChangeRequiresComment && !commentText.trim()
                        ? 'Comment is required to update the status.'
                        : '')
                    }
                    disabled={
                      createCommentMutation.isPending ||
                      updateStatusMutation.isPending
                    }
                    required={statusChangeRequiresComment}
                    sx={{
                      mb: 1.5,
                      '& .MuiInputBase-root': { fontSize: '0.875rem' },
                    }}
                    size="small"
                  />
                  <Box
                    sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setCommentText('')
                        setCommentError('')
                        setPendingStatusChange(null)
                        setStatusChangeRequiresComment(false)
                        setCurrentStatus(originalStatus)
                      }}
                      disabled={
                        createCommentMutation.isPending ||
                        updateStatusMutation.isPending
                      }
                      sx={{ fontSize: '0.875rem', px: 1.5 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={
                        createCommentMutation.isPending ||
                        updateStatusMutation.isPending ||
                        !commentText.trim() ||
                        (statusChangeRequiresComment && !commentText.trim())
                      }
                      startIcon={
                        createCommentMutation.isPending ||
                        updateStatusMutation.isPending ? (
                          <CircularProgress size={14} />
                        ) : (
                          <CommentIcon sx={{ fontSize: '1rem' }} />
                        )
                      }
                      sx={{
                        bgcolor:
                          statusChangeRequiresComment && commentText.trim()
                            ? '#06aee9'
                            : '#06aee9',
                        '&:hover': { bgcolor: '#0599d1' },
                        '&:disabled': { bgcolor: '#ccc' },
                        fontSize: '0.875rem',
                        px: 1.5,
                      }}
                    >
                      {statusChangeRequiresComment
                        ? updateStatusMutation.isPending
                          ? 'Saving...'
                          : 'Save'
                        : createCommentMutation.isPending
                          ? 'Saving...'
                          : 'Save'}
                    </Button>
                  </Box>
                </form>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 1.5, pt: 1 }}>
        <Button
          onClick={onClose}
          size="small"
          sx={{ fontSize: '0.875rem', px: 2 }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TaskDetailsModal
