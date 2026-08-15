import { DataGrid } from '@mui/x-data-grid'
import CustomToolbar from '@/components/CustomToolbar'
import { Button } from '@mui/material'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { openModal } from '@/redux/modalSlice'
const PatientMilestonesTab = ({ data, columns, onApplyFilters, filters }) => {
  // Get unique values for dropdowns
  const getUniqueValues = field => {
    if (!data) return []
    const values = new Set(data.map(row => row[field]))
    return Array.from(values)
      .filter(Boolean)
      .sort()
  }

  const customFilters = [
    {
      field: 'spouseName',
      label: 'Spouse Name',
      type: 'text',
    },
    {
      field: 'visitType',
      label: 'Visit Type',
      type: 'select',
      options: getUniqueValues('visitType').map(value => ({
        value,
        label: value,
      })),
    },
    {
      field: 'treatmentType',
      label: 'Treatment Type',
      type: 'select',
      options: getUniqueValues('treatmentType').map(value => ({
        value,
        label: value,
      })),
    },
    {
      field: 'packageExists',
      label: 'Package Status',
      type: 'select',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
  ]

  const getFilteredData = rawData => {
    if (!rawData) return []
    return rawData.filter(row => {
      try {
        // Check if any filters are applied
        if (Object.values(filters).every(value => !value)) {
          return true
        }

        if (
          filters.spouseName &&
          !row.spouseName
            ?.toLowerCase()
            .includes(filters.spouseName.toLowerCase())
        ) {
          return false
        }
        if (filters.visitType && row.visitType !== filters.visitType) {
          return false
        }
        if (
          filters.treatmentType &&
          row.treatmentType !== filters.treatmentType
        ) {
          return false
        }
        if (filters.packageExists) {
          const hasPackage = row.isPackageExists ? 'yes' : 'no'
          if (hasPackage !== filters.packageExists.toLowerCase()) {
            return false
          }
        }
        return true
      } catch (error) {
        console.error('Error filtering row:', error)
        return false
      }
    })
  }

  return (
    <DataGrid
      rows={getFilteredData(data) || []}
      columns={columns}
      getRowId={row => row.patientName + row.visitId + row.treatmentType}
      pageSize={10}
      rowsPerPageOptions={[10]}
      className="h-[calc(100vh-300px)]"
      slots={{
        toolbar: CustomToolbar,
      }}
      slotProps={{
        toolbar: {
          customFilters,
          applyFilters: onApplyFilters,
        },
      }}
    />
  )
}

export default PatientMilestonesTab
