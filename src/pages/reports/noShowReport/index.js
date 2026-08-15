import Breadcrumb from '@/components/Breadcrumb'
import { noShowReport } from '@/constants/apis'
import { toastconfig } from '@/utils/toastconfig'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

function NoShowReport() {
  const userDetails = useSelector(store => store.user)

  const { data: getNoShowReport = [], isError } = useQuery({
    queryKey: ['NO_SHOW_REPORT', userDetails.accessToken],
    queryFn: async () => {
      try {
        const res = await noShowReport(userDetails.accessToken)
        if (res.status === 200) {
          return res.data
        } else {
          toast.error('Something went wrong', toastconfig)
        }
      } catch (error) {
        toast.error('Something went wrong', toastconfig)
        return []
      }
    },
  })

  const noShowColumns = [
    {
      field: 'branch',
      headerName: 'Branch',
      flex: 1,
      minWidth: 120,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'patientId',
      headerName: 'Patient Id',
      flex: 1,
      minWidth: 100,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      flex: 1.5,
      minWidth: 150,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'appointmentDate',
      headerName: 'Appointment Date',
      flex: 1.2,
      minWidth: 150,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <div>{dayjs(params?.row?.appointmentDate).format('DD-MM-YYYY')}</div>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      minWidth: 100,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'appointmentReason',
      headerName: 'Appointment Reason',
      flex: 1.5,
      minWidth: 180,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <>
          {params?.row?.appointmentReason?.charAt(0).toUpperCase() +
            params?.row?.appointmentReason?.slice(1).toLowerCase()}
        </>
      ),
    },
    {
      field: 'noShowReason',
      headerName: 'No Show Reason',
      flex: 1.5,
      minWidth: 180,
      align: 'left',
      headerAlign: 'left',
      renderCell: params => (
        <>
          {params?.row?.noShowReason?.charAt(0).toUpperCase() +
            params?.row?.noShowReason?.slice(1).toLowerCase()}
        </>
      ),
    },
  ]

  return (
    <div className="m-5">
      <div className="mb-5">
        <Breadcrumb />
      </div>
      <div>
        <DataGrid
          rows={getNoShowReport}
          columns={noShowColumns}
          getRowId={row => `${row.appointmentId}-${row.type}`}
          autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 15 } },
          }}
          loading={!getNoShowReport.length && !isError}
        />
      </div>
    </div>
  )
}

export default NoShowReport
