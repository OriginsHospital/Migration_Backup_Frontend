import CustomToolbar from '@/components/CustomToolbar'
import UpdateDonarInformation from '@/components/DonorStatusButton'
import { withPermission } from '@/components/withPermission'
import { getDonarInformation } from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'

function DonarPage() {
  const userDetails = useSelector(store => store.user)
  const { data: getDonarData } = useQuery({
    queryKey: ['getDonarInformation'],
    queryFn: () => getDonarInformation(userDetails?.accessToken),
    enabled: !!userDetails?.accessToken,
  })

  const columns = [
    {
      field: 'registrationDate',
      headerName: 'Reg Date',
      flex: 0.5,
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
            {row.patientName.charAt(0).toUpperCase() +
              row.patientName.slice(1).toLowerCase()}
          </>
        )
      },
    },
    {
      field: 'treatmentType',
      headerName: 'Treatment',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'donarName',
      headerName: 'Donor',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
      renderCell: ({ row }) => {
        if (row?.donarName)
          return (
            <>
              {row?.donarName?.charAt(0).toUpperCase() +
                row?.donarName?.slice(1).toLowerCase()}
            </>
          )
        else return <> - </>
      },
    },

    {
      field: 'donarAction',
      headerName: 'Action',
      flex: 1,
      renderCell: ({ row }) => {
        const patientInfo = {
          patientId: row.patientId,
          patientName: row.patientName,
          registrationDate: row.registrationDate,
          treatmentType: row.treatmentType,
          treatmentTypeId: row.treatmentTypeId,
          visitId: row.visitId,
          donarName: row?.donarName,
          donorStatus: row?.donorStatus,
        }
        return <UpdateDonarInformation patientInfo={patientInfo} />
      },
    },
  ]

  return (
    <div className="grid p-5 h-[90vh] ">
      <DataGrid
        rows={getDonarData?.data || []}
        getRowId={row => row.visitId}
        columns={columns}
        // add filters
        slots={{
          toolbar: CustomToolbar,
        }}
      />
    </div>
  )
}

export default withPermission(DonarPage, true, 'donorModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
