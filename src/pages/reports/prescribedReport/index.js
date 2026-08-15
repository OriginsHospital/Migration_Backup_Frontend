import Timeline from '@mui/lab/Timeline'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent'
import React, { useEffect, useState } from 'react'
import {
  Grid,
  IconButton,
  List,
  ListItem,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableHead,
  Table,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import { DataGrid } from '@mui/x-data-grid'
import Modal from '@/components/Modal'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Close, ExpandMore } from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { getPrescribedPurchaseReport } from '@/constants/apis'
import CustomToolbar from '@/components/CustomToolbar'
import Breadcrumb from '@/components/Breadcrumb'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import FilteredDataGrid from '@/components/FilteredDataGrid'

const Prescribed = () => {
  const [reportInfo, setReportInfo] = useState([])
  const user = useSelector(store => store.user)

  const { data: reportsData, isLoading: isReportFetchLoading } = useQuery({
    queryKey: ['fetchPrescribedPurchaseReportData'],
    enabled: true,
    queryFn: async () => {
      const responsejson = await getPrescribedPurchaseReport(user?.accessToken)
      if (responsejson.status == 200) {
        // setReportInfo(responsejson.data)
        // dispatch(setData(responsejson.data))

        return responsejson
      } else {
        throw new Error(
          'Error occurred while fetching medicine details for pharmcy',
        )
      }
    },
  })

  useEffect(() => {
    // console.log('hello world', reportsData)
    if (reportsData) setReportInfo(restructureData(reportsData))
  }, [reportsData])
  return (
    <div>
      <div className="p-5">
        <Breadcrumb />
      </div>
      <PatientList reportsData={reportInfo} />
    </div>
  )
}

