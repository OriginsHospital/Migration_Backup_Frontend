import { useQuery } from '@tanstack/react-query'
import { getAllPatients, getPackageData } from '@/constants/apis'
import { useSelector, useDispatch } from 'react-redux'
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
} from '@mui/x-data-grid'
import CustomToolbar from '@/components/CustomToolbar'
import { Avatar, Button, CircularProgress, TextField } from '@mui/material'
import { useRouter } from 'next/router'
import { SearchOutlined } from '@mui/icons-material'
import { useEffect, useMemo, useState } from 'react'
import PatientHistory from '@/components/PatientHistory'
import { ACCESS_TYPES } from '@/constants/constants'
import { withPermission } from '@/components/withPermission'
import dayjs from 'dayjs'
import { openModal } from '@/redux/modalSlice'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { patientFilterData } from '@/constants/filters'

// {
//   "patientId": "ORI000013",
//   "patientType": {
//       "id": 1,
//       "name": "FERT"
//   },
//   "aadhaarNo": "123456790136",
//   "mobileNo": "9866485623",
//   "Name": "Anjali Tesla",
//   "dateOfBirth": "2000-10-08",
//   "city": {
//       "id": 1,
//       "name": "Hyderabad"
//   },
//   "referralSource": {
//       "id": 1,
//       "referralSource": "Friends"
//   },
//   "referralName": "Arjun"
// }

// Create a helper function to check permissions
const usePermissionCheck = (moduleName, requiredPermissions) => {
  const user = useSelector((store) => store.user)
  const userModule = user.moduleList?.find(
    (eachModuleObj) => eachModuleObj.enum === moduleName,
  )
  const userPermission = userModule?.accessType

  return !userPermission || requiredPermissions.includes(userPermission)
}

