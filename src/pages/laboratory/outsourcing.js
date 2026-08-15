import React, { useState, useEffect, useMemo } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import {
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Input,
  Autocomplete,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteOutsourcingLabTestResult,
  getAllOutsourcingLabTests,
  getSavedLabTestResult,
  saveOutsourcingLabTestResult,
} from '@/constants/apis'
import Avatar from '@mui/material/Avatar'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import Modal from '@/components/Modal'
import { useDispatch } from 'react-redux'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Close, Delete } from '@mui/icons-material'
import dayjs from 'dayjs'

const UploadModal = ({ testData, user }) => {
  const [file, setFile] = useState(null)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  const { mutate: uploadMutation, isPending } = useMutation({
    mutationFn: async (formData) => {
      const response = await saveOutsourcingLabTestResult(
        user.accessToken,
        formData,
      )

      if (response.status === 200) {
        toast.success('Report uploaded successfully', toastconfig)
        dispatch(closeModal('upload-modal'))
        queryClient.invalidateQueries(['outsourcingLabTests'])
      } else {
        throw new Error(response.message || 'Upload failed')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload report', toastconfig)
    },
  })

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      // Validate file type if needed
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please upload PDF or image files only', toastconfig)
        return
      }
      // Validate file size (e.g., 5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB', toastconfig)
        return
      }
      setFile(selectedFile)
    }
  }

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file to upload', toastconfig)
      return
    }

    const formData = new FormData()
    formData.append('labTestResultFile', file)
    formData.append('appointmentId', testData.appointmentId)
    formData.append('labTestId', testData.labTestId)
    formData.append('type', testData.type)
    formData.append('labTestStatus', 2)
    formData.append('isSpouse', testData.isSpouse)
    uploadMutation(formData)
  }

  return (
    <Modal uniqueKey={'upload-modal'}>
      <div className="flex justify-between">
        <Typography variant="h6" className="text-gray-800 mb-2">
          Upload Lab Report
        </Typography>
        <IconButton onClick={() => dispatch(closeModal('upload-modal'))}>
          <Close />
        </IconButton>
      </div>
      <div className="flex flex-col gap-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="file-upload"
            name="labTestResultFile"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="body1" mt={1}>
              {file ? file.name : 'Click to upload or drag and drop'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              PDF, JPG or PNG (max. 5MB)
            </Typography>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          {/* <Button
            variant="outlined"
            onClick={() => dispatch(closeModal('upload-modal'))}
            disabled={isPending}
          >
            Cancel
          </Button> */}
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || isPending}
          >
            {isPending ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

const ViewReportModal = ({ testData, reportData }) => {
  const dispatch = useDispatch()
  const user = useSelector((store) => store.user)
  const queryClient = useQueryClient()

  const handleDeleteOutsourcingLabTestResult = async () => {
    if (confirm('Are you sure you want to delete the report?')) {
      const rs = await deleteOutsourcingLabTestResult(
        user.accessToken,
        reportData?.id,
      )
      if (rs.status === 200) {
        toast.success('Delete Successfully', toastconfig)
        queryClient.invalidateQueries('outsourcingLabTests')
      } else if (rs.status === 400) {
        toast.error(rs.message, toastconfig)
      } else {
        toast.error('Something went wrong', toastconfig)
      }
      dispatch(closeModal('view-report-modal'))
    }
  }

  return (
    <Modal
      uniqueKey={'view-report-modal' + testData.appointmentId}
      closeOnClickOutside={true}
      onClose={() => dispatch(closeModal('view-report-modal'))}
      maxWidth="lg"
    >
      <div className="flex justify-between">
        <Typography variant="h6" className="text-gray-800 mb-2">
          View Lab Report
        </Typography>
        <div>
          <IconButton
            onClick={() => handleDeleteOutsourcingLabTestResult()}
            title="Delete this report"
          >
            <Delete color="error" />
          </IconButton>
          <IconButton onClick={() => dispatch(closeModal('view-report-modal'))}>
            <Close />
          </IconButton>
        </div>
      </div>
      <iframe src={reportData?.labTestResult} width="100%" height="500px" />
      {/* <div className="flex flex-col gap-4">
                {reportData}
            </div> */}
    </Modal>
  )
}

const ALL_BRANCHES_OPTION = {
  id: null,
  name: 'All Branches',
  branchCode: 'ALL',
}

const Outsourcing = () => {
  const [searchText, setSearchText] = useState('')
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails
  const branchOptions = useMemo(
    () => [ALL_BRANCHES_OPTION, ...(branches || [])],
    [branches],
  )
  const [branchId, setBranchId] = useState(null)
  const queryClient = useQueryClient()
  const [selectedTest, setSelectedTest] = useState(null)
  const dispatch = useDispatch()

  const { data: labTests, isLoading } = useQuery({
    queryKey: ['outsourcingLabTests', searchText, branchId],
    queryFn: async () => {
      const response = await getAllOutsourcingLabTests(
        user.accessToken,
        searchText,
        branchId,
      )
      if (response.status === 200) {
        return response.data
      }
      throw new Error('Error fetching outsourcing lab tests')
    },
  })

  const { data: reportData, isLoading: isReportLoading } = useQuery({
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
        // const { labTestResult } = response.data
        return response.data
      }
      throw new Error('Error while fetching saved lab result')
    },
  })

  const handleActionClick = (status, row) => {
    switch (status) {
      case 'RED':
        // Handle collect action
        // toast.info(
        //   'Collect sample functionality to be implemented',
        //   toastconfig,
        // )
        if (confirm('Are you sure you want to collect the sample?')) {
          const formData = new FormData()
          formData.append('appointmentId', row.appointmentId)
          formData.append('labTestId', row.labTestId)
          formData.append('type', row.type)
          formData.append('labTestStatus', 1)
          formData.append('isSpouse', row.isSpouse)
          outsourcingMutate(formData)
        }

        break
      case 'ORANGE':
        // Open upload modal
        setSelectedTest(row)
        dispatch(openModal('upload-modal'))
        break
      case 'GREEN':
        // Handle view report action
        setSelectedTest(row)
        dispatch(openModal('view-report-modal' + row.appointmentId))
        break
      default:
        break
    }
  }

  const { mutate: outsourcingMutate, isPending: isPendingOutsourcing } =
    useMutation({
      mutationFn: async (payload) => {
        const res = await saveOutsourcingLabTestResult(
          user.accessToken,
          payload,
        )
        if (res.status === 200) {
          if (payload?.labTestStatus == 1) {
            toast.success('Collected Successfully', toastconfig)
          } else {
            toast.success('Saved Successfully', toastconfig)
          }
          queryClient.invalidateQueries(['outsourcingLabTests'])
        }
      },
    })
  const getCaptialized = (text) => {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const gridRows = useMemo(
    () =>
      (labTests || []).map((row, index) => ({
        ...row,
        id:
          row.lineBillId != null
            ? `${row.type}-${row.lineBillId}`
            : `${row.type}-${row.appointmentId}-${row.labTestId}-${row.isSpouse}-${index}`,
      })),
    [labTests],
  )

  const columns = useMemo(
    () => [
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
        valueGetter: (value, row) => row?.patientName ?? '',
        renderCell: ({ id, value, row }) => (
          <div className="flex items-center gap-2">
            <Avatar
              src={row?.patientPhoto || undefined}
              alt={value || ''}
              sx={{ width: 40, height: 40 }}
            >
              {(value || '?').charAt(0)}
            </Avatar>
            <span>{value}</span>
          </div>
        ),
      },
      {
        field: 'branchCode',
        headerName: 'Branch',
        width: 100,
        renderCell: (params) => (
          <span>
            {params.row.branchCode ||
              branches?.find((b) => b.id === params.row.branchId)?.branchCode ||
              branches?.find((b) => b.id === params.row.branchId)?.name ||
              '-'}
          </span>
        ),
      },
      // { field: 'appointmentId', headerName: 'Appointment ID', width: 130 },
      {
        field: 'type',
        headerName: 'Type',
        width: 130,
        renderCell: (params) => (
          <span className="capitalize">
            {params.row.type == 'TREATMENT' ? 'Treatment' : 'Consultation'}
          </span>
        ),
      },
      {
        field: 'isSpouse',
        headerName: 'Is Spouse',
        width: 100,
        renderCell: (params) => (
          <span>{params.row.isSpouse == 1 ? 'Yes' : 'No'}</span>
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
      // { field: 'serviceGroup', headerName: 'Sample Group', width: 150 },
      // { field: 'labTestType', headerName: 'Test Type', width: 130 },

      {
        field: 'actions',
        headerName: 'Actions',
        width: 150,
        sortable: false,
        filterable: false,
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
                ? 'Upload Report'
                : 'View Report'}
          </Button>
        ),
      },
    ],
    [branches],
  )

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2 justify-end items-center">
        <Autocomplete
          className="w-48"
          size="small"
          options={branchOptions}
          getOptionLabel={(option) =>
            option?.id == null
              ? 'All Branches'
              : option?.branchCode || option?.name
          }
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          value={
            branchId == null
              ? ALL_BRANCHES_OPTION
              : branches?.find((branch) => branch.id === branchId) || null
          }
          onChange={(_, value) => setBranchId(value?.id ?? null)}
          renderInput={(params) => <TextField {...params} label="Branch" />}
          clearIcon={null}
        />
        <TextField
          placeholder="Search by patient name"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-80"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              queryClient.invalidateQueries({
                queryKey: ['outsourcingLabTests'],
              })
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['outsourcingLabTests'] })
          }
        >
          <SearchIcon />
        </IconButton>
      </div>

      <div style={{ height: '75vh', width: '100%' }}>
        <DataGrid
          rows={gridRows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          disableRowSelectionOnClick
          disableVirtualization
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 100, page: 0 },
            },
          }}
        />
      </div>

      <UploadModal testData={selectedTest} user={user} />

      {reportData && (
        <ViewReportModal testData={selectedTest} reportData={reportData} />
      )}
    </div>
  )
}

export default Outsourcing
