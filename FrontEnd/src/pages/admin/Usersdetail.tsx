import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import usersAPI from "@/services/admin/Users";
import { FileText, Download, CheckCircle, AlertCircle } from "lucide-react";

interface DoctorProfile {
  prc_license_front?: string;
  prc_license_back?: string;
  prc_license_selfie?: string;
  license_number?: string;
  years_of_experience?: number;
  bio?: string;
  consultation_fee?: number;
  is_doctor_approved?: boolean;
}

interface User {
  id: number;
  fname: string;
  mname?: string;
  lname: string;
  email: string;
  contact_number?: string;
  role: "admin" | "patient" | "doctor" | "pending";
  is_active: boolean;
  is_profile_complete: boolean;
  picture?: string;
  created_at: string;
  last_login?: string;

  province?: string | null;
  city?: string | null;
  barangay?: string | null;

  doctor_profile?: DoctorProfile;
}

export default function UsersDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleApproveDoctor = async () => {
    if (!user) return;

    setApproving(true);
    setApprovalMessage(null);

    try {
      await usersAPI.approveDoctor(user.id);

      setApprovalMessage({
        type: "success",
        text: `${user.fname} ${user.lname} has been approved and can now use the system.`,
      });

      setUser({
        ...user,
        doctor_profile: {
          ...user.doctor_profile,
          is_doctor_approved: true,
        },
      });
    } catch (error: any) {
      setApprovalMessage({
        type: "error",
        text: error.message || "Failed to approve doctor. Please try again.",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleRejectDoctor = async () => {
    if (!user) return;

    const reason = prompt("Please provide a reason for rejection (optional):") || undefined;

    setRejecting(true);
    setApprovalMessage(null);

    try {
      await usersAPI.rejectDoctor(user.id, reason);

      setApprovalMessage({
        type: "success",
        text: `${user.fname} ${user.lname}'s doctor application has been rejected.`,
      });

      setUser({
        ...user,
        doctor_profile: {
          ...user.doctor_profile,
          is_doctor_approved: false,
        },
      });
    } catch (error: any) {
      setApprovalMessage({
        type: "error",
        text: error.message || "Failed to reject doctor. Please try again.",
      });
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading user details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">User not found.</p>
      </div>
    );
  }

  const isDoctor = user.role === "doctor" || user.role === "pending";

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <Navbar/>

      <main className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <button
            onClick={() => navigate(-1)}
            className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            ← Back
          </button>

          <h1 className="text-2xl font-bold mb-6 text-gray-800">User Details</h1>

          {/* USER PROFILE CARD */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 
                          text-white shadow-md mb-6 flex flex-col items-center space-y-3">

            <img
              src={user.picture}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover border-4 border-white"
            />

            <h2 className="text-xl font-bold">
              {user.fname} {user.mname || ""} {user.lname}
            </h2>

            <p className="text-blue-100">{user.email}</p>

            {user.contact_number && (
              <p className="text-blue-100">{user.contact_number}</p>
            )}

            <div className="flex gap-2 mt-2">
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                Role: {user.role}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* BASIC INFORMATION */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InputField label="First Name" value={user.fname} />
              <InputField label="Middle Name" value={user.mname || "—"} />
              <InputField label="Last Name" value={user.lname} />
              <InputField label="Email" value={user.email} />
              <InputField label="Contact Number" value={user.contact_number || "—"} />
              <InputField label="Province" value={user.province || "—"} />
              <InputField label="City" value={user.city || "—"} />
              <InputField label="Barangay" value={user.barangay || "—"} />
              <InputField label="Profile Complete" value={user.is_profile_complete ? "Yes" : "No"} />
              <InputField label="Join Date" value={new Date(user.created_at).toLocaleDateString()} />
              <InputField label="Last Login" value={user.last_login ? new Date(user.last_login).toLocaleString() : "—"} />
            </form>
          </div>

          {/* DOCTOR DOCUMENTS */}
          {isDoctor && user.doctor_profile && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Doctor Verification Documents</h3>

              {(user.doctor_profile.license_number || user.doctor_profile.years_of_experience) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  {user.doctor_profile.license_number && (
                    <InputField label="License Number" value={user.doctor_profile.license_number} />
                  )}
                  {user.doctor_profile.years_of_experience && (
                    <InputField label="Years of Experience" value={user.doctor_profile.years_of_experience.toString()} />
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DocumentCard
                  title="PRC License (Front)"
                  imageUrl={user.doctor_profile.prc_license_front}
                  onClick={() => setSelectedImage(user.doctor_profile?.prc_license_front || null)}
                />
                <DocumentCard
                  title="PRC License (Back)"
                  imageUrl={user.doctor_profile.prc_license_back}
                  onClick={() => setSelectedImage(user.doctor_profile?.prc_license_back || null)}
                />
                <DocumentCard
                  title="PRC License with Selfie"
                  imageUrl={user.doctor_profile.prc_license_selfie}
                  onClick={() => setSelectedImage(user.doctor_profile?.prc_license_selfie || null)}
                />
              </div>

              {/* APPROVAL MESSAGE */}
              {approvalMessage && (
                <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
                  approvalMessage.type === "success"
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}>
                  {approvalMessage.type === "success" ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  )}
                  <p className={approvalMessage.type === "success" ? "text-green-800" : "text-red-800"}>
                    {approvalMessage.text}
                  </p>
                </div>
              )}

              {/* APPROVE & REJECT BUTTONS */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={handleApproveDoctor}
                  disabled={approving || user.doctor_profile?.is_doctor_approved}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 
                             disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg 
                             transition flex items-center justify-center gap-2"
                >
                  {approving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Approving...
                    </>
                  ) : user.doctor_profile?.is_doctor_approved ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Already Approved
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Approve Doctor
                    </>
                  )}
                </button>

                <button
                  onClick={handleRejectDoctor}
                  disabled={rejecting || user.doctor_profile?.is_doctor_approved}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                             disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg
                             transition flex items-center justify-center gap-2"
                >
                  {rejecting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      Reject Doctor
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* IMAGE MODAL */}
          {selectedImage && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <img
                  src={selectedImage}
                  alt="Document"
                  className="max-w-full max-h-[90vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// INPUT FIELD COMPONENT
function InputField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-700"
      />
    </div>
  );
}

// DOCUMENT CARD COMPONENT
function DocumentCard({ title, imageUrl, onClick }: { title: string; imageUrl?: string | undefined; onClick: () => void }) {
  if (!imageUrl) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <h4 className="font-medium text-gray-700">{title}</h4>
        </div>
        <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-gray-400 text-sm">No document uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h4 className="font-medium text-gray-700">{title}</h4>
        </div>
        <a
          href={imageUrl}
          download
          className="p-1 hover:bg-gray-100 rounded transition"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-4 h-4 text-gray-600" />
        </a>
      </div>
      <div 
        className="aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition"
        onClick={onClick}
      >
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />  
      </div>
    </div>
  );
}
