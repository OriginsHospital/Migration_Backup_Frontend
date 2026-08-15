import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  ReturnItems,
  SaleReturnInfo,
  getPharmacyRefundLogs,
  getPurchaseReturnInfo,
  returnPurchasedItems,
} from '@/constants/apis'
import { toast } from 'react-toastify'
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  Alert,
} from '@mui/material'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { showLoader, hideLoader } from '@/redux/loaderSlice'
import Breadcrumb from '@/components/Breadcrumb'
import { toastconfig } from '@/utils/toastconfig'
import dayjs from 'dayjs'

const getUndiscountedLineTotal = (purchaseDetails) => {
  if (!Array.isArray(purchaseDetails)) return 0
  return purchaseDetails.reduce((sum, pd) => {
    const qty = Number(pd?.initialUsedQuantity ?? pd?.usedQuantity ?? 0)
    return sum + Number(pd?.mrpPerTablet || 0) * qty
  }, 0)
}

const getPharmacyLinePaidRatio = (
  orderSummary,
  purchasedItems,
  orderDiscountMultiplier,
) => {
  const totalOrderAmount = Number(orderSummary?.totalOrderAmount || 0)
  const paidOrderAmount = Number(orderSummary?.paidOrderAmount ?? 0)
  const sumLineTotals = (purchasedItems || []).reduce(
    (sum, item) => sum + Number(item?.totalCost || 0),
    0,
  )

  if (
    sumLineTotals > 0 &&
    paidOrderAmount >= 0 &&
    Math.abs(sumLineTotals - paidOrderAmount) < 0.05
  ) {
    return 1
  }

  if (totalOrderAmount > 0) {
    return orderDiscountMultiplier
  }

  if (sumLineTotals > 0 && paidOrderAmount >= 0) {
    return paidOrderAmount / sumLineTotals
  }

  return orderDiscountMultiplier
}

const getLineTotalBasis = (item) => {
  const storedLineTotal = Number(item?.totalCost)
  const hasStoredLineTotal =
    item?.totalCost !== undefined &&
    item?.totalCost !== null &&
    !Number.isNaN(storedLineTotal)
  if (hasStoredLineTotal) {
    return storedLineTotal
  }
  return getUndiscountedLineTotal(
    item?.purchaseDetails || item?.allPurchaseDetails,
  )
}

const getLinePaidEffective = (item, linePaidRatio) => {
  const lineTotalBasis = getLineTotalBasis(item)
  if (lineTotalBasis === 0) {
    return 0
  }
  return lineTotalBasis * Number(linePaidRatio || 1)
}

const getOrderDiscountMeta = (orderSummary) => {
  const totalOrderAmount = Number(orderSummary?.totalOrderAmount || 0)
  const paidOrderAmount = Number(orderSummary?.paidOrderAmount || 0)
  const discountAmount = Number(orderSummary?.discountAmount || 0)
  const hasOrderDiscount =
    totalOrderAmount > 0 &&
    paidOrderAmount >= 0 &&
    paidOrderAmount < totalOrderAmount
  const orderPaidRatio = hasOrderDiscount
    ? paidOrderAmount / totalOrderAmount
    : 1
  const orderDiscountPercent = hasOrderDiscount
    ? Math.round((1 - orderPaidRatio) * 10000) / 100
    : 0
  return {
    totalOrderAmount,
    paidOrderAmount,
    discountAmount,
    hasOrderDiscount,
    orderPaidRatio,
    orderDiscountPercent,
    couponCode: orderSummary?.couponCode || null,
  }
}

/** Refund uses the line's paid amount (after order-level discount), split evenly per tablet. */
const getLinePaidAmount = (item) =>
  Number(
    item?.paidLineEffective ??
      getLinePaidEffective(
        item,
        item?.linePaidRatio ?? item?.discountMultiplier ?? 1,
      ),
  )

const getRefundUnitPrice = (item) => {
  const purchaseQty = Number(item?.purchaseQuantity || 0)
  const paidLine = getLinePaidAmount(item)
  if (paidLine <= 0 || purchaseQty <= 0) return 0
  return paidLine / purchaseQty
}

const computeRefundAmountForItem = (item, returnQty) => {
  const purchaseQty = Number(item?.purchaseQuantity || 0)
  const paidLine = getLinePaidAmount(item)
  if (purchaseQty <= 0 || returnQty <= 0 || paidLine <= 0) return 0
  return paidLine * (returnQty / purchaseQty)
}

