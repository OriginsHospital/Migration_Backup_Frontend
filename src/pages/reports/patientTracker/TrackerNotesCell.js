import React from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import NotesIcon from '@mui/icons-material/Notes'

const stripHtml = (value) =>
  String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Truncated last-appointment notes. Click to view the full text in a popup.
 */
const TrackerNotesCell = ({ notes = '', onOpen }) => {
  const text = stripHtml(notes)

  if (!text) {
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    )
  }

  return (
    <Box
      sx={{ width: '100%', minWidth: 0, py: 0.5, cursor: 'pointer' }}
      onClick={(e) => {
        e.stopPropagation()
        onOpen?.(text)
      }}
    >
      <Typography
        variant="body2"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
          color: 'primary.main',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '3px',
        }}
      >
        {text}
      </Typography>
    </Box>
  )
}

export const TrackerNotesViewDialog = ({
  open,
  notes = '',
  patientName = '',
  patientId = '',
  onClose,
}) => {
  const text = stripHtml(notes)
  const name = patientName && patientName !== '-' ? patientName : 'Patient'
  const id = patientId && patientId !== '-' ? patientId : '—'

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          bgcolor: '#eef7fb',
          py: 1.25,
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}
        >
          <NotesIcon color="primary" />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Appointment notes
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {name} · {id}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Typography
          variant="body2"
          sx={{
            mt: 1.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.6,
          }}
        >
          {text || '-'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 1.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TrackerNotesCell
