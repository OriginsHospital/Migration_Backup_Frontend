import React, { useState } from 'react'
import { Typography, Box, Container, IconButton } from '@mui/material'
import { useDispatch } from 'react-redux'
import { openModal } from '@/redux/modalSlice'
import { Close } from '@mui/icons-material'

const Footer = () => {
  const dispatch = useDispatch()
  const [isVisible, setIsVisible] = useState(true)

  const handleOpenModal = modalKey => {
    dispatch(openModal(modalKey))
  }

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) {
    return null
  }

  return (
    <Box
      component="footer"
      className="bg-gray-800 text-white py-3 shadow-lg"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }}
    >
      <Container maxWidth="lg">
        <Box className="flex flex-col md:flex-row justify-between items-center">
          <Typography variant="body2" className="text-gray-300 mb-2 md:mb-0">
            © {new Date().getFullYear()} ORIGINS HOSPITAL-SPL. All rights
            reserved.
          </Typography>

          <Box className="flex flex-wrap gap-4 text-sm items-center">
            <button
              onClick={() => handleOpenModal('termsAndConditionsModal')}
              className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Terms and Conditions
            </button>
            <button
              onClick={() => handleOpenModal('privacyPolicyModal')}
              className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleOpenModal('contactModal')}
              className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Contact Us
            </button>
            <button
              onClick={() => handleOpenModal('refundPolicyModal')}
              className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              Refund Policy
            </button>
            <IconButton
              onClick={handleClose}
              size="small"
              className="text-gray-300 hover:text-white ml-2"
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer
