import {
  getFETConsentsByVisitId,
  getFormFTemplatesByScanAppointment,
  getIcsiConsentsByVisitId,
  getIuiConsentsByVisitId,
  reviewFormFForScanAppointment,
} from '@/constants/apis'
import { closeModal } from '@/redux/modalSlice'
import { toastconfig } from '@/utils/toastconfig'
import { OpenInNew } from '@mui/icons-material'
import { Button, Checkbox } from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

function ReviewFormF({
  selectedDetails,
  appointmentId,
  type,
  consentType,
  patientInfo,
  reviewConsents,
}) {
  const userDetails = useSelector(state => state.user)
  const QueryClient = useQueryClient()
  const dispatch = useDispatch()
  const [isChecked, setIsChecked] = useState(false)
  const {
    data: formFHistoryByScanAppointment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['getFormFHistoryByScanAppointment', selectedDetails?.scanId],
    queryFn: () =>
      getFormFTemplatesByScanAppointment(
        userDetails.accessToken,
        selectedDetails?.appointmentId,
        selectedDetails?.scanId,
        selectedDetails?.type,
      ),
    enabled: !!selectedDetails?.scanId,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  })

  const handleCheckboxChange = event => {
    setIsChecked(event.target.checked)
  }

  const handleReviewClick = async () => {
    if (!isChecked) {
      toast.error('Please select and review all forms.', toastconfig)
      return
    }
    try {
      const reviewPayload = {
        isReviewed: 1,
      }
      const updateResp = await reviewFormFForScanAppointment(
        userDetails?.accessToken,
        appointmentId,
        selectedDetails?.scanId,
        type,
        reviewPayload,
      )
      if (updateResp?.status === 200) {
        console.log('entered200')
        toast.success('Successfully Reviewed', toastconfig)
        dispatch(closeModal('reviewFormFModal'))
        QueryClient.invalidateQueries(['ScanTestsByDate'])
      } else {
        toast.error('Failed to Review', toastconfig)
      }
    } catch (err) {
      console.log(err)
      toast.error('Something went wrong', toastconfig)
    }
  }

  if (isLoading) {
    return <p className="text-center text-gray-600">Loading...</p>
  }

  if (isError) {
    return <p className="text-center text-red-600">Error: {error.message}</p>
  }

  const { formFUploadKey, formFUploadLink } =
    formFHistoryByScanAppointment?.data || {}

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 flex justify-center">
        Review Form-F
      </h2>

      {formFUploadKey && (
        <div className="flex items-center gap-4 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 ease-in-out">
          {formFUploadKey && (
            <Checkbox
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="text-secondary"
            />
          )}
          {formFUploadLink && (
            <div className="flex-1">
              <Link
                href={formFHistoryByScanAppointment?.data?.formFUploadLink}
                target="_blank"
                className="flex-1"
              >
                <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                  <div className="p-2 rounded-lg bg-primary">
                    <OpenInNew className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {formFHistoryByScanAppointment?.data?.formFUploadKey
                        ?.split('/')
                        ?.pop()
                        ?.split('_')
                        .slice(1)
                        .join('_')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Click to view document
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )}
          {/* {!formFUploadKey && <div className='text-md font-semibold text-gray-800 flex justify-center'>No Form F Uploaded yet , please upload it first ! </div>} */}
        </div>
      )}
      {formFUploadKey && (
        <Button
          variant="contained"
          className="capitalize text-white flex justify-center w-full"
          onClick={handleReviewClick}
          disabled={!isChecked}
        >
          Review Form-F
        </Button>
      )}
      {!formFUploadKey && (
        <div className="text-md font-semibold text-gray-800 flex justify-center border border-gray-300 rounded-lg hover:bg-gray-50 p-3">
          No Form F Uploaded yet , please upload it first !{' '}
        </div>
      )}
    </div>
  )
}

export default ReviewFormF
