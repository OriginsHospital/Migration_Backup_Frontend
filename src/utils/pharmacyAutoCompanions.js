/**
 * When a trigger medicine is prescribed, these companion items are added automatically.
 * Names are matched flexibly against pharmacy master data (case, spacing, optional suffixes like INJ).
 */
export const PHARMACY_AUTO_COMPANION_RULES = [
  {
    trigger: 'EUTRIG-HP 10000',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'EUTRIG-HP 2000',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'EUTRIG-HP 5000',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'ARACHITOL',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'CETROCARE 0.25 MG INJ',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'SITRODIN 150 IU',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'SITRODIN 75 IU',
    companions: [
      { name: 'NIPRO SYRINGE 2.5ML', quantity: 1 },
      { name: 'DISPOVAN NEEDLE 26', quantity: 1 },
    ],
  },
  {
    trigger: 'PERSINAL 150',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'SIFASI 5000',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'GLUCI',
    companions: [{ name: 'NIPRO SYRINGE 10ML', quantity: 1 }],
  },
  {
    trigger: 'SUSTEN 100 INJ',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'ENDOKINE 300 MCG INJ',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'Strone 100 mg inj',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
  {
    trigger: 'BETT AMP',
    companions: [{ name: 'NIPRO SYRINGE 2.5ML', quantity: 1 }],
  },
]

export function normalizePharmacyName(name = '') {
  return String(name).toUpperCase().replace(/\s+/g, ' ').trim()
}

export function normalizePharmacyNameCompact(name = '') {
  return normalizePharmacyName(name).replace(/\s/g, '')
}

export function pharmacyNamesMatch(nameA, nameB) {
  const normA = normalizePharmacyName(nameA)
  const normB = normalizePharmacyName(nameB)
  if (!normA || !normB) {
    return false
  }
  if (normA === normB) {
    return true
  }
  const compactA = normalizePharmacyNameCompact(nameA)
  const compactB = normalizePharmacyNameCompact(nameB)
  if (compactA === compactB) {
    return true
  }
  return normA.includes(normB) || normB.includes(normA)
}

export function getPharmacyItemDisplayName(item) {
  return item?.name ?? item?.itemName ?? ''
}

const PHARMACY_DOSAGE_FORM_SUFFIX =
  /\s+(TAB|TABS|CAP|CAPS|INJ|INJECTION|AMP|AMPOULE|SYRUP|CREAM|GEL|OINT|OINTMENT|TABLET|TABLETS)\s*$/i

/** Kit master names often differ from item_master (hyphens, TAB suffix, spelling). */
export const PHARMACY_KIT_EQUIVALENT_GROUPS = [
  [
    'DROTIN-M TAB',
    'DROTIN M TAB',
    'DROTIN M',
    'DROTIN-M',
    'DROTVIN M',
    'DROTVIN-M',
    'DROTVIN M TAB',
    'DROTVIN-M TAB',
  ],
]

export function normalizePharmacyNameForKitMatch(name = '') {
  let normalized = normalizePharmacyName(name)
  normalized = normalized.replace(/[-_.]/g, ' ')
  normalized = normalized.replace(PHARMACY_DOSAGE_FORM_SUFFIX, '')
  normalized = normalized.replace(/\s+/g, ' ').trim()
  return normalized.replace(/\s/g, '')
}

function isInKitEquivalentGroup(name, group) {
  const compact = normalizePharmacyNameForKitMatch(name)
  return group.some((term) => {
    if (pharmacyNamesMatch(term, name)) {
      return true
    }
    return normalizePharmacyNameForKitMatch(term) === compact
  })
}

export function pharmacyKitNamesMatch(kitMedicineName, pharmacyItemName) {
  if (pharmacyNamesMatch(kitMedicineName, pharmacyItemName)) {
    return true
  }
  if (
    normalizePharmacyNameForKitMatch(kitMedicineName) ===
    normalizePharmacyNameForKitMatch(pharmacyItemName)
  ) {
    return true
  }
  return PHARMACY_KIT_EQUIVALENT_GROUPS.some(
    (group) =>
      isInKitEquivalentGroup(kitMedicineName, group) &&
      isInKitEquivalentGroup(pharmacyItemName, group),
  )
}

export function findPharmacyItemByName(billTypeValuesArray, targetName) {
  if (!billTypeValuesArray?.length || !targetName) {
    return null
  }
  return (
    billTypeValuesArray.find((item) =>
      pharmacyNamesMatch(getPharmacyItemDisplayName(item), targetName),
    ) ?? null
  )
}

/** Resolves a kit medicine row to a pharmacy inventory item (flexible name matching). */
export function findPharmacyItemForKitMedicine(
  billTypeValuesArray,
  kitMedicineName,
) {
  if (!billTypeValuesArray?.length || !kitMedicineName) {
    return null
  }

  const byFuzzy = findPharmacyItemByName(billTypeValuesArray, kitMedicineName)
  if (byFuzzy) {
    return byFuzzy
  }

  return (
    billTypeValuesArray.find((item) =>
      pharmacyKitNamesMatch(kitMedicineName, getPharmacyItemDisplayName(item)),
    ) ?? null
  )
}

export function getCompanionsForTriggerMedicine(triggerName = '') {
  const companions = []
  for (const rule of PHARMACY_AUTO_COMPANION_RULES) {
    if (!pharmacyNamesMatch(triggerName, rule.trigger)) {
      continue
    }
    companions.push(...rule.companions)
  }
  return companions
}

export function isCompanionOfTriggerMedicine(companionName, triggerName) {
  return getCompanionsForTriggerMedicine(triggerName).some((companion) =>
    pharmacyNamesMatch(companion.name, companionName),
  )
}

export function getPrescriptionDaysFromTriggersForCompanion(
  billTypeValues = [],
  companionName,
) {
  for (const row of billTypeValues) {
    if (row.status === 'PAID') {
      continue
    }
    const companions = getCompanionsForTriggerMedicine(row.name)
    if (
      companions.some((companion) =>
        pharmacyNamesMatch(companion.name, companionName),
      )
    ) {
      const days = Number(row.prescriptionDays)
      if (Number.isFinite(days) && days > 0) {
        return days
      }
    }
  }
  return null
}

function resolveCompanionQuantity(companionDef, days, intakeMultiple) {
  const perDayQty = companionDef?.quantity ?? 1
  const multiple = intakeMultiple > 0 ? intakeMultiple : 1
  if (days === '' || days == null) {
    return ''
  }
  const numericDays = Number(days)
  if (!Number.isFinite(numericDays) || numericDays <= 0) {
    return ''
  }
  return numericDays * perDayQty * multiple
}

function isKitSourcedPrescriptionRow(row) {
  return Boolean(row?.isKitMedicine)
}

function preserveKitRowQuantity(row, updates = {}) {
  if (!isKitSourcedPrescriptionRow(row)) {
    return { ...row, ...updates }
  }

  return {
    ...row,
    ...updates,
    prescribedQuantity: row.kitBaseQuantity ?? row.prescribedQuantity,
  }
}

/**
 * When days change on an injection trigger, mirror days (and quantity) on its auto-added companions.
 */
export function syncPrescriptionDaysForTriggerAndCompanions({
  prescriptionRows = [],
  triggerRowIndex,
  days,
  getMultipleForQuatityCalculation = () => 1,
}) {
  const triggerRow = prescriptionRows[triggerRowIndex]
  if (!triggerRow?.name) {
    return prescriptionRows
  }

  const triggerCompanions = getCompanionsForTriggerMedicine(triggerRow.name)
  if (!triggerCompanions.length) {
    return prescriptionRows.map((lineBillValues, index) => {
      if (index !== triggerRowIndex) {
        return lineBillValues
      }

      if (isKitSourcedPrescriptionRow(lineBillValues)) {
        if (days === '') {
          return preserveKitRowQuantity(lineBillValues, {
            prescriptionDays: '',
          })
        }

        const numericDays = Number(days)
        if (Number.isFinite(numericDays) && numericDays > 0) {
          return preserveKitRowQuantity(lineBillValues, {
            prescriptionDays: numericDays,
          })
        }

        return lineBillValues
      }

      const multiple =
        getMultipleForQuatityCalculation(lineBillValues.prescriptionDetails) ||
        1
      if (days === '') {
        return {
          ...lineBillValues,
          prescriptionDays: '',
          prescribedQuantity: '',
        }
      }
      const numericDays = Number(days)
      if (Number.isFinite(numericDays) && numericDays > 0) {
        return {
          ...lineBillValues,
          prescriptionDays: numericDays,
          prescribedQuantity: numericDays * multiple,
        }
      }
      return lineBillValues
    })
  }

  return prescriptionRows.map((lineBillValues, index) => {
    if (isKitSourcedPrescriptionRow(lineBillValues)) {
      return lineBillValues
    }

    const isTriggerRow = index === triggerRowIndex
    const isLinkedCompanion =
      !isTriggerRow &&
      triggerCompanions.some((companion) =>
        pharmacyNamesMatch(lineBillValues.name, companion.name),
      )

    if (!isTriggerRow && !isLinkedCompanion) {
      return lineBillValues
    }

    const companionDef = triggerCompanions.find((companion) =>
      pharmacyNamesMatch(lineBillValues.name, companion.name),
    )
    const multiple = isLinkedCompanion
      ? 1
      : getMultipleForQuatityCalculation(lineBillValues.prescriptionDetails) ||
        1

    if (days === '') {
      return {
        ...lineBillValues,
        prescriptionDays: '',
        prescribedQuantity: '',
      }
    }

    const numericDays = Number(days)
    if (!Number.isFinite(numericDays) || numericDays <= 0) {
      return lineBillValues
    }

    return {
      ...lineBillValues,
      prescriptionDays: numericDays,
      prescribedQuantity: isLinkedCompanion
        ? resolveCompanionQuantity(companionDef, numericDays, multiple)
        : numericDays * multiple,
    }
  })
}

export function getCompanionMedicinesForTriggers(selectedMedicineNames = []) {
  const companions = []
  const seen = new Set()

  for (const rule of PHARMACY_AUTO_COMPANION_RULES) {
    const triggerSelected = selectedMedicineNames.some((name) =>
      pharmacyNamesMatch(name, rule.trigger),
    )
    if (!triggerSelected) {
      continue
    }
    for (const companion of rule.companions) {
      const key = normalizePharmacyNameCompact(companion.name)
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      companions.push(companion)
    }
  }

  return companions
}

/**
 * Adds companion medicines to the prescription list when not already present (unpaid).
 */
export function applyPharmacyCompanionMedicines({
  companions,
  billTypeValuesArray,
  billTypeValues,
  existingAllItems = [],
  defaultLineBillValues,
}) {
  if (!companions?.length || !billTypeValuesArray?.length) {
    return billTypeValues
  }

  companions.forEach((companion) => {
    const medicineInPharmacy = findPharmacyItemByName(
      billTypeValuesArray,
      companion.name,
    )
    if (!medicineInPharmacy) {
      return
    }

    const existingSelectionIndex = billTypeValues.findIndex(
      (item) => item.id === medicineInPharmacy.id && item.status !== 'PAID',
    )
    const triggerDaysForCompanion = getPrescriptionDaysFromTriggersForCompanion(
      billTypeValues,
      companion.name,
    )

    if (existingSelectionIndex >= 0) {
      const existingRow = billTypeValues[existingSelectionIndex]

      // Kit master quantities take priority over auto-companion defaults.
      if (isKitSourcedPrescriptionRow(existingRow)) {
        return
      }

      if (triggerDaysForCompanion != null) {
        billTypeValues[existingSelectionIndex] = {
          ...existingRow,
          prescriptionDays: triggerDaysForCompanion,
          prescribedQuantity: resolveCompanionQuantity(
            companion,
            triggerDaysForCompanion,
            1,
          ),
        }
        return
      }

      return
    }

    const existingUnpaid = existingAllItems.find(
      (item) => item.id === medicineInPharmacy.id && item.status !== 'PAID',
    )

    const infoObject = defaultLineBillValues?.['3']?.find(
      (values) =>
        values.id === medicineInPharmacy.id && values.status !== 'PAID',
    )
    const resolvedDays =
      infoObject?.prescriptionDays ??
      existingUnpaid?.prescriptionDays ??
      triggerDaysForCompanion ??
      1
    const resolvedQuantity =
      infoObject?.prescribedQuantity ??
      existingUnpaid?.prescribedQuantity ??
      resolveCompanionQuantity(companion, resolvedDays, 1)

    if (existingUnpaid) {
      billTypeValues.push({
        id: medicineInPharmacy.id,
        name: medicineInPharmacy.name,
        amount: parseInt(medicineInPharmacy.amount, 10),
        prescribedQuantity: resolvedQuantity,
        prescriptionDetails:
          infoObject?.prescriptionDetails ??
          existingUnpaid.prescriptionDetails ??
          '',
        prescriptionDays: resolvedDays,
        status: 'UNPAID',
      })
      return
    }

    billTypeValues.push({
      id: medicineInPharmacy.id,
      name: medicineInPharmacy.name,
      amount: parseInt(medicineInPharmacy.amount, 10),
      prescribedQuantity: resolvedQuantity,
      prescriptionDetails: infoObject?.prescriptionDetails ?? '',
      prescriptionDays: resolvedDays,
      status: 'UNPAID',
    })
  })

  return billTypeValues
}
