import React, { useEffect, useRef, useState } from 'react'
import {
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import {
  createPatientRecord,
  editPatientRecord,
  getCities,
  getPatientByAadharOrMobile,
  editGuardianRecord,
  createGuardianRecord,
  getVisitsByPatientId,
  getVisitInfoById,
  getPackageData,
  createPackage,
  editPackage,
  getConsentFormsList,
  downloadConsentFormById,
  getFormFTemplatesByPatientId,
} from '@/constants/apis'
import PatientForm from '@/components/PatientForm'
import {
  DocumentScannerOutlined,
  ExpandMore,
  SearchOutlined,
} from '@mui/icons-material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import GuardianFrom from '@/components/GuardianFrom'
import { Bounce, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { TabContext } from '@mui/lab'
import { Tab, TextField, ToggleButton } from '@mui/material'
import VisitDetail from '@/components/VisitDetail'
import Appointments from '@/components/Appointments'
import defaultProfile from '../../../public/dummyProfile.jpg'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import VisitPatientInfo from '@/components/VisitPatientInfo'
import { closeModal, openModal } from '@/redux/modalSlice'
import PackageComponent from '@/components/PackageComponent'
import { hasPackageEditAccess } from '@/utils/packageEditAccess'
import ConsentCRUD from '@/components/ConsentCRUD'
import { useRouter } from 'next/router'
import { CONSENT_TYPES, PATIENT_FORMS_TYPES } from '@/constants/consentTypes'
import UploadPatientForms from '@/components/UploadPatientForms'
import dayjs from 'dayjs'
import Modal from '@/components/Modal'
import AdvancePayments from '@/components/AdvancePayments'
import PatientHistory from '@/components/PatientHistory'
import {
  getPatientMasterId,
  openFutureCycleForPatient,
} from '@/components/FutureCycleModal'
import { canScheduleFutureCycle } from '@/utils/patientTreatmentUtils'
import PreviousPrescriptionTab from '@/components/PreviousPrescriptionTab'

const toastconfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}
const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export default function Register() {
  const getSpouseAadhaarPhotoUrl = (uploadedDocuments = []) => {
    if (!Array.isArray(uploadedDocuments)) return ''
    const spouseDoc = uploadedDocuments.find((doc) =>
      String(doc || '')
        .toLowerCase()
        .includes('spouse_aadhaar_'),
    )
    return spouseDoc || ''
  }

  const router = useRouter()

  // Use window.location as the source of truth - most reliable for detecting route changes
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.location.pathname
  })

  // Listen to route changes using both Next.js router and window.location
  useEffect(() => {
    const updatePath = () => {
      if (typeof window !== 'undefined') {
        const newPath = window.location.pathname
        setCurrentPath((prevPath) => {
          // Only update if path actually changed
          if (prevPath !== newPath) {
            return newPath
          }
          return prevPath
        })
      }
    }

    // Update immediately
    updatePath()

    // Listen to Next.js router events
    if (router.events) {
      router.events.on('routeChangeComplete', updatePath)
      router.events.on('routeChangeStart', updatePath)
    }

    // Also listen to browser popstate (back/forward buttons)
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', updatePath)
    }

    // Poll window.location as a fallback (in case events don't fire)
    // Use shorter interval for faster detection
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const newPath = window.location.pathname
        setCurrentPath((prevPath) => {
          if (prevPath !== newPath) {
            return newPath
          }
          return prevPath
        })
      }
    }, 50) // Check every 50ms for route changes

    return () => {
      if (router.events) {
        router.events.off('routeChangeComplete', updatePath)
        router.events.off('routeChangeStart', updatePath)
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', updatePath)
      }
      clearInterval(interval)
    }
  }, [router.events])

  // ============================================
  // ALL HOOKS MUST BE DECLARED BEFORE EARLY RETURN
  // React Rules of Hooks: hooks must be called in the same order every render
  // ============================================

  // State hooks
  const [searchValue, setSearchValue] = useState('')
  const [photo, setPhoto] = useState(defaultProfile)
  const [formData, setFormData] = useState({
    branchId: '',
    aadhaarNo: '',
    mobileNo: '',
    firstName: '',
    lastName: '',
    gender: 'Female',
    maritalStatus: '',
    dateOfBirth: '',
    addressLine1: '',
    addressLine2: '',
    cityId: '',
    stateId: '',
    referralId: '',
    pincode: '',
    email: '',
    // photoPath: '',
    patientTypeId: '',
    hasGuardianInfo: false,
    referralName: '',
    createActiveVisit: true,
    spouseAadhaarPhoto: null,
    spouseAadhaarPhotoUrl: '',
  })
  const [tab, setTab] = useState('patientRecord')
  const [isEdit, setIsEdit] = useState('create')
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [ageValidationState, setAgeValidationState] = useState({
    isValid: true,
    message: '',
    requiresAdult: false,
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedVisit, setSelectedVisit] = useState({ id: '' })
  const [isEditing, setIsEditing] = useState(true)

  // Redux hooks
  const userDetails = useSelector((store) => store.user)
  // const dropdowns = useSelector((store) => store.dropdowns)
  const dispatch = useDispatch()
  const QueryClient = useQueryClient()

  // React Query hooks - must be before early return
  const { mutate: fetchPatientMutate, isLoading: fetchPatientLoading } =
    useMutation({
      mutationFn: async (aadhar) => {
        try {
          console.log('fetchPatientMutate', aadhar)
          dispatch(showLoader())
          await fetchPatient(aadhar)
          setTab('patientRecord')
        } catch (error) {
          console.log(error)
        } finally {
          dispatch(hideLoader())
        }
      },
      onSuccess: () => {
        QueryClient.invalidateQueries('visits', 'packageData')
      },
    })

  const { data: cities } = useQuery({
    queryKey: ['cities', formData?.stateId],
    queryFn: async () => {
      const responsejson = await getCities(
        userDetails?.accessToken,
        formData?.stateId,
      )
      return responsejson ? responsejson : []
    },
    enabled: !!formData?.stateId,
  })

  const { data: visits } = useQuery({
    queryKey: ['visits', formData?.id],
    queryFn: () => {
      if (!formData?.id || formData?.id === 'null' || formData?.id === null) {
        return Promise.resolve({ status: 200, data: [] })
      }
      return getVisitsByPatientId(userDetails?.accessToken, formData?.id)
    },
    enabled: !!formData?.id && formData?.id !== 'null' && formData?.id !== null,
  })

  const { data: visitInfo } = useQuery({
    queryKey: ['visitInfo', selectedVisit?.id],
    queryFn: () =>
      getVisitInfoById(userDetails?.accessToken, selectedVisit?.id),
    enabled: !!selectedVisit?.id,
  })

  const { data: PackageData } = useQuery({
    queryKey: ['PackageData', selectedVisit?.id],
    queryFn: async () => {
      const res = await getPackageData(
        userDetails?.accessToken,
        selectedVisit?.id,
      )
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status === 200) {
        const canEdit = hasPackageEditAccess(userDetails)
        const needsRegistration = !res.data?.registrationDate
        setIsEditing(canEdit && (needsRegistration || !res.data?.id))
        return res
      }
    },
    enabled: !!selectedVisit?.id,
  })

  const createPackageMutate = useMutation({
    mutationFn: async (payload) => {
      const res = await createPackage(userDetails.accessToken, {
        ...payload,
        visitId: selectedVisit?.id,
      })
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status == 200) {
        toast.success(res.message)
        setIsEditing(false)
      }
    },
    onSuccess: () => {
      QueryClient.invalidateQueries('packageData')
    },
  })

  const editPackageMutate = useMutation({
    mutationFn: async (payload) => {
      const { updatedAt, createdAt, ...newPayload } = payload
      const res = await editPackage(userDetails.accessToken, {
        ...newPayload,
        visitId: selectedVisit?.id,
      })
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status == 200) {
        toast.success(res.message)
        setIsEditing(false)
      }
    },
    onSuccess: () => {
      QueryClient.invalidateQueries('packageData')
    },
  })

  // Ref hooks
  const patientFormRef = useRef(null)
  const guardianFormRef = useRef(null)

  // Effect hooks
  useEffect(() => {
    if (cities?.data && formData?.cityId) {
      const cityExists = cities.data.some((city) => city.id === formData.cityId)
      if (!cityExists) {
        setFormData((prev) => ({ ...prev, cityId: '' }))
      }
    }
  }, [cities?.data, formData?.stateId])

  useEffect(() => {
    console.log(visits?.data)
    if (visits?.data?.length > 0) {
      let activeVisit = visits?.data.filter((visit) => visit.isActive === 1)
      setSelectedVisit(activeVisit[0])
    } else {
      console.log('no vists')
      setSelectedVisit({ id: '' })
    }
  }, [visits?.data])

  useEffect(() => {
    const { search } = router.query
    if (search) {
      setSearchValue(search)
      fetchPatientMutate(search)
    }
  }, [router.query])

  // Check if we're on the register page - AFTER ALL HOOKS
  const isRegisterPage = currentPath === '/patient/register'

  // Early return if not on register page - AFTER ALL HOOKS
  if (!isRegisterPage) {
    return null
  }

  // Helper functions and handlers - can be declared after early return
  const handleChangeTab = (event, newTab) => {
    setTab(newTab)
  }

  const fetchPatient = async (searchTerm) => {
    const trimmedSearch = String(searchTerm).trim()
    if (trimmedSearch.length > 0) {
      const patientRecord = await getPatientByAadharOrMobile(
        userDetails.accessToken,
        trimmedSearch,
      )
      if (patientRecord.status == 200) {
        console.log(patientRecord.data)
        let { uploadedDocuments, ...nonUpload } = patientRecord.data
        setFormData({
          ...nonUpload,
          spouseAadhaarPhoto: null,
          spouseAadhaarPhotoUrl: getSpouseAadhaarPhotoUrl(uploadedDocuments),
        })
        if (
          !!patientRecord.data?.photoPath ||
          patientRecord.data?.photoPath != ''
        ) {
          setImagePreview(patientRecord.data?.photoPath)
          setPhoto(null)
        } else {
          setImagePreview(null)
          setPhoto(defaultProfile)
        }
        setUploadedDocuments(uploadedDocuments || [])
        setIsEdit('noneditable')
        // setPhoto(null)
      } else if (patientRecord.status == 400) {
        toast.error(patientRecord.message)
        resetForm()
        setTab('patientRecord')
      }
    } else {
      resetForm()
    }
  }
  const resetForm = () => {
    setFormData({
      branchId: '',
      aadhaarNo: '',
      mobileNo: '',
      firstName: '',
      lastName: '',
      gender: 'Female',
      maritalStatus: '',
      dateOfBirth: '',
      addressLine1: '',
      addressLine2: '',
      cityId: '',
      stateId: '',
      referralId: '',
      pincode: '',
      photoPath: '',
      hasGuardianInfo: false,
      email: '',
      patientTypeId: '',
      referralName: '',
      spouseAadhaarPhoto: null,
      spouseAadhaarPhotoUrl: '',
      // uploadedDocuments: []
    })
    setIsEdit('create')
    setImagePreview(null)
    setPhoto(defaultProfile)
    setUploadedDocuments([])
    setAgeValidationState({ isValid: true, message: '', requiresAdult: false })
    setSearchValue('')
  }

  // const validation = () => {
  //   var temp = {}
  //   let valid = true
  //   Object.keys(formData).map(key => {
  //     if (formData[key] === '') {
  //       temp = { ...temp, [key]: 'Required' }
  //       valid = false
  //     }
  //   })
  //   // setErrors(temp)
  //   console.log(temp)

  //   return valid
  // }

  const handleCreatePatient = async () => {
    if (!ageValidationState.isValid) {
      toast.error(
        ageValidationState.message ||
          'Patient must be at least 18 years old for the selected type.',
      )
      return
    }
    console.log('create patient', photo == defaultProfile)
    const createPatient = createPatientRecord(
      userDetails.accessToken,
      formData,
      photo == defaultProfile ? null : photo,
      // uploadedDocuments,
    )
    createPatient.then((res) => {
      if (res.status == 200) {
        toast.success('Successfully Registered Patient', toastconfig)
        fetchPatientMutate(formData?.aadhaarNo)
      } else if (res.status == 400) {
        toast.error(res.message)
      }
    })
  }

  const handleEditPatient = async () => {
    if (!ageValidationState.isValid) {
      toast.error(
        ageValidationState.message ||
          'Patient must be at least 18 years old for the selected type.',
      )
      return
    }

    // Ensure patient ID is included
    if (!formData.id) {
      toast.error('Patient ID is missing. Cannot update patient.', toastconfig)
      return
    }

    // Explicitly include only fields allowed in edit schema
    // Exclude all fields that are not part of the edit patient schema
    const editPatientPayload = {
      id: formData.id,
      branchId: formData.branchId,
      aadhaarNo: formData.aadhaarNo,
      mobileNo: formData.mobileNo,
      email: formData.email || null,
      firstName: formData.firstName,
      lastName: formData.lastName || null,
      gender: formData.gender || 'Female',
      maritalStatus: formData.maritalStatus,
      dateOfBirth: formData.dateOfBirth || null,
      bloodGroup: formData.bloodGroup || null,
      addressLine1: formData.addressLine1 || null,
      addressLine2: formData.addressLine2 || null,
      patientTypeId: formData.patientTypeId,
      cityId: formData.cityId || null,
      stateId: formData.stateId || null,
      referralId: formData.referralId || null,
      referralName: formData.referralName || null,
      pincode: formData.pincode || null,
      photoPath: formData.photoPath || null,
      // Include document files - these will be extracted and sent as FormData files
      aadhaarCard: formData.aadhaarCard || null,
      marriageCertificate: formData.marriageCertificate || null,
      affidavit: formData.affidavit || null,
      spouseAadhaarPhoto: formData.spouseAadhaarPhoto || null,
    }

    // Log the payload being sent
    console.log('Sending edit patient payload:', editPatientPayload)
    console.log(
      'Aadhaar Card file:',
      formData.aadhaarCard,
      'Type:',
      typeof formData.aadhaarCard,
      'Is File:',
      formData.aadhaarCard instanceof File,
    )

    try {
      const editPatient = await editPatientRecord(
        userDetails?.accessToken,
        editPatientPayload,
        photo == defaultProfile ? null : photo,
      )

      console.log('Edit patient response:', editPatient)
      console.log('Response aadhaarCard URL:', editPatient.data?.aadhaarCard)

      if (editPatient.status == 200) {
        toast.success(
          editPatient.message || 'Patient updated successfully',
          toastconfig,
        )
        setIsEdit('noneditable')

        // If response includes updated patient data, update formData immediately
        if (
          editPatient.data &&
          typeof editPatient.data === 'object' &&
          editPatient.data.id
        ) {
          console.log('Updating formData with response data:', editPatient.data)
          let { uploadedDocuments, ...nonUpload } = editPatient.data

          // Update formData with all fields including document URLs
          // Priority: Use new URLs from backend response, fallback to existing string URLs, then null
          const updatedFormData = {
            ...nonUpload,
            // Ensure document fields are updated with new URLs from backend
            // Backend always returns the current URL (either updated or existing)
            // Add cache-busting parameter to ensure fresh file is loaded
            aadhaarCard: editPatient.data.aadhaarCard
              ? `${editPatient.data.aadhaarCard}${editPatient.data.aadhaarCard.includes('?') ? '&' : '?'}t=${Date.now()}`
              : null,
            marriageCertificate: editPatient.data.marriageCertificate
              ? `${editPatient.data.marriageCertificate}${editPatient.data.marriageCertificate.includes('?') ? '&' : '?'}t=${Date.now()}`
              : null,
            affidavit: editPatient.data.affidavit
              ? `${editPatient.data.affidavit}${editPatient.data.affidavit.includes('?') ? '&' : '?'}t=${Date.now()}`
              : null,
            spouseAadhaarPhoto: null,
            spouseAadhaarPhotoUrl: getSpouseAadhaarPhotoUrl(
              editPatient.data.uploadedDocuments || [],
            ),
          }

          console.log(
            'Updated formData.aadhaarCard:',
            editPatient.data.aadhaarCard,
          )
          console.log(
            'Setting formData with aadhaarCard URL (with cache-bust):',
            updatedFormData.aadhaarCard,
          )

          // Force a state update by creating a new object reference
          setFormData((prevData) => ({
            ...prevData,
            ...updatedFormData,
          }))

          // Only refetch if the response doesn't include the updated document URL
          // Since the backend returns the updated patient data, we should have the new URL already
          const hadNewAadhaarFile =
            formData.aadhaarCard &&
            typeof formData.aadhaarCard === 'object' &&
            (formData.aadhaarCard instanceof File ||
              formData.aadhaarCard.constructor?.name === 'File')
          if (hadNewAadhaarFile && !editPatient.data.aadhaarCard) {
            // Only refetch if we uploaded a file but the response doesn't have the URL
            console.log(
              'New Aadhaar card file was uploaded but response missing URL, refetching patient data',
            )
            setTimeout(() => {
              fetchPatientMutate(formData?.aadhaarNo)
            }, 2000)
          } else if (hadNewAadhaarFile && editPatient.data.aadhaarCard) {
            console.log(
              'New Aadhaar card file uploaded and URL received in response, no refetch needed',
            )
          }

          // Also update photo if photoPath changed
          if (editPatient.data?.photoPath) {
            setImagePreview(editPatient.data.photoPath)
            setPhoto(null)
          }
          if (uploadedDocuments) {
            setUploadedDocuments(uploadedDocuments || [])
          }
        } else {
          // Fallback: refetch patient data to get updated document URLs
          console.log(
            'Refreshing patient data with aadhaar:',
            formData?.aadhaarNo,
          )
          setTimeout(() => {
            fetchPatientMutate(formData?.aadhaarNo)
          }, 1000) // Increased delay to ensure backend processing is complete
        }

        // Note: Removed automatic refetch here because:
        // 1. The backend response already includes the updated document URLs
        // 2. We update formData immediately with the response data above
        // 3. Automatic refetch was overwriting the correct data with potentially stale data from the API
        // The conditional refetch above (inside the if block) handles cases where the URL is missing
      } else {
        const errorMessage =
          editPatient.message || editPatient.error || 'Failed to update patient'
        console.error('Edit patient error:', editPatient)
        toast.error(errorMessage, toastconfig)
      }
    } catch (error) {
      console.error('Exception during patient update:', error)
      toast.error(
        error.message || 'An error occurred while updating patient',
        toastconfig,
      )
    }
  }

  const handleCreateGuardian = async () => {
    const guardianPayload = {
      ...formData.guardianDetails,
      patientId: formData?.id,
      // relation: 'Spouse',
      // gender: 'Male',
    }
    const createGuardian = await createGuardianRecord(
      userDetails.accessToken,
      guardianPayload,
    )
    if (createGuardian.status === 200) {
      toast.success(createGuardian.message, toastconfig)
      setIsEdit('noneditable')
      fetchPatientMutate(formData?.aadhaarNo)
    } else {
      toast.error(createGuardian.message, toastconfig)
    }
  }

  const handleEditGuardian = async () => {
    const { createdAt, updatedAt, ...editGuardianPayload } =
      formData.guardianDetails
    const editGuardian = await editGuardianRecord(
      userDetails?.accessToken,
      editGuardianPayload,
    )
    if (editGuardian.status === 200) {
      toast.success(editGuardian.message, toastconfig)
      setIsEdit('noneditable')
      fetchPatientMutate(formData?.aadhaarNo)
    } else {
      toast.error(editGuardian.message, toastconfig)
    }
  }

  const handleButtons = async () => {
    if (isEdit == 'noneditable') {
      setIsEdit('edit')
    } else {
      if (!!formData.id) {
        // Patient exists, update patient record
        await handleEditPatient()

        if (formData.hasGuardianInfo) {
          if (!!formData.guardianDetails.id) {
            // Guardian exists, update guardian details
            await handleEditGuardian()
          } else {
            // Guardian doesn't exist, create new guardian
            await handleCreateGuardian()
          }
        }
      } else {
        // Create new patient
        await handleCreatePatient()
      }
    }
  }

  const uploadProfile = (event) => {
    const file = event.target.files[0]
    console.log('uploadProfile', file)
    dispatch(showLoader())
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        // Set the data URL as the image preview
        setImagePreview(reader.result)
        setPhoto(file)
      }
      reader.readAsDataURL(file)
    }
    dispatch(hideLoader())
  }
  const handleChangeVisit = (e) => {
    console.log(e.target.value, visits)
    if (e.target.value == 'createVisit') {
      dispatch(openModal('createVisit'))
    } else {
      let selectVisit = visits.data.filter(
        (visit) => visit.id === e.target.value,
      )
      setSelectedVisit(selectVisit[0])
    }
  }
  // Modify the search field handlers
  const handleSearchChange = (e) => {
    setSearchValue(e.target.value)
  }

  const handleSearch = (value) => {
    router.push(
      {
        pathname: router.pathname,
        query: { search: value },
      },
      undefined,
      { shallow: true },
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate both forms
    const isPatientFormValid = patientFormRef.current?.validateForm()
    const isGuardianFormValid = formData.hasGuardianInfo
      ? guardianFormRef.current?.validateGuardianForm()
      : true

    if (!isPatientFormValid || !isGuardianFormValid) {
      toast.error('Please fill in all required fields correctly', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      })
      setIsEdit('edit')
      return
    }

    try {
      const formDataToSend = new FormData()
      // ... rest of the submit logic
      if (isEdit == 'noneditable') {
        setIsEdit('edit')
      } else {
        if (!!formData.id) {
          // Patient exists, update patient record
          await handleEditPatient()

          if (formData.hasGuardianInfo) {
            if (!!formData.guardianDetails.id) {
              // Guardian exists, update guardian details
              await handleEditGuardian()
            } else {
              // Guardian doesn't exist, create new guardian
              await handleCreateGuardian()
            }
          }
        } else {
          // Create new patient
          await handleCreatePatient()
        }
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="pb-14 ">
      <div className="px-3 py-10 flex items-center justify-center gap-5">
        <TextField
          placeholder="Search by Patient ID / Mobile / Aadhaar"
          className="w-[300px] bg-white"
          type="search"
          value={searchValue}
          onChange={handleSearchChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(searchValue)
            }
          }}
        />
        <Button
          onClick={() => handleSearch(searchValue)}
          variant="contained"
          sx={{ color: 'white' }}
          startIcon={<SearchOutlined />}
        >
          Search
        </Button>
      </div>
      <hr />
      <TabContext value={tab}>
        <div className="flex bg-white ">
          {/* <Box> */}
          <TabList onChange={handleChangeTab}>
            {/* <span value='patientRecord'>Patient Details</span> */}
            <Tab label="Patient" value="patientRecord" />
            {formData.id && <Tab label="Visit" value="visitRecord" />}
            {/* package tab */}
            {selectedVisit?.id && PackageData?.data && (
              <Tab label="Package" value="package" />
            )}
            {selectedVisit?.id &&
              visitInfo?.data?.Treatments?.length > 0 &&
              visitInfo?.data?.Treatments[0] &&
              visitInfo?.data?.Treatments[0]?.treatmentTypeId !== 1 && (
                <Tab label="Consent Forms" value="consentForms" />
              )}
            {formData.id && <Tab label="Patient Forms" value="patientForms" />}
            {formData.id && (
              <Tab label="Advance Payments" value="advancePayment" />
            )}
            {formData.id && (
              <Tab label="Previous Prescription" value="previousPrescription" />
            )}
          </TabList>
          {/* </Box> */}
        </div>

        <TabPanel value="patientRecord" className="">
          <div className="flex justify-between gap-3 pt-2">
            <Button
              variant="outlined"
              // disabled={activeStep === 0}
              onClick={resetForm}
              sx={{ mr: 1 }}
            >
              Reset
            </Button>

            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                color: 'white',
              }}
              disabled={isEdit !== 'noneditable' && !ageValidationState.isValid}
            >
              {!!formData.id
                ? isEdit == 'noneditable'
                  ? 'Edit Record'
                  : 'Update Record'
                : 'Create Record'}
            </Button>
          </div>

          <div
            className={`grid  gap-3 ${
              formData.hasGuardianInfo ? 'grid-cols-3' : 'grid-cols-1'
            }`}
          >
            <div className="flex flex-col col-span-2">
              <div className="flex justify-end gap-2">
                {getPatientMasterId(formData) &&
                  canScheduleFutureCycle({
                    patientInfo: formData,
                    visitInfo: visitInfo?.data,
                  }) && (
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        openFutureCycleForPatient(dispatch, formData)
                      }}
                      className="capitalize text-secondary"
                    >
                      Future Cycle
                    </Button>
                  )}
                {formData?.patientId && (
                  <Button
                    variant="text"
                    onClick={() => {
                      dispatch(openModal(formData?.patientId + 'History'))
                    }}
                    className="capitalize text-secondary"
                  >
                    View Patient History
                  </Button>
                )}
                <PatientHistory
                  patient={{
                    patientId: formData?.patientId,
                    // activeVisitId: formData?.activeVisitId,
                  }}
                  onClose={() => {
                    dispatch(closeModal(formData?.patientId + 'History'))
                  }}
                />
              </div>
              <PatientForm
                formData={formData}
                setFormData={setFormData}
                isEdit={isEdit}
                cities={cities}
                uploadProfile={uploadProfile}
                photo={photo}
                imagePreview={imagePreview}
                uploadedDocuments={uploadedDocuments}
                setUploadedDocuments={setUploadedDocuments}
                setPhoto={setPhoto}
                setImagePreview={setImagePreview}
                ref={patientFormRef}
                bloodGroupOptions={bloodGroupOptions}
                onAgeValidationChange={(data) =>
                  setAgeValidationState((prev) => ({ ...prev, ...data }))
                }
              />
            </div>
            {formData.hasGuardianInfo && (
              <GuardianFrom
                formData={formData}
                setFormData={setFormData}
                isEdit={isEdit}
                ref={guardianFormRef}
                bloodGroupOptions={bloodGroupOptions}
              />
            )}
          </div>
        </TabPanel>

        <TabPanel value="visitRecord">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          {/* <VisitPatientInfo formData={formData} photo={photo} imagePreview={imagePreview} /> */}
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-secondary px-2 mb-2">
              Appointments
            </h2>
            <Appointments
              Treatments={visitInfo?.data?.Treatments}
              Consultations={visitInfo?.data?.Consultations}
              selectedVisit={selectedVisit}
            />
          </div>

          {/* <ValidSubRow row={row} UserDetails={UserDetails} /> */}
        </TabPanel>

        <TabPanel value="package">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          <PackageComponent
            selectedVisit={selectedVisit}
            packageData={PackageData?.data}
            createPackageMutate={createPackageMutate}
            editPackageMutate={editPackageMutate}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        </TabPanel>

        <TabPanel value="consentForms">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          <ConsentForms
            patientDetails={formData}
            selectedVisit={selectedVisit}
            visitInfo={visitInfo?.data}
          />
        </TabPanel>
        <TabPanel value="patientForms">
          <VisitDetail
            formData={formData}
            visits={visits}
            selectedVisit={selectedVisit}
            handleChangeVisit={handleChangeVisit}
            setSelectedVisit={setSelectedVisit}
          />
          <PatientForms
            patientDetails={formData}
            selectedVisit={selectedVisit}
            visitInfo={visitInfo?.data}
          />
        </TabPanel>
        <TabPanel value="advancePayment">
          <AdvancePayments formData={formData} />
        </TabPanel>
        <TabPanel value="previousPrescription">
          <PreviousPrescriptionTab patientDetails={formData} />
        </TabPanel>
      </TabContext>
    </div>
  )
}

