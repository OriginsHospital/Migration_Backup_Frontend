import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useMemo,
} from 'react'
import {
  Grid,
  TextField,
  Card,
  Autocomplete,
  Button,
  IconButton,
} from '@mui/material'
import { CloudUpload, Delete, OpenInNew } from '@mui/icons-material'

const GuardianFrom = forwardRef(
  ({ formData, setFormData, isEdit, bloodGroupOptions }, ref) => {
    const [errors, setErrors] = useState({})
    const spouseAadhaarRef = useRef()

    useEffect(() => {
      // Clear errors when guardian data is loaded or form is non-editable
      if (formData?.guardianDetails?.id || isEdit === 'noneditable') {
        setErrors({})
      }
    }, [formData?.guardianDetails?.id, isEdit])

    const validateGuardianForm = () => {
      const newErrors = {}
      const guardianDetails = formData.guardianDetails || {}

      if (!guardianDetails.name?.trim()) newErrors.name = 'Required'
      if (!guardianDetails.age) newErrors.age = 'Required'
      if (
        guardianDetails.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianDetails.email)
      ) {
        newErrors.email = 'Invalid email format'
      }
      if (
        guardianDetails.aadhaarNo &&
        !/^\d{12}$/.test(guardianDetails.aadhaarNo)
      ) {
        newErrors.aadhaarNo = 'Aadhaar number must be 12 digits'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    useImperativeHandle(ref, () => ({
      validateGuardianForm: () => {
        return validateGuardianForm()
      },
    }))

    const handleChange = (e) => {
      const { name, value } = e.target
      setErrors((prev) => ({ ...prev, [name]: '' }))

      if (name == 'hasGuardianInfo') {
        setFormData({
          ...formData,
          hasGuardianInfo: e.target.checked,
          guardianDetails: {
            name: '',
            age: '',
            // relation: 'Spouse',
            // gender: 'Male',
            additionalDetails: '',
            bloodGroup: null,
          },
        })
      } else {
        setFormData({
          ...formData,
          guardianDetails: { ...formData?.guardianDetails, [name]: value },
        })
      }
    }

    const handleSpouseAadhaarUpload = (event) => {
      const file = event.target.files?.[0]
      if (!file) return
      setFormData({
        ...formData,
        spouseAadhaarPhoto: file,
      })
      event.target.value = null
    }

    const removeSpouseAadhaar = () => {
      setFormData({
        ...formData,
        spouseAadhaarPhoto: null,
        spouseAadhaarPhotoUrl: '',
      })
    }

    const spouseAadhaarName =
      formData?.spouseAadhaarPhoto?.name ||
      (formData?.spouseAadhaarPhotoUrl
        ? String(formData?.spouseAadhaarPhotoUrl).split('/').pop()
        : '')
    const spouseAadhaarPreviewUrl = useMemo(() => {
      if (formData?.spouseAadhaarPhoto instanceof File) {
        return URL.createObjectURL(formData.spouseAadhaarPhoto)
      }
      return formData?.spouseAadhaarPhotoUrl || ''
    }, [formData?.spouseAadhaarPhoto, formData?.spouseAadhaarPhotoUrl])

    useEffect(() => {
      return () => {
        if (
          spouseAadhaarPreviewUrl &&
          String(spouseAadhaarPreviewUrl).startsWith('blob:')
        ) {
          URL.revokeObjectURL(spouseAadhaarPreviewUrl)
        }
      }
    }, [spouseAadhaarPreviewUrl])

    return (
      <Card className="w-full max-w-4xl  flex flex-col gap-2 p-5">
        <>
          <span className="text-lg font-semibold">Spouse Details</span>
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Spouse Name"
                fullWidth
                name="name"
                value={formData.guardianDetails?.name}
                onChange={handleChange}
                disabled={isEdit == 'noneditable'}
                className="bg-white rounded-lg"
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Spouse Age"
                fullWidth
                name="age"
                value={formData?.guardianDetails?.age}
                onChange={handleChange}
                disabled={isEdit == 'noneditable'}
                className="bg-white rounded-lg"
                type="number"
                error={!!errors.age}
                helperText={errors.age}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                name="email"
                value={formData.guardianDetails?.email}
                onChange={handleChange}
                disabled={isEdit == 'noneditable'}
                className="bg-white rounded-lg"
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Aadhaar No"
                fullWidth
                name="aadhaarNo"
                value={formData.guardianDetails?.aadhaarNo}
                onChange={handleChange}
                disabled={isEdit == 'noneditable'}
                className="bg-white rounded-lg"
                error={!!errors.aadhaarNo}
                helperText={errors.aadhaarNo}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                fullWidth
                options={bloodGroupOptions}
                value={formData.guardianDetails?.bloodGroup || null}
                onChange={(_, newValue) => {
                  setFormData({
                    ...formData,
                    guardianDetails: {
                      ...formData?.guardianDetails,
                      bloodGroup: newValue,
                    },
                  })
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Blood Group"
                    className="bg-white rounded-lg"
                    error={!!errors.bloodGroup}
                    helperText={errors.bloodGroup}
                  />
                )}
                disabled={isEdit === 'noneditable'}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <TextField
                label="Additional Information"
                fullWidth
                name="additionalDetails"
                value={formData?.guardianDetails?.additionalDetails}
                onChange={handleChange}
                disabled={isEdit == 'noneditable'}
                className="bg-white rounded-lg"
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={12}>
              <input
                type="file"
                ref={spouseAadhaarRef}
                name="spouseAadhaarPhoto"
                accept=".jpg,.jpeg,.png,.pdf"
                className="hidden"
                onChange={handleSpouseAadhaarUpload}
              />
              <div className="flex items-center gap-2">
                {isEdit !== 'noneditable' && (
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => spouseAadhaarRef.current?.click()}
                  >
                    Upload Spouse Aadhaar Photo
                  </Button>
                )}
                {spouseAadhaarPreviewUrl && (
                  <Button
                    variant="text"
                    startIcon={<OpenInNew />}
                    onClick={() =>
                      window.open(spouseAadhaarPreviewUrl, '_blank')
                    }
                  >
                    View
                  </Button>
                )}
                {spouseAadhaarPreviewUrl && isEdit !== 'noneditable' && (
                  <IconButton onClick={removeSpouseAadhaar} size="small">
                    <Delete />
                  </IconButton>
                )}
              </div>
              {!!spouseAadhaarName && (
                <p className="text-sm text-gray-600 mt-1">
                  {spouseAadhaarName}
                </p>
              )}
            </Grid>
          </Grid>
        </>
      </Card>
    )
  },
)

GuardianFrom.displayName = 'GuardianFrom'

export default GuardianFrom
