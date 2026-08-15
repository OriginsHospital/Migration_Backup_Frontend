import { getFormFTemplate } from '@/constants/apis'
import { useState, useEffect, useRef, use } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { hideLoader, showLoader } from '@/redux/loaderSlice'
import dynamic from 'next/dynamic'
import Breadcrumb from '@/components/Breadcrumb'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

function TextJoedit({ placeholder, contents }) {
  const editor = useRef(null)
  const [content, setContent] = useState(contents)

  // const config = useMemo(
  //     {
  //         readonly: false, // all options from https://xdsoft.net/jodit/docs/,
  //         placeholder: placeholder || 'Start typings...'
  //     },
  //     [placeholder]
  // );
  // console.log(content)
  return (
    <div>
      <div className="my-5">
        <Breadcrumb />
      </div>
      <JoditEditor
        ref={editor}
        value={content}
        tabIndex={1} // tabIndex of textarea
        onBlur={newContent => () => {}} // preferred to use only this option to update the content for performance reasons
        config={{
          readonly: false,
          removeButtons: [
            'video',
            'table',
            'code',
            'link',
            'speechRecognize',
            'speech',
          ],
        }}
      />
    </div>
  )
}
const Index = () => {
  const user = useSelector(store => store.user)
  const [templateData, setTemplateData] = useState(null)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const { data: FormFTemplateInfo, isLoading: isFormLoading } = useQuery({
    queryKey: ['FormFAPI'],
    enabled: !!true,
    queryFn: async () => {
      const responsejson = await getFormFTemplate(user.accessToken)
      if (responsejson.status == 200) {
        setTemplateData(responsejson.data)
        return responsejson.data
      } else {
        throw new Error('Error occurred while fetching appointments for doctor')
      }
    },
  })
  useEffect(() => {
    if (isFormLoading) {
      dispatch(showLoader())
    } else {
      dispatch(hideLoader())
    }
  }, [isFormLoading])
  return (
    <>
      {templateData ? (
        <div className="p-4">
          <TextJoedit contents={templateData} />
        </div>
      ) : (
        <div className="flex w-full h-full justify-center">
          <span className="flex w-full justify-center items-center">
            No data found
          </span>
        </div>
      )}
    </>
  )
}

export default withPermission(Index, true, 'formF', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
