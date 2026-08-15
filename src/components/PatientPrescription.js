import React, { useEffect, useMemo, useState, useRef } from 'react'
import RenderPrescriptionPharmacy from './RenderPrescriptionPharmacy'
import dynamic from 'next/dynamic'

import RichText from '@/components/RichText'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  IconButton,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import Select from 'react-select'
import Modal from './Modal'
import { FaPrescriptionBottleMedical } from 'react-icons/fa6'
import { closeModal, openModal } from '@/redux/modalSlice'
import {
  getLineBillsAndNotesForAppointment,
  getPatientPharmacyHistory,
  getPharmacyMasterData,
  saveLineBillsAndNotes,
  printPrescription,
} from '@/constants/apis'
import { API_ROUTES } from '@/constants/constants'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { Close } from '@mui/icons-material'
import { getMultipleForQuatityCalculation } from '@/constants/utils'
import dayjs from 'dayjs'
import {
  applyPharmacyKitsToBillTypeValues,
  ACTIVE_PHARMACY_KITS_QUERY_KEY,
  ACTIVE_PHARMACY_KITS_QUERY_OPTIONS,
  buildPharmacySelectOption,
  enrichPharmacySelectValue,
  formatPharmacyOptionLabel,
  getSelectedPharmacyKits,
  parseKitMedicines,
  pharmacySelectStyles,
  PrescriptionPharmacyLowStockLegend,
  preserveKitMedicineQuantity,
} from '@/utils/prescriptionPharmacySelect'
import {
  applyPharmacyCompanionMedicines,
  getCompanionMedicinesForTriggers,
  syncPrescriptionDaysForTriggerAndCompanions,
} from '@/utils/pharmacyAutoCompanions'
import {
  dedupeNonPharmacyLineBillValues,
  mergeLineBillValuesOnCopy,
} from '@/utils/mergeLineBillValuesOnCopy'

const NAPO_SHOT_KIT_VALUE = 'NAPO_SHOT_KIT'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

const RESTRICTED_PATIENT_LAB_TESTS = [
  'gene andro',
  'y chromosome micro deletion',
  'y-chromosome microdeletion test',
]

const normalizeLabTestName = (testName = '') =>
  testName
    .toLowerCase()
    .replace(/[-\s]+/g, ' ')
    .trim()

const isRestrictedPatientLabTest = (testName = '') => {
  const normalizedName = normalizeLabTestName(testName)
  return RESTRICTED_PATIENT_LAB_TESTS.some((restrictedTest) =>
    normalizedName.includes(normalizeLabTestName(restrictedTest)),
  )
}

const pharmacyStartsWithFilter = (option, inputValue) => {
  const normalizedInput = (inputValue || '').trim().toLowerCase()
  if (!normalizedInput) {
    return true
  }

  return (option?.label || '').toLowerCase().startsWith(normalizedInput)
}

function purchaseSummary(row) {
  const rx = Number(row.prescribedQuantity) || 0
  const bought = Number(row.purchasedQuantity) || 0
  if (rx <= 0) {
    return { label: '—', color: 'default' }
  }
  if (bought <= 0) {
    return { label: 'Not purchased', color: 'error' }
  }
  if (bought >= rx) {
    return { label: 'Fully purchased', color: 'success' }
  }
  return { label: 'Partially purchased', color: 'warning' }
}

