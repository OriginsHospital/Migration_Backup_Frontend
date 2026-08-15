import {
  deleteEraConsentForm,
  deleteFETConsentForm,
  deleteIcsiConsentForm,
  deleteIuiConsentForm,
  getEraConsentsByVisitId,
  getFETConsentsByVisitId,
  getIcsiConsentsByVisitId,
  getIuiConsentsByVisitId,
  uploadEraConsentForm,
  uploadFETConsentForm,
  uploadIcsiConsentForm,
  uploadIuiConsentForm,
} from './apis'

export const CONSENT_TYPES = {
  ICSI: {
    id: 'ICSI',
    label: 'ICSI Consents',
    apis: {
      upload: uploadIcsiConsentForm,
      get: getIcsiConsentsByVisitId,
      delete: deleteIcsiConsentForm,
    },
  },
  FET: {
    id: 'FET',
    label: 'FET Consents',
    apis: {
      upload: uploadFETConsentForm,
      get: getFETConsentsByVisitId,
      delete: deleteFETConsentForm,
    },
  },
  IUI: {
    id: 'IUI',
    label: 'IUI Consents',
    apis: {
      upload: uploadIuiConsentForm,
      get: getIuiConsentsByVisitId,
      delete: deleteIuiConsentForm,
    },
  },
  ERA: {
    id: 'ERA',
    label: 'ERA Consents',
    apis: {
      upload: uploadEraConsentForm,
      get: getEraConsentsByVisitId,
      delete: deleteEraConsentForm,
    },
  },
}

export const PATIENT_FORMS_TYPES = {
  FORMF: {
    id: 'FORMF',
    label: 'FORM - F',
  },
}
