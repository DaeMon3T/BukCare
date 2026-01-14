import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Clock, ArrowLeft, CalendarCheck, Share2, Mail, CheckCircle2, 
  Stethoscope, Award, ShieldCheck, Star, Banknote
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import DoctorReviews from "@/components/DoctorReviews"; 

// Match Backend Response
interface DoctorDetails {
  doctor_id: number;
  user_id: number;
  name: string;
  email: string;
  specialization: string;
  address: string;
  license_number: string;
  years_of_experience: number;
  bio: string | null;
  consultation_fee: number | null;
  is_verified: boolean;
  avatar: string;
  availabilities: any[];
}

const getInitials = (name: string) => {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
};

const ViewDoctorProfile: React.FC = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State for Review Stats from Child Component
  const [reviewStats, setReviewStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await api.get(`/doctors/${id}`); 
        setDoctor(res.data);
      } catch (err) {
        console.error("Failed to load doctor details");
        toast.error("Could not load doctor details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDoctor();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Dr. ${doctor?.name}`,
          text: `Check out this doctor on BukCare!`,
          url: url,
        });
      } catch (err) { console.log("Share cancelled"); }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied!");
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div></div>;

  if (!doctor) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">Doctor not found.</p></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[100px] mix-blend-multiply" />
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] mix-blend-multiply" />
        </div>
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div className="bg-white shadow-sm pb-4 relative z-0">
        <div className="h-40 md:h-60 w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-cyan-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
            <button onClick={() => navigate("/patient/find-doctor")} className="absolute top-4 left-4 z-10 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition">
                <ArrowLeft className="w-6 h-6" />
            </button>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-16 sm:-mt-20 flex flex-col items-center sm:flex-row sm:items-end sm:space-x-6">
                
                {/* Avatar */}
                <div className="relative">
                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full ring-4 ring-white bg-white shadow-lg overflow-hidden">
                        <img 
                            src={doctor.avatar} 
                            alt={doctor.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${getInitials(doctor.name)}&background=0d9488&color=ffffff&size=256`; }}
                        />
                    </div>
                    {doctor.is_verified && (
                        <div className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-md" title="Verified Doctor">
                            <CheckCircle2 className="w-5 h-5 text-blue-500 fill-current" />
                        </div>
                    )}
                </div>

                {/* Name & Stats */}
                <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 leading-tight">Dr. {doctor.name}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-slate-500 font-medium">
                                <span className="px-3 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold uppercase tracking-wider border border-teal-100">
                                    {doctor.specialization}
                                </span>
                                <span className="text-slate-300">•</span>
                                
                                {/* Dynamic Review Stats */}
                                <span className="flex items-center gap-1 text-sm font-bold text-slate-700">
                                    <Star className="w-4 h-4 text-orange-400 fill-current" /> 
                                    {reviewStats.count > 0 ? reviewStats.average.toFixed(1) : "New"} 
                                    <span className="font-normal text-slate-500 ml-1">
                                        ({reviewStats.count} Reviews)
                                    </span>
                                </span>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button onClick={handleShare} className="px-5 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2">
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => navigate(`/patient/book/${id}`)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                <CalendarCheck className="w-5 h-5" /> Book Appointment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
                
                {/* Stats */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 text-lg">At a Glance</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="bg-slate-50 p-2 rounded-lg"><Award className="w-5 h-5 text-slate-400" /></div>
                            <div>
                                <p className="font-bold text-slate-700">{doctor.years_of_experience} Years</p>
                                <p className="text-xs text-slate-400">Experience</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="bg-slate-50 p-2 rounded-lg"><MapPin className="w-5 h-5 text-slate-400" /></div>
                            <div>
                                <p className="font-bold text-slate-700 line-clamp-1">{doctor.address}</p>
                                <p className="text-xs text-slate-400">Clinic Location</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="bg-slate-50 p-2 rounded-lg"><ShieldCheck className="w-5 h-5 text-slate-400" /></div>
                            <div>
                                <p className="font-bold text-slate-700 font-mono">{doctor.license_number}</p>
                                <p className="text-xs text-slate-400">Medical License</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fees */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 text-lg">Clinic Details</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Clock className="w-4 h-4 text-teal-500" />
                            <span>Mon - Fri, 09:00 AM - 05:00 PM</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-teal-500" />
                            <span className="truncate">{doctor.email}</span>
                        </div>
                    </div>
                    
                    {/* CONSULTATION FEE DISPLAY */}
                    <div className="mt-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2 mb-2">
                             <Banknote className="w-4 h-4 text-blue-500" />
                             <p className="text-xs font-bold text-slate-400 uppercase">Consultation Fee</p>
                        </div>
                        <p className="text-3xl font-black text-slate-800">
                            ₱ {doctor.consultation_fee || "500"} 
                            <span className="text-sm font-medium text-slate-400 ml-1">/ visit</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-500" /> About Dr. {doctor.name.split(" ")[0]}
                </h3>
                {doctor.bio ? (
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {doctor.bio}
                    </p>
                ) : (
                    <div className="text-slate-600 leading-relaxed space-y-4">
                        <p>
                            Dr. {doctor.name} is a board-certified <strong>{doctor.specialization}</strong> dedicated to providing comprehensive care to patients. 
                            With over <strong>{doctor.years_of_experience} years of experience</strong> in the field, Dr. {doctor.name.split(" ").pop()} has a proven track record of accurate diagnoses and effective treatment plans.
                        </p>
                        <p>
                            Currently practicing at <strong>{doctor.address}</strong>, the clinic offers a modern and comfortable environment for all patients.
                        </p>
                    </div>
                )}
            </div>

            <div id="reviews">
                <DoctorReviews 
                    doctorId={Number(id)} 
                    onStatsUpdate={(stats) => setReviewStats(stats)}
                />
            </div>
        </div>
      </main>
    </div>
  );
};

export default ViewDoctorProfile;