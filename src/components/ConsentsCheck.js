import {
  getEraConsentsByVisitId,
  getFETConsentsByVisitId,
  getIcsiConsentsByVisitId,
  getIuiConsentsByVisitId,
} from '@/constants/apis'
import { OpenInNew } from '@mui/icons-material'
import { Button, Checkbox } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

function ConsentsCheck({ consentType, patientInfo, reviewConsents }) {
  const userDetails = useSelector((state) => state.user)
  const [checkedConsents, setCheckedConsents] = useState({})
  const showTreatmentStartDate = ['ICSI', 'IUI', 'FET'].includes(consentType)
  const [treatmentStartDate, setTreatmentStartDate] = useState(
    dayjs().format('YYYY-MM-DD'),
  )

  const { data: consentsData } = useQuery({
    queryKey: ['consents', consentType],
    queryFn: () => {
      if (consentType == 'ICSI') {
        return getIcsiConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      } else if (consentType == 'IUI') {
        return getIuiConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      } else if (consentType == 'FET') {
        return getFETConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      } else if (consentType == 'ERA') {
        return getEraConsentsByVisitId(
          userDetails?.accessToken,
          patientInfo?.activeVisitId,
        )
      }
    },
    enabled: !!patientInfo?.activeVisitId,
  })

  useEffect(() => {
    if (consentsData?.data) {
      const initialCheckedState = consentsData.data.reduce((acc, consent) => {
        acc[consent.id] = false
        return acc
      }, {})
      setCheckedConsents(initialCheckedState)
    }
  }, [consentsData])

  useEffect(() => {
    setTreatmentStartDate(dayjs().format('YYYY-MM-DD'))
  }, [patientInfo?.activeVisitId, consentType])

  const convertToNormalCase = (str) => {
    let words = str.split('_')
    let capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1),
    )
    return capitalizedWords
      .join(' ')
      .split(/(?=[A-Z])/)
      .join(' ')
      .trim()
  }

  const { isConsentOptional } = require('../constants/optionalConsents')

  const areAllConsentsChecked = () => {
    if (isConsentOptional(consentType) && consentsData?.data?.length === 0) {
      return true
    }
    return Object.values(checkedConsents).every((value) => value === true)
  }

  const handleReviewConsents = () => {
    if (showTreatmentStartDate) {
      const selectedDate = dayjs(treatmentStartDate)
      if (
        !treatmentStartDate ||
        !selectedDate.isValid() ||
        selectedDate.startOf('day').isAfter(dayjs().startOf('day'))
      ) {
        toast.error('Please select today or a previous treatment start date')
        return
      }
    }

    if (confirm('Are you sure you want to review consents?')) {
      reviewConsents.mutate({
        visitId: patientInfo?.activeVisitId,
        treatmentStartDate: showTreatmentStartDate
          ? treatmentStartDate
          : undefined,
      })
    } else if (!isConsentOptional(consentType)) {
      toast.error('Please review all consents')
    }
  }

  const canStartTreatment =
    areAllConsentsChecked() && (!showTreatmentStartDate || !!treatmentStartDate)

  return (
    <div className="flex flex-col gap-3 w-fit">
      {showTreatmentStartDate && (
        <div className="flex flex-col gap-2">
          <span className="text-lg font-semibold">Treatment Start Date</span>
          <DatePicker
            label="Select start date"
            format="DD/MM/YYYY"
            className="bg-white rounded-lg"
            value={dayjs(treatmentStartDate)}
            maxDate={dayjs()}
            onChange={(newValue) => {
              if (newValue) {
                setTreatmentStartDate(dayjs(newValue).format('YYYY-MM-DD'))
              }
            }}
          />
          <span className="text-sm text-gray-500">
            Defaults to today. You can select a previous date if treatment
            started earlier.
          </span>
        </div>
      )}
      <span className="text-lg font-semibold">
        Review Consent Forms {isConsentOptional(consentType) && '(Optional)'}
      </span>
      {consentsData?.data?.length == 0 && (
        <span className="text-sm text-secondary">
          {isConsentOptional(consentType)
            ? 'No consents uploaded (optional)'
            : 'No consents found'}
        </span>
      )}
      {consentsData?.data?.length > 0 &&
        consentsData?.data?.map((consent) => (
          <div
            key={consent?.id}
            className="flex items-center justify-start gap-3 p-2 border rounded-md"
          >
            <Checkbox
              checked={checkedConsents[consent.id] || false}
              onChange={(e) => {
                setCheckedConsents((prev) => ({
                  ...prev,
                  [consent.id]: e.target.checked,
                }))
              }}
            />
            <Link
              href={consent?.link}
              target="_blank"
              className="capitalize text-secondary "
            >
              <Button variant="text" endIcon={<OpenInNew size={16} />}>
                <span className="text-[16px] capitalize">
                  {convertToNormalCase(
                    consent?.key
                      .split('_')
                      .slice(1, consent?.key.split('_').length - 1)
                      .join(' '),
                  )}
                </span>
              </Button>
            </Link>
          </div>
        ))}
      {(consentsData?.data?.length > 0 ||
        (isConsentOptional(consentType) &&
          consentsData?.data?.length === 0)) && (
        <Button
          variant="contained"
          className="capitalize text-white"
          onClick={handleReviewConsents}
          disabled={!canStartTreatment || reviewConsents.isPending}
        >
          {showTreatmentStartDate ? `Start ${consentType}` : 'Review Consents'}
        </Button>
      )}
    </div>
  )
}

export default ConsentsCheck
