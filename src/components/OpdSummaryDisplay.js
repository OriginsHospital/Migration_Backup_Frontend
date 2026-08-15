import React, { useState } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import { Edit, Save } from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { getOpdSheetTemplate, updateOpdSheetTemplate } from '@/constants/apis'
import {
  extractOpdSummary,
  plainTextToSummaryHtml,
  replaceOpdSummaryInTemplate,
  summaryHtmlToPlainText,
} from '@/utils/opdSheetUtils'
import { toastconfig } from '@/utils/toastconfig'

function OpdSummaryDisplay({ patientId, className = '', editable = true }) {
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['opdSheetSummary', patientId],
    queryFn: () => getOpdSheetTemplate(user.accessToken, patientId),
    enabled: !!patientId && !!user?.accessToken,
  })

  const fullTemplate = data?.data?.template || ''
  const summaryContent = extractOpdSummary(fullTemplate)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newSummaryHtml = plainTextToSummaryHtml(editValue)
      const updatedTemplate = replaceOpdSummaryInTemplate(
        fullTemplate,
        newSummaryHtml,
      )
      return updateOpdSheetTemplate(
        user.accessToken,
        patientId,
        updatedTemplate,
      )
    },
    onSuccess: (res) => {
      if (res?.status === 200) {
        toast.success('Summary updated successfully', toastconfig)
        queryClient.invalidateQueries({
          queryKey: ['opdSheetSummary', patientId],
        })
        queryClient.invalidateQueries({ queryKey: ['opdSheet', patientId] })
        setIsEditing(false)
        setEditValue('')
        return
      }
      toast.error(res?.message || 'Failed to update summary', toastconfig)
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to update summary', toastconfig)
    },
  })

  const handleStartEdit = () => {
    setEditValue(summaryHtmlToPlainText(summaryContent || ''))
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleSave = () => {
    if (!fullTemplate) {
      toast.error('OPD sheet template is not available', toastconfig)
      return
    }
    saveMutation.mutate()
  }

  if (!patientId) return null

  if (isLoading) {
    return (
      <Box className={`flex items-center gap-2 py-2 ${className}`}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          Loading summary...
        </Typography>
      </Box>
    )
  }

  if (isError || !fullTemplate) return null

  const hasSummary = !!summaryContent

  return (
    <Box className={`mb-3 ${className}`}>
      <div
        style={{
          backgroundColor: '#000',
          color: '#fff',
          padding: '8px 12px',
          position: 'relative',
          minHeight: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          SUMMARY
        </span>
        {editable && !isEditing && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit fontSize="small" />}
            onClick={handleStartEdit}
            sx={{
              position: 'absolute',
              right: 12,
              color: '#fff',
              borderColor: 'rgba(255,255,255,0.7)',
              minWidth: 'auto',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#fff',
                backgroundColor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            Edit
          </Button>
        )}
        {editable && isEditing && (
          <Box
            className="flex items-center gap-2"
            sx={{ position: 'absolute', right: 12 }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={handleCancelEdit}
              disabled={saveMutation.isPending}
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.7)',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#fff',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={
                saveMutation.isPending ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <Save fontSize="small" />
                )
              }
              onClick={handleSave}
              disabled={saveMutation.isPending}
              sx={{ textTransform: 'none' }}
            >
              Save
            </Button>
          </Box>
        )}
      </div>

      {isEditing ? (
        <TextField
          multiline
          minRows={8}
          fullWidth
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Enter patient summary..."
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 0,
              bgcolor: '#fff',
            },
          }}
        />
      ) : (
        <Box
          sx={{
            border: '1px solid #000',
            p: 1.5,
            minHeight: 60,
            bgcolor: '#fff',
            '& table': { width: '100%', borderCollapse: 'collapse' },
            '& td, & th': { border: '1px solid #ccc', p: 1 },
          }}
        >
          {hasSummary ? (
            <Box dangerouslySetInnerHTML={{ __html: summaryContent }} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No summary added yet.
              {editable && ' Click Edit to add summary.'}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  )
}

export default OpdSummaryDisplay
