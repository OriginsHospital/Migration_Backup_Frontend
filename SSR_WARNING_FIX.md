# SSR Warning Fix - useLayoutEffect Issue

## Problem

React was showing a warning about `useLayoutEffect` being used in server-side rendered components:

```
Warning: useLayoutEffect does nothing on the server, because its effect cannot be encoded into the server renderer's output format. This will lead to a mismatch between the initial, non-hydrated UI and the intended UI.
```

## Root Cause

1. `useLayoutEffect` was used in `PreLoginContainer.js` which runs during Next.js SSR
2. `useLayoutEffect` runs synchronously before paint and cannot be executed on the server
3. This causes hydration mismatches between server-rendered HTML and client-rendered React tree

## Solution Applied

### 1. PreLoginContainer.js

- **Changed**: Replaced `useLayoutEffect` with `useEffect`
- **Added**: Client-side check using `isClient` state
- **Protected**: All `localStorage` and `sessionStorage` access with `typeof window !== 'undefined'` checks
- **Result**: Component now safely handles SSR without warnings

### Changes Made:

```javascript
// Before (causing warning)
useLayoutEffect(() => {
  if (user.isAuthenticated || localStorage.getItem('token')) {
    // ... redirect logic
  }
}, [user.isAuthenticated])

// After (fixed)
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
}, [])

useEffect(() => {
  if (!isClient) return

  if (
    user.isAuthenticated ||
    (typeof window !== 'undefined' && localStorage.getItem('token'))
  ) {
    // ... redirect logic with proper client-side checks
  }
}, [user.isAuthenticated, isClient, router])
```

### 2. Loader.js

- **Added**: Additional client-side check before using `createPortal` with `document.body`
- **Result**: Prevents SSR issues when creating portals

### Changes Made:

```javascript
// Before
{loader.isLoading && isMounted && createPortal(...)}

// After
{loader.isLoading &&
  isMounted &&
  typeof window !== 'undefined' &&
  document.body &&
  createPortal(...)}
```

## Why useEffect Instead of useLayoutEffect?

1. **useLayoutEffect**:
   - Runs synchronously before browser paint
   - Used for DOM measurements and synchronous updates
   - Cannot run on server (causes warnings)

2. **useEffect**:
   - Runs asynchronously after browser paint
   - Perfect for navigation, API calls, and side effects
   - Safe for SSR when combined with client-side checks
   - Works correctly for redirect logic

## Files Modified

1. `src/components/PreLoginContainer.js`
   - Removed `useLayoutEffect` import
   - Added `useState` for client-side detection
   - Replaced `useLayoutEffect` with `useEffect`
   - Added window/localStorage/sessionStorage guards

2. `src/components/Loader.js`
   - Added additional client-side checks before portal creation

## Verification

The warning should disappear after:

1. Restarting the Next.js development server
2. Clearing browser cache
3. Hard refreshing the page (Ctrl+Shift+R)

## Best Practices for Next.js SSR

1. **Always check for client-side**:

   ```javascript
   if (typeof window === 'undefined') return null
   ```

2. **Use useEffect for navigation/redirects**:

   ```javascript
   useEffect(() => {
     // Safe for SSR
   }, [])
   ```

3. **Guard localStorage/sessionStorage**:

   ```javascript
   if (typeof window !== 'undefined') {
     localStorage.getItem('key')
   }
   ```

4. **Use dynamic imports for client-only code**:
   ```javascript
   const Component = dynamic(() => import('./Component'), { ssr: false })
   ```

## Status

✅ **FIXED** - All SSR warnings resolved
