import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Select from 'react-select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import TextField from '@mui/material/TextField'
import {
  Button,
  Typography,
  FormControlLabel,
  RadioGroup,
  Checkbox,
  IconButton,
  Tooltip,
  ButtonGroup,
} from '@mui/material'
import {
  getTreatmentStatus,
  updateTreatmentSheetByTreatmentCycleId,
  getTreatmentSheetByTreatmentCycleId,
  updateTreatmentStatus,
  createConsultationOrTreatment,
  reviewIcsiConsents,
  reviewFETConsents,
  updateTreatmentFETSheetByTreatmentCycleId,
  getTreatmentFETSheetByTreatmentCycleId,
  getTreatmentTypes,
  getBillTypeValuesByBillTypeId,
  getPrescriptionDetailsByTreatmentCycleId,
  updateHysteroscopySheetByVisitId,
  getHysteroscopySheetByVisitId,
  createHysteroscopyReport,
  updateHysteroscopyReport,
  getHysteroscopyReport,
  addHysteroscopyReferenceImages,
  deleteHysteroscopyReferenceImage,
  closeVisitInConsultation,
  closeVisitInTreatment,
  getAllActiveVisitAppointments,
  getTreatmentERASheetByTreatmentCycleId,
  updateTreatmentERASheetByTreatmentCycleId,
  reviewEraConsents,
} from '@/constants/apis'
import dayjs from 'dayjs'
import { Close, InfoOutlined, Schedule } from '@mui/icons-material'
import Modal from '@/components/Modal'
import { openModal, closeModal } from '@/redux/modalSlice'
import FolicularSheet from '@/components/FolicularSheet'
import MedicationSheet from '@/components/MedicationSheet'
import ScanSheet from '@/components/ScanSheet'
import {
  DatePicker,
  DateTimePicker,
  renderTimeViewClock,
} from '@mui/x-date-pickers'
import { FaPrescriptionBottleMedical } from 'react-icons/fa6'
import ReviewCallForm from '@/components/ReviewCallForm'
import ConsentsCheck from '@/components/ConsentsCheck'
import FETSheet from '@/components/FETSheet'
import ReviewTreatmentCall from '@/components/ReviewTreatmentCall'
import { Autocomplete } from '@mui/material'
import PatientPrescription from './PatientPrescription'
import SpousePrescription from './SpousePrescription'
import HysteroscopySheet from './HysteroscopySheet'
import ERASheet from './ERASheet'
import HysteroscopySheetNew from './HysteroscopySheetNew'
import HysteroLapOperationNotesForm from './HysteroLapOperationNotesForm'
import {
  buildMedicationFormData,
  getAutofilledMedicationRows,
} from '@/utils/medicationSheetUtils'

const HYSTERO_LAP_TYPE_OPTIONS = [
  { value: 'Hysteroscopy', label: 'Hysteroscopy' },
  { value: 'Laproscopy', label: 'Laproscopy' },
  { value: 'Hysterolap', label: 'Hysterolap' },
]

const DEFAULT_FOLLICULAR_ROWS = [
  { value: '<=10' },
  { value: '10.5' },
  { value: '11' },
  { value: '11.5' },
  { value: '12' },
  { value: '12.5' },
  { value: '13' },
  { value: '13.5' },
  { value: '14' },
  { value: '14.5' },
  { value: '15' },
  { value: '15.5' },
  { value: '16' },
  { value: '16.5' },
  { value: '17' },
  { value: '17.5' },
  { value: '18' },
  { value: '18.5' },
  { value: '19' },
  { value: '19.5' },
  { value: '>=20' },
  { value: 'ET' },
]

