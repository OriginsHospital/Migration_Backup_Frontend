import Breadcrumb from '@/components/Breadcrumb'
import SalesDashboard from '@/components/SalesDashboard'
import { withPermission } from '@/components/withPermission'
import { getBranches, SalesReportDashboard } from '@/constants/apis'
import { ACCESS_TYPES } from '@/constants/constants'
import {
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Button,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import React, { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { hasRevenueAccess } from '@/utils/revenueAccess'

function Sales() {
  const router = useRouter()
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const [fromDate, setFromDate] = useState(new Date())
  const [toDate, setToDate] = useState(new Date())
  const [branchId, setBranchId] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [activeView, setActiveView] = useState('sales') // 'sales' or 'refunds'
  const [filteredData, setFilteredData] = useState(null)

  // Applied filters (used to trigger API)
  const [appliedFromDate, setAppliedFromDate] = useState(null)
  const [appliedToDate, setAppliedToDate] = useState(null)
  const [appliedBranchId, setAppliedBranchId] = useState('')

  // Access control: Check if user has revenue access
  useEffect(() => {
    if (userDetails?.email && !hasRevenueAccess(userDetails.email)) {
      toast.error(
        'You do not have permission to access Revenue Reports.',
        toastconfig,
      )
      router.replace('/home')
      return
    }
  }, [userDetails?.email, router])

  useEffect(() => {
    if (dropdowns?.branches?.length > 0) {
      setBranchId(dropdowns.branches[0].id)
    }
  }, [dropdowns])

  // Initialize applied filters once branch is available
  useEffect(() => {
    if (branchId && !appliedBranchId) {
      setAppliedBranchId(branchId)
      setAppliedFromDate(fromDate)
      setAppliedToDate(toDate)
    }
  }, [branchId, fromDate, toDate])

  const { data: branchCatalog = [] } = useQuery({
    queryKey: ['revenueBranchCatalog', userDetails?.accessToken],
    queryFn: async () => {
      const result = await getBranches(userDetails?.accessToken)
      return Array.isArray(result?.data) ? result.data : []
    },
    enabled: Boolean(userDetails?.accessToken),
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: salesDashboardData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'salesDashboardData',
      userDetails.accessToken,
      appliedFromDate,
      appliedToDate,
      appliedBranchId,
    ],
    queryFn: async () => {
      console.log('Revenue API Call:', {
        token: userDetails?.accessToken ? 'Present' : 'Missing',
        fromDate: appliedFromDate
          ? dayjs(appliedFromDate).format('YYYY-MM-DD')
          : 'Missing',
        toDate: appliedToDate
          ? dayjs(appliedToDate).format('YYYY-MM-DD')
          : 'Missing',
        branchId: appliedBranchId || 'Missing',
      })
      try {
        const response = await SalesReportDashboard(
          userDetails?.accessToken,
          dayjs(appliedFromDate).format('YYYY-MM-DD'),
          dayjs(appliedToDate).format('YYYY-MM-DD'),
          appliedBranchId,
        )
        console.log('Revenue API Response:', response)
        return response.data
      } catch (error) {
        // Handle 403 Forbidden (unauthorized access)
        if (
          error?.message?.includes('Access restricted') ||
          error?.response?.status === 403
        ) {
          toast.error(
            'You do not have permission to access Revenue Reports.',
            toastconfig,
          )
          router.replace('/home')
          throw error
        }
        throw error
      }
    },
    enabled:
      userDetails.accessToken &&
      appliedBranchId &&
      appliedFromDate &&
      appliedToDate
        ? true
        : false,
  })

  useEffect(() => {
    if (salesDashboardData) {
      let filtered = salesDashboardData

      // Apply payment mode filter if selected
      if (paymentMode) {
        const filteredSalesData =
          salesDashboardData.salesData?.filter(
            (item) => item.paymentMode === paymentMode,
          ) || []

        const filteredReturnData =
          salesDashboardData.returnData?.filter(
            (item) => item.paymentMode === paymentMode,
          ) || []

        // Recalculate totals from filtered data
        const totalSales = filteredSalesData.reduce(
          (sum, item) => sum + (item.amount || 0),
          0,
        )
        const totalReturns = filteredReturnData.reduce(
          (sum, item) => sum + (Math.abs(item.amount) || 0),
          0,
        )

        filtered = {
          ...salesDashboardData,
          salesData: filteredSalesData,
          returnData: filteredReturnData,
          salesDashboard: {
            ...salesDashboardData.salesDashboard,
            totalSales: totalSales,
            totalReturns: totalReturns,
          },
        }
      }

      setFilteredData(filtered)
    }
  }, [salesDashboardData, paymentMode])

  const handleApplyFilters = () => {
    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
    setAppliedBranchId(branchId)
  }

  const handleResetFilters = () => {
    const defaultFrom = dayjs().subtract(30, 'day').toDate()
    const defaultTo = new Date()
    const defaultBranch = dropdowns?.branches?.[0]?.id || ''
    setFromDate(defaultFrom)
    setToDate(defaultTo)
    setBranchId(defaultBranch)
    setPaymentMode('')
    setFilteredData(null)
    setAppliedFromDate(defaultFrom)
    setAppliedToDate(defaultTo)
    setAppliedBranchId(defaultBranch)
  }

  // Revenue page is HIDDEN from all users
  return null

  return (
    <div>
      <div className="m-5">
        <Breadcrumb />
      </div>
      <div className="flex flex-wrap gap-5 p-5 ">
        {/* Summary Cards in a row */}
        <div className="flex gap-4">
          <div
            onClick={() => setActiveView('sales')}
            style={{ cursor: 'pointer' }}
          >
            <SummaryCard
              title="Total Sales"
              value={`₹${(
                filteredData?.salesDashboard?.totalSales ||
                salesDashboardData?.salesDashboard?.totalSales ||
                0
              ).toLocaleString('en-IN')}`}
              isActive={activeView === 'sales'}
              minWidth="125px"
            />
          </div>
          <div
            onClick={() => setActiveView('refunds')}
            style={{ cursor: 'pointer' }}
          >
            <SummaryCard
              title={'Total Refunds'}
              value={`₹${(
                filteredData?.salesDashboard?.totalReturns ||
                salesDashboardData?.salesDashboard?.totalReturns ||
                0
              ).toLocaleString('en-IN')}`}
              isActive={activeView === 'refunds'}
              minWidth="125px"
            />
          </div>
        </div>
        <DatePicker
          label="From Date"
          // disabled={isEdit == 'noneditable'}
          sx={{ width: '150px' }}
          value={fromDate ? dayjs(fromDate) : null}
          name="fromDate"
          format="DD/MM/YYYY"
          onChange={(newValue) => setFromDate(newValue)}
        />
        <DatePicker
          label="To Date"
          // disabled={isEdit == 'noneditable'}
          format="DD/MM/YYYY"
          className="bg-white rounded-lg"
          sx={{ width: '150px' }}
          value={toDate ? dayjs(toDate) : null}
          name="fromDate"
          onChange={(newValue) => setToDate(newValue)}
        />
        <Grid item xs={12} sm={3}>
          <FormControl
            variant="outlined"
            className="bg-white"
            sx={{ width: '125px' }}
          >
            <InputLabel>Branch</InputLabel>
            <Select
              label="Branch"
              name="branchId"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="flex"
              placeholder="branch"
            >
              {dropdowns?.branches?.map((branch, idx) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.branchCode || branch.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {/* NIKKI PAYMENT MODE FILTER 28/10/25*/}
        <Grid item xs={12} sm={3}>
          <FormControl
            variant="outlined"
            className="bg-white"
            sx={{ width: '175px' }}
          >
            <InputLabel>Payment Mode</InputLabel>
            <Select
              label="Payment Mode"
              name="paymentMode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="flex"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="UPI">Upi</MenuItem>
            </Select>
          </FormControl>
          {/* NIKKI PAYMENT MODE FILTER 28/10/25*/}
        </Grid>
        <div className="flex items-end gap-3">
          <Button
            variant="contained"
            onClick={handleApplyFilters}
            disabled={!branchId}
          >
            Apply
          </Button>
          <Button variant="outlined" onClick={handleResetFilters}>
            Reset
          </Button>
        </div>
      </div>
      {isLoading && (
        <div className="px-5 text-sm text-gray-500">
          Loading revenue data...
        </div>
      )}
      {isError && (
        <div className="px-5 text-sm text-red-500">
          Failed to load revenue data
          {error?.message ? `: ${error.message}` : ''}
        </div>
      )}
      <SalesDashboard
        data={filteredData || salesDashboardData}
        branchId={appliedBranchId}
        showBranchColumn={appliedBranchId === 'ALL'}
        branchCatalog={branchCatalog}
        dropdownBranches={dropdowns?.branches || []}
        reportName="Revenue_Report"
        reportType="revenue"
        branchName={
          dropdowns?.branches?.find((branch) => branch.id === appliedBranchId)
            ?.name
        }
        filters={{
          fromDate: appliedFromDate
            ? dayjs(appliedFromDate).format('YYYY-MM-DD')
            : '',
          toDate: appliedToDate
            ? dayjs(appliedToDate).format('YYYY-MM-DD')
            : '',
          branchId: appliedBranchId,
        }}
        activeView={activeView}
      />
    </div>
  )
}
const SummaryCard = ({ title, value, isActive, minWidth = '125px' }) => (
  <Card
    className="row-span-1"
    style={{
      minWidth: minWidth,
      maxHeight: '60px',
      backgroundColor: isActive ? '#b0e9fa' : 'white',
      // border: isActive ? '1px solid #0ea5e9' : '1px solid #e5e7eb',
    }}
  >
    <CardContent className="p-2 flex flex-col justify-between">
      <span className="text-xs font-medium text-secondary">{title}</span>
      <span className="text-lg font-bold ">{value}</span>
    </CardContent>
  </Card>
)

export default Sales