function PharmacyHistoryContent({
  patientId,
  pharmacyHistoryLoading,
  pharmacyHistoryError,
  pharmacyHistoryErrorObj,
  pharmacyHistoryByVisit,
}) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {!patientId && (
        <p className="text-sm text-gray-600">
          Patient context is missing; pharmacy history cannot be loaded.
        </p>
      )}
      {patientId && pharmacyHistoryLoading && (
        <div className="flex justify-center py-8">
          <CircularProgress size={32} />
        </div>
      )}
      {patientId && pharmacyHistoryError && (
        <p className="text-sm text-red-600">
          {pharmacyHistoryErrorObj?.message ||
            'Could not load pharmacy history.'}
        </p>
      )}
      {patientId &&
        !pharmacyHistoryLoading &&
        !pharmacyHistoryError &&
        pharmacyHistoryByVisit.length === 0 && (
          <p className="text-sm text-gray-600">
            No pharmacy records found for this patient across visits.
          </p>
        )}
      {patientId &&
        !pharmacyHistoryLoading &&
        !pharmacyHistoryError &&
        pharmacyHistoryByVisit.length > 0 &&
        pharmacyHistoryByVisit.map((visitGroup) => (
          <Paper
            key={visitGroup.visitId}
            variant="outlined"
            className="overflow-hidden"
            sx={{ bgcolor: 'grey.50' }}
          >
            <div className="bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800">
              Visit {visitGroup.visitDate}
              <span className="ml-2 font-normal text-gray-600">
                (Visit #{visitGroup.visitId})
              </span>
            </div>
            <TableContainer sx={{ maxHeight: 280 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Medicine</TableCell>
                    <TableCell>Appointment date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Doctor</TableCell>
                    <TableCell align="right">Prescribed qty</TableCell>
                    <TableCell align="right">Purchased qty</TableCell>
                    <TableCell>Bill status</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Fulfillment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visitGroup.items.map((row) => {
                    const summary = purchaseSummary(row)
                    return (
                      <TableRow key={row.lineBillId}>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {row.medicineName || '—'}
                        </TableCell>
                        <TableCell>
                          {row.appointmentDate
                            ? dayjs(row.appointmentDate).format('DD-MM-YYYY')
                            : '—'}
                        </TableCell>
                        <TableCell>{row.appointmentType}</TableCell>
                        <TableCell>{row.doctorName || '—'}</TableCell>
                        <TableCell align="right">
                          {row.prescribedQuantity ?? '—'}
                        </TableCell>
                        <TableCell align="right">
                          {row.purchasedQuantity ?? 0}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.paymentStatus || '—'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          {row.nonPurchaseReason?.trim() || '—'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={summary.label}
                            color={summary.color}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        ))}
    </div>
  )
}

function PatientPrescription({
  allBillTypeValues,
  type,
  appointmentId,
  activeVisitAppointments,
  patientId,
  patientName,
}) {
  const user = useSelector((store) => store.user)
  const { billTypes } = useSelector((store) => store.dropdowns)
  const [notesValue, setNotesValue] = useState()
  const [defaultLineBillValues, setDefaultLineBillValues] = useState(null)
  const [printTemplate, setPrintTemplate] = useState(null)
  const dispatch = useDispatch()
  const editor = useRef(null)
  const modal = useSelector((store) => store.modal)
  const queryClient = useQueryClient()
  const [pharmacyPanelTab, setPharmacyPanelTab] = useState('current')
  useEffect(() => {
    if (modal.key !== 'addPrescription') {
      setPharmacyPanelTab('current')
    }
  }, [modal.key])
  const billTypesMap = useMemo(() => {
    const map = {}
    billTypes.map((eachBillType) => {
      map[eachBillType.id] = eachBillType.name
      map[eachBillType.name] = eachBillType.id
    })
    return map
  }, [billTypes])

  const { data: activePharmacyKitsResponse } = useQuery({
    queryKey: ACTIVE_PHARMACY_KITS_QUERY_KEY,
    queryFn: () =>
      getPharmacyMasterData(
        user.accessToken,
        API_ROUTES.GET_ACTIVE_PHARMACY_KITS,
      ),
    enabled: !!user?.accessToken && modal.key === 'addPrescription',
    ...ACTIVE_PHARMACY_KITS_QUERY_OPTIONS,
  })

  const medicineKits = useMemo(() => {
    const kits = activePharmacyKitsResponse?.data
    if (!Array.isArray(kits)) {
      return []
    }
    return kits.map((kit) => ({
      kitName: kit.kitName,
      kitValue: kit.kitValue,
      medicines: parseKitMedicines(kit.medicines),
    }))
  }, [activePharmacyKitsResponse])

  const { data: lineBillsAndNotesDataForCurrentAppointment, isLoading } =
    useQuery({
      queryKey: ['lineBillsAndNotesForCurrentAppointment', type, appointmentId],
      queryFn: async () => {
        const responsejson = await getLineBillsAndNotesForAppointment(
          user.accessToken,
          type,
          appointmentId,
        )
        if (responsejson.status == 200) {
          return responsejson.data
        } else {
          throw new Error(
            'Error occurred while fetching Line Bills and Notes for Current Appointment',
          )
        }
      },
      enabled: !!appointmentId && !!type && modal.key === 'addPrescription',
    })

  const {
    data: pharmacyHistoryRows = [],
    isLoading: pharmacyHistoryLoading,
    isError: pharmacyHistoryError,
    error: pharmacyHistoryErrorObj,
  } = useQuery({
    queryKey: ['patientPharmacyHistory', patientId],
    queryFn: async () => {
      const res = await getPatientPharmacyHistory(user.accessToken, patientId)
      if (res.status === 200) {
        return Array.isArray(res.data) ? res.data : []
      }
      throw new Error(res.message || 'Failed to load pharmacy history')
    },
    enabled:
      !!patientId &&
      modal.key === 'addPrescription' &&
      pharmacyPanelTab === 'history',
  })

  const pharmacyHistoryByVisit = useMemo(() => {
    if (!pharmacyHistoryRows?.length) {
      return []
    }
    const byVisit = new Map()
    for (const row of pharmacyHistoryRows) {
      const key = row.visitId
      if (!byVisit.has(key)) {
        byVisit.set(key, {
          visitId: row.visitId,
          visitDate: row.visitDate,
          items: [],
        })
      }
      byVisit.get(key).items.push(row)
    }
    return [...byVisit.values()]
      .map((g) => ({
        ...g,
        items: [...g.items].sort(
          (a, b) =>
            dayjs(b.appointmentDate).valueOf() -
            dayjs(a.appointmentDate).valueOf(),
        ),
      }))
      .sort(
        (a, b) => dayjs(b.visitDate).valueOf() - dayjs(a.visitDate).valueOf(),
      )
  }, [pharmacyHistoryRows])

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await saveLineBillsAndNotes(user.accessToken, payload)
      if (res.status === 200) {
        dispatch(closeModal())
        queryClient.invalidateQueries({
          queryKey: ['medicationOptionsFollicular'],
        })
        queryClient.invalidateQueries({
          queryKey: ['treatmentFETSheet'],
        })
        queryClient.invalidateQueries({
          queryKey: ['getLineBills', appointmentId],
        })
        queryClient.invalidateQueries({
          queryKey: [
            'lineBillsAndNotesForCurrentAppointment',
            type,
            appointmentId,
          ],
        })
        queryClient.invalidateQueries({
          queryKey: ['patientPharmacyHistory'],
        })
        toast.success('Saved Successfully', toastconfig)
      } else {
        console.log(res)
        toast.error(res.message, toastconfig)
      }
    },
  })

  function onAddPrescriptionClick() {
    dispatch(openModal('addPrescription'))
  }
  function onSaveClick() {
    let DBFormatData = ConvertDataToDBFormat()
    if (notesValue == null && DBFormatData.length === 0) {
      toast.error('Please enter values', toastconfig)
    } else {
      mutate({
        createType: type,
        appointmentId: appointmentId,
        notes: notesValue,
        isSpouse: 0,
        lineBillEntries: DBFormatData,
      })
    }
  }
  function ConvertDataToDBFormat() {
    let billTypeStruct = []
    const toSafePositiveNumber = (value, fallback = 1) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
    }
    if (defaultLineBillValues) {
      const SelectedTypeIdArray = Object.keys(defaultLineBillValues)
      if (SelectedTypeIdArray.length != 0) {
        SelectedTypeIdArray?.map((data) => {
          const SelectedTypeValuesArray = defaultLineBillValues?.[data]
          if (SelectedTypeValuesArray?.length != 0) {
            // Filter out paid items and remove status field from each item
            const billTypeValues = SelectedTypeValuesArray.filter(
              (item) => item.status !== 'PAID',
            ).map(({ status, isKitMedicine, kitBaseQuantity, ...item }) => ({
              ...item,
              amount: Number(item.amount),
              ...(Number(data) === 3
                ? {
                    prescriptionDays: toSafePositiveNumber(
                      item.prescriptionDays,
                      1,
                    ),
                    prescribedQuantity: toSafePositiveNumber(
                      item.prescribedQuantity,
                      1,
                    ),
                  }
                : {}),
            })) // Destructure to remove status; coerce amount for API (Joi number)

            if (billTypeValues.length > 0) {
              billTypeStruct.push({
                billTypeId: Number(data),
                billTypeValues: billTypeValues,
              })
            }
          }
        })
      }
    }
    return billTypeStruct
  }
  const setSelectedValues = (name) => (selectedOptions) => {
    const billTypeId = billTypesMap[name]

    // Get current paid items
    const currentPaidItems =
      defaultLineBillValues?.[billTypeId]?.filter(
        (item) => item.status === 'PAID',
      ) ?? []

    let copyOfDefaultLineBillValues = { ...defaultLineBillValues }
    let billTypeValues = [...currentPaidItems] // Start with paid items

    // Check if any medicine kit is selected (only for Pharmacy)
    if (name === 'Pharmacy') {
      const selectedKits = getSelectedPharmacyKits(
        selectedOptions,
        medicineKits,
      )

      if (selectedKits.length > 0) {
        billTypeValues = applyPharmacyKitsToBillTypeValues({
          kits: selectedKits,
          billTypeValues,
          pharmacyItems: allBillTypeValues[name] || [],
          defaultLineBillValues: copyOfDefaultLineBillValues,
          billTypeId,
        })

        // Remove all kit options from selected options (they're just triggers, not actual medicines)
        const kitValues = medicineKits.map((k) => k.kitValue)
        const kitNames = medicineKits.map((k) => k.kitName.toUpperCase())
        const filteredOptions = selectedOptions.filter(
          (option) =>
            !kitValues.includes(option.value) &&
            !kitNames.includes(option.label?.toUpperCase()),
        )

        // Continue with remaining selected items (non-kit items selected along with kits)
        filteredOptions?.forEach((element) => {
          const BillTypeValuesArray = allBillTypeValues[name] || []
          const BillTYpeValueObject = BillTypeValuesArray.find((values) => {
            return values.id === element.value
          })
          if (!BillTYpeValueObject) return

          // Check if unpaid medicine is already added (from kit or previous selection)
          const alreadyAdded = billTypeValues.some(
            (item) => item.id === element.value && item.status !== 'PAID',
          )

          if (!alreadyAdded) {
            const infoObject = defaultLineBillValues['3']?.find((values) => {
              return (
                values.id === BillTYpeValueObject.id && values.status !== 'PAID'
              )
            })

            billTypeValues.push({
              id: element.value,
              name: element.label,
              amount: parseInt(BillTYpeValueObject.amount, 10),
              prescribedQuantity: infoObject?.prescribedQuantity ?? 1,
              prescriptionDetails: infoObject?.prescriptionDetails ?? '',
              prescriptionDays: infoObject?.prescriptionDays ?? 1,
              status: 'UNPAID',
            })
          }
        })
      } else {
        // Normal flow for non-kit selections
        selectedOptions?.forEach((element) => {
          const BillTypeValuesArray = allBillTypeValues[name] || []
          const BillTYpeValueObject = BillTypeValuesArray.find((values) => {
            return values.id === element.value
          })
          if (!BillTYpeValueObject) return

          const infoObject = defaultLineBillValues['3']?.find((values) => {
            return (
              values.id === BillTYpeValueObject.id && values.status !== 'PAID'
            )
          })

          // Keep one unpaid row selected; paid row is shown separately.
          const hasUnpaidRow = billTypeValues.some(
            (item) => item.id === element.value && item.status !== 'PAID',
          )
          if (!hasUnpaidRow) {
            billTypeValues.push({
              id: element.value,
              name: element.label,
              amount: parseInt(BillTYpeValueObject.amount, 10),
              prescribedQuantity: infoObject?.prescribedQuantity ?? 1,
              prescriptionDetails: infoObject?.prescriptionDetails ?? '',
              prescriptionDays: infoObject?.prescriptionDays ?? 1,
              status: 'UNPAID',
            })
          }
        })
      }

      const selectedMedicineNames = billTypeValues
        .filter((item) => item.status !== 'PAID')
        .map((item) => item.name)
      const companionMedicines = getCompanionMedicinesForTriggers(
        selectedMedicineNames,
      )
      if (companionMedicines.length > 0) {
        applyPharmacyCompanionMedicines({
          companions: companionMedicines,
          billTypeValuesArray: allBillTypeValues[name] || [],
          billTypeValues,
          existingAllItems: copyOfDefaultLineBillValues[billTypeId] || [],
          defaultLineBillValues,
        })
      }
    } else {
      // Non-Pharmacy bill types
      selectedOptions?.forEach((element) => {
        // Skip if it's already in paid items
        if (!currentPaidItems.some((paid) => paid.id === element.value)) {
          const BillTypeValuesArray = allBillTypeValues[name] || []
          const BillTYpeValueObject = BillTypeValuesArray.find((values) => {
            return values.id === element.value
          })
          if (!BillTYpeValueObject) return

          billTypeValues.push({
            id: element.value,
            name: element.label,
            amount: parseInt(BillTYpeValueObject.amount, 10),
            status: 'UNPAID',
          })
        }
      })
    }

    copyOfDefaultLineBillValues[billTypeId] = billTypeValues
    setDefaultLineBillValues(copyOfDefaultLineBillValues)
  }
  const handleDeleteClicked = (pharmacyId, rowIndex) => {
    setDefaultLineBillValues((prevState) => {
      if (!prevState) return {}
      const copyOfLineBillValues = { ...prevState }
      if (copyOfLineBillValues?.[pharmacyId]) {
        copyOfLineBillValues[pharmacyId] = copyOfLineBillValues[
          pharmacyId
        ].filter((_, index) => index !== rowIndex)
      }
      return copyOfLineBillValues
    })
  }

  const handleDuplicateClicked = (pharmacyId, rowIndex) => {
    setDefaultLineBillValues((prevState) => {
      if (!prevState) return {}
      const copyOfLineBillValues = { ...prevState }
      const rows = copyOfLineBillValues?.[pharmacyId]

      if (!rows || !rows[rowIndex]) return prevState

      const rowToClone = rows[rowIndex]
      const clonedRow = {
        ...rowToClone,
        status: 'UNPAID',
      }

      copyOfLineBillValues[pharmacyId] = [
        ...rows.slice(0, rowIndex + 1),
        clonedRow,
        ...rows.slice(rowIndex + 1),
      ]

      return copyOfLineBillValues
    })
  }

  const handleDaysChange = (prescriptionRowIndex, days) => {
    const billTypeIdPrescription = '3' //bill type = prescription
    const copyOfDefaultLineBillValues = JSON.parse(
      JSON.stringify(defaultLineBillValues),
    )
    const prescriptionRows =
      copyOfDefaultLineBillValues?.[billTypeIdPrescription] ?? []
    if (prescriptionRows.length === 0) {
      return
    }

    copyOfDefaultLineBillValues[billTypeIdPrescription] =
      syncPrescriptionDaysForTriggerAndCompanions({
        prescriptionRows,
        triggerRowIndex: prescriptionRowIndex,
        days,
        getMultipleForQuatityCalculation,
      }).map((row, index) => {
        if (index === prescriptionRowIndex && row?.isKitMedicine) {
          return preserveKitMedicineQuantity(row, {
            prescriptionDays:
              days === ''
                ? ''
                : Number.isFinite(Number(days)) && Number(days) > 0
                  ? Number(days)
                  : row.prescriptionDays,
          })
        }
        return row
      })
    setDefaultLineBillValues(copyOfDefaultLineBillValues)
  }
  const handleIntakeChange = (prescriptionRowIndex, medIntake) => {
    const billTypeIdPrescription = '3' //bill type = prescription
    const copyOfDefaultLineBillValues = JSON.parse(
      JSON.stringify(defaultLineBillValues),
    )
    let tempLineBillValues = copyOfDefaultLineBillValues?.[
      billTypeIdPrescription
    ]?.map((lineBillValues, index) => {
      if (index !== prescriptionRowIndex) {
        return lineBillValues
      }

      if (lineBillValues.isKitMedicine) {
        return preserveKitMedicineQuantity(lineBillValues, {
          prescriptionDetails: medIntake,
        })
      }

      const currentDays = Number(lineBillValues.prescriptionDays)
      const hasValidDays = Number.isFinite(currentDays) && currentDays > 0
      const multiple = getMultipleForQuatityCalculation(medIntake) || 1

      return {
        ...lineBillValues,
        prescriptionDetails: medIntake,
        prescribedQuantity: hasValidDays ? currentDays * multiple : '',
      }
    })
    if (copyOfDefaultLineBillValues[billTypeIdPrescription]?.length != 0) {
      copyOfDefaultLineBillValues[billTypeIdPrescription] = tempLineBillValues
      setDefaultLineBillValues(copyOfDefaultLineBillValues)
    }
  }
  useEffect(() => {
    let tempdefaultData = {}
    if (lineBillsAndNotesDataForCurrentAppointment) {
      const selectedData = ['lineBillsData', 'Notesdata']
      lineBillsAndNotesDataForCurrentAppointment[selectedData[0]].map(
        (data) => {
          const billTypeId = data['billType']?.id
          const updatedArray = data?.billTypeValues
            ?.map(
              ({
                id,
                name,
                amount,
                prescribedQuantity,
                prescriptionDetails,
                prescriptionDays,
                status,
                isSpouse,
              }) => ({
                id,
                name,
                // API often returns amount as string; Joi requires a number on save
                amount: Number(amount),
                prescribedQuantity: billTypeId === 3 ? prescribedQuantity : 1,
                prescriptionDetails:
                  billTypeId === 3 ? prescriptionDetails : '',
                prescriptionDays:
                  billTypeId === 3 && prescriptionDays ? prescriptionDays : 1,
                status,
                isSpouse,
              }),
            )
            .filter((item) => {
              const isPatientItem = item.isSpouse === 0
              const isLabTestBillType = data?.billType?.name === 'Lab Test'
              const isRestrictedLabTest =
                isLabTestBillType && isRestrictedPatientLabTest(item.name)
              return isPatientItem && !isRestrictedLabTest
            })
          tempdefaultData[data.billType.id] = dedupeNonPharmacyLineBillValues(
            billTypeId,
            updatedArray,
          )
        },
      )
      const notesText =
        lineBillsAndNotesDataForCurrentAppointment.notesData?.notes
      setNotesValue(notesText ? notesText : '')
      setDefaultLineBillValues(tempdefaultData)
    }
  }, [lineBillsAndNotesDataForCurrentAppointment])

  const handlePrintPrescription = async () => {
    try {
      const response = await printPrescription(user.accessToken, {
        type: type,
        appointmentId: appointmentId,
        isSpouse: 0,
      })
      if (response.status === 200) {
        setPrintTemplate(response?.data)

        dispatch(openModal(`printPrescription-${type}-${appointmentId}`))
      } else {
        toast.error('Failed to fetch print template', toastconfig)
      }
    } catch (error) {
      console.log(error)
      toast.error(
        'An error occurred while fetching print template',
        toastconfig,
      )
    }
  }

  const fetchAndSetLineBills = async (selectedType, selectedAppointmentId) => {
    try {
      const response = await getLineBillsAndNotesForAppointment(
        user.accessToken,
        selectedType,
        selectedAppointmentId,
      )

      if (response.status === 200) {
        const data = response.data

        // Set notes
        setNotesValue(data.notesData?.notes || '')

        // Process line bills
        let tempDefaultData = {}
        if (data.lineBillsData) {
          data.lineBillsData.forEach((billTypeData) => {
            if (billTypeData.billType && billTypeData.billTypeValues) {
              const billTypeId = billTypeData.billType.id
              const updatedArray = billTypeData.billTypeValues
                .filter((item) => !item.isSpouse) // Filter out spouse items
                .filter((item) => {
                  const isLabTestBillType =
                    billTypeData?.billType?.name === 'Lab Test'
                  return !(
                    isLabTestBillType && isRestrictedPatientLabTest(item.name)
                  )
                })
                .map((item) => ({
                  id: item.id,
                  name: item.name,
                  amount: parseInt(item.amount, 10),
                  prescribedQuantity:
                    billTypeId === 3 ? item.prescribedQuantity || 1 : 1,
                  prescriptionDetails:
                    billTypeId === 3 ? item.prescriptionDetails || '' : '',
                  prescriptionDays:
                    billTypeId === 3 ? item.prescriptionDays || 1 : 1,
                  status: 'UNPAID', // Set as unpaid for new prescription
                }))

              if (updatedArray.length > 0) {
                tempDefaultData[billTypeId] = updatedArray
              }
            }
          })
        }

        setDefaultLineBillValues((prev) =>
          mergeLineBillValuesOnCopy(prev, tempDefaultData),
        )

        toast.success('Prescription copied successfully', toastconfig)
      } else {
        throw new Error('Failed to fetch prescription details')
      }
    } catch (error) {
      console.error('Error fetching line bills:', error)
      toast.error('Failed to fetch prescription details', toastconfig)
    }
  }

  return (
    <div>
      <Button
        className=" capitalize"
        variant="outlined"
        onClick={onAddPrescriptionClick}
        startIcon={<FaPrescriptionBottleMedical />}
      >
        Prescription
      </Button>
      <Modal
        uniqueKey="addPrescription"
        closeOnOutsideClick={true}
        maxWidth="lg"
        paperSx={{
          maxHeight: 'min(92vh, 960px)',
          width: '100%',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div className="flex max-h-[min(92vh,960px)] min-h-0 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-7 pt-4 sm:px-8">
            <div className="relative flex items-center justify-between gap-4 border-b border-gray-100 pb-3">
              <span className="text-xl font-semibold text-secondary">
                Patient Prescription
              </span>
              {patientName ? (
                <span className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-center text-xl font-bold text-gray-900">
                  {patientName}
                </span>
              ) : null}

              <IconButton
                onClick={() => dispatch(closeModal())}
                size="small"
                aria-label="Close prescription"
              >
                <Close />
              </IconButton>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {activeVisitAppointments && (
                <div className="flex flex-col gap-2">
                  <span className="font-semibold">Previous Prescriptions</span>
                  <Select
                    options={activeVisitAppointments.map((appointment) => ({
                      value: `${appointment.type}-${appointment.appointmentId}`,
                      label: `${dayjs(appointment.appointmentDate).format(
                        'DD-MM-YYYY',
                      )} | ${appointment.type} | ${appointment.doctorName}`,
                      appointment: appointment,
                    }))}
                    onChange={(selected) => {
                      if (
                        selected &&
                        confirm(
                          'Are you sure you want to copy this prescription?',
                        )
                      ) {
                        const [type, appointmentId] = selected.value.split('-')
                        console.log(
                          'Fetching line bills for:',
                          type,
                          appointmentId,
                        )
                        fetchAndSetLineBills(type, appointmentId)
                      } else {
                        // Clear the form when no option is selected
                        setDefaultLineBillValues(null)
                        setNotesValue('')
                      }
                    }}
                    placeholder="Select appointment to copy prescription"
                    isClearable
                  />
                </div>
              )}
              {/* Notes Section */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold">Notes</span>
                <RichText value={notesValue} setValue={setNotesValue} />
              </div>

              {/* Bill Types Section */}
              {allBillTypeValues ? (
                billTypes.map((billType) => {
                  const defaultValues =
                    defaultLineBillValues?.[billType.id]?.map((billData) => ({
                      value: billData.id,
                      label: billData.name,
                      status: billData.status,
                    })) ?? []

                  // Add medicine kits as special options for Pharmacy
                  let selectOptions =
                    allBillTypeValues?.[billType.name]?.map((data) =>
                      billType.name === 'Pharmacy'
                        ? buildPharmacySelectOption(data)
                        : { value: data.id, label: data.name },
                    ) ?? []

                  if (billType.name === 'Lab Test') {
                    selectOptions = selectOptions.filter(
                      (option) => !isRestrictedPatientLabTest(option.label),
                    )
                  }

                  // Add all medicine kit options for Pharmacy
                  if (billType.name === 'Pharmacy') {
                    // Pharmacy in "Prescription" should allow CLEO SHOT,
                    // but not NAPO SHOT (spouse will handle NAPO).
                    const kitOptions = medicineKits
                      .filter((kit) => kit.kitValue !== NAPO_SHOT_KIT_VALUE)
                      .map((kit) => ({
                        value: kit.kitValue,
                        label: kit.kitName,
                        isKit: true, // Flag to identify it's a kit
                      }))
                    selectOptions = [...kitOptions, ...selectOptions]
                  }
                  const paidItemsBlock = (
                    <div className="flex flex-wrap gap-2">
                      {defaultValues.map(
                        (item) =>
                          item.status === 'PAID' && (
                            <span
                              key={`paid-${item.value}`}
                              className="text-success-content bg-success p-1 px-2 rounded-md"
                            >
                              {item.label}
                            </span>
                          ),
                      )}
                    </div>
                  )

                  const isPharmacyBillType = billType.name === 'Pharmacy'
                  const selectBlock = (
                    <>
                      <Select
                        isMulti
                        name={billType.name}
                        value={defaultValues
                          .filter((item) => item.status !== 'PAID')
                          .map((item) =>
                            isPharmacyBillType
                              ? enrichPharmacySelectValue(
                                  item,
                                  allBillTypeValues,
                                )
                              : item,
                          )}
                        options={selectOptions}
                        onChange={setSelectedValues(billType.name)}
                        classNamePrefix={`select-${billType.name.toLowerCase()}`}
                        filterOption={
                          isPharmacyBillType
                            ? pharmacyStartsWithFilter
                            : undefined
                        }
                        styles={
                          isPharmacyBillType ? pharmacySelectStyles : undefined
                        }
                        formatOptionLabel={
                          isPharmacyBillType
                            ? formatPharmacyOptionLabel
                            : undefined
                        }
                      />
                      {isPharmacyBillType && (
                        <PrescriptionPharmacyLowStockLegend />
                      )}
                    </>
                  )

                  if (billType.name === 'Pharmacy') {
                    const pharmacyCurrentBlocks = (
                      <>
                        {paidItemsBlock}
                        {selectBlock}
                        <div className="h-48 border flex flex-col items-center p-2 overflow-y-auto gap-2 bg-primary/10 rounded-lg">
                          {defaultLineBillValues?.['3']?.length > 0 ? (
                            defaultLineBillValues['3'].map(
                              (prescription, index) =>
                                prescription.id &&
                                prescription.status !== 'PAID' ? (
                                  <RenderPrescriptionPharmacy
                                    key={`prescription-${prescription.id}-${index}`}
                                    prescriptionRowIndex={index}
                                    prescriptionName={prescription.name}
                                    prescribedQuantity={
                                      prescription.prescribedQuantity
                                    }
                                    deleteClicked={handleDeleteClicked}
                                    duplicateClicked={handleDuplicateClicked}
                                    daysChange={handleDaysChange}
                                    prescriptionIntake={
                                      prescription.prescriptionDetails
                                    }
                                    prescriptionIntakeChange={
                                      handleIntakeChange
                                    }
                                    prescriptionDays={
                                      prescription.prescriptionDays
                                    }
                                  />
                                ) : null,
                            )
                          ) : (
                            <div className="flex justify-center h-full items-center">
                              <span>No medicine selected</span>
                            </div>
                          )}
                        </div>
                        <div className=" border flex flex-col  p-2 overflow-y-auto gap-2 rounded-lg">
                          {defaultLineBillValues?.['3']?.length > 0 ? (
                            defaultLineBillValues['3'].map((prescription) =>
                              prescription.id &&
                              prescription.status == 'PAID' ? (
                                <div
                                  className="w-full border p-2 flex items-center justify-between rounded bg-gray-100"
                                  key={`paid-${prescription.id}`}
                                >
                                  <div className="w-full flex items-center justify-between gap-4">
                                    <span
                                      className="text-sm font-medium w-40 min-w-0 overflow-hidden whitespace-nowrap text-ellipsis"
                                      title={prescription.name}
                                    >
                                      {prescription.name}
                                    </span>
                                    <div className="flex flex-col">
                                      <span className="text-xs text-gray-500">
                                        Quantity
                                      </span>
                                      <span className="text-sm">
                                        {prescription.prescribedQuantity}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs text-gray-500">
                                        Days
                                      </span>
                                      <span className="text-sm">
                                        {prescription.prescriptionDays}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs text-gray-500">
                                        Intake
                                      </span>
                                      <span className="text-sm">
                                        {prescription?.prescriptionDetails.startsWith(
                                          'OTHER_',
                                        )
                                          ? prescription?.prescriptionDetails?.split(
                                              '_',
                                            )[1]
                                          : prescription?.prescriptionDetails}
                                      </span>
                                    </div>
                                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                      Paid
                                    </span>
                                  </div>
                                </div>
                              ) : null,
                            )
                          ) : (
                            <div className="flex justify-center h-full items-center">
                              <span>No medicine selected</span>
                            </div>
                          )}
                        </div>
                      </>
                    )

                    return (
                      <React.Fragment key={`${billType.name}-multiselect`}>
                        <div className="flex flex-col gap-2 border-b border-gray-100 pb-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold">
                              {billType.name}
                            </span>
                            <Tabs
                              value={pharmacyPanelTab}
                              onChange={(_, v) => setPharmacyPanelTab(v)}
                              variant="scrollable"
                              scrollButtons="auto"
                              sx={{ minHeight: 40 }}
                            >
                              <Tab label="Pharmacy" value="current" />
                              <Tab label="Pharmacy History" value="history" />
                            </Tabs>
                          </div>
                        </div>
                        {pharmacyPanelTab === 'history' && (
                          <PharmacyHistoryContent
                            patientId={patientId}
                            pharmacyHistoryLoading={pharmacyHistoryLoading}
                            pharmacyHistoryError={pharmacyHistoryError}
                            pharmacyHistoryErrorObj={pharmacyHistoryErrorObj}
                            pharmacyHistoryByVisit={pharmacyHistoryByVisit}
                          />
                        )}
                        {pharmacyPanelTab === 'current' &&
                          pharmacyCurrentBlocks}
                      </React.Fragment>
                    )
                  }

                  return (
                    <React.Fragment key={`${billType.name}-multiselect`}>
                      <p className="font-semibold">{billType.name}</p>
                      {paidItemsBlock}
                      {selectBlock}
                    </React.Fragment>
                  )
                })
              ) : (
                <p>No details available</p>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end">
                {/* <Button
              className="capitalize"
              variant="outlined"
              onClick={() => dispatch(closeModal())}
            >
              Close
            </Button> */}
                <div className="flex gap-2">
                  <Button
                    className="capitalize"
                    variant="outlined"
                    onClick={handlePrintPrescription}
                  >
                    Print
                  </Button>
                  <Button
                    className="text-white capitalize"
                    variant="contained"
                    onClick={onSaveClick}
                    disabled={isPending}
                  >
                    {isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        uniqueKey={`printPrescription-${type}-${appointmentId}`}
        closeOnOutsideClick={true}
        maxWidth="md"
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <Button
              className="capitalize"
              variant="outlined"
              onClick={() => dispatch(closeModal())}
            >
              Close
            </Button>
          </div>
          <JoditEditor
            ref={editor}
            value={printTemplate}
            config={{
              readonly: true,
            }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default PatientPrescription
