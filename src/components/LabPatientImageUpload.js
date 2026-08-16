import React, { useRef } from 'react'
import { Button, IconButton, Typography } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { Close, Delete, OpenInNew } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import Modal from '@/components/Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
import {
  deleteLabPatientImage,
  getLabPatientImages,
  uploadLabPatientImages,
} from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'

export function isAntenatalVisit(visitTypeId, visitTypeName) {
  const typeName = String(visitTypeName || '').toLowerCase()
  return Number(visitTypeId) === 2 || typeName.includes('antenatal')
}

function LabPatientImageModal({ appointmentId, type, imageType, modalKey }) {
  const user = useSelector((store) => store.user)
  const modal = useSelector((store) => store.modal)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const isModalOpen = modal.key === modalKey

  const { data: images = [], isFetching } = useQuery({
    queryKey: ['labPatientImages', appointmentId, type, imageType],
    enabled: isModalOpen && !!appointmentId && !!type && !!imageType,
    queryFn: async () => {
      const response = await getLabPatientImages(
        user.accessToken,
        appointmentId,
        type,
        imageType,
      )
      if (response.status === 200) {
        return response.data || []
      }
      throw new Error(response.message || 'Failed to fetch images')
    },
  })

  const { mutate: uploadMutation, isPending: isUploading } = useMutation({
    mutationFn: async (files) => {
      const formData = new FormData()
      formData.append('appointmentId', appointmentId)
      formData.append('type', type)
      formData.append('imageType', imageType)
      files.forEach((file) => {
        formData.append('labPatientImages', file)
      })
      const response = await uploadLabPatientImages(user.accessToken, formData)
      if (response.status === 200) {
        return response.data
      }
      throw new Error(response.message || 'Failed to upload image')
    },
    onSuccess: () => {
      toast.success(`${imageType} image uploaded successfully`, toastconfig)
      queryClient.invalidateQueries([
        'labPatientImages',
        appointmentId,
        type,
        imageType,
      ])
      queryClient.invalidateQueries(['LabtestsByDate'])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload image', toastconfig)
    },
  })

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: async (imageId) => {
      const response = await deleteLabPatientImage(user.accessToken, imageId)
      if (response.status === 200) {
        return response.data
      }
      throw new Error(response.message || 'Failed to delete image')
    },
    onSuccess: () => {
      toast.success(`${imageType} image deleted successfully`, toastconfig)
      queryClient.invalidateQueries([
        'labPatientImages',
        appointmentId,
        type,
        imageType,
      ])
      queryClient.invalidateQueries(['LabtestsByDate'])
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete image', toastconfig)
    },
  })

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const invalidFile = files.find(
      (file) =>
        !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
          file.type,
        ),
    )
    if (invalidFile) {
      toast.error(
        'Please upload JPG, JPEG, PNG or WEBP images only',
        toastconfig,
      )
      event.target.value = ''
      return
    }

    const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024)
    if (oversizedFile) {
      toast.error('Each image must be less than 5MB', toastconfig)
      event.target.value = ''
      return
    }

    uploadMutation(files)
  }

  return (
    <Modal uniqueKey={modalKey} maxWidth="md" closeOnOutsideClick={false}>
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6">{`Upload ${imageType}`}</Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id={`${modalKey}-file-upload`}
          disabled={isUploading}
        />
        <label htmlFor={`${modalKey}-file-upload`} className="cursor-pointer">
          <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="body1" mt={1}>
            {isUploading
              ? 'Uploading...'
              : `Click to upload ${imageType} images`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            JPG, JPEG, PNG or WEBP (max. 5MB)
          </Typography>
        </label>
      </div>

      {isFetching && images.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Loading images...
        </Typography>
      ) : images.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No {imageType} images uploaded yet.
        </Typography>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative border rounded p-1 bg-white"
            >
              <img
                src={image.imageUrl}
                alt={`${imageType} ${image.id}`}
                className="w-full h-36 object-cover rounded"
              />
              <div className="absolute top-1 right-1 flex gap-1">
                <IconButton
                  size="small"
                  sx={{ bgcolor: 'white' }}
                  onClick={() => window.open(image.imageUrl, '_blank')}
                  title="Open image"
                >
                  <OpenInNew fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  sx={{ bgcolor: 'white' }}
                  disabled={isDeleting}
                  onClick={() => {
                    if (confirm(`Delete this ${imageType} image?`)) {
                      deleteMutation(image.id)
                    }
                  }}
                  title="Delete image"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function LabPatientImageUpload({
  appointmentId,
  type,
  isSpouse,
  visitTypeId,
  visitType,
  category,
  ecgImageCount = 0,
  nstImageCount = 0,
}) {
  const dispatch = useDispatch()
  const antenatal = isAntenatalVisit(visitTypeId, visitType)

  if (String(category) !== '0') {
    return null
  }

  const imageTypes = antenatal ? ['ECG', 'NST'] : ['ECG']

  return (
    <div
      className="flex items-center gap-1 mr-2"
      onClick={(event) => event.stopPropagation()}
      onFocus={(event) => event.stopPropagation()}
    >
      {imageTypes.map((imageType) => {
        const modalKey = `lab-image-${appointmentId}-${type}-${isSpouse}-${imageType}`
        const count =
          imageType === 'ECG' ? Number(ecgImageCount) : Number(nstImageCount)
        return (
          <React.Fragment key={modalKey}>
            <Button
              size="small"
              variant={count > 0 ? 'contained' : 'outlined'}
              sx={{ minWidth: 'auto', px: 1, whiteSpace: 'nowrap' }}
              onClick={(event) => {
                event.stopPropagation()
                dispatch(openModal(modalKey))
              }}
            >
              {count > 0 ? `${imageType} (${count})` : imageType}
            </Button>
            <LabPatientImageModal
              appointmentId={appointmentId}
              type={type}
              imageType={imageType}
              modalKey={modalKey}
            />
          </React.Fragment>
        )
      })}
    </div>
  )
}
