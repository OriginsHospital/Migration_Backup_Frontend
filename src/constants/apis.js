import { API_ROUTES } from './constants'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import api from '@/utils/api'

// Health check endpoint using axios instance
export const checkHealth = async () => {
  try {
    const response = await api.get('/api/health')
    return response.data
  } catch (error) {
    console.error('Health check failed:', error)
    throw error
  }
}

export const getLoggedUserInfo = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Access-Control-Allow-Origin', '*')
  myHeaders.append('Access-Control-Allow-Credentials', true)

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + API_ROUTES.LOGGED_USER_INFO,
    {
      method: 'GET',
      headers: myHeaders,
      credentials: 'include',
    },
  )

  return response.json()
}

export const getNewAccessToken = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Access-Control-Allow-Origin', '*')
  myHeaders.append('Access-Control-Allow-Credentials', true)

  const response = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + API_ROUTES.GET_NEW_ACCESS_TOKEN,
    {
      method: 'GET',
      headers: myHeaders,
      credentials: 'include',
    },
  )

  return response.json()
}

export const getUsersList = async (token, isvalidusers) => {
  // console.log(token, isvalidusers)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  // myHeaders.append("Access-Control-Allow-Origin", "*");
  myHeaders.append('Access-Control-Allow-Credential', 'true')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.USERS_LIST}?page=${1}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        isVerified: isvalidusers,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  // if (data.status !== 200) {
  //     handleLogout()
  // }
  // console.log(data);
  // .then(response => response.json())
  // .then(res => {
  //     console.log(res.data.users)
  //     //  setRows(res.data.users)
  //     return res.data.users
  // })
  // .catch(error => {
  //     console.error(error);
  // });
  return data
}

export const getValidUsersList = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Access-Control-Allow-Credential', 'true')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VALID_USERS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  return data
}

export const getRoles = async () => {
  // const myHeaders = new Headers();
  // myHeaders.append("Content-Type", "application/json");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ROLES}`,
    {
      method: 'GET',
      // headers: myHeaders,
      redirect: 'follow',
      // credentials: 'include'
    },
  )
  const data = await response.json()
  // console.log(data);

  return data
}
export const getModules = async () => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)

  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_MODULES}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  // console.log("modules list", data);
  return data
}
export const getRoleDetails = async (roleid) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ROLE_DETAIL}/${roleid}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  // console.log("role details", data);
  return data
}

// export const validateUser = async (payload) => {
//     console.log('validating', Permissions)
//     const myHeaders = new Headers();
//     myHeaders.append("Authorization", `Bearer ${localStorage.getItem('token')}`);
//     myHeaders.append("Content-Type", "application/json");
//     const raw = JSON.stringify(payload);

//     const requestOptions = {
//         method: "PUT",
//         headers: myHeaders,
//         body: raw,
//         redirect: "follow",
//         credentials: 'include'
//     };

//     fetch("https://13.234.149.138:3000/users/updateUserDetails", requestOptions)
//         .then((response) => response.json())
//         .then((result) => console.log(result))
//         .catch((error) => console.error(error));

// }
export const getUserDetails = async (userid) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_USER_DETAILS}/${userid}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  console.log('user details', data)
  return data
}

export const deleteUser = async (token, userId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Access-Control-Allow-Credential', 'true')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_USER}/${userId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()

  if (!response.ok || data.status !== 200) {
    throw new Error(data.message || 'Failed to delete user')
  }

  return data
}

export const validateUser = async (row, Permissions) => {
  console.log('validating', Permissions)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${localStorage.getItem('token')}`)
  myHeaders.append('Content-Type', 'application/json')
  const raw = JSON.stringify({
    id: row?.id,
    isAdminVerified: 1,
    roleDetails: row?.roleDetails,
    //   isBlocked: 0,
    // roleDetails: row.roleDetails,
    branchDetails: row?.branchDetails,
    moduleList: Permissions,
  })

  const requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: raw,
    redirect: 'follow',
    credentials: 'include',
  }
  // console.log(raw)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.VALIDATE_USER}`,
    requestOptions,
  )
  // .then((response) => response.json())
  // .then((result) => console.log(result))
  // .catch((error) => console.error(error));
  const data = await response.json()
  // console.log(data)
  return data
}

export const logout = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.LOGOUT}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}
export const closeVisit = async (token, appointmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_VISIT}/${appointmentId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllPatients = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const normalizedSearch = encodeURIComponent(searchValue || '')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENTS}?searchQuery=${normalizedSearch}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getPatientTreatmentCycles = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_TREATMENTCYCLES}?searchQuery=${searchValue}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getFutureCycles = async (token, filters = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const params = new URLSearchParams()
  if (filters.branchId) params.append('branchId', filters.branchId)
  if (filters.cycleMonth) params.append('cycleMonth', filters.cycleMonth)
  if (filters.cycleYear) params.append('cycleYear', filters.cycleYear)
  const query = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FUTURE_CYCLES}${query}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveFutureCycle = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_FUTURE_CYCLE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getReferringDoctors = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_REFERRING_DOCTORS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createReferringDoctor = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_REFERRING_DOCTOR}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateReferringDoctor = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_REFERRING_DOCTOR}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getReferringDoctorsLog = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_REFERRING_DOCTORS_LOG}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getNewPatientTracker = async (token, branch) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_NEW_PATIENT_TRACKER}?branch=${branch}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllPatientTracker = async (token, params = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const query = new URLSearchParams()
  if (params.fromDate) query.append('fromDate', params.fromDate)
  if (params.toDate) query.append('toDate', params.toDate)
  if (params.branchId) query.append('branchId', params.branchId)
  if (params.patientId) query.append('patientId', params.patientId)
  const qs = query.toString()

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_PATIENT_TRACKER}${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getPatientTrackerSummaryAutomated = async (token, params = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const query = new URLSearchParams()
  if (params.fromDate) query.append('fromDate', params.fromDate)
  if (params.toDate) query.append('toDate', params.toDate)
  if (params.branchId) query.append('branchId', params.branchId)
  if (params.branch) query.append('branch', params.branch)
  const qs = query.toString()

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_TRACKER_SUMMARY_AUTOMATED}${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getPatientTrackerByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_TRACKER_BY_PATIENT}/${encodeURIComponent(patientId)}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const createPatientTrackerData = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_PATIENT_TRACKER}`,
    {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  )

  return response.json()
}

export const editPatientTrackerData = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_PATIENT_TRACKER}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  )

  return response.json()
}

export const upsertPatientTrackerEmbryologyUpt = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPSERT_PATIENT_TRACKER_EMBRYOLOGY_UPT}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
      body: JSON.stringify(payload),
    },
  )

  return response.json()
}

export const getDonarInformation = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DONAR_INFORMATION}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getDonarDataByVisit = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DONAR_DATA_BY_VISIT}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const saveDonarRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const body = new FormData()
  Object.keys(payload).forEach((key) => {
    if (payload[key]) {
      body.append(key, payload[key])
    }
  })

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: body,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_DONAR_RECORD}`,
    requestOptions,
  )
  return response.json()
}

