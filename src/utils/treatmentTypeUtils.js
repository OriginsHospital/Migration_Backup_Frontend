/** OITI / OI+TI (1) — OPU sheet not required. */
export const OITI_TREATMENT_TYPE_ID = 1

/** IUI Self (2) and IUI Donor (3) — discharge summary and OPU sheet do not apply. */
export const IUI_TREATMENT_TYPE_IDS = [2, 3]

/** OI+TI, IUI Self, IUI Donor — future cycle allowed even when treatment is running. */
export const FUTURE_CYCLE_ELIGIBLE_TREATMENT_TYPE_IDS = [
  OITI_TREATMENT_TYPE_ID,
  ...IUI_TREATMENT_TYPE_IDS,
]

/** Treatment types hidden on Scan → OPU sheets (OITI + IUI only). */
export const OPU_SHEET_EXCLUDED_TREATMENT_TYPE_IDS = [
  OITI_TREATMENT_TYPE_ID,
  ...IUI_TREATMENT_TYPE_IDS,
]

export function isOpuSheetExcludedTreatment({
  treatmentTypeId,
  appointmentReason,
} = {}) {
  if (
    treatmentTypeId != null &&
    OPU_SHEET_EXCLUDED_TREATMENT_TYPE_IDS.includes(Number(treatmentTypeId))
  ) {
    return true
  }
  const reason = String(appointmentReason || '').toUpperCase()
  return (
    reason.includes('IUI') ||
    reason.includes('OITI') ||
    /OI\s*\+\s*TI/.test(reason)
  )
}

export function isFutureCycleEligibleTreatment({
  treatmentTypeId,
  treatmentType,
  treatementType,
} = {}) {
  if (
    treatmentTypeId != null &&
    FUTURE_CYCLE_ELIGIBLE_TREATMENT_TYPE_IDS.includes(Number(treatmentTypeId))
  ) {
    return true
  }
  const name = String(treatmentType || treatementType || '').toUpperCase()
  return (
    /OI\s*\+\s*TI/.test(name) || name.includes('OITI') || name.includes('IUI')
  )
}

export function isIuiTreatment({
  treatmentTypeId,
  treatmentType,
  treatementType,
} = {}) {
  if (
    treatmentTypeId != null &&
    IUI_TREATMENT_TYPE_IDS.includes(Number(treatmentTypeId))
  ) {
    return true
  }
  const name = String(treatmentType || treatementType || '').toUpperCase()
  return name.includes('IUI')
}
