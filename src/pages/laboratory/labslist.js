import {
  downloadLabReport,
  downloadPDF,
  getAllLabTests,
} from '@/constants/apis'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import {
  Autocomplete,
  TextField,
  IconButton,
  Button,
  Chip,
  Typography,
  Tooltip,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { Avatar } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import Modal from '@/components/Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { Close, Download } from '@mui/icons-material'
import {
  saveLabTestResult,
  getSavedLabTestResult,
  getLabTestsTemplate,
} from '@/constants/apis'
import dynamic from 'next/dynamic'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

const ViewReportModal = ({ testData, reportData }) => {
  const dispatch = useDispatch()
  const editor = useRef(null)
  const user = useSelector((store) => store.user)
  const [content, setContent] = useState(reportData?.labTestResult || '')
  const queryClient = useQueryClient()

  const { mutate: saveMutation } = useMutation({
    mutationFn: async (payload) => {
      const response = await saveLabTestResult(user.accessToken, payload)
      if (response.status === 200) {
        toast.success('Report saved successfully', toastconfig)
        queryClient.invalidateQueries(['getAllLabTests'])
        dispatch(
          closeModal(
            'view-report-modal' +
              '-' +
              payload.appointmentId +
              '-' +
              payload.labTestId +
              '-' +
              payload.type,
          ),
        )
      } else {
        throw new Error(response.message || 'Failed to save report')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save report', toastconfig)
    },
  })

  return (
    <Modal
      uniqueKey={
        'view-report-modal' +
        '-' +
        testData.appointmentId +
        '-' +
        testData.labTestId +
        '-' +
        testData.type
      }
      maxWidth="lg"
    >
      <div className="flex justify-between mb-4">
        <Typography variant="h6">Lab Test Report</Typography>
        <IconButton
          onClick={() =>
            dispatch(
              closeModal(
                'view-report-modal' +
                  '-' +
                  testData.appointmentId +
                  '-' +
                  testData.labTestId +
                  '-' +
                  testData.type,
              ),
            )
          }
        >
          <Close />
        </IconButton>
      </div>

      <div className="min-h-[400px] mb-4">
        <JoditEditor
          ref={editor}
          value={content}
          onChange={(newContent) => setContent(newContent)}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="contained"
          onClick={() =>
            saveMutation({
              appointmentId: testData.appointmentId,
              labTestId: testData.labTestId,
              type: testData.type,
              labTestStatus: 2,
              labTestResult: content,
              isSpouse: testData.isSpouse,
            })
          }
        >
          Save Report
        </Button>
      </div>
    </Modal>
  )
}

function LabsList() {
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails
  const [branchId, setBranchId] = useState(branches[0]?.id || null)
  const [fromDate, setFromDate] = useState(dayjs(new Date()).subtract(7, 'day'))
  const [toDate, setToDate] = useState(dayjs(new Date()))
  //   const [searchText, setSearchText] = useState('')
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [selectedTest, setSelectedTest] = useState(null)

  const handleActionClick = (status, row) => {
    // console.log('status', status)
    console.log('row', row.appointmentId, row.labTestId, row.type, row)
    switch (status) {
      case 'RED':
        if (confirm('Are you sure you want to collect the sample?')) {
          collectMutation({
            appointmentId: row.appointmentId,
            labTestId: row.labTestId,
            type: row.type,
            labTestStatus: 1,
            labTestResult: '',
            isSpouse: row?.isSpouse,
          })
        }
        break
      case 'ORANGE':
      case 'GREEN':
        setSelectedTest(row)
        dispatch(
          openModal(
            'view-report-modal' +
              '-' +
              row.appointmentId +
              '-' +
              row.labTestId +
              '-' +
              row.type,
          ),
        )
        break
      default:
        break
    }
  }

  const { mutate: downloadLabReportMutation } = useMutation({
    mutationFn: async (payload) => {
      const response = await downloadLabReport(
        user.accessToken,
        payload.appointmentId,
        payload.labTestId,
        payload.type,
      )
      if (response.status === 200) {
        downloadPDF(response)
        toast.success('Lab report downloaded successfully', toastconfig)
      } else if (response.status === 400) {
        toast.error(response.data?.message || 'Data not found', toastconfig)
      } else {
        toast.error(
          response.data?.message || 'Error downloading lab report',
          toastconfig,
        )
      }

      return response
    },
  })

  const handleDownloadClick = (row) => {
    downloadLabReportMutation(row)
  }

  const columns = [
    {
      field: 'appointmentDate',
      headerName: 'Appointment',
      width: 130,
      renderCell: (params) => (
        <span>{dayjs(params.row.appointmentDate).format('DD-MM-YYYY')}</span>
      ),
    },
    {
      field: 'patientName',
      headerName: 'Patient',
      width: 200,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Avatar
            src={params.row.patientPhoto}
            alt={params.row.patientName}
            sx={{ width: 40, height: 40, backgroundColor: '#00BBDE' }}
          />
          <span>{params.row.patientName}</span>
        </div>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: (params) => (
        <span className="capitalize">
          {params.row.type === 'TREATMENT' ? 'Treatment' : 'Consultation'}
        </span>
      ),
    },
    {
      field: 'isSpouse',
      headerName: 'Is Spouse',
      width: 100,
      renderCell: (params) => (
        <span>{params.row.isSpouse === 1 ? 'Yes' : 'No'}</span>
      ),
    },
    {
      field: 'labTestName',
      headerName: 'Test Name',
      width: 200,
      renderCell: (params) => (
        <span className="capitalize">{params.row.labTestName || 'N/A'}</span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          className="capitalize"
          onClick={() => handleActionClick(params.row.status, params.row)}
          color={
            params.row.status === 'RED'
              ? 'error'
              : params.row.status === 'ORANGE'
                ? 'warning'
                : 'success'
          }
        >
          {params.row.status === 'RED'
            ? 'Collect'
            : params.row.status === 'ORANGE'
              ? 'Update Result'
              : 'View Report'}
        </Button>
      ),
    },
    {
      field: 'download',
      headerName: 'Download',
      width: 80,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          className="capitalize"
          onClick={() => handleDownloadClick(params.row)}
          color="error"
          disabled={params.row.status !== 'GREEN'}
        >
          <Download />
        </Button>
      ),
    },
  ]

  const { data: apiData, isLoading } = useQuery({
    queryKey: ['getAllLabTests', fromDate, toDate, branchId],
    queryFn: async () => {
      const response = await getAllLabTests(
        user.accessToken,
        `${fromDate.$y}-${fromDate.$M + 1}-${fromDate.$D}`,
        `${toDate.$y}-${toDate.$M + 1}-${toDate.$D}`,
        branchId,
      )
      if (response.status === 200) {
        return response.data
      }
      throw new Error('Error fetching lab tests')
    },
  })

  const { data: reportData } = useQuery({
    queryKey: ['labTestReport', selectedTest],
    enabled: !!selectedTest,
    queryFn: async () => {
      const response = await getSavedLabTestResult(
        user.accessToken,
        selectedTest.type,
        selectedTest.appointmentId,
        selectedTest.labTestId,
        selectedTest.isSpouse,
      )
      if (response.status === 200) {
        return response.data
      }
      throw new Error('Error fetching lab test report')
    },
  })

  const { mutate: collectMutation } = useMutation({
    mutationKey: ['collectMutation'],
    mutationFn: async (payload) => {
      console.log('payload', payload)
      const response = await saveLabTestResult(user.accessToken, payload)
      if (response.status === 200) {
        toast.success('Sample collected successfully', toastconfig)
        queryClient.invalidateQueries(['getAllLabTests'])
      } else {
        throw new Error(response.message || 'Failed to collect sample')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to collect sample', toastconfig)
    },
  })

  useEffect(() => {
    if (isLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isLoading])

  return (
    <div className="p-4">
      <div className="flex gap-4 items-center justify-between mb-4">
        <div className="flex gap-4 items-center">
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={setFromDate}
            format="DD/MM/YYYY"
            className="bg-white"
          />
          <DatePicker
            label="To Date"
            value={toDate}
            onChange={setToDate}
            format="DD/MM/YYYY"
            className="bg-white"
          />
          <Autocomplete
            className="w-48"
            options={branches || []}
            getOptionLabel={(option) => option?.branchCode || option?.name}
            value={branches?.find((branch) => branch.id === branchId) || null}
            onChange={(_, value) => setBranchId(value?.id || null)}
            renderInput={(params) => <TextField {...params} label="Branch" />}
            clearIcon={null}
          />
        </div>
        {/* <div className="flex gap-2">
          <TextField
            placeholder="Search by patient name"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-80"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                queryClient.invalidateQueries(['getAllLabTests'])
              }
            }}
          />
          <IconButton
            color="primary"
            onClick={() => queryClient.invalidateQueries(['getAllLabTests'])}
          >
            <SearchIcon />
          </IconButton>
        </div> */}
      </div>

      <div
        style={{ height: '75vh', width: '100%' }}
        className="bg-white rounded shadow"
      >
        <DataGrid
          rows={apiData || []}
          columns={columns}
          getRowId={(row) =>
            `${row.type}-${row.appointmentId}-${row.labTestId}-${row.isSpouse}`
          }
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              pageSize: 25,
            },
          }}
        />
      </div>

      {reportData && (
        <ViewReportModal testData={selectedTest} reportData={reportData} />
      )}
    </div>
  )
}

export default withPermission(LabsList, true, 'Lab', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
