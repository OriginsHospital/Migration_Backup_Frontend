import {
  getPrescribedPurchaseReport,
  getStockExpiryReport,
} from '@/constants/apis'

import { setData, clearData } from '@/redux/searchSlice'
import { useQuery } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material'
import Paper from '@mui/material/Paper'
import Search from '@/components/Search'
import Breadcrumb from '@/components/Breadcrumb'
const RenderAccordianDetails = (props, itemDetails) => {
  const appointmentDetails = props.userDetails
  return (
    <div className=" flex flex-col gap-3">
      <div className="flex justify-center items-center border h-8 bg-gray-300">
        <span className="font-bold">{'Appointment Details'}</span>
      </div>
      <div className="flex justify-between">
        <div className=" pl-1">
          <h className="font-medium">{'Type'}</h>
          <p className="pt-4">{appointmentDetails.type}</p>
        </div>
        <div className=" pl-1">
          <h className="font-medium">{'Doctor Name'}</h>
          <p
            title={appointmentDetails.doctorName}
            className="text-nowrap text-ellipsis overflow-hidden pt-4"
          >
            {appointmentDetails.doctorName}
          </p>
        </div>
        <div className="  pl-1">
          <h className="font-medium">{'Appnt. Date'}</h>
          <p className="pt-4">{appointmentDetails.appointmentDate}</p>
        </div>
        <div className="   pl-1">
          <h className="font-medium">{'Time Start'}</h>
          <p className="pt-4">{appointmentDetails.timeStart}</p>
        </div>
        {/* <div className=" pl-1">
          <h className="font-medium">{'Time End'}</h>
          <p className="pt-4">{appointmentDetails.timeEnd}</p>
        </div> */}
      </div>
      <div className="flex justify-center items-center border h-8 bg-gray-300">
        <span className="font-bold">{'Item Details'}</span>
      </div>
      <div className="flex flex-col">
        {itemDetails && itemDetails.length !== 0 ? (
          <TableContainer component={Paper}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>{'Item Name'}</TableCell>
                  <TableCell align="right">{'Purchase Quantity'}</TableCell>
                  <TableCell align="right">{'Prescribed Quantity'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemDetails.map((itemInfo, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {itemInfo?.itemName}
                    </TableCell>
                    <TableCell align="right">
                      {itemInfo?.purchaseQuantity}
                    </TableCell>
                    <TableCell align="right">
                      {itemInfo?.prescribedQuantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <div className="w-full h-full text-center content-center">
            <span>No Item details available</span>
          </div>
        )}
      </div>
    </div>
  )
}
const PatientInfo = props => {
  const patientDetails = props.userDetails.patientDetails
  const expandedId = props.selectedId
  const itemDetails = props.userDetails.itemPurchaseDetails
  const userDetails = props.userDetails
  const expandID = (type, patientInfo, itemDetails) => {
    let uniqueKey = patientInfo?.aadhaarNumber
    if (itemDetails?.length != 0) {
      itemDetails?.forEach(itemInfo => {
        uniqueKey += itemInfo.itemName
      })
    }
    if (type == 'set') {
      props.setExpandId(uniqueKey)
    } else {
      return uniqueKey
    }
  }
  return (
    <>
      {/* <div className=" w-80 h-fit border border-black rounded flex flex-col pt-2">
        <div className="flex flex-col w-full justify-center items-center gap-3">
          <Avatar
            alt="Remy Sharp"
            src={
              'https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?semt=ais_hybrid'
            }
            sx={{ width: 70, height: 70 }}
          />
          <span className=" font-semibold">{'Ashfaq md'}</span>
        </div>
        <div className="flex flex-col justify-center gap-2 pt-3">
          <div className=" flex pl-1">
            <span className="flex-1">{'Date of Birth'}</span>
            <span className="flex-1">{': 2002-01-30'}</span>
          </div>
          <div className=" flex pl-1">
            <span className="flex-1">{'Patient Id'}</span>
            <span className="flex-1">{': HYD0000048'}</span>
          </div>
          <div className=" flex pl-1">
            <span className="flex-1">{'Mobile No.'}</span>
            <span className="flex-1">{': 9052249677'}</span>
          </div>
          <div className=" flex pl-1">
            <span className="flex-1">{'Mobile No.'}</span>
            <span className="flex-1">{': 9052249677'}</span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 pt-3">
          <div className=" flex pl-1">
            <span className="flex-1">{'Time'}</span>
            <span className="flex-1">{': Consultation'}</span>
          </div>
          <div className=" flex pl-1">
            <span className="flex-1">{'Doctor Name'}</span>
            <span className="flex-1">{': Ashfaq Doctor'}</span>
          </div>
          <div className=" flex pl-1">
            <span className="flex-1">{'Appointment Date'}</span>
            <span className="flex-1">{': 2024-05-27'}</span>
          </div>
          <div className=" flex pl-1">
            <span className="flex-1">{'Time Start'}</span>
            <span className="flex-1">{': 11:00'}</span>
          </div>
          <div className=" flex pl-1">
            <span className="flex-1">{'Time End'}</span>
            <span className="flex-1">{': 11:00'}</span>
          </div>
        </div>
      </div> */}
      <div className="flex border-2 rounded justify-between">
        <Accordion
          className=" w-full h-full"
          expanded={
            expandedId != null &&
            expandID('get', patientDetails, itemDetails) == expandedId
          }
          onChange={(e, isExpanded) => {
            if (isExpanded) {
              expandID('set', patientDetails, itemDetails)
            } else {
              expandID('set', '', '')
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
            sx={{ height: '90px' }}
          >
            {console.log(userDetails)}
            <div className="flex justify-between flex-nowrap w-full items-center">
              <div className="flex items-center w-full gap-7">
                <Avatar
                  alt="Remy Sharp"
                  src={patientDetails.photopath}
                  sx={{ width: 60, height: 60, backgroundColor: '#00BBDE' }}
                />
                <span
                  title={patientDetails.fullName}
                  className="text-nowrap text-ellipsis overflow-hidden"
                >
                  {patientDetails.fullName}
                </span>
                <span className="">{userDetails.appointmentDate}</span>
                <span className="">{patientDetails.patientId}</span>
                <span className="">{patientDetails.mobileNumber}</span>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails>
            {RenderAccordianDetails(props, itemDetails)}
          </AccordionDetails>
        </Accordion>
      </div>
    </>
  )
}
const PrescribedPurchaseReportComponent = () => {
  const user = useSelector(store => store.user)
  const [expandedId, setExpandedId] = useState('')
  const [reportInfo, setReportInfo] = useState([])
  const [reportsCopy, setReportCopy] = useState([])
  const dispatch = useDispatch()
  const { data: reportsData, isLoading: isReportFetchLoading } = useQuery({
    queryKey: ['fetchPrescribedPurchaseReportData'],
    enabled: true,
    queryFn: async () => {
      const responsejson = await getPrescribedPurchaseReport(user?.accessToken)
      if (responsejson.status == 200) {
        setReportInfo(responsejson.data)
        dispatch(setData(responsejson.data))
        return responsejson.data
      } else {
        throw new Error(
          'Error occurred while fetching medicine details for pharmcy',
        )
      }
    },
  })
  useEffect(() => {
    if (isReportFetchLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isReportFetchLoading])
  return (
    <div className="m-5">
      <Breadcrumb />
      <div className="grow h-full rounded bg-white overflow-y-auto">
        <Search
          fieldsToSearch={[
            'patientDetails?.fullName',
            'patientDetails?.mobileNumber',
          ]}
          setToState={setReportInfo}
          enableSearchButton={true}
        />

        {reportInfo && reportInfo?.length != 0 ? (
          <div className="flex gap-3 w-full p-3">
            <div className=" w-1/2 flex flex-col gap-3">
              {reportInfo?.map((patientInformaion, index) => {
                if (index % 2 == 0) {
                  return (
                    <PatientInfo
                      key={index + 'patient'}
                      userDetails={patientInformaion}
                      setExpandId={setExpandedId}
                      selectedId={expandedId}
                    />
                  )
                }
                return null
              })}
            </div>
            <div className=" w-1/2 flex flex-col gap-3">
              {reportInfo?.map((patientInformaion, index) => {
                if (index % 2 == 1) {
                  return (
                    <PatientInfo
                      key={index + 'patientInfo'}
                      userDetails={patientInformaion}
                      setExpandId={setExpandedId}
                      selectedId={expandedId}
                    />
                  )
                }
                return null
              })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full text-center content-center">
            <span>No data available</span>
          </div>
        )}
      </div>
    </div>
  )
}

const Index = () => {
  return (
    <div className=" flex gap-3 flex-col h-full">
      {/* <StockExpiryComponent /> */}
      <PrescribedPurchaseReportComponent />
    </div>
  )
}
function restructureData(response) {
  const result = {
    status: response.status,
    message: response.message,
    data: [],
  }

  // Create a map to group patients by patientId
  const patientMap = new Map()

  response.data.forEach(appointment => {
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

export default Index
