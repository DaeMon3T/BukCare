import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import usersAPI from "@/services/admin/Users";
import { 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Stethoscope, 
  XCircle,
  Eye,
  Activity,
  BadgeCheck,
  Award,
  Trash2,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";

// --- TYPES ---
interface DoctorProfile {
  prc_license_front?: string;
  prc_license_back?: string;
  prc_license_selfie?: string;
  license_number?: string;
  years_of_experience?: number;
  bio?: string;
  consultation_fee?: number;
  is_doctor_approved?: boolean;
  specializations?: string[] | string;
}

interface StaffProfile {
  staff_id?: number;
  job_title?: string;
  proof_front?: string;
  proof_back?: string;
  proof_selfie?: string;
  is_staff_approved?: boolean;
}

interface User {
  id: number;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  contact_number?: string;
  role: "admin" | "patient" | "doctor" | "staff" | "pending";
  is_active: boolean;
  is_profile_complete: boolean;
  is_verified?: boolean; 
  picture?: string;
  created_at: string;
  last_login?: string;

  province?: string | null;
  city?: string | null;
  barangay?: string | null;

  doctor_profile?: DoctorProfile;
  staff_profile?: StaffProfile;
}

export default function UsersDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const apiUsers = await usersAPI.getAllUsers();
        const foundUser = apiUsers.find((u: User) => u.id === Number(id));

        if (foundUser) {
          const userWithDefaults: User = {
            ...foundUser,
            picture: foundUser.picture || "/assets/react.svg",
            doctor_profile: foundUser.doctor_profile || {},
          };
          setUser(userWithDefaults);
        }
      } catch (err) {
        console.error("Error loading user:", err);
        toast.error("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleApproveDoctor = async () => {
    if (!user) return;
    setApproving(true);
    const toastId = toast.loading("Processing approval...");

    try {
      await usersAPI.approveDoctor(user.id);
      toast.success(`${user.fname} has been approved as a Doctor!`, { id: toastId });
      setUser({
        ...user,
        role: "doctor", 
        doctor_profile: { ...user.doctor_profile, is_doctor_approved: true },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to approve doctor.", { id: toastId });
    } finally {
      setApproving(false);
    }
  };

  const handleRejectDoctor = async () => {
    if (!user) return;
    const reason = prompt("Please provide a reason for rejection (optional):");
    if (reason === null) return; 

    setRejecting(true);
    const toastId = toast.loading("Processing rejection...");

    try {
      await usersAPI.rejectDoctor(user.id, reason);
      toast.success("Application rejected.", { id: toastId });
      setUser({
        ...user,
        doctor_profile: { ...user.doctor_profile, is_doctor_approved: false },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to reject doctor.", { id: toastId });
    } finally {
      setRejecting(false);
    }
  };

  const handleApproveStaff = async () => {
    if (!user) return;
    setApproving(true);
    const toastId = toast.loading("Processing staff approval...");

    try {
      await usersAPI.approveStaff(user.id);
      toast.success(`${user.fname} has been approved as Staff!`, { id: toastId });
      setUser({
        ...user,
        role: "staff",
        staff_profile: { ...user.staff_profile, is_staff_approved: true },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to approve staff.", { id: toastId });
    } finally {
      setApproving(false);
    }
  };

  const handleRejectStaff = async () => {
    if (!user) return;
    const reason = prompt("Please provide a reason for rejection (optional):");
    if (reason === null) return;

    setRejecting(true);
    const toastId = toast.loading("Processing rejection...");

    try {
      await usersAPI.rejectStaff(user.id, reason);
      toast.success("Staff application rejected.", { id: toastId });
      setUser({
        ...user,
        staff_profile: { ...user.staff_profile, is_staff_approved: false },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to reject staff.", { id: toastId });
    } finally {
      setRejecting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    const confirmed = confirm(`Are you sure you want to permanently delete ${user.fname} ${user.lname}? This action cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    const toastId = toast.loading("Deleting user...");
    try {
      await usersAPI.deleteUser(user.id);
      toast.success("User deleted successfully.", { id: toastId });
      navigate("/admin/users");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user.", { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  // --- HELPERS ---
  const getInitials = () => {
    if (!user) return "U";
    return `${user.fname.charAt(0)}${user.lname.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  // Helper to parse specializations safely
  const getSpecializations = (): string[] => {
    if (!user?.doctor_profile?.specializations) return [];
    
    const specs = user.doctor_profile.specializations;
    
    if (Array.isArray(specs)) return specs;
    if (typeof specs === 'string') {
        try {
            if (specs.startsWith('[')) {
                return JSON.parse(specs);
            }
            return [specs];
        } catch {
            return [specs];
        }
    }
    return [];
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div></div>;

  if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-500">User not found.</p></div>;

  // Determine what kind of pending application this is
  const isPendingStaff = user.role === "pending" && !!user.staff_profile;
  const isPendingDoctor = user.role === "pending" && !user.staff_profile;
  const isApprovedDoctor = user.role === "doctor";
  const isApprovedStaff = user.role === "staff";
  const isDoctorApp = isPendingDoctor || isApprovedDoctor;
  const isStaffApp = isPendingStaff || isApprovedStaff;
  const specializations = getSpecializations();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <Navbar/>

      {/* --- HERO SECTION --- */}
      <div className="bg-white shadow-sm pb-4 relative z-0">
        {/* Back Button Overlay */}
        <button 
            onClick={() => navigate(-1)} 
            className="absolute top-4 left-4 z-20 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>

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
                            src={user.picture} 
                            className="h-full w-full object-cover"
                            alt="Profile"
                            onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${getInitials()}&background=4f46e5&color=ffffff&size=256`; }}
                        />
                    </div>
                    <div className={`absolute bottom-2 right-2 z-20 p-2 rounded-full border-2 border-white ${user.is_active ? "bg-emerald-500" : "bg-slate-400"}`} title={user.is_active ? "Active" : "Inactive"}></div>
                </div>

                {/* Name & Actions */}
                <div className="mt-4 sm:mt-0 flex-1 text-center sm:text-left pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 leading-tight">{user.fname} {user.mname} {user.lname}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-slate-500 font-medium">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide border ${
                                    user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    user.role === 'doctor' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    user.role === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                    {user.role}
                                </span>
                                <span className="text-sm">• ID: #{user.id}</span>
                            </div>
                        </div>

                        {/* DOCTOR/STAFF ADMIN ACTIONS */}
                        {isPendingDoctor && (
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={handleApproveDoctor}
                                    disabled={approving}
                                    className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    {approving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                                    Approve Doctor
                                </button>
                                <button 
                                    onClick={handleRejectDoctor}
                                    disabled={rejecting}
                                    className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        )}
                        {isApprovedDoctor && (
                            <div className="flex items-center gap-3">
                                <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl font-bold flex items-center gap-2 text-sm">
                                    <BadgeCheck className="w-5 h-5 fill-emerald-200" /> Doctor Approved
                                </div>
                                <button onClick={handleDeleteUser} disabled={deleting} className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition shadow-sm flex items-center gap-2 text-sm disabled:opacity-50">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        )}
                        {isPendingStaff && (
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={handleApproveStaff}
                                    disabled={approving}
                                    className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md shadow-emerald-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    {approving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <CheckCircle2 className="w-4 h-4" />}
                                    Approve Staff
                                </button>
                                <button 
                                    onClick={handleRejectStaff}
                                    disabled={rejecting}
                                    className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        )}
                        {isApprovedStaff && (
                            <div className="flex items-center gap-3">
                                <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl font-bold flex items-center gap-2 text-sm">
                                    <BadgeCheck className="w-5 h-5 fill-emerald-200" /> Staff Approved
                                </div>
                                <button onClick={handleDeleteUser} disabled={deleting} className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition shadow-sm flex items-center gap-2 text-sm disabled:opacity-50">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        )}
                        {!isDoctorApp && !isStaffApp && user.role !== "admin" && (
                            <button onClick={handleDeleteUser} disabled={deleting} className="px-5 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition shadow-sm flex items-center gap-2 text-sm disabled:opacity-50">
                                <Trash2 className="w-4 h-4" /> Delete Account
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- MAIN GRID LAYOUT --- */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Sticky) */}
        <div className="lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
                
                {/* Intro Card */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                    <h3 className="font-bold text-slate-900 mb-4 text-lg">System Info</h3>
                    <div className="space-y-4 text-sm text-slate-600">
                        <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
                            <span>Joined <strong>{formatDate(user.created_at)}</strong></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-slate-400 shrink-0" />
                            <span>Last login: <strong>{user.last_login ? formatDate(user.last_login) : "Never"}</strong></span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                            <span className="line-clamp-2">{user.city || "No City"}, {user.province || "No Province"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {user.is_profile_complete ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />}
                            <span>Profile {user.is_profile_complete ? "Complete" : "Incomplete"}</span>
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
                            <p className="text-slate-700 font-medium truncate bg-slate-50 p-2 rounded-lg border border-transparent group-hover:border-slate-200 transition">{user.email}</p>
                        </div>
                        <div className="group">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                                <Phone className="w-3 h-3 group-hover:text-blue-500 transition" /> Phone
                            </div>
                            <p className="text-slate-700 font-medium bg-slate-50 p-2 rounded-lg border border-transparent group-hover:border-slate-200 transition">{user.contact_number || "Not set"}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN (Content) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* DOCTOR CREDENTIALS (If Doctor) */}
            {isDoctorApp && user.doctor_profile && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-blue-500" /> Professional Credentials
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">License Number</p>
                                <p className="text-xl font-mono font-bold text-slate-800">{user.doctor_profile.license_number || "—"}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Years Experience</p>
                                <p className="text-xl font-bold text-slate-800">{user.doctor_profile.years_of_experience || "0"} Years</p>
                            </div>

                            {/* ✅ SPECIALIZATIONS SECTION */}
                            <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5" /> Specializations
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {specializations.length > 0 ? (
                                        specializations.map((spec, index) => (
                                            <span 
                                                key={index} 
                                                className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-bold shadow-sm"
                                            >
                                                {spec}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-400 italic">No specializations listed</span>
                                    )}
                                </div>
                            </div>

                            {user.doctor_profile.bio && (
                                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Professional Bio</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">{user.doctor_profile.bio}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Verification Documents */}
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-500" /> Verification Documents
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <DocumentCard
                                title="License (Front)"
                                imageUrl={user.doctor_profile.prc_license_front}
                                onClick={() => setSelectedImage(user.doctor_profile?.prc_license_front || null)}
                            />
                            <DocumentCard
                                title="License (Back)"
                                imageUrl={user.doctor_profile.prc_license_back}
                                onClick={() => setSelectedImage(user.doctor_profile?.prc_license_back || null)}
                            />
                            <DocumentCard
                                title="Selfie with ID"
                                imageUrl={user.doctor_profile.prc_license_selfie}
                                onClick={() => setSelectedImage(user.doctor_profile?.prc_license_selfie || null)}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* STAFF CREDENTIALS (If Staff) */}
            {isStaffApp && user.staff_profile && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                        <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-teal-500" /> Staff Credentials
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Job Title</p>
                                <p className="text-xl font-bold text-slate-800">{user.staff_profile.job_title || "—"}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Approval Status</p>
                                <p className={`text-xl font-bold ${user.staff_profile.is_staff_approved ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {user.staff_profile.is_staff_approved ? 'Approved' : 'Pending'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Staff Verification Documents */}
                    {(user.staff_profile.proof_front || user.staff_profile.proof_back || user.staff_profile.proof_selfie) && (
                        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-500" /> Verification Documents
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <DocumentCard
                                    title="ID (Front)"
                                    imageUrl={user.staff_profile.proof_front}
                                    onClick={() => setSelectedImage(user.staff_profile?.proof_front || null)}
                                />
                                <DocumentCard
                                    title="ID (Back)"
                                    imageUrl={user.staff_profile.proof_back}
                                    onClick={() => setSelectedImage(user.staff_profile?.proof_back || null)}
                                />
                                <DocumentCard
                                    title="Selfie with ID"
                                    imageUrl={user.staff_profile.proof_selfie}
                                    onClick={() => setSelectedImage(user.staff_profile?.proof_selfie || null)}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Address Card (Always Visible) */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rose-500" /> Residential Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold uppercase">Barangay</p>
                        <p className="font-medium text-slate-700 text-lg">{user.barangay || "-"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold uppercase">City</p>
                        <p className="font-medium text-slate-700 text-lg">{user.city || "-"}</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-50">
                        <p className="text-xs text-slate-400 font-bold uppercase">Province</p>
                        <p className="font-medium text-slate-700 text-lg">{user.province || "-"}</p>
                    </div>
                </div>
            </div>

        </div>
      </main>

      {/* IMAGE MODAL */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] bg-transparent flex justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition z-10 backdrop-blur-md"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Document"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

    </div>
  );
}

// --- DOCUMENT CARD COMPONENT ---
function DocumentCard({ 
  title, 
  imageUrl, 
  onClick 
}: { 
  title: string; 
  imageUrl?: string | null | undefined; 
  onClick: () => void 
}) {
  if (!imageUrl) {
    return (
      <div className="border border-slate-200 border-dashed rounded-2xl p-6 bg-slate-50/50 flex flex-col items-center justify-center text-center h-48">
        <FileText className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-slate-400 text-sm font-medium">Not Uploaded</p>
        <p className="text-slate-300 text-xs">{title}</p>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-200 bg-white h-48">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-all flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
        <button 
            onClick={onClick}
            className="px-4 py-2 bg-white/90 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-2 hover:bg-white transition"
        >
            <Eye className="w-3 h-3" /> View
        </button>
        <a
          href={imageUrl}
          download
          className="px-4 py-2 bg-white/90 rounded-lg text-xs font-bold text-blue-600 flex items-center gap-2 hover:bg-white transition"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-3 h-3" /> Download
        </a>
      </div>
      <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-md p-2 border-t border-slate-100">
        <p className="text-xs font-bold text-slate-600 text-center">{title}</p>
      </div>
    </div>
  );
}