export const updateDonarRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const body = new FormData()
  Object.keys(payload).forEach((key) => {
    if (payload[key]) {
      body.append(key, payload[key])
    }
  })

  const requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: body,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_DONAR_RECORD}`,
    requestOptions,
  )
  return response.json()
}

export const deleteDonorFile = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELET_DONOR_FILE}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  return {
    ...data,
    status: data?.status ?? response.status,
    httpOk: response.ok,
  }
}

export const getDropdowns = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DROPDOWNS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientByAadharOrMobile = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENTS_BY_AADHAAR_OR_MOBILE}/${searchValue}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createPatientRecord = async (
  token,
  payload,
  file,
  // uploadedDocuments,
) => {
  const formData = new FormData()
  const {
    aadhaarCard,
    marriageCertificate,
    affidavit,
    spouseAadhaarPhoto,
    spouseAadhaarPhotoUrl,
    ...rest
  } = payload

  Object.keys(rest).forEach((key) => {
    if (typeof payload[key] === 'object') {
      formData.append(key, JSON.stringify(payload[key]))
    } else {
      formData.append(key, payload[key])
    }
  })

  if (file) formData.append('file', file)
  if (typeof aadhaarCard === 'object') {
    formData.append('aadhaarCard', aadhaarCard)
    // console.log(aadhaarCard)
  }
  if (typeof marriageCertificate === 'object') {
    formData.append('marriageCertificate', marriageCertificate)
  }
  if (typeof affidavit === 'object') {
    formData.append('affidavit', affidavit)
  }
  if (
    spouseAadhaarPhoto &&
    (spouseAadhaarPhoto instanceof File ||
      (typeof spouseAadhaarPhoto === 'object' &&
        spouseAadhaarPhoto !== null &&
        !Array.isArray(spouseAadhaarPhoto)))
  ) {
    const spouseDocFile = new File(
      [spouseAadhaarPhoto],
      `spouse_aadhaar_${Date.now()}_${spouseAadhaarPhoto.name || 'document'}`,
      { type: spouseAadhaarPhoto.type || 'application/octet-stream' },
    )
    formData.append('uploadedDocuments', spouseDocFile)
  }

  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: formData,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_PATIENT_RECORD}`,
    requestOptions,
  )

  return response.json()
}

