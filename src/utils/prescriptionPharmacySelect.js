import React from 'react'
import { findPharmacyItemForKitMedicine } from '@/utils/pharmacyAutoCompanions'

export function parseKitMedicines(medicines) {
  if (!medicines) {
    return []
  }
  let list = medicines
  if (typeof medicines === 'string') {
    try {
      list = JSON.parse(medicines)
    } catch {
      return []
    }
  }
  if (!Array.isArray(list)) {
    return []
  }
  return list
    .map((item) => ({
      name: String(item?.name ?? '').trim(),
      quantity: getKitMedicineQuantity(item),
    }))
    .filter((item) => item.name)
}

export function getKitMedicineQuantity(kitMedicine) {
  const qty = Number(kitMedicine?.quantity ?? kitMedicine?.qty)
  return Number.isFinite(qty) && qty >= 1 ? Math.floor(qty) : 1
}

export const ACTIVE_PHARMACY_KITS_QUERY_KEY = ['activePharmacyKits']

export const ACTIVE_PHARMACY_KITS_QUERY_OPTIONS = {
  staleTime: 0,
  refetchOnMount: 'always',
}

export function getSelectedPharmacyKits(
  selectedOptions = [],
  medicineKits = [],
) {
  const selectedKits = []

  medicineKits.forEach((kit) => {
    const isSelected = selectedOptions?.some(
      (option) =>
        option.value === kit.kitValue ||
        option.label?.toUpperCase() === kit.kitName.toUpperCase(),
    )

    if (isSelected) {
      selectedKits.push(kit)
    }
  })

  return selectedKits
}

/**
 * Applies kit master quantities to prescription rows.
 * Quantities are set from master data (not added) so admin edits reflect immediately.
 */
export function applyPharmacyKitsToBillTypeValues({
  kits = [],
  billTypeValues = [],
  pharmacyItems = [],
  defaultLineBillValues = {},
  billTypeId = '3',
}) {
  const kitQuantityByMedicineId = new Map()
  const kitMedicineMeta = new Map()

  kits.forEach((kit) => {
    parseKitMedicines(kit.medicines).forEach((kitMedicine) => {
      const kitQuantity = getKitMedicineQuantity(kitMedicine)
      const medicineInPharmacy = findPharmacyItemForKitMedicine(
        pharmacyItems,
        kitMedicine.name,
      )

      if (!medicineInPharmacy) {
        return
      }

      const medicineId = medicineInPharmacy.id
      kitQuantityByMedicineId.set(
        medicineId,
        (kitQuantityByMedicineId.get(medicineId) || 0) + kitQuantity,
      )
      kitMedicineMeta.set(medicineId, {
        id: medicineInPharmacy.id,
        name: medicineInPharmacy.name,
        amount: parseInt(medicineInPharmacy.amount, 10),
      })
    })
  })

  const updatedBillTypeValues = [...billTypeValues]
  const unpaidPharmacyRows =
    defaultLineBillValues?.[billTypeId]?.filter(
      (row) => row.status !== 'PAID',
    ) ?? []

  kitQuantityByMedicineId.forEach((quantity, medicineId) => {
    const meta = kitMedicineMeta.get(medicineId)
    const existingIndex = updatedBillTypeValues.findIndex(
      (item) => item.id === medicineId && item.status !== 'PAID',
    )
    const infoObject = unpaidPharmacyRows.find((row) => row.id === medicineId)
    const kitRowFields = {
      prescribedQuantity: quantity,
      isKitMedicine: true,
      kitBaseQuantity: quantity,
      prescriptionDetails: infoObject?.prescriptionDetails ?? '',
      prescriptionDays: infoObject?.prescriptionDays ?? 1,
      status: 'UNPAID',
    }

    if (existingIndex >= 0) {
      updatedBillTypeValues[existingIndex] = {
        ...updatedBillTypeValues[existingIndex],
        ...kitRowFields,
      }
      return
    }

    updatedBillTypeValues.push({
      ...meta,
      ...kitRowFields,
    })
  })

  return updatedBillTypeValues
}

export function preserveKitMedicineQuantity(row, updates = {}) {
  if (!row?.isKitMedicine) {
    return { ...row, ...updates }
  }

  const baseQuantity = row.kitBaseQuantity ?? row.prescribedQuantity

  return {
    ...row,
    ...updates,
    prescribedQuantity: baseQuantity,
  }
}

export const PHARMACY_LOW_STOCK_THRESHOLD = 5
export const PHARMACY_LOW_STOCK_SKY_BLUE = '#87CEEB'
export const PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT = '#0284C7'

export function getPharmacyStockQuantity(item) {
  return Number(item?.quantity ?? item?.availableQuantity ?? 0)
}

export function isPharmacyLowStock(item) {
  return getPharmacyStockQuantity(item) < PHARMACY_LOW_STOCK_THRESHOLD
}

export function buildPharmacySelectOption(data) {
  const quantity = getPharmacyStockQuantity(data)
  return {
    value: data.id,
    label: data.name,
    quantity,
    isLowStock: quantity < PHARMACY_LOW_STOCK_THRESHOLD,
  }
}

export function enrichPharmacySelectValue(option, allBillTypeValues) {
  if (!option?.value) {
    return option
  }

  const stockItem = allBillTypeValues?.Pharmacy?.find(
    (item) => String(item.id) === String(option.value),
  )

  if (!stockItem) {
    return option
  }

  return {
    ...option,
    ...buildPharmacySelectOption(stockItem),
  }
}

export const pharmacySelectStyles = {
  option: (provided, state) => {
    if (!state.data?.isLowStock) {
      return provided
    }

    return {
      ...provided,
      backgroundColor: state.isSelected
        ? PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT
        : state.isFocused
          ? '#7EC8E3'
          : PHARMACY_LOW_STOCK_SKY_BLUE,
      color: state.isSelected ? '#ffffff' : PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT,
      fontWeight: 500,
    }
  },
  multiValue: (provided, state) => {
    if (!state.data?.isLowStock) {
      return provided
    }

    return {
      ...provided,
      backgroundColor: PHARMACY_LOW_STOCK_SKY_BLUE,
    }
  },
  multiValueLabel: (provided, state) => {
    if (!state.data?.isLowStock) {
      return provided
    }

    return {
      ...provided,
      color: PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT,
      fontWeight: 600,
    }
  },
}

export function formatPharmacyOptionLabel(option) {
  if (option?.isKit || !option?.isLowStock) {
    return option.label
  }

  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span>{option.label}</span>
      <span
        style={{ color: PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT }}
        className="text-xs font-semibold whitespace-nowrap"
      >
        Qty: {option.quantity}
      </span>
    </span>
  )
}

export function PrescriptionPharmacyLowStockLegend() {
  return (
    <p className="text-xs flex items-center gap-2 mt-1">
      <span
        className="inline-block w-3 h-3 rounded-sm shrink-0"
        style={{ backgroundColor: PHARMACY_LOW_STOCK_SKY_BLUE }}
        aria-hidden
      />
      <span style={{ color: PHARMACY_LOW_STOCK_SKY_BLUE_ACCENT }}>
        Sky blue items have available stock quantity less than 5
      </span>
    </p>
  )
}
