import { useState, useRef, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  IconButton,
  Typography,
  Link,
  Skeleton,
  MenuItem,
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  FilePresentOutlined,
  OpenInNew,
  Close,
  ArrowBack,
} from '@mui/icons-material'
import Modal from './Modal'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal, openModal } from '@/redux/modalSlice'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteDonorFile,
  getDonarDataByVisit,
  saveDonarRecord,
  updateDonarRecord,
  updateTreatmentStatus,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { DateTimePicker } from '@mui/x-date-pickers'
import {
  canDeleteDonorDocuments,
  canViewDonorDocumentsAlongsideTrigger,
} from '@/utils/donorDocumentViewAccess'

function UpdateDonarInformation({
  patientInfo,
  documentsViewOnly = false,
  incompleteDonorMode = false,
  actionLabel,
}) {
  console.log('patientInfo:', patientInfo)
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    donarName: '',
    age: '',
    mobileNumber: '',
    kyc: null,
    marriageCertificate: null,
    birthCertificate: null,
    aadhaar: null,
    donarPhotoUrl: null,
    donarSignatureUrl: null,
    form24b: null,
    insuranceCertificate: null,
    spouseAadharCard: null,
    artBankCertificate: null,
    anaesthesiaConsent: null,
    form13: null,
  })
  const [isEditing, setIsEditing] = useState(true)
  const [errors, setErrors] = useState({})
  const [previewDoc, setPreviewDoc] = useState(null)
  const modalKey =
    patientInfo.visitId +
    (documentsViewOnly ? 'DonarInformationView' : 'DonarInformation')

  const docRefs = {
    kyc: useRef(null),
    marriageCertificate: useRef(null),
    birthCertificate: useRef(null),
    aadhaar: useRef(null),
    donarPhotoUrl: useRef(null),
    donarSignatureUrl: useRef(null),
    form24b: useRef(null),
    insuranceCertificate: useRef(null),
    spouseAadharCard: useRef(null),
    artBankCertificate: useRef(null),
    anaesthesiaConsent: useRef(null),
    form13: useRef(null),
  }

  const handleOpenModal = () => {
    if (documentsViewOnly) {
      setIsEditing(false)
    } else if (incompleteDonorMode) {
      setIsEditing(true)
    }
    setIsModalOpen(true)
    dispatch(openModal(modalKey))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    dispatch(closeModal(modalKey))
    setIsEditing(false)
    queryClient.invalidateQueries(['getDonarInformation'])
  }

  const {
    data: donorData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['getDonarDataByVisit', patientInfo.visitId],
    queryFn: () =>
      getDonarDataByVisit(userDetails?.accessToken, patientInfo?.visitId),
    enabled:
      !!userDetails?.accessToken && !!patientInfo?.visitId && isModalOpen,
    onSuccess: (data) => {
      if (!data?.data) {
        setFormData(data?.data)
        setIsEditing(true)
      }
    },
  })

  const updateFormDataWithResult = (donorData) => {
    setFormData({
      donarName: donorData?.data?.donarName,
      age: donorData?.data?.age,
      mobileNumber: donorData?.data?.mobileNumber,
      kyc: donorData?.data?.kyc,
      marriageCertificate: donorData?.data?.marriageCertificate,
      birthCertificate: donorData?.data?.birthCertificate,
      aadhaar: donorData?.data?.aadhaar,
      donarPhotoUrl: donorData?.data?.donarPhotoUrl,
      donarSignatureUrl: donorData?.data?.donarSignatureUrl,
      bloodGroup: 2,
      form24b: donorData?.data?.form24b,
      insuranceCertificate: donorData?.data?.insuranceCertificate,
      spouseAadharCard: donorData?.data?.spouseAadharCard,
      artBankCertificate: donorData?.data?.artBankCertificate,
      anaesthesiaConsent: donorData?.data?.anaesthesiaConsent,
      form13: donorData?.data?.form13,
    })
  }

  useEffect(() => {
    if (donorData?.data) {
      updateFormDataWithResult(donorData)
      setIsEditing(incompleteDonorMode)
    } else if (!documentsViewOnly) {
      setIsEditing(true)
    }
  }, [donorData, donorData?.data, documentsViewOnly, incompleteDonorMode])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDocumentUpload = (ref) => {
    if (ref.current) {
      ref.current.click()
    }
  }

  const handleDocumentChange = (e) => {
    const { name, files } = e.target
    if (files.length) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }))
    }
  }

  const handleRemoveDocument = async (field) => {
    if (!window.confirm('Are you sure you want to remove this document?')) {
      return
    }

    const deletePayload = {
      visitId: donorData?.data?.visitId ?? patientInfo?.visitId,
      fileType: field,
      id: donorData?.data?.id,
    }

    if (!deletePayload.visitId || !deletePayload.id) {
      toast.error('Donor record not loaded. Close and reopen the modal.')
      return
    }

    try {
      const res = await deleteDonorFile(userDetails?.accessToken, deletePayload)

      if (res.status === 200 && res.httpOk !== false) {
        toast.success('Successfully Deleted Document', toastconfig)
        setFormData((prev) => ({ ...prev, [field]: null }))
        refetch()
        queryClient.invalidateQueries(['getDonarInformation'])
      } else if (res.status === 400) {
        toast.error(res.message || 'Invalid request')
      } else {
        toast.error(res.message || 'Something went wrong!')
      }
    } catch {
      toast.error('An error occurred while deleting document')
    }
  }

  const sendDonarData = async () => {
    const addData = {
      ...formData,
      visitId: patientInfo?.visitId,
      patientId: patientInfo?.patientId,
      treatmentTypeId: patientInfo?.treatmentTypeId,
    }

    saveDonarRecord(userDetails.accessToken, addData)
      .then((res) => {
        if (res.status == 200) {
          toast.success('Successfully Saved Donar', toastconfig)
          refetch()
        } else if (res.status == 400) {
          toast.error(res.message)
        } else {
          toast.error('Something went wrong !')
        }
      })
      .catch((error) => {
        toast.error('An error occurred while saving donor data')
      })
  }

  const updateDonarData = () => {
    const addData = {
      ...formData,
      visitId: patientInfo?.visitId,
      patientId: patientInfo?.patientId,
      treatmentTypeId: patientInfo?.treatmentTypeId,
    }

    const updateDonar = updateDonarRecord(userDetails.accessToken, addData)
    updateDonar.then((res) => {
      if (res.status == 200) {
        toast.success('Successfully Updated', toastconfig)
        setIsEditing(false)
        refetch()
        updateFormDataWithResult(donorData)
      } else if (res.status == 400) {
        toast.error(res.message)
      } else {
        toast.error('Something went wrong !')
      }
    })
  }

  const docLabels = {
    kyc: 'KYC Document',
    marriageCertificate: 'Marriage Certificate',
    birthCertificate: 'Birth Certificate',
    aadhaar: 'Aadhaar Card',
    donarPhotoUrl: 'Donor Photo',
    donarSignatureUrl: 'Donor Signature',
    form24b: 'Form 24B',
    insuranceCertificate: 'Insurance Certificate',
    spouseAadharCard: 'Spouse Aadhaar Card',
    artBankCertificate: 'Art Bank Certificate',
    anaesthesiaConsent: 'Anaesthesia Consent',
    form13: 'Form 13',
  }

  const formFields = [
    { name: 'donarName', label: 'Donor Name', type: 'text' },
    { name: 'age', label: 'Age', type: 'number' },
    { name: 'mobileNumber', label: 'Mobile Number', type: 'text' },
    {
      name: 'bloodGroup',
      label: 'Blood Group',
      type: 'select',
      options: dropdowns?.bloodGroupList,
    },
  ]

  const handlePreviewDocument = (url, label) => {
    setPreviewDoc({ url, label })
  }

  const isReadOnly = documentsViewOnly
  const canDeleteDocuments =
    !isReadOnly || canDeleteDonorDocuments(userDetails?.email)
  const resolvedActionLabel =
    actionLabel ??
    (incompleteDonorMode
      ? 'Create Donor'
      : patientInfo?.donarName
        ? 'View Donor'
        : 'Create Donor')

  if (documentsViewOnly && !patientInfo?.donarName) {
    return null
  }

  return (
    <>
      <Button
        variant={patientInfo?.donarName ? 'outlined' : 'contained'}
        size="small"
        className={
          patientInfo?.donarName ? 'capitalize' : 'text-white capitalize'
        }
        onClick={handleOpenModal}
      >
        {resolvedActionLabel}
      </Button>
      {isModalOpen && (
        <Modal uniqueKey={modalKey} closeOnOutsideClick={false} maxWidth="lg">
          {previewDoc ? (
            <div className="flex flex-col h-full">
              <div className="flex gap-2 justify-between items-center mb-4">
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => setPreviewDoc(null)}
                >
                  Back
                </Button>
                <Typography variant="h6">{previewDoc.label}</Typography>
                <IconButton variant="outlined" onClick={handleCloseModal}>
                  <Close />
                </IconButton>
              </div>
              <div className="flex-grow">
                {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={previewDoc.url}
                    className="w-full h-[80vh]"
                    title={previewDoc.label}
                  />
                ) : (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.label}
                    className="max-w-full max-h-[80vh] mx-auto"
                  />
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 justify-between">
                <Typography variant="h6">Donor Information</Typography>
                <IconButton variant="outlined" onClick={handleCloseModal}>
                  <Close />
                </IconButton>
              </div>
              {isLoading && (
                <div className="mt-2 gap-2">
                  <Skeleton
                    variant="rectangular"
                    height={15}
                    className="mb-2"
                  />
                  <Skeleton
                    variant="rectangular"
                    width={'250px'}
                    height={15}
                    className="mb-2"
                  />
                  <Skeleton
                    variant="rectangular"
                    width={'100px'}
                    height={15}
                    className="mb-2"
                  />
                </div>
              )}
              {!isLoading && (
                <>
                  <Grid container spacing={2} className="my-2 p-2">
                    {formFields.map((field) => (
                      <Grid item xs={12} sm={3} key={field.name}>
                        {field.type === 'select' ? (
                          <TextField
                            select
                            fullWidth
                            label={field.label}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            disabled={!isEditing || isReadOnly}
                          >
                            {field.options?.map((option) => (
                              <MenuItem key={option.id} value={option.id}>
                                {option.name}
                              </MenuItem>
                            ))}
                          </TextField>
                        ) : (
                          <TextField
                            fullWidth
                            label={field.label}
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={handleInputChange}
                            type={field.type}
                            disabled={!isEditing || isReadOnly}
                          />
                        )}
                      </Grid>
                    ))}
                    {Object.keys(docRefs).map((key) => (
                      <Grid item xs={12} sm={3} key={key}>
                        {!isReadOnly && (
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            name={key}
                            onChange={handleDocumentChange}
                            ref={docRefs[key]}
                            disabled={!isEditing}
                          />
                        )}
                        {!formData[key] ? (
                          isReadOnly ? null : (
                            <Button
                              variant="outlined"
                              startIcon={<CloudUpload />}
                              onClick={() => handleDocumentUpload(docRefs[key])}
                              className="capitalize"
                              disabled={!isEditing}
                            >
                              {docLabels[key].trim()}
                            </Button>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <FilePresentOutlined />
                            {typeof formData[key] === 'object' ? (
                              <span>{docLabels[key].trim()}</span>
                            ) : (
                              <Link
                                component="button"
                                onClick={() =>
                                  handlePreviewDocument(
                                    formData[key],
                                    docLabels[key],
                                  )
                                }
                                className="flex items-center"
                              >
                                {docLabels[key].trim()} <OpenInNew />
                              </Link>
                            )}
                            {canDeleteDocuments && (
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() => handleRemoveDocument(key)}
                                disabled={
                                  !isEditing &&
                                  !canDeleteDonorDocuments(userDetails?.email)
                                }
                                title="Delete document"
                              >
                                <Delete />
                              </IconButton>
                            )}
                          </div>
                        )}
                      </Grid>
                    ))}
                  </Grid>
                  {!isReadOnly && (
                    <div className="p-4">
                      {!donorData?.data ? (
                        <Button
                          variant="contained"
                          color="primary"
                          className="mt-4 text-white capitalize"
                          onClick={sendDonarData}
                        >
                          Create Donar
                        </Button>
                      ) : (
                        <>
                          {!isEditing ? (
                            <Button
                              variant="contained"
                              color="primary"
                              className="mt-4 text-white capitalize"
                              onClick={() => setIsEditing(true)}
                            >
                              Edit Donor
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="contained"
                                color="primary"
                                className="mt-4 text-white capitalize"
                                onClick={updateDonarData}
                              >
                                Update Donor
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                className="mt-4 mx-2 text-white capitalize"
                                onClick={() => {
                                  handleCloseModal()
                                }}
                              >
                                Discard & close
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Modal>
      )}
    </>
  )
}

const DonorStatusButton = ({ patientInfo }) => {
  const dispatch = useDispatch()
  const userDetails = useSelector((store) => store.user)
  const [triggerDateTime, setTriggerDateTime] = useState(null)
  const queryClient = useQueryClient()

  const startDonorTrigger = async () => {
    try {
      const payload = {
        visitId: patientInfo.visitId,
        treatmentType: patientInfo.treatmentTypeId,
        stage: 'START_DONOR_TRIGGER',
        triggerTime: triggerDateTime,
      }

      const response = await updateTreatmentStatus(
        userDetails.accessToken,
        payload,
      )

      if (response.status === 200) {
        toast.success('Donor trigger started successfully')
        queryClient.invalidateQueries(['getDonarDataByVisit'])
        dispatch(closeModal(`${patientInfo.visitId}startDonorTrigger`))
      } else {
        toast.error(response.message || 'Failed to start donor trigger')
      }
    } catch (error) {
      toast.error('Something went wrong while starting donor trigger')
    }
  }

  const renderContent = () => {
    switch (patientInfo?.donorStatus) {
      case 0:
        return (
          <span className="text-red-500 bg-red-100 p-2 rounded-md font-medium">
            Payment pending
          </span>
        )

      case 1:
        return (
          <UpdateDonarInformation
            patientInfo={patientInfo}
            incompleteDonorMode={Boolean(patientInfo?.donarName)}
          />
        )

      case 2:
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="contained"
              color="success"
              onClick={() =>
                dispatch(openModal(`${patientInfo.visitId}startDonorTrigger`))
              }
              className=" capitalize"
            >
              Start Donor Trigger
            </Button>
            {canViewDonorDocumentsAlongsideTrigger(userDetails?.email) &&
              patientInfo?.donarName && (
                <UpdateDonarInformation
                  patientInfo={patientInfo}
                  documentsViewOnly
                  actionLabel="View"
                />
              )}

            <Modal
              uniqueKey={`${patientInfo.visitId}startDonorTrigger`}
              maxWidth="sm"
              closeOnOutsideClick={false}
            >
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">
                  Start Donor Trigger
                </h2>
                <DateTimePicker
                  label="Select Trigger Date & Time"
                  value={triggerDateTime}
                  onChange={(newValue) => setTriggerDateTime(newValue)}
                  className="w-full mb-4"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() =>
                      dispatch(
                        closeModal(`${patientInfo.visitId}startDonorTrigger`),
                      )
                    }
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={startDonorTrigger}
                    className="text-white"
                    disabled={!triggerDateTime}
                  >
                    Start Trigger
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        )

      case 3:
        return <UpdateDonarInformation patientInfo={patientInfo} />

      default:
        return null
    }
  }

  return renderContent()
}

export default DonorStatusButton
