import React, { useRef, useState, useEffect } from 'react'
import {
  Button,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  Alert,
} from '@mui/material'
import { CameraAlt, CloudUpload, Close, PhotoCamera } from '@mui/icons-material'
import Modal from './Modal'
import { useDispatch } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'

const ProfilePictureModal = ({ onImageSelect }) => {
  const [cameraStream, setCameraStream] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const dispatch = useDispatch()

  // Initialize camera when showCamera becomes true
  useEffect(() => {
    if (showCamera) {
      initializeCamera()
    }
  }, [showCamera])

  // Cleanup camera stream when component unmounts or modal closes
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const initializeCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCameraStream(stream)
    } catch (err) {
      console.error('Camera access error:', err)
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera access to take a photo.'
          : 'Failed to access camera. Please make sure your device has a working camera.',
      )
      setShowCamera(false)
    }
  }

  const handleFileUpload = event => {
    const file = event.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (JPG, PNG)')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        onImageSelect(reader.result, file)
        handleClose()
      }
      reader.readAsDataURL(file)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return

    try {
      const video = videoRef.current
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        blob => {
          if (!blob) {
            setError('Failed to capture photo. Please try again.')
            return
          }

          const file = new File([blob], 'profile-picture.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          const reader = new FileReader()
          reader.onloadend = () => {
            onImageSelect(reader.result, file)
            handleClose()
          }
          reader.readAsDataURL(blob)
        },
        'image/jpeg',
        0.8,
      )
    } catch (err) {
      console.error('Capture error:', err)
      setError('Failed to capture photo. Please try again.')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop()
      })
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraStream(null)
    }
  }

  const handleClose = () => {
    stopCamera()
    setShowCamera(false)
    setError(null)
    dispatch(closeModal('profilePicture'))
  }

  const startCamera = () => {
    setShowCamera(true)
  }

  return (
    <Modal uniqueKey="profilePicture" maxWidth="sm" closeOnOutsideClick={false}>
      <DialogTitle className="flex justify-between items-center">
        <Typography variant="h6">Update Profile Picture</Typography>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        {!showCamera ? (
          <Grid container spacing={3} className="p-4">
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current.click()}
                className="p-8 flex flex-col gap-2"
              >
                <Typography>Upload Picture</Typography>
                <Typography variant="caption">
                  Choose from your files
                </Typography>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CameraAlt />}
                onClick={startCamera}
                className="p-8 flex flex-col gap-2"
              >
                <Typography>Take Picture</Typography>
                <Typography variant="caption">
                  Use your device camera
                </Typography>
              </Button>
            </Grid>
          </Grid>
        ) : (
          <div className="flex flex-col items-center gap-4 p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ maxHeight: '60vh' }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="contained"
                color="primary"
                onClick={capturePhoto}
                startIcon={<PhotoCamera />}
                disabled={!cameraStream}
              >
                Capture
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  stopCamera()
                  setShowCamera(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Modal>
  )
}

export default ProfilePictureModal
