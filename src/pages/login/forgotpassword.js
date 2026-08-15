import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Link from 'next/link'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Bounce } from 'react-toastify'
import { API_ROUTES } from '../../constants/constants'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'

function ForgotPassword() {
  const dispatch = useDispatch()

  const initialValues = {
    email: '',
  }

  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
  })

  const handleForgotPassword = (values, { setSubmitting, setErrors }) => {
    const { email } = values
    const forgotPasswordApiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${API_ROUTES.FORGOT_PASSWORD}`
    console.log('forgotPasswordApiUrl:', forgotPasswordApiUrl)
    var myHeaders = new Headers()
    myHeaders.append('Content-Type', 'application/json')
    var raw = JSON.stringify({
      email: email,
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

    fetch(forgotPasswordApiUrl, requestOptions)
      .then(response => {
        if (response.status === 200) {
          return response.json().then(result => {
            toast.success(result.message, toastconfig)
            setSubmitting(false)
          })
        } else {
          return response.json().then(result => {
            toast.error(result.message, toastconfig)
            setSubmitting(false)
          })
        }
      })
      .catch(error => {
        console.log('error', error)
        setSubmitting(false)
        toast.error('An error occurred!  Please try again later.', toastconfig)
      })
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Forgot your password ?
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleForgotPassword}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6" action="#" method="POST">
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  {isSubmitting ? 'Please wait...' : 'Get Your Password'}
                </button>
                {/* <ToastContainer /> */}
              </div>
            </Form>
          )}
        </Formik>

        <p className="mt-10 text-center text-sm text-gray-500">
          {'not registered ? '}
          <Link
            href="/register"
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            click here to register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
