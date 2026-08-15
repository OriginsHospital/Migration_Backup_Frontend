import React, { useState, useMemo, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import { debounce } from 'lodash'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { getPersonSuggestion } from '@/constants/apis'

const otPersonDesignation = [
  { id: 1, name: 'consultant' },
  { id: 2, name: 'surgeon' },
  { id: 3, name: 'anesthetist' },
  { id: 4, name: 'ot_staff' },
  { id: 5, name: 'embryologist' },
  { id: 6, name: 'nurse' },
]

// const fetchPersonSuggestions = async ({ queryKey }) => {
//     const [_, searchText, designationId, token] = queryKey;
//     if (!searchText) return [];

//     const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/outPatient/getPersonSuggestion`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ searchText, designationId })
//     });
//     const data = await response.json();
//     if (data.status === 200) {
//         return data.data;
//     }
//     throw new Error('Failed to fetch suggestions');
// };

const PersonAutocomplete = ({
  label,
  designationName,
  value,
  onChange,
  multiple = false,
  className = 'min-w-56',
  op = [],
}) => {
  const [inputValue, setInputValue] = useState('')
  const designationId = useMemo(() => {
    return otPersonDesignation.find(d => d.name === designationName)?.id
  }, [designationName])

  const debouncedSetInputValue = useMemo(
    () => debounce(setInputValue, 1000),
    [],
  )
  const user = useSelector(store => store.user)
  const [autoCompleteOptions, setAutoCompOptions] = useState(op)
  const { data: options, isLoading } = useQuery({
    queryKey: [
      'personSuggestions',
      inputValue,
      designationId,
      user?.accessToken,
    ],
    queryFn: async () => {
      const payload = { searchText: inputValue, designationId }
      console.log('payload in comp', payload)
      const res = await getPersonSuggestion(user?.accessToken, payload)
      console.log('res', res)
      setAutoCompOptions(res.data)
      return res.data
    },
    enabled: inputValue.length > 0,
  })

  const handleInputChange = (event, newInputValue) => {
    debouncedSetInputValue(newInputValue)
    console.log('handleInputChange', newInputValue)
    // setInputValue(newInputValue);
  }

  const handleChange = (event, newValue) => {
    console.log('handleChange', newValue)
    onChange(newValue)
  }
  useEffect(() => {
    console.log(op)
  }, [])

  return (
    <Autocomplete
      className={className}
      options={autoCompleteOptions}
      getOptionLabel={option => option?.personName || ''}
      value={
        options?.find(option => option.id === value?.id) ||
        op?.find(option => option?.id === value?.id)
      }
      onChange={handleChange}
      onInputChange={handleInputChange}
      loading={isLoading}
      multiple={multiple}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}

export default PersonAutocomplete
