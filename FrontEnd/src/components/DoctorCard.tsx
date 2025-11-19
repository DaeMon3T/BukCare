// import React from "react";

// interface Specialization {
//   name?: string;
//   descriptions?: string;
// }

// export interface Doctor {
//   doctor_id: number;
//   avatar: string;
//   name: string;
//   specialization?: Specialization;
//   address: string;
//   email: string;
// }

// interface DoctorCardProps {
//   doctor: Doctor;
// }

// const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
//   return (
//     <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
//       {/* Doctor Header */}
//       <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-blue-100 to-purple-100">
//         <img
//           src={doctor.avatar}
//           alt={doctor.name}
//           className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
//         />
//         <h3 className="text-xl font-semibold text-gray-800">{doctor.name}</h3>
//         <p className="text-sm text-blue-600 font-medium">
//           {doctor.specialization?.name}
//         </p>
//       </div>

//       {/* Doctor Info */}
//       <div className="p-6 space-y-3">
//         <div>
//           <p className="text-sm text-gray-500">📍 Address</p>
//           <p className="text-gray-800 font-medium">{doctor.address}</p>
//         </div>

//         <div>
//           <p className="text-sm text-gray-500">📧 Email</p>
//           <p className="text-gray-800 font-medium">{doctor.email}</p>
//         </div>

//         <div>
//           <p className="text-sm text-gray-500">🩺 About</p>
//           <p className="text-gray-700 text-sm line-clamp-3">
//             {doctor.specialization?.descriptions}
//           </p>
//         </div>

//         <button className="mt-4 w-full bg-[#F5CC00] to-purple-600 text-black py-2.5 rounded-xl font-medium hover:opacity-90 transition">
//           Book Appointment
//         </button>
//       </div>
//     </div>
//   );
// };

// export default DoctorCard;

import React from "react";

interface Specialization {
  name?: string;
  descriptions?: string;
}

export interface Doctor {
  doctor_id: number;
  avatar: string;
  name: string;
  specialization?: Specialization;
  address: string;
  email: string;
}

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group ml-10">
      {/* Doctor Header - Clean White Style to match 'How it Works' cards */}
      <div className="flex flex-col items-center text-center p-6 pb-0">
        <div className="relative">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-2 group-hover:border-[#FFC107] transition-colors duration-300"
          />
        </div>
        
        {/* Brand Navy Blue for Name */}
        <h3 className="text-xl font-bold text-[#002D62] mb-1">
            {doctor.name}
        </h3>
        
        {/* Secondary Blue for Specialization */}
        <p className="text-sm text-[#0056B3] font-semibold bg-blue-50 px-3 py-1 rounded-full">
          {doctor.specialization?.name}
        </p>
      </div>

      {/* Doctor Info */}
      <div className="p-6 space-y-4">
        {/* Divider */}
        <div className="border-t border-gray-100"></div>

        <div className="space-y-3">
            <div className="flex items-start space-x-3">
                <span className="text-xl">📍</span>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Address</p>
                    <p className="text-[#002D62] text-sm font-medium leading-tight">
                        {doctor.address}
                    </p>
                </div>
            </div>

            <div className="flex items-start space-x-3">
                <span className="text-xl">📧</span>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Email</p>
                    <p className="text-[#002D62] text-sm font-medium">
                        {doctor.email}
                    </p>
                </div>
            </div>

            <div>
                 <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">About</p>
                 <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                    {doctor.specialization?.descriptions}
                 </p>
            </div>
        </div>

        {/* Brand Yellow Button with Navy Text */}
        <button className="mt-4 w-full bg-[#FFC107] text-[#002D62] py-2 rounded-xl font-bold hover:bg-[#ffcd38] transition-colors shadow-sm">
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;