import UpdateDonarInformation from '@/components/DonorStatusButton'
import { withPermission } from '@/components/withPermission'
import { getPatientTreatmentCycles } from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import { SearchOutlined } from '@mui/icons-material'
import { Button, CircularProgress, TextField } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSelector } from 'react-redux'

function TreatmentCyclesPage() {
  const userDetails = useSelector(store => store.user)
  const [searchValue, setSearchValue] = useState('')
  const [buttonSearchValue, setButtonSearchValue] = useState('')

  const {
    data: treatmentCyclesData,
    isLoading,
    isFetching,
    error,
    isError,
  } = useQuery({
    queryKey: ['getPatientsTreatmentCycles', buttonSearchValue],
    queryFn: () =>
      getPatientTreatmentCycles(userDetails?.accessToken, buttonSearchValue),
    enabled: !!userDetails?.accessToken,
  })

  const columns = [
    {
      field: 'branch',
      headerName: 'Branch',
      flex: 0.3,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'patientId',
      headerName: 'Patient Id',
      flex: 0.7,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'patientName',
      headerName: 'Patient Name',
      flex: 0.7,
      align: 'left',
      headerAlign: 'left',
      renderCell: ({ row }) => {
        return (
          <>
            {row?.patientName.charAt(0).toUpperCase() +
              row?.patientName.slice(1).toLowerCase()}
          </>
        )
      },
    },
    {
      field: 'treatmentName',
      headerName: 'Treatment',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'registrationDate',
      headerName: 'Reg Date',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'day1Date',
      headerName: 'Day1',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'pickUpDate',
      headerName: 'Trigger',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'hysteroscopyDate',
      headerName: 'Hystro',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'day5FreezingDate',
      headerName: 'Day5 Frz',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'fetDate',
      headerName: 'FET',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'eraDate',
      headerName: 'ERA',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'uptPositiveDate',
      headerName: 'UPT',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
  ]

  return (
    <div className="grid grid-cols-5 ">
      <div className="w-full col-span-5 flex flex-col items-center justify-center">
        <div className="px-3 py-4 flex items-center justify-center gap-5">
          <TextField
            placeholder="Search by Name / Aadhaar / Mobile"
            className="w-[350px] md:w-[450px] lg:w-[500px] bg-white"
            type="search"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setButtonSearchValue(searchValue)
              }
            }}
          />
          <Button
            onClick={() => setButtonSearchValue(searchValue)}
            variant="contained"
            sx={{ color: 'white' }}
            startIcon={<SearchOutlined />}
          >
            Search
          </Button>
        </div>

        {isError && <div>{error.message}</div>}
        <div
          style={{
            height: '85vh',
            width: '100%',
            overflowX: 'auto',
            padding: '5px',
          }}
        >
          {isLoading || isFetching ? (
            <div
              className="flex justify-center items-center"
              style={{ height: '100%' }}
            >
              <CircularProgress />
            </div>
          ) : (
            <DataGrid
              rows={treatmentCyclesData?.data || []}
              getRowId={row => row.visitId}
              columns={columns}
              autoHeight
              loading={isLoading}
              slotProps={{
                loadingOverlay: {
                  variant: 'skeleton',
                  noRowsVariant: 'skeleton',
                },
              }}
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'nowrap',
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default withPermission(TreatmentCyclesPage, true, 'donorModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
