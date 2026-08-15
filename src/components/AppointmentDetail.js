import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getLineBillsAndNotesForAppointment } from '@/constants/apis'
import {
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Box,
  Card,
  CardContent,
  Grid,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Button,
} from '@mui/material'
import {
  ExpandMore,
  Download,
  Receipt,
  MedicalServices,
  Assignment,
  LocalPharmacy,
  Science,
  Biotech,
} from '@mui/icons-material'
import dayjs from 'dayjs'
import { Generate_Invoice } from '@/constants/apis'
import RichText from '@/components/RichText'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import BillDataFallBack from '@/fallbacks/BillDataFallBack'

const PRESCRIBED_TAB_VALUE = '__prescribed__'

function isPharmacyBillGroup(bill) {
  if (!bill?.billType) return false
  const id = bill.billType.id
  const name = String(bill.billType.name || '').toLowerCase()
  return Number(id) === 3 || id === '3' || name === 'pharmacy'
}

function formatPrescriptionMeta(item) {
  const parts = []
  if (item.prescribedQuantity != null && item.prescribedQuantity !== '') {
    parts.push(`Qty: ${item.prescribedQuantity}`)
  }
  if (item.purchaseQuantity != null && item.purchaseQuantity !== '') {
    parts.push(`Purchased: ${item.purchaseQuantity}`)
  }
  if (item.prescriptionDays != null && item.prescriptionDays !== '') {
    parts.push(`${item.prescriptionDays} day(s)`)
  }
  const intake = item.prescriptionDetails
  if (intake && String(intake).trim()) {
    const text = String(intake).trim()
    parts.push(text.length > 120 ? `${text.slice(0, 120)}…` : text)
  }
  if (item.nonPurchaseReason && String(item.nonPurchaseReason).trim()) {
    parts.push(`Reason: ${String(item.nonPurchaseReason).trim()}`)
  }
  return parts.join(' · ')
}

function AppointmentDetail({ appointmentId, type, onClose }) {
  const user = useSelector((store) => store.user)
  const [expandedSection, setExpandedSection] = useState('details')
  const [activeTab, setActiveTab] = useState(0)
  const [horizontalTabInModal, setHorizontalTabInModal] = useState(null)

  // Fetch appointment details using the lineBills API
  const {
    data: appointmentDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['appointmentDetail', type, appointmentId],
    queryFn: async () => {
      const response = await getLineBillsAndNotesForAppointment(
        user.accessToken,
        type,
        appointmentId,
      )
      if (response.status === 200) {
        console.log(response.data)
        return response.data
      } else {
        throw new Error('Error fetching appointment details')
      }
    },
    enabled: !!appointmentId && !!type,
  })
  useEffect(() => {
    setHorizontalTabInModal(null)
  }, [appointmentId, type])

  const pharmacyBillGroup =
    appointmentDetails?.lineBillsData?.find(isPharmacyBillGroup)
  const prescribedItems = pharmacyBillGroup?.billTypeValues ?? []
  const showPrescribedTab = prescribedItems.length > 0

  const defaultLineBillTab = useMemo(() => {
    if (!appointmentDetails?.lineBillsData?.length) return null
    const pharmacy = appointmentDetails.lineBillsData.find(isPharmacyBillGroup)
    if (pharmacy?.billTypeValues?.length > 0) return PRESCRIBED_TAB_VALUE
    return appointmentDetails.lineBillsData[0].billType.name
  }, [appointmentDetails])

  const effectiveTabValue = horizontalTabInModal ?? defaultLineBillTab

  // Loading state
  if (isLoading) {
    return (
      <Box className="flex justify-center items-center p-8">
        <CircularProgress />
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" className="m-4">
        {error.message || 'Failed to load appointment details'}
      </Alert>
    )
  }

  // Empty state
  if (!appointmentDetails) {
    return (
      <Box className="p-4 text-center">
        <Typography color="text.secondary">
          No details available for this appointment
        </Typography>
      </Box>
    )
  }

  // Group line bills by category for prescription display
  const prescriptionCategories = {
    Pharmacy: [],
    Lab: [],
    Scan: [],
    Other: [],
  }

  function handleHorizontalTabChangeInModal(e, newTab) {
    setHorizontalTabInModal(newTab)
  }

  return (
    <div className="min-h-0">
      {isLoading ? (
        <BillDataFallBack />
      ) : (
        <>
          <RichText
            value={appointmentDetails.notesData.notes || 'No Notes Provided'}
            readOnly={true}
          />
          <div className="flex flex-col px-2 my-2 w-full min-h-0">
            {appointmentDetails?.lineBillsData?.length > 0 ? (
              <TabContext value={effectiveTabValue}>
                <Box className="w-max h-full">
                  <TabList
                    onChange={handleHorizontalTabChangeInModal}
                    aria-label="line bills and notes"
                  >
                    {showPrescribedTab && (
                      <Tab label="PRESCRIBED" value={PRESCRIBED_TAB_VALUE} />
                    )}
                    {appointmentDetails?.lineBillsData?.map((bill) => (
                      <Tab
                        key={bill.billType.id}
                        label={String(bill.billType.name || '').toUpperCase()}
                        value={bill.billType.name}
                      />
                    ))}
                  </TabList>
                </Box>
                {showPrescribedTab && (
                  <TabPanel
                    className="p-3 h-auto min-w-full"
                    value={PRESCRIBED_TAB_VALUE}
                  >
                    <div className="space-y-3">
                      {prescribedItems.map((item) => {
                        const meta = formatPrescriptionMeta(item)
                        return (
                          <div
                            key={item.id ?? `${item.name}-${item.refId}`}
                            className="flex flex-col gap-1 items-start"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Chip label={item.name} />
                              {(item.isSpouse === 1 ||
                                item.isSpouse === '1') && (
                                <Chip
                                  size="small"
                                  label="Spouse"
                                  variant="outlined"
                                />
                              )}
                            </div>
                            {meta ? (
                              <Typography
                                variant="caption"
                                className="text-gray-600 max-w-full pl-0.5"
                                component="p"
                              >
                                {meta}
                              </Typography>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  </TabPanel>
                )}
                {appointmentDetails?.lineBillsData?.map((bill) => (
                  <TabPanel
                    className="p-3 h-auto min-w-full"
                    key={
                      bill.billType.id +
                      '-' +
                      bill.billType.name +
                      '-' +
                      bill.appointmentId
                    }
                    value={bill.billType.name}
                  >
                    {bill?.billTypeValues?.length > 0 ? (
                      <div className="space-y-3">
                        {bill.billTypeValues.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <Chip label={item.name} />
                            {/* <span>{item.price}</span> */}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex justify-center items-center">
                        <span className="opacity-50">No Data</span>
                      </div>
                    )}
                  </TabPanel>
                ))}
              </TabContext>
            ) : (
              <div className="grow flex justify-center items-center">
                <span className="opacity-50">{'No Line Bills Data'}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AppointmentDetail