export const editPatientRecord = async (
  token,
  payload,
  file,
  // uploadedDocuments,
) => {
  const formData = new FormData()
  const {
    aadhaarCard,
    marriageCertificate,
    affidavit,
    spouseAadhaarPhoto,
    spouseAadhaarPhotoUrl,
    ...rest
  } = payload

  // Log payload for debugging
  console.log('Edit Patient Payload:', payload)

  Object.keys(rest).forEach((key) => {
    const value = rest[key]
    // Skip undefined values, but include null and empty strings
    if (value === undefined) {
      return
    }

    if (value === null) {
      formData.append(key, '')
    } else if (typeof value === 'object' && value !== null) {
      formData.append(key, JSON.stringify(value))
    } else {
      // Convert to string for FormData
      formData.append(key, String(value))
    }
  })

  // Handle file uploads
  // Check for File instances (File extends Blob, so instanceof File is the correct check)
  if (
    file &&
    (file instanceof File ||
      (typeof file === 'object' && file !== null && !Array.isArray(file)))
  ) {
    formData.append('file', file)
  }
  if (
    aadhaarCard &&
    (aadhaarCard instanceof File ||
      (typeof aadhaarCard === 'object' &&
        aadhaarCard !== null &&
        !Array.isArray(aadhaarCard)))
  ) {
    console.log(
      'Appending aadhaarCard file to FormData:',
      aadhaarCard.name || aadhaarCard,
    )
    formData.append('aadhaarCard', aadhaarCard)
  }
  if (
    marriageCertificate &&
    (marriageCertificate instanceof File ||
      (typeof marriageCertificate === 'object' &&
        marriageCertificate !== null &&
        !Array.isArray(marriageCertificate)))
  ) {
    console.log(
      'Appending marriageCertificate file to FormData:',
      marriageCertificate.name || marriageCertificate,
    )
    formData.append('marriageCertificate', marriageCertificate)
  }
  if (
    affidavit &&
    (affidavit instanceof File ||
      (typeof affidavit === 'object' &&
        affidavit !== null &&
        !Array.isArray(affidavit)))
  ) {
    console.log(
      'Appending affidavit file to FormData:',
      affidavit.name || affidavit,
    )
    formData.append('affidavit', affidavit)
  }
  if (
    spouseAadhaarPhoto &&
    (spouseAadhaarPhoto instanceof File ||
      (typeof spouseAadhaarPhoto === 'object' &&
        spouseAadhaarPhoto !== null &&
        !Array.isArray(spouseAadhaarPhoto)))
  ) {
    const spouseDocFile = new File(
      [spouseAadhaarPhoto],
      `spouse_aadhaar_${Date.now()}_${spouseAadhaarPhoto.name || 'document'}`,
      { type: spouseAadhaarPhoto.type || 'application/octet-stream' },
    )
    formData.append('uploadedDocuments', spouseDocFile)
  }

  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const requestOptions = {
    method: 'PUT',
    headers: myHeaders,
    body: formData,
    redirect: 'follow',
    credentials: 'include',
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_PATIENT_RECORD}`,
    requestOptions,
  )

  const result = await response.json()
  console.log('Edit Patient Response:', result)

  return result
}
export const getPackageData = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PACKAGE_DATA}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//create package
export const createPackage = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_PACKAGE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//edit package
export const editPackage = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_PACKAGE}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const editGuardianRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_GUARDIAN_RECORD}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const createGuardianRecord = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_GUARDIAN_RECORD}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getVisitsByPatientId = async (token, patientId) => {
  // Prevent API call with null or invalid patient ID
  if (!patientId || patientId === 'null' || patientId === null) {
    return { status: 200, data: [] }
  }

  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VISIT_BY_PATIENTID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  // Handle 404 gracefully
  if (response.status === 404) {
    return { status: 200, data: [] }
  }

  return response.json()
}

export const createVisit = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_VISIT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const saveVisitLmpEdd = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_VISIT_LMP_EDD}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getVisitInfoById = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VISIT_INFO}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDoctorsList = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DOCTORS_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveBlockedTimeSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_BLOCKED_TIME_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBlockedTimeSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BLOCKED_TIME_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveDoctorAvailability = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_DOCTOR_AVAILABILITY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDoctorsForAvailability = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DOCTORS_FOR_AVAILABILITY}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const text = await response.text()
  try {
    const json = text ? JSON.parse(text) : {}
    if (!response.ok && json.status === undefined) {
      return {
        ...json,
        status: response.status,
        message:
          json.message ||
          response.statusText ||
          'Could not load doctor availability',
      }
    }
    return json
  } catch {
    return {
      status: response.status || 500,
      message: 'Could not parse server response',
      data: null,
    }
  }
}

export const updateDoctorActiveStatus = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_DOCTOR_ACTIVE_STATUS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createConsultationOrTreatment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_CONSULTATION_OR_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
// /api/getTreatmentTypes
export const getTreatmentTypes = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_TYPES}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
// GET_APPOINTMENTS_REASONS_LIST
export const getAllAppointmentsReasons = async (token, type, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_REASONS_LIST}?type=${type}&id=${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAppointmentReasonsByPatientType = async (
  token,
  patientTypeId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENT_REASONS_BY_PATIENT_TYPE}?patientTypeId=${patientTypeId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const bookConsultationAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_CONSULTATION_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const bookReviewCallConsultationAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_REVIEW_CALL_CONSULTATION_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const bookTreatmentAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_TREATMENT_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getDoctorsForAvailabilityConsultation = async (
  token,
  date,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const body = { date }
  if (branchId != null && branchId !== '') {
    body.branchId = Number(branchId)
  }
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTATION_DOCTORS_FOR_AVAILABILITY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(body),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDoctorsForAvailabilityTreatment = async (
  token,
  date,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const body = { date }
  if (branchId != null && branchId !== '') {
    body.branchId = Number(branchId)
  }
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_DOCTORS_FOR_AVAILABILITY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(body),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAvailableConsultationSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTATION_AVAILABLE_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAvailableTreatmentSlots = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_AVAILABLE_SLOTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getAppointmentsById = async (token, type, id) => {
  // console.log(`getAppointmentsById`, token, type, id)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_BY_ID}/${id}?type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAppointmentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllAppointmentsByDate = async (token, date, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const branchQuery =
    branchId !== null && branchId !== undefined && branchId !== ''
      ? `?branchId=${branchId}`
      : ''
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_APPOINTMENTS_BY_DATE}/${date}${branchQuery}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  // console.log('response####', response)
  return response.json()
}

export const changeAppointmentStatus = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CHANGE_APPOINTMENT_STAGE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAppointmentsForDoctor = async (token, date) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_BY_DATE}/${date}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentStatus = async (token, visitId, treatmentType) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_STATUS}?visitId=${visitId}&treatmentType=${treatmentType}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentTemplate = async (token, treatmentStartDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DEFAULT_TREATMENT_SHEET}/${treatmentStartDate}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const updateTreatmentStatus = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_STATUS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const updateTreatmentSheetByTreatmentCycleId = async (
  token,
  payload,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_SHEET_BY_TREATMENT_CYCLE_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentSheetByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_SHEET_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientInformationForDoctor = async (
  token,
  patientId,
  appointmentId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_INFORMATION_FOR_DOCTOR}/${patientId}?appointmentId=${appointmentId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAppointmentsHistory = async (token, type, id, date) => {
  // type: Consultation | Treatment
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_HISTORY}?type=${type}&id=${id}&date=${date}`,

    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLineBills = async (token, type, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LINE_BILLS}?createType=${type}&appointmentId=${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLineBills = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LINE_BILLS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getLineBillsAndNotesForAppointment = async (
  token,
  type,
  appointmentId,
) => {
  // type: Consultation | Treatment
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LINEBILLS_AND_NOTES_FOR_APPOINTMENT}?createType=${type}&appointmentId=${appointmentId}`,

    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLineBillsAndNotes = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LINEBILLS_AND_NOTES_FOR_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBillTypeValuesByBillTypeId = (token, billTypeId, branchId) => {
  // type: Consultation | Treatment
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  return fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BILLTYPE_VALUES}/${billTypeId}?branchId=${branchId}`,

    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
}
export const getAllLabTestsByDate = async (token, date, category, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LABTESTS_BY_DATE}/${date}?labCategoryType=${category}&branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getAllLabTests = async (token, fromDate, toDate, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_LAB_TESTS}?fromDate=${fromDate}&&toDate=${toDate}&&branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLabTestsTemplate = async (
  token,
  labTestId,
  appointmentId,
  type,
  isSpouse,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LABTEST_TEMPLATE}?id=${labTestId}&&appointmentId=${appointmentId}&&type=${type}&isSpouse=${isSpouse}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLabTestResult = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LABTEST_RESULT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const saveOutsourcingLabTestResult = async (token, formData) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_OUTSOURCING_LABTEST_RESULT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteOutsourcingLabTestResult = async (
  token,
  labTestResultId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_OUTSOURCING_LABTEST_RESULT}/${labTestResultId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getSavedLabTestResult = async (
  token,
  type,
  appointmentId,
  labTestId,
  isSpouse,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SAVED_LABTEST_RESULT}?type=${type}&appointmentId=${appointmentId}&labTestId=${labTestId}&isSpouse=${isSpouse}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLabTestsFields = async (token, labtestId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LABTESTS_FIELDS}/${labtestId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveLabTestFieldValue = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_LABTEST_FIELD_VALUES}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getSavedLabTestValues = async (
  token,
  type,
  appointmentId,
  labTestId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SAVED_LABTEST_VALUES}?type=${type}&appointmentId=${appointmentId}&labTestId=${labTestId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getProfileDetails = async (token) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PROFILE_DETAILS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateUserProfile = async (token, payload) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_USER_PROFILE}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTaxCategories = async (token, payload) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TAX_CATEGORIES}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createPharmacyMasterData = async (token, payload, url) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const editPharmacyMasterData = async (token, payload, url) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
    {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow',
      body: JSON.stringify(payload),
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPharmacyMasterData = async (token, url) => {
  // call api
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPharmacyDetailsByDate = async (token, date, branch) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PHARMACYITEMS_BY_DATE}?date=${date}&branch=${branch}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const savePharmacyItems = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_PHARMACYITEMS}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

/** Pending Sales: move unsold balance to Prescribed without changing purchase qty */
export const movePendingToPrescribed = async (token, items) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.MOVE_PENDING_TO_PRESCRIBED}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify({ movePendingToPrescribed: items }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getReportsByDate = async (token, fromDate, toDate, branch) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_REPORT_BY_DATE}/?fromDate=${fromDate}&&toDate=${toDate}&&branchId=${branch}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getItemSuggestionGRN = async (token, searchValue) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ITEM_SUGESSIONS}${searchValue}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveGrnDetails = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_GRN_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllGrnData = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_GRN_DATA}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getGrnDataById = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_GRN_BY_ID}/${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getGRNReturnedHistory = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_GRN_HISTORY_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const saveGrnReturn = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_GRN_ITEMS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getGrnBranchTransferPreview = async (token, grnId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_BRANCH_TRANSFER_PREVIEW}?grnId=${grnId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createGrnBranchTransfer = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_BRANCH_TRANSFER}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getGrnBranchTransferHistory = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_BRANCH_TRANSFER_HISTORY}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOrderId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ORDER_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const savePaymentBreakup = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PAYMENT_BREAKUP}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const sendTransactionId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `
    ${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SEND_TRANSACTION_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addPaymentDetails = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_PAYMENT_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getStockExpiryReport = async (token, params = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const query = new URLSearchParams()
  if (params.branchId != null && params.branchId !== '') {
    query.append('branchId', String(params.branchId))
  }
  if (params.reportType) {
    query.append('reportType', params.reportType)
  }
  if (params.nearExpireDays != null) {
    query.append('nearExpireDays', String(params.nearExpireDays))
  }
  const queryString = query.toString()
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_STOCK_EXPIRY_REPORT}${
      queryString ? `?${queryString}` : ''
    }`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getPrescribedPurchaseReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PRESCRIBED_PURCHASE_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getGrnVendorPaymentsReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_GRN_VENDOR_PAYMENTS_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getVendorManufacturerDepartmentReport = async (
  token,
  {
    fromDate,
    toDate,
    departmentId,
    vendorId,
    manufacturerId,
    searchQuery,
    includeReturned,
  } = {},
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const params = new URLSearchParams()
  if (fromDate) params.set('fromDate', fromDate)
  if (toDate) params.set('toDate', toDate)
  if (departmentId) params.set('departmentId', departmentId)
  if (vendorId) params.set('vendorId', vendorId)
  if (manufacturerId) params.set('manufacturerId', manufacturerId)
  if (searchQuery) params.set('searchQuery', searchQuery)
  if (includeReturned != null) params.set('includeReturned', includeReturned)

  const queryString = params.toString()

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.VENDOR_MANUFACTURER_DEPT_REPORT}${
      queryString ? `?${queryString}` : ''
    }`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const download_lab_reports = async (token, payload) => {
  //POST CALL
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_LAB_REPORTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const Generate_Invoice = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GENERATE_INVOICE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SaleReturnInfo = async (token, orderId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SALE_RETURN}/${orderId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getPurchaseReturnInfo = async (token, orderId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PURCHASE_RETURN}/${orderId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const returnPurchasedItems = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_PURCHASED_ITEMS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getFormFReportByDateRange = async (token, fromDate, toDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF_REPORT_BY_DATE_RANGE}?fromDate=${fromDate}&&toDate=${toDate}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDailyReportSummary = async (token, { date, branchId }) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DAILY_REPORT_SUMMARY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        date,
        branchId: Number(branchId) || branchId,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SalesReportDashboard = async (
  token,
  fromDate,
  toDate,
  branchId,
  paymentMode, // optional: 'CASH'|'UPI' or undefined for all
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SALES_REPORT_DASHBOARD}`,
  )
  url.searchParams.append('fromDate', fromDate)
  url.searchParams.append('toDate', toDate)
  url.searchParams.append('branchId', branchId)
  if (paymentMode) url.searchParams.append('paymentMode', paymentMode)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })

  const data = await response.json()

  // Handle 403 Forbidden response (unauthorized access)
  if (response.status === 403) {
    throw new Error('Access restricted. Authorized users only.')
  }

  // Handle other error statuses
  if (!response.ok && response.status !== 403) {
    throw new Error(data.message || 'Failed to fetch revenue data')
  }

  return data
}

