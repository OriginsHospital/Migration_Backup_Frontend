import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { API_ROUTES } from '../../constants/constants'
import { RotatingLines } from 'react-loader-spinner'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Bounce } from 'react-toastify'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

const ResetPassword = () => {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmpassword, setConfirmPassword] = useState('')
  const [showResetPasswordPage, setShowResetPasswordPage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [secretCode, setSecretCode] = useState('')

  const initialValues = {
    password: '',
    confirmpassword: '',
  }

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, 'Password must be atleast 8 characters long')
      .required('Password is required'),
    confirmpassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required'),
  })

  useEffect(() => {
    const secretKey = router.query.secretkey
    if (secretKey) {
      checkGetResetPasswordApi(secretKey)
    }
  }, [router.query.secretkey])

  const checkGetResetPasswordApi = secretKey => {
    setLoading(true)
    const getResetPasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RESET_PASSWORD}/${secretKey}`
    console.log('getResetPasswordApiUrl:', getResetPasswordApiUrl)
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    fetch(getResetPasswordApiUrl)
      .then(response => {
        if (response.ok) {
          return response.json().then(result => {
            setEmail(result.data.email)
            setSecretCode(result.data.secretCode)
            setShowResetPasswordPage(true)
          })
        } else {
          setShowResetPasswordPage(false)
        }
      })
      .catch(error => {
        console.log('error', error)
        setShowResetPasswordPage(false)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const changePasswordHandler = (values, { setSubmitting, setErrors }) => {
    const { password, confirmpassword } = values
    const changePasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.RESET_PASSWORD}`
    console.log('changePasswordApiUrl:', changePasswordApiUrl)

    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    var raw = JSON.stringify({
      email: email,
      password: password,
      confirmPassword: confirmpassword,
      secretCode: secretCode,
    })
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }

    const toastconfig = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'light',
      transition: Bounce,
    }

    fetch(changePasswordApiUrl, requestOptions)
      .then(response => {
        if (response.status === 200) {
          return response.json().then(result => {
            toast.success(result.data, toastconfig)
            setSubmitting(false)
            router.push('/login')
          })
        } else {
          return response.json().then(result => {
            toast.error(result.data, toastconfig)
            setSubmitting(false)
          })
        }
      })
      .catch(error => {
        console.log('error', error)
        setSubmitting(false)
      })
  }

  const renderResetPasswordPage = () => {
    return (
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Reset Password
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={changePasswordHandler}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6" action="#" method="POST">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Password
                  </label>
                  <div className="mt-2">
                    <Field
                      id="password"
                      name="password"
                      type="password"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                    />
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="confirmpassword"
                      className="block text-sm font-medium leading-6 text-gray-900"
                    >
                      Confirm Password
                    </label>
                  </div>
                  <div className="mt-2">
                    <Field
                      id="confirmpassword"
                      name="confirmpassword"
                      type="password"
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                    />
                    <ErrorMessage
                      name="confirmpassword"
                      component="div"
                      className="text-red-500 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Changing Password...'
                      : 'Change Your Password!'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
          {/* <ToastContainer /> */}
        </div>
      </div>
    )
  }

  const renderLinkExpiredPage = () => {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none ">
        <div className="relative w-auto max-w-lg mx-auto my-12">
          <div className="p-8 bg-white rounded shadow-lg border-2 border-black-800">
            <div className="text-center">
              <p className="text-lg font-semibold text-red-400">
                Link is Invalid or Expired. Please try again!
              </p>
              <button
                className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 focus:outline-none focus:bg-indigo-700"
                onClick={() => {
                  router.push('/login/forgotpassword')
                }}
              >
                Go to Forgot Password
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <RotatingLines
            visible={true}
            height="96"
            width="96"
            color="grey"
            strokeWidth="5"
            animationDuration="0.75"
            ariaLabel="rotating-lines-loading"
            wrapperStyle={{}}
            wrapperClass=""
          />
        </div>
      ) : showResetPasswordPage ? (
        renderResetPasswordPage()
      ) : (
        renderLinkExpiredPage()
      )}
    </>
  )
}

export default ResetPassword