function ConsentForms({ patientDetails, selectedVisit, visitInfo }) {
  const userDetails = useSelector((store) => store.user)
  const filteredConsents = Object.values(CONSENT_TYPES).filter((type) => {
    const treatmentId =
      visitInfo?.Treatments?.length > 0
        ? visitInfo?.Treatments[0]?.treatmentTypeId
        : null

    switch (treatmentId) {
      case 1:
        return false

      case 2:
      case 3:
        return type.id === 'IUI'

      case 4:
      case 5:
      case 6:
      case 7:
        return type.id === 'ICSI' || type.id === 'FET' || type.id === 'ERA'

      default:
        return false
    }
  })
  const [activeConsentType, setActiveConsentType] = useState(
    Object.values(filteredConsents)[0]?.id,
  )
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: consentFormsList } = useQuery({
    queryKey: ['consentFormsList', activeConsentType],
    queryFn: () =>
      getConsentFormsList(userDetails.accessToken, activeConsentType),
    enabled: !!activeConsentType,
  })
  const downloadConsentFormMutate = useMutation({
    mutationFn: async (id) => {
      const res = await downloadConsentFormById(
        userDetails.accessToken,
        id,
        patientDetails?.patientId,
      )
      console.log('res', res)
    },
  })
  const useConsentOperations = (consentType) => {
    const { apis } = CONSENT_TYPES[consentType]
    const { data: consents, isLoading } = useQuery({
      queryKey: [`${consentType.toLowerCase()}Consents`, selectedVisit?.id],
      queryFn: async () => {
        dispatch(showLoader())
        const res = await apis.get(userDetails.accessToken, selectedVisit?.id)
        dispatch(hideLoader())
        return res
      },
      enabled: !!selectedVisit?.id,
    })
    const uploadMutation = useMutation({
      mutationFn: async (file) => {
        dispatch(showLoader())
        const res = await apis.upload(
          userDetails.accessToken,
          selectedVisit?.id,
          file,
          patientDetails?.id,
        )
        if (res.status == 200) {
          queryClient.invalidateQueries(`${consentType.toLowerCase()}Consents`)
          toast.success(`${consentType} consent form uploaded successfully`)
        } else {
          toast.error(
            `Failed to upload ${consentType} consent form: ${res.message}`,
          )
        }
        dispatch(hideLoader())
        return res
      },
    })
    const deleteMutation = useMutation({
      mutationFn: async (id) => {
        dispatch(showLoader())
        const res = await apis.delete(userDetails.accessToken, id)
        dispatch(hideLoader())
        if (res.status == 200) {
          queryClient.invalidateQueries(`${consentType.toLowerCase()}Consents`)
          toast.success(`${consentType} consent form deleted successfully`)
        } else {
          toast.error(
            `Failed to delete ${consentType} consent form: ${res.message}`,
          )
        }
        return res
      },
    })

    return {
      consents,
      isLoading,
      uploadConsent: uploadMutation.mutate,
      deleteConsent: deleteMutation.mutate,
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <TabContext value={activeConsentType}>
        <div className="grid grid-cols-12 gap-6">
          {/* Vertical Tabs */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm">
            <TabList
              onChange={(e, newValue) => setActiveConsentType(newValue)}
              orientation="vertical"
              variant="scrollable"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  paddingLeft: '1.5rem',
                  minHeight: '3.5rem',
                },
                '& .Mui-selected': {
                  backgroundColor: 'rgba(176, 233, 250, 0.2)',
                  borderRight: '2px solid #b0e9fa',
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {filteredConsents.map((type) => (
                <Tab
                  key={type.id}
                  label={
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-primary">
                        <DocumentScannerOutlined className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{type.id}</p>
                        {/* <p className="text-xs text-gray-500">
                          Manage {type.id.toLowerCase()} consent forms
                        </p> */}
                      </div>
                    </div>
                  }
                  value={type.id}
                  className="!min-h-[80px]"
                />
              ))}
            </TabList>
          </div>

          {/* Content Area */}
          <div className="col-span-9">
            {filteredConsents.map((type) => (
              <TabPanel
                key={type.id}
                value={type.id}
                sx={{
                  padding: 0,
                  height: '100%',
                }}
              >
                <ConsentCRUD
                  consentType={type.id}
                  consentFormsList={consentFormsList}
                  useConsentOperations={useConsentOperations}
                  downloadConsentFormMutate={downloadConsentFormMutate}
                />
              </TabPanel>
            ))}
          </div>
        </div>
      </TabContext>
    </div>
  )
}

function PatientForms({ patientDetails, selectedVisit, visitInfo }) {
  const userDetails = useSelector((store) => store.user)
  const patientFormsList = Object.values(PATIENT_FORMS_TYPES)

  const [activeFormType, setActiveFormType] = useState(patientFormsList[0].id)
  const [selectedFormDetails, setSelectedFormDetails] = useState(null)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { data: getFormFHistoryByPatientId, isLoading } = useQuery({
    queryKey: ['getFormFHistoryByPatientId', patientDetails?.patientId],
    queryFn: () =>
      getFormFTemplatesByPatientId(
        userDetails.accessToken,
        patientDetails?.patientId,
      ),
    enabled: !!patientDetails?.patientId,
  })

  return (
    <div className="max-w-7xl mx-auto">
      <TabContext value={patientFormsList[0].id}>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 bg-white rounded-lg shadow-sm">
            <TabList
              onChange={(e, newValue) => setActiveFormType(newValue)}
              orientation="vertical"
              variant="scrollable"
              sx={{
                borderRight: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  paddingLeft: '1.5rem',
                  minHeight: '3.5rem',
                },
                '& .Mui-selected': {
                  backgroundColor: 'rgba(176, 233, 250, 0.2)',
                  borderRight: '2px solid #b0e9fa',
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {patientFormsList.map((type) => (
                <Tab
                  key={type.id}
                  label={
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-primary">
                        <DocumentScannerOutlined className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {type.label}
                        </p>
                      </div>
                    </div>
                  }
                  value={type.id}
                  className="!min-h-[80px]"
                />
              ))}
            </TabList>
          </div>

          <div className="col-span-9">
            {patientFormsList.map((type) => (
              <TabPanel
                key={type.id}
                value={type.id}
                sx={{
                  padding: 0,
                  height: '100%',
                }}
              >
                <div className="space-y-6">
                  <div className="max-h-[500px] overflow-y-auto bg-gray-50 rounded-lg p-4 shadow-inner">
                    {getFormFHistoryByPatientId?.data?.length > 0 &&
                      getFormFHistoryByPatientId?.data?.map(
                        (eachAppointment) => (
                          <div
                            className="p-6 mb-2 flex flex-col gap-6 rounded-lg shadow-lg border border-gray-200 bg-white max-h-[500px] overflow-y-auto"
                            key={eachAppointment.appointmentId}
                          >
                            <div className="flex justify-between items-center">
                              <p className="text-md font-semibold text-gray-900 truncate">
                                {dayjs(
                                  eachAppointment?.appointmentInfo
                                    ?.appointmentDate,
                                ).format('DD-MM-YYYY')}
                              </p>
                              <h2
                                title={
                                  eachAppointment?.appointmentInfo?.doctorName
                                }
                                className="text-md font-semibold text-gray-900 truncate"
                              >
                                {eachAppointment?.appointmentInfo?.doctorName}
                              </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {eachAppointment.formFTemplateDetails.map(
                                (form) => (
                                  <div
                                    className="flex flex-col gap-3 p-4 border rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300"
                                    key={form.scanId}
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-semibold text-gray-800 truncate w-[1/2]">
                                          {form.scanName}
                                        </p>
                                        <p className="text-sm text-gray-500 wrap">
                                          Scan ID: {form.scanId}
                                        </p>
                                      </div>
                                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                                        {form.type}
                                      </div>
                                    </div>

                                    <div className="flex justify-end">
                                      <Button
                                        variant="contained"
                                        className="bg-secondary text-white rounded-md px-5 py-2 hover:bg-secondary-dark transition duration-200"
                                        onClick={() => {
                                          setSelectedFormDetails({
                                            ...form,
                                            patientId: patientDetails.patientId,
                                            appointmentId:
                                              eachAppointment.appointmentId,
                                          })
                                          dispatch(openModal('uploadFormF'))
                                        }}
                                      >
                                        View Details
                                      </Button>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    {(!getFormFHistoryByPatientId ||
                      getFormFHistoryByPatientId.data.length <= 0) && (
                      <div className="flex flex-col items-center justify-center p-6">
                        <div className="text-gray-700 font-semibold text-lg mb-2">
                          No Paid Scans Found!
                        </div>
                        <p className="text-gray-500 text-sm">
                          Try searching again or check back later.
                        </p>
                      </div>
                    )}
                  </div>

                  <Modal
                    maxWidth={'lg'}
                    uniqueKey="uploadFormF"
                    closeOnOutsideClick={true}
                  >
                    <UploadPatientForms
                      formType={type.id}
                      formDetails={selectedFormDetails}
                    />
                  </Modal>
                </div>
              </TabPanel>
            ))}
          </div>
        </div>
      </TabContext>
    </div>
  )
}
