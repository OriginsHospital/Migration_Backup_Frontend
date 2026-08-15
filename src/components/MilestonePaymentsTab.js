import { DataGrid } from '@mui/x-data-grid'
import CustomToolbar from '@/components/CustomToolbar'
import { useEffect, useState } from 'react'
const MilestonePaymentsTab = ({ data, onApplyFilters, filters, columns }) => {
  // Get unique values for milestone payments dropdowns
  const getMilestoneUniqueValues = field => {
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
      field: 'treatmentType',
      label: 'Treatment Type',
      type: 'select',
      options: getMilestoneUniqueValues('treatmentType').map(value => ({
        value,
        label: value,
      })),
    },
    {
      field: 'visitType',
      label: 'Visit Type',
      type: 'select',
      options: getMilestoneUniqueValues('visitType').map(value => ({
        value,
        label: value,
      })),
    },
    {
      field: 'milestoneType',
      label: 'Milestone Type',
      type: 'select',
      options: getMilestoneUniqueValues('milestoneType').map(value => ({
        value,
        label: value,
      })),
    },
    // {
    //     field: 'amount',
    //     label: 'Amount',
    //     type: 'number'
    // }
  ]
  useEffect(() => {
    console.log(filters)
  }, [filters])
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
        if (
          filters.treatmentType &&
          row.treatmentType !== filters.treatmentType
        ) {
          return false
        }
        if (filters.visitType && row.visitType !== filters.visitType) {
          return false
        }
        if (
          filters.milestoneType &&
          row.milestoneType !== filters.milestoneType
        ) {
          return false
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
      slots={{
        toolbar: CustomToolbar,
      }}
      slotProps={{
        toolbar: {
          customFilters,
          applyFilters: onApplyFilters,
        },
      }}
      getRowId={row => row.patientId + row.visitId + row.milestoneType}
      pageSize={10}
      rowsPerPageOptions={[10]}
      className="h-[calc(100vh-300px)]"
      columnVisibilityModel={{
        patientId: false,
        visitId: false,
      }}
    />
  )
}

export default MilestonePaymentsTab
