import { Provider } from 'react-redux'
import { store } from '@/redux/store'
import '@/styles/globals.css'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import PageMiddleware from '@/components/PageMiddleware'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { SideNav } from '@/components/SideNav'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import PreLoginContainer from '@/components/PreLoginContainer'
import { ThemeProvider } from '@mui/material/styles'
import { useEffect } from 'react'
import { requestInterceptor } from '../utils/requestInterceptor'

const queryClient = new QueryClient()
import theme from '../styles/theme'
import { Loader } from '@/components/Loader'
import { ToastContainer } from 'react-toastify'
import Script from 'next/script'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    requestInterceptor()
  }, [])

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ThemeProvider theme={theme}>
            <Loader>
              <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
              />
              <ToastContainer />
              {/* <SideDrawer /> */}
              {router.pathname.startsWith('/login') ||
              router.pathname === '/register' ||
              router.pathname.startsWith('/resetpassword') ? (
                <PreLoginContainer>
                  <Component key={router.asPath} {...pageProps} />
                </PreLoginContainer>
              ) : (
                <PageMiddleware key={router.pathname}>
                  <Header />
                  <Component key={router.pathname} {...pageProps} />
                </PageMiddleware>
              )}
            </Loader>
          </ThemeProvider>
          {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </LocalizationProvider>
      </QueryClientProvider>
    </Provider>
  )
}
