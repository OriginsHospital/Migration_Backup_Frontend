import { Button, CircularProgress } from '@mui/material'
import React from 'react'

function StartERAConfirmation({ onConfirm, isLoading }) {
  const handleConfirm = async () => {
    if (confirm('Are you sure you want to start ERA treatment?')) {
      await onConfirm()
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-lg font-semibold">Start ERA Treatment</h2>
      <p className="text-gray-600">
        Are you sure you want to start ERA treatment for this patient?
      </p>
      <div className="flex gap-3 mt-2">
        <Button
          variant="contained"
          className="capitalize text-white"
          onClick={handleConfirm}
          disabled={isLoading}
          startIcon={
            isLoading ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isLoading ? 'Starting ERA...' : 'Yes, Start ERA'}
        </Button>
      </div>
    </div>
  )
}

export default StartERAConfirmation
