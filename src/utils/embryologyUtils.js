// Utility functions for embryology name formatting
export const HUSBAND_FIRST_REPORTS = [
  'Semen Analysis',
  'Fertilization Report',
  'Embryology Report',
  'ET Report',
  'Cryopreservation Report',
]

export const shouldShowHusbandName = (reportType) => {
  return HUSBAND_FIRST_REPORTS.includes(reportType)
}

export const formatPatientName = (patientData, reportType) => {
  if (shouldShowHusbandName(reportType)) {
    return patientData.husbandName || patientData.spouseName
  }
  return patientData.patientName
}

export const formatSpouseName = (patientData, reportType) => {
  if (shouldShowHusbandName(reportType)) {
    return patientData.patientName // Show wife's name in spouse field
  }
  return patientData.husbandName || patientData.spouseName
}

export const formatAge = (patientData, reportType) => {
  if (shouldShowHusbandName(reportType)) {
    return patientData.husbandAge || patientData.spouseAge
  }
  return patientData.patientAge
}

export const formatSpouseAge = (patientData, reportType) => {
  if (shouldShowHusbandName(reportType)) {
    return patientData.patientAge
  }
  return patientData.husbandAge || patientData.spouseAge
}
