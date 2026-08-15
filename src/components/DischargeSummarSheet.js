import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Typography, Paper, Button, CircularProgress } from '@mui/material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import dynamic from 'next/dynamic'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PrintIcon from '@mui/icons-material/Print'
import {
  getDischargeSummaryTemplate,
  updateDischargeSummaryTemplate,
  uploadDischargeSummaryImage,
} from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { closeModal } from '@/redux/modalSlice'
import { toast } from 'react-toastify'
import {
  printDischargeSummary,
  toBlackAndWhiteHtml,
} from '@/utils/dischargeSummaryPrint'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]

function DischargeSummarSheet({ TreatmentCycleId }) {
  const user = useSelector((store) => store.user)
  const [template, setTemplate] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const dispatch = useDispatch()
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)

  const {
    data: dischargeSummaryTemplate,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dischargeSummaryTemplate', TreatmentCycleId],
    queryFn: () =>
      getDischargeSummaryTemplate(user.accessToken, TreatmentCycleId),
    enabled: !!TreatmentCycleId && !!user.accessToken,
  })

  useEffect(() => {
    if (dischargeSummaryTemplate?.data) {
      setTemplate(toBlackAndWhiteHtml(dischargeSummaryTemplate.data.template))
    }
  }, [dischargeSummaryTemplate])

  const handleTemplateChange = (value) => {
    setTemplate(value)
  }

  const handleUpdate = useMutation({
    mutationFn: async () => {
      const res = await updateDischargeSummaryTemplate(
        user.accessToken,
        TreatmentCycleId,
        toBlackAndWhiteHtml(template),
      )
      if (res.status === 200) {
        toast.success('Discharge summary updated successfully', toastconfig)
      }
      return res
    },
  })

  const handlePrint = useCallback(() => {
    const editorHtml = editorRef.current?.value || template
    const printed = printDischargeSummary(editorHtml)
    if (!printed) {
      toast.error('Unable to print. Allow pop-ups and try again.', toastconfig)
    }
  }, [template])

  const insertImageIntoEditor = (imageUrl) => {
    if (!imageUrl) return

    const editor = editorRef.current
    const imageHtml = `<p><img src="${imageUrl}" alt="Discharge summary image" style="max-width:100%;height:auto;" /></p>`

    if (editor?.s?.insertHTML) {
      editor.s.insertHTML(imageHtml)
      setTemplate(editor.value || template)
      return
    }

    setTemplate((prev) => `${prev || ''}${imageHtml}`)
  }

  const handleImageFileSelect = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(
        'Please upload a valid image file (JPEG, PNG, GIF, or WEBP)',
        toastconfig,
      )
      return
    }

    setIsUploadingImage(true)
    try {
      const response = await uploadDischargeSummaryImage(
        user.accessToken,
        TreatmentCycleId,
        file,
      )

      const imageUrl =
        response?.data?.files?.[0] ||
        response?.data?.path ||
        response?.data?.imageUrl

      if (!response?.success || !imageUrl) {
        toast.error(response?.message || 'Failed to upload image', toastconfig)
        return
      }

      insertImageIntoEditor(imageUrl)
      toast.success('Image added to discharge summary', toastconfig)
    } catch (uploadError) {
      console.error('Discharge summary image upload failed:', uploadError)
      toast.error('Failed to upload image', toastconfig)
    } finally {
      setIsUploadingImage(false)
    }
  }

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      height: 480,
      enableDragAndDropFileToEditor: true,
      askBeforePasteHTML: false,
      uploader: {
        insertImageAsBase64URL: false,
        url: `${process.env.NEXT_PUBLIC_API_BASE_URL}/patients/uploadDischargeSummaryImage/${TreatmentCycleId}`,
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        format: 'json',
        withCredentials: true,
        isSuccess: (resp) => resp?.success === true,
        getMessage: (resp) => resp?.message || 'Image upload failed',
        process: (resp) => {
          const imageUrl =
            resp?.data?.files?.[0] || resp?.data?.path || resp?.data?.imageUrl

          return {
            files: imageUrl ? [imageUrl] : [],
            path: imageUrl || '',
            baseurl: '',
            error: imageUrl ? 0 : 1,
            msg: resp?.message || '',
          }
        },
      },
      // Use dedicated Print button — Jodit print can scale/blur and hide colored headers
      removeButtons: ['video', 'print'],
      showXPathInStatusbar: false,
    }),
    [TreatmentCycleId, user.accessToken],
  )

  if (isLoading) {
    return <Typography>Loading discharge summary...</Typography>
  }

  if (error) {
    return (
      <Typography color="error">
        Error loading discharge summary: {error.message}
      </Typography>
    )
  }

  return (
    <div className="p-4">
      <Typography variant="h6" gutterBottom>
        Discharge Summary Sheet
      </Typography>
      <div className="flex flex-wrap justify-end gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleImageFileSelect}
        />
        <Button
          color="secondary"
          variant="outlined"
          startIcon={
            isUploadingImage ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ImageOutlinedIcon />
            )
          }
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage || handleUpdate.isPending}
        >
          {isUploadingImage ? 'Uploading Image...' : 'Add Image'}
        </Button>
        <Button
          color="inherit"
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          disabled={!template?.trim()}
        >
          Print
        </Button>
        <Button
          color="primary"
          variant="outlined"
          onClick={handleUpdate.mutate}
          disabled={handleUpdate.isPending || isUploadingImage}
        >
          Update Sheet
        </Button>
        <Button
          color="error"
          variant="outlined"
          onClick={() => dispatch(closeModal())}
        >
          Close
        </Button>
      </div>

      <Typography variant="body2" color="text.secondary" className="mt-2">
        Use the image toolbar button, drag and drop, or Add Image to include
        photos in the discharge summary. Click Print for a clear black-and-white
        copy, or Update Sheet to save.
      </Typography>

      <Paper className="m-4 p-4">
        <JoditEditor
          ref={editorRef}
          value={template}
          config={editorConfig}
          onBlur={handleTemplateChange}
          onChange={handleTemplateChange}
        />
      </Paper>
    </div>
  )
}

export default DischargeSummarSheet
