import {
  downloadPDF,
  downloadScanReport,
  getScanReports,
  getSavedScanResults,
  getScanByDate,
  SaveScanResult,
} from '@/constants/apis'
import { toast, Bounce } from 'react-toastify'
import React, { useEffect, useRef, useState, useCallback, use } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { openModal, closeModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
//import React, { useState, useRef, useMemo } from 'react'
// import JoditEditor from 'jodit-react';
import dynamic from 'next/dynamic'
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
import {
  Button,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Typography,
  Autocomplete,
  TextField,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import dayjs from 'dayjs'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { getScanTemplate } from '@/constants/apis'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import ReviewFormF from '@/components/ReviewFormF'
import { toastconfig } from '@/utils/toastconfig'
import { useRouter } from 'next/router'
import { Close, Download } from '@mui/icons-material'
import { exportReport } from '@/utils/reportExport'

function TextJoedit({ contents, savedContent, onCloseClick, onSaveClick }) {
  // const [content, setContent] = useState(contents)
  const editorRef = useRef(null)
  const user = useSelector((store) => store.user)
  const userModule = user.moduleList?.find(
    (eachModuleObj) => eachModuleObj.enum == 'scanModule',
  )
  const readOnly = userModule.accessType.includes([ACCESS_TYPES.READ])

  return (
    <div>
      <JoditEditor
        ref={editorRef}
        value={contents}
        tabIndex={1} // tabIndex of textarea
        onBlur={(newContent) => {
          onSaveClick(newContent)
          // setSaveContent(newContent)
          // setContent(newContent)
        }} // preferred to use only this option to update the content for performance reasons
        // onChange={(newContent) => {
        //   setContent(newContent)
        // }}
        config={{
          readonly: readOnly,
          removeButtons: [
            'video',
            'table',
            'code',
            'link',
            'speechRecognize',
            'speech',
            'print',
          ],
        }}
      />
      {/* <div className="flex gap-3 justify-end pt-2">
        <Button variant="outlined" onClick={onSaveClicked}>
          Save
        </Button>
        <Button variant="outlined" onClick={onCloseClick}>
          Close
        </Button>
      </div> */}
    </div>
  )
}
function RenderUserRelatedTestDetails(appointmentId, tests, type) {
  const user = useSelector((store) => store.user)
  const [labtestIdSelected, setLabtestIdSelected] = useState()
  const [labtestAppointmentIdSelected, setLabtestAppointmentIdSelected] =
    useState()
  const [labtestTypeSelected, setLabtestTypeSelected] = useState()
  const [scanTemplate, setScanTemplate] = useState(null)
  const [editorContent, setEditorContent] = useState(null)
  const [savedTemplate, setSavedTemplate] = useState(null)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [selectedFormDetails, setSelectedFormDetails] = useState(null)
  console.log('checkthis:', selectedFormDetails)

  const {
    data: labTestFieldValues,
    isLoading: isLoadingFieldValues,
    error: labTestFieldValuesError,
  } = useQuery({
    queryKey: ['LabTestValues', labtestIdSelected, appointmentId],
    enabled: !!labtestIdSelected,
    queryFn: async () => {
      const responsejson = await getScanTemplate(
        user.accessToken,
        labtestIdSelected,
        labtestAppointmentIdSelected,
        labtestTypeSelected,
      )
      if (responsejson.status == 200) {
        const { scanTemplate } = responsejson.data
        if (scanTemplate) {
          setScanTemplate(scanTemplate)
        } else {
          // Initialize with empty string if no template exists
          // This ensures the modal still opens
          setScanTemplate('')
        }
      } else {
        // Set empty template so modal can still open
        setScanTemplate('')
        toast.error(
          responsejson?.message || 'Error while fetching labtest field values',
          toastconfig,
        )
      }
      return responsejson.data
    },
  })

  const { data: savedScanResult, isLoading: isLoadingSavedScanResult } =
    useQuery({
      queryKey: ['savedScanResult', labtestIdSelected, appointmentId],
      enabled: !!labtestIdSelected,
      queryFn: async () => {
        const responsejson = await getSavedScanResults(
          user.accessToken,
          type,
          appointmentId,
          labtestIdSelected,
        )
        if (responsejson.status == 200) {
          const { scanResult } = responsejson.data
          if (scanResult) {
            setSavedTemplate(scanResult)
          }
          return responsejson.data
        } else {
          toast.error(
            responsejson.data?.message ||
              'Error while fetching labtest field values',
            toastconfig,
          )
        }
      },
    })
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      const res = await SaveScanResult(user.accessToken, payload)
      if (res.status === 200) {
        if (payload?.scanTestStatus == 1) {
          toast.success('Collected Successfully', toastconfig)
          queryClient.invalidateQueries(['ScanTestsByDate'])
        } else {
          toast.success('Saved Successfully', toastconfig)
          setSavedTemplate(null)
          setScanTemplate(null)
          setEditorContent(null)
          setLabtestIdSelected()
          dispatch(closeModal())
          queryClient.invalidateQueries(['savedScanResult'])
          queryClient.invalidateQueries(['ScanTestsByDate'])
        }
      } else {
        toast.error(
          res.data?.message || 'Error while saving scan result',
          toastconfig,
        )
      }
    },
  })

  const handleValuesClick = (userRegID, itemId, type) => {
    setLabtestIdSelected(itemId)
    setLabtestAppointmentIdSelected(userRegID)
    setLabtestTypeSelected(type)
    dispatch(openModal(userRegID + '' + itemId))
  }

  const handleSavedContent = (content) => {
    setEditorContent(content)
  }
  const onModalOutClick = () => {
    setEditorContent(null)
    setSavedTemplate(null)
    setScanTemplate(null)
    setLabtestIdSelected()
    dispatch(closeModal())
  }
  const onSaveClick = (contents) => {
    if (editorContent && labtestIdSelected) {
      mutate({
        appointmentId: appointmentId,
        scanId: labtestIdSelected,
        type: type,
        scanTestStatus: 2, // 1 -> sample collection , 2 -> update result
        scanResult: editorContent,
      })
    } else {
      toast.error('Some error has occured', toastconfig)
    }
  }

  const editButtonWithPermission = function () {
    const EditButton = () => (
      <Button
        variant="outlined"
        onClick={() => {
          buttonEditState?.['id'] != labtestIdSelected + '' + appointmentId
            ? onSaveClick(
                appointmentId,
                labtestIdSelected,
                selectedTestValues.id,
                fieldValue,
              )
            : onEditButtonClicked(labtestIdSelected + '' + appointmentId)
        }}
      >
        {buttonEditState?.['id'] == labtestIdSelected + '' + appointmentId
          ? 'Edit Values'
          : 'Save Values'}
      </Button>
    )
    const PermissionedButton = withPermission(EditButton, false, 'scanModule', [
      ACCESS_TYPES.WRITE,
    ])
    return <PermissionedButton />
  }
  useEffect(() => {
    if (isLoadingFieldValues || isLoadingSavedScanResult) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isLoadingFieldValues, isLoadingSavedScanResult])

  const { mutate: downloadScanReportsMutation } = useMutation({
    mutationFn: async (payload) => {
      console.log('payload', payload)
      const response = await downloadScanReport(
        user.accessToken,
        payload.appointmentId,
        payload.scanId,
        payload.type,
      )
      if (response.status === 200) {
        downloadPDF(response)
        toast.success('Scan report downloaded successfully', toastconfig)
      } else if (response.status === 400) {
        toast.error(response.data?.message || 'Data not found', toastconfig)
      } else {
        toast.error(
          response.data?.message || 'Error downloading scan report',
          toastconfig,
        )
      }

      return response
    },
  })

  return (
    <div className="flex flex-wrap w-full items-center gap-3">
      {/* {console.log(tests)} */}
      {tests?.length != 0 ? (
        tests?.map((testsInfo, index) => {
          console.log('testsInfo', testsInfo?.stage)
          return (
            <div
              key={testsInfo.labTestId + 'itemdetails' + index}
              className="p-2 flex justify-between border-2 rounded items-center flex-wrap w-full"
            >
              <span>{testsInfo.name}</span>
              <div className="flex justify-between gap-1">
                {/* {collectButtonWithPermission(testsInfo)} */}
                {testsInfo?.isformFRequired === 1 &&
                  testsInfo?.isReviewed !== 1 && (
                    <Button
                      variant="outlined"
                      size="small"
                      className="w-full rounded font-bold"
                      color="error"
                      sx={{ display: testsInfo.stage == 'RED' ? 'none' : '' }}
                      onClick={() => {
                        setSelectedFormDetails({
                          ...testsInfo,
                          appointmentId: appointmentId,
                          type: type,
                        })
                        dispatch(
                          openModal(
                            'reviewFormFModal_' + appointmentId + '_' + type,
                          ),
                        )
                      }}
                    >
                      Review F-Form
                    </Button>
                  )}
                {(testsInfo?.isformFRequired === 0 ||
                  (testsInfo?.isformFRequired === 1 &&
                    testsInfo?.isReviewed === 1)) && (
                  <Button
                    variant="outlined"
                    size="small"
                    className="w-full rounded font-bold"
                    color="primary"
                    disabled={testsInfo.stage == 'RED'}
                    sx={{ display: testsInfo.stage == 'RED' ? 'none' : '' }}
                    onClick={() =>
                      handleValuesClick(appointmentId, testsInfo.scanId, type)
                    }
                  >
                    Report
                  </Button>
                )}
                {testsInfo?.stage == 'GREEN' && (
                  <Tooltip title="Download Scan Report">
                    <span
                      className="flex text-white bg-red-600 p-2 cursor-pointer rounded justify-center content-center flex-wrap border border-error border-l-0"
                      onClick={() =>
                        downloadScanReportsMutation({
                          appointmentId: appointmentId,
                          scanId: testsInfo?.scanId,
                          type: type,
                        })
                      }
                    >
                      <Download />
                    </span>
                  </Tooltip>
                )}
              </div>
            </div>
          )
        })
      ) : (
        <span>List is empty</span>
      )}

      {labtestIdSelected && (
        <Modal
          maxWidth={'md'}
          uniqueKey={appointmentId + '' + labtestIdSelected}
          closeOnOutsideClick={false}
        >
          <div className="flex justify-between">
            <Typography variant="h6" className="text-gray-800 mb-2">
              {labtestIdSelected && savedTemplate ? 'Update' : 'Add'}
            </Typography>
            <IconButton onClick={() => dispatch(closeModal())}>
              <Close />
            </IconButton>
          </div>
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
            {isLoadingFieldValues || isLoadingSavedScanResult ? (
              <div className="text-center p-4">
                <Typography>Loading scan template...</Typography>
              </div>
            ) : labTestFieldValuesError ? (
              <div className="text-center p-4">
                <Typography color="error" className="mb-2">
                  Error loading template. You can still create a new report.
                </Typography>
                <TextJoedit
                  contents={savedTemplate || scanTemplate || ''}
                  onSaveClick={handleSavedContent}
                />
              </div>
            ) : (
              <TextJoedit
                contents={savedTemplate || scanTemplate || ''}
                onSaveClick={handleSavedContent}
              />
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="contained"
              className="text-white"
              onClick={onSaveClick}
              disabled={isLoadingFieldValues || isLoadingSavedScanResult}
            >
              Save
            </Button>
          </div>
        </Modal>
      )}
      <Modal
        maxWidth={'sm'}
        uniqueKey={'reviewFormFModal_' + appointmentId + '_' + type}
        closeOnOutsideClick={true}
      >
        <ReviewFormF
          selectedDetails={selectedFormDetails}
          appointmentId={appointmentId}
          type={type}
        />
      </Modal>
    </div>
  )
}
function LabTestCards(props) {
  const { patientName, appointmentId, scanTests, patientPhoto, type } =
    props?.userInfo
  function handleExpandClicked(id) {
    props.setSelectedId(id)
  }
  // useEffect(() => { }, [scanTests])
  return (
    <div className="flex shadow border-2 rounded justify-between">
      <Accordion
        className=" w-full h-full"
        expanded={
          props.selectedId != null && appointmentId === props.selectedId
        }
        onChange={(e, isExpanded) => {
          if (isExpanded) {
            handleExpandClicked(appointmentId)
          } else {
            handleExpandClicked()
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={{ height: '90px' }}
        >
          <div className="flex justify-between flex-nowrap w-full items-center">
            <div className="flex items-center w-1/2 gap-3">
              <Avatar
                alt="Remy Sharp"
                src={patientPhoto}
                sx={{ width: 60, height: 60, backgroundColor: '#00BBDE' }}
              />
              <span
                title={patientName}
                className="text-nowrap text-ellipsis overflow-hidden"
              >
                {patientName}
              </span>
            </div>
            {/* <span className="flex-1 ">{appointmentId}</span> */}
            <span className="">{type}</span>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          {/* {RenderUserRelatedTestDetails(registrationID)} */}
          {RenderUserRelatedTestDetails(appointmentId, scanTests, type)}
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

const ScanReportsSection = ({
  branches,
  reportFromDate,
  reportToDate,
  reportBranchId,
  setReportFromDate,
  setReportToDate,
  setReportBranchId,
}) => {
  const user = useSelector((store) => store.user)
  const [exportFormat, setExportFormat] = useState('excel')
  const branchOptions = [
    { id: null, name: 'All Centres', branchCode: 'ALL' },
  ].concat(branches || [])
  const exportFormatOptions = [
    { label: 'Excel', value: 'excel' },
    { label: 'PDF', value: 'pdf' },
  ]

  const { data: reportRows, isLoading } = useQuery({
    queryKey: ['scanReports', reportFromDate, reportToDate, reportBranchId],
    enabled: !!reportFromDate && !!reportToDate,
    queryFn: async () => {
      const response = await getScanReports(
        user.accessToken,
        `${reportFromDate.$y}-${reportFromDate.$M + 1}-${reportFromDate.$D}`,
        `${reportToDate.$y}-${reportToDate.$M + 1}-${reportToDate.$D}`,
        reportBranchId,
      )
      if (response.status === 200) {
        return response.data || []
      }
      throw new Error('Error while fetching scan reports')
    },
  })

  const reportColumns = [
    {
      field: 'patientName',
      headerName: 'Patient Name',
      flex: 1.1,
      minWidth: 200,
    },
    {
      field: 'reportDate',
      headerName: 'Date',
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => {
        const reportDate = params?.row?.reportDate
        if (!reportDate) return ''
        const formatted = dayjs(reportDate).format('DD-MM-YYYY')
        return formatted === 'Invalid Date' ? '' : formatted
      },
    },
    {
      field: 'centre',
      headerName: 'Centre',
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => {
        const branch = branches?.find(
          (item) => item.id == params?.row?.branchId,
        )
        return branch?.branchCode || branch?.name || '-'
      },
    },
    { field: 'scanName', headerName: 'Scan Name', flex: 1, minWidth: 180 },
    { field: 'status', headerName: 'Status', flex: 0.7, minWidth: 120 },
  ]

  const handleExport = () => {
    exportReport(reportRows || [], reportColumns, exportFormat, {
      reportName: 'Scan_Report',
      branchName:
        branchOptions.find((branch) => branch.id === reportBranchId)
          ?.branchCode || 'ALL',
    })
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-3 flex-wrap">
          <DatePicker
            label="From Date"
            value={reportFromDate}
            format="DD/MM/YYYY"
            onChange={setReportFromDate}
          />
          <DatePicker
            label="To Date"
            value={reportToDate}
            format="DD/MM/YYYY"
            onChange={setReportToDate}
          />
          <Autocomplete
            className="w-56"
            options={branchOptions}
            getOptionLabel={(option) => option?.branchCode || option?.name}
            value={
              branchOptions.find((branch) => branch.id === reportBranchId) ||
              null
            }
            onChange={(_, value) => setReportBranchId(value?.id ?? null)}
            renderInput={(params) => <TextField {...params} label="Centre" />}
            clearIcon={null}
          />
        </div>
        <div className="flex gap-2 items-center">
          <Autocomplete
            className="w-40"
            options={exportFormatOptions}
            getOptionLabel={(option) => option?.label}
            value={
              exportFormatOptions.find(
                (format) => format.value === exportFormat,
              ) || exportFormatOptions[0]
            }
            onChange={(_, value) => setExportFormat(value?.value || 'excel')}
            renderInput={(params) => <TextField {...params} label="Format" />}
            disableClearable
          />
          <Button
            variant="contained"
            className="text-white"
            onClick={handleExport}
            disabled={!reportRows?.length}
          >
            Export
          </Button>
        </div>
      </div>

      <div
        style={{ height: '70vh', width: '100%' }}
        className="bg-white rounded"
      >
        <DataGrid
          rows={reportRows || []}
          columns={reportColumns}
          getRowId={(row, index) =>
            `${row.appointmentId}-${row.scanType}-${row.scanName}-${index}`
          }
          loading={isLoading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25, page: 0 },
            },
          }}
        />
      </div>
    </div>
  )
}

const Index = () => {
  const user = useSelector((store) => store.user)
  const branches = user?.branchDetails
  const [branchId, setBranchId] = useState()
  const router = useRouter()
  const [selectedPatientId, setSelectedPatientId] = useState()
  const [patientDetails, setPatientDetails] = useState()
  const [ButtonFilter, setButtonFilterClicked] = useState()
  const [ButtonClicked, setButtonClicked] = useState()
  const [date, setDate] = useState()
  const [mainTab, setMainTab] = useState('list')
  const [reportFromDate, setReportFromDate] = useState(
    dayjs(new Date()).subtract(7, 'day'),
  )
  const [reportToDate, setReportToDate] = useState(dayjs(new Date()))
  const [reportBranchId, setReportBranchId] = useState(null)
  const dummy = ['bg-red-400', 'bg-orange-400']
  const ButtonsInfo = [
    // { id: '3', name: 'Collect Sample', clicked: false },
    { id: '1', name: 'Update Results', clicked: false },
    { id: '2', name: 'Completed', clicked: false },
    { id: '4', name: 'All', clicked: true },
  ]
  const dispatch = useDispatch()
  const { data: labTestInfo, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['ScanTestsByDate', date, branchId],
    enabled: !!date && mainTab === 'list',
    queryFn: async () => {
      const responsejson = await getScanByDate(
        user.accessToken,
        `${date.$y}-${date.$M + 1}-${date.$D}`,
        branchId,
      )
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching appointments for doctor')
      }
    },
  })

  useEffect(() => {
    const { date: routeDate, branchId: routeBranchId } = router.query
    if (routeDate && routeBranchId) {
      setDate(dayjs(routeDate))
      setBranchId(routeBranchId)
    } else {
      setDate(dayjs(new Date()))
      router.push(
        {
          pathname: router.pathname,
          query: {
            date: dayjs(new Date()).format('YYYY-MM-DD'),
            branchId: branches[0]?.id || null,
          },
        },
        undefined,
        { shallow: true },
      )
    }
  }, [router.query])

  useEffect(() => {
    if (reportBranchId === null && branches?.length) {
      setReportBranchId(branches[0]?.id || null)
    }
  }, [branches, reportBranchId])

  const handleDateChange = (value) => {
    setDate(value)
    router.push(
      {
        pathname: router.pathname,
        query: {
          date: dayjs(value).format('YYYY-MM-DD'),
          branchId: branchId || null,
        },
      },
      undefined,
      { shallow: true },
    )
  }
  const onBranchChange = (value) => {
    setBranchId(value?.id || null)
    router.push(
      {
        pathname: router.pathname,
        query: {
          date: dayjs(date).format('YYYY-MM-DD'),
          branchId: value?.id || null,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  function filterPatientInfo(color, id) {
    if (id == 4) {
      setPatientDetails(labTestInfo)
    } else {
      if (labTestInfo && labTestInfo.length != 0) {
        let labTestInfoCopy = JSON.parse(JSON.stringify(labTestInfo))
        let filteredPatientDetails = labTestInfoCopy.filter((patientInfo) => {
          if (patientInfo && patientInfo.scanTests.length != 0) {
            let labtestdata = patientInfo.scanTests.filter((testsinfo) => {
              if (testsinfo.stage == color) return testsinfo
            })
            if (labtestdata && labtestdata.length > 0) {
              patientInfo.scanTests = []
              patientInfo.scanTests = labtestdata
              return patientInfo
            }
          }
        })
        setPatientDetails(filteredPatientDetails)
      }
    }
    setSelectedPatientId(0)
  }
  const filterButtonClicked = (id) => {
    let filterData = ButtonsInfo.map((buttondata) => {
      buttondata.clicked = buttondata.id == id ? true : false
      return buttondata
    })
    let color = ''
    switch (id) {
      case '1':
        color = 'ORANGE'
        break
      case '2':
        color = 'GREEN'
        break
      case '3':
        color = 'RED'
        break
    }
    filterPatientInfo(color, id)
    setButtonFilterClicked(filterData)
  }
  const getText = (id) => {
    switch (id) {
      case '1':
        return '#a1a10a' //yellow
      case '2':
        return '#0aa10a' //green
      case '3':
        return '#a10a0a' // red
      case '4':
        return '#06aee9' //secondary color
    }
  }
  const getBg = (id) => {
    switch (id) {
      case '1':
        return '#fafab0'
      case '2':
        return '#b0fab0'
      case '3':
        return '#fab0c0'
      case '4':
        return '#b0e9fa'
    }
  }
  useEffect(() => {
    setButtonFilterClicked(ButtonsInfo)
    setPatientDetails(labTestInfo)
    setSelectedPatientId(0)
  }, [labTestInfo])
  useEffect(() => {
    if (isAppointmentsLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  })
  return (
    <div className="w-full h-full p-5 flex gap-5">
      {mainTab === 'list' && (
        <div className="min-w-80 p-3 h-full flex flex-col gap-3 shadow rounded bg-white overflow-y-auto">
          <div>
            <Autocomplete
              className="w-full text-center"
              options={branches || []}
              getOptionLabel={(option) => option?.branchCode || option?.name}
              value={branches?.find((branch) => branch.id == branchId) || null}
              onChange={(_, value) => onBranchChange(value)}
              renderInput={(params) => <TextField {...params} fullWidth />}
              clearIcon={null}
            />
          </div>
          <DatePicker
            className=" bg-white"
            value={date}
            format="DD/MM/YYYY"
            onChange={handleDateChange}
          />
          {ButtonFilter &&
            ButtonFilter.length != 0 &&
            ButtonFilter.map((buttondata) => {
              return (
                <span
                  key={buttondata.id + 'filterbutton'}
                  // variant={buttondata.clicked ? 'contained' : 'outlined'}
                  // color="primary"
                  onClick={() => {
                    filterButtonClicked(buttondata.id)
                  }}
                  className={`rounded cursor-pointer  shadow p-3 transition-all`}
                  style={{
                    backgroundColor: getBg(buttondata.id),

                    color: getText(buttondata?.id),
                    fontWeight: buttondata.clicked ? 'bold' : 'normal',
                    border: buttondata.clicked
                      ? '2px solid' + getText(buttondata?.id)
                      : '',
                    cursor: 'pointer',
                  }}
                >
                  {buttondata.name}
                </span>
              )
            })}
        </div>
      )}
      <div className="grow h-full shadow rounded bg-white overflow-y-auto">
        <div className="flex justify-between px-3 pt-2">
          <Tabs
            value={mainTab}
            onChange={(e, value) => {
              setMainTab(value)
            }}
          >
            <Tab value={'list'} label="Scan List" />
            <Tab value={'report'} label="Report" />
          </Tabs>
        </div>
        {mainTab === 'report' ? (
          <ScanReportsSection
            branches={branches}
            reportFromDate={reportFromDate}
            reportToDate={reportToDate}
            reportBranchId={reportBranchId}
            setReportFromDate={setReportFromDate}
            setReportToDate={setReportToDate}
            setReportBranchId={setReportBranchId}
          />
        ) : patientDetails?.length != 0 ? (
          <div className="flex gap-3 w-full p-3">
            <div className=" w-1/2 flex flex-col gap-3">
              {patientDetails &&
                patientDetails.map((item, index) => {
                  if (index % 2 == 0) {
                    return (
                      <LabTestCards
                        key={item.appointmentId + 'LabCard' + index}
                        userInfo={item}
                        setSelectedId={setSelectedPatientId}
                        selectedId={selectedPatientId}
                      />
                    )
                  }
                  return null
                })}
            </div>
            <div className=" w-1/2 flex flex-col gap-3">
              {patientDetails &&
                patientDetails.map((item, index) => {
                  if (index % 2 != 0) {
                    return (
                      <LabTestCards
                        key={item.appointmentId + 'LabCard' + index}
                        userInfo={item}
                        setSelectedId={setSelectedPatientId}
                        selectedId={selectedPatientId}
                      />
                    )
                  } else {
                    return null
                  }
                })}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex justify-center items-center">
            <span className="opacity-50">No details found</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default withPermission(Index, true, 'scanModule', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
