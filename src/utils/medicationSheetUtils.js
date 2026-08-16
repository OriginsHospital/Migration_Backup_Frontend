export function buildMedicationFormData(medicationRows, medicationSheet) {
  const safeRows = Array.isArray(medicationRows) ? medicationRows : []
  const sheet =
    medicationSheet &&
    typeof medicationSheet === 'object' &&
    !Array.isArray(medicationSheet)
      ? medicationSheet
      : {}
  const sheetRows = Array.isArray(sheet.rows) ? sheet.rows : []

  return {
    ...sheet,
    rows: safeRows.length > 0 ? safeRows : sheetRows,
  }
}

export function getAutofilledMedicationRows(medicationSheet, columns = []) {
  const sheet =
    medicationSheet &&
    typeof medicationSheet === 'object' &&
    !Array.isArray(medicationSheet)
      ? medicationSheet
      : {}
  const rows = Array.isArray(sheet.rows) ? sheet.rows : []

  return rows.filter((row) => {
    const medName = (row?.label || row?.value || '').trim()
    if (!medName) return false

    const dayColumns = Array.isArray(columns) ? columns : []
    if (dayColumns.length > 0) {
      return dayColumns.some((day) => sheet[`${day}-${medName}`])
    }

    return Object.keys(sheet).some(
      (key) => key.endsWith(`-${medName}`) && sheet[key],
    )
  })
}

export function mergePrescribedMedicationRows(existingRows, prescribedOptions) {
  const safeRows = Array.isArray(existingRows) ? [...existingRows] : []
  const prescribed = Array.isArray(prescribedOptions) ? prescribedOptions : []

  prescribed.forEach((med) => {
    const name = (med?.itemName || med?.label || med?.value || '').trim()
    if (!name) return

    const exists = safeRows.some(
      (row) => row?.label === name || row?.value === name,
    )
    if (!exists) {
      safeRows.push({ label: name, value: name })
    }
  })

  return safeRows
}

export function getMedicationDropdownOptions(
  medicationOptions,
  allBillTypeValues,
) {
  const names = []
  const seen = new Set()

  const addName = (rawName) => {
    const name = String(rawName || '').trim()
    if (!name) return
    const key = name.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    names.push(name)
  }

  ;(Array.isArray(medicationOptions) ? medicationOptions : []).forEach(
    (med) => {
      addName(med?.itemName || med?.label || med?.value || med)
    },
  )

  const pharmacyCatalog =
    allBillTypeValues?.Pharmacy ||
    allBillTypeValues?.['Pharmacy Items'] ||
    allBillTypeValues?.pharmacy ||
    []

  ;(Array.isArray(pharmacyCatalog) ? pharmacyCatalog : []).forEach((item) => {
    addName(item?.itemName || item?.name)
  })

  return names
}

export function getMedicationSheetRowsFromTemplate(template) {
  if (Array.isArray(template)) {
    return template
  }
  if (Array.isArray(template?.rows)) {
    return template.rows
  }
  if (Array.isArray(template?.medicationSheet)) {
    return template.medicationSheet
  }
  if (Array.isArray(template?.medicationSheet?.rows)) {
    return template.medicationSheet.rows
  }
  if (Array.isArray(template?.medicationRows)) {
    return template.medicationRows
  }
  return []
}
