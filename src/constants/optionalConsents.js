export const OPTIONAL_CONSENT_TYPES = ['ERA']

export const isConsentOptional = (consentType) => {
  return OPTIONAL_CONSENT_TYPES.includes(consentType)
}
