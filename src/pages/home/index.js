import { Board } from '@/components/Board'
import Header from '@/components/Header'
import HoverDevCards from '@/components/HoverDevCards'
import { IoArrowForwardOutline } from 'react-icons/io5'

function Home() {
  // const listOfservices = [
  //   {
  //     id: 1,
  //     name: 'Patient ',
  //     desc: 'Manage patient demographics and medical records',
  //   },
  //   {
  //     id: 2,
  //     name: 'Laboratory',
  //     desc: 'Track and analyze patient’s laboratory test results',
  //   },
  //   {
  //     id: 3,
  //     name: 'Pharmacy',
  //     desc: 'Handle user orders and medication dispensing ',
  //   },
  //   {
  //     id: 4,
  //     name: 'User Management',
  //     desc: 'Manage all the health workers’ information and schedules',
  //   },
  //   {
  //     id: 5,
  //     name: 'Visits',
  //     desc: 'Manage patient’s appointments and treatment cycles',
  //   },
  //   {
  //     id: 6,
  //     name: 'Access Management',
  //     desc: 'Manage users access to the application',
  //   },
  // ]
  return (
    <div>
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 items-center justify-items-center">
        {listOfservices.map((service, index) => (
          <Card service={service} key={index} />
        ))}

      </div> */}
      <div>
        <HoverDevCards />
      </div>
    </div>
  )
}

const Card = ({ service }) => {
  return (
    // <div className="flex flex-col max-w-64 gap-2 border border-[#E4E4E4] rounded-md p-3  hover:shadow-sm hover:shadow-black shadow-black cursor-pointer bg-white">
    <div className="group relative z-10 block w-full -translate-x-0.5 -translate-y-0.5 overflow-hidden border-2 border-neutral-950 bg-white p-4 transition-transform hover:-translate-x-2 hover:-translate-y-2 active:translate-x-0 active:translate-y-0 hover:border-b-4 rounded-lg hover:border-r-4 cursor-pointer  ">
      <span className="font-semibold">{service.name}</span>
      <div className="flex justify-between items-end ">
        <span className="text-sm"> {service.desc}</span>

        {/* <span>
          {' '}
          <IoArrowForwardOutline
            size={30}
            enableBackground={true}
            className="hover:bg-black hover:text-white hover:rounded-full transition-all cursor-pointer"
          />
        </span> */}
      </div>
    </div>
  )
}

export default Home