export const updateRevenueNewEntry = async (
  token,
  source,
  paymentMasterId,
  paymentData,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVENUE_NEW_ENTRY}/${source}/${paymentMasterId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(paymentData),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update revenue entry')
  }
  return data
}

export const deleteRevenueNewEntry = async (token, source, paymentMasterId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVENUE_NEW_ENTRY}/${source}/${paymentMasterId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete revenue entry')
  }
  return data
}

export const ReturnItems = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RETURN_PHARMACY_ITEMS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPharmacyRefundLogs = async (token, orderId = '') => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const orderIdParam = orderId ? `?orderId=${encodeURIComponent(orderId)}` : ''
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PHARMACY_REFUND_LOGS}${orderIdParam}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getScanByDate = async (token, date, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCAN_BY_DATE}${date}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPrescriptionsByDate = async (token, date, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const branchParam =
    branchId === null || branchId === undefined ? '' : branchId
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PRESCRIPTIONS_BY_DATE}${date}?branchId=${branchParam}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOpuSheetsByDate = async (token, date, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const branchParam =
    branchId === null || branchId === undefined ? '' : branchId
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OPU_SHEETS_BY_DATE}${date}?branchId=${branchParam}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getHysteroLapByDate = async (token, date, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const branchParam =
    branchId === null || branchId === undefined ? '' : branchId
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_HYSTERO_LAP_BY_DATE}${date}?branchId=${branchParam}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getUptResults = async (token, params = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, value)
    }
  })
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_UPT_RESULTS}?${query.toString()}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const saveUptResult = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_UPT_RESULT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editUptResult = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_UPT_RESULT}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteUptResult = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_UPT_RESULT}${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getScanReports = async (token, fromDate, toDate, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCAN_REPORTS}?fromDate=${fromDate}&toDate=${toDate}&branchId=${branchId ?? ''}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getSavedScanResults = async (
  token,
  type,
  appointmentId,
  scanId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCAN_RRESULT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getScanTemplate = async (token, scanId, appointmentId, type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SCAN_TEMPLATE}/${scanId}?type=${type}&appointmentId=${appointmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const SaveScanResult = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_SCAN_RESULT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getFormFTemplate = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
} //SAVE_GRN_PAYMENTS

export const saveGrnPayments = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_GRN_PAYMENTS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//GRN_SALES_REPORT

export const grnSalesReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_SALES_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//GRN_STOCK_REPORT

export const grnStockReport = async (token, branchIds) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const ids = Array.isArray(branchIds) ? branchIds : [branchIds]
  const params = new URLSearchParams()
  ids.forEach((id) => {
    if (id != null && id !== '') {
      params.append('branchId', String(id))
    }
  })
  const qs = params.toString()
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_STOCK_REPORT}${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getGrnStockReportTab = async (
  token,
  fromDate,
  toDate,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const params = new URLSearchParams()
  if (fromDate) params.append('fromDate', fromDate)
  if (toDate) params.append('toDate', toDate)
  if (branchId != null && branchId !== '' && branchId !== 'all') {
    params.append('branchId', String(branchId))
  }
  const qs = params.toString()
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GRN_STOCK_REPORT_TAB}${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPharmacySalesDetailedReport = async (
  token,
  fromDate,
  toDate,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const params = new URLSearchParams()
  if (fromDate) params.append('fromDate', fromDate)
  if (toDate) params.append('toDate', toDate)
  if (branchId != null && branchId !== '' && branchId !== 'all') {
    params.append('branchId', String(branchId))
  }
  const qs = params.toString()
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PHARMACY_SALES_DETAILED_REPORT}${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateGrnStockReportLine = async (
  token,
  grnItemAssociationId,
  payload,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_GRN_STOCK_REPORT_LINE}/${grnItemAssociationId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteGrnStockReportLine = async (
  token,
  grnItemAssociationId,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_GRN_STOCK_REPORT_LINE}/${grnItemAssociationId}?branchId=${branchId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteGrnStockReportItem = async (token, itemId, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_GRN_STOCK_REPORT_ITEM}/${itemId}?branchId=${branchId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateGrnStockReportItemSummary = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_GRN_STOCK_REPORT_ITEM_SUMMARY}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// GET_OT_LIST

export const getOtList = async (token, fromDate, toDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const queryParams = toDate
    ? `fromDate=${fromDate}&toDate=${toDate}`
    : `fromDate=${fromDate}`
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OT_LIST}?${queryParams}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getInjectionSheetList = async (token, fromDate, toDate) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const queryParams = toDate
    ? `fromDate=${fromDate}&toDate=${toDate}`
    : `fromDate=${fromDate}`
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INJECTION_LIST}?${queryParams}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPersonSuggestion = async (token, payload) => {
  console.log(payload)
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PERSONS_SUGGESTIONS}`,
    {
      method: 'POST',
      headers: myHeaders,
      redirect: 'follow',
      body: JSON.stringify(payload),
      credentials: 'include',
    },
  )
  return response.json()
}
export const getInjectionSuggestionList = async (token, itemName) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INJECTION_SUGGESTION_LIST}?itemName=${itemName}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewOT = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_OT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
// save changes
export const saveOTChanges = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_OT_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//addd new injection
export const addNewInjection = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_INJECTION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const saveInjectionChanges = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_INJECTION_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//get expences
export const getExpenses = async (token, filters = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  // Build query string from filters
  const queryParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      // Convert date objects to strings if needed
      if (value instanceof Date) {
        queryParams.append(key, dayjs(value).format('DD-MM-YYYY'))
      } else {
        queryParams.append(key, value.toString())
      }
    }
  })

  const queryString = queryParams.toString()
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EXPENSES}${queryString ? `?${queryString}` : ''}`

  console.log('API Call - URL:', url)
  console.log('API Call - Filters:', filters)
  console.log('API Call - Query String:', queryString)

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}
//post call for add expense

export const addExpense = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_EXPENSE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: payload,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editExpense = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_EXPENSE}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: payload,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOTDropdowns = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OT_DROPDOWNS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getSubCategoryListByCategoryId = async (token, catId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SUBCATEGORIES_BY_CATEGORY}/${catId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//add sub categories by category id

export const addSubCategoryByCategoryId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_SUBCATEGORIES_BY_CATEGORY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//edit sub categories post call

export const editSubCategoryByCategoryId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_SUBCATEGORIES_BY_CATEGORY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//delete subcategory by category id
export const deleteSubCategoryByCategoryId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_SUBCATEGORIES_BY_CATEGORY}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentsData = async (token, date) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENTS_DATA}/${date}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
//GET_Embryology_Data_By_TreamentCycle_ID

export const getEmbryologyDataByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_Embryology_Data_By_TreamentCycle_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getEmbryologyDefaultTemplateData = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_TEMPLATEBY_ID}/${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientsListEmbryology = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')
  myHeaders.append('Authorization', `Bearer ${token}`)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_LIST_OF_PATIENTS}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//GET_TEMPLATE_BASED_ON_TREATMENT_ID

export const getTemplateBasedOnTreatmentId = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TEMPLATE_BASED_ON_TREATMENT_ID}/${id}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//EDIT EMBRYOLOGY

//Vitals
export const getVitalsDetails = async (token, appointmentId, Type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VITALS_DETAILS}?appointmentId=${appointmentId}&type=${Type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editVitalsDetails = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_VITALS_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createVitalsDetails = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_VITALS_DETAILS}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

