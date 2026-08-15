import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { API_ROUTES } from '../../constants/constants'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

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

function ChangePassword() {
  const initialValues = {
    email: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    oldPassword: Yup.string().required('Old password is required'),
    newPassword: Yup.string().required('New password is required'),
    confirmPassword: Yup.string()
      .required('Confirm password is required')
      .oneOf([Yup.ref('newPassword'), null], 'Passwords must match'),
  })

  const handleChangePassword = (
    values,
    { setSubmitting, setErrors, resetForm },
  ) => {
    const { email, oldPassword, newPassword } = values
    const changePasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.CHANGE_PASSWORD}`
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    var raw = JSON.stringify({
      email: email,
      oldPassword: oldPassword,
      newPassword: newPassword,
    })
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    }

    fetch(changePasswordApiUrl, requestOptions)
      .then(response => {
        return response.json().then(result => {
          if (response.status === 200) {
            toast.success(
              result.message || 'Password changed successfully!',
              toastconfig,
            )
            resetForm() // Clear the form on success
            setSubmitting(false)
          } else {
            toast.error(
              result.message || 'Failed to change password',
              toastconfig,
            )
            setSubmitting(false)
          }
        })
      })
      .catch(error => {
        console.log('error', error)
        setSubmitting(false)
        toast.error('An error occurred! Please try again later.', toastconfig)
      })
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Change your password ?
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleChangePassword}
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form className="space-y-4" action="#" method="POST">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-2">
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 p-2"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="oldPassword"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Old Password
                </label>
                <div className="mt-2">
                  <Field
                    id="oldPassword"
                    name="oldPassword"
                    type="password"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                  />
                  <ErrorMessage
                    name="oldPassword"
                    component="div"
                    className="text-red-500 p-2"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  New Password
                </label>
                <div className="mt-2">
                  <Field
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                  />
                  <ErrorMessage
                    name="newPassword"
                    component="div"
                    className="text-red-500 p-2"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Confirm Password
                </label>
                <div className="mt-2">
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
                  />
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-red-500 p-2"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !isValid || !dirty}
                  className="flex w-full justify-center rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Please wait...' : 'Get Your Password'}
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link
            href="/login"
            className="font-semibold leading-6 text-secondary hover:text-secondary"
          >
            click here to Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ChangePassword
