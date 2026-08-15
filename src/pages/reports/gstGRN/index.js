import Breadcrumb from '@/components/Breadcrumb'
import { grnSalesReport } from '@/constants/apis'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { useSelector } from 'react-redux'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import dayjs from 'dayjs'

const columns = [
  {
    field: 'id',
    headerName: 'GRN Id',
    width: 70,
  },
  {
    field: 'supplier',
    headerName: 'Supplier',
    width: 200,
  },
  {
    field: 'grnNo',
    headerName: 'GRN No',
    width: 150,
  },
  {
    field: 'invoiceId',
    headerName: 'Invoice ID',
    width: 150,
  },
  {
    field: 'invoiceDate',
    headerName: 'Invoice Date',
    width: 150,
  },
  {
    field: 'Tax12Gross',
    headerName: 'Tax 12% Gross',
    width: 150,
  },
  {
    field: 'Tax12Amount',
    headerName: 'Tax 12% Amount',
    width: 150,
  },
  {
    field: 'Tax5Gross',
    headerName: 'Tax 5% Gross',
    width: 150,
  },
  {
    field: 'Tax5Amount',
    headerName: 'Tax 5% Amount',
    width: 150,
  },
  {
    field: 'Tax18Gross',
    headerName: 'Tax 18% Gross',
    width: 150,
  },
  {
    field: 'Tax18Amount',
    headerName: 'Tax 18% Amount',
    width: 150,
  },
  {
    field: 'Tax28Gross',
    headerName: 'Tax 28% Gross',
    width: 150,
  },
  {
    field: 'Tax28Amount',
    headerName: 'Tax 28% Amount',
    width: 150,
  },
  {
    field: 'discount',
    headerName: 'Discount',
    width: 150,
  },
  {
    field: 'TotalGRN',
    headerName: 'Total GRN',
    width: 150,
  },
]

function GST_GRN_SALES() {
  const user = useSelector(store => store.user)

  // Define custom filters
  const customFilters = [
    {
      field: 'grnNo',
      label: 'GRN Number',
      type: 'text',
    },
    {
      field: 'supplier',
      label: 'Supplier',
      type: 'text',
    },
    {
      field: 'invoiceId',
      label: 'Invoice ID',
      type: 'text',
    },
    // {
    //   field: 'invoiceDate',
    //   label: 'Invoice Date',
    //   type: 'dateRange',
    // },
    {
      field: 'TotalGRN',
      label: 'Total Amount',
      type: 'number',
    },
  ]

  // Get unique values for dropdowns
  const getUniqueValues = field => {
    if (!GSTData) return []
    const values = new Set(GSTData.map(row => row[field]))
    return Array.from(values).filter(Boolean)
  }

  // Filter data based on applied filters
  const filterData = (data, filters) => {
    if (!data) return []
    return data.filter(row => {
      return Object.entries(filters).every(([field, filter]) => {
        if (!filter || !filter.value) return true

        switch (field) {
          case 'grnNo':
          case 'supplier':
          case 'invoiceId':
            const value = String(row[field])?.toLowerCase()
            if (!value) return false

            if (filter.prefix === 'LIKE') {
              return value.includes(filter.value.toLowerCase())
            }
            return filter.prefix === 'NOT LIKE'
              ? !value.includes(filter.value.toLowerCase())
              : true

          case 'TotalGRN':
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

          case 'invoiceDate':
            if (!filter.start && !filter.end) return true
            const rowDate = dayjs(row[field])
            if (!rowDate.isValid()) return false

            if (
              filter.start &&
              rowDate.isBefore(dayjs(filter.start).startOf('day'))
            ) {
              return false
            }
            if (filter.end && rowDate.isAfter(dayjs(filter.end).endOf('day'))) {
              return false
            }
            return true

          default:
            return true
        }
      })
    })
  }

  const { data: GSTData } = useQuery({
    queryKey: ['getGSTGRNData'],
    enabled: true,
    queryFn: async () => {
      const response = await grnSalesReport(user?.accessToken)

      if (response.status === 200) {
        return response.data
      } else {
        throw new Error(data.message)
      }
    },
  })

  return (
    <div className="flex flex-col m-5 gap-5">
      <div className="">
        <Breadcrumb />
      </div>
      <div className="flex flex-col gap-3 h-90vh">
        <h1 className="text-2xl font-bold text-secondary ">
          GST GRN Sales Report
        </h1>
        <div className="h-[70vh]">
          <FilteredDataGrid
            rows={GSTData || []}
            columns={columns}
            getRowId={row => row.id}
            customFilters={customFilters}
            filterData={filterData}
            getUniqueValues={getUniqueValues}
            disableRowSelectionOnClick
          />
        </div>
      </div>
    </div>
  )
}

export default GST_GRN_SALES
