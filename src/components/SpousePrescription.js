import React, { useEffect, useMemo, useState, useRef } from 'react'
import RenderPrescriptionPharmacy from './RenderPrescriptionPharmacy'

import RichText from '@/components/RichText'
import { useDispatch, useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, IconButton } from '@mui/material'
import Select from 'react-select'
import Modal from './Modal'
import { FaPrescriptionBottleMedical } from 'react-icons/fa6'
import { closeModal, openModal } from '@/redux/modalSlice'
import {
  getLineBillsAndNotesForAppointment,
  getPharmacyMasterData,
  saveLineBillsAndNotes,
  printPrescription,
} from '@/constants/apis'
import { API_ROUTES } from '@/constants/constants'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import dynamic from 'next/dynamic'
import { Close } from '@mui/icons-material'
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

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

const NAPO_SHOT_KIT_VALUE = 'NAPO_SHOT_KIT'

const pharmacyStartsWithFilter = (option, inputValue) => {
  const normalizedInput = (inputValue || '').trim().toLowerCase()
  if (!normalizedInput) {
    return true
  }

  return (option?.label || '').toLowerCase().startsWith(normalizedInput)
}

function SpousePrescription({
  allBillTypeValues,
  type,
  appointmentId,
  activeVisitAppointments,
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
  const billTypesMap = useMemo(() => {
    const map = {}
    billTypes.map((eachBillType) => {
      map[eachBillType.id] = eachBillType.name
      map[eachBillType.name] = eachBillType.id
    })
    return map
  }, [billTypes])

  const { data: activePharmacyKitsResponse } = useQuery({
    queryKey: [...ACTIVE_PHARMACY_KITS_QUERY_KEY, 'spouse'],
    queryFn: () =>
      getPharmacyMasterData(
        user.accessToken,
        API_ROUTES.GET_ACTIVE_PHARMACY_KITS,
      ),
    enabled: !!user?.accessToken && modal.key === 'addSpousePrescription',
    ...ACTIVE_PHARMACY_KITS_QUERY_OPTIONS,
  })

  const medicineKits = useMemo(() => {
    const kits = activePharmacyKitsResponse?.data
    if (!Array.isArray(kits)) {
      return []
    }
    return kits
      .filter((kit) => kit.kitValue === NAPO_SHOT_KIT_VALUE)
      .map((kit) => ({
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
    })

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await saveLineBillsAndNotes(user.accessToken, payload)
      if (res.status === 200) {
        dispatch(closeModal())
        toast.success('Saved Successfully', toastconfig)
      } else {
        console.log(res)
        toast.error(res.message, toastconfig)
      }
    },
  })

  function onAddPrescriptionClick() {
    // dispatch(openSideDrawer('addPrescription'))
    dispatch(openModal('addSpousePrescription'))
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
        isSpouse: 1,
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
          // console.log(SelectedTypeValuesArray)
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
            }))

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
    console.log(billTypeStruct)
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

        const kitValues = medicineKits.map((k) => k.kitValue)
        const kitNames = medicineKits.map((k) => k.kitName.toUpperCase())
        const filteredOptions = selectedOptions.filter(
          (option) =>
            !kitValues.includes(option.value) &&
            !kitNames.includes(option.label?.toUpperCase()),
        )

        filteredOptions?.forEach((element) => {
          if (!currentPaidItems.some((paid) => paid.id === element.value)) {
            const BillTypeValuesArray = allBillTypeValues[name] || []
            const BillTYpeValueObject = BillTypeValuesArray.find(
              (values) => values.id === element.value,
            )
            if (!BillTYpeValueObject) return

            const infoObject = defaultLineBillValues['3']?.find(
              (values) => values.id === BillTYpeValueObject.id,
            )

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
          if (!currentPaidItems.some((paid) => paid.id === element.value)) {
            const BillTypeValuesArray = allBillTypeValues[name] || []
            const BillTYpeValueObject = BillTypeValuesArray.find(
              (values) => values.id === element.value,
            )
            if (!BillTYpeValueObject) return

            const infoObject = defaultLineBillValues['3']?.find(
              (values) => values.id === BillTYpeValueObject.id,
            )

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
        if (!currentPaidItems.some((paid) => paid.id === element.value)) {
          const BillTypeValuesArray = allBillTypeValues[name]
          const BillTYpeValueObject = BillTypeValuesArray.find((values) => {
            return values.id === element.value
          })

          if (!BillTYpeValueObject) return

          billTypeValues.push({
            id: element.value,
            name: element.label,
            amount: BillTYpeValueObject.amount,
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
  const getMultipleForQuatityCalculation = (intake) => {
    if (intake?.startsWith('OTHER_')) {
      return 1
    }

    switch (intake) {
      case 'OD':
        return 1
      case 'QID':
        return 4
      case 'BID':
        return 2
      case 'TID':
        return 3
      case '2OD':
        return 2
      case '2QID':
        return 8
      case '2BID':
        return 4
      case '2TID':
        return 6
      case '2HS':
        return 2
      case 'WO':
        return 1
      case 'WT':
        return 2
      case 'HS':
        return 1
    }
    return 1
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
      console.log(copyOfDefaultLineBillValues)
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
          console.log(billTypeId)
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
                amount: Number(amount),
                prescribedQuantity: billTypeId === 3 ? prescribedQuantity : '1',
                prescriptionDetails:
                  billTypeId === 3 ? prescriptionDetails : '',
                prescriptionDays:
                  billTypeId === 3 && prescriptionDays ? prescriptionDays : 1,
                status,
                isSpouse,
              }),
            )
            .filter((item) => item.isSpouse === 1)
          tempdefaultData[data.billType.id] = dedupeNonPharmacyLineBillValues(
            billTypeId,
            updatedArray,
          )
        },
      )
      const notesText =
        lineBillsAndNotesDataForCurrentAppointment.spouseNotesData?.notes
      setNotesValue(notesText ? notesText : '')
      console.log(tempdefaultData)
      console.log(lineBillsAndNotesDataForCurrentAppointment)
      setDefaultLineBillValues(tempdefaultData)
    }
  }, [lineBillsAndNotesDataForCurrentAppointment])

  const handlePrintPrescription = async () => {
    try {
      const response = await printPrescription(user.accessToken, {
        type: type,
        appointmentId: appointmentId,
        isSpouse: 1,
      })
      if (response.status === 200) {
        setPrintTemplate(response?.data)
        dispatch(openModal(`printSpousePrescription-${type}-${appointmentId}`))
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

        // Set notes from spouse notes
        setNotesValue(data.spouseNotesData?.notes || '')

        // Process line bills
        let tempDefaultData = {}
        if (data.lineBillsData) {
          data.lineBillsData.forEach((billTypeData) => {
            if (billTypeData.billType && billTypeData.billTypeValues) {
              const billTypeId = billTypeData.billType.id
              const updatedArray = billTypeData.billTypeValues
                .filter((item) => item.isSpouse === 1) // Filter spouse items
                .map((item) => ({
                  id: item.id,
                  name: item.name,
                  amount: Number(item.amount),
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
        // outlined,contained,text,
        onClick={onAddPrescriptionClick}
        // startIcon={<FaPrescriptionBottleMedical />}
      >
        Spouse Prescription
      </Button>
      <Modal
        uniqueKey="addSpousePrescription"
        closeOnOutsideClick={true}
        maxWidth="md"
      >
        <div className="flex justify-between">
          <span className="text-xl font-semibold text-secondary flex items-center py-5 gap-4">
            Spouse Prescription
          </span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        {activeVisitAppointments && (
          <div className="flex flex-col gap-2 py-2">
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
                  confirm('Are you sure you want to copy this prescription?')
                ) {
                  const [type, appointmentId] = selected.value.split('-')
                  fetchAndSetLineBills(type, appointmentId)
                } else {
                  setDefaultLineBillValues(null)
                  setNotesValue('')
                }
              }}
              placeholder="Select appointment to copy prescription"
              isClearable
            />
          </div>
        )}
        <div className="flex flex-col gap-3">
          {/* Notes Section */}
          {/* <h1 className="text-2xl font-semibold">Spouse Prescription</h1> */}
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

              let selectOptions =
                allBillTypeValues?.[billType.name]?.map((data) =>
                  billType.name === 'Pharmacy'
                    ? buildPharmacySelectOption(data)
                    : { value: data.id, label: data.name },
                ) ?? []

              if (billType.name === 'Pharmacy') {
                const kitOptions = medicineKits.map((kit) => ({
                  value: kit.kitValue,
                  label: kit.kitName,
                  isKit: true,
                }))
                selectOptions = [...kitOptions, ...selectOptions]
              }
              // console.log(selectOptions)
              return (
                <React.Fragment key={`${billType.name}-multiselect`}>
                  <p className="font-semibold">{billType.name}</p>

                  {/* Paid Items Display */}
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

                  {/* Selection Component */}
                  {/* <span>{selectOptions.map(item => item.value)}</span> */}
                  <Select
                    isMulti
                    name={billType.name}
                    value={defaultValues
                      .filter((item) => item.status !== 'PAID')
                      .map((item) =>
                        billType.name === 'Pharmacy'
                          ? enrichPharmacySelectValue(item, allBillTypeValues)
                          : item,
                      )}
                    options={selectOptions}
                    onChange={setSelectedValues(billType.name)}
                    classNamePrefix={`select-${billType.name.toLowerCase()}`}
                    filterOption={
                      billType.name === 'Pharmacy'
                        ? pharmacyStartsWithFilter
                        : undefined
                    }
                    styles={
                      billType.name === 'Pharmacy'
                        ? pharmacySelectStyles
                        : undefined
                    }
                    formatOptionLabel={
                      billType.name === 'Pharmacy'
                        ? formatPharmacyOptionLabel
                        : undefined
                    }
                  />
                  {billType.name === 'Pharmacy' && (
                    <PrescriptionPharmacyLowStockLegend />
                  )}

                  {/* Pharmacy Section */}
                  {billType.name === 'Pharmacy' && (
                    <div className="h-48 border flex flex-col items-center p-2 overflow-y-auto gap-2 bg-primary/10 rounded-lg">
                      {defaultLineBillValues?.['3']?.length > 0 ? (
                        defaultLineBillValues['3'].map(
                          (prescription, index) =>
                            prescription.id &&
                            prescription.status !== 'PAID' && (
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
                                prescriptionIntakeChange={handleIntakeChange}
                                prescriptionDays={prescription.prescriptionDays}
                              />
                            ),
                        )
                      ) : (
                        <div className="flex justify-center h-full items-center">
                          <span>No medicine selected</span>
                        </div>
                      )}
                    </div>
                  )}
                  {billType.name === 'Pharmacy' && (
                    <div className="border flex flex-col p-2 overflow-y-auto gap-2 rounded-lg">
                      {defaultLineBillValues?.['3']?.length > 0 ? (
                        defaultLineBillValues['3'].map((prescription) =>
                          prescription.id && prescription.status === 'PAID' ? (
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
                  )}
                </React.Fragment>
              )
            })
          ) : (
            <p>No details available</p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end">
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
      </Modal>

      <Modal
        uniqueKey={`printSpousePrescription-${type}-${appointmentId}`}
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

export default SpousePrescription
