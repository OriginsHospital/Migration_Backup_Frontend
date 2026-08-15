import React, { use, useEffect, useRef, useState, useCallback } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Button from '@mui/material/Button'
import { openModal, closeModal } from '@/redux/modalSlice'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import { useDispatch, useSelector } from 'react-redux'
import Modal from '@/components/Modal'
import dynamic from 'next/dynamic'
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import {
  getAllLabTestsByDate,
  getLabReports,
  getLabTestsTemplate,
  saveLabTestResult,
  getSavedLabTestResult,
  saveOutsourcingLabTestResult,
  deleteOutsourcingLabTestResult,
} from '@/constants/apis'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DataGrid } from '@mui/x-data-grid'
import Avatar from '@mui/material/Avatar'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
import { useRouter } from 'next/router'
import {
  Autocomplete,
  IconButton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { Close, Delete } from '@mui/icons-material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import { exportReport } from '@/utils/reportExport'

function TextJoedit({ contents, savedContent }) {
  // const [content, setContent] = useState(contents)
  const editorRef = useRef(null)

  const user = useSelector((store) => store.user)
  const userModule = user.moduleList?.find(
    (eachModuleObj) => eachModuleObj.enum == 'labModule',
  )
  const readOnly = userModule.accessType.includes([ACCESS_TYPES.READ])

  return (
    <div>
      <JoditEditor
        ref={editorRef}
        value={contents}
        tabIndex={1} // tabIndex of textarea
        onBlur={(newContent) => {
          savedContent(newContent)
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
const UserRelatedTestDetails = ({
  appointmentId,
  tests,
  type,
  category,
  isSpouse,
}) => {
  // console.log('category', category)
  const user = useSelector((store) => store.user)
  const [labtestIdSelected, setLabtestIdSelected] = useState()
  const [labTemplate, setLabTemplate] = useState(null)
  const [editorContent, setEditorContent] = useState(null)
  const [savedTemplate, setSavedTemplate] = useState(null)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const [fileType, setFileType] = useState(null)

  // Get template query
  const { data: getLabTestTemplate } = useQuery({
    queryKey: ['LabTestTemplate', labtestIdSelected, appointmentId, isSpouse],
    enabled: !!labtestIdSelected,
    queryFn: async () => {
      const responsejson = await getLabTestsTemplate(
        user.accessToken,
        labtestIdSelected,
        appointmentId,
        type,
        isSpouse,
      )
      if (responsejson.status == 200) {
        const { labTestTemplate } = responsejson.data
        if (labTestTemplate) {
          setLabTemplate(labTestTemplate)
        }
        return responsejson.data
      }
      throw new Error('Error while fetching lab test template')
    },
  })

  // Get saved result query
  const { data: savedLabResult } = useQuery({
    queryKey: ['SavedLabResult', labtestIdSelected, appointmentId],
    enabled: !!labtestIdSelected && !!labTemplate,
    queryFn: async () => {
      const responsejson = await getSavedLabTestResult(
        user.accessToken,
        type,
        appointmentId,
        labtestIdSelected,
        isSpouse,
      )

      if (responsejson.status == 200) {
        const { labTestResult } = responsejson.data
        console.log('labTestResult', labTemplate)
        if (labTestResult) {
          setSavedTemplate(labTestResult)
          console.log('labTestResult', labTestResult)
          // checkFileType(labTestResult)
        } else if (labTemplate) {
          setSavedTemplate(labTemplate)
        } else {
          setSavedTemplate(null)
        }
        return responsejson.data
      }
      throw new Error('Error while fetching saved lab result')
    },
  })

  const handleValuesClick = (appointmentId, itemId) => {
    console.log('appointmentId', appointmentId)
    console.log('itemId', itemId)
    setLabtestIdSelected(itemId)
    dispatch(openModal(appointmentId + '-' + itemId))
  }

  const handleCollectButtonClick = (labTestId, labTestCategory, isSpouse) => {
    // console.log('labTestCategory', labTestCategory)
    switch (labTestCategory) {
      case 0:
        inhouseMutate({
          appointmentId: appointmentId,
          labTestId: labTestId,
          type: type,
          labTestStatus: 1, // 1 -> sample collection , 2 -> update result
          labTestResult: '',
          isSpouse: isSpouse,
        })
        break
      case 1:
        if (confirm('Are you sure you want to collect the sample?')) {
          const formData = new FormData()
          formData.append('appointmentId', appointmentId)
          formData.append('labTestId', labTestId)
          formData.append('type', type)
          formData.append('labTestStatus', 1)
          formData.append('isSpouse', isSpouse)
          outsourcingMutate(formData)
        }
        break
      default:
        break
    }
  }

  const handleSavedContent = (content) => {
    setEditorContent(content)
  }
  // const checkFileType = async (url) => {
  //   try {
  //     const response = await fetch(url, {
  //       method: 'HEAD',
  //       credentials: 'include',

  //     });
  //     const contentType = response.headers.get('content-type');
  //     setFileType(contentType);
  //   } catch (error) {
  //     console.error('Error checking file type:', error);
  //     // Default to image if we can't determine type
  //     setFileType('image');
  //   }
  // };

  const onModalOutClick = () => {
    setEditorContent(null)
    setSavedTemplate(null)
    setLabTemplate(null)
    setLabtestIdSelected()
    // setFileType(null)
    dispatch(closeModal())
  }

  const handleDeleteOutsourcingResult = async () => {
    if (confirm('Are you sure you want to delete the report?')) {
      const rs = await deleteOutsourcingLabTestResult(
        user.accessToken,
        savedLabResult?.id,
      )
      if (rs.status === 200) {
        toast.success('Delete Successfully', toastconfig)
      } else if (rs.status === 400) {
        toast.error(rs.message, toastconfig)
      } else {
        toast.error('Something went wrong', toastconfig)
      }
      onModalOutClick()
    }
  }

  const onSaveClick = (contents) => {
    if (editorContent && labtestIdSelected) {
      inhouseMutate({
        appointmentId: appointmentId,
        labTestId: labtestIdSelected,
        type: type,
        labTestStatus: 2, // 1 -> sample collection , 2 -> update result
        labTestResult: editorContent,
        isSpouse: isSpouse,
      })
    } else {
      toast.error('Some error has occurred', toastconfig)
    }
  }

  const { mutate: inhouseMutate, isPending: isPendingInhouse } = useMutation({
    mutationFn: async (payload) => {
      // console.log('payload', payload)
      const res = await saveLabTestResult(user.accessToken, payload)
      if (res.status === 200) {
        if (payload?.labTestStatus == 1) {
          toast.success('Collected Successfully', toastconfig)
        } else {
          toast.success('Saved Successfully', toastconfig)
          setSavedTemplate(null)
          setLabTemplate(null)
          setEditorContent(null)
          setLabtestIdSelected()
          dispatch(closeModal())
        }
      } else {
        toast.error(res.message, toastconfig)
      }
      queryClient.invalidateQueries(['LabtestsByDate'])
    },
  })
  const { mutate: outsourcingMutate, isPending: isPendingOutsourcing } =
    useMutation({
      mutationFn: async (payload) => {
        console.log('outsourcing payload', payload)
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
          queryClient.invalidateQueries(['LabtestsByDate'])
        }
      },
    })

  const collectButtonWithPermission = function (testsInfo, isSpouse) {
    const CollectButton = () => (
      <Button
        variant="contained"
        color={testsInfo.status == 'RED' ? 'success' : 'primary'}
        size="small"
        className="w-full rounded font-bold capitalize"
        onClick={() =>
          handleCollectButtonClick(
            testsInfo.labTestId,
            testsInfo.labTestCategory,
            isSpouse,
          )
        }
        disabled={testsInfo.status != 'RED'}
      >
        Collect
      </Button>
    )
    const PermissionedButton = withPermission(
      CollectButton,
      false,
      'labModule',
      [ACCESS_TYPES.WRITE],
    )
    return <PermissionedButton />
  }

  useEffect(() => {
    if (isPendingInhouse || isPendingOutsourcing) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isPendingInhouse, isPendingOutsourcing])

  return (
    <div className="flex flex-wrap w-full items-center gap-3">
      {tests?.length != 0 ? (
        tests?.map((testsInfo, index) => {
          return (
            <div
              key={testsInfo.labTestId + 'itemdetails' + index}
              className="p-2 flex justify-between border-2 rounded items-center flex-wrap w-full"
            >
              <span>{testsInfo.name}</span>
              <div className="flex justify-between gap-1">
                {collectButtonWithPermission(testsInfo, isSpouse)}
                <Button
                  variant="outlined"
                  size="small"
                  className="w-full rounded font-bold capitalize"
                  color="primary"
                  disabled={testsInfo.status == 'RED'}
                  sx={{ display: testsInfo.status == 'RED' ? 'none' : '' }}
                  onClick={() =>
                    handleValuesClick(appointmentId, testsInfo.labTestId)
                  }
                >
                  Report
                </Button>
              </div>
            </div>
          )
        })
      ) : (
        <span>List is empty</span>
      )}
      {labtestIdSelected && labTemplate && (
        <Modal
          maxWidth={'md'}
          uniqueKey={appointmentId + '-' + labtestIdSelected}
          closeOnOutsideClick={false}
        >
          <div className="flex justify-between">
            <Typography variant="h6" className="text-gray-800 mb-2">
              {category == '0'
                ? labtestIdSelected && labTemplate && savedTemplate
                  ? 'Update'
                  : 'Add'
                : 'View Outsourcing Report'}
            </Typography>
            <div>
              {category === '1' && savedTemplate && (
                <IconButton
                  onClick={handleDeleteOutsourcingResult}
                  title="Delete Report"
                >
                  <Delete color="error" />
                </IconButton>
              )}
              <IconButton onClick={onModalOutClick}>
                <Close />
              </IconButton>
            </div>
          </div>
          {category == '0' ? (
            <>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
                {labtestIdSelected && labTemplate && savedTemplate && (
                  <TextJoedit
                    contents={savedTemplate ? savedTemplate : labTemplate}
                    savedContent={handleSavedContent}
                  />
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="contained"
                  className="text-white"
                  onClick={onSaveClick}
                >
                  Save
                </Button>
              </div>
            </>
          ) : (
            <>
              {savedTemplate ? (
                // View report section
                <div className="flex flex-col gap-4">
                  {savedTemplate.includes('pdf') ? (
                    <iframe src={savedTemplate} width="100%" height="400px" />
                  ) : (
                    <img src={savedTemplate} alt="Report" />
                  )}
                  <div className="flex justify-center">
                    <Button
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      onClick={() => {
                        setSavedTemplate(null)
                        // setFileType(null)
                      }}
                    >
                      Change Report
                    </Button>
                  </div>
                  {/* <iframe src={savedTemplate} width="100%" height="500px" /> */}
                </div>
              ) : (
                // Upload report section
                <div className="flex flex-col gap-4">
                  <Typography variant="h6" className="text-gray-800 mb-2">
                    Upload Lab Report
                  </Typography>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error(
                              'File size should be less than 5MB',
                              toastconfig,
                            )
                            return
                          }
                          const formData = new FormData()
                          formData.append('labTestResultFile', file)
                          formData.append('appointmentId', appointmentId)
                          formData.append('labTestId', labtestIdSelected)
                          formData.append('type', type)
                          formData.append('labTestStatus', 2)
                          formData.append('isSpouse', isSpouse)
                          outsourcingMutate(formData)
                        }
                      }}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <CloudUploadIcon
                        sx={{ fontSize: 40, color: 'primary.main' }}
                      />
                      <Typography variant="body1" mt={1}>
                        Click to upload or drag and drop
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PDF, JPG or PNG (max. 5MB)
                      </Typography>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
function LabTestCards(props) {
  const { patientName, appointmentId, labTests, patientPhoto, type, isSpouse } =
    props?.userInfo
  function handleExpandClicked(id) {
    props.setSelectedId(id)
  }
  // useEffect(() => { }, [labTests])
  return (
    <div className="flex shadow border-2 rounded justify-between">
      <Accordion
        className=" w-full h-full"
        expanded={
          props.selectedId != null &&
          appointmentId + isSpouse === props.selectedId
        }
        onChange={(e, isExpanded) => {
          if (isExpanded) {
            handleExpandClicked(appointmentId + isSpouse)
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
                alt={patientName}
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
            <span className="capitalize">{type}</span>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <UserRelatedTestDetails
            appointmentId={appointmentId}
            tests={labTests}
            type={type}
            category={props?.category}
            isSpouse={isSpouse}
          />
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

const LabReportsSection = ({
  reportCategory,
  reportFromDate,
  reportToDate,
  reportBranchId,
  branches,
  setReportCategory,
  setReportFromDate,
  setReportToDate,
  setReportBranchId,
}) => {
  const user = useSelector((store) => store.user)
  const [exportFormat, setExportFormat] = useState('excel')
  const branchOptions = [
    { id: null, name: 'All Branches', branchCode: 'ALL' },
  ].concat(branches || [])
  const exportFormatOptions = [
    { label: 'CSV', value: 'csv' },
    { label: 'Excel', value: 'excel' },
    { label: 'PDF', value: 'pdf' },
  ]

  const { data: reportRows, isLoading } = useQuery({
    queryKey: [
      'labReports',
      reportCategory,
      reportFromDate,
      reportToDate,
      reportBranchId,
    ],
    enabled: !!reportFromDate && !!reportToDate,
    queryFn: async () => {
      const response = await getLabReports(
        user.accessToken,
        `${reportFromDate.$y}-${reportFromDate.$M + 1}-${reportFromDate.$D}`,
        `${reportToDate.$y}-${reportToDate.$M + 1}-${reportToDate.$D}`,
        reportBranchId,
        reportCategory,
      )

      if (response.status === 200) {
        return response.data || []
      }
      throw new Error('Error while fetching lab reports')
    },
  })

  const reportColumns = [
    {
      field: 'patientName',
      headerName: 'Patient Name',
      flex: 1.2,
      minWidth: 200,
    },
    {
      field: 'reportDate',
      headerName: 'Date',
      flex: 0.8,
      minWidth: 140,
      renderCell: (params) => {
        const reportDate = params?.row?.reportDate
        if (!reportDate) return ''
        const formatted = dayjs(reportDate).format('DD-MM-YYYY')
        return formatted === 'Invalid Date' ? '' : formatted
      },
    },
    {
      field: 'labTestName',
      headerName: 'Lab Test Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'amountPaid',
      headerName: 'Amount Paid',
      flex: 0.8,
      minWidth: 140,
      valueGetter: (params) =>
        Number(params?.row?.amountPaid ?? params?.value ?? 0).toFixed(2),
    },
  ]

  const handleExport = () => {
    exportReport(reportRows || [], reportColumns, exportFormat, {
      reportName:
        reportCategory === '0' ? 'In_House_Lab_Report' : 'Out_House_Lab_Report',
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
            renderInput={(params) => <TextField {...params} label="Branch" />}
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
              ) || exportFormatOptions[1]
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

      <Tabs
        value={reportCategory}
        onChange={(e, value) => setReportCategory(value)}
      >
        <Tab value={'0'} label="In-House Reports" />
        <Tab value={'1'} label="Out-House Reports" />
      </Tabs>

      <div
        style={{ height: '68vh', width: '100%' }}
        className="bg-white rounded"
      >
        <DataGrid
          rows={reportRows || []}
          columns={reportColumns}
          getRowId={(row) =>
            `${row.appointmentId}-${row.type}-${row.reportDate}-${row.labTestName}`
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
  const [branchId, setBranchId] = useState(branches[0]?.id || null)
  const [selectedPatientId, setSelectedPatientId] = useState()
  const [patientDetails, setPatientDetails] = useState()
  const [ButtonFilter, setButtonFilterClicked] = useState()
  const [date, setDate] = useState(dayjs(new Date()))
  const [category, setCategory] = useState('0')
  const [mainTab, setMainTab] = useState('0')
  const [reportCategory, setReportCategory] = useState('0')
  const [reportFromDate, setReportFromDate] = useState(
    dayjs(new Date()).subtract(7, 'day'),
  )
  const [reportToDate, setReportToDate] = useState(dayjs(new Date()))
  const [reportBranchId, setReportBranchId] = useState(null)
  const router = useRouter()
  useEffect(() => {
    if (mainTab !== 'report') {
      const dateStr = `${date.$y}-${date.$M + 1}-${date.$D}`
      router.push(
        `/laboratory?date=${dateStr}&category=${category}&branchId=${branchId}`,
        undefined,
        {
          shallow: true,
        },
      )
    }
  }, [date, category, branchId, mainTab])
  useEffect(() => {
    const { date: urlDate, category: urlCategory } = router.query
    if (urlDate) {
      setDate(dayjs(urlDate))
    }
    if (urlCategory) {
      setCategory(urlCategory)
    }
    console.log('date', date)
    console.log('urlDate', urlCategory)
  }, [])
  const ButtonsInfo = [
    { id: '3', name: 'Collect Sample', clicked: false },
    { id: '1', name: 'Update Results', clicked: false },
    { id: '2', name: 'Completed', clicked: false },
    { id: '4', name: 'All', clicked: true },
  ]
  const dispatch = useDispatch()
  const { data: labTestInfo, isLoading: isAppointmentsLoading } = useQuery({
    queryKey: ['LabtestsByDate', date, category, branchId],
    enabled: !!date && mainTab !== 'report',
    queryFn: async () => {
      const responsejson = await getAllLabTestsByDate(
        user.accessToken,
        `${date.$y}-${date.$M + 1}-${date.$D}`,
        category,
        branchId,
      )
      if (responsejson.status == 200) {
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching appointments for doctor')
      }
    },
  })
  const handleDateChange = (value) => {
    setDate(value)
  }
  function filterPatientInfo(color, id) {
    if (id == 4) {
      setPatientDetails(labTestInfo)
    } else {
      if (labTestInfo && labTestInfo.length != 0) {
        let labTestInfoCopy = JSON.parse(JSON.stringify(labTestInfo))
        let filteredPatientDetails = labTestInfoCopy.filter((patientInfo) => {
          if (patientInfo && patientInfo.labTests.length != 0) {
            let labtestdata = patientInfo.labTests.filter((testsinfo) => {
              if (testsinfo.status == color) return testsinfo
            })
            if (labtestdata && labtestdata.length > 0) {
              patientInfo.labTests = []
              patientInfo.labTests = labtestdata
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
  }, [isAppointmentsLoading])

  return (
    <div className="w-full h-full p-5 flex gap-5">
      {mainTab !== 'report' && (
        <div className="min-w-56 max-w-56 p-3 h-full flex flex-col gap-3 shadow rounded bg-white overflow-y-auto">
          <div>
            <Autocomplete
              className="w-full text-center"
              options={branches || []}
              getOptionLabel={(option) => option?.branchCode || option?.name}
              value={branches?.find((branch) => branch.id === branchId) || null}
              onChange={(_, value) => setBranchId(value?.id || null)}
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
                  className={`rounded cursor-pointer  shadow p-3 transition-all `}
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
        <div className="flex justify-between">
          <Tabs
            value={mainTab}
            onChange={(e, value) => {
              setMainTab(value)
              if (value !== 'report') {
                setCategory(value)
              }
            }}
          >
            <Tab value={'0'} label="In House" />
            <Tab value={'1'} label="Outsourcing" />
            <Tab value={'report'} label="Report" />
          </Tabs>
        </div>
        {mainTab === 'report' ? (
          <LabReportsSection
            reportCategory={reportCategory}
            reportFromDate={reportFromDate}
            reportToDate={reportToDate}
            reportBranchId={reportBranchId}
            branches={branches}
            setReportCategory={setReportCategory}
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
                        key={
                          item.appointmentId + item.isSpouse + 'LabCard' + index
                        }
                        userInfo={item}
                        setSelectedId={setSelectedPatientId}
                        selectedId={selectedPatientId}
                        category={category}
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
                        category={category}
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

export default withPermission(Index, true, 'Lab', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
