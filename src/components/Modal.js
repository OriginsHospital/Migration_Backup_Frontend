import * as React from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Close from '@mui/icons-material/Close'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'

export default function Modal({
  uniqueKey,
  maxWidth, // xs | sm | md | lg | xl
  children,
  title,
  closeOnOutsideClick,
  showCloseButton,
  onOutsideClick,
  paperSx, // Additional sx props for Paper component
}) {
  const modal = useSelector((store) => store.modal)
  const dispatch = useDispatch()

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Cleanup effect when modal closes - always runs
  React.useEffect(() => {
    if (modal.key !== uniqueKey) {
      return
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.body.classList.remove('MuiModal-open')
    }
  }, [modal.key, uniqueKey])

  // Early return AFTER all hooks
  if (modal.key !== uniqueKey) return null

  const runCloseCallbacks = () => {
    dispatch(closeModal())
    onOutsideClick?.()
  }

  const handleClose = (event, reason) => {
    if (reason === 'backdropClick' && !closeOnOutsideClick) {
      return
    }
    if (
      closeOnOutsideClick ||
      (showCloseButton && reason === 'escapeKeyDown')
    ) {
      runCloseCallbacks()
    }
  }

  const handleCloseClick = () => {
    runCloseCallbacks()
  }

  return (
    <Dialog
      fullWidth
      maxWidth={maxWidth}
      open={modal.key === uniqueKey}
      onClose={handleClose}
      PaperProps={{
        sx: {
          zIndex: 1300,
          ...paperSx,
        },
      }}
      BackdropProps={{
        sx: {
          zIndex: 1299,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        onClick: closeOnOutsideClick ? handleClose : undefined,
      }}
      disableEscapeKeyDown={!closeOnOutsideClick && !showCloseButton}
      disableScrollLock={true} // Don't lock scroll to prevent body issues
      hideBackdrop={false}
      TransitionProps={{
        onExited: () => {
          // Cleanup on exit - remove body lock
          document.body.style.overflow = ''
          document.body.style.paddingRight = ''
          document.body.classList.remove('MuiModal-open')
          // Force remove any remaining backdrops
          setTimeout(() => {
            const backdrops = document.querySelectorAll(
              '[class*="MuiBackdrop-root"]',
            )
            backdrops.forEach((backdrop) => {
              if (!backdrop.closest('[role="dialog"]')) {
                backdrop.remove()
              }
            })
          }, 50)
        },
      }}
    >
      {title && showCloseButton && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            pr: 1,
          }}
        >
          <span>{title}</span>
          <IconButton
            aria-label="Close dialog"
            onClick={handleCloseClick}
            edge="end"
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
      )}
      {title && !showCloseButton && <DialogTitle>{title}</DialogTitle>}
      {!title && showCloseButton && (
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            py: 1,
            minHeight: 0,
          }}
        >
          <IconButton
            aria-label="Close dialog"
            onClick={handleCloseClick}
            edge="end"
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent
        sx={{
          p: title || showCloseButton ? undefined : 0,
          '&.MuiDialogContent-root': {
            p: title || showCloseButton ? undefined : 0,
          },
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
