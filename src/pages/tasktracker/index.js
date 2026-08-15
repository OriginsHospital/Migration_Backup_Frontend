import Breadcrumb from '@/components/Breadcrumb'
import CustomToolbar from '@/components/CustomToolbar'
import ViewTaskInformation from '@/components/ViewTaskInformation'
import { getAllTasks } from '@/constants/apis'
import { Button } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React from 'react'
import { useSelector } from 'react-redux'
import CreateTask from '@/components/CreateTask'
import EditTask from '@/components/EditTask'

const TaskTracker = () => {
  const userDetails = useSelector(store => store.user)
  const { data: getAllTasksData } = useQuery({
    queryKey: ['getAllTasks'],
    queryFn: () => getAllTasks(userDetails?.accessToken),
    enabled: !!userDetails?.accessToken,
  })

  const columns = [
    {
      field: 'taskAction',
      headerName: '',
      flex: 0.3,
      renderCell: ({ row }) => {
        return <ViewTaskInformation taskInfo={row} />
      },
    },
    {
      field: 'branchName',
      headerName: 'Branch',
      flex: 0.3,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'departmentName',
      headerName: 'Department',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
      renderCell: ({ row }) => {
        return (
          <>
            {row?.departmentName.charAt(0).toUpperCase() +
              row?.departmentName.slice(1).toLowerCase()}
          </>
        )
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
      renderCell: ({ row }) => {
        return (
          <span
            className={`px-3 py-1 rounded-lg font-semibold text-sm ${
              row?.status === 'pending'
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-green-200 text-green-800'
            }`}
          >
            {row?.status?.charAt(0).toUpperCase() +
              row?.status?.slice(1).toLowerCase()}
          </span>
        )
      },
    },
    {
      field: 'assignedByName',
      headerName: 'Assigned By',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'assignedToName',
      headerName: 'Assigned To',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
    },
    {
      field: 'assignedDate',
      headerName: 'Assigned On',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
      renderCell: ({ row }) => {
        return <>{dayjs(row?.assignedDate).format('DD-MM-YYYY')}</>
      },
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      flex: 0.5,
      align: 'left',
      headerAlign: 'left',
      renderCell: ({ row }) => {
        return <>{dayjs(row?.dueDate).format('DD-MM-YYYY')}</>
      },
    },
    {
      field: 'taskEditAction',
      headerName: '',
      flex: 0.3,
      renderCell: ({ row }) => {
        return <EditTask taskInfo={row} />
      },
    },
  ]

  return (
    <div className="flex flex-col px-4 py-2 h-[90vh] items-start">
      <div className="my-4 flex justify-between items-center w-full">
        <Breadcrumb />
        <CreateTask />
      </div>
      <DataGrid
        rows={getAllTasksData?.data || []}
        getRowId={row => row?.id}
        columns={columns}
        slots={{
          toolbar: CustomToolbar,
        }}
        className="w-full flex-grow"
      />
    </div>
  )
}

export default TaskTracker