//Treatment Payment
export const getOrderIdTreatment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ORDER_ID_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const sendTransactionDetailsTreatment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SEND_TRANSACTION_DETAILS_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getChecklistByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CHECKLIST_BY_PATIENT_ID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getConsentFormsList = async (token, type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSENT_FORMS_LIST}?type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getFormFTemplatesByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF_HISTORY_BY_PATIENTID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getFormFTemplatesByScanAppointment = async (
  token,
  appointmentId,
  scanId,
  type,
) => {
  console.log('check entered')
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FORMF_HISTORY_BY_SCAN_APPOINTMENT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const reviewFormFForScanAppointment = async (
  token,
  appointmentId,
  scanId,
  type,
  payload,
) => {
  console.log('check entered')
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_FORMF_FOR_SCAN_APPOINTMENT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadConsentFormById = async (token, id, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_CONSENT_FORM_BY_ID}?id=${id}&&patientId=${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
  // downloadPDF(response)
  return response
}

export const downloadSampleFormF = async (
  token,
  appointmentId,
  scanId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_SAMPLE_FORMF}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
  // downloadPDF(response)
  return response
}

export const getIcsiConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ICSI_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export async function downloadPDF(response) {
  // const response = await fetch('/your-api-endpoint'); // Replace with your actual endpoint
  console.log('response', response)

  if (response.ok) {
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    const fileName = response.headers
      .get('Content-Disposition')
      ?.split('filename=')[1]
    // console.log(response.url.split('patientId=')[1])
    link.download = fileName // Extract filename from header
    link.click()

    window.URL.revokeObjectURL(url)
  } else {
    // Handle error, e.g., display an error message to the user
    console.error('Error downloading PDF:', response.statusText)
  }
}

export const uploadIcsiConsentForm = async (
  token,
  visitId,
  file,
  patientId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('icsiConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_ICSI_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteIcsiConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ICSI_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const reviewIcsiConsents = async (token, visitId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_ICSI_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      body: JSON.stringify(payload),
      credentials: 'include',
    },
  )
  return response.json()
}

export const reviewIuiConsents = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_IUI_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getFETConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FET_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadFETConsentForm = async (token, visitId, file, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('fetConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_FET_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteFETConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_FET_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const reviewFETConsents = async (token, visitId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_FET_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const reviewEraConsents = async (token, visitId, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REVIEW_ERA_CONSENTS}/${visitId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getEraConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ERA_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadEraConsentForm = async (token, visitId, file, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('eraConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_ERA_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const deleteEraConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ERA_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getIuiConsentsByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_IUI_CONSENTS_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const uploadIuiConsentForm = async (token, visitId, file, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('visitId', visitId)
  formData.append('iuiConsent', file)
  formData.append('patientId', patientId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_IUI_CONSENT_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteIuiConsentForm = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_IUI_CONSENT_FORM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadFormFForm = async (
  token,
  appointmentId,
  file,
  scanId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  formData.append('appointmentId', appointmentId)
  formData.append('formF', file)
  formData.append('scanId', scanId)
  formData.append('type', type)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_FORMF_FORM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteFormFForm = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_FORMF_FORM}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const updateTreatmentFETSheetByTreatmentCycleId = async (
  token,
  payload,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_FET_SHEET_BY_TREATMENT_CYCLE_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const getTreatmentFETSheetByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_FET_SHEET_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOpdSheetTemplate = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OPD_SHEET_TEMPLATE}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateOpdSheetTemplate = async (token, patientId, template) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_OPD_SHEET}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        patientId: patientId,
        template: template,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getDischargeSummaryTemplate = async (token, TreatmentCycleId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DISCHARGE_SUMMARY_TEMPLATE}/${TreatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadDischargeSummaryImage = async (
  token,
  treatmentCycleId,
  file,
) => {
  const formData = new FormData()
  formData.append('files[0]', file)

  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_DISCHARGE_SUMMARY_IMAGE}/${treatmentCycleId}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateDischargeSummaryTemplate = async (
  token,
  treatmentCycleId,
  template,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_DISCHARGE_SUMMARY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        treatmentCycleId: treatmentCycleId,
        template: template,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPickupSheetTemplate = async (token, TreatmentCycleId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PICKUP_SHEET_TEMPLATE}/${TreatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyReportsByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_REPORTS_BY_TREATMENT_CYCLE}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updatePickupSheetTemplate = async (
  token,
  treatmentCycleId,
  template,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_PICKUP_SHEET}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({
        treatmentCycleId: treatmentCycleId,
        template: template,
      }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const applyPackageDiscount = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_PACKAGE_DISCOUNT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getCoupons = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_COUPONS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const bookReviewTreatmentCall = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.BOOK_REVIEW_TREATMENT_CALL}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyDataByConsultation = async (
  token,
  consultationId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_DATA_BY_CONSULTATION}/${consultationId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyDataByTreatment = async (token, treatmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_DATA_BY_TREATMENT}/${treatmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyTemplateById = async (
  token,
  id,
  appointmentId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_TEMPLATE_BY_ID}?id=${id}&appointmentId=${appointmentId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SaveEmbryologyTreatment = async (token, payload) => {
  //save embryology treatment data
  const myHeaders = new Headers()
  const formData = new FormData()
  console.log(payload)

  Object.keys(payload).forEach((key) => {
    if (key != 'imageLink' && key != 'embryologyImage') {
      if (typeof payload[key] === 'object') {
        formData.append(key, JSON.stringify(payload[key]))
      } else {
        formData.append(key, payload[key])
      }
    }
  })

  if (Array.isArray(payload.embryologyImage)) {
    payload.embryologyImage.forEach((image, idx) => {
      // If image is a File/Blob, append directly; otherwise, skip or handle as needed
      if (image) {
        formData.append('embryologyImage', image)
      }
    })
  }
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_EMBRYOLOGY_TREATMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const SaveEmbryologyConsultation = async (token, payload, file) => {
  const myHeaders = new Headers()
  const formData = new FormData()
  Object.keys(payload).forEach((key) => {
    if (key != 'imageLink' && key != 'embryologyImage') {
      formData.append(key, payload[key])
    }
  })
  if (Array.isArray(payload.embryologyImage)) {
    payload.embryologyImage.forEach((image, idx) => {
      // If image is a File/Blob, append directly; otherwise, skip or handle as needed
      if (image) {
        formData.append('embryologyImage', image)
      }
    })
  }
  myHeaders.append('Authorization', `Bearer ${token}`)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SAVE_EMBRYOLOGY_CONSULTATION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editEmbryologyTreatment = async (token, payload, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const formData = new FormData()
  console.log(payload, id)
  Object.keys(payload).forEach((key) => {
    if (key !== 'imageLink' && key !== 'embryologyImage') {
      if (typeof payload[key] === 'object') {
        formData.append(key, JSON.stringify(payload[key]))
      } else {
        formData.append(key, payload[key])
      }
    }
  })

  // Handle embryologyImage as an array of multiple images
  if (Array.isArray(payload.embryologyImage)) {
    payload.embryologyImage.forEach((image, idx) => {
      // If image is a File/Blob, append directly; otherwise, skip or handle as needed
      if (image) {
        formData.append('embryologyImage', image)
      }
    })
  }

  console.log(formData)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_EMBROYOLOGY_TREAMENT}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editEmbryologyConsultation = async (token, payload, id) => {
  //edit embryology consultation data
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  const formData = new FormData()
  Object.keys(payload).forEach((key) => {
    if (key != 'imageLink' && key != 'embryologyImage') {
      formData.append(key, payload[key])
    }
  })

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_EMBROYOLOGY_CONSULTATION}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyHistoryByPatientId = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_HISTORY_BY_PATIENT_ID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientVisits = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PATIENT_VISITS}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPatientPharmacyHistory = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PHARMACY_HISTORY_BY_PATIENT_ID}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getEmbryologyHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_EMBRYOLOGY_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getConsultationsHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTATIONS_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentsHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENTS_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getNotesHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_NOTES_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_APPOINTMENT}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const applyNoShow = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_NO_SHOW}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPrescriptionDetailsByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PRESCRIPTION_DETAILS_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getPaymentHistoryByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PAYMENT_HISTORY_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updatePaymentHistory = async (token, paymentId, paymentData) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const sourceQuery =
    paymentData?.source != null && String(paymentData.source).trim() !== ''
      ? `?source=${encodeURIComponent(paymentData.source)}`
      : ''
  const { source, ...payload } = paymentData || {}
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_PAYMENT_HISTORY}/${paymentId}${sourceQuery}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deletePaymentHistory = async (token, paymentId, source) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const sourceQuery =
    source != null && String(source).trim() !== ''
      ? `?source=${encodeURIComponent(source)}`
      : ''
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_PAYMENT_HISTORY}/${paymentId}${sourceQuery}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllAppointmentReasons = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_APPOINTMENT_REASONS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewAppointmentReason = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_APPOINTMENT_REASON}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// export const editAppointmentReason = async (token, payload, id) => {
//   const myHeaders = new Headers()
//   myHeaders.append('Authorization', `Bearer ${token}`)
//   myHeaders.append('Content-Type', 'application/json')

//   const response = await fetch(
//     `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_APPOINTMENT_REASON}/${id}`,
//     {
//       method: 'PUT',
//       headers: myHeaders,
//       body: JSON.stringify(payload),
//     },
//   )
// }

export const deleteAppointmentReason = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_APPOINTMENT_REASON}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
    },
  )
}

