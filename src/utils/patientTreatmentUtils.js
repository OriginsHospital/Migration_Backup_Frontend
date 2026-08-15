import { isFutureCycleEligibleTreatment } from '@/utils/treatmentTypeUtils'

/**
 * Patient has started treatment when an active visit has a treatment cycle.
 * Matches backend patientBasicDetailsQuery treatmentExists logic.
 */
export function patientHasStartedTreatment(patientInfo) {
  if (!patientInfo) return false
  if (
    patientInfo.treatmentExists === 1 ||
    patientInfo.treatmentExists === true
  ) {
    return true
  }
  if (patientInfo.treatmentDetails) return true
  return false
}

/** Active visit treatments from patient register visitInfo payload */
export function activeVisitHasTreatments(visitInfoData) {
  return (visitInfoData?.Treatments?.length ?? 0) > 0
}

export function resolveActiveTreatmentTypeId({ patientInfo, visitInfo } = {}) {
  const fromPatient = patientInfo?.treatmentDetails?.treatmentTypeId
  if (fromPatient != null) return Number(fromPatient)

  const treatments =
    visitInfo?.Treatments ??
    visitInfo?.data?.Treatments ??
    visitInfo?.treatments
  const fromVisit = treatments?.[0]?.treatmentTypeId
  if (fromVisit != null) return Number(fromVisit)

  return null
}

export function patientHasActiveTreatment({ patientInfo, visitInfo } = {}) {
  return (
    patientHasStartedTreatment(patientInfo) ||
    activeVisitHasTreatments(visitInfo?.data ?? visitInfo)
  )
}

/**
 * Future cycle: always for patients without treatment; for OI+TI / IUI Self / IUI Donor
 * also when treatment is already running on the active visit.
 */
export function canScheduleFutureCycle({ patientInfo, visitInfo } = {}) {
  const patientMasterId = patientInfo?.id ?? patientInfo?.patientMasterId
  const hasPatientRecord =
    Number(patientMasterId) > 0 ||
    !!patientInfo?.patientId ||
    activeVisitHasTreatments(visitInfo?.data ?? visitInfo)

  if (!hasPatientRecord) return false

  if (!patientHasActiveTreatment({ patientInfo, visitInfo })) {
    return true
  }

  const treatmentTypeId = resolveActiveTreatmentTypeId({
    patientInfo,
    visitInfo,
  })
  const treatmentName =
    patientInfo?.treatmentDetails?.treatementType ??
    patientInfo?.treatmentDetails?.treatmentType ??
    visitInfo?.Treatments?.[0]?.treatmentType ??
    visitInfo?.data?.Treatments?.[0]?.treatmentType

  return isFutureCycleEligibleTreatment({
    treatmentTypeId,
    treatmentType: treatmentName,
    treatementType: treatmentName,
  })
}
