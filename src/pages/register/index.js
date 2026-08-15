import { useState, useMemo, useEffect, useRef } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import { Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Link from 'next/link'
import { API_ROUTES } from '@/constants/constants'
import { useRouter } from 'next/router'
import Image from 'next/image'
import leftImage from '../../../public/login.png'
import { useQuery } from '@tanstack/react-query'
import { getRoles } from '@/constants/apis'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import Select from 'react-select'
import { useSelector } from 'react-redux'
import { CgEye, CgEyeAlt } from 'react-icons/cg'
import originslogo from '../../../public/originslogo.png'
import Footer from '@/components/Footer'
function Register() {
  const router = useRouter()

  const initialValues = {
    fullName: '',
    email: '',
    aadhaarNo: '',
    userName: '',
    password: '',
    confirmPassword: '',
    role: '',
    branches: [],
    otp: '',
  }

  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isValidAadhaar = (value) => {
    if (!/^\d{12}$/.test(value)) {
      return false
    }
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
    ]
    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
    ]
    let checksum = 0
    const reversed = value.split('').reverse()
    for (let i = 0; i < reversed.length; i += 1) {
      checksum = d[checksum][p[i % 8][parseInt(reversed[i], 10)]]
    }
    return checksum === 0
  }

  const validationSchema = Yup.object({
    fullName: Yup.string().required('Full Name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    aadhaarNo: Yup.string()
      .required('Aadhaar Number is required')
      .matches(/^[0-9]{12}$/, 'Aadhaar Number must be exactly 12 digits')
      .test(
        'aadhaar-valid',
        'Invalid Aadhaar Number',
        (value) => !value || isValidAadhaar(value),
      ),
    userName: Yup.string().required('Username is required'),
    password: Yup.string()
      .min(8, 'Password must be atleast 8 characters long')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required'),
    role: Yup.string().required('Role is required'),
    branches: Yup.array()
      .min(1, 'Please select at least one branch')
      .required('Branch is required'),
    otp: otpSent
      ? Yup.string()
          .matches(/^[0-9]{6}$/, 'OTP must be exactly 6 digits')
          .required('OTP is required')
      : Yup.string(),
  })
  const dropdowns = useSelector((store) => store.dropdowns)
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

  const { data } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),

    enabled: true,
  })

  // const branches = useMemo(() => {
  //   return [
  //     { branchName: 'Hyderabad_Main', branchValue: 1 },
  //     { branchName: 'Vizag Main', branchValue: 2 },
  //     { branchName: 'Kukatpally', branchValue: 3 },
  //   ]
  // }, [])

  function onRoleChange(e, setFieldValue) {
    const selectedRoleValue = e.target.value
    setFieldValue('role', selectedRoleValue)
  }

  function onBranchChange(e, setFieldValue) {
    const selectedBranchValue = e.target.value
    setFieldValue('branches', selectedBranchValue ? [selectedBranchValue] : [])
  }

  const onSubmit = async (values, { setSubmitting }) => {
    try {
      if (otpSent) {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL + API_ROUTES.VERIFY_OTP,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: values.email,
              aadhaarNo: values.aadhaarNo,
              userName: values.userName,
              fullName: values.fullName,
              password: values.password,
              confirmPassword: values.confirmPassword,
              roleId: Number(values.role),
              branches: values.branches,
              otp: values.otp.toString(),
            }),
          },
        )
        if (response.ok) {
          toast.success('Registered successfully', toastconfig)
          setTimeout(() => router.push('/login'), 2000)
        } else {
          const errorData = await response.json()
          // toast.error(errorData?.message || 'Failed to Register', toastconfig)
          throw new Error(errorData?.message || 'Failed to verify OTP')
        }
      } else {
        // If OTP is not sent, send OTP
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL + API_ROUTES.SEND_OTP,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: values.email,
              aadhaarNo: values.aadhaarNo,
              userName: values.userName,
              fullName: values.fullName,
              password: values.password,
              confirmPassword: values.confirmPassword,
            }),
          },
        )
        // console.log('response',)
        const response = await res.json()
        if (response.status == 200) {
          setOtpSent(true)
          toast.success('OTP sent successfully', toastconfig)
          setSubmitting(false)
        }
        // otp sent already
        else if (
          response.status === 400 &&
          response.message ===
            'OTP ALREADY SENT. Please Verify/Resend after sometime'
        ) {
          setOtpSent(true)
          toast.error('OTP already sent', toastconfig)
          setSubmitting(false)
        } else {
          const errorData = response
          toast.error(errorData?.message || 'Failed to send OTP', toastconfig)
          throw new Error(errorData?.message || 'Failed to send OTP')
          setSubmitting(false)
        }
      }
    } catch (error) {
      toast.error(
        error.message || 'Failed ! Please try again later',
        toastconfig,
      )
    } finally {
      setSubmitting(false)
    }
  }
  useEffect(() => {
    console.log('drop', dropdowns)
  }, [dropdowns])

  const handleOtpChange = (e, index, setFieldValue, values) => {
    const value = e.target.value
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      const newOtp = values.otp.split('')
      newOtp[index] = value
      const finalOtp = newOtp.join('')
      setFieldValue('otp', finalOtp)

      // Auto focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(
          `input[name='otp-${index + 1}']`,
        )
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      const prevInput = document.querySelector(`input[name='otp-${index - 1}']`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e, setFieldValue) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text')
    if (/^[0-9]{6}$/.test(pasteData)) {
      setFieldValue('otp', pasteData)
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 grid-rows-1 lg:grid-cols-2 h-screen">
        {/* Left Section - Image */}
        <div className="col-span-1 hidden lg:flex  bg-cover bg-center justify-center items-center p-8 bg-gradient-to-br from-primary via-white to-secondary">
          <Image src={originslogo} alt="doctor image" className="relative " />
        </div>

        {/* Right Section - Form */}
        <div className="col-span-1 w-full flex flex-col justify-center px-8 lg:px-16 py-12 overflow-y-scroll ">
          <div className="max-w-md w-full mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Create Account
              </h2>
              <p className="text-gray-600">Join us to start your journey</p>
            </div>

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={onSubmit}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form className="space-y-3">
                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Full Name Field */}
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <Field
                        name="fullName"
                        type="text"
                        disabled={otpSent}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                        placeholder="Enter your full name"
                      />
                      <ErrorMessage
                        name="fullName"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    {/* Email Field */}
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Field
                        name="email"
                        type="email"
                        disabled={otpSent}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                        placeholder="your@email.com"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    {/* Username Field */}
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Aadhaar Number
                      </label>
                      <Field
                        name="aadhaarNo"
                        type="text"
                        disabled={otpSent}
                        maxLength={12}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                        placeholder="Enter 12-digit Aadhaar number"
                      />
                      <ErrorMessage
                        name="aadhaarNo"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    {/* Username Field */}
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <Field
                        name="userName"
                        type="text"
                        disabled={otpSent}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                        placeholder="Choose a username"
                      />
                      <ErrorMessage
                        name="userName"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    {/* Password Fields */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <Field
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          disabled={otpSent}
                          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 pr-10"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 mt-1 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <CgEyeAlt className="h-5 w-5" />
                          ) : (
                            <CgEye className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Field
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          disabled={otpSent}
                          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150 pr-10"
                        />
                        {/* <button
                        type="button"
                        className="absolute inset-y-0 right-0 mt-1 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <CgEyeAlt className="h-5 w-5" />
                        ) : (
                          <CgEye className="h-5 w-5" />
                        )}
                      </button> */}
                      </div>
                      <ErrorMessage
                        name="confirmPassword"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    {/* Role and Branch Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Role
                      </label>
                      <Field
                        as="select"
                        name="role"
                        disabled={otpSent}
                        onChange={(e) => onRoleChange(e, setFieldValue)}
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-150"
                      >
                        <option value="">Select Role</option>
                        {data?.status == 200 &&
                          data.data?.map((eachRole) => (
                            <option key={eachRole.name} value={eachRole.id}>
                              {eachRole.name}
                            </option>
                          ))}
                      </Field>
                      <ErrorMessage
                        name="role"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Branch
                      </label>
                      <Select
                        instanceId="postType"
                        name="branches"
                        isMulti
                        // disabled={otpSent}
                        options={dropdowns?.branches.map((branch) => ({
                          value: branch.id,
                          label: branch.name,
                        }))}
                        onChange={(selectedOptions) => {
                          // if (otpSent) {
                          setFieldValue(
                            'branches',
                            selectedOptions.map((option) => option.value),
                          )
                          // }
                        }}
                        className="mt-1"
                        styles={{
                          control: (base) => ({
                            ...base,
                            borderRadius: '0.5rem',
                            borderColor: '#D1D5DB',
                          }),
                        }}
                      />
                      <ErrorMessage
                        name="branches"
                        component="div"
                        className="text-rose-500 text-xs mt-1"
                      />
                    </div>

                    {/* OTP Field */}
                    {otpSent && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Enter OTP
                        </label>
                        <div className="flex gap-2 justify-between">
                          {[...Array(6)].map((_, index) => (
                            <Field key={index} name="otp">
                              {({ field, form }) => (
                                <input
                                  type="text"
                                  name={`otp-${index}`}
                                  maxLength="1"
                                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                                  value={field.value[index] || ''}
                                  onChange={(e) =>
                                    handleOtpChange(
                                      e,
                                      index,
                                      form.setFieldValue,
                                      form.values,
                                    )
                                  }
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                  onPaste={(e) =>
                                    handlePaste(e, form.setFieldValue)
                                  }
                                  style={{
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'textfield',
                                  }}
                                />
                              )}
                            </Field>
                          ))}
                        </div>
                        <ErrorMessage
                          name="otp"
                          component="div"
                          className="text-rose-500 text-xs mt-2"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Enter the 6-digit code sent to your email
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white  bg-secondary hover:bg-secondary/80 hover:to-primary/80 focus:outline-none focus:ring-2 focus:ring-offset-2  transition duration-150"
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
                        Processing...
                      </span>
                    ) : otpSent ? (
                      'Verify OTP and Register'
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </Form>
              )}
            </Formik>

            {/* Login Link */}
            <p className="mt-8 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150"
              >
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
