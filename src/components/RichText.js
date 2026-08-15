import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

export default function RichText({ value, setValue, readOnly }) {
  const modules = readOnly
    ? {
        toolbar: false,
      }
    : {
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [
            { list: 'ordered' },
            { list: 'bullet' },
            { indent: '-1' },
            { indent: '+1' },
          ],
          ['link', 'image'],
          ['clean'],
        ],
      }

  return (
    <ReactQuill
      value={value}
      onChange={setValue}
      readOnly={readOnly}
      modules={modules}
      placeholder={`Notes...`}
    />
  )
}
