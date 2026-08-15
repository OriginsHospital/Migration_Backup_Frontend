import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Image from 'next/image'
import dayjs from 'dayjs'
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Checkbox,
  Autocomplete,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import {
  CameraAlt,
  Close,
  CloudUpload,
  Delete,
  FilePresentOutlined,
  OpenInBrowser,
  OpenInNew,
} from '@mui/icons-material'
import Link from 'next/link'
import defaultProfile from '../../public/dummyProfile.jpg'
import ProfilePictureModal from './ProfilePictureModal'
import { closeModal, openModal } from '@/redux/modalSlice'
import Modal from './Modal'

const PatientForm = forwardRef(
  (
    {
      formData,
      setFormData,
      isEdit,
      cities,
      uploadProfile,
      photo,
      imagePreview,
      uploadedDocuments,
      setUploadedDocuments,
      setPhoto,
      setImagePreview,
      bloodGroupOptions,
      onAgeValidationChange,
    },
    ref,
  ) => {
    const dropdowns = useSelector((store) => store.dropdowns)
    const [errors, setErrors] = useState({})
    const [ageValidationMessage, setAgeValidationMessage] = useState('')
    const [isAgeValid, setIsAgeValid] = useState(true)
    const imgInput = useRef()
    const dispatch = useDispatch()
    const docAadhaarRef = useRef()
    const docMarriageRef = useRef()
    const docAffidavitRef = useRef()

    useEffect(() => {
      // Clear errors when patient data is loaded or form is in non-editable mode
      if (formData?.id || isEdit === 'noneditable') {
        setErrors({})
      }
    }, [formData?.id, isEdit])

    const patientTypeLookup = useMemo(() => {
      if (!dropdowns?.patientTypeList) return {}
      return dropdowns.patientTypeList.reduce((acc, type) => {
        acc[type.id] = type.name?.toUpperCase() || ''
        return acc
      }, {})
    }, [dropdowns?.patientTypeList])

    const calculateAge = useCallback((dob) => {
      if (!dob) return null
      const birthDate = dayjs(dob)
      if (!birthDate.isValid()) return null
      return dayjs().diff(birthDate, 'year')
    }, [])

    const requiresAdultAge = useMemo(() => {
      if (!formData?.patientTypeId) return false
      const typeName = patientTypeLookup[formData.patientTypeId]
      return typeName === 'FER' || typeName === 'ANC'
    }, [formData?.patientTypeId, patientTypeLookup])

    const validateAgeRestriction = useCallback(
      ({ nextDob, nextPatientTypeId }) => {
        const dob = nextDob ?? formData?.dateOfBirth
        const patientTypeId = nextPatientTypeId ?? formData?.patientTypeId

        if (!dob || !patientTypeId) {
          setAgeValidationMessage('')
          setIsAgeValid(true)
          return
        }

        const typeName = patientTypeLookup[patientTypeId]
        const age = calculateAge(dob)

        if (!typeName || age === null) {
          setAgeValidationMessage('')
          setIsAgeValid(true)
          return
        }

        const adultRestricted = typeName === 'FER' || typeName === 'ANC'

        if (adultRestricted && age < 18) {
          setAgeValidationMessage(
            'Patient must be at least 18 years old for the selected type.',
          )
          setIsAgeValid(false)
        } else {
          setAgeValidationMessage('')
          setIsAgeValid(true)
        }
      },
      [
        calculateAge,
        formData?.dateOfBirth,
        formData?.patientTypeId,
        patientTypeLookup,
      ],
    )

    useEffect(() => {
      validateAgeRestriction({})
    }, [formData?.dateOfBirth, formData?.patientTypeId, validateAgeRestriction])

    const validateForm = () => {
      const newErrors = {}

      const requiredFields = [
        'firstName',
        'lastName',
        'dateOfBirth',
        'mobileNo',
        // 'email',
        'aadhaarNo',
        'addressLine1',
        'addressLine2',
        'stateId',
        'cityId',
        'pincode',
        'maritalStatus',
        'referralId',
        'branchId',
        'patientTypeId',
      ]

      requiredFields.forEach((field) => {
        if (
          !formData[field] ||
          (typeof formData[field] === 'string' && !formData[field].trim())
        )
          newErrors[field] = `Required`
      })

      // Document validation
      if (!formData.aadhaarCard && isEdit !== 'noneditable') {
        newErrors.aadhaarCard = 'Aadhaar Card document is required'
      }

      // Format validations
      // if (
      //   formData.email &&
      //   !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
      // ) {
      //   newErrors.email = 'Invalid email format'
      // }
      if (formData.mobileNo && !/^\d{10}$/.test(formData.mobileNo)) {
        newErrors.mobileNo = 'Mobile Number must be 10 digits'
      }
      if (formData.aadhaarNo && !/^\d{12}$/.test(formData.aadhaarNo)) {
        newErrors.aadhaarNo = 'Aadhaar Number must be 12 digits'
      }
      if (!isAgeValid) {
        newErrors.dateOfBirth =
          ageValidationMessage ||
          'Patient must be at least 18 years old for the selected type.'
      }

      if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
        newErrors.pincode = 'Pincode must be 6 digits'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    useEffect(() => {
      if (typeof onAgeValidationChange === 'function') {
        onAgeValidationChange({
          isValid: isAgeValid,
          message: ageValidationMessage,
          requiresAdult: requiresAdultAge,
        })
      }
    }, [
      isAgeValid,
      ageValidationMessage,
      requiresAdultAge,
      onAgeValidationChange,
    ])

    const handleChange = (name, value) => {
      setErrors((prev) => ({ ...prev, [name]: '' }))

      let updatedForm = { ...formData }
      if (name === 'maritalStatus') {
        updatedForm = {
          ...updatedForm,
          [name]: value,
          hasGuardianInfo: value == 'Married',
        }
      } else {
        updatedForm = { ...updatedForm, [name]: value }
      }

      setFormData(updatedForm)

      if (name === 'dateOfBirth') {
        validateAgeRestriction({ nextDob: value })
      }

      if (name === 'patientTypeId') {
        validateAgeRestriction({ nextPatientTypeId: value })
      }
    }

    const handlePhotoUpload = () => {
      dispatch(openModal('profilePicture'))
    }

    const handleDocumentUpload = (docRef) => {
      docRef.current.click()
      console.log('uploading')
    }

    const handleDocumentChange = (event) => {
      const file = event.target.files[0]
      console.log(
        formData,
        event.target.name,
        typeof event.target.files[0],
        isEdit,
      )
      // setUploadedDocuments(prevDocs => [...prevDocs, ...files])
      setFormData({ ...formData, [event.target.name]: file })
    }

    const handleRemoveDocument = (docName) => {
      // const updatedDocs = uploadedDocuments.filter((_, i) => i !== index)
      // setUploadedDocuments(updatedDocs)
      setFormData({ ...formData, [docName]: null })
      setUploadedDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.name !== docName),
      )
    }
    // useEffect(() => {
    //   console.log(imagePreview, photo)
    // }, [])

    useImperativeHandle(ref, () => ({
      validateForm: () => {
        return validateForm()
      },
    }))

    const formatNames = (value) => {
      if (value)
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      return ''
    }

    return (
      <Card className="w-full max-w-full col-span-2">
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 cursor-pointer"
                onClick={() => dispatch(openModal('profileFullScreen'))}
              >
                <img
                  src={imagePreview || photo?.src}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
              {isEdit !== 'noneditable' && (
                <IconButton
                  className="absolute bottom-0 right-0 bg-white shadow-md"
                  onClick={handlePhotoUpload}
                  size="small"
                >
                  <CameraAlt className="text-gray-600" />
                </IconButton>
              )}
            </div>
          </div>
          <ProfilePictureModal
            onImageSelect={(preview, file) => {
              setImagePreview(preview)
              setPhoto(file)
              if (uploadProfile) {
                const event = { target: { files: [file] } }
                uploadProfile(event)
              }
            }}
          />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  handleChange('lastName', formatNames(e.target.value))
                }
                disabled={isEdit === 'noneditable'}
                error={!!errors.lastName}
                helperText={errors.lastName}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  handleChange('firstName', formatNames(e.target.value))
                }
                disabled={isEdit === 'noneditable'}
                error={!!errors.firstName}
                helperText={errors.firstName}
                variant="outlined"
                className="bg-white"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <FormControl fullWidth variant="outlined" className="bg-white">
                  <DatePicker
                    label={`DoB ${
                      formData.dateOfBirth
                        ? '(age:' +
                          dayjs().diff(dayjs(formData.dateOfBirth), 'year') +
                          ' years)'
                        : ''
                    }`}
                    value={
                      formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null
                    }
                    onChange={(date) =>
                      handleChange(
                        'dateOfBirth',
                        date ? date.format('YYYY-MM-DD') : '',
                      )
                    }
                    format="DD-MM-YYYY"
                    disabled={isEdit === 'noneditable'}
                    slotProps={{
                      textField: {
                        error: !!errors.dateOfBirth || !isAgeValid,
                        helperText:
                          errors.dateOfBirth ||
                          (!isAgeValid && ageValidationMessage) ||
                          '',
                        required: true,
                      },
                    }}
                  />
                  {!isAgeValid && !errors.dateOfBirth && (
                    <Typography
                      variant="caption"
                      color="error"
                      className="mt-1"
                    >
                      {ageValidationMessage}
                    </Typography>
                  )}
                </FormControl>
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Autocomplete
                fullWidth
                options={bloodGroupOptions}
                value={formData.bloodGroup || null}
                onChange={(_, newValue) => handleChange('bloodGroup', newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Blood Group"
                    variant="outlined"
                    className="bg-white"
                    error={!!errors.bloodGroup}
                    helperText={errors.bloodGroup}
                  />
                )}
                disabled={isEdit === 'noneditable'}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Mobile Number"
                name="mobileNo"
                value={formData.mobileNo}
                type="number"
                onChange={(e) => handleChange('mobileNo', e.target.value)}
                disabled={isEdit === 'noneditable'}
                error={!!errors.mobileNo}
                helperText={errors.mobileNo}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={isEdit === 'noneditable'}
                error={!!errors.email}
                helperText={errors.email}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Aadhaar Number"
                name="aadhaarNo"
                value={formData.aadhaarNo}
                onChange={(e) => handleChange('aadhaarNo', e.target.value)}
                disabled={isEdit === 'noneditable'}
                error={!!errors.aadhaarNo}
                helperText={errors.aadhaarNo}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Address Line 1"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={(e) => handleChange('addressLine1', e.target.value)}
                disabled={isEdit === 'noneditable'}
                error={!!errors.addressLine1}
                helperText={errors.addressLine1}
                variant="outlined"
                className="bg-white"
                // multiline={true}
                // minRows={2}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Address Line 2"
                name="addressLine2"
                // multiline={true}
                // minRows={2}
                value={formData.addressLine2}
                onChange={(e) => handleChange('addressLine2', e.target.value)}
                disabled={isEdit === 'noneditable'}
                error={!!errors.addressLine2}
                helperText={errors.addressLine2}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl
                fullWidth
                variant="outlined"
                className="bg-white"
                error={!!errors.stateId}
              >
                <InputLabel>State</InputLabel>
                <Select
                  label="State"
                  name="stateId"
                  value={formData.stateId}
                  onChange={(e) => handleChange('stateId', e.target.value)}
                  disabled={isEdit === 'noneditable'}
                >
                  {dropdowns?.states?.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
                {!!errors.stateId && (
                  <FormHelperText>{errors.stateId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl
                fullWidth
                variant="outlined"
                className="bg-white"
                error={!!errors.cityId}
              >
                <InputLabel>City</InputLabel>
                <Select
                  label="City"
                  name="cityId"
                  value={formData.cityId || ''}
                  onChange={(e) => handleChange('cityId', e.target.value)}
                  disabled={isEdit === 'noneditable'}
                  displayEmpty
                >
                  {cities?.data?.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
                {!!errors.cityId && (
                  <FormHelperText>{errors.cityId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                disabled={isEdit === 'noneditable'}
                error={!!errors.pincode}
                helperText={errors.pincode}
                variant="outlined"
                className="bg-white"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl
                fullWidth
                variant="outlined"
                className="bg-white"
                error={!!errors.maritalStatus}
              >
                <InputLabel>Marital Status</InputLabel>
                <Select
                  label="Marital Status"
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={(e) =>
                    handleChange('maritalStatus', e.target.value)
                  }
                  disabled={isEdit === 'noneditable'}
                >
                  {dropdowns?.maritalStatus?.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
                {!!errors.maritalStatus && (
                  <FormHelperText>{errors.maritalStatus}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl
                fullWidth
                variant="outlined"
                className="bg-white"
                error={!!errors.referralId}
              >
                <InputLabel>Referral</InputLabel>
                <Select
                  label="Referral"
                  name="referralId"
                  value={formData.referralId}
                  onChange={(e) => handleChange('referralId', e.target.value)}
                  disabled={isEdit === 'noneditable'}
                >
                  {dropdowns?.referralTypes?.map((referral) => (
                    <MenuItem key={referral.id} value={referral.id}>
                      {referral.name}
                    </MenuItem>
                  ))}
                </Select>
                {!!errors.referralId && (
                  <FormHelperText>{errors.referralId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            {/* Referral Name text field */}
            {!!formData.referralId && (
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Referral Name"
                  name="referralName"
                  value={formData.referralName}
                  onChange={(e) => handleChange('referralName', e.target.value)}
                  disabled={isEdit === 'noneditable'}
                  variant="outlined"
                  className="bg-white"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={3}>
              <FormControl
                fullWidth
                variant="outlined"
                className="bg-white"
                error={!!errors.branchId}
              >
                <InputLabel>Branch</InputLabel>
                <Select
                  label="Branch"
                  name="branchId"
                  value={formData.branchId}
                  onChange={(e) => handleChange('branchId', e.target.value)}
                  disabled={isEdit === 'noneditable'}
                >
                  {dropdowns?.branches?.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
                {!!errors.branchId && (
                  <FormHelperText>{errors.branchId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl
                fullWidth
                variant="outlined"
                className="bg-white"
                error={!!errors.patientTypeId}
              >
                <InputLabel>Patient Type</InputLabel>
                <Select
                  label="Patient Type"
                  name="patientTypeId"
                  value={formData.patientTypeId}
                  onChange={(e) =>
                    handleChange('patientTypeId', e.target.value)
                  }
                  disabled={isEdit === 'noneditable'}
                >
                  {dropdowns?.patientTypeList?.map((patientType) => (
                    <MenuItem key={patientType.id} value={patientType.id}>
                      {patientType.name}
                    </MenuItem>
                  ))}
                </Select>
                {!!errors.patientTypeId && (
                  <FormHelperText>{errors.patientTypeId}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                name="aadhaarCard"
                onChange={handleDocumentChange}
                ref={docAadhaarRef}
              />
              {!formData?.aadhaarCard ? (
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => handleDocumentUpload(docAadhaarRef)}
                  disabled={isEdit === 'noneditable'}
                  className="capitalize"
                  color={errors.aadhaarCard ? 'error' : 'primary'}
                >
                  Aadhaar Card
                </Button>
              ) : (
                <div className="flex items-center font-bold  p-1 gap-2 text-secondary">
                  {typeof formData?.aadhaarCard == 'object' &&
                  isEdit !== 'noneditable' ? (
                    <span className="flex items-center gap-2">
                      <FilePresentOutlined />
                      <span>{`Aadhaar Card`}</span>
                    </span>
                  ) : (
                    // <Link
                    //   className="text-secondary flex"
                    //   href={formData?.aadhaarCard}
                    //   target="_blank"
                    // >
                    //   {`Aadhaar Card`}
                    //   <OpenInNew />
                    // </Link>
                    <Button
                      className="capitalize"
                      size="small"
                      onClick={() => dispatch(openModal('previewAadhaarCard'))}
                    >
                      {`Aadhaar Card`}
                      <OpenInNew />
                    </Button>
                  )}
                  {formData?.aadhaarCard && isEdit !== 'noneditable' && (
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      color="error"
                      onClick={() => handleRemoveDocument('aadhaarCard')}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </div>
              )}
              {errors.aadhaarCard && (
                <span className="text-red-500 text-sm">
                  {errors.aadhaarCard}
                </span>
              )}
            </Grid>
            <Grid item xs={12} sm={3}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                // multiple
                name="marriageCertificate"
                onChange={handleDocumentChange}
                ref={docMarriageRef}
              />
              {!formData?.marriageCertificate ? (
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => handleDocumentUpload(docMarriageRef)}
                  disabled={isEdit === 'noneditable'}
                  className=" capitalize"
                >
                  {/* {isEdit == 'create' ? 'Upload Aadhaar' : 'Change Aadhaar'} */}
                  Marriage Certificate
                </Button>
              ) : (
                <div className="flex items-center font-bold  rounded-md p-1 gap-2 text-secondary">
                  {typeof formData?.marriageCertificate == 'object' &&
                  isEdit !== 'noneditable' ? (
                    <span className="flex items-center gap-2">
                      <FilePresentOutlined />
                      <span> {`Marriage Certificate`}</span>
                    </span>
                  ) : (
                    // <Link
                    //   className="text-secondary flex "
                    //   href={formData?.marriageCertificate}
                    //   target="_blank"
                    // >
                    //   {`Marriage Certificate`}
                    //   <OpenInNew />
                    // </Link>
                    <Button
                      className="capitalize"
                      size="small"
                      onClick={() =>
                        dispatch(openModal('previewMarriageCertificate'))
                      }
                    >
                      {`Marriage Certificate`}
                      <OpenInNew />
                    </Button>
                  )}
                  {formData?.marriageCertificate &&
                    isEdit !== 'noneditable' && (
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        color="error"
                        // className=""
                        onClick={() =>
                          handleRemoveDocument('marriageCertificate')
                        }
                      >
                        <Delete />
                      </IconButton>
                    )}
                </div>
              )}
            </Grid>
            {/* affidavit */}
            <Grid item xs={12} sm={3}>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                name="affidavit"
                onChange={handleDocumentChange}
                ref={docAffidavitRef}
              />
              {!formData?.affidavit ? (
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() => handleDocumentUpload(docAffidavitRef)}
                  disabled={isEdit === 'noneditable'}
                  className="capitalize"
                >
                  Affidavit
                </Button>
              ) : (
                <div className="flex items-center font-bold  rounded-md p-1 gap-2 text-secondary">
                  {typeof formData?.affidavit == 'object' &&
                  isEdit !== 'noneditable' ? (
                    <span className="flex items-center gap-2">
                      <FilePresentOutlined />
                      <span> {`Affidavit`}</span>
                    </span>
                  ) : (
                    // <Link
                    //   className="text-secondary flex"
                    //   href={formData?.affidavit}
                    //   target="_blank"
                    // >
                    //   {`Affidavit`}
                    //   <OpenInNew />
                    // </Link>
                    <Button
                      className="capitalize"
                      size="small"
                      onClick={() => dispatch(openModal('previewAffidavit'))}
                    >
                      {`Affidavit`}
                      <OpenInNew />
                    </Button>
                  )}
                </div>
              )}
              {formData?.affidavit && isEdit !== 'noneditable' && (
                <IconButton
                  edge="end"
                  aria-label="delete"
                  color="error"
                  onClick={() => handleRemoveDocument('affidavit')}
                >
                  <Delete />
                </IconButton>
              )}
            </Grid>
            {/* createActiveVisit checkbox */}
            {isEdit == 'create' && (
              <Grid item xs={12} sm={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData?.createActiveVisit || false}
                      onChange={(e) =>
                        handleChange('createActiveVisit', e.target.checked)
                      }
                    />
                  }
                  label="Auto Create Visit"
                />
              </Grid>
            )}
          </Grid>
          <Modal
            uniqueKey={'previewAadhaarCard'}
            onClose={() => dispatch(closeModal())}
            maxWidth={'lg'}
          >
            <div className="flex justify-end">
              <IconButton onClick={() => dispatch(closeModal())}>
                <Close />
              </IconButton>
            </div>
            <iframe
              src={formData?.aadhaarCard || ''}
              className="w-full h-[70vh]"
              key={formData?.aadhaarCard} // Force re-render when URL changes
            />
          </Modal>
          <Modal
            uniqueKey={'previewAffidavit'}
            onClose={() => dispatch(closeModal())}
            maxWidth={'lg'}
          >
            <div className="flex justify-end">
              <IconButton onClick={() => dispatch(closeModal())}>
                <Close />
              </IconButton>
            </div>
            <iframe src={formData?.affidavit} className="w-full h-[70vh]" />
          </Modal>
          <Modal
            uniqueKey={'previewMarriageCertificate'}
            onClose={() => dispatch(closeModal())}
            maxWidth={'lg'}
          >
            <div className="flex justify-end">
              <IconButton onClick={() => dispatch(closeModal())}>
                <Close />
              </IconButton>
            </div>
            <iframe
              src={formData?.marriageCertificate}
              className="w-full h-[70vh]"
            />
          </Modal>
          <Modal
            uniqueKey={'profileFullScreen'}
            onClose={() => dispatch(closeModal())}
            maxWidth={'lg'}
          >
            <div className="flex flex-col">
              <div className="flex justify-end">
                <IconButton onClick={() => dispatch(closeModal())}>
                  <Close />
                </IconButton>
              </div>
              <div className="flex justify-center items-center h-[80vh]">
                <img
                  src={imagePreview || photo?.src}
                  alt="Profile"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          </Modal>
        </CardContent>
      </Card>
    )
  },
)

PatientForm.displayName = 'PatientForm'
export default PatientForm
