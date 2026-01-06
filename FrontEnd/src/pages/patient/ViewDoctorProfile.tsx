import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  MapPin, 
  Clock, 
  ArrowLeft,
  CalendarCheck,
  Share2,
  Mail,
  CheckCircle2,
  Stethoscope,
  Award
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/services/api";
import Navbar from "@/components/Navbar";
import DoctorReviews from "@/components/DoctorReviews"; 
import defaultAvatar from "@/assets/images/default_avatar.png";

// 1. INTERFACE: Matches your JSON Response exactly
interface DoctorDetails {
  doctor_id: number;
  user_id: number;
  name: string;        // "KENT HARVEY BONGCALES"
  email: string;
  specialization: string; // "Cardiology"
  address: string;     // "San Jose..."
  license_number: string;
  years_of_experience: number;
  bio: string | null;
  consultation_fee: number | null;
  is_verified: boolean;
  avatar: string;      // 👈 This was the missing key!
  availabilities: any[]; // We can type this strictly later if needed
}

// Helper to generate initials
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const ViewDoctorProfile: React.FC = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Doctor Details
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
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard!");
    }
  };

  const handleBook = () => {
    navigate(`/patient/book/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-200 rounded-full"></div>
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!doctor) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Doctor not found.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-600 selection:bg-[#00aeef] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Back Button */}
        <div className="mb-8">
            <Link to="/patient/find-doctor" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#00aeef] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Find Doctors
            </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* --- LEFT COLUMN: PROFILE CARD (Sticky) --- */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 sticky top-24">
                    
                    {/* Profile Header */}
                    <div className="text-center mb-6">
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            
                            {/* FIXED: Use doctor.avatar */}
                            <img 
                                src={doctor.avatar || defaultAvatar} 
                                alt={doctor.name} 
                                className="w-full h-full object-cover rounded-full border-4 border-slate-50 shadow-md"
                                
                                // Fallback to Initials if the URL is broken (404)
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null; 
                                    target.src = `https://ui-avatars.com/api/?name=${getInitials(doctor.name)}&background=00aeef&color=ffffff&size=256`;
                                }}
                            />
                            
                            {/* Verification Badge (Only if verified) */}
                            {doctor.is_verified && (
                                <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-sm">
                                    <CheckCircle2 className="w-6 h-6 text-[#00aeef] fill-current" />
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 mb-1">
                            Dr. {doctor.name}
                        </h1>
                        <div className="inline-block bg-blue-50 text-[#00aeef] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {doctor.specialization}
                        </div>
                    </div>

                    {/* Quick Stats (Added from JSON data) */}
                    <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6 mb-6 text-center">
                        <div>
                            <p className="text-lg font-black text-slate-800">{doctor.years_of_experience}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase">Years Exp.</p>
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-800">{doctor.license_number ? "Yes" : "No"}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase">Licensed</p>
                        </div>
                    </div>

                    {/* Contact / Info List */}
                    <div className="space-y-5 text-left mb-8">
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                            <span className="text-sm text-slate-600">
                                {doctor.address || "Clinic address not updated"}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600">
                                Mon - Fri, 8:00 AM - 5:00 PM
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="text-sm text-slate-600 truncate">{doctor.email}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button 
                            onClick={handleBook}
                            className="w-full py-3.5 bg-[#00aeef] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-[#009bd5] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            <CalendarCheck className="w-5 h-5" /> Book Appointment
                        </button>
                        
                        <button 
                            onClick={handleShare}
                            className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Share2 className="w-5 h-5" /> Share Profile
                        </button>
                    </div>

                </div>
            </div>

            {/* --- RIGHT COLUMN: DETAILS & REVIEWS --- */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Bio Section */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-[#00aeef]" /> Professional Summary
                    </h3>
                    
                    {doctor.bio ? (
                        <p className="text-slate-500 leading-relaxed whitespace-pre-line">
                            {doctor.bio}
                        </p>
                    ) : (
                        <div className="text-slate-500 leading-relaxed">
                            <p className="mb-4">
                                Dr. {doctor.name} is a dedicated <strong>{doctor.specialization}</strong> with <strong>{doctor.years_of_experience} years</strong> of experience in the medical field.
                                Committed to providing high-quality healthcare to the community in {doctor.address}.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl">
                                <Award className="w-4 h-4 text-orange-500" />
                                License No: {doctor.license_number}
                            </div>
                        </div>
                    )}
                </div>

                {/* 🌟 REVIEWS COMPONENT 🌟 */}
                <div id="reviews">
                    <DoctorReviews doctorId={Number(id)} />
                </div>

            </div>

        </div>
      </main>
    </div>
  );
};

export default ViewDoctorProfile;