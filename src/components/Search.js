import React, { useEffect, useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useSelector } from 'react-redux'
const Search = ({
  fieldsToSearch, //Mention path of fields to be searched from data
  setToState, // calling prograMs setState obj that is used for rendering JSX
  size, // Size of search components
  enableSearchButton, // enable to filter data on search click, disable to filter based on each value entered( recommeded to enable)
}) => {
  const [searchValue, setSearchValue] = useState('')
  const prescribedData = useSelector(store => store.search)
  const searchButtonClicked = () => {
    if (searchValue && prescribedData?.data?.length != 0) {
      let getter1 = null
      let getter2 = null
      let searchedObject = null
      if (fieldsToSearch && fieldsToSearch[0]) {
        getter1 = new Function('obj', `return obj.${fieldsToSearch[0]}`)
      }
      if (searchValue && fieldsToSearch[1]) {
        getter2 = new Function('obj', `return obj.${fieldsToSearch[1]}`)
      }
      if (getter1 && getter2) {
        searchedObject = prescribedData?.data?.filter(
          info =>
            // info?.patientDetails?.fullName.includes(searchValue),
            getter1(info)
              .toLocaleLowerCase()
              ?.includes(searchValue.toLocaleLowerCase()) ||
            getter2(info)?.includes(searchValue),
        )
      } else {
        let activeFuncRef = null
        activeFuncRef = getter1 ? getter1 : getter2
        searchedObject = prescribedData?.data?.filter(info =>
          activeFuncRef(info)
            .toLocaleLowerCase()
            ?.includes(searchValue)
            .toLocaleLowerCase(),
        )
      }
      if (searchedObject) {
        setToState(searchedObject)
      }
    } else {
      setToState(prescribedData?.data)
    }
  }
  useEffect(() => {}, [])
  return (
    <div className=" flex w-full justify-center items-center pt-3">
      <TextField
        id="filled-search"
        label="Search by name or phone no."
        type="search"
        variant="outlined"
        size={size}
        onChange={e => {
          setSearchValue(e.target.value)
        }}
        className="w-80"
        inputProps={{ width: '320px' }}
      />
      {/* <ul className=''>
        <li>{'Ram'}</li>
      </ul> */}
      {enableSearchButton && (
        <div>
          <Button variant="text" size="large" onClick={searchButtonClicked}>
            <SearchOutlinedIcon />
          </Button>
        </div>
      )}
    </div>
  )
}

export default Search
