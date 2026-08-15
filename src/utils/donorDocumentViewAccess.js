export const DONOR_DOCUMENT_VIEW_ALONGSIDE_TRIGGER_EMAIL =
  'nikhilsuvva77@gmail.com'

const isDonorDocumentPrivilegedUser = (userEmail) => {
  if (!userEmail) return false
  return (
    userEmail.toLowerCase() ===
    DONOR_DOCUMENT_VIEW_ALONGSIDE_TRIGGER_EMAIL.toLowerCase()
  )
}

export const canViewDonorDocumentsAlongsideTrigger =
  isDonorDocumentPrivilegedUser

export const canDeleteDonorDocuments = isDonorDocumentPrivilegedUser