function SaleReturnPage() {
  const router = useRouter()
  const { tab = '0', orderId: urlOrderId = '' } = router.query

  const [activeTab, setActiveTab] = useState(parseInt(tab))
  const [orderId, setOrderId] = useState(urlOrderId)
  const [id, setId] = useState(urlOrderId)
  const [saleDetails, setSaleDetails] = useState(null)
  const [flattenedPurchaseDetails, setFlattenedPurchaseDetails] = useState([])
  const [itemReturnHistory, setItemReturnHistory] = useState([])
  const [nonPharmacyDetails, setNonPharmacyDetails] = useState(null)
  const user = useSelector((store) => store.user)
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  // Update URL when tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    router.push(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          tab: newValue,
          // Preserve current orderId across tabs so refund logs can be fetched/viewed.
          orderId: orderId || id || '',
        },
      },
      undefined,
      { shallow: true },
    )
    // Keep searched order context while switching tabs.
    // Only reset tab-specific details as needed.
    if (newValue === 2) {
      setNonPharmacyDetails(null)
    }
  }

  // Effect to sync with URL parameters on initial load and URL changes
  useEffect(() => {
    if (router.isReady) {
      const tabValue = parseInt(router.query.tab || '0')
      const orderIdValue = router.query.orderId || ''

      setActiveTab(tabValue)
      if (orderIdValue) {
        setOrderId(orderIdValue)
        setId(orderIdValue)
      } else {
        // Only clear if orderId is explicitly removed from URL
        setOrderId('')
        setId('')
        setSaleDetails(null)
        setFlattenedPurchaseDetails([])
        setItemReturnHistory([])
        setNonPharmacyDetails(null)
      }
    }
  }, [router.isReady, router.query.tab, router.query.orderId])

  const getSaleReturnInfo = async () => {
    if (!orderId) {
      toast.error('Please enter order id', toastconfig)
    } else {
      // Update URL with new orderId while preserving tab
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            orderId: orderId,
          },
        },
        undefined,
        { shallow: true },
      )
      queryClient.invalidateQueries({
        queryKey: ['fetchSalesReturnInfoData', orderId, activeTab],
      })
      setId(orderId)
    }
  }

  const {
    data: salesData,
    isLoading: isSalesFetchLoading,
    error: salesError,
  } = useQuery({
    queryKey: ['fetchSalesReturnInfoData', id, activeTab],
    enabled: !!id && (activeTab === 0 || activeTab === 2),
    queryFn: async () => {
      const responsejson = await SaleReturnInfo(user?.accessToken, id)
      console.log('Full API Response:', responsejson)

      if (responsejson.status == 200) {
        // Handle case where orderInformation might be null or empty
        if (!responsejson.data?.orderInformation) {
          console.error('No orderInformation in response:', responsejson.data)
          setSaleDetails(null)
          setFlattenedPurchaseDetails([])
          throw new Error(
            'No order information found for this order ID. The order may not exist or may not be in PAID status.',
          )
        }

        console.log('Sale Return Data:', responsejson.data)
        console.log('Order Information:', responsejson.data.orderInformation)
        setItemReturnHistory(responsejson.data?.itemReturnHistory || [])

        // Check if orderInformation is an object or array
        const orderInfo = responsejson.data.orderInformation
        let orderInfoData = null

        if (Array.isArray(orderInfo) && orderInfo.length > 0) {
          orderInfoData = orderInfo[0]
          setSaleDetails(orderInfo[0])
        } else if (orderInfo && typeof orderInfo === 'object') {
          orderInfoData = orderInfo
          setSaleDetails(orderInfo)
        } else {
          console.error('Invalid orderInformation structure:', orderInfo)
          setSaleDetails(null)
          setFlattenedPurchaseDetails([])
          setItemReturnHistory(responsejson.data?.itemReturnHistory || [])
          throw new Error('Invalid order information structure')
        }

        // Map the purchased items structure to match invoice format
        // Each item should be one row with aggregated purchase details
        const flattened = []
        let orderSummary = orderInfoData.orderSummary || {}
        if (typeof orderSummary === 'string') {
          try {
            orderSummary = JSON.parse(orderSummary)
          } catch (err) {
            orderSummary = {}
          }
        }
        const orderDiscountMeta = getOrderDiscountMeta(orderSummary)
        const {
          totalOrderAmount,
          paidOrderAmount,
          discountAmount,
          hasOrderDiscount,
          orderPaidRatio,
          orderDiscountPercent,
          couponCode: orderCouponCode,
        } = orderDiscountMeta
        let discountMultiplier = orderPaidRatio

        if (totalOrderAmount > 0) {
          if (paidOrderAmount > 0 && paidOrderAmount <= totalOrderAmount) {
            discountMultiplier = paidOrderAmount / totalOrderAmount
          } else if (discountAmount > 0 && discountAmount < totalOrderAmount) {
            discountMultiplier =
              (totalOrderAmount - discountAmount) / totalOrderAmount
          }
        }

        const purchasedItemsList = Array.isArray(orderInfoData.purchasedItems)
          ? orderInfoData.purchasedItems
          : []
        const linePaidRatio = getPharmacyLinePaidRatio(
          orderSummary,
          purchasedItemsList,
          discountMultiplier,
        )

        // Check if purchasedItems exists and is an array
        if (!orderInfoData?.purchasedItems) {
          console.warn('No purchasedItems in orderInfoData:', orderInfoData)
          console.warn(
            'Full orderInfoData structure:',
            JSON.stringify(orderInfoData, null, 2),
          )
          // If purchasedItems is null/undefined, try to handle it gracefully
          setFlattenedPurchaseDetails([])
          setItemReturnHistory(responsejson.data?.itemReturnHistory || [])
          // Still set saleDetails so patient info shows
          // This might happen if the SQL query failed to parse orderDetails JSON
          toast.warning(
            'Order found but purchase items could not be retrieved. The order details may need to be verified in the database.',
            toastconfig,
          )
          return responsejson.data
        }

        if (Array.isArray(orderInfoData.purchasedItems)) {
          console.log('Purchased Items Array:', orderInfoData.purchasedItems)
          console.log(
            'Purchased Items Count:',
            orderInfoData.purchasedItems.length,
          )

          if (orderInfoData.purchasedItems.length === 0) {
            console.warn(
              'purchasedItems array is empty - this might indicate a data parsing issue',
            )
            console.warn(
              'Order exists but no items were parsed from orderDetails JSON',
            )
            setFlattenedPurchaseDetails([])
            setItemReturnHistory(responsejson.data?.itemReturnHistory || [])
            toast.warning(
              'Order found but no purchase items were retrieved. This may indicate the order details structure needs to be verified.',
              toastconfig,
            )
            return responsejson.data
          }

          orderInfoData.purchasedItems.forEach((item) => {
            const purchaseQty = item.purchaseQuantity || 0
            const paidLineTotal = Number(item.totalCost || 0)
            const undiscountedLineTotal = getUndiscountedLineTotal(
              item.purchaseDetails,
            )
            const lineTotalBasis =
              paidLineTotal > 0 ? paidLineTotal : undiscountedLineTotal
            const paidLineEffective = getLinePaidEffective(item, linePaidRatio)
            const ratePerUnit =
              purchaseQty > 0 ? paidLineEffective / purchaseQty : 0
            const mrpRatePerUnit =
              purchaseQty > 0 && undiscountedLineTotal > 0
                ? undiscountedLineTotal / purchaseQty
                : ratePerUnit
            const hasItemCoupon =
              paidLineTotal === 0 && undiscountedLineTotal > 0
            const lineHasOrderDiscount =
              !hasItemCoupon && hasOrderDiscount && linePaidRatio < 0.999

            // Aggregate purchase details if available
            let aggregatedDetails = {
              grnIds: [],
              batchNos: [],
              expiryDates: [],
              mrpPerTablet: 0,
              usedQuantity: 0,
            }

            if (
              item.purchaseDetails &&
              Array.isArray(item.purchaseDetails) &&
              item.purchaseDetails.length > 0
            ) {
              let mrpWeightedSum = 0
              let mrpQtySum = 0
              // Aggregate all purchase details for this item
              item.purchaseDetails.forEach((detail) => {
                if (detail.grnId) aggregatedDetails.grnIds.push(detail.grnId)
                if (detail.batchNo)
                  aggregatedDetails.batchNos.push(detail.batchNo)
                if (detail.expiryDate)
                  aggregatedDetails.expiryDates.push(detail.expiryDate)
                const qty = Number(
                  detail.initialUsedQuantity ?? detail.usedQuantity ?? 0,
                )
                const mrp = Number(detail.mrpPerTablet || 0)
                if (qty > 0 && mrp > 0) {
                  mrpWeightedSum += mrp * qty
                  mrpQtySum += qty
                }
                if (detail.usedQuantity) {
                  aggregatedDetails.usedQuantity += detail.usedQuantity || 0
                }
              })
              aggregatedDetails.mrpPerTablet =
                mrpQtySum > 0 ? mrpWeightedSum / mrpQtySum : 0
            }

            // Create one row per item (matching invoice structure)
            flattened.push({
              itemName: item.itemName || 'N/A',
              refId: item.refId,
              itemId: item.itemId || item.refId,
              // Use first grnId if available, otherwise null
              grnId: aggregatedDetails.grnIds[0] || null,
              grnNo: aggregatedDetails.grnIds[0] || 'N/A',
              // Purchase quantity from invoice
              purchaseQuantity: purchaseQty,
              mrpPerTablet: aggregatedDetails.mrpPerTablet || mrpRatePerUnit,
              mrpRatePerUnit,
              ratePerUnit,
              paidRatePerUnit: ratePerUnit,
              lineTotalBeforeDiscount: lineTotalBasis,
              paidLineTotal,
              paidLineEffective,
              undiscountedLineTotal,
              linePaidRatio,
              hasItemCoupon,
              hasOrderDiscount: lineHasOrderDiscount,
              orderDiscountPercent,
              orderCouponCode,
              // Return quantity (already returned)
              returnQuantity: item.returnQuantity || 0,
              // Batch numbers (comma-separated if multiple)
              batchNo:
                aggregatedDetails.batchNos.length > 0
                  ? aggregatedDetails.batchNos.join(', ')
                  : 'N/A',
              // Expiry dates (comma-separated if multiple)
              expiryDate:
                aggregatedDetails.expiryDates.length > 0
                  ? aggregatedDetails.expiryDates[0] // Use first expiry date
                  : null,
              // Used quantity (aggregated)
              usedQuantity: aggregatedDetails.usedQuantity || 0,
              totalCost: paidLineEffective,
              discountMultiplier: linePaidRatio,
              // Store all purchase details for reference
              allPurchaseDetails: item.purchaseDetails || [],
            })
          })

          console.log('Mapped Purchase Details (Invoice Format):', flattened)
          setFlattenedPurchaseDetails(flattened)

          if (flattened.length === 0) {
            console.warn('No items mapped from purchasedItems array')
          }
        } else {
          console.error(
            'purchasedItems is not an array:',
            typeof orderInfoData.purchasedItems,
            orderInfoData.purchasedItems,
          )
          setFlattenedPurchaseDetails([])
          setItemReturnHistory(responsejson.data?.itemReturnHistory || [])
        }

        return responsejson.data
      } else {
        // Handle non-200 status codes
        const errorMessage =
          responsejson.message ||
          responsejson.error ||
          'Error occurred while fetching medicine details for pharmacy'
        console.error('API Error Response:', responsejson)
        setSaleDetails(null)
        setFlattenedPurchaseDetails([])
        setItemReturnHistory([])
        throw new Error(errorMessage)
      }
    },
    onError: (err) => {
      console.error('Query Error:', err)
      const errorMessage = err.message || 'Failed to fetch sale return data'
      toast.error(errorMessage, toastconfig)
      setSaleDetails(null)
      setFlattenedPurchaseDetails([])
      setItemReturnHistory([])
    },
  })

  useQuery({
    queryKey: ['fetchPharmacyRefundLogs', id, activeTab],
    // On logs tab, fetch even without order id (show all logs).
    // On refund tab, keep fetch scoped to current order id for remaining qty.
    enabled: activeTab === 2 || (activeTab === 0 && !!id),
    queryFn: async () => {
      const responsejson = await getPharmacyRefundLogs(
        user?.accessToken,
        id || '',
      )
      if (responsejson.status === 200) {
        setItemReturnHistory(
          Array.isArray(responsejson.data) ? responsejson.data : [],
        )
      } else {
        setItemReturnHistory([])
        throw new Error(responsejson.message || 'Failed to fetch refund logs')
      }
      return responsejson.data
    },
    onError: (err) => {
      setItemReturnHistory([])
      toast.error(err.message || 'Failed to fetch refund logs', toastconfig)
    },
  })

  const {
    data: nonPharmacyData,
    isLoading: isNonPharmacyFetchLoading,
    error: nonPharmacyError,
  } = useQuery({
    queryKey: ['fetchPurchaseReturnInfoData', id, activeTab],
    enabled: !!id && activeTab === 1,
    queryFn: async () => {
      const responsejson = await getPurchaseReturnInfo(user?.accessToken, id)
      if (responsejson.status == 200) {
        if (!responsejson.data?.orderInformation?.length) {
          setNonPharmacyDetails(null)
          throw new Error('No data found for this order ID')
        }
        const orderInfo = responsejson.data.orderInformation[0]
        if (!orderInfo.purchasedItems?.length) {
          setNonPharmacyDetails(null)
          throw new Error('No items found for this order')
        }
        setNonPharmacyDetails({
          patientDetails: orderInfo.patientDetails,
          purchaseDetails: orderInfo.purchasedItems.map((item) => ({
            ...item,
            quantity: 1, // Since quantity is not provided in the response
            price: item.totalCost,
          })),
        })
        return responsejson.data
      } else {
        setNonPharmacyDetails(null)
        throw new Error(
          'Error occurred while fetching non-pharmacy item details',
        )
      }
    },
    onError: (err) => {
      toast.error(
        'Failed to fetch non-pharmacy return data: ' + err.message,
        toastconfig,
      )
    },
  })

  useEffect(() => {
    if (isSalesFetchLoading || isNonPharmacyFetchLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
    return () => {
      dispatch(hideLoader())
    }
  }, [isSalesFetchLoading, isNonPharmacyFetchLoading])

  return (
    <div className="flex flex-col px-5 w-full mx-auto">
      <span className="m-5">
        <Breadcrumb />
      </span>

      <Card className="mb-5">
        <CardContent className="flex flex-col justify-center items-center w-full">
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              width: '100%',
              mb: 3,
            }}
          >
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Pharmacy Items" />
              <Tab label="Non-Pharmacy Items" />
              <Tab label="Refund Logs & Invoices" />
            </Tabs>
          </Box>
          <div className="flex gap-3 items-center justify-between w-2/4">
            <TextField
              name="orderID"
              label="Enter Order Id"
              fullWidth
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
            <Button
              onClick={getSaleReturnInfo}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  getSaleReturnInfo()
                }
              }}
              variant="contained"
              color="primary"
              className="text-white capitalize"
              // size="small"
            >
              Fetch
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeTab === 0 && (
        <>
          {saleDetails ? (
            <>
              <PatientDetails details={saleDetails.patientDetails} />
              <PurchaseDetails
                details={flattenedPurchaseDetails}
                headerDetails={saleDetails.patientDetails}
                type={saleDetails.type}
                orderId={orderId}
                returnHistory={itemReturnHistory}
                orderDiscountMeta={getOrderDiscountMeta(
                  typeof saleDetails.orderSummary === 'string'
                    ? (() => {
                        try {
                          return JSON.parse(saleDetails.orderSummary)
                        } catch {
                          return {}
                        }
                      })()
                    : saleDetails.orderSummary || {},
                )}
              />
            </>
          ) : (
            id &&
            !isSalesFetchLoading && (
              <Card className="mt-4">
                <CardContent>
                  <Typography
                    variant="body1"
                    color="error"
                    className="text-center"
                  >
                    No pharmacy items found for this order ID
                  </Typography>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      {activeTab === 1 && (
        <>
          {nonPharmacyDetails ? (
            <>
              <PatientDetails details={nonPharmacyDetails.patientDetails} />
              <NonPharmacyPurchaseDetails
                details={nonPharmacyDetails.purchaseDetails}
                headerDetails={nonPharmacyDetails.patientDetails}
                orderId={orderId}
              />
            </>
          ) : (
            id &&
            !isNonPharmacyFetchLoading && (
              <Card className="mt-4">
                <CardContent>
                  <Typography variant="body1" className="text-center">
                    No non-pharmacy items found for this order ID
                  </Typography>
                </CardContent>
              </Card>
            )
          )}
        </>
      )}

      {activeTab === 2 && (
        <RefundLogs details={itemReturnHistory} orderId={orderId} />
      )}
    </div>
  )
}

const PatientDetails = ({ details }) => {
  if (!details) return null

  return (
    <Card className="mb-5">
      <CardContent>
        {/* <Typography variant="h6" className="mb-3">
          Patient Details
        </Typography> */}
        <div className="grid grid-cols-4 gap-4">
          {/* {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <Typography variant="subtitle2" color="textSecondary">
                {key.charAt(0).toUpperCase() +
                  key.slice(1).replace(/([A-Z])/g, ' $1')}
              </Typography>
              <Typography variant="body1">{value}</Typography>
            </div>
          ))} */}
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Patient
            </Typography>
            <Typography variant="body1">{details.patientName}</Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Purchase Type
            </Typography>
            <Typography variant="body1">{details.purchaseType}</Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Appointment Date
            </Typography>
            <Typography variant="body1">
              {dayjs(details.appointmentDate).format('DD-MM-YYYY')}
            </Typography>
          </div>
          <div>
            <Typography variant="subtitle2" color="textSecondary">
              Doctor
            </Typography>
            <Typography variant="body1">{details.doctorName}</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const PurchaseDetails = ({
  details,
  headerDetails,
  type,
  orderId,
  returnHistory,
  orderDiscountMeta = {},
}) => {
  // State to track return quantities by refId and grnId
  const [returnQuantities, setReturnQuantities] = useState({})
  const [refundMethod, setRefundMethod] = useState('CASH') // Default refund method
  const [selectedItems, setSelectedItems] = useState({}) // Track selected items for refund
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector((store) => store.user)
  const userBranches = user?.branchDetails || []
  const [refundBranchId, setRefundBranchId] = useState(
    () => userBranches[0]?.id || '',
  )
  useEffect(() => {
    if (!refundBranchId && userBranches.length > 0) {
      setRefundBranchId(userBranches[0]?.id || '')
    }
  }, [refundBranchId, userBranches])

  const returnedByRefId = React.useMemo(() => {
    const map = {}
    const logs = Array.isArray(returnHistory) ? returnHistory : []
    logs.forEach((log) => {
      // Some APIs return one line per return, some return a nested returnDetails array/string.
      if (log?.refId) {
        const qty = Number(log?.returnQuantity || log?.returnedQuantity || 0)
        map[log.refId] =
          (map[log.refId] || 0) + (Number.isFinite(qty) ? qty : 0)
        return
      }

      let lines = []
      if (Array.isArray(log?.returnDetails)) lines = log.returnDetails
      else if (typeof log?.returnDetails === 'string') {
        try {
          const parsed = JSON.parse(log.returnDetails)
          if (Array.isArray(parsed)) lines = parsed
        } catch (_) {
          // ignore parse failures
        }
      }

      lines.forEach((line) => {
        const refId = line?.refId || line?.itemRefId || line?.itemId
        if (!refId) return
        let qty = Number(line?.returnQuantity || line?.returnedQuantity || 0)
        if (!qty && Array.isArray(line?.returnInfo)) {
          qty = line.returnInfo.reduce(
            (sum, row) => sum + Number(row?.returnQuantity || 0),
            0,
          )
        }
        map[refId] = (map[refId] || 0) + (Number.isFinite(qty) ? qty : 0)
      })
    })
    return map
  }, [returnHistory])

  const getRemainingReturnQty = (item) => {
    const historyReturned = Number(returnedByRefId?.[item?.refId] || 0)

    // Prefer per-GRN sold quantity because backend validates at GRN level.
    const purchaseDetails = Array.isArray(item?.allPurchaseDetails)
      ? item.allPurchaseDetails
      : []
    if (purchaseDetails.length > 0) {
      const sold = purchaseDetails.reduce((sum, d) => {
        const detailQty = Math.max(
          0,
          Number(d?.initialUsedQuantity ?? d?.usedQuantity ?? 0),
        )
        return sum + detailQty
      }, 0)
      if (sold > 0) {
        return Math.max(0, sold - historyReturned)
      }
      // GRN rows exist but sold qty missing in API — use line-bill quantity.
    }

    const purchased = Number(item?.purchaseQuantity || 0)
    const alreadyReturned =
      historyReturned > 0 ? historyReturned : Number(item?.returnQuantity || 0)
    return Math.max(0, purchased - alreadyReturned)
  }
  // Updated to work with new invoice-mapped structure (one row per item)
  const getReturnValue = (refId) => {
    return returnQuantities[refId] || ''
  }

  const handleReturnValues = (value, refId) => {
    setReturnQuantities((prev) => ({
      ...prev,
      [refId]: value,
    }))
    // Auto-select item when return quantity is entered
    if (value && parseFloat(value) > 0) {
      setSelectedItems((prev) => ({
        ...prev,
        [refId]: true,
      }))
    } else {
      setSelectedItems((prev) => {
        const newState = { ...prev }
        delete newState[refId]
        return newState
      })
    }
  }

  const handleItemSelect = (refId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [refId]: !prev[refId],
    }))
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload) => {
      console.log('Return payload:', payload)
      const res = await ReturnItems(user.accessToken, payload)
      if (res.status === 200) {
        const refundId = res?.data?.returnId
        toast.success(
          refundId
            ? `Items returned successfully. Return ID: ${refundId}`
            : 'Items returned successfully',
          toastconfig,
        )
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: ['fetchSalesReturnInfoData', orderId, 0],
        })
        queryClient.invalidateQueries({
          queryKey: ['fetchSalesReturnInfoData', orderId, 2],
        })
        queryClient.invalidateQueries({
          queryKey: ['fetchPharmacyRefundLogs'],
        })
        // Reset return quantities after successful return
        setReturnQuantities({})
      } else {
        throw new Error(res.message || res.error || 'Failed to return items')
      }
      return res
    },
    onMutate: (payload) => {
      dispatch(showLoader())
      toast.info('Processing return...', toastconfig)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to return items', toastconfig)
      dispatch(hideLoader())
    },
    onSettled: () => {
      dispatch(hideLoader())
    },
  })
  useEffect(() => {
    if (isPending) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isPending])
  const clickSaveAndCallApi = () => {
    let error = 0
    let atleastOneObjFound = false

    // Group return quantities by refId (matching invoice structure - one row per item)
    const returnDetailsByRefId = {}

    details.forEach((item) => {
      const refId = item.refId
      const returnQty = parseFloat(returnQuantities[refId] || 0)
      const remainingQty = getRemainingReturnQty(item)

      if (returnQty > 0) {
        if (returnQty < 0) {
          error = 3
        } else if (returnQty > remainingQty) {
          error = 1
        } else {
          atleastOneObjFound = true

          if (!returnDetailsByRefId[refId]) {
            returnDetailsByRefId[refId] = {
              refId: refId,
              itemId: item.itemId || refId,
              returnInfo: [],
            }
          }

          // Let backend derive GRN split when details are incomplete; only send
          // returnInfo when we have a reliable per-GRN sold quantity map.
          if (item.allPurchaseDetails && item.allPurchaseDetails.length > 0) {
            let remainingQty = returnQty
            let mappedAny = false
            item.allPurchaseDetails.forEach((purchaseDetail, detailIndex) => {
              if (remainingQty <= 0) return
              const detailQty = Math.max(
                0,
                Number(
                  purchaseDetail.initialUsedQuantity ??
                    purchaseDetail.usedQuantity ??
                    0,
                ),
              )
              if (detailQty <= 0) return
              mappedAny = true
              const alreadyReturned = Math.max(
                0,
                Number(purchaseDetail.returnedQuantity || 0),
              )
              const availableQty = Math.max(0, detailQty - alreadyReturned)
              const qtyForThisDetail =
                detailIndex === item.allPurchaseDetails.length - 1
                  ? Math.min(remainingQty, availableQty)
                  : Math.min(remainingQty, availableQty)

              if (qtyForThisDetail > 0 && purchaseDetail.grnId) {
                returnDetailsByRefId[refId].returnInfo.push({
                  grnId: purchaseDetail.grnId,
                  returnQuantity: qtyForThisDetail,
                })
                remainingQty -= qtyForThisDetail
              }
            })

            if (!mappedAny) {
              returnDetailsByRefId[refId].returnInfo = []
            } else if (
              returnDetailsByRefId[refId].returnInfo.length === 0 &&
              item.grnId
            ) {
              returnDetailsByRefId[refId].returnInfo.push({
                grnId: item.grnId,
                returnQuantity: returnQty,
              })
            }
          } else if (item.grnId) {
            returnDetailsByRefId[refId].returnInfo.push({
              grnId: item.grnId,
              returnQuantity: returnQty,
            })
          }
        }
      }
    })

    if (error == 1) {
      toast.error(
        'Return quantity cannot exceed remaining refundable quantity',
        toastconfig,
      )
    } else if (error == 3) {
      toast.error(
        'Return quantity must be a valid non-negative number',
        toastconfig,
      )
    } else if (!atleastOneObjFound) {
      toast.error('Please add at least one return quantity', toastconfig)
    } else if (!refundBranchId) {
      toast.error(
        'Please select the branch where refund is processed',
        toastconfig,
      )
    } else {
      let totAmount = 0
      Object.values(returnDetailsByRefId).forEach((row) => {
        const item = details.find((d) => String(d.refId) === String(row.refId))
        if (!item) return
        const returnQty = Number(returnQuantities[row.refId] || 0)
        totAmount += computeRefundAmountForItem(item, returnQty)
      })

      const resolvedType = type || headerDetails?.purchaseType || 'Consultation'
      const payload = {
        orderId: orderId,
        patientId: headerDetails?.patientId,
        totalAmount: Math.round(totAmount * 100) / 100,
        type: resolvedType,
        refundBranchId: Number(refundBranchId),
        returnDetails: Object.values(returnDetailsByRefId).map((row) => ({
          ...row,
          // Always send the user-entered quantity; backend can derive GRN split.
          returnQuantity: Number(returnQuantities[row.refId] || 0),
        })),
        refundMethod: refundMethod, // Add refund method to payload
      }

      console.log('Return payload:', payload)
      mutate(payload)
    }
  }
  useEffect(() => {
    if (details) {
      // Reset return quantities when details change
      setReturnQuantities({})
      setSelectedItems({})
    }
  }, [details])

  // Show message if no details, but still render the card structure
  if (!details || details.length === 0) {
    return (
      <Card className="min-h-52">
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Purchase Details & Refund
          </Typography>
          <Alert severity="info" className="mt-4">
            <Typography variant="body2">
              No purchase items found for this order. Please verify the order ID
              or check if items have already been returned.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Calculate total refund amount (using new structure - one row per item)
  const totalRefundAmount = details.reduce((sum, item) => {
    const refId = item.refId
    const qty = parseFloat(returnQuantities[refId] || 0)
    if (qty > 0) {
      return sum + computeRefundAmountForItem(item, qty)
    }
    return sum
  }, 0)

  const hasSelectedItems = Object.keys(returnQuantities).some(
    (refId) => parseFloat(returnQuantities[refId] || 0) > 0,
  )

  return (
    <Card className="min-h-52">
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <Typography variant="h6">Purchase Details & Refund</Typography>
          {hasSelectedItems && (
            <Chip
              label={`Total Refund: ₹${totalRefundAmount.toFixed(2)}`}
              color="primary"
              variant="outlined"
            />
          )}
        </div>

        {orderDiscountMeta?.hasOrderDiscount && (
          <Alert severity="info" className="mb-3">
            <Typography variant="body2">
              Order discount ₹{orderDiscountMeta.discountAmount.toFixed(2)} (
              {orderDiscountMeta.orderDiscountPercent}% on bill total ₹
              {orderDiscountMeta.totalOrderAmount.toFixed(2)}
              {orderDiscountMeta.couponCode
                ? `, coupon ${orderDiscountMeta.couponCode}`
                : ''}
              ). Refund is based on each line&apos;s paid amount after this
              order discount — not a separate discount per tablet or batch.
            </Typography>
          </Alert>
        )}

        {hasSelectedItems && (
          <Alert severity="info" className="mb-4">
            <Typography variant="body2">
              {
                Object.keys(returnQuantities).filter(
                  (refId) => parseFloat(returnQuantities[refId] || 0) > 0,
                ).length
              }{' '}
              item(s) selected for refund. Total amount: ₹
              {totalRefundAmount.toFixed(2)}
            </Typography>
          </Alert>
        )}

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl fullWidth size="small">
            <InputLabel>Refund Branch (stock update)</InputLabel>
            <Select
              value={refundBranchId}
              label="Refund Branch (stock update)"
              onChange={(e) => setRefundBranchId(e.target.value)}
              disabled={isPending || userBranches.length <= 1}
            >
              {userBranches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name || branch.branchCode || `Branch ${branch.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Refund Method</InputLabel>
            <Select
              value={refundMethod}
              label="Refund Method"
              onChange={(e) => setRefundMethod(e.target.value)}
              disabled={isPending}
            >
              <MenuItem value="CASH">Cash</MenuItem>
              <MenuItem value="CARD">Card</MenuItem>
              <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              <MenuItem value="WALLET">Wallet</MenuItem>
              <MenuItem value="CREDIT_NOTE">Credit Note</MenuItem>
            </Select>
          </FormControl>
        </div>

        {refundBranchId && userBranches.length > 0 && (
          <Alert severity="info" className="mb-4">
            <Typography variant="body2">
              Returned medicines will be added to stock at{' '}
              <strong>
                {userBranches.find(
                  (branch) => String(branch.id) === String(refundBranchId),
                )?.name ||
                  userBranches.find(
                    (branch) => String(branch.id) === String(refundBranchId),
                  )?.branchCode ||
                  'selected branch'}
              </strong>
              . If the purchase was made at a different branch, a duplicate GRN
              will be created there with a branch suffix (e.g. &quot;-
              HYD&quot;).
            </Typography>
          </Alert>
        )}

        <div>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Select</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>GRN No</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>MRP / tablet</TableCell>
                  <TableCell>Paid refund rate / tablet</TableCell>
                  <TableCell>Line total → paid</TableCell>
                  <TableCell>Return Quantity</TableCell>
                  <TableCell>Refund Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {details?.map((item, index) => {
                  const refId = item.refId
                  const returnQty = parseFloat(returnQuantities[refId] || 0)
                  const remainingQty = getRemainingReturnQty(item)
                  const paidRefundRate = getRefundUnitPrice(item)
                  const mrpRate = Number(
                    item.mrpRatePerUnit ?? item.mrpPerTablet ?? 0,
                  )
                  const lineTotalBeforeDiscount = Number(
                    item.lineTotalBeforeDiscount ??
                      item.paidLineTotal ??
                      item.undiscountedLineTotal ??
                      0,
                  )
                  const linePaidAmount = getLinePaidAmount(item)
                  const refundAmount = computeRefundAmountForItem(
                    item,
                    returnQty,
                  )
                  const isSelected = selectedItems[refId] || returnQty > 0
                  const linePaidLabel = item.hasItemCoupon
                    ? '₹0 (item coupon)'
                    : item.hasOrderDiscount
                      ? `₹${lineTotalBeforeDiscount.toFixed(2)} → ₹${linePaidAmount.toFixed(2)}`
                      : `₹${linePaidAmount.toFixed(2)}`

                  return (
                    <TableRow
                      key={`${refId}-${index}`}
                      selected={isSelected}
                      sx={{
                        backgroundColor: isSelected
                          ? 'rgba(25, 118, 210, 0.08)'
                          : 'inherit',
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleItemSelect(refId)}
                          disabled={isPending}
                        />
                      </TableCell>
                      <TableCell>{item.itemName || 'N/A'}</TableCell>
                      <TableCell>{item.grnNo || item.grnId || 'N/A'}</TableCell>
                      <TableCell>{item.purchaseQuantity || 0}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ₹{mrpRate.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="primary">
                          ₹{paidRefundRate.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{linePaidLabel}</Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          value={getReturnValue(refId)}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only allow non-negative numbers
                            if (
                              value === '' ||
                              (!isNaN(value) && parseFloat(value) >= 0)
                            ) {
                              handleReturnValues(value, refId)
                            }
                          }}
                          inputProps={{
                            min: 0,
                            max: remainingQty,
                          }}
                          disabled={isPending}
                          helperText={`Max: ${remainingQty}`}
                          sx={{ width: '120px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={refundAmount > 0 ? 'primary' : 'textSecondary'}
                          fontWeight={refundAmount > 0 ? 'bold' : 'normal'}
                        >
                          ₹{refundAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center p-4 border-t">
              <div>
                <Typography variant="body2" color="textSecondary">
                  Selected Items:{' '}
                  {
                    Object.keys(returnQuantities).filter(
                      (refId) => parseFloat(returnQuantities[refId] || 0) > 0,
                    ).length
                  }
                </Typography>
                <Typography variant="h6" color="primary">
                  Total Refund: ₹{totalRefundAmount.toFixed(2)}
                </Typography>
              </div>
              <Button
                variant="contained"
                onClick={clickSaveAndCallApi}
                className="capitalize text-white"
                disabled={isPending || !hasSelectedItems}
                size="large"
                color="primary"
              >
                {isPending ? 'Processing Refund...' : 'Process Refund'}
              </Button>
            </div>
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  )
}

const RefundLogs = ({ details, orderId }) => {
  const printRefundInvoice = (refundLog) => {
    const lineRows = Array.isArray(refundLog?.returnDetails)
      ? refundLog.returnDetails
      : []
    const tableRows = lineRows
      .map((line) => {
        const purchasedQty = Number(line.purchaseQuantity || 0)
        const returnedQty = Number(line.returnQuantity || 0)
        return `
          <tr>
            <td style="border:1px solid #ccc;padding:6px;">${line.refId || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${line.itemId || '-'}</td>
            <td style="border:1px solid #ccc;padding:6px;">${purchasedQty}</td>
            <td style="border:1px solid #ccc;padding:6px;">${returnedQty}</td>
          </tr>
        `
      })
      .join('')

    const html = `
      <html>
        <head><title>Refund Invoice ${refundLog?.returnId || ''}</title></head>
        <body style="font-family:Arial,sans-serif;padding:16px;">
          <h2>Refund Invoice</h2>
          <p><strong>Order ID:</strong> ${refundLog?.orderId || orderId || '-'}</p>
          <p><strong>Return ID:</strong> ${refundLog?.returnId || '-'}</p>
          <p><strong>Returned Date:</strong> ${dayjs(refundLog?.returnedDate).format('DD-MM-YYYY hh:mm A')}</p>
          <p><strong>Refund Method:</strong> ${refundLog?.refundMethod || '-'}</p>
          <p><strong>Returned By:</strong> ${refundLog?.returnedBy || '-'}</p>
          <p><strong>Total Refund Amount:</strong> INR ${Number(refundLog?.totalAmount || 0).toFixed(2)}</p>
          <table style="border-collapse:collapse;width:100%;margin-top:12px;">
            <thead>
              <tr>
                <th style="border:1px solid #ccc;padding:6px;">Ref ID</th>
                <th style="border:1px solid #ccc;padding:6px;">Item ID</th>
                <th style="border:1px solid #ccc;padding:6px;">Purchased Qty</th>
                <th style="border:1px solid #ccc;padding:6px;">Returned Qty</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" className="mb-3">
          Refund Logs & Invoices
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Return ID</TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Total Purchased Qty</TableCell>
                <TableCell>Total Returned Qty</TableCell>
                <TableCell>Refund Method</TableCell>
                <TableCell>Returned By</TableCell>
                <TableCell>Refund Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details?.length > 0 ? (
                details.map((log) => {
                  const lineRows = Array.isArray(log.returnDetails)
                    ? log.returnDetails
                    : []
                  const purchasedQty = lineRows.reduce(
                    (sum, line) => sum + Number(line.purchaseQuantity || 0),
                    0,
                  )
                  const returnedQty = lineRows.reduce(
                    (sum, line) =>
                      sum +
                      Number(line.returnQuantity || line.returnedQuantity || 0),
                    0,
                  )
                  return (
                    <TableRow key={log.returnId}>
                      <TableCell>{log.returnId}</TableCell>
                      <TableCell>{log.orderId || orderId}</TableCell>
                      <TableCell>{purchasedQty}</TableCell>
                      <TableCell>{returnedQty}</TableCell>
                      <TableCell>{log.refundMethod || 'N/A'}</TableCell>
                      <TableCell>{log.returnedBy || 'N/A'}</TableCell>
                      <TableCell>
                        ₹{Number(log.totalAmount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {dayjs(log.returnedDate).format('DD-MM-YYYY hh:mm A')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => printRefundInvoice(log)}
                        >
                          Print Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4">
                    <Typography variant="body2" color="textSecondary">
                      {orderId
                        ? 'No refund logs available for this order ID.'
                        : 'No refund logs available.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

const NonPharmacyPurchaseDetails = ({ details, headerDetails, orderId }) => {
  const [selectedItems, setSelectedItems] = useState({})
  const [refundMethod, setRefundMethod] = useState('CASH') // Default refund method
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const user = useSelector((store) => store.user)

  const handleItemSelect = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  // Split items into available and returned
  const availableItems = details?.filter((item) => !item.isReturned) || []
  const returnedItems = details?.filter((item) => item.isReturned) || []

  const hasSelectedItems = Object.values(selectedItems).some(
    (selected) => selected,
  )

  // Get selected item IDs
  const selectedItemIds = Object.keys(selectedItems).filter(
    (id) => selectedItems[id],
  )

  // Calculate total refund amount for selected items
  const totalRefundAmount = availableItems.reduce((sum, item) => {
    if (selectedItems[item.itemId]) {
      return sum + (item.totalCost || item.price || 0)
    }
    return sum
  }, 0)

  const { mutate: returnItemsMutation, isPending: isReturnItemsPending } =
    useMutation({
      mutationFn: async (payload) => {
        const res = await returnPurchasedItems(user.accessToken, payload)
        if (res.status === 200) {
          toast.success('Items returned successfully', toastconfig)
          queryClient.invalidateQueries({
            queryKey: ['fetchPurchaseReturnInfoData', orderId, 1],
          })
          // Reset selected items after successful return
          setSelectedItems({})
        } else {
          toast.error(
            res.message || res.error || 'Failed to return items',
            toastconfig,
          )
          throw new Error(res.message || res.error || 'Failed to return items')
        }
        return res
      },
      onMutate: (payload) => {
        toast.info('Processing return...', toastconfig)
      },
      onError: (error) => {
        toast.error('Error: ' + error.message, toastconfig)
      },
      onSettled: () => {
        dispatch(hideLoader())
      },
    })

  useEffect(() => {
    if (isReturnItemsPending) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isReturnItemsPending])

  const handleReturn = () => {
    if (!hasSelectedItems) {
      toast.error('Please select at least one item to return', toastconfig)
      return
    }
    if (!confirm('Are you sure you want to return the selected items?')) {
      return
    }

    let totAmount = 0
    const returnDetails = []

    availableItems.forEach((item) => {
      if (selectedItems[item.itemId]) {
        // For non-pharmacy items, return the full item (quantity = 1)
        // If the item has a quantity field, use it; otherwise default to 1
        const returnQuantity = item.quantity || 1

        totAmount += item.totalCost || item.price || 0
        returnDetails.push({
          refId: item.refId || item.itemId,
          itemId: item.itemId,
          itemName: item.itemName,
          itemType: item.productType || item.itemType,
          itemCost: item.totalCost || item.price || 0,
          quantity: returnQuantity,
          grnId: item.grnId || null,
        })
      }
    })

    if (returnDetails.length === 0) {
      toast.error('Please select at least one item to return', toastconfig)
    } else {
      const payload = {
        orderId: orderId,
        patientId: headerDetails?.patientId,
        totalAmount: totAmount,
        type: headerDetails?.purchaseType || 'Consultation',
        returnDetails: returnDetails,
        refundMethod: refundMethod, // Add refund method to payload
      }

      console.log('Return payload:', payload)

      returnItemsMutation(payload)
    }
  }

  useEffect(() => {
    if (details) {
      setSelectedItems({})
    }
  }, [details])

  if (!details || details.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Available Items */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h6">Available Items for Refund</Typography>
            {hasSelectedItems && (
              <Chip
                label={`Total Refund: ₹${totalRefundAmount.toFixed(2)}`}
                color="primary"
                variant="outlined"
              />
            )}
          </div>

          {hasSelectedItems && (
            <Alert severity="info" className="mb-4">
              <Typography variant="body2">
                {selectedItemIds.length} item(s) selected for refund. Total
                amount: ₹{totalRefundAmount.toFixed(2)}
              </Typography>
            </Alert>
          )}

          <div className="mb-4">
            <FormControl fullWidth size="small">
              <InputLabel>Refund Method</InputLabel>
              <Select
                value={refundMethod}
                label="Refund Method"
                onChange={(e) => setRefundMethod(e.target.value)}
                disabled={isReturnItemsPending}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
                <MenuItem value="WALLET">Wallet</MenuItem>
                <MenuItem value="CREDIT_NOTE">Credit Note</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">Select</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {availableItems.length > 0 ? (
                    availableItems.map((item, index) => {
                      const isSelected = selectedItems[item.itemId] || false
                      return (
                        <TableRow
                          key={item.itemId || index}
                          selected={isSelected}
                          sx={{
                            backgroundColor: isSelected
                              ? 'rgba(25, 118, 210, 0.08)'
                              : 'inherit',
                          }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleItemSelect(item.itemId)}
                              disabled={isReturnItemsPending}
                            />
                          </TableCell>
                          <TableCell>{item.itemName || 'N/A'}</TableCell>
                          <TableCell>
                            {item.productType || item.itemType || 'N/A'}
                          </TableCell>
                          <TableCell>
                            ₹{item.totalCost || item.price || 0}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        <Typography variant="body2" color="textSecondary">
                          No items available for return
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {hasSelectedItems && (
                <div className="flex justify-between items-center p-4 border-t">
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Selected Items: {selectedItemIds.length}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      Total Refund: ₹{totalRefundAmount.toFixed(2)}
                    </Typography>
                  </div>
                  <Button
                    variant="contained"
                    onClick={handleReturn}
                    disabled={isReturnItemsPending}
                    className="capitalize text-white"
                    size="large"
                    color="primary"
                  >
                    {isReturnItemsPending
                      ? 'Processing Refund...'
                      : 'Process Refund'}
                  </Button>
                </div>
              )}
            </TableContainer>
          </div>
        </CardContent>
      </Card>

      {/* Returned Items */}
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-3">
            Returned Items
          </Typography>
          <div>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price</TableCell>
                    {/* <TableCell>Returned Date</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnedItems.length > 0 ? (
                    returnedItems.map((item, index) => (
                      <TableRow key={item.itemId || index}>
                        <TableCell>{item.itemName || 'N/A'}</TableCell>
                        <TableCell>
                          {item.productType || item.itemType || 'N/A'}
                        </TableCell>
                        <TableCell>
                          ₹{item.totalCost || item.price || 0}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4">
                        <Typography variant="body2" color="textSecondary">
                          No returned items
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SaleReturnPage
