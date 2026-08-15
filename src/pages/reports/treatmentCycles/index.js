import {
  getTreatmentCyclesReport,
  treatmentCyclesPaymentsReport,
} from '@/constants/apis'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DataGrid } from '@mui/x-data-grid'
import {
  TextField,
  Box,
  MenuItem,
  Breadcrumbs,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Button,
  Tabs,
  Tab,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Breadcrumb from '@/components/Breadcrumb'
import { Search } from '@mui/icons-material'
import Modal from '@/components/Modal'
import { openModal } from '@/redux/modalSlice'
import PendingAmount from '@/components/PendingAmount'
import CustomToolbar from '@/components/CustomToolbar'
import PatientMilestonesTab from '@/components/PatientMilestonesTab'
import MilestonePaymentsTab from '@/components/MilestonePaymentsTab'
import CircularProgress from '@mui/material/CircularProgress'

function TreatmentCyclesReport() {
  const userDetails = useSelector(store => store.user)
  const [startDate, setStartDate] = useState(
    dayjs()
      .startOf('year')
      .format('YYYY-MM-DD'),
  )
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [branchId, setBranchId] = useState(userDetails.branchDetails[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const [activeTab, setActiveTab] = useState(0)
  const [milestonesFilters, setMilestonesFilters] = useState({})
  const [paymentsFilters, setPaymentsFilters] = useState({})

  const dispatch = useDispatch()
  const {
    data: treatmentCyclesReport,
    refetch: refetchPatientCycles,
    isLoading: isTreatmentCyclesLoading,
  } = useQuery({
    queryKey: ['treatmentCyclesReport', startDate, endDate, branchId],
    queryFn: () =>
      getTreatmentCyclesReport(
        userDetails.accessToken,
        startDate,
        endDate,
        branchId,
        searchQuery,
      ),
    enabled: !!startDate && !!endDate && !!branchId && activeTab === 0,
  })
  const {
    data: patientMilestones,
    refetch: refetchMilestones,
    isLoading: isPatientMilestonesLoading,
  } = useQuery({
    queryKey: ['patientMilestones', startDate, endDate, branchId],
    queryFn: () =>
      treatmentCyclesPaymentsReport(
        userDetails.accessToken,
        startDate,
        endDate,
        branchId,
        searchQuery,
      ),
    enabled: !!startDate && !!endDate && !!branchId && activeTab === 1,
  })

  const patientMilestonesColumns = [
    { field: 'patientName', headerName: 'Patient Name', width: 200 },
    // { field: 'spouseName', headerName: 'Spouse Name', width: 200 },
    // { field: 'visitType', headerName: 'Visit Type', width: 150 },
    { field: 'treatmentType', headerName: 'Treatment Type', width: 250 },
    {
      field: 'isPackageExists',
      headerName: 'Package Exists',
      width: 130,
      renderCell: params => (
        <div
        // className={`${params.row.isPackageExists ? 'text-green-600' : 'text-red-600'} hover:text-green-800`}
        >
          {params.row.isPackageExists ? 'Yes' : 'No'}
        </div>
      ),
    },
    {
      field: 'Action',
      headerName: 'Action',
      width: 130,
      renderCell: params => (
        <div>
          <Button
            onClick={() => {
              // if (params.row.isPackageExists) {
              setSelectedPackage(params.row.pendingAmountDetails)
              setSelectedPatient(params.row)
              dispatch(
                openModal(
                  params.row.patientName +
                    params.row.visitType +
                    params.row.treatmentType,
                ),
              )
              // }
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ]
  const milestonePaymentsColumns = [
    { field: 'patientId', headerName: 'Patient ID', width: 200 },
    { field: 'visitId', headerName: 'Visit ID', width: 200 },
    { field: 'patientName', headerName: 'Patient Name', width: 200 },
    // { field: 'spouseName', headerName: 'Spouse Name', width: 200 },
    { field: 'treatmentType', headerName: 'Treatment Type', width: 200 },
    // { field: 'visitType', headerName: 'Visit Type', width: 200 },
    { field: 'milestoneType', headerName: 'Milestone', width: 200 },
    { field: 'mileStoneStartedDate', headerName: 'Start Date', width: 200 },
    { field: 'totalAmount', headerName: 'Total Amount', width: 150 },
    {
      field: 'paidAmount',
      headerName: 'Paid Amount',
      width: 150,
      renderCell: params =>
        params.row.paidAmount ? (
          <span className="text-green-600">{params.row.paidAmount}</span>
        ) : (
          <span>0</span>
        ),
    },
    {
      field: 'pendingAmount',
      headerName: 'Pending Amount',
      width: 150,
      renderCell: params =>
        params.row.pendingAmount ? (
          <span className="text-red-600">{params.row.pendingAmount}</span>
        ) : (
          <span>0</span>
        ),
    },
  ]

  // Separate handlers for each tab's filters
  const handlePatientMilestonesFilters = newFilters => {
    const cleanedFilters = {
      spouseName: newFilters.spouseName?.trim() || '',
      visitType: newFilters.visitType?.trim() || '',
      treatmentType: newFilters.treatmentType?.trim() || '',
      packageExists: newFilters.packageExists?.trim() || '',
    }
    setMilestonesFilters(cleanedFilters)
  }

  const handlePaymentsFilters = newFilters => {
    const cleanedFilters = {
      spouseName: newFilters.spouseName?.trim() || '',
      treatmentType: newFilters.treatmentType?.trim() || '',
      visitType: newFilters.visitType?.trim() || '',
      milestoneType: newFilters.milestoneType?.trim() || '',
    }
    setPaymentsFilters(cleanedFilters)
  }

  return (
    <div className="p-3">
      <div className="mb-5">
        <Breadcrumb />
      </div>
      <div className="flex gap-2 mb-3">
        <TextField
          label="Search Patient"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (activeTab === 0) {
                refetchPatientCycles()
              } else {
                refetchMilestones()
              }
            }
          }}
        />
        <DatePicker
          label="Start Date"
          value={dayjs(startDate)}
          format="DD-MM-YYYY"
          onChange={newValue =>
            setStartDate(dayjs(newValue).format('YYYY-MM-DD'))
          }
          renderInput={params => <TextField {...params} />}
        />
        <DatePicker
          label="End Date"
          value={dayjs(endDate)}
          format="DD-MM-YYYY"
          onChange={newValue =>
            setEndDate(dayjs(newValue).format('YYYY-MM-DD'))
          }
          renderInput={params => <TextField {...params} />}
        />
        <TextField
          select
          label="Branch"
          value={branchId}
          onChange={e => setBranchId(e.target.value)}
        >
          {userDetails.branchDetails?.map(branch => (
            <MenuItem key={branch.id} value={branch.id}>
              {branch.branchCode}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        className="mb-3"
      >
        <Tab label="Patient Milestones" />
        <Tab label="Milestone Payments" />
      </Tabs>

      {activeTab === 0 ? (
        <>
          {isTreatmentCyclesLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          ) : (
            <PatientMilestonesTab
              data={treatmentCyclesReport?.data}
              columns={patientMilestonesColumns}
              onApplyFilters={handlePatientMilestonesFilters}
              filters={milestonesFilters}
            />
          )}
        </>
      ) : (
        <>
          {isPatientMilestonesLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="200px"
            >
              <CircularProgress />
            </Box>
          ) : (
            <MilestonePaymentsTab
              data={patientMilestones?.data}
              columns={milestonePaymentsColumns}
              onApplyFilters={handlePaymentsFilters}
              filters={paymentsFilters}
            />
          )}
        </>
      )}

      <Modal
        open={openModal}
        maxWidth="sm"
        uniqueKey={
          selectedPatient?.patientName +
          selectedPatient?.visitType +
          selectedPatient?.treatmentType
        }
        onClose={() => dispatch(closeModal())}
      >
        <PendingAmount
          patientDetails={selectedPatient}
          treatmentPendings={selectedPackage}
          allPaymentDetails={selectedPackage}
        />
      </Modal>
    </div>
  )
}

export default TreatmentCyclesReport
