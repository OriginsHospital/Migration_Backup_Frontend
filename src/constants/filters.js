export const stockReportfilterData = (data, filters) => {
  if (!data) return []
  return data.filter((row) => {
    return Object.entries(filters).every(([field, filter]) => {
      if (!filter || !filter.value) return true

      switch (field) {
        case 'itemName':
          const itemName = row.itemName?.toLowerCase()
          if (!itemName) return false

          if (filter.prefix === 'LIKE') {
            return itemName.includes(filter.value.toLowerCase())
          }
          return filter.prefix === 'NOT LIKE'
            ? !itemName.includes(filter.value.toLowerCase())
            : true

        case 'totalQuantity':
          const quantity = Number(row.totalQuantity)
          const filterValue = Number(filter.value)

          if (isNaN(quantity) || isNaN(filterValue)) return true

          switch (filter.prefix) {
            case 'LESS_THAN':
              return quantity < filterValue
            case 'GREATER_THAN':
              return quantity > filterValue
            default:
              return true
          }

        default:
          return true
      }
    })
  })
}

export const prescribedReportFilterData = (data, filters) => {
  if (!data) return []
  return data.filter((row) => {
    return Object.entries(filters).every(([field, filter]) => {
      if (!filter || !filter.value) return true

      const fieldPath = field.split('.')
      let value = row
      for (const path of fieldPath) {
        value = value?.[path]
      }
      if (!value) return false

      switch (filter.prefix) {
        case 'LIKE':
          return value.toLowerCase().includes(filter.value.toLowerCase())
        case 'NOT LIKE':
          return !value.toLowerCase().includes(filter.value.toLowerCase())
        default:
          return true
      }
    })
  })
}

export const grnVendorReportFilterData = (data, filters) => {
  if (!data) return []
  return data.filter((row) => {
    return Object.entries(filters).every(([field, filter]) => {
      if (!filter || !filter.value) return true

      switch (field) {
        case 'grnNo':
        case 'supplier':
          const value = row[field]?.toLowerCase()
          if (!value) return false

          if (filter.prefix === 'LIKE') {
            return value.includes(filter.value.toLowerCase())
          }
          return filter.prefix === 'NOT LIKE'
            ? !value.includes(filter.value.toLowerCase())
            : true

        case 'status':
          if (filter.prefix === 'IN') {
            return filter.value.includes(row[field])
          }
          return filter.prefix === 'NOT IN'
            ? !filter.value.includes(row[field])
            : true

        case 'totalAmount':
          const amount = Number(row[field])
          const filterValue = Number(filter.value)

          if (isNaN(amount) || isNaN(filterValue)) return true

          switch (filter.prefix) {
            case 'LESS_THAN':
              return amount < filterValue
            case 'GREATER_THAN':
              return amount > filterValue
            default:
              return true
          }

        // case 'date':
        //   if (!filter.start && !filter.end) return true
        //   const rowDate = dayjs(row[field])
        //   if (!rowDate.isValid()) return false

        //   if (filter.start && rowDate.isBefore(dayjs(filter.start).startOf('day'))) {
        //     return false
        //   }
        //   if (filter.end && rowDate.isAfter(dayjs(filter.end).endOf('day'))) {
        //     return false
        //   }
        //   return true

        default:
          return true
      }
    })
  })
}

export const vendorManufacturerDeptReportFilterData = (data, filters) => {
  if (!data) return []
  return data.filter((row) => {
    return Object.entries(filters).every(([field, filter]) => {
      if (!filter || !filter.value) return true

      const value = row?.[field]
      const str = value == null ? '' : String(value).toLowerCase()
      const query = String(filter.value).toLowerCase()

      switch (filter.prefix) {
        case 'LIKE':
          return str.includes(query)
        case 'NOT LIKE':
          return !str.includes(query)
        default:
          return true
      }
    })
  })
}

export const patientFilterData = (data, filters) => {
  if (!data) return []
  console.log('patientFilterData', data, filters)
  return data.filter((row) => {
    return Object.entries(filters).every(([field, filterValue]) => {
      // If no filter value is set or filter is null, include the row
      if (!filterValue || filterValue === null) return true

      const { prefix, value } = filterValue

      // If no value is set or empty array, include the row
      if (!value || (Array.isArray(value) && value.length === 0)) return true

      // Convert single value to array if needed
      const selectedValues = Array.isArray(value) ? value : [value]

      switch (field) {
        case 'Name': {
          const patientName = row.Name
          if (!patientName) return false
          if (prefix === 'LIKE') {
            return patientName.toLowerCase().includes(value.toLowerCase())
          }
          return prefix === 'NOT LIKE'
            ? !patientName.toLowerCase().includes(value.toLowerCase())
            : true
        }
        case 'mobileNo': {
          const mobileNo = row.mobileNo
          if (!mobileNo) return false
          if (prefix === 'LIKE') {
            return mobileNo.includes(value)
          }
          return prefix === 'NOT LIKE' ? !mobileNo.includes(value) : true
        }
        case 'aadhaarNo': {
          const aadhaarNo = row.aadhaarNo
          if (!aadhaarNo) return false
          if (prefix === 'LIKE') {
            return aadhaarNo.includes(value)
          }
          return prefix === 'NOT LIKE' ? !aadhaarNo.includes(value) : true
        }
        case 'city.name': {
          const cityName = row.city?.name
          if (!cityName) return false
          if (prefix === 'IN') {
            return selectedValues.includes(cityName)
          } else if (prefix === 'NOT IN') {
            return !selectedValues.includes(cityName)
          }
          return true
        }
        case 'patientType.name': {
          const patientTypeName = row.patientType?.name
          if (!patientTypeName) return false
          if (prefix === 'IN') {
            return selectedValues.includes(patientTypeName)
          } else if (prefix === 'NOT IN') {
            return !selectedValues.includes(patientTypeName)
          }
          return true
        }
        case 'referralSource.referralSource': {
          const referralSourceName = row.referralSource?.referralSource
          if (!referralSourceName) return false
          if (prefix === 'IN') {
            return selectedValues.includes(referralSourceName)
          } else if (prefix === 'NOT IN') {
            return !selectedValues.includes(referralSourceName)
          }
          return true
        }
        case 'registeredDate': {
          const registeredDate = row.registeredDate
          if (!registeredDate) return false
          const date = dayjs(registeredDate)
          const startDate = value.start ? dayjs(value.start) : null
          const endDate = value.end ? dayjs(value.end) : null

          if (startDate && endDate) {
            return date.isAfter(startDate) && date.isBefore(endDate)
          } else if (startDate) {
            return date.isAfter(startDate)
          } else if (endDate) {
            return date.isBefore(endDate)
          }
          return true
        }
        default:
          return true
      }
    })
  })
}