export const closeVisitInTreatment = async (token, payload, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_VISIT_IN_TREATMENT}/${visitId}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const closeVisitInConsultation = async (token, payload, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_VISIT_IN_CONSULTATION}/${visitId}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const noShowReport = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.NOSHOW_REPORT}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getItemPurchaseHistoryReport = async (token, itemId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ITEM_PURCHASE_HISTORY_REPORT}/${itemId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllIncidents = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INCIDENT_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getUserSuggestion = async (token, searchQuery) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_USER_SUGGESTION}?searchQuery=`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewIncident = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_INCIDENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editIncident = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_INCIDENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllOrders = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ORDERS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const createNewOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_ORDER}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllPayments = async (token, filters = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const params = new URLSearchParams()
  if (filters?.branchId) params.append('branchId', filters.branchId)
  if (filters?.departmentId) params.append('departmentId', filters.departmentId)
  if (filters?.vendorId) params.append('vendorId', filters.vendorId)
  if (filters?.amount) params.append('amount', filters.amount)
  if (filters?.paymentDate) params.append('paymentDate', filters.paymentDate)
  if (filters?.invoiceDate) params.append('invoiceDate', filters.invoiceDate)
  if (filters?.fromDate) params.append('fromDate', filters.fromDate)
  if (filters?.toDate) params.append('toDate', filters.toDate)
  const query = params.toString()
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_PAYMENTS}${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const createPayment = async (token, formData) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // Don't set Content-Type for FormData, browser will set it with boundary
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_PAYMENT}`,
    {
      method: 'POST',
      body: formData,
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const updatePaymentFiles = async (token, paymentId, formData) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // Don't set Content-Type for FormData, browser will set it with boundary
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_PAYMENT_FILES}/${paymentId}`,
    {
      method: 'PUT',
      body: formData,
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const placeOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PLACE_ORDER}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const payOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PAY_ORDER}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const receiveOrder = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const formData = new FormData()
  formData.append('orderId', payload?.orderId)
  formData.append('receivedDate', payload?.receivedDate?.format('YYYY-MM-DD'))
  formData.append('orderInvoice', payload?.invoiceFile)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RECEIVE_ORDER}`,
    {
      method: 'PUT',
      body: formData,
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllDepartments = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_DEPARTMENTS_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllVendors = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VENDORS_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllVendorsByDepartmentId = async (token, departmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_VENDORS_LIST_BY_DEPARTMENTID}/${departmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllSupplies = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SUPPLIES_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAllSuppliesByDepartmentId = async (token, departmentId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_SUPPLIES_LIST_BY_DEPARTMENT}/${departmentId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getHysteroscopySheetByVisitId = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_HYSTEROSCOPY_SHEET_BY_VISIT_ID}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const updateHysteroscopySheetByVisitId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_HYSTEROSCOPY_SHEET_BY_VISIT_ID}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

const normalizeHysteroscopyPayload = (input = {}) => {
  const parsedPatientId = Number(input?.patientId)
  const parsedVisitId = Number(input?.visitId)
  const toSafeString = (value) => {
    if (value == null || value === '') return ''
    if (Array.isArray(value)) return value.filter(Boolean).join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }
  const pickString = (...values) => {
    for (const value of values) {
      const normalized = toSafeString(value)
      if (normalized) return normalized
    }
    return ''
  }
  return {
    patientId: Number.isFinite(parsedPatientId)
      ? parsedPatientId
      : input?.patientId,
    visitId: Number.isFinite(parsedVisitId) ? parsedVisitId : input?.visitId,
    formType: pickString(input?.formType),
    hospitalBranch: pickString(input?.hospitalBranch, input?.branchLocation),
    clinicalDiagnosis: toSafeString(input?.clinicalDiagnosis),
    lmp: input?.lmp ?? input?.lmpDate ?? null,
    dayOfCycle: toSafeString(input?.dayOfCycle),
    admissionDate: input?.admissionDate ?? null,
    procedureDate: input?.procedureDate ?? null,
    dischargeDate: input?.dischargeDate ?? null,
    gynecologist: pickString(input?.gynecologist, input?.gynaecologistName),
    assistant: pickString(input?.assistant, input?.staffNurseName),
    anesthetist: pickString(input?.anesthetist, input?.anesthetistName),
    otAssistant: pickString(input?.otAssistant, input?.otAssistantName),
    procedureType: pickString(input?.procedureType),
    anesthesiaType: pickString(input?.anesthesiaType, input?.procedure),
    finalDiagnosisAfterOperation: pickString(
      input?.finalDiagnosisAfterOperation,
    ),
    diagnosis: pickString(input?.diagnosis, input?.indications),
    entry: pickString(input?.entry, input?.chiefComplaints),
    uterus: toSafeString(input?.uterus),
    endometrialThickness: toSafeString(input?.endometrialThickness),
    operativeFindings: pickString(
      input?.operativeFindings,
      input?.intraOpFindings,
    ),
    distensionMedia: pickString(
      input?.distensionMedia,
      input?.distentionMedium,
      input?.abnormality,
    ),
    intraopComplications: toSafeString(input?.intraopComplications),
    postopCourse: pickString(input?.postopCourse, input?.courseInHospital),
    reviewOn: input?.reviewOn ?? null,
    dischargeMedications: pickString(
      input?.dischargeMedications,
      input?.postOpInstructions,
    ),
    consultantName: pickString(
      input?.consultantName,
      input?.expertConsultant,
      input?.followUp,
    ),
  }
}

export const createHysteroscopyReport = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const requestPayload = normalizeHysteroscopyPayload(payload)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_HYSTEROSCOPY_REPORT}`,
    {
      method: 'POST',
      body: JSON.stringify(requestPayload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const updateHysteroscopyReport = async (token, idOrPayload, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const requestPayload = normalizeHysteroscopyPayload(payload ?? idOrPayload)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_HYSTEROSCOPY_REPORT}`,
    {
      method: 'POST',
      body: JSON.stringify(requestPayload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getHysteroscopyReport = async (
  token,
  patientId,
  visitId = null,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const queryParams = new URLSearchParams()
  if (patientId != null) queryParams.set('patientId', Number(patientId))
  if (visitId != null) queryParams.set('visitId', Number(visitId))
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_HYSTEROSCOPY_REPORT}?${queryParams.toString()}`
  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })

  return response.json()
}

export const addHysteroscopyReferenceImages = async (
  token,
  hysteroscopyId,
  files = [],
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const formData = new FormData()
  files.forEach((file) => {
    formData.append('hysteroscopyReferenceImages', file)
  })

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_HYSTEROSCOPY_REFERENCE_IMAGES}/${hysteroscopyId}`,
    {
      method: 'POST',
      body: formData,
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const deleteHysteroscopyReferenceImage = async (token, imageId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_HYSTEROSCOPY_REFERENCE_IMAGE}/${imageId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getAppointmentsByPatient = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_APPOINTMENTS_BY_PATIENT}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const applyMarkAsSeenForDoctorAppointment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_MARK_AS_SEEN_FOR_DOCTOR_APPOINTMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllOutsourcingLabTests = async (
  token,
  searchQuery,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const params = new URLSearchParams()
  if (searchQuery) params.append('searchQuery', searchQuery)
  if (branchId) params.append('branchId', branchId)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_OUTSOURCING_LAB_TESTS}?${params.toString()}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getLabReports = async (
  token,
  fromDate,
  toDate,
  branchId,
  labCategoryType,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LAB_REPORTS}?fromDate=${fromDate}&toDate=${toDate}&branchId=${branchId ?? ''}&labCategoryType=${labCategoryType}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const printPrescription = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PRINT_PRESCRIPTION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllTasks = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_TASKS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

export const getTaskDetailsByTaskId = async (taskId, token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TASK_DETAILS}/${taskId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )

  return response.json()
}

// Get task details from taskTracker (includes comments)
export const getTaskTrackerDetails = async (token, taskId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/taskTracker/getTaskDetails/${taskId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createTaskComment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_TASK_COMMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data?.message || 'Failed to create task comment')
    error.response = { data }
    throw error
  }

  return data
}

export const getPendingInformation = async (token, appointmentId, type) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_PENDING_INFORMATION}?appointmentId=${appointmentId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createNewTask = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_NEW_TASK}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editTask = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_TASK}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const applyOptOut = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.APPLY_OPT_OUT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getTreatmentCyclesReport = async (
  token,
  startDate,
  endDate,
  branchId,
  searchQuery,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.TREATMENT_CYCLES_REPORT}?fromDate=${startDate}&&toDate=${endDate}&&branchId=${branchId}&&searchQuery=${searchQuery}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}
