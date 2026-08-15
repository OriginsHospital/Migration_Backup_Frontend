import { getFormFReportByDateRange, getReportsByDate } from '@/constants/apis'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useSelector, useDispatch } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import { DataGrid } from '@mui/x-data-grid'
import dayjs from 'dayjs'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import Breadcrumb from '@/components/Breadcrumb'
import Link from 'next/link'
import { Button } from '@mui/material'
import { useRouter } from 'next/router'
const Index = () => {
  const userDetails = useSelector((store) => store.user)
  const router = useRouter()
  const [fromDate, setFromDate] = useState(new Date())
  const [toDate, setToDate] = useState(new Date())

  const { data: formFReportData } = useQuery({
    queryKey: [
      'getFormFReportByDateRange',
      userDetails.accessToken,
      fromDate,
      toDate,
    ],
    queryFn: async () => {
      const response = await getFormFReportByDateRange(
        userDetails?.accessToken,
        dayjs(fromDate).format('YYYY-MM-DD'),
        dayjs(toDate).format('YYYY-MM-DD'),
      )
      console.log(response.data)
      return response.data
    },
    enabled: userDetails.accessToken ? true : false,
  })

  const columns = [
    {
      field: 'action',
      headerName: 'Action',
      width: 100,
      renderCell: ({ row }) => {
        console.log('row aadh:', row.aadhaarNo)
        return (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              router.push(
                {
                  pathname: '/patient/register',
                  query: { search: row.patientId },
                },
                undefined,
                { shallow: true },
              )
            }}
          >
            View
          </Button>
        )
      },
    },
    { field: 'patientId', headerName: 'Patient ID', width: 150 },
    { field: 'patientName', headerName: 'Patient Name', width: 150 },
    { field: 'appointmentDate', headerName: 'Appointment Date', width: 150 },
    { field: 'doctorName', headerName: 'Doctor Name', width: 150 },
    {
      field: 'formFDetails',
      headerName: 'Form F Details',
      width: 400,
      renderCell: (params) => {
        const links = params.row?.formFDetails
          .filter((formF) => formF?.uploadLink)
          .map(
            (formF) =>
              `<a href="${formF?.uploadLink}" target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">View Form (${formF?.scanName})</a>`,
          )
        return <div dangerouslySetInnerHTML={{ __html: links.join(', ') }} />
      },
    },
  ]

  const transformDataToRows = (data) => {
    return data.map((item) => ({
      id: item?.appointmentId,
      patientId: item?.patientDetails?.patientId,
      patientName: item?.patientDetails?.patientName,
      patientAadhaarNo: item?.patientDetails?.patientAadhaarNo,
      appointmentDate: dayjs(item?.appointmentInfo?.appointmentDate).format(
        'DD-MM-YYYY',
      ),
      doctorName: item?.appointmentInfo?.doctorName,
      formFDetails: item?.formFDetails,
    }))
  }

  const rows = transformDataToRows(formFReportData || [])

  return (
    <div className="flex flex-col px-5 w-full mx-auto">
      <span className="m-5">
        <Breadcrumb />
      </span>
      <div className="flex gap-5 p-5 ">
        <DatePicker
          label="From Date"
          className="bg-white rounded-lg"
          value={fromDate ? dayjs(fromDate) : null}
          name="fromDate"
          format="DD/MM/YYYY"
          onChange={(newValue) => setFromDate(newValue)}
        />
        <DatePicker
          label="To Date"
          format="DD/MM/YYYY"
          className="bg-white rounded-lg"
          value={toDate ? dayjs(toDate) : null}
          name="fromDate"
          onChange={(newValue) => setToDate(newValue)}
        />
      </div>
      <div className="h-[600px] gap-5 p-5 w-full">
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
          className="bg-white shadow-md"
        />
      </div>
    </div>
  )
}

export default withPermission(Index, true, 'formFReport', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
