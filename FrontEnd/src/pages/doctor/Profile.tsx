import { useEffect, useState, type ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
} from "@/services/users/UsersAPI";
import api from "@/services/api"; 
import DoctorReviews from "@/components/DoctorReviews";
import { 
  CalendarRange, MapPin, User, Camera, Mail, Phone, Edit2, 
  Stethoscope, Award, FileBadge, CheckCircle2, Clock, AlertCircle, Banknote, FileText, Star,
  Upload, Sparkles, Plus
} from "lucide-react";

// Updated Interface to include Doctor-specific fields for editing
interface UserProfile {
  fname: string;
  mname?: string;
  lname: string;
  sex?: boolean | null;
  dob?: string;
  contact_number?: string;
  email: string;
  picture?: string;
  is_doctor_approved?: boolean;
  // Doctor specific fields we want to edit:
  bio?: string;
  consultation_fee?: number;
  address?: {
    province?: string;
    city?: string;
    barangay?: string;
  };
  status?: string;
}

interface DoctorData {
    doctor_id: number;
    license_number: string;
    years_of_experience: number;
    specialization: string;
    is_doctor_approved: boolean;
    consultation_fee: number;
    bio: string;
    average_rating?: number;
    total_reviews?: number;
}

// --- MODAL COMPONENT ---
const EditProfileModal = ({
  isOpen,
  onClose,
  formData,
  handleChange,
  handleSave,
  saving
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: UserProfile;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSave: () => Promise<void>;
  saving: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Edit Doctor Profile</h2>
              <p className="text-slate-500 text-sm">Update your professional details</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="p-8 space-y-8">
          
          {/* PROFESSIONAL DETAILS (New Section) */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-teal-600 uppercase tracking-widest flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Consultation Fee (₱)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₱</span>
                        <input 
                            type="number" 
                            name="consultation_fee" 
                            value={formData.consultation_fee ?? ""}
                            onChange={handleChange}
                            className="w-full pl-8 p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-slate-50/50 font-bold text-slate-700" 
                            placeholder="e.g. 500"
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Availability Status</label>
                    <div className="relative">
                        <select 
                            name="status" 
                            value={formData.status || "available"} 
                            onChange={handleChange} 
                            className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-slate-50/50 font-bold text-slate-700 appearance-none"
                        >
                            <option value="available">Available</option>
                            <option value="on_leave">On Leave</option>
                            <option value="busy">Busy / Fully Booked</option>
                        </select>
                        <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                           <Clock className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Professional Bio</label>
                    <textarea 
                        name="bio" 
                        rows={4}
                        value={formData.bio || ""} 
                        onChange={handleChange} 
                        className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-slate-50/50 transition-all font-medium resize-none" 
                        placeholder="Tell patients about your experience and specialization..."
                    />
                </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Personal Info */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">First Name</label>
                    <input type="text" name="fname" value={formData.fname} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Last Name</label>
                    <input type="text" name="lname" value={formData.lname} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Middle Name</label>
                    <input type="text" name="mname" value={formData.mname || ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Gender</label>
                    <select name="sex" value={formData.sex === true ? "true" : formData.sex === false ? "false" : ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50">
                      <option value="">Select...</option>
                      <option value="true">Male</option>
                      <option value="false">Female</option>
                    </select>
                </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact & Clinic Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Phone Number */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Phone Number</label>
                    <input 
                        type="text" 
                        name="contact_number" 
                        value={formData.contact_number || ""} 
                        onChange={handleChange} 
                        className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 font-medium" 
                    />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                        City <span className="text-[10px] font-normal text-slate-400">(Locked)</span>
                    </label>
                    <input 
                        type="text" 
                        name="city" 
                        value={formData.address?.city || ""} 
                        disabled={true} 
                        className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none bg-slate-200 text-slate-500 cursor-not-allowed font-medium select-none" 
                    />
                </div>

                {/* Barangay */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                        Barangay <span className="text-[10px] font-normal text-slate-400">(Locked)</span>
                    </label>
                    <input 
                        type="text" 
                        name="barangay" 
                        value={formData.address?.barangay || ""} 
                        disabled={true} 
                        className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none bg-slate-200 text-slate-500 cursor-not-allowed font-medium select-none" 
                    />
                </div>

                {/* Province */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                        Province <span className="text-[10px] font-normal text-slate-400">(Locked)</span>
                    </label>
                    <input 
                        type="text" 
                        name="province" 
                        value={formData.address?.province || ""} 
                        disabled={true} 
                        className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none bg-slate-200 text-slate-500 cursor-not-allowed font-medium select-none" 
                    />
                </div>
            </div>
        </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex justify-end gap-3 rounded-b-3xl">
            <button onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50">
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function DoctorProfile() {
  const { setUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState<UserProfile>({
    fname: "", mname: "", lname: "", sex: null, dob: "", contact_number: "", email: "", picture: "", 
    is_doctor_approved: false, bio: "", consultation_fee: 0, status: "available",
    address: { province: "", city: "", barangay: "" },
  });

  const [doctorData, setDoctorData] = useState<DoctorData | null>(null);
  const [picture, setPicture] = useState<string>("/assets/react.svg");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingPic, setUploadingPic] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const user = await getUserProfile();
        setFormData(user);
        setPicture(user.picture || "/assets/react.svg");

        try {
            const docRes = await api.get('/doctors/profile/me');
            setDoctorData(docRes.data);
            setFormData(prev => ({ 
                ...prev, 
                is_doctor_approved: docRes.data.is_doctor_approved,
                consultation_fee: docRes.data.consultation_fee, 
                bio: docRes.data.bio,
                status: docRes.data.status
            }));
        } catch (e) { console.error("Could not load doctor data", e); }

      } catch (err) { console.error("Error fetching profile:", err); } 
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (["province", "city", "barangay"].includes(name)) {
      setFormData(prev => ({...prev, address: { ...prev.address, [name]: value }}));
      return;
    }
    if (name === "sex") {
      setFormData((prev) => ({...prev, sex: value === "true" ? true : value === "false" ? false : null}));
    } else if (name === "consultation_fee") {
      // Keep as a number so 0 is preserved; empty field clears it instead of sending ""
      setFormData((prev) => ({ ...prev, consultation_fee: value === "" ? undefined : Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update User Table
      const updatedUser = await updateUserProfile(formData);
      setUser(updatedUser);

      // 2. Update Doctor Table
      // Send null (not undefined/"") when the field is blank so axios keeps the key
      // and the backend can distinguish "leave unchanged" from a real value like 0.
      await api.put('/doctors/profile/me', {
          consultation_fee: formData.consultation_fee ?? null,
          bio: formData.bio,
          status: formData.status
      });

      setIsEditModalOpen(false);
      // Reload to reflect
      const docRes = await api.get('/doctors/profile/me');
      setDoctorData(docRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleUploadPicture(file);
  };

  const handleUploadPicture = async (file: File) => {
    setUploadingPic(true);
    try {
      const previewURL = URL.createObjectURL(file);
      setPicture(previewURL); 
      const updatedUser = await updateProfilePicture(file);
      const newPicture = updatedUser.picture ? `${updatedUser.picture}?t=${Date.now()}` : "/assets/react.svg";
      setPicture(newPicture);
      setFormData(prev => ({ ...prev, picture: newPicture }));
      setUser(prev => ({ ...prev!, picture: newPicture }));
    } catch (err) { console.error(err); } 
    finally { setUploadingPic(false); }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = () => {
    return `${formData.fname.charAt(0)}${formData.lname.charAt(0)}`.toUpperCase();
  };

  // --- NEW: OCR & SPECIALIZATION LOGIC ---
  const [verifyingLicense, setVerifyingLicense] = useState(false);
  const [requestingSpec, setRequestingSpec] = useState(false);
  const [availableSpecs, setAvailableSpecs] = useState<any[]>([]);
  const [selectedSpecId, setSelectedSpecId] = useState<number | string>("");
  const [specDocUrl, setSpecDocUrl] = useState("");
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const specsRes = await api.get('/specializations');
        setAvailableSpecs(specsRes.data);
        
        if (doctorData?.doctor_id) {
          const reqsRes = await api.get('/doctors/specializations/requests/me');
          setMyRequests(reqsRes.data);
        }
      } catch (e) { console.error("Metadata fetch error", e); }
    };
    if (doctorData) fetchMetadata();
  }, [doctorData]);

  const handleLicenseOCR = async (file: File) => {
    setVerifyingLicense(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post('/doctors/license-ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.license_number) {
        setFormData(prev => ({ ...prev, license_number: res.data.license_number }));
        // Also update doctor data for immediate feedback
        setDoctorData(prev => prev ? { ...prev, license_number: res.data.license_number } : null);
        alert(`Extracted License: ${res.data.license_number}. Please save changes.`);
      }
    } catch (e) { 
      console.error("OCR Error", e);
      alert("Verification failed. Please ensure the image is clear.");
    } finally {
      setVerifyingLicense(false);
    }
  };

  const handleSpecRequest = async () => {
    if (!selectedSpecId || !specDocUrl) return;
    setRequestingSpec(true);
    try {
      await api.post('/doctors/specializations/request', {
        specialization_id: Number(selectedSpecId),
        document_url: specDocUrl
      });
      alert("Specialization request submitted for approval.");
      setSelectedSpecId("");
      setSpecDocUrl("");
      // Refresh requests
      const reqsRes = await api.get('/doctors/specializations/requests/me');
      setMyRequests(reqsRes.data);
    } catch (e) { console.error("Request error", e); }
    finally { setRequestingSpec(false); }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <Navbar/>

      {/* --- HERO --- */}
      <div className="bg-white shadow-sm pb-4 relative z-0">
        <div className="h-40 md:h-60 w-full bg-gradient-to-r from-blue-700 to-[#2dc7f8] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-16 sm:-mt-20 flex flex-col items-center sm:flex-row sm:items-end sm:space-x-6">
                
                <div className="relative group">
                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full ring-4 ring-white bg-white shadow-lg overflow-hidden relative z-10">
                        <img 
                            src={picture} 
                            className={`h-full w-full object-cover transition-opacity ${uploadingPic ? 'opacity-50' : ''}`}
                            alt="Profile"
                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${getInitials()}&background=0d9488&color=ffffff&size=256`; }}
                        />
                        {uploadingPic && <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-teal-600 border-t-transparent"></div></div>}
                    </div>
                    <label className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 bg-slate-100 p-2.5 rounded-full shadow-md border border-white cursor-pointer hover:bg-teal-50 hover:text-teal-600 transition-all hover:scale-110 active:scale-95">
                        <Camera className="w-5 h-5 text-slate-600" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                </div>

                <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 leading-tight">Dr. {formData.fname} {formData.lname}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-3 mt-1 text-slate-500 font-medium">
                                <span className="flex items-center gap-1 text-slate-600 font-medium">
                                    <Stethoscope className="w-4 h-4 text-teal-500" /> 
                                    {doctorData?.specialization 
                                        ? doctorData.specialization.replace(/[\[\]"]/g, '').replace(/,/g, ', ') 
                                        : "Medical Specialist"}
                                </span>
                                
                                {formData.is_doctor_approved ? (
                                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-xs font-bold border border-emerald-200">
                                        <CheckCircle2 className="w-4 h-4" /> Verified
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200">
                                        <Clock className="w-3 h-3" /> Pending Approval
                                    </span>
                                )}

                                <div className="flex items-center gap-1.5 ml-1 text-sm font-bold text-slate-700">
                                    <Star className="w-4 h-4 text-orange-400 fill-current" /> 
                                    {doctorData?.average_rating ? doctorData.average_rating.toFixed(1) : "0.0"} 
                                    <span className="font-normal text-slate-500 ml-1">
                                        ({doctorData?.total_reviews || 0} Reviews)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button onClick={() => setIsEditModalOpen(true)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm flex items-center justify-center gap-2 text-sm">
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- GRID --- */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT */}
        <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
                
                {/* Intro */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 text-lg">About</h3>
                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex items-center gap-3">
                            <Award className="w-5 h-5 text-slate-400 shrink-0" />
                            <span>{doctorData?.years_of_experience ? `${doctorData.years_of_experience}+ Years Experience` : "Experience not listed"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CalendarRange className="w-5 h-5 text-slate-400 shrink-0" />
                            {/* UPDATED: Using calculateAge here */}
                            <div className="flex flex-col">
                                <span>Born <strong>{formatDate(formData.dob)}</strong></span>
                                {calculateAge(formData.dob) !== null && (
                                    <span className="text-slate-400 text-xs">
                                        {calculateAge(formData.dob)} years old
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="line-clamp-2">{formData.address?.city || "No city"}, {formData.address?.province || "Philippines"}</span>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 text-lg">Contact Info</h3>
                    <div className="space-y-4">
                        <div className="group">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1"><Mail className="w-3 h-3 group-hover:text-blue-500 transition" /> Email</div>
                            <p className="text-slate-700 font-medium truncate bg-slate-50 p-2 rounded-lg">{formData.email}</p>
                        </div>
                        <div className="group">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1"><Phone className="w-3 h-3 group-hover:text-blue-500 transition" /> Clinic Phone</div>
                            <p className="text-slate-700 font-medium bg-slate-50 p-2 rounded-lg">{formData.contact_number || "Not set"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 space-y-6">

            {/* NEW BIO CARD */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-500" /> Professional Biography
                </h3>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {formData.bio || (
                        <span className="text-slate-400 italic">No biography provided yet. Click "Edit Profile" to add your professional background.</span>
                    )}
                </div>
            </div>
            
            {/* CREDENTIALS CARD */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-teal-50 to-white p-5 border-b border-teal-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
                            <Award className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Credentials & Licensing</h3>
                    </div>
                    
                    {formData.is_doctor_approved ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Verification Pending
                        </span>
                    )}
                </div>
                
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Medical License Number</p>
                            <div className="flex items-center gap-2">
                                <FileBadge className="w-5 h-5 text-teal-600" />
                                <p className="text-xl font-mono font-bold text-slate-800 tracking-wide">
                                    {doctorData?.license_number || "PENDING"}
                                </p>
                            </div>
                        </div>
                        {!formData.is_doctor_approved && (
                            <div className="mt-3">
                                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-teal-700 transition shadow-sm">
                                    {verifyingLicense ? <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" /> : <Sparkles className="w-3 h-3" />}
                                    {verifyingLicense ? "Processing..." : "Verify with Photo (AI)"}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleLicenseOCR(e.target.files[0])} />
                                </label>
                            </div>
                        )}
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Primary Specialization</p>
                        <p className="text-lg font-bold text-slate-700 mb-2">
                            {doctorData?.specialization.replace(/[\[\]"]/g, "") || "General Practice"}
                        </p>
                        <button 
                            onClick={() => document.getElementById('spec-request-form')?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1"
                        >
                            <Plus className="w-3 h-3" /> Add Specialization
                        </button>
                    </div>
                    
                    {/* CONSULTATION FEE DISPLAY */}
                    <div className="sm:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                <Banknote className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800">Consultation Fee</p>
                                <p className="text-xs text-slate-500">Standard rate per visit</p>
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                            ₱ {doctorData?.consultation_fee ?? formData.consultation_fee ?? 0}
                        </p>
                    </div>
                </div>
            </div>

            {/* Clinic Address Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" /> Clinic / Practice Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold uppercase">Barangay</p>
                        <p className="font-medium text-slate-700 text-lg">{formData.address?.barangay || "-"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold uppercase">City</p>
                        <p className="font-medium text-slate-700 text-lg">{formData.address?.city || "-"}</p>
                    </div>
                    </div>
                </div>

                {/* SPECIALIZATION REQUESTS */}
            <div id="spec-request-form" className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-500" /> Additional Specializations
                </h3>
                
                <div className="space-y-6">
                    {/* Active Requests */}
                    {myRequests.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-400 uppercase">My Requests</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {myRequests.map(req => (
                                    <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{req.specialization_name}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                req.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {req.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <a href={req.document_url} target="_blank" className="p-2 text-slate-400 hover:text-blue-600 transition">
                                            <FileText className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Request Form */}
                    <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200">
                        <p className="font-bold text-slate-800 mb-4">Request New Qualification</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Specialization</label>
                                <select 
                                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-medium"
                                    value={selectedSpecId}
                                    onChange={(e) => setSelectedSpecId(e.target.value)}
                                >
                                    <option value="">Select Specialization...</option>
                                    {availableSpecs.map(s => (
                                        <option key={s.specialization_id} value={s.specialization_id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500">Proof URL (Certificate)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="Cloudinary/Drive link..."
                                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                                        value={specDocUrl}
                                        onChange={(e) => setSpecDocUrl(e.target.value)}
                                    />
                                    <button 
                                        disabled={!selectedSpecId || !specDocUrl || requestingSpec}
                                        onClick={handleSpecRequest}
                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 text-sm flex items-center gap-2"
                                    >
                                        {requestingSpec ? '...' : <Upload className="w-4 h-4" />}
                                        Submit
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-[11px] text-slate-500 leading-relaxed italic">
                            * Administrators will review your certification before it appears on your public profile.
                        </p>
                    </div>
                </div>
            </div>

            {/* REVIEWS SECTION */}
            {doctorData?.doctor_id && (
                <div id="reviews" className="mt-8">
                    <DoctorReviews 
                        doctorId={doctorData.doctor_id} 
                    />
                </div>
            )}
        </div>
      </main>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={formData}
        handleChange={handleChange}
        handleSave={handleSave}
        saving={saving}
      />
    </div>
  );
}