import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setUser } from '@/redux/userSlice'
import Link from 'next/link'
import { API_ROUTES } from '../../constants/constants'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useRouter } from 'next/router'
import Image from 'next/image'
import doctor from '../../../public/login.png'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import hospitalImage from '../../../public/hospital_image.jpg'
import originslogo from '../../../public/originslogo.png'
import { useQueryClient } from '@tanstack/react-query'
import { getNewAccessToken } from '@/constants/apis'
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

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  const router = useRouter()

  const initialValues = {
    email: '',
    password: '',
  }

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be atleast 8 characters long')
      .required('Password is required'),
  })
  const queryClient = useQueryClient()

  const handleLogin = (values, { setSubmitting, setErrors }) => {
    const { email, password } = values
    const loginApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.LOGIN}`
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Access-Control-Allow-Origin', '*')
    var raw = JSON.stringify({
      email: email,
      password: password,
    })
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
      credentials: 'include',
    }

    fetch(loginApiUrl, requestOptions)
      .then(response => {
        return response.json()
      })
      .then(async result => {
        console.log('res:', result)
        if (result.status === 400 || result.status === 404) {
          if (result.message === 'Session Already Exists, Please Logout') {
            console.log('invalidating loggedUserInfo')
            const refreshTokenResponseJson = await getNewAccessToken('token')
            if (refreshTokenResponseJson.status == 200) {
              // already user details are there but only accessToken is expired then accesstoken is replaced with new accessToken
              dispatch(
                setUser({
                  ...user,
                  accessToken: refreshTokenResponseJson.data.accessToken,
                }),
              )
              localStorage.setItem(
                'token',
                refreshTokenResponseJson.data.accessToken,
              )
              router.push('/home')
              return {
                ...user,
                accessToken: refreshTokenResponseJson.data.accessToken,
              }
            }
          }
          setErrors({ login: result.message })
          toast.error(result.message, toastconfig)
          setSubmitting(false)
        } else {
          const { accessToken, userDetails } = result?.data
          const {
            id,
            userName,
            fullName,
            email,
            roleDetails,
            moduleList,
            branchDetails,
          } = userDetails
          localStorage.setItem('token', accessToken)

          const userObject = {
            id,
            userName,
            fullName,
            email,
            roleDetails,
            branchDetails,
            moduleList,
            accessToken,
            isAuthenticated: true,
          }
          dispatch(setUser(userObject))

          const redirectPath = sessionStorage.getItem('redirectPath')

          if (redirectPath) {
            router.push(redirectPath)
            sessionStorage.removeItem('redirectPath')
          } else {
            router.push('/home')
          }
        }
      })
      .catch(error => {
        console.error('Error:', error)
        toast.error(
          'An error occurred while logging in. Please try again later.',
          toastconfig,
        )
        setSubmitting(false)
      })
  }

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Right Section - Form */}
      <div className="col-span-1 w-full flex flex-col justify-center px-8 lg:px-16 py-12">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Please enter your credentials to login
            </p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleLogin}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                    placeholder="your@email.com"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-rose-500 text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Field
                    id="password"
                    name="password"
                    type="password"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                    placeholder="Enter your password"
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-rose-500 text-xs mt-1"
                  />
                  <div className="flex justify-end mt-2">
                    <Link
                      href="/login/forgotpassword"
                      className="text-sm font-medium text-secondary hover:text-secondary/80 transition duration-150"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 mt-6"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Login'
                  )}
                </button>
              </Form>
            )}
          </Formik>

          <div className="mt-8 space-y-2">
            <div className="flex justify-center mt-1">
              <Link
                href="/login/changePassword"
                className="text-sm font-medium text-secondary hover:text-secondary/80 transition duration-150"
              >
                Change password?
              </Link>
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {`Don't have an account? `}
              <Link
                href="/register"
                className="font-medium text-secondary hover:text-secondary/80 transition duration-150"
              >
                Register here
              </Link>
            </p>
            {/* 
            <div className="flex justify-center">
              <Link
                href="https://api.originshms.com/test"
                className="text-sm font-medium text-secondary hover:text-secondary/80 transition duration-150"
                target="_blank"
              >
                Get Application Access
              </Link>
            </div> */}
          </div>
        </div>
      </div>
      {/* Left Section - Image */}
      <div className="col-span-1 hidden lg:flex bg-cover bg-center justify-center items-center p-12 bg-gradient-to-br from-primary via-white to-secondary">
        <Image src={originslogo} alt="origins logo" className="relative" />
      </div>
    </div>
  )
}

export default Login
