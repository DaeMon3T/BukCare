import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
} from "@/services/users/UsersAPI";
import api from "@/services/api";
import { 
  CalendarRange, 
  MapPin, 
  User, 
  Heart, 
  Activity, 
  Camera, 
  Mail, 
  Phone, 
  Edit2,
  ShieldCheck
} from "lucide-react";

interface UserProfile {
    id?: number;
    fname: string;
    mname?: string;
    lname: string;
    sex?: boolean | null;
    dob?: string;
    contact_number?: string;
    email: string;
    picture?: string;
    address?: {
        province?: string;
        city?: string;
        barangay?: string;
    };
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
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSave: () => Promise<void>;
  saving: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scale-100 transform transition-all">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
              <p className="text-slate-500 text-sm">Update your personal details</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-8">
          {/* Personal Info Group */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">First Name</label>
                    <input type="text" name="fname" value={formData.fname} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Last Name</label>
                    <input type="text" name="lname" value={formData.lname} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Middle Name</label>
                    <input type="text" name="mname" value={formData.mname || ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 transition-all font-medium" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 ml-1">Gender</label>
                    <select 
                        name="sex" 
                        value={formData.sex === null ? "" : String(formData.sex)} 
                        onChange={handleChange} 
                        className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 transition-all font-medium"
                    >
                        <option value="">Select...</option>
                        <option value="true">Male</option>
                        <option value="false">Female</option>
                    </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 ml-1">Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob || ""} onChange={handleChange} className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 transition-all font-medium" />
                </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Contact Group */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact & Address
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
                        className="w-full p-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50/50 transition-all font-medium" 
                        placeholder="09..." 
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

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex justify-end gap-3 rounded-b-3xl">
            <button onClick={onClose} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:shadow-none">
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN PROFILE PAGE ---
export default function Profile() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState<UserProfile>({
    fname: "", mname: "", lname: "", sex: null, dob: "", contact_number: "", email: "", picture: "",
    address: { province: "", city: "", barangay: "" },
  });

  const [medicalProfile, setMedicalProfile] = useState<any>(null);
  const [picture, setPicture] = useState<string>("/assets/react.svg");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingPic, setUploadingPic] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = await getUserProfile();
        setFormData(user);
        setPicture(user.picture || "/assets/react.svg");

        try {
            const medRes = await api.get('/medical-profile/me');
            setMedicalProfile(medRes.data);
        } catch (e) {
            console.error("Medical profile load error", e);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (["province", "city", "barangay"].includes(name)) {
        setFormData(prev => ({...prev, address: { ...prev.address, [name]: value }}));
        return;
        }

        if (name === "sex") {
        let newSexValue: boolean | null = null;
        
        if (value === "true") newSexValue = true;
        if (value === "false") newSexValue = false;

        setFormData((prev) => ({ ...prev, sex: newSexValue }));
        } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await updateUserProfile(formData);
      setUser(updatedUser);
      setIsEditModalOpen(false);
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
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPic(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
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

      {/* --- HERO SECTION --- */}
      <div className="bg-white shadow-sm pb-4 relative z-0">
        {/* Cover Photo */}
        <div className="h-40 md:h-60 w-full bg-gradient-to-r from-blue-700 to-[#2dc7f8] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10"></div>
        </div>

        {/* Profile Header */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative -mt-16 sm:-mt-20 flex flex-col items-center sm:flex-row sm:items-end sm:space-x-6">
                
                {/* Avatar */}
                <div className="relative group">
                    <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full ring-4 ring-white bg-white shadow-lg overflow-hidden relative z-10">
                        <img 
                            src={picture} 
                            className={`h-full w-full object-cover transition-opacity ${uploadingPic ? 'opacity-50' : ''}`}
                            alt="Profile"
                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${getInitials()}&background=4f46e5&color=ffffff&size=256`; }}
                        />
                        {uploadingPic && <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div></div>}
                    </div>
                    {/* Camera Button */}
                    <label className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-20 bg-slate-100 p-2.5 rounded-full shadow-md border border-white cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-all hover:scale-110 active:scale-95">
                        <Camera className="w-5 h-5 text-slate-600" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </label>
                </div>

                {/* Name & Actions */}
                <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{formData.fname} {formData.lname}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-slate-500 font-medium">
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                                {/* --- UPDATED ID DISPLAY HERE --- */}
                                <span className="text-sm">Patient ID: 20260{formData.id}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <button 
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition shadow-sm flex items-center justify-center gap-2 text-sm"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                            <button 
                                onClick={() => navigate('/patient/profile/edit')}
                                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 text-sm"
                            >
                                <Heart className="w-4 h-4 fill-current" /> Medical Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- MAIN GRID LAYOUT --- */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Sticky on Desktop) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
                
                {/* Intro Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 text-lg">Intro</h3>
                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex items-center gap-3">
                            <CalendarRange className="w-5 h-5 text-slate-400 shrink-0" />
                            <span>Born <strong>{formatDate(formData.dob)}</strong></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-slate-400 shrink-0" />
                            <span>{formData.sex === true ? 'Male' : formData.sex === false ? 'Female' : 'Not specified'} ({calculateAge(formData.dob)} years old)</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="line-clamp-2">{formData.address?.city || "City not set"}, {formData.address?.province || "Philippines"}</span>
                        </div>
                    </div>
                </div>

                {/* Contact Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 text-lg">Contact Info</h3>
                    <div className="space-y-4">
                        <div className="group">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                <Mail className="w-3 h-3 group-hover:text-blue-500 transition" /> Email
                            </div>
                            <p className="text-slate-700 font-medium truncate bg-slate-50 p-2 rounded-lg border border-transparent group-hover:border-slate-200 transition">{formData.email}</p>
                        </div>
                        <div className="group">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                <Phone className="w-3 h-3 group-hover:text-blue-500 transition" /> Phone
                            </div>
                            <p className="text-slate-700 font-medium bg-slate-50 p-2 rounded-lg border border-transparent group-hover:border-slate-200 transition">{formData.contact_number || "Not set"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN (Scrollable Content) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* MEDICAL SNAPSHOT CARD (Hero Card) */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 hover:shadow-md transition-shadow">
                <div className="bg-gradient-to-r from-rose-50 to-white p-5 border-b border-rose-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">Medical Snapshot</h3>
                    </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Blood Type</p>
                        <p className="text-3xl font-black text-slate-800">{medicalProfile?.blood_type || "--"}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Known Allergies</p>
                        <div className="flex flex-wrap gap-2">
                            {medicalProfile?.allergies ? (
                                medicalProfile.allergies.split(',').map((alg: string, i: number) => (
                                    <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 shadow-sm">
                                        {alg.trim()}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400 italic">No allergies listed</span>
                            )}
                        </div>
                    </div>
                    <div className="sm:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <p className="text-xs font-bold text-blue-400 uppercase mb-2 tracking-wider flex items-center gap-2">
                            <Phone className="w-3 h-3" /> Emergency Contact
                        </p>
                        {medicalProfile?.emergency_contact_name ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <p className="text-base font-bold text-slate-800">{medicalProfile.emergency_contact_name}</p>
                                <p className="text-sm font-mono font-medium text-slate-600 bg-white px-3 py-1 rounded-lg border border-blue-100 inline-block w-fit">
                                    {medicalProfile.emergency_contact_number}
                                </p>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic">No emergency contact set</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Address Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500" /> Residential Address
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