function PatientList({ reportsData: newData }) {
  const [view, setView] = useState('list')
  const [selectedPatient, setSelectedPatient] = useState()
  const reportColumns = [
    {
      field: 'patientDetails.fullName',
      headerName: 'Patient',
      width: 200,
      renderCell: params => (
        <div className="flex items-center gap-3">
          <Avatar
            src={params.row.patientDetails.photopath}
            alt={params.row.patientDetails.fullName}
            sx={{ width: 40, height: 40, backgroundColor: '#00BBDE' }}
          />
          {params.row.patientDetails.fullName}
        </div>
      ),
    },
    {
      field: 'patientDetails.dob',
      headerName: 'DOB',
      width: 150,
      renderCell: params => (
        <Typography className="mt-3">
          {params.row.patientDetails.dob}
        </Typography>
      ),
    },
    {
      field: 'patientDetails.mobileNumber',
      headerName: 'Mobile',
      width: 150,
      renderCell: params => (
        <Typography className="mt-3">
          {params.row.patientDetails.mobileNumber}
        </Typography>
      ),
    },
    {
      field: 'patientDetails.aadhaarNumber',
      headerName: 'Aadhaar',
      width: 200,
      renderCell: params => (
        <Typography className="mt-3">
          {params.row.patientDetails.aadhaarNumber}
        </Typography>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: params => (
        <IconButton
          className="text-sm text-secondary"
          onClick={() => onClickPatient(params.row)}
        >
          View Details
        </IconButton>
      ),
    },
  ]

  // Define custom filters
  const customFilters = [
    {
      field: 'patientDetails.fullName',
      label: 'Patient Name',
      type: 'text',
    },
    {
      field: 'patientDetails.mobileNumber',
      label: 'Mobile Number',
      type: 'text',
    },
    {
      field: 'patientDetails.aadhaarNumber',
      label: 'Aadhaar Number',
      type: 'text',
    },
  ]

  // Get unique values for dropdowns
  const getUniqueValues = field => {
    if (!newData?.data) return []
    const values = new Set(
      newData.data.map(row => {
        const fieldPath = field.split('.')
        let value = row
        for (const path of fieldPath) {
          value = value?.[path]
        }
        return value
      }),
    )
    return Array.from(values).filter(Boolean)
  }

  // Filter data based on applied filters
  const filterData = (data, filters) => {
    if (!data) return []
    return data.filter(row => {
      return Object.entries(filters).every(([field, filter]) => {
        if (!filter || !filter.value) return true

        const fieldPath = field.split('.')
        let value = row
        for (const path of fieldPath) {
          value = value?.[path]
        }
        if (!value) return false

        switch (filter.prefix) {
          case 'LIKE':
            return value.toLowerCase().includes(filter.value.toLowerCase())
          case 'NOT LIKE':
            return !value.toLowerCase().includes(filter.value.toLowerCase())
          default:
            return true
        }
      })
    })
  }

  const handleViewChange = (event, nextView) => {
    if (nextView !== null) {
      setView(nextView)
    }
  }
  const dispatch = useDispatch()
  const renderPatientDetails = patient => {
    const {
      fullName,
      dob,
      mobileNumber,
      aadhaarNumber,
      photopath,
    } = patient.patientDetails

    return (
      <Card
        sx={{ display: 'flex', flexDirection: 'row', padding: 2 }}
        className="cursor-pointer"
        onClick={() => onClickPatient(patient)}
      >
        <Avatar
          src={photopath}
          alt={fullName}
          sx={{
            width: 80,
            height: 80,
            marginRight: 2,
            backgroundColor: '#00BBDE',
          }}
        />
        <CardContent>
          <Typography variant="h6">{fullName}</Typography>
          <Typography variant="body2">DOB: {dob}</Typography>
          <Typography variant="body2">Mobile: {mobileNumber}</Typography>
          <Typography variant="body2">Aadhaar: {aadhaarNumber}</Typography>
        </CardContent>
      </Card>
    )
  }
  const onClickPatient = patient => {
    console.log(patient)
    setSelectedPatient(patient)
    dispatch(openModal('patientTimeline'))
  }
  return (
    <Box sx={{ padding: 4 }}>
      {/* View Toggle Button */}
      <Modal
        uniqueKey={'patientTimeline'}
        // title="Patient Timeline"
        onOutsideClick={() => {
          setSelectedPatient(null)
          dispatch(closeModal('patientTimeline'))
        }}
        maxWidth={'lg'}
      >
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl">Patient Timeline</h2>
          <IconButton onClick={() => dispatch(closeModal('patientTimeline'))}>
            <Close />
          </IconButton>
        </div>
        <AppointmentsTimeline patient={selectedPatient} />
      </Modal>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="view toggle"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
          <ToggleButton value="grid" aria-label="grid view">
            <ViewModuleIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Render List or Grid */}
      {view === 'list' ? (
        <FilteredDataGrid
          rows={newData?.data || []}
          columns={reportColumns}
          getRowId={row => row.patientDetails.mobileNumber}
          customFilters={customFilters}
          filterData={filterData}
          getUniqueValues={getUniqueValues}
          disableRowSelectionOnClick
        />
      ) : (
        <Grid container spacing={2}>
          {newData?.data?.map((patient, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              {renderPatientDetails(patient)}
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

const AppointmentsTimeline = ({ patient }) => {
  const [expandedPanel, setExpandedPanel] = useState(null)

  const handleAccordionChange = panel => (event, isExpanded) => {
    setExpandedPanel(isExpanded ? panel : null)
  }
  return (
    <div>
      <Card sx={{ display: 'flex', flexDirection: 'row', padding: 2 }}>
        <Avatar
          src={patient?.patientDetails?.photopath}
          alt={patient?.patientDetails?.fullName}
          sx={{
            width: 80,
            height: 80,
            marginRight: 2,
            backgroundColor: '#00BBDE',
          }}
        />
        <CardContent>
          <Typography variant="h4">
            {patient?.patientDetails?.fullName}
          </Typography>
          <Typography variant="">{patient?.patientDetails?.dob}</Typography>
          <Typography variant="">
            {' '}
            {`|  ${patient?.patientDetails?.mobileNumber}`}
          </Typography>
          <Typography variant="">
            {' '}
            {`| ${patient?.patientDetails?.aadhaarNumber}`}
          </Typography>
        </CardContent>
      </Card>
      <div>
        <Timeline position="alternate" className="overflow-scroll ">
          {patient?.appointments?.map((eachAppointment, index) => {
            return (
              <TimelineItem key={'timeline-' + index}>
                <TimelineOppositeContent color="text.secondary">
                  {eachAppointment?.appointmentDate}
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot className="bg-success-content" />
                  <TimelineConnector className="bg-success-content" />
                </TimelineSeparator>
                <TimelineContent>
                  <div className="flex flex-col">
                    <Accordion
                      expanded={expandedPanel === `panel${index}`}
                      onChange={handleAccordionChange(`panel${index}`)}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        aria-controls={`panel${index}-content`}
                        id={`panel${index}-header`}
                      >
                        <div className="flex flex-col gap-2">
                          <Chip
                            label={eachAppointment?.type}
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="body2">
                            Doctor: {eachAppointment?.doctorName}
                          </Typography>
                          <Typography variant="body2">
                            Time: {eachAppointment?.timeStart} -{' '}
                            {eachAppointment?.timeEnd}
                          </Typography>
                        </div>
                      </AccordionSummary>
                      <AccordionDetails>
                        <RenderItemDetails
                          items={eachAppointment?.itemPurchaseDetails}
                        />
                      </AccordionDetails>
                    </Accordion>
                  </div>
                </TimelineContent>
              </TimelineItem>
            )
          })}
        </Timeline>
      </div>
    </div>
  )
}
const RenderItemDetails = ({ items }) => (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Item Name</TableCell>
        <TableCell align="right">Prescribed Quantity</TableCell>
        <TableCell align="right">Purchased Quantity</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items?.map((item, index) => (
        <TableRow key={index}>
          <TableCell component="th" scope="row">
            {item.itemName}
          </TableCell>
          <TableCell align="right">{item.prescribedQuantity}</TableCell>
          <TableCell align="right">{item.purchaseQuantity || 'N/A'}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

function restructureData(response) {
  const result = {
    status: response?.status,
    message: response?.message,
    data: [],
  }

  // Create a map to group patients by patientId
  const patientMap = new Map()

  response?.data?.forEach(appointment => {
    const patientId = appointment.patientDetails.patientId

    if (!patientMap.has(patientId)) {
      // If patient doesn't exist in map, add them with an empty appointments array
      patientMap.set(patientId, {
        patientDetails: appointment.patientDetails,
        appointments: [],
      })
    }

    // Add appointment to the patient's appointments array
    patientMap.get(patientId).appointments.push({
      appointmentDate: appointment.appointmentDate,
      timeStart: appointment.timeStart,
      timeEnd: appointment.timeEnd,
      doctorName: appointment.doctorName,
      type: appointment.type,
      itemPurchaseDetails: appointment.itemPurchaseDetails,
    })
  })

  // Convert the map to an array
  result.data = Array.from(patientMap.values())

  return result
}

export default withPermission(Prescribed, true, 'prescribedReport', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