export const treatmentCyclesPaymentsReport = async (
  token,
  startDate,
  endDate,
  branchId,
  searchQuery,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.PATIENT_MILESTONES_REPORT}?fromDate=${startDate}&&toDate=${endDate}&&branchId=${branchId}&&searchQuery=${searchQuery}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createOtherAppointmentReason = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_OTHER_APPOINTMENT_REASON}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const createAlert = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_ALERT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllAlerts = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_ALERTS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getNotifications = async (token, limit = 50, offset = 0) => {
  try {
    const myHeaders = new Headers()
    myHeaders.append('Authorization', `Bearer ${token}`)
    myHeaders.append('Content-Type', 'application/json')
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_NOTIFICATIONS}?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
        credentials: 'include',
      },
    )

    // Handle 404 gracefully - return empty array
    if (response.status === 404) {
      return { status: 200, data: [] }
    }

    return response.json()
  } catch (error) {
    // Return empty data on any error
    console.warn('Notifications endpoint not available:', error.message)
    return { status: 200, data: [] }
  }
}

export const getUnreadNotificationsCount = async (token) => {
  try {
    const myHeaders = new Headers()
    myHeaders.append('Authorization', `Bearer ${token}`)
    myHeaders.append('Content-Type', 'application/json')
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_UNREAD_NOTIFICATIONS_COUNT}`,
      {
        method: 'GET',
        headers: myHeaders,
        redirect: 'follow',
        credentials: 'include',
      },
    )

    // Handle 404 gracefully - return count of 0
    if (response.status === 404) {
      return { status: 200, data: { count: 0 } }
    }

    return response.json()
  } catch (error) {
    // Return zero count on any error
    console.warn(
      'Unread notifications count endpoint not available:',
      error.message,
    )
    return { status: 200, data: { count: 0 } }
  }
}

export const markNotificationAsRead = async (token, notificationId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.MARK_NOTIFICATION_AS_READ}/${notificationId}/read`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const markAllNotificationsAsRead = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.MARK_ALL_NOTIFICATIONS_AS_READ}`,
    {
      method: 'PUT',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editAlert = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_ALERT}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteAlert = async (token, alertId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ALERT}/${alertId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAllActiveVisitAppointments = async (token, visitId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ALL_ACTIVE_VISIT_APPOINTMENTS}/${visitId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteReceipt = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_RECEIPT}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteExpense = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_EXPENSE}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getAvailableGrnInfoByItemId = async (
  token,
  itemId,
  type,
  branchId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_AVAILABLE_GRN_INFO_BY_ITEM_ID}?id=${itemId}&type=${type}&branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getConsultantRoasters = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CONSULTANT_ROASTERS}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addConsultantRoaster = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_CONSULTANT_ROASTER}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const editConsultantRoaster = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.EDIT_CONSULTANT_ROASTER}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const downloadEmbryologyReport = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  console.log('payload-in', payload)
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_EMBRYOLOGY_REPORT}?type=${payload?.type}&id=${payload?.id}&categoryType=${payload?.categoryType}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
}
export const downloadEmbryologyImagesReport = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_EMBRYOLOGY_IMAGES_REPORT}?type=${payload?.type}&id=${payload?.id}&categoryType=${payload?.categoryType}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  ).then((response) => {
    downloadPDF(response)
  })
  return response.json()
}

export const getTreatmentERASheetByTreatmentCycleId = async (
  token,
  treatmentCycleId,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TREATMENT_ERA_SHEET_BY_TREATMENT_CYCLE_ID}/${treatmentCycleId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateTreatmentERASheetByTreatmentCycleId = async (
  token,
  payload,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TREATMENT_ERA_SHEET_BY_TREATMENT_CYCLE_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteTaskImage = async (token, imageId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_TASK_IMAGE}/${imageId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadTaskImage = async (token, formData, taskId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_TASK_IMAGE}/${taskId}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOtherPaymentsStatus = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OTHER_PAYMENTS_STATUS}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getOtherPaymentsOrderId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_OTHER_PAYMENTS_ORDER_ID}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const sendOtherPaymentsTransactionId = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.SEND_OTHER_PAYMENTS_TRANSACTION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addOtherPayment = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_OTHER_PAYMENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const downloadOPDSheet = async (token, patientId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_OPD_SHEET}/${patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadScanReport = async (
  token,
  appointmentId,
  scanId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_SCAN_REPORT}?appointmentId=${appointmentId}&scanId=${scanId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadLabReport = async (
  token,
  appointmentId,
  labTestId,
  type,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_LAB_REPORT}?appointmentId=${appointmentId}&labTestId=${labTestId}&type=${type}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response
}

export const downloadOtherPaymentsInvoice = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DOWNLOAD_OTHER_PAYMENTS_INVOICE}?refId=${payload.refId}&patientId=${payload.patientId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const updateAdvancePaymentHistory = async (
  token,
  paymentHistoryId,
  paymentData,
) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_ADVANCE_PAYMENT_HISTORY}/${paymentHistoryId}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(paymentData),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.status !== 200) {
    const err = new Error(data.message || `Update failed (${response.status})`)
    err.status = data.status ?? response.status
    err.data = data
    throw err
  }
  return data
}

export const deleteAdvancePaymentHistory = async (token, paymentHistoryId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ADVANCE_PAYMENT_HISTORY}/${paymentHistoryId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteAdvancePaymentEntry = async (token, refId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ADVANCE_PAYMENT_ENTRY}/${refId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const uploadEmbryologyImage = async (token, formData) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  // myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPLOAD_EMBRYOLOGY_IMAGE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: formData,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const deleteEmbryologyImage = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_EMBRYOLOGY_IMAGE}`,
    {
      method: 'DELETE',
      body: JSON.stringify(payload),
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getIndentList = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INDENT_LIST}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const addNewIndent = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.ADD_NEW_INDENT}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBuildings = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BUILDINGS}/${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok) {
    const errorMessage =
      result.message ||
      result.error ||
      `HTTP ${response.status}: Failed to fetch buildings`
    throw new Error(errorMessage)
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || 'Failed to fetch buildings')
  }
  return result
}

