import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { getDropdowns } from '@/constants/apis'
import { useQuery } from '@tanstack/react-query'
import { setDropdown } from '@/redux/dropdownSlice'
import Footer from './Footer'
import Modal from './Modal'
import {
  TermsAndConditionsContent,
  PrivacyPolicyContent,
  ContactContent,
  RefundPolicyContent,
} from './LegalModals'

function PreLoginContainer(props) {
  const user = useSelector((store) => store.user)
  const router = useRouter()
  const dispatch = useDispatch()
  const [isClient, setIsClient] = useState(false)

  // Ensure this component only runs on client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  const dropdowns = useQuery({
    queryKey: ['dropdowns'],
    queryFn: async () => {
      if (typeof window === 'undefined') return null
      let token = localStorage.getItem('token')
      const responsejson = await getDropdowns(token)
      if (responsejson.status === 200) {
        // console.log(responsejson.data)
        const dropdownData = responsejson.data
        dispatch(setDropdown(responsejson.data))
        return dropdownData
      } else {
        throw new Error('Error occurred')
      }
    },
    enabled: isClient,
  })

  useEffect(() => {
    if (!isClient) return

    if (
      user.isAuthenticated ||
      (typeof window !== 'undefined' && localStorage.getItem('token'))
    ) {
      const redirectPath =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('redirectPath')
          : null
      if (redirectPath) {
        router.push(redirectPath)
        sessionStorage.removeItem('redirectPath')
      } else {
        router.push('/home')
      }
    }
  }, [user.isAuthenticated, isClient, router])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{!user.isAuthenticated && props.children}</div>
      <Footer />

      {/* Legal Modals */}
      <Modal
        uniqueKey="termsAndConditionsModal"
        maxWidth="lg"
        closeOnOutsideClick={true}
      >
        <TermsAndConditionsContent />
      </Modal>

      <Modal
        uniqueKey="privacyPolicyModal"
        maxWidth="lg"
        closeOnOutsideClick={true}
      >
        <PrivacyPolicyContent />
      </Modal>

      <Modal uniqueKey="contactModal" maxWidth="lg" closeOnOutsideClick={true}>
        <ContactContent />
      </Modal>
      <Modal
        uniqueKey="refundPolicyModal"
        maxWidth="lg"
        closeOnOutsideClick={true}
      >
        <RefundPolicyContent />
      </Modal>
    </div>
  )
}

export default PreLoginContainer