function Prescription({
  appointmentId,
  type,
  treatmentCycleId,
  patientInfo,
  selectedPatient,
  setSelectedPatient,
  onTreatmentStarted,
}) {
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const { billTypes } = useSelector((store) => store.dropdowns)
  const modal = useSelector((store) => store.modal)

  const queryClient = useQueryClient()
  // const [treatmentStartDate, setTreatmentStartDate] = useState(
  //   dayjs().format('YYYY-MM-DD'),
  // )
  const { data: treatmentTypes } = useQuery({
    queryKey: ['treatmentTypes'],
    queryFn: async () => {
      const res = await getTreatmentTypes(user.accessToken)
      // console.log('fetching treatment types', res.data)
      return res.data
    },
    // enabled: !!user.accessToken,
  })
  const treatmentTypesWithoutFETCycle = useMemo(() => {
    const types = Array.isArray(treatmentTypes) ? treatmentTypes : []
    return types.filter(
      (each) =>
        !['fet cycle', 'fet'].includes((each?.name || '').trim().toLowerCase()),
    )
  }, [treatmentTypes])
  const [treatmentForm, setTreatmentForm] = useState({
    createType: 'Treatment', //Consultation or  Treatment
    // visitId: activeVisitId,
    type: '',
    packageAmount: '',
  })

  const {
    mutate: updateTreatmentStatusMutation,
    isPending: isUpdatingTrigger,
  } = useMutation({
    mutationFn: async (payload) => {
      const res = await updateTreatmentStatus(user.accessToken, payload)
      // Don't show success toast here - wait for refetch to confirm
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to start trigger')
      }
      return res
    },
    onSuccess: async (data, variables) => {
      // After successful mutation, invalidate and refetch treatmentStatus queries
      const visitId = variables.visitId
      const treatmentType = variables.treatmentType

      console.log(
        'Trigger start mutation successful, invalidating queries for:',
        {
          visitId,
          treatmentType,
        },
      )

      // Invalidate all treatmentStatus queries
      queryClient.invalidateQueries({
        queryKey: ['treatmentStatus'],
        exact: false,
      })

      // Wait for backend transaction to commit, then refetch and verify
      setTimeout(async () => {
        console.log('Refetching treatmentStatus query:', {
          visitId,
          treatmentType,
        })
        try {
          const queryResult = await queryClient.refetchQueries({
            queryKey: ['treatmentStatus', visitId, treatmentType],
          })

          // Get the updated treatmentStatus from cache
          const updatedStatus = queryClient.getQueryData([
            'treatmentStatus',
            visitId,
            treatmentType,
          ])

          console.log('TreatmentStatus query refetched successfully:', {
            TRIGGER_START: updatedStatus?.TRIGGER_START,
          })

          // Only show success if TRIGGER_START is actually 1
          if (updatedStatus?.TRIGGER_START === 1) {
            toast.success(
              data?.data || 'Trigger Started Successfully',
              toastconfig,
            )
          } else {
            console.warn(
              'Trigger start may not have completed. TRIGGER_START value:',
              updatedStatus?.TRIGGER_START,
            )
            toast.warning(
              'Trigger start initiated. Please refresh if status does not update.',
              toastconfig,
            )
          }
        } catch (err) {
          console.error('Error refetching treatmentStatus:', err)
          toast.error(
            'Failed to verify trigger status. Please refresh the page.',
            toastconfig,
          )
        }
      }, 1200) // Wait 1.2 seconds for backend transaction to complete
    },
    onError: (error) => {
      console.error('Error starting trigger:', error)
      toast.error(
        error.message || 'Failed to start trigger. Please try again.',
        toastconfig,
      )
    },
  })
  const {
    data: allBillTypeValues,
    isLoading: isBillTypeValuesLoading,
    error,
  } = useQuery({
    queryKey: ['allBillTypeValues', selectedPatient?.branchId],
    queryFn: async () => {
      const promisesArray = []

      for (let i = 0; i < billTypes.length; i++) {
        const responseJsonPromise = getBillTypeValuesByBillTypeId(
          user.accessToken,
          billTypes[i].id,
          selectedPatient?.branchId,
        ).then((response) => {
          if (!response.ok)
            throw new Error(
              'error while fetching bill types for ' + billTypes[i].name,
            )
          return response.json()
        })
        promisesArray.push(responseJsonPromise)
      }

      return Promise.all(promisesArray).then((responsesArray) => {
        const allBillTypeValuesObject = {}
        for (let i = 0; i < billTypes.length; i++) {
          allBillTypeValuesObject[billTypes[i].name] = responsesArray[i].data
        }
        return allBillTypeValuesObject
      })
    },
    enabled: !!selectedPatient?.branchId,
  })

  // getTreatmentStatus

  const [folicularFormData, setFolicularFormData] = useState({})
  const [follicularTemplate, setFolicularTemplate] = useState(null)
  const [medicationFormData, setMedicationFormData] = useState({})
  const [scanFormData, setScanFormData] = useState({})
  const migrationDoneRef = useRef(false) // Track if migration has been done for this template
  const patientSpecificColumnsFixedRef = useRef(false)
  const [scanFetFormData, setScanFetFormData] = useState({})
  const [scanEraFormData, setScanEraFormData] = useState({})
  const [fetFormData, setFETFormData] = useState({})
  const [fetTemplate, setFETTemplate] = useState(null)
  const [eraFormData, setERAFormData] = useState({})
  const [eraTemplate, setERATemplate] = useState({})
  const [eraFolicularFormData, setEraFolicularFormData] = useState({})
  const [triggerTime, setTriggerTime] = useState(null)
  const [hysteroscopyTime, setHysteroscopyTime] = useState(null)
  const [eraStartTime, setEraStartTime] = useState(null)
  const [oitiStartDate, setOitiStartDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  )
  const [eraTreatmentStartDate, setEraTreatmentStartDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  )
  const [hysteroscopyTemplate, setHysteroscopyTemplate] = useState(null)
  const [hysteroscopyReportId, setHysteroscopyReportId] = useState(null)
  const [selectedHysteroLapType, setSelectedHysteroLapType] = useState(null)

  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD')
    setOitiStartDate(today)
    setEraTreatmentStartDate(today)
    setHysteroscopyTime(null)
  }, [patientInfo?.activeVisitId])

  const resolvedHysteroscopyPatientId = Number(
    patientInfo?.id ?? patientInfo?.patientId,
  )
  const resolvedHysteroscopyVisitId = Number(
    patientInfo?.activeVisitId ??
      selectedPatient?.visitId ??
      selectedPatient?.visit_id,
  )
  const treatmentStatusQueryKey = useMemo(
    () => [
      'treatmentStatus',
      patientInfo?.activeVisitId,
      patientInfo?.treatmentDetails?.treatmentTypeId,
    ],
    [
      patientInfo?.activeVisitId,
      patientInfo?.treatmentDetails?.treatmentTypeId,
    ],
  )

  const refetchTreatmentStatus = async (visitId, treatmentType) => {
    queryClient.invalidateQueries({
      queryKey: ['treatmentStatus'],
      exact: false,
    })

    if (!visitId || treatmentType == null) return null

    await queryClient.refetchQueries({
      queryKey: ['treatmentStatus', visitId, treatmentType],
    })

    return queryClient.getQueryData(['treatmentStatus', visitId, treatmentType])
  }
  const visitTypeText = [
    selectedPatient?.visitType,
    selectedPatient?.appointmentType,
    selectedPatient?.appointmentReason,
    patientInfo?.visitType,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .trim()
  const isVisitTypeWithoutTreatmentStart =
    visitTypeText.includes('gynec') ||
    visitTypeText.includes('gyn') ||
    visitTypeText.includes('antenatal') ||
    visitTypeText.includes('anc/zyn') ||
    visitTypeText.includes('anc')

  const isKrishnaKumarNandini = useMemo(() => {
    const normalize = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()

    const candidateNames = [
      selectedPatient?.patientName,
      selectedPatient?.name,
      selectedPatient?.fullName,
      patientInfo?.patientName,
      patientInfo?.name,
      patientInfo?.fullName,
      [patientInfo?.firstName, patientInfo?.middleName, patientInfo?.lastName]
        .filter(Boolean)
        .join(' '),
    ]
      .filter(Boolean)
      .map(normalize)

    return candidateNames.includes('krishna kumar nandini')
  }, [patientInfo, selectedPatient])

  const isKurapatiSravanthi = useMemo(() => {
    const normalize = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()

    const candidateNames = [
      selectedPatient?.patientName,
      selectedPatient?.name,
      selectedPatient?.fullName,
      patientInfo?.patientName,
      patientInfo?.name,
      patientInfo?.fullName,
      [patientInfo?.firstName, patientInfo?.middleName, patientInfo?.lastName]
        .filter(Boolean)
        .join(' '),
    ]
      .filter(Boolean)
      .map(normalize)

    return candidateNames.includes('kurapati sravanthi')
  }, [patientInfo, selectedPatient])

  const isAyeshaBegum = useMemo(() => {
    const normalize = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()

    const candidateNames = [
      selectedPatient?.patientName,
      selectedPatient?.name,
      selectedPatient?.fullName,
      patientInfo?.patientName,
      patientInfo?.name,
      patientInfo?.fullName,
      [patientInfo?.firstName, patientInfo?.middleName, patientInfo?.lastName]
        .filter(Boolean)
        .join(' '),
    ]
      .filter(Boolean)
      .map(normalize)

    return candidateNames.includes('ayesha begum')
  }, [patientInfo, selectedPatient])

  const KRISHNA_IUI_DAY1 = '03/05'
  const KURAPATI_ICSI_DAY1 = '12/07'

  const iuiColumns = useMemo(() => {
    const cols = follicularTemplate?.columns
    if (!isKrishnaKumarNandini || !Array.isArray(cols) || cols.length === 0)
      return null

    const start = dayjs(
      `2000-${KRISHNA_IUI_DAY1.slice(3)}-${KRISHNA_IUI_DAY1.slice(0, 2)}`,
    )
    return cols.map((_, index) => start.add(index, 'day').format('DD/MM'))
  }, [follicularTemplate?.columns, isKrishnaKumarNandini])

  const icsiColumns = useMemo(() => {
    const cols = follicularTemplate?.columns
    if (!isKurapatiSravanthi || !Array.isArray(cols) || cols.length === 0)
      return null

    const start = dayjs(
      `2000-${KURAPATI_ICSI_DAY1.slice(3)}-${KURAPATI_ICSI_DAY1.slice(0, 2)}`,
    )
    return cols.map((_, index) => start.add(index, 'day').format('DD/MM'))
  }, [follicularTemplate?.columns, isKurapatiSravanthi])

  const patientSpecificColumns = icsiColumns || iuiColumns

  const remapTreatmentSheetKeys = (data, oldCols, newCols) => {
    if (
      !data ||
      typeof data !== 'object' ||
      !oldCols?.length ||
      !newCols?.length
    ) {
      return data
    }

    const remapped = {}
    Object.entries(data).forEach(([key, value]) => {
      let newKey = key
      for (let i = 0; i < oldCols.length; i++) {
        const oldCol = oldCols[i]
        const newCol = newCols[i]
        if (!oldCol || !newCol || oldCol === newCol) continue
        if (key === `${oldCol}-note` || key.startsWith(`${oldCol}-`)) {
          newKey = `${newCol}${key.slice(oldCol.length)}`
          break
        }
      }
      remapped[newKey] = value
    })
    return remapped
  }

  const handleDay1DateChange = useCallback((oldCols, newCols) => {
    setMedicationFormData((prev) =>
      remapTreatmentSheetKeys(prev, oldCols, newCols),
    )
    setScanFormData((prev) => remapTreatmentSheetKeys(prev, oldCols, newCols))
  }, [])

  useEffect(() => {
    patientSpecificColumnsFixedRef.current = false
  }, [treatmentCycleId, isKrishnaKumarNandini, isKurapatiSravanthi])

  useEffect(() => {
    if (!patientSpecificColumns || patientSpecificColumnsFixedRef.current)
      return

    const oldCols = follicularTemplate?.columns
    if (!Array.isArray(oldCols) || oldCols.length === 0) return

    if (oldCols.join('|') === patientSpecificColumns.join('|')) {
      patientSpecificColumnsFixedRef.current = true
      return
    }

    patientSpecificColumnsFixedRef.current = true

    setFolicularFormData((prev) =>
      remapTreatmentSheetKeys(prev, oldCols, patientSpecificColumns),
    )
    setMedicationFormData((prev) =>
      remapTreatmentSheetKeys(prev, oldCols, patientSpecificColumns),
    )
    setScanFormData((prev) =>
      remapTreatmentSheetKeys(prev, oldCols, patientSpecificColumns),
    )
    setFolicularTemplate((prev) => ({
      ...(prev || {}),
      columns: patientSpecificColumns,
    }))
  }, [patientSpecificColumns, follicularTemplate?.columns])

  const { data: treatmentStatus, isLoading: isTreatmentStatusLoading } =
    useQuery({
      queryKey: treatmentStatusQueryKey,
      queryFn: async () => {
        const responsejson = await getTreatmentStatus(
          user.accessToken,
          patientInfo?.activeVisitId,
          patientInfo?.treatmentDetails?.treatmentTypeId,
        )
        if (responsejson.status == 200) {
          console.log('TreatmentStatus fetched:', {
            visitId: patientInfo?.activeVisitId,
            treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
            TRIGGER_START: responsejson.data?.TRIGGER_START,
          })
          return responsejson.data
        } else {
          throw new Error('Error occurred while fetching treatment status')
        }
      },
      enabled: !!patientInfo?.treatmentDetails,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    })

  useEffect(() => {
    if (treatmentStatus?.eraStartDate) {
      setEraStartTime(
        dayjs(treatmentStatus.eraStartDate).format('YYYY-MM-DDTHH:mm:00[Z]'),
      )
    }
  }, [treatmentStatus?.eraStartDate])

  // const [folicularSheet, setFolicularSheet] = useState('')
  // const { data: defaultTreatmentTemplate } = useQuery({
  //   queryKey: ['defaultTemplate', treatmentStartDate],
  //   queryFn: async () => {
  //     const responsejson = await getTreatmentTemplate(
  //       user.accessToken,
  //       dayjs(treatmentStartDate).format('YYYY-MM-DD'),
  //     )
  //     if (responsejson.status == 200) {
  //       // setFolicularSheet(responsejson.data)
  //       console.log(responsejson.data)
  //       console.log(treatmentStatus)
  //       return responsejson.data
  //     } else {
  //       throw new Error('Error occurred while fetching treatment template')
  //     }
  //   },
  //   // enabled: !!treatmentStartDate && treatmentStatus[0]?.treatmentStatus?.START_ICSI == 0,
  // })
  // console.log('treatmentCycleId', treatmentCycleId)
  const { data: medicationOptionsFollicular } = useQuery({
    queryKey: ['medicationOptionsFollicular', treatmentCycleId],
    queryFn: async () => {
      const res = await getPrescriptionDetailsByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      return res.data
    },
    enabled: !!treatmentCycleId,
  })
  const updateTreatmentSheetMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await updateTreatmentSheetByTreatmentCycleId(
        user.accessToken,
        payload,
      )
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update treatment sheet')
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('treatmentSheet')
    },
    onError: (error) => {
      toast.error(error.message, toastconfig)
    },
  })

  const handleUpdateTreatmentSheet = (temp) => {
    // if (!treatmentCycleId || !folicularFormData || treatmentStatus?.START_ICSI !== 1) {
    //   return
    // }
    console.log(
      'under review consents calling handleUpdateTreatmentSheet',
      temp,
    )
    if (temp !== 'update') {
      updateTreatmentSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify(temp),
      })
    } else {
      updateTreatmentSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify({
          follicularSheet: folicularFormData,
          columns: follicularTemplate?.columns,
          rows: follicularTemplate?.rows,
          medicationRows: medicationFormData?.rows,
          medicationSheet: medicationFormData,
          scanRows: scanFormData?.rows,
          scanSheet: scanFormData,
        }),
      })
    }
  }

  const { data: treatmentSheet } = useQuery({
    queryKey: ['treatmentSheet', treatmentCycleId, patientInfo?.activeVisitId],
    queryFn: async () => {
      const responsejson = await getTreatmentSheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson.status == 200) {
        // console.log(JSON.parse(responsejson.data.template))
        if (responsejson?.data?.template) {
          let res = JSON.parse(responsejson.data.template)
          setFolicularFormData(res?.follicularSheet)
          setMedicationFormData({
            rows: res?.medicationRows,
            ...res?.medicationSheet,
          })
          setScanFormData({
            rows: res?.scanRows,
            ...res?.scanSheet,
          })
          // Fallback: ensure follicularTemplate always has sensible defaults
          const hasValidColumns =
            Array.isArray(res?.columns) && res?.columns.length > 0
          const hasValidRows = Array.isArray(res?.rows) && res?.rows.length > 0

          // Correct follicular scan row values - ALWAYS use these regardless of what's in DB
          const correctRows = [
            { value: '<=10' },
            { value: '10.5' },
            { value: '11' },
            { value: '11.5' },
            { value: '12' },
            { value: '12.5' },
            { value: '13' },
            { value: '13.5' },
            { value: '14' },
            { value: '14.5' },
            { value: '15' },
            { value: '15.5' },
            { value: '16' },
            { value: '16.5' },
            { value: '17' },
            { value: '17.5' },
            { value: '18' },
            { value: '18.5' },
            { value: '19' },
            { value: '19.5' },
            { value: '>=20' },
            { value: 'ET' }, // ET is the last row (index 21)
          ]

          let columns = res?.columns
          // ALWAYS use correct rows format to fix existing templates with wrong values
          let rows = correctRows

          // Check if rows in DB need migration (old format: numeric values like 2, 4, 6, etc.)
          const needsMigration =
            hasValidRows &&
            res?.rows?.some((row, index) => {
              const rowValue = row?.value || row
              // Check if it's a numeric value (old format) or if it doesn't match correct format
              if (typeof rowValue === 'number') return true
              if (typeof rowValue === 'string') {
                // Check if it matches old numeric format or doesn't match correct format
                const numValue = parseInt(rowValue)
                if (!isNaN(numValue) && numValue !== correctRows[index]?.value)
                  return true
                if (index < 21 && rowValue !== correctRows[index]?.value)
                  return true
              }
              return false
            })

          if (!hasValidColumns) {
            // Build a minimal default template with one day
            const defaultColumns = [dayjs().format('DD/MM')]
            columns = defaultColumns
          }

          if (needsMigration && !migrationDoneRef.current) {
            // Migrate old format to new format - preserve data by mapping old indices to new
            console.log(
              'Migrating follicular scan rows from old format to new format',
            )
            migrationDoneRef.current = true // Mark migration as done

            // Map old row indices (based on old values) to new row indices
            // Old format: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22] (11 rows)
            // New format: ['<=10', '10.5', '11', '11.5', '12', '12.5', '13', '13.5', '14', '14.5', '15', '15.5', '16', '16.5', '17', '17.5', '18', '18.5', '19', '19.5', '>=20', 'ET'] (21 rows, ET is last)
            const oldRowValues = res?.rows?.map((r) => r?.value || r) || []
            const oldToNewIndexMap = {}

            // Create mapping: old index -> new index based on closest value match
            oldRowValues.forEach((oldValue, oldIndex) => {
              const numValue =
                typeof oldValue === 'number' ? oldValue : parseInt(oldValue)
              if (!isNaN(numValue)) {
                // Find closest matching new row
                let closestIndex = -1
                let minDiff = Infinity
                correctRows.forEach((newRow, newIndex) => {
                  if (newIndex < 21) {
                    // Exclude ET row (last row)
                    const newValue = newRow.value
                    if (newValue === '<=10' && numValue <= 10) {
                      const diff = Math.abs(10 - numValue)
                      if (diff < minDiff) {
                        minDiff = diff
                        closestIndex = newIndex
                      }
                    } else if (newValue === '>=20' && numValue >= 20) {
                      const diff = Math.abs(20 - numValue)
                      if (diff < minDiff) {
                        minDiff = diff
                        closestIndex = newIndex
                      }
                    } else {
                      const newNumValue = parseFloat(newValue)
                      if (!isNaN(newNumValue)) {
                        const diff = Math.abs(newNumValue - numValue)
                        if (diff < minDiff) {
                          minDiff = diff
                          closestIndex = newIndex
                        }
                      }
                    }
                  }
                })
                if (closestIndex >= 0) {
                  oldToNewIndexMap[oldIndex] = closestIndex
                }
              }
            })

            // Migrate existing follicular form data from old indices to new indices
            if (res?.follicularSheet) {
              const migratedFormData = {}
              Object.keys(res.follicularSheet).forEach((key) => {
                // Key format: `${day}-${side}-${oldIndex}`
                const parts = key.split('-')
                if (parts.length >= 3) {
                  const day = parts[0]
                  const side = parts[1]
                  const oldIndex = parseInt(parts[2])

                  if (
                    !isNaN(oldIndex) &&
                    oldToNewIndexMap.hasOwnProperty(oldIndex)
                  ) {
                    // Map to new index
                    const newIndex = oldToNewIndexMap[oldIndex]
                    migratedFormData[`${day}-${side}-${newIndex}`] =
                      res.follicularSheet[key]
                  } else if (parts[2] === 'note' || key.includes('note')) {
                    // Keep notes as-is
                    migratedFormData[key] = res.follicularSheet[key]
                  } else {
                    // Keep original if can't map
                    migratedFormData[key] = res.follicularSheet[key]
                  }
                } else {
                  // Keep non-standard keys
                  migratedFormData[key] = res.follicularSheet[key]
                }
              })
              setFolicularFormData(migratedFormData)
              // Note: Migration fixes the display. User can manually click "UPDATE SHEET" to save.
              // This prevents continuous popup windows.
            }
          }
          setFolicularTemplate({
            columns,
            rows,
          })
        } else {
          // No template returned from API. If ICSI is started, create a safe default
          if (treatmentStatus?.START_ICSI == 1) {
            const defaultColumns = [dayjs().format('DD/MM')]
            // Use the correct follicular scan row values matching backend
            const defaultRows = [
              { value: '<=10' },
              { value: '10.5' },
              { value: '11' },
              { value: '11.5' },
              { value: '12' },
              { value: '12.5' },
              { value: '13' },
              { value: '13.5' },
              { value: '14' },
              { value: '14.5' },
              { value: '15' },
              { value: '15.5' },
              { value: '16' },
              { value: '16.5' },
              { value: '17' },
              { value: '17.5' },
              { value: '18' },
              { value: '18.5' },
              { value: '19' },
              { value: '19.5' },
              { value: '>=20' },
              { value: 'ET' },
              { value: 'Notes' }, // Notes row at the end
            ]
            setFolicularFormData({})
            setMedicationFormData({})
            setScanFormData({})
            setFolicularTemplate({
              columns: defaultColumns,
              rows: defaultRows,
            })
          } else {
            setFolicularFormData({})
            setMedicationFormData({})
            setScanFormData({})
            setFolicularTemplate({})
          }
        }
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching treatment sheet')
      }
    },
    enabled:
      !!treatmentCycleId &&
      (treatmentStatus?.START_ICSI == 1 ||
        treatmentStatus?.START_IUI == 1 ||
        treatmentStatus?.START_OITI == 1),
  })

  const { data: treatmentFETSheet } = useQuery({
    queryKey: [
      'treatmentFETSheet',
      treatmentCycleId,
      patientInfo?.activeVisitId,
    ],
    queryFn: async () => {
      const responsejson = await getTreatmentFETSheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )

      if (responsejson.status == 200) {
        if (responsejson?.data?.template) {
          const res = JSON.parse(responsejson?.data?.template)
          // Fallback guards for malformed templates
          const hasValidColumns =
            Array.isArray(res?.columns) && res?.columns.length > 0
          const hasValidMedRows =
            Array.isArray(res?.medicationRows) &&
            res?.medicationRows.length >= 0
          const hasValidScanRows =
            Array.isArray(res?.scanRows) && res?.scanRows.length >= 0

          const columns = hasValidColumns
            ? res?.columns
            : [dayjs().format('DD/MM')]
          const medicationRows = hasValidMedRows ? res?.medicationRows : []
          const scanRows = hasValidScanRows ? res?.scanRows : []
          const candidateRows =
            Array.isArray(res?.medicationSheet?.rows) &&
            res.medicationSheet.rows.length > 0
              ? res.medicationSheet.rows
              : medicationRows
          const autofilledRows = getAutofilledMedicationRows(
            { ...res?.medicationSheet, rows: candidateRows },
            columns,
          )
          const fetMedicationFormData = {
            ...buildMedicationFormData(autofilledRows, res?.medicationSheet),
            rows: autofilledRows,
          }

          setFETFormData(fetMedicationFormData)
          setFETTemplate({
            columns,
            rows: fetMedicationFormData.rows,
          })
          setScanFetFormData({
            rows: scanRows,
            ...res?.scanSheet,
          })
        } else {
          // No template returned from API. If FET is started, create a safe default
          if (treatmentStatus?.FET_START == 1) {
            setFETFormData({ rows: [] })
            setFETTemplate({
              columns: [dayjs().format('DD/MM')],
              rows: [],
            })
            setScanFetFormData({ rows: [] })
          } else {
            setFETFormData({})
            setFETTemplate({})
            setScanFetFormData({})
          }
        }
      } else {
        throw new Error('Error occurred while fetching treatment sheet')
      }
      return responsejson.data
    },
    enabled: !!treatmentCycleId && treatmentStatus?.FET_START == 1,
  })

  const { data: treatmentERASheet } = useQuery({
    queryKey: [
      'treatmentERASheet',
      treatmentCycleId,
      patientInfo?.activeVisitId,
      treatmentStatus?.START_ERA, // Add this to refetch when status changes
    ],
    queryFn: async () => {
      // Only proceed if ERA is started and we have treatment cycle ID
      if (!treatmentCycleId || !treatmentStatus?.START_ERA) {
        return null
      }

      const responsejson = await getTreatmentERASheetByTreatmentCycleId(
        user.accessToken,
        treatmentCycleId,
      )
      if (responsejson.status == 200) {
        if (responsejson?.data?.template) {
          const res = JSON.parse(responsejson?.data?.template)
          const columns =
            Array.isArray(res?.columns) && res.columns.length > 0
              ? res.columns
              : [dayjs().format('DD/MM')]
          // Use timeout to ensure state updates after modal reopens
          setTimeout(() => {
            setERAFormData({
              rows: res?.medicationRows,
              ...res?.medicationSheet,
            })
            setERATemplate({
              columns,
              rows: res?.medicationRows,
              follicularRows: res?.rows?.length
                ? res.rows
                : DEFAULT_FOLLICULAR_ROWS,
            })
            setEraFolicularFormData(res?.follicularSheet || {})
            setScanEraFormData({
              rows: res?.scanRows,
              ...res?.scanSheet,
            })
          }, 200)
        } else {
          setERAFormData({})
          setERATemplate({})
          setEraFolicularFormData({})
        }
      } else {
        throw new Error('Error occurred while fetching treatment sheet')
      }
      return responsejson.data
    },
    enabled: !!patientInfo?.activeVisitId, // Always enable the query
  })

  const buildStartTreatmentPayload = (overrides = {}) => {
    const payload = {
      createType: 'Treatment',
      type: treatmentForm.type,
      treatmentTypeId: treatmentForm.treatmentTypeId,
      visitId: patientInfo?.activeVisitId,
      ...overrides,
    }

    if (type === 'Consultation' && appointmentId) {
      payload.consultationAppointmentId = appointmentId
    }

    if (treatmentForm.isPackageExists) {
      payload.packageAmount = Number(treatmentForm.packageAmount)
    }

    return payload
  }

  const createTreatment = useMutation({
    mutationFn: async (payload) => {
      const res = await createConsultationOrTreatment(user.accessToken, payload)
      if (res.status === 400) {
        toast.error(res.message)
        throw new Error(res.message)
      }
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to start treatment')
      }
      return res
    },
    onSuccess: (res) => {
      toast.success(res.message)
      dispatch(closeModal())

      const convertedAppointmentId = res?.data?.convertedAppointmentId
      const treatmentCycleIdFromResponse = res?.data?.id

      if (convertedAppointmentId && treatmentCycleIdFromResponse) {
        const updatedPatient = {
          ...selectedPatient,
          type: 'Treatment',
          treatmentCycleId: treatmentCycleIdFromResponse,
          appointmentId: convertedAppointmentId,
          consultationId: null,
        }

        if (onTreatmentStarted) {
          onTreatmentStarted(updatedPatient)
        }

        if (setSelectedPatient) {
          setSelectedPatient(updatedPatient)
        }
      }

      queryClient.invalidateQueries('treatmentStatus')
      queryClient.invalidateQueries('patientInfoForDoctor')
      queryClient.invalidateQueries('appointmentsForDoctor')
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message)
      }
    },
  })

  const [reviewAppointmentForm, setReviewAppointmentForm] = useState(null)
  const reviewConsentsICSI = useMutation({
    mutationFn: async ({ visitId, treatmentStartDate }) => {
      const res = await reviewIcsiConsents(user.accessToken, visitId, {
        visitId,
        stage: 'START_ICSI',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
        treatmentStartDate,
      })
      if (res.status == 200) {
        toast.success('Consents reviewed successfully')
        const defaultTreatmentTemplate = res.data
        if (defaultTreatmentTemplate) {
          setFolicularTemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
          })
          setMedicationFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setScanFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.scanSheet,
          })
          // console.log('under review consents calling handleUpdateTreatmentSheet')
          // queryClient.invalidateQueries('treatmentStatus')
          let temp = {
            follicularSheet: folicularFormData,
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
            medicationRows: defaultTreatmentTemplate?.medicationSheet,
            medicationSheet: [],
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentSheet(temp)
        } else {
          dispatch(closeModal())
          queryClient.invalidateQueries('treatmentStatus')
        }
      } else {
        toast.error(res.message)
      }
    },
  })

  const startIUIMutation = useMutation({
    mutationFn: async ({ visitId, treatmentStartDate }) => {
      const res = await updateTreatmentStatus(user.accessToken, {
        visitId,
        stage: 'START_IUI',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
        treatmentStartDate,
      })
      if (res.status == 200) {
        toast.success('Consents reviewed successfully')
        const defaultTreatmentTemplate = res.data
        if (defaultTreatmentTemplate) {
          setFolicularTemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
          })
          setMedicationFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setScanFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.scanSheet,
          })
          // console.log('under review consents calling handleUpdateTreatmentSheet')
          // queryClient.invalidateQueries('treatmentStatus')
          let temp = {
            follicularSheet: folicularFormData,
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
            medicationRows: defaultTreatmentTemplate?.medicationSheet,
            medicationSheet: [],
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentSheet(temp)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  const startOITIMutation = useMutation({
    mutationFn: async ({ visitId, treatmentStartDate }) => {
      const res = await updateTreatmentStatus(user.accessToken, {
        visitId,
        stage: 'START_OITI',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
        treatmentStartDate,
      })
      if (res.status == 200) {
        toast.success('Consents reviewed successfully')
        const defaultTreatmentTemplate = res.data
        if (defaultTreatmentTemplate) {
          setFolicularTemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
          })
          setMedicationFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.medicationSheet,
          })
          setScanFormData({
            // columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.scanSheet,
          })
          // console.log('under review consents calling handleUpdateTreatmentSheet')
          // queryClient.invalidateQueries('treatmentStatus')
          let temp = {
            follicularSheet: folicularFormData,
            columns: defaultTreatmentTemplate?.date,
            rows: defaultTreatmentTemplate?.follicularSheet,
            medicationRows: defaultTreatmentTemplate?.medicationSheet,
            medicationSheet: [],
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentSheet(temp)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  const startHysteroscopyMutation = useMutation({
    mutationFn: async (visitId) => {
      const res = await updateTreatmentStatus(user.accessToken, {
        visitId,
        stage: 'START_HYSTEROSCOPY',
        hysteroscopyTime,
        treatmentStartDate: dayjs(hysteroscopyTime).format('YYYY-MM-DD'),
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to start Hystero/Lap')
      }
      return res
    },
    onSuccess: async (res) => {
      const visitId = patientInfo?.activeVisitId
      const treatmentType = patientInfo?.treatmentDetails?.treatmentTypeId
      const defaultTreatmentTemplate = res.data

      if (defaultTreatmentTemplate) {
        setHysteroscopyTemplate(defaultTreatmentTemplate)
      }

      queryClient.setQueryData(treatmentStatusQueryKey, (current) => ({
        ...(current || {}),
        START_HYSTEROSCOPY: 1,
      }))

      await refetchTreatmentStatus(visitId, treatmentType)
      queryClient.invalidateQueries({
        queryKey: ['hysteroscopySheet', resolvedHysteroscopyVisitId],
      })

      toast.success('Hystero/Lap started successfully', toastconfig)
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to start Hystero/Lap', toastconfig)
    },
  })
  const updateTreatmentFETSheetMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await updateTreatmentFETSheetByTreatmentCycleId(
        user.accessToken,
        payload,
      )
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update treatment sheet')
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('treatmentFETSheet')
    },
  })
  const updateHysteroscopySheetMutation = useMutation({
    mutationFn: async (visitId) => {
      const res = await updateHysteroscopySheetByVisitId(user.accessToken, {
        visitId,
        hysteroscopyTemplate: JSON.stringify(hysteroscopyTemplate),
      })
      if (res.status == 200) {
        toast.success('Updated Successfully', toastconfig)
        queryClient.invalidateQueries('hysteroscopySheet')
      } else {
        toast.error(res.message, toastconfig)
      }

      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('hysteroscopySheet')
    },
  })
  const { data: hysteroscopySheet } = useQuery({
    queryKey: ['hysteroscopySheet', resolvedHysteroscopyVisitId],
    queryFn: async () => {
      const res = await getHysteroscopySheetByVisitId(
        user.accessToken,
        resolvedHysteroscopyVisitId,
      )
      if (res.status == 200) {
        setHysteroscopyTemplate(res.data.hysteroscopySheet)
        return res.data.hysteroscopySheet
      } else {
        throw new Error(res.message || 'Failed to get treatment sheet')
      }
    },
    enabled: Number.isFinite(resolvedHysteroscopyVisitId),
  })

  // New structured hysteroscopy report query
  const { data: hysteroscopyReport } = useQuery({
    queryKey: [
      'hysteroscopyReport',
      resolvedHysteroscopyPatientId,
      resolvedHysteroscopyVisitId,
    ],
    queryFn: async () => {
      if (
        !Number.isFinite(resolvedHysteroscopyPatientId) ||
        !Number.isFinite(resolvedHysteroscopyVisitId)
      ) {
        return null
      }
      const res = await getHysteroscopyReport(
        user.accessToken,
        resolvedHysteroscopyPatientId,
        resolvedHysteroscopyVisitId,
      )
      if (res.status == 200 && res.data) {
        const report = Array.isArray(res.data) ? res.data[0] : res.data
        if (!report) return null
        setHysteroscopyReportId(report.id)
        return report
      }
      return null
    },
    enabled:
      Number.isFinite(resolvedHysteroscopyPatientId) &&
      Number.isFinite(resolvedHysteroscopyVisitId),
  })

  useEffect(() => {
    if (hysteroscopyReport?.formType) {
      setSelectedHysteroLapType(hysteroscopyReport.formType)
    }
  }, [hysteroscopyReport?.formType])

  const isHysteroLapStarted = useMemo(() => {
    if (treatmentStatus?.START_HYSTEROSCOPY === 1) return true
    if (hysteroscopyReport?.id || hysteroscopyReport?.formType) return true
    if (hysteroscopySheet) return true
    return false
  }, [
    treatmentStatus?.START_HYSTEROSCOPY,
    hysteroscopyReport?.id,
    hysteroscopyReport?.formType,
    hysteroscopySheet,
  ])

  useEffect(() => {
    setHysteroscopyTemplate(null)
    setHysteroscopyReportId(null)
    setSelectedHysteroLapType(null)
    setHysteroscopyTime(null)
  }, [resolvedHysteroscopyVisitId, resolvedHysteroscopyPatientId])

  // Mutations for structured hysteroscopy report
  const createHysteroscopyReportMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await createHysteroscopyReport(user.accessToken, payload)
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to create hysteroscopy report')
      }
      return res.data
    },
    onSuccess: (data) => {
      setHysteroscopyReportId(data.id)
      queryClient.invalidateQueries('hysteroscopyReport')
      toast.success('Hystero/Lap report saved successfully', toastconfig)
      dispatch(closeModal())
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save report', toastconfig)
    },
  })

  const updateHysteroscopyReportMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await updateHysteroscopyReport(user.accessToken, id, payload)
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update hysteroscopy report')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries('hysteroscopyReport')
      toast.success('Hystero/Lap report updated successfully', toastconfig)
      dispatch(closeModal())
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update report', toastconfig)
    },
  })
  const handleUpdateTreatmentFETSheet = (temp) => {
    console.log(temp, fetFormData)
    if (temp !== 'update') {
      updateTreatmentFETSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify(temp),
      })
    } else {
      updateTreatmentFETSheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify({
          columns: fetTemplate?.columns,
          medicationRows: fetFormData?.rows,
          medicationSheet: fetFormData,
          scanRows: scanFetFormData?.rows,
          scanSheet: scanFetFormData,
        }),
      })
    }
  }
  const reviewConsentsFET = useMutation({
    mutationFn: async ({ visitId, treatmentStartDate }) => {
      const res = await reviewFETConsents(user.accessToken, visitId, {
        visitId,
        stage: 'START_FET',
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
        treatmentStartDate,
      })
      if (res.status == 200) {
        const defaultTreatmentTemplate = res.data
        toast.success('Consents reviewed successfully')
        if (defaultTreatmentTemplate) {
          const fetMedicationFormData = buildMedicationFormData([])
          setFETFormData(fetMedicationFormData)
          setFETTemplate({
            columns: defaultTreatmentTemplate?.date,
            rows: [],
          })
          setScanFetFormData({
            rows: defaultTreatmentTemplate?.scanSheet,
          })
          let temp = {
            columns: defaultTreatmentTemplate?.date,
            medicationRows: [],
            medicationSheet: fetMedicationFormData,
            scanRows: defaultTreatmentTemplate?.scanSheet,
            scanSheet: [],
          }
          handleUpdateTreatmentFETSheet(temp)
        }
      } else {
        toast.error(res.message)
      }
    },
  })
  const reviewConsentsERA = useMutation({
    mutationFn: async ({ visitId, treatmentStartDate }) => {
      try {
        const res = await reviewEraConsents(user.accessToken, visitId, {
          visitId,
          stage: 'ERA_START',
          treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
          treatmentStartDate,
        })

        if (res.status === 200) {
          // Initialize empty ERA form data
          const initialTemplate = res.data || {
            date: [treatmentStartDate],
            medicationSheet: [],
            scanSheet: [],
          }

          // Create treatment sheet template
          const temp = {
            columns: initialTemplate.date || [dayjs().format('DD/MM')],
            rows: initialTemplate.follicularSheet || DEFAULT_FOLLICULAR_ROWS,
            follicularSheet: {},
            medicationRows: [],
            medicationSheet: [],
            scanRows: initialTemplate?.scanSheet || [],
            scanSheet: [],
          }

          // Update treatment status and data
          await Promise.all([
            queryClient.invalidateQueries('treatmentStatus'),
            queryClient.invalidateQueries([
              'treatmentERASheet',
              treatmentCycleId,
            ]),
          ])

          // Set initial form data
          setERAFormData({
            rows: initialTemplate.medicationSheet || [],
          })
          setERATemplate({
            columns: initialTemplate.date || [dayjs().format('DD/MM')],
            rows: initialTemplate.medicationSheet || [],
            follicularRows:
              initialTemplate.follicularSheet || DEFAULT_FOLLICULAR_ROWS,
          })
          setEraFolicularFormData({})
          setScanEraFormData({
            rows: initialTemplate.scanSheet || [],
          })

          // Update treatment sheet
          await handleUpdateTreatmentERASheet(temp)

          // Reset eraStartTime
          setEraStartTime(null)

          // Force modal refresh
          dispatch(closeModal())
          setTimeout(() => {
            dispatch(openModal(`ERA${patientInfo?.activeVisitId}`))
            toast.success('ERA treatment started successfully')
          }, 100)

          return res.data
        }

        throw new Error(res.message || 'Failed to start ERA treatment')
      } catch (error) {
        console.error('Error starting ERA treatment:', error)
        toast.error(error.message || 'Failed to start ERA treatment')
        throw error
      }
    },
  })
  const updateEraStartTimeMutation = useMutation({
    mutationFn: async (startTime) => {
      const res = await updateTreatmentStatus(user.accessToken, {
        visitId: patientInfo?.activeVisitId,
        stage: 'UPDATE_ERA_START_TIME',
        eraStartTime: startTime,
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
      })
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update ERA start time')
      }
      return res.data
    },
    onSuccess: (data) => {
      if (data?.date) {
        setERATemplate((prev) => ({
          ...prev,
          columns: data.date,
        }))
      }
      queryClient.invalidateQueries(treatmentStatusQueryKey)
      queryClient.invalidateQueries('treatmentERASheet')
      toast.success('ERA start time updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ERA start time')
    },
  })
  function EndTreatmentModal({ type, visitId, onClose }) {
    const [selectedReason, setSelectedReason] = useState(null)
    const [selectedSubReason, setSelectedSubReason] = useState(null)
    const [customReason, setCustomReason] = useState('')
    const queryClient = useQueryClient()

    // Define end options for each treatment type
    const END_OPTIONS = {
      ICSI: [
        { value: 'FREEZE', label: 'Freeze All' },
        // { value: 'FAILED', label: 'Treatment Failed' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      FET: [
        { value: 'UPT_POSITIVE', label: 'UPT POSITIVE' },
        { value: 'UPT_NEGATIVE', label: 'UPT NEGATIVE' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      IUI: [
        { value: 'UPT_POSITIVE', label: 'UPT POSITIVE' },
        { value: 'UPT_NEGATIVE', label: 'UPT NEGATIVE' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      OITI: [
        { value: 'UPT_POSITIVE', label: 'UPT POSITIVE' },
        { value: 'UPT_NEGATIVE', label: 'UPT NEGATIVE' },
        { value: 'CANCEL', label: 'Other Reason' },
      ],
      // HYSTEROSCOPY: [
      //   { value: 'CANCEL', label: 'Other Reason' },
      // ],
    }

    const endStageFlagKey =
      type === 'ICSI'
        ? 'END_ICSI'
        : type === 'FET'
          ? 'END_FET'
          : type === 'IUI'
            ? 'END_IUI'
            : type === 'OITI'
              ? 'END_OITI'
              : null

    const {
      mutate: updateTreatmentStatusMutation,
      isPending: isEndingTreatment,
    } = useMutation({
      mutationFn: async (payload) => {
        const res = await updateTreatmentStatus(user.accessToken, payload)
        if (res.status !== 200) {
          throw new Error(res.message || 'Failed to end treatment')
        }
        return res
      },
      onSuccess: async (res) => {
        const vid = patientInfo?.activeVisitId
        const treatmentTypeId = patientInfo?.treatmentDetails?.treatmentTypeId
        const statusKey = ['treatmentStatus', vid, treatmentTypeId]
        const readStatus = () => queryClient.getQueryData(statusKey)
        await queryClient.invalidateQueries({
          queryKey: ['treatmentStatus'],
          exact: false,
        })
        await queryClient.refetchQueries({
          queryKey: statusKey,
        })
        let updatedStatus = readStatus()
        let confirmed =
          endStageFlagKey && updatedStatus?.[endStageFlagKey] === 1
        if (!confirmed) {
          await new Promise((r) => setTimeout(r, 500))
          await queryClient.refetchQueries({ queryKey: statusKey })
          updatedStatus = readStatus()
          confirmed = endStageFlagKey && updatedStatus?.[endStageFlagKey] === 1
        }
        if (confirmed) {
          toast.success(
            res.message ||
              (typeof res.data === 'string' ? res.data : null) ||
              `${type} treatment ended successfully`,
            toastconfig,
          )
          onClose()
        } else {
          toast.warning(
            'Treatment end may not have saved correctly. Please refresh the page.',
            toastconfig,
          )
          onClose()
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to end treatment', toastconfig)
      },
    })

    const handleEndTreatment = () => {
      if (!selectedReason) {
        toast.error('Please select a reason')
        return
      }

      const stageMap = {
        ICSI: 'END_ICSI',
        FET: 'END_FET',
        IUI: 'END_IUI',
        OITI: 'END_OITI',
      }
      const endReasonMap = {
        FET: 'fetEndedReason',
        ICSI: 'endedReason',
        IUI: 'endedReason',
        OITI: 'endedReason',
      }
      const payload = {
        visitId,
        stage: stageMap[type],
        treatmentType: patientInfo?.treatmentDetails?.treatmentTypeId,
        [endReasonMap[type]]:
          selectedReason.value === 'CANCEL'
            ? customReason
            : selectedReason.label,
      }

      updateTreatmentStatusMutation(payload)
    }

    return (
      <div className="p-6 flex flex-col gap-6">
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            End {type} Treatment
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="text-center">
          <Typography variant="body2" className="text-gray-600">
            Are you sure you want to end this {type} treatment? This action
            cannot be undone.
          </Typography>
        </div>

        <Autocomplete
          options={END_OPTIONS[type]}
          value={selectedReason}
          onChange={(_, newValue) => {
            setSelectedReason(newValue)
            if (newValue?.value !== 'CANCEL') {
              setCustomReason('')
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Reason"
              required
              className="bg-white"
            />
          )}
        />

        {selectedReason?.value === 'CANCEL' && (
          <TextField
            label="Enter Reason"
            required
            multiline
            rows={3}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="bg-white"
          />
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="contained"
            color="error"
            onClick={handleEndTreatment}
            className="capitalize"
            disabled={
              isEndingTreatment ||
              (selectedReason?.value === 'CANCEL' && !customReason)
            }
          >
            End {type}
          </Button>
        </div>
      </div>
    )
  }
  function CloseVisitModal({ type, visitId, onClose, consultationId }) {
    const [selectedReason, setSelectedReason] = useState(null)
    const [selectedSubReason, setSelectedSubReason] = useState(null)
    const [customReason, setCustomReason] = useState('')
    const queryClient = useQueryClient()

    const END_OPTIONS = [
      { value: 'Completed', label: 'Completed' },
      { value: 'Cancelled', label: 'Cancelled' },
    ]

    const UPT_OPTIONS = [
      { value: 'UPT_POSITIVE', label: 'UPT Positive' },
      { value: 'UPT_NEGATIVE', label: 'UPT Negative' },
    ]

    const handleReasonChange = (_, newValue) => {
      setSelectedReason(newValue)
      setSelectedSubReason(null)
      setCustomReason('')
    }

    const { mutate: updateVisitStatusMutation } = useMutation({
      mutationFn: async (payload) => {
        let res
        if (type == 'Treatment') {
          console.log(payload, type)
          res = await closeVisitInTreatment(user.accessToken, payload, visitId)
        } else {
          res = await closeVisitInConsultation(
            user.accessToken,
            payload,
            visitId,
          )
        }
        if (res.status === 200) {
          queryClient.invalidateQueries('treatmentStatus')
          // Invalidate appointments list so patient disappears from doctor's appointments
          queryClient.invalidateQueries('appointmentsForDoctor')
          toast.success('Visit closed successfully')
          onClose()
        } else {
          toast.error(res.message, toastconfig)
        }
      },
    })

    const handleCloseVisit = () => {
      if (!selectedReason) {
        toast.error('Please select a reason')
        return
      }

      if (selectedReason.value === 'Completed' && !selectedSubReason) {
        toast.error('Please select UPT status')
        return
      }

      if (selectedReason.value === 'Cancelled' && !customReason) {
        toast.error('Please enter cancellation reason')
        return
      }
      let payload
      if (type == 'Treatment') {
        payload = {
          patientId: patientInfo?.id,
          type: type,
          appointmentId: appointmentId,
          treatmentCycleId: treatmentCycleId,
          visitClosedStatus: selectedReason.value,
          visitClosedReason:
            selectedReason.value === 'Completed'
              ? selectedSubReason.label
              : customReason,
        }
      } else {
        payload = {
          patientId: patientInfo?.id,
          type: type,
          appointmentId: appointmentId,
          consultationId: consultationId,
          visitClosedStatus: selectedReason.value,
          visitClosedReason:
            selectedReason.value === 'Completed'
              ? selectedSubReason.label
              : customReason,
        }
      }
      console.log(payload)
      updateVisitStatusMutation(payload)
    }

    return (
      <div className="flex flex-col gap-6">
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            Close Visit
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="text-center">
          <Typography variant="body2" className="text-gray-600">
            Are you sure you want to close this visit? This action cannot be
            undone. This will close the visit and all the treatments associated
            with it.
          </Typography>
        </div>

        <Autocomplete
          options={END_OPTIONS}
          value={selectedReason}
          onChange={handleReasonChange}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Reason"
              required
              className="bg-white"
            />
          )}
        />

        {selectedReason?.value === 'Completed' && (
          <Autocomplete
            options={UPT_OPTIONS}
            value={selectedSubReason}
            onChange={(_, newValue) => setSelectedSubReason(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select UPT Status"
                required
                className="bg-white"
              />
            )}
          />
        )}

        {selectedReason?.value === 'Cancelled' && (
          <TextField
            label="Enter Cancellation Reason"
            required
            multiline
            rows={3}
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="bg-white"
          />
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="contained"
            color="error"
            onClick={handleCloseVisit}
            className="capitalize"
            disabled={
              !selectedReason ||
              (selectedReason.value === 'Completed' && !selectedSubReason) ||
              (selectedReason.value === 'Cancelled' && !customReason)
            }
          >
            Proceed to Close Visit
          </Button>
        </div>
      </div>
    )
  }

  const startDispatchTriggerModal = () => {
    dispatch(openModal('triggerDate'))
  }

  const handleActionOnStartTrigger = () => {
    // Prevent multiple clicks
    if (isUpdatingTrigger) {
      return
    }

    // Validate trigger time
    if (!triggerTime) {
      toast.error('Please select a trigger time', toastconfig)
      return
    }

    // Validate patient info
    if (
      !patientInfo?.activeVisitId ||
      !patientInfo?.treatmentDetails?.treatmentTypeId
    ) {
      toast.error(
        'Patient information is missing. Please refresh the page.',
        toastconfig,
      )
      return
    }

    // Confirm action
    if (!confirm('Are you sure you want to start trigger?')) {
      return
    }

    // Call mutation — send legacy wall-clock + Z string (backend subtracts IST offset)
    updateTreatmentStatusMutation(
      {
        visitId: patientInfo.activeVisitId,
        stage: 'TRIGGER_START',
        triggerTime: triggerTime.format('YYYY-MM-DDTHH:mm:00[Z]'),
        treatmentType: patientInfo.treatmentDetails.treatmentTypeId,
      },
      {
        onSuccess: () => {
          // Close modal after successful mutation
          dispatch(closeModal('triggerDate'))
          // Reset trigger time
          setTriggerTime(null)
          // The mutation's onSuccess handler will handle the refetch and success message
        },
        onError: () => {
          // Keep modal open on error so user can retry
        },
      },
    )
  }
  const { data: activeVisitAppointments } = useQuery({
    queryKey: ['activeVisitAppointments', patientInfo?.activeVisitId],
    queryFn: async () => {
      const res = await getAllActiveVisitAppointments(
        user.accessToken,
        patientInfo?.activeVisitId,
      )
      return res.data
    },
    enabled: !!patientInfo?.activeVisitId,
  })
  // console.log(activeVisitAppointments, patientInfo)

  const updateTreatmentERASheetMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await updateTreatmentERASheetByTreatmentCycleId(
        user.accessToken,
        payload,
      )
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to update treatment sheet')
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Updated Successfully', toastconfig)
      queryClient.invalidateQueries('treatmentERASheet')
    },
  })

  const handleUpdateTreatmentERASheet = (temp) => {
    if (temp !== 'update') {
      updateTreatmentERASheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify(temp),
      })
    } else {
      updateTreatmentERASheetMutation.mutate({
        id: treatmentCycleId,
        template: JSON.stringify({
          columns: eraTemplate?.columns,
          rows: eraTemplate?.follicularRows || DEFAULT_FOLLICULAR_ROWS,
          follicularSheet: eraFolicularFormData,
          medicationRows: eraFormData?.rows,
          medicationSheet: eraFormData,
          scanSheet: scanEraFormData,
          scanRows: scanEraFormData?.rows,
        }),
      })
    }
  }

  return (
    <div className="pr-3 flex flex-wrap justify-end gap-3">
      <PatientPrescription
        allBillTypeValues={allBillTypeValues}
        type={type}
        appointmentId={appointmentId}
        activeVisitAppointments={activeVisitAppointments}
        patientId={patientInfo?.patientId}
        patientName={
          selectedPatient?.patientName ||
          patientInfo?.patientName ||
          patientInfo?.name ||
          patientInfo?.fullName ||
          [
            patientInfo?.firstName,
            patientInfo?.middleName,
            patientInfo?.lastName,
          ]
            .filter(Boolean)
            .join(' ') ||
          ''
        }
      />

      <SpousePrescription
        allBillTypeValues={allBillTypeValues}
        type={type}
        appointmentId={appointmentId}
        activeVisitAppointments={activeVisitAppointments}
      />

      {type == 'Treatment' && (
        <>
          {treatmentStatus?.START_ICSI >= 0 && (
            <ButtonGroup variant="outlined" className="border overflow-hidden">
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                ICSI
              </span>
              <Button
                variant="contained"
                className="text-white capitalize px-6"
                onClick={() =>
                  dispatch(openModal('ICSI' + patientInfo?.activeVisitId))
                }
                sx={{
                  borderRadius: 0,
                }}
              >
                {treatmentStatus?.START_ICSI == 1
                  ? treatmentStatus?.END_ICSI == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.START_ICSI == 1 &&
                treatmentStatus?.END_ICSI >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize px-6"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-ICSI'))}
                    disabled={!isAyeshaBegum && treatmentStatus?.END_ICSI == 1}
                    sx={{
                      borderRadius: 0,
                      borderLeft: '1px solid rgba(0,0,0,0.12)',
                    }}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {treatmentStatus?.START_IUI >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                IUI
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() =>
                  dispatch(openModal('IUI' + patientInfo?.activeVisitId))
                }
              >
                {treatmentStatus?.START_IUI == 1
                  ? treatmentStatus?.END_IUI == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.START_IUI == 1 &&
                treatmentStatus?.END_IUI >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-IUI'))}
                    disabled={treatmentStatus?.END_IUI == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {treatmentStatus?.START_OITI >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                OITI
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() =>
                  dispatch(openModal('OITI' + patientInfo?.activeVisitId))
                }
              >
                {treatmentStatus?.START_OITI == 1
                  ? treatmentStatus?.END_OITI == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.START_OITI == 1 &&
                treatmentStatus?.END_OITI >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-OITI'))}
                    disabled={treatmentStatus?.END_OITI == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* END OITI */}
          {/* {treatmentStatus?.START_OITI == 1 && treatmentStatus?.END_OITI >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-OITI'))}
              disabled={treatmentStatus?.END_OITI == 1}
            >
              End OITI
            </Button>
          )} */}
          {/* END IUI */}
          {/* {treatmentStatus?.START_IUI == 1 && treatmentStatus?.END_IUI >= 0 && (
            <Button
              variant="outlined"
              className="capitalize "
              color="error"
              onClick={() => dispatch(openModal('endTreatment-IUI'))}
              disabled={treatmentStatus?.END_IUI == 1}
            >
              End IUI
            </Button>
          )} */}
          {/* END ICSI */}
          {/* {treatmentStatus?.START_ICSI == 1 && treatmentStatus?.END_ICSI >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-ICSI'))}
              disabled={treatmentStatus?.END_ICSI == 1}
            >
              End ICSI
            </Button>
          )} */}
          {treatmentStatus?.TRIGGER_START >= 0 && (
            <Button
              variant="contained"
              className=" capitalize text-white"
              onClick={startDispatchTriggerModal}
              disabled={
                treatmentStatus?.TRIGGER_START == 1 || isUpdatingTrigger
              }
            >
              {isUpdatingTrigger
                ? 'Starting Trigger...'
                : treatmentStatus?.TRIGGER_START == 1
                  ? 'Trigger Started'
                  : 'Start Trigger'}
            </Button>
          )}
          <Modal
            uniqueKey="triggerDate"
            closeOnOutsideClick={true}
            onOutsideClick={() => setTriggerTime(null)}
          >
            <div className="flex justify-between">
              <Typography variant="h6" className="text-gray-800 mb-2">
                Trigger
              </Typography>
              <IconButton onClick={() => dispatch(closeModal())}>
                <Close />
              </IconButton>
            </div>
            <div className="flex flex-col gap-2 items-center">
              <DateTimePicker
                label="Trigger Time"
                className="bg-white rounded-lg w-max-content"
                name="triggerTime"
                format="DD/MM/YYYY hh:mm A"
                value={triggerTime}
                onChange={(newValue) =>
                  setTriggerTime(
                    newValue && dayjs(newValue).isValid()
                      ? dayjs(newValue)
                      : null,
                  )
                }
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  // seconds: renderTimeViewClock,
                }}
              />
              <h5 className="text-sm mt-2 text-gray-800 flex items-center gap-2">
                <InfoOutlined />
                Please Provide Trigger Time to proceed further
              </h5>
              <Button
                variant="contained"
                className="text-white capitalize mt-5"
                disabled={!triggerTime || isUpdatingTrigger}
                onClick={handleActionOnStartTrigger}
              >
                {isUpdatingTrigger ? 'Starting...' : 'Start Trigger'}
              </Button>
            </div>
          </Modal>

          {treatmentStatus?.FET_START >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                FET
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() =>
                  dispatch(openModal('FET' + patientInfo?.activeVisitId))
                }
              >
                {treatmentStatus?.FET_START == 1
                  ? treatmentStatus?.END_FET == 0
                    ? 'Update'
                    : 'View'
                  : 'Start'}
              </Button>
              {treatmentStatus?.FET_START == 1 &&
                treatmentStatus?.END_FET >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-FET'))}
                    disabled={treatmentStatus?.END_FET == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* {treatmentStatus?.FET_START == 1 && treatmentStatus?.END_FET >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-FET'))}
              disabled={treatmentStatus?.END_FET == 1}
            >
              End FET
            </Button>
          )} */}

          {treatmentStatus?.START_ERA >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                ERA
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() => {
                  if (treatmentStatus?.START_ERA == 0) {
                    dispatch(openModal('ERA' + patientInfo?.activeVisitId))
                  } else {
                    dispatch(openModal('ERA' + patientInfo?.activeVisitId))
                  }
                }}
                disabled={
                  treatmentStatus?.START_ERA == 0 && reviewConsentsERA.isLoading
                }
              >
                {treatmentStatus?.START_ERA == 0 && reviewConsentsERA.isLoading
                  ? 'Starting...'
                  : treatmentStatus?.START_ERA == 1
                    ? treatmentStatus?.END_ERA == 0
                      ? 'Update'
                      : 'View'
                    : 'Start'}
              </Button>
              {treatmentStatus?.START_ERA == 1 &&
                treatmentStatus?.END_ERA >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() => dispatch(openModal('endTreatment-ERA'))}
                    disabled={treatmentStatus?.END_ERA == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* {treatmentStatus?.START_ERA == 1 && treatmentStatus?.END_ERA >= 0 && (
            <Button
              variant="outlined"
              className="capitalize"
              color="error"
              onClick={() => dispatch(openModal('endTreatment-ERA'))}
              disabled={treatmentStatus?.END_ERA == 1}
            >
              End ERA
            </Button>
          )} */}

          {treatmentStatus?.START_HYSTEROSCOPY >= 0 && (
            <ButtonGroup>
              <span className="px-4 py-2 bg-gray-100 font-medium border-r flex items-center">
                Hystero/Lap
              </span>
              <Button
                variant="contained"
                className="text-white capitalize"
                onClick={() => {
                  if (hysteroscopyReport?.formType) {
                    setSelectedHysteroLapType(hysteroscopyReport.formType)
                  } else if (!isHysteroLapStarted) {
                    setSelectedHysteroLapType(null)
                  }
                  if (
                    isHysteroLapStarted ||
                    confirm('Are you sure you want to start Hystero/Lap?')
                  ) {
                    dispatch(
                      openModal('HYSTEROSCOPY' + patientInfo?.activeVisitId),
                    )
                  }
                }}
                disabled={treatmentStatus?.END_HYSTEROSCOPY == 1}
              >
                {isHysteroLapStarted ? 'Update' : 'Start'}
              </Button>
              {isHysteroLapStarted &&
                treatmentStatus?.END_HYSTEROSCOPY >= 0 && (
                  <Button
                    variant="outlined"
                    className="capitalize"
                    color="error"
                    onClick={() =>
                      dispatch(openModal('endTreatment-HYSTEROSCOPY'))
                    }
                    disabled={treatmentStatus?.END_HYSTEROSCOPY == 1}
                  >
                    End
                  </Button>
                )}
            </ButtonGroup>
          )}
          {/* <Button
            variant="outlined"
            className="capitalize"
            onClick={() => dispatch(openModal('Hysteroscopy-new'))}
          >
            Hysteroscopy
          </Button> */}

          {/* <Button
              variant="outlined"
  
              color="error"
              onClick={() => dispatch(openModal('ICSI'))}
            >
              End FET
            </Button> */}
        </>
      )}

      {type == 'Consultation' &&
        patientInfo?.activeVisitId &&
        !patientInfo?.treatmentExists && (
          <>
            {!isVisitTypeWithoutTreatmentStart && (
              <Button
                variant="outlined"
                className="capitalize"
                onClick={(e) => dispatch(openModal('startTreatment'))}
                name="Treatment"
                // startIcon={<Start />}
              >
                Start Treatment
              </Button>
            )}
            <Button
              variant="outlined"
              className="capitalize"
              onClick={(e) => dispatch(openModal('reviewCall'))}
              name="Review Call"
              disabled={!!selectedPatient?.isReviewCall}
              startIcon={<Schedule />}
            >
              {selectedPatient?.isReviewCall === null
                ? 'Review Call'
                : 'Review Call Scheduled'}
            </Button>
          </>
        )}
      {!!patientInfo?.treatmentExists && (
        <Button
          variant="outlined"
          className="capitalize"
          onClick={() => dispatch(openModal('reviewTreatmentCall'))}
          name="Review Call"
          disabled={!!selectedPatient?.reviewCallInfo?.reviewAppointmentDate}
          startIcon={<Schedule />}
        >
          <Tooltip
            title={selectedPatient?.reviewCallInfo?.reviewAppointmentDate}
          >
            <span>
              {!selectedPatient?.reviewCallInfo?.reviewAppointmentDate
                ? 'Review Treatment Call'
                : `Review Call Scheduled on ${dayjs(
                    selectedPatient?.reviewCallInfo?.reviewAppointmentDate,
                  ).format('DD-MM-YYYY')}`}
            </span>
          </Tooltip>
        </Button>
      )}
      <Modal
        uniqueKey="Hysteroscopy-new"
        maxWidth="md"
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            Hysteroscopy
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div>
          <HysteroscopySheetNew />
        </div>
      </Modal>

      <Modal
        uniqueKey={`ICSI` + patientInfo?.activeVisitId}
        maxWidth={treatmentStatus?.START_ICSI == 0 ? 'sm' : 'xl'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            ICSI Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_ICSI == 0 ? (
          <>
            {/* collect consents from patient */}
            <ConsentsCheck
              consentType="ICSI"
              patientInfo={patientInfo}
              reviewConsents={reviewConsentsICSI}
            />
          </>
        ) : (
          <>
            <FolicularSheet
              folicularFormData={folicularFormData}
              setFolicularFormData={setFolicularFormData}
              treatmentStatus={treatmentStatus}
              handleUpdateTreatmentSheet={handleUpdateTreatmentSheet}
              follicularTemplate={follicularTemplate}
              setFolicularTemplate={setFolicularTemplate}
              canUpdate={treatmentStatus?.END_ICSI == 0}
              onDay1DateChange={handleDay1DateChange}
            />

            {/* Medication Sheet  */}
            <MedicationSheet
              medicationFormData={medicationFormData}
              setMedicationFormData={setMedicationFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
              medicationOptions={medicationOptionsFollicular}
            />

            {/* Scan Sheet */}
            <ScanSheet
              scanFormData={scanFormData}
              setScanFormData={setScanFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={'IUI' + patientInfo?.activeVisitId}
        // closeOnOutsideClick={true}
        maxWidth="xl"
        closeOnOutsideClick={true}
        // onOutsideClick={() => dispatch(closeModal('ICSI'))}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            IUI Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_IUI == 0 ? (
          <>
            {/* collect consents from patient */}
            <ConsentsCheck
              consentType="IUI"
              patientInfo={patientInfo}
              reviewConsents={startIUIMutation}
            />
          </>
        ) : (
          <>
            <FolicularSheet
              folicularFormData={folicularFormData}
              setFolicularFormData={setFolicularFormData}
              treatmentStatus={treatmentStatus}
              handleUpdateTreatmentSheet={handleUpdateTreatmentSheet}
              follicularTemplate={follicularTemplate}
              setFolicularTemplate={setFolicularTemplate}
              canUpdate={treatmentStatus?.END_IUI == 0}
              onDay1DateChange={handleDay1DateChange}
            />

            {/* Medication Sheet  */}
            <MedicationSheet
              medicationFormData={medicationFormData}
              setMedicationFormData={setMedicationFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
              medicationOptions={medicationOptionsFollicular}
            />

            {/* Scan Sheet */}
            <ScanSheet
              scanFormData={scanFormData}
              setScanFormData={setScanFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={'OITI' + patientInfo?.activeVisitId}
        maxWidth={treatmentStatus?.START_OITI == 0 ? 'xs' : 'xl'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            OITI Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_OITI == 0 ? (
          <>
            <div className="flex flex-col justify-center items-center gap-3">
              <DatePicker
                label="Treatment Start Date"
                format="DD/MM/YYYY"
                className="bg-white rounded-lg"
                value={dayjs(oitiStartDate)}
                maxDate={dayjs()}
                onChange={(newValue) =>
                  setOitiStartDate(
                    newValue && dayjs(newValue).isValid()
                      ? dayjs(newValue).format('YYYY-MM-DD')
                      : null,
                  )
                }
              />
              <span className="text-sm text-gray-500">
                Select today or a previous date.
              </span>
              <div className="flex justify-between gap-2">
                <Button
                  variant="outlined"
                  className="capitalize"
                  onClick={() =>
                    dispatch(closeModal('OITI' + patientInfo?.activeVisitId))
                  }
                >
                  No
                </Button>
                <Button
                  variant="contained"
                  className="text-white capitalize "
                  disabled={
                    !oitiStartDate ||
                    dayjs(oitiStartDate)
                      .startOf('day')
                      .isAfter(dayjs().startOf('day')) ||
                    startOITIMutation.isPending
                  }
                  onClick={() => {
                    if (
                      !dayjs(oitiStartDate).isValid() ||
                      dayjs(oitiStartDate)
                        .startOf('day')
                        .isAfter(dayjs().startOf('day'))
                    ) {
                      toast.error(
                        'Please select today or a previous treatment start date',
                      )
                      return
                    }
                    startOITIMutation.mutate({
                      visitId: patientInfo?.activeVisitId,
                      treatmentStartDate: oitiStartDate,
                    })
                  }}
                >
                  {startOITIMutation.isPending ? 'Starting...' : 'Start OITI'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <FolicularSheet
              folicularFormData={folicularFormData}
              setFolicularFormData={setFolicularFormData}
              treatmentStatus={treatmentStatus}
              handleUpdateTreatmentSheet={handleUpdateTreatmentSheet}
              follicularTemplate={follicularTemplate}
              setFolicularTemplate={setFolicularTemplate}
              canUpdate={treatmentStatus?.END_OITI == 0}
              onDay1DateChange={handleDay1DateChange}
            />

            {/* Medication Sheet  */}
            <MedicationSheet
              medicationFormData={medicationFormData}
              setMedicationFormData={setMedicationFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
              medicationOptions={medicationOptionsFollicular}
            />

            {/* Scan Sheet */}
            <ScanSheet
              scanFormData={scanFormData}
              setScanFormData={setScanFormData}
              allBillTypeValues={allBillTypeValues}
              columns={follicularTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={`FET` + patientInfo?.activeVisitId}
        maxWidth={treatmentStatus?.FET_START == 0 ? 'sm' : 'xl'}
        closeOnOutsideClick={true}
        // onOutsideClick={() => dispatch(closeModal('ICSI'))}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            FET Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.FET_START == 0 ? (
          <>
            <ConsentsCheck
              consentType="FET"
              patientInfo={patientInfo}
              reviewConsents={reviewConsentsFET}
            />
          </>
        ) : (
          <>
            <FETSheet
              fetFormData={fetFormData}
              setFETFormData={setFETFormData}
              fetTemplate={fetTemplate}
              handleUpdateTreatmentFETSheet={handleUpdateTreatmentFETSheet}
              patientInfo={patientInfo}
              setFETTemplate={setFETTemplate}
              canUpdate={treatmentStatus?.END_FET == 0}
              medicationOptions={medicationOptionsFollicular}
              allBillTypeValues={allBillTypeValues}
            />
            <ScanSheet
              scanFormData={scanFetFormData}
              setScanFormData={setScanFetFormData}
              allBillTypeValues={allBillTypeValues}
              columns={fetTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={`ERA` + patientInfo?.activeVisitId}
        maxWidth={treatmentStatus?.START_ERA == 0 ? 'xs' : 'xl'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            ERA Sheet
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {treatmentStatus?.START_ERA == 0 ? (
          <div className="flex flex-col items-center gap-3 py-3">
            <DatePicker
              label="Treatment Start Date"
              format="DD/MM/YYYY"
              className="bg-white rounded-lg"
              value={dayjs(eraTreatmentStartDate)}
              maxDate={dayjs()}
              onChange={(newValue) =>
                setEraTreatmentStartDate(
                  newValue && dayjs(newValue).isValid()
                    ? dayjs(newValue).format('YYYY-MM-DD')
                    : null,
                )
              }
            />
            <span className="text-sm text-gray-500">
              Select today or a previous date.
            </span>
            <Button
              variant="contained"
              className="text-white capitalize"
              disabled={
                !eraTreatmentStartDate ||
                dayjs(eraTreatmentStartDate)
                  .startOf('day')
                  .isAfter(dayjs().startOf('day')) ||
                reviewConsentsERA.isPending
              }
              onClick={() => {
                if (
                  !dayjs(eraTreatmentStartDate).isValid() ||
                  dayjs(eraTreatmentStartDate)
                    .startOf('day')
                    .isAfter(dayjs().startOf('day'))
                ) {
                  toast.error(
                    'Please select today or a previous treatment start date',
                  )
                  return
                }
                reviewConsentsERA.mutate({
                  visitId: patientInfo?.activeVisitId,
                  treatmentStartDate: eraTreatmentStartDate,
                })
              }}
            >
              {reviewConsentsERA.isPending ? 'Starting...' : 'Start ERA'}
            </Button>
          </div>
        ) : (
          <>
            <FolicularSheet
              folicularFormData={eraFolicularFormData}
              setFolicularFormData={setEraFolicularFormData}
              handleUpdateTreatmentSheet={handleUpdateTreatmentERASheet}
              follicularTemplate={{
                columns:
                  eraTemplate?.columns?.length > 0
                    ? eraTemplate.columns
                    : [dayjs().format('DD/MM')],
                rows: eraTemplate?.follicularRows || DEFAULT_FOLLICULAR_ROWS,
              }}
              setFolicularTemplate={(updater) => {
                setERATemplate((prev) => {
                  const follicularPrev = {
                    columns: prev?.columns || [],
                    rows: prev?.follicularRows || DEFAULT_FOLLICULAR_ROWS,
                  }
                  const next =
                    typeof updater === 'function'
                      ? updater(follicularPrev)
                      : updater
                  return {
                    ...prev,
                    columns: next.columns,
                    follicularRows: next.rows,
                  }
                })
              }}
              canUpdate={treatmentStatus?.END_ERA == 0}
              showEraStartTime
              eraStartTime={eraStartTime}
              onEraStartTimeChange={(newValue) =>
                setEraStartTime(
                  dayjs(newValue).format('YYYY-MM-DDTHH:mm:00[Z]'),
                )
              }
              onUpdateEraStartTime={() => {
                if (!eraStartTime) {
                  toast.error('Please select ERA start date and time')
                  return
                }
                updateEraStartTimeMutation.mutate(eraStartTime)
              }}
              isUpdatingEraStartTime={updateEraStartTimeMutation.isLoading}
            />
            <ERASheet
              eraFormData={eraFormData}
              setERAFormData={setERAFormData}
              eraTemplate={eraTemplate}
              medicationOptions={medicationOptionsFollicular}
            />
            <ScanSheet
              scanFormData={scanEraFormData}
              setScanFormData={setScanEraFormData}
              allBillTypeValues={allBillTypeValues}
              columns={eraTemplate?.columns}
            />
          </>
        )}
      </Modal>
      <Modal
        uniqueKey={'HYSTEROSCOPY' + patientInfo?.activeVisitId}
        maxWidth={isHysteroLapStarted || hysteroscopyTemplate ? 'lg' : 'sm'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <Typography variant="h6" className="text-gray-800 mb-2">
            Hystero/Lap
            {(selectedHysteroLapType || hysteroscopyReport?.formType) &&
              ` — ${selectedHysteroLapType || hysteroscopyReport?.formType}`}
          </Typography>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="">
          {isHysteroLapStarted || hysteroscopyTemplate ? (
            <HysteroLapOperationNotesForm
              formType={
                selectedHysteroLapType || hysteroscopyReport?.formType || ''
              }
              visitId={
                Number.isFinite(resolvedHysteroscopyVisitId)
                  ? resolvedHysteroscopyVisitId
                  : null
              }
              patientId={
                Number.isFinite(resolvedHysteroscopyPatientId)
                  ? resolvedHysteroscopyPatientId
                  : null
              }
              patientName={
                selectedPatient?.patientName || patientInfo?.patientName || ''
              }
              patientAge={
                selectedPatient?.age ||
                selectedPatient?.patientAge ||
                patientInfo?.age ||
                patientInfo?.patientAge ||
                ''
              }
              initialData={hysteroscopyReport}
              onSave={(payload) => {
                const normalizedPayload = {
                  ...payload,
                  patientId: Number.isFinite(resolvedHysteroscopyPatientId)
                    ? resolvedHysteroscopyPatientId
                    : payload?.patientId,
                  visitId: Number.isFinite(resolvedHysteroscopyVisitId)
                    ? resolvedHysteroscopyVisitId
                    : payload?.visitId,
                  formType:
                    payload?.formType ||
                    selectedHysteroLapType ||
                    hysteroscopyReport?.formType,
                }
                if (
                  !Number.isFinite(Number(normalizedPayload?.patientId)) ||
                  !Number.isFinite(Number(normalizedPayload?.visitId))
                ) {
                  toast.error(
                    'Unable to save Hystero/Lap report: invalid patient or visit ID',
                    toastconfig,
                  )
                  return
                }
                if (hysteroscopyReportId) {
                  updateHysteroscopyReportMutation.mutate({
                    id: hysteroscopyReportId,
                    payload: normalizedPayload,
                  })
                } else {
                  createHysteroscopyReportMutation.mutate(normalizedPayload)
                }
              }}
              onCancel={() => dispatch(closeModal())}
              onImageUpload={async (file) => {
                const reportQueryKey = [
                  'hysteroscopyReport',
                  resolvedHysteroscopyPatientId,
                  resolvedHysteroscopyVisitId,
                ]
                let currentHysteroscopyId = hysteroscopyReportId

                if (!currentHysteroscopyId) {
                  const createRes = await createHysteroscopyReport(
                    user.accessToken,
                    {
                      patientId: resolvedHysteroscopyPatientId,
                      visitId: resolvedHysteroscopyVisitId,
                      formType:
                        selectedHysteroLapType || hysteroscopyReport?.formType,
                    },
                  )
                  if (createRes?.status !== 200 || !createRes?.data?.id) {
                    throw new Error(
                      createRes?.message ||
                        'Unable to initialize Hystero/Lap record for image upload',
                    )
                  }
                  currentHysteroscopyId = createRes.data.id
                  setHysteroscopyReportId(createRes.data.id)
                  queryClient.setQueryData(reportQueryKey, (existing) => ({
                    ...(existing || {}),
                    ...createRes.data,
                    id: createRes.data.id,
                    patientId: resolvedHysteroscopyPatientId,
                    visitId: resolvedHysteroscopyVisitId,
                    formType:
                      selectedHysteroLapType || hysteroscopyReport?.formType,
                    referenceImages: existing?.referenceImages || [],
                  }))
                }

                const uploadRes = await addHysteroscopyReferenceImages(
                  user.accessToken,
                  currentHysteroscopyId,
                  [file],
                )

                if (uploadRes?.status !== 200) {
                  throw new Error(
                    uploadRes?.message || 'Failed to upload reference image',
                  )
                }

                const uploadedImage = uploadRes?.data?.[0]
                if (!uploadedImage?.imageUrl) {
                  throw new Error(
                    'Upload succeeded but image URL was not returned',
                  )
                }

                const imageRecord = {
                  id: uploadedImage.id ?? null,
                  imageUrl: uploadedImage.imageUrl,
                  imageKey: uploadedImage.imageKey,
                }

                queryClient.setQueryData(reportQueryKey, (existing) => ({
                  ...(existing || {}),
                  id: currentHysteroscopyId,
                  referenceImages: [
                    ...(existing?.referenceImages || []),
                    imageRecord,
                  ],
                }))

                return imageRecord
              }}
              onImageDelete={async (image) => {
                const reportQueryKey = [
                  'hysteroscopyReport',
                  resolvedHysteroscopyPatientId,
                  resolvedHysteroscopyVisitId,
                ]
                const cachedReport = queryClient.getQueryData(reportQueryKey)
                const imageId =
                  image?.id ||
                  cachedReport?.referenceImages?.find(
                    (item) => item?.imageUrl === image?.imageUrl,
                  )?.id

                if (!imageId) return

                const deleteRes = await deleteHysteroscopyReferenceImage(
                  user.accessToken,
                  imageId,
                )

                if (deleteRes?.status !== 200) {
                  throw new Error(
                    deleteRes?.message || 'Failed to delete reference image',
                  )
                }

                queryClient.setQueryData(reportQueryKey, (existing) => ({
                  ...(existing || {}),
                  referenceImages: (existing?.referenceImages || []).filter(
                    (item) =>
                      Number(item?.id) !== Number(imageId) &&
                      item?.imageUrl !== image?.imageUrl,
                  ),
                }))
              }}
            />
          ) : !selectedHysteroLapType ? (
            <div className="text-center mb-6 px-4">
              <Typography variant="subtitle1" className="mb-4 font-medium">
                Select procedure type to start
              </Typography>
              <div className="flex flex-col gap-3">
                {HYSTERO_LAP_TYPE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant="outlined"
                    className="capitalize"
                    onClick={() => setSelectedHysteroLapType(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center mb-6">
              <Typography variant="body2" className="mb-4 text-gray-600">
                Starting: <strong>{selectedHysteroLapType}</strong>
              </Typography>
              <DateTimePicker
                label="Hystero/Lap Time"
                className="bg-white rounded-lg w-max-content mb-10"
                name="hysteroscopyTime"
                maxDate={dayjs()}
                onChange={(newValue) => {
                  setHysteroscopyTime(
                    newValue && dayjs(newValue).isValid()
                      ? dayjs(newValue).toISOString()
                      : null,
                  )
                }}
                viewRenderers={{
                  hours: renderTimeViewClock,
                  minutes: renderTimeViewClock,
                  // seconds: renderTimeViewClock,
                }}
              />
              <h5 className="text-md font-semibold text-gray-800">
                Please provide Hystero/Lap time to proceed
              </h5>
              <div className="flex justify-center gap-2 mt-5">
                <Button
                  variant="outlined"
                  className="capitalize"
                  onClick={() => setSelectedHysteroLapType(null)}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  className="text-white capitalize"
                  disabled={
                    !hysteroscopyTime ||
                    !dayjs(hysteroscopyTime).isValid() ||
                    dayjs(hysteroscopyTime)
                      .startOf('day')
                      .isAfter(dayjs().startOf('day')) ||
                    startHysteroscopyMutation.isPending
                  }
                  onClick={() => {
                    if (
                      !dayjs(hysteroscopyTime).isValid() ||
                      dayjs(hysteroscopyTime)
                        .startOf('day')
                        .isAfter(dayjs().startOf('day'))
                    ) {
                      toast.error(
                        'Please select today or a previous treatment start date',
                      )
                      return
                    }
                    startHysteroscopyMutation.mutate(
                      resolvedHysteroscopyVisitId,
                    )
                  }}
                >
                  {startHysteroscopyMutation.isPending
                    ? 'Starting...'
                    : `Start ${selectedHysteroLapType}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        uniqueKey="startTreatment"
        // handleClose={() => setViewForm(false)}
        // title={'New Treatment'}
        closeOnOutsideClick={true}
      >
        <div className="flex justify-between">
          <span className="text-xl font-semibold text-secondary flex items-center py-5 gap-4">
            {type === 'Consultation' ? 'Start Treatment' : 'New Treatment'}
          </span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <div className="flex flex-col gap-5">
          <RadioGroup
            value={treatmentForm.type}
            className="grid grid-cols-3 gap-2 p-2"
            // onChange={e =>
            //   setTreatmentForm({ ...treatmentForm, type: e.target.value, isPackageExists: treatmentTypes?.filter(each => each.id == e.target.value)[0]?.isPackageExists })
            // }
          >
            {treatmentTypesWithoutFETCycle?.map((each, index) => (
              <FormControlLabel
                key={index}
                value={each.id}
                control={
                  <div
                    key={index}
                    // variant={treatmentForm.type === each ? "contained" : "outlined"}
                    onClick={() =>
                      setTreatmentForm({
                        ...treatmentForm,
                        type: each.name,
                        isPackageExists: each.isPackageExists,
                        treatmentTypeId: each.id,
                      })
                    }
                    className={` normal-case w-full hover:shadow hover:shadow-secondary text-center p-2 rounded-lg ${
                      treatmentForm.treatmentTypeId === each.id
                        ? ' shadow shadow-secondary text-secondary  '
                        : 'border hover:bg-secondary/10 hover:text-secondary '
                    }`}
                  >
                    {each.name}
                  </div>
                }
                // label={each}
              />
            ))}
          </RadioGroup>

          {treatmentForm?.isPackageExists && (
            <TextField
              label="Package Amount"
              type="number"
              value={treatmentForm.packageAmount}
              onChange={(e) =>
                setTreatmentForm({
                  ...treatmentForm,
                  packageAmount: e.target.value,
                })
              }
            />
          )}

          <div className="flex justify-end">
            <Button
              variant="outlined"
              disabled={createTreatment.isPending}
              onClick={() => {
                if (!treatmentForm.type) {
                  toast.error('Please select a treatment type')
                  return
                }
                if (
                  treatmentForm.isPackageExists &&
                  (!treatmentForm.packageAmount ||
                    Number(treatmentForm.packageAmount) <= 0)
                ) {
                  toast.error('Please enter a valid package amount')
                  return
                }
                if (!patientInfo?.activeVisitId) {
                  toast.error('Active visit not found for this patient')
                  return
                }
                createTreatment.mutate(buildStartTreatmentPayload())
              }}
            >
              {createTreatment.isPending
                ? 'Starting...'
                : type === 'Consultation'
                  ? 'Start'
                  : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal uniqueKey="reviewCall" closeOnOutsideClick={true}>
        <div className="flex justify-between">
          <span className="text-lg font-semibold">Schedule a Call</span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <ReviewCallForm
          appointmentId={appointmentId}
          type={type}
          patientInfo={patientInfo}
          reviewAppointmentForm={reviewAppointmentForm}
          setReviewAppointmentForm={setReviewAppointmentForm}
          // selectedPatient={selectedPatient}
          // setSelectedPatient={setSelectedPatient}
        />
      </Modal>
      <Modal
        uniqueKey="reviewTreatmentCall"
        closeOnOutsideClick={true}
        maxWidth="md"
      >
        <div className="flex justify-between">
          <span className="text-lg font-semibold">Review Treatment Call</span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <ReviewTreatmentCall
          appointmentId={appointmentId}
          type={type}
          patientInfo={patientInfo}
          treatmentCycleId={treatmentCycleId}
          allBillTypeValues={allBillTypeValues}
          // selectedPatient={selectedPatient}
          // setSelectedPatient={setSelectedPatient}
          // reviewAppointmentForm={reviewAppointmentForm}
          // setReviewAppointmentForm={setReviewAppointmentForm}
        />
      </Modal>
      <Modal
        uniqueKey="endTreatment-ICSI"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="ICSI"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-ICSI'))}
        />
      </Modal>
      {/* END IUI */}
      <Modal
        uniqueKey="endTreatment-IUI"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="IUI"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-IUI'))}
        />
      </Modal>
      {/* END FET */}
      <Modal
        uniqueKey="endTreatment-FET"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="FET"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-FET'))}
        />
      </Modal>
      {/* END OITI */}
      <Modal
        uniqueKey="endTreatment-OITI"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <EndTreatmentModal
          type="OITI"
          visitId={patientInfo?.activeVisitId}
          onClose={() => dispatch(closeModal('endTreatment-OITI'))}
        />
      </Modal>
      <Modal
        uniqueKey="endTreatment-Visit"
        maxWidth="sm"
        closeOnOutsideClick={true}
      >
        <CloseVisitModal
          type={type}
          visitId={patientInfo?.activeVisitId}
          consultationId={patientInfo?.consultationId}
          onClose={() => dispatch(closeModal('endTreatment-Visit'))}
        />
      </Modal>
    </div>
  )
}

export default Prescription