export const getFloors = async (token, buildingId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_FLOORS}/${buildingId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok) {
    const errorMessage =
      result.message ||
      result.error ||
      `HTTP ${response.status}: Failed to fetch floors`
    throw new Error(errorMessage)
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || 'Failed to fetch floors')
  }
  return result
}

export const getRooms = async (token, floorId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ROOMS}/${floorId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok) {
    const errorMessage =
      result.message ||
      result.error ||
      `HTTP ${response.status}: Failed to fetch rooms`
    throw new Error(errorMessage)
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || 'Failed to fetch rooms')
  }
  return result
}

export const getBeds = async (token, roomId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BEDS}/${roomId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok) {
    const errorMessage =
      result.message ||
      result.error ||
      `HTTP ${response.status}: Failed to fetch beds`
    throw new Error(errorMessage)
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || 'Failed to fetch beds')
  }
  return result
}
export const getActiveIP = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ACTIVE_IP}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getClosedIP = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CLOSED_IP}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ========== LAYOUT MANAGEMENT APIs ==========

// State APIs
export const createState = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_STATE}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok) {
    const errorMessage =
      result.message ||
      result.error ||
      `HTTP ${response.status}: Failed to create state`
    throw new Error(errorMessage)
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || 'Failed to create state')
  }
  return result
}

export const getStates = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_STATES}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok) {
    throw new Error(
      result.message || `HTTP ${response.status}: Failed to fetch states`,
    )
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || 'Failed to fetch states')
  }
  return result
}

export const updateState = async (token, id, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_STATE}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to update state')
  }
  return result
}

// City APIs
export const createCity = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_CITY}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to create city')
  }
  return result
}

export const getCities = async (token, stateId = null) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const url = stateId
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CITIES}?stateId=${stateId}`
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_CITIES}`
  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to fetch cities')
  }
  return result
}

export const updateCity = async (token, id, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_CITY}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to update city')
  }
  return result
}

// Branch APIs
export const createBranch = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_BRANCH}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to create branch')
  }
  return result
}

export const getBranches = async (token, cityId = null) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const url = cityId
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BRANCHES}?cityId=${cityId}`
    : `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BRANCHES}`
  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  const result = await response.json()
  if (!response.ok) {
    const errorMessage =
      result.message ||
      result.error ||
      `HTTP ${response.status}: Failed to fetch branches`
    throw new Error(errorMessage)
  }
  if (result.status && result.status !== 200) {
    throw new Error(result.message || 'Failed to fetch branches')
  }
  return result
}

export const updateBranch = async (token, id, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_BRANCH}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to update branch')
  }
  return result
}

// Building APIs
export const createBuilding = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_BUILDING}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to create building')
  }
  return result
}

export const updateBuilding = async (token, id, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_BUILDING}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to update building')
  }
  return result
}

// Floor APIs
export const createFloor = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_FLOOR}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to create floor')
  }
  return result
}

export const updateFloor = async (token, id, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_FLOOR}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to update floor')
  }
  return result
}

export const deleteFloor = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_FLOOR}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to delete floor')
  }
  return result
}

// Room APIs
export const createRoom = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_ROOM}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to create room')
  }
  return result
}

export const updateRoom = async (token, id, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_ROOM}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to update room')
  }
  return result
}

export const deleteRoom = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_ROOM}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to delete room')
  }
  return result
}

// Bed APIs
export const createBed = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_BED}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to create bed')
  }
  return result
}

export const createBedsBulk = async (token, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_BEDS_BULK}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to create beds')
  }
  return result
}

export const updateBed = async (token, id, data) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_BED}/${id}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(data),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to update bed')
  }
  return result
}

export const deleteBed = async (token, id) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_BED}/${id}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  const result = await response.json()
  if (!response.ok || result.status !== 200) {
    throw new Error(result.message || 'Failed to delete bed')
  }
  return result
}

export const createIPRegistration = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_IP_REGISTRATION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const closeIpRegistration = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CLOSE_IP_REGISTRATION}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const registerBuildingStructure = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.REGISTER_BUILDING}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getLayoutOverview = async (token, branchId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_LAYOUT_OVERVIEW}?branchId=${branchId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

export const getBedDetails = async (token, bedId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_BED_DETAILS}/${bedId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ========== TICKETS API FUNCTIONS ==========

// Get all tickets with filters and pagination
export const getTickets = async (token, filters = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const queryParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value.toString())
    }
  })

  const queryString = queryParams.toString()
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TICKETS}${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}

// Get ticket details by ID
export const getTicketDetails = async (token, ticketId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TICKET_DETAILS}/${ticketId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Create new ticket
export const createTicket = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_TICKET}`,
      {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(payload),
        redirect: 'follow',
        credentials: 'include',
      },
    )

    const data = await response.json()

    // If response is not ok, throw an error with the message from the API
    if (!response.ok) {
      const error = new Error(data.message || 'Failed to create ticket')
      error.response = { data }
      error.status = response.status
      throw error
    }

    return data
  } catch (error) {
    // If it's already our custom error, re-throw it
    if (error.response) {
      throw error
    }
    // Otherwise, wrap it
    const wrappedError = new Error(error.message || 'Failed to create ticket')
    wrappedError.originalError = error
    throw wrappedError
  }
}

// Update ticket
export const updateTicket = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TICKET}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Update ticket status
export const updateTicketStatus = async (token, ticketId, status) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TICKET_STATUS}/${ticketId}/status`,
    {
      method: 'PATCH',
      headers: myHeaders,
      body: JSON.stringify({ ticketId, status }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Delete ticket
export const deleteTicket = async (token, ticketId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_TICKET}/${ticketId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Create ticket comment
export const createTicketComment = async (token, ticketId, commentText) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_TICKET_COMMENT}/${ticketId}/comments`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify({ ticketId, commentText }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Get active staff for assignment dropdown
export const getActiveStaff = async (token) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_ACTIVE_STAFF}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ==================== TASKS API ====================

// Get all tasks with filters and pagination
export const getTasks = async (token, filters = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const queryParams = new URLSearchParams()
  if (filters.status) queryParams.append('status', filters.status)
  if (filters.search) queryParams.append('search', filters.search)
  if (filters.page) queryParams.append('page', filters.page)
  if (filters.limit) queryParams.append('limit', filters.limit)

  const queryString = queryParams.toString()
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TASKS}${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}

// Get task details by ID
export const getTaskDetails = async (token, taskId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_TASK_DETAILS}/${taskId}`,
    {
      method: 'GET',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Create new task
export const createTask = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CREATE_TASK}`,
    {
      method: 'POST',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Update task
export const updateTask = async (token, payload) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TASK}`,
    {
      method: 'PUT',
      headers: myHeaders,
      body: JSON.stringify(payload),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Update task status
export const updateTaskStatus = async (token, taskId, status) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.UPDATE_TASK_STATUS}/${taskId}/status`,
    {
      method: 'PATCH',
      headers: myHeaders,
      body: JSON.stringify({ taskId, status }),
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// Delete task
export const deleteTask = async (token, taskId) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.DELETE_TASK}/${taskId}`,
    {
      method: 'DELETE',
      headers: myHeaders,
      redirect: 'follow',
      credentials: 'include',
    },
  )
  return response.json()
}

// ==================== INBOX API ====================

// Get inbox items (alerts + comments)
export const getInboxItems = async (token, filters = {}) => {
  const myHeaders = new Headers()
  myHeaders.append('Authorization', `Bearer ${token}`)
  myHeaders.append('Content-Type', 'application/json')

  const queryParams = new URLSearchParams()
  if (filters.type) queryParams.append('type', filters.type)
  if (filters.page) queryParams.append('page', filters.page)
  if (filters.limit) queryParams.append('limit', filters.limit)

  const queryString = queryParams.toString()
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.GET_INBOX_ITEMS}${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
    credentials: 'include',
  })
  return response.json()
}
