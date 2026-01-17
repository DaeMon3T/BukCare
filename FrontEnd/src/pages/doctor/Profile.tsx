import { useEffect, useState, type ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
} from "@/services/users/UsersAPI";
import api from "@/services/api"; 
import { 
  CalendarRange, MapPin, User, Camera, Mail, Phone, Edit2, 
  Stethoscope, Award, FileBadge, CheckCircle2, Clock, AlertCircle, Banknote, FileText 
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
}

interface DoctorData {
    license_number: string;
    years_of_experience: number;
    specialization: string;
    is_doctor_approved: boolean;
    consultation_fee: number;
    bio: string;
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
                            value={formData.consultation_fee || ""} 
                            onChange={handleChange} 
                            className="w-full pl-8 p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-slate-50/50 font-bold text-slate-700" 
                            placeholder="e.g. 500"
                        />
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
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Phone Number</label>
                    <input type="text" name="contact_number" value={formData.contact_number || ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">City</label>
                    <input type="text" name="city" value={formData.address?.city || ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Barangay</label>
                    <input type="text" name="barangay" value={formData.address?.barangay || ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Province</label>
                    <input type="text" name="province" value={formData.address?.province || ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50" />
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
    is_doctor_approved: false, bio: "", consultation_fee: 0,
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
                bio: docRes.data.bio 
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
      await api.put('/doctors/profile/me', {
          consultation_fee: formData.consultation_fee,
          bio: formData.bio
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
                                        <CheckCircle2 className="w-3 h-3" /> Authorized
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-xs font-bold border border-amber-200">
                                        <Clock className="w-3 h-3" /> Pending Approval
                                    </span>
                                )}
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
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Medical License Number</p>
                        <div className="flex items-center gap-2">
                            <FileBadge className="w-5 h-5 text-teal-600" />
                            <p className="text-xl font-mono font-bold text-slate-800 tracking-wide">
                                {doctorData?.license_number || "PENDING"}
                            </p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Primary Specialization</p>
                        <p className="text-lg font-bold text-slate-700">
                            {doctorData?.specialization || "General Practice"}
                        </p>
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
                            ₱ {formData.consultation_fee || doctorData?.consultation_fee || "500"}
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
                    <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-50">
                        <p className="text-xs text-slate-400 font-bold uppercase">Province</p>
                        <p className="font-medium text-slate-700 text-lg">{formData.address?.province || "-"}</p>
                    </div>
                </div>
            </div>

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