const ViewButton = ({ row, router }) => {
  return (
    <Button
      variant="outlined"
      color="primary"
      className="capitalize"
      onClick={() => {
        router.push(
          {
            pathname: router.pathname + '/register',
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
}

const PermissionedViewButton = withPermission(ViewButton, false, 'patient', [
  ACCESS_TYPES.READ,
])

// Component to show patient name with red dot indicator for pending payment
const PatientNameWithIndicator = ({ patient, userToken }) => {
  // Fetch package data for patients with active visits
  const { data: packageData, isLoading: isLoadingPackage } = useQuery({
    queryKey: ['packageData', patient.activeVisitId],
    queryFn: async () => {
      if (!patient.activeVisitId || !userToken) {
        return null
      }
      try {
        const response = await getPackageData(userToken, patient.activeVisitId)
        if (response.status === 200 && response.data) {
          return response.data
        }
        return null
      } catch (error) {
        console.error('Error fetching package data:', error)
        return null
      }
    },
    enabled: !!patient.activeVisitId && !!userToken,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  })

  // Calculate pending amount
  const calculatePendingAmount = () => {
    if (!packageData) {
      return null
    }

    const packageAmount = parseFloat(packageData.marketingPackage || 0)

    // If no package amount, no payment due
    if (packageAmount <= 0) {
      return null
    }

    // Calculate total paid amount from all milestone payments
    // Only count amounts where the corresponding date is set (indicating payment was made)
    let totalPaid = 0

    // Registration payment
    if (packageData.registrationDate && packageData.registrationAmount) {
      totalPaid += parseFloat(packageData.registrationAmount || 0)
    }

    // Day 1 payment
    if (packageData.day1Date && packageData.day1Amount) {
      totalPaid += parseFloat(packageData.day1Amount || 0)
    }

    // Pick Up payment
    if (packageData.pickUpDate && packageData.pickUpAmount) {
      totalPaid += parseFloat(packageData.pickUpAmount || 0)
    }

    // Hysteroscopy payment
    if (packageData.hysteroscopyDate && packageData.hysteroscopyAmount) {
      totalPaid += parseFloat(packageData.hysteroscopyAmount || 0)
    }

    // Day 5 Freezing payment
    if (packageData.day5FreezingDate && packageData.day5FreezingAmount) {
      totalPaid += parseFloat(packageData.day5FreezingAmount || 0)
    }

    // FET payment
    if (packageData.fetDate && packageData.fetAmount) {
      totalPaid += parseFloat(packageData.fetAmount || 0)
    }

    // ERA payment
    if (packageData.eraDate && packageData.eraAmount) {
      totalPaid += parseFloat(packageData.eraAmount || 0)
    }

    // UPT Positive payment
    if (packageData.uptPositiveDate && packageData.uptPositiveAmount) {
      totalPaid += parseFloat(packageData.uptPositiveAmount || 0)
    }

    const pendingAmount = packageAmount - totalPaid

    // Only show if there's a package and pending amount > 0
    // Also check if package is not fully paid (totalPaid < packageAmount)
    if (packageAmount > 0 && pendingAmount > 0 && totalPaid < packageAmount) {
      return {
        packageAmount: packageAmount.toFixed(2),
        paidAmount: totalPaid.toFixed(2),
        pendingAmount: pendingAmount.toFixed(2),
      }
    }

    return null
  }

  const paymentInfo = calculatePendingAmount()
  const hasPaymentDue = paymentInfo !== null

  return (
    <div className="flex items-center gap-2">
      <Avatar
        src={patient.photoPath}
        alt={patient.Name}
        sx={{ width: 40, height: 40 }}
      />
      <span className="flex items-center gap-1">
        {patient.Name}
        {/* Red dot indicator for pending payment - inline after name */}
        {!isLoadingPackage && hasPaymentDue && (
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#ff0000',
              border: '2px solid white',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
              display: 'inline-block',
              flexShrink: 0,
              marginLeft: '4px',
            }}
            title={`Payment Due: ₹${paymentInfo.pendingAmount}`}
          />
        )}
      </span>
    </div>
  )
}

function PatientRegistration() {
  const userDetails = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const [buttonSearchValue, setButtonSearchValue] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)

  const handleSearch = () => {
    setButtonSearchValue(searchValue.trim())
  }

  // Check permissions for different access types
  const hasReadAccess = usePermissionCheck('allPatients', [
    ACCESS_TYPES.READ,
    ACCESS_TYPES.WRITE,
  ])
  const hasWriteAccess = usePermissionCheck('allPatients', [ACCESS_TYPES.WRITE])

  const handleOpenPatientHistory = (patientInfo) => {
    setSelectedPatient(patientInfo)
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          patientHistoryId: patientInfo.patientId,
          activeVisitId: patientInfo.activeVisitId,
        },
      },
      undefined,
      { shallow: true },
    )
  }

  // Effect to handle URL params for patient history
  useEffect(() => {
    const { patientHistoryId, activeVisitId, returnPath } = router.query

    if (patientHistoryId) {
      setSelectedPatient({
        id: patientHistoryId,
        patientId: patientHistoryId,
        activeVisitId: activeVisitId,
      })
    } else {
      // Clear selectedPatient if patientHistoryId is not in query
      setSelectedPatient(null)
    }
  }, [router.query])

  // Effect to clear selectedPatient when navigating away from patient routes
  useEffect(() => {
    // Clear selectedPatient if we're not on a patient route
    if (!router.pathname.startsWith('/patient')) {
      setSelectedPatient(null)
    }
  }, [router.pathname])

  const baseColumns = [
    {
      field: 'Name',
      headerName: 'Name',
      width: 250,
      renderCell: (params) => (
        <PatientNameWithIndicator
          patient={params.row}
          userToken={userDetails?.accessToken}
        />
      ),
    },
    {
      field: 'city',
      headerName: 'City',
      width: 120,
      renderCell: ({ row }) => {
        return <>{row.city.name}</>
      },
    },
    { field: 'mobileNo', headerName: 'Mobile No', width: 120 },
    { field: 'patientId', headerName: 'Patient ID', width: 100 },
    {
      field: 'patientType',
      headerName: 'Type',
      width: 70,
      renderCell: ({ row }) => {
        return <>{row.patientType.name}</>
      },
    },

    {
      field: 'dateOfBirth',
      headerName: 'DOB',
      width: 100,
      renderCell: ({ row }) => {
        return <>{dayjs(row.dateOfBirth).format('DD-MM-YYYY')}</>
      },
    },

    {
      field: 'referralSource',
      headerName: 'Referral Source',
      width: 150,
      renderCell: ({ row }) => {
        return (
          <>
            {row?.referralSource?.referralSource
              ?.split(' ')
              ?.map(
                (word) =>
                  word?.charAt(0)?.toUpperCase() +
                  word?.slice(1)?.toLowerCase(),
              )
              .join(' ')}
          </>
        )
      },
    },
    {
      field: 'referralName',
      headerName: 'Referral Name',
      width: 150,
      renderCell: ({ row }) => {
        return (
          <>
            {row?.referralName
              ?.split(' ')
              ?.map(
                (word) =>
                  word?.charAt(0)?.toUpperCase() +
                  word?.slice(1)?.toLowerCase(),
              )
              .join(' ')}
          </>
        )
      },
    },
    { field: 'aadhaarNo', headerName: 'Aadhaar No', width: 120 },
    {
      field: 'registeredDate',
      headerName: 'Registered On',
      width: 120,
      renderCell: ({ row }) => {
        return <>{dayjs(row.registeredDate).format('DD-MM-YYYY')}</>
      },
    },
  ]

  // const sensitiveColumns = [
  //   {
  //     field: 'action',
  //     headerName: 'View',
  //     width: 100,
  //     renderCell: ({ row }) => {
  //       return <PermissionedViewButton row={row} router={router} />
  //     },
  //   },
  //   {
  //     field: 'patientHistory',
  //     headerName: 'Patient History',
  //     width: 150,
  //     renderCell: ({ row }) => {
  //       const patientInfo = {
  //         id: row.patientId,
  //         patientId: row.patientId,
  //         activeVisitId: row.activeVisitId,
  //       }
  //       return (
  //         <div>
  //           <PatientHistory patient={patientInfo} router={router} />
  //         </div>
  //       )
  //     },
  //   },
  // ]

  const actionColumn = useMemo(
    () => [
      {
        field: 'action',
        headerName: 'Action',
        width: 100,
        renderCell: ({ row }) => {
          return <PermissionedViewButton row={row} router={router} />
        },
      },
      {
        field: 'patientHistory',
        headerName: 'Patient History',
        width: 150,
        renderCell: ({ row }) => (
          <Button
            variant="outlined"
            className="capitalize"
            onClick={() =>
              handleOpenPatientHistory({
                id: row.patientId,
                patientId: row.patientId,
                activeVisitId: row.activeVisitId,
              })
            }
          >
            Patient History
          </Button>
        ),
      },
    ],
    [router, dispatch],
  )

  // Combine columns based on permissions
  const columns = [
    ...actionColumn,
    ...baseColumns,
    // ...(hasReadAccess ? sensitiveColumns : []),
    // ...(hasWriteAccess ? actionColumn : []),
  ]

  const allPatients = useQuery({
    queryKey: ['allPatients', buttonSearchValue],
    queryFn: () => getAllPatients(userDetails?.accessToken, buttonSearchValue),
    // refetchInterval: 10000,
    // refetchIntervalInBackground: true,
    // staleTime: 10000,
    // cacheTime: 10000,
  })
  // console.log(allPatients)
  const patientCustomFilters = [
    {
      field: 'city.name',
      label: 'City',
      type: 'select',
      options: allPatients?.data?.data
        ? [...new Set(allPatients.data.data.map((row) => row.city.name))]
        : [],
    },
    {
      field: 'patientType.name',
      label: 'Patient Type',
      type: 'select',
      options: allPatients?.data?.data
        ? [...new Set(allPatients.data.data.map((row) => row.patientType.name))]
        : [],
    },
    {
      field: 'referralSource.referralSource',
      label: 'Referral Source',
      type: 'select',
      options: allPatients?.data?.data
        ? [
            ...new Set(
              allPatients?.data?.data.map(
                (row) => row.referralSource.referralSource,
              ),
            ),
          ]
        : [],
    },
  ]

  const getUniqueValues = (field) => {
    if (!allPatients?.data?.data) return []

    if (field === 'city.name') {
      return [...new Set(allPatients?.data?.data.map((row) => row.city.name))]
    }

    if (field === 'patientType.name') {
      return [
        ...new Set(allPatients?.data?.data.map((row) => row.patientType.name)),
      ]
    }

    if (field === 'referralSource.referralSource') {
      return [
        ...new Set(
          allPatients?.data?.data.map(
            (row) => row.referralSource.referralSource,
          ),
        ),
      ]
    }

    return []
  }

  return (
    <div className="grid grid-cols-5 ">
      <div className="w-full col-span-5 flex flex-col items-center justify-center">
        {/* {
          allPatients.isLoading && <div>Loading...</div>
        } */}
        <div className="px-3 py-2 flex items-center justify-center gap-5">
          <TextField
            placeholder="Search by Patient ID / Mobile / Name / Aadhaar"
            className="w-[350px] md:w-[450px] lg:w-[500px] bg-white"
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch()
              }
            }}
          />
          <Button
            onClick={handleSearch}
            variant="contained"
            sx={{ color: 'white' }}
            startIcon={<SearchOutlined />}
          >
            Search
          </Button>
        </div>

        {allPatients.isError && <div>{allPatients.error.message}</div>}
        {/* {allPatients?.isSuccess && */}
        <div style={{ height: '75vh', width: '100%' }}>
          {allPatients.isLoading || allPatients.isFetching ? (
            <div
              className="flex justify-center items-center"
              style={{ height: '100%' }}
            >
              <CircularProgress />
            </div>
          ) : (
            <FilteredDataGrid
              rows={
                allPatients?.data?.data?.length > 0
                  ? allPatients?.data?.data
                  : []
              }
              getRowId={(row) => row.patientId}
              columns={columns}
              className="m-5 p-3 bg-white"
              loading={allPatients.isLoading}
              customFilters={patientCustomFilters}
              filterData={patientFilterData}
              getUniqueValues={getUniqueValues}
              disableRowSelectionOnClick
              // slotProps={{
              //   loadingOverlay: {
              //     variant: 'skeleton',
              //     noRowsVariant: 'skeleton',
              //   },
              // }}
              // initialState={{
              //   pagination: {
              //     paginationModel: {
              //       pageSize: 6,
              //     },
              //   },
              // }}
            />
          )}
        </div>
        {/* } */}
      </div>

      {/* Render PatientHistory outside the DataGrid */}
      {selectedPatient && (
        <PatientHistory
          patient={selectedPatient}
          onClose={() => {
            setSelectedPatient(null)
            // Check if we should return to previous page
            const {
              returnPath,
              patientHistoryId,
              activeVisitId,
              ...restQuery
            } = router.query
            if (returnPath) {
              router.push(returnPath)
            } else {
              // Normal close behavior for patient page
              router.push(
                {
                  pathname: router.pathname,
                  query: restQuery,
                },
                undefined,
                { shallow: true },
              )
            }
          }}
        />
      )}
    </div>
  )
}

export default PatientRegistration
