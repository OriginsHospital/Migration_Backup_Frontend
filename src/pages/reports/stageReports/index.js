import { getReportsByDate } from '@/constants/apis'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { useSelector, useDispatch } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import { DataGrid } from '@mui/x-data-grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import dayjs from 'dayjs'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import CustomToolbar from '@/components/CustomToolbar'
import { MenuItem, Select, Tabs, Tab, Box } from '@mui/material'
import StagesDurationChart from '@/components/charts/StageDurationChart'
import { useRouter } from 'next/router'

const columns = [
  {
    field: 'patientId',
    headerName: 'Patient ID',
    width: 100,
    renderCell: params => {
      return <span>{params.row.appointmentDetails.patientId}</span>
    },
  },
  {
    field: 'doctorName',
    headerName: 'Doctor',
    width: 150,
    renderCell: params => {
      return <span>{params.row.appointmentDetails.doctorName}</span>
    },
  },
  {
    field: 'patientName',
    headerName: 'Patient',
    width: 250,
    renderCell: params => {
      return <span>{params.row.appointmentDetails.patientName}</span>
    },
  },
  {
    field: 'appointmentReason',
    headerName: 'Appointment Reason',
    width: 150,
    renderCell: params => {
      return <span>{params.row.appointmentDetails.appointmentReason}</span>
    },
  },
  { field: 'type', headerName: 'Appointment Type', width: 150 },
  { field: 'currentStage', headerName: 'Current Status', width: 150 },
  // { field: 'arrivedAt', headerName: 'Arrival Time', width: 150 },
  // { field: 'arrivedStageDuration', headerName: 'Arrival Duration', width: 150 },
  { field: 'scanAt', headerName: 'Scan Time', width: 150 },
  { field: 'scanStageDuration', headerName: 'Scan Duration', width: 150 },
  { field: 'doctorAt', headerName: 'Doctor Visit Time', width: 150 },
  {
    field: 'doctorStageDuration',
    headerName: 'Doctor Visit Duration',
    width: 150,
  },
  { field: 'seenAt', headerName: 'Seen Time', width: 150 },
  { field: 'seenStageDuration', headerName: 'Seen Duration', width: 150 },
  { field: 'doneAt', headerName: 'Completion Time', width: 150 },
]

const Index = () => {
  const router = useRouter()
  const user = useSelector(store => store.user)
  const [fromDate, setFromDate] = useState(
    router.query.fromDate
      ? dayjs(router.query.fromDate)
      : dayjs(new Date()).subtract(7, 'day'),
  )
  const [toDate, setToDate] = useState(
    router.query.toDate ? dayjs(router.query.toDate) : dayjs(new Date()),
  )
  const [branch, setBranch] = useState(
    router.query.branch ? parseInt(router.query.branch) : 1,
  )
  const [activeTab, setActiveTab] = useState(
    router.query.tab ? parseInt(router.query.tab) : 0,
  )
  const dispatch = useDispatch()
  const { branches } = useSelector(store => store.dropdowns)

  const { data: reportsData, isLoading: isReportFetchLoading } = useQuery({
    queryKey: ['fetchReportData', fromDate, toDate, branch],
    enabled: !!fromDate && !!toDate && !!branch,
    queryFn: async () => {
      const responsejson = await getReportsByDate(
        user?.accessToken,
        `${fromDate.$y}-${fromDate.$M + 1}-${fromDate.$D}`,
        `${toDate.$y}-${toDate.$M + 1}-${toDate.$D}`,
        branch,
      )
      // if (responsejson.status == 200) {
      //   let responsedata = responsejson?.data?.stageReportDetails?.map(
      //     eachPatient => {
      //       const patientDetails = eachPatient
      //       // let eachPatientDetails = { ...eachPatient['appointmentDetails'] }
      //       // eachPatientDetails = { ...eachPatientDetails, ...patientDetails }
      //       return patientDetails
      //     },
      //   )
      //   return responsedata
      // } else {
      //   throw new Error(
      //     'Error occurred while fetching medicine details for pharmcy',
      //   )
      // }
      return responsejson?.data
    },
  })
  useEffect(() => {
    if (isReportFetchLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isReportFetchLoading])

  // Update URL when filters change
  const updateURL = (newFromDate, newToDate, newBranch, newTab) => {
    router.push(
      {
        pathname: router.pathname,
        query: {
          fromDate: newFromDate.format('YYYY-MM-DD'),
          toDate: newToDate.format('YYYY-MM-DD'),
          branch: newBranch,
          tab: newTab,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  // Handle filter changes
  const handleFromDateChange = value => {
    setFromDate(value)
    updateURL(value, toDate, branch, activeTab)
  }

  const handleToDateChange = value => {
    setToDate(value)
    updateURL(fromDate, value, branch, activeTab)
  }

  const handleBranchChange = value => {
    setBranch(value)
    updateURL(fromDate, toDate, value, activeTab)
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    updateURL(fromDate, toDate, branch, newValue)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex">
        <div className="flex justify-start p-3">
          <DatePicker
            className="bg-white"
            value={fromDate}
            format="DD/MM/YYYY"
            onChange={handleFromDateChange}
          />
        </div>
        <div className="flex justify-start p-3">
          <DatePicker
            className="bg-white"
            value={toDate}
            format="DD/MM/YYYY"
            onChange={handleToDateChange}
          />
        </div>
        <div className="flex justify-start p-3">
          <Select
            value={branch}
            onChange={e => handleBranchChange(e.target.value)}
          >
            {branches?.map(branch => (
              <MenuItem value={branch.id} key={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </div>
      </div>

      <Box sx={{ width: '100%', height: 'calc(100vh - 200px)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Chart View" />
            <Tab label="Table View" />
          </Tabs>
        </Box>
        <Box sx={{ p: 2, height: 'calc(100% - 20px)' }}>
          {activeTab === 1 && (
            <div className="h-full">
              {reportsData && reportsData?.stageReportDetails?.length != 0 ? (
                <DataGrid
                  getRowId={(row, index) => {
                    return row.appointmentId + row.type
                  }}
                  columns={columns}
                  rows={reportsData?.stageReportDetails || []}
                  slots={{
                    toolbar: CustomToolbar,
                  }}
                  disableRowSelectionOnClick
                />
              ) : (
                <div className="w-full h-full text-center">
                  <span>No data available</span>
                </div>
              )}
            </div>
          )}
          {activeTab === 0 && (
            <div className="h-full">
              {reportsData?.stats ? (
                <StagesDurationChart stats={reportsData.stats} />
              ) : (
                <div className="w-full h-full text-center">
                  <span>No chart data available</span>
                </div>
              )}
            </div>
          )}
        </Box>
      </Box>
    </div>
  )
}

export default withPermission(Index, true, 'stageDurationReport', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
