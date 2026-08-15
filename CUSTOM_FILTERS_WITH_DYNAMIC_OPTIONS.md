# Custom Filters with Dynamic Options - Implementation Guide

This guide explains how to implement custom filters with dynamic options in your HMS application using the `FilteredDataGrid` component.

## Overview

The enhanced filtering system supports:

- **Text filters**: LIKE, NOT LIKE operations
- **Select filters**: IN, NOT IN operations with dynamic multi-select dropdowns
- **Number filters**: LESS_THAN, GREATER_THAN operations
- **Date range filters**: Date range selection
- **Dynamic options**: Automatically loaded from data or API calls

## Key Components

### 1. FilteredDataGrid Component

The main wrapper component that handles filtering logic and state management.

### 2. EnhancedCustomToolbar Component

The toolbar component that renders filter UI with support for dynamic options.

## Current Implementation in All Patients DataGrid

### Filter Configuration

```javascript
const customFilters = [
  {
    field: 'Name',
    label: 'Patient Name',
    type: 'text',
  },
  {
    field: 'mobileNo',
    label: 'Mobile Number',
    type: 'text',
  },
  {
    field: 'aadhaarNo',
    label: 'Aadhaar Number',
    type: 'text',
  },
  {
    field: 'city.name',
    label: 'City',
    type: 'select',
  },
  {
    field: 'patientType.name',
    label: 'Patient Type',
    type: 'select',
  },
  {
    field: 'referralSource.referralSource',
    label: 'Referral Source',
    type: 'select',
  },
  {
    field: 'registeredDate',
    label: 'Registration Date',
    type: 'dateRange',
  },
]
```

### Dynamic Options Function

```javascript
const getUniqueValues = field => {
  if (!allPatients?.data?.data) return []

  switch (field) {
    case 'city.name':
      return [...new Set(allPatients?.data?.data.map(row => row.city?.name))]
        .filter(Boolean)
        .map(value => ({
          value: value,
          label: value,
        }))
    case 'patientType.name':
      return [
        ...new Set(allPatients?.data?.data.map(row => row.patientType?.name)),
      ]
        .filter(Boolean)
        .map(value => ({
          value: value,
          label: value,
        }))
    case 'referralSource.referralSource':
      return [
        ...new Set(
          allPatients?.data?.data.map(
            row => row.referralSource?.referralSource,
          ),
        ),
      ]
        .filter(Boolean)
        .map(value => ({
          value: value,
          label: value,
        }))
    default:
      return []
  }
}
```

### Filter Logic

```javascript
const filterData = (data, filters) => {
  if (!data) return []

  return data.filter(row => {
    return Object.entries(filters).every(([field, filterValue]) => {
      if (!filterValue || filterValue === null) return true

      const { prefix, value } = filterValue
      if (!value || (Array.isArray(value) && value.length === 0)) return true

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
        // ... other cases
      }
    })
  })
}
```

## How to Implement Custom Filters

### Step 1: Import Required Components

```javascript
import FilteredDataGrid from '@/components/FilteredDataGrid'
```

### Step 2: Define Custom Filters

```javascript
const customFilters = [
  {
    field: 'fieldName',
    label: 'Display Label',
    type: 'text|select|number|dateRange',
    // For select filters, options can be provided or loaded dynamically
    options: [], // Optional: static options
  },
]
```

### Step 3: Create Dynamic Options Function

```javascript
const getUniqueValues = field => {
  if (!data) return []

  switch (field) {
    case 'yourField':
      return [...new Set(data.map(row => row.yourField))]
        .filter(Boolean)
        .map(value => ({
          value: value,
          label: value,
        }))
    default:
      return []
  }
}
```

### Step 4: Implement Filter Logic

```javascript
const filterData = (data, filters) => {
  if (!data) return []

  return data.filter(row => {
    return Object.entries(filters).every(([field, filterValue]) => {
      if (!filterValue || filterValue === null) return true

      const { prefix, value } = filterValue
      if (!value || (Array.isArray(value) && value.length === 0)) return true

      const selectedValues = Array.isArray(value) ? value : [value]

      switch (field) {
        case 'yourField': {
          const fieldValue = row.yourField
          if (!fieldValue) return false

          if (prefix === 'LIKE') {
            return fieldValue.toLowerCase().includes(value.toLowerCase())
          } else if (prefix === 'IN') {
            return selectedValues.includes(fieldValue)
          }
          // Add other conditions as needed
          return true
        }
        default:
          return true
      }
    })
  })
}
```

### Step 5: Use FilteredDataGrid

```javascript
<FilteredDataGrid
  rows={data}
  columns={columns}
  customFilters={customFilters}
  filterData={filterData}
  getUniqueValues={getUniqueValues}
  // ... other props
/>
```

## Filter Types

### 1. Text Filters

- **Type**: `'text'`
- **Operations**: LIKE, NOT LIKE
- **Use Case**: Patient names, mobile numbers, Aadhaar numbers

### 2. Select Filters

- **Type**: `'select'`
- **Operations**: IN, NOT IN
- **Use Case**: Cities, patient types, referral sources
- **Features**: Multi-select dropdown with dynamic options

### 3. Number Filters

- **Type**: `'number'`
- **Operations**: LESS_THAN, GREATER_THAN
- **Use Case**: Amounts, quantities, ages

### 4. Date Range Filters

- **Type**: `'dateRange'`
- **Operations**: Date range selection
- **Use Case**: Registration dates, appointment dates

## Best Practices

### 1. Data Structure

- Ensure your data structure matches the field paths used in filters
- Handle nested objects properly (e.g., `city.name`)
- Use optional chaining to prevent errors

### 2. Performance

- Use `useMemo` for expensive computations
- Filter out null/undefined values before creating options
- Consider pagination for large datasets

### 3. User Experience

- Provide clear labels for filters
- Use appropriate filter types for different data
- Include "Clear All" functionality

### 4. Error Handling

- Always check for data existence before processing
- Handle edge cases in filter logic
- Provide fallback values for missing data

## Troubleshooting

### Common Issues

1. **Filters not showing options**

   - Check if `getUniqueValues` is returning the correct format
   - Ensure data is loaded before rendering filters

2. **Filters not working**

   - Verify field paths match your data structure
   - Check filter logic for correct field handling

3. **Performance issues**
   - Optimize `getUniqueValues` function
   - Consider memoizing expensive operations

### Debug Tips

1. **Console logging**

   ```javascript
   console.log('Filter values:', filterValues)
   console.log('Unique values:', getUniqueValues('fieldName'))
   console.log('Filtered data:', filteredData)
   ```

2. **Check data structure**
   ```javascript
   console.log('Sample row:', data[0])
   console.log('Field path:', row.city?.name)
   ```

## Examples

### Complete Implementation Example

See `src/pages/patient/index.js` for a complete working example with:

- Text filters for patient information
- Select filters for categorical data
- Date range filter for registration dates
- Dynamic options loading
- Comprehensive filter logic

### Other Implementations

- **GRN Vendor Payments**: `src/pages/reports/grnvendor/index.js`
- **Orders**: `src/pages/reports/orders/index.js`
- **Prescribed Report**: `src/pages/reports/prescribedReport/index.js`

## Conclusion

The custom filters system provides a powerful and flexible way to filter DataGrid data with dynamic options. By following this guide and the examples provided, you can implement comprehensive filtering capabilities for any table in your application.
