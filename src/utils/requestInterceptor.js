export function requestInterceptor(accesstoken) {
  const { fetch: originalFetch } = window

  window.fetch = async (...args) => {
    const [resource, config] = args

    const response = await originalFetch(resource, {
      ...config,
    })

    // Suppress 404 errors for notifications endpoints (endpoints may not be deployed yet)
    if (response.status === 404 && typeof resource === 'string') {
      const isNotificationEndpoint = resource.includes('/notifications')
      if (isNotificationEndpoint) {
        // Don't log 404 errors for notifications - they're handled gracefully
        return response
      }
    }

    // console.log('response$$$$', response.status)
    if (response.status == 401) {
      const currentPath = window.location.pathname + window.location.search
      if (currentPath !== '/login') {
        sessionStorage.setItem('redirectPath', currentPath)
      }

      window.location.replace('/login')
    }
    return response
  }
}
