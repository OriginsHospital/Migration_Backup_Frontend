import React, { useState, useMemo, useCallback } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
  Stack,
  Avatar,
  Divider,
  Autocomplete,
  Tabs,
  Tab,
  Menu,
} from '@mui/material'
import {
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'
import {
  getTickets,
  createTicket,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  getActiveStaff,
  getTicketDetails,
  createTicketComment,
} from '@/constants/apis'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { DatePicker } from '@mui/x-date-pickers'
import TaskTracker from '@/components/TaskTracker'

dayjs.extend(relativeTime)

// CSV Export Utility Function
const exportToCSV = (data, filename, headers, getRowData) => {
  // Create CSV content
  const csvHeaders = headers.join(',')
  const csvRows = data.map((item) => {
    const row = getRowData(item)
    return row
      .map((cell) => {
        // Escape commas and quotes in cell values
        if (cell === null || cell === undefined) return ''
        const cellStr = String(cell)
        if (
          cellStr.includes(',') ||
          cellStr.includes('"') ||
          cellStr.includes('\n')
        ) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      })
      .join(',')
  })

  const csvContent = [csvHeaders, ...csvRows].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Tab Panel Component
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index}>{value === index && <Box>{children}</Box>}</div>
)

// Ticket Details Modal Component
function TicketDetailsModal({
  open,
  onClose,
  ticketId,
  onStatusChange,
  isAdmin,
}) {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [currentStatus, setCurrentStatus] = useState(null)
  const [originalStatus, setOriginalStatus] = useState(null)
  const [pendingStatusChange, setPendingStatusChange] = useState(null) // Store status that user wants to change to
  const [statusChangeRequiresComment, setStatusChangeRequiresComment] =
    useState(false) // Flag to show comment requirement
  const [alertEnabled, setAlertEnabled] = useState(false)
  const [alertDate, setAlertDate] = useState(null)
  const [originalAlertEnabled, setOriginalAlertEnabled] = useState(false)
  const [originalAlertDate, setOriginalAlertDate] = useState(null)

  // Fetch ticket details
  const {
    data: ticketData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ticketDetails', ticketId],
    queryFn: async () => {
      const response = await getTicketDetails(user?.accessToken, ticketId)
      console.log('Ticket details response:', response)
      return response
    },
    enabled: !!ticketId && !!user?.accessToken && open,
  })

  const ticket = ticketData?.data || ticketData

  // Normalize field names (handle both snake_case and camelCase)
  const normalizedTicket = ticket
    ? {
        ...ticket,
        taskDescription: ticket.taskDescription || ticket.task_description,
        summary: ticket.summary || ticket.summary,
        ticketCode: ticket.ticketCode || ticket.ticket_code,
        createdAt: ticket.createdAt || ticket.created_at,
        updatedAt: ticket.updatedAt || ticket.updated_at,
        assignedTo: ticket.assignedTo || ticket.assigned_to,
        createdBy: ticket.createdBy || ticket.created_by,
        department: ticket.department || ticket.department,
        alertEnabled: ticket.alertEnabled || ticket.alert_enabled || false,
        alertDate: ticket.alertDate || ticket.alert_date || null,
      }
    : null

  // Parse JSON fields
  const assignedTo = normalizedTicket?.assignedToDetails
    ? typeof normalizedTicket.assignedToDetails === 'string'
      ? JSON.parse(normalizedTicket.assignedToDetails)
      : normalizedTicket.assignedToDetails
    : {}
  const createdBy = normalizedTicket?.createdByDetails
    ? typeof normalizedTicket.createdByDetails === 'string'
      ? JSON.parse(normalizedTicket.createdByDetails)
      : normalizedTicket.createdByDetails
    : {}
  const comments = normalizedTicket?.comments
    ? typeof normalizedTicket.comments === 'string'
      ? JSON.parse(normalizedTicket.comments)
      : Array.isArray(normalizedTicket.comments)
        ? normalizedTicket.comments
        : []
    : []
  const activityLogs = normalizedTicket?.activityLogs
    ? typeof normalizedTicket.activityLogs === 'string'
      ? JSON.parse(normalizedTicket.activityLogs)
      : Array.isArray(normalizedTicket.activityLogs)
        ? normalizedTicket.activityLogs
        : []
    : []
  const priorityColor = getPriorityColor(normalizedTicket?.priority)
  // Use pending status for color if status change is pending, otherwise use current status
  const statusForColor = pendingStatusChange || normalizedTicket?.status
  const statusColor = getStatusColor(statusForColor)

  // Track original status when modal opens and initialize alert fields
  React.useEffect(() => {
    if (normalizedTicket?.status) {
      if (originalStatus === null) {
        setOriginalStatus(normalizedTicket.status)
        setCurrentStatus(normalizedTicket.status)
      }
    }
    // Initialize alert fields from ticket data
    if (normalizedTicket) {
      const enabled = normalizedTicket.alertEnabled || false
      const date = normalizedTicket.alertDate
        ? dayjs(normalizedTicket.alertDate)
        : null
      setAlertEnabled(enabled)
      setAlertDate(date)
      setOriginalAlertEnabled(enabled)
      setOriginalAlertDate(date)
    }
  }, [
    normalizedTicket?.status,
    normalizedTicket?.alertEnabled,
    normalizedTicket?.alertDate,
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
    if (!normalizedTicket || !user) return false
    const userRole = user?.roleDetails?.name?.toLowerCase() || ''
    const isAdmin = userRole === 'admin' || userRole === 'global admin'
    const isManager = userRole === 'manager'
    const isAssignedUser = normalizedTicket.assignedTo === user?.id
    const isCreator = normalizedTicket.createdBy === user?.id
    return isAdmin || isManager || isAssignedUser || isCreator
  }

  // Update status mutation (for when status is changed with comment)
  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }) =>
      updateTicketStatus(user?.accessToken, ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', ticketId] })
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ticket status')
    },
  })

  // Update alert mutation
  const updateAlertMutation = useMutation({
    mutationFn: (alertData) => {
      const payload = {
        ticketId: normalizedTicket.id || ticketId,
        alertEnabled: alertData.alertEnabled,
        alertDate: alertData.alertDate
          ? alertData.alertDate.toISOString()
          : null,
      }
      return updateTicket(user?.accessToken, payload)
    },
    onSuccess: () => {
      toast.success('Alert settings saved successfully!')
      setOriginalAlertEnabled(alertEnabled)
      setOriginalAlertDate(alertDate)
      queryClient.invalidateQueries({ queryKey: ['ticketDetails', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
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
    mutationFn: (commentText) =>
      createTicketComment(user?.accessToken, ticketId, commentText),
    onSuccess: () => {
      // If there's a pending status change, update it now
      if (pendingStatusChange && pendingStatusChange !== originalStatus) {
        updateStatusMutation.mutate(
          {
            ticketId: normalizedTicket.id || ticketId,
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
                queryKey: ['ticketDetails', ticketId],
              })
              queryClient.invalidateQueries({ queryKey: ['tickets'] })
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
        queryClient.invalidateQueries({ queryKey: ['ticketDetails', ticketId] })
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
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

  if (error || !normalizedTicket) {
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
              Ticket Details
            </Typography>
            <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Typography color="error" fontSize="0.875rem">
            {error?.message || 'Failed to load ticket details'}
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
            Ticket Details
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ p: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 2, py: 1.5 }}>
        <Grid container spacing={1.5}>
          {/* Ticket Code and Status */}
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
                {normalizedTicket.ticketCode}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                {(isAdmin || canComment()) &&
                normalizedTicket.status !== 'COMPLETED' ? (
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ fontSize: '0.75rem' }}>Status</InputLabel>
                    <Select
                      value={
                        pendingStatusChange ||
                        currentStatus ||
                        normalizedTicket.status ||
                        'OPEN'
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
                      <MenuItem value="OPEN" sx={{ fontSize: '0.875rem' }}>
                        Open
                      </MenuItem>
                      <MenuItem
                        value="IN_PROGRESS"
                        sx={{ fontSize: '0.875rem' }}
                      >
                        In Progress
                      </MenuItem>
                      <MenuItem value="COMPLETED" sx={{ fontSize: '0.875rem' }}>
                        Completed
                      </MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={normalizedTicket.status?.replace('_', ' ') || 'Open'}
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
                  label={normalizedTicket.priority || 'Medium'}
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
              {normalizedTicket.taskDescription || 'No summary provided'}
            </Typography>
          </Grid>

          {/* Task Description */}
          {normalizedTicket.summary && (
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
                {normalizedTicket.summary}
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
            {normalizedTicket.department ? (
              <Chip
                label={normalizedTicket.department}
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
            {normalizedTicket.category ? (
              <Chip
                label={ticket.category}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: '#06aee9',
                  fontSize: '0.75rem',
                }}
              >
                {assignedTo.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  fontSize="0.875rem"
                >
                  {assignedTo.fullName || 'Unassigned'}
                </Typography>
                {assignedTo.roleName && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize="0.7rem"
                  >
                    {assignedTo.roleName}
                  </Typography>
                )}
              </Box>
            </Box>
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
              {normalizedTicket.createdAt
                ? dayjs(normalizedTicket.createdAt).format(
                    'DD MMM YYYY, hh:mm A',
                  )
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
              {normalizedTicket.updatedAt
                ? dayjs(normalizedTicket.updatedAt).format(
                    'DD MMM YYYY, hh:mm A',
                  )
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
                    key={comment.id}
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
                        comment to update the ticket status.
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

          {/* Activity Logs Section */}
          {activityLogs && activityLogs.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="subtitle2"
                fontWeight={600}
                fontSize="0.9rem"
                sx={{ mb: 1 }}
              >
                Activity Log ({activityLogs.length})
              </Typography>
              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {activityLogs.map((activity) => (
                  <Box
                    key={activity.id}
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
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        fontSize="0.875rem"
                      >
                        {activity.performedByName || 'System'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontSize="0.7rem"
                      >
                        {dayjs(activity.createdAt).format(
                          'DD MMM YYYY, hh:mm A',
                        )}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontSize="0.875rem">
                      {activity.activityType === 'STATUS_CHANGED' && (
                        <>
                          Status changed from{' '}
                          <strong>{activity.oldValue}</strong> to{' '}
                          <strong>{activity.newValue}</strong>
                        </>
                      )}
                      {activity.activityType === 'PRIORITY_CHANGED' && (
                        <>
                          Priority changed from{' '}
                          <strong>{activity.oldValue}</strong> to{' '}
                          <strong>{activity.newValue}</strong>
                        </>
                      )}
                      {activity.activityType === 'CREATED' && (
                        <>Ticket created</>
                      )}
                      {activity.commentText && (
                        <>
                          <br />
                          {activity.commentText}
                        </>
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          )}
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
      return { bg: '#ffffff', text: '#374151', border: '#d1d5db' }
    case 'IN_PROGRESS':
      return { bg: '#dbeafe', text: '#2563eb', border: '#bfdbfe' }
    case 'COMPLETED':
      return { bg: '#d1fae5', text: '#059669', border: '#a7f3d0' }
    default:
      return { bg: '#f3f4f6', text: '#6b7280', border: '#e5e7eb' }
  }
}

// Create/Edit Ticket Modal Component
function CreateTicketModal({ open, onClose, onSuccess, ticket }) {
  const user = useSelector((store) => store.user)
  const [formData, setFormData] = useState({
    taskDescription: '',
    summary: '',
    assignedTo: '',
    assignedToMultiple: [],
    priority: 'MEDIUM',
    department: '',
    category: '',
    startDate: null,
    endDate: null,
    alertEnabled: false,
    alertDate: null,
  })
  const [allowMultipleAssignees, setAllowMultipleAssignees] = useState(false)
  const [errors, setErrors] = useState({})
  const isEditMode = !!ticket

  // Predefined departments
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

  // Predefined categories
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

  // Fetch active staff
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['activeStaff', user?.accessToken],
    queryFn: () => getActiveStaff(user?.accessToken),
    enabled: open && !!user?.accessToken,
  })

  const staff = staffData?.data || []

  // Populate form when ticket is provided (edit mode)
  React.useEffect(() => {
    if (ticket && open) {
      console.log('Populating form with ticket data:', ticket)
      const assignedToValue = ticket.assignedTo || ticket.assigned_to
      let assignedToDetails = ticket.assignedToDetails
        ? typeof ticket.assignedToDetails === 'string'
          ? JSON.parse(ticket.assignedToDetails)
          : ticket.assignedToDetails
        : null

      // Handle case where assignedToDetails might be a single object instead of array
      if (assignedToDetails && !Array.isArray(assignedToDetails)) {
        assignedToDetails = [assignedToDetails]
      }

      // Check if multiple assignees exist
      const isMultiple =
        Array.isArray(assignedToDetails) && assignedToDetails.length > 1

      // For single assignee, get the ID from assignedToDetails if available
      let singleAssigneeId = assignedToValue
      if (!isMultiple && assignedToDetails && assignedToDetails.length === 1) {
        singleAssigneeId = assignedToDetails[0]?.id || assignedToValue
      }

      setFormData({
        taskDescription:
          ticket.taskDescription || ticket.task_description || '',
        summary: ticket.summary || '',
        assignedTo: isMultiple ? '' : singleAssigneeId || '',
        assignedToMultiple:
          isMultiple && assignedToDetails
            ? assignedToDetails.map((a) => a.id).filter(Boolean)
            : [],
        priority: ticket.priority || 'MEDIUM',
        department: ticket.department || '',
        category: ticket.category || '',
        startDate: null,
        endDate: null,
        alertEnabled: false,
        alertDate: null,
      })
      setAllowMultipleAssignees(isMultiple)
      console.log(
        'Form populated - isMultiple:',
        isMultiple,
        'assignedTo:',
        isMultiple ? 'multiple' : singleAssigneeId,
      )
    } else if (!ticket && open) {
      // Reset form for create mode
      setFormData({
        taskDescription: '',
        summary: '',
        assignedTo: '',
        assignedToMultiple: [],
        priority: 'MEDIUM',
        department: '',
        category: '',
        startDate: null,
        endDate: null,
        alertEnabled: false,
        alertDate: null,
      })
      setAllowMultipleAssignees(false)
    }
  }, [ticket, open])

  // Update ticket mutation
  const updateMutation = useMutation({
    mutationFn: (data) => {
      console.log('Update mutation called with data:', data)
      return updateTicket(user?.accessToken, data)
    },
    onSuccess: (response) => {
      console.log('Ticket update response:', response)
      if (response.status === 200 || response.status === 201) {
        toast.success(response.message || 'Ticket updated successfully!')
        handleClose()
        setTimeout(() => {
          onSuccess()
        }, 500)
      } else {
        toast.error(response.message || 'Failed to update ticket')
      }
    },
    onError: (error) => {
      console.error('Error updating ticket:', error)
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update ticket. Please try again.'
      toast.error(errorMessage)
    },
  })

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: (data) => {
      console.log('Mutation called with data:', data)
      return createTicket(user?.accessToken, data)
    },
    onSuccess: (response) => {
      console.log('Ticket creation response:', response)
      if (response.status === 201 || response.status === 200) {
        toast.success(response.message || 'Ticket created successfully!')
        // Close modal first
        handleClose()
        // Trigger refetch after a delay to ensure backend transaction is committed
        setTimeout(() => {
          console.log('Triggering onSuccess callback to refetch tickets')
          onSuccess()
        }, 1000) // Delay to ensure backend has fully committed the transaction
      } else {
        toast.error(response.message || 'Failed to create ticket')
      }
    },
    onError: (error) => {
      console.error('Error creating ticket:', error)
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.status,
      })
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create ticket. Please try again.'
      toast.error(errorMessage)
    },
  })

  const handleClose = () => {
    setFormData({
      taskDescription: '',
      summary: '',
      assignedTo: '',
      assignedToMultiple: [],
      priority: 'MEDIUM',
      department: '',
      category: '',
      startDate: null,
      endDate: null,
      alertEnabled: false,
      alertDate: null,
    })
    setAllowMultipleAssignees(false)
    setErrors({})
    onClose()
  }

  const validate = () => {
    const newErrors = {}
    // Task description validation - minimum 1 character, no error message displayed
    if (
      !formData.taskDescription ||
      formData.taskDescription.trim().length < 1
    ) {
      // Validation fails but no error message shown
      return false
    }
    if (allowMultipleAssignees) {
      if (
        !formData.assignedToMultiple ||
        formData.assignedToMultiple.length === 0
      ) {
        newErrors.assignedTo =
          'Please assign the ticket to at least one staff member'
      }
    } else {
      if (
        !formData.assignedTo ||
        formData.assignedTo === '' ||
        isNaN(Number(formData.assignedTo))
      ) {
        newErrors.assignedTo = 'Please assign the ticket to a staff member'
      }
    }
    if (!formData.department || formData.department.trim() === '') {
      newErrors.department = 'Please select a department'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      // Convert assignedTo to number or array and prepare payload
      // Only include fields that are supported by the backend schema
      const payload = {
        ticketId: isEditMode ? ticket.id : undefined,
        taskDescription: formData.taskDescription,
        assignedTo: allowMultipleAssignees
          ? formData.assignedToMultiple.map((id) => Number(id))
          : Number(formData.assignedTo),
        priority: formData.priority,
        department: formData.department,
        summary: formData.summary || null,
        category: formData.category || null,
        // Note: startDate, endDate, alertEnabled, and alertDate are not supported by the backend
        // These fields are kept in the UI for future use but excluded from the payload
      }
      console.log('Submitting ticket with payload:', payload)
      if (isEditMode) {
        updateMutation.mutate(payload)
      } else {
        createMutation.mutate(payload)
      }
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
      onClose={handleClose}
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
            onClick={handleClose}
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
        <form onSubmit={handleSubmit} id="create-ticket-form">
          <Grid container spacing={2.5}>
            {/* Summary - Full Width */}
            <Grid item xs={12}>
              <Typography sx={labelStyle}>
                Summary <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter a brief summary..."
                value={formData.taskDescription}
                onChange={(e) =>
                  setFormData({ ...formData, taskDescription: e.target.value })
                }
                error={!!errors.taskDescription}
                helperText={errors.taskDescription}
                multiline
                rows={2}
                size="small"
                sx={inputStyle}
              />
            </Grid>

            {/* Task Description - Full Width */}
            <Grid item xs={12}>
              <Typography sx={labelStyle}>Task Description</Typography>
              <TextField
                fullWidth
                placeholder="Describe the task in detail..."
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
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
                          assignedTo: '',
                          assignedToMultiple: [],
                        })
                      } else {
                        setFormData({
                          ...formData,
                          assignedTo: '',
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
                  options={staff}
                  getOptionLabel={(option) =>
                    `${option.fullName} (${option.roleDetails?.name || 'Staff'})`
                  }
                  getOptionKey={(option) => option.id || option.fullName}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  value={
                    staff.filter((member) =>
                      formData.assignedToMultiple.includes(member.id),
                    ) || []
                  }
                  onChange={(e, newValue) => {
                    setFormData({
                      ...formData,
                      assignedToMultiple: newValue.map((member) => member.id),
                    })
                    if (errors.assignedTo) {
                      setErrors({ ...errors, assignedTo: '' })
                    }
                  }}
                  disabled={staffLoading}
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
                <FormControl fullWidth error={!!errors.assignedTo} size="small">
                  <Select
                    value={formData.assignedTo}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedTo: e.target.value })
                    }
                    displayEmpty
                    disabled={staffLoading}
                    sx={selectStyle}
                  >
                    <MenuItem value="">Select a staff member</MenuItem>
                    {staff.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.fullName} ({member.roleDetails?.name || 'Staff'}
                        )
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.assignedTo && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.5, fontSize: '0.75rem' }}
                    >
                      {errors.assignedTo}
                    </Typography>
                  )}
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
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
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
              <Typography sx={labelStyle}>
                Department <span style={{ color: 'red' }}>*</span>
              </Typography>
              <FormControl fullWidth error={!!errors.department} size="small">
                <Select
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
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
                {errors.department && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, ml: 1.5, fontSize: '0.75rem' }}
                  >
                    {errors.department}
                  </Typography>
                )}
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
                  setFormData({ ...formData, category: newValue || '' })
                }
                onInputChange={(e, newInputValue) =>
                  setFormData({ ...formData, category: newInputValue })
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
                onChange={(value) =>
                  setFormData({ ...formData, startDate: value })
                }
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
                onChange={(value) =>
                  setFormData({ ...formData, endDate: value })
                }
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
                        setFormData({
                          ...formData,
                          alertEnabled: e.target.checked,
                        })
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
                  onChange={(value) =>
                    setFormData({ ...formData, alertDate: value })
                  }
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
          onClick={handleClose}
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
          form="create-ticket-form"
          variant="contained"
          size="medium"
          disabled={createMutation.isPending}
          startIcon={
            createMutation.isPending ? (
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
          {isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Main Ticketing Component
function Ticketing() {
  const router = useRouter()
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [exportDateModalOpen, setExportDateModalOpen] = useState(false)
  const [exportFromDate, setExportFromDate] = useState(null)
  const [exportToDate, setExportToDate] = useState(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null)
  const [selectedActionTicket, setSelectedActionTicket] = useState(null)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [actionComment, setActionComment] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedEditTicket, setSelectedEditTicket] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState('')
  const [selectedNewPriority, setSelectedNewPriority] = useState('')

  // Handle navigation from inbox
  React.useEffect(() => {
    const ticketId = router.query.ticketId
    if (ticketId) {
      setSelectedTicketId(parseInt(ticketId))
      setViewModalOpen(true)
      // Clear the query parameter
      router.replace('/ticketing', undefined, { shallow: true })
    }
  }, [router.query.ticketId])
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  })
  const [page, setPage] = useState(1)
  const limit = 50

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setFilters((prev) => ({ ...prev, search: value }))
        setPage(1)
      }, 500),
    [],
  )

  // Fetch tickets
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tickets', user?.accessToken, filters, page],
    queryFn: () =>
      getTickets(user?.accessToken, {
        ...filters,
        page,
        limit,
      }),
    enabled: !!user?.accessToken,
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
  })

  const tickets = data?.data?.tickets || []
  const pagination = data?.data?.pagination || { total: 0, totalPages: 0 }

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }) =>
      updateTicketStatus(user?.accessToken, ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticketDetails'] })
      toast.success('Ticket status updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ticket status')
    },
  })

  // Delete ticket mutation
  const deleteMutation = useMutation({
    mutationFn: ({ ticketId, comment }) => {
      // First create comment if provided
      if (comment && comment.trim()) {
        return createTicketComment(user?.accessToken, ticketId, comment).then(
          () => deleteTicket(user?.accessToken, ticketId),
        )
      }
      return deleteTicket(user?.accessToken, ticketId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticketDetails'] })
      toast.success('Ticket deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete ticket')
    },
  })

  // Update ticket mutation (for priority and other fields)
  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, payload, comment }) => {
      // First create comment if provided
      if (comment && comment.trim()) {
        return createTicketComment(user?.accessToken, ticketId, comment).then(
          () => updateTicket(user?.accessToken, payload),
        )
      }
      return updateTicket(user?.accessToken, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticketDetails'] })
      toast.success('Ticket updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ticket')
    },
  })

  // Update status with comment
  const updateStatusWithCommentMutation = useMutation({
    mutationFn: ({ ticketId, status, comment }) => {
      // First create comment if provided
      if (comment && comment.trim()) {
        return createTicketComment(user?.accessToken, ticketId, comment).then(
          () => updateTicketStatus(user?.accessToken, ticketId, status),
        )
      }
      return updateTicketStatus(user?.accessToken, ticketId, status)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['ticketDetails'] })
      toast.success('Ticket status updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ticket status')
    },
  })

  const handleStatusChange = (ticketId, newStatus) => {
    updateStatusMutation.mutate({ ticketId, status: newStatus })
  }

  const handleDelete = (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      deleteMutation.mutate(ticketId)
    }
  }

  // Action menu handlers
  const handleMenuOpen = (event, ticket) => {
    setActionMenuAnchor(event.currentTarget)
    setSelectedActionTicket(ticket)
  }

  const handleMenuClose = () => {
    setActionMenuAnchor(null)
    // Don't clear selectedActionTicket here - it's needed for the comment dialog
  }

  const handleActionClick = (action) => {
    // Store the ticket before closing menu
    const ticket = selectedActionTicket
    setActionMenuAnchor(null) // Close menu but keep ticket data

    if (action === 'view') {
      if (ticket?.id) {
        setSelectedTicketId(ticket.id)
        setViewModalOpen(true)
      }
      setSelectedActionTicket(null) // Clear after use
      return
    }

    // For other actions, show comment dialog
    // Keep selectedActionTicket set so comment dialog can use it
    setPendingAction(action)
    setCommentDialogOpen(true)
  }

  const handleCommentSubmit = async () => {
    const ticket = selectedActionTicket
    const comment = actionComment.trim()

    // Validate that we have a ticket
    if (!ticket || !ticket.id) {
      toast.error('Ticket information is missing. Please try again.')
      setCommentDialogOpen(false)
      setActionComment('')
      setPendingAction(null)
      return
    }

    switch (pendingAction) {
      case 'edit':
        // Save comment if provided
        if (comment && comment.trim()) {
          try {
            await createTicketComment(user?.accessToken, ticket.id, comment)
          } catch (error) {
            console.error('Error saving comment:', error)
            // Continue even if comment fails
          }
        }
        // Use the ticket data we already have from the table
        // Try to fetch full details, but fallback to table data if fetch fails
        try {
          const ticketDetails = await getTicketDetails(
            user?.accessToken,
            ticket.id,
          )
          console.log('Ticket details response:', ticketDetails)
          // Handle different response structures
          const ticketData = ticketDetails?.data || ticketDetails
          if (ticketData) {
            setSelectedEditTicket(ticketData)
            setCommentDialogOpen(false)
            setActionComment('')
            setEditModalOpen(true)
          } else {
            // Fallback to using table ticket data
            setSelectedEditTicket(ticket)
            setCommentDialogOpen(false)
            setActionComment('')
            setEditModalOpen(true)
          }
        } catch (error) {
          console.error('Error fetching ticket details:', error)
          // Fallback to using table ticket data
          setSelectedEditTicket(ticket)
          setCommentDialogOpen(false)
          setActionComment('')
          setEditModalOpen(true)
        }
        break

      case 'updateStatus':
        // Show status selection dialog
        setCommentDialogOpen(false)
        setStatusDialogOpen(true)
        // Comment will be used when status is confirmed
        break

      case 'updatePriority':
        setCommentDialogOpen(false)
        setPriorityDialogOpen(true)
        // Comment will be used when priority is confirmed
        break

      case 'delete':
        deleteMutation.mutate({ ticketId: ticket.id, comment })
        setCommentDialogOpen(false)
        setActionComment('')
        break

      case 'reopen':
        // Require comment for reopening
        if (!comment || !comment.trim()) {
          toast.error('Please enter a comment to reopen the issue')
          return // Don't close dialog, let user enter comment
        }
        updateStatusWithCommentMutation.mutate({
          ticketId: ticket.id,
          status: 'OPEN',
          comment,
        })
        setCommentDialogOpen(false)
        setActionComment('')
        setSelectedActionTicket(null) // Clear after use
        break

      default:
        setCommentDialogOpen(false)
        setActionComment('')
    }
  }

  const handleStatusConfirm = () => {
    if (!selectedNewStatus) {
      toast.error('Please select a status')
      return
    }
    const ticket = selectedActionTicket
    const comment = actionComment.trim()
    updateStatusWithCommentMutation.mutate({
      ticketId: ticket.id,
      status: selectedNewStatus,
      comment,
    })
    setStatusDialogOpen(false)
    setSelectedNewStatus('')
    setActionComment('')
  }

  const handlePriorityConfirm = () => {
    if (!selectedNewPriority) {
      toast.error('Please select a priority')
      return
    }
    const ticket = selectedActionTicket
    const comment = actionComment.trim()
    updateTicketMutation.mutate({
      ticketId: ticket.id,
      payload: { ticketId: ticket.id, priority: selectedNewPriority },
      comment,
    })
    setPriorityDialogOpen(false)
    setSelectedNewPriority('')
    setActionComment('')
  }

  const handleCommentDialogClose = () => {
    setCommentDialogOpen(false)
    setActionComment('')
    setPendingAction(null)
  }

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ status: '', priority: '', search: '' })
    setPage(1)
  }

  // Open export date modal
  const handleOpenExportModal = () => {
    setExportFromDate(null)
    setExportToDate(null)
    setExportDateModalOpen(true)
  }

  // Export tickets to CSV with date range
  const handleExportTickets = async () => {
    try {
      // Close modal
      setExportDateModalOpen(false)

      // Use currently loaded tickets first
      let allTickets = tickets || []

      // Build export filters with date range
      const exportFilters = { ...filters }
      if (exportFromDate) {
        exportFilters.fromDate = dayjs(exportFromDate).format('YYYY-MM-DD')
      }
      if (exportToDate) {
        exportFilters.toDate = dayjs(exportToDate).format('YYYY-MM-DD')
      }

      // If we have tickets, try to fetch all with same filters for complete export
      if (
        pagination?.total > allTickets.length ||
        exportFromDate ||
        exportToDate
      ) {
        toast.info('Fetching tickets for export...')
        try {
          const exportData = await getTickets(user?.accessToken, {
            ...exportFilters,
            page: 1,
            limit: 10000, // High limit to get all records
          })

          // Try different response structures
          const fetchedTickets =
            exportData?.data?.tickets ||
            exportData?.tickets ||
            exportData?.data ||
            []

          if (fetchedTickets.length > 0) {
            allTickets = fetchedTickets
          }
        } catch (apiError) {
          console.warn(
            'Could not fetch all tickets, using current page:',
            apiError,
          )
          // Continue with currently loaded tickets
        }
      }

      // Filter by date range if dates are selected and we have tickets
      if ((exportFromDate || exportToDate) && allTickets.length > 0) {
        allTickets = allTickets.filter((ticket) => {
          const ticketDate = ticket.createdAt || ticket.created_at
          if (!ticketDate) return false

          const createdDate = dayjs(ticketDate)
          const fromDate = exportFromDate
            ? dayjs(exportFromDate).startOf('day')
            : null
          const toDate = exportToDate ? dayjs(exportToDate).endOf('day') : null

          if (fromDate && createdDate.isBefore(fromDate)) return false
          if (toDate && createdDate.isAfter(toDate)) return false
          return true
        })
      }

      if (allTickets.length === 0) {
        toast.warning('No tickets found for the selected date range')
        return
      }

      toast.info('Preparing export...')

      const headers = [
        'Ticket Code',
        'Task Description',
        'Summary',
        'Status',
        'Priority',
        'Department',
        'Category',
        'Assigned To',
        'Assigned To Email',
        'Created By',
        'Created By Email',
        'Created At',
        'Updated At',
      ]

      const getRowData = (ticket) => {
        const assignedTo = ticket.assignedToDetails
          ? typeof ticket.assignedToDetails === 'string'
            ? JSON.parse(ticket.assignedToDetails)
            : ticket.assignedToDetails
          : {}
        const createdBy = ticket.createdByDetails
          ? typeof ticket.createdByDetails === 'string'
            ? JSON.parse(ticket.createdByDetails)
            : ticket.createdByDetails
          : {}

        return [
          ticket.ticketCode || ticket.ticket_code || '',
          ticket.taskDescription || ticket.task_description || '',
          ticket.summary || '',
          ticket.status || '',
          ticket.priority || '',
          ticket.department || '',
          ticket.category || '',
          assignedTo.fullName || 'Unassigned',
          assignedTo.email || '',
          createdBy.fullName || 'Unknown',
          createdBy.email || '',
          ticket.createdAt || ticket.created_at
            ? dayjs(ticket.createdAt || ticket.created_at).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
          ticket.updatedAt || ticket.updated_at
            ? dayjs(ticket.updatedAt || ticket.updated_at).format(
                'YYYY-MM-DD HH:mm:ss',
              )
            : '',
        ]
      }

      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss')
      exportToCSV(
        allTickets,
        `tickets_report_${timestamp}.csv`,
        headers,
        getRowData,
      )
      toast.success(`Exported ${allTickets.length} tickets successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export tickets. Please try again.')
    }
  }

  const isAdmin = user?.roleDetails?.name?.toLowerCase() === 'admin'
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Tabs */}
      <Card
        sx={{ mb: 3, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 48,
                fontSize: '0.9375rem',
              },
            }}
          >
            <Tab label="Issue Log" />
            <Tab label="Task Tracker" />
          </Tabs>
        </Box>
      </Card>

      {/* Tickets Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box>
          {/* Filters and Search */}
          <Card
            sx={{
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search by task or ticket code..."
                    InputProps={{
                      startAdornment: (
                        <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                    onChange={handleSearchChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange('status', e.target.value)
                      }
                      label="Status"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={filters.priority}
                      onChange={(e) =>
                        handleFilterChange('priority', e.target.value)
                      }
                      label="Priority"
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="LOW">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    onClick={clearFilters}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setCreateModalOpen(true)}
                    size="small"
                    sx={{
                      bgcolor: '#06aee9',
                      '&:hover': { bgcolor: '#0599d1' },
                    }}
                  >
                    CREATE
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card
            sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  All Issues
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleOpenExportModal}
                  disabled={isLoading}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  Download Report
                </Button>
              </Box>

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="error">
                    Failed to load tickets. Please try again.
                  </Typography>
                </Box>
              ) : tickets.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    No tickets found
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setCreateModalOpen(true)}
                  >
                    Create Your First Ticket
                  </Button>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f9fafb' }}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Created Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Assigned To
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Task</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          Assigned By
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tickets.map((ticket) => {
                        const assignedTo = ticket.assignedToDetails
                          ? typeof ticket.assignedToDetails === 'string'
                            ? JSON.parse(ticket.assignedToDetails)
                            : ticket.assignedToDetails
                          : {}
                        const createdBy = ticket.createdByDetails
                          ? typeof ticket.createdByDetails === 'string'
                            ? JSON.parse(ticket.createdByDetails)
                            : ticket.createdByDetails
                          : {}
                        const priorityColor = getPriorityColor(ticket.priority)
                        const statusColor = getStatusColor(ticket.status)
                        const tags = ticket.tags
                          ? typeof ticket.tags === 'string'
                            ? JSON.parse(ticket.tags)
                            : ticket.tags
                          : []

                        return (
                          <TableRow
                            key={ticket.id}
                            hover
                            sx={{
                              '&:hover': { bgcolor: '#f9fafb' },
                              cursor: 'pointer',
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {ticket.createdAt || ticket.created_at
                                  ? dayjs(
                                      ticket.createdAt || ticket.created_at,
                                    ).format('DD MMM YYYY')
                                  : 'N/A'}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {ticket.createdAt || ticket.created_at
                                  ? dayjs(
                                      ticket.createdAt || ticket.created_at,
                                    ).format('hh:mm A')
                                  : ''}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: '#06aee9',
                                  }}
                                >
                                  {assignedTo.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'U'}
                                </Avatar>
                                <Typography variant="body2">
                                  {assignedTo.fullName || 'Unassigned'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title={
                                  ticket.taskDescription ||
                                  ticket.task_description ||
                                  ''
                                }
                              >
                                {ticket.taskDescription ||
                                  ticket.task_description ||
                                  '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {ticket.category ? (
                                <Chip
                                  label={ticket.category}
                                  size="small"
                                  sx={{
                                    bgcolor: '#f3e5f5',
                                    color: '#7b1fa2',
                                    fontWeight: 500,
                                  }}
                                />
                              ) : (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={ticket.priority || 'Medium'}
                                size="small"
                                sx={{
                                  bgcolor: priorityColor.bg,
                                  color: priorityColor.text,
                                  border: `1px solid ${priorityColor.border}`,
                                  fontWeight: 500,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={ticket.status || 'OPEN'}
                                size="small"
                                sx={{
                                  bgcolor: statusColor.bg,
                                  color: statusColor.text,
                                  border: `1px solid ${statusColor.border}`,
                                  fontWeight: 500,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: '#10b981',
                                  }}
                                >
                                  {createdBy.fullName
                                    ?.charAt(0)
                                    ?.toUpperCase() || 'U'}
                                </Avatar>
                                <Typography variant="body2">
                                  {createdBy.fullName || 'Unknown'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, ticket)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid #e5e7eb',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Showing {(page - 1) * limit + 1} to{' '}
                    {Math.min(page * limit, pagination.total)} of{' '}
                    {pagination.total} tickets
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      size="small"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Create Ticket Modal */}
          <CreateTicketModal
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSuccess={async () => {
              // Reset to page 1 to show the newly created ticket (it appears at the top)
              setPage(1)
              // Clear all ticket-related cache entries
              queryClient.removeQueries({
                queryKey: ['tickets'],
                exact: false,
              })
              // Wait a moment for the backend to fully commit
              await new Promise((resolve) => setTimeout(resolve, 1000))
              // Force refetch with current filters
              await queryClient.refetchQueries({
                queryKey: ['tickets'],
                type: 'active',
                exact: false,
              })
              console.log('Tickets cache cleared and refetched after creation')
            }}
          />

          {/* Edit Ticket Modal */}
          <CreateTicketModal
            open={editModalOpen}
            ticket={selectedEditTicket}
            onClose={() => {
              setEditModalOpen(false)
              setSelectedEditTicket(null)
            }}
            onSuccess={async () => {
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({ queryKey: ['tickets'] })
              queryClient.invalidateQueries({ queryKey: ['ticketDetails'] })
              setEditModalOpen(false)
              setSelectedEditTicket(null)
            }}
          />

          {/* Ticket Details Modal */}
          <TicketDetailsModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false)
              setSelectedTicketId(null)
            }}
            ticketId={selectedTicketId}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
          />

          {/* Export Date Range Modal */}
          <Dialog
            open={exportDateModalOpen}
            onClose={() => setExportDateModalOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Export Tickets Report
                </Typography>
                <IconButton
                  onClick={() => setExportDateModalOpen(false)}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize="0.7rem"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    From Date
                  </Typography>
                  <DatePicker
                    value={exportFromDate}
                    onChange={(newValue) => setExportFromDate(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'Select from date',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                          },
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize="0.7rem"
                    sx={{ mb: 0.5, display: 'block' }}
                  >
                    To Date
                  </Typography>
                  <DatePicker
                    value={exportToDate}
                    onChange={(newValue) => setExportToDate(newValue)}
                    minDate={exportFromDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                        placeholder: 'Select to date',
                        sx: {
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                          },
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontSize="0.75rem"
                  >
                    Leave dates empty to export all tickets. Select date range
                    to filter by creation date.
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => setExportDateModalOpen(false)}
                variant="outlined"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExportTickets}
                variant="contained"
                size="small"
                sx={{
                  bgcolor: '#06aee9',
                  '&:hover': { bgcolor: '#0599d1' },
                  textTransform: 'none',
                }}
              >
                Export
              </Button>
            </DialogActions>
          </Dialog>

          {/* Action Menu */}
          <Menu
            anchorEl={actionMenuAnchor}
            open={Boolean(actionMenuAnchor)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleActionClick('view')}>
              <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
              View Details
            </MenuItem>
            <MenuItem onClick={() => handleActionClick('edit')}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            {selectedActionTicket?.status === 'COMPLETED' ||
            selectedActionTicket?.status === 'CLOSED' ? (
              <MenuItem onClick={() => handleActionClick('reopen')}>
                <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
                Re-open Issue
              </MenuItem>
            ) : (
              <MenuItem onClick={() => handleActionClick('updateStatus')}>
                <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
                Update Status
              </MenuItem>
            )}
            <MenuItem onClick={() => handleActionClick('updatePriority')}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Update Priority
            </MenuItem>
            {isAdmin && (
              <MenuItem
                onClick={() => handleActionClick('delete')}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            )}
          </Menu>

          {/* Comment Dialog */}
          <Dialog
            open={commentDialogOpen}
            onClose={handleCommentDialogClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              {pendingAction === 'edit' && 'Add Comment for Edit'}
              {pendingAction === 'updateStatus' &&
                'Add Comment for Status Update'}
              {pendingAction === 'updatePriority' &&
                'Add Comment for Priority Update'}
              {pendingAction === 'delete' && 'Add Comment for Delete'}
              {pendingAction === 'reopen' &&
                'Add Comment to Re-open Issue (Required)'}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label={
                  pendingAction === 'reopen' ? 'Comment (Required)' : 'Comment'
                }
                fullWidth
                multiline
                rows={4}
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={
                  pendingAction === 'reopen'
                    ? 'Enter a comment to reopen the issue (required)...'
                    : 'Enter a comment for this action...'
                }
                required={pendingAction === 'reopen'}
                error={pendingAction === 'reopen' && !actionComment.trim()}
                helperText={
                  pendingAction === 'reopen' && !actionComment.trim()
                    ? 'Comment is required to reopen the issue'
                    : ''
                }
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleCommentDialogClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleCommentSubmit}
                disabled={pendingAction === 'reopen' && !actionComment.trim()}
                sx={{ bgcolor: '#06aee9', '&:hover': { bgcolor: '#0599d1' } }}
              >
                Continue
              </Button>
            </DialogActions>
          </Dialog>

          {/* Status Selection Dialog */}
          <Dialog
            open={statusDialogOpen}
            onClose={() => {
              setStatusDialogOpen(false)
              setSelectedNewStatus('')
              setActionComment('')
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Select New Status</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedNewStatus}
                  onChange={(e) => setSelectedNewStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="OPEN">Open</MenuItem>
                  <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                  <MenuItem value="COMPLETED">Completed</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => {
                  setStatusDialogOpen(false)
                  setSelectedNewStatus('')
                  setActionComment('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleStatusConfirm}
                sx={{ bgcolor: '#06aee9', '&:hover': { bgcolor: '#0599d1' } }}
              >
                Update Status
              </Button>
            </DialogActions>
          </Dialog>

          {/* Priority Selection Dialog */}
          <Dialog
            open={priorityDialogOpen}
            onClose={() => {
              setPriorityDialogOpen(false)
              setSelectedNewPriority('')
              setActionComment('')
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Select New Priority</DialogTitle>
            <DialogContent>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={selectedNewPriority}
                  onChange={(e) => setSelectedNewPriority(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="LOW">Low</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HIGH">High</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                onClick={() => {
                  setPriorityDialogOpen(false)
                  setSelectedNewPriority('')
                  setActionComment('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handlePriorityConfirm}
                sx={{ bgcolor: '#06aee9', '&:hover': { bgcolor: '#0599d1' } }}
              >
                Update Priority
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </TabPanel>

      {/* Tasks Tab */}
      <TabPanel value={activeTab} index={1}>
        <TaskTracker />
      </TabPanel>
    </Box>
  )
}

export default Ticketing
