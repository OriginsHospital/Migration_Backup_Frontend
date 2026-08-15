/**
 * Lab / scan / embryology rows should appear once per item id on load.
 * Pharmacy may intentionally have multiple rows for the same medicine.
 */
export function dedupeNonPharmacyLineBillValues(billTypeId, values = []) {
  if (billTypeId === 3 || !values.length) {
    return values
  }

  const seen = new Map()
  for (const item of values) {
    const existing = seen.get(item.id)
    if (!existing) {
      seen.set(item.id, item)
      continue
    }
    if (item.status === 'PAID' && existing.status !== 'PAID') {
      seen.set(item.id, item)
    }
  }
  return [...seen.values()]
}

/**
 * Merges copied prescription line bills into the current form state so items
 * already added on this appointment (especially unpaid pharmacy rows) are kept.
 */
export function mergeLineBillValuesOnCopy(prev, copied) {
  if (!prev) {
    return copied ?? {}
  }
  if (!copied || Object.keys(copied).length === 0) {
    return prev
  }

  const merged = { ...copied }

  Object.keys(prev).forEach((billTypeId) => {
    const prevItems = prev[billTypeId] || []
    if (!prevItems.length) {
      return
    }

    const copiedItems = merged[billTypeId] || []
    const copiedIds = new Set(copiedItems.map((item) => item.id))

    const paidFromPrev = prevItems.filter((item) => item.status === 'PAID')
    const unpaidFromPrevNotInCopy = prevItems.filter(
      (item) => item.status !== 'PAID' && !copiedIds.has(item.id),
    )

    if (merged[billTypeId]) {
      merged[billTypeId] = [
        ...paidFromPrev,
        ...copiedItems,
        ...unpaidFromPrevNotInCopy,
      ]
    } else {
      merged[billTypeId] = [...prevItems]
    }
  })

  return merged
}
